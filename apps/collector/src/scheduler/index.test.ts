/**
 * Unit tests for the scheduler's pure due-check.
 *
 * The dispatch loop itself is DB-bound; `isConnectionDue` is the rule
 * that decides pickup. Custom ("from prompt") check connections are
 * ordinary `IntegrationConnection` rows, so these cases double as the
 * schedule-pickup contract for saved custom HTTP checks.
 */

import { describe, expect, test } from "bun:test";
import { isConnectionDue } from "./index.js";

const NOW = new Date("2026-07-02T12:00:00Z");

describe("isConnectionDue", () => {
  test("a connection that has never synced is due immediately (first run after save)", () => {
    expect(isConnectionDue({ lastSyncAt: null, syncFrequencyMinutes: 1440 }, NOW)).toBe(true);
  });

  test("due once lastSyncAt + syncFrequencyMinutes has elapsed", () => {
    const lastSyncAt = new Date(NOW.getTime() - 61 * 60_000);
    expect(isConnectionDue({ lastSyncAt, syncFrequencyMinutes: 60 }, NOW)).toBe(true);
  });

  test("exactly at the boundary counts as due", () => {
    const lastSyncAt = new Date(NOW.getTime() - 60 * 60_000);
    expect(isConnectionDue({ lastSyncAt, syncFrequencyMinutes: 60 }, NOW)).toBe(true);
  });

  test("not due before the interval elapses", () => {
    const lastSyncAt = new Date(NOW.getTime() - 30 * 60_000);
    expect(isConnectionDue({ lastSyncAt, syncFrequencyMinutes: 60 }, NOW)).toBe(false);
  });

  test("a custom connection tightened to */15 cadence is due after 15 minutes", () => {
    const lastSyncAt = new Date(NOW.getTime() - 16 * 60_000);
    expect(isConnectionDue({ lastSyncAt, syncFrequencyMinutes: 15 }, NOW)).toBe(true);
    expect(
      isConnectionDue(
        { lastSyncAt: new Date(NOW.getTime() - 10 * 60_000), syncFrequencyMinutes: 15 },
        NOW,
      ),
    ).toBe(false);
  });
});
