// Types and Zod schemas shared across the license package.
//
// The license token is a compact, Ed25519-signed envelope carrying these
// claims. Adding a new field is a non-breaking change as long as it is
// optional; renaming or removing a field requires a `v` bump.

import { z } from "zod";

/**
 * Trustalo Enterprise feature identifiers. Every EE feature MUST call
 * `assertEnterpriseLicense(<id>)` at every entry point that performs the
 * paywalled behavior. Add new ids here as features are gated.
 */
export type FeatureId =
  | "sso"
  | "multi-tenant"
  // Umbrella feature id for the AI accelerator surface (chat, context
  // extraction, questionnaire assist, quiz generation). Anything that
  // calls an LLM beyond the always-free PII scrubber and basic asset
  // classification requires an entitlement to "ai".
  | "ai"
  // Reserved for future sub-feature gating: premium-model selection
  // (Sonnet/Opus tier), agentic workflows, RAG over customer's own
  // knowledge base. A token holding "ai-premium" is implicitly entitled
  // to "ai" too — features that only need basic AI should still gate on
  // "ai" so a customer with only "ai-premium" can be denied basic.
  | "ai-premium"
  | (string & {});

export type LicenseTier = "enterprise" | "developer";

export const LICENSE_VERSION = 1 as const;
export const LICENSE_ISSUER = "trustalo.io" as const;

export const licenseClaimsSchema = z.object({
  v: z.literal(LICENSE_VERSION),
  iss: z.literal(LICENSE_ISSUER),
  sub: z.string().min(1, "sub is required"),
  lid: z.string().min(1, "lid is required"),
  tier: z.enum(["enterprise", "developer"]),
  features: z.array(z.string().min(1)).min(1, "features must include at least one entry"),
  max_users: z.number().int().nonnegative(),
  iat: z.number().int().nonnegative(),
  nbf: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
});

export type LicenseClaims = z.infer<typeof licenseClaimsSchema>;

export type EnterpriseLicenseErrorCode =
  | "no_license_key"
  | "no_trusted_keys"
  | "malformed_key"
  | "invalid_signature"
  | "schema_invalid"
  | "expired"
  | "not_yet_valid"
  | "feature_not_entitled"
  | "revoked"
  | "dev_key_in_production";

export class EnterpriseLicenseError extends Error {
  constructor(
    public readonly featureId: string,
    public readonly reason: string,
    public readonly code: EnterpriseLicenseErrorCode,
  ) {
    super(
      `Trustalo Enterprise License required for feature "${featureId}": ${reason} (code=${code})`,
    );
    this.name = "EnterpriseLicenseError";
  }
}

/** Ed25519 JWK shape (public OR private — discriminate on presence of `d`). */
export interface Ed25519PublicJwk {
  kty: "OKP";
  crv: "Ed25519";
  x: string;
  ext?: boolean;
  key_ops?: string[];
}

export interface Ed25519PrivateJwk extends Ed25519PublicJwk {
  d: string;
}
