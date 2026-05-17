import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  EnterpriseLicenseError,
  LicenseValidator,
  assertEnterpriseLicense,
  buildToken,
  getLicenseClaims,
  parseToken,
  __resetDefaultValidatorForTests,
} from "./index.js";
import type { Ed25519PrivateJwk, Ed25519PublicJwk, LicenseClaims } from "./types.js";

interface TestKeypair {
  publicJwk: Ed25519PublicJwk;
  privateJwk: Ed25519PrivateJwk;
}

async function freshKeypair(): Promise<TestKeypair> {
  return LicenseValidator.generateKeypair();
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

function baseClaims(overrides: Partial<LicenseClaims> = {}): LicenseClaims {
  const now = nowSec();
  return {
    v: 1,
    iss: "trustalo.io",
    sub: "test-customer",
    lid: "lic_test_01",
    tier: "enterprise",
    features: ["sso"],
    max_users: 100,
    iat: now,
    nbf: now,
    exp: now + 3600,
    ...overrides,
  };
}

const SAVED_ENV: Record<string, string | undefined> = {};
const TRACKED_ENV_KEYS = [
  "TRUSTALO_LICENSE_KEY",
  "TRUSTALO_LICENSE_DEV_PUBLIC_KEY_JWK",
  "TRUSTALO_LICENSE_DEV_BYPASS",
  "NODE_ENV",
];

beforeEach(() => {
  for (const key of TRACKED_ENV_KEYS) {
    SAVED_ENV[key] = process.env[key];
  }
  __resetDefaultValidatorForTests();
});

afterEach(() => {
  for (const key of TRACKED_ENV_KEYS) {
    if (SAVED_ENV[key] === undefined) delete process.env[key];
    else process.env[key] = SAVED_ENV[key];
  }
  __resetDefaultValidatorForTests();
});

describe("token encoding", () => {
  test("buildToken + parseToken round-trip", () => {
    const payload = new TextEncoder().encode(JSON.stringify({ hello: "world" }));
    const sig = new Uint8Array(64).fill(0xab);
    const token = buildToken(payload, sig);
    expect(token.startsWith("trl_")).toBe(true);
    const parsed = parseToken(token);
    expect(parsed.payloadJson).toEqual({ hello: "world" });
    expect(parsed.signature.length).toBe(64);
  });

  test("parseToken rejects missing prefix", () => {
    expect(() => parseToken("eyJhbGciOiJFUzI1NiJ9.foo.bar")).toThrow(/must start with/);
  });

  test("parseToken rejects bad signature length", () => {
    const payload = new TextEncoder().encode("{}");
    const badSig = new Uint8Array(32);
    const token = buildToken(payload, badSig);
    expect(() => parseToken(token)).toThrow(/Signature has unexpected length/);
  });
});

describe("LicenseValidator.issue + validate", () => {
  test("round-trip: issued key validates with the matching public key", async () => {
    const { publicJwk, privateJwk } = await freshKeypair();
    const validator = new LicenseValidator({
      trustedPublicKeys: [{ jwk: publicJwk, label: "test" }],
    });

    const token = await LicenseValidator.issue({
      privateJwk,
      claims: baseClaims(),
    });

    const claims = await validator.validate(token, "sso");
    expect(claims.sub).toBe("test-customer");
    expect(claims.features).toContain("sso");
  });

  test("rejects token signed by a different keypair", async () => {
    const trusted = await freshKeypair();
    const attacker = await freshKeypair();
    const validator = new LicenseValidator({
      trustedPublicKeys: [{ jwk: trusted.publicJwk, label: "trusted" }],
    });
    const token = await LicenseValidator.issue({
      privateJwk: attacker.privateJwk,
      claims: baseClaims(),
    });
    await expect(validator.validate(token, "sso")).rejects.toThrow(/invalid_signature/);
  });

  test("rejects feature not in claims.features", async () => {
    const { publicJwk, privateJwk } = await freshKeypair();
    const validator = new LicenseValidator({
      trustedPublicKeys: [{ jwk: publicJwk, label: "test" }],
    });
    const token = await LicenseValidator.issue({
      privateJwk,
      claims: baseClaims({ features: ["sso"] }),
    });
    await expect(validator.validate(token, "multi-tenant")).rejects.toThrow(/feature_not_entitled/);
  });

  test("wildcard feature * grants all", async () => {
    const { publicJwk, privateJwk } = await freshKeypair();
    const validator = new LicenseValidator({
      trustedPublicKeys: [{ jwk: publicJwk, label: "test" }],
    });
    const token = await LicenseValidator.issue({
      privateJwk,
      claims: baseClaims({ features: ["*"] }),
    });
    const claims = await validator.validate(token, "anything-goes");
    expect(claims.features).toEqual(["*"]);
  });

  test("rejects expired token", async () => {
    const { publicJwk, privateJwk } = await freshKeypair();
    const validator = new LicenseValidator({
      trustedPublicKeys: [{ jwk: publicJwk, label: "test" }],
      clockSkewSeconds: 0,
    });
    const past = nowSec() - 7200;
    const token = await LicenseValidator.issue({
      privateJwk,
      claims: baseClaims({ iat: past, nbf: past, exp: past + 60 }),
    });
    await expect(validator.validate(token, "sso")).rejects.toThrow(/expired/);
  });

  test("rejects not-yet-valid token", async () => {
    const { publicJwk, privateJwk } = await freshKeypair();
    const validator = new LicenseValidator({
      trustedPublicKeys: [{ jwk: publicJwk, label: "test" }],
      clockSkewSeconds: 0,
    });
    const future = nowSec() + 7200;
    const token = await LicenseValidator.issue({
      privateJwk,
      claims: baseClaims({ iat: future, nbf: future, exp: future + 3600 }),
    });
    await expect(validator.validate(token, "sso")).rejects.toThrow(/not_yet_valid/);
  });

  test("rejects revoked license id", async () => {
    const { publicJwk, privateJwk } = await freshKeypair();
    const revoked = new Set(["lic_test_01"]);
    const validator = new LicenseValidator({
      trustedPublicKeys: [{ jwk: publicJwk, label: "test" }],
      revokedLicenseIds: revoked,
    });
    const token = await LicenseValidator.issue({ privateJwk, claims: baseClaims() });
    await expect(validator.validate(token, "sso")).rejects.toThrow(/revoked/);
  });

  test("rejects developer-tier in production", async () => {
    process.env.NODE_ENV = "production";
    const { publicJwk, privateJwk } = await freshKeypair();
    const validator = new LicenseValidator({
      trustedPublicKeys: [{ jwk: publicJwk, label: "test" }],
    });
    const token = await LicenseValidator.issue({
      privateJwk,
      claims: baseClaims({ tier: "developer" }),
    });
    await expect(validator.validate(token, "sso")).rejects.toThrow(/dev_key_in_production/);
  });

  test("rejects schema-invalid payload (missing required field)", async () => {
    const { publicJwk, privateJwk } = await freshKeypair();
    const validator = new LicenseValidator({
      trustedPublicKeys: [{ jwk: publicJwk, label: "test" }],
    });
    const badPayload = new TextEncoder().encode(
      JSON.stringify({ v: 1, iss: "trustalo.io", sub: "x" }),
    );
    const importedKey = await crypto.subtle.importKey(
      "jwk",
      privateJwk,
      { name: "Ed25519" },
      false,
      ["sign"],
    );
    const sig = new Uint8Array(
      await crypto.subtle.sign({ name: "Ed25519" }, importedKey, badPayload),
    );
    const token = buildToken(badPayload, sig);
    await expect(validator.validate(token, "sso")).rejects.toThrow(/schema_invalid/);
  });

  test("validator with empty trusted keys fails closed", async () => {
    const validator = new LicenseValidator({ trustedPublicKeys: [] });
    const { privateJwk } = await freshKeypair();
    const token = await LicenseValidator.issue({ privateJwk, claims: baseClaims() });
    await expect(validator.validate(token, "sso")).rejects.toThrow(/no_trusted_keys/);
  });
});

describe("assertEnterpriseLicense (global helper)", () => {
  test("throws no_license_key when env var absent", async () => {
    delete process.env.TRUSTALO_LICENSE_KEY;
    delete process.env.TRUSTALO_LICENSE_DEV_BYPASS;
    await expect(assertEnterpriseLicense("sso")).rejects.toMatchObject({
      name: "EnterpriseLicenseError",
      code: "no_license_key",
    });
  });

  test("dev bypass: short-circuits in non-production", async () => {
    process.env.NODE_ENV = "development";
    process.env.TRUSTALO_LICENSE_DEV_BYPASS = "1";
    delete process.env.TRUSTALO_LICENSE_KEY;

    const claims = await assertEnterpriseLicense("sso");
    expect(claims.tier).toBe("developer");
    expect(claims.features).toEqual(["*"]);
  });

  test("dev bypass: ignored in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.TRUSTALO_LICENSE_DEV_BYPASS = "1";
    delete process.env.TRUSTALO_LICENSE_KEY;

    await expect(assertEnterpriseLicense("sso")).rejects.toMatchObject({
      code: "no_license_key",
    });
  });

  test("env-injected dev public key validates a dev-signed token in non-prod", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.TRUSTALO_LICENSE_DEV_BYPASS;

    const { publicJwk, privateJwk } = await freshKeypair();
    process.env.TRUSTALO_LICENSE_DEV_PUBLIC_KEY_JWK = JSON.stringify(publicJwk);

    const token = await LicenseValidator.issue({
      privateJwk,
      claims: baseClaims({ tier: "developer", features: ["sso"] }),
    });
    process.env.TRUSTALO_LICENSE_KEY = token;

    const claims = await assertEnterpriseLicense("sso");
    expect(claims.tier).toBe("developer");
  });

  test("env-injected dev public key is NOT honored in production", async () => {
    process.env.NODE_ENV = "production";
    const { publicJwk, privateJwk } = await freshKeypair();
    process.env.TRUSTALO_LICENSE_DEV_PUBLIC_KEY_JWK = JSON.stringify(publicJwk);
    const token = await LicenseValidator.issue({
      privateJwk,
      claims: baseClaims({ tier: "enterprise", features: ["sso"] }),
    });
    process.env.TRUSTALO_LICENSE_KEY = token;

    // In production with no PRODUCTION_PUBLIC_KEYS configured, this MUST fail.
    await expect(assertEnterpriseLicense("sso")).rejects.toMatchObject({
      code: "no_trusted_keys",
    });
  });

  test("getLicenseClaims returns null when no key set", async () => {
    delete process.env.TRUSTALO_LICENSE_KEY;
    delete process.env.TRUSTALO_LICENSE_DEV_BYPASS;
    const claims = await getLicenseClaims();
    expect(claims).toBeNull();
  });
});

describe("EnterpriseLicenseError", () => {
  test("carries featureId and code on every failure", async () => {
    const validator = new LicenseValidator({ trustedPublicKeys: [] });
    try {
      await validator.validate("not-even-a-real-token", "sso");
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(EnterpriseLicenseError);
      const err = e as EnterpriseLicenseError;
      expect(err.featureId).toBe("sso");
      expect(err.code).toBe("malformed_key");
    }
  });
});
