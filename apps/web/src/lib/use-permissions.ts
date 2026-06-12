import { useMemo } from "react";

const TOKEN_KEY = "trustalo_token";

interface TokenPayload {
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

function decodeJwt(): TokenPayload | null {
  if (typeof window === "undefined") return null;
  // Tokens now live in sessionStorage (session-bound, XSS-narrowed) and
  // eventually only in the httpOnly session cookie. Fall back to
  // localStorage so legacy sessions don't get demoted to a blank
  // permission set during the rollout window.
  const token = sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (!parts[1]) return null;
    return JSON.parse(atob(parts[1])) as TokenPayload;
  } catch {
    return null;
  }
}

export interface PermissionsContext {
  role: string;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  canRead: (resource: string) => boolean;
  canWrite: (resource: string) => boolean;
  isOwner: boolean;
  isAdmin: boolean;
}

/**
 * Hook that decodes the JWT to expose the user's role and permissions.
 * Provides helper functions for checking specific permissions.
 */
export function usePermissions(): PermissionsContext {
  return useMemo(() => {
    const payload = decodeJwt();
    const role = payload?.role ?? "";
    const permissions = payload?.permissions ?? [];

    const permSet = new Set(permissions);

    return {
      role,
      permissions,
      hasPermission: (perm: string) => permSet.has(perm),
      hasAnyPermission: (perms: string[]) => perms.some((p) => permSet.has(p)),
      canRead: (resource: string) => permSet.has(`${resource}:read`),
      canWrite: (resource: string) =>
        permSet.has(`${resource}:write`) || permSet.has(`${resource}:manage`),
      isOwner: role === "owner",
      isAdmin: role === "owner" || role === "admin",
    };
  }, []);
}

/**
 * Maps navigation items to the permission required to see them.
 * Returns null for items visible to all authenticated users.
 */
export const NAV_PERMISSIONS: Record<string, string | null> = {
  Dashboard: null,
  Tasks: null,
  "My Compliance": "self:read",
  People: "people:read",
  Frameworks: "frameworks:read",
  Controls: "controls:read",
  Policies: "policies:read",
  Risks: "risks:read",
  Evidence: "evidence:read",
  Vendors: "vendors:read",
  Assets: "assets:read",
  Incidents: "incidents:read",
  Vulnerabilities: "vulnerabilities:read",
  Audits: "audits:read",
  "Business Continuity": "bcp:read",
  "AI Governance": "ai:read",
  Privacy: "privacy:read",
  Training: "training:read",
  Integrations: "integrations:read",
  "Trust Center": "settings:read",
  Settings: "settings:read",
  Partners: null,
};
