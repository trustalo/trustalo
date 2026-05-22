/**
 * Manifest → tenant Control binder.
 *
 * Called from `POST /connections` (and from the reconciler) to
 * materialise the relationship between a connection's checks /
 * capabilities and the tenant's adopted Control rows.
 *
 * Pipeline:
 *  1. Load the manifest for the connection's `integrationId`.
 *  2. Compute the union of FrameworkRefs across `checks[]` + `capabilities[]`.
 *  3. Call the API resolver to translate FrameworkRefs → tenant Control ids.
 *  4. Upsert `IntegrationCheck` rows per (connection, manifestKey).
 *  5. Upsert `IntegrationCheckControl` rows per (check, controlId).
 *
 * The binder is idempotent — calling it twice on the same connection
 * produces no extra rows and only bumps `lastReconciledAt`. This is
 * exactly the contract the reconciler needs, so it can call the same
 * helper on framework / control lifecycle events.
 */

import {
  getManifest,
  type Capability,
  type Check,
  type Manifest,
  type FrameworkRef,
} from "@trustalo/integration-manifests";
import {
  Prisma,
  type IntegrationCheckControlDisabledReason,
} from "../../../generated/prisma/client/index.js";
import { prisma } from "../../db/prisma.js";
import { resolveFrameworkRefs, type ResolvedFrameworkRef } from "../../lib/api-client.js";

/** Tenant-level policy controlling how aggressively bindings are created. */
export type IntegrationAutoBindMode = "auto" | "suggest" | "off";

export interface BindManifestArgs {
  tenantId: string;
  connectionId: string;
  integrationId: string;
  /** Tenant policy; defaults to `suggest`. */
  mode?: IntegrationAutoBindMode;
}

export interface BindManifestUnresolved {
  framework: string;
  requirement: string;
  /**
   * `manifestKey`s that originally requested this ref. Lets the UI
   * say "github.org.members would have bound here, but you haven't
   * adopted SOC 2 yet".
   */
  requestedBy: string[];
  reason: ResolvedFrameworkRef["reason"] | "unknown";
}

export interface BindManifestPreview {
  manifest: { connector: string; version: string };
  mode: IntegrationAutoBindMode;
  /**
   * Persisted bindings (when mode = "auto") OR proposed bindings
   * staged with `isEnabled = false` (when mode = "suggest"). Empty
   * when mode = "off".
   */
  bindings: Array<{
    controlId: string;
    manifestKeys: string[];
    /** Convenience aggregate for the UI tile. */
    isEnabled: boolean;
  }>;
  /** Refs that didn't resolve to any tenant Control. Never an error. */
  unresolvedRefs: BindManifestUnresolved[];
  /** Total check/capability rows produced; used for telemetry. */
  checksUpserted: number;
}

/**
 * Default policy used when the API doesn't expose a tenant override
 * yet. Conservative-by-default (suggest) is the safer pick for
 * regulated tenants — the connect handler can flip this to "auto"
 * explicitly when the tenant settings endpoint says so.
 */
export const DEFAULT_AUTO_BIND_MODE: IntegrationAutoBindMode = "suggest";

/**
 * Iterate every check + capability declared in the manifest, returning
 * a normalised tuple the binder can treat uniformly.
 */
function flattenManifest(manifest: Manifest): Array<{
  manifestKey: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  runner: "manifest" | "http" | "browser" | "aws_sdk" | "oauth_api";
  spec: Record<string, unknown> | null;
  schedule: string;
  refs: FrameworkRef[];
  kind: "check" | "capability";
}> {
  const out = [] as Array<ReturnType<typeof flattenManifest> extends Array<infer T> ? T : never>;
  for (const check of (manifest.checks ?? []) as Check[]) {
    out.push({
      manifestKey: check.key,
      title: check.title,
      description: check.description,
      severity: (check.severity ?? "medium") as "low" | "medium" | "high" | "critical",
      runner: check.runner,
      spec: { params: check.params ?? {} },
      schedule: check.schedule ?? "0 6 * * *",
      refs: (check.controlMappings ?? []) as FrameworkRef[],
      kind: "check",
    });
  }
  for (const capability of (manifest.capabilities ?? []) as Capability[]) {
    out.push({
      manifestKey: capability.key,
      title: capability.title,
      description: capability.description,
      // Capabilities default to "info"-style data collection; the
      // `IntegrationCheckSeverity` enum doesn't include "info" so we
      // bucket it as "low".
      severity:
        capability.defaultSeverity === "critical" ||
        capability.defaultSeverity === "high" ||
        capability.defaultSeverity === "medium" ||
        capability.defaultSeverity === "low"
          ? capability.defaultSeverity
          : "low",
      runner: "manifest",
      spec: null,
      schedule: "0 6 * * *",
      refs: (capability.controlMappings ?? []) as FrameworkRef[],
      kind: "capability",
    });
  }
  return out;
}

/**
 * Main entry point. Safe to call repeatedly — the reconciler invokes
 * this same function with the same arguments on every drift event.
 */
export async function bindManifestToTenantControls(
  args: BindManifestArgs,
): Promise<BindManifestPreview> {
  const { tenantId, connectionId, integrationId } = args;
  const mode = args.mode ?? DEFAULT_AUTO_BIND_MODE;

  const manifest = getManifest(integrationId);
  if (!manifest) {
    // A connector might exist as a runtime provider class without a
    // manifest yet (legacy seed rows). Don't fail the connect — just
    // return an empty preview so the UI can surface "no manifest".
    return {
      manifest: { connector: integrationId, version: "0.0.0" },
      mode,
      bindings: [],
      unresolvedRefs: [],
      checksUpserted: 0,
    };
  }

  const items = flattenManifest(manifest);
  if (items.length === 0) {
    return {
      manifest: { connector: manifest.connector, version: manifest.version ?? "1.0.0" },
      mode,
      bindings: [],
      unresolvedRefs: [],
      checksUpserted: 0,
    };
  }

  // 1. Deduplicate FrameworkRefs across all items and remember which
  //    manifestKeys requested each ref. The resolver round-trips a
  //    flat list; we expand the result back into per-item controlIds.
  const refKey = (r: FrameworkRef) => `${r.framework}::${r.requirement}`;
  const refByKey = new Map<string, { framework: string; requirement: string }>();
  const requestersByRef = new Map<string, Set<string>>();
  for (const item of items) {
    for (const ref of item.refs) {
      const key = refKey(ref);
      if (!refByKey.has(key))
        refByKey.set(key, { framework: ref.framework, requirement: ref.requirement });
      const set = requestersByRef.get(key) ?? new Set<string>();
      set.add(item.manifestKey);
      requestersByRef.set(key, set);
    }
  }
  const distinctRefs = [...refByKey.values()];

  // 2. Resolve the refs against the tenant catalog. If we're in "off"
  //    mode we still resolve so the preview is useful for the UI.
  const resolved = distinctRefs.length ? await resolveFrameworkRefs(tenantId, distinctRefs) : [];
  const resolvedByKey = new Map(resolved.map((r) => [refKey(r), r]));

  // 3. Build the desired (manifestKey → Set<controlId>) map.
  const desiredByManifestKey = new Map<string, Set<string>>();
  for (const item of items) {
    const controls = new Set<string>();
    for (const ref of item.refs) {
      const r = resolvedByKey.get(refKey(ref));
      for (const id of r?.controlIds ?? []) controls.add(id);
    }
    desiredByManifestKey.set(item.manifestKey, controls);
  }

  // 4. Compute unresolved refs for the preview payload.
  const unresolvedRefs: BindManifestUnresolved[] = [];
  for (const ref of distinctRefs) {
    const r = resolvedByKey.get(refKey(ref));
    if (!r || r.controlIds.length === 0) {
      unresolvedRefs.push({
        framework: ref.framework,
        requirement: ref.requirement,
        requestedBy: [...(requestersByRef.get(refKey(ref)) ?? new Set<string>())],
        reason: r?.reason ?? "unknown",
      });
    }
  }

  // 5. Off mode short-circuits before any writes.
  if (mode === "off") {
    return {
      manifest: { connector: manifest.connector, version: manifest.version ?? "1.0.0" },
      mode,
      bindings: [],
      unresolvedRefs,
      checksUpserted: 0,
    };
  }

  // 6. Persist IntegrationCheck rows + IntegrationCheckControl rows.
  //    Single transaction so the connection never sees half-applied
  //    state — if any insert fails, the binder appears to have not run.
  const checksEnabled = mode === "auto";
  const bindingDisabledReason: IntegrationCheckControlDisabledReason | null =
    mode === "suggest" ? "pending_confirmation" : null;

  let upserted = 0;
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const desiredControlIds = desiredByManifestKey.get(item.manifestKey) ?? new Set<string>();

      // Prisma's `Json` columns demand `InputJsonValue`, not arbitrary
      // `Record<string, unknown>` (it forbids top-level `undefined`).
      // Cast through the Prisma-provided helper to land in the right
      // input shape without losing type info upstream.
      const specInput = (item.spec ?? undefined) as Prisma.InputJsonValue | undefined;

      const check = await tx.integrationCheck.upsert({
        where: { connectionId_manifestKey: { connectionId, manifestKey: item.manifestKey } },
        update: {
          title: item.title,
          description: item.description,
          severity: item.severity,
          schedule: item.schedule,
          runner: item.runner === "manifest" ? "manifest" : item.runner,
          spec: specInput,
        },
        create: {
          tenantId,
          connectionId,
          integrationId,
          manifestKey: item.manifestKey,
          title: item.title,
          description: item.description,
          severity: item.severity,
          schedule: item.schedule,
          runner: item.runner === "manifest" ? "manifest" : item.runner,
          spec: specInput,
          isEnabled: checksEnabled,
        },
        select: { id: true },
      });
      upserted++;

      // IntegrationCheckControl upserts. We don't delete stale bindings
      // here — the reconciler owns lifecycle transitions. The binder
      // only ever expands the set.
      for (const controlId of desiredControlIds) {
        await tx.integrationCheckControl.upsert({
          where: {
            integrationCheckId_controlId: { integrationCheckId: check.id, controlId },
          },
          update: {
            // If the row exists from a prior reconcile, re-enable it
            // when the binder is invoked in `auto` mode. In `suggest`
            // mode we leave the existing state alone so the user's
            // confirm/cancel flow isn't overwritten by a no-op rerun.
            isEnabled: checksEnabled ? true : undefined,
            disabledReason: checksEnabled ? null : undefined,
            disabledAt: checksEnabled ? null : undefined,
            lastReconciledAt: new Date(),
          },
          create: {
            tenantId,
            integrationCheckId: check.id,
            connectionId,
            controlId,
            isEnabled: checksEnabled,
            disabledReason: bindingDisabledReason,
            disabledAt: checksEnabled ? null : new Date(),
            lastReconciledAt: new Date(),
          },
        });
      }
    }

    // Bump the connection-level snapshot so the reconciler can detect
    // manifest version drift cheaply on its next pass.
    await tx.integrationConnection.update({
      where: { id: connectionId },
      data: {
        manifestVersion: manifest.version ?? "1.0.0",
        lastReconciledAt: new Date(),
      },
    });
  });

  // 7. Build the bindings preview payload (one entry per controlId
  //    with the manifestKeys that contribute to it).
  const manifestKeysByControl = new Map<string, Set<string>>();
  for (const [manifestKey, controlIds] of desiredByManifestKey.entries()) {
    for (const controlId of controlIds) {
      const set = manifestKeysByControl.get(controlId) ?? new Set<string>();
      set.add(manifestKey);
      manifestKeysByControl.set(controlId, set);
    }
  }
  const bindings = [...manifestKeysByControl.entries()]
    .map(([controlId, keys]) => ({
      controlId,
      manifestKeys: [...keys].sort(),
      isEnabled: checksEnabled,
    }))
    .sort((a, b) => a.controlId.localeCompare(b.controlId));

  return {
    manifest: { connector: manifest.connector, version: manifest.version ?? "1.0.0" },
    mode,
    bindings,
    unresolvedRefs,
    checksUpserted: upserted,
  };
}
