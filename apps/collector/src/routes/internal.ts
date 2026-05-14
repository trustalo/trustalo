/**
 * Service-to-service routes called by the API. Authenticated via an
 * HMAC-signed request (with legacy `X-Internal-Key` accepted during
 * rollout) plus an explicit `X-Organization-Id` header.
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { providerRegistry } from "../integrations/core/registry.js";
import { createAndQueueAgentRun, getAgentRun, listAgentRuns } from "../agent/agent-runner.js";
import { requireServiceAuth } from "../lib/service-auth.js";

interface InternalRequest extends Request {
  tenantId: string;
}

function requireOrgHeader(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.headers["x-organization-id"];
  if (typeof tenantId !== "string" || !tenantId) {
    res.status(400).json({
      success: false,
      error: { code: "MISSING_ORG", message: "X-Organization-Id header is required" },
    });
    return;
  }
  (req as InternalRequest).tenantId = tenantId;
  next();
}

export const internalRouter: Router = Router();
internalRouter.use(requireServiceAuth());
internalRouter.use(requireOrgHeader);

// ── Connections summary used by the agent tool picker ──────────────

internalRouter.get("/connections", async (req, res, next) => {
  try {
    const tenantId = (req as InternalRequest).tenantId;
    const connections = await prisma.integrationConnection.findMany({
      where: { tenantId, isActive: true },
      // `Integration.id` IS the slug, so we select id + the rest. The
      // outgoing wire format still uses the `slug` key for backwards
      // compatibility with API clients pinned to the old schema.
      include: { integration: { select: { id: true, name: true, category: true } } },
      orderBy: { createdAt: "desc" },
    });

    const data = connections.map((c) => {
      const provider = providerRegistry.get(c.integration.id);
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        isActive: c.isActive,
        provider: {
          slug: c.integration.id,
          name: c.integration.name,
          category: c.integration.category,
          capabilities: provider?.capabilities ?? [],
        },
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ── Evidence-agent runs ────────────────────────────────────────────

const createAgentRunBody = z.object({
  controlId: z.string().min(1),
  controlTitle: z.string().nullable().optional(),
  instructions: z.string().min(1),
  toolConnectionIds: z.array(z.string().min(1)).min(1),
  ai: z.object({
    provider: z.string().min(1),
    model: z.string().min(1),
    credentials: z.record(z.string(), z.unknown()),
  }),
  trigger: z.enum(["manual", "scheduled", "api"]).optional(),
});

internalRouter.post("/agent-runs", async (req, res, next) => {
  try {
    const tenantId = (req as InternalRequest).tenantId;
    const body = createAgentRunBody.parse(req.body);

    const run = await createAndQueueAgentRun({
      tenantId,
      controlId: body.controlId,
      controlTitle: body.controlTitle ?? null,
      instructions: body.instructions,
      toolConnectionIds: body.toolConnectionIds,
      ai: body.ai,
      trigger: body.trigger ?? "api",
    });

    res.status(202).json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
});

internalRouter.get("/agent-runs", async (req, res, next) => {
  try {
    const tenantId = (req as InternalRequest).tenantId;
    const controlId = typeof req.query.controlId === "string" ? req.query.controlId : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const runs = await listAgentRuns(tenantId, { controlId, limit });
    res.json({ success: true, data: runs });
  } catch (err) {
    next(err);
  }
});

internalRouter.get("/agent-runs/:id", async (req, res, next) => {
  try {
    const tenantId = (req as unknown as InternalRequest).tenantId;
    const id = z.string().min(1).parse(req.params.id);

    const run = await getAgentRun(tenantId, id);
    if (!run) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Agent run not found" },
      });
      return;
    }
    res.json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
});
