/**
 * Pure logic for the ControlWeakness router — extracted into its own
 * module so the deadline-recompute, overdue-filter, and update-patch
 * shaping can be unit-tested without touching Express, Prisma or the
 * Zod request schemas.
 *
 * Every helper here is a pure function: same input → same output, no
 * I/O, no Date.now() (callers pass `now`).
 */

import {
  computeCps234ControlWeaknessDeadline,
  isDeadlineOverdue,
} from "../../lib/business-days.js";

/**
 * Decide the `(discoveredAt, notificationDeadlineAt)` pair on PATCH.
 *
 * Behaviour:
 *   • If the caller provides a new `discoveredAt`, the 10-BD clock is
 *     re-snapshotted from that moment unless the caller also provides
 *     an explicit `notificationDeadlineAt` override.
 *   • An explicit `notificationDeadlineAt` always wins — assessors
 *     sometimes back-date when the discovery point itself is uncertain.
 *   • If neither field is provided, both are left undefined (caller
 *     should leave the existing row untouched on those columns).
 */
export interface UpdateClockInput {
  discoveredAt?: Date;
  notificationDeadlineAt?: Date;
}

export interface UpdateClockOutput {
  discoveredAt?: Date;
  notificationDeadlineAt?: Date;
}

export function deriveUpdatedClock(input: UpdateClockInput): UpdateClockOutput {
  const out: UpdateClockOutput = {};
  if (input.discoveredAt !== undefined) {
    out.discoveredAt = input.discoveredAt;
    if (input.notificationDeadlineAt === undefined) {
      out.notificationDeadlineAt = computeCps234ControlWeaknessDeadline(input.discoveredAt);
    }
  }
  if (input.notificationDeadlineAt !== undefined) {
    out.notificationDeadlineAt = input.notificationDeadlineAt;
  }
  return out;
}

/**
 * Build the Prisma `where` filter for the "notification overdue" list
 * filter. Extracted so the precise predicate (deadline ≤ now AND
 * apraNotifiedAt IS NULL AND apraNotificationRequired = TRUE) can be
 * asserted in a unit test rather than re-derived from a snapshot.
 */
export function overdueWhereClause(now: Date): Record<string, unknown> {
  return {
    notificationDeadlineAt: { lte: now },
    apraNotifiedAt: null,
    apraNotificationRequired: true,
  };
}

/**
 * Re-export the overdue check for callers that need to decorate a
 * single row (e.g. the GET-by-id endpoint). Thin alias kept here so
 * the router has a single import surface.
 */
export const isControlWeaknessOverdue = isDeadlineOverdue;
