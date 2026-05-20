// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0
//
// /api/v1/billing — Enterprise (EE) billing surface for the
// LiteLLM-managed AI routing flow.
//
// Endpoints (all require an authenticated user with `settings:*`
// permissions and a license that includes both `ai` and `ai-metered`):
//
//   GET    /me                 - current tenant's billing config + wallet
//   GET    /usage?from&to      - aggregated spend per feature/model
//   GET    /transactions       - paginated credit ledger
//   POST   /mode               - switch managed ↔ byok_passthrough
//   POST   /credits/grant      - operator-only: gift credits (no Stripe)
//
// Stripe-backed purchase flow lives on the sibling `stripe-billing`
// worktree; once merged, `POST /credits/purchase` and the
// `payment_intent.succeeded` webhook will land here too.

import { Router } from "express";
import { z } from "zod";
import { assertEnterpriseLicense } from "@trustalo/license";
import { microcentsToDollars } from "@trustalo/billing.ee";
import { prisma } from "../../db/prisma.js";
import { authorizeResource } from "../../middleware/authorize.js";
import { getLiteLLMConfig } from "../../config/litellm.js";

export const billingRouter: Router = Router();

// Mount-time license gate: every route under /api/v1/billing requires
// the `ai-metered` entitlement. The umbrella `ai` check is implied —
// the routing resolver enforces it independently on each LLM call, and
// the EnterpriseLicense issuer enforces the parent relationship.
billingRouter.use((_req, _res, next) => {
  try {
    assertEnterpriseLicense("ai-metered");
    next();
  } catch (err) {
    next(err);
  }
});

billingRouter.use(authorizeResource("settings:read", "settings:write"));

// ── GET /me ──────────────────────────────────────────────────────

billingRouter.get("/me", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;

    const [billingConfig, wallet, litellmKey] = await Promise.all([
      prisma.tenantBillingConfig.findUnique({ where: { tenantId } }),
      prisma.creditWallet.findUnique({ where: { tenantId } }),
      prisma.tenantLiteLLMKey.findUnique({
        where: { tenantId },
        select: { status: true, modelAllowlist: true, lastSyncedAt: true },
      }),
    ]);

    const cfg = getLiteLLMConfig();

    res.json({
      success: true,
      data: {
        managedProxyEnabled: cfg.managedProxyEnabled,
        mode: billingConfig?.mode ?? "managed",
        modelTierOverride: billingConfig?.modelTierOverride ?? null,
        monthlySpendCapMicrocents: billingConfig?.monthlySpendCapMicrocents?.toString() ?? null,
        wallet: wallet
          ? {
              balanceMicrocents: wallet.balanceMicrocents.toString(),
              balanceUsd: microcentsToDollars(wallet.balanceMicrocents),
              lifetimeCreditedMicrocents: wallet.lifetimeCreditedMicrocents.toString(),
              lifetimeDebitedMicrocents: wallet.lifetimeDebitedMicrocents.toString(),
              lowBalanceThresholdMicrocents:
                wallet.lowBalanceThresholdMicrocents?.toString() ?? null,
            }
          : null,
        litellmKey,
        markupBps: cfg.markupBps,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /usage?from&to ──────────────────────────────────────────

billingRouter.get("/usage", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { from, to } = z
      .object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
      })
      .parse(req.query);

    // Default window: last 30 days.
    const now = new Date();
    const fromDate = from ?? new Date(now.getTime() - 30 * 24 * 3_600_000);
    const toDate = to ?? now;

    const events = await prisma.liteLLMSpendEvent.groupBy({
      by: ["feature", "model"],
      where: { tenantId, occurredAt: { gte: fromDate, lte: toDate } },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        rawCostMicrocents: true,
        markedUpMicrocents: true,
      },
      _count: { _all: true },
    });

    res.json({
      success: true,
      data: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        rows: events.map((e) => ({
          feature: e.feature,
          model: e.model,
          callCount: e._count._all,
          promptTokens: e._sum.promptTokens ?? 0,
          completionTokens: e._sum.completionTokens ?? 0,
          rawCostMicrocents: (e._sum.rawCostMicrocents ?? 0n).toString(),
          billedMicrocents: (e._sum.markedUpMicrocents ?? 0n).toString(),
          billedUsd: microcentsToDollars(e._sum.markedUpMicrocents ?? 0n),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /transactions ──────────────────────────────────────────

billingRouter.get("/transactions", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { limit, cursor } = z
      .object({
        limit: z.coerce.number().int().min(1).max(200).default(50),
        cursor: z.string().optional(),
      })
      .parse(req.query);

    const txs = await prisma.creditTransaction.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = txs.length > limit;
    const page = hasMore ? txs.slice(0, limit) : txs;

    res.json({
      success: true,
      data: page.map((t) => ({
        id: t.id,
        amountMicrocents: t.amountMicrocents.toString(),
        amountUsd: microcentsToDollars(t.amountMicrocents),
        kind: t.kind,
        reason: t.reason,
        externalRef: t.externalRef,
        balanceAfterMicrocents: t.balanceAfterMicrocents.toString(),
        createdAt: t.createdAt.toISOString(),
      })),
      pagination: { hasMore, nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /mode ──────────────────────────────────────────────────

billingRouter.post("/mode", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { mode } = z
      .object({
        mode: z.enum(["managed", "byok_passthrough"]),
      })
      .parse(req.body);

    await prisma.tenantBillingConfig.upsert({
      where: { tenantId },
      create: { tenantId, mode },
      update: { mode },
    });

    res.json({ success: true, data: { mode } });
  } catch (err) {
    next(err);
  }
});

// ── POST /credits/grant (operator-only) ────────────────────────
//
// Out-of-band credit grant. Useful for trial / support / partner
// accounts. Stripe-backed purchases land here too (after the sibling
// stripe-billing worktree merges) — they just specify `kind: "purchase"`
// and the Stripe checkout session id in `externalRef`.

billingRouter.post("/credits/grant", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { dollars, reason, externalRef } = z
      .object({
        dollars: z.number().positive().max(100_000),
        reason: z.string().min(1).max(280),
        externalRef: z.string().optional(),
      })
      .parse(req.body);

    // Convert at function-of-record precision.
    const amountMicrocents = BigInt(Math.round(dollars * 1_000_000));

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.creditWallet.upsert({
        where: { tenantId },
        create: { tenantId, balanceMicrocents: 0n, lifetimeCreditedMicrocents: 0n },
        update: {},
      });
      const newBalance = wallet.balanceMicrocents + amountMicrocents;
      const newLifetime = wallet.lifetimeCreditedMicrocents + amountMicrocents;
      const updated = await tx.creditWallet.update({
        where: { tenantId },
        data: {
          balanceMicrocents: newBalance,
          lifetimeCreditedMicrocents: newLifetime,
        },
      });
      await tx.creditTransaction.create({
        data: {
          walletId: wallet.id,
          tenantId,
          amountMicrocents,
          kind: "grant",
          reason,
          externalRef,
          balanceAfterMicrocents: newBalance,
        },
      });
      return updated;
    });

    res.json({
      success: true,
      data: {
        balanceMicrocents: result.balanceMicrocents.toString(),
        balanceUsd: microcentsToDollars(result.balanceMicrocents),
      },
    });
  } catch (err) {
    next(err);
  }
});
