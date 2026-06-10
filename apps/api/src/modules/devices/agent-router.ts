/**
 * Device-agent routes (no user JWT). Mounted at /api/v1/devices/agent
 * BEFORE the JWT `authenticate` middleware, and exempted from CSRF in
 * middleware/csrf.ts — the agent authenticates with an enrollment token
 * (enroll) or a per-device HMAC signature (check-in), so it has no
 * cookie/CSRF surface, exactly like the /internal service routes.
 */
import { Router, type Request } from "express";
import { z } from "zod";
import { requireDeviceAuth, type DeviceAuthedRequest } from "../../lib/device-auth.js";
import { consumeEnrollmentToken, enrollDevice, recordCheckIn } from "./service.js";

export const deviceAgentRouter: Router = Router();

const platform = z.enum(["macos", "windows", "linux"]);

const enrollBody = z.object({
  platform,
  hostname: z.string().max(255).optional(),
  hardwareId: z.string().max(255).optional(),
  osVersion: z.string().max(255).optional(),
  agentVersion: z.string().max(64).optional(),
});

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (typeof header === "string" && header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim() || null;
  }
  return null;
}

// POST /api/v1/devices/agent/enroll — non-interactive enrollment via an
// admin-minted enrollment token (MDM / mass deploy). Interactive installs
// use the user-JWT route POST /api/v1/devices/enroll instead.
deviceAgentRouter.post("/enroll", async (req, res, next) => {
  try {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: "ENROLLMENT_TOKEN_REQUIRED",
          message: "Bearer enrollment token is required",
        },
      });
      return;
    }
    const consumed = await consumeEnrollmentToken(token);
    if (!consumed) {
      res.status(401).json({
        success: false,
        error: {
          code: "ENROLLMENT_TOKEN_INVALID",
          message: "Enrollment token is invalid, expired, or exhausted",
        },
      });
      return;
    }
    const body = enrollBody.parse(req.body);
    const result = await enrollDevice({
      tenantId: consumed.tenantId,
      enrollmentTokenId: consumed.tokenId,
      platform: body.platform,
      hostname: body.hostname ?? null,
      hardwareId: body.hardwareId ?? null,
      osVersion: body.osVersion ?? null,
      agentVersion: body.agentVersion ?? null,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/devices/agent/check-in — per-device HMAC (X-Device-* headers).
const signalState = z.enum(["pass", "fail", "unknown"]);
const checkInBody = z.object({
  collectedAt: z.coerce.date(),
  osVersion: z.string().max(255).optional(),
  agentVersion: z.string().max(64).optional(),
  signals: z.object({
    diskEncryption: signalState,
    firewall: signalState,
    screenLock: signalState,
    antivirus: signalState,
    agentHealthy: z.boolean(),
  }),
  raw: z.record(z.string(), z.unknown()).nullable().optional(),
});

deviceAgentRouter.post("/check-in", requireDeviceAuth(), async (req, res, next) => {
  try {
    const device = (req as DeviceAuthedRequest).device;
    if (!device) {
      // Defensive: requireDeviceAuth guarantees this, but never trust an
      // unauthenticated request to reach the handler.
      res.status(401).json({
        success: false,
        error: { code: "DEVICE_AUTH_REQUIRED", message: "Device authentication required" },
      });
      return;
    }
    const body = checkInBody.parse(req.body);
    const result = await recordCheckIn(device.id, device.tenantId, {
      collectedAt: body.collectedAt,
      osVersion: body.osVersion ?? null,
      agentVersion: body.agentVersion ?? null,
      signals: body.signals,
      raw: body.raw ?? null,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
