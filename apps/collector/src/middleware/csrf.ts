import type { Request, Response, NextFunction } from "express";
import { getCorsOptions } from "../config/security.js";

/**
 * CSRF protection for the collector via OWASP "Verifying Origin With
 * Standard Headers" (Cross-Site Request Forgery Prevention Cheat Sheet
 * § 4). Mirrors `apps/api/src/middleware/csrf.ts`; see that file for
 * the full rationale (Bearer auth + SameSite=Lax cookies + internal
 * HMAC routes mean a stateless Origin/Referer check is the right
 * mitigation here).
 */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const EXEMPT_PATH_PREFIXES = ["/internal/", "/health", "/providers", "/research"] as const;

function buildAllowList(): Set<string> {
  const cors = getCorsOptions();
  const raw = cors.origin;
  const allowed = new Set<string>();

  if (typeof raw === "string") {
    allowed.add(raw);
  } else if (Array.isArray(raw)) {
    for (const origin of raw) {
      if (typeof origin === "string") allowed.add(origin);
    }
  }
  return allowed;
}

let cachedAllowList: Set<string> | null = null;

function getAllowList(): Set<string> {
  cachedAllowList ??= buildAllowList();
  return cachedAllowList;
}

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

  const allowList = getAllowList();

  if (!candidate || !allowList.has(candidate)) {
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
