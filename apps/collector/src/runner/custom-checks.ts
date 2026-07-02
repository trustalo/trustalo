/**
 * Scheduled execution of custom ("from prompt") HTTP checks.
 *
 * The generic runner (`src/runner/index.ts`) executes provider
 * connections through the `IntegrationConnector` registry. The synthetic
 * `custom` connection has no connector — its work items are
 * `IntegrationCheck` rows with `runner = "http"` and a schema-validated
 * `HttpCheckSpec` in `spec`. This module is the drop-in replacement for
 * the connector's `collectEvidence` on that path:
 *
 *   1. Load the connection's enabled checks.
 *   2. Execute each HTTP spec via the shared executor (same code path
 *      as the wizard's "Test before save").
 *   3. Record an `IntegrationCheckResult` per check + per-check health
 *      bookkeeping (gaps open on runtime errors, close on recovery).
 *   4. Return `EvidenceResult` items for pass/fail outcomes — the
 *      runner submits them through the SAME `/internal/evidence/bulk`
 *      batch path as built-in connectors.
 *
 * Browser checks (should not exist yet — save rejects them) are
 * defensively recorded as `skipped` with the structured
 * `not_supported` reason rather than erroring the whole job.
 *
 * The pure core (`executeCustomChecks`) takes injectable deps so tests
 * can run the full pipeline against a mocked HTTP target without a DB.
 */

import { HttpCheckSpecSchema } from "@trustalo/integration-manifests";
import { Prisma } from "../../generated/prisma/client/index.js";
import { prisma } from "../db/prisma.js";
import { SecretVaultService } from "../secret-vault/service.js";
import { BROWSER_NOT_SUPPORTED } from "../integrations/custom/index.js";
import {
  runHttpCheck,
  type HttpRunResult,
  type RunHttpCheckOptions,
} from "../integrations/custom/http-check-executor.js";
import type { EvidenceResult } from "../integrations/core/types.js";
import { computeNextRunAt, healthStateForFailures, openOrExtendGap } from "./check-health.js";

/** Minimal shape of an `IntegrationCheck` row the executor needs. */
export interface CustomCheckRow {
  id: string;
  manifestKey: string;
  title: string;
  description: string | null;
  severity: "low" | "medium" | "high" | "critical";
  runner: string;
  spec: unknown;
  consecutiveFailures: number;
  healthState: string;
}

export interface CustomCheckOutcome {
  checkId: string;
  manifestKey: string;
  /** Persisted to IntegrationCheckResult.status. */
  status: "pass" | "fail" | "error" | "skipped";
  result: HttpRunResult | null;
  errorMessage: string | null;
  durationMs: number | null;
  /** Present for pass/fail outcomes only. */
  evidence: EvidenceResult | null;
}

export interface ExecuteCustomChecksDeps {
  /** Injectable executor — defaults to the shared HTTP executor. */
  execute?: (
    spec: Parameters<typeof runHttpCheck>[0],
    options: RunHttpCheckOptions,
  ) => Promise<HttpRunResult>;
  /** Decrypted vault payload for `{{secret:KEY}}` placeholders. */
  secrets?: Record<string, string>;
  /** Clock injection for deterministic tests. */
  now?: () => Date;
}

/**
 * Pure core: execute every check row and translate the runner output
 * into result + evidence shapes. No database access.
 */
export async function executeCustomChecks(
  checks: CustomCheckRow[],
  deps: ExecuteCustomChecksDeps = {},
): Promise<CustomCheckOutcome[]> {
  const execute = deps.execute ?? runHttpCheck;
  const now = deps.now ?? (() => new Date());
  const outcomes: CustomCheckOutcome[] = [];

  for (const check of checks) {
    if (check.runner !== "http") {
      outcomes.push({
        checkId: check.id,
        manifestKey: check.manifestKey,
        status: "skipped",
        result: null,
        errorMessage: `${BROWSER_NOT_SUPPORTED.code}: ${BROWSER_NOT_SUPPORTED.message}`,
        durationMs: null,
        evidence: null,
      });
      continue;
    }

    const parsed = HttpCheckSpecSchema.safeParse(check.spec);
    if (!parsed.success) {
      outcomes.push({
        checkId: check.id,
        manifestKey: check.manifestKey,
        status: "error",
        result: null,
        errorMessage: `INVALID_SPEC: stored spec no longer matches the HTTP check contract`,
        durationMs: null,
        evidence: null,
      });
      continue;
    }

    const result = await execute(parsed.data, { secrets: deps.secrets ?? {} });

    outcomes.push({
      checkId: check.id,
      manifestKey: check.manifestKey,
      status: result.status,
      result,
      errorMessage: result.status === "error" ? (result.error ?? "unknown error") : null,
      durationMs: result.durationMs,
      evidence:
        result.status === "error"
          ? null
          : buildEvidenceForOutcome(check, parsed.data, result, now()),
    });
  }

  return outcomes;
}

/**
 * Translate a completed HTTP run into the same `EvidenceResult` wire
 * shape provider connectors emit, so the runner's binding lookup +
 * `/internal/evidence/bulk` submission treats custom checks uniformly.
 */
export function buildEvidenceForOutcome(
  check: CustomCheckRow,
  spec: { url: string; method: string; expect: Record<string, unknown> },
  result: HttpRunResult,
  collectedAt: Date,
): EvidenceResult {
  const passed = result.status === "pass";
  return {
    title: `${check.title} — ${passed ? "passed" : "failed"}`,
    description: passed
      ? (check.description ?? `HTTP check against ${spec.url} passed.`)
      : `HTTP check against ${spec.url} failed: ${result.failures.join("; ")}`,
    manifestKey: check.manifestKey,
    sourceType: check.manifestKey,
    sourceId: check.id,
    rawData: {
      url: spec.url,
      method: spec.method,
      expect: spec.expect,
      status: result.status,
      responseStatus: result.responseStatus ?? null,
      failures: result.failures,
      durationMs: result.durationMs,
      tlsValidUntil: result.tlsValidUntil ?? null,
      bodySnippet: result.bodySnippet?.slice(0, 500) ?? null,
    },
    severity: check.severity,
    collectedAt,
  };
}

export interface RunCustomChecksArgs {
  tenantId: string;
  connection: {
    id: string;
    secretId: string | null;
    syncFrequencyMinutes: number;
  };
  deps?: ExecuteCustomChecksDeps;
}

export interface CustomChecksRunSummary {
  evidence: EvidenceResult[];
  outcomes: CustomCheckOutcome[];
  checksRun: number;
  checksErrored: number;
}

/**
 * DB orchestration used by the runner: load → execute → persist
 * results + health → return evidence for the shared submission path.
 */
export async function runCustomChecksForConnection(
  args: RunCustomChecksArgs,
): Promise<CustomChecksRunSummary> {
  const { tenantId, connection } = args;

  const checks = await prisma.integrationCheck.findMany({
    where: { connectionId: connection.id, tenantId, isEnabled: true },
    select: {
      id: true,
      manifestKey: true,
      title: true,
      description: true,
      severity: true,
      runner: true,
      spec: true,
      consecutiveFailures: true,
      healthState: true,
    },
  });

  let secrets: Record<string, string> = {};
  if (connection.secretId) {
    try {
      secrets = await SecretVaultService.read(connection.secretId);
    } catch (err) {
      console.error(
        `[custom-checks] failed to read vault for connection=${connection.id}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  const outcomes = await executeCustomChecks(checks as CustomCheckRow[], {
    ...args.deps,
    secrets: { ...secrets, ...(args.deps?.secrets ?? {}) },
  });

  const now = new Date();
  const nextRunAt = computeNextRunAt(connection.syncFrequencyMinutes);
  const checkById = new Map(checks.map((c) => [c.id, c]));

  for (const outcome of outcomes) {
    const check = checkById.get(outcome.checkId);
    if (!check) continue;

    await prisma.integrationCheckResult.create({
      data: {
        tenantId,
        integrationCheckId: outcome.checkId,
        connectionId: connection.id,
        status: outcome.status,
        payload: (outcome.result ?? undefined) as unknown as Prisma.InputJsonValue | undefined,
        errorMessage: outcome.errorMessage,
        durationMs: outcome.durationMs,
      },
    });

    if (outcome.status === "pass" || outcome.status === "fail") {
      // A pass OR fail means we successfully collected — the check is
      // operationally healthy even when the customer's environment is
      // non-compliant. Close any open coverage gap.
      await prisma.$transaction([
        prisma.integrationCheck.update({
          where: { id: outcome.checkId },
          data: {
            lastStatus: outcome.status,
            lastRunAt: now,
            lastSuccessfulRunAt: now,
            consecutiveFailures: 0,
            healthState: "healthy",
            healthChangedAt: check.healthState !== "healthy" ? now : undefined,
            healthReason: null,
            expectedNextRunAt: nextRunAt,
          },
        }),
        prisma.evidenceCoverageGap.updateMany({
          where: { tenantId, integrationCheckId: outcome.checkId, endedAt: null },
          data: { endedAt: now },
        }),
      ]);
    } else if (outcome.status === "error") {
      const nextCount = check.consecutiveFailures + 1;
      const nextState = healthStateForFailures(nextCount);
      await prisma.integrationCheck.update({
        where: { id: outcome.checkId },
        data: {
          lastStatus: "error",
          lastRunAt: now,
          consecutiveFailures: nextCount,
          healthState: nextState,
          healthChangedAt: check.healthState !== nextState ? now : undefined,
          healthReason: outcome.errorMessage,
          expectedNextRunAt: nextRunAt,
        },
      });
      // Custom checks have no in-run retry loop — the next attempt is a
      // whole sync cycle away, so an execution error is an immediate
      // loss of visibility.
      const bindings = await prisma.integrationCheckControl.findMany({
        where: { integrationCheckId: outcome.checkId, isEnabled: true },
        select: { controlId: true },
      });
      await openOrExtendGap(
        outcome.checkId,
        tenantId,
        "check_runtime_error",
        outcome.errorMessage,
        bindings.map((b) => b.controlId),
      );
    } else {
      // skipped (browser) — record the run instant but leave health as-is.
      await prisma.integrationCheck.update({
        where: { id: outcome.checkId },
        data: { lastStatus: "skipped", lastRunAt: now },
      });
    }
  }

  return {
    evidence: outcomes.flatMap((o) => (o.evidence ? [o.evidence] : [])),
    outcomes,
    checksRun: outcomes.length,
    checksErrored: outcomes.filter((o) => o.status === "error").length,
  };
}
