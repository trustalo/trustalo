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
