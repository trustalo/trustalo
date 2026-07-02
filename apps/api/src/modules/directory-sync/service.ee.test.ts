// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0

import { describe, expect, it } from "bun:test";
import {
  DIRECTORY_SYNC_FREQUENCIES,
  getConfigSignature,
  patchDirectorySyncConfigSchema,
  upsertDirectorySyncConfigSchema,
} from "./service.ee.js";

describe("directory sync config schema", () => {
  it("accepts only daily or weekly frequency", () => {
    const daily = upsertDirectorySyncConfigSchema.parse({
      syncFrequencyMinutes: 1440,
      credentials: {
        tenantId: "tenant-id",
        clientId: "client-id",
        clientSecret: "secret",
      },
    });
    const weekly = upsertDirectorySyncConfigSchema.parse({
      syncFrequencyMinutes: 10080,
      credentials: {
        serviceAccountJson:
          '{"client_email":"svc@example.com","private_key":"-----BEGIN PRIVATE KEY-----\\nX\\n-----END PRIVATE KEY-----\\n"}',
        adminEmail: "admin@example.com",
      },
    });

    expect(daily.syncFrequencyMinutes).toBe(1440);
    expect(weekly.syncFrequencyMinutes).toBe(10080);
    expect(DIRECTORY_SYNC_FREQUENCIES).toEqual([1440, 10080]);

    expect(() =>
      upsertDirectorySyncConfigSchema.parse({
        syncFrequencyMinutes: 60,
        credentials: {
          tenantId: "tenant-id",
          clientId: "client-id",
          clientSecret: "secret",
        },
      }),
    ).toThrow();
  });

  it("patch schema only accepts the enable flag", () => {
    expect(patchDirectorySyncConfigSchema.parse({ isEnabled: false })).toEqual({
      isEnabled: false,
    });
    // Credentials (or any other field) must go through the full upsert.
    expect(() =>
      patchDirectorySyncConfigSchema.parse({
        isEnabled: true,
        credentials: { tenantId: "t", clientId: "c", clientSecret: "s" },
      }),
    ).toThrow();
    expect(() => patchDirectorySyncConfigSchema.parse({})).toThrow();
  });

  it("rejects owner as default role", () => {
    expect(() =>
      upsertDirectorySyncConfigSchema.parse({
        defaultRole: "owner",
        credentials: {
          tenantId: "tenant-id",
          clientId: "client-id",
          clientSecret: "secret",
        },
      }),
    ).toThrow();
  });
});

describe("getConfigSignature", () => {
  it("is deterministic for same config", () => {
    const first = getConfigSignature({
      provider: "entra",
      syncFrequencyMinutes: 1440,
      defaultRole: "viewer",
      defaultStatus: "invited",
      isEnabled: true,
      groupRoleMappings: [{ externalGroupId: "group-1", role: "viewer" }],
    });
    const second = getConfigSignature({
      provider: "entra",
      syncFrequencyMinutes: 1440,
      defaultRole: "viewer",
      defaultStatus: "invited",
      isEnabled: true,
      groupRoleMappings: [{ externalGroupId: "group-1", role: "viewer" }],
    });
    expect(first).toBe(second);
  });
});
