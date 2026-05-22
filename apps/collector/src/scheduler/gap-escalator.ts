/**
 * Hourly gap-escalator cron.
 *
 * Walks every open `EvidenceCoverageGap`, decides if it's been open
 * long enough for the check's severity, and:
 *   - POSTs the escalation to the API (which writes an audit row,
 *     and for cps234 high|critical gaps auto-creates a
 *     `ControlWeakness`).
 *   - Records `lastEscalatedAt` / `escalationCount` / `controlWeaknessId`
 *     on the gap row to debounce subsequent ticks.
 *
 * The thresholds intentionally err on the side of "wait until we're
 * sure": no escalation in the first hour for anything. Below the
 * threshold the gap is invisible to the auditor inbox but already
 * visible in `automationHealth` rollups.
 */

import type { IntegrationCheckSeverity } from "../../generated/prisma/client/index.js";
import { prisma } from "../db/prisma.js";
import { escalateCoverageGap } from "../lib/api-client.js";

/**
 * Cross-tenant outage detection. We treat a provider as being in a
 * platform-wide outage when *both* hold simultaneously:
 *   1. Open gaps for that provider span ≥ `PLATFORM_OUTAGE_MIN_TENANTS`
 *      distinct tenants.
 *   2. At least `PLATFORM_OUTAGE_REASON_RATIO` of those gaps share the
 *      same `reason` (so it's an upstream symptom, not unrelated noise).
 *
 * Numbers picked to be low-false-positive on a small fleet — tweak in
 * `apps/collector/src/scheduler/gap-escalator.ts` once we have real
 * data. The cost of a false positive is "individual tenants get an
 * audit log entry but no ControlWeakness for an hour" — recoverable.
 */
const PLATFORM_OUTAGE_MIN_TENANTS = 5;
const PLATFORM_OUTAGE_REASON_RATIO = 0.8;

const TICK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Minimum open-duration before we escalate, per severity. Picked to
 * roughly mirror common SLA tiers:
 *   - low: 1 week — non-blocking, batch with the weekly digest
 *   - medium: 3 days
 *   - high: 1 day
 *   - critical: 4h — wakes someone up
 */
const ESCALATION_THRESHOLDS_MS: Record<IntegrationCheckSeverity, number> = {
  low: 7 * 24 * 60 * 60 * 1000,
  medium: 3 * 24 * 60 * 60 * 1000,
  high: 24 * 60 * 60 * 1000,
  critical: 4 * 60 * 60 * 1000,
};

/**
 * Don't re-escalate an already-escalated gap until this much time has
 * passed since the last escalation. Keeps the audit log from being
 * spammed once a gap is open and acknowledged.
 */
const RE_ESCALATION_DEBOUNCE_MS = 24 * 60 * 60 * 1000;

let intervalId: ReturnType<typeof setInterval> | null = null;
let running = false;

export async function startGapEscalator(): Promise<void> {
  if (intervalId) return;
  console.log("[gap-escalator] starting — interval:", TICK_INTERVAL_MS, "ms");

  await runEscalationPass();
  intervalId = setInterval(() => {
    if (!running) {
      runEscalationPass().catch((err) => console.error("[gap-escalator] tick failed:", err));
    }
  }, TICK_INTERVAL_MS);
}

export function stopGapEscalator(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[gap-escalator] stopped");
  }
}

export async function runEscalationPass(): Promise<void> {
  running = true;
  try {
    const openGaps = await prisma.evidenceCoverageGap.findMany({
      where: { endedAt: null },
      include: {
        integrationCheck: {
          select: {
            severity: true,
            manifestKey: true,
            integrationId: true,
          },
        },
      },
    });
    if (openGaps.length === 0) return;

    // Compute the set of provider ids currently in platform-wide
    // outage so the loop below can stamp `platformOutage: true` on
    // those escalations. Single pass; both sides of the boolean
    // condition are cheap.
    const outageProviders = detectPlatformOutages(openGaps);

    const now = Date.now();
    let escalated = 0;
    let weaknessesCreated = 0;

    for (const gap of openGaps) {
      const severity = gap.integrationCheck.severity;
      const threshold = ESCALATION_THRESHOLDS_MS[severity];
      const openedFor = now - gap.startedAt.getTime();
      if (openedFor < threshold) continue;

      // Debounce: already escalated within the last 24h? Skip.
      if (gap.lastEscalatedAt && now - gap.lastEscalatedAt.getTime() < RE_ESCALATION_DEBOUNCE_MS) {
        continue;
      }

      // Only attempt ControlWeakness creation when:
      //   - severity warrants it (high|critical)
      //   - we haven't already created one for this gap
      const shouldRequestWeakness =
        !gap.controlWeaknessId && (severity === "high" || severity === "critical");

      const platformOutage = outageProviders.has(gap.integrationCheck.integrationId);

      try {
        const result = await escalateCoverageGap(gap.tenantId, {
          gapId: gap.id,
          integrationCheckId: gap.integrationCheckId,
          severity,
          reason: `${gap.reason}: ${gap.integrationCheck.manifestKey}`,
          affectedControlIds: gap.affectedControlIds,
          openedAt: gap.startedAt.toISOString(),
          lastErrorMessage: gap.lastErrorMessage,
          createControlWeakness: shouldRequestWeakness,
          platformOutage,
        });

        await prisma.evidenceCoverageGap.update({
          where: { id: gap.id },
          data: {
            lastEscalatedAt: new Date(now),
            escalationCount: { increment: 1 },
            // Only overwrite the existing weakness id when we got one
            // back — re-escalations of the same gap reuse the original
            // ControlWeakness so the assessor doesn't see duplicates.
            ...(result.controlWeaknessId ? { controlWeaknessId: result.controlWeaknessId } : {}),
          },
        });

        escalated++;
        if (result.controlWeaknessId && !gap.controlWeaknessId) {
          weaknessesCreated++;
        }
      } catch (err) {
        console.error(
          `[gap-escalator] failed to escalate gap=${gap.id} tenant=${gap.tenantId}:`,
          err,
        );
      }
    }

    if (escalated > 0) {
      console.log(
        `[gap-escalator] escalated=${escalated} weaknessesCreated=${weaknessesCreated} platformOutageProviders=${outageProviders.size}`,
      );
    }
  } finally {
    running = false;
  }
}

interface OutageInputGap {
  tenantId: string;
  reason: string;
  integrationCheck: { integrationId: string };
}

/**
 * Bucket open gaps by provider, then mark a provider as "in platform
 * outage" iff:
 *   - distinct tenant count ≥ PLATFORM_OUTAGE_MIN_TENANTS
 *   - the dominant reason's share ≥ PLATFORM_OUTAGE_REASON_RATIO
 *
 * Exposed as a pure function so it can be unit-tested without spinning
 * up the cron.
 */
export function detectPlatformOutages(gaps: OutageInputGap[]): Set<string> {
  const byProvider = new Map<
    string,
    { tenants: Set<string>; reasons: Map<string, number>; total: number }
  >();
  for (const g of gaps) {
    const id = g.integrationCheck.integrationId;
    const bucket = byProvider.get(id) ?? {
      tenants: new Set<string>(),
      reasons: new Map<string, number>(),
      total: 0,
    };
    bucket.tenants.add(g.tenantId);
    bucket.reasons.set(g.reason, (bucket.reasons.get(g.reason) ?? 0) + 1);
    bucket.total++;
    byProvider.set(id, bucket);
  }

  const outages = new Set<string>();
  for (const [providerId, bucket] of byProvider) {
    if (bucket.tenants.size < PLATFORM_OUTAGE_MIN_TENANTS) continue;
    const dominant = Math.max(...bucket.reasons.values());
    if (dominant / bucket.total >= PLATFORM_OUTAGE_REASON_RATIO) {
      outages.add(providerId);
    }
  }
  return outages;
}
