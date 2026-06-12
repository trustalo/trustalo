/**
 * Per-device HMAC request authentication for the endpoint device agent.
 *
 * Mirrors `lib/service-auth.ts`, but the key is a PER-DEVICE secret rather
 * than the single shared service secret. That distinction is the whole
 * point: the shared service secret must never leave the cluster, so a fleet
 * of employee laptops cannot use it. Each device gets its own secret at
 * enrollment; a compromised laptop can therefore only forge ITS OWN
 * check-ins, never another device's or another tenant's.
 *
 * The tenant is resolved from the `Device` row server-side and attached to
 * the request — it is NEVER read from a client header (multi-tenant
 * isolation rule).
 *
 * Wire format (request headers):
 *   X-Device-Id         — Device.id
 *   X-Device-Key-Id     — Device.secretKeyId the agent signed with
 *   X-Device-Timestamp  — unix millis as a string; must be within ±5 min
 *   X-Device-Nonce      — random hex; ledgered in DeviceNonce for replay defense
 *   X-Device-Signature  — base64(HMAC-SHA256(deviceSecret, canonical_string))
 *
 * Canonical string (identical shape to service-auth so the Go agent can
 * reuse one implementation):
 *   `${method}\n${originalUrl}\n${timestamp}\n${nonce}\n${sha256(body)}`
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { prisma } from "../db/prisma.js";
import { Prisma } from "../../generated/prisma/client/index.js";
import { decryptString } from "./crypto-envelope.js";

const HEADER_ID = "x-device-id";
const HEADER_KEY_ID = "x-device-key-id";
const HEADER_TIMESTAMP = "x-device-timestamp";
const HEADER_NONCE = "x-device-nonce";
const HEADER_SIGNATURE = "x-device-signature";

const DEFAULT_SKEW_MS = 5 * 60 * 1000;

// ── Canonical-string helpers ────────────────────────────────────────
// Replicated from lib/service-auth.ts (rather than exported from there)
// so the device-auth surface stays self-contained and we don't widen the
// service-auth API. Keep the two in lockstep if the wire format changes.
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

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function headerString(req: Request, name: string): string | null {
  const raw = req.headers[name];
  if (Array.isArray(raw)) return raw[0] ?? null;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

/** A new random per-device secret (raw, returned to the agent exactly once). */
export function generateDeviceSecret(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Compute the X-Device-* headers for an outgoing check-in. Exported as the
 * canonical reference the Go agent mirrors, and used by the server test
 * suite to forge valid/invalid signatures.
 */
export function signDeviceRequest(opts: {
  deviceId: string;
  keyId: number;
  method: string;
  /** Path including query string, exactly as the server will see it. */
  path: string;
  body?: string | Buffer | null;
  secret: string;
  /** Override the timestamp (tests only). */
  timestamp?: string;
  /** Override the nonce (tests only). */
  nonce?: string;
}): Record<string, string> {
  const timestamp = opts.timestamp ?? Date.now().toString();
  const nonce = opts.nonce ?? randomBytes(8).toString("hex");
  const message = canonicalString(
    opts.method,
    opts.path,
    timestamp,
    nonce,
    hashBody(opts.body ?? null),
  );
  const signature = createHmac("sha256", opts.secret).update(message).digest("base64");
  return {
    [HEADER_ID]: opts.deviceId,
    [HEADER_KEY_ID]: String(opts.keyId),
    [HEADER_TIMESTAMP]: timestamp,
    [HEADER_NONCE]: nonce,
    [HEADER_SIGNATURE]: signature,
  };
}

/** The device identity attached to the request after successful auth. */
export interface AuthenticatedDevice {
  id: string;
  tenantId: string;
  secretKeyId: number;
  status: string;
  checkInIntervalSeconds: number;
}

export type DeviceAuthedRequest = Request & {
  device?: AuthenticatedDevice;
  tenantId?: string;
};

function fail(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({ success: false, error: { code, message } });
}

interface VerifyOptions {
  skewMs?: number;
}

/**
 * Express middleware that authenticates a request with the per-device HMAC
 * scheme. On success attaches `req.device` and `req.tenantId`. Designed for
 * the agent check-in route, which is mounted BEFORE the JWT `authenticate`
 * middleware (the agent has no user JWT).
 */
export function requireDeviceAuth(opts: VerifyOptions = {}): RequestHandler {
  const skewMs = opts.skewMs ?? DEFAULT_SKEW_MS;

  return (req: Request, res: Response, next: NextFunction): void => {
    void (async () => {
      const deviceId = headerString(req, HEADER_ID);
      const keyIdRaw = headerString(req, HEADER_KEY_ID);
      const timestamp = headerString(req, HEADER_TIMESTAMP);
      const nonce = headerString(req, HEADER_NONCE);
      const signature = headerString(req, HEADER_SIGNATURE);

      if (!deviceId || !keyIdRaw || !timestamp || !nonce || !signature) {
        fail(res, 401, "DEVICE_AUTH_REQUIRED", "Device authentication headers are required");
        return;
      }

      const ts = Number(timestamp);
      if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > skewMs) {
        fail(
          res,
          401,
          "DEVICE_AUTH_STALE",
          "Device request timestamp is outside the allowed window",
        );
        return;
      }

      const keyId = Number(keyIdRaw);
      if (!Number.isInteger(keyId)) {
        fail(res, 401, "DEVICE_AUTH_REQUIRED", "Invalid device key id");
        return;
      }

      // Unscoped lookup by id: the tenant is not known until we read it off
      // the Device row (and is then attached for downstream handlers).
      const device = await prisma.device.findUnique({
        where: { id: deviceId },
        select: {
          id: true,
          tenantId: true,
          status: true,
          secretEnc: true,
          secretKeyId: true,
          checkInIntervalSeconds: true,
        },
      });

      if (!device || device.status === "revoked" || device.status === "retired") {
        fail(res, 401, "DEVICE_REVOKED", "Device is not enrolled or has been revoked");
        return;
      }

      // Rotation guard: a stale agent signing with an old key is forced to
      // re-handshake rather than being silently accepted.
      if (device.secretKeyId !== keyId) {
        fail(res, 401, "DEVICE_KEY_MISMATCH", "Device key id does not match the current secret");
        return;
      }

      const secret = decryptString(device.secretEnc);
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
        fail(res, 401, "DEVICE_BAD_SIGNATURE", "Invalid device signature");
        return;
      }

      // Replay defense: the (deviceId, nonce) pair is unique. A repeat within
      // the skew window collides and is rejected. Older rows are pruned by
      // the stale-device sweep.
      try {
        await prisma.deviceNonce.create({ data: { deviceId: device.id, nonce } });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          fail(res, 401, "DEVICE_REPLAY", "Duplicate device request nonce");
          return;
        }
        throw err;
      }

      const authed = req as DeviceAuthedRequest;
      authed.device = {
        id: device.id,
        tenantId: device.tenantId,
        secretKeyId: device.secretKeyId,
        status: device.status,
        checkInIntervalSeconds: device.checkInIntervalSeconds,
      };
      authed.tenantId = device.tenantId;
      next();
    })().catch(next);
  };
}
