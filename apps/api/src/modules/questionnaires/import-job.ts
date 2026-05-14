/**
 * Async questionnaire import runner.
 *
 * `POST /questionnaires` enqueues a `QuestionnaireImportJob` and returns
 * immediately. This module is what actually does the work in the
 * background: download the original blob from storage, run the per-sheet
 * structure agent (xlsx/docx) or heuristic CSV parse, persist the
 * resulting Questionnaire + Question rows, and update the job's
 * `progress` JSON column as each sheet completes so the UI poll can
 * render live status.
 *
 * For now this runs in-process via `setImmediate(runImportJob, jobId)`
 * — fine for dev and small-scale prod (the work is I/O-bound on the
 * AI provider). The job table is the contract; swapping in a proper
 * BullMQ/SQS worker later is a one-file change.
 */

import { AIProviderError } from "@trustalo/ai";
import { prisma, prismaWithTenant } from "../../db/prisma.js";

type TenantPrisma = ReturnType<typeof prismaWithTenant>;
import { createStorageProvider } from "@trustalo/storage";
import { detectColumnsWithFallback, inferQuestionType, parseCsv } from "./csv.js";
import { extractDocxTablesFromBuffer } from "./file-parser.js";
import {
  mapDocxStructure,
  mapXlsxStructure,
  StructureAgentError,
  type SheetProgress,
  type WorkbookMap,
} from "./structure-agent.js";
import {
  parseDocxWithMap,
  parseXlsxWithMap,
  type ParsedQuestion,
  type StructuredParseResult,
} from "./structured-parser.js";
import { listSheets } from "./xlsx-rich-text.js";

const storage = createStorageProvider({
  provider: (process.env.STORAGE_PROVIDER as "s3") || "s3",
  region: process.env.AWS_REGION || "us-east-1",
  bucket: process.env.S3_BUCKET || "trustalo-files",
  endpoint: process.env.S3_ENDPOINT || undefined,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || undefined,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || undefined,
});

// ─── Progress shape (matches what the UI consumes) ─────────────────

export type JobPhase = "queued" | "downloading" | "parsing" | "mapping" | "persisting";

export interface SheetProgressRow {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  kind?: "instructions" | "metadata" | "question_table" | "matrix" | "csv";
  questionCount?: number;
  durationMs?: number;
  error?: string;
  /**
   * Which structure-agent path produced this sheet. Forwarded from
   * `SheetProgress.completed` so the UI can flag sheets that fell
   * back to lite-mode (sub-questions / matrix context not extracted).
   */
  mode?: "strict" | "strict-retry" | "lite";
}

export interface JobProgress {
  phase: JobPhase;
  totalSheets: number;
  completedSheets: number;
  failedSheets: number;
  sheets: SheetProgressRow[];
  /** Wall-clock since the runner started, ms. */
  elapsedMs?: number;
}

const EMPTY_PROGRESS: JobProgress = {
  phase: "queued",
  totalSheets: 0,
  completedSheets: 0,
  failedSheets: 0,
  sheets: [],
};

// ─── Public entry point ────────────────────────────────────────────

/**
 * Run a single import job to completion. Never throws — terminal
 * failures are recorded on the job row instead so the polling client
 * always sees a definitive `status`.
 */
export async function runImportJob(jobId: string): Promise<void> {
  const startedAt = Date.now();
  const job = await prisma.questionnaireImportJob.findUnique({ where: { id: jobId } });
  if (!job) {
    console.warn(`[import-job] ${jobId} not found — aborting`);
    return;
  }
  if (job.status !== "pending") {
    console.warn(`[import-job] ${jobId} already in status=${job.status}; not re-running`);
    return;
  }

  await prisma.questionnaireImportJob.update({
    where: { id: jobId },
    data: {
      status: "running",
      startedAt: new Date(),
      progress: { ...EMPTY_PROGRESS, phase: "downloading" } as any,
    },
  });

  try {
    if (job.csvBody) {
      await runCsvJob(job.id, job.tenantId, job.createdById, {
        csv: job.csvBody,
        name: job.name,
        requester: job.requester,
        vendorId: job.vendorId,
        dueDate: job.dueDate,
        formatHint: job.formatHint,
      });
    } else if (job.originalFileKey) {
      await runFileJob(job.id, job.tenantId, job.createdById, {
        fileKey: job.originalFileKey,
        filename: job.originalFilename ?? "upload",
        mimeType: job.originalMimeType ?? "application/octet-stream",
        name: job.name,
        requester: job.requester,
        vendorId: job.vendorId,
        dueDate: job.dueDate,
        formatHint: job.formatHint,
      });
    } else {
      throw new Error("Job has neither originalFileKey nor csvBody — cannot run");
    }
    console.log(`[import-job] ${jobId} done in ${Date.now() - startedAt}ms`);
  } catch (err) {
    await markJobTerminalFailure(jobId, err);
    console.error(`[import-job] ${jobId} failed in ${Date.now() - startedAt}ms`, err);
  }
}

// ─── CSV path ──────────────────────────────────────────────────────

interface CsvJobInput {
  csv: string;
  name: string;
  requester: string | null;
  vendorId: string | null;
  dueDate: Date | null;
  formatHint: string | null;
}

async function runCsvJob(
  jobId: string,
  tenantId: string,
  userId: string,
  input: CsvJobInput,
): Promise<void> {
  const t0 = Date.now();
  await updateProgress(jobId, (p) => ({ ...p, phase: "parsing" }));

  const csv = parseCsv(input.csv);
  const detected = detectColumnsWithFallback(csv.headers, csv.rows);
  if (!detected.questionColumn) {
    await prisma.questionnaireImportJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorCode: "NO_QUESTION_COLUMN",
        errorMessage: `Could not identify a question column. Detected headers: ${csv.headers.join(", ")}. Rename one to 'Question' / 'Item' / 'Description', or paste only the question rows.`,
      },
    });
    return;
  }

  const sourceFormat =
    input.formatHint ??
    (detected.format === "caiq" ? "caiq" : detected.format === "sig" ? "sig" : "csv");

  await updateProgress(jobId, (p) => ({
    ...p,
    phase: "persisting",
    totalSheets: 1,
    sheets: [{ name: "CSV", status: "running", kind: "csv" }],
  }));

  const db = prismaWithTenant(tenantId);
  const created = await db.questionnaire.create({
    data: {
      tenantId,
      name: input.name,
      sourceFormat: sourceFormat as any,
      requester: input.requester ?? undefined,
      vendorId: input.vendorId ?? undefined,
      dueDate: input.dueDate ?? null,
      importedById: userId,
      headers: csv.headers,
    },
  });

  let inserted = 0;
  for (const [idx, row] of csv.rows.entries()) {
    const text = (row.values[detected.questionColumn] ?? "").trim();
    if (!text) continue;
    await db.question.create({
      data: {
        tenantId,
        questionnaireId: created.id,
        sequenceNumber: idx + 1,
        sectionTitle: detected.sectionColumn ? (row.values[detected.sectionColumn] ?? null) : null,
        questionText: text,
        questionType: inferQuestionType(text),
        choices: [],
        originalRow: row.values,
        sourceRowIndex: row.sourceRowIndex,
        answerColumnHeader: detected.answerColumn ?? null,
      },
    });
    inserted++;
  }

  await prisma.questionnaireImportJob.update({
    where: { id: jobId },
    data: {
      status: "completed",
      sourceFormat: sourceFormat as any,
      questionnaireId: created.id,
      completedAt: new Date(),
      progress: {
        phase: "persisting",
        totalSheets: 1,
        completedSheets: 1,
        failedSheets: 0,
        sheets: [
          {
            name: "CSV",
            status: "completed",
            kind: "csv",
            questionCount: inserted,
            durationMs: Date.now() - t0,
          },
        ],
        elapsedMs: Date.now() - t0,
      } as any,
    },
  });
}

// ─── File path (xlsx / docx) ───────────────────────────────────────

interface FileJobInput {
  fileKey: string;
  filename: string;
  mimeType: string;
  name: string;
  requester: string | null;
  vendorId: string | null;
  dueDate: Date | null;
  formatHint: string | null;
}

async function runFileJob(
  jobId: string,
  tenantId: string,
  userId: string,
  input: FileJobInput,
): Promise<void> {
  const t0 = Date.now();
  await updateProgress(jobId, (p) => ({ ...p, phase: "downloading" }));

  const buffer = await downloadOriginalToBuffer(input.fileKey);
  const ext = input.filename.split(".").pop()?.toLowerCase() ?? "";

  if (ext !== "xlsx" && ext !== "xls" && ext !== "docx") {
    await prisma.questionnaireImportJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorCode: "UNSUPPORTED_TYPE",
        errorMessage: `Unsupported file type: .${ext}. Use .csv, .xlsx, .xls or .docx.`,
      },
    });
    return;
  }

  await updateProgress(jobId, (p) => ({ ...p, phase: "mapping" }));

  // Forward each per-sheet event from the agent into the job row.
  const handleProgress = async (event: SheetProgress) => {
    await updateProgress(jobId, (p) => mergeSheetEvent(p, event));
  };

  let mapResult: { map: WorkbookMap; failedSheets: Array<{ sheetName: string; reason: string }> };
  let parsed: StructuredParseResult;
  let sourceFormat: "xlsx" | "docx";

  try {
    if (ext === "docx") {
      const tables = await extractDocxTablesFromBuffer(buffer);
      // Pre-populate the sheet list with one row per table so the UI
      // can show "Table 0 / Table 1 / …" before the agent starts.
      await updateProgress(jobId, (p) => ({
        ...p,
        totalSheets: tables.length,
        sheets: tables.map((t) => ({
          name: `Table ${t.tableIndex}`,
          status: "pending" as const,
        })),
      }));
      mapResult = await mapDocxStructure({
        tenantId,
        tables,
        onProgress: (e) => void handleProgress(e),
      });
      parsed = parseDocxWithMap(tables, mapResult.map);
      sourceFormat = "docx";
    } else {
      // xlsx — pre-populate with sheet names from the workbook.
      const xlsxNames = await listXlsxSheetNames(buffer);
      await updateProgress(jobId, (p) => ({
        ...p,
        totalSheets: xlsxNames.length,
        sheets: xlsxNames.map((n) => ({ name: n, status: "pending" as const })),
      }));
      mapResult = await mapXlsxStructure({
        tenantId,
        buffer,
        onProgress: (e) => void handleProgress(e),
      });
      parsed = await parseXlsxWithMap(buffer, mapResult.map);
      sourceFormat = "xlsx";
    }
  } catch (err) {
    // AIProviderError / StructureAgentError carry public-safe messages;
    // anything else gets a generic friendly fallback.
    const publicMsg =
      err instanceof AIProviderError
        ? err.publicMessage
        : err instanceof StructureAgentError
          ? "We could not understand the structure of this file. It may be in an unsupported layout, or the AI service may be temporarily unavailable. Please try again or upload a CSV."
          : "Could not parse file";
    await prisma.questionnaireImportJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorCode:
          err instanceof AIProviderError
            ? `AI_PROVIDER_${err.kind.toUpperCase()}`
            : err instanceof StructureAgentError
              ? "STRUCTURE_AGENT_FAILED"
              : "PARSE_FAILED",
        errorMessage: publicMsg,
      },
    });
    return;
  }

  await updateProgress(jobId, (p) => ({ ...p, phase: "persisting" }));

  // Persist Questionnaire + Questions.
  const db = prismaWithTenant(tenantId);
  const created = await db.questionnaire.create({
    data: {
      tenantId,
      name: input.name,
      sourceFormat: sourceFormat as any,
      requester: input.requester ?? undefined,
      vendorId: input.vendorId ?? undefined,
      dueDate: input.dueDate ?? null,
      importedById: userId,
      headers: [],
      originalFileKey: input.fileKey,
      originalFilename: input.filename,
      originalMimeType: input.mimeType,
      structureMap: mapResult.map as any,
      metadataFacts: parsed.facts as any,
    } as any,
  });

  await insertStructuredQuestions(db, tenantId, created.id, parsed.questions);

  const status = mapResult.failedSheets.length > 0 ? "partial" : "completed";

  // Snapshot progress once (Promise.allSettled has already returned,
  // so no further updates are in flight) and stamp the final summary.
  const finalProgress = await readProgress(jobId);
  await prisma.questionnaireImportJob.update({
    where: { id: jobId },
    data: {
      status,
      sourceFormat: sourceFormat as any,
      questionnaireId: created.id,
      completedAt: new Date(),
      errorCode: status === "partial" ? "SOME_SHEETS_FAILED" : null,
      errorMessage:
        status === "partial"
          ? `${mapResult.failedSheets.length} sheet(s) could not be understood and were skipped: ${mapResult.failedSheets
              .map((s) => s.sheetName)
              .join(", ")}.`
          : null,
      progress: {
        phase: "persisting",
        totalSheets: finalProgress.totalSheets,
        completedSheets: finalProgress.completedSheets,
        failedSheets: mapResult.failedSheets.length,
        sheets: finalProgress.sheets,
        elapsedMs: Date.now() - t0,
      } as any,
    },
  });
}

// ─── Helpers ───────────────────────────────────────────────────────

async function downloadOriginalToBuffer(key: string): Promise<Buffer> {
  const dl = await storage.download(key);
  const reader = dl.data.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  let total = 0;
  for (const c of chunks) total += c.byteLength;
  const out = Buffer.alloc(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

async function listXlsxSheetNames(buffer: Buffer): Promise<string[]> {
  // Light parse just to learn the sheet names — `listSheets` reads
  // `xl/workbook.xml` directly via JSZip without instantiating a full
  // ExcelJS workbook, so it's cheap enough to call before the
  // structure agent re-parses the file in earnest.
  try {
    const sheets = await listSheets(buffer);
    return sheets.map((s) => s.name);
  } catch {
    return [];
  }
}

async function readProgress(jobId: string): Promise<JobProgress> {
  const row = await prisma.questionnaireImportJob.findUnique({
    where: { id: jobId },
    select: { progress: true },
  });
  return ((row?.progress as any) ?? EMPTY_PROGRESS) as JobProgress;
}

async function updateProgress(
  jobId: string,
  mutate: (current: JobProgress) => JobProgress,
): Promise<void> {
  const current = await readProgress(jobId);
  const next = mutate(current);
  await prisma.questionnaireImportJob.update({
    where: { id: jobId },
    data: { progress: next as any },
  });
}

function mergeSheetEvent(progress: JobProgress, event: SheetProgress): JobProgress {
  const sheets = [...progress.sheets];
  const idx = sheets.findIndex((s) => s.name === event.sheetName);
  const existing: SheetProgressRow =
    idx >= 0 ? sheets[idx]! : { name: event.sheetName, status: "pending" };

  let next: SheetProgressRow;
  if (event.phase === "running") {
    next = { ...existing, status: "running" };
  } else if (event.phase === "completed") {
    next = {
      ...existing,
      status: "completed",
      kind: event.kind,
      questionCount: event.questionCount,
      durationMs: event.durationMs,
      mode: event.mode,
    };
  } else {
    next = {
      ...existing,
      status: "failed",
      durationMs: event.durationMs,
      error: event.reason,
    };
  }

  if (idx >= 0) sheets[idx] = next;
  else sheets.push(next);

  const completedSheets = sheets.filter((s) => s.status === "completed").length;
  const failedSheets = sheets.filter((s) => s.status === "failed").length;

  return {
    ...progress,
    sheets,
    completedSheets,
    failedSheets,
  };
}

async function insertStructuredQuestions(
  db: TenantPrisma,
  tenantId: string,
  questionnaireId: string,
  qs: ParsedQuestion[],
): Promise<void> {
  const keyToId = new Map<string, string>();
  let seq = 1;

  // Topological order so parent links resolve before children insert.
  const ordered = topologicalSort(qs);

  for (const q of ordered) {
    const parentId = q.parentKey ? (keyToId.get(q.parentKey) ?? null) : null;
    const created = await db.question.create({
      data: {
        tenantId,
        questionnaireId,
        sequenceNumber: seq++,
        sectionTitle: q.sectionTitle,
        questionText: q.questionText,
        questionType: inferQuestionType(q.questionText),
        choices: [],
        originalRow: q.originalRow,
        sourceRowIndex: q.sourceRowIndex,
        sourceSheetName: q.sourceSheetName,
        sourceTableIndex: q.sourceTableIndex ?? null,
        answerCellA1: q.answerCellA1,
        parentQuestionId: parentId,
        contextLabels: q.contextLabels,
      } as any,
    });
    keyToId.set(q.key, created.id);
  }
}

function topologicalSort(qs: ParsedQuestion[]): ParsedQuestion[] {
  const byKey = new Map(qs.map((q) => [q.key, q]));
  const out: ParsedQuestion[] = [];
  const seen = new Set<string>();
  const visit = (q: ParsedQuestion) => {
    if (seen.has(q.key)) return;
    if (q.parentKey) {
      const p = byKey.get(q.parentKey);
      if (p && !seen.has(p.key)) visit(p);
    }
    seen.add(q.key);
    out.push(q);
  };
  for (const q of qs) visit(q);
  return out;
}

async function markJobTerminalFailure(jobId: string, err: unknown): Promise<void> {
  const message =
    err instanceof AIProviderError
      ? err.publicMessage
      : err instanceof StructureAgentError
        ? "We could not understand the structure of this file. It may be in an unsupported layout, or the AI service may be temporarily unavailable."
        : "Import failed unexpectedly. Please try again or contact support.";
  const code =
    err instanceof AIProviderError
      ? `AI_PROVIDER_${err.kind.toUpperCase()}`
      : err instanceof StructureAgentError
        ? "STRUCTURE_AGENT_FAILED"
        : "INTERNAL_ERROR";
  await prisma.questionnaireImportJob.update({
    where: { id: jobId },
    data: {
      status: "failed",
      completedAt: new Date(),
      errorCode: code,
      errorMessage: message,
    },
  });
}
