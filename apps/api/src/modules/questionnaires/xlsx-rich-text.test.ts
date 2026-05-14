import { describe, expect, test } from "bun:test";
import JSZip from "jszip";
import { extractSharedStrings, extractSheetCells, listSheets } from "./xlsx-rich-text.js";

/**
 * Builds a minimal xlsx zip in-memory containing exactly what each
 * test needs. Avoids shipping any binary fixture files and pins the
 * parser's exact contract: namespace-prefixed text tags, inline
 * strings, multiple sheets.
 */
async function buildXlsx(parts: Record<string, string>): Promise<Buffer> {
  const zip = new JSZip();
  for (const [name, contents] of Object.entries(parts)) {
    zip.file(name, contents);
  }
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer" }));
}

describe("extractSharedStrings", () => {
  test("collects text from namespace-prefixed <t> elements", async () => {
    const sst = `<?xml version="1.0" encoding="UTF-8"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="2" uniqueCount="2">
  <si><t>Plain string</t></si>
  <si><x:t xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main">Prefixed string</x:t></si>
</sst>`;
    const buf = await buildXlsx({ "xl/sharedStrings.xml": sst });

    const strings = await extractSharedStrings(buf);
    expect(strings).toEqual(["Plain string", "Prefixed string"]);
  });

  test("concatenates multiple runs inside one <si>", async () => {
    const sst = `<?xml version="1.0" encoding="UTF-8"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <si>
    <r><t xml:space="preserve">Hello </t></r>
    <r><t>world</t></r>
  </si>
</sst>`;
    const buf = await buildXlsx({ "xl/sharedStrings.xml": sst });

    const strings = await extractSharedStrings(buf);
    expect(strings).toEqual(["Hello world"]);
  });

  test("ignores phonetic <rPh> runs", async () => {
    const sst = `<?xml version="1.0"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <si>
    <t>東京</t>
    <rPh sb="0" eb="2"><t>とうきょう</t></rPh>
  </si>
</sst>`;
    const buf = await buildXlsx({ "xl/sharedStrings.xml": sst });

    const strings = await extractSharedStrings(buf);
    expect(strings).toEqual(["東京"]);
  });

  test("decodes XML entities", async () => {
    const sst = `<?xml version="1.0"?>
<sst><si><t>5 &lt; 10 &amp; ok</t></si></sst>`;
    const buf = await buildXlsx({ "xl/sharedStrings.xml": sst });

    expect(await extractSharedStrings(buf)).toEqual(["5 < 10 & ok"]);
  });

  test("returns [] for non-xlsx buffers", async () => {
    expect(await extractSharedStrings(Buffer.from("not a zip"))).toEqual([]);
  });

  test("returns [] when sharedStrings part is missing", async () => {
    const buf = await buildXlsx({ "xl/workbook.xml": "<workbook/>" });
    expect(await extractSharedStrings(buf)).toEqual([]);
  });
});

describe("listSheets", () => {
  test("maps sheet names to worksheet xml paths via rels", async () => {
    const wb = `<?xml version="1.0"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Cover" sheetId="1" r:id="rId1"/>
    <sheet name="Questions" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`;
    const rels = `<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="x" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="x" Target="worksheets/sheet2.xml"/>
</Relationships>`;
    const buf = await buildXlsx({
      "xl/workbook.xml": wb,
      "xl/_rels/workbook.xml.rels": rels,
    });

    const sheets = await listSheets(buf);
    expect(sheets).toEqual([
      { name: "Cover", xmlPath: "xl/worksheets/sheet1.xml" },
      { name: "Questions", xmlPath: "xl/worksheets/sheet2.xml" },
    ]);
  });

  test("returns [] when relations are missing", async () => {
    const buf = await buildXlsx({
      "xl/workbook.xml": "<workbook><sheets/></workbook>",
    });
    expect(await listSheets(buf)).toEqual([]);
  });
});

describe("extractSheetCells", () => {
  test("resolves shared-string refs and inline strings", async () => {
    const sst = `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <si><t>Question</t></si>
  <si><t>Response</t></si>
</sst>`;
    const sheet = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="s"><v>0</v></c>
      <c r="B1" t="s"><v>1</v></c>
    </row>
    <row r="2">
      <c r="A2" t="inlineStr"><is><t>Inline value</t></is></c>
      <c r="B2"><v>42</v></c>
    </row>
  </sheetData>
</worksheet>`;
    const buf = await buildXlsx({
      "xl/sharedStrings.xml": sst,
      "xl/worksheets/sheet1.xml": sheet,
    });

    const strings = await extractSharedStrings(buf);
    const cells = await extractSheetCells(buf, "xl/worksheets/sheet1.xml", strings);

    expect(cells.get("A1")).toBe("Question");
    expect(cells.get("B1")).toBe("Response");
    expect(cells.get("A2")).toBe("Inline value");
    expect(cells.get("B2")).toBe("42");
  });

  test("returns empty map for missing sheet", async () => {
    const buf = await buildXlsx({});
    const cells = await extractSheetCells(buf, "xl/worksheets/sheet99.xml", []);
    expect(cells.size).toBe(0);
  });
});
