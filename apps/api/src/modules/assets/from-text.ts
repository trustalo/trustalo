/**
 * Assets — "classify from text" (CPS 234 Para 23 bootstrap).
 *
 * Turns pasted architecture / data-flow prose into STAGED asset
 * proposals via `extractAssetClassifications` in `@trustalo/ai`. The
 * proposals are advisory only:
 *
 *   • This module NEVER writes Asset rows. The user reviews the
 *     proposals in the UI and applies the ones they want through the
 *     normal `POST /api/v1/assets` create call.
 *   • The extractor runs `scrubPii` on the input before it leaves
 *     Trustalo for the LLM; the redaction counts are surfaced so the
 *     UI can show the scrubber is active.
 *
 * Unlike the EE accelerators (chat, context extraction, questionnaire
 * answering), the asset-classification bootstrap is a FREE core
 * utility — see the licensing tier table in docs/ai-features.md — so
 * the route deliberately carries no `assertEnterpriseLicense` gate.
 *
 * Besides display tiers, each proposal carries a `suggestedAsset`
 * payload pre-mapped onto the Asset register's enums so the UI can
 * hand it straight to the existing create endpoint:
 *
 *   sensitivity  Restricted|Confidential|Internal|Public
 *                  → classification restricted|confidential|internal|public
 *   criticality  Critical|High|Medium|Low
 *                  → metadata.criticality critical|high|medium|low
 *   kind         data_store|application|infrastructure|endpoint|
 *                third_party_service|other
 *                  → type data|software|cloud_resource|hardware|service|software
 */

import { z } from "zod";
import {
  extractAssetClassifications,
  type AIProvider,
  type AssetClassificationProposal,
  type AssetCriticality,
  type AssetSensitivity,
  type ExtractAssetClassificationsOutput,
} from "@trustalo/ai";

// Mirrors the org-context from-text body: enough text for the model to
// work with (≥ 20 chars), capped at the extractor's practical input
// ceiling. The proposal cap tracks the helper's 30-row ceiling.
export const assetsFromTextBody = z.object({
  text: z.string().trim().min(20).max(20_000),
  /** Override the default proposal cap (1..30). */
  maxProposals: z.number().int().min(1).max(30).optional(),
});

export type AssetTypeValue =
  | "hardware"
  | "software"
  | "data"
  | "service"
  | "personnel"
  | "facility"
  | "cloud_resource";

export type AssetClassificationValue = "public" | "internal" | "confidential" | "restricted";
export type AssetCriticalityValue = "low" | "medium" | "high" | "critical";

const SENSITIVITY_TO_CLASSIFICATION: Record<AssetSensitivity, AssetClassificationValue> = {
  Restricted: "restricted",
  Confidential: "confidential",
  Internal: "internal",
  Public: "public",
};

const CRITICALITY_TO_METADATA: Record<AssetCriticality, AssetCriticalityValue> = {
  Critical: "critical",
  High: "high",
  Medium: "medium",
  Low: "low",
};

const KIND_TO_TYPE: Record<NonNullable<AssetClassificationProposal["kind"]>, AssetTypeValue> = {
  data_store: "data",
  application: "software",
  infrastructure: "cloud_resource",
  endpoint: "hardware",
  third_party_service: "service",
  other: "software",
};

export function toAssetClassification(sensitivity: AssetSensitivity): AssetClassificationValue {
  return SENSITIVITY_TO_CLASSIFICATION[sensitivity];
}

export function toAssetCriticality(criticality: AssetCriticality): AssetCriticalityValue {
  return CRITICALITY_TO_METADATA[criticality];
}

export function toAssetType(kind: AssetClassificationProposal["kind"]): AssetTypeValue {
  return kind ? KIND_TO_TYPE[kind] : "software";
}

/** A create-ready payload for the existing `POST /api/v1/assets` route. */
export interface SuggestedAssetInput {
  name: string;
  type: AssetTypeValue;
  description?: string;
  classification: AssetClassificationValue;
  metadata: { criticality: AssetCriticalityValue };
}

export interface StagedAssetProposal {
  /** Raw extractor output — CPS 234 tier vocabulary for the review card. */
  proposal: AssetClassificationProposal;
  /** Same proposal mapped onto the Asset register's enums. */
  suggestedAsset: SuggestedAssetInput;
}

export interface ClassifyAssetsFromTextResult {
  proposals: StagedAssetProposal[];
  dropped: number;
  redactions: ExtractAssetClassificationsOutput["redactions"];
}

/**
 * Run the extractor and stage its proposals for review. Pure function of
 * (provider, input) — resolution, rate limiting and audit logging stay
 * in the router so this is unit-testable with a stub provider.
 */
export async function classifyAssetsFromText(
  aiClient: AIProvider,
  input: { text: string; maxProposals?: number },
): Promise<ClassifyAssetsFromTextResult> {
  const result = await extractAssetClassifications(aiClient, input);

  return {
    proposals: result.proposals.map((proposal) => ({
      proposal,
      suggestedAsset: {
        name: proposal.name,
        type: toAssetType(proposal.kind),
        description: proposal.description,
        classification: toAssetClassification(proposal.sensitivity),
        metadata: { criticality: toAssetCriticality(proposal.criticality) },
      },
    })),
    dropped: result.dropped,
    redactions: result.redactions,
  };
}
