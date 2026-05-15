import type { CookieOptions, Request, Response, NextFunction } from "express";
import { verifyToken } from "./jwt.js";
import type { AuthenticatedRequest } from "./types.js";

export const SESSION_COOKIE_NAME = "trustalo_session";

function authError(res: Response, code: string, message: string): void {
  res.status(401).json({
    success: false,
    error: { code, message },
  });
}

function isProduction(): boolean {
  return (process.env["NODE_ENV"] ?? "development").toLowerCase() === "production";
}

/**
 * Cookie options for the session token. httpOnly so JS can't read it
 * (XSS mitigation), SameSite=Lax so login redirects work, Secure in
 * production. The `domain` env var allows api.example.com to write a
 * cookie that web.example.com can read (must share a parent domain).
 */
export function sessionCookieOptions(maxAgeMs?: number): CookieOptions {
  const domain = process.env["SESSION_COOKIE_DOMAIN"]?.trim() || undefined;
  return {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    ...(domain ? { domain } : {}),
    ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
  };
}

type AuthenticateOptions = {
  allowCookie?: boolean;
};

/** Read the session JWT from cookie (optional) or Authorization header. */
function extractToken(
  req: Request,
  allowCookie: boolean,
): { token: string | null; source: "cookie" | "header" | null } {
  if (allowCookie) {
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
    if (
      cookies &&
      typeof cookies[SESSION_COOKIE_NAME] === "string" &&
      cookies[SESSION_COOKIE_NAME].length > 0
    ) {
      return { token: cookies[SESSION_COOKIE_NAME], source: "cookie" };
    }
  }
  const header = req.headers.authorization;
  if (!header) return { token: null, source: null };
  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return { token: null, source: "header" };
  }
  return { token: parts[1] ?? null, source: "header" };
}

/**
 * Extracts a session JWT from either the `trustalo_session` httpOnly
 * cookie OR a `Bearer` Authorization header, verifies it, and attaches
 * the decoded payload as `req.auth`. Cookies are preferred when present
 * so a successful cookie auth doesn't get downgraded by stale Bearer
 * fallbacks in the browser.
 */
export function authenticate(jwtSecret: string, options: AuthenticateOptions = {}) {
  const allowCookie = options.allowCookie ?? true;
  return (req: Request, res: Response, next: NextFunction): void => {
    const { token, source } = extractToken(req, allowCookie);

    if (!token) {
      authError(
        res,
        source === "header" ? "MALFORMED_TOKEN" : "MISSING_TOKEN",
        source === "header"
          ? "Authorization header must use Bearer scheme"
          : "Session cookie or Authorization header is required",
      );
      return;
    }

    try {
      const payload = verifyToken(token, jwtSecret);

      (req as AuthenticatedRequest).auth = {
        userId: payload.userId,
        tenantId: payload.tenantId,
        role: payload.role,
        permissions: payload.permissions,
      };

      next();
    } catch (err) {
      const message =
        err instanceof Error && err.name === "TokenExpiredError"
          ? "Token has expired"
          : "Invalid token";

      authError(res, "INVALID_TOKEN", message);
    }
  };
}

/**
 * Guard that ensures `req.auth` has been set by a prior authenticate() call.
 */
export function requireAuth() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!(req as AuthenticatedRequest).auth) {
      authError(res, "UNAUTHENTICATED", "Authentication is required");
      return;
    }
    next();
  };
}
