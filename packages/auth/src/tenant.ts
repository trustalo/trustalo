import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./types.js";

/**
 * Reads `req.auth` (set by authenticate middleware) and enforces tenant
 * context. Downstream code should always derive the tenantId from
 * `req.auth`, never from client input.
 *
 * Adds `X-Organization-Id` response header for debugging/tracing.
 */
export function extractTenantContext() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = (req as AuthenticatedRequest).auth;

    if (!auth?.tenantId) {
      res.status(401).json({
        success: false,
        error: {
          code: "MISSING_TENANT",
          message: "Tenant context could not be determined from authentication",
        },
      });
      return;
    }

    res.setHeader("X-Organization-Id", auth.tenantId);
    next();
  };
}
