/**
 * Durable transport for questionnaire import jobs.
 *
 * Mirrors the vendor-research queue pattern (`lib/queue.ts` +
 * `workers/research-results.ts`): `POST /questionnaires` publishes a
 * tiny `{ type, jobId, tenantId }` envelope to the
 * `trustalo-questionnaire-import-jobs` SQS queue, and a subscriber in
 * this same API process picks it up and calls `runImportJob`. The
 * `QuestionnaireImportJob` row remains the source of truth — the queue
 * message carries no payload beyond the job id, so the polling UI and
 * the job lifecycle are exactly what they were under the old
 * `setImmediate` transport.
 *
 * Durability semantics:
 *   • Enqueued-before-restart → SQS retains the message; the subscriber
 *     re-receives it after the API comes back and runs the still-
 *     `pending` job.
 *   • Crashed mid-processing → the job row is stuck in `running` and the
 *     unacked message redelivers after the SQS visibility timeout.
 *     Because a partially-persisted import cannot be safely re-run
 *     (the runner creates the Questionnaire before inserting questions),
 *     stale `running` jobs are marked `failed` with a public-safe note
 *     instead of being retried: once by the redelivery handler (when the
 *     job has been `running` longer than `STALE_RUNNING_MS`) and once by
 *     the sweep on worker start.
 *   • Redelivery while a job is *legitimately* still running (imports
 *     take 30–180 s, which can exceed the queue's visibility timeout)
 *     is detected via the same threshold and dropped as a no-op.
 *
 * Dev fallback: when the queue is unreachable (local dev without
 * LocalStack), `enqueueImportJob` catches the publish failure — the same
 * catch-and-log degradation the vendor-research publisher uses — and
 * falls back to scheduling `runImportJob` in-process. Fallback jobs are
 * NOT durable across restarts; the start-up sweep eventually fails any
 * job the fallback lost.
 *
 * EE gating note: the structure agent is Enterprise
 * (`assertEnterpriseLicense("ai")`); that gate lives at the feature
 * entry points (the upload route + the agent itself), NOT here. The
 * transport is deliberately license-agnostic.
 */

import type { QueueProvider, ReceivedMessage, Subscription } from "@trustalo/queue";
import { getQueueProvider, QUEUE_URLS } from "../../lib/queue.js";
import { prisma } from "../../db/prisma.js";
import { runImportJob } from "./import-job.js";

// ─── Envelope ───────────────────────────────────────────────────────

export interface QuestionnaireImportJobMessage {
  type: "questionnaire_import_job";
  jobId: string;
  tenantId: string;
}

// ─── Stale-job guard thresholds ────────────────────────────────────

/**
 * A `running` job older than this is considered orphaned (the process
 * that owned it died mid-run). Generous vs. the 30–180 s worst case a
 * multi-sheet workbook takes, so a slow-but-alive run on another API
 * instance is never killed by a neighbour's start-up sweep.
 */
export const STALE_RUNNING_MS = 15 * 60_000;

/**
 * A `pending` job older than this never got picked up — its queue
 * message was lost (typically the in-process dev fallback dying with
 * the server). Long enough that a genuine queue backlog isn't swept.
 */
export const STALE_PENDING_MS = 60 * 60_000;

const INTERRUPTED_MESSAGE =
  "The import was interrupted before it finished (most likely a server restart mid-run). Please upload the file again.";
const NEVER_STARTED_MESSAGE =
  "The import was never picked up by a worker (the job queue may be unavailable). Please upload the file again.";

// ─── Injectable dependencies (tests swap in fakes) ─────────────────

interface ImportJobRow {
  id: string;
  status: string;
  startedAt: Date | null;
  createdAt: Date;
}

export interface ImportWorkerDeps {
  queue: Pick<QueueProvider, "publish">;
  queueUrl: string;
  db: {
    questionnaireImportJob: {
      findUnique(args: { where: { id: string } }): Promise<ImportJobRow | null>;
      updateMany(args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }): Promise<{ count: number }>;
    };
  };
  run(jobId: string): Promise<void>;
  /** Scheduler for the in-process fallback; injectable so tests run synchronously. */
  schedule(fn: () => void): void;
}

function defaultDeps(): ImportWorkerDeps {
  return {
    queue: getQueueProvider(),
    queueUrl: QUEUE_URLS.questionnaireImportJobs,
    db: prisma as unknown as ImportWorkerDeps["db"],
    run: runImportJob,
    schedule: (fn) => setImmediate(fn),
  };
}

// ─── Publisher (called by POST /questionnaires) ─────────────────────

/**
 * Hand a freshly-created `pending` job to the durable queue. Never
 * throws: publish failures degrade to the in-process runner (clearly
 * logged) so local dev without LocalStack keeps working — matching how
 * the vendor-research publisher catches-and-logs instead of failing
 * the request.
 */
export async function enqueueImportJob(
  job: { id: string; tenantId: string },
  deps: ImportWorkerDeps = defaultDeps(),
): Promise<void> {
  const message: QuestionnaireImportJobMessage = {
    type: "questionnaire_import_job",
    jobId: job.id,
    tenantId: job.tenantId,
  };

  try {
    await deps.queue.publish(deps.queueUrl, {
      body: message as unknown as Record<string, unknown>,
      attributes: {
        messageType: "questionnaire_import_job",
        jobId: job.id,
        tenantId: job.tenantId,
      },
    });
    console.log(`[questionnaire-import] published job ${job.id} to queue`);
  } catch (err) {
    // DEV FALLBACK — the queue is unreachable (no LocalStack / no SQS).
    // Run the job in-process on the exact code path the consumer uses.
    // Not durable: a restart before completion loses it (the start-up
    // sweep will eventually mark it failed with a note).
    console.error(
      `[questionnaire-import] queue publish failed for job ${job.id}; ` +
        `falling back to in-process runner (job will NOT survive a restart):`,
      err,
    );
    deps.schedule(() => {
      deps.run(job.id).catch((runErr) => {
        console.error(`[questionnaire-import] uncaught failure for ${job.id}:`, runErr);
      });
    });
  }
}

// ─── Consumer ──────────────────────────────────────────────────────

/**
 * Process one queue message. Exported (with injectable deps) so tests
 * can drive it without SQS; the subscription in
 * `startQuestionnaireImportWorker` is a thin wrapper around this.
 *
 * Returning normally acks (deletes) the message; only infrastructure
 * errors should propagate so SQS redelivers. `runImportJob` itself
 * never throws — terminal failures land on the job row.
 */
export async function handleImportJobMessage(
  message: ReceivedMessage,
  deps: ImportWorkerDeps = defaultDeps(),
): Promise<void> {
  const body = message.body as unknown as Partial<QuestionnaireImportJobMessage>;

  if (body.type !== "questionnaire_import_job" || !body.jobId) {
    console.warn("[questionnaire-import-worker] ignoring unknown message type:", body.type);
    return;
  }

  const job = await deps.db.questionnaireImportJob.findUnique({ where: { id: body.jobId } });
  if (!job) {
    console.warn(`[questionnaire-import-worker] job ${body.jobId} not found — dropping message`);
    return;
  }

  if (job.status === "running") {
    const runningSince = (job.startedAt ?? job.createdAt).getTime();
    if (Date.now() - runningSince > STALE_RUNNING_MS) {
      // Redelivery of a job whose owner died mid-run. A partial import
      // cannot be safely replayed (the Questionnaire row may already
      // exist), so fail it with a note instead of retrying.
      console.warn(
        `[questionnaire-import-worker] job ${job.id} stuck in running since ` +
          `${new Date(runningSince).toISOString()} — marking failed`,
      );
      await failStuckJob(deps, job.id);
    } else {
      // Visibility-timeout redelivery while the job is legitimately
      // in-flight (imports can outlast the queue's visibility timeout).
      // Ack and drop; the owner will finish it.
      console.log(
        `[questionnaire-import-worker] job ${job.id} still running — skipping redelivery`,
      );
    }
    return;
  }

  if (job.status !== "pending") {
    // Terminal (completed/partial/failed) — duplicate delivery, no-op.
    return;
  }

  await deps.run(job.id);
}

/** Compare-and-set so a job that just completed is never clobbered. */
async function failStuckJob(deps: ImportWorkerDeps, jobId: string): Promise<void> {
  await deps.db.questionnaireImportJob.updateMany({
    where: { id: jobId, status: "running" },
    data: {
      status: "failed",
      completedAt: new Date(),
      errorCode: "IMPORT_INTERRUPTED",
      errorMessage: INTERRUPTED_MESSAGE,
    },
  });
}

// ─── Stale-job sweep (re-drive guard) ───────────────────────────────

/**
 * Reset jobs orphaned by a crash/restart so the polling UI never spins
 * forever. Runs once on worker start:
 *   • `running` older than {@link STALE_RUNNING_MS} → `failed`
 *     ("interrupted", e.g. process died mid-import).
 *   • `pending` older than {@link STALE_PENDING_MS} → `failed`
 *     ("never started", e.g. the in-process fallback lost the job).
 */
export async function sweepStaleImportJobs(
  deps: ImportWorkerDeps = defaultDeps(),
  now: Date = new Date(),
): Promise<{ interrupted: number; neverStarted: number }> {
  const interrupted = await deps.db.questionnaireImportJob.updateMany({
    where: { status: "running", startedAt: { lt: new Date(now.getTime() - STALE_RUNNING_MS) } },
    data: {
      status: "failed",
      completedAt: now,
      errorCode: "IMPORT_INTERRUPTED",
      errorMessage: INTERRUPTED_MESSAGE,
    },
  });

  const neverStarted = await deps.db.questionnaireImportJob.updateMany({
    where: { status: "pending", createdAt: { lt: new Date(now.getTime() - STALE_PENDING_MS) } },
    data: {
      status: "failed",
      completedAt: now,
      errorCode: "IMPORT_NEVER_STARTED",
      errorMessage: NEVER_STARTED_MESSAGE,
    },
  });

  if (interrupted.count > 0 || neverStarted.count > 0) {
    console.warn(
      `[questionnaire-import-worker] stale-job sweep: ${interrupted.count} interrupted, ` +
        `${neverStarted.count} never started`,
    );
  }

  return { interrupted: interrupted.count, neverStarted: neverStarted.count };
}

// ─── Worker lifecycle (wired in index.ts, like research-results) ────

let subscription: Subscription | null = null;

export async function startQuestionnaireImportWorker(): Promise<void> {
  // Re-drive guard first, so jobs orphaned by the previous process
  // reach a terminal state even if their queue message is gone.
  try {
    await sweepStaleImportJobs();
  } catch (err) {
    console.error("[questionnaire-import-worker] stale-job sweep failed:", err);
  }

  const queue = getQueueProvider();

  console.log("[questionnaire-import-worker] subscribing to", QUEUE_URLS.questionnaireImportJobs);

  subscription = queue.subscribe(
    QUEUE_URLS.questionnaireImportJobs,
    async (message: ReceivedMessage) => {
      await handleImportJobMessage(message);
    },
    // Imports are heavy (one LLM call per sheet, 30–180 s per job), so
    // keep per-poll concurrency low — unlike the lightweight
    // research-results consumer which takes 5 at a time.
    { pollingInterval: 2_000, maxMessages: 2 },
  );

  console.log("[questionnaire-import-worker] started");
}

export async function stopQuestionnaireImportWorker(): Promise<void> {
  if (subscription) {
    await subscription.unsubscribe();
    subscription = null;
    console.log("[questionnaire-import-worker] stopped");
  }
}
