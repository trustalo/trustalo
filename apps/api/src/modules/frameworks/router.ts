import { Router } from "express";
import { frameworkService } from "./service.js";
import {
  listFrameworksQuery,
  adoptFrameworkBody,
  frameworkInstanceParams,
  toggleInstanceBody,
  updateInstanceBody,
  requirementMappingsQuery,
} from "./validation.js";
import { authorizeResource, authorize } from "../../middleware/authorize.js";
import { reconcileConnectionBindings } from "../../lib/collector-client.js";
import { prisma, prismaWithTenant } from "../../db/prisma.js";
import { audit } from "../../lib/audit.js";
import { createStorageProvider } from "@trustalo/storage";
import { assembleAuditPackage } from "./audit-package.js";

const storage = createStorageProvider({
  provider: (process.env.STORAGE_PROVIDER as "s3") || "s3",
  region: process.env.AWS_REGION || "us-east-1",
  bucket: process.env.S3_BUCKET || "trustalo-files",
  endpoint: process.env.S3_ENDPOINT || undefined,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || undefined,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || undefined,
});

async function dispatchReconcile(
  tenantId: string,
  triggerReason: "framework_disabled" | "ref_unmapped",
  trigger: string,
): Promise<void> {
  try {
    await reconcileConnectionBindings(tenantId, { triggerReason });
  } catch (err) {
    console.warn(
      `[frameworks.reconcile] trigger=${trigger} tenant=${tenantId} failed:`,
      err instanceof Error ? err.message : err,
    );
  }
}

export const frameworksRouter: Router = Router();
frameworksRouter.use(authorizeResource("frameworks:read", "frameworks:write"));

frameworksRouter.get("/", async (req, res, next) => {
  try {
    const query = listFrameworksQuery.parse(req.query);
    const result = await frameworkService.listFrameworks(query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

frameworksRouter.get("/catalog", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const catalog = await frameworkService.getCatalogWithAdoptionStatus(tenantId);
    res.json({ success: true, data: catalog });
  } catch (err) {
    next(err);
  }
});

// ─── Cross-framework mappings ─────────────────────────────────
// Declared BEFORE the `/:id` framework-detail route so Express does not
// shadow the literal path with a parameterised match (same trap as the
// AI Governance router).

frameworksRouter.get("/mappings", async (req, res, next) => {
  try {
    const query = requirementMappingsQuery.parse(req.query);
    const mappings = await frameworkService.listMappings(query);
    res.json({ success: true, data: mappings });
  } catch (err) {
    next(err);
  }
});

frameworksRouter.get("/requirements/:id/mappings", async (req, res, next) => {
  try {
    const { id } = frameworkInstanceParams.parse(req.params);
    const mappings = await frameworkService.getRequirementMappings(id);
    res.json({ success: true, data: mappings });
  } catch (err) {
    next(err);
  }
});

frameworksRouter.get("/:id", async (req, res, next) => {
  try {
    const framework = await frameworkService.getFrameworkById(req.params.id);
    res.json({ success: true, data: framework });
  } catch (err) {
    next(err);
  }
});

frameworksRouter.get("/:id/requirements", async (req, res, next) => {
  try {
    const requirements = await frameworkService.getRequirements(req.params.id);
    res.json({ success: true, data: requirements });
  } catch (err) {
    next(err);
  }
});

frameworksRouter.post("/instances", async (req, res, next) => {
  try {
    const body = adoptFrameworkBody.parse(req.body);
    const tenantId = (req as any).auth.tenantId as string;
    const instance = await frameworkService.adoptFramework(tenantId, body);
    // Adopting a framework expands the resolver's universe — refs that
    // previously came back `framework_not_seeded` may now bind. Re-
    // reconcile so the user sees new bindings without waiting for the
    // nightly cron.
    void dispatchReconcile(tenantId, "ref_unmapped", `framework.adopt.${instance.id}`);
    res.status(201).json({ success: true, data: instance });
  } catch (err) {
    next(err);
  }
});

frameworksRouter.get("/instances/list", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const instances = await frameworkService.listInstances(tenantId);
    res.json({ success: true, data: instances });
  } catch (err) {
    next(err);
  }
});

frameworksRouter.get("/instances/stats", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const instances = await frameworkService.listInstancesWithStats(tenantId);
    res.json({ success: true, data: instances });
  } catch (err) {
    next(err);
  }
});

frameworksRouter.get("/instances/:id", async (req, res, next) => {
  try {
    const { id } = frameworkInstanceParams.parse(req.params);
    const tenantId = (req as any).auth.tenantId as string;
    const instance = await frameworkService.getInstanceDetail(tenantId, id);
    res.json({ success: true, data: instance });
  } catch (err) {
    next(err);
  }
});

// ─── Auditor handoff package ─────────────────────────────────
// Streams a ZIP with manifest.json, controls.csv, soa.csv,
// evidence/index.csv and the stored files for approved evidence.
// The router-level guard already requires `frameworks:read` for GET;
// the extra `authorize` mirrors the evidence + audits read guards so
// only roles that may see evidence and audits (owner, admin,
// compliance_manager, auditor, viewer, dpo) can export.
frameworksRouter.get(
  "/instances/:id/audit-package",
  authorize("evidence:read", "audits:read"),
  async (req, res, next) => {
    try {
      const { id } = frameworkInstanceParams.parse(req.params);
      const tenantId = (req as any).auth.tenantId as string;
      const userId = (req as any).auth.userId as string;
      const db = prismaWithTenant(tenantId);

      const instance = await db.frameworkInstance.findUnique({
        where: { id },
        include: {
          framework: { include: { _count: { select: { requirements: true } } } },
          controlRequirementAssignments: {
            include: {
              requirement: {
                select: {
                  id: true,
                  identifier: true,
                  title: true,
                  category: true,
                  sortOrder: true,
                },
              },
              control: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  category: true,
                  implementationDetails: true,
                  owner: { select: { name: true, email: true } },
                },
              },
            },
          },
        },
      });
      if (!instance) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Framework instance not found" },
        });
        return;
      }

      const [tenant, exportedBy] = await Promise.all([
        prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true } }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true },
        }),
      ]);

      const controlIds = [
        ...new Set(instance.controlRequirementAssignments.map((a) => a.controlId)),
      ];
      const evidence =
        controlIds.length > 0
          ? await db.evidence.findMany({
              where: { controlId: { in: controlIds } },
              select: {
                id: true,
                title: true,
                type: true,
                status: true,
                sourceType: true,
                createdAt: true,
                controlId: true,
                fileKey: true,
                fileName: true,
                fileSize: true,
              },
              orderBy: { createdAt: "asc" },
            })
          : [];

      const { zip, manifest } = await assembleAuditPackage({
        meta: {
          tenantName: tenant?.name ?? "",
          framework: {
            name: instance.framework.name,
            version: instance.framework.version,
            frameworkType: instance.framework.frameworkType,
          },
          instance: {
            id: instance.id,
            status: instance.status,
            isEnabled: instance.isEnabled,
            targetDate: instance.targetDate,
            certifiedAt: instance.certifiedAt,
            targetMaturityLevel: instance.targetMaturityLevel,
          },
          totalRequirements: instance.framework._count.requirements,
          exportedBy,
        },
        assignments: instance.controlRequirementAssignments.map((a) => ({
          requirement: a.requirement,
          control: a.control,
        })),
        evidence,
        storage,
      });

      await audit(req, "export", "FrameworkInstance", id, {
        event: "AuditPackageExported",
        framework: instance.framework.name,
        frameworkVersion: instance.framework.version,
        controls: manifest.controls.total,
        evidence: manifest.evidence.total,
        filesIncluded: manifest.evidence.filesIncluded,
        filesSkipped: manifest.evidence.filesSkipped,
      });

      const date = manifest.generatedAt.slice(0, 10);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit-package-${instance.framework.frameworkType}-${date}.zip"`,
      );

      const stream = zip.generateNodeStream({
        type: "nodebuffer",
        streamFiles: true,
        compression: "DEFLATE",
      });
      stream.on("error", (err: unknown) => {
        // Headers are already sent — the only honest option is to abort
        // the response so the client sees a failed (not truncated-but-
        // "successful") download.
        console.error(
          `[frameworks.audit-package] stream failed instance=${id}:`,
          err instanceof Error ? err.message : err,
        );
        res.destroy(err instanceof Error ? err : new Error(String(err)));
      });
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  },
);

frameworksRouter.patch("/instances/:id", async (req, res, next) => {
  try {
    const { id } = frameworkInstanceParams.parse(req.params);
    const body = updateInstanceBody.parse(req.body);
    const tenantId = (req as any).auth.tenantId as string;
    const instance = await frameworkService.updateInstance(tenantId, id, body);
    res.json({ success: true, data: instance });
  } catch (err) {
    next(err);
  }
});

frameworksRouter.patch("/instances/:id/toggle", async (req, res, next) => {
  try {
    const { id } = frameworkInstanceParams.parse(req.params);
    const { isEnabled } = toggleInstanceBody.parse(req.body);
    const tenantId = (req as any).auth.tenantId as string;
    const instance = await frameworkService.toggleInstance(tenantId, id, isEnabled);
    // Enabling expands the desired binding set (refs that previously
    // returned `framework_not_enabled` now resolve); disabling
    // collapses it. Both branches go through the same idempotent
    // reconciler.
    void dispatchReconcile(
      tenantId,
      isEnabled ? "ref_unmapped" : "framework_disabled",
      `framework.toggle.${id}.${isEnabled ? "on" : "off"}`,
    );
    res.json({ success: true, data: instance });
  } catch (err) {
    next(err);
  }
});

frameworksRouter.delete("/instances/:id", async (req, res, next) => {
  try {
    const { id } = frameworkInstanceParams.parse(req.params);
    const tenantId = (req as any).auth.tenantId as string;
    const result = await frameworkService.removeInstance(tenantId, id);
    void dispatchReconcile(tenantId, "framework_disabled", `framework.delete.${id}`);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
