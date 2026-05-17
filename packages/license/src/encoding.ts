// Compact license-token format:
//   trl_<base64url(payload)>.<base64url(signature)>
//
// The custom `trl_` prefix is deliberately not JWT — it discourages
// accidental use of off-the-shelf JWT libraries (which historically have
// algorithm-confusion footguns).

const TOKEN_PREFIX = "trl_";

export interface ParsedToken {
  payload: Uint8Array<ArrayBuffer>;
  payloadJson: unknown;
  signature: Uint8Array<ArrayBuffer>;
}

// Both functions delegate to Node/Bun's native `"base64url"` encoding
// rather than building base64url out of regex `.replace()` chains.
// CodeQL's "polynomial regular expression" check (`js/polynomial-redos`)
// flags patterns like `=+$` for ReDoS even when the input is bounded,
// and the native path is faster, smaller, and impossible to misuse.
export function base64UrlEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

export function base64UrlDecode(s: string): Uint8Array<ArrayBuffer> {
  const buf = Buffer.from(s, "base64url");
  // Copy into a fresh ArrayBuffer-backed Uint8Array. `Buffer` is typed as
  // `Uint8Array<ArrayBufferLike>`, which the WebCrypto API surface
  // (which requires `BufferSource` over `ArrayBuffer`) refuses to accept.
  const out = new Uint8Array(buf.byteLength);
  out.set(buf);
  return out as Uint8Array<ArrayBuffer>;
}

export function buildToken(payload: Uint8Array, signature: Uint8Array): string {
  return `${TOKEN_PREFIX}${base64UrlEncode(payload)}.${base64UrlEncode(signature)}`;
}

export function parseToken(token: string): ParsedToken {
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Token is empty");
  }
  if (!token.startsWith(TOKEN_PREFIX)) {
    throw new Error(`Token must start with "${TOKEN_PREFIX}"`);
  }
  const body = token.slice(TOKEN_PREFIX.length);
  const idx = body.indexOf(".");
  if (idx === -1) {
    throw new Error("Token is missing the signature segment");
  }
  const payloadStr = body.slice(0, idx);
  const sigStr = body.slice(idx + 1);
  if (!payloadStr || !sigStr) {
    throw new Error("Token has empty payload or signature");
  }

  const payload = base64UrlDecode(payloadStr);
  const signature = base64UrlDecode(sigStr);

  if (signature.length !== 64) {
    throw new Error(
      `Signature has unexpected length ${signature.length} (expected 64 bytes for Ed25519)`,
    );
  }

  let payloadJson: unknown;
  try {
    payloadJson = JSON.parse(new TextDecoder().decode(payload));
  } catch (e) {
    throw new Error(`Token payload is not valid JSON: ${(e as Error).message}`);
  }
  return { payload, payloadJson, signature };
}
