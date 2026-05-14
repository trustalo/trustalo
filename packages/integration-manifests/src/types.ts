/**
 * Phase 3 (AI accelerators): Collector manifest schema.
 *
 * A "manifest" is a declarative bundle that describes a connector
 * (AWS, GitHub, etc.) and the set of automated checks it can run
 * against a customer's environment. Manifests are pure data — no
 * runtime side-effects — so they can be statically inspected by the
 * UI ("which checks would I get if I connected GitHub?") and by the
 * CI tooling that enforces our no-vendored-AGPL policy (the manifest's
 * `controlMappings` are written from authoritative public docs only).
 *
 * The runner package consumes manifests and dispatches each check to
 * the appropriate runtime (HTTP, AWS SDK, browser-automation). It
 * publishes results onto the SQS `INTEGRATION_CHECK_RESULTS` queue,
 * and the API worker writes them back to Postgres + creates Evidence.
 */

import { z } from "zod";

export const FrameworkRefSchema = z.object({
  /** Framework slug, e.g. "soc2", "iso27001", "essential8". */
  framework: z.string(),
  /** Requirement / control identifier as published by the framework. */
  requirement: z.string(),
  /** Optional human note explaining the mapping (used in tooltips). */
  note: z.string().optional(),
});

export const ConfigFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["string", "secret", "boolean", "number", "select"]),
  required: z.boolean().default(false),
  /** For `select` type. */
  options: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  helpText: z.string().optional(),
  defaultValue: z.unknown().optional(),
});

export const CheckSchema = z.object({
  /** Stable identifier persisted as IntegrationCheck.manifestKey. */
  key: z.string().regex(/^[a-z0-9_.-]+$/),
  title: z.string(),
  description: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  /** Cron expression honoured by the worker scheduler. */
  schedule: z.string().default("0 6 * * *"),
  /**
   * Identifies the runner module responsible for executing the check.
   * Phase 3 ships `aws_sdk`, `http`, and `oauth_api` runners; Phase 4
   * adds `browser` for natural-language checks.
   */
  runner: z.enum(["aws_sdk", "http", "oauth_api", "browser"]),
  /** Per-runner runtime parameters (validated by the runner). */
  params: z.record(z.string(), z.unknown()).default({}),
  /** Framework requirements this check helps satisfy. */
  controlMappings: z.array(FrameworkRefSchema).default([]),
});

export const ManifestSchema = z.object({
  /** Connector slug, e.g. "aws", "github". Lowercase + alphanumeric. */
  connector: z.string().regex(/^[a-z0-9_-]+$/),
  displayName: z.string(),
  description: z.string(),
  /** SVG/PNG hint for the UI tile. Resolved from a CDN at render time. */
  iconKey: z.string(),
  category: z.enum(["cloud", "identity", "code", "productivity", "endpoint", "security"]),
  /** Auth scheme; informs the UI's connect modal layout. */
  authType: z.enum(["aws_iam", "oauth2", "api_key", "service_account", "personal_access_token"]),
  configFields: z.array(ConfigFieldSchema),
  checks: z.array(CheckSchema),
});

export type FrameworkRef = z.infer<typeof FrameworkRefSchema>;
export type ConfigField = z.infer<typeof ConfigFieldSchema>;

/**
 * Author-facing manifest types. These reflect the **input** shape that
 * connector authors write by hand — fields with a `.default(...)` on the
 * zod schema (e.g. `Check.schedule`, `Check.severity`, `Check.params`,
 * `Check.controlMappings`) are optional here so authors don't repeat the
 * defaults in every check definition.
 *
 * Runtime consumers that need the fully-populated shape (e.g. the worker
 * runner that publishes `RunCheckMessage`) should use `ParsedCheck` /
 * `ParsedManifest` below — those are the post-`schema.parse(...)` types.
 */
export type Check = z.input<typeof CheckSchema>;
export type Manifest = z.input<typeof ManifestSchema>;

/** Runtime (post-parse) manifest types — defaults are filled in. */
export type ParsedCheck = z.output<typeof CheckSchema>;
export type ParsedManifest = z.output<typeof ManifestSchema>;

/** Result envelope written to the SQS results queue. */
export interface CheckResultMessage {
  type: "integration_check_result";
  tenantId: string;
  integrationId: string;
  checkId: string;
  manifestKey: string;
  status: "pass" | "fail" | "error" | "skipped";
  payload?: Record<string, unknown>;
  errorMessage?: string;
  durationMs?: number;
  /** ISO-8601 collected-at timestamp; defaults to publish time. */
  collectedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Phase 4 (AI accelerators): natural-language → automated check.
//
// Two universal runners that the LLM can target. Both schemas are STRICT;
// any property the LLM emits that isn't in this contract is rejected by
// the API before persisting. This is our prompt-injection guardrail.
// ─────────────────────────────────────────────────────────────────────────

export const HttpCheckSpecSchema = z.object({
  /** Absolute URL. The API enforces https only and a private-IP block. */
  url: z.string().url(),
  /** HTTP verb. Defaults to GET; only safe verbs are allowed via the LLM. */
  method: z.enum(["GET", "HEAD"]).default("GET"),
  /** Optional headers to send with the probe (no Authorization unless allow-listed). */
  headers: z.record(z.string(), z.string()).default({}),
  /** Hard request timeout in ms; clamped to <= 30s. */
  timeoutMs: z.number().int().positive().max(30_000).default(10_000),
  expect: z
    .object({
      /** Status code that must be returned. */
      statusCode: z.number().int().min(100).max(599).optional(),
      /** Response body must contain this substring (case-insensitive). */
      bodyContains: z.string().min(1).max(2_000).optional(),
      /** Response header equality, e.g. { "x-frame-options": "DENY" }. */
      headerEquals: z.record(z.string(), z.string()).optional(),
      /**
       * TLS leaf certificate must be valid for at least this many days
       * after now. Triggers a `tls.connect` probe on the URL host.
       */
      tlsValidForDays: z.number().int().positive().max(3650).optional(),
    })
    .refine(
      (e) =>
        e.statusCode !== undefined ||
        e.bodyContains !== undefined ||
        e.headerEquals !== undefined ||
        e.tlsValidForDays !== undefined,
      { message: "expect must define at least one assertion" },
    ),
});

export const BrowserCheckStepSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("navigate"), url: z.string().url() }),
  z.object({ action: z.literal("click"), selector: z.string().min(1) }),
  z.object({ action: z.literal("type"), selector: z.string().min(1), value: z.string() }),
  z.object({
    action: z.literal("wait_for"),
    selector: z.string().min(1),
    timeoutMs: z.number().int().positive().max(30_000).default(10_000),
  }),
  z.object({ action: z.literal("screenshot"), name: z.string().min(1).max(200) }),
]);

export const BrowserCheckSpecSchema = z.object({
  steps: z.array(BrowserCheckStepSchema).min(1).max(20),
  expect: z
    .object({
      containsText: z.string().min(1).max(2_000).optional(),
      screenshotName: z.string().min(1).max(200).optional(),
    })
    .refine((e) => e.containsText !== undefined || e.screenshotName !== undefined, {
      message: "expect must define at least one assertion",
    }),
});

export type HttpCheckSpec = z.infer<typeof HttpCheckSpecSchema>;
export type BrowserCheckStep = z.infer<typeof BrowserCheckStepSchema>;
export type BrowserCheckSpec = z.infer<typeof BrowserCheckSpecSchema>;

/** Request envelope written to the SQS run-now queue. */
export interface RunCheckMessage {
  type: "integration_check_run";
  tenantId: string;
  integrationId: string;
  checkId: string;
  manifestKey: string;
  /**
   * Full manifest check payload (post-parse, so defaults are filled in)
   * so the runner doesn't re-fetch it from the catalog.
   */
  check: ParsedCheck;
  /** Decrypted connector config; never persisted by the runner. */
  config: Record<string, unknown>;
}
