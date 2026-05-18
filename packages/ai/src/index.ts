export type {
  AIProvider,
  AIProviderType,
  AIFeatureType,
  AIProviderCredentials,
  AIModelConfig,
  ChatMessage,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "./types.js";

export {
  PROVIDER_LABELS,
  PROVIDER_MODELS,
  PROVIDER_DEFAULT_MODEL,
  FEATURE_LABELS,
} from "./types.js";

export { createAIProvider } from "./factory.js";
export { generateQuizQuestions } from "./prompts/quiz.ee.js";

// Phase 1 of "ongoing AI context"
export { extractContextProposals, CONTEXT_CATEGORIES } from "./extraction/from-text.ee.js";
export type {
  ContextCategory,
  FactProposal,
  ExistingContextRef,
  ExtractContextProposalsInput,
  ExtractContextProposalsResult,
} from "./extraction/from-text.ee.js";
export { scrubPii } from "./extraction/scrub.js";
export type { ScrubResult } from "./extraction/scrub.js";

// CPS 234 asset-classification bootstrap (Para 23 / CPS234-23).
export {
  extractAssetClassifications,
  ASSET_SENSITIVITY_TIERS,
  ASSET_CRITICALITY_TIERS,
} from "./extraction/asset-classification.js";
export type {
  AssetSensitivity,
  AssetCriticality,
  AssetClassificationProposal,
  AssetClassificationResult,
  ExtractAssetClassificationsInput,
  ExtractAssetClassificationsOutput,
} from "./extraction/asset-classification.js";

export type {
  AIResolutionSource,
  OperatorAIDefaults,
  OrgProviderRow,
  OrgFeatureRow,
  ResolveContext,
  ResolvedAI,
} from "./resolve.js";
export {
  resolveAIProvider,
  AINotConfiguredError,
  AI_NOT_CONFIGURED_PUBLIC_MESSAGE,
} from "./resolve.js";

export { AIProviderError, wrapProviderError } from "./errors.js";
export type { AIProviderErrorKind, AIProviderErrorInit } from "./errors.js";
