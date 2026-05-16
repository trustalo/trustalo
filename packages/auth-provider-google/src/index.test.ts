import { afterEach, describe, expect, test } from "bun:test";
import { AuthProviderConfigError } from "@trustalo/auth";
import { createGoogleProvider, createProvider } from "./index.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockDiscoveryResponse() {
  return {
    issuer: "https://accounts.google.com",
    authorization_endpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    token_endpoint: "https://oauth2.googleapis.com/token",
    jwks_uri: "https://www.googleapis.com/oauth2/v3/certs",
  };
}

describe("google auth provider", () => {
  test("throws config error when GOOGLE_CLIENT_ID is missing", () => {
    expect(() => createProvider({})).toThrow(AuthProviderConfigError);
    expect(() => createProvider({})).toThrow("GOOGLE_CLIENT_ID");
  });

  test("startRedirect builds Google authorize URL with PKCE and hosted domain", async () => {
    const calls: string[] = [];
    globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
      calls.push(String(input));
      return new Response(JSON.stringify(mockDiscoveryResponse()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const provider = createProvider({
      GOOGLE_CLIENT_ID: "google-client-id-123",
      GOOGLE_HOSTED_DOMAIN: "example.com",
      GOOGLE_SCOPES: "openid email profile",
    });

    const result = await provider.startRedirect?.({
      state: "state-123",
      nonce: "nonce-123",
      redirectUri: "https://app.example.com/auth/callback",
    });

    expect(result).toBeDefined();
    if (!result) throw new Error("Expected redirect result");

    const url = new URL(result.authorizationUrl);
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("google-client-id-123");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
    expect(url.searchParams.get("redirect_uri")).toBe("https://app.example.com/auth/callback");
    expect(url.searchParams.get("state")).toBe("state-123");
    expect(url.searchParams.get("nonce")).toBe("nonce-123");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("prompt")).toBe("select_account");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("hd")).toBe("example.com");
    expect(result.callbackContext?.codeVerifier).toBeString();
    expect(result.callbackContext?.nonce).toBe("nonce-123");
    expect(calls).toEqual(["https://accounts.google.com/.well-known/openid-configuration"]);
  });

  test("handleRedirectCallback rejects when code_verifier is missing", async () => {
    const provider = createGoogleProvider({ clientId: "google-client-id-123" });
    await expect(
      provider.handleRedirectCallback?.({
        params: { code: "auth-code" },
        callbackContext: undefined,
        redirectUri: "https://app.example.com/auth/callback",
      }) ?? Promise.resolve(),
    ).rejects.toThrow("missing PKCE code_verifier");
  });
});
