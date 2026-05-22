/**
 * IntegrationCheckControl drift reconciler.
 *
 * The binder materialises bindings at connect time; the reconciler
 * keeps them aligned with reality afterwards. Lifecycle events that
 * fire a reconcile pass:
 *
 *  - Tenant adopts or disables a framework instance.
 *  - Tenant marks a Control as `not_applicable` (or back).
 *  - Tenant hard-deletes a Control.
 *  - `ControlRequirementAssignment` set changes (PUT /controls/:id/mappings).
 *  - Manifest version bump at collector startup.
 *  - Nightly safety-net cron.
 *  - Manual "re-sync" button.
 *
 * All trigger paths funnel through the same idempotent helper so the
 * "correct state" is computed in exactly one place. Soft-disabling
 * (isEnabled=false + disabledReason) is preferred over hard-deletes
 * so auditors can see "this binding existed from X to Y".
 */

import { collectAllFrameworkRefs, getManifest } from "@trustalo/integration-manifests";
import {
  Prisma,
  type IntegrationCheckControlDisabledReason,
} from "../../../generated/prisma/client/index.js";
import { prisma } from "../../db/prisma.js";
import { resolveFrameworkRefs, type ResolvedFrameworkRef } from "../../lib/api-client.js";
import {
  bindManifestToTenantControls,
  DEFAULT_AUTO_BIND_MODE,
  type IntegrationAutoBindMode,
} from "../binder/index.js";

export interface ReconcileBindingsArgs {
  tenantId: string;
  connectionId: string;
  /**
   * Optional hint about the trigger that initiated the reconcile.
   * Used to decide which `disabledReason` to apply when a previously
   * desired binding falls off the desired set.
   */
  triggerReason?: IntegrationCheckControlDisabledReason;
}

export interface ReconcileBindingsResult {
  connectionId: string;
  manifestVersion: string | null;
  /** New IntegrationCheckControl rows the reconciler inserted. */
  added: Array<{ controlId: string; manifestKey: string }>;
  /** Existing rows the reconciler re-enabled. */
  reEnabled: Array<{ controlId: string; manifestKey: string }>;
  /** Rows the reconciler soft-disabled (with the assigned reason). */
  disabled: Array<{
    controlId: string;
    manifestKey: string;
    reason: IntegrationCheckControlDisabledReason;
  }>;
  /** Rows that needed no change; included so test assertions can confirm idempotency. */
  unchanged: number;
}

/**
 * Maps a resolver "reason" to the appropriate
 * `IntegrationCheckControlDisabledReason`. Used when a previously
 * desired binding has fallen off because of upstream catalog changes.
 * Exported for unit tests.
 */
export function disabledReasonFromResolver(
  reason: ResolvedFrameworkRef["reason"] | undefined,
  fallback: IntegrationCheckControlDisabledReason,
): IntegrationCheckControlDisabledReason {
  switch (reason) {
    case "controls_not_applicable":
      return "control_not_applicable";
    case "framework_not_seeded":
    case "framework_not_enabled":
      return "framework_disabled";
    case "requirement_not_seeded":
    case "no_control_assignments":
      return "ref_unmapped";
    default:
      return fallback;
  }
}

/**
 * Pure diff: given the desired state and the current rows, decide what
 * the reconciler should add, re-enable, soft-disable, or leave alone.
 *
 * Extracted from the prisma-write loop in `reconcileBindings` so the
 * branching logic (insert vs re-enable vs disable vs unchanged) is
 * unit-testable without spinning up the DB or fixtures.
 *
 * `manifestRemovedKeys` lets the caller flag IntegrationCheck stubs
 * whose manifest item disappeared in a version bump — those bindings
 * get a special `manifest_removed` reason.
 */
export interface ReconcileDiffInput {
  /** Desired (manifestKey, controlId) pairs after resolving refs. */
  desiredByManifestKey: Map<string, Set<string>>;
  /** Existing rows on the connection, keyed by manifestKey. */
  existingByManifestKey: Map<string, Array<{ id: string; controlId: string; isEnabled: boolean }>>;
  /** Per-manifestKey reason for "this binding fell off because…". */
  reasonByMissing: Map<string, IntegrationCheckControlDisabledReason>;
  /** Manifest keys that no longer exist in the loaded manifest. */
  manifestRemovedKeys: Set<string>;
  /** Fallback when no precise reason is known. */
  fallbackReason: IntegrationCheckControlDisabledReason;
}

export interface ReconcileDiffOutput {
  toInsert: Array<{ manifestKey: string; controlId: string }>;
  toReEnable: Array<{ id: string; manifestKey: string; controlId: string }>;
  toDisable: Array<{
    id: string;
    manifestKey: string;
    controlId: string;
    reason: IntegrationCheckControlDisabledReason;
  }>;
  unchanged: Array<{ id: string; manifestKey: string; controlId: string }>;
}

export function computeReconcileDiff(input: ReconcileDiffInput): ReconcileDiffOutput {
  const out: ReconcileDiffOutput = {
    toInsert: [],
    toReEnable: [],
    toDisable: [],
    unchanged: [],
  };

  // (a) Iterate desired manifest keys, looking at every controlId in
  // the desired set.
  for (const [manifestKey, desiredControls] of input.desiredByManifestKey) {
    const existing = input.existingByManifestKey.get(manifestKey) ?? [];
    const existingByControlId = new Map(existing.map((r) => [r.controlId, r]));

    for (const controlId of desiredControls) {
      const row = existingByControlId.get(controlId);
      if (!row) {
        out.toInsert.push({ manifestKey, controlId });
      } else if (!row.isEnabled) {
        out.toReEnable.push({ id: row.id, manifestKey, controlId });
      } else {
        out.unchanged.push({ id: row.id, manifestKey, controlId });
      }
    }

    for (const row of existing) {
      if (desiredControls.has(row.controlId)) continue;
      if (!row.isEnabled) continue;
      out.toDisable.push({
        id: row.id,
        manifestKey,
        controlId: row.controlId,
        reason: input.reasonByMissing.get(manifestKey) ?? input.fallbackReason,
      });
    }
  }

  // (b) Manifest items that were removed entirely. Every enabled row
  // under them is soft-disabled with `manifest_removed`.
  for (const manifestKey of input.manifestRemovedKeys) {
    const rows = input.existingByManifestKey.get(manifestKey) ?? [];
    for (const row of rows) {
      if (!row.isEnabled) continue;
      out.toDisable.push({
        id: row.id,
        manifestKey,
        controlId: row.controlId,
        reason: "manifest_removed",
      });
    }
  }

  return out;
}

/**
 * Idempotent reconcile. Computes the desired
 * (manifestKey, controlId) set from the manifest + tenant catalog,
 * diffs against the current rows, and applies the minimum number of
 * writes.
 */
export async function reconcileBindings(
  args: ReconcileBindingsArgs,
): Promise<ReconcileBindingsResult> {
  const { tenantId, connectionId } = args;
  const fallbackReason: IntegrationCheckControlDisabledReason =
    args.triggerReason ?? "ref_unmapped";

  const connection = await prisma.integrationConnection.findFirst({
    where: { id: connectionId, tenantId },
    select: { id: true, integrationId: true, manifestVersion: true },
  });
  if (!connection) {
    throw new Error(`Connection ${connectionId} not found for tenant ${tenantId}`);
  }

  const manifest = getManifest(connection.integrationId);
  if (!manifest) {
    return {
      connectionId,
      manifestVersion: null,
      added: [],
      reEnabled: [],
      disabled: [],
      unchanged: 0,
    };
  }

  // 1. If the manifest has changed (new checks/capabilities added or
  //    removed), the binder is the right tool — it inserts new
  //    IntegrationCheck rows for added items and the reconciler step
  //    below soft-disables removed items.
  //
  //    We always run the binder in `auto` mode here because the
  //    reconciler runs in trusted background contexts; it should not
  //    "suggest" anything to the user mid-cycle. Confirmation policy
  //    only applies at connect time.
  const bindMode: IntegrationAutoBindMode =
    connection.manifestVersion === manifest.version ? "auto" : "auto";
  // (Kept as a named local for symmetry with the binder helper; both
  //  branches resolve to "auto" today, but factoring out the choice
  //  makes the next-step "reconciler honours `off`" change a one-liner.)
  void bindMode;

  // 2. Recompute the desired (manifestKey → Set<controlId>) map.
  const allRefs = collectAllFrameworkRefs(manifest);
  const resolved = allRefs.length ? await resolveFrameworkRefs(tenantId, allRefs) : [];
  const refKey = (r: { framework: string; requirement: string }) =>
    `${r.framework}::${r.requirement}`;
  const resolvedByKey = new Map(resolved.map((r) => [refKey(r), r]));

  const items: Array<{ manifestKey: string; refs: { framework: string; requirement: string }[] }> =
    [];
  for (const check of manifest.checks ?? []) {
    items.push({ manifestKey: check.key, refs: (check.controlMappings ?? []) as never });
  }
  for (const capability of manifest.capabilities ?? []) {
    items.push({
      manifestKey: capability.key,
      refs: (capability.controlMappings ?? []) as never,
    });
  }

  const desiredByManifestKey = new Map<string, Set<string>>();
  // Track per-(manifestKey, controlId) why the row is desired/undesired
  // so the reconciler can write a precise `disabledReason` when a
  // formerly-desired binding has fallen off.
  const reasonByMissing = new Map<string, IntegrationCheckControlDisabledReason>();
  for (const item of items) {
    const controls = new Set<string>();
    for (const ref of item.refs) {
      const r = resolvedByKey.get(refKey(ref));
      if (r && r.controlIds.length) {
        for (const id of r.controlIds) controls.add(id);
      } else if (r) {
        // The ref *exists* in the catalog but resolves to nothing
        // right now — capture the precise reason for any binding row
        // that mentions this ref and is about to be soft-disabled.
        const reason = disabledReasonFromResolver(r.reason, fallbackReason);
        // Reasoning key intentionally per-manifestKey only; we don't
        // have a way to know which specific controlId fell off from
        // an empty resolver result, but the per-row diff loop below
        // assigns this reason consistently.
        reasonByMissing.set(item.manifestKey, reason);
      }
    }
    desiredByManifestKey.set(item.manifestKey, controls);
  }

  // 3. Load existing checks + bindings.
  const existingChecks = await prisma.integrationCheck.findMany({
    where: { connectionId, tenantId },
    select: {
      id: true,
      manifestKey: true,
      controls: {
        select: {
          id: true,
          controlId: true,
          isEnabled: true,
          disabledReason: true,
        },
      },
    },
  });
  const checkByManifestKey = new Map(existingChecks.map((c) => [c.manifestKey, c]));

  const added: ReconcileBindingsResult["added"] = [];
  const reEnabled: ReconcileBindingsResult["reEnabled"] = [];
  const disabled: ReconcileBindingsResult["disabled"] = [];
  let unchanged = 0;

  // 4. For each manifest item, compute (toAdd, toReEnable, toDisable).
  //    Wrap in a single transaction so partial failures don't leave
  //    bindings half-applied.
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const desired = desiredByManifestKey.get(item.manifestKey) ?? new Set<string>();
      let check = checkByManifestKey.get(item.manifestKey);

      // No existing IntegrationCheck row yet — manifest added an item
      // since the connection was bound. Insert a stub so the binder's
      // upsert path is consistent.
      if (!check) {
        const manifestItem =
          (manifest.checks ?? []).find((c) => c.key === item.manifestKey) ??
          (manifest.capabilities ?? []).find((c) => c.key === item.manifestKey);
        if (!manifestItem) continue;
        const isCheck = "runner" in manifestItem;
        const createdCheck = await tx.integrationCheck.create({
          data: {
            tenantId,
            connectionId,
            integrationId: connection.integrationId,
            manifestKey: item.manifestKey,
            title: manifestItem.title,
            description: manifestItem.description,
            severity: isCheck
              ? (manifestItem.severity ?? "medium")
              : manifestItem.defaultSeverity === "info"
                ? "low"
                : manifestItem.defaultSeverity,
            schedule: isCheck ? (manifestItem.schedule ?? "0 6 * * *") : "0 6 * * *",
            runner: isCheck ? manifestItem.runner : "manifest",
            spec: (isCheck ? { params: manifestItem.params ?? {} } : null) as
              | Prisma.InputJsonValue
              | undefined,
          },
          select: {
            id: true,
            manifestKey: true,
            controls: {
              select: { id: true, controlId: true, isEnabled: true, disabledReason: true },
            },
          },
        });
        check = createdCheck;
      }

      const existingByControlId = new Map(check.controls.map((c) => [c.controlId, c]));

      // (a) Insert / re-enable desired rows.
      for (const controlId of desired) {
        const existing = existingByControlId.get(controlId);
        if (!existing) {
          await tx.integrationCheckControl.create({
            data: {
              tenantId,
              integrationCheckId: check.id,
              connectionId,
              controlId,
              isEnabled: true,
              lastReconciledAt: now,
            },
          });
          added.push({ controlId, manifestKey: item.manifestKey });
        } else if (!existing.isEnabled) {
          await tx.integrationCheckControl.update({
            where: { id: existing.id },
            data: {
              isEnabled: true,
              disabledReason: null,
              disabledAt: null,
              lastReconciledAt: now,
            },
          });
          reEnabled.push({ controlId, manifestKey: item.manifestKey });
        } else {
          await tx.integrationCheckControl.update({
            where: { id: existing.id },
            data: { lastReconciledAt: now },
          });
          unchanged++;
        }
      }

      // (b) Soft-disable rows that are no longer desired.
      for (const [controlId, row] of existingByControlId.entries()) {
        if (desired.has(controlId) || !row.isEnabled) continue;
        const reason = reasonByMissing.get(item.manifestKey) ?? fallbackReason;
        await tx.integrationCheckControl.update({
          where: { id: row.id },
          data: {
            isEnabled: false,
            disabledReason: reason,
            disabledAt: now,
            lastReconciledAt: now,
          },
        });
        disabled.push({ controlId, manifestKey: item.manifestKey, reason });
      }
    }

    // (c) Soft-disable IntegrationCheck stubs whose manifest item was
    //     removed in a manifest version bump.
    const declaredKeys = new Set(items.map((i) => i.manifestKey));
    for (const stale of existingChecks) {
      if (declaredKeys.has(stale.manifestKey)) continue;
      for (const ctl of stale.controls) {
        if (!ctl.isEnabled) continue;
        await tx.integrationCheckControl.update({
          where: { id: ctl.id },
          data: {
            isEnabled: false,
            disabledReason: "manifest_removed",
            disabledAt: now,
            lastReconciledAt: now,
          },
        });
        disabled.push({
          controlId: ctl.controlId,
          manifestKey: stale.manifestKey,
          reason: "manifest_removed",
        });
      }
    }

    await tx.integrationConnection.update({
      where: { id: connectionId },
      data: {
        manifestVersion: manifest.version ?? "1.0.0",
        lastReconciledAt: now,
      },
    });
  });

  return {
    connectionId,
    manifestVersion: manifest.version ?? "1.0.0",
    added,
    reEnabled,
    disabled,
    unchanged,
  };
}

/**
 * Reconcile every connection in a tenant — used by the
 * framework-disable / framework-enable / nightly-cron paths. Returns
 * the per-connection results so callers can aggregate them for
 * notifications.
 */
export async function reconcileAllConnectionsForTenant(
  tenantId: string,
  triggerReason?: IntegrationCheckControlDisabledReason,
): Promise<ReconcileBindingsResult[]> {
  const connections = await prisma.integrationConnection.findMany({
    where: { tenantId, isActive: true },
    select: { id: true },
  });
  const out: ReconcileBindingsResult[] = [];
  for (const c of connections) {
    out.push(await reconcileBindings({ tenantId, connectionId: c.id, triggerReason }));
  }
  return out;
}

/**
 * Helper used by the connect-time path. Lives next to the reconciler
 * so the two share imports; the binder's `bindManifestToTenantControls`
 * is the canonical entry point at connect time.
 */
export { bindManifestToTenantControls, DEFAULT_AUTO_BIND_MODE };
