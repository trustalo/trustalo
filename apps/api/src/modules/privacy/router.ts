import { Router } from "express";
import { z } from "zod";
import { prismaWithTenant } from "../../db/prisma.js";
import { audit } from "../../lib/audit.js";
import { authorizeResource } from "../../middleware/authorize.js";

// ─────────────────────────────────────────────────────────────────────────
// Enums (Zod mirrors of Prisma enums in privacy.prisma)
// ─────────────────────────────────────────────────────────────────────────

const lawfulBasis = z.enum([
  "consent",
  "contract",
  "legal_obligation",
  "vital_interests",
  "public_task",
  "legitimate_interests",
]);

const dataCategory = z.enum([
  "identity",
  "contact",
  "financial",
  "health",
  "location",
  "online_identifier",
  "demographic",
  "employment",
  "usage",
  "special_category",
  "criminal",
  "other",
]);

const subjectCategory = z.enum([
  "customer",
  "employee",
  "prospect",
  "supplier_contact",
  "minor",
  "website_visitor",
  "patient",
  "other",
]);

const transferMechanism = z.enum([
  "none_eu_eea",
  "adequacy_decision",
  "scc",
  "bcr",
  "derogation_art_49",
]);

const processingRole = z.enum(["controller", "processor", "joint_controller"]);

const processingActivityStatus = z.enum(["draft", "active", "under_review", "retired"]);

const dpiaStatus = z.enum(["draft", "in_review", "approved", "rejected"]);
const dpiaNecessity = z.enum(["required", "recommended", "not_required"]);

const dataBreachSeverity = z.enum(["low", "medium", "high", "critical"]);
const dataBreachCategory = z.enum(["confidentiality", "integrity", "availability", "combined"]);
const dataBreachStatus = z.enum(["open", "investigating", "contained", "notified", "closed"]);

const dsarType = z.enum([
  "access",
  "rectification",
  "erasure",
  "restriction",
  "portability",
  "objection",
  "automated_decision",
  "withdraw_consent",
]);

const dsarStatus = z.enum([
  "received",
  "identity_pending",
  "in_progress",
  "extended",
  "fulfilled",
  "refused",
  "closed",
]);

const dsarChannel = z.enum(["email", "web_form", "post", "phone", "in_person"]);

const riskRating = z.enum(["low", "medium", "high"]);

// ─────────────────────────────────────────────────────────────────────────
// Common selects & helpers
// ─────────────────────────────────────────────────────────────────────────

const userSelect = { id: true, name: true, email: true } as const;

const processingActivitySummarySelect = {
  id: true,
  name: true,
  role: true,
  lawfulBasis: true,
  status: true,
} as const;

/**
 * GDPR Art. 33(1) — controllers must notify the supervisory authority within
 * 72 hours after becoming aware of a personal data breach. We store the
 * deadline explicitly so the UI can render a countdown without recomputing.
 */
function computeBreachDeadline(discoveredAt: Date): Date {
  return new Date(discoveredAt.getTime() + 72 * 60 * 60 * 1000);
}

/**
 * GDPR Art. 12(3) — controllers must respond to DSARs within one month of
 * receipt. The period may be extended by two further months where necessary.
 */
function computeDsarDueDate(receivedAt: Date): Date {
  const due = new Date(receivedAt);
  due.setMonth(due.getMonth() + 1);
  return due;
}

function computeDsarExtendedDueDate(receivedAt: Date): Date {
  const due = new Date(receivedAt);
  due.setMonth(due.getMonth() + 3);
  return due;
}

// ─────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────

export const privacyRouter: Router = Router();
privacyRouter.use(authorizeResource("privacy:read", "privacy:write"));

// ───────────────────────────────────────────────────────────────────────
// /stats — workspace-level rollup KPIs
// ───────────────────────────────────────────────────────────────────────

privacyRouter.get("/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const now = new Date();
    const inThirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      activitiesTotal,
      activitiesByStatus,
      activitiesDueForReview,
      dpiasTotal,
      dpiasByStatus,
      breachesTotal,
      breachesOpen,
      breachesNotificationDue,
      dsarsTotal,
      dsarsByStatus,
      dsarsOverdue,
    ] = await Promise.all([
      db.processingActivity.count(),
      db.processingActivity.groupBy({ by: ["status"], _count: true }),
      db.processingActivity.count({
        where: { nextReviewAt: { lte: inThirtyDays } },
      }),
      db.dPIA.count(),
      db.dPIA.groupBy({ by: ["status"], _count: true }),
      db.dataBreach.count(),
      db.dataBreach.count({
        where: { status: { in: ["open", "investigating"] } },
      }),
      db.dataBreach.count({
        where: {
          notificationDeadlineAt: { lte: now },
          supervisoryAuthorityNotifiedAt: null,
          supervisoryAuthorityNotificationRequired: true,
        },
      }),
      db.dSARRequest.count(),
      db.dSARRequest.groupBy({ by: ["status"], _count: true }),
      db.dSARRequest.count({
        where: {
          status: {
            notIn: ["fulfilled", "refused", "closed"],
          },
          OR: [{ extendedDueAt: null, dueAt: { lte: now } }, { extendedDueAt: { lte: now } }],
        },
      }),
    ]);

    const toMap = (rows: { _count: number }[], key: string): Record<string, number> => {
      const out: Record<string, number> = {};
      for (const r of rows as Array<{ _count: number } & Record<string, string>>) {
        out[r[key]!] = r._count;
      }
      return out;
    };

    res.json({
      success: true,
      data: {
        processingActivities: {
          total: activitiesTotal,
          byStatus: toMap(activitiesByStatus, "status"),
          dueForReview: activitiesDueForReview,
        },
        dpias: {
          total: dpiasTotal,
          byStatus: toMap(dpiasByStatus, "status"),
        },
        breaches: {
          total: breachesTotal,
          open: breachesOpen,
          notificationDeadlinePassed: breachesNotificationDue,
        },
        dsars: {
          total: dsarsTotal,
          byStatus: toMap(dsarsByStatus, "status"),
          overdue: dsarsOverdue,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Records of Processing Activities (Art. 30)
// ─────────────────────────────────────────────────────────────────────────

const activityListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  status: processingActivityStatus.optional(),
  role: processingRole.optional(),
  lawfulBasis: lawfulBasis.optional(),
  ownerId: z.string().optional(),
  dueForReview: z.coerce.boolean().optional(),
  sortBy: z.enum(["name", "status", "nextReviewAt", "updatedAt", "createdAt"]).default("updatedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

const activityCreateBody = z.object({
  name: z.string().min(1),
  purpose: z.string().min(1),
  role: processingRole.optional(),
  lawfulBasis,
  lawfulBasisJustification: z.string().nullable().optional(),
  dataCategories: z.array(dataCategory).optional(),
  subjectCategories: z.array(subjectCategory).optional(),
  dataElements: z.array(z.string()).optional(),
  recipients: z.array(z.string()).optional(),
  crossBorderTransfer: z.boolean().optional(),
  transferMechanism: transferMechanism.nullable().optional(),
  transferDestinations: z.array(z.string()).optional(),
  retentionPeriod: z.string().nullable().optional(),
  securityMeasures: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  status: processingActivityStatus.optional(),
  nextReviewAt: z.coerce.date().nullable().optional(),
  vendorIds: z.array(z.string()).optional(),
});

const activityUpdateBody = activityCreateBody.partial();

const activityInclude = {
  owner: { select: userSelect },
  vendors: { select: { id: true, name: true, riskTier: true } },
  _count: { select: { dpias: true, breaches: true, risks: true } },
} as const;

privacyRouter.get("/processing-activities", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = activityListQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.role) where.role = query.role;
    if (query.lawfulBasis) where.lawfulBasis = query.lawfulBasis;
    if (query.ownerId) where.ownerId = query.ownerId;
    if (query.dueForReview) {
      where.nextReviewAt = { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { purpose: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const orderBy: Record<string, unknown> =
      query.sortBy === "nextReviewAt"
        ? { nextReviewAt: { sort: query.sortDir, nulls: "last" } }
        : { [query.sortBy]: query.sortDir };

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      db.processingActivity.findMany({
        where,
        include: activityInclude,
        orderBy,
        skip,
        take: query.limit,
      }),
      db.processingActivity.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page: query.page, limit: query.limit },
    });
  } catch (err) {
    next(err);
  }
});

privacyRouter.get("/processing-activities/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const db = prismaWithTenant(tenantId);

    const activity = await db.processingActivity.findUnique({
      where: { id },
      include: {
        ...activityInclude,
        dpias: {
          select: {
            id: true,
            title: true,
            status: true,
            necessity: true,
            residualRisk: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        breaches: {
          select: { id: true, title: true, status: true, severity: true, discoveredAt: true },
          orderBy: { discoveredAt: "desc" },
          take: 10,
        },
        risks: {
          select: { id: true, title: true, status: true, riskScore: true },
          take: 10,
        },
      },
    });

    if (!activity) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Processing activity not found" },
      });
      return;
    }

    res.json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
});

privacyRouter.post("/processing-activities", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = activityCreateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const activity = await db.processingActivity.create({
      data: {
        tenantId,
        name: body.name,
        purpose: body.purpose,
        role: body.role ?? "controller",
        lawfulBasis: body.lawfulBasis,
        lawfulBasisJustification: body.lawfulBasisJustification ?? null,
        dataCategories: body.dataCategories ?? [],
        subjectCategories: body.subjectCategories ?? [],
        dataElements: body.dataElements ?? [],
        recipients: body.recipients ?? [],
        crossBorderTransfer: body.crossBorderTransfer ?? false,
        transferMechanism: body.transferMechanism ?? null,
        transferDestinations: body.transferDestinations ?? [],
        retentionPeriod: body.retentionPeriod ?? null,
        securityMeasures: body.securityMeasures ?? null,
        ownerId: body.ownerId ?? null,
        status: body.status ?? "draft",
        nextReviewAt: body.nextReviewAt ?? null,
        ...(body.vendorIds && body.vendorIds.length > 0
          ? { vendors: { connect: body.vendorIds.map((id) => ({ id })) } }
          : {}),
      },
      include: activityInclude,
    });

    await audit(req, "create", "ProcessingActivity", activity.id, { name: activity.name });
    res.status(201).json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
});

privacyRouter.patch("/processing-activities/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const body = activityUpdateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.processingActivity.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Processing activity not found" },
      });
      return;
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.purpose !== undefined) data.purpose = body.purpose;
    if (body.role !== undefined) data.role = body.role;
    if (body.lawfulBasis !== undefined) data.lawfulBasis = body.lawfulBasis;
    if (body.lawfulBasisJustification !== undefined)
      data.lawfulBasisJustification = body.lawfulBasisJustification;
    if (body.dataCategories !== undefined) data.dataCategories = body.dataCategories;
    if (body.subjectCategories !== undefined) data.subjectCategories = body.subjectCategories;
    if (body.dataElements !== undefined) data.dataElements = body.dataElements;
    if (body.recipients !== undefined) data.recipients = body.recipients;
    if (body.crossBorderTransfer !== undefined) data.crossBorderTransfer = body.crossBorderTransfer;
    if (body.transferMechanism !== undefined) data.transferMechanism = body.transferMechanism;
    if (body.transferDestinations !== undefined)
      data.transferDestinations = body.transferDestinations;
    if (body.retentionPeriod !== undefined) data.retentionPeriod = body.retentionPeriod;
    if (body.securityMeasures !== undefined) data.securityMeasures = body.securityMeasures;
    if (body.ownerId !== undefined) data.ownerId = body.ownerId;
    if (body.status !== undefined) data.status = body.status;
    if (body.nextReviewAt !== undefined) data.nextReviewAt = body.nextReviewAt;
    if (body.vendorIds !== undefined) {
      data.vendors = { set: body.vendorIds.map((vid) => ({ id: vid })) };
    }

    const activity = await db.processingActivity.update({
      where: { id },
      data,
      include: activityInclude,
    });

    await audit(req, "update", "ProcessingActivity", activity.id, {
      changedFields: Object.keys(data),
    });
    res.json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
});

privacyRouter.post("/processing-activities/:id/mark-reviewed", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const db = prismaWithTenant(tenantId);

    const existing = await db.processingActivity.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Processing activity not found" },
      });
      return;
    }

    const now = new Date();
    const next = new Date(now);
    next.setFullYear(next.getFullYear() + 1);

    const activity = await db.processingActivity.update({
      where: { id },
      data: { lastReviewedAt: now, nextReviewAt: next, status: "active" },
      include: activityInclude,
    });

    await audit(req, "update", "ProcessingActivity", activity.id, {
      transition: "mark_reviewed",
    });
    res.json({ success: true, data: activity });
  } catch (err) {
    next(err);
  }
});

privacyRouter.delete("/processing-activities/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const db = prismaWithTenant(tenantId);

    const existing = await db.processingActivity.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Processing activity not found" },
      });
      return;
    }

    await db.processingActivity.delete({ where: { id } });
    await audit(req, "delete", "ProcessingActivity", id, { name: existing.name });
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// DPIAs (Art. 35)
// ─────────────────────────────────────────────────────────────────────────

const dpiaListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  status: dpiaStatus.optional(),
  necessity: dpiaNecessity.optional(),
  processingActivityId: z.string().optional(),
  sortBy: z.enum(["createdAt", "status", "updatedAt"]).default("updatedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

const dpiaCreateBody = z.object({
  processingActivityId: z.string().min(1),
  title: z.string().min(1),
  necessity: dpiaNecessity.optional(),
  necessityProportionality: z.string().nullable().optional(),
  riskToRights: z.string().nullable().optional(),
  mitigations: z.string().nullable().optional(),
  consultedDpo: z.boolean().optional(),
  consultedDataSubjects: z.boolean().optional(),
  residualRisk: riskRating.nullable().optional(),
  status: dpiaStatus.optional(),
});

const dpiaUpdateBody = dpiaCreateBody.partial().omit({ processingActivityId: true });

const dpiaInclude = {
  processingActivity: { select: processingActivitySummarySelect },
  assessedBy: { select: userSelect },
  approvedBy: { select: userSelect },
} as const;

privacyRouter.get("/dpias", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = dpiaListQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.necessity) where.necessity = query.necessity;
    if (query.processingActivityId) where.processingActivityId = query.processingActivityId;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { riskToRights: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      db.dPIA.findMany({
        where,
        include: dpiaInclude,
        orderBy: { [query.sortBy]: query.sortDir },
        skip,
        take: query.limit,
      }),
      db.dPIA.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page: query.page, limit: query.limit },
    });
  } catch (err) {
    next(err);
  }
});

privacyRouter.get("/dpias/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const db = prismaWithTenant(tenantId);

    const dpia = await db.dPIA.findUnique({ where: { id }, include: dpiaInclude });
    if (!dpia) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "DPIA not found" },
      });
      return;
    }
    res.json({ success: true, data: dpia });
  } catch (err) {
    next(err);
  }
});

privacyRouter.post("/dpias", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const body = dpiaCreateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const activity = await db.processingActivity.findUnique({
      where: { id: body.processingActivityId },
    });
    if (!activity) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Processing activity not found" },
      });
      return;
    }

    const dpia = await db.dPIA.create({
      data: {
        tenantId,
        processingActivityId: body.processingActivityId,
        assessedById: userId,
        title: body.title,
        necessity: body.necessity ?? "required",
        necessityProportionality: body.necessityProportionality ?? null,
        riskToRights: body.riskToRights ?? null,
        mitigations: body.mitigations ?? null,
        consultedDpo: body.consultedDpo ?? false,
        consultedDataSubjects: body.consultedDataSubjects ?? false,
        residualRisk: body.residualRisk ?? null,
        status: body.status ?? "draft",
      },
      include: dpiaInclude,
    });

    await audit(req, "create", "DPIA", dpia.id, {
      title: dpia.title,
      processingActivityId: dpia.processingActivityId,
    });
    res.status(201).json({ success: true, data: dpia });
  } catch (err) {
    next(err);
  }
});

privacyRouter.patch("/dpias/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const body = dpiaUpdateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.dPIA.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "DPIA not found" },
      });
      return;
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.necessity !== undefined) data.necessity = body.necessity;
    if (body.necessityProportionality !== undefined)
      data.necessityProportionality = body.necessityProportionality;
    if (body.riskToRights !== undefined) data.riskToRights = body.riskToRights;
    if (body.mitigations !== undefined) data.mitigations = body.mitigations;
    if (body.consultedDpo !== undefined) data.consultedDpo = body.consultedDpo;
    if (body.consultedDataSubjects !== undefined)
      data.consultedDataSubjects = body.consultedDataSubjects;
    if (body.residualRisk !== undefined) data.residualRisk = body.residualRisk;
    if (body.status !== undefined) data.status = body.status;

    const dpia = await db.dPIA.update({ where: { id }, data, include: dpiaInclude });
    await audit(req, "update", "DPIA", dpia.id, { changedFields: Object.keys(data) });
    res.json({ success: true, data: dpia });
  } catch (err) {
    next(err);
  }
});

privacyRouter.post("/dpias/:id/transition", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const id = z.string().min(1).parse(req.params.id);
    const body = z.object({ status: dpiaStatus }).parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.dPIA.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "DPIA not found" },
      });
      return;
    }

    const data: Record<string, unknown> = { status: body.status };
    if (body.status === "approved") {
      data.approvedById = userId;
      data.approvedAt = new Date();
    }
    if (body.status === "draft" || body.status === "rejected") {
      data.approvedById = null;
      data.approvedAt = null;
    }

    const dpia = await db.dPIA.update({ where: { id }, data, include: dpiaInclude });
    // DPIA approve/reject are governance decisions worth a first-class audit
    // action rather than a generic "update".
    const action =
      body.status === "approved" ? "approve" : body.status === "rejected" ? "reject" : "update";
    await audit(req, action, "DPIA", dpia.id, {
      transition: body.status,
      previousStatus: existing.status,
    });
    res.json({ success: true, data: dpia });
  } catch (err) {
    next(err);
  }
});

privacyRouter.delete("/dpias/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const db = prismaWithTenant(tenantId);

    const existing = await db.dPIA.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "DPIA not found" },
      });
      return;
    }

    await db.dPIA.delete({ where: { id } });
    await audit(req, "delete", "DPIA", id, { title: existing.title });
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Personal-Data Breach Register (Arts. 33 / 34)
// ─────────────────────────────────────────────────────────────────────────

const breachListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  status: dataBreachStatus.optional(),
  severity: dataBreachSeverity.optional(),
  category: dataBreachCategory.optional(),
  // Filter to breaches whose 72-hour notification deadline has passed but the
  // SA has not yet been notified — surfaces the most urgent items.
  notificationOverdue: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["discoveredAt", "notificationDeadlineAt", "severity", "status", "updatedAt"])
    .default("notificationDeadlineAt"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

const breachCreateBody = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  category: dataBreachCategory,
  severity: dataBreachSeverity,
  status: dataBreachStatus.optional(),
  occurredAt: z.coerce.date().nullable().optional(),
  discoveredAt: z.coerce.date().optional(),
  // Allow override of the auto-computed 72h deadline (rare).
  notificationDeadlineAt: z.coerce.date().optional(),
  affectedRecordsEstimate: z.number().int().min(0).nullable().optional(),
  affectedSubjectCategories: z.array(subjectCategory).optional(),
  dataCategoriesInvolved: z.array(dataCategory).optional(),
  rootCause: z.string().nullable().optional(),
  containment: z.string().nullable().optional(),
  remediation: z.string().nullable().optional(),
  supervisoryAuthorityNotificationRequired: z.boolean().optional(),
  dataSubjectsNotificationRequired: z.boolean().optional(),
  processingActivityId: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
});

const breachUpdateBody = breachCreateBody.partial();

const breachInclude = {
  processingActivity: { select: processingActivitySummarySelect },
  reportedBy: { select: userSelect },
  assignee: { select: userSelect },
} as const;

privacyRouter.get("/data-breaches", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = breachListQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.category) where.category = query.category;
    if (query.notificationOverdue) {
      where.notificationDeadlineAt = { lte: new Date() };
      where.supervisoryAuthorityNotifiedAt = null;
      where.supervisoryAuthorityNotificationRequired = true;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      db.dataBreach.findMany({
        where,
        include: breachInclude,
        orderBy: { [query.sortBy]: query.sortDir },
        skip,
        take: query.limit,
      }),
      db.dataBreach.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page: query.page, limit: query.limit },
    });
  } catch (err) {
    next(err);
  }
});

privacyRouter.get("/data-breaches/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const db = prismaWithTenant(tenantId);

    const breach = await db.dataBreach.findUnique({
      where: { id },
      include: breachInclude,
    });
    if (!breach) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Data breach not found" },
      });
      return;
    }
    res.json({ success: true, data: breach });
  } catch (err) {
    next(err);
  }
});

privacyRouter.post("/data-breaches", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const body = breachCreateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    if (body.processingActivityId) {
      const activity = await db.processingActivity.findUnique({
        where: { id: body.processingActivityId },
      });
      if (!activity) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Processing activity not found" },
        });
        return;
      }
    }

    const discoveredAt = body.discoveredAt ?? new Date();
    const notificationDeadlineAt =
      body.notificationDeadlineAt ?? computeBreachDeadline(discoveredAt);

    const breach = await db.dataBreach.create({
      data: {
        tenantId,
        processingActivityId: body.processingActivityId ?? null,
        title: body.title,
        description: body.description ?? null,
        category: body.category,
        severity: body.severity,
        status: body.status ?? "open",
        occurredAt: body.occurredAt ?? null,
        discoveredAt,
        notificationDeadlineAt,
        affectedRecordsEstimate: body.affectedRecordsEstimate ?? null,
        affectedSubjectCategories: body.affectedSubjectCategories ?? [],
        dataCategoriesInvolved: body.dataCategoriesInvolved ?? [],
        rootCause: body.rootCause ?? null,
        containment: body.containment ?? null,
        remediation: body.remediation ?? null,
        supervisoryAuthorityNotificationRequired:
          body.supervisoryAuthorityNotificationRequired ?? false,
        dataSubjectsNotificationRequired: body.dataSubjectsNotificationRequired ?? false,
        reportedById: userId,
        assigneeId: body.assigneeId ?? null,
      },
      include: breachInclude,
    });

    await audit(req, "create", "DataBreach", breach.id, {
      title: breach.title,
      severity: breach.severity,
      category: breach.category,
      notificationDeadlineAt: breach.notificationDeadlineAt,
    });
    res.status(201).json({ success: true, data: breach });
  } catch (err) {
    next(err);
  }
});

privacyRouter.patch("/data-breaches/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const body = breachUpdateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.dataBreach.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Data breach not found" },
      });
      return;
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.category !== undefined) data.category = body.category;
    if (body.severity !== undefined) data.severity = body.severity;
    if (body.status !== undefined) data.status = body.status;
    if (body.occurredAt !== undefined) data.occurredAt = body.occurredAt;
    // If the discovery moment shifts, recompute the 72h deadline unless the
    // caller supplies an explicit override.
    if (body.discoveredAt !== undefined) {
      data.discoveredAt = body.discoveredAt;
      if (body.notificationDeadlineAt === undefined) {
        data.notificationDeadlineAt = computeBreachDeadline(body.discoveredAt);
      }
    }
    if (body.notificationDeadlineAt !== undefined)
      data.notificationDeadlineAt = body.notificationDeadlineAt;
    if (body.affectedRecordsEstimate !== undefined)
      data.affectedRecordsEstimate = body.affectedRecordsEstimate;
    if (body.affectedSubjectCategories !== undefined)
      data.affectedSubjectCategories = body.affectedSubjectCategories;
    if (body.dataCategoriesInvolved !== undefined)
      data.dataCategoriesInvolved = body.dataCategoriesInvolved;
    if (body.rootCause !== undefined) data.rootCause = body.rootCause;
    if (body.containment !== undefined) data.containment = body.containment;
    if (body.remediation !== undefined) data.remediation = body.remediation;
    if (body.supervisoryAuthorityNotificationRequired !== undefined) {
      data.supervisoryAuthorityNotificationRequired = body.supervisoryAuthorityNotificationRequired;
    }
    if (body.dataSubjectsNotificationRequired !== undefined) {
      data.dataSubjectsNotificationRequired = body.dataSubjectsNotificationRequired;
    }
    if (body.processingActivityId !== undefined)
      data.processingActivityId = body.processingActivityId;
    if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId;

    const breach = await db.dataBreach.update({ where: { id }, data, include: breachInclude });
    await audit(req, "update", "DataBreach", breach.id, { changedFields: Object.keys(data) });
    res.json({ success: true, data: breach });
  } catch (err) {
    next(err);
  }
});

const breachTransitionBody = z
  .object({
    status: dataBreachStatus,
    supervisoryAuthorityReference: z.string().nullable().optional(),
  })
  .strict();

privacyRouter.post("/data-breaches/:id/transition", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const body = breachTransitionBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.dataBreach.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Data breach not found" },
      });
      return;
    }

    const now = new Date();
    const data: Record<string, unknown> = { status: body.status };
    if (body.status === "contained" && !existing.containedAt) data.containedAt = now;
    if (body.status === "notified" && !existing.supervisoryAuthorityNotifiedAt) {
      data.supervisoryAuthorityNotifiedAt = now;
    }
    if (body.supervisoryAuthorityReference !== undefined) {
      data.supervisoryAuthorityReference = body.supervisoryAuthorityReference;
    }
    if (body.status === "closed" && !existing.resolvedAt) data.resolvedAt = now;

    const breach = await db.dataBreach.update({ where: { id }, data, include: breachInclude });
    await audit(req, "update", "DataBreach", breach.id, {
      transition: body.status,
      previousStatus: existing.status,
      supervisoryAuthorityNotifiedAt: data.supervisoryAuthorityNotifiedAt,
    });
    res.json({ success: true, data: breach });
  } catch (err) {
    next(err);
  }
});

privacyRouter.post("/data-breaches/:id/notify-subjects", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const db = prismaWithTenant(tenantId);

    const existing = await db.dataBreach.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Data breach not found" },
      });
      return;
    }

    const breach = await db.dataBreach.update({
      where: { id },
      data: {
        dataSubjectsNotifiedAt: new Date(),
        dataSubjectsNotificationRequired: true,
      },
      include: breachInclude,
    });

    await audit(req, "update", "DataBreach", breach.id, {
      transition: "notify_subjects",
      dataSubjectsNotifiedAt: breach.dataSubjectsNotifiedAt,
    });
    res.json({ success: true, data: breach });
  } catch (err) {
    next(err);
  }
});

privacyRouter.delete("/data-breaches/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const db = prismaWithTenant(tenantId);

    const existing = await db.dataBreach.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Data breach not found" },
      });
      return;
    }

    await db.dataBreach.delete({ where: { id } });
    await audit(req, "delete", "DataBreach", id, { title: existing.title });
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Data-Subject Access Requests (Arts. 12–22)
// ─────────────────────────────────────────────────────────────────────────

const dsarListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  status: dsarStatus.optional(),
  requestType: dsarType.optional(),
  channel: dsarChannel.optional(),
  // Surfaces requests whose effective due date (extendedDueAt ?? dueAt) is in
  // the past and the request is still open.
  overdue: z.coerce.boolean().optional(),
  sortBy: z.enum(["receivedAt", "dueAt", "status", "requestType", "updatedAt"]).default("dueAt"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

const dsarCreateBody = z.object({
  subjectName: z.string().min(1),
  subjectEmail: z.string().email().nullable().optional(),
  subjectIdentifier: z.string().nullable().optional(),
  requestType: dsarType,
  channel: dsarChannel,
  status: dsarStatus.optional(),
  receivedAt: z.coerce.date().optional(),
  responseNotes: z.string().nullable().optional(),
  refusalReason: z.string().nullable().optional(),
  responseFileKey: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  processingActivityIds: z.array(z.string()).optional(),
});

const dsarUpdateBody = dsarCreateBody.partial();

const dsarInclude = {
  assignee: { select: userSelect },
  processingActivities: { select: processingActivitySummarySelect },
} as const;

privacyRouter.get("/dsars", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = dsarListQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.requestType) where.requestType = query.requestType;
    if (query.channel) where.channel = query.channel;
    if (query.overdue) {
      const now = new Date();
      where.status = { notIn: ["fulfilled", "refused", "closed"] };
      where.OR = [{ extendedDueAt: null, dueAt: { lte: now } }, { extendedDueAt: { lte: now } }];
    }
    if (query.search) {
      where.OR = [
        ...((where.OR as unknown[]) ?? []),
        { subjectName: { contains: query.search, mode: "insensitive" } },
        { subjectEmail: { contains: query.search, mode: "insensitive" } },
        { subjectIdentifier: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      db.dSARRequest.findMany({
        where,
        include: dsarInclude,
        orderBy: { [query.sortBy]: query.sortDir },
        skip,
        take: query.limit,
      }),
      db.dSARRequest.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page: query.page, limit: query.limit },
    });
  } catch (err) {
    next(err);
  }
});

privacyRouter.get("/dsars/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const db = prismaWithTenant(tenantId);

    const dsar = await db.dSARRequest.findUnique({ where: { id }, include: dsarInclude });
    if (!dsar) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "DSAR not found" },
      });
      return;
    }
    res.json({ success: true, data: dsar });
  } catch (err) {
    next(err);
  }
});

privacyRouter.post("/dsars", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = dsarCreateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const receivedAt = body.receivedAt ?? new Date();
    const dueAt = computeDsarDueDate(receivedAt);

    const dsar = await db.dSARRequest.create({
      data: {
        tenantId,
        subjectName: body.subjectName,
        subjectEmail: body.subjectEmail ?? null,
        subjectIdentifier: body.subjectIdentifier ?? null,
        requestType: body.requestType,
        channel: body.channel,
        status: body.status ?? "received",
        receivedAt,
        dueAt,
        responseNotes: body.responseNotes ?? null,
        refusalReason: body.refusalReason ?? null,
        responseFileKey: body.responseFileKey ?? null,
        assigneeId: body.assigneeId ?? null,
        ...(body.processingActivityIds && body.processingActivityIds.length > 0
          ? {
              processingActivities: {
                connect: body.processingActivityIds.map((id) => ({ id })),
              },
            }
          : {}),
      },
      include: dsarInclude,
    });

    await audit(req, "create", "DSARRequest", dsar.id, {
      requestType: dsar.requestType,
      channel: dsar.channel,
      // Subject email is intentionally omitted from the audit trail to avoid
      // duplicating personal data into the audit store.
      dueAt: dsar.dueAt,
    });
    res.status(201).json({ success: true, data: dsar });
  } catch (err) {
    next(err);
  }
});

privacyRouter.patch("/dsars/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const body = dsarUpdateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.dSARRequest.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "DSAR not found" },
      });
      return;
    }

    const data: Record<string, unknown> = {};
    if (body.subjectName !== undefined) data.subjectName = body.subjectName;
    if (body.subjectEmail !== undefined) data.subjectEmail = body.subjectEmail;
    if (body.subjectIdentifier !== undefined) data.subjectIdentifier = body.subjectIdentifier;
    if (body.requestType !== undefined) data.requestType = body.requestType;
    if (body.channel !== undefined) data.channel = body.channel;
    if (body.status !== undefined) data.status = body.status;
    if (body.receivedAt !== undefined) {
      data.receivedAt = body.receivedAt;
      // Re-anchor the due date if the receipt moment shifted (rare).
      data.dueAt = computeDsarDueDate(body.receivedAt);
    }
    if (body.responseNotes !== undefined) data.responseNotes = body.responseNotes;
    if (body.refusalReason !== undefined) data.refusalReason = body.refusalReason;
    if (body.responseFileKey !== undefined) data.responseFileKey = body.responseFileKey;
    if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId;
    if (body.processingActivityIds !== undefined) {
      data.processingActivities = {
        set: body.processingActivityIds.map((pid) => ({ id: pid })),
      };
    }

    const dsar = await db.dSARRequest.update({ where: { id }, data, include: dsarInclude });
    await audit(req, "update", "DSARRequest", dsar.id, { changedFields: Object.keys(data) });
    res.json({ success: true, data: dsar });
  } catch (err) {
    next(err);
  }
});

privacyRouter.post("/dsars/:id/extend", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const db = prismaWithTenant(tenantId);

    const existing = await db.dSARRequest.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "DSAR not found" },
      });
      return;
    }
    if (existing.extendedAt) {
      res.status(409).json({
        success: false,
        error: {
          code: "ALREADY_EXTENDED",
          message:
            "DSAR has already been extended under Art. 12(3); the law caps the extension at two further months.",
        },
      });
      return;
    }

    const now = new Date();
    const dsar = await db.dSARRequest.update({
      where: { id },
      data: {
        extendedAt: now,
        extendedDueAt: computeDsarExtendedDueDate(existing.receivedAt),
        status: "extended",
      },
      include: dsarInclude,
    });

    await audit(req, "update", "DSARRequest", dsar.id, {
      transition: "extend",
      extendedDueAt: dsar.extendedDueAt,
    });
    res.json({ success: true, data: dsar });
  } catch (err) {
    next(err);
  }
});

privacyRouter.post("/dsars/:id/verify-identity", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const db = prismaWithTenant(tenantId);

    const existing = await db.dSARRequest.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "DSAR not found" },
      });
      return;
    }

    const dsar = await db.dSARRequest.update({
      where: { id },
      data: {
        identityVerifiedAt: new Date(),
        status: existing.status === "identity_pending" ? "in_progress" : existing.status,
      },
      include: dsarInclude,
    });

    await audit(req, "update", "DSARRequest", dsar.id, {
      transition: "verify_identity",
      identityVerifiedAt: dsar.identityVerifiedAt,
    });
    res.json({ success: true, data: dsar });
  } catch (err) {
    next(err);
  }
});

privacyRouter.post("/dsars/:id/transition", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const body = z
      .object({
        status: dsarStatus,
        responseNotes: z.string().nullable().optional(),
        refusalReason: z.string().nullable().optional(),
      })
      .parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.dSARRequest.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "DSAR not found" },
      });
      return;
    }

    const now = new Date();
    const data: Record<string, unknown> = { status: body.status };
    if (body.status === "fulfilled" && !existing.fulfilledAt) data.fulfilledAt = now;
    if (body.status === "closed" && !existing.closedAt) data.closedAt = now;
    if (body.responseNotes !== undefined) data.responseNotes = body.responseNotes;
    if (body.refusalReason !== undefined) data.refusalReason = body.refusalReason;

    const dsar = await db.dSARRequest.update({ where: { id }, data, include: dsarInclude });
    // DSAR fulfilment / refusal are subject-rights decisions worth a richer
    // audit signal than a generic update.
    const action =
      body.status === "fulfilled" ? "approve" : body.status === "refused" ? "reject" : "update";
    await audit(req, action, "DSARRequest", dsar.id, {
      transition: body.status,
      previousStatus: existing.status,
    });
    res.json({ success: true, data: dsar });
  } catch (err) {
    next(err);
  }
});

privacyRouter.delete("/dsars/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const id = z.string().min(1).parse(req.params.id);
    const db = prismaWithTenant(tenantId);

    const existing = await db.dSARRequest.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "DSAR not found" },
      });
      return;
    }

    await db.dSARRequest.delete({ where: { id } });
    await audit(req, "delete", "DSARRequest", id, {
      requestType: existing.requestType,
    });
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Sub-processors saved view (Vendor read-through filtered to GDPR processors)
//
// Frontend "Sub-processors" tab is implemented as a filter on the existing
// Vendor model rather than a duplicate registry, with the M:M back-reference
// to ProcessingActivity letting us enrich each row with the activities the
// vendor processes data for.
// ─────────────────────────────────────────────────────────────────────────

privacyRouter.get("/sub-processors", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = z
      .object({
        search: z.string().optional(),
        dpaStatus: z
          .enum(["not_required", "not_started", "requested", "received", "approved", "expired"])
          .optional(),
      })
      .parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {
      OR: [{ isSubprocessor: true }, { processingActivities: { some: {} } }],
    };
    if (query.dpaStatus) where.dpaStatus = query.dpaStatus;
    if (query.search) {
      where.AND = [{ name: { contains: query.search, mode: "insensitive" } }];
    }

    const items = await db.vendor.findMany({
      where,
      include: {
        processingActivities: { select: processingActivitySummarySelect },
      },
      orderBy: { name: "asc" },
    });

    res.json({ success: true, data: { items, total: items.length } });
  } catch (err) {
    next(err);
  }
});
