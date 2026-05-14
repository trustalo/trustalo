import { prisma } from "../db/prisma.js";

const CHECK_INTERVAL_MS = 60_000; // Check for due jobs every 60 seconds
let intervalId: ReturnType<typeof setInterval> | null = null;
let running = false;

/**
 * Starts the job scheduler. On each tick it:
 * 1. Finds active connections whose nextRunAt (or lastSyncAt + syncFrequencyMinutes) is in the past
 * 2. Creates CollectionJob records for each due connection
 */
export async function startScheduler(): Promise<void> {
  if (intervalId) return;

  console.log("[scheduler] starting — check interval:", CHECK_INTERVAL_MS, "ms");

  await checkAndDispatch();

  intervalId = setInterval(() => {
    if (!running) {
      checkAndDispatch().catch((err) => console.error("[scheduler] tick failed:", err));
    }
  }, CHECK_INTERVAL_MS);
}

export function stopScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[scheduler] stopped");
  }
}

async function checkAndDispatch(): Promise<void> {
  running = true;
  try {
    const now = new Date();

    const dueConnections = await prisma.integrationConnection.findMany({
      where: {
        isActive: true,
        status: { in: ["connected"] },
      },
      include: {
        // `Integration.id` is the slug (e.g. "github") so an explicit
        // select of just `id` keeps the payload tight.
        integration: { select: { id: true } },
        jobs: {
          where: { status: { in: ["pending", "queued", "running"] } },
          take: 1,
        },
      },
    });

    for (const conn of dueConnections) {
      if (conn.jobs.length > 0) continue;

      const nextDue = conn.lastSyncAt
        ? new Date(conn.lastSyncAt.getTime() + conn.syncFrequencyMinutes * 60_000)
        : new Date(0);

      if (nextDue > now) continue;

      await prisma.collectionJob.create({
        data: {
          tenantId: conn.tenantId,
          connectionId: conn.id,
          type: "scheduled",
          status: "pending",
          priority: 0,
          scheduledAt: now,
        },
      });

      console.log(
        `[scheduler] created job for connection=${conn.id} provider=${conn.integration.id} org=${conn.tenantId}`,
      );
    }
  } finally {
    running = false;
  }
}
