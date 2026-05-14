import { randomBytes, createCipheriv, createDecipheriv, createHash } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

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

function deriveKey(passphrase: string): Buffer {
  return createHash("sha256").update(passphrase).digest();
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns: base64(iv + authTag + ciphertext)
 */
export function encrypt(plaintext: string, key?: string): string {
  const effectiveKey = key ?? getEncryptionKey();
  const derivedKey = deriveKey(effectiveKey);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, derivedKey, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypts a value produced by encrypt().
 */
export function decrypt(ciphertext: string, key?: string): string {
  const effectiveKey = key ?? getEncryptionKey();
  const derivedKey = deriveKey(effectiveKey);
  const data = Buffer.from(ciphertext, "base64");

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
