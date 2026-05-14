import { describe, expect, test } from "bun:test";
import ExcelJS from "exceljs";
import { safeCellText } from "./excel-cell.js";

/**
 * Build an in-memory ExcelJS worksheet for unit testing. Each test
 * crafts a tiny workbook so we never depend on a binary fixture and
 * pin the exact shape (merges, types) we want to exercise.
 */
function makeWorksheet(): { wb: ExcelJS.Workbook; ws: ExcelJS.Worksheet } {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  return { wb, ws };
}

describe("safeCellText", () => {
  test("returns plain string content", () => {
    const { ws } = makeWorksheet();
    ws.getCell("A1").value = "hello";
    expect(safeCellText(ws.getCell("A1"))).toBe("hello");
  });

  test("returns numeric content as string", () => {
    const { ws } = makeWorksheet();
    ws.getCell("A1").value = 42;
    expect(safeCellText(ws.getCell("A1"))).toBe("42");
  });

  test("returns '' for an empty cell instead of throwing", () => {
    const { ws } = makeWorksheet();
    expect(safeCellText(ws.getCell("Z99"))).toBe("");
  });

  test("returns '' for a merged region whose master is null", async () => {
    // This is the regression case: vendor questionnaires often merge
    // a banner row purely for visual layout without populating the
    // master cell. ExcelJS's `MergeValue.toString()` then crashes on
    // `null.toString()` if the caller naïvely reads `.text`.
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");
    ws.mergeCells("A1:C1");
    // Round-trip through xlsx so the merge is materialised exactly
    // the way ExcelJS materialises it on import.
    const buf = await wb.xlsx.writeBuffer();
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buf as unknown as ArrayBuffer);
    const ws2 = wb2.getWorksheet("Sheet1")!;

    // Naïve read should fail; safeCellText must not.
    let naiveThrew = false;
    try {
      void ws2.getCell("B1").text;
    } catch {
      naiveThrew = true;
    }
    expect(naiveThrew).toBe(true);

    expect(safeCellText(ws2.getCell("A1"))).toBe("");
    expect(safeCellText(ws2.getCell("B1"))).toBe("");
    expect(safeCellText(ws2.getCell("C1"))).toBe("");
  });

  test("merged cells with a populated master return master's text", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");
    ws.getCell("A1").value = "Section header";
    ws.mergeCells("A1:C1");
    const buf = await wb.xlsx.writeBuffer();
    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buf as unknown as ArrayBuffer);
    const ws2 = wb2.getWorksheet("Sheet1")!;

    expect(safeCellText(ws2.getCell("A1"))).toBe("Section header");
    expect(safeCellText(ws2.getCell("B1"))).toBe("Section header");
    expect(safeCellText(ws2.getCell("C1"))).toBe("Section header");
  });

  test("handles undefined / null cell argument", () => {
    expect(safeCellText(undefined)).toBe("");
    expect(safeCellText(null)).toBe("");
  });
});
