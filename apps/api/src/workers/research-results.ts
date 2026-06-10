import type { Subscription, ReceivedMessage } from "@trustalo/queue";
import { getQueueProvider, QUEUE_URLS, type VendorResearchResultMessage } from "../lib/queue.js";
import { prisma } from "../db/prisma.js";

let subscription: Subscription | null = null;

export async function startResearchResultsWorker(): Promise<void> {
  const queue = getQueueProvider();

  console.log("[research-results-worker] subscribing to", QUEUE_URLS.vendorResearchResults);

  subscription = queue.subscribe(
    QUEUE_URLS.vendorResearchResults,
    async (message: ReceivedMessage) => {
      const body = message.body as unknown as VendorResearchResultMessage;

      if (body.type !== "vendor_research_result") {
        console.warn("[research-results-worker] ignoring unknown message type:", body.type);
        return;
      }

      console.log(
        `[research-results-worker] processing result for vendor=${body.vendorId} status=${body.status}`,
      );

      await processResearchResult(body);
    },
    { pollingInterval: 2_000, maxMessages: 5 },
  );

  console.log("[research-results-worker] started");
}

export async function stopResearchResultsWorker(): Promise<void> {
  if (subscription) {
    await subscription.unsubscribe();
    subscription = null;
    console.log("[research-results-worker] stopped");
  }
}

async function processResearchResult(body: VendorResearchResultMessage): Promise<void> {
  try {
    if (body.status === "completed" && body.results) {
      const r = body.results;

      // Create the research record
      const research = await prisma.vendorResearch.create({
        data: {
          vendorId: body.vendorId,
          knownVendorId: body.knownVendorId || undefined,
          tenantId: body.tenantId,
          status: "completed",
          completedAt: new Date(),
          overallScore: r.overallScore,
          securityScore: r.securityScore,
          complianceScore: r.complianceScore,
          reputationScore: r.reputationScore,
          financialScore: r.financialScore,
          findings: r.findings as any,
          summary: r.summary,
          recommendations: r.recommendations,
          dataBreaches: r.dataBreaches as any,
          certifications: r.certifications as any,
          rawData: r.rawData as any,
        },
      });

      // Update vendor's lastResearchedAt
      await prisma.vendor.update({
        where: { id: body.vendorId },
        data: { lastResearchedAt: new Date() },
      });

      // Update known vendor cache if applicable
      if (body.knownVendorId) {
        await prisma.knownVendor.update({
          where: { id: body.knownVendorId },
          data: {
            lastResearchedAt: new Date(),
            overallScore: r.overallScore,
            researchData: r.rawData as any,
            riskSummary: r.summary,
            certifications: Array.isArray(r.certifications) ? (r.certifications as string[]) : [],
          },
        });
      }

      // Auto-create a VendorAssessment from the research
      const vendor = await prisma.vendor.findUnique({
        where: { id: body.vendorId },
        include: {
          tenant: {
            // People replaced Membership: the tenant owner is the Person with
            // role=owner; assessedById needs that person's linked userId.
            include: { people: { where: { role: "owner" }, take: 1 } },
          },
        },
      });

      if (vendor) {
        const assessorId = vendor.tenant?.people?.[0]?.userId;
        if (assessorId) {
          await prisma.vendorAssessment.create({
            data: {
              vendorId: body.vendorId,
              tenantId: body.tenantId,
              assessedById: assessorId,
              score: r.overallScore,
              findings: r.summary,
              researchId: research.id,
              nextReviewDate: vendor.nextResearchAt,
            },
          });
        }
      }

      console.log(
        `[research-results-worker] saved research for vendor=${body.vendorId} score=${r.overallScore}`,
      );
    } else if (body.status === "failed") {
      await prisma.vendorResearch.create({
        data: {
          vendorId: body.vendorId,
          knownVendorId: body.knownVendorId || undefined,
          tenantId: body.tenantId,
          status: "failed",
          completedAt: new Date(),
          errorMessage: body.errorMessage,
        },
      });

      console.log(
        `[research-results-worker] recorded failure for vendor=${body.vendorId}: ${body.errorMessage}`,
      );
    }
  } catch (err) {
    console.error("[research-results-worker] error processing result:", err);
    throw err;
  }
}
