import { Router } from "express";
import { z } from "zod";
import { prisma, prismaWithTenant } from "../../db/prisma.js";
import {
  getQueueProvider,
  QUEUE_URLS,
  type VendorResearchRequestMessage,
} from "../../lib/queue.js";
import { authorizeResource } from "../../middleware/authorize.js";
import { createStorageProvider } from "@trustalo/storage";
import { audit } from "../../lib/audit.js";
import { suggestVendorTier, VendorNotFoundError } from "./ai-suggest-tier.js";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const storage = createStorageProvider({
  provider: (process.env.STORAGE_PROVIDER as "s3") || "s3",
  region: process.env.AWS_REGION || "us-east-1",
  bucket: process.env.S3_BUCKET || "trustalo-files",
  endpoint: process.env.S3_ENDPOINT || undefined,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || undefined,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || undefined,
});

export const vendorsRouter: Router = Router();

/**
 * Service-to-service handler used by the collector's scheduler.
 *
 * Lives here (next to the rest of the vendor logic + queue plumbing)
 * but is mounted under `/internal/vendors/due-for-research` by
 * `internalRouter` so it sits outside the JWT-gated `/api/v1/*`
 * namespace. The HMAC `requireServiceAuth` middleware on that router
 * authenticates the caller. Operates cross-tenant by design (the
 * scheduler enumerates due work across all orgs), so we explicitly
 * audit every invocation.
 */
export async function handleInternalDueForResearch(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction,
): Promise<void> {
  try {
    const tenantId = req.headers["x-organization-id"] as string | undefined;
    const caller = (req as typeof req & { service?: { caller: string } }).service?.caller;
    console.log("[vendors] internal/due-for-research invoked", {
      caller,
      tenantId: tenantId ?? "(cross-tenant)",
    });

    const now = new Date();
    const vendors = await prisma.vendor.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        researchFrequency: { not: "none" },
        nextResearchAt: { lte: now },
      },
      select: {
        id: true,
        tenantId: true,
        name: true,
        website: true,
        category: true,
        description: true,
        knownVendorId: true,
        researchFrequency: true,
        nextResearchAt: true,
      },
      take: 20,
    });

    for (const v of vendors) {
      const nextAt = computeNextResearchAt(v.researchFrequency);
      await prisma.vendor.update({
        where: { id: v.id },
        data: { nextResearchAt: nextAt },
      });

      await publishResearchRequest(
        {
          id: v.id,
          tenantId: v.tenantId,
          name: v.name,
          website: v.website,
          category: v.category,
          description: v.description,
          knownVendorId: v.knownVendorId,
        },
        "periodic_update",
      );
    }

    res.json({ success: true, data: { dispatched: vendors.length } });
  } catch (err) {
    next(err);
  }
}

// Legacy mount: previously this route lived under /api/v1/vendors/internal/
// where it was shadowed by the JWT `authenticate` middleware (the
// service-auth check never ran). We return 410 so a misconfigured caller
// finds the new path quickly instead of seeing an opaque 401.
vendorsRouter.get("/internal/due-for-research", (_req, res) => {
  res.status(410).json({
    success: false,
    error: {
      code: "GONE",
      message:
        "Moved to /internal/vendors/due-for-research (HMAC-signed). The /api/v1/* mount sat behind the user JWT middleware and could never authenticate the scheduler.",
    },
  });
});

vendorsRouter.use(authorizeResource("vendors:read", "vendors:write"));

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  riskTier: z.string().optional(),
  dataProcessing: z.enum(["true", "false"]).optional(),
});

const idParams = z.object({
  id: z.string().min(1),
});

const vendorRiskTier = z.enum(["critical", "high", "medium", "low"]);
const vendorStatus = z.enum(["active", "under_review", "approved", "rejected", "offboarded"]);
const researchFrequency = z.enum(["weekly", "biweekly", "monthly", "yearly", "none"]);

const dpaStatus = z.enum([
  "not_required",
  "not_started",
  "requested",
  "received",
  "approved",
  "expired",
]);

const createVendorBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  website: z.string().optional(),
  category: z.string().optional(),
  riskTier: vendorRiskTier.optional(),
  dataProcessing: z.boolean().optional(),
  isSubprocessor: z.boolean().optional(),
  subprocessorPurpose: z.string().nullable().optional(),
  dataTypesShared: z.array(z.string()).optional(),
  dataLocations: z.array(z.string()).optional(),
  dpaStatus: dpaStatus.optional(),
  dpaExpiresAt: z.coerce.date().nullable().optional(),
  knownVendorId: z.string().optional(),
  researchFrequency: researchFrequency.optional(),
});

const patchVendorBody = createVendorBody.partial().extend({
  status: vendorStatus.optional(),
  contractStartDate: z.coerce.date().nullable().optional(),
  contractEndDate: z.coerce.date().nullable().optional(),
});

const createContactBody = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  role: z.string().optional(),
  phone: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

function computeNextResearchAt(frequency: string): Date | null {
  if (frequency === "none") return null;
  const now = new Date();
  switch (frequency) {
    case "weekly":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "biweekly":
      return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    case "monthly":
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    case "yearly":
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    default:
      return null;
  }
}

async function publishResearchRequest(
  vendor: {
    id: string;
    tenantId: string;
    name: string;
    website?: string | null;
    category?: string | null;
    description?: string | null;
    knownVendorId?: string | null;
  },
  researchType: "deep_research" | "periodic_update" = "deep_research",
): Promise<void> {
  try {
    const queue = getQueueProvider();
    const message: VendorResearchRequestMessage = {
      type: "vendor_research_request",
      vendorId: vendor.id,
      tenantId: vendor.tenantId,
      researchType,
      vendorName: vendor.name,
      vendorWebsite: vendor.website,
      vendorCategory: vendor.category,
      vendorDescription: vendor.description,
      knownVendorId: vendor.knownVendorId,
    };

    await queue.publish(QUEUE_URLS.vendorResearchRequests, {
      body: message as unknown as Record<string, unknown>,
      attributes: {
        messageType: "vendor_research_request",
        vendorId: vendor.id,
        tenantId: vendor.tenantId,
      },
    });

    console.log(`[vendors] published research request to queue for vendor=${vendor.id}`);
  } catch (err) {
    console.error("[vendors] failed to publish research request:", err);
  }
}

// ────── Known Vendors (global catalog) ──────

vendorsRouter.get("/known", async (req, res, next) => {
  try {
    const search = (req.query.search as string) || "";
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const items = await prisma.knownVendor.findMany({
      where,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        website: true,
        description: true,
        category: true,
        logoUrl: true,
        headquarters: true,
        employeeRange: true,
        foundedYear: true,
        certifications: true,
        overallScore: true,
        lastResearchedAt: true,
      },
    });

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

vendorsRouter.get("/known/:id", async (req, res, next) => {
  try {
    const item = await prisma.knownVendor.findUnique({
      where: { id: req.params.id },
    });
    if (!item) {
      return next(Object.assign(new Error("Known vendor not found"), { status: 404 }));
    }
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// ────── Stats ──────

vendorsRouter.get("/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [total, byStatus, byRiskTier, dataProcessingCount, contractsExpiringSoon] =
      await Promise.all([
        db.vendor.count(),
        db.vendor.groupBy({ by: ["status"], _count: true }),
        db.vendor.groupBy({ by: ["riskTier"], _count: true }),
        db.vendor.count({ where: { dataProcessing: true } }),
        db.vendor.count({
          where: {
            contractEndDate: { lte: thirtyDaysFromNow, gte: new Date() },
            status: { not: "offboarded" },
          },
        }),
      ]);

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) statusMap[s.status] = s._count;

    const tierMap: Record<string, number> = {};
    for (const t of byRiskTier) tierMap[t.riskTier] = t._count;

    res.json({
      success: true,
      data: {
        total,
        byStatus: statusMap,
        byRiskTier: tierMap,
        dataProcessingCount,
        contractsExpiringSoon,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ────── List ──────

vendorsRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { page, limit, search, status, riskTier, dataProcessing } = listQuery.parse(req.query);
    const skip = (page - 1) * limit;
    const db = prismaWithTenant(tenantId);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { website: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (riskTier) where.riskTier = riskTier;
    if (dataProcessing !== undefined) where.dataProcessing = dataProcessing === "true";

    const [items, total] = await Promise.all([
      db.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { assessments: true, contacts: true, researches: true } },
          knownVendor: { select: { id: true, name: true, logoUrl: true, overallScore: true } },
        },
      }),
      db.vendor.count({ where }),
    ]);
    res.json({ success: true, data: { items, total, page, limit } });
  } catch (err) {
    next(err);
  }
});

// ────── Get single ──────

vendorsRouter.get("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    const vendor = await db.vendor.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { isPrimary: "desc" } },
        assessments: {
          orderBy: { createdAt: "desc" },
          include: { assessedBy: { select: { id: true, name: true, email: true } } },
        },
        researches: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        documents: {
          orderBy: { createdAt: "desc" },
          include: { uploadedBy: { select: { id: true, name: true, email: true } } },
        },
        knownVendor: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            overallScore: true,
            certifications: true,
            lastResearchedAt: true,
          },
        },
        _count: {
          select: { assessments: true, contacts: true, researches: true, documents: true },
        },
      },
    });
    if (!vendor) {
      return next(Object.assign(new Error("Vendor not found"), { status: 404 }));
    }
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

// ────── Create ──────

vendorsRouter.post("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = createVendorBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const freq = body.researchFrequency ?? "none";
    const nextResearchAt = computeNextResearchAt(freq);

    const vendor = await db.vendor.create({
      data: {
        name: body.name,
        description: body.description,
        website: body.website,
        category: body.category,
        riskTier: body.riskTier,
        dataProcessing: body.dataProcessing,
        knownVendorId: body.knownVendorId || undefined,
        researchFrequency: freq as any,
        nextResearchAt,
        tenantId,
      },
    });

    // If linked to a known vendor with existing research, copy the latest score
    if (body.knownVendorId) {
      const known = await prisma.knownVendor.findUnique({
        where: { id: body.knownVendorId },
      });
      if (known?.overallScore != null) {
        await db.vendor.update({
          where: { id: vendor.id },
          data: { lastResearchedAt: known.lastResearchedAt },
        });
      }
    }

    // Publish initial deep research request to the queue
    publishResearchRequest({
      id: vendor.id,
      tenantId,
      name: body.name,
      website: body.website,
      category: body.category,
      description: body.description,
      knownVendorId: body.knownVendorId,
    });

    res.status(201).json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

// ────── Create from Known Vendor ──────

vendorsRouter.post("/from-known", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = z
      .object({
        knownVendorId: z.string().min(1),
        researchFrequency: researchFrequency.optional(),
        riskTier: vendorRiskTier.optional(),
        dataProcessing: z.boolean().optional(),
      })
      .parse(req.body);

    const known = await prisma.knownVendor.findUnique({
      where: { id: body.knownVendorId },
    });
    if (!known) {
      return next(Object.assign(new Error("Known vendor not found"), { status: 404 }));
    }

    const db = prismaWithTenant(tenantId);
    const freq = body.researchFrequency ?? "none";

    const vendor = await db.vendor.create({
      data: {
        name: known.name,
        description: known.description,
        website: known.website,
        category: known.category,
        knownVendorId: known.id,
        riskTier: body.riskTier,
        dataProcessing: body.dataProcessing,
        researchFrequency: freq as any,
        lastResearchedAt: known.lastResearchedAt,
        nextResearchAt: computeNextResearchAt(freq),
        tenantId,
      },
    });

    // If no recent research, publish a fresh research request; otherwise reuse known vendor data
    const needsFreshResearch =
      !known.lastResearchedAt ||
      Date.now() - known.lastResearchedAt.getTime() > 30 * 24 * 60 * 60 * 1000;

    if (needsFreshResearch) {
      publishResearchRequest({
        id: vendor.id,
        tenantId,
        name: known.name,
        website: known.website,
        category: known.category,
        description: known.description,
        knownVendorId: known.id,
      });
    }

    res.status(201).json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

// ────── Update ──────

vendorsRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = patchVendorBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const data: any = { ...body };

    if (body.researchFrequency !== undefined) {
      data.nextResearchAt = computeNextResearchAt(body.researchFrequency);
    }

    const vendor = await db.vendor.update({
      where: { id },
      data,
    });
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

// ────── Update Research Settings ──────

vendorsRouter.patch("/:id/research-settings", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = z.object({ researchFrequency: researchFrequency }).parse(req.body);

    const db = prismaWithTenant(tenantId);
    const vendor = await db.vendor.update({
      where: { id },
      data: {
        researchFrequency: body.researchFrequency as any,
        nextResearchAt: computeNextResearchAt(body.researchFrequency),
      },
    });
    res.json({ success: true, data: vendor });
  } catch (err) {
    next(err);
  }
});

// ────── Trigger Research Manually ──────

vendorsRouter.post("/:id/research", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const vendor = await db.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return next(Object.assign(new Error("Vendor not found"), { status: 404 }));
    }

    const research = await db.vendorResearch.create({
      data: {
        vendorId: id,
        knownVendorId: vendor.knownVendorId || undefined,
        tenantId,
        status: "pending",
        researchType: "deep_research",
      },
    });

    publishResearchRequest({
      id: vendor.id,
      tenantId,
      name: vendor.name,
      website: vendor.website,
      category: vendor.category,
      description: vendor.description,
      knownVendorId: vendor.knownVendorId,
    });

    res.status(201).json({ success: true, data: research });
  } catch (err) {
    next(err);
  }
});

// ────── Get Research Results ──────

vendorsRouter.get("/:id/research", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const researches = await db.vendorResearch.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.json({ success: true, data: researches });
  } catch (err) {
    next(err);
  }
});

// ────── Delete ──────

vendorsRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    await db.vendor.delete({ where: { id } });
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

// ────── Vendor Contacts ──────

vendorsRouter.post("/:id/contacts", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = createContactBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const vendor = await db.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return next(Object.assign(new Error("Vendor not found"), { status: 404 }));
    }

    if (body.isPrimary) {
      await db.vendorContact.updateMany({
        where: { vendorId: id },
        data: { isPrimary: false },
      });
    }

    const contact = await db.vendorContact.create({
      data: {
        ...body,
        email: body.email || null,
        vendorId: id,
      },
    });
    res.status(201).json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
});

vendorsRouter.patch("/:id/contacts/:contactId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const contactId = req.params.contactId;
    const body = createContactBody.partial().parse(req.body);
    const db = prismaWithTenant(tenantId);

    if (body.isPrimary) {
      await db.vendorContact.updateMany({
        where: { vendorId: id },
        data: { isPrimary: false },
      });
    }

    const contact = await db.vendorContact.update({
      where: { id: contactId },
      data: body,
    });
    res.json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
});

vendorsRouter.delete("/:id/contacts/:contactId", async (req, res, next) => {
  try {
    const contactId = req.params.contactId;
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    await db.vendorContact.delete({ where: { id: contactId } });
    res.json({ success: true, data: { id: contactId } });
  } catch (err) {
    next(err);
  }
});

// ────── Vendor Documents ──────

const vendorDocumentType = z.enum([
  "agreement",
  "nda",
  "sla",
  "dpa",
  "sow",
  "msa",
  "insurance_certificate",
  "security_assessment",
  "compliance_report",
  "other",
]);

vendorsRouter.get("/:id/documents", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const documents = await db.vendorDocument.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    });

    res.json({ success: true, data: documents });
  } catch (err) {
    next(err);
  }
});

vendorsRouter.post("/:id/documents", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const vendor = await db.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return next(Object.assign(new Error("Vendor not found"), { status: 404 }));
    }

    const contentType = req.headers["content-type"] || "";
    const fileName = req.headers["x-file-name"] as string | undefined;
    const docType = (req.headers["x-document-type"] as string) || "other";
    const docTitle = req.headers["x-document-title"] as string | undefined;
    const docDescription = req.headers["x-document-description"] as string | undefined;
    const docExpiresAt = req.headers["x-document-expires-at"] as string | undefined;

    if (!contentType) {
      return next(Object.assign(new Error("Content-Type header required"), { status: 400 }));
    }
    if (!fileName) {
      return next(Object.assign(new Error("X-File-Name header required"), { status: 400 }));
    }

    const parsedType = vendorDocumentType.safeParse(docType);
    const documentType = parsedType.success ? parsedType.data : "other";

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
    const fileKey = `vendors/${tenantId}/${id}/documents/${Date.now()}.${ext}`;

    await storage.upload(fileKey, buffer, { contentType });

    const decodedFileName = decodeURIComponent(fileName);
    const title = docTitle ? decodeURIComponent(docTitle) : decodedFileName;

    const document = await db.vendorDocument.create({
      data: {
        vendorId: id,
        tenantId,
        documentType: documentType as any,
        title,
        description: docDescription ? decodeURIComponent(docDescription) : null,
        fileKey,
        fileName: decodedFileName,
        fileSize: buffer.length,
        mimeType: contentType,
        expiresAt: docExpiresAt ? new Date(docExpiresAt) : null,
        uploadedById: userId,
      },
      include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ success: true, data: document });
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

vendorsRouter.get("/:id/documents/:docId/download-url", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const docId = req.params.docId;
    const db = prismaWithTenant(tenantId);

    const doc = await db.vendorDocument.findFirst({
      where: { id: docId, vendorId: id },
    });
    if (!doc) {
      return next(Object.assign(new Error("Document not found"), { status: 404 }));
    }

    const url = await storage.getSignedUrl(doc.fileKey, 3600);
    res.json({ success: true, data: { url, fileName: doc.fileName, mimeType: doc.mimeType } });
  } catch (err) {
    next(err);
  }
});

vendorsRouter.delete("/:id/documents/:docId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const docId = req.params.docId;
    const db = prismaWithTenant(tenantId);

    const doc = await db.vendorDocument.findFirst({
      where: { id: docId },
    });

    if (doc?.fileKey) {
      try {
        await storage.delete(doc.fileKey);
      } catch {
        /* file may not exist */
      }
    }

    await db.vendorDocument.delete({ where: { id: docId } });
    res.json({ success: true, data: { id: docId } });
  } catch (err) {
    next(err);
  }
});

// Research results are now processed via the SQS research-results queue worker
// (see src/workers/research-results.ts) instead of an internal HTTP endpoint.

// ──────────────────────────────────────────────
// AI: suggest vendor risk tier (Phase 5 — AI accelerators)
// ──────────────────────────────────────────────

/**
 * POST /vendors/:id/ai-suggest-tier
 *
 * Returns an advisory risk-tier recommendation grounded in the org's
 * existing tiered vendors and latest deep-research results. Read-only —
 * never mutates the vendor. The UI displays it as an advisory banner
 * with Apply / Dismiss / Refine actions.
 */
vendorsRouter.post("/:id/ai-suggest-tier", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);

    const suggestion = await suggestVendorTier({ tenantId, vendorId: id });

    await audit(req, "create", "VendorAITierSuggestion", id, {
      suggestionId: suggestion.suggestionId,
      tier: suggestion.tier,
      confidence: suggestion.confidence,
      modelUsed: suggestion.modelUsed,
      providerSource: suggestion.providerSource,
    });

    res.json({ success: true, data: suggestion });
  } catch (err) {
    if (err instanceof VendorNotFoundError) {
      return next(Object.assign(new Error(err.message), { status: 404 }));
    }
    next(err);
  }
});

/**
 * POST /vendors/:id/ai-tier-decision
 *
 * Records the human's accept/dismiss/refine decision on a prior AI
 * suggestion. The actual tier change (when "applied") flows through
 * the standard PATCH /vendors/:id endpoint — this endpoint only
 * writes the audit trail.
 */
const aiTierDecisionBody = z.object({
  suggestionId: z.string().min(1),
  decision: z.enum(["applied", "dismissed", "refined"]),
  appliedTier: z.enum(["critical", "high", "medium", "low"]).optional(),
  refineNotes: z.string().max(2000).optional(),
});

vendorsRouter.post("/:id/ai-tier-decision", async (req, res, next) => {
  try {
    const { id } = idParams.parse(req.params);
    const body = aiTierDecisionBody.parse(req.body);

    const action = body.decision === "applied" ? "approve" : "reject";

    await audit(req, action, "VendorAITierSuggestion", id, {
      suggestionId: body.suggestionId,
      decision: body.decision,
      appliedTier: body.appliedTier,
      refineNotes: body.refineNotes,
    });

    res.json({ success: true, data: { suggestionId: body.suggestionId, decision: body.decision } });
  } catch (err) {
    next(err);
  }
});
