// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0
//
// @trustalo/auth-provider-saml.ee — Trustalo Enterprise SAML 2.0 auth
// provider.
//
// EE FILE — governed by LICENSE_EE at the repo root. Production use of
// this provider requires a valid Trustalo Enterprise License token in
// TRUSTALO_LICENSE_KEY that includes the "sso" feature.
//
// The package directory name ends in `.ee`, so every file inside is an
// EE File under the convention defined in docs/enterprise.md.
//
// SCAFFOLD — this provider currently demonstrates the EE-gating pattern
// end-to-end (license check at boot + at every callable surface). Real
// SAML 2.0 protocol implementation (AuthnRequest/AuthnResponse XML,
// IdP metadata exchange, signature verification, encrypted assertions)
// is not yet implemented and lands in a follow-up.

import {
  AuthProviderConfigError,
  type AdminInviteInput,
  type AdminInviteResult,
  type AuthProvider,
  type ProviderProfile,
  type RedirectStartResult,
} from "@trustalo/auth";
import { assertEnterpriseLicense } from "@trustalo/license";

const FEATURE_ID = "sso" as const;

export interface SamlProviderConfig {
  /** SAML 2.0 IdP metadata URL or inline metadata XML. */
  idpMetadata: string;
  /** Service Provider entity id (a stable URN/URL identifying Trustalo). */
  spEntityId: string;
  /** Audience expected in IdP-issued assertions. Defaults to spEntityId. */
  spAudience?: string;
  /** PEM-encoded SP signing certificate (for signed AuthnRequests). */
  spSigningCertPem?: string;
  /** PEM-encoded SP signing private key paired with spSigningCertPem. */
  spSigningKeyPem?: string;
  /** PEM-encoded SP encryption certificate (for encrypted assertions). */
  spEncryptionCertPem?: string;
  /** PEM-encoded SP encryption private key paired with spEncryptionCertPem. */
  spEncryptionKeyPem?: string;
  /** Display name on the login button. Defaults to "SAML SSO". */
  displayName?: string;
}

class NotImplementedError extends Error {
  constructor(method: string) {
    super(
      `@trustalo/auth-provider-saml.ee: ${method} is not yet implemented. ` +
        `This package currently scaffolds the EE-gating pattern; full SAML 2.0 ` +
        `protocol support lands in a follow-up. See docs/enterprise.md.`,
    );
    this.name = "NotImplementedError";
  }
}

/**
 * Factory invoked by `@trustalo/auth`'s external-provider loader. Reads
 * SAML config from env vars and returns a provider object.
 *
 * License check fires here, at boot. A misconfigured (no valid license)
 * deployment will fail to start rather than fail on the first login —
 * which is what we want operationally (loud, early, hard to miss).
 */
export async function createProvider(
  env: Record<string, string | undefined>,
): Promise<AuthProvider> {
  await assertEnterpriseLicense(FEATURE_ID);
  const config = readConfigFromEnv(env);
  return buildProvider(config);
}

/** Programmatic factory (for tests and embedding hosts). Same license gate. */
export async function createSamlProvider(config: SamlProviderConfig): Promise<AuthProvider> {
  await assertEnterpriseLicense(FEATURE_ID);
  validateConfig(config);
  return buildProvider(config);
}

function readConfigFromEnv(env: Record<string, string | undefined>): SamlProviderConfig {
  const required = (name: string): string => {
    const v = env[name]?.trim();
    if (!v) {
      throw new AuthProviderConfigError(
        `SAML provider requires env var ${name}. ` +
          `See docs/auth-providers.md for the full list (EE feature).`,
      );
    }
    return v;
  };

  const config: SamlProviderConfig = {
    idpMetadata: required("SAML_IDP_METADATA"),
    spEntityId: required("SAML_SP_ENTITY_ID"),
  };
  const spAudience = env.SAML_SP_AUDIENCE?.trim();
  if (spAudience) config.spAudience = spAudience;
  const spSigningCertPem = env.SAML_SP_SIGNING_CERT_PEM?.trim();
  if (spSigningCertPem) config.spSigningCertPem = spSigningCertPem;
  const spSigningKeyPem = env.SAML_SP_SIGNING_KEY_PEM?.trim();
  if (spSigningKeyPem) config.spSigningKeyPem = spSigningKeyPem;
  const spEncryptionCertPem = env.SAML_SP_ENCRYPTION_CERT_PEM?.trim();
  if (spEncryptionCertPem) config.spEncryptionCertPem = spEncryptionCertPem;
  const spEncryptionKeyPem = env.SAML_SP_ENCRYPTION_KEY_PEM?.trim();
  if (spEncryptionKeyPem) config.spEncryptionKeyPem = spEncryptionKeyPem;
  const displayName = env.SAML_DISPLAY_NAME?.trim();
  if (displayName) config.displayName = displayName;
  validateConfig(config);
  return config;
}

function validateConfig(config: SamlProviderConfig): void {
  if (!config.idpMetadata) {
    throw new AuthProviderConfigError("SAML provider config is missing `idpMetadata`");
  }
  if (!config.spEntityId) {
    throw new AuthProviderConfigError("SAML provider config is missing `spEntityId`");
  }
  // Cert/key must be provided as a pair if either is present.
  if (
    (config.spSigningCertPem && !config.spSigningKeyPem) ||
    (!config.spSigningCertPem && config.spSigningKeyPem)
  ) {
    throw new AuthProviderConfigError(
      "SAML signing cert/key must be provided as a pair (or neither).",
    );
  }
  if (
    (config.spEncryptionCertPem && !config.spEncryptionKeyPem) ||
    (!config.spEncryptionCertPem && config.spEncryptionKeyPem)
  ) {
    throw new AuthProviderConfigError(
      "SAML encryption cert/key must be provided as a pair (or neither).",
    );
  }
}

function buildProvider(config: SamlProviderConfig): AuthProvider {
  return {
    id: "saml",
    displayName: config.displayName ?? "SAML SSO",
    kind: "redirect",
    capabilities: {
      register: false,
      resetPassword: false,
      // SAML provides MFA via the IdP, but Trustalo cannot assert that
      // without inspecting the assertion's AuthnContext at runtime.
      mfa: false,
      socialLogin: false,
    },

    async startRedirect(_args: {
      state: string;
      nonce: string;
      redirectUri: string;
    }): Promise<RedirectStartResult> {
      // Re-check on every call: dev-bypass / key-rotation safety. Cheap
      // because the validator caches the parsed claims for the process.
      await assertEnterpriseLicense(FEATURE_ID);
      throw new NotImplementedError("startRedirect");
    },

    async handleRedirectCallback(_args: {
      params: Record<string, string>;
      callbackContext?: Record<string, string>;
      redirectUri: string;
    }): Promise<ProviderProfile> {
      await assertEnterpriseLicense(FEATURE_ID);
      throw new NotImplementedError("handleRedirectCallback");
    },

    async adminCreateUser(_input: AdminInviteInput): Promise<AdminInviteResult> {
      await assertEnterpriseLicense(FEATURE_ID);
      throw new NotImplementedError("adminCreateUser");
    },
  };
}

export { FEATURE_ID };
