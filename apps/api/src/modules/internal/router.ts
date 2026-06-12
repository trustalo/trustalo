import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { requireServiceAuth } from "../../lib/service-auth.js";
import { createAutomatedEvidence } from "../evidence/ingest-service.js";
import { handleInternalDueForResearch } from "../vendors/router.js";
import { controlBindingRouter } from "./control-binding.js";
import { computeCps234ControlWeaknessDeadline } from "../../lib/business-days.js";
import { AuditLog } from "../../mongodb/models/index.js";

/**
 * Routes invoked by other Trustalo services (currently only the collector)
 * over the trusted internal network. Mounted *outside* the JWT-based
 * `/api/v1/*` namespace so we don't have to lie about user identity in
 * cross-service traffic.
 *
 * All routes require:
 *   - A valid `X-Service-*` HMAC signature (legacy `X-Internal-Key` is
 *     temporarily accepted while collectors are upgraded)
 *   - `X-Organization-Id` carrying the tenant the action belongs to
 */

function requireOrgHeader(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.headers["x-organization-id"];
  if (typeof tenantId !== "string" || !tenantId) {
    res.status(400).json({
      success: false,
      error: { code: "MISSING_ORG", message: "X-Organization-Id header is required" },
    });
    return;
  }
  (req as Request & { tenantId: string }).tenantId = tenantId;
  next();
}

export const internalRouter: Router = Router();

// All routes require an HMAC service signature.
internalRouter.use(requireServiceAuth());

// ── Scheduler routes (cross-tenant by design) ──────────────────────
// These run BEFORE `requireOrgHeader` because the collector scheduler
// enumerates due work across every org; an X-Organization-Id header
// here would be meaningless.
internalRouter.get("/vendors/due-for-research", handleInternalDueForResearch);

// All remaining routes are tenant-scoped — they MUST carry the
// X-Organization-Id header so the handler knows which org to act on.
internalRouter.use(requireOrgHeader);

// Manifest FrameworkRef → tenant Control resolution. Called by the
// collector when binding or reconciling a connection's checks against
// the tenant's adopted frameworks. Sub-router mounted under
// `/controls` so its surface is namespaced.
internalRouter.use("/controls", controlBindingRouter);

// ── Bulk evidence ingestion ─────────────────────────────────────────
//
// Called by the collector runner at the end of each collection job.
// Replaces the historical (and never-fully-wired) `/api/v1/evidence/bulk`
// endpoint. The wire format carries `manifestKey` (authoritative
// routing key) plus a pre-resolved `controlIds[]` array; the runner
// computes the IDs from `IntegrationCheckControl` bindings before
// calling, so the handler is a pure write.
//
// One Evidence row is persisted per (item × controlId). Items with an
// empty `controlIds[]` are skipped and counted as orphans — the
// runner already emits a structured warning so they're discoverable in
// the collector logs.

const bulkEvidenceItem = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  manifestKey: z.string().min(1),
  sourceType: z.string().optional(),
  sourceId: z.string().min(1),
  externalUrl: z.string().url().nullable().optional(),
  rawData: z.record(z.string(), z.unknown()).optional(),
  severity: z.enum(["critical", "high", "medium", "low", "info"]).optional(),
  // Deprecated mirror of the manifest's framework refs; persisted into
  // metadata for one release so old consumers can still inspect it.
  controlMapping: z.array(z.string()).optional(),
  controlIds: z.array(z.string().min(1)).default([]),
  collectedAt: z.coerce.date(),
});

const bulkEvidenceBody = z.object({
  evidence: z.array(bulkEvidenceItem).min(1).max(500),
});

// ── Tenant auto-bind mode lookup ────────────────────────────────────
//
// Called by the collector binder before persisting IntegrationCheck /
// IntegrationCheckControl rows. The collector falls back to its
// conservative DEFAULT_AUTO_BIND_MODE when the lookup fails, so this
// endpoint is best-effort.

internalRouter.get("/tenants/auto-bind-mode", async (req, res, next) => {
  try {
    const tenantId = (req as Request & { tenantId: string }).tenantId;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { integrationAutoBindMode: true },
    });
    if (!tenant) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Tenant not found" },
      });
      return;
    }
    res.json({ success: true, data: { mode: tenant.integrationAutoBindMode } });
  } catch (err) {
    next(err);
  }
});

internalRouter.post("/evidence/bulk", async (req, res, next) => {
  try {
    const tenantId = (req as Request & { tenantId: string }).tenantId;
    const body = bulkEvidenceBody.parse(req.body);
    // Delegates to the shared writer so the collector bulk path and the
    // device-posture check-in path create evidence through one code path.
    const result = await createAutomatedEvidence(tenantId, body.evidence);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ── Evidence agent: bulk submit collected evidence ──────────────────
//
// Called by the collector at the end of an evidence-agent run. The
// agent already knows the controlId (it was passed in when the run was
// created), so the payload is scoped to one control. Each item lands as
// a single Evidence row in `pending_review` so a human still approves
// it before it counts as audit evidence.

const evidenceItem = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  sourceType: z.string().min(1).default("agent"),
  sourceId: z.string().min(1),
  externalUrl: z.string().url().nullable().optional(),
  rawData: z.record(z.string(), z.unknown()).optional(),
  collectedAt: z.coerce.date().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

const agentEvidenceBody = z.object({
  controlId: z.string().min(1),
  agentRunId: z.string().min(1).optional(),
  evidence: z.array(evidenceItem).min(1).max(100),
});

internalRouter.post("/agent-evidence/bulk", async (req, res, next) => {
  try {
    const tenantId = (req as Request & { tenantId: string }).tenantId;
    const body = agentEvidenceBody.parse(req.body);

    const control = await prisma.control.findFirst({
      where: { id: body.controlId, tenantId },
      select: { id: true },
    });
    if (!control) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Control not found in this organization" },
      });
      return;
    }

    const now = new Date();
    const created = await prisma.$transaction(
      body.evidence.map((item) =>
        prisma.evidence.create({
          data: {
            tenantId,
            controlId: body.controlId,
            title: item.title,
            description: item.description ?? null,
            // Agent-collected items are typed as "automated"; the
            // narrative `sourceType` ("github", "aws-iam", ...) is kept
            // in metadata for traceability.
            type: "automated",
            status: "pending_review",
            externalUrl: item.externalUrl ?? null,
            sourceType: item.sourceType,
            sourceId: item.sourceId,
            collectedAt: item.collectedAt ?? now,
            validFrom: item.collectedAt ?? now,
            tags: ["agent"],
            // Cast through unknown — Prisma's `InputJsonValue` is more
            // restrictive than `Record<string, unknown>` (it forbids
            // top-level `undefined`), but our zod schema strips any
            // such values upstream so the cast is safe.
            metadata: {
              ...(item.metadata ?? {}),
              agentRunId: body.agentRunId ?? null,
              rawData: item.rawData ?? null,
            } as unknown as Parameters<typeof prisma.evidence.create>[0]["data"]["metadata"],
          },
          select: { id: true },
        }),
      ),
    );

    res.status(201).json({
      success: true,
      data: { created: created.length, ids: created.map((e) => e.id) },
    });
  } catch (err) {
    next(err);
  }
});

// ── EvidenceCoverageGap escalation ──────────────────────────────────
//
// Called hourly by the collector's gap-escalator cron. The collector
// owns the gap rows (they live in its DB next to IntegrationCheck),
// but escalation requires API-side primitives:
//   - audit-log entries for the org-history timeline
//   - auto-created `ControlWeakness` rows for cps234 high|critical
//     gaps (the 10-business-day CPS 234 Para 35 clock).
//
// Both are best-effort. The collector remembers what it already
// escalated (`lastEscalatedAt`, `controlWeaknessId`) so a transient
// API outage just delays escalation rather than dropping it.

const escalateGapBody = z.object({
  gapId: z.string().min(1),
  integrationCheckId: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  reason: z.string().min(1),
  // Snapshot of bound controls at gap-open time. The collector passes
  // these so we don't have to round-trip back to look them up.
  affectedControlIds: z.array(z.string().min(1)),
  openedAt: z.coerce.date(),
  lastErrorMessage: z.string().nullable().optional(),
  // The collector tells us whether to attempt ControlWeakness creation
  // (true for cps234-adopting tenants with high|critical severity).
  // We still gate on tenant + severity here defensively.
  createControlWeakness: z.boolean().default(false),
  /**
   * Set by the collector when its cross-tenant rollup shows the same
   * upstream provider is failing for many tenants at once. When true
   * we still record the audit log (so we have history) but skip the
   * per-tenant ControlWeakness creation — the platform team handles
   * the global outage, the individual customer doesn't need a
   * weakness in their inbox 10 minutes after AWS goes down.
   */
  platformOutage: z.boolean().default(false),
});

internalRouter.post("/coverage-gaps/escalate", async (req, res, next) => {
  try {
    const tenantId = (req as Request & { tenantId: string }).tenantId;
    const body = escalateGapBody.parse(req.body);

    const now = new Date();
    const openedForMs = now.getTime() - body.openedAt.getTime();

    // Audit-log the escalation regardless of whether we create a
    // ControlWeakness. The audit row is the durable notification of
    // record until a dedicated in-app notifications module exists.
    void AuditLog.create({
      tenantId,
      action: "update",
      resource: "EvidenceCoverageGap",
      resourceId: body.gapId,
      details: {
        transition: body.platformOutage ? "escalated_throttled_platform_outage" : "escalated",
        severity: body.severity,
        reason: body.reason,
        openedForMs,
        affectedControlIds: body.affectedControlIds,
        lastErrorMessage: body.lastErrorMessage ?? null,
        platformOutage: body.platformOutage,
      },
    }).catch((err) => console.error("[internal] audit log for gap escalation failed:", err));

    let controlWeaknessId: string | null = null;

    if (body.createControlWeakness && !body.platformOutage) {
      // ControlWeakness auto-creation is gated on:
      //   1) Tenant has cps234 enabled (otherwise the 10-BD clock is
      //      meaningless and we'd be polluting the weakness inbox).
      //   2) Severity is high or critical (per CPS 234 Para 35 — only
      //      "material" weaknesses trigger the notification duty).
      const cps234Enabled = await prisma.frameworkInstance.findFirst({
        where: {
          tenantId,
          isEnabled: true,
          framework: { frameworkType: "cps234" },
        },
        select: { id: true },
      });

      const isMaterial = body.severity === "high" || body.severity === "critical";

      if (cps234Enabled && isMaterial) {
        // Single-control gaps get a concrete `controlId`; multi-
        // control gaps (a manifest mapped to several requirements)
        // become a tenant-wide weakness with `controlId: null` — the
        // assessor can re-scope it manually.
        const controlId = body.affectedControlIds.length === 1 ? body.affectedControlIds[0] : null;

        const created = await prisma.controlWeakness.create({
          data: {
            tenantId,
            controlId,
            title: `Automated evidence coverage gap (${body.severity})`,
            description:
              `Automated evidence collection has been failing for ` +
              `${formatDuration(openedForMs)}. Reason: ${body.reason}. ` +
              `Last error: ${body.lastErrorMessage ?? "n/a"}.`,
            severity: body.severity,
            status: "open",
            discoveredAt: body.openedAt,
            notificationDeadlineAt: computeCps234ControlWeaknessDeadline(body.openedAt),
            remediability: "pending",
            apraNotificationRequired: false,
          },
          select: { id: true },
        });
        controlWeaknessId = created.id;
      }
    }

    res.json({ success: true, data: { controlWeaknessId } });
  } catch (err) {
    next(err);
  }
});

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
