import { describe, expect, test } from "bun:test";
import {
  addAustralianBusinessDays,
  computeCps234ControlWeaknessDeadline,
  isAustralianBusinessDay,
  isDeadlineOverdue,
} from "./business-days.js";

/**
 * All test dates use UTC explicitly. The helper itself is UTC-based so
 * tests don't drift across CI timezones.
 */
function utc(iso: string): Date {
  // Accepts "YYYY-MM-DD" (midnight UTC) or full ISO with TZ.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date(`${iso}T00:00:00Z`);
  return new Date(iso);
}

describe("isAustralianBusinessDay", () => {
  test("Monday 2026-05-18 is a business day", () => {
    expect(isAustralianBusinessDay(utc("2026-05-18"))).toBe(true);
  });

  test("Saturday 2026-05-16 is not a business day", () => {
    expect(isAustralianBusinessDay(utc("2026-05-16"))).toBe(false);
  });

  test("Sunday 2026-05-17 is not a business day", () => {
    expect(isAustralianBusinessDay(utc("2026-05-17"))).toBe(false);
  });

  test("New Year's Day 2027-01-01 (Friday) is not a business day", () => {
    expect(isAustralianBusinessDay(utc("2027-01-01"))).toBe(false);
  });

  test("Anzac Day 2026-04-25 (Saturday — already weekend) is not a business day", () => {
    expect(isAustralianBusinessDay(utc("2026-04-25"))).toBe(false);
  });

  test("Australia Day 2027-01-26 (Tuesday) is not a business day", () => {
    expect(isAustralianBusinessDay(utc("2027-01-26"))).toBe(false);
  });
});

describe("addAustralianBusinessDays", () => {
  test("Mon + 1 BD = Tue", () => {
    expect(addAustralianBusinessDays(utc("2026-05-18"), 1).toISOString()).toBe(
      "2026-05-19T00:00:00.000Z",
    );
  });

  test("Mon + 5 BD = next Mon", () => {
    expect(addAustralianBusinessDays(utc("2026-05-18"), 5).toISOString()).toBe(
      "2026-05-25T00:00:00.000Z",
    );
  });

  test("Mon + 10 BD = Mon two weeks later (no holidays in window)", () => {
    expect(addAustralianBusinessDays(utc("2026-05-18"), 10).toISOString()).toBe(
      "2026-06-01T00:00:00.000Z",
    );
  });

  test("Friday + 1 BD jumps the weekend to Mon", () => {
    expect(addAustralianBusinessDays(utc("2026-05-22"), 1).toISOString()).toBe(
      "2026-05-25T00:00:00.000Z",
    );
  });

  test("Saturday rolls forward to Mon then counts: Sat + 0 BD = Mon", () => {
    expect(addAustralianBusinessDays(utc("2026-05-16"), 0).toISOString()).toBe(
      "2026-05-18T00:00:00.000Z",
    );
  });

  test("Saturday + 10 BD = Mon two weeks after the rolled-forward Mon", () => {
    expect(addAustralianBusinessDays(utc("2026-05-16"), 10).toISOString()).toBe(
      "2026-06-01T00:00:00.000Z",
    );
  });

  test("skips Anzac Day observance (2027-04-26 Mon)", () => {
    // Discovery: Wed 21 Apr 2027.
    // +1 Thu 22 (1), +1 Fri 23 (2), Sat skip, Sun skip,
    // Mon 26 Anzac observed skip, +1 Tue 27 (3), +1 Wed 28 (4), +1 Thu 29 (5)
    // → Thu 29 Apr 2027.
    expect(addAustralianBusinessDays(utc("2027-04-21"), 5).toISOString()).toBe(
      "2027-04-29T00:00:00.000Z",
    );
  });

  test("preserves time-of-day", () => {
    const start = utc("2026-05-18T03:30:00Z");
    const out = addAustralianBusinessDays(start, 10);
    expect(out.getUTCHours()).toBe(3);
    expect(out.getUTCMinutes()).toBe(30);
  });

  test("rejects negative n", () => {
    expect(() => addAustralianBusinessDays(utc("2026-05-18"), -1)).toThrow();
  });

  test("rejects non-integer n", () => {
    expect(() => addAustralianBusinessDays(utc("2026-05-18"), 1.5)).toThrow();
  });
});

describe("computeCps234ControlWeaknessDeadline", () => {
  test("10 business days from Monday 2026-05-18 lands on 2026-06-01", () => {
    expect(computeCps234ControlWeaknessDeadline(utc("2026-05-18")).toISOString()).toBe(
      "2026-06-01T00:00:00.000Z",
    );
  });

  test("10 business days from Christmas Day 2026 (Fri 25 Dec, holiday) rolls to next BD then counts", () => {
    // Discovery on Christmas Day (Fri 25 Dec 2026, holiday).
    // Roll forward: Sat 26 skip, Sun 27 skip, Mon 28 Boxing Day observed
    // skip → first BD is Tue 29 Dec 2026.
    // +10 BD from Tue 29 Dec 2026 (counting only the days we LAND ON,
    // not the start day itself):
    //   +1 Wed 30 Dec (1), +1 Thu 31 Dec (2), +1 Fri 1 Jan 2027 NY's
    //   Day skip, Sat 2 / Sun 3 skip, +1 Mon 4 Jan (3), +1 Tue 5 (4),
    //   +1 Wed 6 (5), +1 Thu 7 (6), +1 Fri 8 (7), Sat 9 / Sun 10 skip,
    //   +1 Mon 11 (8), +1 Tue 12 (9), +1 Wed 13 (10) → Wed 13 Jan 2027.
    expect(computeCps234ControlWeaknessDeadline(utc("2026-12-25")).toISOString()).toBe(
      "2027-01-13T00:00:00.000Z",
    );
  });
});

describe("isDeadlineOverdue", () => {
  test("returns true after the deadline", () => {
    const deadline = utc("2026-06-01T12:00:00Z");
    const now = utc("2026-06-01T12:00:01Z");
    expect(isDeadlineOverdue(deadline, now)).toBe(true);
  });

  test("returns false at the exact deadline (still due, not overdue)", () => {
    const deadline = utc("2026-06-01T12:00:00Z");
    const now = utc("2026-06-01T12:00:00Z");
    expect(isDeadlineOverdue(deadline, now)).toBe(false);
  });

  test("returns false before the deadline", () => {
    const deadline = utc("2026-06-01T12:00:00Z");
    const now = utc("2026-06-01T11:59:59Z");
    expect(isDeadlineOverdue(deadline, now)).toBe(false);
  });
});
