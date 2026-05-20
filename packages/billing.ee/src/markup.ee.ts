// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0

/**
 * Money math for the credit-wallet flow.
 *
 * All amounts are in **microcents** — i.e. USD × 10⁶. We use microcents
 * (not cents) because individual completions on cheap models can cost
 * fractions of a cent (e.g. a 200-token Haiku call ≈ 0.16 cents), and
 * rounding every event to a whole cent would either eat margin (round
 * down) or overcharge (round up). Aggregating at microcent precision
 * lets the wallet rounding happen exactly once, on the customer-facing
 * invoice, where it is auditable.
 *
 * `bigint` is used everywhere because JS `number` loses precision above
 * 2^53 — a tenant with $9_000 of credits has 9 × 10¹² microcents, which
 * is safe, but `number` math can drift; bigint is safer-by-default.
 *
 * Convention: markup is expressed in basis points (bps): 30% == 3000 bps.
 * The conversion is intentionally explicit (no implicit % anywhere) so
 * code review catches "did you mean 30% or 0.30%?" mistakes.
 */

const ONE_DOLLAR_IN_MICROCENTS = 1_000_000n;

/**
 * Apply Trustalo's markup to a raw upstream cost.
 *
 * Pricing convention: `marked = raw × (1 + markupBps / 10_000)`.
 * For markupBps == 3000 and raw == 100_000 (1¢), marked == 130_000 (1.3¢).
 *
 * Rounding: floor. Trustalo absorbs the sub-microcent fraction. Doing
 * this consistently means our reported revenue is always slightly
 * conservative compared to a perfectly precise calculation, which is
 * the right direction for audit defensibility.
 */
export function applyMarkup(rawMicrocents: bigint, markupBps: number): bigint {
  if (rawMicrocents < 0n) {
    throw new Error("applyMarkup: rawMicrocents must be non-negative");
  }
  if (!Number.isInteger(markupBps) || markupBps < 0) {
    throw new Error("applyMarkup: markupBps must be a non-negative integer");
  }
  if (markupBps === 0) return rawMicrocents;
  return (rawMicrocents * BigInt(10_000 + markupBps)) / 10_000n;
}

/**
 * Inverse of `applyMarkup` for refund flows: given a markup-inclusive
 * amount the customer paid, return the raw upstream cost we forwarded.
 * The math is exact since `applyMarkup` rounds via integer division;
 * very minor sub-microcent error is acceptable for refund accounting.
 */
export function refundMarkup(billedMicrocents: bigint, markupBps: number): bigint {
  if (billedMicrocents < 0n) {
    throw new Error("refundMarkup: billedMicrocents must be non-negative");
  }
  if (markupBps === 0) return billedMicrocents;
  return (billedMicrocents * 10_000n) / BigInt(10_000 + markupBps);
}

export function microcentsToDollars(microcents: bigint): number {
  // Returns a Number for display purposes only — never round-trip it.
  return Number(microcents) / Number(ONE_DOLLAR_IN_MICROCENTS);
}

export function dollarsToMicrocents(dollars: number): bigint {
  if (!Number.isFinite(dollars) || dollars < 0) {
    throw new Error("dollarsToMicrocents: dollars must be a finite non-negative number");
  }
  // Round-half-up at the cent boundary to avoid Stripe's 1¢ minimum
  // landing as 999_999 microcents (which would underbill by a fraction).
  return BigInt(Math.round(dollars * Number(ONE_DOLLAR_IN_MICROCENTS)));
}
