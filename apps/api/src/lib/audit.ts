/**
 * Lightweight audit-log helper.
 *
 * Wraps the MongoDB AuditLog model so module routers can record sensitive
 * mutations without copy-pasting the same boilerplate everywhere. Two key
 * design decisions:
 *
 *  1. **Best-effort**: errors are swallowed and logged only to stderr. An
 *     audit-log failure must NEVER fail the user's actual API call. The DB
 *     is async and remote (Mongo); a transient outage there cannot block a
 *     DSAR fulfilment or a breach notification.
 *
 *  2. **Pulls everything from `req`**: tenantId, userId, IP and
 *     user-agent come from the authenticated request, so callers only need
 *     to supply the action / resource / resourceId / details. This keeps
 *     call sites short:
 *
 *       await audit(req, "create", "ProcessingActivity", id, { name });
 *
 * The action vocabulary is constrained by the AuditLog schema enum to
 * `create | read | update | delete | login | logout | export | approve | reject`.
 * For lifecycle transitions (e.g. DPIA submit, breach contain) we map to
 * `update` with a `transition` field in `details`.
 */

import type { Request } from "express";
import { AuditLog } from "../mongodb/models/index.js";

export type AuditAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "export"
  | "approve"
  | "reject";

interface AuthShape {
  tenantId?: string;
  userId?: string;
}

/**
 * Records an entry in the audit log. Fire-and-forget — does not await the
 * Mongo write into the request lifecycle to keep the user response fast,
 * but still returns a Promise the caller may await in tests.
 */
export async function audit(
  req: Request,
  action: AuditAction,
  resource: string,
  resourceId?: string,
  details?: unknown,
): Promise<void> {
  try {
    const auth = (req as unknown as { auth?: AuthShape }).auth;
    if (!auth?.tenantId || !auth?.userId) {
      // No auth context — likely a public endpoint that shouldn't be audited.
      // Silently skip rather than throw.
      return;
    }
    await AuditLog.create({
      tenantId: auth.tenantId,
      userId: auth.userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? undefined,
    });
  } catch (err) {
    // Best-effort — never fail the user request because of audit logging.
    // Log to stderr so ops can spot Mongo outages.

    console.warn("[audit] failed to record entry", {
      action,
      resource,
      resourceId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
