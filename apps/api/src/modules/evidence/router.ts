import { Router } from "express";
import { z } from "zod";
import { prisma, prismaWithTenant } from "../../db/prisma.js";
import { Prisma } from "../../../generated/prisma/client/index.js";
import { authorizeResource, authorize } from "../../middleware/authorize.js";
import { createStorageProvider } from "@trustalo/storage";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const storage = createStorageProvider({
  provider: (process.env.STORAGE_PROVIDER as "s3") || "s3",
  region: process.env.AWS_REGION || "us-east-1",
  bucket: process.env.S3_BUCKET || "trustalo-files",
  endpoint: process.env.S3_ENDPOINT || undefined,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || undefined,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || undefined,
});

const evidenceType = z.enum(["document", "screenshot", "link", "automated", "attestation"]);
const evidenceApprovalStatus = z.enum([
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "expired",
  "stale",
]);
const renewalFrequency = z.enum(["once", "monthly", "quarterly", "semi_annually", "annually"]);

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  controlId: z.string().min(1).optional(),
  status: evidenceApprovalStatus.optional(),
  type: evidenceType.optional(),
  search: z.string().optional(),
  expiring: z.coerce.boolean().optional(),
  expired: z.coerce.boolean().optional(),
});

const idParams = z.object({ id: z.string().min(1) });

const createBody = z.object({
  controlId: z.string().min(1, "Control is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  type: evidenceType.default("document"),
  status: evidenceApprovalStatus.default("draft"),
  fileKey: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.number().int().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  externalUrl: z.string().url().nullable().optional(),
  sourceType: z.string().nullable().optional(),
  sourceId: z.string().nullable().optional(),
  validFrom: z.coerce.date().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  renewalFrequency: renewalFrequency.nullable().optional(),
  reminderDaysBefore: z.number().int().min(1).max(365).default(30),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

const updateBody = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  type: evidenceType.optional(),
  status: evidenceApprovalStatus.optional(),
  fileKey: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.number().int().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  externalUrl: z.string().url().nullable().optional(),
  validFrom: z.coerce.date().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  renewalFrequency: renewalFrequency.nullable().optional(),
  reminderDaysBefore: z.number().int().min(1).max(365).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

const reviewBody = z.object({
  action: z.enum(["approve", "reject"]),
  reviewNotes: z.string().nullable().optional(),
});

const evidenceInclude = {
  submittedBy: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true, email: true } },
  control: { select: { id: true, title: true, status: true, category: true } },
} as const;

function computeNextRenewalDate(from: Date, frequency: string): Date {
  const next = new Date(from);
  switch (frequency) {
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    case "semi_annually":
      next.setMonth(next.getMonth() + 6);
      break;
    case "annually":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      break;
  }
  return next;
}

export const evidenceRouter: Router = Router();
evidenceRouter.use(authorizeResource("evidence:read", "evidence:write"));

// ─── List evidence (org-wide or filtered by control) ─────────
evidenceRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = listQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {};
    if (query.controlId) where.controlId = query.controlId;
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { fileName: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const now = new Date();
    if (query.expired) {
      where.expiresAt = { lt: now };
      where.status = { not: "expired" };
    }
    if (query.expiring) {
      const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      where.expiresAt = { gte: now, lte: thirtyDaysOut };
      where.status = { notIn: ["expired", "stale", "rejected"] };
    }

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      db.evidence.findMany({
        where,
        include: evidenceInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      db.evidence.count({ where }),
    ]);

    res.json({ success: true, data: { items, total, page: query.page, limit: query.limit } });
  } catch (err) {
    next(err);
  }
});

// ─── Evidence health summary for the org ─────────────────────
evidenceRouter.get("/health", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    const now = new Date();
    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [total, approved, expired, expiringSoon, pendingReview, draft, rejected] =
      await Promise.all([
        db.evidence.count(),
        db.evidence.count({
          where: { status: "approved", OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
        }),
        db.evidence.count({
          where: {
            OR: [
              { status: "expired" },
              { AND: [{ expiresAt: { lt: now } }, { status: { not: "expired" } }] },
            ],
          },
        }),
        db.evidence.count({
          where: {
            expiresAt: { gte: now, lte: thirtyDaysOut },
            status: { notIn: ["expired", "stale", "rejected"] },
          },
        }),
        db.evidence.count({ where: { status: "pending_review" } }),
        db.evidence.count({ where: { status: "draft" } }),
        db.evidence.count({ where: { status: "rejected" } }),
      ]);

    res.json({
      success: true,
      data: { total, approved, expired, expiringSoon, pendingReview, draft, rejected },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Run expiration check and update statuses ────────────────
evidenceRouter.post("/check-expirations", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const now = new Date();

    const expired = await prisma.evidence.updateMany({
      where: {
        tenantId,
        expiresAt: { lt: now },
        status: { in: ["approved", "pending_review", "draft"] },
      },
      data: { status: "expired" },
    });

    const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoon = await prisma.evidence.findMany({
      where: {
        tenantId,
        expiresAt: { gte: now, lte: thirtyDaysOut },
        status: "approved",
        OR: [
          { lastReminderSentAt: null },
          { lastReminderSentAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        ],
      },
      include: {
        control: { select: { id: true, title: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (expiringSoon.length > 0) {
      await prisma.evidence.updateMany({
        where: { id: { in: expiringSoon.map((e) => e.id) } },
        data: { lastReminderSentAt: now },
      });
    }

    res.json({
      success: true,
      data: {
        markedExpired: expired.count,
        remindersQueued: expiringSoon.length,
        reminderDetails: expiringSoon.map((e) => ({
          evidenceId: e.id,
          title: e.title,
          controlTitle: e.control.title,
          expiresAt: e.expiresAt,
          submittedBy: e.submittedBy,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Get single evidence ─────────────────────────────────────
evidenceRouter.get("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const evidence = await db.evidence.findUnique({ where: { id }, include: evidenceInclude });
    if (!evidence) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Evidence not found" } });
      return;
    }
    res.json({ success: true, data: evidence });
  } catch (err) {
    next(err);
  }
});

// ─── Create evidence ─────────────────────────────────────────
evidenceRouter.post("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const body = createBody.parse(req.body);

    const control = await prisma.control.findFirst({
      where: { id: body.controlId, tenantId },
    });
    if (!control) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Control not found" } });
      return;
    }

    let nextRenewalDate: Date | null = null;
    if (body.renewalFrequency && body.renewalFrequency !== "once") {
      const base = body.expiresAt || body.validFrom || new Date();
      nextRenewalDate = computeNextRenewalDate(base, body.renewalFrequency);
    }

    const evidence = await prisma.evidence.create({
      data: {
        tenantId,
        controlId: body.controlId,
        title: body.title,
        description: body.description ?? null,
        type: body.type,
        status: body.status,
        fileKey: body.fileKey ?? null,
        fileName: body.fileName ?? null,
        fileSize: body.fileSize ?? null,
        mimeType: body.mimeType ?? null,
        externalUrl: body.externalUrl ?? null,
        sourceType: body.sourceType ?? "manual",
        sourceId: body.sourceId ?? null,
        validFrom: body.validFrom || new Date(),
        expiresAt: body.expiresAt ?? null,
        renewalFrequency: body.renewalFrequency ?? null,
        nextRenewalDate,
        reminderDaysBefore: body.reminderDaysBefore,
        submittedById: userId,
        tags: body.tags,
        // Zod's parsed `metadata` is `Record<string, unknown> | undefined`,
        // which is structurally a Prisma `InputJsonValue` but not assignable
        // without an explicit cast (Prisma 7 narrowed the type).
        metadata: body.metadata as Prisma.InputJsonValue | undefined,
      },
      include: evidenceInclude,
    });

    res.status(201).json({ success: true, data: evidence });
  } catch (err) {
    next(err);
  }
});

// ─── Update evidence ─────────────────────────────────────────
evidenceRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = updateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.evidence.findUnique({ where: { id } });
    if (!existing) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Evidence not found" } });
      return;
    }

    const updateData: Record<string, unknown> = { ...body };

    const freq = body.renewalFrequency ?? existing.renewalFrequency;
    if (freq && freq !== "once") {
      const base = body.expiresAt ?? existing.expiresAt ?? body.validFrom ?? existing.validFrom;
      updateData.nextRenewalDate = computeNextRenewalDate(new Date(base as string | Date), freq);
    }

    const evidence = await db.evidence.update({
      where: { id },
      data: updateData,
      include: evidenceInclude,
    });

    res.json({ success: true, data: evidence });
  } catch (err) {
    next(err);
  }
});

// ─── Review (approve / reject) ───────────────────────────────
evidenceRouter.post("/:id/review", authorize("evidence:approve"), async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const reviewerId = (req as any).auth.userId as string;
    const { id } = idParams.parse(req.params);
    const { action, reviewNotes } = reviewBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.evidence.findUnique({ where: { id } });
    if (!existing) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Evidence not found" } });
      return;
    }

    if (!["draft", "pending_review", "rejected", "stale"].includes(existing.status)) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATE",
          message: `Cannot review evidence in '${existing.status}' state`,
        },
      });
      return;
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    const evidence = await db.evidence.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes ?? null,
      },
      include: evidenceInclude,
    });

    res.json({ success: true, data: evidence });
  } catch (err) {
    next(err);
  }
});

// ─── Renew evidence ──────────────────────────────────────────
evidenceRouter.post("/:id/renew", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const existing = await db.evidence.findUnique({ where: { id } });
    if (!existing) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Evidence not found" } });
      return;
    }

    const now = new Date();
    let newExpiresAt: Date | null = null;
    let newNextRenewalDate: Date | null = null;

    if (existing.renewalFrequency && existing.renewalFrequency !== "once") {
      newExpiresAt = computeNextRenewalDate(now, existing.renewalFrequency);
      newNextRenewalDate = computeNextRenewalDate(newExpiresAt, existing.renewalFrequency);
    }

    const evidence = await db.evidence.update({
      where: { id },
      data: {
        status: "approved",
        collectedAt: now,
        validFrom: now,
        expiresAt: newExpiresAt,
        nextRenewalDate: newNextRenewalDate,
        lastReminderSentAt: null,
        reviewedAt: null,
        reviewedById: null,
        reviewNotes: null,
      },
      include: evidenceInclude,
    });

    res.json({ success: true, data: evidence });
  } catch (err) {
    next(err);
  }
});

// ─── Submit for review ───────────────────────────────────────
evidenceRouter.post("/:id/submit", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const existing = await db.evidence.findUnique({ where: { id } });
    if (!existing) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Evidence not found" } });
      return;
    }

    if (!["draft", "rejected"].includes(existing.status)) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATE",
          message: `Cannot submit evidence in '${existing.status}' state`,
        },
      });
      return;
    }

    const evidence = await db.evidence.update({
      where: { id },
      data: { status: "pending_review" },
      include: evidenceInclude,
    });

    res.json({ success: true, data: evidence });
  } catch (err) {
    next(err);
  }
});

// ─── Upload file for evidence ────────────────────────────────
evidenceRouter.post("/:id/upload", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const existing = await db.evidence.findUnique({ where: { id } });
    if (!existing) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Evidence not found" } });
      return;
    }

    const contentType = req.headers["content-type"] || "";
    if (!contentType) {
      res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "Content-Type header required" },
      });
      return;
    }

    const fileName = req.headers["x-file-name"] as string | undefined;
    if (!fileName) {
      res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "X-File-Name header required" },
      });
      return;
    }

    const chunks: Buffer[] = [];
    let totalSize = 0;

    await new Promise<void>((resolve, reject) => {
      req.on("data", (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > MAX_FILE_SIZE) {
          reject(new Error("File too large (max 50 MB)"));
          return;
        }
        chunks.push(chunk);
      });
      req.on("end", resolve);
      req.on("error", reject);
    });

    const buffer = Buffer.concat(chunks);
    const ext = fileName.includes(".") ? fileName.split(".").pop() : "bin";
    const fileKey = `evidence/${tenantId}/${id}/${Date.now()}.${ext}`;

    if (existing.fileKey) {
      try {
        await storage.delete(existing.fileKey);
      } catch {
        /* old file may not exist */
      }
    }

    await storage.upload(fileKey, buffer, { contentType });

    const evidence = await db.evidence.update({
      where: { id },
      data: {
        fileKey,
        fileName: decodeURIComponent(fileName),
        fileSize: buffer.length,
        mimeType: contentType,
      },
      include: evidenceInclude,
    });

    res.json({ success: true, data: evidence });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("File too large")) {
      res
        .status(413)
        .json({ success: false, error: { code: "FILE_TOO_LARGE", message: err.message } });
      return;
    }
    next(err);
  }
});

// ─── Get presigned download URL ──────────────────────────────
evidenceRouter.get("/:id/download-url", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const existing = await db.evidence.findUnique({ where: { id } });
    if (!existing) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Evidence not found" } });
      return;
    }
    if (!existing.fileKey) {
      res.status(404).json({
        success: false,
        error: { code: "NO_FILE", message: "No file attached to this evidence" },
      });
      return;
    }

    const url = await storage.getSignedUrl(existing.fileKey, 3600);
    res.json({
      success: true,
      data: { url, fileName: existing.fileName, mimeType: existing.mimeType },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Remove file from evidence ───────────────────────────────
evidenceRouter.delete("/:id/file", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const existing = await db.evidence.findUnique({ where: { id } });
    if (!existing) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Evidence not found" } });
      return;
    }

    if (existing.fileKey) {
      try {
        await storage.delete(existing.fileKey);
      } catch {
        /* file may not exist */
      }
    }

    const evidence = await db.evidence.update({
      where: { id },
      data: { fileKey: null, fileName: null, fileSize: null, mimeType: null },
      include: evidenceInclude,
    });

    res.json({ success: true, data: evidence });
  } catch (err) {
    next(err);
  }
});

// ─── Delete evidence ─────────────────────────────────────────
evidenceRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const existing = await db.evidence.findUnique({ where: { id } });
    if (existing?.fileKey) {
      try {
        await storage.delete(existing.fileKey);
      } catch {
        /* file may not exist */
      }
    }

    await db.evidence.delete({ where: { id } });
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});
