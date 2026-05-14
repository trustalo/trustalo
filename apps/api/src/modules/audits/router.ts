import { Router } from "express";
import { z } from "zod";
import { prismaWithTenant } from "../../db/prisma.js";
import { authorizeResource } from "../../middleware/authorize.js";
import { createStorageProvider } from "@trustalo/storage";

export const auditsRouter: Router = Router();
auditsRouter.use(authorizeResource("audits:read", "audits:write"));

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const storage = createStorageProvider({
  provider: (process.env.STORAGE_PROVIDER as "s3") || "s3",
  region: process.env.AWS_REGION || "us-east-1",
  bucket: process.env.S3_BUCKET || "trustalo-files",
  endpoint: process.env.S3_ENDPOINT || undefined,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || undefined,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || undefined,
});

const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional(),
  type: z.enum(["internal", "external", "certification"]).optional(),
  search: z.string().optional(),
});

const idParams = z.object({ id: z.string().min(1) });
const findingIdParams = z.object({ id: z.string().min(1), findingId: z.string().min(1) });
const documentIdParams = z.object({ id: z.string().min(1), documentId: z.string().min(1) });

const auditType = z.enum(["internal", "external", "certification"]);
const auditStatus = z.enum(["planned", "in_progress", "completed", "cancelled"]);

const auditCreateBody = z.object({
  title: z.string().min(1),
  type: auditType,
  description: z.string().optional().nullable(),
  frameworkInstanceId: z.string().optional().nullable(),
  status: auditStatus.optional(),
  auditorName: z.string().optional().nullable(),
  auditorOrganization: z.string().optional().nullable(),
  scheduledStartDate: z.coerce.date().optional().nullable(),
  scheduledEndDate: z.coerce.date().optional().nullable(),
  actualStartDate: z.coerce.date().optional().nullable(),
  actualEndDate: z.coerce.date().optional().nullable(),
});

const auditPatchBody = auditCreateBody.partial();

const findingCreateBody = z.object({
  title: z.string().min(1),
  severity: z.enum(["critical", "major", "minor", "observation", "opportunity"]),
  description: z.string().optional().nullable(),
  status: z.enum(["open", "in_progress", "remediated", "verified", "closed"]).optional(),
  controlId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});

const findingPatchBody = findingCreateBody.partial();

const auditInclude = {
  findings: {
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      control: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
  documents: {
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
};

// ─── List audits ────────────────────────────────────────────
auditsRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { page, limit, status, type, search } = paginationQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) where.title = { contains: search, mode: "insensitive" };

    const [items, total] = await Promise.all([
      db.audit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { findings: true, documents: true } },
        },
      }),
      db.audit.count({ where }),
    ]);

    res.json({ success: true, data: { items, page, limit, total } });
  } catch (err) {
    next(err);
  }
});

// ─── Get single audit with findings + documents ─────────────
auditsRouter.get("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const audit = await db.audit.findUnique({
      where: { id },
      include: auditInclude,
    });

    if (!audit) {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }

    res.json({ success: true, data: audit });
  } catch (err) {
    next(err);
  }
});

// ─── Create audit ───────────────────────────────────────────
auditsRouter.post("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = auditCreateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const audit = await db.audit.create({
      data: { ...body, tenantId },
      include: { _count: { select: { findings: true, documents: true } } },
    });

    res.status(201).json({ success: true, data: audit });
  } catch (err) {
    next(err);
  }
});

// ─── Update audit ───────────────────────────────────────────
auditsRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = auditPatchBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const audit = await db.audit.update({
      where: { id },
      data: body,
      include: { _count: { select: { findings: true, documents: true } } },
    });

    res.json({ success: true, data: audit });
  } catch (err) {
    next(err);
  }
});

// ─── Delete audit (cascades findings + docs) ────────────────
auditsRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const docs = await db.auditDocument.findMany({
      where: { auditId: id },
      select: { fileKey: true },
    });
    const keys = docs.map((d) => d.fileKey).filter(Boolean);
    if (keys.length > 0) {
      try {
        await storage.deleteMany(keys);
      } catch {
        /* best effort */
      }
    }

    await db.audit.delete({ where: { id } });
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// ─── Audit Findings CRUD ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

auditsRouter.get("/:id/findings", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const findings = await db.auditFinding.findMany({
      where: { auditId: id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        control: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: findings });
  } catch (err) {
    next(err);
  }
});

auditsRouter.post("/:id/findings", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = findingCreateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const finding = await db.auditFinding.create({
      data: { ...body, auditId: id, tenantId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        control: { select: { id: true, title: true } },
      },
    });

    res.status(201).json({ success: true, data: finding });
  } catch (err) {
    next(err);
  }
});

auditsRouter.patch("/:id/findings/:findingId", async (req, res, next) => {
  try {
    const { findingId } = findingIdParams.parse(req.params);
    const body = findingPatchBody.parse(req.body);
    const db = prismaWithTenant((req as any).auth.tenantId);

    const finding = await db.auditFinding.update({
      where: { id: findingId },
      data: body,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        control: { select: { id: true, title: true } },
      },
    });

    res.json({ success: true, data: finding });
  } catch (err) {
    next(err);
  }
});

auditsRouter.delete("/:id/findings/:findingId", async (req, res, next) => {
  try {
    const { findingId } = findingIdParams.parse(req.params);
    const db = prismaWithTenant((req as any).auth.tenantId);

    await db.auditFinding.delete({ where: { id: findingId } });
    res.json({ success: true, data: { id: findingId } });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// ─── Audit Documents ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

auditsRouter.get("/:id/documents", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const documents = await db.auditDocument.findMany({
      where: { auditId: id },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: documents });
  } catch (err) {
    next(err);
  }
});

auditsRouter.post("/:id/documents", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const audit = await db.audit.findUnique({ where: { id } });
    if (!audit) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Audit not found" } });
      return;
    }

    const contentType = req.headers["content-type"] || "";
    const fileName = req.headers["x-file-name"] as string | undefined;
    if (!contentType || !fileName) {
      res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "Content-Type and X-File-Name headers required" },
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
    const fileKey = `audits/${tenantId}/${id}/${Date.now()}.${ext}`;

    await storage.upload(fileKey, buffer, { contentType });

    const doc = await db.auditDocument.create({
      data: {
        auditId: id,
        tenantId,
        fileName: decodeURIComponent(fileName),
        fileKey,
        fileSize: buffer.length,
        mimeType: contentType,
        uploadedById: userId,
      },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ success: true, data: doc });
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

auditsRouter.get("/:id/documents/:documentId/download-url", async (req, res, next) => {
  try {
    const { documentId } = documentIdParams.parse(req.params);
    const db = prismaWithTenant((req as any).auth.tenantId);

    const doc = await db.auditDocument.findUnique({ where: { id: documentId } });
    if (!doc) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Document not found" } });
      return;
    }

    const url = await storage.getSignedUrl(doc.fileKey, 3600);
    res.json({ success: true, data: { url, fileName: doc.fileName } });
  } catch (err) {
    next(err);
  }
});

auditsRouter.delete("/:id/documents/:documentId", async (req, res, next) => {
  try {
    const { documentId } = documentIdParams.parse(req.params);
    const db = prismaWithTenant((req as any).auth.tenantId);

    const doc = await db.auditDocument.findUnique({ where: { id: documentId } });
    if (!doc) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Document not found" } });
      return;
    }

    try {
      await storage.delete(doc.fileKey);
    } catch {
      /* best effort */
    }
    await db.auditDocument.delete({ where: { id: documentId } });

    res.json({ success: true, data: { id: documentId } });
  } catch (err) {
    next(err);
  }
});
