/**
 * Operational health bookkeeping for IntegrationChecks.
 *
 * The runner calls these helpers around each connection sync. They keep
 * `IntegrationCheck.{consecutiveFailures,healthState,healthChangedAt,
 * healthReason,lastSuccessfulRunAt,expectedNextRunAt}` honest and open
 * / close `EvidenceCoverageGap` rows.
 *
 * Design notes:
 *  - Health state thresholds are deliberately simple. 1–2 consecutive
 *    failures = `degraded`, 3+ = `failing`. The overdue detector cron
 *    handles `overdue`.
 *  - A gap is opened on non-retriable errors *immediately* and on
 *    retriable errors only after retries are exhausted (the runner is
 *    responsible for telling us which one we're in).
 *  - Gaps close on the next successful run. We never delete history;
 *    closed gaps are the durable record of "we lost visibility from X
 *    to Y for these reasons".
 */

import type {
  CheckHealthState,
  CoverageGapReason,
  IntegrationCheck,
} from "../../generated/prisma/client/index.js";
import { prisma } from "../db/prisma.js";

const FAILING_THRESHOLD = 3;

export interface CheckSuccessArgs {
  tenantId: string;
  connectionId: string;
  // Used to estimate the next-run instant if the check has no
  // `expectedNextRunAt` yet. Defaults to 24h.
  syncFrequencyMinutes?: number;
}

/**
 * Apply success bookkeeping to every enabled `IntegrationCheck`
 * attached to a connection. Resets failure counts, closes open gaps,
 * and bumps `lastSuccessfulRunAt` + `expectedNextRunAt`.
 */
export async function markChecksHealthy(args: CheckSuccessArgs): Promise<void> {
  const { tenantId, connectionId } = args;
  const nextRunAt = computeNextRunAt(args.syncFrequencyMinutes);

  const checks = await prisma.integrationCheck.findMany({
    where: { connectionId, isEnabled: true },
    select: { id: true, healthState: true },
  });
  if (checks.length === 0) return;

  const now = new Date();

  await prisma.$transaction([
    prisma.integrationCheck.updateMany({
      where: { connectionId, isEnabled: true },
      data: {
        consecutiveFailures: 0,
        healthState: "healthy",
        healthChangedAt: now,
        healthReason: null,
        lastSuccessfulRunAt: now,
        expectedNextRunAt: nextRunAt,
      },
    }),
    prisma.evidenceCoverageGap.updateMany({
      where: {
        tenantId,
        endedAt: null,
        integrationCheckId: { in: checks.map((c) => c.id) },
      },
      data: { endedAt: now },
    }),
  ]);
}

export interface CheckFailureArgs {
  tenantId: string;
  connectionId: string;
  reason: CoverageGapReason;
  retriable: boolean;
  // True when the runner has run out of retries (or the error was
  // non-retriable to begin with). Drives gap-opening.
  retriesExhausted: boolean;
  errorMessage: string;
}

/**
 * Apply failure bookkeeping. Increments `consecutiveFailures` on every
 * enabled check, recomputes `healthState`, and opens / extends a
 * coverage gap when retries are exhausted (or the error is
 * non-retriable). Always idempotent — multiple failures within the
 * same retry chain don't open multiple gaps for the same check.
 */
export async function markChecksFailing(args: CheckFailureArgs): Promise<void> {
  const { tenantId, connectionId, reason, retriable, retriesExhausted, errorMessage } = args;

  const checks = await prisma.integrationCheck.findMany({
    where: { connectionId, isEnabled: true },
    select: {
      id: true,
      consecutiveFailures: true,
      healthState: true,
      controls: {
        where: { isEnabled: true },
        select: { controlId: true },
      },
    },
  });
  if (checks.length === 0) return;

  const now = new Date();
  const shouldOpenGap = retriesExhausted || !retriable;

  for (const check of checks) {
    const nextCount = check.consecutiveFailures + 1;
    const nextState = healthStateForFailures(nextCount);

    const updates: Promise<unknown>[] = [
      prisma.integrationCheck.update({
        where: { id: check.id },
        data: {
          consecutiveFailures: nextCount,
          healthState: nextState,
          healthChangedAt: check.healthState !== nextState ? now : undefined,
          healthReason: errorMessage,
        },
      }),
    ];

    if (shouldOpenGap) {
      updates.push(
        openOrExtendGap(
          check.id,
          tenantId,
          reason,
          errorMessage,
          check.controls.map((c) => c.controlId),
        ),
      );
    }

    await Promise.all(updates);
  }
}

/**
 * Open a coverage gap (or extend the existing open one) for a single
 * check. Exposed so the overdue-detector cron can call it directly
 * with `reason = schedule_missed`.
 */
export async function openOrExtendGap(
  integrationCheckId: string,
  tenantId: string,
  reason: CoverageGapReason,
  errorMessage: string | null,
  affectedControlIds: string[],
): Promise<void> {
  const existing = await prisma.evidenceCoverageGap.findFirst({
    where: { integrationCheckId, endedAt: null },
    orderBy: { startedAt: "desc" },
  });

  if (existing) {
    await prisma.evidenceCoverageGap.update({
      where: { id: existing.id },
      data: {
        retryCount: { increment: 1 },
        lastErrorMessage: errorMessage ?? existing.lastErrorMessage,
      },
    });
    return;
  }

  await prisma.evidenceCoverageGap.create({
    data: {
      tenantId,
      integrationCheckId,
      reason,
      lastErrorMessage: errorMessage,
      affectedControlIds,
    },
  });
}

export function healthStateForFailures(consecutiveFailures: number): CheckHealthState {
  if (consecutiveFailures === 0) return "healthy";
  if (consecutiveFailures < FAILING_THRESHOLD) return "degraded";
  return "failing";
}

export function computeNextRunAt(syncFrequencyMinutes?: number): Date {
  const minutes = syncFrequencyMinutes && syncFrequencyMinutes > 0 ? syncFrequencyMinutes : 24 * 60;
  return new Date(Date.now() + minutes * 60_000);
}

// Re-exported for the overdue detector cron — keeps the import surface
// small while sharing one canonical type definition.
export type { IntegrationCheck };
