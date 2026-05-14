/**
 * Periodic vendor research scheduler.
 *
 * Calls the API's internal endpoint to discover vendors due for research.
 * The API endpoint itself publishes research requests to the SQS queue,
 * which the collector's research subscriber picks up and processes.
 *
 * This design keeps the "source of truth" for scheduling in the API database
 * while leveraging the queue for async execution.
 */

import { signServiceRequest, toHeaderRecord } from "../lib/service-auth.js";

const API_BASE_URL = process.env["API_BASE_URL"] ?? "http://localhost:4000";

const CHECK_INTERVAL_MS = 5 * 60_000; // Check every 5 minutes
let intervalId: ReturnType<typeof setInterval> | null = null;
let running = false;

export async function startResearchScheduler(): Promise<void> {
  if (intervalId) return;

  console.log("[research-scheduler] starting — check interval:", CHECK_INTERVAL_MS, "ms");

  await checkAndDispatch();

  intervalId = setInterval(() => {
    if (!running) {
      checkAndDispatch().catch((err) => console.error("[research-scheduler] tick failed:", err));
    }
  }, CHECK_INTERVAL_MS);
}

export function stopResearchScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[research-scheduler] stopped");
  }
}

async function checkAndDispatch(): Promise<void> {
  running = true;
  try {
    // Mounted under `/internal/*` (HMAC-signed, no JWT) — the old
    // `/api/v1/vendors/internal/*` mount was shadowed by the JWT
    // `authenticate` middleware and could never authenticate the
    // service-to-service caller.
    const path = "/internal/vendors/due-for-research";
    const signature = signServiceRequest({
      caller: "collector",
      method: "GET",
      path,
    });
    const resp = await fetch(`${API_BASE_URL}${path}`, {
      headers: toHeaderRecord(signature),
    });

    if (!resp.ok) {
      console.error("[research-scheduler] failed to trigger due vendor check:", resp.status);
      return;
    }

    const { data } = (await resp.json()) as { data: { dispatched: number } };

    if (data.dispatched > 0) {
      console.log(
        `[research-scheduler] dispatched ${data.dispatched} vendor(s) for research via queue`,
      );
    }
  } finally {
    running = false;
  }
}
