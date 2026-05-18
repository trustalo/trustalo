"use client";

/**
 * Per-control "Evidence Agent" panel.
 *
 * Lets the user choose between adding evidence manually or delegating
 * collection to the per-tenant evidence agent. When in agent mode the
 * user provides natural-language instructions and selects which
 * connected integrations the agent may use as tools.
 *
 * The component is fully self-contained — it renders inside the existing
 * `EvidenceTab` so we don't have to disturb the manual-evidence flow.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  apiClient,
  type EvidenceAgentRun,
  type EvidenceAgentToolConnection,
  type EvidenceCollectionConfig,
  type EvidenceCollectionMode,
} from "@/lib/api-client";
import {
  isEnterpriseLicenseError,
  useEnterpriseGated,
  useEnterpriseToast,
} from "@/lib/enterprise-license";
import { EnterpriseRequiredBanner } from "@/components/ai/enterprise-required-banner";

interface Props {
  controlId: string;
  /** Notify parent when an agent run completes so it can refresh the evidence list. */
  onRunCompleted?: () => void;
}

const RUN_STATUS_BADGE: Record<
  EvidenceAgentRun["status"],
  { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }
> = {
  pending: { label: "Pending", variant: "neutral" },
  running: { label: "Running", variant: "info" },
  succeeded: { label: "Succeeded", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

export function EvidenceAgentPanel({ controlId, onRunCompleted }: Props) {
  const [config, setConfig] = useState<EvidenceCollectionConfig | null>(null);
  const [tools, setTools] = useState<EvidenceAgentToolConnection[]>([]);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [runs, setRuns] = useState<EvidenceAgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Local form state — stays in sync with `config` after each fetch.
  const [mode, setMode] = useState<EvidenceCollectionMode>("manual");
  const [instructions, setInstructions] = useState("");
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>([]);

  // Evidence Agent is an LLM-driven, Enterprise-only feature. Gate the
  // segmented control + Save / Run actions with the same toast pattern
  // used by the other AI surfaces.
  const aiGated = useEnterpriseGated();
  const enterpriseToast = useEnterpriseToast();

  function handleModeChange(next: EvidenceCollectionMode) {
    if (next === "agent" && aiGated) {
      enterpriseToast.show("Evidence Agent");
      return;
    }
    setMode(next);
  }

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setToolsError(null);
    try {
      // We deliberately fetch each call individually rather than swallowing
      // errors with `.catch(() => ({ data: [] }))`. Previously a failing
      // tools fetch (e.g. collector unreachable, internal-key mismatch)
      // would silently render as "no connected integrations", which made
      // it impossible for the user to tell whether they had no integrations
      // or whether the system simply couldn't see them.
      const configRes = await apiClient.getEvidenceConfig(controlId);
      const cfg = configRes.data;
      setConfig(cfg);
      setMode(cfg.mode);
      setInstructions(cfg.agentInstructions ?? "");
      setSelectedConnectionIds(cfg.agentToolConnectionIds ?? []);

      const [toolsResult, runsResult] = await Promise.allSettled([
        apiClient.listEvidenceAgentTools(),
        apiClient.listEvidenceAgentRuns(controlId, { limit: 5 }),
      ]);

      if (toolsResult.status === "fulfilled") {
        setTools(toolsResult.value.data ?? []);
      } else {
        setTools([]);
        setToolsError(
          toolsResult.reason instanceof Error
            ? toolsResult.reason.message
            : "Failed to load connected integrations.",
        );
      }

      if (runsResult.status === "fulfilled") {
        setRuns(runsResult.value.data ?? []);
      } else {
        setRuns([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load evidence agent settings");
    } finally {
      setLoading(false);
    }
  }, [controlId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Poll while a run is in-flight so the UI surfaces completion automatically.
  useEffect(() => {
    const inflight = runs.find((r) => r.status === "pending" || r.status === "running");
    if (!inflight) return;
    const id = setInterval(async () => {
      try {
        const res = await apiClient.listEvidenceAgentRuns(controlId, { limit: 5 });
        const next = res.data ?? [];
        setRuns(next);
        const settled = next.find((r) => r.id === inflight.id);
        if (settled && settled.status !== "pending" && settled.status !== "running") {
          onRunCompleted?.();
        }
      } catch {
        /* swallow during polling */
      }
    }, 4000);
    return () => clearInterval(id);
  }, [runs, controlId, onRunCompleted]);

  const dirty = useMemo(() => {
    if (!config) return false;
    if (mode !== config.mode) return true;
    if ((instructions ?? "") !== (config.agentInstructions ?? "")) return true;
    const a = [...selectedConnectionIds].sort().join(",");
    const b = [...(config.agentToolConnectionIds ?? [])].sort().join(",");
    return a !== b;
  }, [config, mode, instructions, selectedConnectionIds]);

  async function handleSave() {
    if (mode === "agent" && aiGated) {
      enterpriseToast.show("Evidence Agent");
      return;
    }
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const res = await apiClient.updateEvidenceConfig(controlId, {
        mode,
        agentInstructions: mode === "agent" ? instructions : null,
        agentToolConnectionIds: mode === "agent" ? selectedConnectionIds : [],
      });
      setConfig(res.data);
      setInfo("Saved");
    } catch (err) {
      if (isEnterpriseLicenseError(err)) {
        enterpriseToast.show("Evidence Agent");
      } else {
        setError(err instanceof Error ? err.message : "Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRunNow() {
    if (aiGated) {
      enterpriseToast.show("Evidence Agent");
      return;
    }
    setRunning(true);
    setError(null);
    setInfo(null);
    try {
      const res = await apiClient.triggerEvidenceAgentRun(controlId);
      setRuns((prev) => [res.data, ...prev.filter((r) => r.id !== res.data.id)].slice(0, 5));
      setInfo("Agent run started");
    } catch (err) {
      if (isEnterpriseLicenseError(err)) {
        enterpriseToast.show("Evidence Agent");
      } else {
        setError(err instanceof Error ? err.message : "Failed to start agent run");
      }
    } finally {
      setRunning(false);
    }
  }

  function toggleConnection(id: string) {
    setSelectedConnectionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-6 text-sm text-neutral-500">
          Loading evidence collection settings…
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        <EnterpriseRequiredBanner
          open={enterpriseToast.open}
          feature={enterpriseToast.feature}
          onClose={enterpriseToast.dismiss}
        />

        {/* Header row: title + segmented mode control */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Evidence collection
            </h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              {mode === "agent"
                ? "An LLM follows your instructions and pulls from selected integrations."
                : "Add evidence yourself using the list below."}
            </p>
          </div>
          <ModeSegmented value={mode} onChange={handleModeChange} />
        </div>

        {mode === "agent" && (
          <div className="space-y-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
            <div>
              <label
                htmlFor={`agent-instructions-${controlId}`}
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                Instructions
              </label>
              <p className="text-[11px] text-neutral-500">
                Tell the agent what evidence it should collect for this control.
              </p>
              <Textarea
                id={`agent-instructions-${controlId}`}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                placeholder="e.g. List all GitHub repositories whose default branch enforces required reviews and status checks. Include repo name and reviewer count."
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Tools (integrations the agent can use)
                </label>
                <button
                  type="button"
                  onClick={() => void fetchAll()}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Refresh
                </button>
              </div>

              {toolsError ? (
                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  Couldn&apos;t load your connected integrations: {toolsError}. This is usually a
                  transient evidence-collector issue. Try{" "}
                  <button
                    type="button"
                    onClick={() => void fetchAll()}
                    className="font-medium underline underline-offset-2"
                  >
                    refreshing
                  </button>
                  , and if it persists, check that the collector service is running and that the API
                  and collector share the same
                  <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 text-[10px] dark:bg-amber-900/60">
                    API_INTERNAL_KEY
                  </code>
                  .
                </div>
              ) : tools.length === 0 ? (
                <div className="mt-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px] text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
                  No connected integrations were found for your organization.{" "}
                  <Link
                    href="/integrations"
                    className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Connect one
                  </Link>{" "}
                  to enable agent tools.
                </div>
              ) : (
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {tools.map((conn) => {
                    const checked = selectedConnectionIds.includes(conn.id);
                    const status = connectionStatusBadge(conn.status);
                    return (
                      <li key={conn.id}>
                        <label
                          className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-xs transition ${
                            checked
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                              : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleConnection(conn.id)}
                            className="mt-0.5"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                {conn.provider.name}
                              </span>
                              <span className="text-neutral-400">· {conn.name}</span>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </span>
                            {conn.provider.capabilities &&
                              conn.provider.capabilities.length > 0 && (
                                <span className="mt-1 flex flex-wrap gap-1">
                                  {conn.provider.capabilities.map((cap) => (
                                    <span
                                      key={cap}
                                      className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                                    >
                                      {cap}
                                    </span>
                                  ))}
                                </span>
                              )}
                            {conn.status !== "connected" && (
                              <span className="mt-1 block text-[10px] text-neutral-500">
                                {conn.status === "pending_auth"
                                  ? "Connection isn't tested yet — the agent may fail until you verify it under Integrations."
                                  : conn.status === "error"
                                    ? "Last sync errored — fix the connection under Integrations before relying on it."
                                    : `Status: ${conn.status}.`}
                              </span>
                            )}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        {info && !error && <p className="text-xs text-emerald-600 dark:text-emerald-400">{info}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleSave} disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          {mode === "agent" && (
            <Button
              variant="secondary"
              disabled={running || dirty || config?.mode !== "agent"}
              onClick={handleRunNow}
              title={dirty ? "Save changes before running" : undefined}
            >
              {running ? "Starting…" : "Run agent now"}
            </Button>
          )}
        </div>

        {mode === "agent" && runs.length > 0 && <RecentRuns runs={runs} />}
      </div>
    </Card>
  );
}

/**
 * Compact two-option segmented control for the evidence-collection
 * mode. Sized to sit inline with the panel header rather than dominate
 * the card.
 */
function ModeSegmented({
  value,
  onChange,
}: {
  value: EvidenceCollectionMode;
  onChange: (next: EvidenceCollectionMode) => void;
}) {
  const options: { value: EvidenceCollectionMode; label: string }[] = [
    { value: "manual", label: "Manual" },
    { value: "agent", label: "Agent" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Evidence collection mode"
      className="inline-flex flex-shrink-0 rounded-md border border-neutral-200 bg-neutral-50 p-0.5 text-xs dark:border-neutral-700 dark:bg-neutral-900"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`rounded px-3 py-1 font-medium transition ${
              active
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Map an `IntegrationConnection.status` to the badge palette so users
 * can immediately see whether a tool is actually usable by the agent.
 * Newly-created connections are `pending_auth` — they appear in the
 * picker (matching the collector's `isActive: true` filter) but the
 * agent will fail to call them until the user tests/authorizes them.
 */
function connectionStatusBadge(status: string): { label: string; variant: BadgeVariant } {
  switch (status) {
    case "connected":
      return { label: "Connected", variant: "success" };
    case "syncing":
      return { label: "Syncing", variant: "info" };
    case "pending_auth":
      return { label: "Pending auth", variant: "warning" };
    case "error":
      return { label: "Error", variant: "danger" };
    case "disconnected":
      return { label: "Disconnected", variant: "neutral" };
    default:
      return { label: status, variant: "neutral" };
  }
}

function RecentRuns({ runs }: { runs: EvidenceAgentRun[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Recent runs
      </h4>
      <ul className="mt-2 space-y-2">
        {runs.map((run) => {
          const badge = RUN_STATUS_BADGE[run.status];
          return (
            <li
              key={run.id}
              className="flex items-start justify-between gap-3 rounded-md border border-neutral-200 p-2 text-xs dark:border-neutral-700"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <span className="text-neutral-500">
                    {new Date(run.createdAt).toLocaleString()}
                  </span>
                  {typeof run.evidenceCount === "number" && (
                    <span className="text-neutral-500">· {run.evidenceCount} items</span>
                  )}
                  {run.durationMs != null && (
                    <span className="text-neutral-500">· {Math.round(run.durationMs / 1000)}s</span>
                  )}
                </div>
                {run.summary && (
                  <p className="mt-1 line-clamp-2 text-neutral-600 dark:text-neutral-300">
                    {run.summary}
                  </p>
                )}
                {run.errorMessage && (
                  <p className="mt-1 text-red-600 dark:text-red-400">{run.errorMessage}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
