import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client/index.js";
import { prisma, prismaWithTenant } from "../../db/prisma.js";
import { authorizeResource } from "../../middleware/authorize.js";
import { audit } from "../../lib/audit.js";
import { suggestRiskScore, RiskNotFoundError } from "./ai-suggest-score.js";

export const risksRouter: Router = Router();
risksRouter.use(authorizeResource("risks:read", "risks:write"));

// ──────────────────────────────────────────────
// Zod enums & shared schemas
// ──────────────────────────────────────────────

const riskCategory = z.enum([
  "operational",
  "technical",
  "compliance",
  "strategic",
  "financial",
  "reputational",
  "security",
  "privacy",
  "third_party",
  "environmental",
]);

const riskStatus = z.enum(["not_started", "in_progress", "done", "archived"]);

const treatmentStrategy = z.enum(["mitigate", "accept", "transfer", "avoid", "control"]);
const treatmentStatus = z.enum(["planned", "in_progress", "completed", "overdue", "cancelled"]);

const probabilityLevel = z.enum(["rare", "unlikely", "possible", "likely", "almost_certain"]);
const impactLevel = z.enum(["negligible", "low", "moderate", "high", "catastrophic"]);
const controlEffectiveness = z.enum(["no_control", "need_improvement", "adequate", "effective"]);
const approvalStatus = z.enum(["yes", "no", "na", "pending"]);

const riskDepartment = z.enum([
  "engineering",
  "product",
  "operations",
  "finance",
  "legal",
  "human_resources",
  "sales",
  "marketing",
  "customer_support",
  "it",
  "security",
  "compliance",
  "executive",
  "other",
]);

const scoreVal = z.coerce.number().int().min(1).max(5);
const idParams = z.object({ id: z.string().min(1) });
const riskIdParams = z.object({ riskId: z.string().min(1) });
const subIdParams = z.object({ riskId: z.string().min(1), id: z.string().min(1) });

const PROBABILITY_SCORE: Record<string, number> = {
  rare: 1,
  unlikely: 2,
  possible: 3,
  likely: 4,
  almost_certain: 5,
};
const IMPACT_SCORE: Record<string, number> = {
  negligible: 1,
  low: 2,
  moderate: 3,
  high: 4,
  catastrophic: 5,
};

const riskInclude = {
  owner: { select: { id: true, name: true, email: true } },
  actionOwner: { select: { id: true, name: true, email: true } },
  _count: { select: { assessments: true, treatments: true } },
} satisfies Prisma.RiskInclude;

function notFound(entity = "Risk"): never {
  throw Object.assign(new Error(`${entity} not found`), { status: 404 });
}

type RiskMatrixSnapshot = {
  id: string;
  tenantId: string;
  probabilityScore: number;
  impactScore: number;
  riskScore: number;
  residualLikelihoodScore: number | null;
  residualImpactScore: number | null;
  residualRiskScore: number | null;
};

function buildRiskMatrixChangeRows(
  before: RiskMatrixSnapshot,
  after: RiskMatrixSnapshot,
  userId: string,
  source: string,
): Prisma.RiskMatrixChangeCreateManyInput[] {
  const rows: Prisma.RiskMatrixChangeCreateManyInput[] = [];

  if (
    before.probabilityScore !== after.probabilityScore ||
    before.impactScore !== after.impactScore
  ) {
    rows.push({
      riskId: before.id,
      tenantId: before.tenantId,
      changedById: userId,
      kind: "inherent",
      source,
      prevLikelihood: before.probabilityScore,
      prevImpact: before.impactScore,
      prevScore: before.riskScore,
      newLikelihood: after.probabilityScore,
      newImpact: after.impactScore,
      newScore: after.riskScore,
    });
  }

  const bl = before.residualLikelihoodScore;
  const bi = before.residualImpactScore;
  const al = after.residualLikelihoodScore;
  const ai = after.residualImpactScore;
  if (al != null && ai != null && (bl !== al || bi !== ai)) {
    rows.push({
      riskId: before.id,
      tenantId: before.tenantId,
      changedById: userId,
      kind: "residual",
      source,
      prevLikelihood: bl ?? undefined,
      prevImpact: bi ?? undefined,
      prevScore: before.residualRiskScore ?? undefined,
      newLikelihood: al,
      newImpact: ai,
      newScore: after.residualRiskScore ?? al * ai,
    });
  }

  return rows;
}

async function generateRiskIdentifier(db: ReturnType<typeof prismaWithTenant>): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = `Q${Math.ceil((now.getMonth() + 1) / 3)}`;
  const prefix = `${year}-RID-${quarter}-`;

  const latest = await db.risk.findFirst({
    where: { riskIdentifier: { startsWith: prefix } },
    orderBy: { riskIdentifier: "desc" },
    select: { riskIdentifier: true },
  });

  let seq = 1;
  if (latest?.riskIdentifier) {
    const parts = latest.riskIdentifier.split("-");
    const lastSegment = parts[parts.length - 1] ?? "";
    const last = parseInt(lastSegment, 10);
    if (!isNaN(last)) seq = last + 1;
  }
  return `${prefix}${String(seq).padStart(2, "0")}`;
}

// ──────────────────────────────────────────────
// Default field config (all fields enabled)
// ──────────────────────────────────────────────

const DEFAULT_RISK_FIELDS = [
  {
    key: "riskIdentifier",
    label: "Risk ID",
    enabled: true,
    required: false,
    group: "core",
    order: 0,
  },
  { key: "title", label: "Risk Item", enabled: true, required: true, group: "core", order: 1 },
  {
    key: "description",
    label: "Description",
    enabled: true,
    required: false,
    group: "core",
    order: 2,
  },
  {
    key: "riskImpactDescription",
    label: "Risk Impact Description",
    enabled: true,
    required: false,
    group: "core",
    order: 3,
  },
  { key: "category", label: "Category", enabled: true, required: false, group: "core", order: 4 },
  {
    key: "businessProcess",
    label: "Business Process",
    enabled: true,
    required: false,
    group: "core",
    order: 5,
  },
  {
    key: "department",
    label: "Department",
    enabled: true,
    required: false,
    group: "core",
    order: 6,
  },
  { key: "ownerId", label: "Risk Owner", enabled: true, required: false, group: "core", order: 7 },
  {
    key: "riskProperty",
    label: "Risk Property",
    enabled: true,
    required: false,
    group: "core",
    order: 8,
  },
  { key: "status", label: "Status", enabled: true, required: true, group: "core", order: 9 },

  {
    key: "probability",
    label: "Probability",
    enabled: true,
    required: false,
    group: "inherent_risk",
    order: 10,
  },
  {
    key: "probabilityScore",
    label: "Probability Score",
    enabled: true,
    required: false,
    group: "inherent_risk",
    order: 11,
  },
  {
    key: "impact",
    label: "Impact",
    enabled: true,
    required: false,
    group: "inherent_risk",
    order: 12,
  },
  {
    key: "impactScore",
    label: "Impact Score",
    enabled: true,
    required: false,
    group: "inherent_risk",
    order: 13,
  },
  {
    key: "riskScore",
    label: "Risk Score",
    enabled: true,
    required: false,
    group: "inherent_risk",
    order: 14,
  },

  {
    key: "controlDescription",
    label: "Control Description",
    enabled: true,
    required: false,
    group: "controls",
    order: 15,
  },
  {
    key: "controlEffectiveness",
    label: "Effectiveness of Control",
    enabled: true,
    required: false,
    group: "controls",
    order: 16,
  },
  {
    key: "treatmentStrategy",
    label: "Risk Treatment Option",
    enabled: true,
    required: false,
    group: "controls",
    order: 17,
  },

  {
    key: "actionPlan",
    label: "Action Plan",
    enabled: true,
    required: false,
    group: "action",
    order: 18,
  },
  {
    key: "actionOwnerId",
    label: "Action Owner",
    enabled: true,
    required: false,
    group: "action",
    order: 19,
  },
  {
    key: "estStartDate",
    label: "EST Start Date",
    enabled: true,
    required: false,
    group: "action",
    order: 20,
  },
  {
    key: "estEndDate",
    label: "EST End Date",
    enabled: true,
    required: false,
    group: "action",
    order: 21,
  },

  {
    key: "budgetApproval",
    label: "Budget Approval",
    enabled: true,
    required: false,
    group: "approval",
    order: 22,
  },
  {
    key: "managementApproval",
    label: "Management Approval",
    enabled: true,
    required: false,
    group: "approval",
    order: 23,
  },

  {
    key: "residualLikelihood",
    label: "Residual Likelihood",
    enabled: true,
    required: false,
    group: "residual_risk",
    order: 24,
  },
  {
    key: "residualImpact",
    label: "Residual Impact",
    enabled: true,
    required: false,
    group: "residual_risk",
    order: 25,
  },
  {
    key: "residualRiskScore",
    label: "Residual Risk",
    enabled: true,
    required: false,
    group: "residual_risk",
    order: 26,
  },

  { key: "remarks", label: "Remarks", enabled: true, required: false, group: "other", order: 27 },
  { key: "tags", label: "Tags", enabled: true, required: false, group: "other", order: 28 },
];

// ──────────────────────────────────────────────
// GET /risks/field-config — per-org field config
// ──────────────────────────────────────────────

risksRouter.get("/field-config", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;

    const config = await prisma.riskRegisterConfig.findUnique({
      where: { tenantId },
    });

    res.json({
      success: true,
      data: config ? config.fields : DEFAULT_RISK_FIELDS,
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// PUT /risks/field-config — update field config
// ──────────────────────────────────────────────

const fieldConfigItem = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  enabled: z.boolean(),
  required: z.boolean(),
  group: z.string(),
  order: z.number().int(),
});

const fieldConfigBody = z.object({
  fields: z.array(fieldConfigItem).min(1),
});

risksRouter.put("/field-config", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { fields } = fieldConfigBody.parse(req.body);

    const config = await prisma.riskRegisterConfig.upsert({
      where: { tenantId },
      update: { fields: fields as any },
      create: { tenantId, fields: fields as any },
    });

    res.json({ success: true, data: config.fields });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// POST /risks/field-config/reset — reset to defaults
// ──────────────────────────────────────────────

risksRouter.post("/field-config/reset", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;

    await prisma.riskRegisterConfig.deleteMany({ where: { tenantId } });
    res.json({ success: true, data: DEFAULT_RISK_FIELDS });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /risks/stats — risk summary statistics
// ──────────────────────────────────────────────

risksRouter.get("/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const risks = await db.risk.findMany({
      select: {
        status: true,
        category: true,
        department: true,
        businessProcess: true,
        riskScore: true,
        probabilityScore: true,
        impactScore: true,
        residualRiskScore: true,
        residualLikelihoodScore: true,
        residualImpactScore: true,
        controlEffectiveness: true,
        createdAt: true,
      },
    });

    const total = risks.length;
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    const byBusinessProcess: Record<string, number> = {};
    const byControlEffectiveness: Record<string, number> = {};
    let critical = 0,
      high = 0,
      medium = 0,
      low = 0;
    let resCritical = 0,
      resHigh = 0,
      resMedium = 0,
      resLow = 0;

    for (const r of risks) {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      if (r.department) {
        byDepartment[r.department] = (byDepartment[r.department] || 0) + 1;
      }
      if (r.businessProcess) {
        byBusinessProcess[r.businessProcess] = (byBusinessProcess[r.businessProcess] || 0) + 1;
      }
      if (r.controlEffectiveness) {
        byControlEffectiveness[r.controlEffectiveness] =
          (byControlEffectiveness[r.controlEffectiveness] || 0) + 1;
      }

      if (r.riskScore >= 20) critical++;
      else if (r.riskScore >= 12) high++;
      else if (r.riskScore >= 5) medium++;
      else low++;

      const resScore = r.residualRiskScore ?? r.riskScore;
      if (resScore >= 20) resCritical++;
      else if (resScore >= 12) resHigh++;
      else if (resScore >= 5) resMedium++;
      else resLow++;
    }

    const heatmapData: { likelihood: number; impact: number; count: number }[] = [];
    const heatmap = new Map<string, number>();
    for (const r of risks) {
      const key = `${r.probabilityScore}:${r.impactScore}`;
      heatmap.set(key, (heatmap.get(key) || 0) + 1);
    }
    for (const [key, count] of heatmap) {
      const [l, i] = key.split(":").map(Number);
      heatmapData.push({ likelihood: l ?? 0, impact: i ?? 0, count });
    }

    const residualHeatmapData: { likelihood: number; impact: number; count: number }[] = [];
    const residualHeatmap = new Map<string, number>();
    for (const r of risks) {
      const lk = r.residualLikelihoodScore ?? r.probabilityScore;
      const im = r.residualImpactScore ?? r.impactScore;
      const key = `${lk}:${im}`;
      residualHeatmap.set(key, (residualHeatmap.get(key) || 0) + 1);
    }
    for (const [key, count] of residualHeatmap) {
      const [l, i] = key.split(":").map(Number);
      residualHeatmapData.push({ likelihood: l ?? 0, impact: i ?? 0, count });
    }

    const openCount = risks.filter((r) => !["done", "archived"].includes(r.status)).length;

    const now = new Date();
    const monthlyTrend: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = risks.filter((r) => r.createdAt >= start && r.createdAt < end).length;
      monthlyTrend.push({ month: label, count });
    }

    res.json({
      success: true,
      data: {
        total,
        openCount,
        severity: { critical, high, medium, low },
        residualSeverity: { critical: resCritical, high: resHigh, medium: resMedium, low: resLow },
        byStatus,
        byCategory,
        byDepartment,
        byBusinessProcess,
        byControlEffectiveness,
        heatmapData,
        residualHeatmapData,
        monthlyTrend,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /risks — paginated list with filters
// ──────────────────────────────────────────────

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: riskStatus.optional(),
  category: riskCategory.optional(),
  department: riskDepartment.optional(),
  businessProcess: z.string().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum([
      "title",
      "riskScore",
      "status",
      "category",
      "riskIdentifier",
      "businessProcess",
      "createdAt",
      "updatedAt",
    ])
    .default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

risksRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const q = listQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Prisma.RiskWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.category) where.category = q.category;
    if (q.department) where.department = q.department;
    if (q.businessProcess)
      where.businessProcess = { contains: q.businessProcess, mode: "insensitive" };
    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: "insensitive" } },
        { description: { contains: q.search, mode: "insensitive" } },
        { riskIdentifier: { contains: q.search, mode: "insensitive" } },
        { businessProcess: { contains: q.search, mode: "insensitive" } },
      ];
    }

    const skip = (q.page - 1) * q.limit;
    const [items, total] = await Promise.all([
      db.risk.findMany({
        where,
        include: riskInclude,
        orderBy: { [q.sortBy]: q.sortOrder },
        skip,
        take: q.limit,
      }),
      db.risk.count({ where }),
    ]);

    res.json({ success: true, data: { items, total, page: q.page, limit: q.limit } });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /risks/:riskId/matrix-changes — matrix audit history
// ──────────────────────────────────────────────

risksRouter.get("/:riskId/matrix-changes", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { riskId } = riskIdParams.parse(req.params);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(String(req.query.limit ?? "50"), 10) || 50),
    );
    const db = prismaWithTenant(tenantId);

    const risk = await db.risk.findUnique({ where: { id: riskId }, select: { id: true } });
    if (!risk) notFound();

    const items = await db.riskMatrixChange.findMany({
      where: { riskId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { changedBy: { select: { id: true, name: true, email: true } } },
    });

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /risks/:id — single risk with relations
// ──────────────────────────────────────────────

risksRouter.get("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const risk = await db.risk.findUnique({
      where: { id },
      include: {
        ...riskInclude,
        assessments: {
          orderBy: { assessedAt: "desc" },
          take: 20,
          include: { assessedBy: { select: { id: true, name: true, email: true } } },
        },
        treatments: {
          orderBy: { createdAt: "desc" },
          include: { responsible: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!risk) notFound();
    res.json({ success: true, data: risk });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// POST /risks — create risk (auto-generates Risk ID)
// ──────────────────────────────────────────────

const createBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  riskImpactDescription: z.string().optional(),
  category: riskCategory.default("operational"),
  status: riskStatus.optional(),
  businessProcess: z.string().nullable().optional(),
  department: riskDepartment.nullable().optional(),
  probability: probabilityLevel.nullable().optional(),
  probabilityScore: z.coerce.number().int().min(1).max(5).optional(),
  impact: impactLevel.nullable().optional(),
  impactScore: z.coerce.number().int().min(1).max(5).optional(),
  residualLikelihood: probabilityLevel.nullable().optional(),
  residualLikelihoodScore: z.coerce.number().int().min(1).max(5).nullable().optional(),
  residualImpact: impactLevel.nullable().optional(),
  residualImpactScore: z.coerce.number().int().min(1).max(5).nullable().optional(),
  controlDescription: z.string().nullable().optional(),
  controlEffectiveness: controlEffectiveness.nullable().optional(),
  treatmentStrategy: treatmentStrategy.nullable().optional(),
  treatmentRationale: z.string().nullable().optional(),
  actionPlan: z.string().nullable().optional(),
  actionOwnerId: z.string().nullable().optional(),
  actionOwnerName: z.string().nullable().optional(),
  estStartDate: z.string().nullable().optional(),
  estEndDate: z.string().nullable().optional(),
  budgetApproval: approvalStatus.nullable().optional(),
  managementApproval: approvalStatus.nullable().optional(),
  ownerId: z.string().nullable().optional(),
  riskProperty: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

risksRouter.post("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = createBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const riskIdentifier = await generateRiskIdentifier(db);

    // The `PROBABILITY_SCORE` / `IMPACT_SCORE` lookup is keyed on the
    // string enum; index access widens to `number | undefined`, but every
    // enum value is in the map so the fallback to `1` is defensive only.
    const probScore: number =
      body.probabilityScore ?? (body.probability ? (PROBABILITY_SCORE[body.probability] ?? 1) : 1);
    const impScore: number =
      body.impactScore ?? (body.impact ? (IMPACT_SCORE[body.impact] ?? 1) : 1);
    const riskScore = probScore * impScore;

    const resLScore: number | undefined =
      body.residualLikelihoodScore ??
      (body.residualLikelihood ? PROBABILITY_SCORE[body.residualLikelihood] : undefined);
    const resIScore: number | undefined =
      body.residualImpactScore ??
      (body.residualImpact ? IMPACT_SCORE[body.residualImpact] : undefined);
    const residualRiskScore = resLScore && resIScore ? resLScore * resIScore : undefined;

    const risk = await db.risk.create({
      data: {
        tenantId,
        riskIdentifier,
        title: body.title,
        description: body.description,
        riskImpactDescription: body.riskImpactDescription,
        category: body.category,
        status: body.status,
        businessProcess: body.businessProcess ?? undefined,
        department: body.department ?? undefined,
        probability: body.probability ?? undefined,
        probabilityScore: probScore,
        impact: body.impact ?? undefined,
        impactScore: impScore,
        riskScore,
        residualLikelihood: body.residualLikelihood ?? undefined,
        residualLikelihoodScore: resLScore,
        residualImpact: body.residualImpact ?? undefined,
        residualImpactScore: resIScore,
        residualRiskScore,
        controlDescription: body.controlDescription ?? undefined,
        controlEffectiveness: body.controlEffectiveness ?? undefined,
        treatmentStrategy: body.treatmentStrategy ?? undefined,
        treatmentRationale: body.treatmentRationale ?? undefined,
        actionPlan: body.actionPlan ?? undefined,
        actionOwnerId: body.actionOwnerId ?? undefined,
        actionOwnerName: body.actionOwnerName ?? undefined,
        estStartDate: body.estStartDate ? new Date(body.estStartDate) : undefined,
        estEndDate: body.estEndDate ? new Date(body.estEndDate) : undefined,
        budgetApproval: body.budgetApproval ?? undefined,
        managementApproval: body.managementApproval ?? undefined,
        ownerId: body.ownerId ?? undefined,
        riskProperty: body.riskProperty ?? undefined,
        remarks: body.remarks ?? undefined,
        tags: body.tags ?? [],
      },
      include: riskInclude,
    });

    res.status(201).json({ success: true, data: risk });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// PATCH /risks/:id — update risk
// ──────────────────────────────────────────────

const patchBody = createBody.partial().extend({
  status: riskStatus.optional(),
  changeSource: z.enum(["matrix", "overview"]).optional(),
});

risksRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { id } = idParams.parse(req.params);
    const body = patchBody.parse(req.body);
    const changeSource = body.changeSource ?? "overview";
    const db = prismaWithTenant(tenantId);

    const existing = await db.risk.findUnique({ where: { id } });
    if (!existing) notFound();

    const data: Prisma.RiskUncheckedUpdateInput = {};

    for (const [key, val] of Object.entries(body)) {
      if (val === undefined) continue;
      if (key === "changeSource") continue;
      if (key === "estStartDate" || key === "estEndDate") {
        (data as any)[key] = val ? new Date(val as string) : null;
      } else {
        (data as any)[key] = val;
      }
    }

    // Auto-compute scores from qualitative levels if provided
    const prob = (body.probability ?? existing.probability) as string | null;
    const imp = (body.impact ?? existing.impact) as string | null;
    if (body.probability !== undefined && prob) {
      data.probabilityScore = PROBABILITY_SCORE[prob] ?? existing.probabilityScore;
    }
    if (body.impact !== undefined && imp) {
      data.impactScore = IMPACT_SCORE[imp] ?? existing.impactScore;
    }

    const finalProbScore =
      (data.probabilityScore as number) ?? body.probabilityScore ?? existing.probabilityScore;
    const finalImpScore = (data.impactScore as number) ?? body.impactScore ?? existing.impactScore;
    if (
      body.probability !== undefined ||
      body.impact !== undefined ||
      body.probabilityScore !== undefined ||
      body.impactScore !== undefined
    ) {
      data.riskScore = finalProbScore * finalImpScore;
    }

    // Residual auto-compute
    const resL = (body.residualLikelihood ?? existing.residualLikelihood) as string | null;
    const resI = (body.residualImpact ?? existing.residualImpact) as string | null;
    if (body.residualLikelihood !== undefined && resL) {
      data.residualLikelihoodScore = PROBABILITY_SCORE[resL] ?? existing.residualLikelihoodScore;
    }
    if (body.residualImpact !== undefined && resI) {
      data.residualImpactScore = IMPACT_SCORE[resI] ?? existing.residualImpactScore;
    }
    const finalResLScore =
      (data.residualLikelihoodScore as number | undefined) ??
      (body.residualLikelihoodScore as number | undefined) ??
      existing.residualLikelihoodScore;
    const finalResIScore =
      (data.residualImpactScore as number | undefined) ??
      (body.residualImpactScore as number | undefined) ??
      existing.residualImpactScore;
    if (finalResLScore != null && finalResIScore != null) {
      data.residualRiskScore = finalResLScore * finalResIScore;
    }

    const risk =
      Object.keys(data).length === 0
        ? existing
        : await db.risk.update({ where: { id }, data, include: riskInclude });

    if (Object.keys(data).length > 0) {
      const beforeSnap: RiskMatrixSnapshot = {
        id: existing.id,
        tenantId: existing.tenantId,
        probabilityScore: existing.probabilityScore,
        impactScore: existing.impactScore,
        riskScore: existing.riskScore,
        residualLikelihoodScore: existing.residualLikelihoodScore,
        residualImpactScore: existing.residualImpactScore,
        residualRiskScore: existing.residualRiskScore,
      };
      const afterSnap: RiskMatrixSnapshot = {
        id: risk.id,
        tenantId: risk.tenantId,
        probabilityScore: risk.probabilityScore,
        impactScore: risk.impactScore,
        riskScore: risk.riskScore,
        residualLikelihoodScore: risk.residualLikelihoodScore,
        residualImpactScore: risk.residualImpactScore,
        residualRiskScore: risk.residualRiskScore,
      };
      const rows = buildRiskMatrixChangeRows(beforeSnap, afterSnap, userId, changeSource);
      if (rows.length > 0) {
        await db.riskMatrixChange.createMany({ data: rows });
      }
    }

    res.json({ success: true, data: risk });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// DELETE /risks/:id
// ──────────────────────────────────────────────

risksRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    await db.risk.delete({ where: { id } });
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Risk Assessments
// ──────────────────────────────────────────────

const createAssessmentBody = z.object({
  inherentLikelihood: scoreVal,
  inherentImpact: scoreVal,
  residualLikelihood: scoreVal,
  residualImpact: scoreVal,
  notes: z.string().optional(),
});

risksRouter.get("/:riskId/assessments", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { riskId } = riskIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    const assessments = await db.riskAssessment.findMany({
      where: { riskId },
      orderBy: { assessedAt: "desc" },
      include: { assessedBy: { select: { id: true, name: true, email: true } } },
    });
    res.json({ success: true, data: assessments });
  } catch (err) {
    next(err);
  }
});

risksRouter.post("/:riskId/assessments", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { riskId } = riskIdParams.parse(req.params);
    const body = createAssessmentBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const risk = await db.risk.findUnique({ where: { id: riskId } });
    if (!risk) notFound();

    const beforeSnap: RiskMatrixSnapshot = {
      id: risk.id,
      tenantId: risk.tenantId,
      probabilityScore: risk.probabilityScore,
      impactScore: risk.impactScore,
      riskScore: risk.riskScore,
      residualLikelihoodScore: risk.residualLikelihoodScore,
      residualImpactScore: risk.residualImpactScore,
      residualRiskScore: risk.residualRiskScore,
    };
    const afterSnap: RiskMatrixSnapshot = {
      ...beforeSnap,
      probabilityScore: body.inherentLikelihood,
      impactScore: body.inherentImpact,
      riskScore: body.inherentLikelihood * body.inherentImpact,
      residualLikelihoodScore: body.residualLikelihood,
      residualImpactScore: body.residualImpact,
      residualRiskScore: body.residualLikelihood * body.residualImpact,
    };
    const matrixRows = buildRiskMatrixChangeRows(beforeSnap, afterSnap, userId, "assessment");

    // `txOps` mixes two RiskAssessment/Risk fluent calls with an optional
    // `createMany`. TypeScript widens the first two elements to a fluent
    // chain type that doesn't accept `PrismaPromise<GetBatchResult>` from
    // `createMany`, so we type the array as the loosest common ancestor —
    // `PrismaPromise<unknown>` — that `$transaction` already supports.
    type AnyPrismaOp = ReturnType<typeof db.riskAssessment.create>;
    const txOps: AnyPrismaOp[] = [
      db.riskAssessment.create({
        data: { riskId, tenantId, assessedById: userId, ...body },
        include: { assessedBy: { select: { id: true, name: true, email: true } } },
      }),
      db.risk.update({
        where: { id: riskId },
        data: {
          probabilityScore: body.inherentLikelihood,
          impactScore: body.inherentImpact,
          riskScore: body.inherentLikelihood * body.inherentImpact,
          residualLikelihoodScore: body.residualLikelihood,
          residualImpactScore: body.residualImpact,
          residualRiskScore: body.residualLikelihood * body.residualImpact,
        },
      }) as unknown as AnyPrismaOp,
    ];
    if (matrixRows.length > 0) {
      txOps.push(db.riskMatrixChange.createMany({ data: matrixRows }) as unknown as AnyPrismaOp);
    }

    const results = await db.$transaction(txOps);
    const assessment = results[0];

    res.status(201).json({ success: true, data: assessment });
  } catch (err) {
    next(err);
  }
});

risksRouter.delete("/:riskId/assessments/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = subIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    await db.riskAssessment.delete({ where: { id } });
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// Risk Treatments
// ──────────────────────────────────────────────

const createTreatmentBody = z.object({
  title: z.string().min(1),
  strategy: treatmentStrategy,
  description: z.string().optional(),
  responsibleId: z.string().min(1),
  dueDate: z.string().optional(),
});

const patchTreatmentBody = z.object({
  title: z.string().min(1).optional(),
  strategy: treatmentStrategy.optional(),
  description: z.string().nullable().optional(),
  responsibleId: z.string().min(1).optional(),
  dueDate: z.string().nullable().optional(),
  status: treatmentStatus.optional(),
  completedAt: z.string().nullable().optional(),
});

risksRouter.get("/:riskId/treatments", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { riskId } = riskIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    const treatments = await db.riskTreatment.findMany({
      where: { riskId },
      orderBy: { createdAt: "desc" },
      include: { responsible: { select: { id: true, name: true, email: true } } },
    });
    res.json({ success: true, data: treatments });
  } catch (err) {
    next(err);
  }
});

risksRouter.post("/:riskId/treatments", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { riskId } = riskIdParams.parse(req.params);
    const body = createTreatmentBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const risk = await db.risk.findUnique({ where: { id: riskId } });
    if (!risk) notFound();

    const treatment = await db.riskTreatment.create({
      data: {
        riskId,
        tenantId,
        title: body.title,
        strategy: body.strategy,
        description: body.description,
        responsibleId: body.responsibleId,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      },
      include: { responsible: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ success: true, data: treatment });
  } catch (err) {
    next(err);
  }
});

risksRouter.patch("/:riskId/treatments/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = subIdParams.parse(req.params);
    const body = patchTreatmentBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.riskTreatment.findUnique({ where: { id } });
    if (!existing) notFound("Treatment");

    const data: Prisma.RiskTreatmentUncheckedUpdateInput = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.strategy !== undefined) data.strategy = body.strategy;
    if (body.description !== undefined) data.description = body.description;
    if (body.responsibleId !== undefined) data.responsibleId = body.responsibleId;
    if (body.status !== undefined) data.status = body.status;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.completedAt !== undefined)
      data.completedAt = body.completedAt ? new Date(body.completedAt) : null;
    if (body.status === "completed" && !body.completedAt) data.completedAt = new Date();

    const treatment = await db.riskTreatment.update({
      where: { id },
      data,
      include: { responsible: { select: { id: true, name: true, email: true } } },
    });
    res.json({ success: true, data: treatment });
  } catch (err) {
    next(err);
  }
});

risksRouter.delete("/:riskId/treatments/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = subIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    await db.riskTreatment.delete({ where: { id } });
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// AI: suggest risk score (Phase 5 — AI accelerators)
// ──────────────────────────────────────────────

/**
 * POST /risks/:id/ai-suggest-score
 *
 * Returns an advisory likelihood/impact suggestion grounded in the org's
 * other risks. Read-only — never mutates the risk. The UI displays it as
 * an advisory banner with Apply / Dismiss / Refine actions.
 */
risksRouter.post("/:id/ai-suggest-score", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);

    const suggestion = await suggestRiskScore({ tenantId, riskId: id });

    await audit(req, "create", "RiskAIScoreSuggestion", id, {
      suggestionId: suggestion.suggestionId,
      likelihood: suggestion.likelihood,
      impact: suggestion.impact,
      confidence: suggestion.confidence,
      modelUsed: suggestion.modelUsed,
      providerSource: suggestion.providerSource,
    });

    res.json({ success: true, data: suggestion });
  } catch (err) {
    if (err instanceof RiskNotFoundError) {
      return next(Object.assign(new Error(err.message), { status: 404 }));
    }
    next(err);
  }
});

/**
 * POST /risks/:id/ai-score-decision
 *
 * Records the human's accept/dismiss/refine decision on a prior AI
 * suggestion. The actual score change (when "applied") flows through
 * the standard PATCH /risks/:id endpoint — this endpoint only writes
 * the audit trail so we have a clean record of AI-influenced changes.
 */
const aiScoreDecisionBody = z.object({
  suggestionId: z.string().min(1),
  decision: z.enum(["applied", "dismissed", "refined"]),
  appliedLikelihood: z.coerce.number().int().min(1).max(5).optional(),
  appliedImpact: z.coerce.number().int().min(1).max(5).optional(),
  refineNotes: z.string().max(2000).optional(),
});

risksRouter.post("/:id/ai-score-decision", async (req, res, next) => {
  try {
    const { id } = idParams.parse(req.params);
    const body = aiScoreDecisionBody.parse(req.body);

    const action = body.decision === "applied" ? "approve" : "reject";

    await audit(req, action, "RiskAIScoreSuggestion", id, {
      suggestionId: body.suggestionId,
      decision: body.decision,
      appliedLikelihood: body.appliedLikelihood,
      appliedImpact: body.appliedImpact,
      refineNotes: body.refineNotes,
    });

    res.json({ success: true, data: { suggestionId: body.suggestionId, decision: body.decision } });
  } catch (err) {
    next(err);
  }
});
