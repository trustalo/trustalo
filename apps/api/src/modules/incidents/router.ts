import { Router } from "express";
import { z } from "zod";
import { prismaWithTenant } from "../../db/prisma.js";
import { authorizeResource } from "../../middleware/authorize.js";

export const incidentsRouter: Router = Router();
incidentsRouter.use(authorizeResource("incidents:read", "incidents:write"));

const idParams = z.object({
  id: z.string().min(1),
});

const incidentSeverity = z.enum(["critical", "high", "medium", "low", "informational"]);
const incidentStatus = z.enum([
  "reported",
  "investigating",
  "contained",
  "resolved",
  "closed",
  "lessons_learned",
]);

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  severity: incidentSeverity.optional(),
  status: incidentStatus.optional(),
});

const createIncidentBody = z.object({
  title: z.string().min(1),
  severity: incidentSeverity,
  reportedById: z.string().min(1),
  description: z.string().optional(),
  assignedToId: z.string().optional(),
  detectedAt: z.coerce.date().optional(),
});

const patchIncidentBody = createIncidentBody.partial().extend({
  status: incidentStatus.optional(),
  resolvedAt: z.coerce.date().nullable().optional(),
  rootCause: z.string().nullable().optional(),
  regulatoryNotificationRequired: z.boolean().optional(),
  regulatoryNotifiedAt: z.coerce.date().nullable().optional(),
});

incidentsRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { page, limit, search, severity, status } = listQuery.parse(req.query);
    const skip = (page - 1) * limit;
    const db = prismaWithTenant(tenantId);
    const where = {
      ...(severity ? { severity } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      db.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.incident.count({ where }),
    ]);
    res.json({ success: true, data: { items, total, page, limit } });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────
// GET /incidents/stats
// ──────────────────────────────────────────────

incidentsRouter.get("/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const incidents = await db.incident.findMany({
      select: {
        severity: true,
        status: true,
        reportedById: true,
        createdAt: true,
        resolvedAt: true,
        detectedAt: true,
        regulatoryNotificationRequired: true,
        regulatoryNotifiedAt: true,
      },
    });

    const total = incidents.length;
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byReporter: Record<string, number> = {};

    let resolvedCount = 0;
    let totalResolutionMs = 0;
    let regulatoryRequired = 0;
    let regulatoryNotified = 0;

    for (const inc of incidents) {
      bySeverity[inc.severity] = (bySeverity[inc.severity] || 0) + 1;
      byStatus[inc.status] = (byStatus[inc.status] || 0) + 1;
      byReporter[inc.reportedById] = (byReporter[inc.reportedById] || 0) + 1;

      if (inc.resolvedAt) {
        resolvedCount++;
        const start = inc.detectedAt ?? inc.createdAt;
        totalResolutionMs += inc.resolvedAt.getTime() - start.getTime();
      }

      if (inc.regulatoryNotificationRequired) {
        regulatoryRequired++;
        if (inc.regulatoryNotifiedAt) regulatoryNotified++;
      }
    }

    const openCount = incidents.filter(
      (i) => !["resolved", "closed", "lessons_learned"].includes(i.status),
    ).length;

    const mttrHours =
      resolvedCount > 0 ? Math.round(totalResolutionMs / resolvedCount / (1000 * 60 * 60)) : null;

    const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

    const now = new Date();
    const monthlyTrend: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const count = incidents.filter((inc) => inc.createdAt >= start && inc.createdAt < end).length;
      monthlyTrend.push({ month: label, count });
    }

    const topReporterIds = Object.entries(byReporter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    let topReporters: { id: string; name: string; count: number }[] = [];
    if (topReporterIds.length > 0) {
      const { prisma } = await import("../../db/prisma.js");
      const users = await prisma.user.findMany({
        where: { id: { in: topReporterIds } },
        select: { id: true, name: true },
      });
      const nameMap = new Map(users.map((u) => [u.id, u.name]));
      topReporters = topReporterIds.map((id) => ({
        id,
        name: nameMap.get(id) || "Unknown",
        count: byReporter[id] || 0,
      }));
    }

    res.json({
      success: true,
      data: {
        total,
        openCount,
        resolvedCount,
        resolutionRate,
        mttrHours,
        bySeverity,
        byStatus,
        monthlyTrend,
        topReporters,
        regulatory: { required: regulatoryRequired, notified: regulatoryNotified },
      },
    });
  } catch (err) {
    next(err);
  }
});

incidentsRouter.get("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    const incident = await db.incident.findUnique({ where: { id } });
    if (!incident) {
      return next(Object.assign(new Error("Incident not found"), { status: 404 }));
    }
    res.json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
});

incidentsRouter.post("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = createIncidentBody.parse(req.body);
    const db = prismaWithTenant(tenantId);
    const incident = await db.incident.create({ data: { ...body, tenantId } });
    res.status(201).json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
});

incidentsRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = patchIncidentBody.parse(req.body);
    const db = prismaWithTenant(tenantId);
    const incident = await db.incident.update({
      where: { id },
      data: body,
    });
    res.json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
});

incidentsRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    await db.incident.delete({ where: { id } });
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});
