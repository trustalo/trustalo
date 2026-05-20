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
    const db = prismaWithTenant(tenantId);
    const days = Math.min(Math.max(Number(req.query.days ?? 30) || 30, 1), 365);
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    const monthStart = new Date(to.getFullYear(), to.getMonth(), 1);

    // Canonical labels shown in the dashboard.
    const FEATURE_LABELS: Record<string, string> = {
      chat_assistant: "Compliance assistant chat",
      context_extraction: "Context extraction",
      questionnaire_answering: "Questionnaire answering",
      policy_generation: "Policy drafting",
      risk_scoring: "Risk scoring",
      vendor_scoring: "Vendor tiering",
      automated_check_generation: "Automated checks",
      evidence_agent: "Evidence agent",
      quiz_generation: "Training quiz generation",
      trust_center_summary: "Trust Center summaries",
      vendor_research: "Vendor research",
    };

    // Audit resources still matter for human decision metrics
    // (approve/reject/update). Generation counts are now sourced from
    // LiteLLM spend events (actual LLM calls) when available.
    const AUDIT_RESOURCE_TO_FEATURE: Record<string, string> = {
      PolicyAIDraft: "policy_generation",
      RiskAIScoreSuggestion: "risk_scoring",
      VendorAITierSuggestion: "vendor_scoring",
      IntegrationAICheckSpec: "automated_check_generation",
      QuestionnaireAIBulkAnswer: "questionnaire_answering",
      QuestionnaireAIAnswer: "questionnaire_answering",
      QuestionnaireAnswer: "questionnaire_answering",
      TrustCenterAISummary: "trust_center_summary",
      OrganizationContextAIProposal: "context_extraction",
      OrganizationContextAIConfirmation: "context_extraction",
      ChatAIAssistantTurn: "chat_assistant",
    };

    const logsPromise = AuditLog.find({
      tenantId,
      createdAt: { $gte: from, $lte: to },
      resource: { $in: Object.keys(AUDIT_RESOURCE_TO_FEATURE) },
    })
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    // Graceful fallback: before billing.ee migrations land, older
    // environments won't have `LiteLLMSpendEvent`. In that case, we
    // keep AI Usage alive with audit-only stats instead of failing the
    // whole page. Once migrated, spend-backed metrics auto-enable.
    let usageSource: "spend+audit" | "audit_only" = "spend+audit";
    let spendRows: Array<{
      feature: unknown;
      _count: { _all: number };
      _sum: {
        promptTokens: number | null;
        completionTokens: number | null;
        rawCostMicrocents: bigint | null;
        markedUpMicrocents: bigint | null;
      };
    }> = [];
    let spendEvents: Array<{
      occurredAt: Date;
      feature: unknown;
      model: string;
      promptTokens: number;
      completionTokens: number;
      rawCostMicrocents: bigint;
      markedUpMicrocents: bigint;
    }> = [];
    let currentMonthCreditsUsedMicrocents: bigint | null = null;
    let currentMonthCalls: number | null = null;

    try {
      const [rows, events, monthAgg] = await Promise.all([
        db.liteLLMSpendEvent.groupBy({
          by: ["feature"],
          where: { occurredAt: { gte: from, lte: to } },
          _count: { _all: true },
          _sum: {
            promptTokens: true,
            completionTokens: true,
            rawCostMicrocents: true,
            markedUpMicrocents: true,
          },
        }),
        db.liteLLMSpendEvent.findMany({
          where: { occurredAt: { gte: from, lte: to } },
          orderBy: { occurredAt: "desc" },
          take: 5000,
          select: {
            occurredAt: true,
            feature: true,
            model: true,
            promptTokens: true,
            completionTokens: true,
            rawCostMicrocents: true,
            markedUpMicrocents: true,
          },
        }),
        db.liteLLMSpendEvent.aggregate({
          where: { occurredAt: { gte: monthStart, lte: to } },
          _count: { _all: true },
          _sum: { markedUpMicrocents: true },
        }),
      ]);
      spendRows = rows;
      spendEvents = events;
      currentMonthCreditsUsedMicrocents = monthAgg._sum.markedUpMicrocents ?? 0n;
      currentMonthCalls = monthAgg._count._all;
    } catch (err) {
      if (!isMissingLiteLLMSpendTable(err)) throw err;
      usageSource = "audit_only";
      spendRows = [];
      spendEvents = [];
      currentMonthCreditsUsedMicrocents = null;
      currentMonthCalls = null;
    }

    const logs = await logsPromise;

    type Bucket = {
      generations: number;
      approvals: number;
      rejections: number;
      edits: number;
      promptTokens: number;
      completionTokens: number;
      rawCostMicrocents: bigint;
      billedMicrocents: bigint;
    };

    const featureBuckets = new Map<string, Bucket>();
    const knownFeatures = new Set<string>([
      ...Object.keys(FEATURE_LABELS),
      ...spendRows.map((r) => String(r.feature)),
      ...Object.values(AUDIT_RESOURCE_TO_FEATURE),
    ]);
    for (const feature of knownFeatures) {
      featureBuckets.set(feature, {
        generations: 0,
        approvals: 0,
        rejections: 0,
        edits: 0,
        promptTokens: 0,
        completionTokens: 0,
        rawCostMicrocents: 0n,
        billedMicrocents: 0n,
      });
    }
    const dailyBuckets = new Map<string, { generations: number; decisions: number }>();

    function featureForAuditResource(resource: string): string | null {
      return AUDIT_RESOURCE_TO_FEATURE[resource] ?? null;
    }

    // 1) Actual LLM call usage from spend events (primary source).
    for (const row of spendRows) {
      const feature = String(row.feature);
      const bucket = featureBuckets.get(feature);
      if (!bucket) continue;
      bucket.generations = row._count._all;
      bucket.promptTokens = row._sum.promptTokens ?? 0;
      bucket.completionTokens = row._sum.completionTokens ?? 0;
      bucket.rawCostMicrocents = row._sum.rawCostMicrocents ?? 0n;
      bucket.billedMicrocents = row._sum.markedUpMicrocents ?? 0n;
    }

    for (const ev of spendEvents) {
      const dayKey = new Date(ev.occurredAt).toISOString().slice(0, 10);
      const day = dailyBuckets.get(dayKey) ?? { generations: 0, decisions: 0 };
      day.generations++;
      dailyBuckets.set(dayKey, day);
    }

    // 2) Human decision + fallback generation metrics from audit logs.
    for (const log of logs) {
      const feature = featureForAuditResource(log.resource);
      if (!feature) continue;
      const bucket = featureBuckets.get(feature)!;
      const dayKey = new Date(log.createdAt).toISOString().slice(0, 10);
      const day = dailyBuckets.get(dayKey) ?? { generations: 0, decisions: 0 };

      if (log.action === "create") {
        // Fallback for non-LiteLLM paths: if no spend row exists for this
        // feature in the window, infer generation count from audit.
        if (bucket.generations === 0) {
          bucket.generations++;
          day.generations++;
        }
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

    const features = Array.from(featureBuckets.entries()).map(([feature, b]) => {
      const decided = b.approvals + b.rejections;
      return {
        feature,
        label: FEATURE_LABELS[feature] ?? feature,
        generations: b.generations,
        approvals: b.approvals,
        rejections: b.rejections,
        edits: b.edits,
        promptTokens: b.promptTokens,
        completionTokens: b.completionTokens,
        rawCostMicrocents: b.rawCostMicrocents.toString(),
        billedMicrocents: b.billedMicrocents.toString(),
        acceptanceRate: decided > 0 ? Math.round((b.approvals / decided) * 100) : null,
      };
    });

    const totals = features.reduce(
      (acc, f) => {
        acc.generations += f.generations;
        acc.approvals += f.approvals;
        acc.rejections += f.rejections;
        acc.edits += f.edits;
        acc.promptTokens += f.promptTokens;
        acc.completionTokens += f.completionTokens;
        acc.rawCostMicrocents += BigInt(f.rawCostMicrocents);
        acc.billedMicrocents += BigInt(f.billedMicrocents);
        return acc;
      },
      {
        generations: 0,
        approvals: 0,
        rejections: 0,
        edits: 0,
        promptTokens: 0,
        completionTokens: 0,
        rawCostMicrocents: 0n,
        billedMicrocents: 0n,
      },
    );

    const daily = Array.from(dailyBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v }));

    const recent = logs.slice(0, 50).map((log) => {
      const details = (log.details ?? {}) as Record<string, unknown>;
      return {
        at: log.createdAt,
        feature: featureForAuditResource(log.resource),
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId ?? null,
        decision: typeof details.decision === "string" ? details.decision : null,
        provider: typeof details.provider === "string" ? details.provider : null,
        model: typeof details.model === "string" ? details.model : null,
      };
    });
    const recentLlm = spendEvents.slice(0, 50).map((ev) => ({
      at: ev.occurredAt,
      feature: String(ev.feature),
      action: "call",
      resource: "LiteLLMSpendEvent",
      resourceId: null,
      decision: null,
      provider: "litellm",
      model: ev.model,
    }));
    const mergedRecent = [...recentLlm, ...recent]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 50);

    res.json({
      success: true,
      data: {
        window: { from, to, days },
        usageSource,
        currentMonthCredits: {
          from: monthStart,
          to,
          available: usageSource === "spend+audit",
          billedMicrocents:
            currentMonthCreditsUsedMicrocents == null
              ? null
              : currentMonthCreditsUsedMicrocents.toString(),
          calls: currentMonthCalls,
        },
        totals: {
          ...totals,
          rawCostMicrocents: totals.rawCostMicrocents.toString(),
          billedMicrocents: totals.billedMicrocents.toString(),
        },
        features,
        daily,
        recent: mergedRecent,
      },
    });
  } catch (err) {
    next(err);
  }
});

function isMissingLiteLLMSpendTable(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const maybe = err as { code?: string; message?: string };
  if (maybe.code === "P2021") return true; // relation/table does not exist
  return (
    typeof maybe.message === "string" &&
    maybe.message.includes("LiteLLMSpendEvent") &&
    maybe.message.includes("does not exist")
  );
}
