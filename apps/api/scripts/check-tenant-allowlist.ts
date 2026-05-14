#!/usr/bin/env bun
/**
 * Tenant allow-list assertion.
 *
 * The `prismaWithTenant(orgId)` extension in src/db/prisma.ts auto-injects
 * `tenantId` on every Prisma query, but only for models in its
 * hard-coded `tenantScoped` list. If a developer adds a new tenant-scoped
 * model to the schema and forgets to extend the list, multi-tenant
 * isolation silently breaks for that table — a confidentiality bug.
 *
 * This script reads the generated Prisma DMMF, finds every model that has
 * an `tenantId` scalar field, and asserts that:
 *
 *   1. Every such model appears in the `tenantScoped` allow-list.
 *   2. Every entry in the allow-list still corresponds to a real model
 *      with an `tenantId` field (catches typos / dead entries).
 *
 * Run via `bun run verify:tenant` and from CI before any deploy.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const PRISMA_PATH = join(import.meta.dir, "../src/db/prisma.ts");
const SCHEMA_PATH = join(import.meta.dir, "../prisma/schema.prisma");

/**
 * Models that legitimately need cross-tenant queries and therefore must
 * NOT be added to the prismaWithTenant allow-list. Each entry needs a
 * one-line justification so reviewers can spot when an exception is
 * being added by mistake.
 */
const INTENTIONAL_EXCEPTIONS: Record<string, string> = {
  // Auth bootstrap looks up a user's memberships across orgs to choose
  // which tenantId to pin to the session. Auto-injecting
  // tenantId here would break login.
  Membership: "auth bootstrap traverses memberships across orgs",
};

interface ModelField {
  name: string;
  type: string;
  isList: boolean;
  isOptional: boolean;
}
interface Model {
  name: string;
  fields: ModelField[];
}

/**
 * Lightweight Prisma schema parser — only handles the subset we need
 * (top-level `model X { ... }` blocks with `name Type` field lines).
 * Avoids pulling in @prisma/internals or the DMMF emitter just for a
 * one-off check.
 */
function parseModels(schema: string): Model[] {
  const models: Model[] = [];
  const blockRe = /\bmodel\s+(\w+)\s*{([\s\S]*?)\n}/g;
  for (const match of schema.matchAll(blockRe)) {
    const [, name, body] = match;
    if (!name || !body) continue;
    const fields: ModelField[] = [];
    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//") || line.startsWith("@@")) continue;
      const fieldMatch = line.match(/^(\w+)\s+(\w+)(\?)?(\[\])?/);
      if (!fieldMatch) continue;
      const [, fname, ftype, optional, list] = fieldMatch;
      fields.push({
        name: fname!,
        type: ftype!,
        isOptional: Boolean(optional),
        isList: Boolean(list),
      });
    }
    models.push({ name, fields });
  }
  return models;
}

function extractAllowList(prismaSrc: string): string[] {
  const arrayMatch = prismaSrc.match(/const tenantScoped\s*=\s*\[([\s\S]*?)\];/);
  if (!arrayMatch) {
    throw new Error("Could not find `const tenantScoped = [...]` in src/db/prisma.ts");
  }
  return Array.from(arrayMatch[1]!.matchAll(/"([A-Za-z0-9_]+)"/g)).map((m) => m[1]!);
}

async function main() {
  const [schema, prismaSrc] = await Promise.all([
    readFile(SCHEMA_PATH, "utf8"),
    readFile(PRISMA_PATH, "utf8"),
  ]);

  const models = parseModels(schema);
  const tenantModels = models
    .filter((m) => m.fields.some((f) => f.name === "tenantId" && f.type === "String" && !f.isList))
    .map((m) => m.name)
    .sort();

  const allowList = extractAllowList(prismaSrc).sort();
  const allowSet = new Set(allowList);
  const tenantSet = new Set(tenantModels);

  const missingFromAllowList = tenantModels.filter(
    (m) => !allowSet.has(m) && !(m in INTENTIONAL_EXCEPTIONS),
  );
  const deadEntries = allowList.filter((m) => !tenantSet.has(m));
  const exceptionsUsed = tenantModels.filter((m) => m in INTENTIONAL_EXCEPTIONS);

  if (missingFromAllowList.length === 0 && deadEntries.length === 0) {
    console.log(
      `✓ tenant allow-list is consistent (${tenantModels.length} model(s), ${exceptionsUsed.length} documented exception(s))`,
    );
    for (const m of exceptionsUsed) {
      console.log(`    · ${m}: ${INTENTIONAL_EXCEPTIONS[m]}`);
    }
    process.exit(0);
  }

  if (missingFromAllowList.length > 0) {
    console.error(
      `✗ ${missingFromAllowList.length} model(s) have tenantId but are NOT in the prismaWithTenant allow-list:`,
    );
    for (const m of missingFromAllowList) console.error(`    - ${m}`);
    console.error("  → Add them to the `tenantScoped` array in apps/api/src/db/prisma.ts.");
  }

  if (deadEntries.length > 0) {
    console.error(
      `✗ ${deadEntries.length} entry(ies) in the allow-list no longer match any tenant-scoped model:`,
    );
    for (const m of deadEntries) console.error(`    - ${m}`);
    console.error("  → Remove from `tenantScoped` or restore the model with an tenantId field.");
  }

  process.exit(1);
}

main().catch((err) => {
  console.error("[check-tenant-allowlist] failed:", err);
  process.exit(1);
});
