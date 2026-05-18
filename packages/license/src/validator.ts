// LicenseValidator — verifies Trustalo Enterprise License tokens.
//
// Pipeline (validate()):
//   1. Parse the `trl_<payload>.<signature>` envelope.
//   2. Schema-validate the JSON payload (Zod).
//   3. Verify the Ed25519 signature against every trusted public key.
//   4. Reject developer-tier keys when NODE_ENV === "production".
//   5. Check temporal claims (nbf <= now < exp, with clock skew).
//   6. Check feature entitlement (claims.features must include featureId
//      OR the wildcard "*").
//   7. Check revocation against the configured revoked-id set.
//
// All failure paths throw EnterpriseLicenseError with a stable `code` so
// callers (and the HTTP layer) can map them to user-facing responses
// (typically 402 Payment Required).
//
// The class is intentionally injectable: tests construct their own
// validator with their own ephemeral trusted keys instead of monkey-
// patching globals.

import { z } from "zod";
import {
  EnterpriseLicenseError,
  licenseClaimsSchema,
  type Ed25519PrivateJwk,
  type Ed25519PublicJwk,
  type FeatureId,
  type LicenseClaims,
} from "./types.js";
import { buildToken, parseToken } from "./encoding.js";

const DEFAULT_CLOCK_SKEW_SECONDS = 300;

export interface TrustedPublicKey {
  /** Ed25519 public key in JWK form (no `d`). */
  jwk: Ed25519PublicJwk;
  /** Human-readable label for logs. */
  label: string;
  /**
   * Optional active-window guard. License keys whose `iat` falls outside
   * [notBefore, notAfter] are rejected by THIS trusted key (other trusted
   * keys may still accept). Useful during rotation.
   */
  notBefore?: number;
  notAfter?: number;
}

export interface LicenseValidatorOptions {
  trustedPublicKeys: TrustedPublicKey[];
  clockSkewSeconds?: number;
  now?: () => Date;
  /** License ids known to be revoked. Mutate externally to support a CRL. */
  revokedLicenseIds?: ReadonlySet<string>;
}

export class LicenseValidator {
  private readonly importedKeys: Promise<
    {
      crypto: CryptoKey;
      label: string;
      notBefore: number | undefined;
      notAfter: number | undefined;
    }[]
  >;
  private readonly clockSkewSeconds: number;
  private readonly now: () => Date;
  private readonly revokedLicenseIds: ReadonlySet<string>;
  private readonly cache = new Map<string, LicenseClaims>();

  constructor(opts: LicenseValidatorOptions) {
    this.clockSkewSeconds = opts.clockSkewSeconds ?? DEFAULT_CLOCK_SKEW_SECONDS;
    this.now = opts.now ?? (() => new Date());
    this.revokedLicenseIds = opts.revokedLicenseIds ?? new Set<string>();

    if (opts.trustedPublicKeys.length === 0) {
      // Fail closed at first validation rather than at construction so a
      // process that never validates a license can still boot.
      this.importedKeys = Promise.resolve([]);
    } else {
      this.importedKeys = Promise.all(
        opts.trustedPublicKeys.map(async (k) => ({
          crypto: await crypto.subtle.importKey("jwk", k.jwk, { name: "Ed25519" }, false, [
            "verify",
          ]),
          label: k.label,
          notBefore: k.notBefore,
          notAfter: k.notAfter,
        })),
      );
    }
  }

  async validate(rawKey: string, featureId: FeatureId): Promise<LicenseClaims> {
    const cacheKey = `${rawKey}|${featureId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.checkTemporalAndFeature(cached, featureId);
      this.checkRevocation(cached, featureId);
      return cached;
    }

    let parsed;
    try {
      parsed = parseToken(rawKey);
    } catch (e) {
      throw new EnterpriseLicenseError(featureId, (e as Error).message, "malformed_key");
    }

    let claims: LicenseClaims;
    try {
      claims = licenseClaimsSchema.parse(parsed.payloadJson);
    } catch (e) {
      const reason =
        e instanceof z.ZodError
          ? e.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")
          : "invalid claims";
      throw new EnterpriseLicenseError(featureId, reason, "schema_invalid");
    }

    const keys = await this.importedKeys;
    if (keys.length === 0) {
      throw new EnterpriseLicenseError(
        featureId,
        "no trusted public keys are configured for this build",
        "no_trusted_keys",
      );
    }

    let signatureOk = false;
    for (const tk of keys) {
      if (tk.notBefore !== undefined && claims.iat < tk.notBefore) continue;
      if (tk.notAfter !== undefined && claims.iat > tk.notAfter) continue;
      const ok = await crypto.subtle.verify(
        { name: "Ed25519" },
        tk.crypto,
        parsed.signature,
        parsed.payload,
      );
      if (ok) {
        signatureOk = true;
        break;
      }
    }
    if (!signatureOk) {
      throw new EnterpriseLicenseError(
        featureId,
        "signature did not verify against any trusted key",
        "invalid_signature",
      );
    }

    if (claims.tier === "developer" && process.env.NODE_ENV === "production") {
      throw new EnterpriseLicenseError(
        featureId,
        "developer-tier license keys cannot be used in production",
        "dev_key_in_production",
      );
    }

    this.checkTemporalAndFeature(claims, featureId);
    this.checkRevocation(claims, featureId);

    this.cache.set(cacheKey, claims);
    return claims;
  }

  /**
   * Convenience method: validate, but only return claims, no feature
   * enforcement. Useful for showing license metadata on the dashboard
   * without requiring a specific feature.
   */
  async getClaims(rawKey: string): Promise<LicenseClaims> {
    return this.validate(rawKey, "*");
  }

  isFeatureEntitled(claims: LicenseClaims, featureId: FeatureId): boolean {
    return claims.features.includes("*") || claims.features.includes(featureId);
  }

  private checkTemporalAndFeature(claims: LicenseClaims, featureId: FeatureId): void {
    const now = Math.floor(this.now().getTime() / 1000);
    const skew = this.clockSkewSeconds;

    if (now + skew < claims.nbf) {
      throw new EnterpriseLicenseError(
        featureId,
        `not yet valid (nbf=${claims.nbf}, now=${now})`,
        "not_yet_valid",
      );
    }
    if (now - skew >= claims.exp) {
      throw new EnterpriseLicenseError(
        featureId,
        `expired (exp=${claims.exp}, now=${now})`,
        "expired",
      );
    }
    if (
      featureId !== "*" &&
      !claims.features.includes("*") &&
      !claims.features.includes(featureId)
    ) {
      throw new EnterpriseLicenseError(
        featureId,
        `license does not include feature "${featureId}" (entitled: ${claims.features.join(", ")})`,
        "feature_not_entitled",
      );
    }
  }

  private checkRevocation(claims: LicenseClaims, featureId: FeatureId): void {
    if (this.revokedLicenseIds.has(claims.lid)) {
      throw new EnterpriseLicenseError(
        featureId,
        `license ${claims.lid} has been revoked`,
        "revoked",
      );
    }
  }

  /**
   * Sign a license key.
   *
   * INTERNAL — for the test suite and the local developer-key script
   * (`scripts/issue-dev-key.ts`) ONLY. Production license issuance does
   * NOT happen in this repository: it lives in Trustalo's private admin
   * tooling, where the signing key is held offline / hardware-backed.
   *
   * The leading underscore and `ForTesting` suffix mark this as a
   * non-public API; the runtime guard below makes accidental production
   * use impossible.
   *
   * @internal
   */
  static async _issueForTesting(opts: {
    privateJwk: Ed25519PrivateJwk;
    claims: Omit<LicenseClaims, "v" | "iss"> & {
      v?: 1;
      iss?: "trustalo.io";
    };
  }): Promise<string> {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "LicenseValidator._issueForTesting must not be called in production. " +
          "Production license issuance happens in Trustalo's private admin tooling, " +
          "not in @trustalo/license.",
      );
    }

    const fullClaims: LicenseClaims = licenseClaimsSchema.parse({
      v: 1,
      iss: "trustalo.io",
      ...opts.claims,
    });
    const payload = new TextEncoder().encode(JSON.stringify(fullClaims));

    const privateKey = await crypto.subtle.importKey(
      "jwk",
      opts.privateJwk,
      { name: "Ed25519" },
      false,
      ["sign"],
    );
    const signature = new Uint8Array(
      await crypto.subtle.sign({ name: "Ed25519" }, privateKey, payload),
    );
    return buildToken(payload, signature);
  }

  /** Generate a fresh Ed25519 keypair as JWK objects. */
  static async generateKeypair(): Promise<{
    publicJwk: Ed25519PublicJwk;
    privateJwk: Ed25519PrivateJwk;
  }> {
    const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
      "sign",
      "verify",
    ])) as unknown as CryptoKeyPair;
    const publicJwk = (await crypto.subtle.exportKey(
      "jwk",
      kp.publicKey,
    )) as unknown as Ed25519PublicJwk;
    const privateJwk = (await crypto.subtle.exportKey(
      "jwk",
      kp.privateKey,
    )) as unknown as Ed25519PrivateJwk;
    return { publicJwk, privateJwk };
  }
}
