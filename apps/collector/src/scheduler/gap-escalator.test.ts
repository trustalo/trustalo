/**
 * Unit tests for the gap-escalator's platform-outage detector.
 *
 * The detector is pure-functional (`detectPlatformOutages`) so we can
 * test the decision rules without spinning up the cron or the DB.
 * Mirrors the heuristic in `gap-escalator.ts`:
 *   - ≥ 5 distinct tenants with open gaps for the same provider, AND
 *   - ≥ 80% of those gaps share the same reason.
 */

import { describe, expect, test } from "bun:test";
import { detectPlatformOutages } from "./gap-escalator.js";

function gap(tenantId: string, integrationId: string, reason: string) {
  return { tenantId, reason, integrationCheck: { integrationId } };
}

describe("detectPlatformOutages", () => {
  test("returns empty set on no gaps", () => {
    expect(detectPlatformOutages([]).size).toBe(0);
  });

  test("below-tenant-threshold provider is not an outage", () => {
    const gaps = [
      gap("t1", "github", "credentials_invalid"),
      gap("t2", "github", "credentials_invalid"),
    ];
    expect(detectPlatformOutages(gaps).has("github")).toBe(false);
  });

  test("5 tenants with same reason → outage", () => {
    const gaps = [
      gap("t1", "github", "rate_limited"),
      gap("t2", "github", "rate_limited"),
      gap("t3", "github", "rate_limited"),
      gap("t4", "github", "rate_limited"),
      gap("t5", "github", "rate_limited"),
    ];
    expect(detectPlatformOutages(gaps).has("github")).toBe(true);
  });

  test("5 tenants with mixed reasons (≥80% dominant) → outage", () => {
    const gaps = [
      gap("t1", "aws", "connection_error"),
      gap("t2", "aws", "connection_error"),
      gap("t3", "aws", "connection_error"),
      gap("t4", "aws", "connection_error"),
      gap("t5", "aws", "credentials_invalid"),
    ];
    // 4/5 = 80% — exactly at the threshold, should count.
    expect(detectPlatformOutages(gaps).has("aws")).toBe(true);
  });

  test("5 tenants with too-mixed reasons (<80% dominant) → not an outage", () => {
    const gaps = [
      gap("t1", "okta", "credentials_invalid"),
      gap("t2", "okta", "rate_limited"),
      gap("t3", "okta", "connection_error"),
      gap("t4", "okta", "check_runtime_error"),
      gap("t5", "okta", "credentials_invalid"),
    ];
    // Dominant reason 2/5 = 40%.
    expect(detectPlatformOutages(gaps).has("okta")).toBe(false);
  });

  test("multiple gaps from the same tenant only count as 1 tenant", () => {
    const gaps = [
      gap("t1", "github", "rate_limited"),
      gap("t1", "github", "rate_limited"),
      gap("t1", "github", "rate_limited"),
      gap("t1", "github", "rate_limited"),
      gap("t1", "github", "rate_limited"),
    ];
    expect(detectPlatformOutages(gaps).has("github")).toBe(false);
  });

  test("different providers are evaluated independently", () => {
    const gaps = [
      // 5 tenants on github with same reason → outage
      gap("t1", "github", "rate_limited"),
      gap("t2", "github", "rate_limited"),
      gap("t3", "github", "rate_limited"),
      gap("t4", "github", "rate_limited"),
      gap("t5", "github", "rate_limited"),
      // 2 tenants on aws → not an outage
      gap("t1", "aws", "connection_error"),
      gap("t2", "aws", "connection_error"),
    ];
    const outages = detectPlatformOutages(gaps);
    expect(outages.has("github")).toBe(true);
    expect(outages.has("aws")).toBe(false);
  });
});
