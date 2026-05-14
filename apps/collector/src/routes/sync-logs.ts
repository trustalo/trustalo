import { Router } from "express";
import type { AuthenticatedRequest } from "@trustalo/auth";
import { authorize } from "../middleware/authorize.js";
import { prisma } from "../db/prisma.js";

export const syncLogsRouter: Router = Router();

syncLogsRouter.get("/", authorize("integrations:read"), async (req, res, next) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    const { connectionId, action, status, limit, offset } = req.query;

    const take = Math.min(parseInt(limit as string, 10) || 50, 100);
    const skip = parseInt(offset as string, 10) || 0;

    const where: Record<string, unknown> = { tenantId: auth.tenantId };
    if (connectionId) where["connectionId"] = connectionId;
    if (action) where["action"] = action;
    if (status) where["status"] = status;

    const [logs, total] = await prisma.$transaction([
      prisma.syncLog.findMany({
        where,
        include: {
          connection: { select: { name: true, integration: { select: { id: true, name: true } } } },
        },
        orderBy: { startedAt: "desc" },
        take,
        skip,
      }),
      prisma.syncLog.count({ where }),
    ]);

    res.json({ success: true, data: logs, meta: { total, limit: take, offset: skip } });
  } catch (err) {
    next(err);
  }
});
