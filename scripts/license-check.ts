#!/usr/bin/env bun
/**
 * License compliance check for Trustalo.
 *
 * Walks every installed dependency under `node_modules/` (including
 * Bun's flat `.bun/<name>+<ver>/node_modules/<name>` layout) and
 * verifies the license string is on the permissive allowlist below.
 *
 * Trustalo ships its own code under a permissive license, so we cannot
 * pull in copyleft dependencies (AGPL/GPL/LGPL) that would relicense
 * the bundle. This script is the automated half of constraint C1 in
 * `.cursor/rules/ai-features.mdc`; the developer attestation in the
 * PR template is the other half.
 *
 * Usage:
 *   bun scripts/license-check.ts            # fail on first violation
 *   bun scripts/license-check.ts --report   # print full table, then exit 1 if any violations
 *
 * Exit codes:
 *   0 — every dependency is on the allowlist
 *   1 — at least one dependency is missing or violates the allowlist
 *   2 — script failure (missing node_modules, etc.)
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

// Permissive licenses we accept. Anything not on this list either
// requires manual review (added to ALLOWED_PACKAGES with a reason) or
// must be removed.
const ALLOWED_LICENSES = new Set([
  "MIT",
  "MIT-0",
  "Apache-2.0",
  "Apache 2.0",
  "BSD",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "BSD-3-Clause-Clear",
  "ISC",
  "0BSD",
  "CC0-1.0",
  "CC-BY-3.0",
  "CC-BY-4.0",
  "Unlicense",
  "WTFPL",
  "Python-2.0",
  "BlueOak-1.0.0",
  "Zlib",
  "Artistic-2.0",
  // X11 is the original name of the MIT license — same text, no
  // additional restrictions. The bare token covers packages that
  // declare `"license": "X11"` directly.
  "X11",
  // Legacy npm slash-notation predating SPDX. `MIT/X11` literally means
  // "MIT (also known as X11)" — one license under two names — not a
  // dual-license. Common in early-2010s `substack`-era packages
  // (`chainsaw`, `traverse`, etc.) which we still pull in transitively
  // via `exceljs → unzipper → binary`.
  "MIT/X11",
  // Mozilla Public License 2.0: file-level copyleft only. Modifications
  // to MPL files must be released; using an MPL library from
  // permissively-licensed code is allowed without relicensing.
  "MPL-2.0",
]);

// Allowlist for individual packages whose license string is non-SPDX
// or unusual but has been manually reviewed and approved. Add a reason
// for each entry so a future reader understands why we made the
// exception.
const ALLOWED_PACKAGES: Record<string, { license: string; reason: string }> = {
  // sharp ships native libvips binaries under LGPL-3.0-or-later.
  // LGPL permits dynamic linking from non-(L)GPL code without relicensing,
  // which is how Next.js Image / sharp consumes it. Reviewed 2026-04.
  "@img/sharp-libvips-darwin-arm64": {
    license: "LGPL-3.0-or-later",
    reason:
      "Native libvips binary used via dynamic loading from sharp; LGPL permits this without relicensing the consumer.",
  },
  "@img/sharp-libvips-darwin-x64": {
    license: "LGPL-3.0-or-later",
    reason:
      "Native libvips binary used via dynamic loading from sharp; LGPL permits this without relicensing the consumer.",
  },
  "@img/sharp-libvips-linux-arm64": {
    license: "LGPL-3.0-or-later",
    reason:
      "Native libvips binary used via dynamic loading from sharp; LGPL permits this without relicensing the consumer.",
  },
  "@img/sharp-libvips-linux-x64": {
    license: "LGPL-3.0-or-later",
    reason:
      "Native libvips binary used via dynamic loading from sharp; LGPL permits this without relicensing the consumer.",
  },
  "@img/sharp-libvips-linuxmusl-arm64": {
    license: "LGPL-3.0-or-later",
    reason:
      "Native libvips binary used via dynamic loading from sharp; LGPL permits this without relicensing the consumer.",
  },
  "@img/sharp-libvips-linuxmusl-x64": {
    license: "LGPL-3.0-or-later",
    reason:
      "Native libvips binary used via dynamic loading from sharp; LGPL permits this without relicensing the consumer.",
  },
  "@img/sharp-libvips-win32-x64": {
    license: "LGPL-3.0-or-later",
    reason:
      "Native libvips binary used via dynamic loading from sharp; LGPL permits this without relicensing the consumer.",
  },

  // seq-queue omits a license field in package.json. Its repository
  // (github.com/wandoulabs/zookeeper) actually ships under MIT. Pulled
  // in transitively by mysql; safe to use. Reviewed 2026-04.
  "seq-queue": {
    license: "MIT (declared in repo, missing in package.json)",
    reason: "Upstream repository declares MIT; omission from package.json is a packaging bug.",
  },

  // buffers omits the `license` field in package.json. Its upstream
  // repository (github.com/substack/node-buffers) is MIT — same as the
  // rest of the substack utility set. Pulled in transitively by
  // `exceljs → unzipper → binary`. Reviewed 2026-04.
  buffers: {
    license: "MIT (declared in repo, missing in package.json)",
    reason:
      "Upstream repository declares MIT; omission from package.json is a packaging bug. Pulled in via exceljs → unzipper → binary.",
  },
};

// Outright forbidden licenses — fail loudly even if a developer adds
// them to ALLOWED_PACKAGES by mistake.
//
// Three families are denied:
//   1. Strong copyleft (AGPL/GPL/LGPL): would relicense Trustalo on
//      distribution, and AGPL §13 triggers on network use which is
//      directly hostile to a SaaS deployment.
//   2. Source-available "anti-cloud" licenses (SSPL/BUSL/Elastic/RSAL/
//      FSL/PolyForm): explicitly prohibit offering the software as a
//      hosted service, which is exactly what Trustalo does.
//   3. Add-on restrictions (Commons-Clause): combined with otherwise
//      permissive licenses to forbid commercial / SaaS use.
const DENY_LICENSES = new Set([
  "AGPL-1.0",
  "AGPL-1.0-only",
  "AGPL-1.0-or-later",
  "AGPL-3.0",
  "AGPL-3.0-only",
  "AGPL-3.0-or-later",
  "GPL-1.0",
  "GPL-1.0-only",
  "GPL-1.0-or-later",
  "GPL-2.0",
  "GPL-2.0-only",
  "GPL-2.0-or-later",
  "GPL-3.0",
  "GPL-3.0-only",
  "GPL-3.0-or-later",
  "LGPL-2.0",
  "LGPL-2.1",
  "LGPL-3.0",
  "LGPL-3.0-only",
  "LGPL-3.0-or-later",

  // MongoDB-authored copyleft that extends AGPL §13 to require
  // releasing the entire SaaS stack. Hostile to commercial hosting.
  "SSPL-1.0",
  "Server Side Public License",

  // Business Source License (HashiCorp Terraform/Vault/Consul/Boundary
  // since 2023, MariaDB MaxScale, CockroachDB, etc.). Restricts
  // production / SaaS use until the change date.
  "BUSL-1.1",
  "BSL-1.1",
  "Business Source License 1.1",

  // Elastic License v2 (Elasticsearch, Kibana since 7.11). Forbids
  // offering the software "as a managed service".
  "Elastic-2.0",
  "Elastic-License-2.0",
  "ELv2",

  // Redis Source Available License (Redis since 7.4, RedisJSON,
  // RedisSearch, etc.). Same anti-SaaS clause as ELv2.
  "RSALv2",
  "RSAL-2.0",
  "Redis Source Available License 2.0",

  // Functional Source License (Sentry since 2023, others). Anti-cloud
  // for two years, then converts to Apache-2.0 / MIT.
  "FSL-1.0-Apache-2.0",
  "FSL-1.0-MIT",
  "FSL-1.1-Apache-2.0",
  "FSL-1.1-MIT",

  // PolyForm family — the Noncommercial and Shield variants forbid
  // commercial / competitive use respectively.
  "PolyForm-Noncommercial-1.0.0",
  "PolyForm-Shield-1.0.0",
  "PolyForm-Strict-1.0.0",

  // Add-on clause that strips the right to "sell" software it is
  // applied to. Often paired with Apache-2.0 in SaaS-hostile combos.
  "Commons-Clause",
]);

interface PackageInfo {
  name: string;
  version: string;
  license: string;
  path: string;
  isPrivate: boolean;
}

interface Violation {
  pkg: PackageInfo;
  reason: "denied" | "not_allowed" | "missing";
}

const REPO_ROOT = new URL("..", import.meta.url).pathname;

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/** Normalise a license value from a package.json. Returns "UNKNOWN" if unreadable. */
function normaliseLicense(raw: unknown): string {
  if (!raw) return "UNKNOWN";
  if (typeof raw === "string") {
    // Strip parens around SPDX expressions like "(MIT OR Apache-2.0)".
    return raw.replace(/^\(|\)$/g, "").trim();
  }
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as { type?: string; license?: string };
    if (typeof obj.type === "string") return obj.type;
    if (typeof obj.license === "string") return obj.license;
  }
  return "UNKNOWN";
}

/** Some legacy packages ship `licenses: [{type: "MIT"}]` instead of `license`. */
function readLegacyLicenses(raw: unknown): string | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const types = raw
    .map((entry) =>
      entry && typeof entry === "object" ? (entry as { type?: string }).type : undefined,
    )
    .filter((t): t is string => typeof t === "string");
  if (types.length === 0) return null;
  return types.join(" OR ");
}

/**
 * SPDX expressions like "MIT OR Apache-2.0" are acceptable as long as
 * AT LEAST ONE clause is on the allowlist. Anything containing AND
 * with a denied license is treated as denied.
 */
function evaluateLicense(raw: string): "ok" | "denied" | "not_allowed" {
  const cleaned = raw.replace(/[()]/g, " ").trim();

  // Tokenise on AND/OR while preserving the operators.
  const tokens = cleaned.split(/\s+(AND|OR)\s+/i);
  const clauses: string[] = [];
  const operators: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (i % 2 === 0) clauses.push(tokens[i]?.trim() ?? "");
    else operators.push(tokens[i]?.toUpperCase() ?? "OR");
  }

  // Single-clause license — straight allowlist / denylist check.
  if (clauses.length === 1) {
    const c = clauses[0]!;
    if (DENY_LICENSES.has(c)) return "denied";
    return ALLOWED_LICENSES.has(c) ? "ok" : "not_allowed";
  }

  // Multi-clause:
  //   - OR-joined: we can elect any clause, so accept if AT LEAST ONE is
  //     allowed (and not all are denied). A denied clause is irrelevant
  //     as long as a permissive sibling exists.
  //   - AND-joined: must comply with every clause simultaneously, so
  //     deny if ANY clause is denied or not allowed.
  const allOr = operators.every((op) => op === "OR");
  if (allOr) {
    if (clauses.some((c) => ALLOWED_LICENSES.has(c) && !DENY_LICENSES.has(c))) return "ok";
    if (clauses.every((c) => DENY_LICENSES.has(c))) return "denied";
    return "not_allowed";
  }
  if (clauses.some((c) => DENY_LICENSES.has(c))) return "denied";
  return clauses.every((c) => ALLOWED_LICENSES.has(c)) ? "ok" : "not_allowed";
}

async function readPackage(packageJsonPath: string): Promise<PackageInfo | null> {
  try {
    const raw = await readFile(packageJsonPath, "utf8");
    const json = JSON.parse(raw) as {
      name?: string;
      version?: string;
      license?: unknown;
      licenses?: unknown;
      private?: boolean;
    };
    if (!json.name || !json.version) return null;
    const license =
      normaliseLicense(json.license) === "UNKNOWN"
        ? (readLegacyLicenses(json.licenses) ?? "UNKNOWN")
        : normaliseLicense(json.license);
    return {
      name: json.name,
      version: json.version,
      license,
      path: packageJsonPath,
      isPrivate: json.private === true,
    };
  } catch {
    return null;
  }
}

/** Walk a node_modules directory looking for package.json files. */
async function walkNodeModules(root: string, out: PackageInfo[], seen: Set<string>): Promise<void> {
  if (!(await exists(root))) return;
  let entries: string[] = [];
  try {
    entries = await readdir(root);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry === ".bin" || entry === ".cache" || entry === ".vite") continue;
    const full = join(root, entry);

    if (entry.startsWith("@")) {
      // Scoped namespace — recurse one level.
      let scopedEntries: string[] = [];
      try {
        scopedEntries = await readdir(full);
      } catch {
        continue;
      }
      for (const scoped of scopedEntries) {
        await collectPackage(join(full, scoped), out, seen);
      }
      continue;
    }

    if (entry === ".bun") {
      // Bun's content-addressed package store: each entry is `<pkg>+<ver>`
      // and contains a single `node_modules/<pkg>/package.json`.
      let bunEntries: string[] = [];
      try {
        bunEntries = await readdir(full);
      } catch {
        continue;
      }
      for (const bunEntry of bunEntries) {
        const innerNm = join(full, bunEntry, "node_modules");
        if (await exists(innerNm)) {
          await walkNodeModules(innerNm, out, seen);
        }
      }
      continue;
    }

    await collectPackage(full, out, seen);
  }
}

async function collectPackage(
  packageDir: string,
  out: PackageInfo[],
  seen: Set<string>,
): Promise<void> {
  const pkgJson = join(packageDir, "package.json");
  if (!(await exists(pkgJson))) return;
  const info = await readPackage(pkgJson);
  if (!info) return;
  const key = `${info.name}@${info.version}`;
  if (seen.has(key)) return;
  seen.add(key);
  out.push(info);

  // Some packages ship nested node_modules (npm's flat-failure case).
  const nested = join(packageDir, "node_modules");
  if (await exists(nested)) {
    await walkNodeModules(nested, out, seen);
  }
}

async function main(): Promise<void> {
  const reportMode = process.argv.includes("--report");
  const packages: PackageInfo[] = [];
  const seen = new Set<string>();

  await walkNodeModules(join(REPO_ROOT, "node_modules"), packages, seen);

  if (packages.length === 0) {
    console.error(
      "[license-check] No packages found under node_modules/. Did you run `bun install`?",
    );
    process.exit(2);
  }

  const violations: Violation[] = [];
  const summary = new Map<string, number>();

  for (const pkg of packages) {
    if (pkg.isPrivate) continue; // workspace packages own their own license

    summary.set(pkg.license, (summary.get(pkg.license) ?? 0) + 1);

    const allow = ALLOWED_PACKAGES[pkg.name];
    if (allow) continue;

    if (pkg.license === "UNKNOWN") {
      violations.push({ pkg, reason: "missing" });
      continue;
    }

    const verdict = evaluateLicense(pkg.license);
    if (verdict === "denied") violations.push({ pkg, reason: "denied" });
    else if (verdict === "not_allowed") violations.push({ pkg, reason: "not_allowed" });
  }

  if (reportMode) {
    console.log("\nLicense distribution");
    console.log("────────────────────");
    const sorted = [...summary.entries()].sort((a, b) => b[1] - a[1]);
    for (const [license, count] of sorted) {
      console.log(`  ${count.toString().padStart(4)}  ${license}`);
    }
    console.log(`\nTotal third-party packages scanned: ${packages.length}`);
  }

  if (violations.length === 0) {
    console.log(`\n✓ License check passed (${packages.length} packages scanned).`);
    return;
  }

  console.error(`\n✗ License check FAILED — ${violations.length} violation(s):\n`);
  for (const v of violations) {
    const tag =
      v.reason === "denied" ? "DENIED   " : v.reason === "missing" ? "MISSING  " : "NOT ALLOW";
    console.error(`  ${tag}  ${v.pkg.name}@${v.pkg.version}  →  ${v.pkg.license}`);
  }
  console.error(
    "\nSee scripts/license-check.ts for the allowlist. Add an exception to" +
      " ALLOWED_PACKAGES with a reviewer comment, or replace the dependency.",
  );
  process.exit(1);
}

await main();
