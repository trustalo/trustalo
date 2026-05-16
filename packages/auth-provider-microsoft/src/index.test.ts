import { afterEach, describe, expect, test } from "bun:test";
import { AuthProviderConfigError } from "@trustalo/auth";
import { createMicrosoftProvider, createProvider } from "./index.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockMicrosoftDiscovery(overrides?: Partial<Record<string, string>>) {
  return {
    issuer: "https://login.microsoftonline.com/organizations/v2.0",
    authorization_endpoint: "https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize",
    token_endpoint: "https://login.microsoftonline.com/organizations/oauth2/v2.0/token",
    jwks_uri: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
    end_session_endpoint: "https://login.microsoftonline.com/organizations/oauth2/v2.0/logout",
    ...overrides,
  };
}

describe("microsoft auth provider", () => {
  test("throws config error when required env vars are missing", () => {
    expect(() => createProvider({})).toThrow(AuthProviderConfigError);
    expect(() => createProvider({ MICROSOFT_TENANT_ID: "organizations" })).toThrow(
      "MICROSOFT_CLIENT_ID",
    );
  });

  test("startRedirect builds Microsoft authorize URL with PKCE", async () => {
    const calls: string[] = [];
    globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
      calls.push(String(input));
      return new Response(JSON.stringify(mockMicrosoftDiscovery()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const provider = createProvider({
      MICROSOFT_TENANT_ID: "organizations",
      MICROSOFT_CLIENT_ID: "microsoft-client-id-123",
      MICROSOFT_SCOPES: "openid email profile User.Read",
    });

    const result = await provider.startRedirect?.({
      state: "state-456",
      nonce: "nonce-456",
      redirectUri: "https://app.example.com/auth/callback",
    });

    expect(result).toBeDefined();
    if (!result) throw new Error("Expected redirect result");

    const url = new URL(result.authorizationUrl);
    expect(url.origin + url.pathname).toBe(
      "https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize",
    );
    expect(url.searchParams.get("client_id")).toBe("microsoft-client-id-123");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("openid email profile User.Read");
    expect(url.searchParams.get("redirect_uri")).toBe("https://app.example.com/auth/callback");
    expect(url.searchParams.get("state")).toBe("state-456");
    expect(url.searchParams.get("nonce")).toBe("nonce-456");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("prompt")).toBe("select_account");
    expect(result.callbackContext?.codeVerifier).toBeString();
    expect(result.callbackContext?.nonce).toBe("nonce-456");
    expect(calls).toEqual([
      "https://login.microsoftonline.com/organizations/v2.0/.well-known/openid-configuration",
    ]);
  });

  test("handleRedirectCallback rejects when code_verifier is missing", async () => {
    const provider = createMicrosoftProvider({
      tenantId: "organizations",
      clientId: "microsoft-client-id-123",
    });
    await expect(
      provider.handleRedirectCallback?.({
        params: { code: "auth-code" },
        callbackContext: undefined,
        redirectUri: "https://app.example.com/auth/callback",
      }) ?? Promise.resolve(),
    ).rejects.toThrow("missing PKCE code_verifier");
  });

  test("buildLogoutUrl uses provider end_session endpoint when available", async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify(mockMicrosoftDiscovery()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as unknown as typeof fetch;

    const provider = createMicrosoftProvider({
      tenantId: "organizations",
      clientId: "microsoft-client-id-123",
    });

    const logoutUrl = await provider.buildLogoutUrl?.({
      payload: {
        userId: "user-1",
        tenantId: "tenant-1",
        role: "owner",
        permissions: ["read"],
      },
      postLogoutRedirectUri: "https://app.example.com/login",
    });

    expect(logoutUrl).toBeDefined();
    if (!logoutUrl) throw new Error("Expected logout URL");
    const url = new URL(logoutUrl);
    expect(url.origin + url.pathname).toBe(
      "https://login.microsoftonline.com/organizations/oauth2/v2.0/logout",
    );
    expect(url.searchParams.get("post_logout_redirect_uri")).toBe("https://app.example.com/login");
    expect(url.searchParams.get("client_id")).toBe("microsoft-client-id-123");
  });
});
