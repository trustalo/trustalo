// Public contract for Trustalo auth provider plugins.
//
// A provider is a plain object — no class hierarchy, no decorators — that
// implements one of two shapes:
//
//   * `kind: "credential"` — receives a credential payload from a Trustalo
//     login form and returns a verified profile (e.g. local bcrypt, LDAP).
//
//   * `kind: "redirect"`   — issues an external authorize URL and later
//     accepts the callback parameters (e.g. Cognito Hosted UI, OIDC, SAML).
//
// Trustalo mints its own JWT regardless of provider, so middleware, RBAC,
// and downstream APIs are uniform across deployments.
//
// Plugin authors: import this type from `@trustalo/auth` and export your
// provider as the default export of an npm package. End-users enable it
// with `AUTH_PROVIDER=external` + `AUTH_EXTERNAL_PROVIDER=<npm-name>`.

import type { AuthPayload } from "../types.js";

/** Describes what a provider can do; surfaced to the web app. */
export interface ProviderCapabilities {
  /** True if the provider can self-register users (e.g. local sign-up). */
  register?: boolean;
  /** True if the provider can issue password-reset flows. */
  resetPassword?: boolean;
  /** True if MFA is enforced/handled by the provider (informational). */
  mfa?: boolean;
  /** True if social/federated identities are supported by the provider. */
  socialLogin?: boolean;
}

/**
 * Profile returned by a provider after successful authentication.
 * Trustalo uses this to find-or-create the corresponding `User` row.
 */
export interface ProviderProfile {
  /** Stable, opaque id from the provider (e.g. Cognito `sub`). Required. */
  externalId: string;
  /** Primary email for the principal. Required. */
  email: string;
  /** Optional human-readable display name. */
  name?: string;
  /** True if the provider asserts the email is verified. */
  emailVerified?: boolean;
  /** Provider-specific profile blob, persisted as `User.metadata` (future use). */
  raw?: unknown;
}

/** Inputs accepted by the generic credential login route. */
export interface CredentialLoginInput {
  email: string;
  password: string;
}

/** Inputs accepted by the generic credential register route. */
export interface CredentialRegisterInput {
  email: string;
  password: string;
  name: string;
  /** Optional org name; only the bootstrap registration uses it. */
  organizationName?: string;
}

/** Result of starting a redirect-based login flow. */
export interface RedirectStartResult {
  /** The URL the browser must be sent to (e.g. Cognito Hosted UI). */
  authorizationUrl: string;
  /** Opaque state value the provider needs back on callback (CSRF). */
  state: string;
  /**
   * Optional value the API must store server-side (or in a cookie) so it can
   * be presented during callback handling — e.g. PKCE `code_verifier`.
   */
  callbackContext?: Record<string, string>;
}

/** Inputs accepted by the generic admin-invite path (optional). */
export interface AdminInviteInput {
  email: string;
  name?: string;
  /** Membership role; passed through verbatim for provider-side groups. */
  role?: string;
}

export interface AdminInviteResult {
  externalId: string;
  email: string;
  /**
   * True if the provider has already emailed the user a temporary credential
   * (e.g. Cognito's invite email). When false, Trustalo should send its own.
   */
  inviteEmailSent: boolean;
}

/** The kind of flow a provider implements. */
export type ProviderKind = "credential" | "redirect";

/**
 * The plugin contract.
 *
 * IMPORTANT: This is the public extension surface. Adding a new optional
 * field is non-breaking; renaming or removing one breaks every plugin.
 * Treat it as semver-major.
 */
export interface AuthProvider {
  /** Stable identifier persisted in `User.authProvider`. */
  readonly id: string;
  /** Human-readable label shown on the login page (e.g. "AWS Cognito"). */
  readonly displayName: string;
  /** Determines which methods are required (see `validateProvider`). */
  readonly kind: ProviderKind;
  /** What this provider can do; surfaced to the web app. */
  readonly capabilities: ProviderCapabilities;

  // ── kind: "credential" ─────────────────────────────────────────────────
  authenticate?(input: CredentialLoginInput): Promise<ProviderProfile>;
  register?(input: CredentialRegisterInput): Promise<ProviderProfile>;

  // ── kind: "redirect" ───────────────────────────────────────────────────
  /**
   * Build the authorize URL for the upstream IdP. Trustalo passes a fresh
   * CSRF `state` and an opaque `nonce`; the provider may layer additional
   * values (PKCE verifier/challenge) and return them in `callbackContext`.
   */
  startRedirect?(args: {
    state: string;
    nonce: string;
    redirectUri: string;
  }): Promise<RedirectStartResult>;

  /**
   * Exchange the IdP's callback parameters for a verified profile. The
   * provider is responsible for verifying signatures, expiry, audience, and
   * any nonce/state that was issued during `startRedirect`.
   */
  handleRedirectCallback?(args: {
    params: Record<string, string>;
    callbackContext?: Record<string, string>;
    redirectUri: string;
  }): Promise<ProviderProfile>;

  // ── optional capabilities ──────────────────────────────────────────────
  /** Build a logout URL (e.g. Cognito's `/logout` endpoint). */
  buildLogoutUrl?(args: { payload: AuthPayload; postLogoutRedirectUri: string }): Promise<string>;

  /** Provision a user in the upstream IdP for invitations. */
  adminCreateUser?(input: AdminInviteInput): Promise<AdminInviteResult>;
}

// ──────────────────────────────────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────────────────────────────────

export class AuthProviderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthProviderConfigError";
  }
}

/**
 * Asserts the provider is shaped correctly for its declared `kind`.
 * Throws a descriptive error otherwise. Called at boot.
 */
export function validateProvider(provider: AuthProvider): void {
  if (!provider || typeof provider !== "object") {
    throw new AuthProviderConfigError("Auth provider must be an object");
  }
  if (typeof provider.id !== "string" || provider.id.length === 0) {
    throw new AuthProviderConfigError("Auth provider must have a non-empty `id`");
  }
  if (typeof provider.displayName !== "string" || provider.displayName.length === 0) {
    throw new AuthProviderConfigError(
      `Auth provider "${provider.id}" must have a non-empty \`displayName\``,
    );
  }
  if (provider.kind !== "credential" && provider.kind !== "redirect") {
    throw new AuthProviderConfigError(
      `Auth provider "${provider.id}" has invalid kind "${String(provider.kind)}" ` +
        `(expected "credential" or "redirect")`,
    );
  }
  if (!provider.capabilities || typeof provider.capabilities !== "object") {
    throw new AuthProviderConfigError(
      `Auth provider "${provider.id}" must define a \`capabilities\` object`,
    );
  }

  if (provider.kind === "credential") {
    if (typeof provider.authenticate !== "function") {
      throw new AuthProviderConfigError(
        `Credential auth provider "${provider.id}" must implement \`authenticate()\``,
      );
    }
    if (provider.capabilities.register === true && typeof provider.register !== "function") {
      throw new AuthProviderConfigError(
        `Auth provider "${provider.id}" advertises capabilities.register=true ` +
          `but does not implement \`register()\``,
      );
    }
  }

  if (provider.kind === "redirect") {
    if (typeof provider.startRedirect !== "function") {
      throw new AuthProviderConfigError(
        `Redirect auth provider "${provider.id}" must implement \`startRedirect()\``,
      );
    }
    if (typeof provider.handleRedirectCallback !== "function") {
      throw new AuthProviderConfigError(
        `Redirect auth provider "${provider.id}" must implement \`handleRedirectCallback()\``,
      );
    }
  }
}
