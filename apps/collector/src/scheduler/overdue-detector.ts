/**
 * Overdue-check detector.
 *
 * Companion to the per-run check-health bookkeeping in
 * `src/runner/check-health.ts`. The runner can only mark a check
 * unhealthy when it *runs*. If the scheduler skips a check entirely —
 * connection paused, scheduler down, infra clock skew — no failure
 * fires, no gap opens, and the auditor silently loses coverage.
 *
 * This cron walks every enabled check whose `expectedNextRunAt` is in
 * the past and:
 *   1. Flips its `healthState` to `overdue` (recording when).
 *   2. Opens a `schedule_missed` `EvidenceCoverageGap` if there isn't
 *      already one open.
 *
 * Gaps close naturally on the next successful run via
 * `markChecksHealthy`. There's no special "close overdue gap" path —
 * we treat all gap reasons uniformly on the close side.
 */

import { prisma } from "../db/prisma.js";
import { openOrExtendGap } from "../runner/check-health.js";

const TICK_INTERVAL_MS = 5 * 60 * 1000;
// Soft grace window so we don't flip a check overdue at the exact
// `expectedNextRunAt` instant — clocks drift, the scheduler's tick
// is 60s, and the runner can take a few seconds to claim the job.
const OVERDUE_GRACE_MS = 60 * 1000;

let intervalId: ReturnType<typeof setInterval> | null = null;
let running = false;

export async function startOverdueDetector(): Promise<void> {
  if (intervalId) return;
  console.log(
    "[overdue-detector] starting — interval:",
    TICK_INTERVAL_MS,
    "ms, grace:",
    OVERDUE_GRACE_MS,
    "ms",
  );

  await runOverdueScan();
  intervalId = setInterval(() => {
    if (!running) {
      runOverdueScan().catch((err) => console.error("[overdue-detector] tick failed:", err));
    }
  }, TICK_INTERVAL_MS);
}

export function stopOverdueDetector(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[overdue-detector] stopped");
  }
}

export async function runOverdueScan(): Promise<void> {
  running = true;
  try {
    const cutoff = new Date(Date.now() - OVERDUE_GRACE_MS);

    const overdue = await prisma.integrationCheck.findMany({
      where: {
        isEnabled: true,
        expectedNextRunAt: { lt: cutoff },
        // Don't re-process checks already in overdue state — but DO
        // allow degraded/failing → overdue transitions, because the
        // schedule-missed signal is strictly more informative than a
        // stale failure count.
        healthState: { not: "overdue" },
      },
      select: {
        id: true,
        tenantId: true,
        expectedNextRunAt: true,
        controls: {
          where: { isEnabled: true },
          select: { controlId: true },
        },
      },
    });

    if (overdue.length === 0) return;

    console.log(`[overdue-detector] flagging ${overdue.length} overdue check(s)`);

    const now = new Date();
    for (const check of overdue) {
      const reason = `Expected run at ${check.expectedNextRunAt?.toISOString() ?? "?"} was missed`;
      await prisma.integrationCheck.update({
        where: { id: check.id },
        data: {
          healthState: "overdue",
          healthChangedAt: now,
          healthReason: reason,
        },
      });
      await openOrExtendGap(
        check.id,
        check.tenantId,
        "schedule_missed",
        reason,
        check.controls.map((c) => c.controlId),
      );
    }
  } finally {
    running = false;
  }
}
