import { describe, expect, test } from "bun:test";
import type { ReceivedMessage } from "@trustalo/queue";
import {
  enqueueImportJob,
  handleImportJobMessage,
  sweepStaleImportJobs,
  STALE_PENDING_MS,
  STALE_RUNNING_MS,
  type ImportWorkerDeps,
} from "./import-worker.js";

// ─── Fakes ──────────────────────────────────────────────────────────

interface PublishCall {
  url: string;
  body: Record<string, unknown>;
  attributes?: Record<string, string>;
}

interface UpdateManyCall {
  where: Record<string, unknown>;
  data: Record<string, unknown>;
}

interface FakeJobRow {
  id: string;
  status: string;
  startedAt: Date | null;
  createdAt: Date;
}

/**
 * Builds an `ImportWorkerDeps` whose queue/db/runner record every call.
 * `publishError` makes `queue.publish` throw (queue unreachable);
 * `jobs` seeds the fake job table for the consumer/sweep paths.
 * `schedule` invokes synchronously so the dev fallback is observable
 * without waiting on the event loop.
 */
function makeDeps(options: { publishError?: Error; jobs?: FakeJobRow[] } = {}) {
  const published: PublishCall[] = [];
  const runs: string[] = [];
  const updateManyCalls: UpdateManyCall[] = [];
  const jobs = options.jobs ?? [];

  const deps: ImportWorkerDeps = {
    queueUrl: "http://localhost:4566/000000000000/trustalo-questionnaire-import-jobs",
    queue: {
      publish: async (url, message) => {
        if (options.publishError) throw options.publishError;
        published.push({ url, body: message.body, attributes: message.attributes });
        return "fake-message-id";
      },
    },
    db: {
      questionnaireImportJob: {
        findUnique: async (args) => jobs.find((j) => j.id === args.where.id) ?? null,
        updateMany: async (args) => {
          updateManyCalls.push(args);
          // Emulate enough of Prisma's where semantics ({ field: { lt } }
          // and equality) that stale-cutoff assertions are real.
          const where = args.where as {
            id?: string;
            status?: string;
            startedAt?: { lt: Date };
            createdAt?: { lt: Date };
          };
          const count = jobs.filter(
            (j) =>
              (where.id === undefined || j.id === where.id) &&
              (where.status === undefined || j.status === where.status) &&
              (where.startedAt === undefined ||
                (j.startedAt !== null && j.startedAt < where.startedAt.lt)) &&
              (where.createdAt === undefined || j.createdAt < where.createdAt.lt),
          ).length;
          return { count };
        },
      },
    },
    run: async (jobId) => {
      runs.push(jobId);
    },
    schedule: (fn) => fn(),
  };

  return { deps, published, runs, updateManyCalls };
}

function makeMessage(body: Record<string, unknown>): ReceivedMessage {
  return {
    id: "m-1",
    receiptHandle: "rh-1",
    body,
    attributes: {},
    receivedAt: new Date(),
  };
}

const flushScheduled = () => new Promise((resolve) => setImmediate(resolve));

// ─── Publisher (enqueue-on-upload) ─────────────────────────────────

describe("enqueueImportJob", () => {
  test("publishes the job envelope to the questionnaire-import queue", async () => {
    const { deps, published, runs } = makeDeps();

    await enqueueImportJob({ id: "job-1", tenantId: "tenant-1" }, deps);

    expect(published).toHaveLength(1);
    expect(published[0]!.url).toBe(deps.queueUrl);
    expect(published[0]!.body).toEqual({
      type: "questionnaire_import_job",
      jobId: "job-1",
      tenantId: "tenant-1",
    });
    expect(published[0]!.attributes).toEqual({
      messageType: "questionnaire_import_job",
      jobId: "job-1",
      tenantId: "tenant-1",
    });
    // The queue owns the job now — nothing runs in-process.
    expect(runs).toHaveLength(0);
  });

  test("falls back to the in-process runner when publish fails (dev without a queue)", async () => {
    const { deps, runs } = makeDeps({ publishError: new Error("ECONNREFUSED 127.0.0.1:4566") });

    // Must not throw: the 202 response contract depends on it.
    await enqueueImportJob({ id: "job-2", tenantId: "tenant-1" }, deps);
    await flushScheduled();

    expect(runs).toEqual(["job-2"]);
  });
});

// ─── Consumer ──────────────────────────────────────────────────────

describe("handleImportJobMessage", () => {
  test("runs a pending job", async () => {
    const { deps, runs } = makeDeps({
      jobs: [{ id: "job-1", status: "pending", startedAt: null, createdAt: new Date() }],
    });

    await handleImportJobMessage(
      makeMessage({ type: "questionnaire_import_job", jobId: "job-1", tenantId: "tenant-1" }),
      deps,
    );

    expect(runs).toEqual(["job-1"]);
  });

  test("ignores unknown message types", async () => {
    const { deps, runs, updateManyCalls } = makeDeps();

    await handleImportJobMessage(makeMessage({ type: "vendor_research_request" }), deps);

    expect(runs).toHaveLength(0);
    expect(updateManyCalls).toHaveLength(0);
  });

  test("drops messages for jobs that no longer exist", async () => {
    const { deps, runs } = makeDeps({ jobs: [] });

    await handleImportJobMessage(
      makeMessage({ type: "questionnaire_import_job", jobId: "gone", tenantId: "tenant-1" }),
      deps,
    );

    expect(runs).toHaveLength(0);
  });

  test("skips redelivery while a job is legitimately still running", async () => {
    const { deps, runs, updateManyCalls } = makeDeps({
      jobs: [
        {
          id: "job-1",
          status: "running",
          startedAt: new Date(Date.now() - 60_000), // 1 min — well under the threshold
          createdAt: new Date(Date.now() - 90_000),
        },
      ],
    });

    await handleImportJobMessage(
      makeMessage({ type: "questionnaire_import_job", jobId: "job-1", tenantId: "tenant-1" }),
      deps,
    );

    expect(runs).toHaveLength(0);
    expect(updateManyCalls).toHaveLength(0);
  });

  test("fails a job stuck in running past the stale threshold instead of re-running it", async () => {
    const staleSince = new Date(Date.now() - STALE_RUNNING_MS - 60_000);
    const { deps, runs, updateManyCalls } = makeDeps({
      jobs: [{ id: "job-1", status: "running", startedAt: staleSince, createdAt: staleSince }],
    });

    await handleImportJobMessage(
      makeMessage({ type: "questionnaire_import_job", jobId: "job-1", tenantId: "tenant-1" }),
      deps,
    );

    expect(runs).toHaveLength(0);
    expect(updateManyCalls).toHaveLength(1);
    // Compare-and-set: only flips the row if it is still `running`.
    expect(updateManyCalls[0]!.where).toEqual({ id: "job-1", status: "running" });
    expect(updateManyCalls[0]!.data.status).toBe("failed");
    expect(updateManyCalls[0]!.data.errorCode).toBe("IMPORT_INTERRUPTED");
    expect(updateManyCalls[0]!.data.errorMessage).toBeString();
  });

  test("no-ops on terminal jobs (duplicate delivery)", async () => {
    const { deps, runs, updateManyCalls } = makeDeps({
      jobs: [{ id: "job-1", status: "completed", startedAt: new Date(), createdAt: new Date() }],
    });

    await handleImportJobMessage(
      makeMessage({ type: "questionnaire_import_job", jobId: "job-1", tenantId: "tenant-1" }),
      deps,
    );

    expect(runs).toHaveLength(0);
    expect(updateManyCalls).toHaveLength(0);
  });
});

// ─── Stale-job sweep ───────────────────────────────────────────────

describe("sweepStaleImportJobs", () => {
  test("fails stale running and stale pending jobs with distinct notes", async () => {
    const now = new Date("2026-07-02T12:00:00Z");
    const { deps, updateManyCalls } = makeDeps({
      jobs: [
        {
          id: "stuck-running",
          status: "running",
          startedAt: new Date(now.getTime() - STALE_RUNNING_MS - 1),
          createdAt: now,
        },
        {
          id: "stuck-pending",
          status: "pending",
          startedAt: null,
          createdAt: new Date(now.getTime() - STALE_PENDING_MS - 1),
        },
      ],
    });

    const result = await sweepStaleImportJobs(deps, now);

    expect(result).toEqual({ interrupted: 1, neverStarted: 1 });
    expect(updateManyCalls).toHaveLength(2);

    const [runningSweep, pendingSweep] = updateManyCalls;
    expect(runningSweep!.where).toEqual({
      status: "running",
      startedAt: { lt: new Date(now.getTime() - STALE_RUNNING_MS) },
    });
    expect(runningSweep!.data.status).toBe("failed");
    expect(runningSweep!.data.errorCode).toBe("IMPORT_INTERRUPTED");

    expect(pendingSweep!.where).toEqual({
      status: "pending",
      createdAt: { lt: new Date(now.getTime() - STALE_PENDING_MS) },
    });
    expect(pendingSweep!.data.status).toBe("failed");
    expect(pendingSweep!.data.errorCode).toBe("IMPORT_NEVER_STARTED");
  });

  test("thresholds are generous enough that fresh jobs are untouched", async () => {
    const now = new Date();
    const { deps } = makeDeps({
      jobs: [
        // Started 5 minutes ago — a slow multi-sheet import, still alive.
        {
          id: "alive",
          status: "running",
          startedAt: new Date(now.getTime() - 5 * 60_000),
          createdAt: now,
        },
        // Created 5 minutes ago — waiting in a queue backlog.
        {
          id: "queued",
          status: "pending",
          startedAt: null,
          createdAt: new Date(now.getTime() - 5 * 60_000),
        },
      ],
    });

    const result = await sweepStaleImportJobs(deps, now);

    expect(result).toEqual({ interrupted: 0, neverStarted: 0 });
  });
});
