import type { Request, Response, NextFunction } from "express";
import { isOriginAllowed } from "../config/security.js";

/**
 * CSRF protection via the OWASP "Verifying Origin With Standard Headers"
 * approach (Cross-Site Request Forgery Prevention Cheat Sheet § 4).
 *
 * For state-changing requests (anything other than GET/HEAD/OPTIONS) we
 * require an `Origin` (or, as a fallback, `Referer`) header that matches
 * one of the configured CORS allow-list origins. Same-origin requests
 * from our own dashboard satisfy this trivially; cross-origin POSTs from
 * an attacker-controlled page do not.
 *
 * Why not the synchronizer-token / double-submit-cookie pattern (csurf,
 * csrf-csrf, etc.):
 *   1. Trustalo issues `HttpOnly`+`SameSite=Lax` session cookies, which
 *      already block third-party top-level navigations and most CSRF
 *      vectors at the cookie layer.
 *   2. Non-browser API clients authenticate with `Authorization: Bearer
 *      <jwt>` instead of cookies; they never send a session cookie and
 *      therefore have no CSRF surface.
 *   3. Origin/Referer checking is stateless and requires no client
 *      changes, which is essential for the embedded Trust Center widget
 *      and the SDK use cases.
 *
 * Internal cross-service routes (`/internal/...`) are exempted because
 * they authenticate with a shared HMAC secret + tenant header instead of
 * cookies, so a cross-origin browser POST cannot forge them.
 */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const EXEMPT_PATH_PREFIXES = [
  "/internal/",
  "/health",
  // Device-agent routes authenticate via an enrollment token or a per-device
  // HMAC signature (no cookies), so they have no CSRF surface — same
  // rationale as /internal.
  "/api/v1/devices/agent/",
] as const;

function originFromReferer(referer: string): string | null {
  try {
    const url = new URL(referer);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

function isExempt(path: string): boolean {
  return EXEMPT_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }
  if (isExempt(req.path)) {
    next();
    return;
  }

  // Bearer-token requests have no CSRF surface (no ambient credentials).
  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
    next();
    return;
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer ?? req.headers.referrer;
  const candidate =
    typeof origin === "string"
      ? origin
      : typeof referer === "string"
        ? originFromReferer(referer)
        : null;

  if (!isOriginAllowed(candidate)) {
    res.status(403).json({
      success: false,
      error: {
        code: "CSRF_ORIGIN_REJECTED",
        message: "Cross-site request rejected: missing or untrusted Origin/Referer.",
      },
    });
    return;
  }

  next();
}
