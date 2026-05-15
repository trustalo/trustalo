import rateLimit, { type Options } from "express-rate-limit";

/**
 * Process-wide rate limiter mounted globally in `index.ts`. This is the
 * baseline that satisfies CodeQL's `js/missing-rate-limiting` query for
 * every authenticated and unauthenticated route.
 *
 * Stricter, route-specific limits (e.g. the auth router's per-IP login
 * bucket) layer on top of this — a request must pass BOTH limits.
 *
 * The limit is per-IP; when running behind a load balancer / reverse
 * proxy, ensure `app.set("trust proxy", ...)` is also configured so
 * `req.ip` reflects the real client IP rather than the proxy address.
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
  // Skip the same `/health` probe path the load balancer hits every few
  // seconds; rate-limiting it would mask real outages with 429s.
  skip: (req) => req.path === "/health",
} satisfies Partial<Options>);
