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
} as const;

// ── Message type definitions for vendor research ──

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
