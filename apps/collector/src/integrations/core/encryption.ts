import { randomBytes, createCipheriv, createDecipheriv, createHash, hkdfSync } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // AES-256

// Versioned ciphertext format:
//   v2:base64(iv | authTag | ciphertext)   ← current (HKDF-SHA256)
//   raw   base64(iv | authTag | ciphertext) ← legacy v1 (single SHA-256)
//
// The legacy form was flagged by CodeQL `js/insufficient-password-hash`:
// `createHash("sha256").update(passphrase).digest()` is a single-round
// hash, not a key-derivation function. The input here is a 256-bit hex
// operator secret (high-entropy), so HKDF — RFC 5869, the standard KDF
// for high-entropy inputs — is the cryptographically correct primitive.
// We keep v1 decryption around so existing rows in the credentials
// table keep working; new encryptions are written as v2.
const CIPHERTEXT_VERSION_PREFIX = "v2:";
const HKDF_INFO = "trustalo:collector:credential-encryption:v2";
// Fixed salt is acceptable here because the input passphrase is already
// random 256-bit material; HKDF's salt parameter is only critical when
// the input has low entropy (passwords). Using a domain-separation
// constant prevents accidental key reuse across other HKDF call sites.
const HKDF_SALT = Buffer.from("trustalo-collector-credentials");

const INSECURE_DEFAULTS = new Set([
  "default-dev-key-change-in-prod!!",
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
]);

function resolveEncryptionKey(): string {
  const raw = process.env["CREDENTIAL_ENCRYPTION_KEY"];
  const isProduction = process.env["NODE_ENV"] === "production";

  if (!raw || raw.trim().length === 0) {
    if (isProduction) {
      throw new Error(
        "[encryption] CREDENTIAL_ENCRYPTION_KEY is required in production. " +
          "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      );
    }
    console.warn(
      "[encryption] WARNING: CREDENTIAL_ENCRYPTION_KEY not set — using insecure dev default. DO NOT use in production.",
    );
    return "default-dev-key-change-in-prod!!";
  }

  if (isProduction && INSECURE_DEFAULTS.has(raw)) {
    throw new Error(
      "[encryption] CREDENTIAL_ENCRYPTION_KEY is set to an insecure default. " +
        "Generate a unique key with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }

  if (!isProduction && INSECURE_DEFAULTS.has(raw)) {
    console.warn("[encryption] WARNING: using insecure dev default for CREDENTIAL_ENCRYPTION_KEY");
  }

  return raw;
}

let _cachedKey: string | null = null;

/**
 * Returns the validated encryption key, cached after first call.
 * Throws in production if the key is missing or insecure.
 */
export function getEncryptionKey(): string {
  if (_cachedKey === null) {
    _cachedKey = resolveEncryptionKey();
  }
  return _cachedKey;
}

/**
 * v2 derivation: HKDF-SHA256 with a domain-separated salt and `info`.
 * Use this for any new ciphertext we write.
 */
function deriveKeyV2(passphrase: string): Buffer {
  const ikm = Buffer.from(passphrase, "utf8");
  const okm = hkdfSync("sha256", ikm, HKDF_SALT, HKDF_INFO, KEY_LENGTH);
  return Buffer.from(okm);
}

/**
 * v1 derivation: legacy single-round SHA-256. Only used to decrypt
 * ciphertext that was written before the v2 prefix existed. Never
 * called for encryption.
 */
function deriveKeyV1(passphrase: string): Buffer {
  return createHash("sha256").update(passphrase).digest();
}

/**
 * Encrypts plaintext using AES-256-GCM with an HKDF-derived key.
 * Returns: `v2:` + base64(iv + authTag + ciphertext)
 */
export function encrypt(plaintext: string, key?: string): string {
  const effectiveKey = key ?? getEncryptionKey();
  const derivedKey = deriveKeyV2(effectiveKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, derivedKey, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return CIPHERTEXT_VERSION_PREFIX + Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypts a value produced by encrypt(). Transparently handles both
 * the v2 (HKDF, prefixed) and legacy v1 (SHA-256, unprefixed) formats
 * so existing credential rows keep working without a migration step.
 */
export function decrypt(ciphertext: string, key?: string): string {
  const effectiveKey = key ?? getEncryptionKey();
  const isV2 = ciphertext.startsWith(CIPHERTEXT_VERSION_PREFIX);
  const derivedKey = isV2 ? deriveKeyV2(effectiveKey) : deriveKeyV1(effectiveKey);
  const payload = isV2 ? ciphertext.slice(CIPHERTEXT_VERSION_PREFIX.length) : ciphertext;
  const data = Buffer.from(payload, "base64");

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, derivedKey, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  return decipher.update(encrypted) + decipher.final("utf8");
}

/**
 * Encrypts credentials using the centralized key.
 * Convenience wrapper for the common JSON-serialize-then-encrypt pattern.
 */
export function encryptCredentials(credentials: Record<string, string>): string {
  return encrypt(JSON.stringify(credentials));
}

/**
 * Decrypts credentials encrypted by encryptCredentials().
 */
export function decryptCredentials(ciphertext: string): Record<string, string> {
  return JSON.parse(decrypt(ciphertext));
}
