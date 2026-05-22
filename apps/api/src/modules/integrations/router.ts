/**
 * Integrations module — collector proxy.
 *
 * The `Integration`, `IntegrationCheck`, `IntegrationCheckControl` and
 * `IntegrationCheckResult` Prisma models live on the collector since
 * 2026-05; the collector also owns the runtime, the credentials, and
 * the check evaluation pipeline. The API keeps the historical
 * `/api/v1/integrations/*` paths and forwards each request through to
 * the collector so the web client and any pinned external integration
 * see no change in shape or status semantics.
 *
 * What this router does:
 *  - Authenticates the caller (`authorizeResource`).
 *  - HMAC-signs and forwards the request to the collector.
 *  - Streams the upstream status code + body back verbatim.
 *
 * What this router does NOT do:
 *  - Re-implement business logic. Validation, persistence, error codes
 *    and 503 fallbacks all live in the collector.
 *  - Mutate the request body. The collector accepts the same shapes
 *    the API used to.
 *
 * Routes that previously existed in the API but do not yet have a
 * collector equivalent (check definitions, manual runs, results,
 * AI-from-prompt) return 503 with a pointer until those endpoints
 * are built out on the collector.
 */

import { Router, type Request, type Response } from "express";
import { authorizeResource } from "../../middleware/authorize.js";
import { forwardToCollector } from "../../lib/collector-client.js";

export const integrationsRouter: Router = Router();

integrationsRouter.use(authorizeResource("settings:read", "settings:write"));

/** Pull tenantId off the authenticated request without dragging in the auth type. */
function tenantOf(req: Request): string {
  return (req as unknown as { auth: { tenantId: string } }).auth.tenantId;
}

/** Translate an Express request into a collector forward + reply. */
async function proxy(
  req: Request,
  res: Response,
  collectorPath: string,
  bodyOverride?: unknown,
): Promise<void> {
  // Build a query string from the inbound request, dropping `undefined`
  // values (express types them widely). `URLSearchParams` happily
  // accepts arrays for repeated keys, so coerce arrays per-key.
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item));
    } else {
      params.set(key, String(value));
    }
  }
  const queryString = params.toString();

  const result = await forwardToCollector({
    req,
    tenantId: tenantOf(req),
    method: req.method,
    path: collectorPath,
    query: queryString || undefined,
    body: bodyOverride ?? (req.method === "GET" || req.method === "DELETE" ? undefined : req.body),
  });

  res.status(result.status).json(result.body);
}

/** 503 helper for endpoints whose collector equivalent does not exist yet. */
function notYetOnCollector(res: Response, hint: string): void {
  res.status(503).json({
    success: false,
    error: {
      code: "INTEGRATIONS_PENDING",
      message:
        `The collector does not yet expose ${hint}. ` +
        `Track follow-up: collector-side check/results/from-prompt routes.`,
    },
  });
}

// ── Catalog ────────────────────────────────────────────────────────
//
// Forward to the collector's `/providers/*` paths. The collector kept
// the legacy `/providers` URL for backwards compatibility — the
// underlying model is `Integration`.

integrationsRouter.get("/catalog", (req, res) => proxy(req, res, "/providers/catalog"));
integrationsRouter.get("/catalog/:connector", (req, res) =>
  proxy(req, res, `/providers/${encodeURIComponent(req.params.connector ?? "")}`),
);

// ── Connections ────────────────────────────────────────────────────
//
// `GET /integrations` → `GET /connections`
// `POST /integrations` → `POST /connections` (body shape translated)
// `DELETE /integrations/:id` → `DELETE /connections/:id`

integrationsRouter.get("/", (req, res) => proxy(req, res, "/connections"));

interface ConnectIntegrationBody {
  connector?: string;
  displayName?: string;
  config?: Record<string, unknown>;
  credentials?: Record<string, string>;
  syncFrequencyMinutes?: number;
}

integrationsRouter.post("/", (req, res) => {
  // Translate the API's legacy `{ connector, displayName, config }` body
  // into the collector's `{ integrationId, name, config, credentials }`
  // shape. Anything we don't recognise is forwarded as-is so
  // forward-compatible properties (e.g. `syncFrequencyMinutes`) keep
  // working without touching this router.
  const incoming = (req.body ?? {}) as ConnectIntegrationBody & Record<string, unknown>;
  const { connector, displayName, ...rest } = incoming;
  const translated = {
    ...rest,
    integrationId: connector ?? (rest as { integrationId?: string }).integrationId,
    name: displayName ?? (rest as { name?: string }).name,
  };
  void proxy(req, res, "/connections", translated);
});

integrationsRouter.delete("/:id", (req, res) =>
  proxy(req, res, `/connections/${encodeURIComponent(req.params.id ?? "")}`),
);

// Reading a single connection by id is also useful — match the rest
// of the surface area so the web client gets a 404 from the collector
// rather than a 503 from the gateway.
integrationsRouter.get("/:id", (req, res) =>
  proxy(req, res, `/connections/${encodeURIComponent(req.params.id ?? "")}`),
);

// Per-connection health rollup (IntegrationCheck health states + open
// gap counts). The collector exposes it under `/internal/...`, so we
// forward to that namespace explicitly rather than the public
// `/connections/...` one.
integrationsRouter.get("/:id/health", (req, res) =>
  proxy(req, res, `/internal/connections/${encodeURIComponent(req.params.id ?? "")}/health`),
);

// ── Routes pending a collector implementation ──────────────────────
//
// These are kept as 503 stubs with a stable error code so callers can
// detect "feature pending" vs an outage. Each route is preserved at
// the historical path/method so the web client doesn't need to change.

integrationsRouter.all("/:id/checks{/*splat}", (_req, res) =>
  notYetOnCollector(res, "/connections/:id/checks"),
);
integrationsRouter.all("/:id/results", (_req, res) =>
  notYetOnCollector(res, "/connections/:id/results"),
);
integrationsRouter.all("/from-prompt{/*splat}", (_req, res) =>
  notYetOnCollector(res, "/integrations/from-prompt"),
);
