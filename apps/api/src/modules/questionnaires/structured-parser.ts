/**
 * Map-driven parser: turn a WorkbookMap (produced by the structure
 * agent) plus the original xlsx/docx blob into concrete `Question`
 * + `MetadataFact` records ready to insert.
 *
 * The agent is the source of truth for "which cells are questions".
 * This module does only mechanical work:
 *
 *   • Resolve every `questionCellA1` to its actual cell text. The
 *     LLM's `questionText` is treated as a fallback when the cell
 *     is empty (matrix sheets often have the column label as the
 *     "question" rather than a cell-resident string).
 *   • Reorder questions into a depth-first sequence (parent → its
 *     subs → next parent) so `sequenceNumber` matches what a human
 *     would expect when reading the file top-to-bottom.
 *   • Translate parent `key` strings into DB-friendly references
 *     by emitting a deterministic order: the router maps these
 *     keys to actual Question IDs after the parent rows are
 *     created (see `router.ts`).
 *
 * The returned `ParsedQuestion` is intentionally close to the
 * Prisma `Question` create-input shape — easy for the router to
 * batch-insert.
 */

import ExcelJS from "exceljs";
import { decodeCell } from "./a1.js";
import { safeCellText } from "./excel-cell.js";
import type { MetadataFact, SheetMap, SheetQuestion, WorkbookMap } from "./structure-agent.js";

export interface ParsedQuestion {
  /** Stable key from the agent — used by the router to wire parents. */
  key: string;
  parentKey?: string;
  questionText: string;
  /** Sheet name (xlsx) or "Table N" (docx). Persisted in `sourceSheetName`. */
  sourceSheetName: string;
  /** Whether this question came from a docx table; index of <w:tbl>. */
  sourceTableIndex?: number;
  /** A1 reference of the cell that should receive the answer. */
  answerCellA1: string;
  /** A1 reference of the cell that holds the question text. */
  questionCellA1: string;
  /** 0-based row index for legacy compatibility. */
  sourceRowIndex: number;
  /** Section title — preferred order: contextLabels.subDomain ?? domain ?? sheetName. */
  sectionTitle: string | null;
  contextLabels: Record<string, string>;
  originalRow: Record<string, unknown>;
}

export interface ParsedFact extends MetadataFact {
  sourceSheetName: string;
}

export interface StructuredParseResult {
  questions: ParsedQuestion[];
  facts: ParsedFact[];
  /** Audit-friendly per-sheet summary. */
  summary: Array<{
    sheetName: string;
    kind: SheetMap["kind"];
    questionCount: number;
    factCount: number;
  }>;
}

// ─── XLSX ─────────────────────────────────────────────────────────

export async function parseXlsxWithMap(
  buffer: Buffer,
  map: WorkbookMap,
): Promise<StructuredParseResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  return parseWithMap(map, (sheetName) => {
    const ws = wb.getWorksheet(sheetName);
    if (!ws) return null;
    return (a1: string) => readCellValue(ws, a1);
  });
}

// ─── DOCX ─────────────────────────────────────────────────────────

/**
 * Build a cell-reader for DOCX where the agent uses A1 refs against
 * the per-table grid we extracted (A1 = row 0, col 0 of that table).
 */
export function parseDocxWithMap(
  tables: Array<{ tableIndex: number; rows: string[][] }>,
  map: WorkbookMap,
): StructuredParseResult {
  const byName = new Map<string, { tableIndex: number; rows: string[][] }>();
  for (const t of tables) byName.set(`Table ${t.tableIndex}`, t);

  return parseWithMap(
    map,
    (sheetName) => {
      const t = byName.get(sheetName);
      if (!t) return null;
      return (a1: string) => readDocxCellValue(t.rows, a1);
    },
    byName,
  );
}

// ─── Shared ───────────────────────────────────────────────────────

type CellReader = (a1: string) => string;
type ReaderFactory = (sheetName: string) => CellReader | null;

function parseWithMap(
  map: WorkbookMap,
  readerFor: ReaderFactory,
  docxTablesByName?: Map<string, { tableIndex: number; rows: string[][] }>,
): StructuredParseResult {
  const questions: ParsedQuestion[] = [];
  const facts: ParsedFact[] = [];
  const summary: StructuredParseResult["summary"] = [];

  for (const sheet of map.sheets) {
    const reader = readerFor(sheet.sheetName);
    const tableMeta = docxTablesByName?.get(sheet.sheetName);

    let questionCount = 0;
    let factCount = 0;

    if (sheet.kind === "instructions") {
      // Nothing to extract.
    } else if (sheet.kind === "metadata") {
      for (const fact of sheet.facts) {
        facts.push({
          ...fact,
          value: fact.value ?? (reader ? safe(reader, fact.answerCellA1) : ""),
          sourceSheetName: sheet.sheetName,
        });
        factCount++;
      }
    } else if (sheet.kind === "question_table" || sheet.kind === "matrix") {
      const ordered = orderDepthFirst(sheet.questions);
      for (const q of ordered) {
        const text = resolveQuestionText(q, reader);
        if (!text) continue; // agent referenced an empty cell — drop it
        const ctx = stringMap(q.contextLabels);
        questions.push({
          key: q.key,
          parentKey: q.parentKey,
          questionText: text,
          sourceSheetName: sheet.sheetName,
          sourceTableIndex: tableMeta?.tableIndex,
          answerCellA1: q.answerCellA1,
          questionCellA1: q.questionCellA1,
          sourceRowIndex: rowIndexFromA1(q.answerCellA1),
          sectionTitle: ctx.subDomain ?? ctx.domain ?? sheet.sheetName,
          contextLabels: ctx,
          originalRow: { questionCell: q.questionCellA1, answerCell: q.answerCellA1, ...ctx },
        });
        questionCount++;
      }
    }

    summary.push({
      sheetName: sheet.sheetName,
      kind: sheet.kind,
      questionCount,
      factCount,
    });
  }

  return { questions, facts, summary };
}

/**
 * Re-order questions so each parent is immediately followed by its
 * children (recursively). Without this, agent output that emits all
 * parents first then all subs would produce a confusing top-to-
 * bottom display order.
 */
function orderDepthFirst(qs: SheetQuestion[]): SheetQuestion[] {
  const byKey = new Map(qs.map((q) => [q.key, q]));
  const childrenOf = new Map<string, SheetQuestion[]>();
  const roots: SheetQuestion[] = [];

  for (const q of qs) {
    if (q.parentKey && byKey.has(q.parentKey)) {
      const arr = childrenOf.get(q.parentKey) ?? [];
      arr.push(q);
      childrenOf.set(q.parentKey, arr);
    } else {
      roots.push(q);
    }
  }

  const out: SheetQuestion[] = [];
  const visit = (q: SheetQuestion) => {
    out.push(q);
    for (const child of childrenOf.get(q.key) ?? []) visit(child);
  };
  for (const r of roots) visit(r);

  // Drop any cycle stragglers we might've missed.
  if (out.length !== qs.length) {
    const seen = new Set(out.map((o) => o.key));
    for (const q of qs) if (!seen.has(q.key)) out.push(q);
  }
  return out;
}

function resolveQuestionText(q: SheetQuestion, reader: CellReader | null): string {
  // Prefer the cell — that's what the customer sees in the file —
  // and only fall back to the agent's `questionText` (matrix column
  // labels live in headers, not in the question cell itself).
  const cellText = reader ? safe(reader, q.questionCellA1) : "";
  if (cellText) return cellText;
  return (q.questionText ?? "").trim();
}

function safe(reader: CellReader, a1: string): string {
  try {
    return reader(a1).trim();
  } catch {
    return "";
  }
}

function readCellValue(ws: ExcelJS.Worksheet, a1: string): string {
  // `safeCellText` gives us ExcelJS's user-visible rendering — handles
  // strings, numbers, dates, formula results, richText runs — and
  // shields against the `MergeValue.toString()` null-master crash.
  return safeCellText(ws.getCell(a1)).replace(/\s+/g, " ").trim();
}

function readDocxCellValue(rows: string[][], a1: string): string {
  const { c, r } = decodeCell(a1);
  return (rows[r]?.[c] ?? "").replace(/\s+/g, " ").trim();
}

function rowIndexFromA1(a1: string): number {
  const { r } = decodeCell(a1);
  return r;
}

function stringMap(input: Record<string, string | undefined> | undefined): Record<string, string> {
  if (!input) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === "string" && v.trim().length > 0) out[k] = v.trim();
  }
  return out;
}
