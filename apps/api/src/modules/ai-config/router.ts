/**
 * /api/v1/ai-config — provider/feature CRUD plus the /health resolution
 * probe used by the dashboard "AI Status" tile and by ops to verify a
 * deployment's effective configuration (operator → org → feature
 * precedence, see plan constraint C2).
 */

import { Router } from "express";
import { z } from "zod";
import { assertEnterpriseLicense } from "@trustalo/license";
import { prismaWithTenant } from "../../db/prisma.js";
import { authorizeResource } from "../../middleware/authorize.js";
import {
  createAIProvider,
  generateQuizQuestions,
  FEATURE_LABELS,
  type AIFeatureType,
  type AIProviderCredentials,
} from "@trustalo/ai";
import {
  resolveOrgAI,
  invalidateAIConfigCache,
  getOperatorAIDefaults,
  AINotConfiguredError,
} from "../../config/ai.js";
import { decryptStringMaybe, encryptStringMaybe } from "../../lib/crypto-envelope.js";

export const aiConfigRouter: Router = Router();
aiConfigRouter.use(authorizeResource("settings:read", "settings:write"));

const providerEnum = z.enum(["openai", "anthropic", "bedrock", "openrouter"]);
const featureEnum = z.enum([
  "quiz_generation",
  "risk_analysis",
  "policy_drafting",
  "policy_generation",
  "vendor_assessment",
  "incident_summary",
  "control_suggestion",
  "automated_check_generation",
  "risk_scoring",
  "vendor_scoring",
  "questionnaire_answering",
  "trust_center_summary",
]);

// =====================================================================
// Provider configs — CRUD
// =====================================================================

aiConfigRouter.get("/providers", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const configs = await db.aIProviderConfig.findMany({
      orderBy: { createdAt: "asc" },
    });

    // Decrypt for masking only — the masked preview is what the UI shows;
    // ciphertext never leaves the API process.
    const masked = configs.map((c: any) => {
      const apiKeyPlain = decryptStringMaybe(c.apiKey);
      const sakPlain = decryptStringMaybe(c.secretAccessKey);
      return {
        ...c,
        apiKey: apiKeyPlain ? maskSecret(apiKeyPlain) : null,
        secretAccessKey: sakPlain ? maskSecret(sakPlain) : null,
      };
    });

    res.json({ success: true, data: masked });
  } catch (err) {
    next(err);
  }
});

aiConfigRouter.put("/providers/:provider", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const provider = providerEnum.parse(req.params.provider);

    const body = z
      .object({
        apiKey: z.string().optional().nullable(),
        region: z.string().optional().nullable(),
        accessKeyId: z.string().optional().nullable(),
        secretAccessKey: z.string().optional().nullable(),
        baseUrl: z.string().optional().nullable(),
        isEnabled: z.boolean().optional(),
      })
      .parse(req.body);

    const db = prismaWithTenant(tenantId);

    // Encrypt secret fields before persistence. `null` (key cleared) and
    // `undefined` (field omitted) are preserved so partial updates don't
    // accidentally wipe a stored key.
    const encryptedPayload = {
      ...body,
      ...(body.apiKey !== undefined ? { apiKey: encryptStringMaybe(body.apiKey) } : {}),
      ...(body.secretAccessKey !== undefined
        ? { secretAccessKey: encryptStringMaybe(body.secretAccessKey) }
        : {}),
    };

    const config = await db.aIProviderConfig.upsert({
      where: { tenantId_provider: { tenantId, provider } },
      create: {
        tenantId,
        provider,
        ...encryptedPayload,
      },
      update: encryptedPayload,
    });

    invalidateAIConfigCache(tenantId);

    const apiKeyPlain = decryptStringMaybe(config.apiKey);
    const sakPlain = decryptStringMaybe(config.secretAccessKey);

    res.json({
      success: true,
      data: {
        ...config,
        apiKey: apiKeyPlain ? maskSecret(apiKeyPlain) : null,
        secretAccessKey: sakPlain ? maskSecret(sakPlain) : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

aiConfigRouter.delete("/providers/:provider", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const provider = providerEnum.parse(req.params.provider);
    const db = prismaWithTenant(tenantId);

    await db.aIProviderConfig.deleteMany({
      where: { tenantId, provider },
    });

    invalidateAIConfigCache(tenantId);

    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

aiConfigRouter.post("/providers/:provider/test", async (req, res, _next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const provider = providerEnum.parse(req.params.provider);
    const db = prismaWithTenant(tenantId);

    const config = await db.aIProviderConfig.findUnique({
      where: { tenantId_provider: { tenantId, provider } },
    });

    if (!config) {
      res.status(404).json({ success: false, error: "Provider not configured" });
      return;
    }

    const credentials = buildCredentials(config);
    const testModel = getDefaultTestModel(provider);
    const aiProvider = createAIProvider(credentials, testModel);

    const result = await aiProvider.chat({
      messages: [{ role: "user", content: "Say 'connected' in one word." }],
      maxTokens: 10,
      temperature: 0,
    });

    res.json({
      success: true,
      data: {
        status: "connected",
        model: result.model,
        response: result.content,
      },
    });
  } catch (err: any) {
    res.json({
      success: false,
      error: err.message || "Connection test failed",
    });
  }
});

// =====================================================================
// Feature configs — CRUD
// =====================================================================

aiConfigRouter.get("/features", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    const configs = await db.aIFeatureConfig.findMany({
      orderBy: { feature: "asc" },
    });
    res.json({ success: true, data: configs });
  } catch (err) {
    next(err);
  }
});

aiConfigRouter.put("/features/:feature", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const feature = featureEnum.parse(req.params.feature);

    const body = z
      .object({
        provider: providerEnum,
        model: z.string().min(1),
        isEnabled: z.boolean().optional(),
      })
      .parse(req.body);

    const db = prismaWithTenant(tenantId);

    const config = await db.aIFeatureConfig.upsert({
      where: { tenantId_feature: { tenantId, feature } },
      create: { tenantId, feature, ...body },
      update: body,
    });

    invalidateAIConfigCache(tenantId);

    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
});

aiConfigRouter.delete("/features/:feature", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const feature = featureEnum.parse(req.params.feature);
    const db = prismaWithTenant(tenantId);
    await db.aIFeatureConfig.deleteMany({
      where: { tenantId, feature },
    });
    invalidateAIConfigCache(tenantId);
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
});

// =====================================================================
// /health — operator → org → feature resolution probe
//
// Returns one row per feature with the resolved provider/model/source
// plus an optional `ping` block for the operator default. The dashboard
// "AI Status" tile and ops dashboards consume this.
// =====================================================================

aiConfigRouter.get("/health", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const features = Object.keys(FEATURE_LABELS) as AIFeatureType[];

    const resolved: Record<
      string,
      { ok: true; provider: string; model: string; source: string } | { ok: false; error: string }
    > = {};
    for (const feature of features) {
      try {
        const r = await resolveOrgAI(tenantId, feature);
        resolved[feature] = { ok: true, provider: r.provider, model: r.model, source: r.source };
      } catch (err) {
        resolved[feature] = {
          ok: false,
          error: err instanceof AINotConfiguredError ? err.message : String(err),
        };
      }
    }

    // Probe the operator/default provider with a 1-token ping if any
    // feature resolved. Limited to the cheapest feature to avoid burning
    // tokens on every dashboard load.
    let ping: { ok: boolean; latencyMs?: number; error?: string } | null = null;
    const probeFeature: AIFeatureType = "quiz_generation";
    const probe = resolved[probeFeature];
    if (probe?.ok) {
      const t0 = Date.now();
      try {
        const r = await resolveOrgAI(tenantId, probeFeature);
        await r.client.chat({
          messages: [{ role: "user", content: "ok" }],
          maxTokens: 1,
          temperature: 0,
        });
        ping = { ok: true, latencyMs: Date.now() - t0 };
      } catch (err) {
        ping = { ok: false, latencyMs: Date.now() - t0, error: String(err) };
      }
    }

    const operator = getOperatorAIDefaults();
    res.json({
      success: true,
      data: {
        operator: {
          provider: operator.provider,
          model: operator.model,
          enabled: operator.enabled,
          disabledReason: operator.disabledReason,
        },
        resolved,
        ping,
      },
    });
  } catch (err) {
    next(err);
  }
});

// =====================================================================
// AI actions — generate quiz, etc.
// =====================================================================

aiConfigRouter.post("/generate-quiz", async (req, res, next) => {
  try {
    await assertEnterpriseLicense("ai");
    const tenantId = (req as any).auth.tenantId as string;

    const body = z
      .object({
        topic: z.string().min(1),
        numberOfQuestions: z.number().int().min(1).max(50).default(10),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        additionalContext: z.string().optional(),
      })
      .parse(req.body);

    // C2: route through the resolution layer rather than reading the
    // org-level AIFeatureConfig + AIProviderConfig directly. The
    // resolver also covers the operator-default and per-feature override
    // cases the old hand-rolled lookup missed.
    const ai = await resolveOrgAI(tenantId, "quiz_generation");
    const quiz = await generateQuizQuestions(ai.client, body);

    res.json({ success: true, data: quiz });
  } catch (err) {
    next(err);
  }
});

// =====================================================================
// Helpers
// =====================================================================

function maskSecret(secret: string): string {
  if (secret.length <= 8) return "••••••••";
  return secret.slice(0, 4) + "••••" + secret.slice(-4);
}

function buildCredentials(config: any): AIProviderCredentials {
  const apiKey = decryptStringMaybe(config.apiKey) ?? undefined;
  const secretAccessKey = decryptStringMaybe(config.secretAccessKey) ?? undefined;
  return {
    provider: config.provider,
    apiKey,
    region: config.region ?? undefined,
    accessKeyId: config.accessKeyId ?? undefined,
    secretAccessKey,
    baseUrl: config.baseUrl ?? undefined,
    useDefaultChain: config.provider === "bedrock" && !(config.accessKeyId && secretAccessKey),
  };
}

function getDefaultTestModel(provider: string): string {
  switch (provider) {
    case "openai":
      return "gpt-4o-mini";
    case "anthropic":
      return "claude-3-5-haiku-20241022";
    case "bedrock":
      return "amazon.nova-lite-v1:0";
    case "openrouter":
      return "openai/gpt-4o-mini";
    default:
      return "gpt-4o-mini";
  }
}
