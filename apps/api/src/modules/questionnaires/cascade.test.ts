import { describe, expect, test } from "bun:test";
import { __test, type XlsxSheetSample } from "./structure-agent.js";

interface ChatCall {
  prompt: string;
  systemPrompt: string;
}

/**
 * Returns a stub `aiClient` whose `chat()` walks through the supplied
 * scripted responses one call at a time. Each entry is either a
 * literal string the stub returns as `content`, or an `Error` it
 * throws (used to simulate timeouts or provider errors).
 */
function stubAiClient(scripted: Array<string | Error | { delayMs: number; content: string }>) {
  const calls: ChatCall[] = [];
  let attempt = 0;
  return {
    calls,
    client: {
      chat: async (opts: {
        messages: Array<{ role: string; content: string }>;
      }): Promise<{ content: string }> => {
        calls.push({
          systemPrompt: opts.messages[0]?.content ?? "",
          prompt: opts.messages[1]?.content ?? "",
        });
        const next = scripted[attempt++];
        if (next === undefined) {
          throw new Error(`stub aiClient ran out of scripted responses (attempt ${attempt})`);
        }
        if (next instanceof Error) throw next;
        if (typeof next === "object") {
          await Bun.sleep(next.delayMs);
          return { content: next.content };
        }
        return { content: next };
      },
    },
  };
}

const sampleSheet: XlsxSheetSample = {
  kind: "xlsx",
  name: "Q&A",
  preview: [
    { A1: "Control ID", B1: "Question", C1: "Response" },
    { A2: "1.1", B2: "Is encryption used for data at rest?" },
    { A3: "1.2", B3: "Are backups tested quarterly?" },
  ],
  merges: [],
  totalRows: 3,
  totalCols: 3,
};

describe("structure-agent cascade", () => {
  test("attempt 1 succeeds → mode is 'strict'", async () => {
    const stub = stubAiClient([
      JSON.stringify({
        kind: "question_table",
        sheetName: "Q&A",
        headerRowIndex: 0,
        questions: [
          {
            key: "q1",
            questionCellA1: "B2",
            answerCellA1: "C2",
          },
        ],
      }),
    ]);

    const result = await __test.mapSingleSheet({
      documentKind: "xlsx",
      sample: sampleSheet,
      aiClient: stub.client,
    });

    expect(result.mode).toBe("strict");
    expect(result.sheet.kind).toBe("question_table");
    expect(stub.calls.length).toBe(1);
  });

  test("invalid JSON on attempt 1 → simplified retry succeeds", async () => {
    const stub = stubAiClient([
      "this is not JSON",
      JSON.stringify({
        kind: "question_table",
        sheetName: "Q&A",
        headerRowIndex: 0,
        questions: [{ key: "q1", questionCellA1: "B2", answerCellA1: "C2" }],
      }),
    ]);

    const result = await __test.mapSingleSheet({
      documentKind: "xlsx",
      sample: sampleSheet,
      aiClient: stub.client,
    });

    expect(result.mode).toBe("strict-retry");
    expect(stub.calls.length).toBe(2);
    // Second attempt must have used the simplified system prompt.
    expect(stub.calls[1]!.systemPrompt).toContain("SIMPLER schema");
  });

  test("schema mismatch on attempt 1 → simplified retry runs", async () => {
    // Strict requires kind/sheetName; this response is technically
    // valid JSON but doesn't fit the discriminated union.
    const stub = stubAiClient([
      JSON.stringify({ result: "skipped" }),
      JSON.stringify({
        kind: "instructions",
        sheetName: "Q&A",
        reason: "no answerable content",
      }),
    ]);

    const result = await __test.mapSingleSheet({
      documentKind: "xlsx",
      sample: sampleSheet,
      aiClient: stub.client,
    });

    expect(result.mode).toBe("strict-retry");
    expect(stub.calls.length).toBe(2);
  });

  test("provider error on attempt 1 → propagates without falling through", async () => {
    const stub = stubAiClient([new Error("[anthropic] auth failed")]);

    await expect(
      __test.mapSingleSheet({
        documentKind: "xlsx",
        sample: sampleSheet,
        aiClient: stub.client,
      }),
    ).rejects.toThrow(/auth failed/);
    // No retry — the same call would re-fail upstream.
    expect(stub.calls.length).toBe(1);
  });

  test("both strict attempts fail JSON → falls through to lite", async () => {
    const stub = stubAiClient([
      "garbage",
      "still garbage",
      JSON.stringify({
        questions: [
          {
            rowIndex: 1,
            questionColumn: "B",
            answerColumn: "C",
            questionText: "Is encryption used for data at rest?",
          },
        ],
      }),
    ]);

    const result = await __test.mapSingleSheet({
      documentKind: "xlsx",
      sample: sampleSheet,
      aiClient: stub.client,
    });

    expect(result.mode).toBe("lite");
    expect(result.sheet.kind).toBe("question_table");
    expect(stub.calls.length).toBe(3);
    // Lite should use a different system prompt.
    expect(stub.calls[2]!.systemPrompt).toContain("flat extraction");
  });
});
