/**
 * File-format adapters for the questionnaire importer.
 *
 * We parse three formats into a single tabular shape so the rest of
 * the importer (column detection, question creation) stays format-
 * agnostic:
 *
 *   • CSV:  delegated to `csv.ts::parseCsv`. Single source.
 *
 *   • XLSX: SheetJS reads EVERY sheet that looks like a question
 *           table. Each row records its source sheet + header row +
 *           detected question/answer columns so the exporter can
 *           write answers back into the right cell on the right
 *           sheet. Sheets with no detectable question column are
 *           skipped (typical for "Cover", "Instructions", "Legend"
 *           tabs that customers ship alongside the question sheets).
 *
 *   • DOCX: parsed at the OOXML level (not via mammoth's HTML) so
 *           every table cell has a stable `(tableIndex, rowIndex)`
 *           coordinate. We collect rows from EVERY question-shaped
 *           table (a doc can ship multiple). If no usable table is
 *           found we fall back to paragraph-mode — paragraph imports
 *           are NOT round-trippable; their export degrades to CSV.
 *
 * Per-row metadata is what makes round-tripping work: even when the
 * customer's workbook has 12 sheets with different schemas, each
 * answer ends up in its own sheet's answer column at its own row.
 */

import ExcelJS from "exceljs";
import JSZip from "jszip";
import mammoth from "mammoth";
import { detectColumnsWithFallback } from "./csv.js";
import { safeCellText } from "./excel-cell.js";

export interface ParsedRow {
  /** Header → cell value, trimmed. Headers reflect the row's source sheet/table. */
  values: Record<string, string>;
  /** 0-based row index in the source (sheet for xlsx, table for docx, line for csv). */
  sourceRowIndex: number;

  // ── Per-row column detection (set by xlsx/docx parsers; CSV path
  //    leaves these undefined and the router re-detects on the flat
  //    headers list).
  /** Header text of the question column (in this row's source sheet/table). */
  questionColumn?: string;
  /** Header text of the section/category column, if detected. */
  sectionColumn?: string | null;
  /** Header text of the answer column, if detected. */
  answerColumnHeader?: string | null;

  // ── XLSX-only metadata.
  sourceSheetName?: string;
  /** 0-based index of the header row in the source sheet. */
  sourceHeaderRowIndex?: number;

  // ── DOCX-only metadata.
  /** 0-based index of `<w:tbl>` inside `word/document.xml`. */
  sourceTableIndex?: number;
}

export interface ParsedTabular {
  /**
   * Headers from the *primary* sheet/table — the first one that
   * yielded any rows. The downstream router uses this list for the
   * legacy CSV-export fallback. Multi-sheet workbooks rely on the
   * per-row metadata in `rows[].questionColumn` etc. instead.
   */
  headers: string[];
  rows: ParsedRow[];
  /**
   * Convenience summary of what we parsed: one entry per sheet
   * (xlsx) or table (docx) we collected rows from. Useful for
   * audit logs and the success message on import.
   */
  sources: Array<{
    /** xlsx: sheet name. docx: empty string (use `tableIndex`). */
    sheetName?: string;
    /** docx only. */
    tableIndex?: number;
    rowCount: number;
  }>;
  /**
   * `true` when the import is round-trippable back into the original
   * file (xlsx with at least one parseable sheet, or docx where
   * questions were found inside real `<w:tbl>` elements).
   */
  roundTrippable: boolean;
}

// Keep this aligned with the keyword list in `csv.ts::detectColumns`.
const QUESTION_HEADER_HINT =
  /\b(question|control specification|control description|control|requirement|inquiry|item|description|statement|criterion|criteria|assessment|prompt|topic|subject|ask)\b/i;
const MAX_HEADER_SCAN_ROWS = 50;

// ─── Excel ────────────────────────────────────────────────────────

export async function parseExcelToTabular(buffer: Buffer): Promise<ParsedTabular> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);

  const allRows: ParsedRow[] = [];
  const sources: ParsedTabular["sources"] = [];
  let primaryHeaders: string[] = [];

  for (const ws of wb.worksheets) {
    const aoa = worksheetToMatrix(ws);

    const { headers, rows: matrixRows, headerRowIndex } = tabularFromMatrix(aoa);
    if (headers.length === 0 || matrixRows.length === 0) continue;

    // Column detection per sheet — answer columns and even question
    // columns frequently differ across sheets in a single workbook.
    const cols = detectColumnsWithFallback(headers, matrixRows);
    if (!cols.questionColumn) {
      // No identifiable question column on this sheet. Almost always
      // a Cover / Instructions / Glossary tab. Skip silently — it's
      // expected and not an error.
      continue;
    }

    if (primaryHeaders.length === 0) primaryHeaders = headers;

    for (const row of matrixRows) {
      allRows.push({
        ...row,
        questionColumn: cols.questionColumn,
        sectionColumn: cols.sectionColumn,
        answerColumnHeader: cols.answerColumn,
        sourceSheetName: ws.name,
        sourceHeaderRowIndex: headerRowIndex,
      });
    }
    sources.push({ sheetName: ws.name, rowCount: matrixRows.length });
  }

  return {
    headers: primaryHeaders,
    rows: allRows,
    sources,
    roundTrippable: allRows.length > 0,
  };
}

/**
 * Build the dense Array-of-Arrays representation `tabularFromMatrix`
 * expects — one entry per worksheet row index (1-based becomes the
 * AoA's 0-based slot) so the downstream code can treat blank rows as
 * `[]` and keep workbook-row indices stable.
 */
function worksheetToMatrix(ws: ExcelJS.Worksheet): unknown[][] {
  const rows: unknown[][] = [];
  ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const cells: unknown[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cells[colNumber - 1] = safeCellText(cell);
    });
    rows[rowNumber - 1] = cells;
  });
  // Pad any trailing-empty slots with `[]` to mirror the previous
  // SheetJS `blankrows: true` behaviour.
  for (let i = 0; i < rows.length; i++) if (!rows[i]) rows[i] = [];
  return rows;
}

// ─── DOCX ─────────────────────────────────────────────────────────

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

export interface DocxTable {
  /** 0-based index of this <w:tbl> in `word/document.xml`. */
  tableIndex: number;
  rows: string[][];
}

/** Extract every table from a docx buffer in one go — used by the structure agent. */
export async function extractDocxTablesFromBuffer(buffer: Buffer): Promise<DocxTable[]> {
  const zip = await JSZip.loadAsync(buffer);
  const docFile = zip.file("word/document.xml");
  if (!docFile) return [];
  const xml = await docFile.async("string");
  return extractDocxTables(xml);
}

export async function parseDocxToTabular(buffer: Buffer): Promise<ParsedTabular> {
  const zip = await JSZip.loadAsync(buffer);
  const docFile = zip.file("word/document.xml");

  if (docFile) {
    const xml = await docFile.async("string");
    const tables = extractDocxTables(xml);

    const allRows: ParsedRow[] = [];
    const sources: ParsedTabular["sources"] = [];
    let primaryHeaders: string[] = [];

    for (const table of tables) {
      if (table.rows.length < 2) continue;
      const { headers, rows: matrixRows, headerRowIndex } = tabularFromMatrix(table.rows);
      if (headers.length === 0 || matrixRows.length === 0) continue;

      const cols = detectColumnsWithFallback(headers, matrixRows);
      if (!cols.questionColumn) continue; // skip non-question tables

      if (primaryHeaders.length === 0) primaryHeaders = headers;

      for (const row of matrixRows) {
        allRows.push({
          ...row,
          questionColumn: cols.questionColumn,
          sectionColumn: cols.sectionColumn,
          answerColumnHeader: cols.answerColumn,
          sourceTableIndex: table.tableIndex,
          sourceHeaderRowIndex: headerRowIndex,
        });
      }
      sources.push({ tableIndex: table.tableIndex, rowCount: matrixRows.length });
    }

    if (allRows.length > 0) {
      return {
        headers: primaryHeaders,
        rows: allRows,
        sources,
        roundTrippable: true,
      };
    }
  }

  // Fallback: paragraph-as-row. NOT round-trippable.
  const text = (await mammoth.extractRawText({ buffer })).value;
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const looksQuestion = (l: string): boolean =>
    l.endsWith("?") || /^\d+\s*[.)]/.test(l) || /^[•\-\*]/.test(l);

  const filtered = lines.filter(looksQuestion);
  const useLines = filtered.length >= 3 ? filtered : lines;

  const rows: ParsedRow[] = useLines.map((raw, idx) => {
    const cleaned = raw.replace(/^(\d+\s*[.)]|[•\-\*])\s*/, "").trim();
    return {
      values: { Question: cleaned },
      sourceRowIndex: idx,
      questionColumn: "Question",
      sectionColumn: null,
      answerColumnHeader: null,
    };
  });

  return {
    headers: ["Question"],
    rows,
    sources: [],
    roundTrippable: false,
  };
}

/** Walk `word/document.xml` and emit a list of tables with their cell text. */
export function extractDocxTables(xml: string): DocxTable[] {
  const tables: DocxTable[] = [];
  const tableRegex = /<w:tbl\b[\s\S]*?<\/w:tbl>/g;
  let tableIdx = 0;
  for (const tableMatch of xml.matchAll(tableRegex)) {
    const tableXml = tableMatch[0];
    const rows: string[][] = [];

    const rowRegex = /<w:tr\b[\s\S]*?<\/w:tr>/g;
    for (const rowMatch of tableXml.matchAll(rowRegex)) {
      const rowXml = rowMatch[0];
      const cells: string[] = [];
      const cellRegex = /<w:tc\b[\s\S]*?<\/w:tc>/g;
      for (const cellMatch of rowXml.matchAll(cellRegex)) {
        cells.push(extractDocxCellText(cellMatch[0]));
      }
      if (cells.length > 0) rows.push(cells);
    }

    tables.push({ tableIndex: tableIdx, rows });
    tableIdx++;
  }
  return tables;
}

function extractDocxCellText(cellXml: string): string {
  const out: string[] = [];
  const paraRegex = /<w:p\b[\s\S]*?<\/w:p>/g;
  for (const paraMatch of cellXml.matchAll(paraRegex)) {
    const runs: string[] = [];
    const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
    for (const tMatch of paraMatch[0].matchAll(tRegex)) {
      runs.push(decodeXmlEntities(tMatch[1] ?? ""));
    }
    if (runs.length > 0) out.push(runs.join(""));
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// ─── Shared: matrix → headers + ParsedRow[] (with header-row detection) ───

interface MatrixToTabularResult {
  headers: string[];
  headerRowIndex: number;
  rows: ParsedRow[];
}

function tabularFromMatrix(aoa: unknown[][]): MatrixToTabularResult {
  const headerRowIndex = Math.max(0, findHeaderRowIndex(aoa));
  const rawHeaders = (aoa[headerRowIndex] ?? []).map((c) => String(c ?? "").trim());

  let lastNonEmpty = -1;
  for (let i = 0; i < rawHeaders.length; i++) {
    if (rawHeaders[i]) lastNonEmpty = i;
  }
  const headers = rawHeaders
    .slice(0, lastNonEmpty + 1)
    .map((h, i) => (h.length > 0 ? h : `Column ${i + 1}`));

  if (headers.length === 0) return { headers: [], headerRowIndex, rows: [] };

  const rows: ParsedRow[] = [];
  for (let r = headerRowIndex + 1; r < aoa.length; r++) {
    const cells = (aoa[r] ?? []) as unknown[];
    const obj: Record<string, string> = {};
    let hasContent = false;
    for (let c = 0; c < headers.length; c++) {
      const value = String(cells[c] ?? "").trim();
      obj[headers[c]!] = value;
      if (value.length > 0) hasContent = true;
    }
    if (hasContent) {
      rows.push({ values: obj, sourceRowIndex: r });
    }
  }

  return { headers, headerRowIndex, rows };
}

function findHeaderRowIndex(aoa: unknown[][]): number {
  const limit = Math.min(aoa.length, MAX_HEADER_SCAN_ROWS);
  for (let i = 0; i < limit; i++) {
    const row = (aoa[i] ?? []) as unknown[];
    if (row.some((c) => QUESTION_HEADER_HINT.test(String(c ?? "")))) return i;
  }
  return 0;
}

// Re-export the namespace for tests / writers that need it.
export const DOCX_NS = W_NS;
