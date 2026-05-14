export type AIProviderType = "openai" | "anthropic" | "bedrock" | "openrouter";

/**
 * Per-feature AI configuration keys.
 *
 * The list intentionally maps 1:1 to user-visible product features so an
 * operator/admin can wire each feature to a different model (e.g. cheap
 * Haiku for risk scoring, premium Sonnet for policy drafting). Keep in
 * sync with the AIFeature enum in apps/api/prisma/schema/ai-config.prisma.
 */
export type AIFeatureType =
  | "quiz_generation"
  | "risk_analysis"
  | "policy_drafting"
  | "policy_generation"
  | "vendor_assessment"
  | "incident_summary"
  | "control_suggestion"
  | "automated_check_generation"
  | "risk_scoring"
  | "vendor_scoring"
  | "questionnaire_answering"
  | "trust_center_summary"
  // Phase 1 of "ongoing AI context": LLM extracts structured fact
  // proposals from a paragraph of pasted text (or a chat turn). The
  // raw output goes into TenantContextProposal — never directly
  // into TenantContext — so a human always reviews before AI
  // grounding picks it up.
  | "context_extraction"
  // Phase 2 of "ongoing AI context": general compliance assistant
  // chat. Streams grounded answers using TenantContext +
  // policies/risks/vendors/controls/frameworks, with passive
  // proposal capture via context_extraction running in parallel.
  | "chat_assistant"
  // Per-control evidence agent: an LLM-driven loop in the collector
  // that follows natural-language instructions and calls integration
  // provider capabilities as tools to gather audit-grade evidence.
  | "evidence_agent";

export interface AIProviderCredentials {
  provider: AIProviderType;
  apiKey?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  baseUrl?: string;
  /**
   * When true and provider is `bedrock`, the SDK's default credential
   * provider chain (env → shared config → IMDS → IAM role) is used
   * instead of static `accessKeyId`/`secretAccessKey`. Required for the
   * "Bedrock-only self-hosted via IAM role" deployment story.
   */
  useDefaultChain?: boolean;
}

export interface AIModelConfig {
  provider: AIProviderType;
  model: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIProvider {
  chat(options: ChatCompletionOptions): Promise<ChatCompletionResult>;
}

export const PROVIDER_LABELS: Record<AIProviderType, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  bedrock: "AWS Bedrock",
  openrouter: "OpenRouter",
};

export const PROVIDER_MODELS: Record<AIProviderType, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4.1", label: "GPT-4.1" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
    { value: "o3-mini", label: "o3 Mini" },
  ],
  anthropic: [
    { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  ],
  bedrock: [
    { value: "anthropic.claude-sonnet-4-20250514-v1:0", label: "Claude Sonnet 4 (Bedrock)" },
    { value: "anthropic.claude-3-5-sonnet-20241022-v2:0", label: "Claude 3.5 Sonnet v2 (Bedrock)" },
    { value: "anthropic.claude-3-5-haiku-20241022-v1:0", label: "Claude 3.5 Haiku (Bedrock)" },
    { value: "amazon.nova-pro-v1:0", label: "Amazon Nova Pro" },
    { value: "amazon.nova-lite-v1:0", label: "Amazon Nova Lite" },
    { value: "meta.llama3-1-70b-instruct-v1:0", label: "Llama 3.1 70B Instruct" },
  ],
  openrouter: [
    { value: "anthropic/claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { value: "openai/gpt-4o", label: "GPT-4o" },
    { value: "google/gemini-2.5-pro-preview", label: "Gemini 2.5 Pro" },
    { value: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick" },
  ],
};

export const FEATURE_LABELS: Record<AIFeatureType, string> = {
  quiz_generation: "Quiz Generation",
  risk_analysis: "Risk Analysis",
  policy_drafting: "Policy Drafting",
  policy_generation: "Policy Generation",
  vendor_assessment: "Vendor Assessment",
  incident_summary: "Incident Summary",
  control_suggestion: "Control Suggestions",
  automated_check_generation: "Automated Check Generation",
  risk_scoring: "Risk Scoring",
  vendor_scoring: "Vendor Risk Scoring",
  questionnaire_answering: "Questionnaire Answering",
  trust_center_summary: "Trust Center Summary",
  context_extraction: "Context Extraction",
  chat_assistant: "Compliance Assistant Chat",
  evidence_agent: "Evidence Collection Agent",
};

/**
 * Sensible per-provider defaults when the operator only sets `AI_PROVIDER`
 * without `AI_DEFAULT_MODEL`. Picked for cost/quality balance on a generic
 * compliance-drafting workload.
 */
export const PROVIDER_DEFAULT_MODEL: Record<AIProviderType, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-20241022",
  bedrock: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  openrouter: "openai/gpt-4o-mini",
};
