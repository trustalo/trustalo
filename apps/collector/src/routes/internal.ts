/**
 * Service-to-service routes called by the API. Authenticated via an
 * HMAC-signed request (with legacy `X-Internal-Key` accepted during
 * rollout) plus an explicit `X-Organization-Id` header.
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { providerRegistry } from "../integrations/core/registry.js";
import { createAndQueueAgentRun, getAgentRun, listAgentRuns } from "../agent/agent-runner.js";
import { requireServiceAuth } from "../lib/service-auth.js";
import {
  reconcileBindings,
  reconcileAllConnectionsForTenant,
} from "../integrations/binder/reconciler.js";
import {
  getControlAutomationHealth,
  getConnectionHealth,
  getControlEvidenceCoverage,
} from "../integrations/health/index.js";

interface InternalRequest extends Request {
  tenantId: string;
}

function requireOrgHeader(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.headers["x-organization-id"];
  if (typeof tenantId !== "string" || !tenantId) {
    res.status(400).json({
      success: false,
      error: { code: "MISSING_ORG", message: "X-Organization-Id header is required" },
    });
    return;
  }
  (req as InternalRequest).tenantId = tenantId;
  next();
}

export const internalRouter: Router = Router();
internalRouter.use(requireServiceAuth());

// ── Cross-tenant SRE rollups (NO X-Organization-Id required) ───────
//
// These endpoints aggregate across every tenant in the collector's
// DB. They're consumed by the API's platform-health surfaces and by
// SRE dashboards/alerting. Mounted BEFORE the `requireOrgHeader`
// middleware so callers don't need to pin a tenant header to a
// cross-tenant query.

/**
 * Snapshot of currently-open `EvidenceCoverageGap` rows aggregated by
 * provider (Integration.id) and reason. Used by the API to detect
 * "the entire fleet just lost AWS coverage at 03:14 UTC" and throttle
 * per-tenant notifications during platform-wide upstream outages.
 *
 * Returns counts only — no tenant ids, no error messages. Anything
 * sensitive must be queried via the tenant-scoped endpoints above.
 */
internalRouter.get("/health/coverage-gaps", async (_req, res, next) => {
  try {
    const openGaps = await prisma.evidenceCoverageGap.findMany({
      where: { endedAt: null },
      select: {
        reason: true,
        startedAt: true,
        integrationCheck: {
          select: {
            severity: true,
            integration: { select: { id: true, name: true } },
          },
        },
      },
    });

    const byProvider = new Map<
      string,
      {
        providerId: string;
        providerName: string;
        openGaps: number;
        // Per-reason breakdown so SRE can spot "everyone is being
        // rate-limited by Octokit" vs "everyone's tokens just rotated".
        byReason: Record<string, number>;
        bySeverity: { low: number; medium: number; high: number; critical: number };
        // Earliest startedAt across this provider's gaps — useful to
        // see "started 12m ago" vs "ongoing for hours".
        earliestStartedAt: string;
      }
    >();

    for (const g of openGaps) {
      const providerId = g.integrationCheck.integration.id;
      const providerName = g.integrationCheck.integration.name;
      const existing = byProvider.get(providerId);
      const startedIso = g.startedAt.toISOString();
      if (existing) {
        existing.openGaps++;
        existing.byReason[g.reason] = (existing.byReason[g.reason] ?? 0) + 1;
        existing.bySeverity[g.integrationCheck.severity]++;
        if (startedIso < existing.earliestStartedAt) {
          existing.earliestStartedAt = startedIso;
        }
      } else {
        byProvider.set(providerId, {
          providerId,
          providerName,
          openGaps: 1,
          byReason: { [g.reason]: 1 },
          bySeverity: {
            low: g.integrationCheck.severity === "low" ? 1 : 0,
            medium: g.integrationCheck.severity === "medium" ? 1 : 0,
            high: g.integrationCheck.severity === "high" ? 1 : 0,
            critical: g.integrationCheck.severity === "critical" ? 1 : 0,
          },
          earliestStartedAt: startedIso,
        });
      }
    }

    const data = {
      totalOpenGaps: openGaps.length,
      providers: [...byProvider.values()].sort((a, b) => b.openGaps - a.openGaps),
      generatedAt: new Date().toISOString(),
    };
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

internalRouter.use(requireOrgHeader);

// ── Binding reconciler ──────────────────────────────────────────────
//
// API-side lifecycle hooks (framework toggled, control deleted, etc.)
// fan out here to align tenant-Control bindings with the new state.
// The handler is idempotent: callers can retry on transient failure
// without producing duplicate rows or thrashing `disabledReason`.

const reconcileBindingsBody = z
  .object({
    /** Optional explicit connection id to reconcile. */
    connectionId: z.string().min(1).optional(),
    /**
     * Optional hint for the reason a binding might fall off the
     * desired set during this pass. Used as the fallback
     * `disabledReason` when the resolver alone can't be precise.
     */
    triggerReason: z
      .enum([
        "pending_confirmation",
        "user_disabled",
        "control_not_applicable",
        "control_deleted",
        "framework_disabled",
        "ref_unmapped",
        "manifest_removed",
      ])
      .optional(),
  })
  .strict();

internalRouter.post("/connections/reconcile-bindings", async (req, res, next) => {
  try {
    const tenantId = (req as InternalRequest).tenantId;
    const body = reconcileBindingsBody.parse(req.body ?? {});

    if (body.connectionId) {
      const result = await reconcileBindings({
        tenantId,
        connectionId: body.connectionId,
        triggerReason: body.triggerReason,
      });
      res.json({ success: true, data: { connections: [result], totalConnections: 1 } });
      return;
    }

    const results = await reconcileAllConnectionsForTenant(tenantId, body.triggerReason);
    res.json({
      success: true,
      data: { connections: results, totalConnections: results.length },
    });
  } catch (err) {
    next(err);
  }
});

// ── Bound connection lookup ─────────────────────────────────────────
//
// Returns the set of `IntegrationConnection`s the collector has
// materialised IntegrationCheckControl bindings for a given API-side
// `controlId`. The API agent picker uses this to default
// `agentToolConnectionIds` to the unified bindings without forcing the
// user to repeat the choice.
//
// Only **enabled** bindings count — soft-disabled rows (e.g. binding
// was paused after the tenant disabled a framework) intentionally
// don't surface here.

internalRouter.get("/controls/:controlId/connections", async (req, res, next) => {
  try {
    const tenantId = (req as unknown as InternalRequest).tenantId;
    const controlId = String(req.params["controlId"]);

    const bindings = await prisma.integrationCheckControl.findMany({
      where: { tenantId, controlId, isEnabled: true },
      select: {
        connection: {
          select: {
            id: true,
            name: true,
            status: true,
            isActive: true,
            integration: { select: { id: true, name: true, category: true } },
          },
        },
        integrationCheck: { select: { manifestKey: true, severity: true, title: true } },
      },
    });

    // Roll up multiple manifestKeys into one entry per connection so
    // the agent picker shows "GitHub (5 capabilities)" instead of 5
    // separate rows for the same connection.
    const byConnection = new Map<
      string,
      {
        id: string;
        name: string;
        status: string;
        isActive: boolean;
        integrationSlug: string;
        integrationName: string;
        manifestKeys: string[];
      }
    >();
    for (const b of bindings) {
      const c = b.connection;
      const existing = byConnection.get(c.id);
      if (existing) {
        existing.manifestKeys.push(b.integrationCheck.manifestKey);
        continue;
      }
      byConnection.set(c.id, {
        id: c.id,
        name: c.name,
        status: c.status,
        isActive: c.isActive,
        integrationSlug: c.integration.id,
        integrationName: c.integration.name,
        manifestKeys: [b.integrationCheck.manifestKey],
      });
    }
    const data = [...byConnection.values()].map((c) => ({
      ...c,
      manifestKeys: [...new Set(c.manifestKeys)].sort(),
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ── Health / coverage rollups ──────────────────────────────────────
//
// Read-only aggregates over IntegrationCheck + EvidenceCoverageGap.
// The API forwards `/controls/:id/automation-health`, the auditor
// timeline view, and connection-card health badges through these
// endpoints.

internalRouter.get("/controls/:controlId/automation-health", async (req, res, next) => {
  try {
    const tenantId = (req as unknown as InternalRequest).tenantId;
    const controlId = String(req.params["controlId"]);
    const health = await getControlAutomationHealth(tenantId, controlId);
    res.json({ success: true, data: health });
  } catch (err) {
    next(err);
  }
});

internalRouter.get("/controls/:controlId/evidence-coverage", async (req, res, next) => {
  try {
    const tenantId = (req as unknown as InternalRequest).tenantId;
    const controlId = String(req.params["controlId"]);
    const windowDays = req.query.windowDays
      ? Math.max(1, Math.min(365, Number(req.query.windowDays)))
      : undefined;
    const coverage = await getControlEvidenceCoverage(tenantId, controlId, { windowDays });
    res.json({ success: true, data: coverage });
  } catch (err) {
    next(err);
  }
});

internalRouter.get("/connections/:connectionId/health", async (req, res, next) => {
  try {
    const tenantId = (req as unknown as InternalRequest).tenantId;
    const connectionId = String(req.params["connectionId"]);
    const health = await getConnectionHealth(tenantId, connectionId);
    if (!health) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Connection not found" },
      });
      return;
    }
    res.json({ success: true, data: health });
  } catch (err) {
    next(err);
  }
});

// ── Connections summary used by the agent tool picker ──────────────

internalRouter.get("/connections", async (req, res, next) => {
  try {
    const tenantId = (req as InternalRequest).tenantId;
    const connections = await prisma.integrationConnection.findMany({
      where: { tenantId, isActive: true },
      // `Integration.id` IS the slug, so we select id + the rest. The
      // outgoing wire format still uses the `slug` key for backwards
      // compatibility with API clients pinned to the old schema.
      include: { integration: { select: { id: true, name: true, category: true } } },
      orderBy: { createdAt: "desc" },
    });

    const data = connections.map((c) => {
      const provider = providerRegistry.get(c.integration.id);
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        isActive: c.isActive,
        provider: {
          slug: c.integration.id,
          name: c.integration.name,
          category: c.integration.category,
          capabilities: provider?.capabilities ?? [],
        },
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ── Evidence-agent runs ────────────────────────────────────────────

const createAgentRunBody = z.object({
  controlId: z.string().min(1),
  controlTitle: z.string().nullable().optional(),
  instructions: z.string().min(1),
  toolConnectionIds: z.array(z.string().min(1)).min(1),
  ai: z.object({
    provider: z.string().min(1),
    model: z.string().min(1),
    credentials: z.record(z.string(), z.unknown()),
  }),
  trigger: z.enum(["manual", "scheduled", "api"]).optional(),
});

internalRouter.post("/agent-runs", async (req, res, next) => {
  try {
    const tenantId = (req as InternalRequest).tenantId;
    const body = createAgentRunBody.parse(req.body);

    const run = await createAndQueueAgentRun({
      tenantId,
      controlId: body.controlId,
      controlTitle: body.controlTitle ?? null,
      instructions: body.instructions,
      toolConnectionIds: body.toolConnectionIds,
      ai: body.ai,
      trigger: body.trigger ?? "api",
    });

    res.status(202).json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
});

internalRouter.get("/agent-runs", async (req, res, next) => {
  try {
    const tenantId = (req as InternalRequest).tenantId;
    const controlId = typeof req.query.controlId === "string" ? req.query.controlId : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const runs = await listAgentRuns(tenantId, { controlId, limit });
    res.json({ success: true, data: runs });
  } catch (err) {
    next(err);
  }
});

internalRouter.get("/agent-runs/:id", async (req, res, next) => {
  try {
    const tenantId = (req as unknown as InternalRequest).tenantId;
    const id = z.string().min(1).parse(req.params.id);

    const run = await getAgentRun(tenantId, id);
    if (!run) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Agent run not found" },
      });
      return;
    }
    res.json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
});
