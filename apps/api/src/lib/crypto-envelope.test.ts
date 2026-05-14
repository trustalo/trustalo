import { afterEach, describe, expect, test } from "bun:test";
import {
  decryptString,
  decryptStringMaybe,
  encryptString,
  encryptStringMaybe,
  isEncryptedString,
} from "./crypto-envelope.js";

const KEY_ENV_VAR = "AI_PROVIDER_CONFIG_ENCRYPTION_KEY";
const originalNodeEnv = process.env["NODE_ENV"];
const originalKey = process.env[KEY_ENV_VAR];

const VALID_KEY = "a".repeat(64);

afterEach(() => {
  if (originalNodeEnv === undefined) delete process.env["NODE_ENV"];
  else process.env["NODE_ENV"] = originalNodeEnv;

  if (originalKey === undefined) delete process.env[KEY_ENV_VAR];
  else process.env[KEY_ENV_VAR] = originalKey;
});

describe("isEncryptedString", () => {
  test("returns true only for enc:v1 prefix", () => {
    expect(isEncryptedString("enc:v1:iv:tag:data")).toBe(true);
    expect(isEncryptedString("hello")).toBe(false);
    expect(isEncryptedString("enc:v2:iv:tag:data")).toBe(false);
    expect(isEncryptedString(null)).toBe(false);
    expect(isEncryptedString(undefined)).toBe(false);
  });
});

describe("encryptString/decryptString", () => {
  test("round-trips with explicit env key", () => {
    process.env["NODE_ENV"] = "test";
    process.env[KEY_ENV_VAR] = VALID_KEY;

    const encrypted = encryptString("sensitive-value");
    expect(isEncryptedString(encrypted)).toBe(true);
    expect(encrypted).not.toContain("sensitive-value");
    expect(decryptString(encrypted)).toBe("sensitive-value");
  });

  test("round-trips with deterministic dev fallback key", () => {
    process.env["NODE_ENV"] = "development";
    delete process.env[KEY_ENV_VAR];

    const encrypted = encryptString("dev-fallback");
    expect(decryptString(encrypted)).toBe("dev-fallback");
  });

  test("returns plaintext when value is not encrypted", () => {
    process.env["NODE_ENV"] = "test";
    process.env[KEY_ENV_VAR] = VALID_KEY;
    expect(decryptString("legacy-plaintext")).toBe("legacy-plaintext");
  });

  test("throws on malformed encrypted envelope", () => {
    process.env["NODE_ENV"] = "test";
    process.env[KEY_ENV_VAR] = VALID_KEY;
    expect(() => decryptString("enc:v1:only:three")).toThrow(
      "[security] malformed encrypted envelope",
    );
  });

  test("throws when env key is malformed", () => {
    process.env["NODE_ENV"] = "test";
    process.env[KEY_ENV_VAR] = "too-short";
    expect(() => encryptString("x")).toThrow(
      `[security] ${KEY_ENV_VAR} must be exactly 64 hex characters`,
    );
  });

  test("throws in production when key is not set", () => {
    process.env["NODE_ENV"] = "production";
    delete process.env[KEY_ENV_VAR];
    expect(() => encryptString("x")).toThrow(
      `[security] ${KEY_ENV_VAR} is required to encrypt sensitive fields`,
    );
  });

  test("fails to decrypt tampered ciphertext", () => {
    process.env["NODE_ENV"] = "test";
    process.env[KEY_ENV_VAR] = VALID_KEY;
    const encrypted = encryptString("integrity-check");
    const parts = encrypted.split(":");
    const tamperedTag = Buffer.alloc(16, 0).toString("base64");
    const tampered = `${parts[0]}:${parts[1]}:${parts[2]}:${tamperedTag}:${parts[4]}`;
    expect(() => decryptString(tampered)).toThrow();
  });
});

describe("encryptStringMaybe/decryptStringMaybe", () => {
  test("handles nullish and empty values as null", () => {
    expect(encryptStringMaybe(null)).toBeNull();
    expect(encryptStringMaybe(undefined)).toBeNull();
    expect(encryptStringMaybe("")).toBeNull();

    expect(decryptStringMaybe(null)).toBeNull();
    expect(decryptStringMaybe(undefined)).toBeNull();
    expect(decryptStringMaybe("")).toBeNull();
  });

  test("encrypts plaintext and preserves already-encrypted values", () => {
    process.env["NODE_ENV"] = "test";
    process.env[KEY_ENV_VAR] = VALID_KEY;

    const encrypted = encryptStringMaybe("plain");
    expect(encrypted).toBeString();
    expect(encrypted && isEncryptedString(encrypted)).toBe(true);
    expect(encrypted && decryptStringMaybe(encrypted)).toBe("plain");

    const already = "enc:v1:iv:tag:data";
    expect(encryptStringMaybe(already)).toBe(already);
  });

  test("passes through legacy plaintext in decryptStringMaybe", () => {
    process.env["NODE_ENV"] = "test";
    process.env[KEY_ENV_VAR] = VALID_KEY;
    expect(decryptStringMaybe("legacy")).toBe("legacy");
  });
});
