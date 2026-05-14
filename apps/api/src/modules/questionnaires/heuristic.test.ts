import { describe, expect, test } from "bun:test";
import {
  looksLikeHeaderRow,
  looksLikeQuestionLine,
  __test,
  type XlsxSheetSample,
} from "./structure-agent.js";

describe("looksLikeQuestionLine", () => {
  test.each([
    ["Does your organization maintain an information security policy?", true],
    ["Is encryption applied to data at rest?", true],
    ["What is your data retention period", true],
    ["1.1 Provide your incident response procedure", true],
    ["Q3) Describe your access review cadence", true],
    ["List all third-party processors *", true],
    ["This sheet contains general instructions.", false],
    ["", false],
    ["   ", false],
    ["A 1500-character paragraph that is mostly explanation.".repeat(40), false],
  ])("classifies %p", (text, expected) => {
    expect(looksLikeQuestionLine(text)).toBe(expected);
  });
});

describe("looksLikeHeaderRow", () => {
  test("matches the standard CAIQ-style header", () => {
    expect(looksLikeHeaderRow(["Control ID", "Question", "Response", "Comment"])).toBe(true);
  });

  test("matches when only two structural labels are present", () => {
    expect(looksLikeHeaderRow(["Item", "Question", "Notes", "Answer"])).toBe(true);
  });

  test("rejects rows with at most one structural keyword", () => {
    expect(looksLikeHeaderRow(["Vendor name", "Description", "Account manager"])).toBe(false);
  });

  test("ignores oversize cells (paragraphs of instructions)", () => {
    const longBlurb = "x".repeat(80) + "Question";
    expect(looksLikeHeaderRow([longBlurb, longBlurb])).toBe(false);
  });
});

describe("observeXlsxPatterns", () => {
  test("identifies header row + question rows in a CAIQ-style sample", () => {
    const sample: XlsxSheetSample = {
      kind: "xlsx",
      name: "Q&A",
      preview: [
        { A1: "Vendor Assessment", B1: "" },
        { A2: "" },
        { A3: "Control ID", B3: "Question", C3: "Response", D3: "Comment" },
        {
          A4: "1.1",
          B4: "Does your organization have an information security policy?",
        },
        { A5: "1.2", B5: "Is the policy reviewed annually?" },
        { A6: "Section: Access control" },
      ],
      merges: [],
      totalRows: 6,
      totalCols: 4,
    };

    const obs = __test.observeXlsxPatterns(sample);
    expect(obs.headerRowIndex).toBe(2); // 0-based preview index of row 3
    // Source row numbers (1-based) of question-like rows
    expect(obs.questionRows).toContain(4);
    expect(obs.questionRows).toContain(5);
  });
});

describe("trimPreviewToObservations", () => {
  test("keeps header + neighbourhood around question rows", () => {
    const preview: Array<Record<string, string>> = [
      { A1: "Vendor Assessment" },
      { A2: "" },
      { A3: "Control ID", B3: "Question", C3: "Response" },
      { A4: "1.1", B4: "Does your org have a policy?" },
      { A5: "1.2", B5: "Is it reviewed annually?" },
      { A6: "1.3", B6: "Sub-item: who owns it?" },
      { A7: "End of section" },
    ];

    const trimmed = __test.trimPreviewToObservations(preview, {
      headerRowIndex: 2,
      questionRows: [4, 5],
    });

    // Should include header (row 3), and neighbourhoods of 4 and 5,
    // i.e. preview indices 2,3,4,5.
    expect(trimmed.length).toBeGreaterThan(0);
    expect(trimmed.length).toBeLessThan(preview.length);
    expect(trimmed).toContain(preview[2]!);
    expect(trimmed).toContain(preview[3]!);
    expect(trimmed).toContain(preview[4]!);
  });

  test("returns full preview when observations are empty", () => {
    const preview: Array<Record<string, string>> = [{ A1: "x" }];
    const trimmed = __test.trimPreviewToObservations(preview, {
      headerRowIndex: null,
      questionRows: [],
    });
    expect(trimmed).toEqual(preview);
  });
});

describe("pickAnswerColumn", () => {
  test("picks the first empty column to the right", () => {
    const occupied = new Set(["A", "B"]);
    expect(__test.pickAnswerColumn("B", occupied)).toBe("C");
  });

  test("falls back to immediate right when row is unknown", () => {
    expect(__test.pickAnswerColumn("D", undefined)).toBe("E");
  });

  test("skips occupied columns", () => {
    const occupied = new Set(["A", "B", "C", "D"]);
    expect(__test.pickAnswerColumn("A", occupied)).toBe("E");
  });
});
