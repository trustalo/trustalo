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
export { generateQuizQuestions } from "./prompts/quiz.js";

// Phase 1 of "ongoing AI context"
export { extractContextProposals, CONTEXT_CATEGORIES } from "./extraction/from-text.js";
export type {
  ContextCategory,
  FactProposal,
  ExistingContextRef,
  ExtractContextProposalsInput,
  ExtractContextProposalsResult,
} from "./extraction/from-text.js";
export { scrubPii } from "./extraction/scrub.js";
export type { ScrubResult } from "./extraction/scrub.js";

export type {
  AIResolutionSource,
  OperatorAIDefaults,
  OrgProviderRow,
  OrgFeatureRow,
  ResolveContext,
  ResolvedAI,
} from "./resolve.js";
export { resolveAIProvider, AINotConfiguredError } from "./resolve.js";

export { AIProviderError, wrapProviderError } from "./errors.js";
export type { AIProviderErrorKind, AIProviderErrorInit } from "./errors.js";
