// Trustalo authentication plugin — starter template.
//
// Copy this file into your own npm package, rename `id` and `displayName`,
// and replace the `authenticate` (credential) or `startRedirect` /
// `handleRedirectCallback` (redirect) methods with calls to your IdP.
//
// Wire it up by setting:
//   AUTH_PROVIDER=external
//   AUTH_EXTERNAL_PROVIDER=<your-package-name>
//
// See docs/auth-providers.md for the full contract reference.

import { AuthProviderConfigError, type AuthProvider, type ProviderProfile } from "@trustalo/auth";

/**
 * Factory invoked at boot time by Trustalo's loader. Read your provider's
 * configuration from the `env` argument and throw `AuthProviderConfigError`
 * if anything is missing — the API will surface the message and exit
 * cleanly so misconfiguration is obvious in CI / Docker logs.
 */
export function createProvider(env: Record<string, string | undefined>): AuthProvider {
  const required = (name: string): string => {
    const value = env[name]?.trim();
    if (!value) throw new AuthProviderConfigError(`Missing required env var: ${name}`);
    return value;
  };

  const apiBase = required("MY_IDP_BASE_URL");
  const clientId = required("MY_IDP_CLIENT_ID");

  return {
    id: "my-idp",
    displayName: "My Identity Provider",
    kind: "credential",
    capabilities: {
      register: false,
      resetPassword: false,
      mfa: false,
      socialLogin: false,
    },

    async authenticate({ email, password }): Promise<ProviderProfile> {
      const response = await fetch(`${apiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, client_id: clientId }),
      });

      if (response.status === 401) {
        throw new InvalidCredentialsError();
      }
      if (!response.ok) {
        throw new Error(`Upstream login failed (${response.status})`);
      }

      const data = (await response.json()) as {
        sub: string;
        email: string;
        name?: string;
        email_verified?: boolean;
      };

      return {
        externalId: data.sub,
        email: data.email.toLowerCase(),
        name: data.name,
        emailVerified: data.email_verified === true,
      };
    },
  };
}

/**
 * Trustalo will surface `error.message` to the API caller verbatim, so
 * use clear, user-facing copy. The status/code fields are picked up by
 * AuthService for HTTP response mapping.
 */
class InvalidCredentialsError extends Error {
  readonly status = 401;
  readonly code = "INVALID_CREDENTIALS";
  constructor() {
    super("Invalid email or password");
  }
}

// Default export is also accepted by the loader (factory or object).
export default createProvider;
