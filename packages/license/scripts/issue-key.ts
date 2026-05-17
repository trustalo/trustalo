#!/usr/bin/env bun
//
// Issue a Trustalo Enterprise License token. TRUSTALO-INTERNAL ONLY.
//
// Reads the offline private signing key from the env var
// TRUSTALO_LICENSE_SIGNING_JWK (a JSON-encoded Ed25519 private JWK,
// produced by generate-keypair.ts). Never run this on customer
// infrastructure; never bake the private key into a published image.
//
// Usage:
//   TRUSTALO_LICENSE_SIGNING_JWK='{"kty":"OKP",...}' \
//     bun --filter @trustalo/license license:issue -- \
//       --sub=acme-corp \
//       --features=sso,multi-tenant,ai-premium \
//       --max-users=250 \
//       --expires=365d
//
// Optional flags:
//   --tier=enterprise|developer        (default: enterprise)
//   --lid=lic_<custom>                  (default: random ULID-ish)
//   --not-before=<seconds-from-now>     (default: 0)

import { LicenseValidator } from "../src/index.js";
import type { Ed25519PrivateJwk } from "../src/types.js";

const args = parseArgs(process.argv.slice(2));

const signingJwkRaw = process.env.TRUSTALO_LICENSE_SIGNING_JWK?.trim();
if (!signingJwkRaw) {
  console.error("Error: TRUSTALO_LICENSE_SIGNING_JWK env var is required.");
  console.error("Run generate-keypair.ts to produce one. Never commit private keys.");
  process.exit(1);
}

let privateJwk: Ed25519PrivateJwk;
try {
  privateJwk = JSON.parse(signingJwkRaw) as Ed25519PrivateJwk;
} catch (e) {
  console.error("Error: TRUSTALO_LICENSE_SIGNING_JWK is not valid JSON:", (e as Error).message);
  process.exit(1);
}

const sub = requireArg("sub");
const featuresCsv = requireArg("features");
const features = featuresCsv
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (features.length === 0) {
  console.error("Error: --features must include at least one feature id.");
  process.exit(1);
}

const tier = (args["tier"] ?? "enterprise") as "enterprise" | "developer";
if (tier !== "enterprise" && tier !== "developer") {
  console.error(`Error: --tier must be "enterprise" or "developer" (got "${tier}").`);
  process.exit(1);
}

const maxUsersRaw = args["max-users"] ?? "0";
const maxUsers = Number.parseInt(maxUsersRaw, 10);
if (!Number.isFinite(maxUsers) || maxUsers < 0) {
  console.error(`Error: --max-users must be a non-negative integer (got "${maxUsersRaw}").`);
  process.exit(1);
}

const expiresStr = args["expires"] ?? "365d";
const expiresInSeconds = parseDuration(expiresStr);
if (expiresInSeconds <= 0) {
  console.error(`Error: --expires must be positive (got "${expiresStr}").`);
  process.exit(1);
}

const notBeforeStr = args["not-before"];
const notBeforeOffsetSeconds = notBeforeStr ? parseDuration(notBeforeStr) : 0;

const lid = args["lid"] ?? `lic_${Date.now().toString(36)}_${randomSuffix(8)}`;

const now = Math.floor(Date.now() / 1000);
const token = await LicenseValidator.issue({
  privateJwk,
  claims: {
    sub,
    lid,
    tier,
    features,
    max_users: maxUsers,
    iat: now,
    nbf: now + notBeforeOffsetSeconds,
    exp: now + expiresInSeconds,
  },
});

console.log("\nIssued license token:\n");
console.log(token);
console.log("\nClaims:\n");
console.log(
  JSON.stringify(
    {
      lid,
      sub,
      tier,
      features,
      max_users: maxUsers,
      iat: new Date(now * 1000).toISOString(),
      nbf: new Date((now + notBeforeOffsetSeconds) * 1000).toISOString(),
      exp: new Date((now + expiresInSeconds) * 1000).toISOString(),
    },
    null,
    2,
  ),
);

function requireArg(name: string): string {
  const v = args[name];
  if (!v) {
    console.error(`Error: --${name} is required.`);
    process.exit(1);
  }
  return v;
}

function randomSuffix(len: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Buffer.from(bytes).toString("hex").slice(0, len);
}

function parseDuration(s: string): number {
  const match = /^(\d+)(s|m|h|d|w|y)?$/.exec(s.trim());
  if (!match) return Number.NaN;
  const n = Number.parseInt(match[1] ?? "0", 10);
  switch (match[2] ?? "s") {
    case "s":
      return n;
    case "m":
      return n * 60;
    case "h":
      return n * 3600;
    case "d":
      return n * 86400;
    case "w":
      return n * 604800;
    case "y":
      return n * 31536000;
  }
  return Number.NaN;
}

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
