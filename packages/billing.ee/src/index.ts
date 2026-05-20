// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0
//
// @trustalo/billing.ee — Enterprise (EE) package implementing the
// Trustalo-managed LiteLLM routing + metered billing surface.
//
// Public API:
//   - LiteLLMAdminClient        ← typed wrapper around LiteLLM's admin REST
//   - applyMarkup / refundMarkup ← pure money math (microcent precision)
//   - normaliseSpendEvents       ← turns raw LiteLLM spend records into rows
//   - TenantBillingMode          ← shared enum (mirrors the Prisma enum)
//
// Application wiring (Express routes, Prisma reads/writes, webhook
// signatures, Stripe coordination) lives in
// apps/api/src/modules/billing.ee/. This package is intentionally
// app-framework-agnostic so the same logic can be exercised from a
// CLI reconciler or a future cron job without dragging Express in.

export { LiteLLMAdminClient } from "./litellm-admin.ee.js";
export type {
  LiteLLMAdminClientOptions,
  LiteLLMKeyInfo,
  LiteLLMSpendLogEntry,
} from "./litellm-admin.ee.js";

export {
  applyMarkup,
  refundMarkup,
  microcentsToDollars,
  dollarsToMicrocents,
} from "./markup.ee.js";

export { normaliseSpendEvents } from "./spend-aggregator.ee.js";
export type {
  RawSpendRecord,
  NormalisedSpendEvent,
  NormaliseOptions,
} from "./spend-aggregator.ee.js";

export type { TenantBillingMode } from "./types.ee.js";
export { TENANT_BILLING_MODES, parseTenantBillingMode } from "./types.ee.js";
