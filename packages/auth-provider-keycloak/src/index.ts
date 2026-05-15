// @trustalo/auth-provider-keycloak
//
// Built-in redirect provider that delegates authentication to a self-hosted
// Keycloak realm via OIDC + Authorization Code + PKCE. Keycloak handles
// email/password, MFA (OTP/WebAuthn/Recovery Codes), social federation
// (Google/GitHub/etc.), SAML, password reset, and email verification natively
// — Trustalo neither sees nor stores user passwords.
//
// Flow (mirrors the Cognito provider, but uses OIDC discovery so it works
// against any Keycloak version 8+ without per-version URL hardcoding):
//   1. /auth/oauth/start → fetches `${issuer}/.well-known/openid-configuration`
//      (cached in-memory after first call) to discover authorize/token/jwks
//      endpoints, then builds an authorize URL with state + PKCE.
//   2. The user authenticates against Keycloak.
//   3. /auth/oauth/callback → exchanges the auth code for tokens at the
//      discovered token endpoint, verifies the ID token's signature against
//      the realm's JWKS, validates iss/aud/typ/exp, and returns a
//      ProviderProfile.
//   4. The API mints Trustalo's own JWT and the user is redirected to the
//      dashboard.
//
// adminCreateUser uses Keycloak's Admin REST API with a service-account
// access token (client_credentials grant). The "admin client" must:
//   - have `Service Accounts Enabled = ON`
//   - hold the realm-management role `manage-users` (and ideally `view-users`)

import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";
import {
  AuthProviderConfigError,
  type AdminInviteInput,
  type AdminInviteResult,
  type AuthProvider,
  type AuthPayload,
  type ProviderProfile,
  type RedirectStartResult,
} from "@trustalo/auth";

export interface KeycloakProviderConfig {
  /** Base URL of the Keycloak server, e.g. https://kc.example.com (no trailing slash). */
  baseUrl: string;
  /** Realm to authenticate against. */
  realm: string;
  /** Client ID of the OIDC client created for Trustalo. */
  clientId: string;
  /**
   * Optional client secret. Required for "confidential" clients; omit for
   * "public" clients (PKCE-only).
   */
  clientSecret?: string;
  /** Comma-separated OAuth scopes. Defaults to "openid email profile". */
  scopes?: string;
  /** Display name shown on the login button; defaults to "Keycloak". */
  displayName?: string;
  /** Capability flags used to populate the public /auth/config descriptor. */
  mfaEnabled?: boolean;
  socialLoginEnabled?: boolean;
  /**
   * Admin REST API credentials for invitation flow (adminCreateUser).
   * If unset, /organizations/members/invite will throw at admin-create time.
   * Recommended: dedicated `trustalo-admin` confidential client with the
   * `manage-users` realm-management role.
   */
  adminClientId?: string;
  adminClientSecret?: string;
}

interface KeycloakTokenResponse {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface OidcDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
  userinfo_endpoint?: string;
}

interface KeycloakIdTokenClaims extends JWTPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  /** Keycloak emits typ="ID" on ID tokens (older versions used "id"). */
  typ?: string;
}

const DEFAULT_SCOPES = "openid email profile";
const DISCOVERY_PATH = "/.well-known/openid-configuration";

/**
 * Factory that reads Keycloak-specific env vars and produces an AuthProvider.
 * Throws AuthProviderConfigError if any required env var is missing.
 */
export function createProvider(env: Record<string, string | undefined>): AuthProvider {
  const config = readConfigFromEnv(env);
  // readConfigFromEnv enforces *required* env vars; validateConfig adds
  // semantic checks (e.g. admin-credential pair completeness) that apply to
  // both env-driven and programmatic construction paths.
  validateConfig(config);
  return buildProvider(config);
}

/**
 * Programmatic factory — useful for tests and for hosts that want to bypass
 * env-var lookup entirely.
 */
export function createKeycloakProvider(config: KeycloakProviderConfig): AuthProvider {
  validateConfig(config);
  return buildProvider(config);
}

function readConfigFromEnv(env: Record<string, string | undefined>): KeycloakProviderConfig {
  const required = (name: string): string => {
    const v = env[name]?.trim();
    if (!v) {
      throw new AuthProviderConfigError(
        `Keycloak provider requires env var ${name}. ` +
          `See docs/auth-providers.md#keycloak for the full list.`,
      );
    }
    return v;
  };

  return {
    baseUrl: required("KEYCLOAK_BASE_URL"),
    realm: required("KEYCLOAK_REALM"),
    clientId: required("KEYCLOAK_CLIENT_ID"),
    clientSecret: env.KEYCLOAK_CLIENT_SECRET?.trim() || undefined,
    scopes: env.KEYCLOAK_SCOPES?.trim(),
    displayName: env.KEYCLOAK_DISPLAY_NAME?.trim(),
    mfaEnabled: env.KEYCLOAK_MFA_ENABLED === "true",
    socialLoginEnabled: env.KEYCLOAK_SOCIAL_LOGIN_ENABLED === "true",
    adminClientId: env.KEYCLOAK_ADMIN_CLIENT_ID?.trim() || undefined,
    adminClientSecret: env.KEYCLOAK_ADMIN_CLIENT_SECRET?.trim() || undefined,
  };
}

function validateConfig(config: KeycloakProviderConfig): void {
  for (const key of ["baseUrl", "realm", "clientId"] as const) {
    if (!config[key]) {
      throw new AuthProviderConfigError(`Keycloak provider config is missing "${key}"`);
    }
  }
  if (
    (config.adminClientId && !config.adminClientSecret) ||
    (!config.adminClientId && config.adminClientSecret)
  ) {
    throw new AuthProviderConfigError(
      "Keycloak admin credentials must be provided as a pair: " +
        "set both KEYCLOAK_ADMIN_CLIENT_ID and KEYCLOAK_ADMIN_CLIENT_SECRET, or neither.",
    );
  }
}

function buildProvider(config: KeycloakProviderConfig): AuthProvider {
  // Hand-rolled trailing-slash trim; see `auth-provider-cognito` for
  // the `js/polynomial-redos` rationale.
  let baseEnd = config.baseUrl.length;
  while (baseEnd > 0 && config.baseUrl.charCodeAt(baseEnd - 1) === 0x2f /* "/" */) baseEnd--;
  const baseUrl = config.baseUrl.slice(0, baseEnd);
  const realmUrl = `${baseUrl}/realms/${encodeURIComponent(config.realm)}`;
  const expectedIssuer = realmUrl;
  const scopes = config.scopes ?? DEFAULT_SCOPES;

  // OIDC discovery document is fetched lazily on first redirect and cached
  // for the lifetime of the process. Keycloak rarely changes endpoints
  // mid-flight; if it does (e.g. Keycloak upgrade), restart the API.
  let discoveryCache: Promise<OidcDiscoveryDocument> | null = null;
  const getDiscovery = (): Promise<OidcDiscoveryDocument> => {
    discoveryCache ??= fetchDiscovery(`${realmUrl}${DISCOVERY_PATH}`).then((doc) => {
      // Defence-in-depth: reject discovery docs whose issuer doesn't match
      // the realm we configured, to thwart open-redirect / spoofed-discovery.
      if (doc.issuer !== expectedIssuer) {
        throw new Error(
          `Keycloak discovery issuer mismatch: expected "${expectedIssuer}", got "${doc.issuer}"`,
        );
      }
      return doc;
    });
    return discoveryCache;
  };

  // JWKS resolver is cached too — `createRemoteJWKSet` handles its own key
  // rotation cache internally, so we only need to bind it once per process.
  let jwks: JWTVerifyGetKey | null = null;
  const getJwks = async (): Promise<JWTVerifyGetKey> => {
    if (jwks) return jwks;
    const discovery = await getDiscovery();
    jwks = createRemoteJWKSet(new URL(discovery.jwks_uri));
    return jwks;
  };

  return {
    id: "keycloak",
    displayName: config.displayName ?? "Keycloak",
    kind: "redirect",
    capabilities: {
      // Keycloak does support self-registration, but it's a per-realm setting
      // controlled in the Keycloak admin console — not by Trustalo. We expose
      // a flag for the descriptor only.
      register: false,
      resetPassword: true,
      mfa: config.mfaEnabled ?? false,
      socialLogin: config.socialLoginEnabled ?? false,
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
          `Keycloak returned error "${params.error}": ${params.error_description ?? "no description"}`,
        );
      }
      const code = params.code;
      if (!code) throw new Error("Keycloak callback is missing the `code` parameter");

      const codeVerifier = callbackContext?.codeVerifier;
      if (!codeVerifier) {
        throw new Error("Keycloak callback is missing PKCE code_verifier from server context");
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
        issuer: expectedIssuer,
        audience: config.clientId,
      });

      const claims = payload as KeycloakIdTokenClaims;

      // Keycloak puts "ID" (uppercase) in the `typ` claim on ID tokens; older
      // versions omit it entirely. Accept both cases but reject access tokens
      // accidentally sent to this verifier.
      if (claims.typ && claims.typ.toLowerCase() !== "id") {
        throw new Error(`Expected typ="ID" but got "${claims.typ}"`);
      }
      if (callbackContext?.nonce && claims.nonce && claims.nonce !== callbackContext.nonce) {
        throw new Error("Keycloak ID token nonce mismatch");
      }
      if (!claims.email) {
        throw new Error(
          "Keycloak ID token does not contain an `email` claim. " +
            "Ensure the `email` scope is enabled on the client and that the " +
            "user has a verified email in the realm.",
        );
      }

      // Best-available human name: full name → given+family → preferred_username.
      const fallbackFromParts =
        [claims.given_name, claims.family_name].filter(Boolean).join(" ").trim() ||
        claims.preferred_username;
      const composedName = claims.name ?? fallbackFromParts;

      return {
        externalId: claims.sub,
        email: claims.email.toLowerCase(),
        name: composedName || undefined,
        emailVerified: claims.email_verified === true,
        raw: claims,
      };
    },

    async buildLogoutUrl(args): Promise<string> {
      const discovery = await getDiscovery();
      // Older Keycloaks (< 18) didn't advertise end_session_endpoint in
      // discovery — fall back to the well-known relative path.
      const endpoint =
        discovery.end_session_endpoint ?? `${realmUrl}/protocol/openid-connect/logout`;

      const url = new URL(endpoint);
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("post_logout_redirect_uri", args.postLogoutRedirectUri);
      // We don't have the user's id_token at this point (we issue our own
      // session JWT), so we omit `id_token_hint`. Keycloak still honors the
      // logout but may show a brief confirmation page in newer versions.
      void args.payload;
      return url.toString();
    },

    async adminCreateUser(input: AdminInviteInput): Promise<AdminInviteResult> {
      if (!config.adminClientId || !config.adminClientSecret) {
        throw new AuthProviderConfigError(
          "Keycloak provider cannot invite users: KEYCLOAK_ADMIN_CLIENT_ID and " +
            "KEYCLOAK_ADMIN_CLIENT_SECRET are not configured.",
        );
      }

      const adminToken = await getAdminAccessToken({
        tokenEndpoint: (await getDiscovery()).token_endpoint,
        clientId: config.adminClientId,
        clientSecret: config.adminClientSecret,
      });

      // Strip locale/display segments from the email for the username; falling
      // back to the email itself matches Keycloak's default user-creation UX.
      const username = input.email.toLowerCase();

      const createRes = await fetch(
        `${baseUrl}/admin/realms/${encodeURIComponent(config.realm)}/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            username,
            email: input.email,
            firstName: input.name?.split(" ")[0],
            lastName: input.name?.split(" ").slice(1).join(" ") || undefined,
            enabled: true,
            emailVerified: false,
            requiredActions: ["UPDATE_PASSWORD", "VERIFY_EMAIL"],
          }),
        },
      );

      if (!createRes.ok) {
        // Keycloak returns 409 with `{"errorMessage":"User exists with same username"}`.
        const body = await createRes.text();
        throw new Error(`Keycloak admin user-create failed (${createRes.status}): ${body}`);
      }

      // Keycloak returns 201 Created with a Location header pointing at the
      // new user; the trailing path segment is the UUID we want as externalId.
      const location = createRes.headers.get("location") ?? createRes.headers.get("Location");
      if (!location) {
        throw new Error("Keycloak admin user-create response missing Location header");
      }
      const externalId = location.split("/").pop();
      if (!externalId) {
        throw new Error(`Could not parse user id from Location header: ${location}`);
      }

      // Kick off the email containing the "Update Password + Verify Email"
      // action links. This is best-effort; if the realm doesn't have SMTP
      // configured, Keycloak returns 500 and we surface that to the caller.
      let inviteEmailSent = false;
      try {
        const actionsRes = await fetch(
          `${baseUrl}/admin/realms/${encodeURIComponent(config.realm)}/users/${externalId}/execute-actions-email`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify(["UPDATE_PASSWORD", "VERIFY_EMAIL"]),
          },
        );
        inviteEmailSent = actionsRes.ok;
      } catch {
        // Non-fatal: user is created, admin can resend the email manually.
        inviteEmailSent = false;
      }

      return {
        externalId,
        email: input.email,
        inviteEmailSent,
      };
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

async function fetchDiscovery(url: string): Promise<OidcDiscoveryDocument> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Keycloak OIDC discovery failed (${res.status}) for ${url}`);
  }
  return (await res.json()) as OidcDiscoveryDocument;
}

async function exchangeCodeForTokens(args: {
  tokenEndpoint: string;
  clientId: string;
  clientSecret?: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<KeycloakTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: args.clientId,
    code: args.code,
    redirect_uri: args.redirectUri,
    code_verifier: args.codeVerifier,
  });

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  // Keycloak accepts both client_secret_basic (HTTP Basic) and
  // client_secret_post (form body). Basic is more standard.
  if (args.clientSecret) {
    const creds = `${args.clientId}:${args.clientSecret}`;
    headers["Authorization"] = `Basic ${Buffer.from(creds, "utf8").toString("base64")}`;
  }

  const response = await fetch(args.tokenEndpoint, {
    method: "POST",
    headers,
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Keycloak token exchange failed (${response.status}): ${text}`);
  }

  return (await response.json()) as KeycloakTokenResponse;
}

/**
 * Obtain a service-account access token for the realm-management API using
 * client_credentials. Cached for the token's lifetime minus a 30s buffer.
 */
const adminTokenCache = new Map<string, { token: string; expiresAt: number }>();

async function getAdminAccessToken(args: {
  tokenEndpoint: string;
  clientId: string;
  clientSecret: string;
}): Promise<string> {
  const cacheKey = `${args.tokenEndpoint}|${args.clientId}`;
  const cached = adminTokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
  });

  const creds = `${args.clientId}:${args.clientSecret}`;
  const response = await fetch(args.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(creds, "utf8").toString("base64")}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Keycloak admin token request failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  adminTokenCache.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 30) * 1000,
  });
  return data.access_token;
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
