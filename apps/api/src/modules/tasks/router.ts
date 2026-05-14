import { Router } from "express";
import { z } from "zod";
import { prismaWithTenant } from "../../db/prisma.js";
import { Prisma } from "../../../generated/prisma/client/index.js";

export const tasksRouter: Router = Router();

// Keep in sync with TaskSourceModule in apps/api/prisma/schema/task.prisma.
// Mismatches here surface as 400 errors when a privacy router (DSAR,
// breach, DPIA, processing activity) tries to file a follow-up task.
const taskSourceModule = z.enum([
  "training",
  "control",
  "risk",
  "evidence",
  "vendor",
  "asset",
  "audit",
  "policy",
  "bcp",
  "incident",
  "dsar",
  "data_breach",
  "dpia",
  "processing_activity",
]);

const taskStatus = z.enum(["pending", "in_progress", "completed", "overdue", "cancelled"]);

const taskPriority = z.enum(["critical", "high", "medium", "low"]);
const taskType = z.enum(["manual", "automated", "recurring"]);
const taskFrequency = z.enum(["once", "daily", "weekly", "monthly", "quarterly", "annually"]);

const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  sourceModule: z.string().optional(),
  assigneeId: z.string().optional(),
  myTasks: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

const idParams = z.object({ id: z.string().min(1) });

const createTaskBody = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  type: taskType.optional(),
  priority: taskPriority.optional(),
  assigneeId: z.string().optional().nullable(),
  controlId: z.string().optional().nullable(),
  sourceModule: taskSourceModule.optional().nullable(),
  sourceId: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  frequency: taskFrequency.optional().nullable(),
});

const patchTaskBody = createTaskBody.partial().extend({
  status: taskStatus.optional(),
});

// --- Stats ---
tasksRouter.get("/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const db = prismaWithTenant(tenantId);
    const now = new Date();

    const [total, statusGroups, priorityGroups, moduleGroups, myPending, overdueCount] =
      await Promise.all([
        db.task.count(),
        db.task.groupBy({ by: ["status"], _count: { id: true } }),
        db.task.groupBy({ by: ["priority"], _count: { id: true } }),
        db.task.groupBy({ by: ["sourceModule"], _count: { id: true } }),
        db.task.count({
          where: {
            assigneeId: userId,
            status: { in: ["pending", "in_progress"] },
          },
        }),
        db.task.count({
          where: {
            dueDate: { lt: now },
            status: { notIn: ["completed", "cancelled"] },
          },
        }),
      ]);

    const byStatus: Record<string, number> = {};
    for (const row of statusGroups) byStatus[row.status] = row._count.id;

    const byPriority: Record<string, number> = {};
    for (const row of priorityGroups) byPriority[row.priority] = row._count.id;

    const byModule: Record<string, number> = {};
    for (const row of moduleGroups) {
      if (row.sourceModule) byModule[row.sourceModule] = row._count.id;
    }

    res.json({
      success: true,
      data: {
        total,
        myPending,
        overdueCount,
        byStatus,
        byPriority,
        byModule,
      },
    });
  } catch (err) {
    next(err);
  }
});

// --- List tasks ---
tasksRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { page, limit, search, status, priority, sourceModule, assigneeId, myTasks } =
      paginationQuery.parse(req.query);

    const db = prismaWithTenant(tenantId);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) where.title = { contains: search, mode: "insensitive" };
    if (status && status !== "all") where.status = status;
    if (priority && priority !== "all") where.priority = priority;
    if (sourceModule && sourceModule !== "all") where.sourceModule = sourceModule;
    if (assigneeId) where.assigneeId = assigneeId;
    if (myTasks) where.assigneeId = userId;

    const [items, total] = await Promise.all([
      db.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ dueDate: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
        include: {
          assignee: { select: { id: true, name: true, email: true } },
        },
      }),
      db.task.count({ where }),
    ]);

    const now = new Date();
    const enriched = items.map((t: any) => ({
      ...t,
      isOverdue:
        t.dueDate && new Date(t.dueDate) < now && !["completed", "cancelled"].includes(t.status),
    }));

    res.json({
      success: true,
      data: { items: enriched, page, limit, total },
    });
  } catch (err) {
    next(err);
  }
});

// --- Get single task ---
tasksRouter.get("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const task = await db.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        evidence: {
          include: {
            submittedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!task) {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// --- Create task ---
tasksRouter.post("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = createTaskBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    // `body` is zod-parsed; the resulting shape is a superset of Prisma's
    // `TaskCreateInput`. Building the row as `Record<string, unknown>` and
    // casting at the call-site keeps the conditional `nextDueDate` /
    // `type` assignment readable while satisfying Prisma 7's strict input
    // type-check.
    const data: Record<string, unknown> = {
      ...body,
      tenantId,
    };

    if (body.frequency && body.frequency !== "once" && body.dueDate) {
      data.type = "recurring";
      data.nextDueDate = computeNextDue(body.dueDate, body.frequency);
    }

    const task = await db.task.create({
      data: data as Prisma.TaskUncheckedCreateInput,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// --- Update task ---
tasksRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = patchTaskBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const updateData: Record<string, unknown> = { ...body };
    if (body.status === "completed") {
      updateData.completedAt = new Date();
    }

    const task = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// --- Delete task ---
tasksRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    await db.task.delete({ where: { id } });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// --- Complete task (shorthand) ---
tasksRouter.post("/:id/complete", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const existing = await db.task.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Not found" });
      return;
    }

    const updateData: Record<string, unknown> = {
      status: "completed",
      completedAt: new Date(),
    };

    const task = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    if (existing.frequency && existing.frequency !== "once" && existing.dueDate) {
      const nextDue = computeNextDue(existing.dueDate, existing.frequency);
      await db.task.create({
        data: {
          tenantId,
          title: existing.title,
          description: existing.description,
          type: "recurring",
          priority: existing.priority,
          assigneeId: existing.assigneeId,
          controlId: existing.controlId,
          sourceModule: existing.sourceModule,
          sourceId: existing.sourceId,
          frequency: existing.frequency,
          dueDate: nextDue,
          nextDueDate: computeNextDue(nextDue, existing.frequency),
        },
      });
    }

    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// --- Process overdue tasks (callable by cron) ---
tasksRouter.post("/process-overdue", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    const now = new Date();

    const result = await db.task.updateMany({
      where: {
        dueDate: { lt: now },
        status: { in: ["pending", "in_progress"] },
      },
      data: { status: "overdue" },
    });

    res.json({ success: true, data: { updated: result.count } });
  } catch (err) {
    next(err);
  }
});

function computeNextDue(currentDue: Date, frequency: string): Date {
  const next = new Date(currentDue);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    case "annually":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}
