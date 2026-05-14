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
} as const;
