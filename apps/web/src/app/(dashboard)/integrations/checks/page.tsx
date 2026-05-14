"use client";

/**
 * Phase 3 (AI accelerators): manifest-driven integration checks workspace.
 *
 * The legacy /integrations page lets admins connect provider credentials
 * to the standalone collector service. This sibling page is the audit-
 * focused view: it lists every connected manifest-based integration,
 * shows the status of each automated check (pass / fail / pending),
 * which controls each check satisfies, and provides a "Run now" button
 * that publishes a job onto SQS for the collector worker to execute.
 *
 * Read-only by design — no credential editing here, on purpose: those
 * flows live on the connect page so we keep "manage credentials" and
 * "review evidence" as separate concerns for SoD friendly review.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  apiClient,
  type IntegrationCatalogItem,
  type IntegrationSummary,
  type IntegrationCheckItem,
  type IntegrationCheckStatus,
} from "@/lib/api-client";

const STATUS_STYLES: Record<IntegrationCheckStatus, string> = {
  pass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  fail: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  error: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  skipped: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  pending: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-neutral-400",
};

export default function IntegrationChecksPage() {
  const [catalog, setCatalog] = useState<IntegrationCatalogItem[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationSummary[]>([]);
  const [checksByIntegration, setChecksByIntegration] = useState<
    Record<string, IntegrationCheckItem[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyCheckIds, setBusyCheckIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catalogRes, integrationsRes] = await Promise.all([
        apiClient.listIntegrationCatalog(),
        apiClient.listIntegrations(),
      ]);
      setCatalog(catalogRes.data);
      setIntegrations(integrationsRes.data);

      const checks: Record<string, IntegrationCheckItem[]> = {};
      await Promise.all(
        integrationsRes.data.map(async (integration) => {
          const res = await apiClient.listIntegrationChecks(integration.id);
          checks[integration.id] = res.data;
        }),
      );
      setChecksByIntegration(checks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleRun(integrationId: string, checkId: string) {
    setBusyCheckIds((s) => new Set(s).add(checkId));
    try {
      await apiClient.runIntegrationCheck(integrationId, checkId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to queue check");
    } finally {
      setBusyCheckIds((s) => {
        const next = new Set(s);
        next.delete(checkId);
        return next;
      });
    }
  }

  // Aggregate posture across all checks of every integration; lets the
  // header banner mirror what an auditor would see at a glance.
  const totals = useMemo(() => {
    const all = Object.values(checksByIntegration).flat();
    return {
      total: all.length,
      passing: all.filter((c) => c.lastStatus === "pass").length,
      failing: all.filter((c) => c.lastStatus === "fail" || c.lastStatus === "error").length,
      pending: all.filter((c) => c.lastStatus === "pending").length,
    };
  }, [checksByIntegration]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            Automated Checks
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Continuous evidence collected from your connected systems. Each pass creates an
            automated <code>Evidence</code> row mapped to your controls.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/integrations/custom/new"
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            + Add from prompt
          </Link>
          <Link
            href="/integrations"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Manage connections
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Posture summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryTile label="Total checks" value={totals.total} tint="neutral" />
        <SummaryTile label="Passing" value={totals.passing} tint="green" />
        <SummaryTile label="Failing" value={totals.failing} tint="red" />
        <SummaryTile label="Pending" value={totals.pending} tint="blue" />
      </div>

      {integrations.length === 0 ? (
        <EmptyState catalog={catalog} />
      ) : (
        <div className="space-y-6">
          {integrations.map((integration) => {
            const checks = checksByIntegration[integration.id] ?? [];
            return (
              <section
                key={integration.id}
                className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
              >
                <header className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
                  <div>
                    <h2 className="font-semibold text-neutral-900 dark:text-white">
                      {integration.displayName}
                    </h2>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {integration.connector} · {checks.length} checks
                      {integration.lastSyncAt && (
                        <> · last sync {new Date(integration.lastSyncAt).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      integration.status === "connected"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                    }`}
                  >
                    {integration.status}
                  </span>
                </header>

                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-left dark:bg-neutral-950">
                    <tr>
                      <th className="px-4 py-2 font-medium text-neutral-600 dark:text-neutral-400">
                        Check
                      </th>
                      <th className="px-4 py-2 font-medium text-neutral-600 dark:text-neutral-400">
                        Controls
                      </th>
                      <th className="px-4 py-2 font-medium text-neutral-600 dark:text-neutral-400">
                        Last run
                      </th>
                      <th className="px-4 py-2 font-medium text-neutral-600 dark:text-neutral-400">
                        Status
                      </th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {checks.map((check) => (
                      <tr key={check.id}>
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-start gap-2">
                            <span
                              className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                                SEVERITY_DOT[check.severity] ?? "bg-neutral-400"
                              }`}
                              title={`Severity: ${check.severity}`}
                            />
                            <div>
                              <div className="font-medium text-neutral-900 dark:text-white">
                                {check.title}
                              </div>
                              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                {check.manifestKey}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          {check.controls.length === 0 ? (
                            <span className="text-xs text-neutral-400">No mapping</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {check.controls.map(({ control }) => (
                                <Link
                                  key={control.id}
                                  href={`/controls/${control.id}`}
                                  className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                >
                                  {control.title.slice(0, 32)}
                                  {control.title.length > 32 ? "…" : ""}
                                </Link>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-neutral-500 dark:text-neutral-400">
                          {check.lastRunAt ? new Date(check.lastRunAt).toLocaleString() : "Never"}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[check.lastStatus]}`}
                          >
                            {check.lastStatus}
                          </span>
                          {check.results[0]?.errorMessage && (
                            <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                              {check.results[0].errorMessage.slice(0, 80)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          <button
                            onClick={() => handleRun(integration.id, check.id)}
                            disabled={busyCheckIds.has(check.id)}
                            className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                          >
                            {busyCheckIds.has(check.id) ? "Queuing…" : "Run now"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tint,
}: {
  label: string;
  value: number;
  tint: "neutral" | "green" | "red" | "blue";
}) {
  const tintClass: Record<typeof tint, string> = {
    neutral: "text-neutral-900 dark:text-white",
    green: "text-green-600",
    red: "text-red-600",
    blue: "text-blue-600",
  };
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-bold ${tintClass[tint]}`}>{value}</div>
    </div>
  );
}

function EmptyState({ catalog }: { catalog: IntegrationCatalogItem[] }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
        No manifest-based integrations yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
        Connect one of the providers below to start collecting automated evidence. Each connection
        materialises a fresh set of checks linked to your controls.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.map((c) => (
          <div
            key={c.connector}
            className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-left dark:border-neutral-800 dark:bg-neutral-950"
          >
            <div className="font-medium text-neutral-900 dark:text-white">{c.displayName}</div>
            <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {c.checkCount} checks · {c.category}
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/integrations"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Open connect wizard
      </Link>
    </div>
  );
}
