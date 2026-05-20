/**
 * Operator-level configuration for the Trustalo-managed LiteLLM proxy.
 *
 * Parsed once at boot. When `LITELLM_BASE_URL` and `LITELLM_MASTER_KEY`
 * are both present, the EE billing module turns on managed routing for
 * every tenant whose license includes the `ai-metered` entitlement.
 * Self-hosted deployments leave these unset and the existing precedence
 * chain (operator → org → feature) runs unchanged.
 *
 * `LITELLM_MASTER_KEY` is the admin key Trustalo uses to provision and
 * rotate per-tenant virtual keys via LiteLLM's `/key/*` endpoints. It is
 * NEVER returned by any HTTP response from the API process — the
 * `scrubSecrets` middleware redacts the literal value, and the resolver
 * never copies it into a per-call AIProvider (per-tenant virtual keys
 * are what live in the hot path).
 */

import { z } from "zod";

const schema = z
  .object({
    LITELLM_BASE_URL: z
      .string()
      .url()
      .optional()
      .transform((v) => (v ? v.replace(/\/+$/, "") : v)),
    LITELLM_MASTER_KEY: z.string().min(16).optional(),
    // HMAC secret used to verify spend webhooks from LiteLLM. Required
    // when webhooks are enabled; the webhook handler 401s if unset.
    LITELLM_WEBHOOK_SECRET: z.string().min(32).optional(),
    // Markup applied to managed-mode tenants, expressed as basis points
    // (e.g. 3000 == 30%). Required when LITELLM_BASE_URL is set. The
    // BYOK-passthrough mode hard-codes 0 regardless.
    LITELLM_MARKUP_BPS: z.coerce.number().int().min(0).max(20000).default(3000),
    // Default low-balance threshold in microcents (USD ×1_000_000). New
    // tenants inherit this when their CreditWallet is provisioned.
    LITELLM_LOW_BALANCE_THRESHOLD_MICROCENTS: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(2_000_000), // $2 default
    // Operator may opt out of forcing managed routing even when the
    // license has `ai-metered` (e.g. to debug a SaaS tenant against
    // their own keys). Defaults to true in SaaS deploys.
    LITELLM_ENFORCE_MANAGED_PROXY: z
      .enum(["true", "false"])
      .default("true")
      .transform((v) => v === "true"),
  })
  .refine(
    (v) => !v.LITELLM_BASE_URL === !v.LITELLM_MASTER_KEY,
    "LITELLM_BASE_URL and LITELLM_MASTER_KEY must be set together",
  );

export interface LiteLLMOperatorConfig {
  baseUrl: string | null;
  masterKey: string | null;
  webhookSecret: string | null;
  markupBps: number;
  lowBalanceThresholdMicrocents: bigint;
  enforceManagedProxy: boolean;
  /** Convenience derived flag — true when the managed surface is wired. */
  managedProxyEnabled: boolean;
}

let cached: LiteLLMOperatorConfig | null = null;

export function getLiteLLMConfig(): LiteLLMOperatorConfig {
  if (cached) return cached;

  const parsed = schema.parse(process.env);
  cached = {
    baseUrl: parsed.LITELLM_BASE_URL ?? null,
    masterKey: parsed.LITELLM_MASTER_KEY ?? null,
    webhookSecret: parsed.LITELLM_WEBHOOK_SECRET ?? null,
    markupBps: parsed.LITELLM_MARKUP_BPS,
    lowBalanceThresholdMicrocents: BigInt(parsed.LITELLM_LOW_BALANCE_THRESHOLD_MICROCENTS),
    enforceManagedProxy: parsed.LITELLM_ENFORCE_MANAGED_PROXY,
    managedProxyEnabled:
      Boolean(parsed.LITELLM_BASE_URL && parsed.LITELLM_MASTER_KEY) &&
      parsed.LITELLM_ENFORCE_MANAGED_PROXY,
  };
  return cached;
}

/** Test-only — clears the singleton so a fresh `process.env` is read. */
export function __resetLiteLLMConfig(): void {
  cached = null;
}
