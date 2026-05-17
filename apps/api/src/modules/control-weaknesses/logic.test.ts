import { describe, expect, test } from "bun:test";
import { deriveUpdatedClock, isControlWeaknessOverdue, overdueWhereClause } from "./logic.js";

function utc(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date(`${iso}T00:00:00Z`);
  return new Date(iso);
}

describe("deriveUpdatedClock", () => {
  test("empty input returns empty output (PATCH that doesn't touch the clock)", () => {
    expect(deriveUpdatedClock({})).toEqual({});
  });

  test("new discoveredAt recomputes the 10-BD deadline", () => {
    // Mon 2026-05-18 + 10 BD = Mon 2026-06-01.
    const out = deriveUpdatedClock({ discoveredAt: utc("2026-05-18") });
    expect(out.discoveredAt!.toISOString()).toBe("2026-05-18T00:00:00.000Z");
    expect(out.notificationDeadlineAt!.toISOString()).toBe("2026-06-01T00:00:00.000Z");
  });

  test("explicit notificationDeadlineAt override wins (assessor back-dates)", () => {
    const out = deriveUpdatedClock({
      discoveredAt: utc("2026-05-18"),
      notificationDeadlineAt: utc("2026-05-25"),
    });
    expect(out.discoveredAt!.toISOString()).toBe("2026-05-18T00:00:00.000Z");
    expect(out.notificationDeadlineAt!.toISOString()).toBe("2026-05-25T00:00:00.000Z");
  });

  test("override-only update sets only the deadline", () => {
    const out = deriveUpdatedClock({ notificationDeadlineAt: utc("2026-05-30") });
    expect(out.discoveredAt).toBeUndefined();
    expect(out.notificationDeadlineAt!.toISOString()).toBe("2026-05-30T00:00:00.000Z");
  });

  test("recomputed deadline correctly skips weekends", () => {
    // Friday + 10 BD: F (start, day 0) → +1 Mon (1), Tue (2), Wed (3), Thu (4),
    // Fri (5), Mon (6), Tue (7), Wed (8), Thu (9), Fri (10) → +14 days from Fri.
    const out = deriveUpdatedClock({ discoveredAt: utc("2026-05-22") });
    // Discovery: Fri 22 May 2026 → deadline Fri 5 Jun 2026.
    expect(out.notificationDeadlineAt!.toISOString()).toBe("2026-06-05T00:00:00.000Z");
  });
});

describe("overdueWhereClause", () => {
  test("matches the documented predicate exactly", () => {
    const now = utc("2026-05-18T12:34:56Z");
    expect(overdueWhereClause(now)).toEqual({
      notificationDeadlineAt: { lte: now },
      apraNotifiedAt: null,
      apraNotificationRequired: true,
    });
  });
});

describe("isControlWeaknessOverdue", () => {
  test("returns true after the deadline", () => {
    expect(isControlWeaknessOverdue(utc("2026-05-18T00:00:00Z"), utc("2026-05-18T00:00:01Z"))).toBe(
      true,
    );
  });

  test("returns false at the exact deadline", () => {
    expect(isControlWeaknessOverdue(utc("2026-05-18T00:00:00Z"), utc("2026-05-18T00:00:00Z"))).toBe(
      false,
    );
  });
});
