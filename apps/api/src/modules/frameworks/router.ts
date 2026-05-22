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
import { authorizeResource } from "../../middleware/authorize.js";
import { reconcileConnectionBindings } from "../../lib/collector-client.js";

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
