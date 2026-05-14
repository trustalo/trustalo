import { Router } from "express";
import { z } from "zod";
import { prismaWithTenant } from "../../db/prisma.js";
import { authorizeResource } from "../../middleware/authorize.js";

const bcpStatus = z.enum(["draft", "approved", "active", "under_review", "archived"]);
const criticalityLevel = z.enum([
  "mission_critical",
  "business_critical",
  "business_operational",
  "administrative",
]);
const exerciseType = z.enum(["tabletop", "walkthrough", "simulation", "full_scale"]);
const exerciseStatus = z.enum([
  "planned",
  "scheduled",
  "in_progress",
  "conducted",
  "reviewed",
  "cancelled",
]);
const exerciseOutcome = z.enum(["not_met", "partially_met", "met", "exceeded"]);
const biaStatus = z.enum(["draft", "under_review", "approved", "archived"]);

const ownerSelect = { id: true, name: true, email: true } as const;
const planSummarySelect = { id: true, title: true, status: true } as const;

// ── Plan schemas ──

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: bcpStatus.optional(),
  search: z.string().optional(),
});

const idParams = z.object({ id: z.string().min(1) });

const createBody = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  status: bcpStatus.optional(),
  ownerId: z.string().min(1),
  approvedAt: z.coerce.date().nullable().optional(),
  lastReviewedAt: z.coerce.date().nullable().optional(),
  nextReviewDate: z.coerce.date().nullable().optional(),
});

const updateBody = createBody.partial();

// ── BIA schemas ──

const biaCreateBody = z.object({
  processName: z.string().min(1),
  description: z.string().nullable().optional(),
  criticalityLevel,
  rtoHours: z.coerce.number().int().min(0),
  rpoHours: z.coerce.number().int().min(0),
  maxTolerableDowntimeHours: z.coerce.number().int().min(0),
  mtpdHours: z.coerce.number().int().min(0).nullable().optional(),
  financialImpactPerHour: z.coerce.number().nullable().optional(),
  dependencies: z.string().nullable().optional(),
  operationalImpact: z.string().nullable().optional(),
  regulatoryImpact: z.string().nullable().optional(),
  reputationalImpact: z.string().nullable().optional(),
  status: biaStatus.optional(),
  ownerId: z.string().nullable().optional(),
  lastReviewedAt: z.coerce.date().nullable().optional(),
  nextReviewDate: z.coerce.date().nullable().optional(),
});

const biaUpdateBody = biaCreateBody.partial();

// Cross-plan BIA list — used by the top-level register page.
const biaListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  criticalityLevel: criticalityLevel.optional(),
  status: biaStatus.optional(),
  bcpId: z.string().optional(),
  ownerId: z.string().optional(),
  // Convenience filter — true returns BIAs whose nextReviewDate is in the past.
  overdueOnly: z.coerce.boolean().optional(),
  sortBy: z
    .enum([
      "processName",
      "criticalityLevel",
      "rtoHours",
      "rpoHours",
      "mtpdHours",
      "status",
      "nextReviewDate",
      "updatedAt",
    ])
    .default("updatedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

// Top-level create requires the parent plan id in the body (rather than the URL).
const biaTopCreateBody = biaCreateBody.extend({
  bcpId: z.string().min(1),
});

// ── Exercise schemas ──

const exerciseCreateBody = z.object({
  title: z.string().min(1),
  type: exerciseType,
  scheduledDate: z.coerce.date().nullable().optional(),
  conductedDate: z.coerce.date().nullable().optional(),
  status: exerciseStatus.optional(),
  scenario: z.string().nullable().optional(),
  objectives: z.string().nullable().optional(),
  scope: z.string().nullable().optional(),
  facilitatorId: z.string().nullable().optional(),
  participants: z.string().nullable().optional(),
  outcomeRating: exerciseOutcome.nullable().optional(),
  actualRtoHours: z.coerce.number().int().min(0).nullable().optional(),
  actualRpoHours: z.coerce.number().int().min(0).nullable().optional(),
  findings: z.string().nullable().optional(),
  lessonsLearned: z.string().nullable().optional(),
  actionItems: z.string().nullable().optional(),
  nextExerciseDate: z.coerce.date().nullable().optional(),
  reviewedAt: z.coerce.date().nullable().optional(),
});

const exerciseUpdateBody = exerciseCreateBody.partial();

// Cross-plan exercise list — used by the top-level register page.
const exerciseListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  type: exerciseType.optional(),
  status: exerciseStatus.optional(),
  outcomeRating: exerciseOutcome.optional(),
  bcpId: z.string().optional(),
  facilitatorId: z.string().optional(),
  // Convenience filter — true returns scheduled exercises whose date is past.
  overdueOnly: z.coerce.boolean().optional(),
  sortBy: z
    .enum([
      "title",
      "type",
      "status",
      "scheduledDate",
      "conductedDate",
      "outcomeRating",
      "updatedAt",
    ])
    .default("scheduledDate"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

const exerciseTopCreateBody = exerciseCreateBody.extend({
  bcpId: z.string().min(1),
});

export const bcpRouter: Router = Router();
bcpRouter.use(authorizeResource("bcp:read", "bcp:write"));

// ── Stats ──

bcpRouter.get("/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const [plans, biaCount, exerciseCount] = await Promise.all([
      db.businessContinuityPlan.findMany({ select: { status: true, nextReviewDate: true } }),
      db.businessImpactAnalysis.count(),
      db.bCPExercise.count(),
    ]);

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const byStatus: Record<string, number> = {};
    let overdueReviews = 0;
    let upcomingReviews = 0;

    for (const p of plans) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      if (p.nextReviewDate) {
        if (new Date(p.nextReviewDate) < now) overdueReviews++;
        else if (new Date(p.nextReviewDate) <= thirtyDays) upcomingReviews++;
      }
    }

    res.json({
      success: true,
      data: {
        totalPlans: plans.length,
        byStatus,
        overdueReviews,
        upcomingReviews,
        totalBIA: biaCount,
        totalExercises: exerciseCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Cross-plan BIA register ──
//
// IMPORTANT: these `/bia*` routes must be declared BEFORE the `/:id` plan
// handlers below; otherwise Express would route "/bia" to the plan-detail
// handler and treat the literal string "bia" as a plan id.

const biaInclude = {
  bcp: { select: planSummarySelect },
  owner: { select: ownerSelect },
} as const;

bcpRouter.get("/bia/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const items = await db.businessImpactAnalysis.findMany({
      select: {
        criticalityLevel: true,
        status: true,
        rtoHours: true,
        mtpdHours: true,
        nextReviewDate: true,
      },
    });

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const byCriticality: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let overdueReviews = 0;
    let upcomingReviews = 0;
    // "Recovery gap" = RTO exceeds the regulatory MTPD ceiling. This is the
    // single most actionable signal in a BIA: it says "your stated recovery
    // target is already non-compliant before any incident occurs".
    let recoveryGaps = 0;

    for (const b of items) {
      byCriticality[b.criticalityLevel] = (byCriticality[b.criticalityLevel] || 0) + 1;
      byStatus[b.status] = (byStatus[b.status] || 0) + 1;
      if (b.nextReviewDate) {
        if (new Date(b.nextReviewDate) < now) overdueReviews++;
        else if (new Date(b.nextReviewDate) <= thirtyDays) upcomingReviews++;
      }
      if (b.mtpdHours != null && b.rtoHours > b.mtpdHours) recoveryGaps++;
    }

    res.json({
      success: true,
      data: {
        total: items.length,
        byCriticality,
        byStatus,
        overdueReviews,
        upcomingReviews,
        recoveryGaps,
      },
    });
  } catch (err) {
    next(err);
  }
});

bcpRouter.get("/bia", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = biaListQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {};
    if (query.criticalityLevel) where.criticalityLevel = query.criticalityLevel;
    if (query.status) where.status = query.status;
    if (query.bcpId) where.bcpId = query.bcpId;
    if (query.ownerId) where.ownerId = query.ownerId;
    if (query.overdueOnly) {
      where.nextReviewDate = { lt: new Date() };
    }
    if (query.search) {
      where.OR = [
        { processName: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      db.businessImpactAnalysis.findMany({
        where,
        include: biaInclude,
        orderBy: { [query.sortBy]: query.sortDir },
        skip,
        take: query.limit,
      }),
      db.businessImpactAnalysis.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page: query.page, limit: query.limit },
    });
  } catch (err) {
    next(err);
  }
});

bcpRouter.get("/bia/:biaId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const biaId = z.string().min(1).parse(req.params.biaId);
    const db = prismaWithTenant(tenantId);

    const bia = await db.businessImpactAnalysis.findUnique({
      where: { id: biaId },
      include: biaInclude,
    });
    if (!bia) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "BIA not found" },
      });
      return;
    }
    res.json({ success: true, data: bia });
  } catch (err) {
    next(err);
  }
});

bcpRouter.post("/bia", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { bcpId, ...rest } = biaTopCreateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    // Ensure the parent plan exists and belongs to the org. Because
    // `prismaWithTenant` already scopes to the org, a plain findUnique is
    // sufficient as a tenancy check.
    const plan = await db.businessContinuityPlan.findUnique({ where: { id: bcpId } });
    if (!plan) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Parent plan not found" },
      });
      return;
    }

    const bia = await db.businessImpactAnalysis.create({
      data: { ...rest, bcpId, tenantId },
      include: biaInclude,
    });
    res.status(201).json({ success: true, data: bia });
  } catch (err) {
    next(err);
  }
});

bcpRouter.patch("/bia/:biaId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const biaId = z.string().min(1).parse(req.params.biaId);
    const body = biaUpdateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const bia = await db.businessImpactAnalysis.update({
      where: { id: biaId },
      data: body,
      include: biaInclude,
    });
    res.json({ success: true, data: bia });
  } catch (err) {
    next(err);
  }
});

bcpRouter.delete("/bia/:biaId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const biaId = z.string().min(1).parse(req.params.biaId);
    const db = prismaWithTenant(tenantId);

    await db.businessImpactAnalysis.delete({ where: { id: biaId } });
    res.json({ success: true, data: { id: biaId } });
  } catch (err) {
    next(err);
  }
});

// Approve action — sets status, stamps approvedAt + lastReviewedAt, and
// schedules the next review one year out unless one is already set.
bcpRouter.post("/bia/:biaId/approve", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const biaId = z.string().min(1).parse(req.params.biaId);
    const db = prismaWithTenant(tenantId);

    const existing = await db.businessImpactAnalysis.findUnique({ where: { id: biaId } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "BIA not found" },
      });
      return;
    }

    const now = new Date();
    const oneYearOut = new Date(now);
    oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);

    const bia = await db.businessImpactAnalysis.update({
      where: { id: biaId },
      data: {
        status: "approved",
        approvedAt: now,
        lastReviewedAt: now,
        nextReviewDate: existing.nextReviewDate ?? oneYearOut,
      },
      include: biaInclude,
    });
    res.json({ success: true, data: bia });
  } catch (err) {
    next(err);
  }
});

// ── Cross-plan exercise register ──
//
// Same routing concern as the BIA block above: these `/exercises*` routes
// must be declared BEFORE the `/:id` plan handlers below so Express does not
// route `/exercises` to the plan-detail handler.

const exerciseInclude = {
  bcp: { select: planSummarySelect },
  facilitator: { select: ownerSelect },
} as const;

bcpRouter.get("/exercises/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const items = await db.bCPExercise.findMany({
      select: {
        type: true,
        status: true,
        outcomeRating: true,
        scheduledDate: true,
        conductedDate: true,
      },
    });

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byOutcome: Record<string, number> = {};
    let conductedThisYear = 0;
    let upcoming = 0;
    // "Overdue" = scheduled in the past but not yet marked conducted/cancelled.
    let overdue = 0;
    let reviewedCount = 0;

    for (const e of items) {
      byType[e.type] = (byType[e.type] || 0) + 1;
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
      if (e.outcomeRating) {
        byOutcome[e.outcomeRating] = (byOutcome[e.outcomeRating] || 0) + 1;
      }
      if (e.conductedDate && new Date(e.conductedDate) >= yearStart) {
        conductedThisYear++;
      }
      if (e.status === "reviewed") reviewedCount++;
      if (e.scheduledDate) {
        const d = new Date(e.scheduledDate);
        const isOpen =
          e.status === "planned" || e.status === "scheduled" || e.status === "in_progress";
        if (isOpen && d < now) overdue++;
        else if (isOpen && d <= thirtyDays) upcoming++;
      }
    }

    res.json({
      success: true,
      data: {
        total: items.length,
        byType,
        byStatus,
        byOutcome,
        conductedThisYear,
        upcoming,
        overdue,
        reviewedCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

bcpRouter.get("/exercises", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = exerciseListQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.outcomeRating) where.outcomeRating = query.outcomeRating;
    if (query.bcpId) where.bcpId = query.bcpId;
    if (query.facilitatorId) where.facilitatorId = query.facilitatorId;
    if (query.overdueOnly) {
      where.scheduledDate = { lt: new Date() };
      where.status = { in: ["planned", "scheduled", "in_progress"] };
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { scenario: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    // Treat null dates as oldest when sorting by date so "most recent first"
    // pushes unscheduled rows to the bottom rather than the top.
    const orderBy: Record<string, unknown> =
      query.sortBy === "scheduledDate" || query.sortBy === "conductedDate"
        ? { [query.sortBy]: { sort: query.sortDir, nulls: "last" } }
        : { [query.sortBy]: query.sortDir };

    const [items, total] = await Promise.all([
      db.bCPExercise.findMany({
        where,
        include: exerciseInclude,
        orderBy,
        skip,
        take: query.limit,
      }),
      db.bCPExercise.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page: query.page, limit: query.limit },
    });
  } catch (err) {
    next(err);
  }
});

bcpRouter.get("/exercises/:exerciseId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const exerciseId = z.string().min(1).parse(req.params.exerciseId);
    const db = prismaWithTenant(tenantId);

    const exercise = await db.bCPExercise.findUnique({
      where: { id: exerciseId },
      include: exerciseInclude,
    });
    if (!exercise) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Exercise not found" },
      });
      return;
    }
    res.json({ success: true, data: exercise });
  } catch (err) {
    next(err);
  }
});

bcpRouter.post("/exercises", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { bcpId, ...rest } = exerciseTopCreateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    // Tenancy check via the org-scoped client.
    const plan = await db.businessContinuityPlan.findUnique({ where: { id: bcpId } });
    if (!plan) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Parent plan not found" },
      });
      return;
    }

    // If a scheduled date is provided and the user did not specify a status,
    // default to "scheduled" rather than "planned" so the lifecycle reflects
    // intent. Pure "planned" remains a valid choice for ideas without dates.
    const status = rest.status ?? (rest.scheduledDate ? "scheduled" : undefined);

    const exercise = await db.bCPExercise.create({
      data: { ...rest, status, bcpId, tenantId },
      include: exerciseInclude,
    });
    res.status(201).json({ success: true, data: exercise });
  } catch (err) {
    next(err);
  }
});

bcpRouter.patch("/exercises/:exerciseId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const exerciseId = z.string().min(1).parse(req.params.exerciseId);
    const body = exerciseUpdateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const exercise = await db.bCPExercise.update({
      where: { id: exerciseId },
      data: body,
      include: exerciseInclude,
    });
    res.json({ success: true, data: exercise });
  } catch (err) {
    next(err);
  }
});

bcpRouter.delete("/exercises/:exerciseId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const exerciseId = z.string().min(1).parse(req.params.exerciseId);
    const db = prismaWithTenant(tenantId);

    await db.bCPExercise.delete({ where: { id: exerciseId } });
    res.json({ success: true, data: { id: exerciseId } });
  } catch (err) {
    next(err);
  }
});

// "Mark conducted" — record that the exercise actually ran. Captures the
// completion timestamp and any actuals in one call so users don't have to
// edit each field manually right after running a tabletop.
const markConductedBody = z.object({
  conductedDate: z.coerce.date().optional(),
  outcomeRating: exerciseOutcome.nullable().optional(),
  actualRtoHours: z.coerce.number().int().min(0).nullable().optional(),
  actualRpoHours: z.coerce.number().int().min(0).nullable().optional(),
  findings: z.string().nullable().optional(),
});

bcpRouter.post("/exercises/:exerciseId/mark-conducted", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const exerciseId = z.string().min(1).parse(req.params.exerciseId);
    const body = markConductedBody.parse(req.body ?? {});
    const db = prismaWithTenant(tenantId);

    const existing = await db.bCPExercise.findUnique({ where: { id: exerciseId } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Exercise not found" },
      });
      return;
    }

    const exercise = await db.bCPExercise.update({
      where: { id: exerciseId },
      data: {
        status: "conducted",
        conductedDate: body.conductedDate ?? existing.conductedDate ?? new Date(),
        outcomeRating: body.outcomeRating ?? existing.outcomeRating,
        actualRtoHours: body.actualRtoHours ?? existing.actualRtoHours,
        actualRpoHours: body.actualRpoHours ?? existing.actualRpoHours,
        findings: body.findings ?? existing.findings,
      },
      include: exerciseInclude,
    });
    res.json({ success: true, data: exercise });
  } catch (err) {
    next(err);
  }
});

// "Mark reviewed" — close the after-action loop. Sets status, stamps
// reviewedAt, and (per ISO 22301 cadence guidance) defaults the next
// exercise to one year out unless one is already scheduled.
const markReviewedBody = z.object({
  lessonsLearned: z.string().nullable().optional(),
  actionItems: z.string().nullable().optional(),
  nextExerciseDate: z.coerce.date().nullable().optional(),
});

bcpRouter.post("/exercises/:exerciseId/mark-reviewed", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const exerciseId = z.string().min(1).parse(req.params.exerciseId);
    const body = markReviewedBody.parse(req.body ?? {});
    const db = prismaWithTenant(tenantId);

    const existing = await db.bCPExercise.findUnique({ where: { id: exerciseId } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Exercise not found" },
      });
      return;
    }

    const now = new Date();
    const oneYearOut = new Date(now);
    oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);

    const exercise = await db.bCPExercise.update({
      where: { id: exerciseId },
      data: {
        status: "reviewed",
        reviewedAt: now,
        lessonsLearned: body.lessonsLearned ?? existing.lessonsLearned,
        actionItems: body.actionItems ?? existing.actionItems,
        nextExerciseDate: body.nextExerciseDate ?? existing.nextExerciseDate ?? oneYearOut,
      },
      include: exerciseInclude,
    });
    res.json({ success: true, data: exercise });
  } catch (err) {
    next(err);
  }
});

// ── Plan CRUD ──

bcpRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = listQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      db.businessContinuityPlan.findMany({
        where,
        include: {
          owner: { select: ownerSelect },
          _count: { select: { impactAnalyses: true, exercises: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: query.limit,
      }),
      db.businessContinuityPlan.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page: query.page, limit: query.limit },
    });
  } catch (err) {
    next(err);
  }
});

bcpRouter.get("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const plan = await db.businessContinuityPlan.findUnique({
      where: { id },
      include: {
        owner: { select: ownerSelect },
        impactAnalyses: { orderBy: { createdAt: "desc" } },
        exercises: { orderBy: { scheduledDate: "desc" } },
      },
    });
    if (!plan) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Business continuity plan not found" },
      });
      return;
    }

    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
});

bcpRouter.post("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = createBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const plan = await db.businessContinuityPlan.create({
      data: { ...body, tenantId },
      include: {
        owner: { select: ownerSelect },
        _count: { select: { impactAnalyses: true, exercises: true } },
      },
    });
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
});

bcpRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = updateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const plan = await db.businessContinuityPlan.update({
      where: { id },
      data: body,
      include: {
        owner: { select: ownerSelect },
        _count: { select: { impactAnalyses: true, exercises: true } },
      },
    });
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
});

bcpRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const plan = await db.businessContinuityPlan.delete({ where: { id } });
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
});

// ── Business Impact Analysis CRUD (nested under plan) ──

bcpRouter.get("/:id/bia", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id: bcpId } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const items = await db.businessImpactAnalysis.findMany({
      where: { bcpId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

bcpRouter.post("/:id/bia", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id: bcpId } = idParams.parse(req.params);
    const body = biaCreateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const bia = await db.businessImpactAnalysis.create({
      data: { ...body, bcpId, tenantId },
    });
    res.status(201).json({ success: true, data: bia });
  } catch (err) {
    next(err);
  }
});

bcpRouter.patch("/:id/bia/:biaId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id: _bcpId } = idParams.parse(req.params);
    const biaId = z.string().min(1).parse(req.params.biaId);
    const body = biaUpdateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const bia = await db.businessImpactAnalysis.update({
      where: { id: biaId },
      data: body,
    });
    res.json({ success: true, data: bia });
  } catch (err) {
    next(err);
  }
});

bcpRouter.delete("/:id/bia/:biaId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id: _bcpId } = idParams.parse(req.params);
    const biaId = z.string().min(1).parse(req.params.biaId);
    const db = prismaWithTenant(tenantId);

    await db.businessImpactAnalysis.delete({ where: { id: biaId } });
    res.json({ success: true, data: { id: biaId } });
  } catch (err) {
    next(err);
  }
});

// ── BCP Exercise CRUD (nested under plan) ──

bcpRouter.get("/:id/exercises", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id: bcpId } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const items = await db.bCPExercise.findMany({
      where: { bcpId },
      orderBy: { scheduledDate: "desc" },
    });

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

bcpRouter.post("/:id/exercises", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id: bcpId } = idParams.parse(req.params);
    const body = exerciseCreateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const exercise = await db.bCPExercise.create({
      data: { ...body, bcpId, tenantId },
    });
    res.status(201).json({ success: true, data: exercise });
  } catch (err) {
    next(err);
  }
});

bcpRouter.patch("/:id/exercises/:exerciseId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id: _bcpId } = idParams.parse(req.params);
    const exerciseId = z.string().min(1).parse(req.params.exerciseId);
    const body = exerciseUpdateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const exercise = await db.bCPExercise.update({
      where: { id: exerciseId },
      data: body,
    });
    res.json({ success: true, data: exercise });
  } catch (err) {
    next(err);
  }
});

bcpRouter.delete("/:id/exercises/:exerciseId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id: _bcpId } = idParams.parse(req.params);
    const exerciseId = z.string().min(1).parse(req.params.exerciseId);
    const db = prismaWithTenant(tenantId);

    await db.bCPExercise.delete({ where: { id: exerciseId } });
    res.json({ success: true, data: { id: exerciseId } });
  } catch (err) {
    next(err);
  }
});
