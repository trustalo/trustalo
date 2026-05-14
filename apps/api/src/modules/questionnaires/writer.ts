/**
 * Round-trip writers for the questionnaire exporter.
 *
 * The point of these is to give the customer back the *exact same
 * file* they sent, with answers dropped into specific cells. We do
 * NOT re-render or re-style — we mutate the original blob in place
 * so branding, formatting, formulas, merged cells, multi-sheet
 * structure, and styles are preserved.
 *
 * Both writers are A1-driven: every answer carries its exact
 * `(sheetName | tableIndex, answerCellA1)` coordinate, computed at
 * import time by the structure agent. There is no header lookup
 * here — that complexity has moved to the agent, which can reason
 * about ambiguous columns ("Response" appearing twice for main +
 * sub-question) far better than a regex can.
 */

import ExcelJS from "exceljs";
import JSZip from "jszip";
import { decodeCell } from "./a1.js";

export interface AnswerCell {
  /** A1 cell reference, e.g. "F12". */
  a1: string;
  /** Final text to drop into the cell. */
  content: string;
}

// ─── XLSX ─────────────────────────────────────────────────────────

export interface XlsxSheetWriteSpec {
  sheetName: string;
  /** Each entry is one cell to set, identified by A1 ref. */
  answers: AnswerCell[];
}

export interface XlsxWriteInput {
  buffer: Buffer;
  sheets: XlsxSheetWriteSpec[];
}

export interface XlsxWriteResult {
  buffer: Buffer;
  written: number;
  /** Cells we couldn't write (sheet missing, malformed A1). */
  skipped: number;
  bySheet: Array<{ sheetName: string; written: number; skipped: number }>;
}

/**
 * Writes answers back into the original xlsx workbook. Each sheet
 * specified in `sheets` is updated independently. Sheets the
 * workbook has but that aren't in `sheets` are left untouched —
 * preserving the customer's other tabs (Cover, Instructions,
 * Glossary, etc.) verbatim.
 */
export async function writeXlsx(input: XlsxWriteInput): Promise<XlsxWriteResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(input.buffer as unknown as ArrayBuffer);

  let totalWritten = 0;
  let totalSkipped = 0;
  const bySheet: XlsxWriteResult["bySheet"] = [];

  for (const spec of input.sheets) {
    const ws = wb.getWorksheet(spec.sheetName);
    if (!ws) {
      const skipped = spec.answers.length;
      totalSkipped += skipped;
      bySheet.push({ sheetName: spec.sheetName, written: 0, skipped });
      continue;
    }

    let written = 0;
    let skipped = 0;

    for (const a of spec.answers) {
      try {
        decodeCell(a.a1); // validate A1 format up-front
      } catch {
        skipped++;
        continue;
      }
      // `getCell` accepts an A1 string and grows the worksheet's
      // dimension automatically; styles on cells inside the existing
      // range are preserved by ExcelJS on write.
      ws.getCell(a.a1).value = a.content;
      written++;
    }

    totalWritten += written;
    totalSkipped += skipped;
    bySheet.push({ sheetName: spec.sheetName, written, skipped });
  }

  const out = await wb.xlsx.writeBuffer();
  const buf = Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer);
  return { buffer: buf, written: totalWritten, skipped: totalSkipped, bySheet };
}

// ─── DOCX ─────────────────────────────────────────────────────────

export interface DocxTableWriteSpec {
  /** 0-based index of the `<w:tbl>` inside `word/document.xml`. */
  tableIndex: number;
  /** A1 refs are interpreted relative to the table grid (A1 = top-left cell). */
  answers: AnswerCell[];
}

export interface DocxWriteInput {
  buffer: Buffer;
  tables: DocxTableWriteSpec[];
}

export interface DocxWriteResult {
  buffer: Buffer;
  written: number;
  skipped: number;
  byTable: Array<{ tableIndex: number; written: number; skipped: number }>;
}

export async function writeDocx(input: DocxWriteInput): Promise<DocxWriteResult> {
  const zip = await JSZip.loadAsync(input.buffer);
  const docFile = zip.file("word/document.xml");
  if (!docFile) {
    throw new Error("docx is missing word/document.xml — cannot round-trip");
  }
  let xml = await docFile.async("string");

  const byTable: DocxWriteResult["byTable"] = [];
  let totalWritten = 0;
  let totalSkipped = 0;

  for (const spec of input.tables) {
    const result = mutateDocxXml({
      xml,
      tableIndex: spec.tableIndex,
      answers: spec.answers,
    });
    xml = result.mutated;
    totalWritten += result.written;
    totalSkipped += result.skipped;
    byTable.push({
      tableIndex: spec.tableIndex,
      written: result.written,
      skipped: result.skipped,
    });
  }

  zip.file("word/document.xml", xml);
  const out = await zip.generateAsync({ type: "nodebuffer" });
  return { buffer: out, written: totalWritten, skipped: totalSkipped, byTable };
}

interface DocxMutateInput {
  xml: string;
  tableIndex: number;
  answers: AnswerCell[];
}

interface DocxMutateResult {
  mutated: string;
  written: number;
  skipped: number;
}

/** Pure function — exposed for unit tests. */
export function mutateDocxXml(input: DocxMutateInput): DocxMutateResult {
  const tables = findTopLevelMatches(input.xml, /<w:tbl\b[\s\S]*?<\/w:tbl>/g);
  const target = tables[input.tableIndex];
  if (!target) {
    return { mutated: input.xml, written: 0, skipped: input.answers.length };
  }

  const rebuilt = rebuildTable(target.text, input.answers);

  const mutated = input.xml.slice(0, target.start) + rebuilt.xml + input.xml.slice(target.end);

  return { mutated, written: rebuilt.written, skipped: rebuilt.skipped };
}

interface SubstringMatch {
  text: string;
  start: number;
  end: number;
}

function findTopLevelMatches(haystack: string, regex: RegExp): SubstringMatch[] {
  const out: SubstringMatch[] = [];
  for (const m of haystack.matchAll(regex)) {
    if (m.index === undefined) continue;
    out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

function rebuildTable(
  tableXml: string,
  answers: AnswerCell[],
): { xml: string; written: number; skipped: number } {
  const rows = findTopLevelMatches(tableXml, /<w:tr\b[\s\S]*?<\/w:tr>/g);
  if (rows.length === 0) {
    return { xml: tableXml, written: 0, skipped: answers.length };
  }

  // Group answers by row so we can edit each <w:tr> in one pass.
  const byRow = new Map<number, AnswerCell[]>();
  let preSkipped = 0;
  for (const a of answers) {
    let coord: { r: number; c: number };
    try {
      coord = decodeCell(a.a1);
    } catch {
      preSkipped++;
      continue;
    }
    const arr = byRow.get(coord.r) ?? [];
    arr.push(a);
    byRow.set(coord.r, arr);
  }

  let written = 0;
  let skipped = preSkipped;
  let cursor = 0;
  let out = "";

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    out += tableXml.slice(cursor, row.start);
    const updates = byRow.get(i);
    if (!updates || updates.length === 0) {
      out += row.text;
    } else {
      let rowXml = row.text;
      // Sort updates right-to-left so cell index offsets remain
      // valid as we splice in new cell bodies.
      updates.sort((a, b) => decodeCell(b.a1).c - decodeCell(a.a1).c);
      for (const upd of updates) {
        const { c } = decodeCell(upd.a1);
        const cells = findTopLevelMatches(rowXml, /<w:tc\b[\s\S]*?<\/w:tc>/g);
        if (cells.length === 0) {
          skipped++;
          continue;
        }
        if (c >= 0 && c < cells.length) {
          const target = cells[c]!;
          const replaced = replaceCellBody(target.text, upd.content);
          rowXml = rowXml.slice(0, target.start) + replaced + rowXml.slice(target.end);
          written++;
        } else {
          // Out-of-range column: append a new cell before </w:tr>.
          const last = cells[cells.length - 1]!;
          const newCell = replaceCellBody(last.text, upd.content);
          const closeIdx = rowXml.lastIndexOf("</w:tr>");
          if (closeIdx === -1) {
            skipped++;
          } else {
            rowXml = rowXml.slice(0, closeIdx) + newCell + rowXml.slice(closeIdx);
            written++;
          }
        }
      }
      out += rowXml;
    }
    cursor = row.end;
  }

  out += tableXml.slice(cursor);
  return { xml: out, written, skipped };
}

function replaceCellBody(cellXml: string, text: string): string {
  // Keep the <w:tcPr> (cell properties) prefix intact so width /
  // borders / shading survive. Replace the rest of the cell body
  // with a single paragraph containing one run with the new text.
  const tcPrMatch = cellXml.match(/<w:tcPr\b[\s\S]*?<\/w:tcPr>/);
  const tcPr = tcPrMatch ? tcPrMatch[0] : "";
  const safe = encodeXml(text);
  return `<w:tc>${tcPr}<w:p><w:r><w:t xml:space="preserve">${safe}</w:t></w:r></w:p></w:tc>`;
}

function encodeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
