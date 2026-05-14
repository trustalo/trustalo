/**
 * Spreadsheet A1 reference helpers.
 *
 * Standalone — does not depend on any specific Excel library — so the
 * questionnaires module can switch parser implementations (xlsx,
 * exceljs, raw OOXML, …) without rewiring every call site that needs
 * to encode or decode a cell address.
 *
 * All row/col indices in this module are **0-based** (so `A1` is
 * `{ r: 0, c: 0 }`), matching the convention SheetJS used and the one
 * the structure agent's prompts already encode against.
 */

export interface CellAddress {
  /** 0-based row index. */
  r: number;
  /** 0-based column index. */
  c: number;
}

export interface RangeAddress {
  /** Top-left of the range (inclusive). */
  s: CellAddress;
  /** Bottom-right of the range (inclusive). */
  e: CellAddress;
}

const A1_PATTERN = /^([A-Z]+)(\d+)$/;

/** Convert a 0-based column index to its column letter(s) — e.g. `0 → "A"`, `26 → "AA"`. */
export function colLetter(index: number): string {
  if (!Number.isFinite(index) || index < 0) {
    throw new Error(`colLetter: invalid index ${index}`);
  }
  let n = index;
  let result = "";
  do {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return result;
}

/** Convert a column letter (e.g. `"AA"`) to a 0-based column index. */
export function colIndex(letter: string): number {
  if (!letter || !/^[A-Z]+$/.test(letter)) {
    throw new Error(`colIndex: invalid column letter ${JSON.stringify(letter)}`);
  }
  let n = 0;
  for (const ch of letter) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** Encode a 0-based `{r,c}` to its A1 cell ref — e.g. `{r:0,c:0} → "A1"`. */
export function encodeCell(addr: CellAddress): string {
  return `${colLetter(addr.c)}${addr.r + 1}`;
}

/** Decode an A1 cell ref to 0-based `{r,c}`. Throws on malformed input. */
export function decodeCell(a1: string): CellAddress {
  const m = A1_PATTERN.exec(a1);
  if (!m) throw new Error(`decodeCell: invalid A1 reference ${JSON.stringify(a1)}`);
  return { c: colIndex(m[1]!), r: Number.parseInt(m[2]!, 10) - 1 };
}

/**
 * Encode an inclusive range to its A1 form — e.g. `"A1:B3"`. A
 * single-cell range collapses to just one A1 ref so the output stays
 * a valid A1 range that the round-trip writer accepts.
 */
export function encodeRange(range: RangeAddress): string {
  const s = encodeCell(range.s);
  const e = encodeCell(range.e);
  return s === e ? s : `${s}:${e}`;
}

/**
 * Decode an A1 range. Accepts both `"A1:B3"` and a single cell
 * (`"A1"`, treated as a 1×1 range).
 */
export function decodeRange(ref: string): RangeAddress {
  const parts = ref.split(":");
  const s = decodeCell(parts[0]!);
  const e = parts[1] ? decodeCell(parts[1]) : { ...s };
  return { s, e };
}
