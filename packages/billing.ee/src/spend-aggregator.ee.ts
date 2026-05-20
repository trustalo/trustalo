// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0
//
// Pure function that converts raw LiteLLM spend log records into the
// shape that the Prisma `LiteLLMSpendEvent` table expects, applying
// markup along the way. Kept in this package (and out of the API
// module) so we can unit-test it without booting a database.

import { applyMarkup, dollarsToMicrocents } from "./markup.ee.js";
import type { TenantBillingMode } from "./types.ee.js";

export interface RawSpendRecord {
  /** LiteLLM request id — the unique idempotency key. */
  requestId: string;
  /** Resolved tenant. The webhook handler MUST verify this against
   *  the virtual key's expected tenant before calling this function;
   *  this helper never cross-references metadata to a database. */
  tenantId: string;
  /** AIFeature enum string (must match the Prisma enum). */
  feature: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  /** Raw upstream cost in USD (LiteLLM's native unit). */
  spendUsd: number;
  occurredAt: Date;
}

export interface NormaliseOptions {
  mode: TenantBillingMode;
  /** Markup in basis points. Forced to 0 for byok_passthrough. */
  markupBps: number;
}

export interface NormalisedSpendEvent {
  tenantId: string;
  feature: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  rawCostMicrocents: bigint;
  markedUpMicrocents: bigint;
  litellmRequestId: string;
  occurredAt: Date;
}

/**
 * Convert a batch of raw LiteLLM spend records into normalised events
 * ready for upsert into `LiteLLMSpendEvent`. The function:
 *
 *   1. Converts USD → microcents
 *   2. Applies the right markup for the tenant's billing mode:
 *      - managed: configured markupBps (typically 3000 == 30%)
 *      - byok_passthrough: 0 (Trustalo isn't paying for inference)
 *      - disabled: 0 (treat like passthrough for the event row, but
 *        the wallet debit step in the caller should skip the debit)
 *   3. Preserves the LiteLLM request id verbatim so the upsert is
 *      idempotent against webhook retries.
 *
 * No I/O. No clocks. No randomness. Easy to test.
 */
export function normaliseSpendEvents(
  records: readonly RawSpendRecord[],
  opts: NormaliseOptions,
): NormalisedSpendEvent[] {
  const effectiveMarkup = opts.mode === "managed" ? opts.markupBps : 0; // byok_passthrough + disabled both bill no inference markup

  return records.map((r) => {
    const rawCostMicrocents = dollarsToMicrocents(r.spendUsd);
    const markedUpMicrocents = applyMarkup(rawCostMicrocents, effectiveMarkup);
    return {
      tenantId: r.tenantId,
      feature: r.feature,
      model: r.model,
      promptTokens: r.promptTokens,
      completionTokens: r.completionTokens,
      rawCostMicrocents,
      markedUpMicrocents,
      litellmRequestId: r.requestId,
      occurredAt: r.occurredAt,
    };
  });
}
