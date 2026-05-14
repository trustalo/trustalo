// SecretVault service.
//
// Wraps the `SecretVault` Prisma model so callers never touch the raw
// ciphertext column. All credentials and other sensitive payloads flow
// through this service; consumers store only the returned `id` and
// resolve the plaintext on demand.
//
// Design rules:
//  * Plaintext is JSON-encoded before encryption so the same vault row
//    can hold complex objects (credentials, OAuth token bundles, …).
//  * Rotation is in-place by default. When `rotate=true` is passed to
//    `update()`, the existing row is preserved and a new row is created
//    so the audit trail survives; the caller is responsible for moving
//    the referrer's `secretId` to the new row.
//  * Deletion is hard-delete by default. Callers wanting tombstones can
//    call `markRotated()` instead.

import { prisma } from "../db/prisma.js";
import { encryptCredentials, decryptCredentials } from "../integrations/core/encryption.js";

import type { SecretScope } from "../../generated/prisma/client/index.js";

export type SecretOwnerType = "integration_connection" | "webhook" | "ad_hoc";

interface CreateSecretParams {
  tenantId: string;
  scope: SecretScope;
  ownerType: SecretOwnerType;
  ownerId: string;
  payload: Record<string, string>;
  expiresAt?: Date | null;
  kmsKeyId?: string | null;
}

interface UpdateSecretParams {
  payload: Record<string, string>;
  rotate?: boolean;
  expiresAt?: Date | null;
}

export class SecretVaultService {
  /** Creates a vault row and returns its id. */
  static async create(params: CreateSecretParams): Promise<string> {
    const encryptedPayload = encryptCredentials(params.payload);
    const row = await prisma.secretVault.create({
      data: {
        tenantId: params.tenantId,
        scope: params.scope,
        ownerType: params.ownerType,
        ownerId: params.ownerId,
        encryptedPayload,
        expiresAt: params.expiresAt ?? null,
        kmsKeyId: params.kmsKeyId ?? null,
      },
    });
    return row.id;
  }

  /** Reads and decrypts a vault row. Throws if not found. */
  static async read(secretId: string): Promise<Record<string, string>> {
    const row = await prisma.secretVault.findUnique({ where: { id: secretId } });
    if (!row) {
      throw new SecretVaultError(`Secret ${secretId} not found`, "SECRET_NOT_FOUND");
    }
    return decryptCredentials(row.encryptedPayload);
  }

  /**
   * Updates a vault row's payload. By default updates in place; passing
   * `rotate: true` creates a new row and returns its id (caller must
   * move the referrer's `secretId` to the new row).
   */
  static async update(
    secretId: string,
    params: UpdateSecretParams,
  ): Promise<{ id: string; rotated: boolean }> {
    const existing = await prisma.secretVault.findUnique({ where: { id: secretId } });
    if (!existing) {
      throw new SecretVaultError(`Secret ${secretId} not found`, "SECRET_NOT_FOUND");
    }
    const encryptedPayload = encryptCredentials(params.payload);
    if (params.rotate) {
      const fresh = await prisma.secretVault.create({
        data: {
          tenantId: existing.tenantId,
          scope: existing.scope,
          ownerType: existing.ownerType,
          ownerId: existing.ownerId,
          encryptedPayload,
          expiresAt: params.expiresAt ?? existing.expiresAt,
          kmsKeyId: existing.kmsKeyId,
        },
      });
      await prisma.secretVault.update({
        where: { id: secretId },
        data: { rotatedAt: new Date() },
      });
      return { id: fresh.id, rotated: true };
    }
    await prisma.secretVault.update({
      where: { id: secretId },
      data: {
        encryptedPayload,
        ...(params.expiresAt !== undefined ? { expiresAt: params.expiresAt } : {}),
      },
    });
    return { id: secretId, rotated: false };
  }

  /** Hard-deletes a vault row. Use `markRotated()` to keep history. */
  static async delete(secretId: string): Promise<void> {
    await prisma.secretVault.delete({ where: { id: secretId } }).catch(() => {
      // Idempotent: missing rows are fine.
    });
  }

  /** Soft-deletes a vault row by stamping `rotatedAt`. */
  static async markRotated(secretId: string): Promise<void> {
    await prisma.secretVault
      .update({ where: { id: secretId }, data: { rotatedAt: new Date() } })
      .catch(() => {
        // Idempotent: missing rows are fine.
      });
  }

  /** Lists vault rows for a given owner — primarily for debugging. */
  static async listByOwner(
    ownerType: SecretOwnerType,
    ownerId: string,
  ): Promise<{ id: string; createdAt: Date; rotatedAt: Date | null }[]> {
    const rows = await prisma.secretVault.findMany({
      where: { ownerType, ownerId },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, rotatedAt: true },
    });
    return rows;
  }
}

export class SecretVaultError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "SecretVaultError";
    this.code = code;
  }
}
