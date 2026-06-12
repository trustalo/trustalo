import { describe, expect, test } from "bun:test";
import { createHash, createHmac } from "node:crypto";
import { signDeviceRequest } from "./device-auth.js";

/**
 * These cover the pure signing surface (no DB). They double as the
 * cross-language reference vector the Go agent's signer must reproduce:
 * canonical string = `METHOD\npath\ntimestamp\nnonce\nsha256(body)`,
 * signature = base64(HMAC-SHA256(secret, canonical)).
 */
describe("signDeviceRequest", () => {
  const secret = "a".repeat(64);
  const base = {
    deviceId: "dev_123",
    keyId: 1,
    method: "POST",
    path: "/api/v1/devices/agent/check-in",
    secret,
    timestamp: "1700000000000",
    nonce: "abcdef0123456789",
  };

  function expectedSignature(
    method: string,
    path: string,
    ts: string,
    nonce: string,
    body: string,
  ) {
    const bodyHash = createHash("sha256").update(Buffer.from(body, "utf8")).digest("hex");
    const canonical = [method.toUpperCase(), path, ts, nonce, bodyHash].join("\n");
    return createHmac("sha256", secret).update(canonical).digest("base64");
  }

  test("produces the documented X-Device-* headers", () => {
    const h = signDeviceRequest({ ...base, body: '{"a":1}' });
    expect(h["x-device-id"]).toBe("dev_123");
    expect(h["x-device-key-id"]).toBe("1");
    expect(h["x-device-timestamp"]).toBe("1700000000000");
    expect(h["x-device-nonce"]).toBe("abcdef0123456789");
    expect(typeof h["x-device-signature"]).toBe("string");
  });

  test("signature matches an independent HMAC over the canonical string", () => {
    const body = '{"hello":"world"}';
    const h = signDeviceRequest({ ...base, body });
    expect(h["x-device-signature"]).toBe(
      expectedSignature("POST", base.path, base.timestamp, base.nonce, body),
    );
  });

  test("empty body hashes to sha256 of zero bytes", () => {
    const h = signDeviceRequest({ ...base, body: "" });
    expect(h["x-device-signature"]).toBe(
      expectedSignature("POST", base.path, base.timestamp, base.nonce, ""),
    );
  });

  test("is deterministic for a fixed timestamp + nonce", () => {
    const a = signDeviceRequest({ ...base, body: "" });
    const b = signDeviceRequest({ ...base, body: "" });
    expect(a["x-device-signature"]).toBe(b["x-device-signature"]);
  });

  test("different bodies produce different signatures", () => {
    const a = signDeviceRequest({ ...base, body: "x" });
    const b = signDeviceRequest({ ...base, body: "y" });
    expect(a["x-device-signature"]).not.toBe(b["x-device-signature"]);
  });

  test("a tampered method breaks the signature (method is bound)", () => {
    const post = signDeviceRequest({ ...base, method: "POST", body: "{}" });
    const get = signDeviceRequest({ ...base, method: "GET", body: "{}" });
    expect(post["x-device-signature"]).not.toBe(get["x-device-signature"]);
  });
});
