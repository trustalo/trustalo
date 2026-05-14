import { describe, expect, test } from "bun:test";
import { __test, type XlsxSheetSample } from "./structure-agent.js";

describe("lite-mode fallback (xlsx)", () => {
  const sampleSheet: XlsxSheetSample = {
    kind: "xlsx",
    name: "Q&A",
    preview: [
      { A1: "Control ID", B1: "Question", C1: "Response" },
      {
        A2: "1.1",
        B2: "Does your organization have an incident response plan?",
      },
      { A3: "1.2", B3: "Is the plan tested annually?" },
    ],
    merges: [],
    totalRows: 3,
    totalCols: 3,
  };

  test("synthesises answerCellA1 for every question and emits question_table", async () => {
    const liteResponse = JSON.stringify({
      questions: [
        {
          rowIndex: 1,
          questionColumn: "B",
          answerColumn: "C",
          questionText: "Does your organization have an incident response plan?",
        },
        {
          rowIndex: 2,
          questionColumn: "B",
          questionText: "Is the plan tested annually?",
        },
      ],
    });

    const aiClient = {
      chat: async (): Promise<{ content: string }> => ({
        content: liteResponse,
      }),
    };

    const sheet = await __test.mapSingleSheetLiteXlsx(sampleSheet, aiClient);

    expect(sheet.kind).toBe("question_table");
    expect(sheet.sheetName).toBe("Q&A");
    if (sheet.kind !== "question_table") return;

    expect(sheet.questions.length).toBe(2);

    // First question — model gave answerColumn, so it should be used.
    expect(sheet.questions[0]!.questionCellA1).toBe("B2");
    expect(sheet.questions[0]!.answerCellA1).toBe("C2");

    // Second question — answerColumn omitted, should be synthesised
    // to first empty column right of B (in row 3, A3 and B3 are
    // occupied, so answer goes in C3).
    expect(sheet.questions[1]!.questionCellA1).toBe("B3");
    expect(sheet.questions[1]!.answerCellA1).toBe("C3");

    // Every question must have an answerCellA1.
    for (const q of sheet.questions) {
      expect(q.answerCellA1).toMatch(/^[A-Z]+\d+$/);
    }

    // Keys must be unique.
    const keys = sheet.questions.map((q) => q.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("dedupes keys when two entries land on the same row + column", async () => {
    const liteResponse = JSON.stringify({
      questions: [
        {
          rowIndex: 1,
          questionColumn: "B",
          answerColumn: "C",
          questionText: "Question one?",
        },
        {
          rowIndex: 1,
          questionColumn: "B",
          answerColumn: "D",
          questionText: "Question one (variant)?",
        },
      ],
    });

    const aiClient = {
      chat: async (): Promise<{ content: string }> => ({
        content: liteResponse,
      }),
    };

    const sheet = await __test.mapSingleSheetLiteXlsx(sampleSheet, aiClient);
    if (sheet.kind !== "question_table") {
      throw new Error("expected question_table");
    }
    const keys = sheet.questions.map((q) => q.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("drops entries with rowIndex out of preview range", async () => {
    const liteResponse = JSON.stringify({
      questions: [
        { rowIndex: 99, questionColumn: "B", questionText: "ignored" },
        {
          rowIndex: 1,
          questionColumn: "B",
          questionText: "kept",
        },
      ],
    });

    const aiClient = {
      chat: async (): Promise<{ content: string }> => ({
        content: liteResponse,
      }),
    };

    const sheet = await __test.mapSingleSheetLiteXlsx(sampleSheet, aiClient);
    if (sheet.kind !== "question_table") {
      throw new Error("expected question_table");
    }
    expect(sheet.questions.length).toBe(1);
    expect(sheet.questions[0]!.questionText).toBe("kept");
  });

  test("rejects malformed lite responses", async () => {
    const aiClient = {
      chat: async (): Promise<{ content: string }> => ({
        content: "not json at all",
      }),
    };

    await expect(__test.mapSingleSheetLiteXlsx(sampleSheet, aiClient)).rejects.toThrow(
      /invalid JSON/i,
    );
  });
});
