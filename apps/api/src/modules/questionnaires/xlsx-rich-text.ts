/**
 * Namespace-aware XLSX rich-text reader.
 *
 * `.xlsx` is a zip of XML files following the OOXML / ECMA-376 spec.
 * The `xlsx` npm library used elsewhere in this module silently drops
 * any text node whose tag carries an XML namespace prefix — e.g.
 * `<x:t>foo</x:t>` or `<d:t>foo</d:t>` — so cells written by some
 * Microsoft / LibreOffice / Smartsheet exports come back as empty
 * strings even though a human opening the same file sees text.
 *
 * This module reads the underlying XML directly and:
 *   1. Extracts the shared-strings table (`xl/sharedStrings.xml`),
 *      concatenating every text node inside each `<si>` element no
 *      matter what its namespace prefix is.
 *   2. Extracts a single sheet's cell values from `xl/worksheets/
 *      sheet{n}.xml`, resolving shared-string references to the
 *      strings produced in step 1.
 *
 * The output of `extractSheetCells` is the same shape the structure
 * agent already consumes — an `A1 -> string` map per row — so it
 * drops in as the primary cell reader for `sampleXlsxSheet`, with
 * the original `xlsx`-library path kept as a fallback when this
 * parser can't read a non-conformant workbook.
 *
 * No dependency on the `xlsx` lib; uses `jszip` (already a project
 * dependency) for the zip side and pure regex / string scanning for
 * the XML side. Avoiding a full XML parser keeps the runtime cost
 * low for documents that are usually <5MB but can have many sheets.
 */

import JSZip from "jszip";

/**
 * Reads `xl/sharedStrings.xml` and returns the shared-string table.
 *
 * Each entry is the concatenated text of all `<t>`-like elements
 * inside the matching `<si>` element. "t-like" means the element's
 * local name is exactly `t`, with or without a namespace prefix —
 * `<t>`, `<x:t>`, `<d:t>`, `<a:t>` are all included. Phonetic-run
 * elements (`<rPh>`, `<phoneticPr>`) are skipped.
 *
 * Returns `[]` if the workbook has no shared-strings part (some
 * workbooks inline all strings into the cells themselves) or the
 * file cannot be opened.
 */
export async function extractSharedStrings(buffer: Buffer): Promise<string[]> {
  const zip = await loadZip(buffer);
  if (!zip) return [];

  const file = zip.file("xl/sharedStrings.xml");
  if (!file) return [];

  const xml = await file.async("string");
  return parseSharedStringsXml(xml);
}

/**
 * Returns the sheets listed in `xl/workbook.xml`, in the order they
 * appear, paired with the path of the worksheet XML file each one
 * resolves to via `xl/_rels/workbook.xml.rels`. Callers should match
 * by `name` rather than position, since some producers reorder rels
 * targets relative to workbook entries.
 *
 * Returns `[]` for non-xlsx buffers or workbooks without a relations
 * part — callers should fall back to a positional reader.
 */
export async function listSheets(
  buffer: Buffer,
): Promise<Array<{ name: string; xmlPath: string }>> {
  const zip = await loadZip(buffer);
  if (!zip) return [];

  const wbFile = zip.file("xl/workbook.xml");
  const relsFile = zip.file("xl/_rels/workbook.xml.rels");
  if (!wbFile || !relsFile) return [];

  const [wbXml, relsXml] = await Promise.all([wbFile.async("string"), relsFile.async("string")]);

  const relsMap = parseRelationships(relsXml);
  const sheetEntries = parseWorkbookSheets(wbXml);

  const result: Array<{ name: string; xmlPath: string }> = [];
  for (const sheet of sheetEntries) {
    const target = relsMap.get(sheet.relId);
    if (!target) continue;
    // Targets in the rels are relative to xl/. Some producers prefix
    // with "/" to mean an absolute zip path; strip the leading slash
    // and otherwise prepend "xl/".
    const xmlPath = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
    result.push({ name: sheet.name, xmlPath });
  }
  return result;
}

/**
 * Reads cell values from a worksheet XML part (`xmlPath` from
 * `listSheets`) and returns a map keyed by A1 cell reference, e.g.
 * `{"A1":"Control No","B1":"Question",...}`.
 *
 * `sharedStrings` MUST be the array returned by
 * `extractSharedStrings(buffer)` — it is consulted whenever a cell
 * has `t="s"`, which means its `<v>` is a 0-based index into the
 * shared-string table.
 *
 * Inline strings (`t="inlineStr"` with `<is><t>...</t></is>`) and
 * boolean / number cells are also handled.
 *
 * Returns an empty `Map` if the sheet part is missing or unreadable.
 */
export async function extractSheetCells(
  buffer: Buffer,
  xmlPath: string,
  sharedStrings: string[],
): Promise<Map<string, string>> {
  const zip = await loadZip(buffer);
  if (!zip) return new Map();

  const file = zip.file(xmlPath);
  if (!file) return new Map();

  const xml = await file.async("string");
  return parseSheetXml(xml, sharedStrings);
}

// ─── Internal helpers ──────────────────────────────────────────────

async function loadZip(buffer: Buffer): Promise<JSZip | null> {
  try {
    return await JSZip.loadAsync(buffer);
  } catch {
    return null;
  }
}

/**
 * Walks an XML fragment and concatenates the text content of every
 * element whose local name is `t`, regardless of namespace prefix.
 * Elements named `rPh` (phonetic ruby text used in some Asian
 * locales) are deliberately skipped — including them would duplicate
 * the visible cell content in the shared-string table.
 */
function concatLocalTextNodes(xmlFragment: string): string {
  const result: string[] = [];

  // Strip <rPh>...</rPh> sections first so their inner <t> tags
  // don't get picked up by the next pass.
  const withoutPhonetic = xmlFragment.replace(
    /<(?:[a-zA-Z_][\w.-]*:)?rPh\b[\s\S]*?<\/(?:[a-zA-Z_][\w.-]*:)?rPh\s*>/g,
    "",
  );

  // Self-closing <t/> contributes empty string and is skipped via
  // the look-ahead requirement that we have a body before the close
  // tag.
  const tagPattern = /<(?:[a-zA-Z_][\w.-]*:)?t\b[^>]*>([\s\S]*?)<\/(?:[a-zA-Z_][\w.-]*:)?t\s*>/g;
  for (const match of withoutPhonetic.matchAll(tagPattern)) {
    result.push(decodeXmlEntities(match[1] ?? ""));
  }

  return result.join("");
}

function parseSharedStringsXml(xml: string): string[] {
  const strings: string[] = [];

  // Each <si>...</si> is one shared-string entry. Inside it there
  // can be a single <t> (plain string) OR multiple runs (<r><t>...
  // </t></r>) for rich-text. Both are handled by concatenating every
  // <t> inside the <si>.
  const siPattern = /<(?:[a-zA-Z_][\w.-]*:)?si\b[^>]*>([\s\S]*?)<\/(?:[a-zA-Z_][\w.-]*:)?si\s*>/g;
  for (const match of xml.matchAll(siPattern)) {
    strings.push(concatLocalTextNodes(match[1] ?? ""));
  }

  return strings;
}

function parseSheetXml(xml: string, sharedStrings: string[]): Map<string, string> {
  const cells = new Map<string, string>();

  // Cell elements look like:
  //   <c r="B12" t="s"><v>42</v></c>            (shared-string ref)
  //   <c r="B12"><v>3.14</v></c>                (number)
  //   <c r="B12" t="b"><v>1</v></c>             (boolean)
  //   <c r="B12" t="inlineStr"><is><t>x</t></is></c>
  //   <c r="B12" t="str"><v>=A1</v></c>         (formula string)
  // Self-closing `<c r="B12" />` is skipped.
  const cellPattern = /<(?:[a-zA-Z_][\w.-]*:)?c\b([^>]*)>([\s\S]*?)<\/(?:[a-zA-Z_][\w.-]*:)?c\s*>/g;

  for (const match of xml.matchAll(cellPattern)) {
    const attrs = match[1] ?? "";
    const body = match[2] ?? "";

    const refMatch = /\br="([A-Z]+\d+)"/.exec(attrs);
    if (!refMatch) continue;
    const ref = refMatch[1]!;

    const typeMatch = /\bt="([^"]+)"/.exec(attrs);
    const cellType = typeMatch?.[1] ?? "n";

    const value = extractCellValue(cellType, body, sharedStrings);
    if (value === "") continue;

    cells.set(ref, value);
  }

  return cells;
}

function extractCellValue(cellType: string, body: string, sharedStrings: string[]): string {
  // Inline strings carry their text directly inside <is>...</is>.
  if (cellType === "inlineStr") {
    const isMatch =
      /<(?:[a-zA-Z_][\w.-]*:)?is\b[^>]*>([\s\S]*?)<\/(?:[a-zA-Z_][\w.-]*:)?is\s*>/.exec(body);
    if (!isMatch) return "";
    return concatLocalTextNodes(isMatch[1] ?? "").trim();
  }

  const vMatch = /<(?:[a-zA-Z_][\w.-]*:)?v\b[^>]*>([\s\S]*?)<\/(?:[a-zA-Z_][\w.-]*:)?v\s*>/.exec(
    body,
  );
  const raw = decodeXmlEntities((vMatch?.[1] ?? "").trim());
  if (!raw) return "";

  switch (cellType) {
    case "s": {
      const idx = Number.parseInt(raw, 10);
      if (!Number.isFinite(idx) || idx < 0 || idx >= sharedStrings.length) {
        return "";
      }
      return sharedStrings[idx]!.trim();
    }
    case "b":
      return raw === "1" ? "TRUE" : "FALSE";
    case "e":
      // Error literal like #DIV/0! — surface it verbatim so the
      // structure agent can choose to skip or label it.
      return raw;
    case "str":
    case "n":
    default:
      return raw;
  }
}

function parseWorkbookSheets(xml: string): Array<{ name: string; relId: string }> {
  const sheets: Array<{ name: string; relId: string }> = [];

  // Matches both <sheet ... /> and <sheet ...></sheet>. Attribute
  // order is not specified by the OOXML schema so we extract each
  // attribute independently.
  const sheetPattern = /<(?:[a-zA-Z_][\w.-]*:)?sheet\b([^>]*?)\/?>/g;
  for (const match of xml.matchAll(sheetPattern)) {
    const attrs = match[1] ?? "";
    const name = /\bname="([^"]*)"/.exec(attrs)?.[1];
    const relId = /\b(?:r:id|relationships:id)="([^"]*)"/.exec(attrs)?.[1];
    if (!name || !relId) continue;
    sheets.push({ name: decodeXmlEntities(name), relId });
  }

  return sheets;
}

function parseRelationships(xml: string): Map<string, string> {
  const map = new Map<string, string>();
  const relPattern = /<Relationship\b([^>]*?)\/?>/g;
  for (const match of xml.matchAll(relPattern)) {
    const attrs = match[1] ?? "";
    const id = /\bId="([^"]*)"/.exec(attrs)?.[1];
    const target = /\bTarget="([^"]*)"/.exec(attrs)?.[1];
    if (!id || !target) continue;
    map.set(id, decodeXmlEntities(target));
  }
  return map;
}

const ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  apos: "'",
  quot: '"',
};

function decodeXmlEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (full, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      const code = Number.parseInt(body.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }
    if (body.startsWith("#")) {
      const code = Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }
    return ENTITY_MAP[body] ?? full;
  });
}
