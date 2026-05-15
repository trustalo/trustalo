// @trustalo/auth-provider-cognito
//
// Built-in redirect provider that delegates authentication to an AWS Cognito
// User Pool's *Hosted UI*. Cognito handles email/password, MFA (TOTP/SMS),
// social federation (Google/Facebook/Apple), SAML, password reset, and email
// verification natively — Trustalo neither sees nor stores user passwords.
//
// Flow:
//   1. /auth/oauth/start → builds an OAuth2 authorize URL (auth-code + PKCE)
//      pointing at `${COGNITO_DOMAIN}/oauth2/authorize`. The CSRF `state` and
//      PKCE `code_verifier` are returned to the API for round-tripping.
//   2. The user authenticates against Cognito.
//   3. /auth/oauth/callback → the provider exchanges the auth code for tokens
//      at `${COGNITO_DOMAIN}/oauth2/token`, verifies the ID token's signature
//      against the pool's JWKS, validates `iss`/`aud`/`token_use=id`/`exp`,
//      and returns a ProviderProfile.
//   4. The API mints Trustalo's own JWT and the user is redirected to the
//      dashboard.
//
// MFA / social / SAML are configured entirely in the AWS console — Trustalo
// requires no per-feature code.

import {
  AdminCreateUserCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import {
  AuthProviderConfigError,
  type AdminInviteInput,
  type AdminInviteResult,
  type AuthProvider,
  type AuthPayload,
  type ProviderProfile,
  type RedirectStartResult,
} from "@trustalo/auth";

export interface CognitoProviderConfig {
  region: string;
  userPoolId: string;
  clientId: string;
  /** Optional; only required if the user-pool client has a secret. */
  clientSecret?: string;
  /** Domain prefix or full domain (e.g. "myapp.auth.us-east-1.amazoncognito.com"). */
  domain: string;
  /** Comma-separated list of OAuth scopes. Defaults to "openid email profile". */
  scopes?: string;
  /** Display name shown on the login page; defaults to "AWS Cognito". */
  displayName?: string;
  /** Whether MFA / social-login are enabled in the pool (informational only). */
  mfaEnabled?: boolean;
  socialLoginEnabled?: boolean;
}

interface CognitoTokenResponse {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface CognitoIdTokenClaims extends JWTPayload {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  "cognito:username"?: string;
  token_use: "id" | "access";
}

const DEFAULT_SCOPES = "openid email profile";

/**
 * Factory that reads Cognito-specific env vars and produces an AuthProvider.
 * Throws AuthProviderConfigError if any required env var is missing.
 */
export function createProvider(env: Record<string, string | undefined>): AuthProvider {
  const config = readConfigFromEnv(env);
  return buildProvider(config);
}

/**
 * Programmatic factory — useful for tests and for hosts that want to bypass
 * env-var lookup entirely.
 */
export function createCognitoProvider(config: CognitoProviderConfig): AuthProvider {
  validateConfig(config);
  return buildProvider(config);
}

function readConfigFromEnv(env: Record<string, string | undefined>): CognitoProviderConfig {
  const required = (name: string): string => {
    const v = env[name]?.trim();
    if (!v) {
      throw new AuthProviderConfigError(
        `Cognito provider requires env var ${name}. ` +
          `See docs/auth-providers.md#aws-cognito for the full list.`,
      );
    }
    return v;
  };

  return {
    region: required("COGNITO_REGION"),
    userPoolId: required("COGNITO_USER_POOL_ID"),
    clientId: required("COGNITO_CLIENT_ID"),
    clientSecret: env.COGNITO_CLIENT_SECRET?.trim() || undefined,
    domain: required("COGNITO_DOMAIN"),
    scopes: env.COGNITO_SCOPES?.trim(),
    displayName: env.COGNITO_DISPLAY_NAME?.trim(),
    mfaEnabled: env.COGNITO_MFA_ENABLED === "true",
    socialLoginEnabled: env.COGNITO_SOCIAL_LOGIN_ENABLED === "true",
  };
}

function validateConfig(config: CognitoProviderConfig): void {
  for (const key of ["region", "userPoolId", "clientId", "domain"] as const) {
    if (!config[key]) {
      throw new AuthProviderConfigError(`Cognito provider config is missing "${key}"`);
    }
  }
}

function buildProvider(config: CognitoProviderConfig): AuthProvider {
  const domain = normalizeDomain(config.domain);
  const issuer = `https://cognito-idp.${config.region}.amazonaws.com/${config.userPoolId}`;
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  const scopes = config.scopes ?? DEFAULT_SCOPES;

  // Lazy-instantiate the AWS SDK client so the provider can be loaded in
  // environments where AWS credentials are not yet available.
  let cognitoClient: CognitoIdentityProviderClient | null = null;
  const getCognitoClient = (): CognitoIdentityProviderClient => {
    cognitoClient ??= new CognitoIdentityProviderClient({ region: config.region });
    return cognitoClient;
  };

  return {
    id: "cognito",
    displayName: config.displayName ?? "AWS Cognito",
    kind: "redirect",
    capabilities: {
      register: false,
      resetPassword: true,
      mfa: config.mfaEnabled ?? false,
      socialLogin: config.socialLoginEnabled ?? false,
    },

    async startRedirect(args): Promise<RedirectStartResult> {
      const { codeVerifier, codeChallenge } = await generatePkcePair();
      const url = new URL(`${domain}/oauth2/authorize`);
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
          `Cognito returned error "${params.error}": ${params.error_description ?? "no description"}`,
        );
      }
      const code = params.code;
      if (!code) throw new Error("Cognito callback is missing the `code` parameter");

      const codeVerifier = callbackContext?.codeVerifier;
      if (!codeVerifier) {
        throw new Error("Cognito callback is missing PKCE code_verifier from server context");
      }

      const tokens = await exchangeCodeForTokens({
        domain,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        code,
        redirectUri,
        codeVerifier,
      });

      const { payload } = await jwtVerify(tokens.id_token, jwks, {
        issuer,
        audience: config.clientId,
      });

      const claims = payload as CognitoIdTokenClaims;
      if (claims.token_use !== "id") {
        throw new Error(`Expected token_use="id" but got "${claims.token_use}"`);
      }
      if (callbackContext?.nonce && claims.nonce && claims.nonce !== callbackContext.nonce) {
        throw new Error("Cognito ID token nonce mismatch");
      }
      if (!claims.email) {
        throw new Error(
          "Cognito ID token does not contain an `email` claim. " +
            "Add the `email` scope and ensure the attribute is required by the user pool.",
        );
      }

      return {
        externalId: claims.sub,
        email: claims.email.toLowerCase(),
        name: claims.name ?? claims["cognito:username"],
        emailVerified: claims.email_verified === true,
        raw: claims,
      };
    },

    async buildLogoutUrl(args): Promise<string> {
      // Cognito's logout endpoint clears the session cookie and redirects.
      const url = new URL(`${domain}/logout`);
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("logout_uri", args.postLogoutRedirectUri);
      // suppress unused-variable noise; we don't need payload for hosted-UI
      void args.payload;
      return url.toString();
    },

    async adminCreateUser(input: AdminInviteInput): Promise<AdminInviteResult> {
      const client = getCognitoClient();
      const command = new AdminCreateUserCommand({
        UserPoolId: config.userPoolId,
        Username: input.email,
        UserAttributes: [
          { Name: "email", Value: input.email },
          { Name: "email_verified", Value: "true" },
          ...(input.name ? [{ Name: "name", Value: input.name }] : []),
        ],
        DesiredDeliveryMediums: ["EMAIL"],
        // We let Cognito send its standard invitation email containing a
        // temporary password; the user is forced to change it on first login
        // through Hosted UI.
      });

      const response = await client.send(command);
      const sub = response.User?.Attributes?.find((a) => a.Name === "sub")?.Value;

      if (!sub) {
        throw new Error("Cognito AdminCreateUser response did not include a `sub` attribute");
      }

      return {
        externalId: sub,
        email: input.email,
        inviteEmailSent: true,
      };
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function normalizeDomain(domain: string): string {
  // Hand-rolled trailing-slash trim instead of `/\/+$/` because the
  // unbounded `+` near `$` is flagged by CodeQL's
  // `js/polynomial-redos` query for adversarial trailing-slash input.
  let end = domain.length;
  while (end > 0 && domain.charCodeAt(end - 1) === 0x2f /* "/" */) end--;
  const trimmed = domain.slice(0, end);
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

async function exchangeCodeForTokens(args: {
  domain: string;
  clientId: string;
  clientSecret?: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<CognitoTokenResponse> {
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

  // Confidential clients use HTTP Basic auth per Cognito docs.
  if (args.clientSecret) {
    const creds = `${args.clientId}:${args.clientSecret}`;
    headers["Authorization"] = `Basic ${Buffer.from(creds, "utf8").toString("base64")}`;
  }

  const response = await fetch(`${args.domain}/oauth2/token`, {
    method: "POST",
    headers,
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cognito token exchange failed (${response.status}): ${text}`);
  }

  return (await response.json()) as CognitoTokenResponse;
}

async function generatePkcePair(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  // RFC 7636: verifier is 43–128 chars from [A-Z][a-z][0-9]-._~
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

// Re-export the AuthPayload type just for plugin authors who want to import it.
export type { AuthPayload };
