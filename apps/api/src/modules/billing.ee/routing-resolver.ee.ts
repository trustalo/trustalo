// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0
//
// EE implementation of the `ManagedRoutingResolver` hook from
// `@trustalo/ai`. This is what makes every LLM call on a SaaS tenant
// flow through Trustalo's hosted LiteLLM proxy with that tenant's
// virtual key, instead of the BYOK provider rows the per-org settings
// might otherwise resolve.
//
// The resolver is *small on purpose*: every other piece of state
// (provisioning, wallet, spend events, markup) lives in its own file
// so the hot path is just three lookups and a credit check.

import { assertEnterpriseLicense } from "@trustalo/license";
import { buildLiteLLMOverride, type ManagedRoutingResolver } from "@trustalo/ai";
import { prisma } from "../../db/prisma.js";
import { getLiteLLMConfig } from "../../config/litellm.js";
import { registerManagedRoutingResolver } from "../../config/ai.js";
import { ensureTenantLiteLLMKey } from "./provisioning.ee.js";
import { CreditsExhaustedError } from "./errors.ee.js";

/**
 * The hook. Returns `null` (meaning "let the standard precedence chain
 * run") when:
 *   - managed routing is globally disabled (LITELLM_* env not set), OR
 *   - the tenant has billingConfig.mode === "disabled" (operator opt-out)
 *
 * Returns a `ManagedRoutingOverride` (forcing LiteLLM routing) when:
 *   - tenant has billingConfig.mode === "managed" or "byok_passthrough"
 *   - the license includes `ai-metered`
 *   - the wallet has positive balance (managed mode only)
 *
 * Throws `CreditsExhaustedError` (mapped to 402 by the error middleware)
 * when the tenant is in managed mode and the wallet is exhausted —
 * blocking the LLM call entirely is the correct behavior because the
 * upstream LiteLLM proxy would reject the request with budget-exceeded
 * anyway, but doing the check locally yields a cleaner error.
 */
export const resolveManagedRouting: ManagedRoutingResolver = async ({ tenantId, feature }) => {
  const cfg = getLiteLLMConfig();
  if (!cfg.managedProxyEnabled) return null;

  // License check first — cheapest, no I/O. Throws EnterpriseLicenseError
  // which maps to 402 in the error middleware. We require the umbrella
  // `ai` entitlement too: a token holding `ai-metered` alone but not
  // `ai` is a configuration bug at the issuer that we surface as a clear
  // license failure rather than letting it fall through to BYOK.
  assertEnterpriseLicense("ai");
  assertEnterpriseLicense("ai-metered");

  const billingConfig = await prisma.tenantBillingConfig.findUnique({ where: { tenantId } });

  // No billing config row yet → behave as if `managed` (the
  // provisioning endpoint creates the row on first wallet top-up; until
  // then, treat a license-holding tenant as managed by default).
  const mode = billingConfig?.mode ?? "managed";

  if (mode === "disabled") return null;

  // Managed mode requires positive wallet balance.
  if (mode === "managed") {
    const wallet = await prisma.creditWallet.findUnique({
      where: { tenantId },
      select: { balanceMicrocents: true },
    });
    const balance = wallet?.balanceMicrocents ?? 0n;
    if (balance <= 0n) {
      throw new CreditsExhaustedError(tenantId);
    }
  }

  const { virtualKey } = await ensureTenantLiteLLMKey(tenantId);

  // Per-feature model tier. If the operator pinned an override on
  // billingConfig.modelTierOverride, use it; otherwise the default
  // alias (`trustalo-default`) is fine — operators wire per-feature
  // models via the regular AIFeatureConfig table when needed.
  const model = billingConfig?.modelTierOverride ?? "trustalo-default";

  return buildLiteLLMOverride({
    tenantId,
    feature,
    baseUrl: cfg.baseUrl!, // managedProxyEnabled implies baseUrl is set
    virtualKey,
    model,
  });
};

let registered = false;

/**
 * Wires the EE resolver into the core resolution chain. Idempotent.
 * Called exactly once from `apps/api/src/index.ts` at boot, AFTER env
 * parsing but BEFORE the HTTP listener binds.
 */
export function registerEEBillingRouting(): void {
  if (registered) return;
  const cfg = getLiteLLMConfig();
  if (!cfg.managedProxyEnabled) {
    console.log("[billing.ee] LITELLM_BASE_URL not configured — managed routing disabled");
    return;
  }
  registerManagedRoutingResolver(resolveManagedRouting);
  registered = true;
  console.log("[billing.ee] managed LiteLLM routing enabled");
}
