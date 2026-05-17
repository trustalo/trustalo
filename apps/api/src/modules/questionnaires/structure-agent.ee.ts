// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0
//
// EE FILE — governed by LICENSE_EE at the repo root. The two LLM-driven
// exports `mapXlsxStructure` and `mapDocxStructure` require a valid
// Trustalo Enterprise License token in TRUSTALO_LICENSE_KEY that
// includes the "ai" feature. Heuristic / cascade / lite-fallback
// utilities exported from `__test` are inert without those entry points
// and exist solely to power the parsing tests.

/**
 * Document-structure agent for questionnaire imports.
 *
 * Customer security/privacy questionnaires (CAIQ, SIG-Lite, vendor
 * templates, regulator forms, bespoke spreadsheets) are wildly
 * inconsistent:
 *
 *   • Cover sheets with form-style metadata (e.g. company name,
 *     service description, reviewer)
 *   • Instruction-only sheets we should ignore
 *   • Question tables with two answer columns per row (main + sub-q)
 *   • Question tables where a category column is merged across many
 *     rows so most rows look "category-less" to a row-by-row parser
 *   • Sub-questions inlined on the same row OR cascading down rows
 *   • Matrix sheets (entity labels as columns, questions as rows)
 *
 * Pure heuristics can't cover that without false positives. So we
 * let an LLM read each sheet (sample of rows + merged-cell map +
 * heuristic observations) and produce a structured `WorkbookMap`:
 * per-sheet `kind` plus the exact A1 cells where each question lives
 * and where its answer must be written. The map is stored on the
 * Questionnaire and re-used on export — the agent runs exactly once
 * per import.
 *
 * ## Robustness layers (each bounded by the per-sheet timeout)
 *
 *   1. Per-sheet parallelism — `Promise.allSettled` over sheets so
 *      a single bad sheet cannot kill the whole import.
 *   2. Heuristic pre-filter — `# OBSERVATIONS` block tells the model
 *      where the header row is and which rows look interrogative,
 *      so it doesn't have to derive that from scratch.
 *   3. Cascade — if attempt 1 returns invalid/non-conforming JSON we
 *      retry once with a simplified schema (no matrix / parentKey /
 *      contextLabels) and a sample trimmed to question-like rows.
 *   4. Lite-mode fallback — on timeout or repeated failure we run a
 *      flat one-question-per-row LLM call and synthesise a
 *      `question_table` `SheetMap` from the response. This
 *      guarantees a sheet that visibly contains questions is never
 *      reported with zero of them.
 */

import { z } from "zod";
import ExcelJS from "exceljs";
import { assertEnterpriseLicense } from "@trustalo/license";
import { resolveOrgAI } from "../../config/ai.js";
import { colIndex, colLetter, decodeCell, encodeCell } from "./a1.js";
import { safeCellText } from "./excel-cell.js";
import { extractSharedStrings, extractSheetCells, listSheets } from "./xlsx-rich-text.js";

// ─── Public schema (what the agent returns) ────────────────────────

/**
 * Schema uses `.optional()` so downstream TypeScript types remain
 * clean (`string | undefined`, not `string | null | undefined`).
 *
 * LLMs frequently emit `"field": null` for absent optional values —
 * which `.optional()` would reject. We handle that by running
 * `stripNulls()` on the raw JSON BEFORE Zod validation, so nulls
 * become absent keys and the schema sees a tidy object.
 */
const ContextLabelsSchema = z
  .object({
    domain: z.string().optional(),
    subDomain: z.string().optional(),
    controlId: z.string().optional(),
    evidence: z.string().optional(),
    /** Matrix-sheet column label — the entity / row that this
     *  particular cell question is asking about (e.g. a process
     *  name, system identifier, branch, or business unit). */
    column: z.string().optional(),
  })
  .catchall(z.string().optional());

const A1Ref = z.string().regex(/^[A-Z]+\d+$/, "expected A1-style cell ref like 'F12'");

/**
 * One question identified by the agent. Sub-questions are emitted as
 * top-level entries with `parentKey` pointing at their parent's
 * `key` — flattening keeps the LLM output simple while still letting
 * the parser/UI reconstruct the parent→child tree.
 */
const SheetQuestionSchema = z.object({
  /**
   * Stable identifier the agent invents for this question (e.g.
   * "1.1-main", "1.1-sub-a"). Used by `parentKey` to link sub-
   * questions. The DB never sees this — questions get DB cuids.
   */
  key: z.string().min(1).max(80),
  parentKey: z.string().min(1).max(80).optional(),
  /** A1 cell whose value is the question text. */
  questionCellA1: A1Ref,
  /** A1 cell where the answer must be written. */
  answerCellA1: A1Ref,
  /** Optional verbatim question text — saves us re-reading the cell. */
  questionText: z.string().optional(),
  /** Forwarded into Question.contextLabels. */
  contextLabels: ContextLabelsSchema.optional(),
});

const MetadataFactSchema = z.object({
  label: z.string(),
  /** A1 cell holding the answer/value (may be blank in the template). */
  answerCellA1: A1Ref,
  /** Pre-existing value we observed in that cell, if any. */
  value: z.string().optional(),
});

const SheetMapSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("instructions"),
    sheetName: z.string(),
    reason: z.string().optional(),
  }),
  z.object({
    kind: z.literal("metadata"),
    sheetName: z.string(),
    facts: z.array(MetadataFactSchema).default([]),
  }),
  z.object({
    kind: z.literal("question_table"),
    sheetName: z.string(),
    /** 0-based header row index (advisory; A1 refs are the source of truth). */
    headerRowIndex: z.number().int().min(0).optional(),
    questions: z.array(SheetQuestionSchema).default([]),
  }),
  z.object({
    kind: z.literal("matrix"),
    sheetName: z.string(),
    /**
     * Matrix sheets ask the same question across many entities. We
     * still emit one entry per (question × entity) cell — keeping the
     * "every question has its own answerCellA1" invariant uniform.
     */
    questions: z.array(SheetQuestionSchema).default([]),
  }),
]);

/**
 * Reduced schema used on retry when the strict shape returned invalid
 * JSON or failed validation. Drops `matrix` entirely (collapsed to
 * question_table by the prompt), and drops `parentKey`,
 * `contextLabels`, and `questionText` from each question. Output is
 * widened back into the regular `SheetMap` union by `parseSingleSheetJson`,
 * so downstream code never sees this shape.
 */
const SheetMapSimplifiedSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("instructions"),
    sheetName: z.string(),
    reason: z.string().optional(),
  }),
  z.object({
    kind: z.literal("metadata"),
    sheetName: z.string(),
    facts: z.array(MetadataFactSchema).default([]),
  }),
  z.object({
    kind: z.literal("question_table"),
    sheetName: z.string(),
    headerRowIndex: z.number().int().min(0).optional(),
    questions: z
      .array(
        z.object({
          key: z.string().min(1).max(80),
          questionCellA1: A1Ref,
          answerCellA1: A1Ref,
        }),
      )
      .default([]),
  }),
]);

export const WorkbookMapSchema = z.object({
  /** xlsx | docx — purely informational, kept for telemetry. */
  documentKind: z.enum(["xlsx", "docx"]),
  sheets: z.array(SheetMapSchema),
});

export type WorkbookMap = z.infer<typeof WorkbookMapSchema>;
export type SheetMap = z.infer<typeof SheetMapSchema>;
export type SheetQuestion = z.infer<typeof SheetQuestionSchema>;
export type MetadataFact = z.infer<typeof MetadataFactSchema>;

// ─── Public API ────────────────────────────────────────────────────

export class StructureAgentError extends Error {
  readonly code = "STRUCTURE_AGENT_FAILED";
  override readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

/**
 * Per-sheet progress event. The job runner forwards these into the
 * `progress.sheets[]` JSON column so the UI poll can show a tick or
 * spinner per sheet.
 */
export type SheetProgress =
  | { phase: "running"; sheetName: string }
  | {
      phase: "completed";
      sheetName: string;
      kind: SheetMap["kind"];
      questionCount: number;
      durationMs: number;
      /**
       * Which path produced the SheetMap:
       *   • "strict" — primary structure-agent prompt succeeded.
       *   • "strict-retry" — primary failed, simplified-schema retry
       *     succeeded.
       *   • "lite" — both strict paths failed, flat one-Q-per-row
       *     fallback produced the result. The UI may flag the sheet
       *     so a reviewer knows sub-questions / matrix context were
       *     not extracted.
       */
      mode: "strict" | "strict-retry" | "lite";
    }
  | { phase: "failed"; sheetName: string; reason: string; durationMs: number };

export interface MapXlsxInput {
  tenantId: string;
  buffer: Buffer;
  /** Optional callback invoked as each sheet starts and finishes. */
  onProgress?: (event: SheetProgress) => void;
}

export interface MapDocxInput {
  tenantId: string;
  /** Pre-extracted tables — see file-parser:extractDocxTables. */
  tables: Array<{ tableIndex: number; rows: string[][] }>;
  onProgress?: (event: SheetProgress) => void;
}

export interface MapResult {
  map: WorkbookMap;
  /** Sheets that produced a usable map. */
  succeededSheets: string[];
  /** Sheets we tried to map but the agent rejected; the import is "partial". */
  failedSheets: Array<{ sheetName: string; reason: string }>;
}

/**
 * Map an xlsx workbook by firing one LLM call per sheet in parallel.
 *
 * Behaviour:
 *   • Empty / unreadable sheets are skipped silently (returned in
 *     neither success nor failure list).
 *   • Per-sheet failures are recorded in `failedSheets` rather than
 *     thrown — the import becomes "partial" but the user keeps every
 *     sheet that did succeed.
 *   • Throws `StructureAgentError` only when ZERO sheets produced a
 *     usable map (typically: the AI provider is unavailable for the
 *     entire run, or the workbook has no readable content).
 */
export async function mapXlsxStructure(input: MapXlsxInput): Promise<MapResult> {
  await assertEnterpriseLicense("ai");
  const wb = new ExcelJS.Workbook();
  // ExcelJS ships a global `declare interface Buffer extends ArrayBuffer {}`
  // that shadows Node's Buffer in its `.load()` signature. The runtime
  // happily accepts a Node Buffer; the cast just silences the conflict.
  await wb.xlsx.load(input.buffer as unknown as ArrayBuffer);

  // Some workbooks store cell text inside namespace-prefixed XML
  // elements (`<x:t>`, `<d:t>`) that the standard parser silently
  // drops. Read the underlying XML once and build a
  // `name -> A1 -> text` map of cells we recover beyond what the
  // workbook reader produced. The map is empty for well-formed files
  // and on any parse error, in which case behaviour is unchanged.
  const richTextSalvage = await readRichTextSalvage(input.buffer);

  const sheetSamples = wb.worksheets
    .map((ws) => sampleXlsxSheet(extractRawSheet(ws), richTextSalvage.get(ws.name)))
    .filter((s): s is XlsxSheetSample => s !== null);

  if (sheetSamples.length === 0) {
    throw new StructureAgentError("Workbook has no readable sheets");
  }

  const ai = await resolveOrgAI(input.tenantId, "questionnaire_answering");

  return runPerSheet({
    documentKind: "xlsx",
    samples: sheetSamples,
    aiClient: ai.client,
    onProgress: input.onProgress,
  });
}

async function readRichTextSalvage(buffer: Buffer): Promise<Map<string, Map<string, string>>> {
  const salvage = new Map<string, Map<string, string>>();
  try {
    const sheets = await listSheets(buffer);
    if (sheets.length === 0) return salvage;
    const sharedStrings = await extractSharedStrings(buffer);
    for (const sheet of sheets) {
      const cells = await extractSheetCells(buffer, sheet.xmlPath, sharedStrings);
      if (cells.size > 0) salvage.set(sheet.name, cells);
    }
  } catch {
    // Best-effort: if anything goes wrong we just skip salvage.
  }
  return salvage;
}

/**
 * Map a docx's parsed tables. Each table is treated as a "sheet"
 * named `Table N` and runs through the same per-sheet parallel
 * pipeline as xlsx.
 */
export async function mapDocxStructure(input: MapDocxInput): Promise<MapResult> {
  if (input.tables.length === 0) {
    throw new StructureAgentError(
      "Document has no tables — paragraph-mode imports are not supported",
    );
  }

  const samples: DocxTableSample[] = input.tables.map((t) => ({
    name: `Table ${t.tableIndex}`,
    tableIndex: t.tableIndex,
    rows: t.rows,
    rowCount: t.rows.length,
  }));

  const ai = await resolveOrgAI(input.tenantId, "questionnaire_answering");

  return runPerSheet({
    documentKind: "docx",
    samples,
    aiClient: ai.client,
    onProgress: input.onProgress,
  });
}

// ─── Per-sheet orchestration ───────────────────────────────────────

export interface XlsxSheetSample {
  kind: "xlsx";
  name: string;
  /** First N rows as A1-keyed cells, e.g. {"A1":"Control No","B1":"…"}. */
  preview: Array<Record<string, string>>;
  /** Merged ranges in A1 form, e.g. ["B3:D3","B14:F22"]. */
  merges: string[];
  totalRows: number;
  totalCols: number;
}

export interface DocxTableSample {
  kind?: "docx";
  name: string;
  tableIndex: number;
  rows: string[][];
  rowCount: number;
}

export type SheetSample = XlsxSheetSample | DocxTableSample;

interface RunPerSheetInput {
  documentKind: "xlsx" | "docx";
  samples: SheetSample[];
  aiClient: { chat: (opts: any) => Promise<{ content: string }> };
  onProgress?: (event: SheetProgress) => void;
}

const PER_SHEET_TIMEOUT_MS = 120_000;

async function runPerSheet(input: RunPerSheetInput): Promise<MapResult> {
  const t0 = Date.now();
  const settled = await Promise.allSettled(
    input.samples.map(async (sample) => {
      input.onProgress?.({ phase: "running", sheetName: sample.name });
      const startedAt = Date.now();
      try {
        const { sheet, mode } = await mapSingleSheet({
          documentKind: input.documentKind,
          sample,
          aiClient: input.aiClient,
        });
        const durationMs = Date.now() - startedAt;
        const questionCount =
          sheet.kind === "question_table" || sheet.kind === "matrix" ? sheet.questions.length : 0;
        input.onProgress?.({
          phase: "completed",
          sheetName: sample.name,
          kind: sheet.kind,
          questionCount,
          durationMs,
          mode,
        });
        console.log(
          `[structure-agent] ✓ ${sample.name} (${sheet.kind}, ${questionCount} questions, mode=${mode}) in ${durationMs}ms`,
        );
        return { ok: true as const, sheet };
      } catch (err) {
        const durationMs = Date.now() - startedAt;
        const reason = err instanceof Error ? err.message : String(err);
        input.onProgress?.({
          phase: "failed",
          sheetName: sample.name,
          reason,
          durationMs,
        });
        console.warn(`[structure-agent] ✗ ${sample.name} failed in ${durationMs}ms: ${reason}`);
        return { ok: false as const, sheetName: sample.name, reason };
      }
    }),
  );

  const succeededSheets: string[] = [];
  const failedSheets: Array<{ sheetName: string; reason: string }> = [];
  const sheets: SheetMap[] = [];

  for (let i = 0; i < settled.length; i++) {
    const r = settled[i]!;
    const sample = input.samples[i]!;
    if (r.status === "rejected") {
      // `mapSingleSheet` already converts errors to {ok:false}; this
      // branch only fires if the whole task itself crashed.
      failedSheets.push({
        sheetName: sample.name,
        reason: r.reason instanceof Error ? r.reason.message : String(r.reason),
      });
      continue;
    }
    if (r.value.ok) {
      sheets.push(r.value.sheet);
      succeededSheets.push(sample.name);
    } else {
      failedSheets.push({ sheetName: r.value.sheetName, reason: r.value.reason });
    }
  }

  console.log(
    `[structure-agent] done in ${Date.now() - t0}ms — ${succeededSheets.length} ok, ${failedSheets.length} failed`,
  );

  if (sheets.length === 0) {
    throw new StructureAgentError(
      `Structure agent failed on every sheet (${failedSheets.length}/${input.samples.length}). ` +
        `First failure: ${failedSheets[0]?.reason ?? "unknown"}`,
    );
  }

  // Require at least one ANSWERABLE sheet — pure metadata/instructions
  // alone wouldn't make a useful questionnaire.
  const hasQuestions = sheets.some(
    (s) => (s.kind === "question_table" || s.kind === "matrix") && s.questions.length > 0,
  );
  if (!hasQuestions) {
    throw new StructureAgentError(
      "Structure agent did not identify any answerable questions in the document",
    );
  }

  return {
    map: { documentKind: input.documentKind, sheets },
    succeededSheets,
    failedSheets,
  };
}

// ─── Single-sheet LLM call (cascade) ───────────────────────────────

interface MapSingleSheetInput {
  documentKind: "xlsx" | "docx";
  sample: SheetSample;
  aiClient: AiChatClient;
}

interface MapSingleSheetOutcome {
  sheet: SheetMap;
  mode: "strict" | "strict-retry" | "lite";
}

type AiChatClient = {
  chat: (opts: {
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: "text" | "json";
  }) => Promise<{ content: string }>;
};

/**
 * Map one sheet using the strict prompt; if that fails with a
 * recoverable error (invalid JSON, schema mismatch) retry with the
 * simplified schema; if BOTH strict paths fail (or attempt 1 timed
 * out, which is non-recoverable at the same complexity), drop to
 * the lite-mode fallback so we still produce questions.
 *
 * Each LLM call is bounded by `PER_SHEET_TIMEOUT_MS` so a hung
 * upstream cannot exceed the per-sheet SLA. AI provider errors
 * propagate untouched (already sanitised by `wrapProviderError`);
 * JSON / schema problems become `StructureAgentError` only when
 * every attempt has failed.
 */
async function mapSingleSheet(input: MapSingleSheetInput): Promise<MapSingleSheetOutcome> {
  // ── Attempt 1: strict primary prompt ────────────────────────
  const strictResult = await tryStrictAttempt(input, /* simplified */ false);
  if (strictResult.kind === "ok") {
    return { sheet: strictResult.sheet, mode: "strict" };
  }
  if (strictResult.kind === "timeout") {
    // Hung calls don't get a same-prompt retry — the next attempt
    // is the lite path with a smaller, simpler request.
    return runLiteFallback(input);
  }

  // ── Attempt 2: simplified-schema retry ──────────────────────
  console.warn(
    `[structure-agent] ${input.sample.name}: strict attempt failed (${strictResult.reason}) — retrying with simplified schema`,
  );
  const retryResult = await tryStrictAttempt(input, /* simplified */ true);
  if (retryResult.kind === "ok") {
    return { sheet: retryResult.sheet, mode: "strict-retry" };
  }

  // ── Attempt 3: lite fallback ────────────────────────────────
  console.warn(
    `[structure-agent] ${input.sample.name}: simplified retry failed (${retryResult.reason}) — falling back to lite mode`,
  );
  return runLiteFallback(input);
}

type StrictAttemptResult =
  | { kind: "ok"; sheet: SheetMap }
  | { kind: "error"; reason: string }
  | { kind: "timeout"; reason: string };

async function tryStrictAttempt(
  input: MapSingleSheetInput,
  simplified: boolean,
): Promise<StrictAttemptResult> {
  const userPrompt = isXlsxSample(input.sample)
    ? buildXlsxSheetPrompt(input.sample, { simplified })
    : buildDocxTablePrompt(input.sample, { simplified });

  // Output budget: each question entry is ~80–120 tokens with full
  // context labels, ~50–70 tokens in simplified mode. Scale with
  // observed row count and cap to keep stragglers bounded.
  const estimatedRows = isXlsxSample(input.sample)
    ? input.sample.preview.length
    : input.sample.rows.length;
  const perRow = simplified ? 70 : 120;
  const maxTokens = Math.min(16_000, Math.max(simplified ? 4_000 : 6_000, estimatedRows * perRow));

  const systemPrompt = simplified ? SYSTEM_PROMPT_SIMPLIFIED : SYSTEM_PROMPT_SINGLE_SHEET;

  let completion: { content: string };
  try {
    completion = await withTimeout(
      input.aiClient.chat({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        maxTokens,
        temperature: 0,
        responseFormat: "json",
      }),
      PER_SHEET_TIMEOUT_MS,
      `Sheet "${input.sample.name}" mapping timed out after ${PER_SHEET_TIMEOUT_MS}ms`,
    );
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    if (reason.includes("timed out")) {
      return { kind: "timeout", reason };
    }
    // Provider errors (auth, rate limit) — re-throw so the runner
    // marks the sheet failed without falling through to lite, which
    // would make exactly the same upstream call.
    throw err;
  }

  try {
    const sheet = parseSingleSheetJson(completion.content, input.sample.name, {
      simplified,
    });
    return { kind: "ok", sheet };
  } catch (err) {
    return {
      kind: "error",
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

function isXlsxSample(s: SheetSample): s is XlsxSheetSample {
  return "preview" in s;
}

// ─── Sampling ──────────────────────────────────────────────────────

/**
 * Cap on non-empty rows fed to the agent per sheet. Real-world
 * questionnaires can have 300+ rows; 350 keeps a single sheet's
 * preview manageable while capturing complex questionnaires.
 */
const SAMPLE_ROWS = 350;
const SAMPLE_COL_CHARS = 250;

/**
 * Library-agnostic snapshot of a worksheet — produced once at the
 * ExcelJS boundary, consumed by the rest of the sampling/sheet-
 * mapping pipeline. Keeping this small interface in the middle
 * means downstream code is easy to unit-test without instantiating
 * a real workbook.
 */
interface XlsxRawSheet {
  name: string;
  /** Sparse map of `A1 → normalized cell text` for non-empty cells. */
  cells: Map<string, string>;
  /** Merged ranges in A1 form, e.g. `["B3:D3"]`. */
  merges: string[];
  /** Highest 1-based row index with any value. `0` for an empty sheet. */
  maxRow: number;
  /** Highest 1-based column index with any value. `0` for an empty sheet. */
  maxCol: number;
}

/** Collapse internal whitespace and trim — applied to every cell text. */
function normalizeCellText(raw: unknown): string {
  return String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract a sparse cell map + merge list from an ExcelJS worksheet.
 * `safeCellText` shields the iteration from the `MergeValue.toString`
 * crash on merged regions whose master cell is null — common in
 * vendor questionnaires that merge cells purely for visual layout.
 */
function extractRawSheet(ws: ExcelJS.Worksheet): XlsxRawSheet {
  const cells = new Map<string, string>();
  let maxRow = 0;
  let maxCol = 0;

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const text = normalizeCellText(safeCellText(cell));
      if (!text) return;
      cells.set(`${colLetter(colNumber - 1)}${rowNumber}`, text);
      if (rowNumber > maxRow) maxRow = rowNumber;
      if (colNumber > maxCol) maxCol = colNumber;
    });
  });

  // ExcelJS exposes merges as A1 range strings on `ws.model.merges`.
  // Defensive cast — older minor versions exposed this as an object
  // map, so accept both shapes.
  const rawMerges = (ws.model as { merges?: unknown }).merges;
  const merges: string[] = Array.isArray(rawMerges)
    ? rawMerges.map((m) => (typeof m === "string" ? m : String(m)))
    : rawMerges && typeof rawMerges === "object"
      ? Object.values(rawMerges as Record<string, unknown>).map((m) =>
          typeof m === "string" ? m : String((m as { range?: string })?.range ?? m),
        )
      : [];

  return { name: ws.name, cells, merges, maxRow, maxCol };
}

function sampleXlsxSheet(
  raw: XlsxRawSheet,
  richTextCells?: Map<string, string>,
): XlsxSheetSample | null {
  // If the rich-text salvage produced cells outside the declared
  // range (some producers ship a sheet dimension that doesn't cover
  // late additions), grow the range to include them so we don't
  // truncate the preview.
  let endRow = raw.maxRow;
  let endCol = raw.maxCol;
  if (richTextCells) {
    for (const addr of richTextCells.keys()) {
      const { r, c } = decodeCell(addr);
      if (r + 1 > endRow) endRow = r + 1;
      if (c + 1 > endCol) endCol = c + 1;
    }
  }
  if (endRow === 0 || endCol === 0) return null;

  const preview: Array<Record<string, string>> = [];
  for (let r = 0; r < endRow && preview.length < SAMPLE_ROWS; r++) {
    const row: Record<string, string> = {};
    let hasContent = false;
    for (let c = 0; c < endCol; c++) {
      const addr = encodeCell({ r, c });
      const v = readCellText(raw, addr, richTextCells);
      if (!v) continue;
      row[addr] = v.length > SAMPLE_COL_CHARS ? v.slice(0, SAMPLE_COL_CHARS) + "…" : v;
      hasContent = true;
    }
    if (hasContent) preview.push(row);
  }

  // Skip totally empty sheets — no point in spending an LLM call.
  if (preview.length === 0) return null;

  return {
    kind: "xlsx",
    name: raw.name,
    preview,
    merges: raw.merges,
    totalRows: endRow,
    totalCols: endCol,
  };
}

/**
 * Resolves a cell's text value, preferring whatever the workbook
 * reader already produced and falling back to the rich-text
 * salvage map for cells the reader returned blank.
 */
function readCellText(
  raw: XlsxRawSheet,
  addr: string,
  richTextCells: Map<string, string> | undefined,
): string {
  const v = raw.cells.get(addr);
  if (v) return v;
  const salvaged = richTextCells?.get(addr);
  return salvaged ? normalizeCellText(salvaged) : "";
}

// ─── Heuristic pre-filter ──────────────────────────────────────────

const QUESTION_INTERROGATIVES =
  /^(?:what|why|how|when|where|who|which|is|are|do|does|can|will|should|has|have|list|describe|explain|provide)\b/i;
const QUESTION_PREFIX_NUMBERED = /^(?:\d+(?:\.\d+)*\s*[).:\]]?\s+|q\d*\s*[).:\]]\s+)/i;
const QUESTION_REQUIRED_MARKER =
  /\*\s*$|\((?:required|single|multiple)\s+selection|allows?\s+other\)/i;
const HEADER_KEYWORDS =
  /(?:question|response|answer|comment|attachment|control|requirement|status|evidence|select|criteria)/i;

/**
 * Heuristic: does this cell text look like an interrogative or
 * form-field question? Used both to bias the LLM's attention via
 * the `# OBSERVATIONS` block and to trim the sample on retry /
 * lite-mode attempts. False positives are tolerable — the LLM
 * still classifies — but false negatives drop genuine questions
 * out of the trimmed sample, so the regex set is generous.
 */
export function looksLikeQuestionLine(cell: string): boolean {
  const trimmed = cell.trim();
  if (!trimmed) return false;
  if (trimmed.length > 600) return false; // paragraphs of instructions
  if (/[?？]/.test(trimmed)) return true;
  if (QUESTION_INTERROGATIVES.test(trimmed)) return true;
  if (QUESTION_PREFIX_NUMBERED.test(trimmed)) return true;
  if (QUESTION_REQUIRED_MARKER.test(trimmed)) return true;
  return false;
}

/**
 * Heuristic: does this row look like the column-header row of a
 * question_table? Looks for ≥2 cells whose value is one of the
 * conventional structural labels (question, response, answer,
 * comment, control, …). The threshold of 2 avoids matching every
 * row that happens to mention "comment".
 */
export function looksLikeHeaderRow(values: readonly string[]): boolean {
  let hits = 0;
  for (const v of values) {
    const t = v.trim();
    if (!t || t.length > 60) continue;
    if (HEADER_KEYWORDS.test(t)) {
      hits++;
      if (hits >= 2) return true;
    }
  }
  return false;
}

interface SheetObservations {
  /** 0-based preview index of the most likely header row, or null. */
  headerRowIndex: number | null;
  /** 1-based source row numbers (xlsx) or 0-based table rows (docx) of question-like cells. */
  questionRows: number[];
}

function observeXlsxPatterns(sample: XlsxSheetSample): SheetObservations {
  const obs: SheetObservations = { headerRowIndex: null, questionRows: [] };
  for (let i = 0; i < sample.preview.length; i++) {
    const row = sample.preview[i]!;
    const values = Object.values(row);
    if (obs.headerRowIndex === null && i < 15 && looksLikeHeaderRow(values)) {
      obs.headerRowIndex = i;
    }
    for (const v of values) {
      if (looksLikeQuestionLine(v)) {
        const firstAddr = Object.keys(row)[0];
        const rowNum = firstAddr ? Number.parseInt(firstAddr.match(/\d+/)?.[0] ?? "0", 10) : 0;
        if (rowNum > 0) obs.questionRows.push(rowNum);
        break;
      }
    }
  }
  return obs;
}

function observeDocxPatterns(sample: DocxTableSample): SheetObservations {
  const obs: SheetObservations = { headerRowIndex: null, questionRows: [] };
  for (let r = 0; r < sample.rows.length; r++) {
    const row = sample.rows[r] ?? [];
    if (obs.headerRowIndex === null && r < 5 && looksLikeHeaderRow(row)) {
      obs.headerRowIndex = r;
    }
    if (row.some((cell) => looksLikeQuestionLine(cell ?? ""))) {
      obs.questionRows.push(r);
    }
  }
  return obs;
}

function renderObservationsBlock(obs: SheetObservations, sheetKind: "xlsx" | "docx"): string {
  const lines: string[] = [];
  lines.push(`# OBSERVATIONS`);
  if (obs.headerRowIndex === null) {
    lines.push(`candidate header row: (none confidently detected)`);
  } else {
    const display =
      sheetKind === "xlsx"
        ? `preview index ${obs.headerRowIndex}`
        : `table row ${obs.headerRowIndex}`;
    lines.push(`candidate header row: ${display}`);
  }
  if (obs.questionRows.length === 0) {
    lines.push(`question-like rows: (none confidently detected)`);
  } else {
    const sample = obs.questionRows.slice(0, 12).join(", ");
    const more = obs.questionRows.length > 12 ? `, … (+${obs.questionRows.length - 12} more)` : "";
    lines.push(`question-like rows: ${sample}${more}`);
  }
  lines.push(`Use these as anchors; verify against the preview before emitting.`);
  return lines.join("\n");
}

// ─── Prompts (single-sheet) ────────────────────────────────────────

const SYSTEM_PROMPT_SINGLE_SHEET = `You are a document-structure analyst. Analyze ONE sheet from any questionnaire (security, privacy, compliance, vendor, HR, any domain) and produce a JSON map so answers can be written back to the correct cells.

The user prompt includes a "# OBSERVATIONS" block listing the heuristically-detected header row and question-like rows. Treat those as anchors, not gospel — verify against the preview rows before emitting.

## SHEET CLASSIFICATION (pick exactly one kind)

- "instructions" — guidance, glossary, legends, cover text. No answerable cells.
- "metadata" — form-style key/value pairs ("Company Name:", "Reviewer:") with adjacent answer cells. Emit facts[].
- "question_table" — questions in rows, with one or more answer columns. Emit questions[]; link sub-questions via parentKey; populate contextLabels from surrounding domain / control-id / evidence columns.
- "matrix" — questions as ROW labels, entities/items as COLUMN headers; each (row × column) intersection is a separate answerable cell. Emit one entry per cell with the row's text in questionText and the column header in contextLabels.column.

## LAYOUTS TO EXPECT

- Cascading sub-questions: a parent question, then lettered/numbered children (a), b), 1., 2.) on later rows. Emit the parent and emit any child that has its own answer cell, with parentKey set to the parent's key.
- Dual-question rows: one row contains main-question + main-answer + sub-question + sub-answer. Emit two entries, the second with parentKey to the first.
- Vertically merged category cells: forward-fill the category to every row in the merge for contextLabels.

## OUTPUT RULES

1. Output ONLY valid JSON — no markdown fences, no explanation text, no trailing commentary.
2. Top-level shapes:
   { "kind": "instructions", "sheetName": "<exact-name>", "reason": "..." }
   { "kind": "metadata", "sheetName": "<exact-name>", "facts": [{ "label": "...", "answerCellA1": "..." }, ...] }
   { "kind": "question_table", "sheetName": "<exact-name>", "headerRowIndex": <0-based>, "questions": [...] }
   { "kind": "matrix", "sheetName": "<exact-name>", "questions": [...] }
3. Cell refs MUST be A1-style ("F12", "AA105"); never "row 5 col 3".
4. Each question needs a unique "key" string ("q1", "q1a", "m3c2" — internal IDs, choose what you like).
5. answerCellA1 must lie within the sheet's range; sheetName must match the input exactly.
6. Do NOT emit questions for header rows, blank rows, or decoration cells.
7. If no answerable content exists, classify as "instructions".
8. Be domain-agnostic — do not assume any specific framework, vendor, or template.

## ABSENCE / NULL RULES (these matter for validation)

- NEVER emit \`null\` for any field. If a value is absent, OMIT THE KEY ENTIRELY.
- OMIT \`questionText\` for question_table entries — the platform reads it from \`questionCellA1\`. ONLY include \`questionText\` for matrix entries (where the question lives in a row label, not the answer cell's row).
- OMIT \`contextLabels\` entirely if you have no labels. Inside contextLabels, omit any sub-key whose value would be empty.`;

const SYSTEM_PROMPT_SIMPLIFIED = `You are a document-structure analyst. The previous attempt at structuring this sheet returned invalid or non-conforming JSON. Re-analyse with a SIMPLER schema this time.

The user prompt includes a "# OBSERVATIONS" block with the detected header row and question-like rows. Trust those anchors and emit results for those rows.

## OUTPUT — exactly one of:

  { "kind": "instructions", "sheetName": "<exact-name>", "reason": "..." }
  { "kind": "metadata", "sheetName": "<exact-name>", "facts": [{ "label": "...", "answerCellA1": "..." }] }
  { "kind": "question_table", "sheetName": "<exact-name>", "headerRowIndex": <0-based>, "questions": [
      { "key": "...", "questionCellA1": "...", "answerCellA1": "..." }
  ] }

## RULES

- Output ONLY valid JSON, nothing else.
- Cell refs A1-style ("F12"); sheetName matches the input exactly.
- Do NOT emit "matrix"; collapse matrix-like sheets into question_table with one entry per cell.
- Do NOT emit "parentKey", "contextLabels", or "questionText" — they are dropped from this schema.
- NEVER emit \`null\`; omit absent keys instead.`;

function buildXlsxSheetPrompt(sample: XlsxSheetSample, options: { simplified: boolean }): string {
  const observations = observeXlsxPatterns(sample);
  const preview = options.simplified
    ? trimPreviewToObservations(sample.preview, observations)
    : sample.preview;

  const parts: string[] = [];
  parts.push(`# Sheet to map`);
  parts.push(`Sheet name: ${JSON.stringify(sample.name)}`);
  parts.push(`Dimensions: ${sample.totalRows} rows × ${sample.totalCols} cols`);
  parts.push(`Merged ranges: ${sample.merges.length === 0 ? "(none)" : sample.merges.join(", ")}`);
  parts.push(``);
  parts.push(renderObservationsBlock(observations, "xlsx"));
  parts.push(``);
  parts.push(`## Preview rows (each line is one row as { A1cell: value }; empty cells omitted):`);
  for (const row of preview) {
    parts.push(JSON.stringify(row));
  }
  parts.push(``);
  parts.push(`Analyze the sheet structure and produce ONE JSON object.`);
  return parts.join("\n");
}

function buildDocxTablePrompt(sample: DocxTableSample, options: { simplified: boolean }): string {
  const observations = observeDocxPatterns(sample);

  const parts: string[] = [];
  parts.push(`# Table to map`);
  parts.push(`Sheet name: ${JSON.stringify(sample.name)}`);
  parts.push(`Rows: ${sample.rowCount}`);
  parts.push(``);
  parts.push(
    `Cell coordinates use A1 form where letters are columns and numbers are 1-based row numbers within the table (A1 is the top-left cell). Use these refs in answerCellA1.`,
  );
  parts.push(``);
  parts.push(renderObservationsBlock(observations, "docx"));
  parts.push(``);
  parts.push(`## Preview (row → cells):`);
  const rowLimit = Math.min(sample.rows.length, SAMPLE_ROWS);
  const wantedRows = options.simplified
    ? new Set([
        ...(observations.headerRowIndex === null ? [] : [observations.headerRowIndex]),
        ...observations.questionRows,
        ...observations.questionRows.flatMap((r) => [r - 1, r + 1]),
      ])
    : null;
  for (let r = 0; r < rowLimit; r++) {
    if (wantedRows && !wantedRows.has(r)) continue;
    const cells = sample.rows[r] ?? [];
    const obj: Record<string, string> = {};
    for (let c = 0; c < cells.length; c++) {
      const v = (cells[c] ?? "").replace(/\s+/g, " ").trim();
      if (!v) continue;
      const addr = encodeCell({ r, c });
      obj[addr] = v.length > SAMPLE_COL_CHARS ? v.slice(0, SAMPLE_COL_CHARS) + "…" : v;
    }
    if (Object.keys(obj).length > 0) parts.push(JSON.stringify(obj));
  }
  parts.push(``);
  parts.push(`Analyze the table structure and produce ONE JSON object.`);
  return parts.join("\n");
}

/**
 * On retry attempts we trim the preview down to the header row + a
 * neighbourhood around each question-like row, keeping enough
 * context for the LLM to identify answer columns. Halves token
 * pressure on dense sheets without dropping signal.
 */
function trimPreviewToObservations(
  preview: ReadonlyArray<Record<string, string>>,
  obs: SheetObservations,
): Array<Record<string, string>> {
  if (preview.length === 0) return [];
  const keep = new Set<number>();
  if (obs.headerRowIndex !== null) keep.add(obs.headerRowIndex);

  // Map source row numbers (1-based) to preview indices.
  const sourceRowToIdx = new Map<number, number>();
  for (let i = 0; i < preview.length; i++) {
    const firstAddr = Object.keys(preview[i]!)[0];
    if (!firstAddr) continue;
    const rowNum = Number.parseInt(firstAddr.match(/\d+/)?.[0] ?? "0", 10);
    if (rowNum > 0) sourceRowToIdx.set(rowNum, i);
  }
  for (const sourceRow of obs.questionRows) {
    for (const offset of [-1, 0, 1]) {
      const idx = sourceRowToIdx.get(sourceRow + offset);
      if (idx !== undefined) keep.add(idx);
    }
  }

  // If observations gave us nothing useful, keep the original preview
  // rather than starve the model.
  if (keep.size === 0) return [...preview];

  const sorted = [...keep].sort((a, b) => a - b);
  return sorted.map((i) => preview[i]!);
}

// ─── Validation helpers ────────────────────────────────────────────

function parseSingleSheetJson(
  content: string,
  expectedSheetName: string,
  options: { simplified: boolean },
): SheetMap {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  let raw: unknown;
  try {
    raw = JSON.parse(cleaned);
  } catch (err) {
    throw new StructureAgentError(
      `Agent returned invalid JSON for sheet "${expectedSheetName}": ${
        err instanceof Error ? err.message : String(err)
      }`,
      err,
    );
  }

  // Strip nulls so Zod's `.nullish()` cleanly normalises to undefined,
  // and downstream `string | undefined` types stay accurate.
  const normalized = stripNulls(raw);

  const schema = options.simplified ? SheetMapSimplifiedSchema : SheetMapSchema;
  const result = schema.safeParse(normalized);
  if (!result.success) {
    throw new StructureAgentError(
      `Agent JSON for sheet "${expectedSheetName}" did not match expected shape: ${result.error.message}`,
      result.error,
    );
  }
  if (result.data.sheetName !== expectedSheetName) {
    // Some models like to "tidy" sheet names. We force the original
    // name so downstream lookups keep working.
    return { ...result.data, sheetName: expectedSheetName } as SheetMap;
  }
  return result.data as SheetMap;
}

/**
 * Recursively drop keys whose values are `null` so the validator
 * treats them as "absent" rather than "explicitly null". LLMs often
 * emit `"value": null` for optional fields and Zod's `.nullish()`
 * already accepts that — but downstream TypeScript code expects
 * `string | undefined`, never `null`, so we drop them here.
 */
function stripNulls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripNulls);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === null) continue;
      out[k] = stripNulls(v);
    }
    return out;
  }
  return value;
}

// ─── Lite-mode fallback ────────────────────────────────────────────

const LITE_RESPONSE_SCHEMA = z.object({
  questions: z.array(
    z.object({
      rowIndex: z.number().int().min(0),
      questionColumn: z.string().regex(/^[A-Z]+$/),
      answerColumn: z
        .string()
        .regex(/^[A-Z]+$/)
        .optional(),
      questionText: z.string().min(1),
    }),
  ),
});

const SYSTEM_PROMPT_LITE = `You are a questionnaire-extraction assistant. The full structure-mapping pipeline failed for this sheet, so we are falling back to a flat extraction. Your job is to identify every answerable question and the cell where its answer should go.

Output ONLY valid JSON in this shape:

  {
    "questions": [
      {
        "rowIndex": <0-based index in the rendered preview>,
        "questionColumn": "<single column letter, e.g. B>",
        "answerColumn": "<single column letter, e.g. C — omit if no obvious answer column>",
        "questionText": "<the question text from the cell>"
      }
    ]
  }

Rules:
- Emit one entry per answerable question. Skip header rows, instructions, decorative cells, and rows that already contain a complete answer.
- The questionColumn is the column letter where the question text lives on that row.
- The answerColumn is the column letter where the response should be written. If the row has an obvious empty cell to the right of the question, use that column letter. Otherwise omit the field.
- NEVER emit \`null\`. Omit absent keys.
- Output JSON only — no commentary, no markdown fences.`;

async function runLiteFallback(input: MapSingleSheetInput): Promise<MapSingleSheetOutcome> {
  if (isXlsxSample(input.sample)) {
    const sheet = await mapSingleSheetLiteXlsx(input.sample, input.aiClient);
    return { sheet, mode: "lite" };
  }
  const sheet = await mapSingleSheetLiteDocx(input.sample, input.aiClient);
  return { sheet, mode: "lite" };
}

async function mapSingleSheetLiteXlsx(
  sample: XlsxSheetSample,
  aiClient: AiChatClient,
): Promise<SheetMap> {
  const observations = observeXlsxPatterns(sample);
  const userPrompt = buildLitePromptXlsx(sample, observations);

  const completion = await withTimeout(
    aiClient.chat({
      messages: [
        { role: "system", content: SYSTEM_PROMPT_LITE },
        { role: "user", content: userPrompt },
      ],
      maxTokens: Math.min(8_000, Math.max(2_000, sample.preview.length * 50)),
      temperature: 0,
      responseFormat: "json",
    }),
    PER_SHEET_TIMEOUT_MS,
    `Sheet "${sample.name}" lite-mode timed out after ${PER_SHEET_TIMEOUT_MS}ms`,
  );

  const parsed = parseLiteResponse(completion.content, sample.name);

  // Build a row->present-columns lookup so we can synthesise an
  // answer column when the model didn't pick one.
  const rowOccupancy = buildRowOccupancyXlsx(sample);
  const seenKeys = new Set<string>();
  const questions = parsed.questions
    .map((q) => {
      const sourceRowIdx = sample.preview[q.rowIndex];
      if (!sourceRowIdx) return null;
      const firstAddr = Object.keys(sourceRowIdx)[0];
      const sourceRowNum = firstAddr ? Number.parseInt(firstAddr.match(/\d+/)?.[0] ?? "0", 10) : 0;
      if (sourceRowNum <= 0) return null;

      const questionCellA1 = `${q.questionColumn}${sourceRowNum}`;
      const answerColumn =
        q.answerColumn ?? pickAnswerColumn(q.questionColumn, rowOccupancy.get(sourceRowNum));
      const answerCellA1 = `${answerColumn}${sourceRowNum}`;

      const baseKey = `lite-${sourceRowNum}-${q.questionColumn}`;
      let key = baseKey;
      let suffix = 2;
      while (seenKeys.has(key)) key = `${baseKey}-${suffix++}`;
      seenKeys.add(key);

      return {
        key,
        questionCellA1,
        answerCellA1,
        questionText: q.questionText.trim(),
      };
    })
    .filter((q): q is NonNullable<typeof q> => q !== null);

  return {
    kind: "question_table",
    sheetName: sample.name,
    headerRowIndex: observations.headerRowIndex ?? 0,
    questions,
  };
}

async function mapSingleSheetLiteDocx(
  sample: DocxTableSample,
  aiClient: AiChatClient,
): Promise<SheetMap> {
  const observations = observeDocxPatterns(sample);
  const userPrompt = buildLitePromptDocx(sample, observations);

  const completion = await withTimeout(
    aiClient.chat({
      messages: [
        { role: "system", content: SYSTEM_PROMPT_LITE },
        { role: "user", content: userPrompt },
      ],
      maxTokens: Math.min(8_000, Math.max(2_000, sample.rows.length * 50)),
      temperature: 0,
      responseFormat: "json",
    }),
    PER_SHEET_TIMEOUT_MS,
    `Sheet "${sample.name}" lite-mode timed out after ${PER_SHEET_TIMEOUT_MS}ms`,
  );

  const parsed = parseLiteResponse(completion.content, sample.name);
  const seenKeys = new Set<string>();
  const questions = parsed.questions
    .map((q) => {
      const tableRow = q.rowIndex; // 0-based table row
      if (tableRow < 0 || tableRow >= sample.rows.length) return null;
      const a1Row = tableRow + 1;
      const occupied = new Set(
        (sample.rows[tableRow] ?? [])
          .map((cell, idx) => (cell && cell.trim() ? colLetter(idx) : null))
          .filter((c): c is string => c !== null),
      );
      const answerColumn = q.answerColumn ?? pickAnswerColumn(q.questionColumn, occupied);

      const baseKey = `lite-${a1Row}-${q.questionColumn}`;
      let key = baseKey;
      let suffix = 2;
      while (seenKeys.has(key)) key = `${baseKey}-${suffix++}`;
      seenKeys.add(key);

      return {
        key,
        questionCellA1: `${q.questionColumn}${a1Row}`,
        answerCellA1: `${answerColumn}${a1Row}`,
        questionText: q.questionText.trim(),
      };
    })
    .filter((q): q is NonNullable<typeof q> => q !== null);

  return {
    kind: "question_table",
    sheetName: sample.name,
    headerRowIndex: observations.headerRowIndex ?? 0,
    questions,
  };
}

function parseLiteResponse(
  content: string,
  sheetName: string,
): z.infer<typeof LITE_RESPONSE_SCHEMA> {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  let raw: unknown;
  try {
    raw = JSON.parse(cleaned);
  } catch (err) {
    throw new StructureAgentError(
      `Lite-mode returned invalid JSON for sheet "${sheetName}": ${
        err instanceof Error ? err.message : String(err)
      }`,
      err,
    );
  }
  const normalized = stripNulls(raw);
  const result = LITE_RESPONSE_SCHEMA.safeParse(normalized);
  if (!result.success) {
    throw new StructureAgentError(
      `Lite-mode JSON for sheet "${sheetName}" did not match expected shape: ${result.error.message}`,
      result.error,
    );
  }
  return result.data;
}

function buildLitePromptXlsx(sample: XlsxSheetSample, obs: SheetObservations): string {
  const parts: string[] = [];
  parts.push(`# Sheet (lite-mode extraction)`);
  parts.push(`Sheet name: ${JSON.stringify(sample.name)}`);
  parts.push(`Dimensions: ${sample.totalRows} rows × ${sample.totalCols} cols`);
  parts.push(``);
  parts.push(renderObservationsBlock(obs, "xlsx"));
  parts.push(``);
  parts.push(
    `## Preview rows — \`R<previewIndex> [sourceRow=N]: <COL>=<value> | …\`. Use the previewIndex as \`rowIndex\` in your output.`,
  );
  for (let i = 0; i < sample.preview.length; i++) {
    const row = sample.preview[i]!;
    const firstAddr = Object.keys(row)[0];
    const sourceRow = firstAddr ? (firstAddr.match(/\d+/)?.[0] ?? "?") : "?";
    const cells = Object.entries(row)
      .map(([addr, value]) => `${addr.replace(/\d+/g, "")}=${value}`)
      .join(" | ");
    parts.push(`R${i} [sourceRow=${sourceRow}]: ${cells}`);
  }
  return parts.join("\n");
}

function buildLitePromptDocx(sample: DocxTableSample, obs: SheetObservations): string {
  const parts: string[] = [];
  parts.push(`# Table (lite-mode extraction)`);
  parts.push(`Sheet name: ${JSON.stringify(sample.name)}`);
  parts.push(`Rows: ${sample.rowCount}`);
  parts.push(``);
  parts.push(renderObservationsBlock(obs, "docx"));
  parts.push(``);
  parts.push(
    `## Preview — \`R<rowIndex>: <COL>=<value> | …\`. Use rowIndex (0-based) in your output.`,
  );
  const rowLimit = Math.min(sample.rows.length, SAMPLE_ROWS);
  for (let r = 0; r < rowLimit; r++) {
    const cells = sample.rows[r] ?? [];
    const formatted = cells
      .map((value, idx) => {
        const v = (value ?? "").replace(/\s+/g, " ").trim();
        if (!v) return null;
        return `${colLetter(idx)}=${v.length > SAMPLE_COL_CHARS ? v.slice(0, SAMPLE_COL_CHARS) + "…" : v}`;
      })
      .filter((s): s is string => s !== null)
      .join(" | ");
    if (formatted) parts.push(`R${r}: ${formatted}`);
  }
  return parts.join("\n");
}

/**
 * Builds a `sourceRowNum -> Set<columnLetter>` map of cells that
 * were populated in the original sheet, used by the lite path to
 * pick a "first empty column to the right of the question column"
 * when the model omits answerColumn.
 */
function buildRowOccupancyXlsx(sample: XlsxSheetSample): Map<number, Set<string>> {
  const out = new Map<number, Set<string>>();
  for (const row of sample.preview) {
    for (const addr of Object.keys(row)) {
      const colLetters = addr.match(/^[A-Z]+/)?.[0];
      const rowNum = Number.parseInt(addr.match(/\d+/)?.[0] ?? "0", 10);
      if (!colLetters || rowNum <= 0) continue;
      let set = out.get(rowNum);
      if (!set) {
        set = new Set();
        out.set(rowNum, set);
      }
      set.add(colLetters);
    }
  }
  return out;
}

/**
 * Returns the first column to the right of `questionColumn` that is
 * NOT currently occupied. If every following column is occupied or
 * the row data is unknown, falls back to the column immediately to
 * the right of the question — that's still better than overwriting
 * the question itself.
 */
function pickAnswerColumn(questionColumn: string, occupied: Set<string> | undefined): string {
  const startIdx = colIndex(questionColumn) + 1;
  const haystack = occupied ?? new Set<string>();
  for (let i = startIdx; i < startIdx + 26; i++) {
    const letter = colLetter(i);
    if (!haystack.has(letter)) return letter;
  }
  return colLetter(startIdx);
}

// ─── Timeout helper ────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new StructureAgentError(message)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

// ─── Test-only exports ─────────────────────────────────────────────
// Internals exposed exclusively to spec files. Public callers should
// continue to use `mapXlsxStructure` / `mapDocxStructure` only.

/** @internal */
export const __test = {
  mapSingleSheet,
  mapSingleSheetLiteXlsx,
  observeXlsxPatterns,
  pickAnswerColumn,
  trimPreviewToObservations,
};
