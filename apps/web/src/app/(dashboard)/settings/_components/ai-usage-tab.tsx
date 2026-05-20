/**
 * AI usage + adoption dashboard, surfaced as a tab inside Settings.
 *
 * Cross-cutting view that tells operators and CISOs how heavily
 * Trustalo's AI accelerators are being used in their tenant — and,
 * crucially, what fraction of suggestions humans actually accept. A
 * low acceptance rate is a strong signal the prompts or grounding
 * need work; a high acceptance rate signals real productivity gains.
 *
 * Backed by the audit log, so no prompts or completions are surfaced.
 *
 * Lives under /settings (rather than the top-level sidebar) because
 * it's an admin/observability surface, not a daily-driver workflow.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient, type AIUsageDashboard } from "@/lib/api-client";

const RANGE_OPTIONS = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
];

export function AIUsageTab() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<AIUsageDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .getAIUsage(days)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load usage");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const adoptionRate = useMemo(() => {
    if (!data) return null;
    const decided = data.totals.approvals + data.totals.rejections;
    if (decided === 0) return null;
    return Math.round((data.totals.approvals / decided) * 100);
  }, [data]);

  const monthToDateCredits = useMemo(() => {
    if (!data || !data.currentMonthCredits.available) return null;
    if (!data.currentMonthCredits.billedMicrocents) return 0;
    return microcentsToUsd(data.currentMonthCredits.billedMicrocents);
  }, [data]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">AI usage</h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            How often Trustalo&apos;s AI accelerators were invoked, and how often humans accepted
            the suggestion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              type="button"
              onClick={() => setDays(opt.days)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                days === opt.days
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {data && (
        <>
          {/* KPI tiles */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Tile
              label="AI generations"
              value={data.totals.generations}
              hint="Total suggestions across all features"
            />
            <Tile
              label="Credits used (MTD)"
              value={monthToDateCredits == null ? "—" : `USD ${monthToDateCredits.toFixed(2)}`}
              tint="blue"
              hint={
                data.currentMonthCredits.available
                  ? `Current month · ${data.currentMonthCredits.calls ?? 0} calls`
                  : "Available after billing tables are migrated"
              }
            />
            <Tile label="Approved" value={data.totals.approvals} tint="green" />
            <Tile label="Rejected" value={data.totals.rejections} tint="red" />
            <Tile
              label="Acceptance"
              value={adoptionRate == null ? "—" : `${adoptionRate}%`}
              tint={
                adoptionRate == null
                  ? "neutral"
                  : adoptionRate >= 70
                    ? "green"
                    : adoptionRate >= 40
                      ? "blue"
                      : "amber"
              }
              hint="Approved ÷ (approved + rejected)"
            />
          </div>

          {/* Per-feature breakdown */}
          <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <header className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
              By feature
            </header>
            <table className="w-full text-sm">
              <thead className="bg-neutral-50/50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900/40">
                <tr>
                  <th className="px-4 py-2">Feature</th>
                  <th className="px-4 py-2 text-right">Generated</th>
                  <th className="px-4 py-2 text-right">Approved</th>
                  <th className="px-4 py-2 text-right">Rejected</th>
                  <th className="px-4 py-2 text-right">Edited</th>
                  <th className="px-4 py-2 text-right">Acceptance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {data.features.map((f) => (
                  <tr key={f.feature}>
                    <td className="px-4 py-2 font-medium text-neutral-900 dark:text-neutral-100">
                      {f.label}
                    </td>
                    <td className="px-4 py-2 text-right">{f.generations}</td>
                    <td className="px-4 py-2 text-right text-green-700 dark:text-green-400">
                      {f.approvals}
                    </td>
                    <td className="px-4 py-2 text-right text-red-700 dark:text-red-400">
                      {f.rejections}
                    </td>
                    <td className="px-4 py-2 text-right">{f.edits}</td>
                    <td className="px-4 py-2 text-right">
                      {f.acceptanceRate == null ? (
                        <span className="text-neutral-400">—</span>
                      ) : (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            f.acceptanceRate >= 70
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : f.acceptanceRate >= 40
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                          }`}
                        >
                          {f.acceptanceRate}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Daily trend (sparkline-ish bar list) */}
          {data.daily.length > 0 && (
            <section className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h3 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Daily activity
              </h3>
              <DailyBars data={data.daily} />
            </section>
          )}

          {/* Recent activity */}
          <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <header className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
              Recent activity
            </header>
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {data.recent.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-neutral-500">
                  No AI activity in this window.
                </li>
              )}
              {data.recent.map((entry, i) => (
                <li key={i} className="flex items-start justify-between gap-3 px-4 py-2 text-sm">
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                      {entry.feature ?? entry.resource} ·{" "}
                      <span className="font-normal">
                        {describeAction(entry.action, entry.decision)}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      {entry.resourceId ?? "—"} · {entry.provider ?? "?"}/{entry.model ?? "?"}
                    </div>
                  </div>
                  <time className="text-xs text-neutral-500" dateTime={entry.at}>
                    {new Date(entry.at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function microcentsToUsd(microcents: string): number {
  const n = Number(microcents);
  if (!Number.isFinite(n)) return 0;
  return n / 1_000_000;
}

function describeAction(action: string, decision: string | null): string {
  if (action === "create") return "AI generated a suggestion";
  if (action === "approve") return `Approved${decision ? ` (${decision})` : ""}`;
  if (action === "reject") return `Rejected${decision ? ` (${decision})` : ""}`;
  if (action === "update") return decision ? `Edited (${decision})` : "Edited";
  return action;
}

function Tile({
  label,
  value,
  hint,
  tint = "neutral",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tint?: "neutral" | "green" | "blue" | "amber" | "red";
}) {
  const tints = {
    neutral: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  } as const;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div
        className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xl font-semibold ${tints[tint]}`}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-neutral-500">{hint}</div>}
    </div>
  );
}

function DailyBars({ data }: { data: { date: string; generations: number; decisions: number }[] }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.generations, d.decisions)));
  return (
    <div className="flex items-end gap-1 overflow-x-auto pb-2">
      {data.map((d) => (
        <div
          key={d.date}
          className="flex flex-col items-center"
          title={`${d.date}: ${d.generations} gen / ${d.decisions} decisions`}
        >
          <div className="flex h-24 w-3 flex-col justify-end gap-0.5">
            <div
              className="w-full rounded-t bg-blue-500"
              style={{ height: `${(d.generations / max) * 100}%` }}
            />
            <div
              className="w-full rounded-t bg-green-500"
              style={{ height: `${(d.decisions / max) * 100}%` }}
            />
          </div>
          <div className="mt-1 w-3 text-center text-[8px] text-neutral-400">{d.date.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}
