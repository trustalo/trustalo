/**
 * /api/v1/questionnaires — Phase 6 (AI accelerators).
 *
 * Workspace endpoints for security questionnaires (CAIQ / SIG / custom CSV / xlsx / docx):
 *
 *   POST   /                                          create from CSV string OR
 *                                                     uploaded .csv/.xlsx/.xls/.docx.
 *                                                     xlsx/docx imports run through
 *                                                     the structure agent (LLM) so
 *                                                     multi-sheet, dual-answer-column,
 *                                                     and matrix layouts are handled
 *                                                     correctly. CSV uses heuristics.
 *   GET    /                                          list
 *   GET    /:id                                       detail (questions + answers + sheets)
 *   PATCH  /:id                                       rename / move status / set vendor
 *   DELETE /:id                                       delete
 *
 *   POST   /:id/answer-all                            bulk AI answer
 *   POST   /:id/questions/:qid/answer                 single AI answer
 *   PATCH  /:id/questions/:qid/answer                 approve / edit / reject
 *
 *   GET    /:id/export.csv                            CSV round-trip (always works)
 *   GET    /:id/export.xlsx                           XLSX round-trip — re-opens the
 *                                                     uploaded original from storage
 *                                                     and writes answers to the exact
 *                                                     A1 cells the structure agent
 *                                                     identified at import time.
 *   GET    /:id/export.docx                           DOCX round-trip (table-mode only).
 *
 * The `?include=` query string controls which answers get exported:
 *   approved (default) — only `status=approved` answers are written.
 *   all                — also includes drafts.
 */

import { randomUUID } from "node:crypto";
import { createStorageProvider } from "@trustalo/storage";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma, prismaWithTenant } from "../../db/prisma.js";
import { authorizeResource } from "../../middleware/authorize.js";
import { audit } from "../../lib/audit.js";
import { serializeCsv, detectColumns } from "./csv.js";
import { type WorkbookMap } from "./structure-agent.js";
import { runImportJob } from "./import-job.js";
import {
  answerAll,
  answerOne,
  QuestionNotFoundError,
  QuestionnaireNotFoundError,
} from "./answer.js";
import { writeXlsx, writeDocx, type AnswerCell } from "./writer.js";

export const questionnairesRouter: Router = Router();
questionnairesRouter.use(authorizeResource("vendors:read", "vendors:write"));

const idParams = z.object({ id: z.string().min(1) });
const subIdParams = z.object({ id: z.string().min(1), qid: z.string().min(1) });

// ─── Storage ──────────────────────────────────────────────────────

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

const storage = createStorageProvider({
  provider: (process.env.STORAGE_PROVIDER as "s3") || "s3",
  region: process.env.AWS_REGION || "us-east-1",
  bucket: process.env.S3_BUCKET || "trustalo-files",
  endpoint: process.env.S3_ENDPOINT || undefined,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || undefined,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || undefined,
});

const MIME_BY_EXT: Record<string, string> = {
  csv: "text/csv",
  txt: "text/plain",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// ─── Create from CSV string OR uploaded file ──────────────────────

const formatHint = z.enum(["csv", "caiq", "sig", "xlsx", "docx", "custom"]).optional();

const createMetaBody = z.object({
  name: z.string().min(1).max(200),
  requester: z.string().max(200).optional(),
  vendorId: z.string().optional(),
  dueDate: z.string().optional(),
  formatHint,
});

const createCsvBody = createMetaBody.extend({
  csv: z.string().min(1),
});

/**
 * Async import: this endpoint never blocks on the structure agent.
 *
 * Why async:
 *   xlsx/docx imports run an LLM call per sheet (parallelised in
 *   `structure-agent.ts`). On a 5-sheet workbook even the parallel
 *   path takes 30–60 s, well past ALB / browser timeout limits and
 *   far too long to leave the user staring at a spinner.
 *
 * Flow:
 *   1. Validate metadata + file/CSV body.
 *   2. (file uploads only) push the original blob straight to S3 so
 *      the worker can pull it back. We do this here — not in the
 *      worker — because the multer buffer dies with the request.
 *   3. Insert a `QuestionnaireImportJob` row in `pending`.
 *   4. Schedule the runner via `setImmediate` (in-process worker).
 *      The job table is the contract; swapping in BullMQ later
 *      doesn't change the API.
 *   5. Return `202 Accepted` with `{ jobId }`. The web client polls
 *      `GET /jobs/:jobId` for status + per-sheet progress.
 *
 * Response codes:
 *   202 — job created, polling can begin.
 *   400 — body validation failed (no file/csv, bad metadata, …).
 */
questionnairesRouter.post("/", upload.single("file"), async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;

    const meta = createMetaBody.parse(req.body);

    let originalFileKey: string | null = null;
    let originalFilename: string | null = null;
    let originalMimeType: string | null = null;
    let csvBody: string | null = null;

    if (req.file) {
      const ext = req.file.originalname.split(".").pop()?.toLowerCase() ?? "bin";
      const allowedExts = ["csv", "txt", "xlsx", "xls", "docx"];
      if (!allowedExts.includes(ext)) {
        return next(
          Object.assign(
            new Error(`Unsupported file type: .${ext}. Use .csv, .xlsx, .xls or .docx`),
            { status: 400 },
          ),
        );
      }

      // Lightweight files (CSV) skip object storage — we keep the
      // body inline on the job row and re-parse in the worker.
      if (ext === "csv" || ext === "txt") {
        csvBody = req.file.buffer.toString("utf-8");
      } else {
        originalFileKey = `questionnaires/${tenantId}/${randomUUID()}/original.${ext}`;
        originalFilename = req.file.originalname;
        originalMimeType = req.file.mimetype || MIME_BY_EXT[ext] || "application/octet-stream";
        await storage.upload(originalFileKey, req.file.buffer, {
          contentType: originalMimeType,
          metadata: { tenantId, originalFilename },
        });
      }
    } else {
      const body = createCsvBody.parse(req.body);
      csvBody = body.csv;
    }

    if (!csvBody && !originalFileKey) {
      return next(
        Object.assign(new Error("Provide either a file upload or a 'csv' body"), {
          status: 400,
        }),
      );
    }

    const requester = meta.requester?.trim() || null;
    const vendorId = meta.vendorId?.trim() || null;
    const dueDateStr = meta.dueDate?.trim() || null;

    const job = await prisma.questionnaireImportJob.create({
      data: {
        tenantId,
        name: meta.name,
        requester,
        vendorId,
        dueDate: dueDateStr ? new Date(dueDateStr) : null,
        formatHint: meta.formatHint ?? null,
        originalFileKey,
        originalFilename,
        originalMimeType,
        csvBody,
        createdById: userId,
        status: "pending",
        progress: {
          phase: "queued",
          totalSheets: 0,
          completedSheets: 0,
          failedSheets: 0,
          sheets: [],
        },
      } as any,
    });

    await audit(req, "create", "QuestionnaireImportJob", job.id, {
      name: meta.name,
      hasFile: Boolean(req.file),
      uploadedFilename: req.file?.originalname,
    });

    // Fire-and-forget the runner. Errors inside `runImportJob` are
    // captured into the job row, so we don't await it here.
    setImmediate(() => {
      runImportJob(job.id).catch((err) => {
        console.error(`[import-job] uncaught failure for ${job.id}:`, err);
      });
    });

    res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Job polling ──────────────────────────────────────────────────

/**
 * Poll for an import job's progress. The web client hits this every
 * 1–2 s while a job is `pending` or `running`, and stops once the
 * job reaches a terminal state (`completed`, `partial`, `failed`).
 *
 * Public payload is intentionally lean — internal stack traces and
 * raw SDK responses never leave this route. See the central error
 * handler + AIProviderError for the scrubbing contract.
 */
questionnairesRouter.get("/jobs/:jobId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const jobId = z.string().min(1).parse(req.params.jobId);
    const db = prismaWithTenant(tenantId);

    const job = await db.questionnaireImportJob.findUnique({
      where: { id: jobId },
    });
    if (!job) {
      return next(Object.assign(new Error("Import job not found"), { status: 404 }));
    }

    res.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        name: job.name,
        sourceFormat: job.sourceFormat,
        questionnaireId: job.questionnaireId,
        progress: job.progress ?? {
          phase: "queued",
          totalSheets: 0,
          completedSheets: 0,
          failedSheets: 0,
          sheets: [],
        },
        errorCode: job.errorCode,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── List ─────────────────────────────────────────────────────────

questionnairesRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const rows = await db.questionnaire.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { id: true, name: true } },
        importedBy: { select: { id: true, name: true, email: true } },
        _count: { select: { questions: true, answers: true } },
      },
    });

    const ids = rows.map((r) => r.id);
    const grouped = ids.length
      ? await db.answer.groupBy({
          by: ["questionnaireId", "status"],
          where: { questionnaireId: { in: ids } },
          _count: { _all: true },
        })
      : [];

    const progress = new Map<
      string,
      { approved: number; draft: number; pending: number; rejected: number }
    >();
    for (const id of ids) {
      progress.set(id, { approved: 0, draft: 0, pending: 0, rejected: 0 });
    }
    for (const g of grouped) {
      const p = progress.get(g.questionnaireId);
      if (p) p[g.status] = g._count._all;
    }

    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        sourceFormat: r.sourceFormat,
        requester: r.requester,
        vendor: r.vendor,
        importedBy: r.importedBy,
        dueDate: r.dueDate,
        status: r.status,
        questionCount: r._count.questions,
        answerCount: r._count.answers,
        progress: progress.get(r.id) ?? { approved: 0, draft: 0, pending: 0, rejected: 0 },
        roundTrippable: Boolean(r.originalFileKey),
        originalFilename: r.originalFilename,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ─── Detail ───────────────────────────────────────────────────────

questionnairesRouter.get("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const q = await db.questionnaire.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, name: true } },
        importedBy: { select: { id: true, name: true, email: true } },
        questions: {
          orderBy: { sequenceNumber: "asc" },
          include: {
            answers: {
              include: {
                reviewedBy: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });
    if (!q) return next(Object.assign(new Error("Questionnaire not found"), { status: 404 }));

    // Build per-sheet sheet groups for the sheet-tabbed UI.
    const sheets = buildSheetGroups(q);

    res.json({
      success: true,
      data: {
        ...q,
        roundTrippable: Boolean(q.originalFileKey),
        sheets,
      },
    });
  } catch (err) {
    next(err);
  }
});

interface SheetGroup {
  sheetName: string;
  /** From structureMap when present; otherwise inferred. */
  kind: "metadata" | "instructions" | "question_table" | "matrix" | "csv";
  questionCount: number;
  facts: Array<{ label: string; answerCellA1: string; value?: string }>;
}

function buildSheetGroups(q: any): SheetGroup[] {
  const facts = (q.metadataFacts ?? []) as Array<{
    label: string;
    answerCellA1: string;
    value?: string;
    sourceSheetName: string;
  }>;
  const map = q.structureMap as WorkbookMap | null;

  const counts = new Map<string, number>();
  for (const qq of q.questions) {
    const name = qq.sourceSheetName ?? "Sheet 1";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const groups: SheetGroup[] = [];
  if (map) {
    for (const sheet of map.sheets) {
      groups.push({
        sheetName: sheet.sheetName,
        kind: sheet.kind,
        questionCount: counts.get(sheet.sheetName) ?? 0,
        facts: facts
          .filter((f) => f.sourceSheetName === sheet.sheetName)
          .map((f) => ({ label: f.label, answerCellA1: f.answerCellA1, value: f.value })),
      });
    }
  } else {
    // CSV / legacy import: synthesize a single group so the UI can
    // render uniformly.
    const seen = new Set<string>();
    for (const qq of q.questions) {
      const name = qq.sourceSheetName ?? "Sheet 1";
      if (seen.has(name)) continue;
      seen.add(name);
      groups.push({
        sheetName: name,
        kind: "csv",
        questionCount: counts.get(name) ?? 0,
        facts: [],
      });
    }
    if (groups.length === 0) {
      groups.push({ sheetName: "Sheet 1", kind: "csv", questionCount: 0, facts: [] });
    }
  }
  return groups;
}

// ─── Update ───────────────────────────────────────────────────────

const patchBody = z.object({
  name: z.string().min(1).max(200).optional(),
  requester: z.string().max(200).nullable().optional(),
  vendorId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  status: z.enum(["draft", "in_progress", "completed", "exported"]).optional(),
});

questionnairesRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = patchBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const updated = await db.questionnaire.update({
      where: { id },
      data: {
        name: body.name,
        requester: body.requester ?? undefined,
        vendorId: body.vendorId ?? undefined,
        dueDate: body.dueDate === null ? null : body.dueDate ? new Date(body.dueDate) : undefined,
        status: body.status,
      },
    });

    await audit(req, "update", "Questionnaire", id, body);

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── Delete ───────────────────────────────────────────────────────

questionnairesRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const existing = await db.questionnaire.findUnique({
      where: { id },
      select: { originalFileKey: true },
    });
    await db.questionnaire.delete({ where: { id } });
    if (existing?.originalFileKey) {
      try {
        await storage.delete(existing.originalFileKey);
      } catch {
        /* file may not exist */
      }
    }
    await audit(req, "delete", "Questionnaire", id);

    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

// ─── Bulk AI answer ───────────────────────────────────────────────

questionnairesRouter.post("/:id/answer-all", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);

    const result = await answerAll({ tenantId, questionnaireId: id });

    await audit(req, "create", "QuestionnaireAIBulkAnswer", id, {
      total: result.total,
      answered: result.answered,
      failures: result.failures.length,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof QuestionnaireNotFoundError) {
      return next(Object.assign(new Error(err.message), { status: 404 }));
    }
    next(err);
  }
});

// ─── Per-question AI answer (regenerate) ──────────────────────────

questionnairesRouter.post("/:id/questions/:qid/answer", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id, qid } = subIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const result = await answerOne({ tenantId, questionId: qid });

    const saved = await db.answer.upsert({
      where: { questionId: qid },
      update: {
        content: result.draft,
        status: result.draft ? "draft" : "pending",
        generatedByAi: true,
        aiConfidence: result.confidence,
        aiSources: result.sources,
        aiModel: result.modelUsed,
        reviewedById: null,
        reviewedAt: null,
      },
      create: {
        tenantId,
        questionnaireId: id,
        questionId: qid,
        content: result.draft,
        status: result.draft ? "draft" : "pending",
        generatedByAi: true,
        aiConfidence: result.confidence,
        aiSources: result.sources,
        aiModel: result.modelUsed,
      },
    });

    await audit(req, "create", "QuestionnaireAIAnswer", saved.id, {
      questionId: qid,
      confidence: result.confidence,
      modelUsed: result.modelUsed,
    });

    res.json({ success: true, data: saved });
  } catch (err) {
    if (err instanceof QuestionNotFoundError) {
      return next(Object.assign(new Error(err.message), { status: 404 }));
    }
    next(err);
  }
});

// ─── Approve / edit / reject answer ──────────────────────────────

const reviewBody = z.object({
  content: z.string().optional(),
  status: z.enum(["approved", "rejected", "draft"]).optional(),
});

questionnairesRouter.patch("/:id/questions/:qid/answer", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { id, qid } = subIdParams.parse(req.params);
    const body = reviewBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    if (!body.content && !body.status) {
      return next(Object.assign(new Error("Nothing to update"), { status: 400 }));
    }

    const reviewing = body.status === "approved" || body.status === "rejected";

    const updated = await db.answer.upsert({
      where: { questionId: qid },
      update: {
        content: body.content,
        status: body.status,
        reviewedById: reviewing ? userId : undefined,
        reviewedAt: reviewing ? new Date() : undefined,
      },
      create: {
        tenantId,
        questionnaireId: id,
        questionId: qid,
        content: body.content ?? "",
        status: body.status ?? "draft",
        reviewedById: reviewing ? userId : undefined,
        reviewedAt: reviewing ? new Date() : undefined,
        generatedByAi: false,
      },
    });

    if (reviewing) {
      await audit(
        req,
        body.status === "approved" ? "approve" : "reject",
        "QuestionnaireAnswer",
        updated.id,
        {
          questionId: qid,
        },
      );
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── Export ───────────────────────────────────────────────────────

const exportQuery = z.object({
  include: z.enum(["approved", "all"]).default("approved"),
});

questionnairesRouter.get("/:id/export.csv", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const { include } = exportQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const q = await db.questionnaire.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { sequenceNumber: "asc" },
          include: { answers: true },
        },
      },
    });
    if (!q) return next(Object.assign(new Error("Questionnaire not found"), { status: 404 }));

    const rawHeaders = Array.isArray(q.headers) ? (q.headers as string[]) : [];
    const cols = detectColumns(rawHeaders);
    const baseHeaders = rawHeaders.length > 0 ? [...rawHeaders] : ["Sheet", "Question", "Context"];
    const headers = [...baseHeaders];
    if (!cols.answerColumn) {
      headers.push("Answer", "AnswerStatus", "AIConfidence");
    } else {
      headers.push("AnswerStatus", "AIConfidence");
    }

    const rows = q.questions.map((qq) => {
      const original = (qq.originalRow as Record<string, unknown>) ?? {};
      const row: Record<string, unknown> =
        rawHeaders.length > 0
          ? { ...original }
          : {
              Sheet: qq.sourceSheetName ?? "",
              Question: qq.questionText,
              Context: JSON.stringify(qq.contextLabels ?? {}),
            };
      const answer = qq.answers[0];
      const useAnswer = pickAnswerForExport(answer, include);
      const targetCol = cols.answerColumn ?? "Answer";
      row[targetCol] = useAnswer?.content ?? "";
      row.AnswerStatus = answer?.status ?? "pending";
      row.AIConfidence = answer?.aiConfidence == null ? "" : answer.aiConfidence.toFixed(2);
      return row;
    });

    const csv = serializeCsv(headers, rows);

    await db.questionnaire.update({ where: { id }, data: { status: "exported" } });
    await audit(req, "export", "Questionnaire", id, {
      rowCount: rows.length,
      format: "csv",
      include,
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${sanitizeFilename(q.name)}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

questionnairesRouter.get("/:id/export.xlsx", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const { include } = exportQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const q = await db.questionnaire.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { sequenceNumber: "asc" },
          include: { answers: true },
        },
      },
    });
    if (!q) return next(Object.assign(new Error("Questionnaire not found"), { status: 404 }));

    if (!q.originalFileKey) {
      return next(
        Object.assign(
          new Error(
            "This questionnaire was not imported from an .xlsx file with round-trip support. Use export.csv instead.",
          ),
          { status: 400 },
        ),
      );
    }

    // Group answers by sheet using the structure-agent A1 refs.
    interface SheetAcc {
      sheetName: string;
      answers: AnswerCell[];
    }
    const bySheet = new Map<string, SheetAcc>();

    for (const qq of q.questions) {
      const a1 = (qq as any).answerCellA1 as string | null;
      const sheetName = qq.sourceSheetName;
      if (!a1 || !sheetName) continue;
      const a = qq.answers[0];
      const picked = pickAnswerForExport(a, include);
      if (!picked) continue;

      const acc = bySheet.get(sheetName) ?? { sheetName, answers: [] as AnswerCell[] };
      acc.answers.push({ a1, content: picked.content });
      bySheet.set(sheetName, acc);
    }

    // Also re-emit cover-page metadata facts so the customer sees
    // their own form filled in.
    const facts =
      ((q as any).metadataFacts as Array<{
        label: string;
        answerCellA1: string;
        value?: string;
        sourceSheetName: string;
      }> | null) ?? [];
    for (const f of facts) {
      if (!f.value) continue; // don't overwrite if we don't have a value
      const acc = bySheet.get(f.sourceSheetName) ?? {
        sheetName: f.sourceSheetName,
        answers: [] as AnswerCell[],
      };
      acc.answers.push({ a1: f.answerCellA1, content: f.value });
      bySheet.set(f.sourceSheetName, acc);
    }

    if (bySheet.size === 0) {
      return next(
        Object.assign(
          new Error(
            "No questions with round-trip metadata. The file may have been imported before structure-agent support — re-import to enable xlsx round-trip.",
          ),
          { status: 400 },
        ),
      );
    }

    const buffer = await downloadOriginalToBuffer(q.originalFileKey);

    const result = await writeXlsx({
      buffer,
      sheets: Array.from(bySheet.values()),
    });

    await db.questionnaire.update({ where: { id }, data: { status: "exported" } });
    await audit(req, "export", "Questionnaire", id, {
      format: "xlsx",
      include,
      written: result.written,
      skipped: result.skipped,
      bySheet: result.bySheet,
    });

    const filename = sanitizeFilename(q.name) + ".xlsx";
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(result.buffer);
  } catch (err) {
    next(err);
  }
});

questionnairesRouter.get("/:id/export.docx", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const { include } = exportQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const q = await db.questionnaire.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { sequenceNumber: "asc" },
          include: { answers: true },
        },
      },
    });
    if (!q) return next(Object.assign(new Error("Questionnaire not found"), { status: 404 }));

    if (!q.originalFileKey || q.sourceFormat !== "docx") {
      return next(
        Object.assign(
          new Error(
            "This questionnaire was not imported from a table-mode .docx. Use export.csv instead.",
          ),
          { status: 400 },
        ),
      );
    }

    interface TableAcc {
      tableIndex: number;
      answers: AnswerCell[];
    }
    const byTable = new Map<number, TableAcc>();

    for (const qq of q.questions) {
      const a1 = (qq as any).answerCellA1 as string | null;
      const ti = qq.sourceTableIndex;
      if (!a1 || ti == null) continue;
      const a = qq.answers[0];
      const picked = pickAnswerForExport(a, include);
      if (!picked) continue;

      const acc = byTable.get(ti) ?? { tableIndex: ti, answers: [] as AnswerCell[] };
      acc.answers.push({ a1, content: picked.content });
      byTable.set(ti, acc);
    }

    if (byTable.size === 0) {
      return next(
        Object.assign(new Error("Round-trip metadata missing. Re-import the questionnaire."), {
          status: 400,
        }),
      );
    }

    const buffer = await downloadOriginalToBuffer(q.originalFileKey);

    const result = await writeDocx({
      buffer,
      tables: Array.from(byTable.values()),
    });

    await db.questionnaire.update({ where: { id }, data: { status: "exported" } });
    await audit(req, "export", "Questionnaire", id, {
      format: "docx",
      include,
      written: result.written,
      skipped: result.skipped,
      byTable: result.byTable,
    });

    const filename = sanitizeFilename(q.name) + ".docx";
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(result.buffer);
  } catch (err) {
    next(err);
  }
});

// ─── Helpers ──────────────────────────────────────────────────────

interface AnswerLike {
  status: string;
  content: string;
}

function pickAnswerForExport(
  answer: AnswerLike | undefined,
  include: "approved" | "all",
): AnswerLike | null {
  if (!answer) return null;
  if (!answer.content || answer.content.trim().length === 0) return null;
  if (include === "approved" && answer.status !== "approved") return null;
  return answer;
}

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

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 80) || "questionnaire";
}
