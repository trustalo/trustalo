// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0

import { describe, expect, test } from "bun:test";
import {
  applyMarkup,
  dollarsToMicrocents,
  microcentsToDollars,
  refundMarkup,
} from "./markup.ee.js";

describe("applyMarkup", () => {
  test("zero markup is a no-op", () => {
    expect(applyMarkup(123_456n, 0)).toBe(123_456n);
  });

  test("30% markup on 1¢ yields 1.3¢", () => {
    expect(applyMarkup(10_000n, 3000)).toBe(13_000n);
  });

  test("30% markup on $100 yields $130", () => {
    expect(applyMarkup(dollarsToMicrocents(100), 3000)).toBe(dollarsToMicrocents(130));
  });

  test("rejects negative raw amount", () => {
    expect(() => applyMarkup(-1n, 3000)).toThrow();
  });

  test("rejects non-integer markup", () => {
    expect(() => applyMarkup(100n, 12.5 as unknown as number)).toThrow();
  });

  test("rejects negative markup", () => {
    expect(() => applyMarkup(100n, -1)).toThrow();
  });

  test("floors sub-microcent fractions (margin-safe)", () => {
    // 100 microcents × 1.0001 == 100.01 → floor to 100
    expect(applyMarkup(100n, 1)).toBe(100n);
  });
});

describe("refundMarkup", () => {
  test("symmetric with applyMarkup for clean amounts", () => {
    const raw = 1_300_000n;
    const billed = applyMarkup(raw, 3000);
    expect(refundMarkup(billed, 3000)).toBe(raw);
  });

  test("zero markup is identity", () => {
    expect(refundMarkup(12345n, 0)).toBe(12345n);
  });
});

describe("dollarsToMicrocents / microcentsToDollars", () => {
  test("$1 round-trips", () => {
    expect(microcentsToDollars(dollarsToMicrocents(1))).toBe(1);
  });

  test("$0.01 round-trips at microcent precision", () => {
    expect(dollarsToMicrocents(0.01)).toBe(10_000n);
  });

  test("rejects negative dollars", () => {
    expect(() => dollarsToMicrocents(-1)).toThrow();
  });

  test("rejects non-finite dollars", () => {
    expect(() => dollarsToMicrocents(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => dollarsToMicrocents(Number.NaN)).toThrow();
  });
});
