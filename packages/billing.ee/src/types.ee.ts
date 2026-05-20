// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0

/**
 * Mirror of the Prisma `TenantBillingMode` enum (see
 * apps/api/prisma/schema/billing.ee.prisma). Kept here so non-API
 * consumers (CLI reconciler, future BullMQ worker) can refer to the
 * mode without importing the Prisma client.
 */
export const TENANT_BILLING_MODES = ["managed", "byok_passthrough", "disabled"] as const;

export type TenantBillingMode = (typeof TENANT_BILLING_MODES)[number];

export function parseTenantBillingMode(input: unknown): TenantBillingMode {
  if (typeof input !== "string" || !(TENANT_BILLING_MODES as readonly string[]).includes(input)) {
    throw new Error(`Invalid TenantBillingMode: ${String(input)}`);
  }
  return input as TenantBillingMode;
}
