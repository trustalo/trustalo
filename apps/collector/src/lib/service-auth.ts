/**
 * Mirror of `apps/api/src/lib/service-auth.ts` for the collector.
 *
 * Keep the wire format byte-for-byte identical so traffic flows in
 * both directions:
 *   X-Service-Caller / X-Service-Timestamp / X-Service-Nonce / X-Service-Signature
 *   Canonical: `${METHOD}\n${path}\n${timestamp}\n${nonce}\n${sha256(body)}`
 *
 * Legacy `X-Internal-Key` continues to be accepted server-side until
 * every caller is upgraded.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";

const HEADER_CALLER = "x-service-caller";
const HEADER_TIMESTAMP = "x-service-timestamp";
const HEADER_NONCE = "x-service-nonce";
const HEADER_SIGNATURE = "x-service-signature";
const LEGACY_INTERNAL_HEADER = "x-internal-key";

const DEFAULT_SKEW_MS = 5 * 60 * 1000;

function getServiceSecret(): string {
  const dedicated = process.env["SERVICE_AUTH_SECRET"]?.trim();
  if (dedicated) return dedicated;
  return process.env["API_INTERNAL_KEY"]?.trim() ?? "";
}

function canonicalString(
  method: string,
  path: string,
  timestamp: string,
  nonce: string,
  bodyHash: string,
): string {
  return [method.toUpperCase(), path, timestamp, nonce, bodyHash].join("\n");
}

function hashBody(body: string | Buffer | null | undefined): string {
  const buf =
    body === null || body === undefined
      ? Buffer.alloc(0)
      : Buffer.isBuffer(body)
        ? body
        : Buffer.from(body, "utf8");
  return createHash("sha256").update(buf).digest("hex");
}

export interface ServiceSignature {
  caller: string;
  timestamp: string;
  nonce: string;
  signature: string;
}

export function signServiceRequest(opts: {
  caller: string;
  method: string;
  path: string;
  body?: string | Buffer | null;
  secret?: string;
}): ServiceSignature {
  const secret = opts.secret ?? getServiceSecret();
  if (!secret) {
    throw new Error(
      "[service-auth] SERVICE_AUTH_SECRET / API_INTERNAL_KEY is required to sign requests",
    );
  }
  const timestamp = Date.now().toString();
  const nonce = randomBytes(8).toString("hex");
  const bodyHash = hashBody(opts.body ?? null);
  const message = canonicalString(opts.method, opts.path, timestamp, nonce, bodyHash);
  const signature = createHmac("sha256", secret).update(message).digest("base64");
  return { caller: opts.caller, timestamp, nonce, signature };
}

export function toHeaderRecord(sig: ServiceSignature): Record<string, string> {
  return {
    [HEADER_CALLER]: sig.caller,
    [HEADER_TIMESTAMP]: sig.timestamp,
    [HEADER_NONCE]: sig.nonce,
    [HEADER_SIGNATURE]: sig.signature,
  };
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

interface VerifyOptions {
  allowLegacyInternalKey?: boolean;
  skewMs?: number;
}

export function requireServiceAuth(opts: VerifyOptions = {}): RequestHandler {
  const allowLegacy = opts.allowLegacyInternalKey ?? true;
  const skewMs = opts.skewMs ?? DEFAULT_SKEW_MS;

  return (req: Request, res: Response, next: NextFunction): void => {
    const secret = getServiceSecret();
    if (!secret) {
      res.status(500).json({
        success: false,
        error: {
          code: "SERVICE_AUTH_MISCONFIGURED",
          message: "Service auth secret is not configured",
        },
      });
      return;
    }

    const caller = headerString(req, HEADER_CALLER);
    const timestamp = headerString(req, HEADER_TIMESTAMP);
    const nonce = headerString(req, HEADER_NONCE);
    const signature = headerString(req, HEADER_SIGNATURE);

    if (caller && timestamp && nonce && signature) {
      const ts = Number(timestamp);
      if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > skewMs) {
        res.status(401).json({
          success: false,
          error: { code: "SERVICE_AUTH_STALE", message: "Service request timestamp out of window" },
        });
        return;
      }
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.alloc(0);
      const message = canonicalString(
        req.method,
        req.originalUrl,
        timestamp,
        nonce,
        hashBody(rawBody),
      );
      const expected = createHmac("sha256", secret).update(message).digest("base64");
      if (!safeEqual(expected, signature)) {
        res.status(401).json({
          success: false,
          error: { code: "SERVICE_AUTH_BAD_SIGNATURE", message: "Invalid service signature" },
        });
        return;
      }
      (req as Request & { service?: { caller: string } }).service = { caller };
      next();
      return;
    }

    if (allowLegacy) {
      const legacyKey = headerString(req, LEGACY_INTERNAL_HEADER);
      if (legacyKey && safeEqual(legacyKey, secret)) {
        console.warn(
          "[service-auth] accepted legacy X-Internal-Key auth; caller should migrate to HMAC signing",
          { path: req.originalUrl },
        );
        (req as Request & { service?: { caller: string } }).service = { caller: "legacy" };
        next();
        return;
      }
    }

    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Service authentication required" },
    });
  };
}

function headerString(req: Request, name: string): string | null {
  const raw = req.headers[name];
  if (Array.isArray(raw)) return raw[0] ?? null;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}
