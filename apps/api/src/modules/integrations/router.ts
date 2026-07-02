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
 *  - Streams the upstream status code + body back verbatim (plus a
 *    Control-title enrichment on the checks list, since Control rows
 *    live in the API database).
 *  - Hosts the ONE non-proxy route: `POST /from-prompt` (AI check
 *    generation). It is EE-gated (`assertEnterpriseLicense("ai")`),
 *    rate-limited per tenant, audited, and advisory — nothing is
 *    persisted until the user saves via the collector.
 *
 * What this router does NOT do:
 *  - Re-implement business logic. Validation, persistence and error
 *    codes for checks live in the collector.
 *  - Mutate the request body. The collector accepts the same shapes
 *    the API used to.
 *
 * Custom HTTP checks are fully wired: generate → test → save → the
 * collector scheduler/runner executes them and submits evidence.
 * Browser checks are roadmap — every surface answers them with a
 * structured `not_supported` payload instead of a 5xx.
 */

import { Router, type Request, type Response } from "express";
import { assertEnterpriseLicense } from "@trustalo/license";
import { authorizeResource } from "../../middleware/authorize.js";
import { forwardToCollector } from "../../lib/collector-client.js";
import { prisma } from "../../db/prisma.js";
import { audit } from "../../lib/audit.js";
import { consumeToken } from "../../lib/rate-limit.js";
import {
  generateCheckSpec,
  UnsafePromptError,
  GeneratedSpecInvalidError,
  BrowserCheckUnavailableError,
} from "./from-prompt.js";

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

// ── Phase 4: natural-language → automated check ────────────────────
//
// Registered BEFORE the `/:id` routes so `/from-prompt/*` can never be
// captured by the id parameter.
//
// Split of responsibilities:
//  • Generation (below) runs IN the API: it is an Enterprise AI surface
//    (`assertEnterpriseLicense("ai")`), resolves the model through
//    `resolveOrgAI`, and is rate-limited per tenant. Generation is
//    advisory only — nothing is persisted.
//  • Test + save proxy to the collector, which owns the HTTP executor
//    and the IntegrationCheck pipeline. Saving is the explicit human
//    action that turns the AI draft into a scheduled check.
//  • Browser specs are constrained out at generation time; the
//    collector additionally answers any browser spec with a structured
//    `not_supported` payload instead of a 5xx.

const FROM_PROMPT_RATE_LIMIT = { capacity: 5, refillMs: 30_000 };

integrationsRouter.post("/from-prompt", async (req, res, next) => {
  try {
    await assertEnterpriseLicense("ai");

    const tenantId = tenantOf(req);
    if (!consumeToken(tenantId, "automated_check_generation", FROM_PROMPT_RATE_LIMIT)) {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many check-generation requests. Please retry in a moment.",
        },
      });
      return;
    }

    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt : "";

    try {
      const generated = await generateCheckSpec({ tenantId, prompt });

      await audit(req, "create", "IntegrationAICheckSpec", undefined, {
        feature: "automated_check_generation",
        outcome: "generated",
        runner: generated.runner,
        model: generated.modelUsed,
        providerSource: generated.providerSource,
        promptLength: prompt.length,
      });

      res.json({ success: true, data: generated });
    } catch (err) {
      if (err instanceof UnsafePromptError) {
        await audit(req, "reject", "IntegrationAICheckSpec", undefined, {
          feature: "automated_check_generation",
          outcome: "unsafe_prompt",
          matched: err.matched,
        });
        res.status(400).json({
          success: false,
          error: { code: err.code, message: err.message },
        });
        return;
      }
      if (err instanceof BrowserCheckUnavailableError) {
        await audit(req, "reject", "IntegrationAICheckSpec", undefined, {
          feature: "automated_check_generation",
          outcome: "browser_not_available",
        });
        res.status(422).json({
          success: false,
          error: { code: err.code, message: err.message },
        });
        return;
      }
      if (err instanceof GeneratedSpecInvalidError) {
        await audit(req, "reject", "IntegrationAICheckSpec", undefined, {
          feature: "automated_check_generation",
          outcome: "invalid_spec",
        });
        res.status(422).json({
          success: false,
          error: { code: err.code, message: err.message, details: err.issues },
        });
        return;
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

// Ad-hoc "Test before save". Pure execution — collector-owned, no LLM
// involved, so no EE gate (mirrors running a saved check).
integrationsRouter.post("/from-prompt/test", (req, res) => proxy(req, res, "/checks/test"));

integrationsRouter.post("/from-prompt/save", async (req, res, next) => {
  try {
    const result = await forwardToCollector({
      req,
      tenantId: tenantOf(req),
      method: "POST",
      path: "/checks/from-prompt/save",
      body: req.body,
    });

    if (result.status === 201) {
      const saved = (result.body as { data?: { id?: string; title?: string } })?.data;
      await audit(req, "create", "IntegrationCheck", saved?.id, {
        feature: "automated_check_generation",
        outcome: "saved",
        title: saved?.title,
        runner: "http",
      });
    }

    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
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

// ── Checks & results ────────────────────────────────────────────────
//
// `:id` is the collector IntegrationConnection id. The collector knows
// bindings only as opaque `controlId` strings, so for the checks list
// the gateway enriches each binding with the tenant's real Control
// title before returning it to the browser.

interface CollectorCheckWire {
  controls?: Array<{ control: { id: string; title: string } }>;
  [key: string]: unknown;
}

integrationsRouter.get("/:id/checks", async (req, res, next) => {
  try {
    const tenantId = tenantOf(req);
    const result = await forwardToCollector({
      req,
      tenantId,
      method: "GET",
      path: `/connections/${encodeURIComponent(req.params.id ?? "")}/checks`,
    });

    const body = result.body as { success?: boolean; data?: CollectorCheckWire[] } | null;
    if (result.status === 200 && body?.success && Array.isArray(body.data)) {
      const controlIds = [
        ...new Set(body.data.flatMap((check) => (check.controls ?? []).map((c) => c.control.id))),
      ];
      if (controlIds.length > 0) {
        const controls = await prisma.control.findMany({
          where: { id: { in: controlIds }, tenantId },
          select: { id: true, title: true },
        });
        const titleById = new Map(controls.map((c) => [c.id, c.title]));
        for (const check of body.data) {
          check.controls = (check.controls ?? []).map((c) => ({
            control: { id: c.control.id, title: titleById.get(c.control.id) ?? c.control.id },
          }));
        }
      }
    }

    res.status(result.status).json(result.body);
  } catch (err) {
    next(err);
  }
});

integrationsRouter.post("/:id/checks/:checkId/run", (req, res) =>
  proxy(
    req,
    res,
    `/connections/${encodeURIComponent(req.params.id ?? "")}/checks/${encodeURIComponent(
      req.params.checkId ?? "",
    )}/run`,
  ),
);

integrationsRouter.get("/:id/results", (req, res) =>
  proxy(req, res, `/connections/${encodeURIComponent(req.params.id ?? "")}/results`),
);
