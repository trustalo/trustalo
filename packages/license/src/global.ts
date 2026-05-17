// Global `assertEnterpriseLicense` helper.
//
// EE features call this from every entry point that performs the
// paywalled behavior. It uses a process-wide singleton validator
// constructed lazily from:
//
//   - PRODUCTION_PUBLIC_KEYS (compile-time, always honored)
//   - TRUSTALO_LICENSE_DEV_PUBLIC_KEY_JWK (env, only honored when
//     NODE_ENV !== "production"; lets engineers run a dev keypair locally
//     without committing it to the repo)
//
// Plus a separate dev-bypass switch (TRUSTALO_LICENSE_DEV_BYPASS=1) that
// short-circuits the gate entirely in non-prod environments. Useful for
// running the dev server without dealing with keys.
//
// In production (NODE_ENV === "production") neither the env-injected key
// nor the bypass switch is honored — only PRODUCTION_PUBLIC_KEYS counts.

import { LicenseValidator, type TrustedPublicKey } from "./validator.js";
import {
  EnterpriseLicenseError,
  type Ed25519PublicJwk,
  type FeatureId,
  type LicenseClaims,
} from "./types.js";
import { PRODUCTION_PUBLIC_KEYS } from "./keys.js";

const ENV_LICENSE_KEY = "TRUSTALO_LICENSE_KEY";
const ENV_DEV_PUB_KEY = "TRUSTALO_LICENSE_DEV_PUBLIC_KEY_JWK";
const ENV_DEV_BYPASS = "TRUSTALO_LICENSE_DEV_BYPASS";

let cachedValidator: LicenseValidator | null = null;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function isDevBypassActive(): boolean {
  return !isProduction() && process.env[ENV_DEV_BYPASS] === "1";
}

function buildDefaultValidator(): LicenseValidator {
  const trustedKeys: TrustedPublicKey[] = [...PRODUCTION_PUBLIC_KEYS];

  if (!isProduction()) {
    const devJwkRaw = process.env[ENV_DEV_PUB_KEY]?.trim();
    if (devJwkRaw) {
      try {
        const parsed = JSON.parse(devJwkRaw) as Ed25519PublicJwk;
        trustedKeys.push({
          jwk: parsed,
          label: `dev-public-key-from-env (${ENV_DEV_PUB_KEY})`,
        });
      } catch (e) {
        throw new Error(`Failed to parse ${ENV_DEV_PUB_KEY} as JSON JWK: ${(e as Error).message}`);
      }
    }
  }

  return new LicenseValidator({ trustedPublicKeys: trustedKeys });
}

/** Reset the cached singleton (test-only). */
export function __resetDefaultValidatorForTests(): void {
  cachedValidator = null;
}

/** Replace the cached singleton (test-only). */
export function __setDefaultValidatorForTests(v: LicenseValidator | null): void {
  cachedValidator = v;
}

function getDefaultValidator(): LicenseValidator {
  if (!cachedValidator) {
    cachedValidator = buildDefaultValidator();
  }
  return cachedValidator;
}

/**
 * Assert that a valid Trustalo Enterprise License is configured AND
 * entitles the caller to use the given feature. Returns the parsed
 * claims on success; throws EnterpriseLicenseError on any failure.
 *
 * Behavior in non-production with `TRUSTALO_LICENSE_DEV_BYPASS=1`: returns
 * a synthetic developer-tier claims object without checking any key. The
 * bypass is IGNORED in production; production always requires a valid
 * production-signed key.
 */
export async function assertEnterpriseLicense(featureId: FeatureId): Promise<LicenseClaims> {
  if (isDevBypassActive()) {
    const now = Math.floor(Date.now() / 1000);
    return {
      v: 1,
      iss: "trustalo.io",
      sub: "dev-bypass",
      lid: "lic_dev_bypass",
      tier: "developer",
      features: ["*"],
      max_users: 0,
      iat: now,
      nbf: now,
      exp: now + 3600,
    };
  }

  const rawKey = process.env[ENV_LICENSE_KEY]?.trim();
  if (!rawKey) {
    throw new EnterpriseLicenseError(
      featureId,
      `${ENV_LICENSE_KEY} environment variable is not set`,
      "no_license_key",
    );
  }

  return getDefaultValidator().validate(rawKey, featureId);
}

/** Read claims without enforcing a specific feature. Returns null if no key. */
export async function getLicenseClaims(): Promise<LicenseClaims | null> {
  if (isDevBypassActive()) {
    return assertEnterpriseLicense("*");
  }
  const rawKey = process.env[ENV_LICENSE_KEY]?.trim();
  if (!rawKey) return null;
  try {
    return await getDefaultValidator().getClaims(rawKey);
  } catch {
    return null;
  }
}
