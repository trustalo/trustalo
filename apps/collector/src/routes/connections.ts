import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "@trustalo/auth";
import { authorize } from "../middleware/authorize.js";
import { prisma } from "../db/prisma.js";
import { Prisma } from "../../generated/prisma/client/index.js";
import { SecretVaultService } from "../secret-vault/service.js";
import { providerRegistry } from "../integrations/core/registry.js";

// Prisma 7 narrows Json columns to `InputJsonValue`. Zod-validated request
// bodies and external runner output are typed as `Record<string, unknown>`,
// which is structurally compatible but not assignable without an explicit
// cast. Centralise the cast so callers stay readable.
function asJson(value: unknown): Prisma.InputJsonValue {
  return (value ?? {}) as Prisma.InputJsonValue;
}

export const connectionsRouter: Router = Router();

const createConnectionSchema = z.object({
  // Catalog slug, e.g. "github" / "aws". Always lower-case; doubles as
  // the `Integration` row id.
  integrationId: z.string().min(1),
  name: z.string().min(1).max(255),
  credentials: z.record(z.string(), z.string()),
  config: z.record(z.string(), z.unknown()).optional(),
  syncFrequencyMinutes: z.number().int().min(5).max(43200).optional(),
});

const updateConnectionSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  credentials: z.record(z.string(), z.string()).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  syncFrequencyMinutes: z.number().int().min(5).max(43200).optional(),
  isActive: z.boolean().optional(),
});

connectionsRouter.post("/", authorize("integrations:manage"), async (req, res, next) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    const body = createConnectionSchema.parse(req.body);

    const integration = await prisma.integration.findUnique({
      where: { id: body.integrationId },
    });

    if (!integration) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Integration '${body.integrationId}' not found in catalog`,
        },
      });
      return;
    }

    // Two-step write: connection row first (so we have its id), then a
    // SecretVault row keyed on that id, then a final update to set
    // `secretId`. Done in a transaction so a vault row never outlives a
    // missing connection.
    const result = await prisma.$transaction(async (tx) => {
      const conn = await tx.integrationConnection.create({
        data: {
          tenantId: auth.tenantId,
          integrationId: body.integrationId,
          name: body.name,
          config: asJson(body.config),
          syncFrequencyMinutes: body.syncFrequencyMinutes ?? 1440,
          status: "pending_auth",
        },
        include: { integration: { select: { id: true, name: true } } },
      });

      // SecretVaultService uses the shared prisma client so writes here
      // participate in the transaction via row-level locking only — that
      // is acceptable because SecretVault rows are addressed by their
      // own primary key and we control both insertions ourselves.
      const secretId = await SecretVaultService.create({
        tenantId: auth.tenantId,
        scope: "integration_connection",
        ownerType: "integration_connection",
        ownerId: conn.id,
        payload: body.credentials,
      });

      return tx.integrationConnection.update({
        where: { id: conn.id },
        data: { secretId },
        include: { integration: { select: { id: true, name: true } } },
      });
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

connectionsRouter.get("/", authorize("integrations:read"), async (req, res, next) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    const status = req.query["status"] as string | undefined;

    const connections = await prisma.integrationConnection.findMany({
      where: {
        tenantId: auth.tenantId,
        ...(status ? { status: status as never } : {}),
      },
      include: { integration: { select: { id: true, name: true, category: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: connections });
  } catch (err) {
    next(err);
  }
});

connectionsRouter.get("/:id", authorize("integrations:read"), async (req, res, next) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;

    const connection = await prisma.integrationConnection.findFirst({
      where: { id: String(req.params["id"]), tenantId: auth.tenantId },
      include: {
        integration: true,
        _count: { select: { jobs: true, syncLogs: true } },
      },
    });

    if (!connection) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Connection not found" },
      });
      return;
    }

    res.json({ success: true, data: connection });
  } catch (err) {
    next(err);
  }
});

connectionsRouter.put("/:id", authorize("integrations:manage"), async (req, res, next) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    const body = updateConnectionSchema.parse(req.body);

    const existing = await prisma.integrationConnection.findFirst({
      where: { id: String(req.params["id"]), tenantId: auth.tenantId },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Connection not found" },
      });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (body.name) updateData["name"] = body.name;
    if (body.config) updateData["config"] = body.config;
    if (body.syncFrequencyMinutes) updateData["syncFrequencyMinutes"] = body.syncFrequencyMinutes;
    if (body.isActive !== undefined) updateData["isActive"] = body.isActive;

    if (body.credentials) {
      // Update the existing vault row in place. Rotation policy (audit
      // history retention vs in-place overwrite) is decided per-tenant
      // at the service layer.
      if (existing.secretId) {
        await SecretVaultService.update(existing.secretId, { payload: body.credentials });
      } else {
        const secretId = await SecretVaultService.create({
          tenantId: auth.tenantId,
          scope: "integration_connection",
          ownerType: "integration_connection",
          ownerId: existing.id,
          payload: body.credentials,
        });
        updateData["secretId"] = secretId;
      }
    }

    const updated = await prisma.integrationConnection.update({
      where: { id: existing.id },
      data: updateData,
      include: { integration: { select: { id: true, name: true } } },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

connectionsRouter.delete("/:id", authorize("integrations:manage"), async (req, res, next) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;

    const connection = await prisma.integrationConnection.findFirst({
      where: { id: String(req.params["id"]), tenantId: auth.tenantId },
      include: { integration: { select: { id: true } } },
    });

    if (!connection) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Connection not found" },
      });
      return;
    }

    const connector = providerRegistry.get(connection.integration.id);
    if (connector && connection.secretId) {
      try {
        const creds = await SecretVaultService.read(connection.secretId);
        const runtime = await connector.connect(creds);
        await connector.disconnect(runtime);
      } catch {
        // Best-effort disconnect; proceed with deletion regardless.
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.integrationConnection.delete({ where: { id: connection.id } });
      if (connection.secretId) {
        await SecretVaultService.delete(connection.secretId);
      }
    });

    res.json({ success: true, data: { id: connection.id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

connectionsRouter.post("/:id/test", authorize("integrations:manage"), async (req, res, next) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;

    const connection = await prisma.integrationConnection.findFirst({
      where: { id: String(req.params["id"]), tenantId: auth.tenantId },
      include: { integration: true },
    });

    if (!connection) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Connection not found" },
      });
      return;
    }

    const connector = providerRegistry.get(connection.integration.id);
    if (!connector) {
      res.status(400).json({
        success: false,
        error: {
          code: "CONNECTOR_NOT_FOUND",
          message: `No connector registered for '${connection.integration.id}'`,
        },
      });
      return;
    }

    if (!connection.secretId) {
      res.status(400).json({
        success: false,
        error: {
          code: "NO_CREDENTIALS",
          message: "Connection has no credentials assigned",
        },
      });
      return;
    }

    const syncLog = await prisma.syncLog.create({
      data: {
        tenantId: auth.tenantId,
        connectionId: connection.id,
        integrationId: connection.integrationId,
        action: "test_connection",
        status: "started",
      },
    });

    let result: { success: boolean; message: string; details?: Record<string, unknown> };

    try {
      const credentials = await SecretVaultService.read(connection.secretId);
      const runtime = await connector.connect(credentials);
      result = await connector.testConnection(runtime);
    } catch (connectorErr) {
      result = {
        success: false,
        message: connectorErr instanceof Error ? connectorErr.message : "Connection failed",
      };
    }

    const newStatus = result.success ? "connected" : "error";

    await prisma.$transaction([
      prisma.integrationConnection.update({
        where: { id: connection.id },
        data: {
          status: newStatus,
          lastErrorMessage: result.success ? null : result.message,
        },
      }),
      prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: result.success ? "completed" : "failed",
          completedAt: new Date(),
          details: asJson(result.details),
        },
      }),
    ]);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
