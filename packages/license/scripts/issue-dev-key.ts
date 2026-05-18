#!/usr/bin/env bun
//
// Issue a Trustalo Enterprise License DEVELOPER token for local
// engineering use. The dev key has tier="developer" and is REJECTED in
// production, so it cannot accidentally be used as a real license.
//
// Workflow for an engineer who wants to run EE features locally:
//   1. Run this script. It generates a fresh keypair AND issues a key.
//   2. Copy the printed `TRUSTALO_LICENSE_DEV_PUBLIC_KEY_JWK=...` and
//      `TRUSTALO_LICENSE_KEY=...` into the local .env.
//   3. Restart the dev server. EE features now work.
//
// The dev keypair lives only in your shell history / .env. It is not
// trusted by production builds (NODE_ENV=production rejects developer
// tier keys), so it is safe to share within the team.

import { LicenseValidator } from "../src/index.js";

const features = (process.argv[2] ?? "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (features.length === 0) features.push("*");

const expiresInDays = Number.parseInt(process.argv[3] ?? "30", 10);
if (!Number.isFinite(expiresInDays) || expiresInDays <= 0) {
  console.error("Usage: bun issue-dev-key.ts [features-csv] [days]");
  console.error('Example: bun issue-dev-key.ts "sso,multi-tenant" 30');
  process.exit(1);
}

const { publicJwk, privateJwk } = await LicenseValidator.generateKeypair();
const now = Math.floor(Date.now() / 1000);

const token = await LicenseValidator._issueForTesting({
  privateJwk,
  claims: {
    sub: "local-dev",
    lid: `lic_dev_${Date.now().toString(36)}`,
    tier: "developer",
    features,
    max_users: 0,
    iat: now,
    nbf: now,
    exp: now + expiresInDays * 86400,
  },
});

const banner = "─".repeat(72);
console.log(banner);
console.log("Trustalo Enterprise License — DEVELOPER key");
console.log(banner);
console.log();
console.log("Add these lines to your local .env (NEVER commit):");
console.log();
console.log(`TRUSTALO_LICENSE_DEV_PUBLIC_KEY_JWK='${JSON.stringify(publicJwk)}'`);
console.log(`TRUSTALO_LICENSE_KEY='${token}'`);
console.log();
console.log(banner);
console.log(`Features: ${features.join(", ")}`);
console.log(`Expires:  ${new Date((now + expiresInDays * 86400) * 1000).toISOString()}`);
console.log(banner);
console.log();
console.log("Note: this key is REJECTED in production (NODE_ENV=production).");
