// EE-feature tests run with the dev license bypass active so we don't
// need to issue a real key per test. The bypass is automatically refused
// in production (NODE_ENV=production), so this is safe to ship.
process.env.TRUSTALO_LICENSE_DEV_BYPASS = "1";

import { describe, expect, test } from "bun:test";
import type { AIProvider } from "../types.js";
import { extractContextProposals, type ExistingContextRef } from "./from-text.ee.js";

function providerWithContent(content: string, capture?: (prompt: string) => void): AIProvider {
  return {
    async chat(options) {
      capture?.(options.messages[1]?.content ?? "");
      return {
        content,
        model: "test-model",
      };
    },
  };
}

const existing: ExistingContextRef[] = [
  { id: "ctx-1", category: "company", question: "Where is production hosted?" },
  { id: "ctx-2", category: "processes", question: "How often are policies reviewed?" },
];

describe("extractContextProposals", () => {
  test("returns validated proposals and drops unknown supersedes ids", async () => {
    const provider = providerWithContent(
      JSON.stringify({
        proposals: [
          {
            category: "company",
            question: "Where is production hosted?",
            answer: "AWS ap-southeast-2.",
            confidence: 0.9,
            supersedesContextId: "ctx-1",
          },
          {
            category: "processes",
            question: "How often are policies reviewed?",
            answer: "Quarterly.",
            confidence: 0.7,
            supersedesContextId: "unknown-id",
          },
        ],
      }),
    );

    const out = await extractContextProposals(provider, {
      text: "We host in AWS ap-southeast-2 and review policies quarterly.",
      existingContext: existing,
    });

    expect(out.proposals).toHaveLength(2);
    expect(out.proposals[0]?.supersedesContextId).toBe("ctx-1");
    expect(out.proposals[1]?.supersedesContextId).toBeUndefined();
    expect(out.redactions).toBeDefined();
  });

  test("returns empty proposals on invalid JSON", async () => {
    const provider = providerWithContent("not-json");
    const out = await extractContextProposals(provider, { text: "hello" });
    expect(out.proposals).toEqual([]);
    expect(out.dropped).toBe(0);
  });

  test("rescues partial arrays when one proposal is malformed", async () => {
    const provider = providerWithContent(
      JSON.stringify({
        proposals: [
          {
            category: "company",
            question: "Where is production hosted?",
            answer: "AWS",
            confidence: 0.8,
          },
          {
            category: "invalid",
            question: "bad",
            answer: "bad",
            confidence: 10,
          },
        ],
      }),
    );

    const out = await extractContextProposals(provider, {
      text: "Production runs in AWS.",
      existingContext: existing,
    });

    expect(out.proposals).toHaveLength(1);
    expect(out.dropped).toBe(1);
  });

  test("enforces proposal cap and truncates existing context references", async () => {
    let capturedPrompt = "";
    const provider = providerWithContent(
      JSON.stringify({
        proposals: Array.from({ length: 25 }).map((_, i) => ({
          category: "company",
          question: `Q${i} where`,
          answer: `A${i}`,
          confidence: 0.6,
        })),
      }),
      (prompt) => {
        capturedPrompt = prompt;
      },
    );
    const manyExisting = Array.from({ length: 100 }).map((_, i) => ({
      id: `ctx-${i}`,
      category: "company" as const,
      question: `Question ${i}`,
    }));

    const out = await extractContextProposals(provider, {
      text: "A".repeat(20_000),
      maxProposals: 99,
      existingContext: manyExisting,
    });

    expect(out.proposals).toHaveLength(20);
    expect(capturedPrompt).toContain("TRUNCATED to first 12000 characters");
    expect(capturedPrompt).toContain("up to 20 fact proposals");
    expect(capturedPrompt).toContain("id=ctx-59");
    expect(capturedPrompt).not.toContain("id=ctx-60");
  });

  test("strips markdown fenced json", async () => {
    const provider = providerWithContent(
      "```json\n" +
        JSON.stringify({
          proposals: [
            {
              category: "team",
              question: "Who owns incidents?",
              answer: "Security team",
              confidence: 0.8,
            },
          ],
        }) +
        "\n```",
    );
    const out = await extractContextProposals(provider, {
      text: "Incidents are owned by security.",
    });
    expect(out.proposals).toHaveLength(1);
  });
});
