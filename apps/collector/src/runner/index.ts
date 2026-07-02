import { prisma } from "../db/prisma.js";
import { providerRegistry } from "../integrations/core/registry.js";
import { SecretVaultService } from "../secret-vault/service.js";
import { submitEvidence } from "../lib/api-client.js";
import type { EvidenceResult } from "../integrations/core/types.js";
import { classifyError } from "./classify-error.js";
import { markChecksFailing, markChecksHealthy } from "./check-health.js";
import { CUSTOM_INTEGRATION_ID } from "../integrations/custom/index.js";
import { runCustomChecksForConnection, type CustomChecksRunSummary } from "./custom-checks.js";

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
    syncFrequencyMinutes: number;
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
    let evidence: EvidenceResult[];
    // Per-check bookkeeping for the custom path happens inside
    // `runCustomChecksForConnection` (each check pass/fail/errors
    // independently); provider connections keep the connection-wide
    // `markChecksHealthy` sweep below.
    let customSummary: CustomChecksRunSummary | null = null;

    if (integrationSlug === CUSTOM_INTEGRATION_ID) {
      // Custom ("from prompt") HTTP checks: no connector, no
      // credential handshake — the work items are IntegrationCheck
      // rows executed by the shared HTTP executor.
      customSummary = await runCustomChecksForConnection({
        tenantId,
        connection: {
          id: connection.id,
          secretId: connection.secretId,
          syncFrequencyMinutes: connection.syncFrequencyMinutes,
        },
      });
      evidence = customSummary.evidence;
    } else {
      const provider = providerRegistry.get(integrationSlug);
      if (!provider) {
        throw new Error(`No connector registered for integration '${integrationSlug}'`);
      }

      if (!connection.secretId) {
        throw new Error(
          `Connection ${connection.id} has no SecretVault entry — credentials missing`,
        );
      }

      const credentials = await SecretVaultService.read(connection.secretId);
      const providerConnection = await provider.connect(credentials);

      const testResult = await provider.testConnection(providerConnection);
      if (!testResult.success) {
        throw new Error(`Connection test failed: ${testResult.message}`);
      }

      evidence = await provider.collectEvidence(providerConnection, {
        tenantId,
        connectionId: connection.id,
        incremental: !!connection.lastSyncAt,
        since: connection.lastSyncAt ?? undefined,
      });

      await provider.disconnect(providerConnection);
    }

    let submittedCount = 0;
    let submitErrors = 0;
    let orphanCount = 0;

    if (evidence.length > 0) {
      // Resolve IntegrationCheckControl bindings for every manifestKey
      // in this batch in a single query. The runner uses the materialised
      // bindings as the authoritative source — historically each
      // EvidenceResult carried a free-form `controlMapping[]`, but those
      // are now ignored in favour of the binder-managed map.
      const manifestKeys = [...new Set(evidence.map((e) => e.manifestKey))];
      const bindings = manifestKeys.length
        ? await prisma.integrationCheckControl.findMany({
            where: {
              connectionId: connection.id,
              isEnabled: true,
              integrationCheck: { manifestKey: { in: manifestKeys } },
            },
            select: {
              controlId: true,
              integrationCheck: { select: { manifestKey: true } },
            },
          })
        : [];
      const controlIdsByManifestKey = new Map<string, Set<string>>();
      for (const b of bindings) {
        const key = b.integrationCheck.manifestKey;
        const set = controlIdsByManifestKey.get(key) ?? new Set<string>();
        set.add(b.controlId);
        controlIdsByManifestKey.set(key, set);
      }

      // Attach controlIds to each evidence row. Items whose manifestKey
      // has no enabled binding are still submitted (so they're queryable
      // for diagnostics) but with `controlIds: []` — the API persists
      // them and a separate orphan-evidence report makes them visible.
      const evidenceWithBindings = evidence.map((e) => {
        const controlIds = [...(controlIdsByManifestKey.get(e.manifestKey) ?? [])];
        if (controlIds.length === 0) orphanCount++;
        return { ...e, controlIds };
      });

      try {
        const batchSize = 50;
        for (let i = 0; i < evidenceWithBindings.length; i += batchSize) {
          const batch = evidenceWithBindings.slice(i, i + batchSize);
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

      if (orphanCount > 0) {
        console.warn(
          `[runner] job=${jobId}: ${orphanCount} evidence row(s) have no IntegrationCheckControl binding ` +
            `— manifestKeys without bound controls: ` +
            [
              ...new Set(
                evidenceWithBindings
                  .filter((e) => e.controlIds.length === 0)
                  .map((e) => e.manifestKey),
              ),
            ].join(", "),
        );
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
            orphanCount,
            manifestKeys: [...new Set(evidence.map((e) => e.manifestKey))],
            ...(customSummary
              ? {
                  customChecksRun: customSummary.checksRun,
                  customChecksErrored: customSummary.checksErrored,
                }
              : {}),
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

    // Refresh check-level health metrics and close any open coverage
    // gaps. Done outside the transaction above to keep the success
    // path's critical section short — even if this fails we don't want
    // to roll back the job completion. Skipped for the custom path:
    // its per-check health was already written (a connection-wide
    // "healthy" sweep would wrongly clear checks that just errored).
    if (!customSummary) {
      try {
        await markChecksHealthy({
          tenantId,
          connectionId: connection.id,
          syncFrequencyMinutes: connection.syncFrequencyMinutes,
        });
      } catch (healthErr) {
        console.error(`[runner] failed to update check health for job=${jobId}:`, healthErr);
      }
    }

    console.log(
      `[runner] completed job=${jobId}: ${evidence.length} evidence items in ${durationMs}ms`,
    );
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);
    const classified = classifyError(err);
    console.error(
      `[runner] failed job=${jobId} reason=${classified.reason} retriable=${classified.retriable}:`,
      errorMessage,
    );

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

    // Non-retriable errors short-circuit the retry loop. Retriable ones
    // get up to MAX_RETRIES attempts before we open the coverage gap.
    const shouldRetry = classified.retriable && retryCount < MAX_RETRIES;
    const retriesExhausted = !shouldRetry;

    try {
      await markChecksFailing({
        tenantId,
        connectionId: connection.id,
        reason: classified.reason,
        retriable: classified.retriable,
        retriesExhausted,
        errorMessage: classified.message,
      });
    } catch (healthErr) {
      console.error(`[runner] failed to update check health for job=${jobId}:`, healthErr);
    }

    if (shouldRetry) {
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
          manifestKeys: [...new Set(evidence.map((e) => e.manifestKey))],
        },
      },
    });
  } catch (err) {
    console.error("[runner] failed to create sync log:", err);
  }
}
