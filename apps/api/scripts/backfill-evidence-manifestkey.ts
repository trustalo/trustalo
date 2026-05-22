#!/usr/bin/env bun
/**
 * Best-effort backfill of `metadata.manifestKey` on existing
 * `Evidence` rows.
 *
 * Why:
 *   Before the unified manifest pipeline, the runner emitted evidence
 *   tagged with a free-form `sourceType` (e.g. "github", "aws-iam") and
 *   a `controlMapping[]` array of framework codes. The API now routes
 *   evidence through `IntegrationCheckControl` bindings keyed by a
 *   stable `manifestKey` (e.g. "aws.iam.root_mfa_enabled"). Old rows
 *   don't have that key, so the auditor timeline + automation-health
 *   rollups under-report coverage for them.
 *
 * Strategy:
 *   1. For each Evidence row without `metadata.manifestKey`, inspect
 *      `sourceId`. The new emitter writes
 *      `${manifestKey}::${sourceId}::${controlId}`, so a `::` split
 *      gives the manifest key directly.
 *   2. If `sourceId` doesn't have the namespaced shape, fall back to
 *      `sourceType` (still wrong granularity but at least not null).
 *   3. Write the inferred key into `metadata.manifestKey`. Never
 *      overwrite an existing key — this script is idempotent.
 *
 * Safety:
 *   - Dry-run by default. Pass `--apply` to commit.
 *   - Batches of 500 to avoid long-running transactions.
 *   - Logs a per-tenant summary so an operator can sanity-check
 *     before the second pass.
 */

import { PrismaClient } from "../generated/prisma/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const BATCH_SIZE = 500;
const DRY_RUN = !process.argv.includes("--apply");

interface SummaryRow {
  tenantId: string;
  total: number;
  fromSourceId: number;
  fromSourceType: number;
  unchanged: number;
}

async function main() {
  const dbUrl = process.env["DATABASE_URL"] ?? process.env["DIRECT_URL"] ?? "";
  if (!dbUrl) {
    throw new Error("DATABASE_URL or DIRECT_URL must be set");
  }
  const adapter = new PrismaPg({ connectionString: dbUrl });
  const prisma = new PrismaClient({ adapter });

  const summary = new Map<string, SummaryRow>();
  let cursor: string | undefined;
  let processed = 0;

  console.log(
    `[backfill-evidence-manifestkey] starting (mode=${DRY_RUN ? "dry-run" : "apply"}, batch=${BATCH_SIZE})`,
  );

  while (true) {
    const rows = await prisma.evidence.findMany({
      where: { type: "automated" },
      take: BATCH_SIZE,
      orderBy: { id: "asc" },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      select: {
        id: true,
        tenantId: true,
        sourceType: true,
        sourceId: true,
        metadata: true,
      },
    });
    if (rows.length === 0) break;

    for (const row of rows) {
      const meta = (row.metadata as Record<string, unknown> | null) ?? {};
      if (typeof meta.manifestKey === "string" && meta.manifestKey.length > 0) {
        bump(summary, row.tenantId, "unchanged");
        continue;
      }

      let inferred: string | null = null;
      let source: "sourceId" | "sourceType" | null = null;

      if (row.sourceId && row.sourceId.includes("::")) {
        const head = row.sourceId.split("::")[0];
        if (head && /^[a-z0-9_.-]+$/.test(head)) {
          inferred = head;
          source = "sourceId";
        }
      }
      if (!inferred && row.sourceType) {
        inferred = row.sourceType;
        source = "sourceType";
      }

      if (!inferred) {
        bump(summary, row.tenantId, "unchanged");
        continue;
      }

      if (!DRY_RUN) {
        await prisma.evidence.update({
          where: { id: row.id },
          data: {
            metadata: {
              ...meta,
              manifestKey: inferred,
              backfilledManifestKeyFrom: source,
              backfilledAt: new Date().toISOString(),
            } as unknown as Parameters<typeof prisma.evidence.update>[0]["data"]["metadata"],
          },
        });
      }
      bump(summary, row.tenantId, source === "sourceId" ? "fromSourceId" : "fromSourceType");
    }

    processed += rows.length;
    cursor = rows[rows.length - 1]?.id;
    if (rows.length < BATCH_SIZE) break;
  }

  console.log(
    `[backfill-evidence-manifestkey] processed ${processed} evidence rows across ${summary.size} tenants`,
  );
  for (const row of summary.values()) {
    console.log(
      `  tenant=${row.tenantId} total=${row.total} ` +
        `fromSourceId=${row.fromSourceId} fromSourceType=${row.fromSourceType} unchanged=${row.unchanged}`,
    );
  }
  if (DRY_RUN) {
    console.log("[backfill-evidence-manifestkey] dry-run — pass --apply to commit");
  }

  await prisma.$disconnect();
}

function bump(
  summary: Map<string, SummaryRow>,
  tenantId: string,
  bucket: "fromSourceId" | "fromSourceType" | "unchanged",
): void {
  const row = summary.get(tenantId) ?? {
    tenantId,
    total: 0,
    fromSourceId: 0,
    fromSourceType: 0,
    unchanged: 0,
  };
  row.total++;
  row[bucket]++;
  summary.set(tenantId, row);
}

main().catch((err) => {
  console.error("[backfill-evidence-manifestkey] failed:", err);
  process.exit(1);
});
