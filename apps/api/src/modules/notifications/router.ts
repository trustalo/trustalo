/**
 * /api/v1/notifications — channels CRUD, per-channel test-send, alert-rule
 * list/update, and the recent-deliveries feed.
 *
 * Core feature (no enterprise gate). RBAC: settings:read for reads,
 * settings:write for mutations (same surface as the rest of Settings).
 *
 * Secret handling: channel config (webhook URL / recipient list) is
 * WRITE-ONLY. It is envelope-encrypted before persistence and reads return
 * only `configPreview` — the decrypted value never leaves the API process.
 * Every config mutation is audit-logged.
 */

import { Router } from "express";
import { z } from "zod";
import { prismaWithTenant } from "../../db/prisma.js";
import { authorizeResource } from "../../middleware/authorize.js";
import { audit } from "../../lib/audit.js";
import {
  channelConfigPreview,
  channelCreateSchema,
  channelPatchSchema,
  decryptChannelConfig,
  encryptChannelConfig,
  ensureAlertRules,
  parseChannelConfig,
  parseRuleConfig,
  rulePatchSchema,
  RULE_KEYS,
  RULE_LABELS,
  type ChannelType,
  type RuleKey,
} from "./service.js";
import { deliverToChannel } from "./channels/index.js";

export const notificationsRouter: Router = Router();
notificationsRouter.use(authorizeResource("settings:read", "settings:write"));

const idParams = z.object({ id: z.string().min(1) });
const ruleKeyParams = z.object({ ruleKey: z.enum(RULE_KEYS) });

interface ChannelRow {
  id: string;
  type: ChannelType;
  name: string;
  configEnc: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** API shape for a channel: config replaced by a masked preview. */
function toChannelDto(channel: ChannelRow) {
  let configPreview = "•••";
  try {
    configPreview = channelConfigPreview(channel.type, decryptChannelConfig(channel.configEnc));
  } catch {
    // Undecryptable (rotated key / tampered row) — keep the opaque preview.
  }
  return {
    id: channel.id,
    type: channel.type,
    name: channel.name,
    enabled: channel.enabled,
    configPreview,
    createdAt: channel.createdAt,
    updatedAt: channel.updatedAt,
  };
}

// ── Channels ────────────────────────────────────────────────────────

notificationsRouter.get("/channels", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    const channels = await db.notificationChannel.findMany({ orderBy: { createdAt: "asc" } });
    res.json({ success: true, data: channels.map((c) => toChannelDto(c as ChannelRow)) });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.post("/channels", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = channelCreateSchema.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const channel = await db.notificationChannel.create({
      data: {
        tenantId,
        type: body.type,
        name: body.name,
        enabled: body.enabled ?? true,
        configEnc: encryptChannelConfig(body.config),
      },
    });

    // Config VALUES are secrets — audit the shape, never the content.
    await audit(req, "create", "NotificationChannel", channel.id, {
      type: body.type,
      name: body.name,
    });
    res.status(201).json({ success: true, data: toChannelDto(channel as ChannelRow) });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.patch("/channels/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const body = channelPatchSchema.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.notificationChannel.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: "Channel not found" });
      return;
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.enabled !== undefined) data.enabled = body.enabled;
    if (body.config !== undefined) {
      // Re-validate the replacement config against the channel's own type.
      data.configEnc = encryptChannelConfig(
        parseChannelConfig(existing.type as ChannelType, body.config),
      );
    }

    const channel = await db.notificationChannel.update({ where: { id }, data });
    await audit(req, "update", "NotificationChannel", id, {
      fields: Object.keys(body),
      configReplaced: body.config !== undefined,
    });
    res.json({ success: true, data: toChannelDto(channel as ChannelRow) });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.delete("/channels/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    const deleted = await db.notificationChannel.deleteMany({ where: { id } });
    if (deleted.count === 0) {
      res.status(404).json({ success: false, error: "Channel not found" });
      return;
    }
    await audit(req, "delete", "NotificationChannel", id);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

/**
 * Fire a synthetic alert through one channel so admins can verify wiring.
 * Uses the stored (encrypted) config — never accepts a URL in the request,
 * so this endpoint cannot be used as an SSRF oracle for arbitrary targets.
 */
notificationsRouter.post("/channels/:id/test", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = idParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const channel = await db.notificationChannel.findUnique({ where: { id } });
    if (!channel) {
      res.status(404).json({ success: false, error: "Channel not found" });
      return;
    }
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    await audit(req, "update", "NotificationChannel", id, { transition: "test_send" });
    try {
      await deliverToChannel(
        {
          id: channel.id,
          type: channel.type as ChannelType,
          name: channel.name,
          configEnc: channel.configEnc,
        },
        {
          ruleKey: "test",
          ruleLabel: "Test notification",
          summary: `Test alert from Trustalo — the "${channel.name}" channel is wired up correctly.`,
          tenantName: tenant?.name ?? "Trustalo",
          linkPath: "/settings",
        },
      );
      res.json({ success: true, data: { status: "sent" } });
    } catch (err) {
      res.json({
        success: false,
        error: err instanceof Error ? err.message : "Test delivery failed",
      });
    }
  } catch (err) {
    next(err);
  }
});

// ── Alert rules ─────────────────────────────────────────────────────

notificationsRouter.get("/rules", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    const rules = await ensureAlertRules(db, tenantId);
    res.json({
      success: true,
      data: rules.map((r) => ({ ...r, label: RULE_LABELS[r.ruleKey] })),
    });
  } catch (err) {
    next(err);
  }
});

notificationsRouter.patch("/rules/:ruleKey", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { ruleKey } = ruleKeyParams.parse(req.params);
    const body = rulePatchSchema.parse(req.body);
    const db = prismaWithTenant(tenantId);

    // Lazily seed so a PATCH before the first GET still has a row to hit.
    await ensureAlertRules(db, tenantId);

    const data: Record<string, unknown> = {};
    if (body.enabled !== undefined) data.enabled = body.enabled;
    if (body.config !== undefined) data.config = parseRuleConfig(ruleKey as RuleKey, body.config);

    const rule = await db.alertRule.update({
      where: { tenantId_ruleKey: { tenantId, ruleKey } },
      data,
    });
    await audit(req, "update", "AlertRule", rule.id, { ruleKey, ...body });
    res.json({
      success: true,
      data: {
        id: rule.id,
        ruleKey,
        enabled: rule.enabled,
        config: parseRuleConfig(ruleKey as RuleKey, rule.config ?? {}),
        label: RULE_LABELS[ruleKey as RuleKey],
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Recent deliveries ───────────────────────────────────────────────

notificationsRouter.get("/deliveries", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { limit } = z
      .object({ limit: z.coerce.number().int().min(1).max(100).default(25) })
      .parse(req.query);
    const db = prismaWithTenant(tenantId);
    const deliveries = await db.notificationDelivery.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        ruleKey: true,
        status: true,
        summary: true,
        createdAt: true,
        channel: { select: { id: true, name: true, type: true } },
      },
    });
    res.json({ success: true, data: deliveries });
  } catch (err) {
    next(err);
  }
});
