/**
 * Internal control-binding routes.
 *
 * Service-to-service endpoints used by the collector to translate
 * declarative manifest `FrameworkRef`s into the tenant's actual
 * `Control` ids. The resolver is the heart of the unified binding
 * pipeline: every other consumer (binder, reconciler, agent
 * tool-suggester) goes through this single function so the
 * "framework requirement → tenant control" mapping has exactly one
 * canonical implementation.
 *
 * Auth + tenant scoping is handled by `internalRouter`'s shared
 * middleware (HMAC service signature + `X-Organization-Id` header).
 */

import { Router, type Request } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma.js";

/**
 * One framework reference as declared in a manifest. `framework` must
 * resolve to a `FrameworkType` enum value; `requirement` must match
 * a `Requirement.identifier` for that framework.
 */
const FrameworkRefBody = z.object({
  framework: z.string().min(1),
  requirement: z.string().min(1),
  note: z.string().optional(),
});

const resolveBody = z.object({
  refs: z.array(FrameworkRefBody).max(500),
});

export interface ResolvedRef {
  framework: string;
  requirement: string;
  requirementId: string | null;
  requirementTitle: string | null;
  /** Tenant `Control` ids that this ref currently resolves to. */
  controlIds: string[];
  /** Why the ref returned no controlIds (only present when controlIds = []). */
  reason?:
    | "framework_not_seeded"
    | "framework_not_enabled"
    | "requirement_not_seeded"
    | "no_control_assignments"
    | "controls_not_applicable";
}

export const controlBindingRouter: Router = Router();

/**
 * POST /internal/controls/resolve-framework-refs
 *
 * Body: { refs: [{ framework, requirement, note? }, ...] }
 * Returns: { refs: [{ framework, requirement, requirementId, requirementTitle, controlIds, reason? }, ...] }
 *
 * Each input ref is returned in the same order with its resolution.
 * Refs that don't match any seeded framework / requirement return
 * `controlIds: []` plus a `reason` explaining why — *not* an error,
 * because manifests are written against the public framework catalog
 * and a given tenant may simply not have adopted that framework yet.
 */
controlBindingRouter.post("/resolve-framework-refs", async (req, res, next) => {
  try {
    const tenantId = (req as Request & { tenantId: string }).tenantId;
    const { refs } = resolveBody.parse(req.body);

    if (refs.length === 0) {
      res.json({ success: true, data: { refs: [] } });
      return;
    }

    const resolved = await resolveFrameworkRefs(tenantId, refs);
    res.json({ success: true, data: { refs: resolved } });
  } catch (err) {
    next(err);
  }
});

/**
 * Resolves a batch of FrameworkRefs against the tenant's catalog +
 * adoption state. Exposed so other API modules (e.g. the LLM
 * `from-prompt` flow, dashboards) can reuse the same logic without
 * round-tripping the internal HTTP endpoint.
 */
export async function resolveFrameworkRefs(
  tenantId: string,
  refs: ReadonlyArray<{ framework: string; requirement: string }>,
): Promise<ResolvedRef[]> {
  if (refs.length === 0) return [];

  // 1. Look up every Framework row mentioned across the refs in one
  //    query. The manifest `framework` field is the `frameworkType`
  //    enum string (e.g. "soc2"); we match on that and not the
  //    cuid-style `Framework.id` because manifests are authored
  //    against the public catalog, not per-deploy DB ids.
  const distinctFrameworkSlugs = [...new Set(refs.map((r) => r.framework))];
  const frameworks = await prisma.framework.findMany({
    where: { frameworkType: { in: distinctFrameworkSlugs as never[] } },
    select: { id: true, frameworkType: true, name: true },
  });
  const frameworkBySlug = new Map(frameworks.map((f) => [String(f.frameworkType), f]));

  // 2. Fetch matching Requirement rows in one query, scoped to the
  //    relevant frameworkIds. The composite predicate would be
  //    `(frameworkId, identifier) IN (...)` if Prisma supported it;
  //    we approximate with an OR query and dedupe in memory below.
  const requirementPredicates = refs
    .map((ref) => {
      const fw = frameworkBySlug.get(ref.framework);
      if (!fw) return null;
      return { frameworkId: fw.id, identifier: ref.requirement };
    })
    .filter((p): p is { frameworkId: string; identifier: string } => p !== null);

  const requirements = requirementPredicates.length
    ? await prisma.requirement.findMany({
        where: { OR: requirementPredicates },
        select: { id: true, frameworkId: true, identifier: true, title: true },
      })
    : [];
  const requirementByKey = new Map(
    requirements.map((r) => [`${r.frameworkId}::${r.identifier}`, r]),
  );

  // 3. Resolve ControlRequirementAssignments for the tenant, filtered
  //    to enabled FrameworkInstances. A Control is only "reachable"
  //    if it (a) belongs to this tenant, (b) is mapped to one of the
  //    refs' requirements, (c) is not in `not_applicable` status, and
  //    (d) belongs to a `FrameworkInstance.isEnabled = true` row.
  const requirementIds = requirements.map((r) => r.id);
  const assignments = requirementIds.length
    ? await prisma.controlRequirementAssignment.findMany({
        where: {
          tenantId,
          requirementId: { in: requirementIds },
          frameworkInstance: { isEnabled: true },
          control: { status: { not: "not_applicable" } },
        },
        select: {
          requirementId: true,
          controlId: true,
          frameworkInstance: { select: { isEnabled: true } },
        },
      })
    : [];

  const controlIdsByRequirementId = new Map<string, Set<string>>();
  for (const a of assignments) {
    const set = controlIdsByRequirementId.get(a.requirementId) ?? new Set<string>();
    set.add(a.controlId);
    controlIdsByRequirementId.set(a.requirementId, set);
  }

  // 4. Surface "controls exist but are all not_applicable" so the
  //    binder can record a precise reason. We do this with a second
  //    cheap query keyed on the requirement ids that produced no
  //    enabled assignments.
  const requirementsWithoutEnabledControls = requirementIds.filter(
    (id) => !controlIdsByRequirementId.has(id),
  );
  const naAssignmentSet = new Set<string>();
  if (requirementsWithoutEnabledControls.length) {
    const naRows = await prisma.controlRequirementAssignment.findMany({
      where: {
        tenantId,
        requirementId: { in: requirementsWithoutEnabledControls },
      },
      select: { requirementId: true },
    });
    for (const r of naRows) naAssignmentSet.add(r.requirementId);
  }

  return shapeResolvedRefs(refs, {
    frameworkBySlug: new Map([...frameworkBySlug.entries()].map(([k, v]) => [k, { id: v.id }])),
    requirementByKey: new Map(
      [...requirementByKey.entries()].map(([k, v]) => [k, { id: v.id, title: v.title }]),
    ),
    controlIdsByRequirementId,
    naAssignmentSet,
  });
}

/**
 * Pure response-shaping step extracted from `resolveFrameworkRefs` so
 * the resolver's branching logic (which `reason` to surface, how to
 * preserve input order) is unit-testable without spinning up Prisma.
 *
 * The caller provides the already-resolved lookup maps; this function
 * just walks the input refs and projects them into the wire shape.
 */
export interface ResolverLookups {
  frameworkBySlug: Map<string, { id: string }>;
  requirementByKey: Map<string, { id: string; title: string }>;
  controlIdsByRequirementId: Map<string, Set<string>>;
  naAssignmentSet: Set<string>;
}

export function shapeResolvedRefs(
  refs: ReadonlyArray<{ framework: string; requirement: string }>,
  lookups: ResolverLookups,
): ResolvedRef[] {
  return refs.map((ref): ResolvedRef => {
    const fw = lookups.frameworkBySlug.get(ref.framework);
    if (!fw) {
      return {
        framework: ref.framework,
        requirement: ref.requirement,
        requirementId: null,
        requirementTitle: null,
        controlIds: [],
        reason: "framework_not_seeded",
      };
    }
    const req = lookups.requirementByKey.get(`${fw.id}::${ref.requirement}`);
    if (!req) {
      return {
        framework: ref.framework,
        requirement: ref.requirement,
        requirementId: null,
        requirementTitle: null,
        controlIds: [],
        reason: "requirement_not_seeded",
      };
    }
    const controlIds = [...(lookups.controlIdsByRequirementId.get(req.id) ?? new Set<string>())];
    if (controlIds.length === 0) {
      return {
        framework: ref.framework,
        requirement: ref.requirement,
        requirementId: req.id,
        requirementTitle: req.title,
        controlIds: [],
        reason: lookups.naAssignmentSet.has(req.id)
          ? "controls_not_applicable"
          : "no_control_assignments",
      };
    }
    return {
      framework: ref.framework,
      requirement: ref.requirement,
      requirementId: req.id,
      requirementTitle: req.title,
      controlIds,
    };
  });
}
