// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0
//
// Persist a batch of LiteLLM spend records into the local DB and debit
// the credit wallet accordingly. Called from two places:
//   1. The /api/v1/billing/webhooks/litellm-spend webhook handler when
//      LiteLLM proactively pushes a spend event.
//   2. An on-demand reconciler (planned cron + `/sync-spend` admin
//      endpoint) that pulls the LiteLLM /spend/logs endpoint to recover
//      from missed webhooks.
//
// The function is **idempotent by `litellmRequestId`**: re-applying the
// same batch many times is a no-op past the first call. This is the
// single most important invariant in the billing flow — webhook
// retries and reconciler overlap would otherwise double-debit.

import {
  normaliseSpendEvents,
  type RawSpendRecord,
  type TenantBillingMode,
} from "@trustalo/billing.ee";
import { prisma } from "../../db/prisma.js";
import { getLiteLLMConfig } from "../../config/litellm.js";

export interface SpendBatchResult {
  /** Number of NEW spend events written (excludes ignored idempotency hits). */
  inserted: number;
  /** Total amount debited from wallets across the batch, in microcents. */
  debitedMicrocents: bigint;
  /** Per-tenant breakdown for the response body. */
  perTenant: Array<{ tenantId: string; debitedMicrocents: bigint; eventCount: number }>;
}

/**
 * Apply a batch of LiteLLM spend records. All inputs MUST have the
 * tenantId pre-resolved from the LiteLLM `user`/`metadata` field — the
 * webhook handler is responsible for that validation step (it cross-
 * references the virtual key against `TenantLiteLLMKey`). This function
 * assumes good inputs and focuses on the DB write + wallet debit.
 */
export async function applySpendBatch(
  records: readonly RawSpendRecord[],
): Promise<SpendBatchResult> {
  if (records.length === 0) {
    return { inserted: 0, debitedMicrocents: 0n, perTenant: [] };
  }

  // Group records by tenant so we issue at most one wallet debit per
  // tenant per batch. Reduces lock contention on the wallet row.
  const cfg = getLiteLLMConfig();
  const byTenant = new Map<string, RawSpendRecord[]>();
  for (const r of records) {
    const bucket = byTenant.get(r.tenantId);
    if (bucket) bucket.push(r);
    else byTenant.set(r.tenantId, [r]);
  }

  let totalInserted = 0;
  let totalDebited = 0n;
  const perTenant: SpendBatchResult["perTenant"] = [];

  for (const [tenantId, tenantRecords] of byTenant) {
    // Look up the tenant's billing mode once per batch. Cached by
    // Prisma's query layer in practice but cheap either way.
    const billingConfig = await prisma.tenantBillingConfig.findUnique({
      where: { tenantId },
      select: { mode: true },
    });
    const mode: TenantBillingMode = (billingConfig?.mode ?? "managed") as TenantBillingMode;

    const normalised = normaliseSpendEvents(tenantRecords, {
      mode,
      markupBps: cfg.markupBps,
    });

    // Insert idempotently using `skipDuplicates: true` against the
    // unique constraint on `litellmRequestId`. Prisma reports the
    // count of rows actually written, which is exactly what we need
    // to drive the wallet debit (re-applied rows must not re-debit).
    const insertResult = await prisma.liteLLMSpendEvent.createMany({
      data: normalised.map((n) => ({
        tenantId: n.tenantId,
        feature: n.feature as any,
        model: n.model,
        promptTokens: n.promptTokens,
        completionTokens: n.completionTokens,
        rawCostMicrocents: n.rawCostMicrocents,
        markedUpMicrocents: n.markedUpMicrocents,
        litellmRequestId: n.litellmRequestId,
        occurredAt: n.occurredAt,
      })),
      skipDuplicates: true,
    });

    // For the wallet debit, we need to know WHICH events actually
    // landed (skipDuplicates returns a count, not a list). Re-query
    // by request id to find the survivors and sum their billed cost.
    let actuallyDebited = 0n;
    let actualEventCount = 0;
    if (insertResult.count > 0 && mode !== "disabled") {
      const written = await prisma.liteLLMSpendEvent.findMany({
        where: { litellmRequestId: { in: normalised.map((n) => n.litellmRequestId) } },
        select: { id: true, litellmRequestId: true, markedUpMicrocents: true },
      });
      // We only want to debit for events that were JUST inserted by
      // THIS call. The only signal we have is `createdAt` ≥ this
      // function's start time, but that's racy across instances. The
      // safer approach: only debit events that don't yet have a
      // corresponding CreditTransaction(externalRef=event.id). That
      // makes the debit step itself idempotent end-to-end.
      const eventIds = written.map((e) => e.id);
      const alreadyDebited = await prisma.creditTransaction.findMany({
        where: { externalRef: { in: eventIds }, kind: "debit" },
        select: { externalRef: true },
      });
      const debitedSet = new Set(alreadyDebited.map((d) => d.externalRef));
      const toDebit = written.filter((e) => !debitedSet.has(e.id));
      actualEventCount = toDebit.length;

      if (toDebit.length > 0 && mode === "managed") {
        await prisma.$transaction(async (tx) => {
          // Lock the wallet row for update. Prisma's preview feature
          // `transactionOptions` isn't always available; relying on
          // serializable isolation via $transaction is sufficient.
          const wallet = await tx.creditWallet.findUnique({ where: { tenantId } });
          if (!wallet) return; // unusual: managed tenant without a wallet — skip
          let running = wallet.balanceMicrocents;
          for (const ev of toDebit) {
            running -= ev.markedUpMicrocents;
            actuallyDebited += ev.markedUpMicrocents;
            await tx.creditTransaction.create({
              data: {
                walletId: wallet.id,
                tenantId,
                amountMicrocents: -ev.markedUpMicrocents,
                kind: "debit",
                externalRef: ev.id,
                balanceAfterMicrocents: running,
              },
            });
          }
          await tx.creditWallet.update({
            where: { tenantId },
            data: {
              balanceMicrocents: running,
              lifetimeDebitedMicrocents: {
                increment: actuallyDebited,
              },
            },
          });
        });
      }
    }

    totalInserted += insertResult.count;
    totalDebited += actuallyDebited;
    perTenant.push({
      tenantId,
      debitedMicrocents: actuallyDebited,
      eventCount: actualEventCount,
    });
  }

  return { inserted: totalInserted, debitedMicrocents: totalDebited, perTenant };
}
