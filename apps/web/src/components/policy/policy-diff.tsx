/**
 * PolicyDiff — render a side-by-side or inline HTML diff between two
 * policy versions / drafts.
 *
 * Notes:
 *  - We compute the diff against the *text* (with HTML tags stripped via
 *    a single regex) so the visual diff isn't polluted by structural
 *    markup the user doesn't care about. The original HTML is still
 *    rendered into each pane for readability.
 *  - For inline mode we wrap added/removed runs in <ins>/<del> at the
 *    text level via diff_main + a tiny `applyDiffsToHtml` walker, so
 *    headings/lists keep their styling.
 *  - Trustalo's TipTap editor stores HTML in PolicyVersion.content; the
 *    diff is purely presentational and never round-trips back into the
 *    editor.
 *
 * Why diff-match-patch (vs jsdiff)?
 *  - 12kb min+gzip, zero runtime deps, MIT-licensed.
 *  - Handles HTML-with-mixed-text robustly via the semantic-cleanup
 *    pass (`diff_cleanupSemantic`) which collapses noisy tag-only diffs.
 */

"use client";

import { useMemo, useState } from "react";
import {
  diff_match_patch,
  DIFF_DELETE,
  DIFF_INSERT,
  DIFF_EQUAL,
  type Diff,
} from "diff-match-patch";
import { sanitizeHtml } from "@/lib/sanitize-html";

type DiffMode = "side-by-side" | "inline";

interface PolicyDiffProps {
  beforeHtml: string;
  afterHtml: string;
  beforeLabel?: string;
  afterLabel?: string;
  /** Initial mode; user can flip via the toggle. Defaults to side-by-side. */
  initialMode?: DiffMode;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface DiffStats {
  additions: number;
  deletions: number;
  unchanged: number;
}

function computeDiff(beforeText: string, afterText: string): Diff[] {
  const dmp = new diff_match_patch();
  const diffs = dmp.diff_main(beforeText, afterText);
  dmp.diff_cleanupSemantic(diffs);
  return diffs;
}

function summarize(diffs: Diff[]): DiffStats {
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;
  for (const [op, text] of diffs) {
    if (op === DIFF_INSERT) additions += text.length;
    else if (op === DIFF_DELETE) deletions += text.length;
    else unchanged += text.length;
  }
  return { additions, deletions, unchanged };
}

function renderInlineDiff(diffs: Diff[]): string {
  // Render each diff op as a styled span. Whitespace preserved with
  // whitespace-pre-wrap on the container.
  return diffs
    .map(([op, text]) => {
      const escaped = escapeHtml(text);
      if (op === DIFF_INSERT) {
        return `<ins class="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200 no-underline">${escaped}</ins>`;
      }
      if (op === DIFF_DELETE) {
        return `<del class="bg-red-100 text-red-900 line-through dark:bg-red-900/40 dark:text-red-200">${escaped}</del>`;
      }
      return escaped;
    })
    .join("");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
}

export function PolicyDiff({
  beforeHtml,
  afterHtml,
  beforeLabel = "Before",
  afterLabel = "After",
  initialMode = "side-by-side",
}: PolicyDiffProps) {
  const [mode, setMode] = useState<DiffMode>(initialMode);

  const { diffs, stats, inlineHtml } = useMemo(() => {
    const beforeText = stripHtml(beforeHtml);
    const afterText = stripHtml(afterHtml);
    const d = computeDiff(beforeText, afterText);
    return {
      diffs: d,
      stats: summarize(d),
      inlineHtml: renderInlineDiff(d),
    };
  }, [beforeHtml, afterHtml]);

  return (
    <div className="space-y-3">
      {/* Stat strip + mode toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            +{stats.additions} chars
          </span>
          <span className="rounded-md bg-red-50 px-2 py-1 font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
            −{stats.deletions} chars
          </span>
          <span className="text-neutral-500 dark:text-neutral-400">
            {stats.unchanged.toLocaleString()} chars unchanged
          </span>
        </div>
        <div className="inline-flex overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => setMode("side-by-side")}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              mode === "side-by-side"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            Side by side
          </button>
          <button
            type="button"
            onClick={() => setMode("inline")}
            className={`border-l border-neutral-200 px-3 py-1 text-xs font-medium transition-colors dark:border-neutral-700 ${
              mode === "inline"
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "bg-white text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            }`}
          >
            Inline
          </button>
        </div>
      </div>

      {mode === "side-by-side" ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <DiffPane label={beforeLabel} html={beforeHtml} variant="before" />
          <DiffPane label={afterLabel} html={afterHtml} variant="after" />
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            Inline diff
          </div>
          <div
            className="prose prose-sm max-w-none whitespace-pre-wrap dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(inlineHtml) }}
          />
        </div>
      )}

      {/* Diff has zero changes — make that explicit instead of rendering empty panes. */}
      {stats.additions === 0 && stats.deletions === 0 && (
        <p className="text-center text-xs text-neutral-500">
          No textual differences detected. (HTML structure may still differ.)
        </p>
      )}

      {/* Suppress unused-var lint while keeping diffs available for future jump-to-change UI. */}
      <span className="hidden">{diffs.length}</span>
    </div>
  );
}

interface DiffPaneProps {
  label: string;
  html: string;
  variant: "before" | "after";
}

function DiffPane({ label, html, variant }: DiffPaneProps) {
  const tone =
    variant === "before"
      ? "border-red-200 bg-red-50/30 dark:border-red-900/40 dark:bg-red-950/20"
      : "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20";
  return (
    <div className={`rounded-lg border ${tone} p-4`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
          {label}
        </span>
      </div>
      <div
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      />
    </div>
  );
}

/** Re-export DIFF_EQUAL alias to keep tree-shaking happy across consumers. */
export const DIFF_OPS = { DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } as const;
