import { Router } from "express";
import { z } from "zod";
import { prismaWithTenant } from "../../db/prisma.js";
import { authorizeResource } from "../../middleware/authorize.js";
import { audit } from "../../lib/audit.js";
import { consumeToken } from "../../lib/rate-limit.js";
import { resolveOrgAI } from "../../config/ai.js";
import { assetsFromTextBody, classifyAssetsFromText } from "./from-text.js";

export const assetsRouter: Router = Router();
assetsRouter.use(authorizeResource("assets:read", "assets:write"));

const idParams = z.object({
  id: z.string().min(1),
});

const assetType = z.enum([
  "hardware",
  "software",
  "data",
  "service",
  "personnel",
  "facility",
  "cloud_resource",
]);

const assetClassification = z.enum(["public", "internal", "confidential", "restricted"]);
const assetStatus = z.enum(["active", "decommissioned", "under_review"]);
const assetCriticality = z.enum(["low", "medium", "high", "critical"]);

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  type: assetType.optional(),
  classification: assetClassification.optional(),
  status: assetStatus.optional(),
  kind: z.enum(["physical", "virtual"]).optional(),
  includeDeleted: z.enum(["true", "false"]).default("false"),
  deletedOnly: z.enum(["true", "false"]).default("false"),
});

const assetMetadataSchema = z.object({
  category: z.string().optional(),
  serialNumber: z.string().optional(),
  model: z.string().optional(),
  vendor: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiresAt: z.string().optional(),
  assignedTo: z.string().optional(),
  hostname: z.string().optional(),
  ipAddress: z.string().optional(),
  cloudProvider: z.string().optional(),
  accountId: z.string().optional(),
  environment: z.string().optional(),
  tags: z.array(z.string()).optional(),
  criticality: assetCriticality.optional(),
});

const createAssetBody = z.object({
  name: z.string().min(1),
  type: assetType,
  description: z.string().optional(),
  classification: assetClassification.optional(),
  ownerId: z.string().min(1).nullable().optional(),
  location: z.string().optional(),
  metadata: assetMetadataSchema.optional(),
});

const patchAssetBody = createAssetBody.partial().extend({
  status: assetStatus.optional(),
});

function toAssetKind(type: z.infer<typeof assetType>): "physical" | "virtual" {
  switch (type) {
    case "hardware":
    case "facility":
    case "personnel":
      return "physical";
    default:
      return "virtual";
  }
}

function sanitizeOptionalText(input?: string | null): string | null | undefined {
  if (input == null) return undefined;
  const value = input.trim();
  return value.length > 0 ? value : null;
}

function sanitizeRequiredText(input: string): string {
  const value = input.trim();
  if (!value) {
    throw Object.assign(new Error("Name is required"), { status: 400 });
  }
  return value;
}

function sanitizeMetadata(metadata?: z.infer<typeof assetMetadataSchema>) {
  if (!metadata) return undefined;

  const tags = (metadata.tags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0);

  const normalized = {
    category: sanitizeOptionalText(metadata.category),
    serialNumber: sanitizeOptionalText(metadata.serialNumber),
    model: sanitizeOptionalText(metadata.model),
    vendor: sanitizeOptionalText(metadata.vendor),
    purchaseDate: sanitizeOptionalText(metadata.purchaseDate),
    warrantyExpiresAt: sanitizeOptionalText(metadata.warrantyExpiresAt),
    assignedTo: sanitizeOptionalText(metadata.assignedTo),
    hostname: sanitizeOptionalText(metadata.hostname),
    ipAddress: sanitizeOptionalText(metadata.ipAddress),
    cloudProvider: sanitizeOptionalText(metadata.cloudProvider),
    accountId: sanitizeOptionalText(metadata.accountId),
    environment: sanitizeOptionalText(metadata.environment),
    criticality: metadata.criticality,
    tags: tags.length > 0 ? tags : undefined,
  };

  const hasValues = Object.values(normalized).some(
    (value) => value != null && (!Array.isArray(value) || value.length > 0),
  );
  return hasValues ? normalized : undefined;
}

assetsRouter.get("/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    const [total, deleted, byTypeRows, byStatusRows, byClassificationRows] = await Promise.all([
      db.asset.count({ where: { deletedAt: null } }),
      db.asset.count({ where: { deletedAt: { not: null } } }),
      db.asset.groupBy({ by: ["type"], where: { deletedAt: null }, _count: true }),
      db.asset.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true }),
      db.asset.groupBy({ by: ["classification"], where: { deletedAt: null }, _count: true }),
    ]);

    let physical = 0;
    let virtual = 0;
    for (const row of byTypeRows) {
      if (toAssetKind(row.type) === "physical") physical += row._count;
      else virtual += row._count;
    }

    res.json({
      success: true,
      data: {
        total,
        deleted,
        physical,
        virtual,
        byType: Object.fromEntries(byTypeRows.map((row) => [row.type, row._count])),
        byStatus: Object.fromEntries(byStatusRows.map((row) => [row.status, row._count])),
        byClassification: Object.fromEntries(
          byClassificationRows.map((row) => [row.classification, row._count]),
        ),
      },
    });
  } catch (err) {
    next(err);
  }
});

assetsRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { page, limit, search, type, classification, status, kind, includeDeleted, deletedOnly } =
      listQuery.parse(req.query);
    const skip = (page - 1) * limit;
    const db = prismaWithTenant(tenantId);

    const whereAnd: any[] = [];
    if (search) {
      whereAnd.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
        ],
      });
    }
    if (type) whereAnd.push({ type });
    if (classification) whereAnd.push({ classification });
    if (status) whereAnd.push({ status });
    if (kind) {
      whereAnd.push({
        type:
          kind === "physical"
            ? { in: ["hardware", "facility", "personnel"] }
            : { in: ["software", "data", "service", "cloud_resource"] },
      });
    }
    if (deletedOnly === "true") whereAnd.push({ deletedAt: { not: null } });
    else if (includeDeleted !== "true") whereAnd.push({ deletedAt: null });

    const where = whereAnd.length > 0 ? { AND: whereAnd } : {};
    const [items, total] = await Promise.all([
      db.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          deletedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      db.asset.count({ where }),
    ]);
    res.json({ success: true, data: { items, total, page, limit } });
  } catch (err) {
    next(err);
  }
});

assetsRouter.get("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    const asset = await db.asset.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        deletedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!asset) {
      return next(Object.assign(new Error("Asset not found"), { status: 404 }));
    }
    res.json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
});

assetsRouter.post("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = createAssetBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    if (body.ownerId) {
      const owner = await db.user.findUnique({ where: { id: body.ownerId } });
      if (!owner) {
        return next(
          Object.assign(new Error("Owner does not belong to this organization"), { status: 400 }),
        );
      }
    }

    const asset = await db.asset.create({
      data: {
        tenantId,
        name: sanitizeRequiredText(body.name),
        type: body.type,
        description: sanitizeOptionalText(body.description),
        classification: body.classification,
        ownerId: body.ownerId ?? null,
        location: sanitizeOptionalText(body.location),
        metadata: sanitizeMetadata(body.metadata),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        deletedBy: { select: { id: true, name: true, email: true } },
      },
    });
    res.status(201).json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// AI: classify assets from pasted prose (CPS 234 Para 23 bootstrap)
// ──────────────────────────────────────────────

// Shares the org-context extractor's token bucket — both endpoints burn
// LLM tokens on pasted prose, so a single per-tenant budget covers them.
const EXTRACTION_LIMIT = { capacity: 6, refillMs: 60_000 } as const;

/**
 * POST /assets/from-text
 *
 * Returns STAGED classification proposals extracted from pasted
 * architecture / data-flow prose. Advisory only — never creates Asset
 * rows. The UI lets the user pick proposals and applies them through
 * the normal `POST /assets` create call.
 *
 * Free core utility (no `assertEnterpriseLicense` gate) — see the
 * licensing tier table in docs/ai-features.md. `AINotConfiguredError`
 * maps to 503 in the shared error handler, like every other AI route.
 */
assetsRouter.post("/from-text", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;

    if (!consumeToken(tenantId, "context_extraction", EXTRACTION_LIMIT)) {
      return res.status(429).json({
        success: false,
        error: "Too many extraction requests. Try again in a minute.",
      });
    }

    const body = assetsFromTextBody.parse(req.body);

    // The bootstrap rides the `context_extraction` feature key — same
    // paste-prose workload, so deployments route/model it identically.
    const ai = await resolveOrgAI(tenantId, "context_extraction");

    const result = await classifyAssetsFromText(ai.client, {
      text: body.text,
      maxProposals: body.maxProposals,
    });

    await audit(req, "create", "AssetAIClassification", undefined, {
      kind: "paste",
      count: result.proposals.length,
      dropped: result.dropped,
      redactions: result.redactions,
      modelUsed: ai.model,
      providerSource: ai.source,
    });

    res.json({
      success: true,
      data: {
        proposals: result.proposals,
        dropped: result.dropped,
        redactions: result.redactions,
        modelUsed: ai.model,
        providerSource: ai.source,
      },
    });
  } catch (err) {
    next(err);
  }
});

assetsRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = patchAssetBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    if (body.ownerId !== undefined && body.ownerId !== null) {
      const owner = await db.user.findUnique({ where: { id: body.ownerId } });
      if (!owner) {
        return next(
          Object.assign(new Error("Owner does not belong to this organization"), { status: 400 }),
        );
      }
    }

    const data: any = {};
    if (body.name !== undefined) data.name = sanitizeRequiredText(body.name);
    if (body.type !== undefined) data.type = body.type;
    if (body.description !== undefined) data.description = sanitizeOptionalText(body.description);
    if (body.classification !== undefined) data.classification = body.classification;
    if (body.ownerId !== undefined) data.ownerId = body.ownerId ?? null;
    if (body.location !== undefined) data.location = sanitizeOptionalText(body.location);
    if (body.status !== undefined) data.status = body.status;
    if (body.metadata !== undefined) data.metadata = sanitizeMetadata(body.metadata);

    const asset = await db.asset.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        deletedBy: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
});

assetsRouter.post("/:id/restore", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const asset = await db.asset.update({
      where: { id },
      data: {
        status: "active",
        deletedAt: null,
        deletedById: null,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        deletedBy: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
});

assetsRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    const asset = await db.asset.update({
      where: { id },
      data: {
        status: "decommissioned",
        deletedAt: new Date(),
        deletedById: userId,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        deletedBy: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
});
