// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0
//
// Provision (and lazily refresh) a tenant's LiteLLM virtual key.
//
// Provisioning is idempotent: calling `ensureTenantLiteLLMKey(tenantId)`
// many times returns the same key. The function is the only place in
// the codebase that should ever write to `TenantLiteLLMKey` — the
// resolver hot-path only reads.

import { prisma } from "../../db/prisma.js";
import { decryptStringMaybe, encryptString } from "../../lib/crypto-envelope.js";
import { getLiteLLMAdmin } from "./admin-client.ee.js";

const DEFAULT_MODEL_ALLOWLIST = ["trustalo-default", "trustalo-premium", "trustalo-fast"];

export interface EnsuredKey {
  virtualKey: string;
  litellmKeyId: string;
  modelAllowlist: string[];
}

/**
 * Returns a usable LiteLLM virtual key for the tenant, creating one on
 * LiteLLM and persisting an encrypted handle locally if needed. The
 * function is safe to call in the LLM hot path: when the row already
 * exists, no LiteLLM admin call is made — just a DB SELECT and AES-GCM
 * decrypt.
 *
 * Idempotency notes:
 *   - Concurrent first-call races are resolved by the unique constraint
 *     on `TenantLiteLLMKey.tenantId`: the loser catches P2002 and re-reads.
 *   - We do NOT auto-rotate keys here; rotation is an explicit admin op.
 *
 * NOTE on multi-instance deploys: two API instances calling
 * `ensureTenantLiteLLMKey` simultaneously will both attempt
 * `generateKey` on LiteLLM. LiteLLM treats `key_alias` as a primary key
 * on most versions, so the second call updates the first key rather
 * than creating a duplicate. In the rare case LiteLLM does mint a
 * second key, the local DB constraint forces the second instance to
 * discard its result (P2002 on insert) and re-read. Leftover unused
 * LiteLLM keys are cleaned up by a follow-up reconciler — see
 * `scripts/billing/reconcile-orphan-keys.ee.ts` (planned).
 */
export async function ensureTenantLiteLLMKey(tenantId: string): Promise<EnsuredKey> {
  // Fast path: existing row.
  const existing = await prisma.tenantLiteLLMKey.findUnique({ where: { tenantId } });
  if (existing && existing.status === "active") {
    const virtualKey = decryptStringMaybe(existing.virtualKeyCipher);
    if (!virtualKey) {
      throw new Error(`[billing.ee] Failed to decrypt virtual key for tenant ${tenantId}`);
    }
    return {
      virtualKey,
      litellmKeyId: existing.litellmKeyId,
      modelAllowlist: existing.modelAllowlist,
    };
  }

  // Slow path: ask LiteLLM to mint one.
  const admin = getLiteLLMAdmin();
  const generated = await admin.generateKey({
    keyAlias: `trustalo-tenant-${tenantId}`,
    teamId: `trustalo-tenant-${tenantId}`,
    userId: `tenant:${tenantId}`,
    models: DEFAULT_MODEL_ALLOWLIST,
    maxBudgetUsd: null,
    metadata: { trustalo_tenant_id: tenantId },
  });

  const virtualKey = generated.key;
  const litellmKeyId =
    generated.raw.token ?? generated.raw.key_name ?? `trustalo-tenant-${tenantId}`;

  // Upsert into the local table. If a concurrent call beat us to it,
  // the unique-constraint kicks in and we re-read instead of double-
  // writing.
  try {
    await prisma.tenantLiteLLMKey.upsert({
      where: { tenantId },
      create: {
        tenantId,
        litellmKeyId,
        virtualKeyCipher: encryptString(virtualKey),
        modelAllowlist: DEFAULT_MODEL_ALLOWLIST,
        status: "active",
      },
      update: {
        litellmKeyId,
        virtualKeyCipher: encryptString(virtualKey),
        status: "active",
      },
    });
  } catch (err: unknown) {
    // P2002 on tenantId unique — concurrent provisioning won the race.
    // Re-read and return that row; the LiteLLM key we just minted is
    // an orphan and will be reconciled by the cleanup script.
    const code = (err as { code?: string }).code;
    if (code !== "P2002") throw err;
    const winning = await prisma.tenantLiteLLMKey.findUniqueOrThrow({ where: { tenantId } });
    const winningKey = decryptStringMaybe(winning.virtualKeyCipher);
    if (!winningKey) throw new Error("[billing.ee] decrypt failed after race");
    return {
      virtualKey: winningKey,
      litellmKeyId: winning.litellmKeyId,
      modelAllowlist: winning.modelAllowlist,
    };
  }

  return { virtualKey, litellmKeyId, modelAllowlist: DEFAULT_MODEL_ALLOWLIST };
}

/**
 * Revoke + re-mint a tenant's key. Used by the admin endpoint
 * `POST /api/v1/billing/keys/rotate` (planned) and on suspicious-spend
 * alerts. Never called from the hot path.
 */
export async function rotateTenantLiteLLMKey(tenantId: string): Promise<EnsuredKey> {
  const admin = getLiteLLMAdmin();
  const existing = await prisma.tenantLiteLLMKey.findUnique({ where: { tenantId } });

  if (existing) {
    const oldKey = decryptStringMaybe(existing.virtualKeyCipher);
    if (oldKey) {
      try {
        await admin.deleteKey(oldKey);
      } catch (err) {
        console.warn(`[billing.ee] failed to delete old LiteLLM key for ${tenantId}:`, err);
      }
    }
    await prisma.tenantLiteLLMKey.update({
      where: { tenantId },
      data: { status: "rotating" },
    });
  }

  // Delegate to the standard ensure path; it will mint a fresh one.
  return ensureTenantLiteLLMKey(tenantId);
}
