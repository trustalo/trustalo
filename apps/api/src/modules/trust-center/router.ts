import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client/index.js";
import { prisma, prismaWithTenant } from "../../db/prisma.js";
import { authorizeResource } from "../../middleware/authorize.js";
import { audit } from "../../lib/audit.js";
import { createStorageProvider } from "@trustalo/storage";
import { assertEnterpriseLicense } from "@trustalo/license";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Phase 2 (AI accelerators): control-status weights used to compute the
// "% controls implemented" tile shown on the public Trust Center.
// `not_applicable` is excluded from both numerator and denominator so that
// scoping decisions don't artificially inflate the score.
const CONTROL_WEIGHTS: Record<string, number> = {
  implemented: 1,
  partially_implemented: 0.5,
  not_implemented: 0,
};

const storage = createStorageProvider({
  provider: (process.env.STORAGE_PROVIDER as "s3") || "s3",
  region: process.env.AWS_REGION || "us-east-1",
  bucket: process.env.S3_BUCKET || "trustalo-files",
  endpoint: process.env.S3_ENDPOINT || undefined,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || undefined,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || undefined,
});

const patchBody = z.object({
  isEnabled: z.boolean().optional(),
  customDomain: z.string().nullable().optional(),
  brandColor: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  faqs: z.unknown().optional(),
  publicMode: z.enum(["live", "snapshot"]).optional(),
});

const eventBody = z.object({
  type: z.enum(["view", "resource_view", "resource_download"]),
  resourceId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
const accessDownloadBody = z.object({
  accessToken: z.string().min(16),
});

const GATING_VALUES = ["public", "contact_required", "nda_required"] as const;

const createResourceBody = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  frameworkType: z.string().nullable().optional(),
  resourceType: z.enum(["certificate", "report", "policy", "attestation"]),
  isPublic: z.boolean().optional(),
  accessGating: z.enum(GATING_VALUES).optional(),
});

const updateResourceBody = createResourceBody.partial();

const accessRequestBody = z.object({
  resourceId: z.string().min(1),
  requesterName: z.string().min(1),
  requesterEmail: z.string().email(),
  requesterCompany: z.string().min(1),
  requesterTitle: z.string().optional(),
  reason: z.string().optional(),
  ndaAccepted: z.boolean().optional(),
});

// ────── Internal: build the public payload (live mode) ──────

/**
 * Phase 2 (AI accelerators): centralised builder for the public Trust
 * Center payload. Used both by the public GET handler (live mode) and
 * by the admin "publish snapshot" endpoint, so on-page data and frozen
 * snapshots stay structurally identical. Returns `null` if the org or
 * Trust Center config can't be found / is disabled — callers map that
 * to a 404 response.
 */
async function buildPublicPayload(slug: string): Promise<{
  tenantId: string;
  configId: string;
  payload: Record<string, unknown>;
} | null> {
  const org = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
  if (!org) return null;

  const config = await prisma.trustCenterConfig.findUnique({
    where: { tenantId: org.id },
    include: {
      resources: {
        where: { isPublic: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!config?.isEnabled) return null;

  // ── Subprocessors ──
  const subprocessors = await prisma.vendor.findMany({
    where: { tenantId: org.id, isSubprocessor: true, status: { not: "offboarded" } },
    select: {
      id: true,
      name: true,
      website: true,
      category: true,
      subprocessorPurpose: true,
      dataTypesShared: true,
      dataLocations: true,
      dpaStatus: true,
    },
    orderBy: { name: "asc" },
  });

  // ── Published policies (with optional public summary) ──
  const policies = await prisma.policy.findMany({
    where: { tenantId: org.id, status: "published" },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      publicSummary: true,
      updatedAt: true,
      currentVersionId: true,
    },
    orderBy: { title: "asc" },
  });

  // ── Active framework instances + control posture aggregate ──
  const frameworkInstances = await prisma.frameworkInstance.findMany({
    where: { tenantId: org.id, isEnabled: true },
    include: {
      framework: { select: { name: true, version: true, frameworkType: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const controls = await prisma.control.findMany({
    where: { tenantId: org.id },
    select: { status: true },
  });

  // Score = Σ weight(status) / count(scoped controls), excluding N/A.
  const scoped = controls.filter((c) => c.status !== "not_applicable");
  const totalWeight = scoped.reduce((acc, c) => acc + (CONTROL_WEIGHTS[c.status] ?? 0), 0);
  const controlPosture = {
    total: controls.length,
    implemented: controls.filter((c) => c.status === "implemented").length,
    partial: controls.filter((c) => c.status === "partially_implemented").length,
    notImplemented: controls.filter((c) => c.status === "not_implemented").length,
    notApplicable: controls.filter((c) => c.status === "not_applicable").length,
    scorePercent: scoped.length === 0 ? 0 : Math.round((totalWeight / scoped.length) * 100),
  };

  // ── Evidence freshness (approved evidence only) ──
  const now = new Date();
  const approvedEvidence = await prisma.evidence.findMany({
    where: { tenantId: org.id, status: "approved" },
    select: { collectedAt: true, expiresAt: true },
  });
  const evidenceFreshness = {
    total: approvedEvidence.length,
    fresh: approvedEvidence.filter((e) => !e.expiresAt || e.expiresAt > now).length,
    expiringSoon: approvedEvidence.filter(
      (e) =>
        e.expiresAt &&
        e.expiresAt > now &&
        e.expiresAt.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000,
    ).length,
    expired: approvedEvidence.filter((e) => e.expiresAt && e.expiresAt <= now).length,
    lastCollectedAt: approvedEvidence.reduce<Date | null>(
      (acc, e) => (acc === null || e.collectedAt > acc ? e.collectedAt : acc),
      null,
    ),
  };

  // ── Latest verified audit (e.g. SOC 2, ISO 27001) for an authenticity badge ──
  const latestCertifiedInstance = frameworkInstances
    .filter((fi) => fi.status === "certified" && fi.certifiedAt)
    .sort((a, b) => (b.certifiedAt?.getTime() ?? 0) - (a.certifiedAt?.getTime() ?? 0))[0];

  return {
    tenantId: org.id,
    configId: config.id,
    payload: {
      organization: { name: org.name, slug: org.slug },
      config: {
        brandColor: config.brandColor,
        logoUrl: config.logoUrl,
        description: config.description,
        faqs: config.faqs,
        publicMode: config.publicMode,
      },
      resources: config.resources,
      subprocessors,
      policies,
      frameworks: frameworkInstances.map((fi) => ({
        id: fi.id,
        name: fi.framework.name,
        version: fi.framework.version,
        frameworkType: fi.framework.frameworkType,
        status: fi.status,
        targetMaturityLevel: fi.targetMaturityLevel,
        certifiedAt: fi.certifiedAt,
      })),
      controlPosture,
      evidenceFreshness,
      verifiedBadge: latestCertifiedInstance
        ? {
            framework: latestCertifiedInstance.framework.name,
            version: latestCertifiedInstance.framework.version,
            certifiedAt: latestCertifiedInstance.certifiedAt,
          }
        : null,
      generatedAt: new Date().toISOString(),
    },
  };
}

// ────── Public router (no auth) ──────

export const trustCenterPublicRouter: Router = Router();

trustCenterPublicRouter.get("/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Resolve config first so we know whether to serve a snapshot or live data.
    const orgRecord = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!orgRecord) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Trust Center not found" } });
      return;
    }

    const config = await prisma.trustCenterConfig.findUnique({
      where: { tenantId: orgRecord.id },
      select: { id: true, isEnabled: true, publicMode: true },
    });
    if (!config?.isEnabled) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Trust Center not enabled" },
      });
      return;
    }

    let payload: Record<string, unknown> | null = null;

    if (config.publicMode === "snapshot") {
      const latest = await prisma.trustCenterSnapshot.findFirst({
        where: { trustCenterConfigId: config.id },
        orderBy: { createdAt: "desc" },
        select: { payload: true, createdAt: true },
      });
      if (latest) {
        payload = {
          ...(latest.payload as Record<string, unknown>),
          snapshotPublishedAt: latest.createdAt.toISOString(),
        };
      }
      // Fall-through: if snapshot mode is set but no snapshot exists yet,
      // serve a live payload so the page isn't broken. Admin will see a
      // "no snapshot yet" warning in the dashboard.
    }

    if (!payload) {
      const built = await buildPublicPayload(slug);
      if (!built) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Trust Center not enabled" },
        });
        return;
      }
      payload = built.payload;
    }

    // Best-effort visit log — never block the response if Mongo is down.
    void prisma.trustCenterEvent
      .create({
        data: {
          tenantId: orgRecord.id,
          trustCenterConfigId: config.id,
          type: "view",
          visitorIp: req.ip ?? null,
          visitorUa: (req.headers["user-agent"] as string | undefined) ?? null,
        },
      })
      .catch((err) => console.error("[trust-center] view-event log failed", err));

    // CDN-friendly: 5 min shared cache aligns with Next.js revalidate window.
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    res.json({ success: true, data: payload });
  } catch (err) {
    next(err);
  }
});

// Visitor-side audit beacon — fired by the public page on resource clicks.
trustCenterPublicRouter.post("/:slug/event", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const body = eventBody.parse(req.body);

    const org = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!org) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Not found" } });
      return;
    }

    const config = await prisma.trustCenterConfig.findUnique({
      where: { tenantId: org.id },
      select: { id: true, isEnabled: true },
    });
    if (!config?.isEnabled) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Not found" } });
      return;
    }

    await prisma.trustCenterEvent.create({
      data: {
        tenantId: org.id,
        trustCenterConfigId: config.id,
        type: body.type,
        resourceId: body.resourceId ?? null,
        visitorIp: req.ip ?? null,
        visitorUa: (req.headers["user-agent"] as string | undefined) ?? null,
        ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
      },
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

trustCenterPublicRouter.get("/:slug/resources/:resourceId/download-url", async (req, res, next) => {
  try {
    const { slug, resourceId } = req.params;
    const org = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!org) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Not found" } });
      return;
    }

    const resource = await prisma.trustResource.findFirst({
      where: { id: resourceId, tenantId: org.id, isPublic: true },
      include: { trustCenterConfig: { select: { isEnabled: true } } },
    });

    if (!resource || !resource.trustCenterConfig.isEnabled) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Resource not found" } });
      return;
    }

    if (resource.accessGating !== "public") {
      res.status(403).json({
        success: false,
        error: { code: "ACCESS_GATED", message: "This resource requires an access request" },
      });
      return;
    }

    const url = await storage.getSignedUrl(resource.fileUrl, 3600);

    void prisma.trustCenterEvent
      .create({
        data: {
          tenantId: org.id,
          trustCenterConfigId: resource.trustCenterConfigId,
          type: "resource_download",
          resourceId: resource.id,
          visitorIp: req.ip ?? null,
          visitorUa: (req.headers["user-agent"] as string | undefined) ?? null,
        },
      })
      .catch((err) => console.error("[trust-center] download-event log failed", err));

    res.json({ success: true, data: { url, title: resource.title } });
  } catch (err) {
    next(err);
  }
});

// Submit access request for gated resources
trustCenterPublicRouter.post("/:slug/access-requests", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const body = accessRequestBody.parse(req.body);

    const org = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!org) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Organization not found" } });
      return;
    }

    const resource = await prisma.trustResource.findFirst({
      where: { id: body.resourceId, tenantId: org.id, isPublic: true },
      include: { trustCenterConfig: { select: { isEnabled: true } } },
    });

    if (!resource || !resource.trustCenterConfig.isEnabled) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Resource not found" } });
      return;
    }

    if (resource.accessGating === "public") {
      res.status(400).json({
        success: false,
        error: { code: "NOT_GATED", message: "This resource is publicly available" },
      });
      return;
    }

    if (resource.accessGating === "nda_required" && !body.ndaAccepted) {
      res.status(400).json({
        success: false,
        error: { code: "NDA_REQUIRED", message: "NDA acceptance is required for this resource" },
      });
      return;
    }

    const existing = await prisma.trustCenterAccessRequest.findFirst({
      where: {
        tenantId: org.id,
        resourceId: body.resourceId,
        requesterEmail: body.requesterEmail,
        status: { in: ["pending", "approved"] },
      },
    });

    if (existing) {
      if (existing.status === "approved" && existing.expiresAt && existing.expiresAt > new Date()) {
        res.json({
          success: true,
          data: { status: "already_approved", accessToken: existing.accessToken },
        });
        return;
      }
      if (existing.status === "pending") {
        res.json({ success: true, data: { status: "already_pending" } });
        return;
      }
    }

    const autoApprove = resource.accessGating === "contact_required";

    const accessRequest = await prisma.trustCenterAccessRequest.create({
      data: {
        tenantId: org.id,
        resourceId: body.resourceId,
        requesterName: body.requesterName,
        requesterEmail: body.requesterEmail,
        requesterCompany: body.requesterCompany,
        requesterTitle: body.requesterTitle ?? null,
        reason: body.reason ?? null,
        ndaAccepted: body.ndaAccepted ?? false,
        status: autoApprove ? "approved" : "pending",
        approvedAt: autoApprove ? new Date() : null,
        expiresAt: autoApprove ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      },
    });

    void prisma.trustCenterEvent
      .create({
        data: {
          tenantId: org.id,
          trustCenterConfigId: resource.trustCenterConfigId,
          type: "access_request",
          resourceId: resource.id,
          visitorIp: req.ip ?? null,
          visitorUa: (req.headers["user-agent"] as string | undefined) ?? null,
          visitorEmail: body.requesterEmail,
          metadata: {
            company: body.requesterCompany,
            autoApproved: autoApprove,
          } as Prisma.InputJsonValue,
        },
      })
      .catch((err) => console.error("[trust-center] access-request-event log failed", err));

    if (autoApprove) {
      res.status(201).json({
        success: true,
        data: { status: "approved", accessToken: accessRequest.accessToken },
      });
    } else {
      res.status(201).json({
        success: true,
        data: { status: "pending" },
      });
    }
  } catch (err) {
    next(err);
  }
});

// Tokens belong in request bodies — never in URL paths where they end up
// in proxy/server access logs and browser history. Use POST /access/download.
trustCenterPublicRouter.get("/access/:accessToken/download", (_req, res) => {
  res.status(410).json({
    success: false,
    error: {
      code: "GONE",
      message:
        "This endpoint has been removed for security. Use POST /api/v1/trust-center/public/access/download with the access token in the request body.",
    },
  });
});

// Tokens travel in the body so they don't leak to proxy / CDN access logs.
trustCenterPublicRouter.post("/access/download", async (req, res, next) => {
  try {
    const { accessToken } = accessDownloadBody.parse(req.body);
    const accessRequest = await prisma.trustCenterAccessRequest.findUnique({
      where: { accessToken },
      include: { resource: true },
    });

    if (!accessRequest) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Access request not found" },
      });
      return;
    }

    if (accessRequest.status !== "approved") {
      res.status(403).json({
        success: false,
        error: { code: "NOT_APPROVED", message: "Access request is still pending approval" },
      });
      return;
    }

    if (accessRequest.expiresAt && accessRequest.expiresAt < new Date()) {
      res
        .status(403)
        .json({ success: false, error: { code: "EXPIRED", message: "Access has expired" } });
      return;
    }

    const url = await storage.getSignedUrl(accessRequest.resource.fileUrl, 3600);
    res.json({ success: true, data: { url, title: accessRequest.resource.title } });
  } catch (err) {
    next(err);
  }
});

// ────── Authenticated router (admin) ──────

export const trustCenterRouter: Router = Router();
trustCenterRouter.use(authorizeResource("settings:read", "settings:write"));

// Trust Center is a Trustalo Enterprise feature. Every admin
// endpoint mounted below requires a valid EE license — without
// this, customers on lower tiers could build / publish a Trust
// Center even though the public-facing payload is also an EE
// surface. The public `trustCenterPublicRouter` is intentionally
// NOT gated: prospects visiting a vendor's Trust Center must still
// be able to load the page; gating the *publish* path here makes
// sure no public payload exists in the first place without EE.
trustCenterRouter.use(async (_req, _res, next) => {
  try {
    await assertEnterpriseLicense("trust-center");
    next();
  } catch (err) {
    next(err);
  }
});

trustCenterRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    let config = await db.trustCenterConfig.findFirst({});
    if (!config) {
      config = await db.trustCenterConfig.create({
        data: { tenantId },
      });
    }

    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
});

trustCenterRouter.patch("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = patchBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    let config = await db.trustCenterConfig.findFirst({});
    if (!config) {
      config = await db.trustCenterConfig.create({
        data: { tenantId },
      });
    }

    config = await db.trustCenterConfig.update({
      where: { id: config.id },
      data: body as Prisma.TrustCenterConfigUpdateInput,
    });

    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
});

// ────── Trust Resources ──────

trustCenterRouter.get("/resources", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const resources = await db.trustResource.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: resources });
  } catch (err) {
    next(err);
  }
});

trustCenterRouter.post("/resources", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    let config = await db.trustCenterConfig.findFirst({});
    if (!config) {
      config = await db.trustCenterConfig.create({
        data: { tenantId },
      });
    }

    const contentType = req.headers["content-type"] || "";
    const fileName = req.headers["x-file-name"] as string | undefined;
    const metaJson = req.headers["x-resource-meta"] as string | undefined;

    if (!contentType || !fileName) {
      return next(
        Object.assign(new Error("Content-Type and X-File-Name headers required"), { status: 400 }),
      );
    }

    let meta: z.infer<typeof createResourceBody>;
    try {
      meta = createResourceBody.parse(JSON.parse(decodeURIComponent(metaJson || "{}")));
    } catch {
      return next(
        Object.assign(
          new Error("X-Resource-Meta header must be valid JSON with title and resourceType"),
          { status: 400 },
        ),
      );
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
    const fileKey = `trust-center/${tenantId}/${Date.now()}.${ext}`;

    await storage.upload(fileKey, buffer, { contentType });

    const resource = await db.trustResource.create({
      data: {
        tenantId,
        trustCenterConfigId: config.id,
        title: meta.title,
        description: meta.description ?? null,
        frameworkType: meta.frameworkType ?? null,
        resourceType: meta.resourceType as any,
        fileUrl: fileKey,
        isPublic: meta.isPublic ?? false,
        accessGating: (meta.accessGating as any) ?? "public",
      },
    });

    res.status(201).json({ success: true, data: resource });
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

trustCenterRouter.patch("/resources/:resourceId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const resourceId = req.params.resourceId;
    const body = updateResourceBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const resource = await db.trustResource.update({
      where: { id: resourceId },
      data: body as Prisma.TrustResourceUpdateInput,
    });

    res.json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
});

trustCenterRouter.get("/resources/:resourceId/download-url", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const resourceId = req.params.resourceId;
    const db = prismaWithTenant(tenantId);

    const resource = await db.trustResource.findFirst({
      where: { id: resourceId },
    });
    if (!resource) {
      return next(Object.assign(new Error("Resource not found"), { status: 404 }));
    }

    const url = await storage.getSignedUrl(resource.fileUrl, 3600);
    res.json({ success: true, data: { url, title: resource.title } });
  } catch (err) {
    next(err);
  }
});

trustCenterRouter.delete("/resources/:resourceId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const resourceId = req.params.resourceId;
    const db = prismaWithTenant(tenantId);

    const resource = await db.trustResource.findFirst({
      where: { id: resourceId },
    });

    if (resource?.fileUrl) {
      try {
        await storage.delete(resource.fileUrl);
      } catch {
        /* file may not exist */
      }
    }

    await db.trustResource.delete({ where: { id: resourceId } });
    res.json({ success: true, data: { id: resourceId } });
  } catch (err) {
    next(err);
  }
});

// ────── Access Requests (admin) ──────

trustCenterRouter.get("/access-requests", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    const status = req.query.status as string | undefined;

    const where: Prisma.TrustCenterAccessRequestWhereInput = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      where.status = status as any;
    }

    const requests = await db.trustCenterAccessRequest.findMany({
      where,
      include: {
        resource: { select: { id: true, title: true, resourceType: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
});

trustCenterRouter.post("/access-requests/:requestId/approve", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { requestId } = req.params;
    const db = prismaWithTenant(tenantId);

    const existing = await db.trustCenterAccessRequest.findFirst({
      where: { id: requestId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Access request not found" },
      });
      return;
    }

    if (existing.status !== "pending") {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_STATUS", message: `Request is already ${existing.status}` },
      });
      return;
    }

    const updated = await db.trustCenterAccessRequest.update({
      where: { id: requestId },
      data: {
        status: "approved",
        approvedById: userId,
        approvedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: {
        resource: { select: { id: true, title: true, resourceType: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

trustCenterRouter.post("/access-requests/:requestId/reject", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { requestId } = req.params;
    const reason = (req.body.reason as string) || null;
    const db = prismaWithTenant(tenantId);

    const existing = await db.trustCenterAccessRequest.findFirst({
      where: { id: requestId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Access request not found" },
      });
      return;
    }

    if (existing.status !== "pending") {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_STATUS", message: `Request is already ${existing.status}` },
      });
      return;
    }

    const updated = await db.trustCenterAccessRequest.update({
      where: { id: requestId },
      data: {
        status: "rejected",
        rejectedReason: reason,
        approvedById: userId,
      },
      include: {
        resource: { select: { id: true, title: true, resourceType: true } },
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ────── Subprocessors (read-only view for admin) ──────

trustCenterRouter.get("/subprocessors", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const subprocessors = await db.vendor.findMany({
      where: { isSubprocessor: true, status: { not: "offboarded" } },
      select: {
        id: true,
        name: true,
        website: true,
        category: true,
        subprocessorPurpose: true,
        dataTypesShared: true,
        dataLocations: true,
        dpaStatus: true,
      },
      orderBy: { name: "asc" },
    });

    res.json({ success: true, data: subprocessors });
  } catch (err) {
    next(err);
  }
});

// ────── Snapshots (admin) ──────
//
// Snapshots let an admin freeze the public payload at a moment in time,
// so prospects see a stable view between formal review cycles. We store
// the entire builder output as JSON; on read, the public router serves
// the most recent row for that org when publicMode === 'snapshot'.

trustCenterRouter.get("/snapshots", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const snapshots = await db.trustCenterSnapshot.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        publishedById: true,
        publishedBy: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ success: true, data: snapshots });
  } catch (err) {
    next(err);
  }
});

trustCenterRouter.post("/snapshots", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const db = prismaWithTenant(tenantId);

    const config = await db.trustCenterConfig.findFirst({});
    if (!config) {
      res.status(400).json({
        success: false,
        error: { code: "NO_CONFIG", message: "Trust Center config not initialised" },
      });
      return;
    }

    const org = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true },
    });
    if (!org) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Organization not found" } });
      return;
    }

    const built = await buildPublicPayload(org.slug);
    if (!built) {
      res.status(400).json({
        success: false,
        error: {
          code: "NOT_PUBLISHABLE",
          message: "Trust Center must be enabled before publishing a snapshot",
        },
      });
      return;
    }

    const snapshot = await db.trustCenterSnapshot.create({
      data: {
        tenantId,
        trustCenterConfigId: config.id,
        publishedById: userId,
        payload: built.payload as Prisma.InputJsonValue,
      },
    });

    await audit(req, "create", "TrustCenterSnapshot", snapshot.id, {
      configId: config.id,
    });

    res.status(201).json({ success: true, data: snapshot });
  } catch (err) {
    next(err);
  }
});

// ────── Visitor events (admin) ──────

trustCenterRouter.get("/events", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const since = req.query.since
      ? new Date(req.query.since as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const type = req.query.type as string | undefined;

    const where: Prisma.TrustCenterEventWhereInput = {
      createdAt: { gte: since },
    };
    if (type && ["view", "resource_view", "resource_download", "access_request"].includes(type)) {
      where.type = type as any;
    }

    const [events, total] = await Promise.all([
      db.trustCenterEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          type: true,
          resourceId: true,
          visitorIp: true,
          visitorUa: true,
          visitorEmail: true,
          metadata: true,
          createdAt: true,
        },
      }),
      db.trustCenterEvent.count({ where }),
    ]);

    res.json({ success: true, data: { events, total } });
  } catch (err) {
    next(err);
  }
});
