// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0
//
// Singleton accessor for the LiteLLM admin client. We hold a single
// instance per process because the underlying client is stateless aside
// from `baseUrl` + `masterKey`, and constructing a fresh one per call
// would mean re-importing the master key into many `Authorization`
// headers in memory. One client also lets us add request-level metrics
// later without touching every call site.

import { LiteLLMAdminClient } from "@trustalo/billing.ee";
import { getLiteLLMConfig } from "../../config/litellm.js";

let cached: LiteLLMAdminClient | null = null;

export function getLiteLLMAdmin(): LiteLLMAdminClient {
  if (cached) return cached;
  const cfg = getLiteLLMConfig();
  if (!cfg.baseUrl || !cfg.masterKey) {
    throw new Error(
      "[billing.ee] LiteLLM admin client requested but LITELLM_BASE_URL or LITELLM_MASTER_KEY is not configured",
    );
  }
  cached = new LiteLLMAdminClient({
    baseUrl: cfg.baseUrl,
    masterKey: cfg.masterKey,
  });
  return cached;
}

export function __resetLiteLLMAdminForTests(): void {
  cached = null;
}
