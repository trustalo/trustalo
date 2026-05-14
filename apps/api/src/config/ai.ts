/**
 * Operator-level AI configuration loaded from process.env at boot.
 *
 * Implements layer 1 of the C2 precedence chain (operator → org → feature)
 * defined in the AI accelerators plan. Validation is intentionally
 * fail-closed: if AI_PROVIDER is set to a real provider but the required
 * credentials are missing, AI features are disabled with a clear reason
 * surfaced via /api/v1/ai-config/health rather than silently falling
 * back to a different provider (which could send tenant data somewhere
 * the operator did not approve).
 */

import { z } from "zod";
import type {
  AIFeatureType,
  OperatorAIDefaults,
  OrgFeatureRow,
  OrgProviderRow,
  ResolvedAI,
} from "@trustalo/ai";
import { AINotConfiguredError, resolveAIProvider } from "@trustalo/ai";
import { prisma } from "../db/prisma.js";
import { decryptStringMaybe } from "../lib/crypto-envelope.js";

const providerEnum = z.enum(["openai", "anthropic", "bedrock", "openrouter", "none"]);

const envSchema = z.object({
  AI_PROVIDER: providerEnum.optional().default("none"),
  AI_DEFAULT_MODEL: z.string().optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().optional(),

  // Bedrock — credentials use the AWS default chain unless static keys provided.
  AI_BEDROCK_REGION: z.string().optional(),
  AI_BEDROCK_ACCESS_KEY_ID: z.string().optional(),
  AI_BEDROCK_SECRET_ACCESS_KEY: z.string().optional(),

  // OpenRouter
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().optional(),
});

let cached: OperatorAIDefaults | null = null;

/**
 * Returns the singleton operator defaults. Computed once at first read so
 * the env is parsed exactly one time per process. Tests can call
 * `__resetOperatorAIDefaults()` to force a re-read.
 */
export function getOperatorAIDefaults(): OperatorAIDefaults {
  if (cached) return cached;
  cached = computeFromEnv();
  return cached;
}

/** Test-only — clears the singleton so a fresh `process.env` is read. */
export function __resetOperatorAIDefaults(): void {
  cached = null;
}

function computeFromEnv(): OperatorAIDefaults {
  let parsed: z.infer<typeof envSchema>;
  try {
    parsed = envSchema.parse(process.env);
  } catch (err) {
    return {
      provider: null,
      model: null,
      credentials: {},
      enabled: false,
      disabledReason: `Invalid AI env vars: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (parsed.AI_PROVIDER === "none") {
    return {
      provider: null,
      model: null,
      credentials: {},
      enabled: false,
      disabledReason:
        "AI is disabled at the operator level (AI_PROVIDER unset or 'none'). Per-org configuration in Settings → AI may still enable specific features.",
    };
  }

  switch (parsed.AI_PROVIDER) {
    case "openai":
      if (!parsed.OPENAI_API_KEY)
        return disabled("openai", "OPENAI_API_KEY is required when AI_PROVIDER=openai");
      return {
        provider: "openai",
        model: parsed.AI_DEFAULT_MODEL ?? null,
        credentials: { apiKey: parsed.OPENAI_API_KEY, baseUrl: parsed.OPENAI_BASE_URL },
        enabled: true,
      };
    case "anthropic":
      if (!parsed.ANTHROPIC_API_KEY)
        return disabled("anthropic", "ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic");
      return {
        provider: "anthropic",
        model: parsed.AI_DEFAULT_MODEL ?? null,
        credentials: { apiKey: parsed.ANTHROPIC_API_KEY, baseUrl: parsed.ANTHROPIC_BASE_URL },
        enabled: true,
      };
    case "openrouter":
      if (!parsed.OPENROUTER_API_KEY)
        return disabled("openrouter", "OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter");
      return {
        provider: "openrouter",
        model: parsed.AI_DEFAULT_MODEL ?? null,
        credentials: { apiKey: parsed.OPENROUTER_API_KEY, baseUrl: parsed.OPENROUTER_BASE_URL },
        enabled: true,
      };
    case "bedrock":
      // Bedrock is special: static creds are optional. When absent, the
      // SDK default chain (IAM role, profile, env) handles auth — the
      // health endpoint does the actual chain probe.
      return {
        provider: "bedrock",
        model: parsed.AI_DEFAULT_MODEL ?? null,
        credentials: {
          region: parsed.AI_BEDROCK_REGION ?? process.env.AWS_REGION,
          accessKeyId: parsed.AI_BEDROCK_ACCESS_KEY_ID,
          secretAccessKey: parsed.AI_BEDROCK_SECRET_ACCESS_KEY,
          useDefaultChain: !(
            parsed.AI_BEDROCK_ACCESS_KEY_ID && parsed.AI_BEDROCK_SECRET_ACCESS_KEY
          ),
        },
        enabled: true,
      };
  }
}

function disabled(provider: string, reason: string): OperatorAIDefaults {
  return {
    provider: null,
    model: null,
    credentials: {},
    enabled: false,
    disabledReason: `[${provider}] ${reason}`,
  };
}

// ─── Per-org loaders with a 5-minute TTL cache ─────────────────────

interface CacheEntry<T> {
  loadedAt: number;
  value: T;
}
const TTL_MS = 5 * 60 * 1000;
const providersCache = new Map<string, CacheEntry<OrgProviderRow[]>>();
const featuresCache = new Map<string, CacheEntry<OrgFeatureRow[]>>();

async function loadOrgProviders(tenantId: string): Promise<OrgProviderRow[]> {
  const hit = providersCache.get(tenantId);
  if (hit && Date.now() - hit.loadedAt < TTL_MS) return hit.value;
  const rows = await prisma.aIProviderConfig.findMany({ where: { tenantId } });
  const value: OrgProviderRow[] = rows.map((r) => ({
    provider: r.provider as OrgProviderRow["provider"],
    apiKey: decryptStringMaybe(r.apiKey),
    region: r.region,
    accessKeyId: r.accessKeyId,
    secretAccessKey: decryptStringMaybe(r.secretAccessKey),
    baseUrl: r.baseUrl,
    isEnabled: r.isEnabled,
  }));
  providersCache.set(tenantId, { loadedAt: Date.now(), value });
  return value;
}

async function loadOrgFeatures(tenantId: string): Promise<OrgFeatureRow[]> {
  const hit = featuresCache.get(tenantId);
  if (hit && Date.now() - hit.loadedAt < TTL_MS) return hit.value;
  const rows = await prisma.aIFeatureConfig.findMany({ where: { tenantId } });
  const value: OrgFeatureRow[] = rows.map((r) => ({
    feature: r.feature as OrgFeatureRow["feature"],
    provider: r.provider as OrgFeatureRow["provider"],
    model: r.model,
    isEnabled: r.isEnabled,
  }));
  featuresCache.set(tenantId, { loadedAt: Date.now(), value });
  return value;
}

/** Invalidate caches when the org changes provider/feature config. */
export function invalidateAIConfigCache(tenantId: string): void {
  providersCache.delete(tenantId);
  featuresCache.delete(tenantId);
}

/**
 * Convenience wrapper: every API call site for an AI feature should call
 * this exactly once at the top of the handler. Throws AINotConfiguredError
 * (mapped to 503 by the central error handler) when nothing resolves.
 */
export async function resolveOrgAI(tenantId: string, feature: AIFeatureType): Promise<ResolvedAI> {
  return resolveAIProvider({
    tenantId,
    feature,
    getOperatorDefaults: getOperatorAIDefaults,
    loadOrgProviders,
    loadOrgFeatures,
  });
}

export { AINotConfiguredError };
