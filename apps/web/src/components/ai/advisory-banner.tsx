/**
 * Phase 5 (AI accelerators): generic AI advisory banner.
 *
 * A reusable, opinionated wrapper used by both the Risk and Vendor
 * detail pages to render an AI-generated suggestion with the same
 * Apply / Dismiss / Refine vocabulary across the product.
 *
 * Design intent:
 *   • Always presented as advisory — never auto-applied. The user
 *     must click "Apply" for the change to land.
 *   • Confidence < 0.5 surfaces a "low-confidence" warning chip so
 *     reviewers slow down on borderline calls.
 *   • Provider/model attribution is visible in the footer so audit
 *     reviewers can trace which deployment + model produced a
 *     suggestion (matches the AuditLog entry written server-side).
 */

import { ReactNode } from "react";

export interface AdvisoryBannerProps {
  title: string;
  subtitle?: string;
  rationale: string;
  confidence: number;
  caveats?: string[];
  modelUsed: string;
  providerSource: "operator" | "org" | "feature";
  generatedAt: string;
  /** The actual suggested values, rendered as KV chips. */
  fields: Array<{ label: string; value: ReactNode; tint?: "blue" | "amber" | "red" | "green" }>;
  applying?: boolean;
  dismissing?: boolean;
  refining?: boolean;
  onApply: () => void;
  onDismiss: () => void;
  onRefine: () => void;
  error?: string | null;
}

export function AdvisoryBanner(props: AdvisoryBannerProps) {
  const lowConfidence = props.confidence < 0.5;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
            AI
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                {props.title}
              </h3>
              <ConfidenceChip value={props.confidence} />
              {lowConfidence && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  Low confidence
                </span>
              )}
            </div>
            {props.subtitle && (
              <p className="mt-0.5 text-xs text-blue-800/80 dark:text-blue-200/80">
                {props.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {/* Composite key: labels can legitimately repeat (e.g. a vendor-tier
            suggestion lists every risk factor under the label "Factor"), so
            `f.label` alone isn't unique. The list is statically rendered and
            never reordered, so suffixing the index is safe and keeps the
            React DevTools key human-readable (e.g. "Factor-0", "Factor-1"). */}
        {props.fields.map((f, i) => (
          <FieldChip key={`${f.label}-${i}`} label={f.label} tint={f.tint}>
            {f.value}
          </FieldChip>
        ))}
      </div>

      <details className="mt-3 group">
        <summary className="cursor-pointer text-xs font-medium text-blue-800 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200">
          Why this suggestion?
        </summary>
        <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-200">
          {props.rationale}
        </p>
        {props.caveats && props.caveats.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              Reviewer caveats
            </div>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-neutral-700 dark:text-neutral-300">
              {props.caveats.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </details>

      {props.error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {props.error}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
          {props.modelUsed} · {sourceLabel(props.providerSource)} · generated{" "}
          {new Date(props.generatedAt).toLocaleTimeString()}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={props.onRefine}
            disabled={props.refining || props.applying || props.dismissing}
            className="rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-800 dark:bg-neutral-900 dark:text-blue-300 dark:hover:bg-neutral-800"
          >
            {props.refining ? "Refining…" : "Refine"}
          </button>
          <button
            type="button"
            onClick={props.onDismiss}
            disabled={props.dismissing || props.applying}
            className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {props.dismissing ? "Dismissing…" : "Dismiss"}
          </button>
          <button
            type="button"
            onClick={props.onApply}
            disabled={props.applying || props.dismissing}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {props.applying ? "Applying…" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfidenceChip({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tint =
    value >= 0.75
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : value >= 0.5
        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tint}`}
    >
      {pct}% confidence
    </span>
  );
}

function FieldChip({
  label,
  tint = "blue",
  children,
}: {
  label: string;
  tint?: "blue" | "amber" | "red" | "green";
  children: ReactNode;
}) {
  const tints = {
    blue: "bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-100",
    amber: "bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100",
    red: "bg-red-100 text-red-900 dark:bg-red-900/60 dark:text-red-100",
    green: "bg-green-100 text-green-900 dark:bg-green-900/60 dark:text-green-100",
  } as const;
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${tints[tint]}`}
    >
      <span className="opacity-70">{label}:</span>
      <span className="font-semibold">{children}</span>
    </div>
  );
}

function sourceLabel(s: "operator" | "org" | "feature"): string {
  switch (s) {
    case "operator":
      return "operator default";
    case "org":
      return "org provider";
    case "feature":
      return "feature override";
  }
}
