import { describe, expect, test } from "bun:test";
import type { AIProvider } from "../types.js";
import {
  ASSET_CRITICALITY_TIERS,
  ASSET_SENSITIVITY_TIERS,
  extractAssetClassifications,
} from "./asset-classification.js";

function providerWithContent(content: string, capture?: (prompt: string) => void): AIProvider {
  return {
    async chat(options) {
      capture?.(options.messages[1]?.content ?? "");
      return { content, model: "test-model" };
    },
  };
}

describe("extractAssetClassifications", () => {
  test("returns validated proposals for clean input", async () => {
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

    const out = await extractAssetClassifications(provider, {
      text: "We run a Postgres cluster for KYC and a Confluence wiki for internal docs.",
    });

    expect(out.proposals).toHaveLength(2);
    expect(out.proposals[0]?.name).toBe("Customer KYC database");
    expect(out.proposals[0]?.sensitivity).toBe("Restricted");
    expect(out.proposals[0]?.criticality).toBe("Critical");
    expect(out.dropped).toBe(0);
  });

  test("drops proposals with invalid sensitivity tier (partial rescue)", async () => {
    const provider = providerWithContent(
      JSON.stringify({
        proposals: [
          {
            name: "Good asset",
            sensitivity: "Confidential",
            criticality: "High",
            confidence: 0.8,
          },
          // Bad sensitivity tier — must be dropped, not crash the batch.
          {
            name: "Bad asset",
            sensitivity: "Top Secret",
            criticality: "High",
            confidence: 0.8,
          },
        ],
      }),
    );

    const out = await extractAssetClassifications(provider, { text: "..." });
    expect(out.proposals).toHaveLength(1);
    expect(out.proposals[0]?.name).toBe("Good asset");
    expect(out.dropped).toBe(1);
  });

  test("drops proposals with invalid criticality tier", async () => {
    const provider = providerWithContent(
      JSON.stringify({
        proposals: [
          {
            name: "Bad criticality",
            sensitivity: "Confidential",
            criticality: "Catastrophic",
            confidence: 0.5,
          },
        ],
      }),
    );
    const out = await extractAssetClassifications(provider, { text: "..." });
    expect(out.proposals).toHaveLength(0);
    expect(out.dropped).toBe(1);
  });

  test("returns empty proposals on non-JSON content", async () => {
    const provider = providerWithContent("not-json");
    const out = await extractAssetClassifications(provider, { text: "..." });
    expect(out.proposals).toEqual([]);
    expect(out.dropped).toBe(0);
  });

  test("handles ```json fenced output", async () => {
    const provider = providerWithContent(
      `\`\`\`json\n${JSON.stringify({
        proposals: [
          {
            name: "Fenced asset",
            sensitivity: "Public",
            criticality: "Low",
            confidence: 0.4,
          },
        ],
      })}\n\`\`\``,
    );
    const out = await extractAssetClassifications(provider, { text: "..." });
    expect(out.proposals).toHaveLength(1);
    expect(out.proposals[0]?.name).toBe("Fenced asset");
  });

  test("respects the maxProposals cap", async () => {
    const proposals = Array.from({ length: 8 }, (_, i) => ({
      name: `Asset ${i}`,
      sensitivity: "Internal",
      criticality: "Medium",
      confidence: 0.5,
    }));
    const provider = providerWithContent(JSON.stringify({ proposals }));
    const out = await extractAssetClassifications(provider, {
      text: "...",
      maxProposals: 3,
    });
    expect(out.proposals).toHaveLength(3);
    expect(out.dropped).toBe(5);
  });

  test("scrubs PII before sending to provider", async () => {
    let captured = "";
    const provider = providerWithContent(JSON.stringify({ proposals: [] }), (p) => {
      captured = p;
    });
    await extractAssetClassifications(provider, {
      text: "Email me at alice@example.com to access the customer DB at 10.0.1.5.",
    });
    expect(captured).not.toContain("alice@example.com");
    expect(captured).not.toContain("10.0.1.5");
    expect(captured).toContain("[email]");
    expect(captured).toContain("[ip]");
  });

  test("returns empty proposals when source mentions no assets", async () => {
    const provider = providerWithContent(JSON.stringify({ proposals: [] }));
    const out = await extractAssetClassifications(provider, {
      text: "We had a great Q3 — strong revenue growth across all regions.",
    });
    expect(out.proposals).toEqual([]);
    expect(out.dropped).toBe(0);
  });

  test("exposes the documented tier vocabularies", () => {
    expect(ASSET_SENSITIVITY_TIERS).toEqual(["Restricted", "Confidential", "Internal", "Public"]);
    expect(ASSET_CRITICALITY_TIERS).toEqual(["Critical", "High", "Medium", "Low"]);
  });

  test("rescue path also enforces the 30-row ceiling", async () => {
    // Provide a payload where the top-level shape parses but item count exceeds the cap.
    const proposals = Array.from({ length: 50 }, (_, i) => ({
      name: `Asset ${i}`,
      // Insert one bad row to force the rescue branch.
      sensitivity: i === 0 ? "BAD_TIER" : "Internal",
      criticality: "Medium",
      confidence: 0.5,
    }));
    const provider = providerWithContent(JSON.stringify({ proposals }));
    const out = await extractAssetClassifications(provider, { text: "..." });
    // ceiling default is 30; we expect <=30 valid rows + dropped tail.
    expect(out.proposals.length).toBeLessThanOrEqual(30);
    expect(out.dropped).toBeGreaterThan(0);
  });
});
