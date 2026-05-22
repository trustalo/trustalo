/**
 * Nightly binding-reconciler cron + startup stale-version pass.
 *
 * The API-side hooks (framework toggle, control delete, etc.) keep
 * bindings up to date in real time. This module is the safety net
 * that catches everything those hooks miss:
 *
 *  - The API was down when a hook would have fired.
 *  - A manifest version bumped without any tenant-side change.
 *  - A collector restart loses an in-flight reconcile.
 *
 * Two paths:
 *
 *  - `runStartupReconcile()` — fires once on collector boot. Walks
 *    every active connection whose `manifestVersion` is stale
 *    relative to the currently-loaded manifest and reconciles it.
 *  - `startReconcileScheduler()` — fires every 24h, reconciles every
 *    active connection regardless of manifest version. Spread the
 *    work in batches to avoid stampeding the resolver.
 */

import { getManifest } from "@trustalo/integration-manifests";
import { prisma } from "../db/prisma.js";
import { reconcileBindings } from "../integrations/binder/reconciler.js";

/**
 * Daily-ish cadence. Picked at 24h with no jitter — the reconciler is
 * idempotent so a coordinated burst across a fleet is fine.
 */
const RECONCILE_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Batch size used by both startup and nightly passes. Trades latency
 * against load on the API resolver. With ~50 connections × ~10 refs
 * each, a batch of 20 connections × ~10 refs each fits comfortably in
 * a single resolver round-trip per connection.
 */
const BATCH_SIZE = 20;

let intervalId: ReturnType<typeof setInterval> | null = null;
let running = false;

export async function startReconcileScheduler(): Promise<void> {
  if (intervalId) return;
  console.log(
    "[reconciler] scheduler starting — interval:",
    RECONCILE_INTERVAL_MS,
    "ms, batch size:",
    BATCH_SIZE,
  );

  await runStartupReconcile();

  intervalId = setInterval(() => {
    if (!running) {
      runNightlyReconcile().catch((err) => console.error("[reconciler] nightly pass failed:", err));
    }
  }, RECONCILE_INTERVAL_MS);
}

export function stopReconcileScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[reconciler] scheduler stopped");
  }
}

/**
 * One-shot pass at boot. Only touches connections whose
 * `manifestVersion` differs from the manifest the collector just
 * loaded — that's the cheapest signal that a tenant's bindings need
 * to catch up.
 */
export async function runStartupReconcile(): Promise<void> {
  running = true;
  try {
    const connections = await prisma.integrationConnection.findMany({
      where: { isActive: true },
      select: {
        id: true,
        tenantId: true,
        integrationId: true,
        manifestVersion: true,
      },
    });

    const stale: Array<{ id: string; tenantId: string }> = [];
    for (const c of connections) {
      const manifest = getManifest(c.integrationId);
      if (!manifest) continue;
      const liveVersion = manifest.version ?? "1.0.0";
      if (c.manifestVersion !== liveVersion) {
        stale.push({ id: c.id, tenantId: c.tenantId });
      }
    }

    if (stale.length === 0) {
      console.log("[reconciler] startup: no stale-version connections");
      return;
    }

    console.log(
      `[reconciler] startup: reconciling ${stale.length} connection(s) with stale manifest version`,
    );
    await reconcileInBatches(stale, "startup");
  } finally {
    running = false;
  }
}

/**
 * Walks every active connection and reconciles it. The reconciler is
 * idempotent, so this is safe even when the API hooks already caught
 * the same drift earlier in the day — it just bumps
 * `lastReconciledAt` on the already-correct rows.
 */
export async function runNightlyReconcile(): Promise<void> {
  running = true;
  try {
    const connections = await prisma.integrationConnection.findMany({
      where: { isActive: true },
      select: { id: true, tenantId: true },
    });

    if (connections.length === 0) {
      console.log("[reconciler] nightly: no active connections");
      return;
    }

    console.log(`[reconciler] nightly: reconciling ${connections.length} active connection(s)`);
    await reconcileInBatches(connections, "nightly");
  } finally {
    running = false;
  }
}

async function reconcileInBatches(
  items: Array<{ id: string; tenantId: string }>,
  trigger: "startup" | "nightly",
): Promise<void> {
  let succeeded = 0;
  let failed = 0;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    // Run within a batch in parallel; sequential across batches keeps
    // the resolver from being hit by hundreds of simultaneous requests
    // on a large fleet.
    const results = await Promise.allSettled(
      batch.map((c) => reconcileBindings({ tenantId: c.tenantId, connectionId: c.id })),
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        succeeded++;
      } else {
        failed++;
        console.warn(`[reconciler] ${trigger}: connection reconcile failed:`, r.reason);
      }
    }
  }
  console.log(`[reconciler] ${trigger}: completed — succeeded=${succeeded} failed=${failed}`);
}
