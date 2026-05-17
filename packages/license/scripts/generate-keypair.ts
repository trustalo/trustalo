#!/usr/bin/env bun
//
// Generate a fresh Ed25519 keypair for signing Trustalo Enterprise License
// tokens. This script is for Trustalo-internal use ONLY:
//
//   1. Run it once.
//   2. Add the printed PUBLIC JWK to packages/license/src/keys.ts
//      (PRODUCTION_PUBLIC_KEYS array).
//   3. Store the printed PRIVATE JWK in Trustalo's offline secret store
//      (1Password / HSM). NEVER commit it.
//
// Usage:
//   bun --filter @trustalo/license license:generate-keypair
//   bun --filter @trustalo/license license:generate-keypair -- --label=production-2026

import { LicenseValidator } from "../src/index.js";

const args = parseArgs(process.argv.slice(2));
const label = args["label"] ?? `trustalo-license-${new Date().toISOString().slice(0, 10)}`;

const { publicJwk, privateJwk } = await LicenseValidator.generateKeypair();

const banner = "═".repeat(72);
console.log(banner);
console.log("Trustalo Enterprise License — new Ed25519 signing keypair");
console.log(banner);
console.log();
console.log(`Label: ${label}`);
console.log();
console.log("PUBLIC JWK — paste into packages/license/src/keys.ts:");
console.log();
console.log("  {");
console.log(`    label: ${JSON.stringify(label)},`);
console.log(`    jwk: ${JSON.stringify(publicJwk, null, 2).split("\n").join("\n    ")},`);
console.log("  },");
console.log();
console.log(banner);
console.log("PRIVATE JWK — STORE OFFLINE. NEVER COMMIT.");
console.log("Pass to issue-key.ts via TRUSTALO_LICENSE_SIGNING_JWK env var:");
console.log();
console.log(JSON.stringify(privateJwk));
console.log();
console.log(banner);

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const a of argv) {
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq === -1) {
      out[a.slice(2)] = "true";
    } else {
      out[a.slice(2, eq)] = a.slice(eq + 1);
    }
  }
  return out;
}
