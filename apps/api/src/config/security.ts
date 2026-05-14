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

export function getCorsOptions(): CorsOptions {
  const configured = process.env["CORS_ALLOWED_ORIGINS"]?.trim();
  if (!configured) {
    if (isLikelyProduction()) {
      throw new Error("[security] CORS_ALLOWED_ORIGINS is required in production");
    }
    // Dev fallback: only echo back localhost-style origins. Other
    // origins get no `Access-Control-Allow-Origin` header, so browsers
    // refuse the cross-origin response.
    return {
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        cb(null, LOCALHOST_DEV_ALLOWLIST.test(origin));
      },
      credentials: true,
    };
  }

  const allowed = configured
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin(origin, cb) {
      // Non-browser requests (curl, server-to-server)
      if (!origin) return cb(null, true);
      cb(null, allowed.includes(origin));
    },
    credentials: true,
  };
}
