import { prismaWithTenant, prisma } from "../../db/prisma.js";
import type {
  ListFrameworksQuery,
  AdoptFrameworkBody,
  UpdateInstanceBody,
  RequirementMappingsQuery,
} from "./validation.js";

export class FrameworkService {
  async listFrameworks(query: ListFrameworksQuery) {
    const { page, limit, type, active } = query;
    const where: Record<string, unknown> = {};
    if (type) where.frameworkType = type;
    if (active !== undefined) where.isActive = active;

    const [items, total] = await Promise.all([
      prisma.framework.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
        include: { _count: { select: { requirements: true } } },
      }),
      prisma.framework.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getFullCatalog() {
    return prisma.framework.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        requirements: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, identifier: true, title: true, category: true },
        },
      },
    });
  }

  async getFrameworkById(id: string) {
    return prisma.framework.findUniqueOrThrow({
      where: { id },
      include: { requirements: { orderBy: { sortOrder: "asc" } } },
    });
  }

  async getRequirements(frameworkId: string) {
    return prisma.requirement.findMany({
      where: { frameworkId },
      orderBy: { sortOrder: "asc" },
    });
  }

  async adoptFramework(tenantId: string, body: AdoptFrameworkBody) {
    const framework = await prisma.framework.findUniqueOrThrow({
      where: { id: body.frameworkId },
      include: { requirements: { orderBy: { sortOrder: "asc" } } },
    });

    const result = await prisma.$transaction(
      async (tx) => {
        const instance = await tx.frameworkInstance.create({
          data: {
            frameworkId: body.frameworkId,
            targetDate: body.targetDate,
            targetMaturityLevel: body.targetMaturityLevel ?? null,
            tenantId,
          },
          include: { framework: true },
        });

        const alreadyMapped = new Set(
          (
            await tx.controlRequirementAssignment.findMany({
              where: {
                tenantId,
                requirementId: { in: framework.requirements.map((r) => r.id) },
              },
              select: { requirementId: true },
            })
          ).map((m) => m.requirementId),
        );

        let controlsCreated = 0;
        for (const req of framework.requirements) {
          if (alreadyMapped.has(req.id)) continue;

          const control = await tx.control.create({
            data: {
              tenantId,
              title: `${req.identifier}: ${req.title}`,
              description: req.description,
              implementationDetails: req.evidenceGuidance,
              category: req.category,
              status: "not_implemented",
            },
          });

          await tx.controlRequirementAssignment.create({
            data: {
              tenantId,
              controlId: control.id,
              requirementId: req.id,
              frameworkInstanceId: instance.id,
            },
          });

          controlsCreated++;
        }

        return { instance, controlsCreated };
      },
      { timeout: 60_000 },
    );

    return {
      ...result.instance,
      controlsCreated: result.controlsCreated,
    };
  }

  async listInstances(tenantId: string) {
    const db = prismaWithTenant(tenantId);
    return db.frameworkInstance.findMany({
      include: { framework: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getInstanceDetail(tenantId: string, instanceId: string) {
    const db = prismaWithTenant(tenantId);
    return db.frameworkInstance.findUniqueOrThrow({
      where: { id: instanceId },
      include: {
        framework: { include: { requirements: { orderBy: { sortOrder: "asc" } } } },
        controlRequirementAssignments: { include: { control: true, requirement: true } },
      },
    });
  }

  async toggleInstance(tenantId: string, instanceId: string, isEnabled: boolean) {
    const db = prismaWithTenant(tenantId);
    return db.frameworkInstance.update({
      where: { id: instanceId },
      data: { isEnabled },
      include: { framework: true },
    });
  }

  async updateInstance(tenantId: string, instanceId: string, body: UpdateInstanceBody) {
    const db = prismaWithTenant(tenantId);
    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.targetDate !== undefined) data.targetDate = body.targetDate;
    if (body.isEnabled !== undefined) data.isEnabled = body.isEnabled;
    if (body.targetMaturityLevel !== undefined) {
      data.targetMaturityLevel = body.targetMaturityLevel;
    }
    if (body.status === "certified") data.certifiedAt = new Date();

    return db.frameworkInstance.update({
      where: { id: instanceId },
      data,
      include: { framework: true },
    });
  }

  async removeInstance(tenantId: string, instanceId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.controlRequirementAssignment.deleteMany({
        where: { tenantId, frameworkInstanceId: instanceId },
      });
      await tx.frameworkInstance.delete({
        where: { id: instanceId, tenantId },
      });
    });

    return { id: instanceId };
  }

  /**
   * Returns each framework instance enriched with readiness stats
   * computed from mapped controls. A control is "met" when its status
   * is "implemented" or "not_applicable".
   *
   * Performance note: an earlier version used a deep `include` that
   * hydrated every control-requirement assignment row plus the joined Control and
   * Requirement records — for a fully-mapped org this fanned out into
   * ~423-id IN clauses for both Control and Requirement on every page
   * load of /frameworks. We now compute the aggregates in two grouped
   * queries against the join table, so the response size and DB work
   * stay constant regardless of how much the org has mapped.
   */
  async listInstancesWithStats(tenantId: string) {
    const db = prismaWithTenant(tenantId);

    type StatusCountRow = {
      frameworkInstanceId: string;
      status: string;
      controls: bigint;
    };
    type RequirementCountRow = {
      frameworkInstanceId: string;
      requirements: bigint;
    };

    const [instances, statusRows, requirementRows] = await Promise.all([
      db.frameworkInstance.findMany({
        include: {
          framework: {
            include: { _count: { select: { requirements: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Distinct controls per (instance, status). One row per status bucket
      // per instance — at most 4 statuses × N instances.
      prisma.$queryRaw<StatusCountRow[]>`
        SELECT
          rm."frameworkInstanceId" AS "frameworkInstanceId",
          c."status"::text         AS status,
          COUNT(DISTINCT rm."controlId") AS controls
        FROM "ControlRequirementAssignment" rm
        JOIN "Control" c ON c."id" = rm."controlId"
        WHERE rm."tenantId" = ${tenantId}
        GROUP BY rm."frameworkInstanceId", c."status"
      `,
      // Distinct requirements per instance. One row per instance.
      prisma.$queryRaw<RequirementCountRow[]>`
        SELECT
          "frameworkInstanceId" AS "frameworkInstanceId",
          COUNT(DISTINCT "requirementId") AS requirements
        FROM "ControlRequirementAssignment"
        WHERE "tenantId" = ${tenantId}
        GROUP BY "frameworkInstanceId"
      `,
    ]);

    type InstanceAgg = { met: number; partial: number; notMet: number; requirementsMapped: number };
    const aggByInstance = new Map<string, InstanceAgg>();

    const ensureAgg = (id: string): InstanceAgg => {
      let agg = aggByInstance.get(id);
      if (!agg) {
        agg = { met: 0, partial: 0, notMet: 0, requirementsMapped: 0 };
        aggByInstance.set(id, agg);
      }
      return agg;
    };

    for (const row of statusRows) {
      const agg = ensureAgg(row.frameworkInstanceId);
      const count = Number(row.controls);
      if (row.status === "implemented" || row.status === "not_applicable") {
        agg.met += count;
      } else if (row.status === "partially_implemented") {
        agg.partial += count;
      } else {
        agg.notMet += count;
      }
    }

    for (const row of requirementRows) {
      ensureAgg(row.frameworkInstanceId).requirementsMapped = Number(row.requirements);
    }

    return instances.map((inst) => {
      const agg = aggByInstance.get(inst.id) ?? {
        met: 0,
        partial: 0,
        notMet: 0,
        requirementsMapped: 0,
      };
      const totalControls = agg.met + agg.partial + agg.notMet;
      const totalRequirements = inst.framework._count.requirements;

      const readinessPercentage =
        totalControls > 0 ? Math.round((agg.met / totalControls) * 100) : 0;

      const {
        framework: { _count, ...framework },
        ...rest
      } = inst;

      return {
        ...rest,
        framework,
        stats: {
          totalControls,
          controlsMet: agg.met,
          controlsInProgress: agg.partial,
          controlsNotMet: agg.notMet,
          totalRequirements,
          requirementsMapped: agg.requirementsMapped,
          readinessPercentage,
        },
      };
    });
  }

  /**
   * Returns catalog frameworks with adoption status for the given org,
   * so the frontend can show which are already adopted.
   */
  async getCatalogWithAdoptionStatus(tenantId: string) {
    const [catalog, adopted] = await Promise.all([
      prisma.framework.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          requirements: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, identifier: true, title: true, category: true },
          },
          _count: { select: { requirements: true } },
        },
      }),
      prisma.frameworkInstance.findMany({
        where: { tenantId },
        select: { frameworkId: true },
      }),
    ]);

    const adoptedIds = new Set(adopted.map((a) => a.frameworkId));

    return catalog.map((fw) => ({
      ...fw,
      isAdopted: adoptedIds.has(fw.id),
      requirementCount: fw._count.requirements,
    }));
  }

  /**
   * Cross-framework requirement mappings — both directions (source ↔ target).
   * Org-agnostic catalog data; safe to expose to any tenant.
   */
  async getRequirementMappings(requirementId: string) {
    const requirementInclude = {
      framework: {
        select: { id: true, name: true, frameworkType: true, version: true },
      },
    } as const;

    const [outgoing, incoming] = await Promise.all([
      prisma.frameworkRequirementMapping.findMany({
        where: { sourceRequirementId: requirementId },
        include: { targetRequirement: { include: requirementInclude } },
      }),
      prisma.frameworkRequirementMapping.findMany({
        where: { targetRequirementId: requirementId },
        include: { sourceRequirement: { include: requirementInclude } },
      }),
    ]);

    const seen = new Set<string>();
    const items = [
      ...outgoing.map((m) => ({
        id: m.id,
        relationship: m.relationship,
        rationale: m.rationale,
        source: m.source,
        direction: "outgoing" as const,
        requirement: m.targetRequirement,
      })),
      ...incoming.map((m) => ({
        id: m.id,
        relationship: m.relationship,
        rationale: m.rationale,
        source: m.source,
        direction: "incoming" as const,
        requirement: m.sourceRequirement,
      })),
    ].filter((item) => {
      const key = `${item.requirement.id}:${item.relationship}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return items;
  }

  /**
   * Bulk mapping query: returns mappings whose source/target frameworks match
   * the supplied filters. Used by the cross-framework coverage widget.
   */
  async listMappings(query: RequirementMappingsQuery) {
    const where: Record<string, unknown> = {};
    if (query.relationship) where.relationship = query.relationship;
    if (query.source) {
      where.sourceRequirement = { framework: { frameworkType: query.source } };
    }
    if (query.target) {
      where.targetRequirement = { framework: { frameworkType: query.target } };
    }

    return prisma.frameworkRequirementMapping.findMany({
      where,
      take: query.limit,
      include: {
        sourceRequirement: {
          select: {
            id: true,
            identifier: true,
            title: true,
            framework: { select: { id: true, name: true, frameworkType: true } },
          },
        },
        targetRequirement: {
          select: {
            id: true,
            identifier: true,
            title: true,
            framework: { select: { id: true, name: true, frameworkType: true } },
          },
        },
      },
    });
  }
}

export const frameworkService = new FrameworkService();
