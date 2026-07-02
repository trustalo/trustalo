/**
 * Unit tests for the custom-check domain helpers:
 *
 *   • cron validation + cron → sync-interval translation (drives how
 *     often the scheduler dispatches the synthetic custom connection).
 *   • `evaluateSpecForTest` — the pure core behind `POST /checks/test`,
 *     including the structured `not_supported` answer for browser
 *     specs (deliberately NOT an error status).
 */

import { describe, expect, test } from "bun:test";
import {
  BROWSER_NOT_SUPPORTED,
  cronToIntervalMinutes,
  evaluateSpecForTest,
  isValidCronSchedule,
} from "./index.js";
import type { RunHttpCheckOptions } from "./http-check-executor.js";

describe("isValidCronSchedule", () => {
  test.each([
    "0 6 * * *",
    "*/15 * * * *",
    "0 */6 * * *",
    "30 9 * * 1",
    "0 0 1 * *",
    "0 6,18 * * *",
    "0 9-17 * * *",
  ])("accepts %s", (expr) => {
    expect(isValidCronSchedule(expr)).toBe(true);
  });

  test.each([
    "",
    "not a cron",
    "0 6 * *", // 4 fields
    "0 6 * * * *", // 6 fields
    "@daily", // shorthand not supported
    "0 6 * * *; rm -rf /", // injection-shaped garbage
  ])("rejects %s", (expr) => {
    expect(isValidCronSchedule(expr)).toBe(false);
  });
});

describe("cronToIntervalMinutes", () => {
  test("every N minutes", () => {
    expect(cronToIntervalMinutes("*/15 * * * *")).toBe(15);
  });

  test("minute steps are floored to the connection minimum (5m)", () => {
    expect(cronToIntervalMinutes("*/1 * * * *")).toBe(5);
  });

  test("hourly", () => {
    expect(cronToIntervalMinutes("30 * * * *")).toBe(60);
  });

  test("every N hours", () => {
    expect(cronToIntervalMinutes("0 */6 * * *")).toBe(360);
  });

  test("daily", () => {
    expect(cronToIntervalMinutes("0 6 * * *")).toBe(1440);
  });

  test("weekly", () => {
    expect(cronToIntervalMinutes("0 6 * * 1")).toBe(7 * 1440);
  });

  test("unknown shapes fall back to daily", () => {
    expect(cronToIntervalMinutes("1,2 3-4 5 6 *")).toBe(1440);
    expect(cronToIntervalMinutes("garbage")).toBe(1440);
  });
});

describe("evaluateSpecForTest", () => {
  const fetchOk: RunHttpCheckOptions = {
    fetchImpl: (async () => new Response("all good", { status: 200 })) as unknown as typeof fetch,
    lookupImpl: async () => [{ address: "93.184.216.34", family: 4 }],
  };

  test("browser runner → structured not_supported (never a thrown error)", async () => {
    const outcome = await evaluateSpecForTest("browser", { steps: [] });
    expect(outcome.kind).toBe("not_supported");
    if (outcome.kind === "not_supported") {
      expect(outcome.payload.status).toBe("not_supported");
      expect(outcome.payload.code).toBe(BROWSER_NOT_SUPPORTED.code);
      expect(outcome.payload.message.length).toBeGreaterThan(10);
    }
  });

  test("invalid HTTP spec → invalid_spec with zod issues", async () => {
    const outcome = await evaluateSpecForTest("http", { url: "not-a-url", expect: {} });
    expect(outcome.kind).toBe("invalid_spec");
  });

  test("spec without any assertion is rejected", async () => {
    const outcome = await evaluateSpecForTest("http", {
      url: "https://example.com",
      expect: {},
    });
    expect(outcome.kind).toBe("invalid_spec");
  });

  test("valid HTTP spec executes once through the shared executor", async () => {
    const outcome = await evaluateSpecForTest(
      "http",
      { url: "https://example.com", expect: { statusCode: 200, bodyContains: "good" } },
      fetchOk,
    );
    expect(outcome.kind).toBe("result");
    if (outcome.kind === "result") {
      expect(outcome.result.status).toBe("pass");
    }
  });
});
