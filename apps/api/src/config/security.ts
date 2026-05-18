import type { CorsOptions } from "cors";

const INSECURE_SECRET_VALUES = new Set([
  "",
  "changeme",
  "change-me",
  "change-me-in-production",
  "trustalo-jwt-dev-secret-change-in-production",
  "trustalo-internal-dev-key",
]);

function isLikelyProduction(): boolean {
  return (process.env["NODE_ENV"] ?? "development").toLowerCase() === "production";
}

function hasMinEntropy(secret: string): boolean {
  return secret.length >= 32;
}

function requireSecret(
  envName: string,
  fallbackForDev: string,
  options: { minLength?: number; allowFallbackInDev?: boolean } = {},
): string {
  const minLength = options.minLength ?? 32;
  const allowFallbackInDev = options.allowFallbackInDev ?? true;
  const raw = process.env[envName]?.trim();
  const production = isLikelyProduction();

  if (!raw) {
    if (production || !allowFallbackInDev) {
      throw new Error(`[security] ${envName} is required`);
    }
    return fallbackForDev;
  }

  if (production && INSECURE_SECRET_VALUES.has(raw.toLowerCase())) {
    throw new Error(`[security] ${envName} uses an insecure placeholder value`);
  }

  if (production && (raw.length < minLength || !hasMinEntropy(raw))) {
    throw new Error(`[security] ${envName} must be at least ${minLength} characters`);
  }

  return raw;
}

export function getJwtSecret(): string {
  return requireSecret("JWT_SECRET", "dev-only-jwt-secret-change-before-prod-0001");
}

export function getOauthStateSecret(jwtSecret: string): string {
  const oauthSecret = process.env["AUTH_OAUTH_STATE_SECRET"]?.trim();
  if (!oauthSecret) {
    return jwtSecret;
  }
  if (isLikelyProduction() && oauthSecret.length < 32) {
    throw new Error("[security] AUTH_OAUTH_STATE_SECRET must be at least 32 characters");
  }
  return oauthSecret;
}

export function getApiInternalKey(): string {
  return requireSecret("API_INTERNAL_KEY", "dev-only-internal-key-change-before-prod-0001");
}

// Localhost on any port is the only origin we trust by default in
// development. We never combine a wildcard reflect with
// `credentials: true` — that pattern is a CSWSH (cross-site request via
// cookie) primitive and would let any site the developer visits make
// authenticated requests to their local API.
const LOCALHOST_DEV_ALLOWLIST =
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?$/i;

type AllowedOrigins = {
  /** Explicit allow-list parsed from `CORS_ALLOWED_ORIGINS`. */
  exact: string[];
  /**
   * Dev fallback: when `CORS_ALLOWED_ORIGINS` is unset outside of
   * production, accept any `localhost`/`127.0.0.1`/`::1` origin via the
   * regex above.
   */
  allowLocalhostFallback: boolean;
};

function readAllowedOrigins(): AllowedOrigins {
  const configured = process.env["CORS_ALLOWED_ORIGINS"]?.trim();
  if (!configured) {
    if (isLikelyProduction()) {
      throw new Error("[security] CORS_ALLOWED_ORIGINS is required in production");
    }
    return { exact: [], allowLocalhostFallback: true };
  }

  return {
    exact: configured
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    allowLocalhostFallback: false,
  };
}

// Per-request hot path (CSRF middleware) caches the parsed config so we
// don't re-parse `CORS_ALLOWED_ORIGINS` on every state-changing request.
// `getCorsOptions()` deliberately bypasses the cache because it's only
// called once at startup and the security test suite swaps env vars
// between calls.
let cachedAllowedOrigins: AllowedOrigins | null = null;

/**
 * Stateless Origin/Referer check shared by the CORS middleware and the
 * CSRF Origin-based middleware so they cannot drift apart. Returns
 * `true` exactly when `origin` matches the configured allow-list (or,
 * in dev, any `localhost` variant when no allow-list is set). A
 * missing/empty origin returns `false` here — callers that want to
 * permit non-browser requests (curl, server-to-server) handle that
 * separately, because the right answer differs for CORS vs CSRF.
 */
export function isOriginAllowed(origin: string | null | undefined): boolean {
  if (!origin) return false;
  cachedAllowedOrigins ??= readAllowedOrigins();
  const { exact, allowLocalhostFallback } = cachedAllowedOrigins;
  if (allowLocalhostFallback) return LOCALHOST_DEV_ALLOWLIST.test(origin);
  return exact.includes(origin);
}

/** Resets the in-process cache. Exposed for tests. */
export function _resetOriginCacheForTests(): void {
  cachedAllowedOrigins = null;
}

export function getCorsOptions(): CorsOptions {
  const { exact, allowLocalhostFallback } = readAllowedOrigins();

  return {
    origin(origin, cb) {
      // Non-browser requests (curl, server-to-server) get no Origin
      // header — allow them through; auth still gates the actual data.
      if (!origin) return cb(null, true);
      if (allowLocalhostFallback) {
        return cb(null, LOCALHOST_DEV_ALLOWLIST.test(origin));
      }
      cb(null, exact.includes(origin));
    },
    credentials: true,
  };
}
