import type { Request, Response, NextFunction } from "express";
import { authorize } from "@trustalo/auth";

export { authorize };

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Router-level middleware that applies read permission for GET/HEAD/OPTIONS
 * and write permission for all mutation methods (POST/PATCH/PUT/DELETE).
 */
export function authorizeResource(readPermission: string, writePermission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const permission = READ_METHODS.has(req.method) ? readPermission : writePermission;
    return authorize(permission)(req, res, next);
  };
}
