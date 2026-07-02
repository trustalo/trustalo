/**
 * Notifications & alerting — shared domain logic used by the router, the
 * periodic evaluator, and the channel senders.
 *
 * Security contract:
 *  - Channel config (webhook URL / email recipient list) is a SECRET at
 *    rest: it is always stored through the AES-256-GCM crypto-envelope
 *    (`enc:v1:`) and is never echoed back through the API — reads return a
 *    masked preview only (same write-only contract as AI provider keys).
 *  - Everything is tenant-scoped via `prismaWithTenant`; the evaluator
 *    passes the tenant-bound client in.
 */

import { z } from "zod";
import { decryptString, encryptString } from "../../lib/crypto-envelope.js";

// ── Channel config ──────────────────────────────────────────────────

export const CHANNEL_TYPES = ["email", "slack_webhook", "teams_webhook"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

const emailChannelConfigSchema = z
  .object({
    recipients: z.array(z.string().email()).min(1).max(50),
  })
  .strict();

const webhookChannelConfigSchema = z
  .object({
    url: z
      .string()
      .url()
      .refine((u) => u.startsWith("https://"), { message: "Webhook URL must use https" }),
  })
  .strict();

/**
 * Channel create/update payload. `.strict()` everywhere so a client cannot
 * echo server-side fields (`configEnc`, `configPreview`, `tenantId`) back
 * into a write.
 */
export const channelCreateSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("email"),
      name: z.string().min(1).max(120),
      config: emailChannelConfigSchema,
      enabled: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("slack_webhook"),
      name: z.string().min(1).max(120),
      config: webhookChannelConfigSchema,
      enabled: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("teams_webhook"),
      name: z.string().min(1).max(120),
      config: webhookChannelConfigSchema,
      enabled: z.boolean().optional(),
    })
    .strict(),
]);

/** Partial update: name/enabled always allowed; config replaces wholesale. */
export const channelPatchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    enabled: z.boolean().optional(),
    config: z.union([emailChannelConfigSchema, webhookChannelConfigSchema]).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "Empty patch" });

export type EmailChannelConfig = z.infer<typeof emailChannelConfigSchema>;
export type WebhookChannelConfig = z.infer<typeof webhookChannelConfigSchema>;
export type ChannelConfig = EmailChannelConfig | WebhookChannelConfig;

/** Validate a config blob against the channel type it is being stored for. */
export function parseChannelConfig(type: ChannelType, config: unknown): ChannelConfig {
  return type === "email"
    ? emailChannelConfigSchema.parse(config)
    : webhookChannelConfigSchema.parse(config);
}

/** Serialize + envelope-encrypt a channel config for persistence. */
export function encryptChannelConfig(config: ChannelConfig): string {
  return encryptString(JSON.stringify(config));
}

/** Decrypt a stored channel config. Throws on tampered/malformed envelopes. */
export function decryptChannelConfig(configEnc: string): ChannelConfig {
  return JSON.parse(decryptString(configEnc)) as ChannelConfig;
}

/**
 * Human preview of a channel config that is safe to return from the API.
 * Never includes the webhook path/token — only the host. Email recipients
 * are shown counted, with the first address partially masked.
 */
export function channelConfigPreview(type: ChannelType, config: ChannelConfig): string {
  if (type === "email") {
    const { recipients } = config as EmailChannelConfig;
    const first = recipients[0] ?? "";
    const masked = maskEmail(first);
    return recipients.length === 1 ? masked : `${masked} +${recipients.length - 1} more`;
  }
  const { url } = config as WebhookChannelConfig;
  try {
    return `https://${new URL(url).host}/…`;
  } catch {
    return "https://…";
  }
}

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 1) return `…${email.slice(at)}`;
  return `${email.slice(0, 2)}…${email.slice(at)}`;
}

// ── Alert rules ─────────────────────────────────────────────────────

export const RULE_KEYS = [
  "control_failing",
  "integration_sync_failed",
  "device_at_risk",
  "person_offboarding_incomplete",
  "background_check_expiring",
  "training_overdue",
  "incident_breach_clock",
] as const;
export type RuleKey = (typeof RULE_KEYS)[number];

export const RULE_LABELS: Record<RuleKey, string> = {
  control_failing: "Control weakness open",
  integration_sync_failed: "Integration sync failed",
  device_at_risk: "Device at risk",
  person_offboarding_incomplete: "Offboarding incomplete",
  background_check_expiring: "Background check expiring",
  training_overdue: "Training overdue",
  incident_breach_clock: "Breach notification clock",
};

const severityEnum = z.enum(["low", "medium", "high", "critical"]);

/**
 * Per-rule threshold config schemas. Every field has a default so a
 * `{}` config is always valid — that is also what the lazy seeding stores.
 */
export const RULE_CONFIG_SCHEMAS: Record<RuleKey, z.ZodType<Record<string, unknown>>> = {
  // Minimum ControlWeakness severity that raises an alert.
  control_failing: z.object({ minSeverity: severityEnum.default("medium") }).strict(),
  integration_sync_failed: z.object({}).strict(),
  device_at_risk: z.object({}).strict(),
  // Days a person may sit `offboarded` with open offboarding items.
  person_offboarding_incomplete: z
    .object({ olderThanDays: z.number().int().min(0).max(365).default(7) })
    .strict(),
  // Alert this many days before a background check's expiresAt.
  background_check_expiring: z
    .object({ thresholdDays: z.number().int().min(1).max(365).default(30) })
    .strict(),
  // Days past the program due date before an incomplete assignment alerts.
  training_overdue: z.object({ graceDays: z.number().int().min(0).max(365).default(0) }).strict(),
  // Alert when a 72h regulatory clock is within this many hours of expiry.
  incident_breach_clock: z
    .object({ thresholdHours: z.number().int().min(1).max(720).default(24) })
    .strict(),
};

export const rulePatchSchema = z
  .object({
    enabled: z.boolean().optional(),
    config: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine((v) => v.enabled !== undefined || v.config !== undefined, { message: "Empty patch" });

export function parseRuleConfig(ruleKey: RuleKey, config: unknown): Record<string, unknown> {
  return RULE_CONFIG_SCHEMAS[ruleKey].parse(config ?? {});
}

export interface AlertRuleRow {
  id: string;
  ruleKey: RuleKey;
  enabled: boolean;
  config: Record<string, unknown>;
}

/**
 * Minimal Prisma-shaped client the service needs. Structural typing keeps
 * the evaluator/service testable with a plain in-memory fake.
 */
interface AlertRuleDb {
  alertRule: {
    findMany(args: unknown): Promise<
      Array<{
        id: string;
        ruleKey: string;
        enabled: boolean;
        config: unknown;
      }>
    >;
    createMany(args: unknown): Promise<unknown>;
  };
}

/**
 * Return the tenant's alert rules, lazily seeding any missing rows with
 * defaults (enabled, default thresholds). `createMany + skipDuplicates`
 * keeps a concurrent first-read race harmless — the unique
 * (tenantId, ruleKey) index arbitrates.
 */
export async function ensureAlertRules(db: AlertRuleDb, tenantId: string): Promise<AlertRuleRow[]> {
  const existing = await db.alertRule.findMany({ where: {} });
  const have = new Set(existing.map((r) => r.ruleKey));
  const missing = RULE_KEYS.filter((k) => !have.has(k));
  if (missing.length > 0) {
    await db.alertRule.createMany({
      data: missing.map((ruleKey) => ({
        tenantId,
        ruleKey,
        enabled: true,
        config: parseRuleConfig(ruleKey, {}),
      })),
      skipDuplicates: true,
    });
  }
  const rows = missing.length > 0 ? await db.alertRule.findMany({ where: {} }) : existing;
  return rows
    .filter((r): r is typeof r & { ruleKey: RuleKey } => RULE_KEYS.includes(r.ruleKey as RuleKey))
    .map((r) => ({
      id: r.id,
      ruleKey: r.ruleKey,
      enabled: r.enabled,
      // Re-parse stored config through the schema so removed/renamed fields
      // degrade to defaults instead of leaking arbitrary JSON to callers.
      config: safeRuleConfig(r.ruleKey, r.config),
    }))
    .sort((a, b) => RULE_KEYS.indexOf(a.ruleKey) - RULE_KEYS.indexOf(b.ruleKey));
}

function safeRuleConfig(ruleKey: RuleKey, config: unknown): Record<string, unknown> {
  try {
    return parseRuleConfig(ruleKey, config);
  } catch {
    return parseRuleConfig(ruleKey, {});
  }
}
