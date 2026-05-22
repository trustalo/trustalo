/**
 * Server-side helper used by the API to talk to the Collector.
 *
 * Mirrors the convention already established for collector → api
 * (HMAC-signed service request). Two surfaces are exposed:
 *
 *  1. `listConnectionsForOrg`, `createAgentRun`, etc. — typed wrappers
 *     around well-known internal endpoints. These throw on upstream
 *     failure and translate `CollectorRequestError` → safe HTTP via
 *     `respondWithCollectorError` at the router layer.
 *
 *  2. `forwardToCollector` — a generic raw-response forwarder used by
 *     `/api/v1/integrations/*` to proxy browser-originated requests
 *     through to the collector while preserving status code, body and
 *     content type. The API authenticates the caller, the collector
 *     re-validates the HMAC envelope so the trust boundary is still
 *     enforced at the destination.
 */

import type { Request, Response } from "express";
import { SESSION_COOKIE_NAME } from "@trustalo/auth";
import { signServiceRequest, toHeaderRecord } from "./service-auth.js";

const COLLECTOR_BASE_URL = process.env["COLLECTOR_BASE_URL"] ?? "http://localhost:4001";

/**
 * Extract whatever session token the inbound API request carries and
 * present it to the collector as `Authorization: Bearer <jwt>`. The two
 * services share `JWT_SECRET`, so the collector's `authenticate`
 * middleware accepts the same token verbatim.
 */
function inboundBearerToken(req: Request | undefined): string | null {
  if (!req) return null;
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  const cookieToken = cookies?.[SESSION_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }
  const header = req.headers.authorization;
  if (typeof header === "string") {
    const parts = header.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer" && parts[1]) {
      return parts[1];
    }
  }
  return null;
}

export class CollectorRequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "CollectorRequestError";
  }
}

interface CollectorResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

async function request<T>(
  method: string,
  path: string,
  tenantId: string,
  body?: unknown,
): Promise<T> {
  const serializedBody = body !== undefined ? JSON.stringify(body) : undefined;
  const signature = signServiceRequest({
    caller: "api",
    method,
    path,
    body: serializedBody ?? null,
  });
  const res = await fetch(`${COLLECTOR_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Organization-Id": tenantId,
      ...toHeaderRecord(signature),
    },
    body: serializedBody,
  });

  const json = (await res.json().catch(() => ({
    success: false,
    error: { code: "BAD_RESPONSE", message: res.statusText },
  }))) as CollectorResponse<T>;

  if (!res.ok || !json.success) {
    throw new CollectorRequestError(
      res.status,
      json.error?.message ?? `Collector request failed (${res.status})`,
      json.error?.code,
    );
  }

  return json.data as T;
}

// ── Generic forwarder ─────────────────────────────────────────────
//
// `forwardToCollector` proxies an arbitrary HTTP request to the
// collector. Unlike `request<T>` it does NOT throw on non-2xx — it
// returns the raw status and parsed body so callers can stream the
// upstream response back to the client verbatim.

export interface ForwardResult {
  /** Upstream HTTP status code. */
  status: number;
  /** Parsed JSON body from the collector, or a synthetic error envelope. */
  body: unknown;
}

export async function forwardToCollector(opts: {
  /** Inbound API request — used to forward the caller's JWT/session. */
  req: Request;
  tenantId: string;
  method: string;
  /** Collector path starting with `/`, e.g. `/connections`. */
  path: string;
  body?: unknown;
  /** Optional query string (without the leading `?`). */
  query?: string;
}): Promise<ForwardResult> {
  const fullPath = opts.query ? `${opts.path}?${opts.query}` : opts.path;
  const serializedBody = opts.body !== undefined ? JSON.stringify(opts.body) : undefined;

  // Two-layer credentials going outbound:
  //  - `Authorization: Bearer <jwt>` mirrors the caller's session so the
  //    collector's `authenticate` middleware populates `req.auth` the
  //    same way it would on a direct browser → collector hit.
  //  - HMAC signature is added defensively in case the route the
  //    request lands on consults the service-auth envelope (none of the
  //    user-facing routes do today, but it keeps the proxy honest).
  const bearer = inboundBearerToken(opts.req);
  const signature = signServiceRequest({
    caller: "api",
    method: opts.method,
    path: fullPath,
    body: serializedBody ?? null,
  });

  let res: globalThis.Response;
  try {
    res = await fetch(`${COLLECTOR_BASE_URL}${fullPath}`, {
      method: opts.method,
      headers: {
        "Content-Type": "application/json",
        "X-Organization-Id": opts.tenantId,
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        ...toHeaderRecord(signature),
      },
      body: serializedBody,
    });
  } catch (err) {
    // Network error reaching the collector. Surface a 502 so the web
    // client doesn't mistake it for an auth failure and log the user
    // out.
    return {
      status: 502,
      body: {
        success: false,
        error: {
          code: "COLLECTOR_UNAVAILABLE",
          message: "Evidence collector is currently unavailable. Please try again shortly.",
          cause: err instanceof Error ? err.message : String(err),
        },
      },
    };
  }

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { success: false, error: { code: "BAD_RESPONSE", message: text } };
  }

  // 5xx from the collector → translate to 502 at the gateway so the
  // web client treats it as an upstream-availability problem and not
  // an auth failure. 4xx codes from the caller are passed through.
  const status = res.status >= 500 ? 502 : res.status;
  return { status, body };
}

// ── Connections ────────────────────────────────────────────────────

export interface CollectorConnectionSummary {
  id: string;
  name: string;
  status: string;
  isActive: boolean;
  provider: { slug: string; name: string; category?: string; capabilities?: string[] };
}

export function listConnectionsForOrg(tenantId: string): Promise<CollectorConnectionSummary[]> {
  return request<CollectorConnectionSummary[]>("GET", "/internal/connections", tenantId);
}

/**
 * One bound connection as returned by
 * `GET /internal/controls/:controlId/connections`. The list is one row
 * per *connection*, with the contributing manifestKeys rolled up.
 */
export interface BoundConnectionSummary {
  id: string;
  name: string;
  status: string;
  isActive: boolean;
  integrationSlug: string;
  integrationName: string;
  manifestKeys: string[];
}

/**
 * Fetch the IntegrationConnections currently bound to the given
 * control via materialised `IntegrationCheckControl` rows.
 *
 * Used as the default for `agentToolConnectionIds` when the user
 * hasn't explicitly chosen tool connections — the unified binding
 * pipeline removes the "pick connections by hand" step.
 */
export function listBoundConnectionsForControl(
  tenantId: string,
  controlId: string,
): Promise<BoundConnectionSummary[]> {
  return request<BoundConnectionSummary[]>(
    "GET",
    `/internal/controls/${encodeURIComponent(controlId)}/connections`,
    tenantId,
  );
}

/**
 * Reason hint forwarded to the collector's reconciler when the API
 * fires a drift event. Mirrors the Prisma
 * `IntegrationCheckControlDisabledReason` enum, but kept as a string
 * here so the API doesn't need to import the collector's Prisma
 * client just to call the endpoint.
 */
export type ReconcileTriggerReason =
  | "pending_confirmation"
  | "user_disabled"
  | "control_not_applicable"
  | "control_deleted"
  | "framework_disabled"
  | "ref_unmapped"
  | "manifest_removed";

export interface ReconcileBindingsResultWire {
  connectionId: string;
  manifestVersion: string | null;
  added: Array<{ controlId: string; manifestKey: string }>;
  reEnabled: Array<{ controlId: string; manifestKey: string }>;
  disabled: Array<{
    controlId: string;
    manifestKey: string;
    reason: ReconcileTriggerReason;
  }>;
  unchanged: number;
}

/**
 * Trigger a binding reconcile for either a specific connection (when
 * `connectionId` is provided) or every active connection in the
 * tenant (when omitted). Used by framework / control lifecycle hooks
 * in the API and by the nightly cron.
 *
 * Best-effort by design: API mutation handlers should not 5xx because
 * the collector is temporarily unreachable, so callers typically wrap
 * this in a try/catch and log on failure.
 */
export function reconcileConnectionBindings(
  tenantId: string,
  opts: {
    connectionId?: string;
    triggerReason?: ReconcileTriggerReason;
  } = {},
): Promise<{ connections: ReconcileBindingsResultWire[]; totalConnections: number }> {
  return request<{ connections: ReconcileBindingsResultWire[]; totalConnections: number }>(
    "POST",
    "/internal/connections/reconcile-bindings",
    tenantId,
    opts,
  );
}

// ── Automation health ──────────────────────────────────────────────
//
// Read-only rollups for the API to embed on `GET /controls/:id` and
// expose under the auditor timeline. The collector owns the raw data
// (`IntegrationCheck`, `EvidenceCoverageGap`); the API stays a thin
// proxy. All three calls are best-effort — if the collector is
// unreachable, the API should still return the control payload
// without `automationHealth`.

export type HealthState = "healthy" | "degraded" | "overdue" | "failing" | "paused";

export interface ControlAutomationHealth {
  state: HealthState | "no_automation";
  totalChecks: number;
  healthyChecks: number;
  oldestLastSuccessAt: string | null;
  openGapCount: number;
  openGapSeverity: "low" | "medium" | "high" | "critical" | null;
  recentGaps: Array<{
    id: string;
    reason: string;
    openedAt: string;
    openedForMs: number;
    lastErrorMessage: string | null;
  }>;
}

export function getControlAutomationHealth(
  tenantId: string,
  controlId: string,
): Promise<ControlAutomationHealth> {
  return request<ControlAutomationHealth>(
    "GET",
    `/internal/controls/${encodeURIComponent(controlId)}/automation-health`,
    tenantId,
  );
}

export interface ConnectionHealthSummary {
  connectionId: string;
  state: HealthState | "no_checks";
  totalChecks: number;
  checksByState: Record<HealthState, number>;
  openGapCount: number;
  openGapsByReason: Record<string, number>;
  lastSyncAt: string | null;
}

export function getConnectionHealth(
  tenantId: string,
  connectionId: string,
): Promise<ConnectionHealthSummary> {
  return request<ConnectionHealthSummary>(
    "GET",
    `/internal/connections/${encodeURIComponent(connectionId)}/health`,
    tenantId,
  );
}

export interface ControlEvidenceCoverage {
  controlId: string;
  windowStart: string;
  windowEnd: string;
  gaps: Array<{
    id: string;
    integrationCheckId: string;
    manifestKey: string;
    reason: string;
    startedAt: string;
    endedAt: string | null;
    durationMs: number;
    lastErrorMessage: string | null;
  }>;
  uptime: number;
}

export function getControlEvidenceCoverage(
  tenantId: string,
  controlId: string,
  windowDays?: number,
): Promise<ControlEvidenceCoverage> {
  const path = `/internal/controls/${encodeURIComponent(controlId)}/evidence-coverage${
    windowDays ? `?windowDays=${windowDays}` : ""
  }`;
  return request<ControlEvidenceCoverage>("GET", path, tenantId);
}

// ── Platform health (cross-tenant SRE rollup) ─────────────────────
//
// Cross-tenant aggregate used to detect platform-wide outages of a
// specific provider. The collector endpoint is unscoped — no
// `X-Organization-Id` required — so we call it through a dedicated
// helper that *doesn't* set that header.

export interface PlatformCoverageHealth {
  totalOpenGaps: number;
  generatedAt: string;
  providers: Array<{
    providerId: string;
    providerName: string;
    openGaps: number;
    byReason: Record<string, number>;
    bySeverity: { low: number; medium: number; high: number; critical: number };
    earliestStartedAt: string;
  }>;
}

export async function getPlatformCoverageHealth(): Promise<PlatformCoverageHealth> {
  const path = "/internal/health/coverage-gaps";
  const signature = signServiceRequest({
    caller: "api",
    method: "GET",
    path,
    body: "",
  });
  const res = await fetch(`${COLLECTOR_BASE_URL}${path}`, {
    method: "GET",
    headers: toHeaderRecord(signature),
  });
  if (!res.ok) {
    throw new CollectorRequestError(
      res.status,
      `Collector platform-health request failed: ${res.status} ${res.statusText}`,
      "PLATFORM_HEALTH_UPSTREAM",
    );
  }
  const body = (await res.json()) as { success: boolean; data: PlatformCoverageHealth };
  if (!body.success) {
    throw new CollectorRequestError(
      502,
      "Collector returned non-success envelope",
      "PLATFORM_HEALTH_UPSTREAM",
    );
  }
  return body.data;
}

// ── Agent runs ─────────────────────────────────────────────────────

export interface CreateAgentRunInput {
  controlId: string;
  controlTitle?: string;
  instructions: string;
  toolConnectionIds: string[];
  // AI provider/model resolved by the API for this run. Credentials
  // travel in plaintext over the trusted internal HTTP channel and are
  // encrypted at rest by the collector before persisting an AgentRun.
  ai: {
    provider: string;
    model: string;
    credentials: Record<string, unknown>;
  };
}

export interface AgentRunSummary {
  id: string;
  controlId: string;
  status: string;
  trigger: string;
  evidenceCount: number;
  errorCount: number;
  errorMessage: string | null;
  summary: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  createdAt: string;
  updatedAt: string;
}

export function createAgentRun(
  tenantId: string,
  input: CreateAgentRunInput,
): Promise<AgentRunSummary> {
  return request<AgentRunSummary>("POST", "/internal/agent-runs", tenantId, input);
}

export function listAgentRuns(
  tenantId: string,
  params: { controlId?: string; limit?: number } = {},
): Promise<AgentRunSummary[]> {
  const qs = new URLSearchParams();
  if (params.controlId) qs.set("controlId", params.controlId);
  if (params.limit) qs.set("limit", String(params.limit));
  const query = qs.toString();
  return request<AgentRunSummary[]>(
    "GET",
    `/internal/agent-runs${query ? `?${query}` : ""}`,
    tenantId,
  );
}

export function getAgentRun(
  tenantId: string,
  id: string,
): Promise<AgentRunSummary & { transcript: unknown; toolCallSummary: unknown }> {
  return request("GET", `/internal/agent-runs/${id}`, tenantId);
}

// ── Error → HTTP response mapping ──────────────────────────────────
//
// The API acts as a gateway in front of the Collector. Forwarding
// upstream status codes 1:1 is dangerous: the web client treats any
// 401 from the API as the user's session expiring and force-logs them
// out. A collector that's down, misconfigured (`API_INTERNAL_KEY`),
// or simply restarting therefore boots real users back to /login.
//
// Map cross-service auth and upstream server errors to 502 Bad
// Gateway (the API really *is* a bad gateway in that moment), and
// only forward statuses that genuinely describe a problem with the
// caller's request.

const FORWARDABLE_UPSTREAM_STATUSES = new Set<number>([
  400, // bad request from the API → caller's input was wrong
  404, // resource genuinely doesn't exist upstream
  409, // conflict (e.g. duplicate connection)
  422, // validation
  429, // upstream rate limit — surface so the caller can back off
]);

/** Translate a `CollectorRequestError` into a safe outbound HTTP response. */
export function respondWithCollectorError(res: Response, err: CollectorRequestError): void {
  const status = FORWARDABLE_UPSTREAM_STATUSES.has(err.status) ? err.status : 502;
  const code = err.code ?? (status === 502 ? "COLLECTOR_UNAVAILABLE" : "COLLECTOR_ERROR");
  const message =
    status === 502
      ? "Evidence collector is currently unavailable. Please try again shortly."
      : err.message;
  res.status(status).json({
    success: false,
    error: { code, message },
  });
}
