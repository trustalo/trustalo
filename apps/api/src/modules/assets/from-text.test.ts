/**
 * Assets "classify from text" — unit tests, matching the repo's bun:test
 * convention (no DB, no Express boot).
 *
 * Two layers of coverage:
 *
 *   1. `classifyAssetsFromText` with a stub `AIProvider` (same pattern
 *      as `packages/ai/src/extraction/asset-classification.test.ts` and
 *      the questionnaire lite-fallback tests) — verifies the staged
 *      output shape and the tier → Asset-enum mapping.
 *   2. Static source checks over `router.ts` (same style as
 *      `modules/ee-gating.test.ts`) — locks in the advisory contract:
 *      the route rate-limits, resolves via `resolveOrgAI`, audits as
 *      `AssetAIClassification`, never creates Asset rows, and — being a
 *      FREE core utility per docs/ai-features.md — carries no
 *      `assertEnterpriseLicense` gate.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { AIProvider } from "@trustalo/ai";
import {
  assetsFromTextBody,
  classifyAssetsFromText,
  toAssetClassification,
  toAssetCriticality,
  toAssetType,
} from "./from-text.js";

const HERE = dirname(fileURLToPath(import.meta.url));

function providerWithContent(content: string, capture?: (prompt: string) => void): AIProvider {
  return {
    async chat(options) {
      capture?.(options.messages[1]?.content ?? "");
      return { content, model: "test-model" };
    },
  };
}

describe("classifyAssetsFromText", () => {
  test("stages proposals with raw tiers plus a create-ready suggestedAsset", async () => {
    const provider = providerWithContent(
      JSON.stringify({
        proposals: [
          {
            name: "Customer KYC database",
            description: "Postgres cluster holding identity-verification records.",
            sensitivity: "Restricted",
            criticality: "Critical",
            kind: "data_store",
            confidence: 0.95,
            rationale: "Source explicitly states 'KYC' which is regulatory PII.",
          },
          {
            name: "Internal wiki",
            sensitivity: "Internal",
            criticality: "Low",
            confidence: 0.6,
          },
        ],
      }),
    );

    const out = await classifyAssetsFromText(provider, {
      text: "We run a Postgres cluster for KYC and a Confluence wiki for internal docs.",
    });

    expect(out.proposals).toHaveLength(2);
    expect(out.dropped).toBe(0);

    const [kyc, wiki] = out.proposals;
    // Raw tiers preserved for the review card.
    expect(kyc?.proposal.sensitivity).toBe("Restricted");
    expect(kyc?.proposal.criticality).toBe("Critical");
    // Mapped payload matches the existing POST /assets body shape.
    expect(kyc?.suggestedAsset).toEqual({
      name: "Customer KYC database",
      type: "data",
      description: "Postgres cluster holding identity-verification records.",
      classification: "restricted",
      metadata: { criticality: "critical" },
    });
    // Missing `kind` falls back to a virtual software asset.
    expect(wiki?.suggestedAsset.type).toBe("software");
    expect(wiki?.suggestedAsset.classification).toBe("internal");
    expect(wiki?.suggestedAsset.metadata.criticality).toBe("low");
    expect(wiki?.suggestedAsset.description).toBeUndefined();
  });

  test("drops rows with invalid tiers instead of failing the batch", async () => {
    const provider = providerWithContent(
      JSON.stringify({
        proposals: [
          { name: "Good asset", sensitivity: "Confidential", criticality: "High", confidence: 0.8 },
          { name: "Bad asset", sensitivity: "Top Secret", criticality: "High", confidence: 0.8 },
        ],
      }),
    );

    const out = await classifyAssetsFromText(provider, { text: "..." });
    expect(out.proposals).toHaveLength(1);
    expect(out.proposals[0]?.suggestedAsset.classification).toBe("confidential");
    expect(out.dropped).toBe(1);
  });

  test("returns empty proposals (not an error) on unparseable model output", async () => {
    const provider = providerWithContent("not-json");
    const out = await classifyAssetsFromText(provider, { text: "..." });
    expect(out.proposals).toEqual([]);
    expect(out.dropped).toBe(0);
  });

  test("PII never reaches the provider; redaction counts surface", async () => {
    let captured = "";
    const provider = providerWithContent(JSON.stringify({ proposals: [] }), (p) => {
      captured = p;
    });
    const out = await classifyAssetsFromText(provider, {
      text: "Email alice@example.com about the customer DB living at 10.0.1.5.",
    });
    expect(captured).not.toContain("alice@example.com");
    expect(captured).not.toContain("10.0.1.5");
    expect(out.redactions.email).toBe(1);
    expect(out.redactions.ip).toBe(1);
  });

  test("respects maxProposals", async () => {
    const proposals = Array.from({ length: 8 }, (_, i) => ({
      name: `Asset ${i}`,
      sensitivity: "Internal",
      criticality: "Medium",
      confidence: 0.5,
    }));
    const provider = providerWithContent(JSON.stringify({ proposals }));
    const out = await classifyAssetsFromText(provider, { text: "...", maxProposals: 3 });
    expect(out.proposals).toHaveLength(3);
    expect(out.dropped).toBe(5);
  });
});

describe("tier → Asset-enum mapping", () => {
  test("every sensitivity tier maps onto the register's classification enum", () => {
    expect(toAssetClassification("Restricted")).toBe("restricted");
    expect(toAssetClassification("Confidential")).toBe("confidential");
    expect(toAssetClassification("Internal")).toBe("internal");
    expect(toAssetClassification("Public")).toBe("public");
  });

  test("every criticality tier maps onto metadata.criticality", () => {
    expect(toAssetCriticality("Critical")).toBe("critical");
    expect(toAssetCriticality("High")).toBe("high");
    expect(toAssetCriticality("Medium")).toBe("medium");
    expect(toAssetCriticality("Low")).toBe("low");
  });

  test("proposal kinds map onto valid asset types", () => {
    expect(toAssetType("data_store")).toBe("data");
    expect(toAssetType("application")).toBe("software");
    expect(toAssetType("infrastructure")).toBe("cloud_resource");
    expect(toAssetType("endpoint")).toBe("hardware");
    expect(toAssetType("third_party_service")).toBe("service");
    expect(toAssetType("other")).toBe("software");
    expect(toAssetType(undefined)).toBe("software");
  });
});

describe("request body schema", () => {
  test("rejects text shorter than 20 chars", () => {
    expect(assetsFromTextBody.safeParse({ text: "too short" }).success).toBe(false);
  });

  test("accepts a plain paste and an optional cap", () => {
    const parsed = assetsFromTextBody.safeParse({
      text: "Our platform runs a Postgres cluster and a React SPA.",
      maxProposals: 5,
    });
    expect(parsed.success).toBe(true);
  });

  test("caps maxProposals at the extractor's 30-row ceiling", () => {
    const base = { text: "Our platform runs a Postgres cluster and a React SPA." };
    expect(assetsFromTextBody.safeParse({ ...base, maxProposals: 30 }).success).toBe(true);
    expect(assetsFromTextBody.safeParse({ ...base, maxProposals: 31 }).success).toBe(false);
  });
});

describe("POST /assets/from-text · route contract (static source check)", () => {
  const source = readFileSync(resolve(HERE, "router.ts"), "utf8");
  const anchor = 'assetsRouter.post("/from-text"';

  // Same block-extraction trick as ee-gating.test.ts: everything from
  // the route anchor to the next `assetsRouter.<method>(` declaration.
  function routeBlock(): string {
    const start = source.indexOf(anchor);
    expect(start).toBeGreaterThan(-1);
    const tail = source.slice(start + anchor.length);
    const next = tail.match(/\nassetsRouter\.[a-z]+\(/);
    return anchor + tail.slice(0, next?.index ?? tail.length);
  }

  test("rate-limits via the shared context_extraction bucket", () => {
    expect(routeBlock()).toContain('consumeToken(tenantId, "context_extraction"');
  });

  test("resolves the provider through resolveOrgAI (no direct SDK use)", () => {
    expect(routeBlock()).toContain('resolveOrgAI(tenantId, "context_extraction")');
  });

  test("audits the generation as AssetAIClassification", () => {
    expect(routeBlock()).toContain('"AssetAIClassification"');
  });

  test("advisory contract: the route never creates Asset rows", () => {
    expect(routeBlock().includes("asset.create")).toBe(false);
    expect(routeBlock().includes("asset.update")).toBe(false);
  });

  test("free core utility: intentionally NOT license-gated", () => {
    // The CPS 234 bootstrap is documented as Free (core) in
    // docs/ai-features.md — unlike the EE accelerators. Lock that in so
    // a future gating sweep doesn't paywall it by accident.
    expect(routeBlock().includes("assertEnterpriseLicense")).toBe(false);
  });
});
