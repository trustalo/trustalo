/**
 * Device management routes for the dashboard. Mounted at /api/v1/devices
 * AFTER the JWT `authenticate` middleware.
 *
 * POST /enroll is open to ANY authenticated user (a person may enroll their
 * own laptop), so it is registered BEFORE the `authorizeResource` guard.
 * Everything else is asset management and requires the `assets` permission
 * family — a managed device is just a Computer-category Asset.
 */
import { Router, type Request } from "express";
import { z } from "zod";
import { prismaWithTenant } from "../../db/prisma.js";
import { Prisma } from "../../../generated/prisma/client/index.js";
import { authorizeResource } from "../../middleware/authorize.js";
import {
  enrollDevice,
  generateEnrollmentTokenRaw,
  hashEnrollmentToken,
  rotateDeviceSecret,
} from "./service.js";

export const devicesAdminRouter: Router = Router();

const platform = z.enum(["macos", "windows", "linux"]);
const idParams = z.object({ id: z.string().min(1) });

function authCtx(req: Request): { userId: string; tenantId: string } {
  return (req as Request & { auth: { userId: string; tenantId: string } }).auth;
}

const deviceSelect = {
  id: true,
  hostname: true,
  platform: true,
  osVersion: true,
  agentVersion: true,
  status: true,
  lastSeenAt: true,
  lastPostureAt: true,
  enrolledAt: true,
  diskEncryption: true,
  firewall: true,
  screenLock: true,
  antivirus: true,
  agentHealthy: true,
  assetId: true,
  asset: { select: { id: true, name: true } },
} as const;

// ── Self-enrollment (any authenticated user; no asset permission) ────
const selfEnrollBody = z.object({
  platform,
  hostname: z.string().max(255).optional(),
  hardwareId: z.string().max(255).optional(),
  osVersion: z.string().max(255).optional(),
  agentVersion: z.string().max(64).optional(),
});

devicesAdminRouter.post("/enroll", async (req, res, next) => {
  try {
    const { userId, tenantId } = authCtx(req);
    const body = selfEnrollBody.parse(req.body);
    const result = await enrollDevice({
      tenantId,
      enrolledByUserId: userId,
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

// ── Everything below requires the assets permission family ───────────
devicesAdminRouter.use(authorizeResource("assets:read", "assets:write"));

// Enrollment-token management ----------------------------------------
const createTokenBody = z.object({
  label: z.string().max(120).optional(),
  maxUses: z.coerce.number().int().min(1).max(1000).default(1),
  expiresInHours: z.coerce.number().int().min(1).max(720).default(24),
});

devicesAdminRouter.post("/enrollment-tokens", async (req, res, next) => {
  try {
    const { userId, tenantId } = authCtx(req);
    const body = createTokenBody.parse(req.body);
    const raw = generateEnrollmentTokenRaw();
    const db = prismaWithTenant(tenantId);
    const token = await db.deviceEnrollmentToken.create({
      data: {
        // prismaWithTenant injects tenantId at runtime; set it explicitly too
        // to satisfy the create input type (same value, no behavior change).
        tenantId,
        tokenHash: hashEnrollmentToken(raw),
        label: body.label ?? null,
        maxUses: body.maxUses,
        expiresAt: new Date(Date.now() + body.expiresInHours * 3600 * 1000),
        createdById: userId,
      },
      select: { id: true, label: true, maxUses: true, expiresAt: true },
    });
    // The raw token is returned exactly once and never stored or shown again.
    res.status(201).json({ success: true, data: { ...token, token: raw } });
  } catch (err) {
    next(err);
  }
});

devicesAdminRouter.get("/enrollment-tokens", async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const db = prismaWithTenant(tenantId);
    const items = await db.deviceEnrollmentToken.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        status: true,
        maxUses: true,
        useCount: true,
        expiresAt: true,
        createdAt: true,
      },
    });
    res.json({ success: true, data: { items } });
  } catch (err) {
    next(err);
  }
});

devicesAdminRouter.delete("/enrollment-tokens/:id", async (req, res, next) => {
  try {
    const { userId, tenantId } = authCtx(req);
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    const result = await db.deviceEnrollmentToken.updateMany({
      where: { id },
      data: { status: "revoked", revokedAt: new Date(), revokedById: userId },
    });
    if (result.count === 0) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Enrollment token not found" },
      });
      return;
    }
    res.json({ success: true, data: { revoked: true } });
  } catch (err) {
    next(err);
  }
});

// Device list / detail / history -------------------------------------
const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["pending", "active", "stale", "revoked", "retired"]).optional(),
  platform: platform.optional(),
  search: z.string().optional(),
});

devicesAdminRouter.get("/", async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const q = listQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);
    const where: Prisma.DeviceWhereInput = {};
    if (q.status) where.status = q.status;
    if (q.platform) where.platform = q.platform;
    if (q.search) {
      where.OR = [
        { hostname: { contains: q.search, mode: "insensitive" } },
        { osVersion: { contains: q.search, mode: "insensitive" } },
      ];
    }
    const [items, total] = await Promise.all([
      db.device.findMany({
        where,
        orderBy: [{ lastSeenAt: { sort: "desc", nulls: "last" } }],
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        select: deviceSelect,
      }),
      db.device.count({ where }),
    ]);
    res.json({ success: true, data: { items, total, page: q.page, limit: q.limit } });
  } catch (err) {
    next(err);
  }
});

devicesAdminRouter.get("/:id", async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    const device = await db.device.findFirst({
      where: { id },
      select: {
        ...deviceSelect,
        latestPosture: true,
        hardwareId: true,
        checkInIntervalSeconds: true,
      },
    });
    if (!device) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Device not found" } });
      return;
    }
    res.json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
});

const historyQuery = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) });

devicesAdminRouter.get("/:id/posture-history", async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const { id } = idParams.parse(req.params);
    const { limit } = historyQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);
    const items = await db.devicePostureSnapshot.findMany({
      where: { deviceId: id },
      orderBy: { collectedAt: "desc" },
      take: limit,
    });
    res.json({ success: true, data: { items } });
  } catch (err) {
    next(err);
  }
});

// Lifecycle ----------------------------------------------------------
devicesAdminRouter.post("/:id/revoke", async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    const result = await db.device.updateMany({ where: { id }, data: { status: "revoked" } });
    if (result.count === 0) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Device not found" } });
      return;
    }
    res.json({ success: true, data: { revoked: true } });
  } catch (err) {
    next(err);
  }
});

devicesAdminRouter.post("/:id/rotate-secret", async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const { id } = idParams.parse(req.params);
    const rotated = await rotateDeviceSecret(tenantId, id);
    if (!rotated) {
      res
        .status(404)
        .json({ success: false, error: { code: "NOT_FOUND", message: "Device not found" } });
      return;
    }
    // New raw secret returned exactly once.
    res.status(201).json({ success: true, data: rotated });
  } catch (err) {
    next(err);
  }
});
