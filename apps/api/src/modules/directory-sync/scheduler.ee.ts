// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0

import { assertEnterpriseLicense } from "@trustalo/license";
import { enqueueDueDirectorySyncRuns } from "./service.ee.js";

const SCHEDULER_INTERVAL_MS = 5 * 60_000;
let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let running = false;

export async function startDirectorySyncScheduler(): Promise<void> {
  if (schedulerTimer) return;

  try {
    await assertEnterpriseLicense("sso");
  } catch {
    console.log("[directory-sync] scheduler disabled: missing Enterprise sso license");
    return;
  }

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await enqueueDueDirectorySyncRuns();
    } catch (err) {
      console.error("[directory-sync] scheduler tick failed", err);
    } finally {
      running = false;
    }
  };

  schedulerTimer = setInterval(() => {
    void tick();
  }, SCHEDULER_INTERVAL_MS);
  void tick();
  console.log("[directory-sync] scheduler started");
}

export async function stopDirectorySyncScheduler(): Promise<void> {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}
