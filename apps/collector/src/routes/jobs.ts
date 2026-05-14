import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "@trustalo/auth";
import { authorize } from "../middleware/authorize.js";
import { prisma } from "../db/prisma.js";

export const jobsRouter: Router = Router();

const triggerJobSchema = z.object({
  connectionId: z.string().min(1),
  priority: z.number().int().min(0).max(10).optional(),
});

jobsRouter.post("/trigger", authorize("integrations:manage"), async (req, res, next) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    const body = triggerJobSchema.parse(req.body);

    const connection = await prisma.integrationConnection.findFirst({
      where: {
        id: body.connectionId,
        tenantId: auth.tenantId,
        isActive: true,
      },
    });

    if (!connection) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Connection not found or inactive" },
      });
      return;
    }

    const existingRunning = await prisma.collectionJob.findFirst({
      where: {
        connectionId: connection.id,
        status: { in: ["pending", "queued", "running"] },
      },
    });

    if (existingRunning) {
      res.status(409).json({
        success: false,
        error: {
          code: "JOB_ALREADY_RUNNING",
          message: "A collection job is already in progress for this connection",
          data: { jobId: existingRunning.id },
        },
      });
      return;
    }

    const job = await prisma.collectionJob.create({
      data: {
        tenantId: auth.tenantId,
        connectionId: connection.id,
        type: "manual",
        status: "pending",
        priority: body.priority ?? 0,
        scheduledAt: new Date(),
      },
      include: { connection: { select: { name: true, integrationId: true } } },
    });

    res.status(201).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
});

jobsRouter.get("/", authorize("integrations:read"), async (req, res, next) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    const { status, connectionId, limit, offset } = req.query;

    const take = Math.min(parseInt(limit as string, 10) || 50, 100);
    const skip = parseInt(offset as string, 10) || 0;

    const where: Record<string, unknown> = { tenantId: auth.tenantId };
    if (status) where["status"] = status;
    if (connectionId) where["connectionId"] = connectionId;

    const [jobs, total] = await prisma.$transaction([
      prisma.collectionJob.findMany({
        where,
        include: {
          connection: { select: { name: true, integration: { select: { id: true, name: true } } } },
          _count: { select: { runs: true } },
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.collectionJob.count({ where }),
    ]);

    res.json({ success: true, data: jobs, meta: { total, limit: take, offset: skip } });
  } catch (err) {
    next(err);
  }
});

jobsRouter.get("/:id", authorize("integrations:read"), async (req, res, next) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;

    const job = await prisma.collectionJob.findFirst({
      where: { id: String(req.params["id"]), tenantId: auth.tenantId },
      include: {
        connection: { include: { integration: { select: { id: true, name: true } } } },
        runs: { orderBy: { runNumber: "desc" }, take: 5 },
      },
    });

    if (!job) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Job not found" },
      });
      return;
    }

    res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
});

jobsRouter.get("/:id/runs", authorize("integrations:read"), async (req, res, next) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;

    const job = await prisma.collectionJob.findFirst({
      where: { id: String(req.params["id"]), tenantId: auth.tenantId },
      select: { id: true },
    });

    if (!job) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Job not found" },
      });
      return;
    }

    const runs = await prisma.collectionJobRun.findMany({
      where: { jobId: job.id },
      include: { retries: { orderBy: { attemptNumber: "asc" } } },
      orderBy: { runNumber: "desc" },
    });

    res.json({ success: true, data: runs });
  } catch (err) {
    next(err);
  }
});

jobsRouter.post("/:id/cancel", authorize("integrations:manage"), async (req, res, next) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;

    const job = await prisma.collectionJob.findFirst({
      where: { id: String(req.params["id"]), tenantId: auth.tenantId },
    });

    if (!job) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Job not found" },
      });
      return;
    }

    if (!["pending", "queued", "running"].includes(job.status)) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATE",
          message: `Cannot cancel a job with status '${job.status}'`,
        },
      });
      return;
    }

    const updated = await prisma.collectionJob.update({
      where: { id: job.id },
      data: { status: "cancelled", completedAt: new Date() },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
