/**
 * Health / coverage rollups for `IntegrationCheck` and
 * `EvidenceCoverageGap`. The API surfaces these through:
 *
 *  - `automationHealth` on `GET /controls/:id`
 *  - `GET /connections/:id/health`
 *  - `GET /controls/:id/evidence-coverage` (timeline)
 *
 * Everything here is pure read-side aggregation: no writes, no
 * external calls. The functions take a tenantId + a target and
 * return shapes designed for direct JSON serialisation. Surfacing
 * them on the collector keeps the data co-located with the
 * `IntegrationCheck` source of truth and lets the API stay a thin
 * proxy.
 */

import { prisma } from "../../db/prisma.js";
import type {
  CheckHealthState,
  CoverageGapReason,
} from "../../../generated/prisma/client/index.js";

/**
 * Roll up the operational status of every enabled `IntegrationCheck`
 * bound to a control. Worst state wins — `failing > overdue > degraded
 * > paused > healthy`. Returned shape is suitable to embed under
 * `control.automationHealth` on the API.
 *
 * `state === "no_automation"` is the "no automated checks bound" case;
 * we return it explicitly so the UI can show "evidence collected
 * manually" rather than "no data".
 */
export interface ControlAutomationHealth {
  state: CheckHealthState | "no_automation";
  totalChecks: number;
  healthyChecks: number;
  // The single most stale `lastSuccessfulRunAt` across bound checks.
  // Drives the "last collected: 4d ago" cell on the control card.
  oldestLastSuccessAt: string | null;
  openGapCount: number;
  // Worst severity across open gaps; helps the UI pick the right
  // chip colour without joining gap rows back to checks.
  openGapSeverity: "low" | "medium" | "high" | "critical" | null;
  // Top-3 most recent open gaps (id + reason + open-duration ms).
  // Auditors hover the chip and see why coverage is degraded.
  recentGaps: Array<{
    id: string;
    reason: CoverageGapReason;
    openedAt: string;
    openedForMs: number;
    lastErrorMessage: string | null;
  }>;
}

export async function getControlAutomationHealth(
  tenantId: string,
  controlId: string,
): Promise<ControlAutomationHealth> {
  const bindings = await prisma.integrationCheckControl.findMany({
    where: { tenantId, controlId, isEnabled: true },
    select: { integrationCheckId: true },
  });
  const checkIds = bindings.map((b) => b.integrationCheckId);

  if (checkIds.length === 0) {
    return {
      state: "no_automation",
      totalChecks: 0,
      healthyChecks: 0,
      oldestLastSuccessAt: null,
      openGapCount: 0,
      openGapSeverity: null,
      recentGaps: [],
    };
  }

  const checks = await prisma.integrationCheck.findMany({
    where: { id: { in: checkIds } },
    select: {
      id: true,
      healthState: true,
      lastSuccessfulRunAt: true,
      severity: true,
    },
  });

  const openGaps = await prisma.evidenceCoverageGap.findMany({
    where: { integrationCheckId: { in: checkIds }, endedAt: null },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      integrationCheckId: true,
      reason: true,
      startedAt: true,
      lastErrorMessage: true,
    },
  });

  const state = worstHealthState(checks.map((c) => c.healthState));
  const healthyChecks = checks.filter((c) => c.healthState === "healthy").length;

  const lastSuccesses = checks
    .map((c) => c.lastSuccessfulRunAt)
    .filter((d): d is Date => d !== null);
  const oldestLastSuccessAt =
    lastSuccesses.length === 0
      ? null
      : new Date(Math.min(...lastSuccesses.map((d) => d.getTime()))).toISOString();

  // Worst severity across open gaps. Mirror the check severity (which
  // we don't carry forward in the gap row to keep the schema flat).
  const checkSeverityById = new Map(checks.map((c) => [c.id, c.severity]));
  const severityRank: Record<"low" | "medium" | "high" | "critical", number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  let worstSeverity: "low" | "medium" | "high" | "critical" | null = null;
  for (const g of openGaps) {
    const sev = checkSeverityById.get(g.integrationCheckId);
    if (!sev) continue;
    if (!worstSeverity || severityRank[sev] > severityRank[worstSeverity]) {
      worstSeverity = sev;
    }
  }

  const now = Date.now();
  const recentGaps = openGaps.slice(0, 3).map((g) => ({
    id: g.id,
    reason: g.reason,
    openedAt: g.startedAt.toISOString(),
    openedForMs: now - g.startedAt.getTime(),
    lastErrorMessage: g.lastErrorMessage,
  }));

  return {
    state,
    totalChecks: checks.length,
    healthyChecks,
    oldestLastSuccessAt,
    openGapCount: openGaps.length,
    openGapSeverity: worstSeverity,
    recentGaps,
  };
}

/**
 * Per-connection health rollup. Differs from the control rollup in
 * that it covers the entire connection (every IntegrationCheck on it),
 * not just the bindings for one control. Used by the integrations
 * dashboard to badge each connection card.
 */
export interface ConnectionHealth {
  connectionId: string;
  state: CheckHealthState | "no_checks";
  totalChecks: number;
  checksByState: Record<CheckHealthState, number>;
  openGapCount: number;
  openGapsByReason: Partial<Record<CoverageGapReason, number>>;
  lastSyncAt: string | null;
}

export async function getConnectionHealth(
  tenantId: string,
  connectionId: string,
): Promise<ConnectionHealth | null> {
  const connection = await prisma.integrationConnection.findFirst({
    where: { id: connectionId, tenantId },
    select: { id: true, lastSyncAt: true },
  });
  if (!connection) return null;

  const checks = await prisma.integrationCheck.findMany({
    where: { connectionId, isEnabled: true },
    select: { id: true, healthState: true },
  });

  const checksByState: Record<CheckHealthState, number> = {
    healthy: 0,
    degraded: 0,
    overdue: 0,
    failing: 0,
    paused: 0,
  };
  for (const c of checks) checksByState[c.healthState]++;

  const openGaps = await prisma.evidenceCoverageGap.findMany({
    where: { tenantId, endedAt: null, integrationCheckId: { in: checks.map((c) => c.id) } },
    select: { reason: true },
  });
  const openGapsByReason: Partial<Record<CoverageGapReason, number>> = {};
  for (const g of openGaps) {
    openGapsByReason[g.reason] = (openGapsByReason[g.reason] ?? 0) + 1;
  }

  const state =
    checks.length === 0 ? "no_checks" : worstHealthState(checks.map((c) => c.healthState));

  return {
    connectionId,
    state,
    totalChecks: checks.length,
    checksByState,
    openGapCount: openGaps.length,
    openGapsByReason,
    lastSyncAt: connection.lastSyncAt?.toISOString() ?? null,
  };
}

/**
 * Coverage timeline for a control — all open + closed gaps over the
 * lookback window. Powers the auditor "evidence coverage" timeline
 * view: stacked bars per check, hover for `reason` / `lastErrorMessage`.
 */
export interface CoverageGapTimelineEntry {
  id: string;
  integrationCheckId: string;
  manifestKey: string;
  reason: CoverageGapReason;
  startedAt: string;
  endedAt: string | null;
  durationMs: number;
  lastErrorMessage: string | null;
}

export interface ControlEvidenceCoverage {
  controlId: string;
  windowStart: string;
  windowEnd: string;
  gaps: CoverageGapTimelineEntry[];
  // Aggregate uptime across all bindings within the window. 1.0 = no
  // gaps for any bound check. 0.0 = continuously broken.
  uptime: number;
}

export async function getControlEvidenceCoverage(
  tenantId: string,
  controlId: string,
  options: { windowDays?: number } = {},
): Promise<ControlEvidenceCoverage> {
  const windowDays = options.windowDays && options.windowDays > 0 ? options.windowDays : 30;
  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const bindings = await prisma.integrationCheckControl.findMany({
    where: { tenantId, controlId },
    select: { integrationCheckId: true },
  });
  const checkIds = bindings.map((b) => b.integrationCheckId);
  if (checkIds.length === 0) {
    return {
      controlId,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      gaps: [],
      uptime: 1,
    };
  }

  // "Overlaps the window" predicate: a gap is in-window if it started
  // before the window ends AND ended after the window starts (or is
  // still open).
  const gaps = await prisma.evidenceCoverageGap.findMany({
    where: {
      integrationCheckId: { in: checkIds },
      startedAt: { lt: windowEnd },
      OR: [{ endedAt: null }, { endedAt: { gt: windowStart } }],
    },
    include: { integrationCheck: { select: { manifestKey: true } } },
    orderBy: { startedAt: "asc" },
  });

  // Prisma's findMany shape includes every scalar, so `lastErrorMessage`
  // and friends are already on `g` — just shape the result.
  const entries: CoverageGapTimelineEntry[] = gaps.map((g) => {
    const effectiveStart = g.startedAt < windowStart ? windowStart : g.startedAt;
    const effectiveEnd = g.endedAt && g.endedAt < windowEnd ? g.endedAt : (g.endedAt ?? windowEnd);
    return {
      id: g.id,
      integrationCheckId: g.integrationCheckId,
      manifestKey: g.integrationCheck.manifestKey,
      reason: g.reason,
      startedAt: g.startedAt.toISOString(),
      endedAt: g.endedAt?.toISOString() ?? null,
      durationMs: effectiveEnd.getTime() - effectiveStart.getTime(),
      lastErrorMessage: g.lastErrorMessage,
    };
  });

  // Per-check downtime, summed and divided by total possible
  // (checks × window). Treat this as a coarse SLO indicator — gaps
  // overlapping each other on different checks aren't deduplicated,
  // mirroring the per-check definition of "did we lose visibility".
  const totalPossibleMs = checkIds.length * (windowEnd.getTime() - windowStart.getTime());
  const downtimeMs = entries.reduce((sum, e) => sum + e.durationMs, 0);
  const uptime =
    totalPossibleMs > 0 ? Math.max(0, Math.min(1, 1 - downtimeMs / totalPossibleMs)) : 1;

  return {
    controlId,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    gaps: entries,
    uptime,
  };
}

const HEALTH_ORDER: Array<CheckHealthState | "no_automation" | "no_checks"> = [
  "healthy",
  "paused",
  "degraded",
  "overdue",
  "failing",
];

function worstHealthState(states: CheckHealthState[]): CheckHealthState {
  let worst: CheckHealthState = "healthy";
  for (const s of states) {
    if (HEALTH_ORDER.indexOf(s) > HEALTH_ORDER.indexOf(worst)) worst = s;
  }
  return worst;
}
