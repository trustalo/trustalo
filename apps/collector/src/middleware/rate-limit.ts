import rateLimit, { type Options } from "express-rate-limit";

/**
 * Process-wide rate limiter for the collector. Mirrors `apps/api`'s
 * limiter so external callers (the API service via internal HMAC, and
 * the dashboard browsing the public provider catalog) get the same
 * baseline 429 behavior. Skips `/health` to keep load-balancer probes
 * out of the bucket.
 */
const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_PER_WINDOW = 300;

const rateLimitMessage = {
  success: false,
  error: {
    code: "RATE_LIMITED",
    message: "Too many requests. Please retry after a short delay.",
  },
};

function readPositiveInt(envVar: string, fallback: number): number {
  const raw = process.env[envVar];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const globalRateLimiter = rateLimit({
  windowMs: readPositiveInt("RATE_LIMIT_WINDOW_MS", DEFAULT_WINDOW_MS),
  limit: readPositiveInt("RATE_LIMIT_MAX_PER_WINDOW", DEFAULT_MAX_PER_WINDOW),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: rateLimitMessage,
  skip: (req) => req.path === "/health",
} satisfies Partial<Options>);
