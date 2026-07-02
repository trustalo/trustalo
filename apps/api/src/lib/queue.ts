import { createQueueProvider, type QueueProvider } from "@trustalo/queue";

let _queueProvider: QueueProvider | null = null;

export function getQueueProvider(): QueueProvider {
  if (!_queueProvider) {
    _queueProvider = createQueueProvider({
      provider: (process.env["QUEUE_PROVIDER"] as "sqs") ?? "sqs",
      region: process.env["AWS_REGION"] ?? "us-east-1",
      endpoint: process.env["SQS_ENDPOINT"] || undefined,
      accessKeyId: process.env["AWS_ACCESS_KEY_ID"] || undefined,
      secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"] || undefined,
    });
  }
  return _queueProvider;
}

export const QUEUE_URLS = {
  vendorResearchRequests:
    process.env["SQS_VENDOR_RESEARCH_REQUESTS_URL"] ??
    "http://localhost:4566/000000000000/trustalo-vendor-research-requests",
  vendorResearchResults:
    process.env["SQS_VENDOR_RESEARCH_RESULTS_URL"] ??
    "http://localhost:4566/000000000000/trustalo-vendor-research-results",
  // Phase 3 (AI accelerators): integration check pipeline.
  integrationCheckRequests:
    process.env["SQS_INTEGRATION_CHECK_REQUESTS_URL"] ??
    "http://localhost:4566/000000000000/trustalo-integration-check-requests",
  integrationCheckResults:
    process.env["SQS_INTEGRATION_CHECK_RESULTS_URL"] ??
    "http://localhost:4566/000000000000/trustalo-integration-check-results",
  // Phase 6 (AI accelerators): durable questionnaire XLSX/DOCX imports.
  // Published + consumed by the API itself (modules/questionnaires/
  // import-worker.ts) — the queue only carries `jobId`; the
  // QuestionnaireImportJob row remains the source of truth.
  questionnaireImportJobs:
    process.env["SQS_QUESTIONNAIRE_IMPORT_JOBS_URL"] ??
    "http://localhost:4566/000000000000/trustalo-questionnaire-import-jobs",
} as const;

// ── Message type definitions for vendor research ──

/**
 * Compact AI provider envelope carried inside cross-service messages so
 * the collector never has to read AI provider configuration from its
 * own DB (which would force it to mirror tenant secrets cross-process).
 *
 * In managed-mode SaaS, the credentials are a per-tenant LiteLLM
 * virtual key + the proxy URL — limited blast radius if the queue is
 * ever compromised, since the key is revocable and scoped to one
 * tenant's budget.
 *
 * In self-hosted mode without LiteLLM, the credentials are whatever
 * the resolver returned (org BYOK or operator). Operators concerned
 * about queue-at-rest leakage should enable SQS server-side encryption
 * or switch to managed LiteLLM mode.
 */
export interface ResolvedAIForCollector {
  provider: "openai" | "anthropic" | "bedrock" | "openrouter" | "litellm";
  model: string;
  source: "operator" | "org" | "feature" | "managed";
  credentials: {
    apiKey?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    baseUrl?: string;
    useDefaultChain?: boolean;
  };
}

export interface VendorResearchRequestMessage {
  type: "vendor_research_request";
  vendorId: string;
  tenantId: string;
  researchType: "deep_research" | "periodic_update";
  vendorName: string;
  vendorWebsite?: string | null;
  vendorCategory?: string | null;
  vendorDescription?: string | null;
  knownVendorId?: string | null;
  /**
   * Resolved AI configuration for this run. Always populated by the
   * publisher (vendors/router.ts) so the collector never has to call
   * resolveOrgAI itself. When this field is absent, the collector
   * falls back to its legacy OPENAI_MODEL path with a warning log —
   * this is purely for backwards compatibility with in-flight messages
   * during the rollout and can be deleted in a follow-up release.
   */
  ai?: ResolvedAIForCollector;
}

export interface VendorResearchResultMessage {
  type: "vendor_research_result";
  vendorId: string;
  tenantId: string;
  knownVendorId?: string;
  status: "completed" | "failed";
  results?: {
    overallScore: number;
    securityScore: number;
    complianceScore: number;
    reputationScore: number;
    financialScore: number;
    findings: unknown;
    summary: string;
    recommendations: string;
    dataBreaches: unknown;
    certifications: unknown;
    rawData: unknown;
  };
  errorMessage?: string;
}
