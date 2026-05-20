// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0
//
// POST /api/v1/billing/webhooks/litellm-spend
//
// LiteLLM pushes a JSON payload here whenever a tracked request
// completes. The payload contains per-request cost, token counts, and
// the virtual key/user metadata we attached in the LiteLLM provider's
// `metadata` field. We:
//
//   1. Verify the HMAC signature in `X-LiteLLM-Signature` against
//      `LITELLM_WEBHOOK_SECRET`. Constant-time comparison.
//   2. Cross-reference each record's virtual key → expected tenantId
//      via the TenantLiteLLMKey table. Records with a mismatch are
//      rejected (likely a misconfigured proxy or replay attack).
//   3. Hand off to `applySpendBatch` which writes the spend events,
//      debits the wallet, and is idempotent against retries.
//
// The route is mounted BEFORE the JWT `authenticate` middleware (in
// apps/api/src/index.ts) because LiteLLM doesn't speak our session
// cookie format — the HMAC signature is the only authentication.

import { Router } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { RawSpendRecord } from "@trustalo/billing.ee";
import { prisma } from "../../db/prisma.js";
import { decryptStringMaybe } from "../../lib/crypto-envelope.js";
import { getLiteLLMConfig } from "../../config/litellm.js";
import { applySpendBatch } from "./spend-sync.ee.js";
import { WebhookSignatureInvalidError } from "./errors.ee.js";

export const litellmWebhookRouter: Router = Router();

// LiteLLM's webhook payload — only the fields we depend on. Extras are
// preserved on the underlying object but not surfaced.
const payloadSchema = z.object({
  events: z.array(
    z.object({
      request_id: z.string().min(1),
      api_key: z.string().min(1),
      model: z.string().min(1),
      total_tokens: z.number().int().nonnegative().optional(),
      prompt_tokens: z.number().int().nonnegative().optional(),
      completion_tokens: z.number().int().nonnegative().optional(),
      spend: z.number().nonnegative(),
      start_time: z.string().optional(),
      end_time: z.string().optional(),
      metadata: z
        .object({
          trustalo_tenant_id: z.string().optional(),
          trustalo_feature: z.string().optional(),
        })
        .passthrough()
        .optional(),
    }),
  ),
});

litellmWebhookRouter.post("/litellm-spend", async (req, res, next) => {
  try {
    const cfg = getLiteLLMConfig();
    if (!cfg.webhookSecret) {
      // Webhook is hard-disabled when the secret isn't configured.
      // Better than silently accepting unauthenticated traffic.
      res.status(503).json({
        success: false,
        error: { code: "WEBHOOK_DISABLED", message: "LITELLM_WEBHOOK_SECRET is not configured" },
      });
      return;
    }

    const signature = req.header("X-LiteLLM-Signature") ?? "";
    const raw = (req as any).rawBody as Buffer | undefined;
    if (!raw) {
      throw new WebhookSignatureInvalidError("raw body not captured");
    }

    const expected = createHmac("sha256", cfg.webhookSecret).update(raw).digest("hex");
    const provided = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (provided.length !== expectedBuf.length || !timingSafeEqual(provided, expectedBuf)) {
      throw new WebhookSignatureInvalidError("HMAC mismatch");
    }

    const parsed = payloadSchema.parse(req.body);

    // Bulk-resolve api_key → tenantId. Done in a single query so 100s
    // of events from a busy proxy don't fan out into 100s of SELECTs.
    const allKeys = await prisma.tenantLiteLLMKey.findMany({
      where: { status: "active" },
      select: { tenantId: true, virtualKeyCipher: true, litellmKeyId: true },
    });
    const apiKeyToTenant = new Map<string, string>();
    for (const row of allKeys) {
      const decrypted = decryptStringMaybe(row.virtualKeyCipher);
      if (decrypted) apiKeyToTenant.set(decrypted, row.tenantId);
      // LiteLLM also identifies keys by their hashed `token`. Accept both
      // forms so we work against the obscured key form LiteLLM sometimes
      // returns in webhook payloads.
      if (row.litellmKeyId) apiKeyToTenant.set(row.litellmKeyId, row.tenantId);
    }

    const records: RawSpendRecord[] = [];
    const skipped: Array<{ request_id: string; reason: string }> = [];
    for (const ev of parsed.events) {
      const tenantFromKey = apiKeyToTenant.get(ev.api_key);
      const tenantFromMetadata = ev.metadata?.trustalo_tenant_id;
      const tenantId = tenantFromMetadata ?? tenantFromKey;
      if (!tenantId) {
        skipped.push({ request_id: ev.request_id, reason: "unknown_tenant" });
        continue;
      }
      if (tenantFromKey && tenantFromMetadata && tenantFromKey !== tenantFromMetadata) {
        // Defence-in-depth: metadata claims one tenant but the key
        // belongs to another. Reject loudly — this is either a bug or
        // an attack. Apologies will not appear on the dashboard.
        skipped.push({
          request_id: ev.request_id,
          reason: "tenant_mismatch_key_vs_metadata",
        });
        continue;
      }
      records.push({
        requestId: ev.request_id,
        tenantId,
        feature: ev.metadata?.trustalo_feature ?? "unknown",
        model: ev.model,
        promptTokens: ev.prompt_tokens ?? 0,
        completionTokens: ev.completion_tokens ?? 0,
        spendUsd: ev.spend,
        occurredAt: ev.end_time ? new Date(ev.end_time) : new Date(),
      });
    }

    const summary = await applySpendBatch(records);
    res.json({
      success: true,
      data: {
        accepted: records.length,
        skipped,
        inserted: summary.inserted,
        debitedMicrocents: summary.debitedMicrocents.toString(),
      },
    });
  } catch (err) {
    next(err);
  }
});
