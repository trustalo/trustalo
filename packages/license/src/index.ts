// @trustalo/license — runtime gate for Trustalo Enterprise (EE) features.
//
// Public API:
//   - assertEnterpriseLicense(featureId)      ← call this in every EE entry point
//   - getLicenseClaims()                      ← read-only helper for dashboards
//   - LicenseValidator                        ← injectable validator for tests / advanced use
//   - EnterpriseLicenseError                  ← thrown on every failure path
//
// See docs/enterprise.md for the full design (token format, key rotation,
// revocation, failure semantics).

export {
  assertEnterpriseLicense,
  getLicenseClaims,
  __resetDefaultValidatorForTests,
  __setDefaultValidatorForTests,
} from "./global.js";

export {
  LicenseValidator,
  type LicenseValidatorOptions,
  type TrustedPublicKey,
} from "./validator.js";

export {
  EnterpriseLicenseError,
  licenseClaimsSchema,
  LICENSE_VERSION,
  LICENSE_ISSUER,
  type FeatureId,
  type LicenseClaims,
  type LicenseTier,
  type EnterpriseLicenseErrorCode,
  type Ed25519PublicJwk,
  type Ed25519PrivateJwk,
} from "./types.js";

export { buildToken, parseToken, base64UrlEncode, base64UrlDecode } from "./encoding.js";

export { PRODUCTION_PUBLIC_KEYS, noProductionKeysConfigured } from "./keys.js";
