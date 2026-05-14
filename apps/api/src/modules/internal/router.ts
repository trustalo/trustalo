import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { requireServiceAuth } from "../../lib/service-auth.js";
import { handleInternalDueForResearch } from "../vendors/router.js";

/**
 * Routes invoked by other Trustalo services (currently only the collector)
 * over the trusted internal network. Mounted *outside* the JWT-based
 * `/api/v1/*` namespace so we don't have to lie about user identity in
 * cross-service traffic.
 *
 * All routes require:
 *   - A valid `X-Service-*` HMAC signature (legacy `X-Internal-Key` is
 *     temporarily accepted while collectors are upgraded)
 *   - `X-Organization-Id` carrying the tenant the action belongs to
 */

function requireOrgHeader(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.headers["x-organization-id"];
  if (typeof tenantId !== "string" || !tenantId) {
    res.status(400).json({
      success: false,
      error: { code: "MISSING_ORG", message: "X-Organization-Id header is required" },
    });
    return;
  }
  (req as Request & { tenantId: string }).tenantId = tenantId;
  next();
}

export const internalRouter: Router = Router();

// All routes require an HMAC service signature.
internalRouter.use(requireServiceAuth());

// ── Scheduler routes (cross-tenant by design) ──────────────────────
// These run BEFORE `requireOrgHeader` because the collector scheduler
// enumerates due work across every org; an X-Organization-Id header
// here would be meaningless.
internalRouter.get("/vendors/due-for-research", handleInternalDueForResearch);

// All remaining routes are tenant-scoped — they MUST carry the
// X-Organization-Id header so the handler knows which org to act on.
internalRouter.use(requireOrgHeader);

// ── Evidence agent: bulk submit collected evidence ──────────────────
//
// Called by the collector at the end of an evidence-agent run. The
// agent already knows the controlId (it was passed in when the run was
// created), so the payload is scoped to one control. Each item lands as
// a single Evidence row in `pending_review` so a human still approves
// it before it counts as audit evidence.

const evidenceItem = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  sourceType: z.string().min(1).default("agent"),
  sourceId: z.string().min(1),
  externalUrl: z.string().url().nullable().optional(),
  rawData: z.record(z.string(), z.unknown()).optional(),
  collectedAt: z.coerce.date().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

const agentEvidenceBody = z.object({
  controlId: z.string().min(1),
  agentRunId: z.string().min(1).optional(),
  evidence: z.array(evidenceItem).min(1).max(100),
});

internalRouter.post("/agent-evidence/bulk", async (req, res, next) => {
  try {
    const tenantId = (req as Request & { tenantId: string }).tenantId;
    const body = agentEvidenceBody.parse(req.body);

    const control = await prisma.control.findFirst({
      where: { id: body.controlId, tenantId },
      select: { id: true },
    });
    if (!control) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Control not found in this organization" },
      });
      return;
    }

    const now = new Date();
    const created = await prisma.$transaction(
      body.evidence.map((item) =>
        prisma.evidence.create({
          data: {
            tenantId,
            controlId: body.controlId,
            title: item.title,
            description: item.description ?? null,
            // Agent-collected items are typed as "automated"; the
            // narrative `sourceType` ("github", "aws-iam", ...) is kept
            // in metadata for traceability.
            type: "automated",
            status: "pending_review",
            externalUrl: item.externalUrl ?? null,
            sourceType: item.sourceType,
            sourceId: item.sourceId,
            collectedAt: item.collectedAt ?? now,
            validFrom: item.collectedAt ?? now,
            tags: ["agent"],
            // Cast through unknown — Prisma's `InputJsonValue` is more
            // restrictive than `Record<string, unknown>` (it forbids
            // top-level `undefined`), but our zod schema strips any
            // such values upstream so the cast is safe.
            metadata: {
              ...(item.metadata ?? {}),
              agentRunId: body.agentRunId ?? null,
              rawData: item.rawData ?? null,
            } as unknown as Parameters<typeof prisma.evidence.create>[0]["data"]["metadata"],
          },
          select: { id: true },
        }),
      ),
    );

    res.status(201).json({
      success: true,
      data: { created: created.length, ids: created.map((e) => e.id) },
    });
  } catch (err) {
    next(err);
  }
});
