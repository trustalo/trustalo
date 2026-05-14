/**
 * Phase 5 (AI accelerators): AI-suggested vendor risk tier.
 *
 * Returns a tier in {critical, high, medium, low} with a rationale and
 * the factors that drove the recommendation. Inputs the model sees:
 *
 *   • Vendor metadata (name, description, category, data flags)
 *   • Most recent VendorResearch summary + scores (if any)
 *   • The org's other vendors at each tier (so the model can match
 *     the customer's risk-appetite calibration instead of inventing
 *     a generic Vanta/Drata-style scale)
 *   • A small slice of TenantContext for risk-appetite signals
 *
 * Read-only — never mutates the vendor. The "Apply" action is a regular
 * PATCH; this endpoint only audits the generation event. A separate
 * /ai-tier-decision endpoint audits the accept/dismiss/refine choice.
 */

import { z } from "zod";
import { resolveOrgAI } from "../../config/ai.js";
import { prismaWithTenant } from "../../db/prisma.js";

const PEER_LIMIT_PER_TIER = 4;
const CONTEXT_ROW_LIMIT = 15;

const TierSchema = z.enum(["critical", "high", "medium", "low"]);

const SuggestionSchema = z.object({
  tier: TierSchema,
  rationale: z.string().min(20).max(2000),
  factors: z.array(z.string()).min(1).max(10),
  confidence: z.number().min(0).max(1).default(0.5),
  caveats: z.array(z.string()).default([]),
});

export interface VendorTierSuggestion {
  suggestionId: string;
  vendorId: string;
  tier: "critical" | "high" | "medium" | "low";
  rationale: string;
  factors: string[];
  confidence: number;
  caveats: string[];
  modelUsed: string;
  providerSource: "operator" | "org" | "feature";
  generatedAt: string;
}

export class VendorNotFoundError extends Error {
  readonly code = "VENDOR_NOT_FOUND";
  constructor(vendorId: string) {
    super(`Vendor ${vendorId} not found in organization`);
  }
}

export async function suggestVendorTier(args: {
  tenantId: string;
  vendorId: string;
}): Promise<VendorTierSuggestion> {
  const db = prismaWithTenant(args.tenantId);

  const vendor = await db.vendor.findUnique({
    where: { id: args.vendorId },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      website: true,
      riskTier: true,
      dataProcessing: true,
      isSubprocessor: true,
      subprocessorPurpose: true,
      dataTypesShared: true,
      dataLocations: true,
      dpaStatus: true,
      knownVendor: {
        select: {
          overallScore: true,
          certifications: true,
          industries: true,
        },
      },
      researches: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          overallScore: true,
          securityScore: true,
          complianceScore: true,
          reputationScore: true,
          financialScore: true,
          summary: true,
          recommendations: true,
          dataBreaches: true,
          certifications: true,
        },
      },
    },
  });
  if (!vendor) throw new VendorNotFoundError(args.vendorId);

  // Peer vendors per tier — gives the LLM the org's calibration.
  const peerTiers = await Promise.all(
    (["critical", "high", "medium", "low"] as const).map(async (tier) => {
      const rows = await db.vendor.findMany({
        where: { riskTier: tier, id: { not: vendor.id } },
        take: PEER_LIMIT_PER_TIER,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          category: true,
          dataProcessing: true,
          isSubprocessor: true,
        },
      });
      return [tier, rows] as const;
    }),
  );

  const contextRows = await db.tenantContext.findMany({
    where: {
      // `status: "active"` excludes superseded / archived facts so the
      // model isn't grounded on stale answers (e.g. "we used to host on
      // us-east-1" after a region migration). Pre-Phase-0 rows are
      // backfilled as `active` by the ongoing_context_v1 migration.
      status: "active",
      category: { in: ["company", "data_handling", "risk_appetite"] },
    },
    take: CONTEXT_ROW_LIMIT,
    orderBy: { createdAt: "asc" },
    select: { category: true, question: true, answer: true },
  });

  const ai = await resolveOrgAI(args.tenantId, "vendor_scoring");

  const systemPrompt = [
    "You are a third-party risk analyst recommending a vendor risk tier from {critical, high, medium, low}.",
    "You will be given the target vendor, peer vendors already classified at each tier (the org's calibration) and a small set of business facts.",
    "Your job is to match the org's existing tiering pattern — not to invent a new rubric.",
    "Hard rules:",
    "1. Output ONLY a single JSON object — no markdown fences, no commentary.",
    "2. tier MUST be one of: critical, high, medium, low.",
    "3. confidence MUST be a number in [0,1]. Use <0.5 when context is thin.",
    "4. factors MUST be 1-10 short bullet phrases (e.g. 'Processes PII', 'Sub-processor for production data', 'No SOC 2 report on file').",
    "5. rationale MUST cite which peer vendors anchored the decision.",
    "6. caveats: short bullet phrases listing assumptions a human reviewer should validate.",
    'Top-level JSON shape: { "tier": "critical|high|medium|low", "rationale": string, "factors": string[], "confidence": number, "caveats": string[] }',
  ].join("\n");

  const latestResearch = vendor.researches[0] ?? null;

  const userPrompt = [
    `# Target vendor\n${JSON.stringify(
      {
        id: vendor.id,
        name: vendor.name,
        description: vendor.description ?? "",
        category: vendor.category ?? "",
        currentTier: vendor.riskTier,
        processesData: vendor.dataProcessing,
        isSubprocessor: vendor.isSubprocessor,
        subprocessorPurpose: vendor.subprocessorPurpose ?? "",
        dataTypesShared: vendor.dataTypesShared,
        dataLocations: vendor.dataLocations,
        dpaStatus: vendor.dpaStatus,
        certifications: vendor.knownVendor?.certifications ?? latestResearch?.certifications ?? [],
        industries: vendor.knownVendor?.industries ?? [],
      },
      null,
      2,
    )}`,
    latestResearch
      ? `# Latest deep research\n${JSON.stringify(
          {
            scores: {
              overall: latestResearch.overallScore,
              security: latestResearch.securityScore,
              compliance: latestResearch.complianceScore,
              reputation: latestResearch.reputationScore,
              financial: latestResearch.financialScore,
            },
            summary: latestResearch.summary?.slice(0, 1500) ?? "",
            recommendations: latestResearch.recommendations?.slice(0, 800) ?? "",
            dataBreaches: latestResearch.dataBreaches ?? null,
          },
          null,
          2,
        )}`
      : "# Latest deep research\n(none — flag as caveat)",
    `# Peer vendors per tier\n${JSON.stringify(
      Object.fromEntries(peerTiers.map(([tier, rows]) => [tier, rows])),
      null,
      2,
    )}`,
    `# Business context\n${
      contextRows.length
        ? JSON.stringify(contextRows, null, 2)
        : "(no organisation context captured — flag as caveat)"
    }`,
  ].join("\n\n");

  const completion = await ai.client.chat({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    maxTokens: 800,
    temperature: 0.2,
    responseFormat: "json",
  });

  const cleaned = completion.content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const parsed = SuggestionSchema.parse(JSON.parse(cleaned));

  return {
    suggestionId: cryptoRandomId(),
    vendorId: vendor.id,
    tier: parsed.tier,
    rationale: parsed.rationale,
    factors: parsed.factors,
    confidence: parsed.confidence,
    caveats: parsed.caveats,
    modelUsed: ai.model,
    providerSource: ai.source,
    generatedAt: new Date().toISOString(),
  };
}

function cryptoRandomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}
