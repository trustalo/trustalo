import { Router } from "express";
import { prismaWithTenant } from "../../db/prisma.js";
import { AuditLog } from "../../mongodb/models/index.js";

export const dashboardsRouter: Router = Router();

dashboardsRouter.get("/overview", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const [
      totalControls,
      policiesCount,
      risksCount,
      vendorsCount,
      assetsCount,
      incidentsCount,
      auditsCount,
      highSeverityRisks,
      evidenceTotal,
      evidenceApproved,
      evidenceExpired,
      frameworkInstances,
      enabledControlsMet,
      enabledControlsTotal,
    ] = await Promise.all([
      db.control.count(),
      db.policy.count(),
      db.risk.count(),
      db.vendor.count(),
      db.asset.count(),
      db.incident.count(),
      db.audit.count(),
      db.risk.count({
        where: { riskScore: { gte: 15 } },
      }),
      db.evidence.count(),
      db.evidence.count({ where: { status: "approved" } }),
      db.evidence.count({
        where: {
          OR: [{ status: "expired" }, { expiresAt: { lt: new Date() } }],
        },
      }),
      db.frameworkInstance.findMany({
        where: { isEnabled: true },
        include: {
          framework: {
            include: { _count: { select: { requirements: true } } },
          },
          controlRequirementAssignments: {
            include: {
              control: { select: { id: true, status: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.control.count({
        where: {
          status: { in: ["implemented", "not_applicable"] },
          controlRequirementAssignments: { some: { frameworkInstance: { isEnabled: true } } },
        },
      }),
      db.control.count({
        where: {
          controlRequirementAssignments: { some: { frameworkInstance: { isEnabled: true } } },
        },
      }),
    ]);

    const frameworkReadiness = frameworkInstances.map((inst) => {
      const uniqueControls = new Map<string, string>();
      for (const rm of inst.controlRequirementAssignments) {
        uniqueControls.set(rm.control.id, rm.control.status);
      }
      const total = uniqueControls.size;
      let met = 0;
      for (const status of uniqueControls.values()) {
        if (status === "implemented" || status === "not_applicable") met++;
      }
      const readiness = total > 0 ? Math.round((met / total) * 100) : 0;

      return {
        instanceId: inst.id,
        frameworkId: inst.framework.id,
        name: inst.framework.name,
        frameworkType: inst.framework.frameworkType,
        status: inst.status,
        readinessPercentage: readiness,
        controlsMet: met,
        totalControls: total,
        totalRequirements: inst.framework._count.requirements,
      };
    });

    const enabledFrameworkTypes = new Set(
      frameworkInstances.map((fi) => fi.framework.frameworkType),
    );

    res.json({
      success: true,
      data: {
        counts: {
          controls: totalControls,
          policies: policiesCount,
          risks: risksCount,
          vendors: vendorsCount,
          assets: assetsCount,
          incidents: incidentsCount,
          audits: auditsCount,
          highSeverityRisks,
        },
        evidence: {
          total: evidenceTotal,
          approved: evidenceApproved,
          expired: evidenceExpired,
          automatedPercentage:
            evidenceTotal > 0 ? Math.round((evidenceApproved / evidenceTotal) * 100) : 0,
        },
        frameworks: {
          total: frameworkInstances.length,
          certified: frameworkInstances.filter((fi) => fi.status === "certified").length,
          readiness: frameworkReadiness,
          overallControlsMet: enabledControlsMet,
          overallControlsTotal: enabledControlsTotal,
        },
        enabledFrameworkTypes: [...enabledFrameworkTypes],
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * AI usage + adoption dashboard.
 *
 * Surfaces, per-feature, how often Trustalo's AI accelerators were
 * invoked over the requested window, and the human accept/reject ratio
 * for advisory suggestions. Source of truth is the MongoDB audit log,
 * which already records every AI generation and decision (see
 * `.cursor/rules/ai-features.mdc` § 2). We never inspect prompts or
 * completions — only counts and decisions — so no PII leaves the audit
 * collection.
 *
 * Query params:
 *   ?days=30    (window in days, 1..365, default 30)
 *
 * Response shape:
 *   {
 *     window: { from, to, days },
 *     features: Array<{
 *       feature, label,
 *       generations, approvals, rejections, edits,
 *       acceptanceRate, // approvals / (approvals + rejections), null if 0
 *     }>,
 *     totals: { generations, approvals, rejections, edits },
 *     daily: Array<{ date, generations, decisions }>,
 *     recent: Array<{ at, feature, action, resourceId, decision, model, provider }>,
 *   }
 */
dashboardsRouter.get("/ai-usage", async (req, res, next) => {
  try {
    const tenantId = (req as unknown as { auth: { tenantId: string } }).auth.tenantId;
    const days = Math.min(Math.max(Number(req.query.days ?? 30) || 30, 1), 365);
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

    // Resource → feature mapping. The audit `resource` field is the canonical
    // way to identify an AI surface (see ai-features.mdc § 2 — convention is
    // `<Domain>AI<Feature>`). When new AI features ship, add them here.
    const FEATURE_MATCH: Array<{
      feature: string;
      label: string;
      resources: string[];
    }> = [
      {
        feature: "policy_generation",
        label: "Policy drafting",
        resources: ["PolicyAIDraft"],
      },
      {
        feature: "risk_scoring",
        label: "Risk scoring",
        resources: ["RiskAIScoreSuggestion"],
      },
      {
        feature: "vendor_scoring",
        label: "Vendor tiering",
        resources: ["VendorAITierSuggestion"],
      },
      {
        feature: "automated_check_generation",
        label: "Automated checks",
        resources: ["IntegrationAICheckSpec"],
      },
      {
        feature: "questionnaire_answering",
        label: "Questionnaire answering",
        resources: ["QuestionnaireAIBulkAnswer", "QuestionnaireAIAnswer", "QuestionnaireAnswer"],
      },
      {
        feature: "trust_center_summary",
        label: "Trust Center summaries",
        resources: ["TrustCenterAISummary"],
      },
    ];

    const allResources = FEATURE_MATCH.flatMap((f) => f.resources);

    const logs = await AuditLog.find({
      tenantId,
      createdAt: { $gte: from, $lte: to },
      resource: { $in: allResources },
    })
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    type Bucket = {
      generations: number;
      approvals: number;
      rejections: number;
      edits: number;
    };

    const featureBuckets = new Map<string, Bucket>();
    for (const f of FEATURE_MATCH) {
      featureBuckets.set(f.feature, { generations: 0, approvals: 0, rejections: 0, edits: 0 });
    }
    const dailyBuckets = new Map<string, { generations: number; decisions: number }>();

    function featureFor(resource: string): string | null {
      for (const f of FEATURE_MATCH) {
        if (f.resources.includes(resource)) return f.feature;
      }
      return null;
    }

    for (const log of logs) {
      const feature = featureFor(log.resource);
      if (!feature) continue;
      const bucket = featureBuckets.get(feature)!;
      const dayKey = new Date(log.createdAt).toISOString().slice(0, 10);
      const day = dailyBuckets.get(dayKey) ?? { generations: 0, decisions: 0 };

      if (log.action === "create") {
        bucket.generations++;
        day.generations++;
      } else if (log.action === "approve") {
        bucket.approvals++;
        day.decisions++;
      } else if (log.action === "reject") {
        bucket.rejections++;
        day.decisions++;
      } else if (log.action === "update") {
        bucket.edits++;
        day.decisions++;
      }

      dailyBuckets.set(dayKey, day);
    }

    const features = FEATURE_MATCH.map((f) => {
      const b = featureBuckets.get(f.feature)!;
      const decided = b.approvals + b.rejections;
      return {
        feature: f.feature,
        label: f.label,
        generations: b.generations,
        approvals: b.approvals,
        rejections: b.rejections,
        edits: b.edits,
        acceptanceRate: decided > 0 ? Math.round((b.approvals / decided) * 100) : null,
      };
    });

    const totals = features.reduce(
      (acc, f) => {
        acc.generations += f.generations;
        acc.approvals += f.approvals;
        acc.rejections += f.rejections;
        acc.edits += f.edits;
        return acc;
      },
      { generations: 0, approvals: 0, rejections: 0, edits: 0 },
    );

    const daily = Array.from(dailyBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    const recent = logs.slice(0, 50).map((log) => {
      const details = (log.details ?? {}) as Record<string, unknown>;
      return {
        at: log.createdAt,
        feature: featureFor(log.resource),
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId ?? null,
        decision: typeof details.decision === "string" ? details.decision : null,
        provider: typeof details.provider === "string" ? details.provider : null,
        model: typeof details.model === "string" ? details.model : null,
      };
    });

    res.json({
      success: true,
      data: {
        window: { from, to, days },
        totals,
        features,
        daily,
        recent,
      },
    });
  } catch (err) {
    next(err);
  }
});
