// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0

import { Router } from "express";
import { z } from "zod";
import { assertEnterpriseLicense } from "@trustalo/license";
import { authorizeResource } from "../../middleware/authorize.js";
import { audit } from "../../lib/audit.js";
import { consumeToken } from "../../lib/rate-limit.js";
import {
  deleteDirectorySyncConfig,
  directoryProviderSchema,
  enqueueDirectorySyncRun,
  listDirectorySyncConfigs,
  listDirectorySyncRuns,
  testDirectorySyncConfig,
  upsertDirectorySyncConfig,
  upsertDirectorySyncConfigSchema,
} from "./service.ee.js";

const RATE_LIMIT_MANUAL_SYNC = { capacity: 1, refillMs: 60_000 };

const runQuerySchema = z.object({
  provider: directoryProviderSchema.optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export const directorySyncRouter: Router = Router();
directorySyncRouter.use(authorizeResource("settings:read", "settings:write"));

directorySyncRouter.use(async (_req, _res, next) => {
  try {
    await assertEnterpriseLicense("sso");
    next();
  } catch (err) {
    next(err);
  }
});

directorySyncRouter.get("/configs", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const rows = await listDirectorySyncConfigs(tenantId);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

directorySyncRouter.put("/configs/:provider", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const provider = directoryProviderSchema.parse(req.params.provider);
    const body = upsertDirectorySyncConfigSchema.parse(req.body);
    const data = await upsertDirectorySyncConfig(tenantId, provider, body);
    await audit(req, "update", "DirectorySyncConfig", data.id, {
      provider: data.provider,
      isEnabled: data.isEnabled,
      syncFrequencyMinutes: data.syncFrequencyMinutes,
      defaultRole: data.defaultRole,
      defaultStatus: data.defaultStatus,
      groupRoleMappingCount: data.groupRoleMappings.length,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

directorySyncRouter.post("/configs/:provider/test", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const provider = directoryProviderSchema.parse(req.params.provider);
    const credentials = req.body?.credentials;
    const data = await testDirectorySyncConfig(tenantId, provider, credentials);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

directorySyncRouter.post("/configs/:provider/sync", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const provider = directoryProviderSchema.parse(req.params.provider);
    if (!consumeToken(tenantId, "directory_sync_manual", RATE_LIMIT_MANUAL_SYNC)) {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Manual sync is rate limited to one request per minute.",
        },
      });
      return;
    }
    const run = await enqueueDirectorySyncRun(tenantId, provider, "manual");
    if (!run) {
      res.status(202).json({
        success: true,
        data: { status: "already_running" },
      });
      return;
    }
    await audit(req, "create", "DirectorySyncRun", run.id, {
      provider,
      triggeredBy: "manual",
    });
    res.status(202).json({ success: true, data: run });
  } catch (err) {
    next(err);
  }
});

directorySyncRouter.get("/runs", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = runQuerySchema.parse(req.query);
    const runs = await listDirectorySyncRuns(tenantId, query.provider, query.limit);
    res.json({ success: true, data: runs });
  } catch (err) {
    next(err);
  }
});

directorySyncRouter.delete("/configs/:provider", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const provider = directoryProviderSchema.parse(req.params.provider);
    await deleteDirectorySyncConfig(tenantId, provider);
    await audit(req, "delete", "DirectorySyncConfig", provider, { provider });
    res.json({ success: true, data: { provider } });
  } catch (err) {
    next(err);
  }
});
