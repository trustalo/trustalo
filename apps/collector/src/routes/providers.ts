import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { providerRegistry } from "../integrations/core/registry.js";
import type { AuthenticatedRequest } from "@trustalo/auth";

// NOTE: path stays `/providers` for backwards-compatibility with the
// existing API → collector contract. Internally the catalog rows are
// `Integration` records; the legacy term "provider" is retained on the
// wire to avoid churn for HTTP clients.
export const providersRouter: Router = Router();

function selectFields() {
  return {
    id: true,
    name: true,
    description: true,
    authType: true,
    category: true,
    capabilities: true,
    configSchema: true,
  } as const;
}

providersRouter.get("/", async (_req, res, next) => {
  try {
    const integrations = await prisma.integration.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: selectFields(),
    });
    res.json({ success: true, data: integrations });
  } catch (err) {
    next(err);
  }
});

providersRouter.get("/catalog", async (_req, res, next) => {
  try {
    const integrations = await prisma.integration.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: selectFields(),
    });

    const catalog: Record<string, typeof integrations> = {};
    for (const integration of integrations) {
      const cat = integration.category;
      if (!catalog[cat]) catalog[cat] = [];
      catalog[cat]!.push(integration);
    }

    const categoryLabels: Record<string, string> = Object.freeze({
      cloud: "Cloud / PaaS",
      identity: "Identity / Auth as a Service",
      code_repository: "Source Code Management",
      productivity: "Email / Productivity",
      security: "Security",
      hr: "Human Resources",
      ai: "AI Providers",
      custom: "Custom",
    });

    // Response field is named `integrations` to match the new domain term.
    // Older web builds that read `providers` continue to function via a
    // deprecated alias on the same array reference.
    const categorizedCatalog = Object.entries(catalog).map(([key, items]) => ({
      category: key,
      label: categoryLabels[key] ?? key,
      integrations: items,
      /** @deprecated use `integrations`; alias kept for one release cycle. */
      providers: items,
    }));

    res.json({ success: true, data: categorizedCatalog });
  } catch (err) {
    next(err);
  }
});

providersRouter.get("/registry", (_req, res) => {
  const catalog = providerRegistry.getCatalog();
  const data = Object.entries(catalog).map(([category, providers]) => ({
    category,
    providers: providers.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      version: p.version,
      authType: p.authType,
      capabilities: p.capabilities,
      configSchema: p.configSchema,
    })),
  }));

  res.json({ success: true, data });
});

providersRouter.get("/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;

    // `/providers/*` is mounted before the JWT `authenticate` middleware
    // so the catalog is browsable anonymously. When the caller is
    // authenticated (via the API proxy forwarding a Bearer token, for
    // example) we include their connection count for the integration;
    // otherwise we skip the per-tenant `_count` so we don't reveal
    // existence across tenants by accident.
    const auth = (req as unknown as Partial<AuthenticatedRequest>).auth;

    const integration = await prisma.integration.findUnique({
      where: { id: slug },
      include: auth?.tenantId
        ? {
            _count: {
              select: {
                connections: { where: { tenantId: auth.tenantId } },
              },
            },
          }
        : undefined,
    });

    if (!integration) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: `Integration '${slug}' not found` },
      });
      return;
    }

    const registered = providerRegistry.has(slug);

    res.json({
      success: true,
      data: {
        ...integration,
        registered,
        requiredPermissions: registered ? providerRegistry.get(slug)!.getRequiredPermissions() : [],
      },
    });
  } catch (err) {
    next(err);
  }
});
