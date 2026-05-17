/**
 * ControlWeakness REST router.
 *
 * Implements the CPS 234 Para 35 control-weakness register:
 *   • Track each material information-security control weakness
 *     discovered by the entity.
 *   • Snapshot the 10-business-day APRA notification clock at
 *     `discoveredAt` (see `lib/business-days.ts` for the holiday
 *     calendar and weekend semantics).
 *   • Surface overdue weaknesses via a `notificationOverdue=true`
 *     filter so the dashboard can drive a "regulatory risk" widget.
 *
 * The router mirrors the DataBreach router shape so the API and UI
 * layers can reuse the same conventions (list / get / create / patch
 * / transition).
 *
 * RBAC: piggybacks on the existing `controls:read` / `controls:write`
 * permissions. A weakness is a control-domain artefact; introducing a
 * new permission would require an RBAC migration for every existing
 * tenant, and we already grant `controls:write` to the same audience
 * (Compliance + Security roles) that owns the CPS 234 program.
 */

import { Router } from "express";
import { z } from "zod";
import { prismaWithTenant } from "../../db/prisma.js";
import { authorizeResource } from "../../middleware/authorize.js";
import { audit } from "../../lib/audit.js";
import { computeCps234ControlWeaknessDeadline } from "../../lib/business-days.js";
import { deriveUpdatedClock, isControlWeaknessOverdue, overdueWhereClause } from "./logic.js";

// ── Zod enums (mirror Prisma enums) ─────────────────────────────────

const severityEnum = z.enum(["low", "medium", "high", "critical"]);
const statusEnum = z.enum(["open", "triaging", "notified", "remediating", "closed"]);
const remediabilityEnum = z.enum(["pending", "remediable_in_time", "not_remediable_in_time"]);

// ── Request schemas ──────────────────────────────────────────────────

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  status: statusEnum.optional(),
  severity: severityEnum.optional(),
  remediability: remediabilityEnum.optional(),
  controlId: z.string().min(1).optional(),
  /// Filter to weaknesses whose 10-BD APRA clock has expired but the
  /// regulator has not yet been notified — surfaces the most urgent items.
  notificationOverdue: z.coerce.boolean().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["discoveredAt", "notificationDeadlineAt", "severity", "status", "updatedAt"])
    .default("notificationDeadlineAt"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

const createBody = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  severity: severityEnum,
  status: statusEnum.optional(),
  controlId: z.string().nullable().optional(),
  discoveredAt: z.coerce.date().optional(),
  /// Allow override of the auto-computed 10-BD deadline (rare — used
  /// when the discovery point itself is uncertain and assessors back-
  /// date the clock).
  notificationDeadlineAt: z.coerce.date().optional(),
  expectedRemediationAt: z.coerce.date().nullable().optional(),
  remediability: remediabilityEnum.optional(),
  rootCause: z.string().nullable().optional(),
  remediationPlan: z.string().nullable().optional(),
  apraNotificationRequired: z.boolean().optional(),
  apraReference: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
});

const updateBody = createBody.partial();

const transitionBody = z
  .object({
    status: statusEnum,
    apraReference: z.string().nullable().optional(),
  })
  .strict();

const idParams = z.object({ id: z.string().min(1) });

// ── Includes / selects ───────────────────────────────────────────────

const userSelect = { id: true, name: true, email: true } as const;
const controlSelect = { id: true, title: true, status: true } as const;

const include = {
  control: { select: controlSelect },
  reportedBy: { select: userSelect },
  assignee: { select: userSelect },
} as const;

// ── Router ──────────────────────────────────────────────────────────

export const controlWeaknessesRouter: Router = Router();
controlWeaknessesRouter.use(authorizeResource("controls:read", "controls:write"));

controlWeaknessesRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = listQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.remediability) where.remediability = query.remediability;
    if (query.controlId) where.controlId = query.controlId;
    if (query.notificationOverdue) {
      Object.assign(where, overdueWhereClause(new Date()));
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      db.controlWeakness.findMany({
        where,
        include,
        orderBy: { [query.sortBy]: query.sortDir },
        skip,
        take: query.limit,
      }),
      db.controlWeakness.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page: query.page, limit: query.limit },
    });
  } catch (err) {
    next(err);
  }
});

controlWeaknessesRouter.get("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    const weakness = await db.controlWeakness.findUnique({ where: { id }, include });
    if (!weakness) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Control weakness not found" },
      });
      return;
    }
    // Decorate with a derived `isOverdue` flag so UI doesn't have to
    // re-import the helper.
    res.json({
      success: true,
      data: {
        ...weakness,
        isOverdue: isControlWeaknessOverdue(weakness.notificationDeadlineAt, new Date()),
      },
    });
  } catch (err) {
    next(err);
  }
});

controlWeaknessesRouter.post("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const body = createBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    if (body.controlId) {
      const control = await db.control.findUnique({ where: { id: body.controlId } });
      if (!control) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Control not found" },
        });
        return;
      }
    }

    const discoveredAt = body.discoveredAt ?? new Date();
    const notificationDeadlineAt =
      body.notificationDeadlineAt ?? computeCps234ControlWeaknessDeadline(discoveredAt);

    const weakness = await db.controlWeakness.create({
      data: {
        tenantId,
        controlId: body.controlId ?? null,
        title: body.title,
        description: body.description ?? null,
        severity: body.severity,
        status: body.status ?? "open",
        discoveredAt,
        notificationDeadlineAt,
        expectedRemediationAt: body.expectedRemediationAt ?? null,
        remediability: body.remediability ?? "pending",
        rootCause: body.rootCause ?? null,
        remediationPlan: body.remediationPlan ?? null,
        apraNotificationRequired: body.apraNotificationRequired ?? false,
        apraReference: body.apraReference ?? null,
        reportedById: userId,
        assigneeId: body.assigneeId ?? null,
      },
      include,
    });

    await audit(req, "create", "ControlWeakness", weakness.id, {
      title: weakness.title,
      severity: weakness.severity,
      notificationDeadlineAt: weakness.notificationDeadlineAt,
    });
    res.status(201).json({ success: true, data: weakness });
  } catch (err) {
    next(err);
  }
});

controlWeaknessesRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = updateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.controlWeakness.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Control weakness not found" },
      });
      return;
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.severity !== undefined) data.severity = body.severity;
    if (body.status !== undefined) data.status = body.status;
    if (body.controlId !== undefined) data.controlId = body.controlId;
    // Recompute the 10-BD clock when discoveredAt shifts, unless the
    // caller also supplies an explicit deadline override.
    const clock = deriveUpdatedClock({
      discoveredAt: body.discoveredAt,
      notificationDeadlineAt: body.notificationDeadlineAt,
    });
    if (clock.discoveredAt !== undefined) data.discoveredAt = clock.discoveredAt;
    if (clock.notificationDeadlineAt !== undefined)
      data.notificationDeadlineAt = clock.notificationDeadlineAt;
    if (body.expectedRemediationAt !== undefined)
      data.expectedRemediationAt = body.expectedRemediationAt;
    if (body.remediability !== undefined) data.remediability = body.remediability;
    if (body.rootCause !== undefined) data.rootCause = body.rootCause;
    if (body.remediationPlan !== undefined) data.remediationPlan = body.remediationPlan;
    if (body.apraNotificationRequired !== undefined)
      data.apraNotificationRequired = body.apraNotificationRequired;
    if (body.apraReference !== undefined) data.apraReference = body.apraReference;
    if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId;

    const weakness = await db.controlWeakness.update({ where: { id }, data, include });
    await audit(req, "update", "ControlWeakness", weakness.id, {
      changedFields: Object.keys(data),
    });
    res.json({ success: true, data: weakness });
  } catch (err) {
    next(err);
  }
});

controlWeaknessesRouter.post("/:id/transition", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = transitionBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.controlWeakness.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Control weakness not found" },
      });
      return;
    }

    const now = new Date();
    const data: Record<string, unknown> = { status: body.status };
    if (body.status === "notified" && !existing.apraNotifiedAt) {
      data.apraNotifiedAt = now;
    }
    if (body.apraReference !== undefined) data.apraReference = body.apraReference;
    if (body.status === "closed" && !existing.remediatedAt) data.remediatedAt = now;

    const weakness = await db.controlWeakness.update({ where: { id }, data, include });
    await audit(req, "update", "ControlWeakness", weakness.id, {
      transition: { from: existing.status, to: body.status },
    });
    res.json({ success: true, data: weakness });
  } catch (err) {
    next(err);
  }
});

controlWeaknessesRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const existing = await db.controlWeakness.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Control weakness not found" },
      });
      return;
    }

    await db.controlWeakness.delete({ where: { id } });
    await audit(req, "delete", "ControlWeakness", id, { title: existing.title });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
