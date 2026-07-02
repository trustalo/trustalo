/**
 * Custom ("from prompt") checks — domain logic.
 *
 * A custom check is an `IntegrationCheck` row with `runner = "http"`,
 * `manifestKey = "custom.<id>"` and a schema-validated `HttpCheckSpec`
 * in `spec`. All custom checks for a tenant hang off one synthetic
 * `IntegrationConnection` bound to the `custom` catalog row, so the
 * existing scheduler / runner / evidence pipeline picks them up without
 * special-casing persistence:
 *
 *   save → IntegrationCheck row → scheduler creates CollectionJob →
 *   runner executes the spec → IntegrationCheckResult + EvidenceResult →
 *   `/internal/evidence/bulk` (HMAC) → API Evidence rows.
 *
 * Secrets: never stored in the spec. A header value may reference a
 * SecretVault entry via `{{secret:KEY}}`; the vault row is owned by the
 * tenant's custom connection (`IntegrationConnection.secretId`) exactly
 * like connector credentials.
 *
 * Browser checks are intentionally NOT executable yet. Every surface
 * that receives one answers with the structured `not_supported` payload
 * below instead of a 5xx, so clients can distinguish "roadmap" from
 * "outage".
 */

import { HttpCheckSpecSchema, type HttpCheckSpec } from "@trustalo/integration-manifests";
import { Prisma } from "../../../generated/prisma/client/index.js";
import { prisma } from "../../db/prisma.js";
import { SecretVaultService } from "../../secret-vault/service.js";
import { resolveFrameworkRefs } from "../../lib/api-client.js";
import {
  runHttpCheck,
  type HttpRunResult,
  type RunHttpCheckOptions,
} from "./http-check-executor.js";

/** Catalog slug for the synthetic integration that owns custom checks. */
export const CUSTOM_INTEGRATION_ID = "custom";

/** Default cadence for the synthetic custom connection (daily). */
const DEFAULT_SYNC_FREQUENCY_MINUTES = 1440;
/** Floor mirrors `createConnectionSchema` (`syncFrequencyMinutes >= 5`). */
const MIN_SYNC_FREQUENCY_MINUTES = 5;

// ── Browser checks: honest "not yet available" contract ────────────

export const BROWSER_NOT_SUPPORTED = {
  status: "not_supported" as const,
  runner: "browser" as const,
  code: "BROWSER_RUNNER_NOT_AVAILABLE",
  message:
    "Browser-based checks are on the roadmap but not yet available. " +
    "Re-phrase the check as an HTTPS request (status code, header, body substring, or TLS expiry).",
};

// ── Cron helpers (pure — unit tested) ───────────────────────────────

const CRON_FIELD = /^(\*(\/\d{1,2})?|\d{1,2}(-\d{1,2})?(\/\d{1,2})?(,\d{1,2}(-\d{1,2})?)*)$/;

/** Cheap 5-field cron validation. Returns false for anything exotic. */
export function isValidCronSchedule(expr: string): boolean {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) return false;
  return fields.every((f) => CRON_FIELD.test(f));
}

/**
 * Best-effort translation of a cron expression into a sync interval in
 * minutes. The scheduler is connection-granular (`syncFrequencyMinutes`),
 * so we use this to make the custom connection sync at least as often
 * as its most frequent check. Unknown shapes fall back to daily.
 */
export function cronToIntervalMinutes(expr: string): number {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) return DEFAULT_SYNC_FREQUENCY_MINUTES;
  const [minute, hour, dayOfMonth, , dayOfWeek] = fields as [
    string,
    string,
    string,
    string,
    string,
  ];

  // "*/N * * * *" — every N minutes.
  const minuteStep = minute.match(/^\*\/(\d{1,2})$/);
  if (minuteStep && hour === "*") {
    return clampInterval(Number(minuteStep[1]));
  }
  // "M * * * *" — hourly.
  if (/^\d{1,2}$/.test(minute) && hour === "*") return 60;
  // "M */N * * *" — every N hours.
  const hourStep = hour.match(/^\*\/(\d{1,2})$/);
  if (hourStep) return clampInterval(Number(hourStep[1]) * 60);
  // "M H * * *" — daily.
  if (/^\d{1,2}$/.test(minute) && /^\d{1,2}$/.test(hour) && dayOfMonth === "*" && dayOfWeek === "*")
    return 1440;
  // "M H * * D" — weekly.
  if (/^\d{1,2}$/.test(minute) && /^\d{1,2}$/.test(hour) && /^\d{1,2}$/.test(dayOfWeek))
    return 7 * 1440;

  return DEFAULT_SYNC_FREQUENCY_MINUTES;
}

function clampInterval(minutes: number): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return DEFAULT_SYNC_FREQUENCY_MINUTES;
  return Math.max(MIN_SYNC_FREQUENCY_MINUTES, Math.min(minutes, 43_200));
}

// ── Ad-hoc spec testing (used by POST /checks/test) ─────────────────

export type SpecTestOutcome =
  | { kind: "result"; result: HttpRunResult }
  | { kind: "not_supported"; payload: typeof BROWSER_NOT_SUPPORTED }
  | { kind: "invalid_spec"; issues: unknown };

/**
 * Validate + execute a runner spec once. HTTP specs run through the
 * shared executor; browser specs come back as a structured
 * `not_supported` outcome (never a 5xx).
 */
export async function evaluateSpecForTest(
  runner: string,
  spec: unknown,
  options: RunHttpCheckOptions = {},
): Promise<SpecTestOutcome> {
  if (runner === "browser") {
    return { kind: "not_supported", payload: BROWSER_NOT_SUPPORTED };
  }
  const parsed = HttpCheckSpecSchema.safeParse(spec);
  if (!parsed.success) {
    return { kind: "invalid_spec", issues: parsed.error.flatten() };
  }
  const result = await runHttpCheck(parsed.data, options);
  return { kind: "result", result };
}

// ── Persistence (save flow) ─────────────────────────────────────────

export interface SaveCustomCheckInput {
  tenantId: string;
  prompt: string;
  spec: HttpCheckSpec;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  /** Validated 5-field cron expression. */
  schedule: string;
  modelUsed?: string | undefined;
  /** Pre-resolved tenant Control ids to bind (explicit user choice). */
  controlIds?: string[] | undefined;
  /** Advisory framework refs from generation; resolved via the API. */
  frameworkRefs?: Array<{ framework: string; requirement: string; note?: string }> | undefined;
  /**
   * Named secrets referenced by `{{secret:KEY}}` placeholders in the
   * spec headers. Stored in the connection's SecretVault row — never in
   * the spec itself.
   */
  secrets?: Record<string, string> | undefined;
}

export interface SavedCustomCheck {
  id: string;
  connectionId: string;
  manifestKey: string;
  title: string;
  description: string | null;
  severity: string;
  schedule: string;
  runner: string;
  isEnabled: boolean;
  lastStatus: string;
  lastRunAt: Date | null;
  controls: Array<{ control: { id: string; title: string } }>;
  results: never[];
  /** Control ids the check was bound to (explicit + resolved refs). */
  boundControlIds: string[];
  /** Framework refs that didn't resolve to any tenant control. */
  unresolvedRefs: Array<{ framework: string; requirement: string; reason: string }>;
}

/**
 * Find-or-create the tenant's synthetic "Custom checks" connection.
 * The catalog row is upserted with `isActive: false` so it never shows
 * up in the public connect catalog (which filters on `isActive`).
 */
export async function ensureCustomConnection(
  tenantId: string,
): Promise<{ id: string; secretId: string | null; syncFrequencyMinutes: number }> {
  await prisma.integration.upsert({
    where: { id: CUSTOM_INTEGRATION_ID },
    update: {},
    create: {
      id: CUSTOM_INTEGRATION_ID,
      name: "Custom checks",
      description:
        "Synthetic integration that owns AI-authored and hand-written HTTP checks. Not connectable from the catalog.",
      authType: "api_key",
      category: "custom",
      capabilities: ["http_check"],
      configSchema: { fields: [] },
      isActive: false,
    },
  });

  const existing = await prisma.integrationConnection.findFirst({
    where: { tenantId, integrationId: CUSTOM_INTEGRATION_ID },
    select: { id: true, secretId: true, syncFrequencyMinutes: true },
  });
  if (existing) return existing;

  const created = await prisma.integrationConnection.create({
    data: {
      tenantId,
      integrationId: CUSTOM_INTEGRATION_ID,
      name: "Custom checks",
      // "connected" from birth: there is no credential handshake — the
      // scheduler only dispatches connected+active connections.
      status: "connected",
      isActive: true,
      syncFrequencyMinutes: DEFAULT_SYNC_FREQUENCY_MINUTES,
    },
    select: { id: true, secretId: true, syncFrequencyMinutes: true },
  });
  return created;
}

/**
 * Persist a schema-validated custom HTTP check as a runnable
 * `IntegrationCheck` + control bindings, ready for scheduler pickup.
 */
export async function saveCustomCheck(input: SaveCustomCheckInput): Promise<SavedCustomCheck> {
  const connection = await ensureCustomConnection(input.tenantId);

  // Vault write BEFORE the check row: a check whose placeholders can't
  // resolve should never exist. Merge into the existing payload so
  // multiple checks can share the connection vault.
  if (input.secrets && Object.keys(input.secrets).length > 0) {
    if (connection.secretId) {
      const current = await SecretVaultService.read(connection.secretId);
      await SecretVaultService.update(connection.secretId, {
        payload: { ...current, ...input.secrets },
      });
    } else {
      const secretId = await SecretVaultService.create({
        tenantId: input.tenantId,
        scope: "integration_connection",
        ownerType: "integration_connection",
        ownerId: connection.id,
        payload: input.secrets,
      });
      await prisma.integrationConnection.update({
        where: { id: connection.id },
        data: { secretId },
      });
    }
  }

  // Resolve advisory framework refs → tenant Control ids. Best-effort:
  // a resolver outage must not block the save (the reconciler / a
  // manual re-bind can attach controls later).
  const boundControlIds = new Set<string>(input.controlIds ?? []);
  const unresolvedRefs: SavedCustomCheck["unresolvedRefs"] = [];
  if (input.frameworkRefs && input.frameworkRefs.length > 0) {
    try {
      const resolved = await resolveFrameworkRefs(input.tenantId, input.frameworkRefs);
      for (const ref of resolved) {
        if (ref.controlIds.length === 0) {
          unresolvedRefs.push({
            framework: ref.framework,
            requirement: ref.requirement,
            reason: ref.reason ?? "unknown",
          });
          continue;
        }
        for (const id of ref.controlIds) boundControlIds.add(id);
      }
    } catch (err) {
      console.error(
        "[custom-checks] framework-ref resolution failed (saving without bindings):",
        err instanceof Error ? err.message : err,
      );
      for (const ref of input.frameworkRefs) {
        unresolvedRefs.push({
          framework: ref.framework,
          requirement: ref.requirement,
          reason: "unknown",
        });
      }
    }
  }

  const manifestKey = `custom.${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const now = new Date();

  const check = await prisma.$transaction(async (tx) => {
    const created = await tx.integrationCheck.create({
      data: {
        tenantId: input.tenantId,
        connectionId: connection.id,
        integrationId: CUSTOM_INTEGRATION_ID,
        manifestKey,
        title: input.title,
        description: input.description,
        severity: input.severity,
        schedule: input.schedule,
        runner: "http",
        spec: input.spec as unknown as Prisma.InputJsonValue,
        aiPrompt: input.prompt,
        aiModel: input.modelUsed ?? null,
        isEnabled: true,
        lastStatus: "pending",
      },
    });

    // Bindings created ENABLED: unlike connect-time bulk binding, the
    // human reviewed this specific check + its mappings and clicked
    // save — that is the required human approval for the advisory AI
    // contract.
    for (const controlId of boundControlIds) {
      await tx.integrationCheckControl.create({
        data: {
          tenantId: input.tenantId,
          integrationCheckId: created.id,
          connectionId: connection.id,
          controlId,
          isEnabled: true,
          lastReconciledAt: now,
        },
      });
    }

    // Sync the connection cadence to the most frequent check so the
    // scheduler honours (at least approximately) the requested cron.
    const interval = cronToIntervalMinutes(input.schedule);
    if (interval < connection.syncFrequencyMinutes) {
      await tx.integrationConnection.update({
        where: { id: connection.id },
        data: { syncFrequencyMinutes: interval },
      });
    }

    return created;
  });

  return {
    id: check.id,
    connectionId: check.connectionId,
    manifestKey: check.manifestKey,
    title: check.title,
    description: check.description,
    severity: check.severity,
    schedule: check.schedule,
    runner: check.runner,
    isEnabled: check.isEnabled,
    lastStatus: check.lastStatus,
    lastRunAt: check.lastRunAt,
    controls: [...boundControlIds].sort().map((id) => ({ control: { id, title: id } })),
    results: [],
    boundControlIds: [...boundControlIds].sort(),
    unresolvedRefs,
  };
}
