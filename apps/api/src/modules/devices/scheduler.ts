/**
 * Periodic device-posture maintenance: flips silent devices to `stale`
 * (raising an agent-health finding) and prunes expired replay nonces. Also
 * expires past-due background checks (People Phase B) on the same tick.
 * Mirrors the lightweight scheduler style used by directory-sync.
 */
import { sweepStaleDevices } from "./service.js";
import { sweepExpiredBackgroundChecks } from "../people/background-checks.js";

const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

let handle: ReturnType<typeof setInterval> | null = null;

export async function startDeviceSweepScheduler(): Promise<void> {
  if (handle) return;
  const run = () => {
    sweepStaleDevices()
      .then((r) => {
        if (r.markedStale > 0 || r.noncesPruned > 0) {
          console.log(
            `[devices] sweep: ${r.markedStale} marked stale, ${r.noncesPruned} nonce(s) pruned`,
          );
        }
      })
      .catch((err) => console.error("[devices] stale sweep failed:", err));
    sweepExpiredBackgroundChecks()
      .then((r) => {
        if (r.expired > 0) console.log(`[people] sweep: ${r.expired} background check(s) expired`);
      })
      .catch((err) => console.error("[people] background-check expiry sweep failed:", err));
  };
  handle = setInterval(run, SWEEP_INTERVAL_MS);
  // Don't keep the event loop alive solely for the sweep.
  if (typeof handle.unref === "function") handle.unref();
}

export async function stopDeviceSweepScheduler(): Promise<void> {
  if (handle) {
    clearInterval(handle);
    handle = null;
  }
}
