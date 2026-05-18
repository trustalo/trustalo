import { Router } from "express";
import { z } from "zod";
import { prisma, prismaWithTenant } from "../../db/prisma.js";
import { authorizeResource } from "../../middleware/authorize.js";
import { resolveOrgAI, AINotConfiguredError } from "../../config/ai.js";
import { AI_NOT_CONFIGURED_PUBLIC_MESSAGE } from "@trustalo/ai";
import { assertEnterpriseLicense } from "@trustalo/license";
import {
  CPS234_EVIDENCE_AGENT_PRESETS,
  applyEvidenceAgentPreset,
  findEvidenceAgentPreset,
} from "./evidence-agent-presets.js";
import {
  createAgentRun,
  getAgentRun,
  listAgentRuns,
  listConnectionsForOrg,
  CollectorRequestError,
  respondWithCollectorError,
} from "../../lib/collector-client.js";

const controlStatus = z.enum([
  "not_implemented",
  "partially_implemented",
  "implemented",
  "not_applicable",
]);

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  status: controlStatus.optional(),
  category: z.string().min(1).optional(),
  search: z.string().optional(),
  frameworkId: z.string().min(1).optional(),
  includeNotApplicable: z.enum(["true", "false"]).default("false"),
});

const idParams = z.object({
  id: z.string().min(1),
});

const createBody = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  implementationDetails: z.string().nullable().optional(),
  status: controlStatus.default("not_implemented"),
  category: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  reviewDate: z.coerce.date().nullable().optional(),
});

const updateBody = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  implementationDetails: z.string().nullable().optional(),
  status: controlStatus.optional(),
  category: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  reviewDate: z.coerce.date().nullable().optional(),
  lastReviewedAt: z.coerce.date().nullable().optional(),
});

const mappingsBody = z.object({
  requirementIds: z.array(z.string().min(1)),
});

const controlInclude = {
  owner: { select: { id: true, name: true, email: true } },
  controlRequirementAssignments: {
    include: {
      requirement: {
        include: {
          framework: { select: { id: true, name: true, frameworkType: true } },
        },
      },
    },
  },
  _count: { select: { evidence: true } },
  evidence: {
    select: { id: true, status: true, expiresAt: true },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

export const controlsRouter: Router = Router();
controlsRouter.use(authorizeResource("controls:read", "controls:write"));

controlsRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = listQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {};
    if (query.status) {
      where.status = query.status;
    } else if (query.includeNotApplicable !== "true") {
      where.status = { not: "not_applicable" };
    }
    if (query.category) where.category = query.category;
    if (query.frameworkId) {
      where.controlRequirementAssignments = {
        some: {
          requirement: { frameworkId: query.frameworkId },
          frameworkInstance: { isEnabled: true },
        },
      };
    } else {
      // Only show controls that are unmapped (custom) or belong to at least one enabled framework
      where.OR = [
        { controlRequirementAssignments: { none: {} } },
        { controlRequirementAssignments: { some: { frameworkInstance: { isEnabled: true } } } },
      ];
    }
    if (query.search) {
      const searchFilter = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { category: { contains: query.search, mode: "insensitive" } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchFilter }];
        delete where.OR;
      } else {
        where.OR = searchFilter;
      }
    }

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      db.control.findMany({
        where,
        include: controlInclude,
        orderBy: { updatedAt: "desc" },
        skip,
        take: query.limit,
      }),
      db.control.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page: query.page, limit: query.limit },
    });
  } catch (err) {
    next(err);
  }
});

controlsRouter.get("/categories", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    const frameworkId =
      typeof req.query.frameworkId === "string" ? req.query.frameworkId : undefined;

    const where: Record<string, unknown> = {
      category: { not: null },
      OR: [
        { controlRequirementAssignments: { none: {} } },
        { controlRequirementAssignments: { some: { frameworkInstance: { isEnabled: true } } } },
      ],
    };
    if (frameworkId) {
      where.controlRequirementAssignments = {
        some: { requirement: { frameworkId }, frameworkInstance: { isEnabled: true } },
      };
      delete where.OR;
    }

    const result = await db.control.findMany({
      where,
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });

    const categories = result.map((r: { category: string | null }) => r.category).filter(Boolean);
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

controlsRouter.get("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const control = await db.control.findUnique({
      where: { id },
      include: controlInclude,
    });
    if (!control) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Control not found" },
      });
      return;
    }

    // Inline cross-framework related requirements: deduped count + top 3.
    // Full list is available via /api/v1/frameworks/requirements/:id/mappings.
    const requirementIds = control.controlRequirementAssignments.map((m) => m.requirementId);
    const requirementSelect = {
      id: true,
      identifier: true,
      title: true,
      framework: { select: { id: true, name: true, frameworkType: true } },
    } as const;

    const crossMappings = requirementIds.length
      ? await prisma.frameworkRequirementMapping.findMany({
          where: {
            OR: [
              { sourceRequirementId: { in: requirementIds } },
              { targetRequirementId: { in: requirementIds } },
            ],
          },
          include: {
            sourceRequirement: { select: requirementSelect },
            targetRequirement: { select: requirementSelect },
          },
        })
      : [];

    const ownReqIdSet = new Set(requirementIds);
    const relatedById = new Map<
      string,
      {
        id: string;
        identifier: string;
        title: string;
        framework: { id: string; name: string; frameworkType: string };
        relationship: string;
      }
    >();
    for (const m of crossMappings) {
      const other =
        ownReqIdSet.has(m.sourceRequirementId) && !ownReqIdSet.has(m.targetRequirementId)
          ? m.targetRequirement
          : !ownReqIdSet.has(m.sourceRequirementId)
            ? m.sourceRequirement
            : null;
      if (!other || relatedById.has(other.id)) continue;
      relatedById.set(other.id, { ...other, relationship: m.relationship });
    }

    const related = [...relatedById.values()];
    const enriched = {
      ...control,
      relatedRequirementsCount: related.length,
      relatedRequirements: related.slice(0, 3),
    };

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

controlsRouter.post("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = createBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const control = await db.control.create({
      data: { ...body, tenantId },
      include: controlInclude,
    });
    res.status(201).json({ success: true, data: control });
  } catch (err) {
    next(err);
  }
});

controlsRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = updateBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const control = await db.control.update({
      where: { id },
      data: body,
      include: controlInclude,
    });
    res.json({ success: true, data: control });
  } catch (err) {
    next(err);
  }
});

controlsRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const mappingCount = await db.controlRequirementAssignment.count({ where: { controlId: id } });
    if (mappingCount > 0) {
      res.status(403).json({
        success: false,
        error: {
          code: "PREDEFINED_CONTROL",
          message:
            "Framework controls cannot be deleted. Set the status to Not Applicable instead.",
        },
      });
      return;
    }

    await db.control.delete({ where: { id } });
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

// ─── Requirement Mappings ─────────────────────────────────────

controlsRouter.get("/:id/mappings", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const assignments = await db.controlRequirementAssignment.findMany({
      where: { controlId: id },
      include: {
        requirement: {
          include: {
            framework: { select: { id: true, name: true, frameworkType: true } },
          },
        },
      },
    });

    res.json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
});

controlsRouter.put("/:id/mappings", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id: controlId } = idParams.parse(req.params);
    const { requirementIds } = mappingsBody.parse(req.body);

    const requirements = await prisma.requirement.findMany({
      where: { id: { in: requirementIds } },
      select: { id: true, frameworkId: true },
    });

    const frameworkIds = [...new Set(requirements.map((r) => r.frameworkId))];

    // Auto-create FrameworkInstances for any frameworks not yet adopted
    for (const fwId of frameworkIds) {
      const existing = await prisma.frameworkInstance.findUnique({
        where: {
          tenantId_frameworkId: { tenantId, frameworkId: fwId },
        },
      });
      if (!existing) {
        await prisma.frameworkInstance.create({
          data: { tenantId, frameworkId: fwId },
        });
      }
    }

    const instanceMap = new Map<string, string>();
    const instances = await prisma.frameworkInstance.findMany({
      where: { tenantId, frameworkId: { in: frameworkIds } },
    });
    for (const inst of instances) {
      instanceMap.set(inst.frameworkId, inst.id);
    }

    // Delete existing mappings for this control within this org
    await prisma.controlRequirementAssignment.deleteMany({
      where: { controlId, tenantId },
    });

    // Create new mappings
    if (requirementIds.length > 0) {
      const data = requirements.map((req) => ({
        tenantId,
        controlId,
        requirementId: req.id,
        frameworkInstanceId: instanceMap.get(req.frameworkId)!,
      }));

      await prisma.controlRequirementAssignment.createMany({ data });
    }

    // Return updated control-requirement assignments
    const assignments = await prisma.controlRequirementAssignment.findMany({
      where: { controlId, tenantId },
      include: {
        requirement: {
          include: {
            framework: { select: { id: true, name: true, frameworkType: true } },
          },
        },
      },
    });

    res.json({ success: true, data: assignments });
  } catch (err) {
    next(err);
  }
});

// ─── Evidence-collection config (manual vs agent) ──────────────────
//
// The UI on the control page lets the user pick between adding evidence
// manually (status quo) or delegating to the per-tenant evidence agent.
// The configuration row is created lazily on the first PUT so a control
// has no DB footprint until someone actually opts into the agent flow.

const evidenceCollectionMode = z.enum(["manual", "agent"]);

const evidenceConfigBody = z.object({
  mode: evidenceCollectionMode,
  agentInstructions: z.string().max(8_000).nullable().optional(),
  agentToolConnectionIds: z.array(z.string().min(1)).default([]),
  agentScheduleMinutes: z
    .number()
    .int()
    .min(15)
    .max(60 * 24 * 30)
    .nullable()
    .optional(),
});

const DEFAULT_EVIDENCE_CONFIG = {
  mode: "manual" as const,
  agentInstructions: null as string | null,
  agentToolConnectionIds: [] as string[],
  agentScheduleMinutes: null as number | null,
  agentLastRunAt: null as Date | null,
  agentLastStatus: "idle" as const,
  agentLastRunId: null as string | null,
  agentLastSummary: null as string | null,
};

async function ensureControl(
  tenantId: string,
  controlId: string,
): Promise<{ id: string; title: string } | null> {
  const db = prismaWithTenant(tenantId);
  return db.control.findUnique({
    where: { id: controlId },
    select: { id: true, title: true },
  });
}

// ─── Evidence-agent presets ─────────────────────────────────────────
//
// Read-only catalogue of curated `(agentInstructions,
// suggestedToolKinds, suggestedScheduleMinutes)` tuples so a regulated
// tenant can stand up an evidence agent against (for example) APRA
// CPS 234 Para 28 in one click. Presets live in
// `evidence-agent-presets.ts` and are surfaced here verbatim — no
// per-tenant state.
//
// Mounted BEFORE the `/:id/...` routes so the static path is not
// swallowed by Express' param matching.

const presetsListQuery = z.object({
  frameworkType: z.string().min(1).optional(),
});

controlsRouter.get("/evidence-config/presets", async (req, res, next) => {
  try {
    const query = presetsListQuery.parse(req.query);
    const presets = query.frameworkType
      ? CPS234_EVIDENCE_AGENT_PRESETS.filter((p) => p.frameworkType === query.frameworkType)
      : CPS234_EVIDENCE_AGENT_PRESETS;
    res.json({ success: true, data: { items: presets, total: presets.length } });
  } catch (err) {
    next(err);
  }
});

const applyPresetBody = z.object({
  presetId: z.string().min(1),
});

controlsRouter.post("/:id/evidence-config/apply-preset", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const { presetId } = applyPresetBody.parse(req.body);

    const control = await ensureControl(tenantId, id);
    if (!control) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Control not found" },
      });
      return;
    }

    const preset = findEvidenceAgentPreset(presetId);
    if (!preset) {
      res.status(404).json({
        success: false,
        error: { code: "PRESET_NOT_FOUND", message: `Unknown preset id: ${presetId}` },
      });
      return;
    }

    // Apply is idempotent: we don't write to the DB here — we return
    // the payload the UI should POST back via PUT /evidence-config.
    // This keeps preset application a pure client-side composition
    // step and avoids accidentally clobbering user customisation on a
    // stale "apply" click.
    res.json({
      success: true,
      data: {
        controlId: id,
        preset: {
          id: preset.id,
          label: preset.label,
          citations: preset.citations,
        },
        payload: applyEvidenceAgentPreset(preset),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Mounted before the dynamic `/:id/evidence-config` routes so it does
// not get swallowed by the `:id` param.
controlsRouter.get("/evidence-config/available-tools", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    try {
      const connections = await listConnectionsForOrg(tenantId);
      res.json({ success: true, data: connections });
    } catch (err) {
      if (err instanceof CollectorRequestError) {
        respondWithCollectorError(res, err);
        return;
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

controlsRouter.get("/:id/evidence-config", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const control = await ensureControl(tenantId, id);
    if (!control) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Control not found" },
      });
      return;
    }

    const config = await db.controlEvidenceCollectionConfig.findUnique({
      where: { controlId: id },
    });

    res.json({
      success: true,
      data: config ?? { controlId: id, ...DEFAULT_EVIDENCE_CONFIG },
    });
  } catch (err) {
    next(err);
  }
});

controlsRouter.put("/:id/evidence-config", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = evidenceConfigBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const control = await ensureControl(tenantId, id);
    if (!control) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Control not found" },
      });
      return;
    }

    if (body.mode === "agent") {
      // Evidence Agent is an LLM-driven AI feature gated to the
      // Trustalo Enterprise tier. Block at config-write time so the
      // user sees the upgrade prompt before any runs are scheduled.
      await assertEnterpriseLicense("ai");
      const instructions = body.agentInstructions?.trim();
      if (!instructions) {
        res.status(400).json({
          success: false,
          error: {
            code: "AGENT_INSTRUCTIONS_REQUIRED",
            message: "Agent instructions are required when mode is 'agent'.",
          },
        });
        return;
      }
      if (body.agentToolConnectionIds.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: "AGENT_TOOLS_REQUIRED",
            message: "Select at least one connection the agent can use as a tool.",
          },
        });
        return;
      }
    }

    const data = {
      mode: body.mode,
      agentInstructions: body.agentInstructions ?? null,
      agentToolConnectionIds: body.agentToolConnectionIds,
      agentScheduleMinutes: body.agentScheduleMinutes ?? null,
    };

    const config = await db.controlEvidenceCollectionConfig.upsert({
      where: { controlId: id },
      create: { controlId: id, tenantId, ...data },
      update: data,
    });

    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
});

// ─── Evidence agent: trigger a run ─────────────────────────────────
//
// Fans out to the collector which actually runs the LLM loop. The API
// is the only service that reads AI provider configuration, so it
// resolves credentials here and passes them along the trusted internal
// HTTP channel; the collector encrypts at rest before persisting an
// AgentRun row.

controlsRouter.post("/:id/evidence-config/run", async (req, res, next) => {
  try {
    // The evidence agent invokes an LLM with tool-use — Enterprise-only.
    await assertEnterpriseLicense("ai");
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const control = await ensureControl(tenantId, id);
    if (!control) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Control not found" },
      });
      return;
    }

    const config = await db.controlEvidenceCollectionConfig.findUnique({
      where: { controlId: id },
    });
    if (!config || config.mode !== "agent") {
      res.status(400).json({
        success: false,
        error: {
          code: "AGENT_NOT_CONFIGURED",
          message: "This control is not configured to use the evidence agent.",
        },
      });
      return;
    }
    const instructions = config.agentInstructions?.trim();
    if (!instructions) {
      res.status(400).json({
        success: false,
        error: {
          code: "AGENT_INSTRUCTIONS_REQUIRED",
          message: "Agent instructions are required to run the evidence agent.",
        },
      });
      return;
    }
    if (!config.agentToolConnectionIds.length) {
      res.status(400).json({
        success: false,
        error: {
          code: "AGENT_TOOLS_REQUIRED",
          message: "Select at least one tool/connection before running the evidence agent.",
        },
      });
      return;
    }

    let resolved;
    try {
      resolved = await resolveOrgAI(tenantId, "evidence_agent");
    } catch (err) {
      if (err instanceof AINotConfiguredError) {
        res.status(503).json({
          success: false,
          error: { code: err.code, message: AI_NOT_CONFIGURED_PUBLIC_MESSAGE },
        });
        return;
      }
      throw err;
    }

    let run;
    try {
      run = await createAgentRun(tenantId, {
        controlId: id,
        controlTitle: control.title,
        instructions,
        toolConnectionIds: config.agentToolConnectionIds,
        ai: {
          provider: resolved.provider,
          model: resolved.model,
          credentials: resolved.credentials as unknown as Record<string, unknown>,
        },
      });
    } catch (err) {
      if (err instanceof CollectorRequestError) {
        respondWithCollectorError(res, err);
        return;
      }
      throw err;
    }

    await db.controlEvidenceCollectionConfig.update({
      where: { controlId: id },
      data: {
        agentLastRunId: run.id,
        agentLastStatus:
          run.status === "succeeded" ? "succeeded" : run.status === "failed" ? "failed" : "queued",
        agentLastRunAt: new Date(),
        agentLastSummary: run.summary ?? null,
      },
    });

    res.status(202).json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
});

// ─── Evidence agent: list & inspect past runs ──────────────────────

controlsRouter.get("/:id/evidence-config/runs", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);

    const control = await ensureControl(tenantId, id);
    if (!control) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Control not found" },
      });
      return;
    }

    try {
      const runs = await listAgentRuns(tenantId, { controlId: id, limit });
      res.json({ success: true, data: runs });
    } catch (err) {
      if (err instanceof CollectorRequestError) {
        respondWithCollectorError(res, err);
        return;
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

controlsRouter.get("/:id/evidence-config/runs/:runId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const runId = z.string().min(1).parse(req.params.runId);

    const control = await ensureControl(tenantId, id);
    if (!control) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Control not found" },
      });
      return;
    }

    try {
      const run = await getAgentRun(tenantId, runId);
      if (run.controlId !== id) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Agent run not found for this control" },
        });
        return;
      }
      res.json({ success: true, data: run });
    } catch (err) {
      if (err instanceof CollectorRequestError) {
        respondWithCollectorError(res, err);
        return;
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});
