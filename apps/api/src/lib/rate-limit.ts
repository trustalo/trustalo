/**
 * Per-tenant, per-feature rate limiter — in-process token bucket.
 *
 * Used to throttle expensive AI endpoints (extraction, chat) so a
 * runaway loop or compromised account can't drain the org's LLM budget
 * in seconds. Two refill modes:
 *
 *   • `windowMs` — classic fixed window: N requests every M ms.
 *   • `refillMs` — token bucket: every M ms, replenish 1 token (up to
 *     `capacity`).
 *
 * Limits
 * ──────
 * • In-memory only. Multi-instance API deployments need a Redis-backed
 *   variant; documented in the ai-features rule. For our current single-
 *   instance Bedrock-hosted footprint this is correct.
 * • Bucket key is a (tenantId, feature) tuple. Per-user limits
 *   would need an extra dimension; not needed today.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export interface RateLimitOptions {
  /** Bucket capacity. */
  capacity: number;
  /** Milliseconds between token refills. One token per refill. */
  refillMs: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Try to consume a token. Returns true on success; false when the bucket
 * is empty (caller should respond with 429).
 */
export function consumeToken(
  tenantId: string,
  feature: string,
  options: RateLimitOptions,
): boolean {
  const key = `${tenantId}::${feature}`;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing) {
    buckets.set(key, { tokens: options.capacity - 1, lastRefill: now });
    return true;
  }

  // Refill any tokens earned since the last consumption.
  const elapsed = now - existing.lastRefill;
  if (elapsed >= options.refillMs) {
    const refill = Math.floor(elapsed / options.refillMs);
    existing.tokens = Math.min(options.capacity, existing.tokens + refill);
    existing.lastRefill += refill * options.refillMs;
  }

  if (existing.tokens <= 0) {
    return false;
  }
  existing.tokens -= 1;
  return true;
}

/** Test-only — clear all buckets so tests start from a known state. */
export function __resetRateLimits(): void {
  buckets.clear();
}
