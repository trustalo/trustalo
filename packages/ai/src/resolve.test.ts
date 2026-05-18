import { describe, expect, test } from "bun:test";
import {
  AINotConfiguredError,
  AI_NOT_CONFIGURED_PUBLIC_MESSAGE,
  type OrgFeatureRow,
  type OrgProviderRow,
  resolveAIProvider,
} from "./resolve.js";
import type { AIFeatureType } from "./types.js";

function baseContext(overrides?: {
  feature?: AIFeatureType;
  operator?: Parameters<typeof resolveAIProvider>[0]["getOperatorDefaults"] extends () => infer T
    ? T
    : never;
  orgProviders?: OrgProviderRow[];
  orgFeatures?: OrgFeatureRow[];
  providersError?: boolean;
  featuresError?: boolean;
}) {
  const feature = overrides?.feature ?? "policy_generation";
  const operator =
    overrides?.operator ??
    ({
      provider: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      credentials: { provider: "anthropic", apiKey: "operator-key" },
      enabled: true,
    } as const);

  const orgProviders = overrides?.orgProviders ?? [];
  const orgFeatures = overrides?.orgFeatures ?? [];

  return {
    tenantId: "org-1",
    feature,
    getOperatorDefaults: () => operator,
    loadOrgProviders: async () => {
      if (overrides?.providersError) throw new Error("providers unavailable");
      return orgProviders;
    },
    loadOrgFeatures: async () => {
      if (overrides?.featuresError) throw new Error("features unavailable");
      return orgFeatures;
    },
  };
}

describe("resolveAIProvider", () => {
  test("uses feature-level override with matching org credentials", async () => {
    const resolved = await resolveAIProvider(
      baseContext({
        orgProviders: [
          {
            provider: "anthropic",
            apiKey: "org-anthropic-key",
            isEnabled: true,
          },
        ],
        orgFeatures: [
          {
            feature: "policy_generation",
            provider: "anthropic",
            model: "claude-sonnet-4-20250514",
            isEnabled: true,
          },
        ],
      }),
    );

    expect(resolved.source).toBe("feature");
    expect(resolved.provider).toBe("anthropic");
    expect(resolved.model).toBe("claude-sonnet-4-20250514");
    expect(resolved.credentials.apiKey).toBe("org-anthropic-key");
    expect(typeof resolved.client.chat).toBe("function");
  });

  test("feature-level override falls back to matching operator provider creds when org creds missing", async () => {
    const resolved = await resolveAIProvider(
      baseContext({
        orgProviders: [],
        orgFeatures: [
          {
            feature: "policy_generation",
            provider: "anthropic",
            model: "claude-sonnet-4-20250514",
            isEnabled: true,
          },
        ],
      }),
    );

    expect(resolved.source).toBe("feature");
    expect(resolved.credentials.apiKey).toBe("operator-key");
  });

  test("uses org provider override when no feature override", async () => {
    const resolved = await resolveAIProvider(
      baseContext({
        operator: {
          provider: "openai",
          model: "gpt-4o-mini",
          credentials: { provider: "openai", apiKey: "operator-openai" },
          enabled: true,
        },
        orgProviders: [
          {
            provider: "anthropic",
            apiKey: "org-anthropic-key",
            isEnabled: true,
          },
        ],
      }),
    );

    expect(resolved.source).toBe("org");
    expect(resolved.provider).toBe("anthropic");
    expect(resolved.credentials.apiKey).toBe("org-anthropic-key");
    expect(resolved.model).toBe("gpt-4o-mini");
  });

  test("uses operator default when no org overrides exist", async () => {
    const resolved = await resolveAIProvider(baseContext());
    expect(resolved.source).toBe("operator");
    expect(resolved.provider).toBe("anthropic");
    expect(resolved.credentials.apiKey).toBe("operator-key");
  });

  test("falls back gracefully when org loaders fail", async () => {
    const resolved = await resolveAIProvider(
      baseContext({
        providersError: true,
        featuresError: true,
      }),
    );
    expect(resolved.source).toBe("operator");
    expect(resolved.provider).toBe("anthropic");
  });

  test("throws AINotConfiguredError when operator is disabled and no org config exists", async () => {
    await expect(
      resolveAIProvider(
        baseContext({
          operator: {
            provider: null,
            model: null,
            credentials: {},
            enabled: false,
            disabledReason: "AI disabled by operator",
          },
        }),
      ),
    ).rejects.toThrow(AINotConfiguredError);
  });

  test("uses default not-configured message when disabled reason is absent", async () => {
    await expect(
      resolveAIProvider(
        baseContext({
          operator: {
            provider: null,
            model: null,
            credentials: {},
            enabled: false,
          },
        }),
      ),
    ).rejects.toThrow(AI_NOT_CONFIGURED_PUBLIC_MESSAGE);
  });
});
