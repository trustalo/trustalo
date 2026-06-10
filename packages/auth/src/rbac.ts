import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./types.js";

const ALL_PERMISSIONS = [
  "users:read",
  "users:write",
  "users:manage",
  "settings:read",
  "settings:write",
  "frameworks:read",
  "frameworks:write",
  "controls:read",
  "controls:write",
  "policies:read",
  "policies:write",
  "risks:read",
  "risks:write",
  "evidence:read",
  "evidence:write",
  "evidence:approve",
  "vendors:read",
  "vendors:write",
  "audits:read",
  "audits:write",
  "assets:read",
  "assets:write",
  "incidents:read",
  "incidents:write",
  "vulnerabilities:read",
  "vulnerabilities:write",
  "bcp:read",
  "bcp:write",
  "ai:read",
  "ai:write",
  "training:read",
  "training:write",
  "integrations:read",
  "integrations:manage",
  "privacy:read",
  "privacy:write",
  "people:read",
  "people:write",
  // Self-service scope for the default `member` role: view own profile +
  // devices and acknowledge assigned policies / complete assigned training.
  // `self:read` gates the read side of the /people/me self-portal; `self:write`
  // gates self-mutations that only ever touch the CALLER's own rows
  // (acknowledge a policy, mark own training complete) — never another person.
  "self:read",
  "self:write",
] as const;

const READ_ONLY_PERMISSIONS = ALL_PERMISSIONS.filter((p) => p.endsWith(":read"));

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [...ALL_PERMISSIONS],

  admin: ALL_PERMISSIONS.filter((p) => p !== "users:manage" && p !== "settings:write"),

  compliance_manager: [
    "frameworks:read",
    "frameworks:write",
    "controls:read",
    "controls:write",
    "policies:read",
    "policies:write",
    "risks:read",
    "risks:write",
    "evidence:read",
    "evidence:write",
    "vendors:read",
    "vendors:write",
    "audits:read",
    "audits:write",
    "assets:read",
    "assets:write",
    "incidents:read",
    "incidents:write",
    "vulnerabilities:read",
    "vulnerabilities:write",
    "bcp:read",
    "bcp:write",
    "ai:read",
    "ai:write",
    "training:read",
    "training:write",
    "privacy:read",
    "privacy:write",
    "people:read",
    "people:write",
  ],

  auditor: [...READ_ONLY_PERMISSIONS, "evidence:approve", "audits:write"],

  viewer: [...READ_ONLY_PERMISSIONS],

  integration_admin: ["integrations:read", "integrations:manage", "evidence:read"],

  // Data Protection Officer — full read across the platform plus write on
  // the privacy program resources (RoPA, DPIAs, breaches, DSARs). DPO is an
  // independent role under GDPR Art. 38 so it intentionally does not get
  // settings/users management.
  dpo: [
    ...READ_ONLY_PERMISSIONS,
    "privacy:write",
    "incidents:write",
    "evidence:write",
    "vendors:write",
  ],

  // Default role for every Person. Rank-and-file / vendor-contact self-service
  // only: view own profile + devices and acknowledge assigned policies /
  // complete assigned training (those read paths scope to the caller).
  member: ["self:read", "self:write"],
};

export function hasPermission(userPermissions: string[], required: string): boolean {
  return userPermissions.includes(required);
}

export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  return required.some((p) => userPermissions.includes(p));
}

export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Express middleware factory that checks whether the authenticated user
 * holds ALL of the required permissions. Returns 403 if any are missing.
 */
export function authorize(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = (req as AuthenticatedRequest).auth;

    if (!auth) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Authentication is required" },
      });
      return;
    }

    const missing = requiredPermissions.filter((p) => !auth.permissions.includes(p));

    if (missing.length > 0) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Missing required permissions: ${missing.join(", ")}`,
        },
      });
      return;
    }

    next();
  };
}
