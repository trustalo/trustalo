import { Router } from "express";
import { z } from "zod";
import { prismaWithTenant } from "../../db/prisma.js";
import { authorizeResource } from "../../middleware/authorize.js";

const aiSystemType = z.enum([
  "machine_learning",
  "deep_learning",
  "nlp",
  "computer_vision",
  "generative_ai",
  "other",
]);

const aiLifecycleStage = z.enum([
  "design",
  "development",
  "testing",
  "deployment",
  "monitoring",
  "decommissioned",
]);

const aiRiskLevel = z.enum(["minimal", "limited", "high", "unacceptable"]);

const riskRating = z.enum(["low", "medium", "high"]);

const aiRiskAssessmentStatus = z.enum(["draft", "in_progress", "completed", "approved"]);

const aiImpactStatus = z.enum(["pending", "in_review", "approved", "rejected"]);

const aiIncidentSeverity = z.enum(["low", "medium", "high", "critical"]);
const aiIncidentCategory = z.enum([
  "bias",
  "drift",
  "hallucination",
  "accuracy",
  "privacy",
  "security",
  "safety",
  "misuse",
  "availability",
  "other",
]);
const aiIncidentStatus = z.enum(["open", "investigating", "mitigated", "resolved", "closed"]);

// Common selects to keep response shapes consistent across all three
// cross-system registers below.
const userSelect = { id: true, name: true, email: true } as const;
const aiSystemSummarySelect = {
  id: true,
  name: true,
  type: true,
  riskLevel: true,
  lifecycleStage: true,
} as const;

// Compute overall risk as the max of the component ratings unless the
// reviewer explicitly overrides it. Centralised so create + patch agree.
function deriveOverallRisk(
  components: {
    biasRisk?: string | null;
    privacyRisk?: string | null;
    safetyRisk?: string | null;
    securityRisk?: string | null;
    misuseRisk?: string | null;
  },
  override?: string | null,
): "low" | "medium" | "high" | undefined {
  if (override) return override as "low" | "medium" | "high";
  const order = { low: 1, medium: 2, high: 3 } as const;
  let max = 0;
  for (const v of Object.values(components)) {
    if (typeof v === "string" && v in order) {
      const score = order[v as keyof typeof order];
      if (score > max) max = score;
    }
  }
  if (max === 3) return "high";
  if (max === 2) return "medium";
  if (max === 1) return "low";
  return undefined;
}

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  type: aiSystemType.optional(),
  lifecycleStage: aiLifecycleStage.optional(),
  riskLevel: aiRiskLevel.optional(),
});

const idParams = z.object({
  id: z.string().min(1),
});

const createBody = z.object({
  name: z.string().min(1),
  type: aiSystemType,
  description: z.string().nullable().optional(),
  purpose: z.string().nullable().optional(),
  lifecycleStage: aiLifecycleStage.optional(),
  riskLevel: aiRiskLevel.optional(),
  dataTypes: z.array(z.string()).optional(),
  ownerId: z.string().nullable().optional(),
});

const updateBody = createBody.partial();

export const aiGovernanceRouter: Router = Router();
aiGovernanceRouter.use(authorizeResource("ai:read", "ai:write"));

aiGovernanceRouter.get("/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const [total, byRisk, byStage] = await Promise.all([
      db.aISystem.count(),
      db.aISystem.groupBy({ by: ["riskLevel"], _count: true }),
      db.aISystem.groupBy({ by: ["lifecycleStage"], _count: true }),
    ]);

    const riskCounts: Record<string, number> = {};
    for (const r of byRisk) riskCounts[r.riskLevel] = r._count;

    const stageCounts: Record<string, number> = {};
    for (const s of byStage) stageCounts[s.lifecycleStage] = s._count;

    res.json({
      success: true,
      data: { total, byRiskLevel: riskCounts, byLifecycleStage: stageCounts },
    });
  } catch (err) {
    next(err);
  }
});

// ───────────────────────────────────────────────────────────────────────────
// Cross-system AI Risk Assessments
//
// All `/risk-assessments*`, `/impact-assessments*`, and `/incidents*` routes
// MUST be declared before the `/:id` AISystem handler below, otherwise
// Express would route e.g. `/risk-assessments` into the AISystem detail
// handler with id="risk-assessments". Same pattern as the BCP router.
// ───────────────────────────────────────────────────────────────────────────

const riskListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  status: aiRiskAssessmentStatus.optional(),
  overallRisk: riskRating.optional(),
  aiSystemId: z.string().optional(),
  assessedById: z.string().optional(),
  // Returns assessments whose nextReviewDate is in the past and not yet
  // re-assessed.
  overdueOnly: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["assessedAt", "nextReviewDate", "overallRisk", "status", "updatedAt"])
    .default("assessedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

const riskCreateBody = z.object({
  aiSystemId: z.string().min(1),
  title: z.string().nullable().optional(),
  methodology: z.string().nullable().optional(),
  biasRisk: riskRating,
  privacyRisk: riskRating,
  safetyRisk: riskRating,
  securityRisk: riskRating,
  misuseRisk: riskRating,
  overallRisk: riskRating.nullable().optional(),
  residualRisk: riskRating.nullable().optional(),
  mitigationPlan: z.string().nullable().optional(),
  status: aiRiskAssessmentStatus.optional(),
  nextReviewDate: z.coerce.date().nullable().optional(),
});

const riskUpdateBody = riskCreateBody.partial().omit({ aiSystemId: true });

const riskInclude = {
  aiSystem: { select: aiSystemSummarySelect },
  assessedBy: { select: userSelect },
  approvedBy: { select: userSelect },
} as const;

aiGovernanceRouter.get("/risk-assessments/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const items = await db.aIRiskAssessment.findMany({
      select: { status: true, overallRisk: true, nextReviewDate: true },
    });

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const byStatus: Record<string, number> = {};
    const byOverallRisk: Record<string, number> = {};
    let overdueReviews = 0;
    let upcomingReviews = 0;

    for (const a of items) {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      if (a.overallRisk) {
        byOverallRisk[a.overallRisk] = (byOverallRisk[a.overallRisk] || 0) + 1;
      }
      if (a.nextReviewDate) {
        const d = new Date(a.nextReviewDate);
        if (d < now) overdueReviews++;
        else if (d <= thirtyDays) upcomingReviews++;
      }
    }

    res.json({
      success: true,
      data: {
        total: items.length,
        byStatus,
        byOverallRisk,
        overdueReviews,
        upcomingReviews,
        // High-or-above is the figure most security leaders care about.
        highRiskCount: byOverallRisk.high || 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.get("/risk-assessments", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = riskListQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.overallRisk) where.overallRisk = query.overallRisk;
    if (query.aiSystemId) where.aiSystemId = query.aiSystemId;
    if (query.assessedById) where.assessedById = query.assessedById;
    if (query.overdueOnly) where.nextReviewDate = { lt: new Date() };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { methodology: { contains: query.search, mode: "insensitive" } },
        { mitigationPlan: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    // Push nulls to the bottom on the only nullable date sort. `assessedAt`
    // is non-nullable (`@default(now())`) so Prisma rejects a `nulls` clause
    // on it; only `nextReviewDate` needs nulls-last handling.
    const orderBy: Record<string, unknown> =
      query.sortBy === "nextReviewDate"
        ? { nextReviewDate: { sort: query.sortDir, nulls: "last" } }
        : { [query.sortBy]: query.sortDir };

    const [items, total] = await Promise.all([
      db.aIRiskAssessment.findMany({
        where,
        include: riskInclude,
        orderBy,
        skip,
        take: query.limit,
      }),
      db.aIRiskAssessment.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page: query.page, limit: query.limit },
    });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.get("/risk-assessments/:assessmentId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const assessmentId = z.string().min(1).parse(req.params.assessmentId);
    const db = prismaWithTenant(tenantId);

    const assessment = await db.aIRiskAssessment.findUnique({
      where: { id: assessmentId },
      include: riskInclude,
    });
    if (!assessment) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Risk assessment not found" },
      });
      return;
    }
    res.json({ success: true, data: assessment });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.post("/risk-assessments", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const body = riskCreateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const system = await db.aISystem.findUnique({ where: { id: body.aiSystemId } });
    if (!system) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "AI system not found" },
      });
      return;
    }

    const overall = deriveOverallRisk(body, body.overallRisk ?? null);

    const assessment = await db.aIRiskAssessment.create({
      data: {
        tenantId,
        aiSystemId: body.aiSystemId,
        assessedById: userId,
        title: body.title ?? null,
        methodology: body.methodology ?? null,
        biasRisk: body.biasRisk,
        privacyRisk: body.privacyRisk,
        safetyRisk: body.safetyRisk,
        securityRisk: body.securityRisk,
        misuseRisk: body.misuseRisk,
        overallRisk: overall,
        residualRisk: body.residualRisk ?? null,
        mitigationPlan: body.mitigationPlan ?? null,
        status: body.status ?? "draft",
        nextReviewDate: body.nextReviewDate ?? null,
      },
      include: riskInclude,
    });
    res.status(201).json({ success: true, data: assessment });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.patch("/risk-assessments/:assessmentId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const assessmentId = z.string().min(1).parse(req.params.assessmentId);
    const body = riskUpdateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.aIRiskAssessment.findUnique({ where: { id: assessmentId } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Risk assessment not found" },
      });
      return;
    }

    // Re-derive overall risk if any component rating moved AND the reviewer
    // didn't pin a manual override in this update.
    const merged = {
      biasRisk: body.biasRisk ?? existing.biasRisk,
      privacyRisk: body.privacyRisk ?? existing.privacyRisk,
      safetyRisk: body.safetyRisk ?? existing.safetyRisk,
      securityRisk: body.securityRisk ?? existing.securityRisk,
      misuseRisk: body.misuseRisk ?? existing.misuseRisk,
    };
    const overall =
      body.overallRisk !== undefined
        ? body.overallRisk
        : (deriveOverallRisk(merged) ?? existing.overallRisk);

    const assessment = await db.aIRiskAssessment.update({
      where: { id: assessmentId },
      data: { ...body, overallRisk: overall },
      include: riskInclude,
    });
    res.json({ success: true, data: assessment });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.delete("/risk-assessments/:assessmentId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const assessmentId = z.string().min(1).parse(req.params.assessmentId);
    const db = prismaWithTenant(tenantId);

    await db.aIRiskAssessment.delete({ where: { id: assessmentId } });
    res.json({ success: true, data: { id: assessmentId } });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.post("/risk-assessments/:assessmentId/complete", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const assessmentId = z.string().min(1).parse(req.params.assessmentId);
    const db = prismaWithTenant(tenantId);

    const assessment = await db.aIRiskAssessment.update({
      where: { id: assessmentId },
      data: { status: "completed" },
      include: riskInclude,
    });
    res.json({ success: true, data: assessment });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.post("/risk-assessments/:assessmentId/approve", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const assessmentId = z.string().min(1).parse(req.params.assessmentId);
    const db = prismaWithTenant(tenantId);

    const existing = await db.aIRiskAssessment.findUnique({ where: { id: assessmentId } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Risk assessment not found" },
      });
      return;
    }

    const now = new Date();
    // Default the next review to one year out — consistent with the BIA
    // approval flow. Reviewers can edit it later.
    const oneYearOut = new Date(now);
    oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);

    const assessment = await db.aIRiskAssessment.update({
      where: { id: assessmentId },
      data: {
        status: "approved",
        approvedById: userId,
        approvedAt: now,
        nextReviewDate: existing.nextReviewDate ?? oneYearOut,
      },
      include: riskInclude,
    });
    res.json({ success: true, data: assessment });
  } catch (err) {
    next(err);
  }
});

// ───────────────────────────────────────────────────────────────────────────
// Cross-system AI Impact Assessments
// ───────────────────────────────────────────────────────────────────────────

const impactListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  status: aiImpactStatus.optional(),
  aiSystemId: z.string().optional(),
  sortBy: z.enum(["createdAt", "approvedAt", "status"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

const impactCreateBody = z.object({
  aiSystemId: z.string().min(1),
  societalImpact: z.string().nullable().optional(),
  ethicalConsiderations: z.string().nullable().optional(),
  environmentalImpact: z.string().nullable().optional(),
  humanOversightMeasures: z.string().nullable().optional(),
  transparencyMeasures: z.string().nullable().optional(),
  status: aiImpactStatus.optional(),
});

const impactUpdateBody = impactCreateBody.partial().omit({ aiSystemId: true });

const impactInclude = {
  aiSystem: { select: aiSystemSummarySelect },
  assessedBy: { select: userSelect },
  approvedBy: { select: userSelect },
} as const;

aiGovernanceRouter.get("/impact-assessments/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const items = await db.aIImpactAssessment.findMany({
      select: { status: true, approvedAt: true },
    });

    const byStatus: Record<string, number> = {};
    let approved = 0;
    let pending = 0;
    for (const a of items) {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      if (a.status === "approved") approved++;
      if (a.status === "pending" || a.status === "in_review") pending++;
    }

    res.json({
      success: true,
      data: {
        total: items.length,
        byStatus,
        approvedCount: approved,
        pendingCount: pending,
        approvedRate: items.length > 0 ? Math.round((approved / items.length) * 100) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.get("/impact-assessments", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = impactListQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.aiSystemId) where.aiSystemId = query.aiSystemId;
    if (query.search) {
      where.OR = [
        { societalImpact: { contains: query.search, mode: "insensitive" } },
        { ethicalConsiderations: { contains: query.search, mode: "insensitive" } },
        { environmentalImpact: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const orderBy: Record<string, unknown> =
      query.sortBy === "approvedAt"
        ? { approvedAt: { sort: query.sortDir, nulls: "last" } }
        : { [query.sortBy]: query.sortDir };

    const [items, total] = await Promise.all([
      db.aIImpactAssessment.findMany({
        where,
        include: impactInclude,
        orderBy,
        skip,
        take: query.limit,
      }),
      db.aIImpactAssessment.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page: query.page, limit: query.limit },
    });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.get("/impact-assessments/:assessmentId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const assessmentId = z.string().min(1).parse(req.params.assessmentId);
    const db = prismaWithTenant(tenantId);

    const assessment = await db.aIImpactAssessment.findUnique({
      where: { id: assessmentId },
      include: impactInclude,
    });
    if (!assessment) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Impact assessment not found" },
      });
      return;
    }
    res.json({ success: true, data: assessment });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.post("/impact-assessments", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const body = impactCreateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const system = await db.aISystem.findUnique({ where: { id: body.aiSystemId } });
    if (!system) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "AI system not found" },
      });
      return;
    }

    const assessment = await db.aIImpactAssessment.create({
      data: {
        tenantId,
        aiSystemId: body.aiSystemId,
        assessedById: userId,
        societalImpact: body.societalImpact ?? null,
        ethicalConsiderations: body.ethicalConsiderations ?? null,
        environmentalImpact: body.environmentalImpact ?? null,
        humanOversightMeasures: body.humanOversightMeasures ?? null,
        transparencyMeasures: body.transparencyMeasures ?? null,
        status: body.status ?? "pending",
      },
      include: impactInclude,
    });
    res.status(201).json({ success: true, data: assessment });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.patch("/impact-assessments/:assessmentId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const assessmentId = z.string().min(1).parse(req.params.assessmentId);
    const body = impactUpdateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const assessment = await db.aIImpactAssessment.update({
      where: { id: assessmentId },
      data: body,
      include: impactInclude,
    });
    res.json({ success: true, data: assessment });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.delete("/impact-assessments/:assessmentId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const assessmentId = z.string().min(1).parse(req.params.assessmentId);
    const db = prismaWithTenant(tenantId);

    await db.aIImpactAssessment.delete({ where: { id: assessmentId } });
    res.json({ success: true, data: { id: assessmentId } });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.post("/impact-assessments/:assessmentId/approve", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const assessmentId = z.string().min(1).parse(req.params.assessmentId);
    const db = prismaWithTenant(tenantId);

    const assessment = await db.aIImpactAssessment.update({
      where: { id: assessmentId },
      data: { status: "approved", approvedById: userId, approvedAt: new Date() },
      include: impactInclude,
    });
    res.json({ success: true, data: assessment });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.post("/impact-assessments/:assessmentId/reject", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const assessmentId = z.string().min(1).parse(req.params.assessmentId);
    const db = prismaWithTenant(tenantId);

    const assessment = await db.aIImpactAssessment.update({
      where: { id: assessmentId },
      data: { status: "rejected", approvedById: userId, approvedAt: new Date() },
      include: impactInclude,
    });
    res.json({ success: true, data: assessment });
  } catch (err) {
    next(err);
  }
});

// ───────────────────────────────────────────────────────────────────────────
// AI Incidents
// ───────────────────────────────────────────────────────────────────────────

const incidentListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  status: aiIncidentStatus.optional(),
  severity: aiIncidentSeverity.optional(),
  category: aiIncidentCategory.optional(),
  aiSystemId: z.string().optional(),
  // "Open" = anything not closed — useful for triage filters.
  openOnly: z.coerce.boolean().optional(),
  sortBy: z
    .enum(["detectedAt", "reportedAt", "resolvedAt", "severity", "status", "updatedAt"])
    .default("detectedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

const incidentCreateBody = z.object({
  aiSystemId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  category: aiIncidentCategory,
  severity: aiIncidentSeverity,
  status: aiIncidentStatus.optional(),
  detectedAt: z.coerce.date().optional(),
  rootCause: z.string().nullable().optional(),
  remediation: z.string().nullable().optional(),
  externalNotificationRequired: z.boolean().optional(),
  externalNotificationSentAt: z.coerce.date().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
});

const incidentUpdateBody = incidentCreateBody.partial().omit({ aiSystemId: true });

const incidentInclude = {
  aiSystem: { select: aiSystemSummarySelect },
  reportedBy: { select: userSelect },
  assignee: { select: userSelect },
} as const;

aiGovernanceRouter.get("/incidents/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const items = await db.aIIncident.findMany({
      select: {
        status: true,
        severity: true,
        category: true,
        detectedAt: true,
        resolvedAt: true,
      },
    });

    const byStatus: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let openCount = 0;
    let criticalOpenCount = 0;
    let resolvedThisMonth = 0;
    let totalResolutionMinutes = 0;
    let resolvedCount = 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const i of items) {
      byStatus[i.status] = (byStatus[i.status] || 0) + 1;
      bySeverity[i.severity] = (bySeverity[i.severity] || 0) + 1;
      byCategory[i.category] = (byCategory[i.category] || 0) + 1;
      if (i.status !== "closed" && i.status !== "resolved") {
        openCount++;
        if (i.severity === "critical") criticalOpenCount++;
      }
      if (i.resolvedAt) {
        resolvedCount++;
        const ms = new Date(i.resolvedAt).getTime() - new Date(i.detectedAt).getTime();
        if (ms > 0) totalResolutionMinutes += ms / 60000;
        if (new Date(i.resolvedAt) >= monthStart) resolvedThisMonth++;
      }
    }

    const meanResolutionHours =
      resolvedCount > 0 ? Math.round((totalResolutionMinutes / resolvedCount / 60) * 10) / 10 : 0;

    res.json({
      success: true,
      data: {
        total: items.length,
        byStatus,
        bySeverity,
        byCategory,
        openCount,
        criticalOpenCount,
        resolvedThisMonth,
        meanResolutionHours,
      },
    });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.get("/incidents", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = incidentListQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.category) where.category = query.category;
    if (query.aiSystemId) where.aiSystemId = query.aiSystemId;
    if (query.openOnly) where.status = { notIn: ["closed", "resolved"] };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { rootCause: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const orderBy: Record<string, unknown> =
      query.sortBy === "resolvedAt"
        ? { resolvedAt: { sort: query.sortDir, nulls: "last" } }
        : { [query.sortBy]: query.sortDir };

    const [items, total] = await Promise.all([
      db.aIIncident.findMany({
        where,
        include: incidentInclude,
        orderBy,
        skip,
        take: query.limit,
      }),
      db.aIIncident.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page: query.page, limit: query.limit },
    });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.get("/incidents/:incidentId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const incidentId = z.string().min(1).parse(req.params.incidentId);
    const db = prismaWithTenant(tenantId);

    const incident = await db.aIIncident.findUnique({
      where: { id: incidentId },
      include: incidentInclude,
    });
    if (!incident) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Incident not found" },
      });
      return;
    }
    res.json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.post("/incidents", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const body = incidentCreateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const system = await db.aISystem.findUnique({ where: { id: body.aiSystemId } });
    if (!system) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "AI system not found" },
      });
      return;
    }

    const incident = await db.aIIncident.create({
      data: {
        tenantId,
        aiSystemId: body.aiSystemId,
        title: body.title,
        description: body.description ?? null,
        category: body.category,
        severity: body.severity,
        status: body.status ?? "open",
        detectedAt: body.detectedAt ?? new Date(),
        rootCause: body.rootCause ?? null,
        remediation: body.remediation ?? null,
        externalNotificationRequired: body.externalNotificationRequired ?? false,
        externalNotificationSentAt: body.externalNotificationSentAt ?? null,
        reportedById: userId,
        assigneeId: body.assigneeId ?? null,
      },
      include: incidentInclude,
    });
    res.status(201).json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.patch("/incidents/:incidentId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const incidentId = z.string().min(1).parse(req.params.incidentId);
    const body = incidentUpdateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const incident = await db.aIIncident.update({
      where: { id: incidentId },
      data: body,
      include: incidentInclude,
    });
    res.json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.delete("/incidents/:incidentId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const incidentId = z.string().min(1).parse(req.params.incidentId);
    const db = prismaWithTenant(tenantId);

    await db.aIIncident.delete({ where: { id: incidentId } });
    res.json({ success: true, data: { id: incidentId } });
  } catch (err) {
    next(err);
  }
});

// One transition endpoint per terminal state. Keeps each transition simple
// and lets us stamp `resolvedAt` automatically without UI gymnastics.
const transitionBody = z.object({
  rootCause: z.string().nullable().optional(),
  remediation: z.string().nullable().optional(),
});

aiGovernanceRouter.post("/incidents/:incidentId/investigate", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const incidentId = z.string().min(1).parse(req.params.incidentId);
    const body = transitionBody.parse(req.body ?? {});
    const db = prismaWithTenant(tenantId);

    const existing = await db.aIIncident.findUnique({ where: { id: incidentId } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Incident not found" },
      });
      return;
    }

    const incident = await db.aIIncident.update({
      where: { id: incidentId },
      data: {
        status: "investigating",
        rootCause: body.rootCause ?? existing.rootCause,
      },
      include: incidentInclude,
    });
    res.json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.post("/incidents/:incidentId/mitigate", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const incidentId = z.string().min(1).parse(req.params.incidentId);
    const body = transitionBody.parse(req.body ?? {});
    const db = prismaWithTenant(tenantId);

    const existing = await db.aIIncident.findUnique({ where: { id: incidentId } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Incident not found" },
      });
      return;
    }

    const incident = await db.aIIncident.update({
      where: { id: incidentId },
      data: {
        status: "mitigated",
        rootCause: body.rootCause ?? existing.rootCause,
        remediation: body.remediation ?? existing.remediation,
      },
      include: incidentInclude,
    });
    res.json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.post("/incidents/:incidentId/resolve", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const incidentId = z.string().min(1).parse(req.params.incidentId);
    const body = transitionBody.parse(req.body ?? {});
    const db = prismaWithTenant(tenantId);

    const existing = await db.aIIncident.findUnique({ where: { id: incidentId } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Incident not found" },
      });
      return;
    }

    const incident = await db.aIIncident.update({
      where: { id: incidentId },
      data: {
        status: "resolved",
        resolvedAt: existing.resolvedAt ?? new Date(),
        rootCause: body.rootCause ?? existing.rootCause,
        remediation: body.remediation ?? existing.remediation,
      },
      include: incidentInclude,
    });
    res.json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.post("/incidents/:incidentId/close", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const incidentId = z.string().min(1).parse(req.params.incidentId);
    const db = prismaWithTenant(tenantId);

    const existing = await db.aIIncident.findUnique({ where: { id: incidentId } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Incident not found" },
      });
      return;
    }

    const incident = await db.aIIncident.update({
      where: { id: incidentId },
      data: {
        status: "closed",
        // Make sure a resolvedAt exists for incidents closed without an
        // explicit resolution step (rare but possible).
        resolvedAt: existing.resolvedAt ?? new Date(),
      },
      include: incidentInclude,
    });
    res.json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
});

// ───────────────────────────────────────────────────────────────────────────
// AI System CRUD (everything below this line was here before).
// ───────────────────────────────────────────────────────────────────────────

aiGovernanceRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = listQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {};
    if (query.type) where.type = query.type;
    if (query.lifecycleStage) where.lifecycleStage = query.lifecycleStage;
    if (query.riskLevel) where.riskLevel = query.riskLevel;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      db.aISystem.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { riskAssessments: true, impactAssessments: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: query.limit,
      }),
      db.aISystem.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page: query.page, limit: query.limit },
    });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.get("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const system = await db.aISystem.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        riskAssessments: {
          include: { assessedBy: { select: { id: true, name: true } } },
          orderBy: { assessedAt: "desc" },
        },
        impactAssessments: {
          include: {
            assessedBy: { select: { id: true, name: true } },
            approvedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!system) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "AI system not found" },
      });
      return;
    }

    res.json({ success: true, data: system });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.post("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = createBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const system = await db.aISystem.create({
      data: { ...body, tenantId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });
    res.status(201).json({ success: true, data: system });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = updateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const system = await db.aISystem.update({
      where: { id },
      data: body,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ success: true, data: system });
  } catch (err) {
    next(err);
  }
});

aiGovernanceRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const system = await db.aISystem.delete({ where: { id } });
    res.json({ success: true, data: system });
  } catch (err) {
    next(err);
  }
});
