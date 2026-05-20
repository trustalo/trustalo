/**
 * Phase 5 (AI accelerators): AI-suggested risk scoring.
 *
 * Pipeline:
 *   1. Fetch the risk plus a slim view of every other risk in the org.
 *   2. Find the top-N "similar" risks via a deterministic Jaccard
 *      similarity over title + description tokens — gives the LLM a
 *      grounded reference set so it can match the org's existing
 *      scoring conventions instead of inventing its own scale.
 *   3. Pull a small slice of TenantContext (business facts) so
 *      the model knows the company's size/sector for impact framing.
 *   4. Call the LLM with the `risk_scoring` feature so deployments
 *      can route this workload separately from chat.
 *   5. Validate the response against a strict Zod schema and return
 *      `{ likelihood, impact, rationale, similarRiskIds, confidence }`.
 *
 * Constraints:
 *   • Read-only — never mutates the risk. The "Apply" action is a
 *     regular PATCH from the UI; the suggestion endpoint only audits
 *     the generation event. A separate /ai-score-decision endpoint
 *     audits the accept/dismiss/refine choice.
 *   • Confidence is bounded [0,1]. If the model can't confidently
 *     score (insufficient context), it returns confidence < 0.5 and
 *     the UI surfaces a "Low confidence — review carefully" banner.
 */

import { z } from "zod";
import { resolveOrgAI } from "../../config/ai.js";
import { prismaWithTenant } from "../../db/prisma.js";

const SIMILAR_RISK_LIMIT = 8;
const CONTEXT_ROW_LIMIT = 25;

const SuggestionSchema = z.object({
  likelihood: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  rationale: z.string().min(20).max(2000),
  similar_risk_ids: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
  caveats: z.array(z.string()).default([]),
});

export interface RiskScoreSuggestion {
  suggestionId: string;
  riskId: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  rationale: string;
  similarRiskIds: string[];
  confidence: number;
  caveats: string[];
  modelUsed: string;
  providerSource: "operator" | "org" | "feature" | "managed";
  generatedAt: string;
}

export class RiskNotFoundError extends Error {
  readonly code = "RISK_NOT_FOUND";
  constructor(riskId: string) {
    super(`Risk ${riskId} not found in organization`);
  }
}

export async function suggestRiskScore(args: {
  tenantId: string;
  riskId: string;
}): Promise<RiskScoreSuggestion> {
  const db = prismaWithTenant(args.tenantId);

  const risk = await db.risk.findUnique({
    where: { id: args.riskId },
    select: {
      id: true,
      title: true,
      description: true,
      riskImpactDescription: true,
      category: true,
      department: true,
      probabilityScore: true,
      impactScore: true,
      controlDescription: true,
      controlEffectiveness: true,
    },
  });
  if (!risk) throw new RiskNotFoundError(args.riskId);

  // All other risks for similarity grounding. Capped to prevent
  // unbounded growth on large registers; we sort by recency below.
  const peers = await db.risk.findMany({
    where: { id: { not: risk.id }, status: { not: "archived" } },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      probabilityScore: true,
      impactScore: true,
      riskScore: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const similar = rankBySimilarity(risk, peers).slice(0, SIMILAR_RISK_LIMIT);

  const contextRows = await db.tenantContext.findMany({
    where: {
      // Only ground on `active` rows — superseded / archived facts must
      // not influence new risk scores. See Phase 0 of the ongoing AI
      // context plan.
      status: "active",
      category: { in: ["company", "tech_stack", "data_handling", "risk_appetite"] },
    },
    take: CONTEXT_ROW_LIMIT,
    orderBy: { createdAt: "asc" },
    select: { category: true, question: true, answer: true },
  });

  const ai = await resolveOrgAI(args.tenantId, "risk_scoring");

  const systemPrompt = [
    "You are a risk analyst helping score an organisation's risk on a 1-5 likelihood and 1-5 impact scale.",
    "You will be given the target risk, the organisation's other open risks (with their existing scores) and a small set of business facts.",
    "Your job is to suggest a likelihood and impact that is internally consistent with the org's existing scoring patterns — not to propose a new scale.",
    "Hard rules:",
    "1. Output ONLY a single JSON object — no markdown fences, no commentary.",
    "2. likelihood and impact MUST be integers in [1,5].",
    "3. confidence MUST be a number in [0,1]. Use <0.5 when context is thin or the risk is ambiguous.",
    "4. similar_risk_ids MUST be a subset of the IDs you were shown. Cite the closest peers you used as a reference.",
    "5. rationale MUST explain WHY in plain English: which peers anchored the score and what business factors moved it up/down.",
    "6. caveats: short bullet phrases listing assumptions a human reviewer should validate.",
    'Top-level JSON shape: { "likelihood": int, "impact": int, "rationale": string, "similar_risk_ids": string[], "confidence": number, "caveats": string[] }',
  ].join("\n");

  const userPrompt = [
    `# Target risk\n${JSON.stringify(
      {
        id: risk.id,
        title: risk.title,
        description: risk.description ?? "",
        impactDescription: risk.riskImpactDescription ?? "",
        category: risk.category,
        department: risk.department,
        currentLikelihood: risk.probabilityScore,
        currentImpact: risk.impactScore,
        controlDescription: risk.controlDescription ?? "",
        controlEffectiveness: risk.controlEffectiveness,
      },
      null,
      2,
    )}`,
    `# Similar peer risks (top ${similar.length})\n${JSON.stringify(
      similar.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        likelihood: p.probabilityScore,
        impact: p.impactScore,
        score: p.riskScore,
        similarity: p.similarity.toFixed(2),
      })),
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

  // Filter similar IDs to only valid peer IDs we actually showed.
  const peerIds = new Set(similar.map((p) => p.id));
  const filteredSimilar = parsed.similar_risk_ids.filter((id) => peerIds.has(id));

  return {
    suggestionId: cryptoRandomId(),
    riskId: risk.id,
    likelihood: parsed.likelihood,
    impact: parsed.impact,
    riskScore: parsed.likelihood * parsed.impact,
    rationale: parsed.rationale,
    similarRiskIds: filteredSimilar,
    confidence: parsed.confidence,
    caveats: parsed.caveats,
    modelUsed: ai.model,
    providerSource: ai.source,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Internal helpers ──────────────────────────────────────────────

interface PeerLike {
  id: string;
  title: string;
  description: string | null;
  category: string;
  probabilityScore: number;
  impactScore: number;
  riskScore: number;
}

interface RankedPeer extends PeerLike {
  similarity: number;
}

function rankBySimilarity(
  target: { title: string; description: string | null; category: string },
  peers: PeerLike[],
): RankedPeer[] {
  const targetTokens = tokenize(`${target.title} ${target.description ?? ""}`);
  return peers
    .map((p) => {
      const peerTokens = tokenize(`${p.title} ${p.description ?? ""}`);
      const sim = jaccard(targetTokens, peerTokens);
      // Same-category peers are inherently more comparable; small bonus.
      const adjusted = p.category === target.category ? sim + 0.1 : sim;
      return { ...p, similarity: adjusted };
    })
    .filter((p) => p.similarity > 0.05)
    .sort((a, b) => b.similarity - a.similarity);
}

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "is",
  "are",
  "was",
  "were",
  "of",
  "to",
  "in",
  "on",
  "at",
  "for",
  "with",
  "by",
  "from",
  "as",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "will",
  "would",
  "could",
  "should",
  "may",
  "risk",
  "risks",
  "potential",
  "may",
  "might",
  "can",
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersect = 0;
  for (const t of a) if (b.has(t)) intersect++;
  const union = a.size + b.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

function cryptoRandomId(): string {
  // 16 random bytes → 22-char base64 (URL-safe). Sufficient as a
  // suggestion correlation ID for audit logs; not used for security.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}
