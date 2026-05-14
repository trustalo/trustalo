import { Router } from "express";
import { z } from "zod";
import { prismaWithTenant } from "../../db/prisma.js";
import { authorizeResource } from "../../middleware/authorize.js";

export const vulnerabilitiesRouter: Router = Router();
vulnerabilitiesRouter.use(authorizeResource("vulnerabilities:read", "vulnerabilities:write"));

const idParams = z.object({ id: z.string().min(1) });

const vulnSeverity = z.enum(["critical", "high", "medium", "low", "informational"]);
const vulnStatus = z.enum([
  "open",
  "confirmed",
  "in_progress",
  "remediated",
  "accepted",
  "false_positive",
]);
const vulnSource = z.enum(["scan", "pentest", "bug_bounty", "manual", "vendor_advisory"]);

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  severity: vulnSeverity.optional(),
  status: vulnStatus.optional(),
  source: vulnSource.optional(),
});

const createBody = z.object({
  title: z.string().min(1),
  severity: vulnSeverity,
  reportedById: z.string().min(1),
  description: z.string().optional(),
  source: vulnSource.optional(),
  cvssScore: z.coerce.number().min(0).max(10).optional(),
  cveId: z.string().optional(),
  cweId: z.string().optional(),
  affectedComponent: z.string().optional(),
  productionImpact: z.boolean().optional(),
  assignedToId: z.string().optional(),
  detectedAt: z.coerce.date().optional(),
});

const patchBody = createBody.partial().extend({
  status: vulnStatus.optional(),
  remediatedAt: z.coerce.date().nullable().optional(),
});

// ──────────────────────────────────────────────
// GET /vulnerabilities
// ──────────────────────────────────────────────

vulnerabilitiesRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { page, limit, search, severity, status, source } = listQuery.parse(req.query);
    const skip = (page - 1) * limit;
    const db = prismaWithTenant(tenantId);

    const where = {
      ...(severity ? { severity } : {}),
      ...(status ? { status } : {}),
      ...(source ? { source } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { cveId: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      db.vulnerability.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      db.vulnerability.count({ where }),
    ]);

    res.json({ success: true, data: { items, total, page, limit } });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /vulnerabilities/stats
// ──────────────────────────────────────────────

vulnerabilitiesRouter.get("/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const vulns = await db.vulnerability.findMany({
      select: {
        severity: true,
        status: true,
        source: true,
        cvssScore: true,
        cweId: true,
        productionImpact: true,
        createdAt: true,
        detectedAt: true,
        remediatedAt: true,
      },
    });

    const total = vulns.length;
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byCwe: Record<string, number> = {};
    const cvssDistribution = { none: 0, low: 0, medium: 0, high: 0, critical: 0 };

    let remediatedCount = 0;
    let totalRemediationMs = 0;
    let productionImpactCount = 0;

    for (const v of vulns) {
      bySeverity[v.severity] = (bySeverity[v.severity] || 0) + 1;
      byStatus[v.status] = (byStatus[v.status] || 0) + 1;
      bySource[v.source] = (bySource[v.source] || 0) + 1;

      if (v.cweId) {
        byCwe[v.cweId] = (byCwe[v.cweId] || 0) + 1;
      }

      if (v.cvssScore != null) {
        if (v.cvssScore === 0) cvssDistribution.none++;
        else if (v.cvssScore <= 3.9) cvssDistribution.low++;
        else if (v.cvssScore <= 6.9) cvssDistribution.medium++;
        else if (v.cvssScore <= 8.9) cvssDistribution.high++;
        else cvssDistribution.critical++;
      }

      if (v.remediatedAt) {
        remediatedCount++;
        const start = v.detectedAt ?? v.createdAt;
        totalRemediationMs += v.remediatedAt.getTime() - start.getTime();
      }

      if (v.productionImpact) productionImpactCount++;
    }

    const openCount = vulns.filter(
      (v) => !["remediated", "accepted", "false_positive"].includes(v.status),
    ).length;

    const mttrHours =
      remediatedCount > 0
        ? Math.round(totalRemediationMs / remediatedCount / (1000 * 60 * 60))
        : null;

    const remediationRate = total > 0 ? Math.round((remediatedCount / total) * 100) : 0;

    const productionImpactRate = total > 0 ? Math.round((productionImpactCount / total) * 100) : 0;

    // Monthly trend (last 12 months)
    const now = new Date();
    const monthlyTrend: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = vulns.filter((v) => v.createdAt >= start && v.createdAt < end).length;
      monthlyTrend.push({ month: label, count });
    }

    // Top CWEs (sorted, limited to 10)
    const topCwes = Object.entries(byCwe)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({ id, count }));

    res.json({
      success: true,
      data: {
        total,
        openCount,
        remediatedCount,
        remediationRate,
        mttrHours,
        productionImpactCount,
        productionImpactRate,
        bySeverity,
        byStatus,
        bySource,
        cvssDistribution,
        topCwes,
        monthlyTrend,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /vulnerabilities/:id
// ──────────────────────────────────────────────

vulnerabilitiesRouter.get("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    const vuln = await db.vulnerability.findUnique({ where: { id } });
    if (!vuln) {
      return next(Object.assign(new Error("Vulnerability not found"), { status: 404 }));
    }
    res.json({ success: true, data: vuln });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// POST /vulnerabilities
// ──────────────────────────────────────────────

vulnerabilitiesRouter.post("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = createBody.parse(req.body);
    const db = prismaWithTenant(tenantId);
    const vuln = await db.vulnerability.create({ data: { ...body, tenantId } });
    res.status(201).json({ success: true, data: vuln });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// PATCH /vulnerabilities/:id
// ──────────────────────────────────────────────

vulnerabilitiesRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = patchBody.parse(req.body);
    const db = prismaWithTenant(tenantId);
    const vuln = await db.vulnerability.update({ where: { id }, data: body });
    res.json({ success: true, data: vuln });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// DELETE /vulnerabilities/:id
// ──────────────────────────────────────────────

vulnerabilitiesRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    await db.vulnerability.delete({ where: { id } });
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});
