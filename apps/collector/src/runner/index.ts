import { prisma } from "../db/prisma.js";
import { providerRegistry } from "../integrations/core/registry.js";
import { SecretVaultService } from "../secret-vault/service.js";
import { submitEvidence } from "../lib/api-client.js";
import type { EvidenceResult } from "../integrations/core/types.js";

const POLL_INTERVAL_MS = 10_000;
const MAX_CONCURRENT_JOBS = 3;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 2_000;

let intervalId: ReturnType<typeof setInterval> | null = null;
let activeJobs = 0;

export async function startRunner(): Promise<void> {
  if (intervalId) return;
  console.log(
    "[runner] starting — poll interval:",
    POLL_INTERVAL_MS,
    "ms, max concurrent:",
    MAX_CONCURRENT_JOBS,
  );

  await processJobs();
  intervalId = setInterval(() => {
    processJobs().catch((err) => console.error("[runner] tick failed:", err));
  }, POLL_INTERVAL_MS);
}

export function stopRunner(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[runner] stopped");
  }
}

async function processJobs(): Promise<void> {
  if (activeJobs >= MAX_CONCURRENT_JOBS) return;

  const slotsAvailable = MAX_CONCURRENT_JOBS - activeJobs;

  const pendingJobs = await prisma.collectionJob.findMany({
    where: { status: "pending", scheduledAt: { lte: new Date() } },
    orderBy: [{ priority: "desc" }, { scheduledAt: "asc" }],
    take: slotsAvailable,
    include: {
      connection: { include: { integration: true } },
    },
  });

  for (const job of pendingJobs) {
    activeJobs++;
    executeJob(job)
      .catch((err) => console.error(`[runner] unhandled error in job=${job.id}:`, err))
      .finally(() => {
        activeJobs--;
      });
  }
}

async function executeJob(job: {
  id: string;
  tenantId: string;
  connectionId: string;
  connection: {
    id: string;
    secretId: string | null;
    lastSyncAt: Date | null;
    integration: { id: string; name: string };
  };
}): Promise<void> {
  const { id: jobId, tenantId, connection } = job;
  const integrationSlug = connection.integration.id;

  console.log(`[runner] starting job=${jobId} integration=${integrationSlug} tenant=${tenantId}`);

  await prisma.collectionJob.update({
    where: { id: jobId },
    data: { status: "running", startedAt: new Date() },
  });

  const lastRun = await prisma.collectionJobRun.findFirst({
    where: { jobId },
    orderBy: { runNumber: "desc" },
  });
  const runNumber = (lastRun?.runNumber ?? 0) + 1;

  const jobRun = await prisma.collectionJobRun.create({
    data: {
      jobId,
      tenantId,
      runNumber,
      status: "running",
    },
  });

  const startTime = Date.now();

  try {
    const provider = providerRegistry.get(integrationSlug);
    if (!provider) {
      throw new Error(`No connector registered for integration '${integrationSlug}'`);
    }

    if (!connection.secretId) {
      throw new Error(`Connection ${connection.id} has no SecretVault entry — credentials missing`);
    }

    const credentials = await SecretVaultService.read(connection.secretId);
    const providerConnection = await provider.connect(credentials);

    const testResult = await provider.testConnection(providerConnection);
    if (!testResult.success) {
      throw new Error(`Connection test failed: ${testResult.message}`);
    }

    const evidence = await provider.collectEvidence(providerConnection, {
      tenantId,
      connectionId: connection.id,
      incremental: !!connection.lastSyncAt,
      since: connection.lastSyncAt ?? undefined,
    });

    await provider.disconnect(providerConnection);

    let submittedCount = 0;
    let submitErrors = 0;

    if (evidence.length > 0) {
      try {
        const batchSize = 50;
        for (let i = 0; i < evidence.length; i += batchSize) {
          const batch = evidence.slice(i, i + batchSize);
          const result = await submitEvidence(tenantId, batch);
          if (result.success) {
            submittedCount += result.data?.created ?? 0;
          } else {
            submitErrors++;
            console.error(
              `[runner] failed to submit evidence batch for job=${jobId}:`,
              result.error,
            );
          }
        }
      } catch (err) {
        submitErrors++;
        console.error(`[runner] evidence submission error for job=${jobId}:`, err);
      }
    }

    const durationMs = Date.now() - startTime;

    await logSync(tenantId, connection.id, connection.integration.id, evidence, "completed");

    await prisma.$transaction([
      prisma.collectionJobRun.update({
        where: { id: jobRun.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          durationMs,
          evidenceCount: evidence.length,
          errorCount: submitErrors,
          resultSummary: {
            evidenceCollected: evidence.length,
            evidenceSubmitted: submittedCount,
            submitErrors,
            capabilities: [...new Set(evidence.map((e) => e.sourceType.split(".")[1] ?? ""))],
          },
        },
      }),
      prisma.collectionJob.update({
        where: { id: jobId },
        data: { status: "completed", completedAt: new Date() },
      }),
      prisma.integrationConnection.update({
        where: { id: connection.id },
        data: { lastSyncAt: new Date(), status: "connected", lastErrorMessage: null },
      }),
    ]);

    console.log(
      `[runner] completed job=${jobId}: ${evidence.length} evidence items in ${durationMs}ms`,
    );
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[runner] failed job=${jobId}:`, errorMessage);

    await logSync(tenantId, connection.id, connection.integration.id, [], "failed");

    await prisma.collectionJobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        durationMs,
        errorDetails: errorMessage,
      },
    });

    const retryCount = await prisma.collectionRetry.count({
      where: { jobRunId: jobRun.id },
    });

    if (retryCount < MAX_RETRIES) {
      const backoffMs = BASE_BACKOFF_MS * Math.pow(2, retryCount);
      const nextRetryAt = new Date(Date.now() + backoffMs);

      await prisma.collectionRetry.create({
        data: {
          jobRunId: jobRun.id,
          tenantId,
          attemptNumber: retryCount + 1,
          status: "pending",
          errorMessage,
          scheduledAt: new Date(),
          nextRetryAt,
          maxAttempts: MAX_RETRIES,
          backoffMs,
        },
      });

      await prisma.collectionJob.update({
        where: { id: jobId },
        data: { status: "pending", scheduledAt: nextRetryAt },
      });

      console.log(
        `[runner] scheduled retry ${retryCount + 1}/${MAX_RETRIES} for job=${jobId} at ${nextRetryAt.toISOString()}`,
      );
    } else {
      await prisma.$transaction([
        prisma.collectionJob.update({
          where: { id: jobId },
          data: { status: "failed", completedAt: new Date() },
        }),
        prisma.integrationConnection.update({
          where: { id: connection.id },
          data: { status: "error", lastErrorMessage: errorMessage },
        }),
      ]);
    }
  }
}

async function logSync(
  tenantId: string,
  connectionId: string,
  integrationSlug: string,
  evidence: EvidenceResult[],
  status: "completed" | "failed",
): Promise<void> {
  try {
    const integration = await prisma.integration.findUnique({ where: { id: integrationSlug } });
    if (!integration) return;

    await prisma.syncLog.create({
      data: {
        tenantId,
        connectionId,
        integrationId: integration.id,
        action: "full_sync",
        status,
        recordsProcessed: evidence.length,
        recordsFailed: 0,
        completedAt: status === "completed" ? new Date() : undefined,
        details: {
          evidenceCount: evidence.length,
          sourceTypes: [...new Set(evidence.map((e) => e.sourceType))],
        },
      },
    });
  } catch (err) {
    console.error("[runner] failed to create sync log:", err);
  }
}
