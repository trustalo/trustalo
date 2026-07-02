"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { MaturityBadge } from "@/components/framework/maturity-badge";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import {
  apiClient,
  type FrameworkInstanceWithStats,
  type FrameworkInstanceStatus,
  type CatalogFramework,
  type FrameworkType,
} from "@/lib/api-client";
import { TIERED_FRAMEWORK_LEVELS, MATURITY_LEVELS, type MaturityLevelKey } from "@trustalo/shared";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FRAMEWORK_META: Record<string, { color: string; icon: string }> = {
  iso27001: { color: "#3b82f6", icon: "🔒" },
  iso27017: { color: "#6366f1", icon: "☁️" },
  iso27018: { color: "#8b5cf6", icon: "🛡️" },
  iso22301: { color: "#10b981", icon: "♻️" },
  iso42001: { color: "#f59e0b", icon: "🤖" },
  soc2: { color: "#ef4444", icon: "✓" },
  essential8: { color: "#0ea5e9", icon: "AU" },
  nist_csf_2: { color: "#1e40af", icon: "CSF" },
  gdpr: { color: "#0891b2", icon: "EU" },
  cps234: { color: "#b45309", icon: "APRA" },
  hipaa: { color: "#0d9488", icon: "US" },
  pci_dss_4: { color: "#7c3aed", icon: "PCI" },
};

const STATUS_CONFIG: Record<
  FrameworkInstanceStatus,
  { label: string; variant: "neutral" | "info" | "warning" | "success" }
> = {
  not_started: { label: "Not Started", variant: "neutral" },
  in_progress: { label: "In Progress", variant: "info" },
  ready_for_audit: { label: "Ready for Audit", variant: "warning" },
  certified: { label: "Certified", variant: "success" },
};

type ViewMode = "cards" | "list";

// ---------------------------------------------------------------------------
// Circular Progress Component
// ---------------------------------------------------------------------------

function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 6,
  color = "#3b82f6",
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-200 dark:text-neutral-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-neutral-900 dark:text-white">{percentage}%</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle Switch Component
// ---------------------------------------------------------------------------

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-blue-600" : "bg-neutral-300 dark:bg-neutral-600"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Summary Stats Bar
// ---------------------------------------------------------------------------

function SummaryStats({ instances }: { instances: FrameworkInstanceWithStats[] }) {
  const total = instances.length;
  const enabledInstances = instances.filter((i) => i.isEnabled);
  const enabled = enabledInstances.length;
  const certified = instances.filter((i) => i.status === "certified").length;
  const avgReadiness =
    enabled > 0
      ? Math.round(
          enabledInstances.reduce((sum, i) => sum + i.stats.readinessPercentage, 0) / enabled,
        )
      : 0;
  const totalControlsMet = enabledInstances.reduce((sum, i) => sum + i.stats.controlsMet, 0);
  const totalControls = enabledInstances.reduce((sum, i) => sum + i.stats.totalControls, 0);

  const stats = [
    { label: "Total Frameworks", value: total, accent: "text-blue-600 dark:text-blue-400" },
    { label: "Active", value: enabled, accent: "text-emerald-600 dark:text-emerald-400" },
    { label: "Certified", value: certified, accent: "text-amber-600 dark:text-amber-400" },
    {
      label: "Avg. Readiness",
      value: `${avgReadiness}%`,
      accent: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Controls Met",
      value: `${totalControlsMet}/${totalControls}`,
      accent: "text-cyan-600 dark:text-cyan-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <Card key={s.label} padding="sm">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{s.label}</p>
          <p className={`mt-1 text-2xl font-bold ${s.accent}`}>{s.value}</p>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export Audit Package Button
// ---------------------------------------------------------------------------

function ExportPackageButton({
  instance,
  onExport,
  exporting,
}: {
  instance: FrameworkInstanceWithStats;
  onExport: (instance: FrameworkInstanceWithStats) => void;
  exporting: string | null;
}) {
  const busy = exporting === instance.id;
  return (
    <button
      type="button"
      onClick={() => onExport(instance)}
      disabled={busy}
      title="Export audit package (ZIP with controls, SoA and approved evidence)"
      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-blue-700 dark:hover:text-blue-400"
    >
      {busy ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      ) : (
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
      )}
      {busy ? "Exporting…" : "Export audit package"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Framework Card (Grid View)
// ---------------------------------------------------------------------------

function FrameworkCard({
  instance,
  onToggle,
  toggling,
  onExport,
  exporting,
}: {
  instance: FrameworkInstanceWithStats;
  onToggle: (id: string, enabled: boolean) => void;
  toggling: string | null;
  onExport: (instance: FrameworkInstanceWithStats) => void;
  exporting: string | null;
}) {
  const meta = FRAMEWORK_META[instance.framework.frameworkType] ?? {
    color: "#6b7280",
    icon: "📋",
  };
  const statusCfg = STATUS_CONFIG[instance.status];
  const { stats } = instance;

  return (
    <Card
      padding="none"
      className={`overflow-hidden transition-all hover:shadow-md ${!instance.isEnabled ? "opacity-50 grayscale" : ""}`}
    >
      <div className="h-1.5" style={{ backgroundColor: meta.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{meta.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  {instance.framework.name}
                </h3>
                <MaturityBadge frameworkType={instance.framework.frameworkType} />
              </div>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                {instance.framework.frameworkType.toUpperCase()}
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={instance.isEnabled}
            onChange={(val) => onToggle(instance.id, val)}
            disabled={toggling === instance.id}
          />
        </div>

        <div className="mt-5 flex items-center gap-5">
          <CircularProgress percentage={stats.readinessPercentage} color={meta.color} />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">Controls</span>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                {stats.controlsMet}/{stats.totalControls}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${stats.readinessPercentage}%`,
                  backgroundColor: meta.color,
                }}
              />
            </div>
            <div className="flex gap-3 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                {stats.controlsMet} met
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                {stats.controlsInProgress} partial
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-neutral-400" />
                {stats.controlsNotMet} remaining
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            {instance.targetDate && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Target: {new Date(instance.targetDate).toLocaleDateString()}
              </span>
            )}
          </div>
          <ExportPackageButton instance={instance} onExport={onExport} exporting={exporting} />
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Add Framework Modal
// ---------------------------------------------------------------------------

function getTieredLevels(frameworkType: FrameworkType): MaturityLevelKey[] {
  return (TIERED_FRAMEWORK_LEVELS as Record<string, MaturityLevelKey[]>)[frameworkType] ?? [];
}

function AddFrameworkModal({
  open,
  onClose,
  catalog,
  loadingCatalog,
  onAdopt,
  adopting,
}: {
  open: boolean;
  onClose: () => void;
  catalog: CatalogFramework[];
  loadingCatalog: boolean;
  onAdopt: (frameworkId: string, targetMaturityLevel?: string) => void;
  adopting: string | null;
}) {
  // Per-row maturity selection. Defaults to the lowest tier so the picker
  // is meaningful even if the user just clicks "Adopt".
  const [maturitySelections, setMaturitySelections] = useState<Record<string, MaturityLevelKey>>(
    {},
  );

  const setMaturity = (frameworkId: string, level: MaturityLevelKey) =>
    setMaturitySelections((prev) => ({ ...prev, [frameworkId]: level }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Framework"
      description="Choose a compliance framework to adopt. Controls and requirements will be created automatically."
      size="xl"
    >
      {loadingCatalog ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {catalog.map((fw) => {
            const meta = FRAMEWORK_META[fw.frameworkType] ?? {
              color: "#6b7280",
              icon: "📋",
            };
            const tieredLevels = getTieredLevels(fw.frameworkType);
            const isTiered = tieredLevels.length > 0;
            const selectedLevel = maturitySelections[fw.id] ?? tieredLevels[0];

            return (
              <div
                key={fw.id}
                className={`flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                  fw.isAdopted
                    ? "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50"
                    : "border-neutral-200 hover:border-blue-300 hover:bg-blue-50/50 dark:border-neutral-700 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                    style={{ backgroundColor: `${meta.color}15` }}
                  >
                    {meta.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900 dark:text-white">{fw.name}</p>
                      <MaturityBadge frameworkType={fw.frameworkType} />
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {fw.description} &middot; {fw.requirementCount} requirements
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isTiered && !fw.isAdopted && (
                    <select
                      value={selectedLevel}
                      onChange={(e) => setMaturity(fw.id, e.target.value as MaturityLevelKey)}
                      className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-xs font-medium text-neutral-700 focus:border-blue-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200"
                      aria-label="Target maturity level"
                    >
                      {tieredLevels.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {MATURITY_LEVELS[lvl].label}
                        </option>
                      ))}
                    </select>
                  )}
                  {fw.isAdopted ? (
                    <Badge variant="success">Adopted</Badge>
                  ) : (
                    <button
                      onClick={() => onAdopt(fw.id, isTiered ? selectedLevel : undefined)}
                      disabled={adopting === fw.id}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                      {adopting === fw.id ? "Adding…" : "Adopt"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {catalog.length === 0 && (
            <p className="py-8 text-center text-sm text-neutral-500">
              No frameworks available in the catalog.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function FrameworksPage() {
  const [instances, setInstances] = useState<FrameworkInstanceWithStats[]>([]);
  const [catalog, setCatalog] = useState<CatalogFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");

  const fetchInstances = useCallback(async () => {
    try {
      const res = await apiClient.listFrameworkInstancesWithStats();
      setInstances(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load frameworks");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const res = await apiClient.getFrameworkCatalog();
      setCatalog(res.data);
    } catch {
      // catalog fetch failure is non-critical
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const handleToggle = async (instanceId: string, isEnabled: boolean) => {
    setToggling(instanceId);
    try {
      await apiClient.toggleFrameworkInstance(instanceId, isEnabled);
      setInstances((prev) => prev.map((i) => (i.id === instanceId ? { ...i, isEnabled } : i)));
    } catch {
      // revert will happen on next fetch
    } finally {
      setToggling(null);
    }
  };

  const handleAdopt = async (frameworkId: string, targetMaturityLevel?: string) => {
    setAdopting(frameworkId);
    try {
      await apiClient.adoptFramework(frameworkId, { targetMaturityLevel });
      await fetchInstances();
      await fetchCatalog();
    } catch {
      // error handled silently
    } finally {
      setAdopting(null);
    }
  };

  const handleExportPackage = async (instance: FrameworkInstanceWithStats) => {
    setExporting(instance.id);
    setExportError(null);
    try {
      await apiClient.downloadAuditPackage(
        instance.id,
        `audit-package-${instance.framework.frameworkType}`,
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Failed to export audit package");
    } finally {
      setExporting(null);
    }
  };

  const openAddModal = () => {
    setShowAddModal(true);
    fetchCatalog();
  };

  const filtered = instances
    .filter((i) => {
      if (filter === "enabled") return i.isEnabled;
      if (filter === "disabled") return !i.isEnabled;
      return true;
    })
    .sort((a, b) => {
      if (a.isEnabled !== b.isEnabled) return a.isEnabled ? -1 : 1;
      return a.framework.name.localeCompare(b.framework.name);
    });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchInstances();
          }}
          className="text-sm text-blue-600 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Frameworks</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Manage and track compliance across security and privacy frameworks
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Framework
        </button>
      </div>

      {/* Export error banner */}
      {exportError && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          <span>{exportError}</span>
          <button
            onClick={() => setExportError(null)}
            className="ml-4 text-xs font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Stats */}
      {instances.length > 0 && <SummaryStats instances={instances} />}

      {/* Toolbar: filter + view toggle */}
      {instances.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900">
            {(["all", "enabled", "disabled"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                }`}
              >
                {f === "all" ? "All" : f === "enabled" ? "Active" : "Inactive"}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900">
            <button
              onClick={() => setViewMode("cards")}
              title="Card View"
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "cards"
                  ? "bg-blue-600 text-white"
                  : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="List View"
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {instances.length === 0 && (
        <Card padding="lg">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              No frameworks adopted yet
            </h3>
            <p className="mt-2 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
              Get started by adopting a compliance framework. Controls and requirements will be
              created automatically based on the framework you choose.
            </p>
            <button
              onClick={openAddModal}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Framework
            </button>
          </div>
        </Card>
      )}

      {/* Card Grid View */}
      {viewMode === "cards" && filtered.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((inst) => (
            <FrameworkCard
              key={inst.id}
              instance={inst}
              onToggle={handleToggle}
              toggling={toggling}
              onExport={handleExportPackage}
              exporting={exporting}
            />
          ))}
        </div>
      )}

      {/* List / Table View */}
      {viewMode === "list" && filtered.length > 0 && (
        <Card padding="none">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Framework</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Readiness</TableHeader>
                <TableHeader>Controls</TableHeader>
                <TableHeader>Requirements</TableHeader>
                <TableHeader>Target Date</TableHeader>
                <TableHeader>Enabled</TableHeader>
                <TableHeader>Export</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((inst) => {
                const meta = FRAMEWORK_META[inst.framework.frameworkType] ?? {
                  color: "#6b7280",
                  icon: "📋",
                };
                const statusCfg = STATUS_CONFIG[inst.status];
                return (
                  <TableRow
                    key={inst.id}
                    className={
                      !inst.isEnabled
                        ? "opacity-50 [&_td]:text-neutral-400 dark:[&_td]:text-neutral-600"
                        : ""
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{meta.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-neutral-900 dark:text-white">
                              {inst.framework.name}
                            </span>
                            <MaturityBadge frameworkType={inst.framework.frameworkType} />
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {inst.framework.frameworkType.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${inst.stats.readinessPercentage}%`,
                              backgroundColor: meta.color,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          {inst.stats.readinessPercentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {inst.stats.controlsMet}
                        </span>
                        <span className="text-neutral-400"> / </span>
                        <span>{inst.stats.totalControls}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {inst.stats.requirementsMapped}/{inst.stats.totalRequirements}
                      </span>
                    </TableCell>
                    <TableCell>
                      {inst.targetDate ? (
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          {new Date(inst.targetDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ToggleSwitch
                        checked={inst.isEnabled}
                        onChange={(val) => handleToggle(inst.id, val)}
                        disabled={toggling === inst.id}
                      />
                    </TableCell>
                    <TableCell>
                      <ExportPackageButton
                        instance={inst}
                        onExport={handleExportPackage}
                        exporting={exporting}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Filtered empty */}
      {instances.length > 0 && filtered.length === 0 && (
        <Card padding="lg">
          <p className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            No frameworks match the selected filter.
          </p>
        </Card>
      )}

      {/* Add Framework Modal */}
      <AddFrameworkModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        catalog={catalog}
        loadingCatalog={loadingCatalog}
        onAdopt={handleAdopt}
        adopting={adopting}
      />
    </div>
  );
}
