import { Router } from "express";
import type { Subscription, ReceivedMessage } from "@trustalo/queue";
import { getQueueProvider, QUEUE_URLS } from "../lib/queue.js";
import { performVendorResearch } from "../research/vendor-researcher.js";

export const researchRouter: Router = Router();

let subscription: Subscription | null = null;

interface VendorResearchRequestMessage {
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

interface VendorResearchResultMessage {
  type: "vendor_research_result";
  vendorId: string;
  tenantId: string;
  knownVendorId?: string;
  status: "completed" | "failed";
  results?: Record<string, unknown>;
  errorMessage?: string;
}

/**
 * Start the queue subscriber that listens for vendor research requests.
 */
export async function startResearchSubscriber(): Promise<void> {
  const queue = getQueueProvider();

  console.log("[research] subscribing to", QUEUE_URLS.vendorResearchRequests);

  subscription = queue.subscribe(
    QUEUE_URLS.vendorResearchRequests,
    async (message: ReceivedMessage) => {
      const body = message.body as unknown as VendorResearchRequestMessage;

      if (body.type !== "vendor_research_request") {
        console.warn("[research] ignoring unknown message type:", body.type);
        return;
      }

      await executeResearch(body);
    },
    { pollingInterval: 2_000, maxMessages: 3 },
  );

  console.log("[research] queue subscriber started");
}

export async function stopResearchSubscriber(): Promise<void> {
  if (subscription) {
    await subscription.unsubscribe();
    subscription = null;
    console.log("[research] queue subscriber stopped");
  }
}

async function executeResearch(req: VendorResearchRequestMessage): Promise<void> {
  const { vendorId, tenantId, researchType, knownVendorId } = req;

  console.log(
    `[research] starting ${researchType} for vendor=${vendorId} name="${req.vendorName}" org=${tenantId}`,
  );

  try {
    const results = await performVendorResearch({
      vendorName: req.vendorName,
      vendorWebsite: req.vendorWebsite,
      vendorCategory: req.vendorCategory,
      vendorDescription: req.vendorDescription,
    });

    console.log(`[research] completed for vendor=${vendorId} score=${results.overallScore}`);

    await publishResearchResult({
      type: "vendor_research_result",
      vendorId,
      tenantId,
      knownVendorId: knownVendorId ?? undefined,
      status: "completed",
      results: {
        overallScore: results.overallScore,
        securityScore: results.securityScore,
        complianceScore: results.complianceScore,
        reputationScore: results.reputationScore,
        financialScore: results.financialScore,
        findings: results.findings,
        summary: results.summary,
        recommendations: results.recommendations,
        dataBreaches: results.dataBreaches,
        certifications: results.certifications,
        rawData: results.rawData,
      },
    });
  } catch (err) {
    console.error(`[research] failed for vendor=${vendorId}:`, err);

    await publishResearchResult({
      type: "vendor_research_result",
      vendorId,
      tenantId,
      knownVendorId: knownVendorId ?? undefined,
      status: "failed",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
  }
}

async function publishResearchResult(result: VendorResearchResultMessage): Promise<void> {
  try {
    const queue = getQueueProvider();
    await queue.publish(QUEUE_URLS.vendorResearchResults, {
      body: result as unknown as Record<string, unknown>,
      attributes: {
        messageType: "vendor_research_result",
        vendorId: result.vendorId,
        status: result.status,
      },
    });

    console.log(
      `[research] published result to queue for vendor=${result.vendorId} status=${result.status}`,
    );
  } catch (err) {
    console.error("[research] failed to publish result to queue:", err);
  }
}

// Health-check endpoint for the research subsystem
researchRouter.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      subscriberActive: subscription?.isActive() ?? false,
    },
  });
});
