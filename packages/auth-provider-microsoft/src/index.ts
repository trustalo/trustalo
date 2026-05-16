import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";
import {
  AuthProviderConfigError,
  type AuthPayload,
  type AuthProvider,
  type ProviderProfile,
  type RedirectStartResult,
} from "@trustalo/auth";

export interface MicrosoftProviderConfig {
  tenantId: string;
  clientId: string;
  clientSecret?: string;
  scopes?: string;
  displayName?: string;
  mfaEnabled?: boolean;
}

interface OidcDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
}

interface MicrosoftTokenResponse {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface MicrosoftIdTokenClaims extends JWTPayload {
  sub?: string;
  oid?: string;
  tid?: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  nonce?: string;
  iss?: string;
}

const DEFAULT_SCOPES = "openid email profile User.Read";
const TENANT_ALIASES = new Set(["common", "organizations", "consumers"]);
const AUTHORITY_BASE = "https://login.microsoftonline.com";

export function createProvider(env: Record<string, string | undefined>): AuthProvider {
  const config = readConfigFromEnv(env);
  validateConfig(config);
  return buildProvider(config);
}

export function createMicrosoftProvider(config: MicrosoftProviderConfig): AuthProvider {
  validateConfig(config);
  return buildProvider(config);
}

function readConfigFromEnv(env: Record<string, string | undefined>): MicrosoftProviderConfig {
  const required = (name: string): string => {
    const value = env[name]?.trim();
    if (!value) {
      throw new AuthProviderConfigError(
        `Microsoft provider requires env var ${name}. ` +
          `See docs/auth-providers.md#microsoft-entra-id for the full list.`,
      );
    }
    return value;
  };

  return {
    tenantId: required("MICROSOFT_TENANT_ID"),
    clientId: required("MICROSOFT_CLIENT_ID"),
    clientSecret: env.MICROSOFT_CLIENT_SECRET?.trim() || undefined,
    scopes: env.MICROSOFT_SCOPES?.trim(),
    displayName: env.MICROSOFT_DISPLAY_NAME?.trim(),
    mfaEnabled: env.MICROSOFT_MFA_ENABLED === "true",
  };
}

function validateConfig(config: MicrosoftProviderConfig): void {
  for (const key of ["tenantId", "clientId"] as const) {
    if (!config[key]) {
      throw new AuthProviderConfigError(`Microsoft provider config is missing "${key}"`);
    }
  }
}

function buildProvider(config: MicrosoftProviderConfig): AuthProvider {
  const tenant = config.tenantId;
  const discoveryUrl = `${AUTHORITY_BASE}/${encodeURIComponent(tenant)}/v2.0/.well-known/openid-configuration`;
  const scopes = config.scopes ?? DEFAULT_SCOPES;

  let discoveryCache: Promise<OidcDiscoveryDocument> | null = null;
  const getDiscovery = (): Promise<OidcDiscoveryDocument> => {
    discoveryCache ??= fetchDiscovery(discoveryUrl);
    return discoveryCache;
  };

  let jwks: JWTVerifyGetKey | null = null;
  const getJwks = async (): Promise<JWTVerifyGetKey> => {
    if (jwks) return jwks;
    const discovery = await getDiscovery();
    jwks = createRemoteJWKSet(new URL(discovery.jwks_uri));
    return jwks;
  };

  return {
    id: "microsoft",
    displayName: config.displayName ?? "Microsoft",
    kind: "redirect",
    capabilities: {
      register: false,
      resetPassword: true,
      mfa: config.mfaEnabled ?? false,
      socialLogin: false,
    },

    async startRedirect(args): Promise<RedirectStartResult> {
      const discovery = await getDiscovery();
      const { codeVerifier, codeChallenge } = await generatePkcePair();

      const url = new URL(discovery.authorization_endpoint);
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", scopes);
      url.searchParams.set("redirect_uri", args.redirectUri);
      url.searchParams.set("state", args.state);
      url.searchParams.set("nonce", args.nonce);
      url.searchParams.set("code_challenge", codeChallenge);
      url.searchParams.set("code_challenge_method", "S256");
      url.searchParams.set("prompt", "select_account");

      return {
        authorizationUrl: url.toString(),
        state: args.state,
        callbackContext: { codeVerifier, nonce: args.nonce },
      };
    },

    async handleRedirectCallback(args): Promise<ProviderProfile> {
      const { params, callbackContext, redirectUri } = args;
      if (params.error) {
        throw new Error(
          `Microsoft returned error "${params.error}": ${params.error_description ?? "no description"}`,
        );
      }
      const code = params.code;
      if (!code) throw new Error("Microsoft callback is missing the `code` parameter");

      const codeVerifier = callbackContext?.codeVerifier;
      if (!codeVerifier) {
        throw new Error("Microsoft callback is missing PKCE code_verifier from server context");
      }

      const discovery = await getDiscovery();
      const tokens = await exchangeCodeForTokens({
        tokenEndpoint: discovery.token_endpoint,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        code,
        redirectUri,
        codeVerifier,
      });

      const keys = await getJwks();
      const { payload } = await jwtVerify(tokens.id_token, keys, {
        audience: config.clientId,
      });
      const claims = payload as MicrosoftIdTokenClaims;

      validateMicrosoftIssuer(claims, tenant);
      if (callbackContext?.nonce && claims.nonce && claims.nonce !== callbackContext.nonce) {
        throw new Error("Microsoft ID token nonce mismatch");
      }

      const email = claims.email ?? claims.preferred_username;
      if (!email) {
        throw new Error(
          "Microsoft ID token does not include `email` or `preferred_username`. " +
            "Ensure the app has `email` and `profile` OIDC scopes enabled.",
        );
      }

      const externalId = claims.oid ?? claims.sub;
      if (!externalId) {
        throw new Error("Microsoft ID token does not include `oid` or `sub`");
      }

      return {
        externalId,
        email: email.toLowerCase(),
        name: claims.name ?? undefined,
        emailVerified: true,
        raw: claims,
      };
    },

    async buildLogoutUrl(args): Promise<string> {
      const discovery = await getDiscovery();
      const endpoint = discovery.end_session_endpoint;
      if (!endpoint) return args.postLogoutRedirectUri;
      const url = new URL(endpoint);
      url.searchParams.set("post_logout_redirect_uri", args.postLogoutRedirectUri);
      url.searchParams.set("client_id", config.clientId);
      void args.payload;
      return url.toString();
    },
  };
}

function validateMicrosoftIssuer(claims: MicrosoftIdTokenClaims, tenant: string): void {
  const issuer = claims.iss;
  if (!issuer) {
    throw new Error("Microsoft ID token is missing the `iss` claim");
  }

  const normalizedTenant = tenant.toLowerCase();
  if (TENANT_ALIASES.has(normalizedTenant)) {
    if (!issuer.startsWith(`${AUTHORITY_BASE}/`) || !issuer.endsWith("/v2.0")) {
      throw new Error(`Unexpected Microsoft issuer "${issuer}"`);
    }
    if (claims.tid && normalizedTenant !== "consumers") {
      const expected = `${AUTHORITY_BASE}/${claims.tid}/v2.0`;
      if (issuer.toLowerCase() !== expected.toLowerCase()) {
        throw new Error(`Microsoft issuer mismatch: expected "${expected}", got "${issuer}"`);
      }
    }
    return;
  }

  const expectedIssuer = `${AUTHORITY_BASE}/${tenant}/v2.0`;
  if (issuer.toLowerCase() !== expectedIssuer.toLowerCase()) {
    throw new Error(`Microsoft issuer mismatch: expected "${expectedIssuer}", got "${issuer}"`);
  }
}

async function fetchDiscovery(url: string): Promise<OidcDiscoveryDocument> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Microsoft OIDC discovery failed (${response.status}) for ${url}`);
  }
  return (await response.json()) as OidcDiscoveryDocument;
}

async function exchangeCodeForTokens(args: {
  tokenEndpoint: string;
  clientId: string;
  clientSecret?: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<MicrosoftTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: args.clientId,
    code: args.code,
    redirect_uri: args.redirectUri,
    code_verifier: args.codeVerifier,
  });
  if (args.clientSecret) {
    body.set("client_secret", args.clientSecret);
  }

  const response = await fetch(args.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Microsoft token exchange failed (${response.status}): ${text}`);
  }
  return (await response.json()) as MicrosoftTokenResponse;
}

async function generatePkcePair(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  const codeChallenge = base64UrlEncode(new Uint8Array(digest));
  return { codeVerifier, codeChallenge };
}

function base64UrlEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export type { AuthPayload };
