/**
 * Defensive readers for ExcelJS cell values.
 *
 * ExcelJS's `cell.text` getter crashes on merged-cell layouts where
 * the master cell's value is `null` — common in vendor-supplied
 * questionnaires that merge regions purely for visual layout (banner
 * rows, decorative headers) without populating the master cell.
 *
 *   `MergeValue.toString()` → `this.value.toString()` → `null.toString()` ⟹ TypeError
 *
 * Reading those cells is fundamental to extracting the workbook's
 * content, so a single null master would otherwise abort the entire
 * import. `safeCellText` shields callers from that and any analogous
 * bug elsewhere in ExcelJS by:
 *
 *   1. Returning "" up-front for `Null` cells (cheap exit, no getter).
 *   2. For `Merge` cells, checking the master's raw value first and
 *      returning "" when it's `null`/`undefined` rather than letting
 *      the getter throw.
 *   3. Wrapping the actual `cell.text` access in `try/catch` as a
 *      final safety net.
 */

import ExcelJS from "exceljs";

/** Read a cell's user-visible text without ever throwing. */
export function safeCellText(cell: ExcelJS.Cell | undefined | null): string {
  if (!cell) return "";

  const type = cell.type;
  if (type === ExcelJS.ValueType.Null) return "";

  if (type === ExcelJS.ValueType.Merge) {
    const master = cell.master;
    if (!master || master === cell) return "";
    const value = master.value;
    if (value === null || value === undefined) return "";
    // Master has content — fall through to its own `.text`, since
    // that gives us the formatted/displayed string (formula results,
    // dates, richText runs, …) rather than the raw value object.
    try {
      return String(master.text ?? "");
    } catch {
      return "";
    }
  }

  try {
    const t = cell.text;
    return typeof t === "string" ? t : String(t ?? "");
  } catch {
    return "";
  }
}
