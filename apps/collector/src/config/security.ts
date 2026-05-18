import type { CorsOptions } from "cors";

const INSECURE_VALUES = new Set(["", "changeme", "change-me", "change-me-in-production"]);

function isProduction(): boolean {
  return (process.env["NODE_ENV"] ?? "development").toLowerCase() === "production";
}

function requireSecret(name: string, fallbackForDev: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    if (isProduction()) throw new Error(`[security] ${name} is required`);
    return fallbackForDev;
  }
  if (isProduction() && INSECURE_VALUES.has(value.toLowerCase())) {
    throw new Error(`[security] ${name} uses an insecure placeholder value`);
  }
  if (isProduction() && value.length < 32) {
    throw new Error(`[security] ${name} must be at least 32 characters`);
  }
  return value;
}

export function getJwtSecret(): string {
  return requireSecret("JWT_SECRET", "collector-dev-jwt-secret-change-before-prod-0001");
}

export function getInternalKey(): string {
  return requireSecret("API_INTERNAL_KEY", "collector-dev-internal-key-change-before-prod-0001");
}

// See the matching helper in `apps/api/src/config/security.ts` for the
// reasoning — `origin: true` + `credentials: true` is a CSWSH primitive
// and is therefore intentionally never used here.
const LOCALHOST_DEV_ALLOWLIST =
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?$/i;

type AllowedOrigins = {
  exact: string[];
  allowLocalhostFallback: boolean;
};

function readAllowedOrigins(): AllowedOrigins {
  const configured = process.env["CORS_ALLOWED_ORIGINS"]?.trim();
  if (!configured) {
    if (isProduction()) {
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

// Per-request hot path (CSRF middleware) caches the parsed config.
// `getCorsOptions()` deliberately bypasses the cache so tests can swap
// env vars between calls.
let cachedAllowedOrigins: AllowedOrigins | null = null;

/**
 * Shared Origin check used by both the CORS and CSRF middlewares so the
 * two cannot drift apart. Returns `true` only when `origin` matches the
 * configured allow-list (or a `localhost` variant in the dev fallback).
 * A missing/empty origin returns `false`; callers that want to permit
 * non-browser requests handle that themselves (CORS does, CSRF does not).
 */
export function isOriginAllowed(origin: string | null | undefined): boolean {
  if (!origin) return false;
  cachedAllowedOrigins ??= readAllowedOrigins();
  const { exact, allowLocalhostFallback } = cachedAllowedOrigins;
  if (allowLocalhostFallback) return LOCALHOST_DEV_ALLOWLIST.test(origin);
  return exact.includes(origin);
}

export function _resetOriginCacheForTests(): void {
  cachedAllowedOrigins = null;
}

export function getCorsOptions(): CorsOptions {
  const { exact, allowLocalhostFallback } = readAllowedOrigins();

  return {
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowLocalhostFallback) {
        return cb(null, LOCALHOST_DEV_ALLOWLIST.test(origin));
      }
      cb(null, exact.includes(origin));
    },
    credentials: true,
  };
}
