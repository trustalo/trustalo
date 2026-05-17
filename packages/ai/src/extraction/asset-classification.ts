/**
 * Asset-classification extraction — turn pasted architecture / system /
 * data-flow prose into a list of `(asset, sensitivity, criticality)`
 * proposals to bootstrap the CPS 234 Para 23 information-asset register.
 *
 * Why this is a separate extractor (not just a new category in
 * `from-text.ts`):
 *
 *   • Different output shape — per-asset rows with two enum tiers, not
 *     `(question, answer)` facts. Trying to squash both into one
 *     extractor would force the model to disambiguate between "this
 *     fact" vs "this asset" on every call and produce both lower
 *     quality and harder-to-validate outputs.
 *   • Different review surface — these proposals seed the Asset
 *     register, not the TenantContext review queue.
 *   • Different sensitivity — classification proposals can leak
 *     architecture detail; running the prompt independently makes the
 *     model's outputs easier to scrub and audit.
 *
 * Intentionally mirrors the conventions of `extractContextProposals`:
 * Zod-validated, PII-scrubbed input, partial-rescue on validation
 * failure, capped result size.
 *
 * Tier definitions follow the standard NIST / ISO-27005 pattern that
 * almost every CPS 234-aligned policy adopts:
 *
 *   sensitivity (confidentiality classification):
 *     - Restricted    — Board-only / regulator-only material
 *     - Confidential  — internal use, controlled disclosure
 *     - Internal      — generally accessible inside the org
 *     - Public        — published / no confidentiality concern
 *
 *   criticality (operational impact if unavailable / corrupted):
 *     - Critical — entity-wide outage, customer-impacting
 *     - High     — significant degradation
 *     - Medium   — localised service impact
 *     - Low      — minor / negligible
 */

import { z } from "zod";
import type { AIProvider } from "../types.js";
import { scrubPii } from "./scrub.js";

export const ASSET_SENSITIVITY_TIERS = [
  "Restricted",
  "Confidential",
  "Internal",
  "Public",
] as const;
export type AssetSensitivity = (typeof ASSET_SENSITIVITY_TIERS)[number];

export const ASSET_CRITICALITY_TIERS = ["Critical", "High", "Medium", "Low"] as const;
export type AssetCriticality = (typeof ASSET_CRITICALITY_TIERS)[number];

const AssetClassificationProposalSchema = z.object({
  /** Canonical asset name (≤ 120 chars). e.g. "Customer KYC database". */
  name: z.string().trim().min(2).max(120),
  /** Optional one-sentence description of what the asset does. */
  description: z.string().trim().max(400).optional(),
  sensitivity: z.enum(ASSET_SENSITIVITY_TIERS),
  criticality: z.enum(ASSET_CRITICALITY_TIERS),
  /** Asset type — informational, narrows the picker on review. */
  kind: z
    .enum([
      "data_store",
      "application",
      "infrastructure",
      "endpoint",
      "third_party_service",
      "other",
    ])
    .optional(),
  /** Confidence the model self-assigns (0..1). */
  confidence: z.number().min(0).max(1),
  /** Optional rationale; surfaced in the review card. */
  rationale: z.string().trim().max(400).optional(),
});

const AssetClassificationResultSchema = z.object({
  proposals: z.array(AssetClassificationProposalSchema),
});

export type AssetClassificationProposal = z.infer<typeof AssetClassificationProposalSchema>;
export type AssetClassificationResult = z.infer<typeof AssetClassificationResultSchema>;

export interface ExtractAssetClassificationsInput {
  /** User-supplied prose (architecture doc, RoPA narrative, etc.). */
  text: string;
  /** Override for the upper bound on returned proposals. Default 12. */
  maxProposals?: number;
}

export interface ExtractAssetClassificationsOutput {
  proposals: AssetClassificationProposal[];
  /** Number of proposals the model returned that we dropped on validation. */
  dropped: number;
  redactions: ReturnType<typeof scrubPii>["redactions"];
}

const MAX_PROPOSALS_DEFAULT = 12;
const MAX_PROPOSALS_CEILING = 30;
const MAX_INPUT_CHARS = 12_000;

const SYSTEM_PROMPT = `You are a CPS 234-trained information-security analyst. From a paragraph of architecture or data-flow prose, extract every distinct INFORMATION ASSET the writer mentions and assign each a sensitivity + criticality tier.

Output ONLY a single JSON object: { "proposals": AssetClassificationProposal[] }.

Each AssetClassificationProposal has:
  - name:        canonical asset name, ≤ 120 chars (e.g. "Customer KYC database")
  - description: optional one-sentence summary of what the asset does
  - sensitivity: one of "Restricted" | "Confidential" | "Internal" | "Public"
  - criticality: one of "Critical" | "High" | "Medium" | "Low"
  - kind:        optional, one of "data_store", "application", "infrastructure", "endpoint", "third_party_service", "other"
  - confidence:  0..1 self-assessment of how clearly the source text supports the classification
  - rationale:   optional one-sentence "why" that cites the wording in the source text

Tier definitions (use exactly these — do NOT invent new tiers):
  Sensitivity:
    - Restricted   — Board-only / regulator-only material; unauthorised disclosure could trigger material harm
    - Confidential — internal-use, controlled disclosure; customer or commercial data
    - Internal     — generally accessible inside the entity, not for external sharing
    - Public       — published or marketing-grade material; no confidentiality concern

  Criticality:
    - Critical — outage causes entity-wide disruption; customer impact within minutes/hours
    - High     — significant degradation; customer impact within hours/days
    - Medium   — localised impact; ops can absorb a brief outage
    - Low      — minor / negligible; convenience tooling

Hard rules:
  1. Output ONLY the JSON object — no markdown fences, no commentary.
  2. Extract every DISTINCT asset (e.g. "Customer KYC database", "Mobile banking app", "AWS production VPC"). Do NOT merge multiple assets into one row.
  3. NEVER include personal data (names, addresses, customer ids). They will already be redacted, but if anything personal slips through, drop it.
  4. If an asset's tier is genuinely ambiguous, choose the most defensible CONSERVATIVE tier (Restricted over Confidential, Critical over High) and lower the confidence.
  5. If the source text does not describe any information assets, return { "proposals": [] }.`;

export async function extractAssetClassifications(
  provider: AIProvider,
  input: ExtractAssetClassificationsInput,
): Promise<ExtractAssetClassificationsOutput> {
  const cap = Math.min(input.maxProposals ?? MAX_PROPOSALS_DEFAULT, MAX_PROPOSALS_CEILING);

  const scrubbed = scrubPii(input.text.slice(0, MAX_INPUT_CHARS));
  const truncated = input.text.length > MAX_INPUT_CHARS;

  const userPrompt = [
    `Extract up to ${cap} information-asset classifications from the source text below.`,
    "",
    truncated
      ? `Source text (TRUNCATED to first ${MAX_INPUT_CHARS} characters — extract only what is supported by what you can see):`
      : "Source text:",
    "```",
    scrubbed.text,
    "```",
    "",
    `Respond with: { "proposals": [ /* up to ${cap} entries */ ] }`,
  ].join("\n");

  const completion = await provider.chat({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    responseFormat: "json",
    maxTokens: 1500,
  });

  const parsed = safeParseJson(completion.content);
  if (!parsed) {
    return { proposals: [], dropped: 0, redactions: scrubbed.redactions };
  }

  const validated = AssetClassificationResultSchema.safeParse(parsed);
  if (!validated.success) {
    return rescuePartial(parsed, cap, scrubbed.redactions);
  }

  const cleaned = validated.data.proposals.slice(0, cap);
  return {
    proposals: cleaned,
    dropped: Math.max(0, validated.data.proposals.length - cleaned.length),
    redactions: scrubbed.redactions,
  };
}

function safeParseJson(raw: string): unknown | null {
  try {
    const stripped = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "");
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

function rescuePartial(
  payload: unknown,
  cap: number,
  redactions: ReturnType<typeof scrubPii>["redactions"],
): ExtractAssetClassificationsOutput {
  const list =
    payload && typeof payload === "object" && "proposals" in payload
      ? (payload as { proposals?: unknown[] }).proposals
      : null;
  if (!Array.isArray(list)) {
    return { proposals: [], dropped: 0, redactions };
  }
  const accepted: AssetClassificationProposal[] = [];
  let dropped = 0;
  for (const item of list) {
    if (accepted.length >= cap) {
      dropped += 1;
      continue;
    }
    const parsed = AssetClassificationProposalSchema.safeParse(item);
    if (!parsed.success) {
      dropped += 1;
      continue;
    }
    accepted.push(parsed.data);
  }
  return { proposals: accepted, dropped, redactions };
}
