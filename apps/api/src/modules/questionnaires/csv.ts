/**
 * Phase 6 (AI accelerators): minimal RFC 4180-ish CSV parser/serializer.
 *
 * We deliberately avoid a third-party dependency here — the parser is
 * intentionally narrow:
 *   • Comma delimiter
 *   • Double-quoted values, with `""` as escaped quote
 *   • CRLF or LF line endings
 *   • First non-blank row is treated as the header
 *   • Tolerant of trailing empty cells and blank lines
 *
 * The parser is lossless for the round-trip we need (import → answer →
 * export); it's not a general-purpose CSV library. If we later need the
 * full RFC then we add a dep — but for now, ~80 lines beats a 200KB
 * package on the cold-start path.
 */

export interface ParsedCsvRow {
  values: Record<string, string>;
  /** 0-based line index of this row (header is 0; first data row is 1, …). */
  sourceRowIndex: number;
}

export interface ParsedCsv {
  headers: string[];
  rows: ParsedCsvRow[];
  /** Always 0 for CSV (top-most non-blank line is the header). */
  sourceHeaderRowIndex: number;
}

export function parseCsv(text: string): ParsedCsv {
  const cells = tokenize(text);
  // Track each row's original line position so it survives downstream
  // even if blank rows are filtered out.
  const indexed = cells
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => row.some((c) => c.trim().length > 0));
  if (indexed.length === 0) {
    return { headers: [], rows: [], sourceHeaderRowIndex: 0 };
  }

  const headerLine = indexed[0]!;
  const headers = headerLine.row.map((h) => h.trim());
  const rows: ParsedCsvRow[] = [];
  for (let i = 1; i < indexed.length; i++) {
    const { row, idx } = indexed[i]!;
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]!] = (row[j] ?? "").trim();
    }
    rows.push({ values: obj, sourceRowIndex: idx });
  }
  return { headers, rows, sourceHeaderRowIndex: headerLine.idx };
}

export function serializeCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const out: string[] = [];
  out.push(headers.map(escapeCell).join(","));
  for (const row of rows) {
    out.push(headers.map((h) => escapeCell(row[h] == null ? "" : String(row[h]))).join(","));
  }
  return out.join("\r\n") + "\r\n";
}

function escapeCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function tokenize(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cur.push(cell);
        cell = "";
      } else if (ch === "\n" || ch === "\r") {
        cur.push(cell);
        rows.push(cur);
        cur = [];
        cell = "";
        if (ch === "\r" && text[i + 1] === "\n") i++;
      } else {
        cell += ch;
      }
    }
  }
  // Final cell / row
  if (cell.length > 0 || cur.length > 0) {
    cur.push(cell);
    rows.push(cur);
  }
  return rows;
}

// ─── CAIQ / SIG / generic header detection ────────────────────────

export type DetectedColumns = {
  questionColumn: string | null;
  sectionColumn: string | null;
  /** Column reserved for the answer on import (we'll fill on export). */
  answerColumn: string | null;
  format: "caiq" | "sig" | "generic";
};

// Vocabulary observed in real-world third-party risk / SIG-lite /
// vendor-due-diligence / privacy-impact spreadsheets. The detector
// matches whole-word case-insensitive, so partials like "questionId"
// won't trigger.
const QUESTION_KEYWORDS = [
  "question",
  "question description",
  "control specification",
  "control description",
  "control",
  "requirement",
  "requirement description",
  "inquiry",
  "item",
  "item description",
  "description",
  "statement",
  "criterion",
  "criteria",
  "assessment",
  "ask",
  "query",
  "topic",
  "subject",
  "prompt",
];

const SECTION_KEYWORDS = [
  "section",
  "category",
  "domain",
  "control domain",
  "control area",
  "area",
  "group",
  "theme",
  "phase",
  "subcategory",
  "sub-category",
  "family",
];

const ANSWER_KEYWORDS = [
  "answer",
  "response",
  "yes/no/n/a",
  "yes/no/na",
  "y/n/na",
  "y/n",
  "consensus assessment answers",
  "vendor response",
  "supplier response",
];

/**
 * Heuristically picks the question/section/answer columns from a CSV's
 * headers. Recognises CAIQ v4 (`Question`, `Domain`, `Yes/No/N/A`) and
 * Shared Assessments SIG (`Question Description`, `Category`,
 * `Response`) explicitly, and a long list of generic vocabulary as a
 * fallback. If even the keyword fallback misses, callers should use
 * `detectColumnsWithFallback` to bring row data into the picture.
 */
export function detectColumns(headers: string[]): DetectedColumns {
  const lower = headers.map((h) => h.toLowerCase().trim());

  // CAIQ v4 markers (kept as the strongest signal).
  const caiqQuestion =
    headers[lower.findIndex((h) => h === "question" || h === "control specification")];
  const caiqDomain = headers[lower.findIndex((h) => h === "domain" || h === "control domain")];
  const caiqAnswer =
    headers[lower.findIndex((h) => h === "yes/no/n/a" || h === "consensus assessment answers")];

  if (caiqQuestion && caiqDomain) {
    return {
      questionColumn: caiqQuestion,
      sectionColumn: caiqDomain ?? null,
      answerColumn: caiqAnswer ?? null,
      format: "caiq",
    };
  }

  // SIG markers (Shared Assessments).
  const sigQuestion = headers[lower.findIndex((h) => h.includes("question description"))];
  const sigCategory = headers[lower.findIndex((h) => h === "category" || h === "section")];
  const sigAnswer = headers[lower.findIndex((h) => h === "response" || h === "answer")];

  if (sigQuestion) {
    return {
      questionColumn: sigQuestion,
      sectionColumn: sigCategory ?? null,
      answerColumn: sigAnswer ?? null,
      format: "sig",
    };
  }

  // Generic vocabulary fallback.
  const questionIdx = findFirstHeaderMatch(lower, QUESTION_KEYWORDS);
  const sectionIdx = findFirstHeaderMatch(lower, SECTION_KEYWORDS);
  const answerIdx = findFirstHeaderMatch(lower, ANSWER_KEYWORDS);

  return {
    questionColumn: questionIdx >= 0 ? headers[questionIdx]! : null,
    sectionColumn: sectionIdx >= 0 ? headers[sectionIdx]! : null,
    answerColumn: answerIdx >= 0 ? headers[answerIdx]! : null,
    format: "generic",
  };
}

/**
 * Same as `detectColumns` but, when header-keyword matching can't find
 * a question column, falls back to the column whose data values look
 * the most "question-like": the column with the longest average text
 * length. This rescues real-world spreadsheets that use bespoke
 * headings ("Item", "Statement", custom labels) without forcing the
 * user to relabel.
 */
export function detectColumnsWithFallback(
  headers: string[],
  rows: Array<{ values: Record<string, string> } | Record<string, string>>,
): DetectedColumns {
  const detected = detectColumns(headers);
  if (detected.questionColumn) return detected;

  // Accept either the legacy `Record<string,string>` shape or the new
  // `{ values }` shape from `ParsedTabular` / `ParsedCsv`. The
  // `values` property check is "is the value an object" because
  // `Record<string,string>` could also have a `values` key whose
  // value is a plain string — we only want the wrapped row case.
  const flat: Array<Record<string, string>> = rows.map((r) => {
    const wrapped = (r as { values?: unknown }).values;
    if (wrapped && typeof wrapped === "object") {
      return wrapped as Record<string, string>;
    }
    return r as Record<string, string>;
  });
  const longestTextHeader = pickLongestTextColumn(headers, flat, detected.answerColumn);
  if (!longestTextHeader) return detected;

  return { ...detected, questionColumn: longestTextHeader };
}

function findFirstHeaderMatch(lowerHeaders: string[], keywords: string[]): number {
  for (let i = 0; i < lowerHeaders.length; i++) {
    const h = lowerHeaders[i] ?? "";
    if (!h) continue;
    for (const kw of keywords) {
      // Whole-word match against the keyword as a phrase. We test
      // both equality and word-boundary inclusion so multi-word
      // headers like "Question Description" still match "question".
      if (h === kw) return i;
      const re = new RegExp(`\\b${escapeRegExp(kw)}\\b`, "i");
      if (re.test(h)) return i;
    }
  }
  return -1;
}

function pickLongestTextColumn(
  headers: string[],
  rows: Array<Record<string, string>>,
  excludeHeader: string | null,
): string | null {
  if (rows.length === 0 || headers.length === 0) return null;

  const sampleSize = Math.min(rows.length, 50);
  let best: { header: string; avg: number } | null = null;

  for (const header of headers) {
    if (!header) continue;
    if (excludeHeader && header === excludeHeader) continue;

    let total = 0;
    let counted = 0;
    for (let i = 0; i < sampleSize; i++) {
      const cell = (rows[i]?.[header] ?? "").trim();
      if (cell.length > 0) {
        total += cell.length;
        counted++;
      }
    }
    // Need at least half the sample to have content, and average
    // length to be above a "this looks like a sentence" threshold so
    // a wide ID column doesn't win.
    if (counted < Math.max(3, sampleSize / 2)) continue;
    const avg = total / counted;
    if (avg < 20) continue;

    if (!best || avg > best.avg) {
      best = { header, avg };
    }
  }

  return best?.header ?? null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Heuristically infer question type from the question text. */
export function inferQuestionType(text: string): "yes_no" | "short_text" | "long_text" {
  const t = text.toLowerCase();
  if (
    t.startsWith("do you") ||
    t.startsWith("does the ") ||
    t.startsWith("is there") ||
    t.startsWith("are there") ||
    t.startsWith("have you") ||
    t.includes("(yes/no)") ||
    t.match(/^(can|will|may)\s+/i)
  ) {
    return "yes_no";
  }
  if (text.length > 240) return "long_text";
  return "short_text";
}
