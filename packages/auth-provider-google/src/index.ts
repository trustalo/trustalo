import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";
import {
  AuthProviderConfigError,
  type AuthPayload,
  type AuthProvider,
  type ProviderProfile,
  type RedirectStartResult,
} from "@trustalo/auth";

export interface GoogleProviderConfig {
  clientId: string;
  clientSecret?: string;
  scopes?: string;
  displayName?: string;
  hostedDomain?: string;
  mfaEnabled?: boolean;
}

interface OidcDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
}

interface GoogleTokenResponse {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleIdTokenClaims extends JWTPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  nonce?: string;
}

const DEFAULT_SCOPES = "openid email profile";
const DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration";
const EXPECTED_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

export function createProvider(env: Record<string, string | undefined>): AuthProvider {
  const config = readConfigFromEnv(env);
  validateConfig(config);
  return buildProvider(config);
}

export function createGoogleProvider(config: GoogleProviderConfig): AuthProvider {
  validateConfig(config);
  return buildProvider(config);
}

function readConfigFromEnv(env: Record<string, string | undefined>): GoogleProviderConfig {
  const required = (name: string): string => {
    const value = env[name]?.trim();
    if (!value) {
      throw new AuthProviderConfigError(
        `Google provider requires env var ${name}. ` +
          `See docs/auth-providers.md#google-oauth for the full list.`,
      );
    }
    return value;
  };

  return {
    clientId: required("GOOGLE_CLIENT_ID"),
    clientSecret: env.GOOGLE_CLIENT_SECRET?.trim() || undefined,
    scopes: env.GOOGLE_SCOPES?.trim(),
    displayName: env.GOOGLE_DISPLAY_NAME?.trim(),
    hostedDomain: env.GOOGLE_HOSTED_DOMAIN?.trim() || undefined,
    mfaEnabled: env.GOOGLE_MFA_ENABLED === "true",
  };
}

function validateConfig(config: GoogleProviderConfig): void {
  if (!config.clientId) {
    throw new AuthProviderConfigError('Google provider config is missing "clientId"');
  }
}

function buildProvider(config: GoogleProviderConfig): AuthProvider {
  const scopes = config.scopes ?? DEFAULT_SCOPES;

  let discoveryCache: Promise<OidcDiscoveryDocument> | null = null;
  const getDiscovery = (): Promise<OidcDiscoveryDocument> => {
    discoveryCache ??= fetchDiscovery(DISCOVERY_URL).then((doc) => {
      if (!EXPECTED_ISSUERS.has(doc.issuer)) {
        throw new Error(
          `Google discovery issuer mismatch: expected one of "${[...EXPECTED_ISSUERS].join(", ")}", got "${doc.issuer}"`,
        );
      }
      return doc;
    });
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
    id: "google",
    displayName: config.displayName ?? "Google",
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
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "select_account");
      if (config.hostedDomain) {
        url.searchParams.set("hd", config.hostedDomain);
      }

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
          `Google returned error "${params.error}": ${params.error_description ?? "no description"}`,
        );
      }
      const code = params.code;
      if (!code) throw new Error("Google callback is missing the `code` parameter");

      const codeVerifier = callbackContext?.codeVerifier;
      if (!codeVerifier) {
        throw new Error("Google callback is missing PKCE code_verifier from server context");
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
      const claims = payload as GoogleIdTokenClaims;

      if (!claims.iss || !EXPECTED_ISSUERS.has(claims.iss)) {
        throw new Error(`Unexpected Google issuer "${claims.iss ?? "missing"}"`);
      }
      if (callbackContext?.nonce && claims.nonce && claims.nonce !== callbackContext.nonce) {
        throw new Error("Google ID token nonce mismatch");
      }
      if (!claims.email) {
        throw new Error(
          "Google ID token does not contain an `email` claim. " +
            "Ensure the OAuth client requests the `email` scope.",
        );
      }

      return {
        externalId: claims.sub,
        email: claims.email.toLowerCase(),
        name: claims.name,
        emailVerified: claims.email_verified === true,
        raw: claims,
      };
    },

    async buildLogoutUrl(args): Promise<string> {
      // Google does not expose a standards-based RP logout endpoint.
      return args.postLogoutRedirectUri;
    },
  };
}

async function fetchDiscovery(url: string): Promise<OidcDiscoveryDocument> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google OIDC discovery failed (${response.status}) for ${url}`);
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
}): Promise<GoogleTokenResponse> {
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
    throw new Error(`Google token exchange failed (${response.status}): ${text}`);
  }
  return (await response.json()) as GoogleTokenResponse;
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
