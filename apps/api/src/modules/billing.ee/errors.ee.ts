// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0
//
// Custom error classes for the EE billing surface. Kept separate from
// the routing resolver so the error-handler can `instanceof`-check them
// without pulling in the LiteLLM admin client at module load time.

export class CreditsExhaustedError extends Error {
  readonly code = "CREDITS_EXHAUSTED";
  /** Always 402 — semantic match with the EnterpriseLicense 402. */
  readonly status = 402;

  constructor(public readonly tenantId: string) {
    super(`Tenant ${tenantId} has no credits remaining. Top up to resume AI features.`);
    this.name = "CreditsExhaustedError";
  }
}

export class WebhookSignatureInvalidError extends Error {
  readonly code = "WEBHOOK_SIGNATURE_INVALID";
  readonly status = 401;
  constructor(reason: string) {
    super(`LiteLLM webhook signature invalid: ${reason}`);
    this.name = "WebhookSignatureInvalidError";
  }
}
