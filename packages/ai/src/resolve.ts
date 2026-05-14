import type { AIFeatureType, AIProviderCredentials, AIProviderType, AIProvider } from "./types.js";
import { PROVIDER_DEFAULT_MODEL } from "./types.js";
import { createAIProvider } from "./factory.js";

/**
 * AI provider resolution layer (constraint C2 in the AI accelerators plan).
 *
 * Walks the precedence: operator default → per-org config → per-feature
 * config, returning a fully-formed `AIProvider` instance the caller can
 * `chat()` against. Every AI feature route MUST go through this helper —
 * direct `createAIProvider` use is forbidden by the ai-features Cursor
 * rule because it bypasses the operator default and breaks self-hosted
 * deployments that don't have org config seeded.
 *
 * The resolution itself is a pure data lookup (no I/O once the loaders
 * are supplied), which makes it trivial to unit-test and trivial to wrap
 * in a small per-org TTL cache from the API layer.
 */

export type AIResolutionSource = "operator" | "org" | "feature";

export interface OperatorAIDefaults {
  /** Provider chosen at deploy time via env (`AI_PROVIDER`). */
  provider: AIProviderType | null;
  /** Default model when feature/org overrides are absent. */
  model: string | null;
  /** Credentials baseline; org-level keys override per-field. */
  credentials: Partial<AIProviderCredentials>;
  /** When false, AI endpoints should return 503. */
  enabled: boolean;
  /** Human-readable reason if `enabled === false` (for logs / health checks). */
  disabledReason?: string;
}

/** Shape of a row from the per-org `AIProviderConfig` table (Prisma). */
export interface OrgProviderRow {
  provider: AIProviderType;
  apiKey?: string | null;
  region?: string | null;
  accessKeyId?: string | null;
  secretAccessKey?: string | null;
  baseUrl?: string | null;
  isEnabled: boolean;
}

/** Shape of a row from the per-org `AIFeatureConfig` table (Prisma). */
export interface OrgFeatureRow {
  feature: AIFeatureType;
  provider: AIProviderType;
  model: string;
  isEnabled: boolean;
}

export interface ResolveContext {
  tenantId: string;
  feature: AIFeatureType;
  /** Returns operator defaults loaded once at boot (singleton). */
  getOperatorDefaults: () => OperatorAIDefaults;
  /**
   * Loads the org's provider rows. Caller is responsible for caching
   * (see `prismaProviderLoader` in `apps/api/src/config/ai.ts`).
   */
  loadOrgProviders: (tenantId: string) => Promise<OrgProviderRow[]>;
  loadOrgFeatures: (tenantId: string) => Promise<OrgFeatureRow[]>;
}

export interface ResolvedAI {
  provider: AIProviderType;
  model: string;
  credentials: AIProviderCredentials;
  source: AIResolutionSource;
  /** Convenience handle — avoids the caller needing to call `createAIProvider` again. */
  client: AIProvider;
}

export class AINotConfiguredError extends Error {
  readonly code = "AI_NOT_CONFIGURED";
  constructor(message: string) {
    super(message);
    this.name = "AINotConfiguredError";
  }
}

/**
 * Resolves the effective AI provider/model/credentials for an org+feature.
 * Throws `AINotConfiguredError` (mapped to HTTP 503 by the API) when no
 * usable configuration exists at any layer.
 */
export async function resolveAIProvider(ctx: ResolveContext): Promise<ResolvedAI> {
  const operator = ctx.getOperatorDefaults();

  // Load org overrides up-front; the feature override may point at a
  // provider whose credentials live on a different `AIProviderConfig` row.
  const [orgProviders, orgFeatures] = await Promise.all([
    ctx.loadOrgProviders(ctx.tenantId).catch(() => [] as OrgProviderRow[]),
    ctx.loadOrgFeatures(ctx.tenantId).catch(() => [] as OrgFeatureRow[]),
  ]);

  const featureRow = orgFeatures.find((f) => f.feature === ctx.feature && f.isEnabled);

  // ── 1. Per-feature override (finest grain) ──────────────────────
  if (featureRow) {
    const orgCredsForFeatureProvider = orgProviders.find(
      (p) => p.provider === featureRow.provider && p.isEnabled,
    );
    if (orgCredsForFeatureProvider) {
      const credentials = mergeCredentials(
        operator,
        orgCredsForFeatureProvider,
        featureRow.provider,
      );
      return {
        provider: featureRow.provider,
        model: featureRow.model,
        credentials,
        source: "feature",
        client: createAIProvider(credentials, featureRow.model),
      };
    }
    // Feature row exists but no matching org credentials: fall back to
    // operator-level credentials *if* operator's provider matches.
    if (operator.provider === featureRow.provider && operator.enabled) {
      const credentials = operatorCredentials(operator, featureRow.provider);
      return {
        provider: featureRow.provider,
        model: featureRow.model,
        credentials,
        source: "feature",
        client: createAIProvider(credentials, featureRow.model),
      };
    }
    // Otherwise the feature row is dangling — skip and continue.
  }

  // ── 2. Per-org override ─────────────────────────────────────────
  // Pick the first enabled org provider (orgs typically configure one).
  const orgProvider = orgProviders.find((p) => p.isEnabled);
  if (orgProvider) {
    const credentials = mergeCredentials(operator, orgProvider, orgProvider.provider);
    const model = operator.model ?? PROVIDER_DEFAULT_MODEL[orgProvider.provider];
    return {
      provider: orgProvider.provider,
      model,
      credentials,
      source: "org",
      client: createAIProvider(credentials, model),
    };
  }

  // ── 3. Operator default ─────────────────────────────────────────
  if (operator.enabled && operator.provider) {
    const credentials = operatorCredentials(operator, operator.provider);
    const model = operator.model ?? PROVIDER_DEFAULT_MODEL[operator.provider];
    return {
      provider: operator.provider,
      model,
      credentials,
      source: "operator",
      client: createAIProvider(credentials, model),
    };
  }

  throw new AINotConfiguredError(
    operator.disabledReason ??
      "AI is not configured. Set AI_PROVIDER (and provider credentials) at the operator level, or configure an AI provider in Settings → AI.",
  );
}

function mergeCredentials(
  operator: OperatorAIDefaults,
  org: OrgProviderRow,
  provider: AIProviderType,
): AIProviderCredentials {
  // Org row wins on a per-field basis. Operator-level credentials are
  // only consulted when the org explicitly leaves a field blank — which
  // is the common case for Bedrock (org wants to inherit the IAM role).
  const opCreds = operator.provider === provider ? operator.credentials : {};
  return {
    provider,
    apiKey: org.apiKey ?? opCreds.apiKey ?? undefined,
    region: org.region ?? opCreds.region ?? undefined,
    accessKeyId: org.accessKeyId ?? opCreds.accessKeyId ?? undefined,
    secretAccessKey: org.secretAccessKey ?? opCreds.secretAccessKey ?? undefined,
    baseUrl: org.baseUrl ?? opCreds.baseUrl ?? undefined,
    useDefaultChain:
      provider === "bedrock"
        ? !(org.accessKeyId && org.secretAccessKey) && (opCreds.useDefaultChain ?? true)
        : undefined,
  };
}

function operatorCredentials(
  operator: OperatorAIDefaults,
  provider: AIProviderType,
): AIProviderCredentials {
  const creds = operator.credentials;
  return {
    provider,
    apiKey: creds.apiKey,
    region: creds.region,
    accessKeyId: creds.accessKeyId,
    secretAccessKey: creds.secretAccessKey,
    baseUrl: creds.baseUrl,
    useDefaultChain: provider === "bedrock" ? (creds.useDefaultChain ?? true) : undefined,
  };
}
