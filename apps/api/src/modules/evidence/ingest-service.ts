/**
 * Canonical writer for automated (integration- or agent-sourced) evidence.
 *
 * One Evidence row is persisted per (item × valid controlId), typed
 * "automated" and landing in "pending_review" so a human still approves it
 * before it counts as audit evidence — honoring the platform's
 * advisory-never-auto-mutate contract.
 *
 * Control ids that don't belong to `tenantId` are skipped rather than
 * failing the batch (callers — the collector runner, the device-posture
 * check-in — may hold a slightly stale binding cache). An item left with no
 * valid control is counted as an "orphan".
 *
 * Extracted from the /internal/evidence/bulk handler so the collector bulk
 * path and the device-posture check-in path share exactly ONE writer.
 */
import { prisma } from "../../db/prisma.js";
import { Prisma } from "../../../generated/prisma/client/index.js";

export interface AutomatedEvidenceItem {
  title: string;
  description?: string | null;
  /** Authoritative routing key, e.g. "device.disk_encryption" or "aws.iam". */
  manifestKey: string;
  /** UI bucketing hint; defaults to `manifestKey` when omitted. */
  sourceType?: string;
  /** Stable id from the source system, deduped per (manifestKey, controlId). */
  sourceId: string;
  externalUrl?: string | null;
  rawData?: Record<string, unknown> | null;
  severity?: "critical" | "high" | "medium" | "low" | "info";
  /** Deprecated mirror of the manifest framework refs, persisted to metadata. */
  controlMapping?: string[];
  /** Pre-resolved tenant Control ids this item maps to. */
  controlIds: string[];
  collectedAt: Date;
}

export interface CreateAutomatedEvidenceResult {
  created: number;
  orphans: number;
  skippedControlIds: string[];
}

export async function createAutomatedEvidence(
  tenantId: string,
  items: ReadonlyArray<AutomatedEvidenceItem>,
): Promise<CreateAutomatedEvidenceResult> {
  // Validate all referenced control ids belong to this tenant in one query.
  // Anything that doesn't (stale cache, rogue id) is skipped, not fatal.
  const allControlIds = [...new Set(items.flatMap((e) => e.controlIds))];
  const validControls = allControlIds.length
    ? await prisma.control.findMany({
        where: { id: { in: allControlIds }, tenantId },
        select: { id: true },
      })
    : [];
  const validControlIdSet = new Set(validControls.map((c) => c.id));

  let created = 0;
  let orphans = 0;
  const skippedControlIds = new Set<string>();
  const rows: Prisma.EvidenceCreateManyInput[] = [];

  for (const item of items) {
    const targets = item.controlIds.filter((id) => validControlIdSet.has(id));
    for (const skipped of item.controlIds.filter((id) => !validControlIdSet.has(id))) {
      skippedControlIds.add(skipped);
    }
    if (targets.length === 0) {
      orphans++;
      continue;
    }
    for (const controlId of targets) {
      rows.push({
        tenantId,
        controlId,
        title: item.title,
        description: item.description ?? null,
        type: "automated",
        status: "pending_review",
        externalUrl: item.externalUrl ?? null,
        // Keep `sourceType` in sync with the manifest key so existing UI
        // filters bucket rows the same way.
        sourceType: item.sourceType ?? item.manifestKey,
        // The dedupe key: re-sent items for the same (key, source, control)
        // collapse onto the same logical evidence identity.
        sourceId: `${item.manifestKey}::${item.sourceId}::${controlId}`,
        collectedAt: item.collectedAt,
        validFrom: item.collectedAt,
        tags: ["automated", item.manifestKey],
        metadata: {
          manifestKey: item.manifestKey,
          severity: item.severity ?? null,
          rawData: item.rawData ?? null,
          legacyControlMapping: item.controlMapping ?? null,
        } as unknown as Prisma.InputJsonValue,
      });
    }
    created += targets.length;
  }

  if (rows.length > 0) {
    await prisma.evidence.createMany({ data: rows });
  }

  return { created, orphans, skippedControlIds: [...skippedControlIds] };
}
