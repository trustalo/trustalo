/**
 * Business-day arithmetic helpers.
 *
 * Used by the CPS 234 control-weakness clock (Para 35 — 10 business days)
 * and any other regulatory clock that needs to skip weekends and public
 * holidays. Pure functions only — no I/O, no Date.now() side-effects, no
 * timezone gotchas: every function takes an explicit `from` Date.
 *
 * Timezone policy
 * ───────────────
 * APRA reporting deadlines are anchored to the entity's reporting time
 * zone. We don't try to model that in this helper — we treat the input
 * Date as already adjusted to the relevant zone and compare day-of-month
 * + day-of-week in UTC. Callers that need AEST/AEDT semantics should
 * adjust the input Date before calling here. This keeps the helper
 * deterministic and testable without pulling a TZ database.
 */

/**
 * Australian national public holidays (federal — observed nation-wide).
 *
 * State / territory holidays (e.g. Labour Day, Royal Show holidays,
 * regional show days) are intentionally NOT in this list — APRA's
 * 10-business-day clock per CPS 234 Para 35 has no operational guidance
 * on which state's calendar to use, and APRA-regulated entities operate
 * across multiple states. The conservative reading is to honour federal
 * holidays only and treat state-specific days as business days unless
 * the entity has a documented exception.
 *
 * To extend, drop dates as ISO-8601 day strings (`YYYY-MM-DD`) into the
 * appropriate year-bucket. Two-year horizon is sufficient for the 10-day
 * clock; we ship through 2027 to give 18 months of headroom from the
 * current calendar year.
 *
 * Sources: data.gov.au "Australian Public Holidays Combined" dataset
 * (federal subset) and the Reserve Bank of Australia bank-holiday list.
 */
const AU_NATIONAL_HOLIDAYS: ReadonlySet<string> = new Set<string>([
  // 2026
  "2026-01-01", // New Year's Day
  "2026-01-26", // Australia Day
  "2026-04-03", // Good Friday
  "2026-04-04", // Easter Saturday
  "2026-04-06", // Easter Monday
  "2026-04-25", // Anzac Day
  "2026-12-25", // Christmas Day
  "2026-12-26", // Boxing Day (observed Mon 28 Dec 2026 in some states; we keep the calendar date)
  "2026-12-28", // Boxing Day observed (Sun → Mon shift)
  // 2027
  "2027-01-01", // New Year's Day
  "2027-01-26", // Australia Day
  "2027-03-26", // Good Friday
  "2027-03-27", // Easter Saturday
  "2027-03-29", // Easter Monday
  "2027-04-25", // Anzac Day (Sun → Mon observed)
  "2027-04-26", // Anzac Day observed
  "2027-12-25", // Christmas Day (Sat → Mon observed)
  "2027-12-27", // Christmas Day observed
  "2027-12-28", // Boxing Day observed
]);

/**
 * ISO-8601 day key for a Date, in UTC. Used as the lookup key into the
 * holiday set.
 */
function isoDayUtc(d: Date): string {
  const yyyy = d.getUTCFullYear().toString().padStart(4, "0");
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = d.getUTCDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * `true` when the date is a business day for AU federal-holiday purposes:
 * Monday–Friday and not in the AU_NATIONAL_HOLIDAYS set.
 */
export function isAustralianBusinessDay(d: Date): boolean {
  const dow = d.getUTCDay(); // 0 = Sun, 6 = Sat
  if (dow === 0 || dow === 6) return false;
  return !AU_NATIONAL_HOLIDAYS.has(isoDayUtc(d));
}

/**
 * Add `n` business days to `from` and return a new Date pinned at the
 * same UTC time-of-day. `n` must be a non-negative integer; if `n === 0`
 * the function still rolls forward to the next business day when `from`
 * itself is a weekend/holiday. The current day counts as **day zero** —
 * adding 10 business days to a Monday returns the Monday two weeks later
 * (skipping intervening weekends/holidays), not the Tuesday a week-and-a-
 * half later. This matches APRA's stated practice of counting "from the
 * day you became aware".
 *
 * Why this matters for CPS 234: Para 35 says "no later than 10 business
 * days after the entity becomes aware". Para 33 (72 hours) does not skip
 * weekends; this helper is therefore wrong for the Para 33 clock — that
 * clock is plain `+72h` and stays in `privacy/router.ts`'s
 * `computeBreachDeadline`.
 */
export function addAustralianBusinessDays(from: Date, n: number): Date {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`addAustralianBusinessDays: n must be a non-negative integer (got ${n})`);
  }
  const out = new Date(from.getTime());
  let remaining = n;
  // First, roll forward to a business day if `from` is on a weekend / holiday.
  while (!isAustralianBusinessDay(out)) {
    out.setUTCDate(out.getUTCDate() + 1);
  }
  while (remaining > 0) {
    out.setUTCDate(out.getUTCDate() + 1);
    if (isAustralianBusinessDay(out)) {
      remaining -= 1;
    }
  }
  return out;
}

/**
 * Convenience wrapper: 10-business-day APRA CPS 234 Para 35
 * notification deadline starting at `discoveredAt`.
 */
export function computeCps234ControlWeaknessDeadline(discoveredAt: Date): Date {
  return addAustralianBusinessDays(discoveredAt, 10);
}

/**
 * Whether a deadline has already passed at `now`. Inclusive of the
 * deadline instant — at the exact deadline the duty is still due, not
 * yet overdue.
 */
export function isDeadlineOverdue(deadline: Date, now: Date): boolean {
  return now.getTime() > deadline.getTime();
}
