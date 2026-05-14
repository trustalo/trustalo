"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MaturityBadge } from "@/components/framework/maturity-badge";
import {
  apiClient,
  type DashboardOverview,
  type DashboardFrameworkReadiness,
  type FrameworkInstanceStatus,
  type RiskStats,
  type RiskSeverityBuckets,
  type IncidentStats,
  type VulnerabilityStats,
  type TrainingStats,
} from "@/lib/api-client";

type DashboardTab = "overview" | "risk-management" | "incidents" | "vulnerabilities" | "training";

const TABS: { id: DashboardTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "risk-management", label: "Risk Management" },
  { id: "incidents", label: "Incident Management" },
  { id: "vulnerabilities", label: "Vulnerability Management" },
  { id: "training", label: "User Awareness" },
];

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
};

const STATUS_BADGE: Record<
  FrameworkInstanceStatus,
  { label: string; variant: "neutral" | "info" | "warning" | "success" }
> = {
  not_started: { label: "Not Started", variant: "neutral" },
  in_progress: { label: "In Progress", variant: "info" },
  ready_for_audit: { label: "Ready for Audit", variant: "warning" },
  certified: { label: "Certified", variant: "success" },
};

const SEVERITY_COLORS = {
  critical: { fill: "#ef4444" },
  high: { fill: "#f97316" },
  medium: { fill: "#eab308" },
  low: { fill: "#22c55e" },
};

const CATEGORY_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f43f5e",
];

const DEPT_LABELS: Record<string, string> = {
  engineering: "Engineering",
  product: "Product",
  operations: "Operations",
  finance: "Finance",
  legal: "Legal",
  human_resources: "HR",
  sales: "Sales",
  marketing: "Marketing",
  customer_support: "Support",
  it: "IT",
  security: "Security",
  compliance: "Compliance",
  executive: "Executive",
  other: "Other",
};

const EFFECTIVENESS_LABELS: Record<string, string> = {
  no_control: "No Control",
  need_improvement: "Needs Improvement",
  adequate: "Adequate",
  effective: "Effective",
};

const EFFECTIVENESS_COLORS: Record<string, string> = {
  no_control: "#ef4444",
  need_improvement: "#f97316",
  adequate: "#eab308",
  effective: "#22c55e",
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [riskStats, setRiskStats] = useState<RiskStats | null>(null);
  const [incidentStats, setIncidentStats] = useState<IncidentStats | null>(null);
  const [vulnStats, setVulnStats] = useState<VulnerabilityStats | null>(null);
  const [trainingStats, setTrainingStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const [overviewRes, riskRes, incidentRes, vulnRes, trainingRes] = await Promise.allSettled([
        apiClient.getDashboardOverview(),
        apiClient.getRiskStats(),
        apiClient.getIncidentStats(),
        apiClient.getVulnerabilityStats(),
        apiClient.getTrainingStats(),
      ]);

      if (overviewRes.status === "fulfilled") setData(overviewRes.value.data);
      else {
        setError(
          overviewRes.reason instanceof Error
            ? overviewRes.reason.message
            : "Failed to load dashboard",
        );
        return;
      }

      if (riskRes.status === "fulfilled") setRiskStats(riskRes.value.data);
      if (incidentRes.status === "fulfilled") setIncidentStats(incidentRes.value.data);
      if (vulnRes.status === "fulfilled") setVulnStats(vulnRes.value.data);
      if (trainingRes.status === "fulfilled") setTrainingStats(trainingRes.value.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-sm text-red-600">{error ?? "Failed to load dashboard"}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchDashboard();
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
      {/* Header + Tabs */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Overview of your compliance posture
        </p>
      </div>

      <nav className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-blue-600 dark:text-blue-400"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
            {tab.id === "risk-management" && riskStats && riskStats.severity.critical > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-semibold text-red-700 dark:bg-red-900 dark:text-red-300">
                {riskStats.severity.critical}
              </span>
            )}
            {tab.id === "incidents" && incidentStats && incidentStats.openCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                {incidentStats.openCount}
              </span>
            )}
            {tab.id === "vulnerabilities" && vulnStats && vulnStats.openCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-100 px-1.5 text-xs font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                {vulnStats.openCount}
              </span>
            )}
            {tab.id === "training" && trainingStats && trainingStats.overduePrograms > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-100 px-1.5 text-xs font-semibold text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                {trainingStats.overduePrograms}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab data={data} />}
      {activeTab === "risk-management" &&
        (riskStats ? <RiskManagementTab stats={riskStats} /> : <TabUnavailable />)}
      {activeTab === "incidents" &&
        (incidentStats ? <IncidentManagementTab stats={incidentStats} /> : <TabUnavailable />)}
      {activeTab === "vulnerabilities" &&
        (vulnStats ? <VulnerabilityManagementTab stats={vulnStats} /> : <TabUnavailable />)}
      {activeTab === "training" &&
        (trainingStats ? <UserAwarenessTab stats={trainingStats} /> : <TabUnavailable />)}
    </div>
  );
}

// ──────────────────────────────────────────────
// Overview Tab
// ──────────────────────────────────────────────

function OverviewTab({ data }: { data: DashboardOverview }) {
  const { counts, evidence, frameworks } = data;
  const avgReadiness =
    frameworks.readiness.length > 0
      ? Math.round(
          frameworks.readiness.reduce((s, f) => s + f.readinessPercentage, 0) /
            frameworks.readiness.length,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Frameworks"
          value={String(frameworks.total)}
          sub={
            frameworks.certified > 0
              ? `${frameworks.certified} certified`
              : `${avgReadiness}% avg. readiness`
          }
          accent="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Controls"
          value={String(counts.controls)}
          sub={`${frameworks.overallControlsMet}/${frameworks.overallControlsTotal} met`}
          accent="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Risks"
          value={String(counts.risks)}
          sub={`${counts.highSeverityRisks} high severity`}
          accent="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label="Evidence"
          value={String(evidence.total)}
          sub={
            evidence.total > 0
              ? `${evidence.approved} approved · ${evidence.expired} expired`
              : "No evidence yet"
          }
          accent="text-violet-600 dark:text-violet-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Framework Readiness */}
        <Card padding="none" glow>
          <div className="px-6 py-4">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Framework Readiness
            </h2>
          </div>
          {frameworks.readiness.length > 0 ? (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {frameworks.readiness.map((fw) => (
                <FrameworkRow key={fw.instanceId} framework={fw} />
              ))}
            </div>
          ) : (
            <div className="px-6 pb-6">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                No frameworks enabled yet. Adopt a framework to see readiness here.
              </p>
            </div>
          )}
        </Card>

        {/* Compliance Posture */}
        <Card padding="none" glow>
          <div className="px-6 py-4">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Compliance Posture
            </h2>
          </div>
          <div className="space-y-4 px-6 pb-6">
            <PostureRow label="Policies" value={counts.policies} color="bg-blue-500" />
            <PostureRow label="Vendors" value={counts.vendors} color="bg-indigo-500" />
            <PostureRow label="Assets" value={counts.assets} color="bg-cyan-500" />
            <PostureRow label="Incidents" value={counts.incidents} color="bg-orange-500" />
            <PostureRow label="Audits" value={counts.audits} color="bg-emerald-500" />
          </div>
        </Card>

        {/* Evidence Collection */}
        <Card glow className="lg:col-span-2">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            Evidence Collection
          </h2>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Approved</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                {evidence.approved} / {evidence.total}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${evidence.total > 0 ? Math.round((evidence.approved / evidence.total) * 100) : 0}%`,
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="font-semibold text-emerald-600">{evidence.approved}</p>
                <p className="text-neutral-500">Approved</p>
              </div>
              <div>
                <p className="font-semibold text-amber-600">
                  {evidence.total - evidence.approved - evidence.expired}
                </p>
                <p className="text-neutral-500">Pending</p>
              </div>
              <div>
                <p className="font-semibold text-red-600">{evidence.expired}</p>
                <p className="text-neutral-500">Expired</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Risk Management Tab
// ──────────────────────────────────────────────

function RiskManagementTab({ stats }: { stats: RiskStats }) {
  return (
    <div className="space-y-6">
      {/* Risk stat tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <RiskStatTile
          label="Total Risks"
          value={stats.total}
          color="text-neutral-900 dark:text-white"
        />
        <RiskStatTile
          label="Open Risks"
          value={stats.openCount}
          color="text-blue-600 dark:text-blue-400"
        />
        <RiskStatTile
          label="Critical"
          value={stats.severity.critical}
          color="text-red-600 dark:text-red-400"
        />
        <RiskStatTile
          label="High"
          value={stats.severity.high}
          color="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* Donuts + Heatmap */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Gross Risk</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Inherent risk severity distribution
          </p>
          <div className="mt-4">
            <SeverityDonut buckets={stats.severity} total={stats.total} />
          </div>
        </Card>
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Residual Risk</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            After controls &amp; mitigations
          </p>
          <div className="mt-4">
            <SeverityDonut buckets={stats.residualSeverity} total={stats.total} />
          </div>
        </Card>
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Risk Heatmap</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Likelihood vs Impact</p>
          <div className="mt-4">
            <RiskHeatmap data={stats.heatmapData} />
          </div>
        </Card>
      </div>

      {/* Monthly Trend */}
      {stats.monthlyTrend.length > 0 && (
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Risk Identification Trend
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            New risks identified per month (last 12 months)
          </p>
          <div className="mt-4">
            <MonthlyTrendChart data={stats.monthlyTrend} />
          </div>
        </Card>
      )}

      {/* Category + Department + Control Effectiveness */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">By Category</h3>
          <div className="mt-4">
            <BreakdownBars
              data={stats.byCategory}
              colors={CATEGORY_COLORS}
              total={stats.total}
              formatLabel={(k) => k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, " ")}
            />
          </div>
        </Card>
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">By Department</h3>
          <div className="mt-4">
            {Object.keys(stats.byDepartment).length > 0 ? (
              <BreakdownBars
                data={stats.byDepartment}
                colors={CATEGORY_COLORS}
                total={stats.total}
                formatLabel={(k) => DEPT_LABELS[k] || k}
              />
            ) : (
              <p className="py-4 text-center text-xs text-neutral-400">
                No department data assigned
              </p>
            )}
          </div>
        </Card>
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Control Effectiveness
          </h3>
          <div className="mt-4">
            {Object.keys(stats.byControlEffectiveness).length > 0 ? (
              <EffectivenessDonut data={stats.byControlEffectiveness} />
            ) : (
              <p className="py-4 text-center text-xs text-neutral-400">
                No effectiveness data available
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Risk by Status */}
      <Card glow>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">By Status</h3>
        <div className="mt-4">
          <StatusBreakdown data={stats.byStatus} total={stats.total} />
        </div>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────
// Incident Management Tab
// ──────────────────────────────────────────────

const INCIDENT_SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
  informational: "#6b7280",
};

const INCIDENT_STATUS_COLORS: Record<string, string> = {
  reported: "#9ca3af",
  investigating: "#3b82f6",
  contained: "#f59e0b",
  resolved: "#22c55e",
  closed: "#6b7280",
  lessons_learned: "#8b5cf6",
};

const INCIDENT_STATUS_LABELS: Record<string, string> = {
  reported: "Reported",
  investigating: "Investigating",
  contained: "Contained",
  resolved: "Resolved",
  closed: "Closed",
  lessons_learned: "Lessons Learned",
};

function IncidentManagementTab({ stats }: { stats: IncidentStats }) {
  const criticalCount = stats.bySeverity["critical"] || 0;

  return (
    <div className="space-y-6">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <IncidentStatTile
          label="Total Incidents"
          value={String(stats.total)}
          color="text-neutral-900 dark:text-white"
        />
        <IncidentStatTile
          label="Open"
          value={String(stats.openCount)}
          sub={
            stats.total > 0
              ? `${Math.round((stats.openCount / stats.total) * 100)}% of total`
              : undefined
          }
          color="text-blue-600 dark:text-blue-400"
        />
        <IncidentStatTile
          label="Critical"
          value={String(criticalCount)}
          color={
            criticalCount > 0
              ? "text-red-600 dark:text-red-400"
              : "text-neutral-900 dark:text-white"
          }
        />
        <IncidentStatTile
          label="Avg. Resolution Time"
          value={stats.mttrHours != null ? formatMttr(stats.mttrHours) : "—"}
          color="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Severity + Status + Resolution Rate */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">By Severity</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Incident severity distribution
          </p>
          <div className="mt-4">
            <IncidentDonut
              data={stats.bySeverity}
              total={stats.total}
              colorMap={INCIDENT_SEVERITY_COLORS}
            />
          </div>
        </Card>

        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Resolution Rate
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Resolved or closed incidents
          </p>
          <div className="mt-4">
            <ResolutionRateDonut
              rate={stats.resolutionRate}
              resolved={stats.resolvedCount}
              total={stats.total}
            />
          </div>
        </Card>

        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Regulatory Notifications
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Incidents requiring regulatory notice
          </p>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Required</span>
              <span className="text-lg font-bold text-neutral-900 dark:text-white">
                {stats.regulatory.required}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Notified</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {stats.regulatory.notified}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Pending</span>
              <span
                className={`text-lg font-bold ${
                  stats.regulatory.required - stats.regulatory.notified > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-neutral-900 dark:text-white"
                }`}
              >
                {stats.regulatory.required - stats.regulatory.notified}
              </span>
            </div>
            {stats.regulatory.required > 0 && (
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.round((stats.regulatory.notified / stats.regulatory.required) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Monthly Trend */}
      {stats.monthlyTrend.length > 0 && (
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Incident Trend</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Incidents reported per month (last 12 months)
          </p>
          <div className="mt-4">
            <IncidentMonthlyChart data={stats.monthlyTrend} />
          </div>
        </Card>
      )}

      {/* By Status + Top Reporters */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">By Status</h3>
          <div className="mt-4">
            <IncidentStatusBreakdown data={stats.byStatus} total={stats.total} />
          </div>
        </Card>

        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Top Reporters</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Most active incident reporters
          </p>
          <div className="mt-4">
            <TopReportersList reporters={stats.topReporters} total={stats.total} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function formatMttr(hours: number): string {
  if (hours < 1) return "<1h";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
}

function IncidentStatTile({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <Card glow>
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{sub}</p>}
    </Card>
  );
}

function IncidentDonut({
  data,
  total,
  colorMap,
}: {
  data: Record<string, number>;
  total: number;
  colorMap: Record<string, string>;
}) {
  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-xs text-neutral-400">No incidents</p>
      </div>
    );
  }

  const segments = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ key, value, color: colorMap[key] || "#6b7280" }))
    .sort((a, b) => b.value - a.value);

  const R = 50;
  const STROKE = 14;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="currentColor"
            className="text-neutral-100 dark:text-neutral-800"
            strokeWidth={STROKE}
          />
          {segments.map((seg) => {
            const dash = (seg.value / total) * C;
            const el = (
              <circle
                key={seg.key}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform="rotate(-90 70 70)"
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-neutral-900 dark:text-white">{total}</span>
          <span className="text-[10px] text-neutral-500">Total</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-neutral-600 dark:text-neutral-400 capitalize">
              {seg.key}
            </span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResolutionRateDonut({
  rate,
  resolved,
  total,
}: {
  rate: number;
  resolved: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-xs text-neutral-400">No incidents</p>
      </div>
    );
  }

  const R = 50;
  const STROKE = 14;
  const C = 2 * Math.PI * R;
  const filledDash = (rate / 100) * C;
  const rateColor = rate >= 80 ? "#22c55e" : rate >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="currentColor"
            className="text-neutral-100 dark:text-neutral-800"
            strokeWidth={STROKE}
          />
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={rateColor}
            strokeWidth={STROKE}
            strokeDasharray={`${filledDash} ${C - filledDash}`}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-neutral-900 dark:text-white">{rate}%</span>
          <span className="text-[10px] text-neutral-500">Resolved</span>
        </div>
      </div>
      <div className="flex gap-6 justify-center">
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Resolved / Closed</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-white">{resolved}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Open</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-white">{total - resolved}</p>
        </div>
      </div>
    </div>
  );
}

function IncidentMonthlyChart({ data }: { data: { month: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1.5" style={{ height: 120 }}>
      {data.map((d) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-neutral-900 dark:text-white">
            {d.count > 0 ? d.count : ""}
          </span>
          <div
            className="w-full rounded-t bg-orange-500 transition-all duration-500"
            style={{
              height: `${maxCount > 0 ? Math.max((d.count / maxCount) * 80, d.count > 0 ? 4 : 0) : 0}px`,
              minHeight: d.count > 0 ? 4 : 0,
            }}
          />
          <span className="text-[9px] text-neutral-400 leading-tight">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

function IncidentStatusBreakdown({ data, total }: { data: Record<string, number>; total: number }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return <p className="py-4 text-center text-xs text-neutral-400">No data</p>;
  }

  const maxVal = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="space-y-2.5">
      {entries.map(([key, count]) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              {INCIDENT_STATUS_LABELS[key] || key}
            </span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">
              {count}
              <span className="ml-1 text-neutral-400">
                ({total > 0 ? Math.round((count / total) * 100) : 0}%)
              </span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${maxVal > 0 ? Math.round((count / maxVal) * 100) : 0}%`,
                backgroundColor: INCIDENT_STATUS_COLORS[key] || "#9ca3af",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TopReportersList({
  reporters,
  total,
}: {
  reporters: { id: string; name: string; count: number }[];
  total: number;
}) {
  if (reporters.length === 0) {
    return <p className="py-4 text-center text-xs text-neutral-400">No reporter data</p>;
  }

  const maxCount = reporters[0]?.count ?? 1;

  return (
    <div className="space-y-3">
      {reporters.map((reporter, idx) => (
        <div key={reporter.id}>
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {idx + 1}
              </span>
              <span className="text-xs text-neutral-700 dark:text-neutral-300">
                {reporter.name}
              </span>
            </div>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">
              {reporter.count}
              <span className="ml-1 text-neutral-400">
                ({total > 0 ? Math.round((reporter.count / total) * 100) : 0}%)
              </span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{
                width: `${maxCount > 0 ? Math.round((reporter.count / maxCount) * 100) : 0}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Vulnerability Management Tab
// ──────────────────────────────────────────────

const VULN_SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
  informational: "#6b7280",
};

const VULN_STATUS_COLORS: Record<string, string> = {
  open: "#ef4444",
  confirmed: "#f97316",
  in_progress: "#3b82f6",
  remediated: "#22c55e",
  accepted: "#8b5cf6",
  false_positive: "#6b7280",
};

const VULN_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  remediated: "Remediated",
  accepted: "Accepted",
  false_positive: "False Positive",
};

const VULN_SOURCE_LABELS: Record<string, string> = {
  scan: "Automated Scan",
  pentest: "Penetration Test",
  bug_bounty: "Bug Bounty",
  manual: "Manual Discovery",
  vendor_advisory: "Vendor Advisory",
};

const VULN_SOURCE_COLORS: Record<string, string> = {
  scan: "#3b82f6",
  pentest: "#8b5cf6",
  bug_bounty: "#f59e0b",
  manual: "#06b6d4",
  vendor_advisory: "#ec4899",
};

const CVSS_COLORS: Record<string, string> = {
  none: "#9ca3af",
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

const CVSS_LABELS: Record<string, string> = {
  none: "None (0)",
  low: "Low (0.1-3.9)",
  medium: "Medium (4.0-6.9)",
  high: "High (7.0-8.9)",
  critical: "Critical (9.0-10)",
};

function VulnerabilityManagementTab({ stats }: { stats: VulnerabilityStats }) {
  return (
    <div className="space-y-6">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <VulnStatTile
          label="Total"
          value={String(stats.total)}
          color="text-neutral-900 dark:text-white"
        />
        <VulnStatTile
          label="Open"
          value={String(stats.openCount)}
          color="text-red-600 dark:text-red-400"
        />
        <VulnStatTile
          label="Remediated"
          value={`${stats.remediationRate}%`}
          sub={`${stats.remediatedCount} fixed`}
          color="text-emerald-600 dark:text-emerald-400"
        />
        <VulnStatTile
          label="Production Impact"
          value={String(stats.productionImpactCount)}
          sub={`${stats.productionImpactRate}% of total`}
          color={
            stats.productionImpactCount > 0
              ? "text-amber-600 dark:text-amber-400"
              : "text-neutral-900 dark:text-white"
          }
        />
        <VulnStatTile
          label="Avg. Remediation"
          value={stats.mttrHours != null ? formatMttr(stats.mttrHours) : "—"}
          color="text-blue-600 dark:text-blue-400"
        />
      </div>

      {/* Severity + CVSS + Remediation Rate */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">By Severity</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Vulnerability severity distribution
          </p>
          <div className="mt-4">
            <GenericDonut
              data={stats.bySeverity}
              total={stats.total}
              colorMap={VULN_SEVERITY_COLORS}
              emptyLabel="No vulnerabilities"
            />
          </div>
        </Card>

        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            CVSS Distribution
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Score-based severity rating
          </p>
          <div className="mt-4">
            <GenericDonut
              data={stats.cvssDistribution}
              total={Object.values(stats.cvssDistribution).reduce((s, v) => s + v, 0)}
              colorMap={CVSS_COLORS}
              labelMap={CVSS_LABELS}
              emptyLabel="No CVSS data"
            />
          </div>
        </Card>

        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Remediation Rate
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Percentage of vulnerabilities fixed
          </p>
          <div className="mt-4">
            <VulnRemediationDonut
              rate={stats.remediationRate}
              remediated={stats.remediatedCount}
              total={stats.total}
            />
          </div>
        </Card>
      </div>

      {/* Monthly Trend */}
      {stats.monthlyTrend.length > 0 && (
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Discovery Trend
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Vulnerabilities discovered per month (last 12 months)
          </p>
          <div className="mt-4">
            <VulnMonthlyChart data={stats.monthlyTrend} />
          </div>
        </Card>
      )}

      {/* Source + Status + CWE */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">By Source</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            How vulnerabilities were discovered
          </p>
          <div className="mt-4">
            <VulnBarBreakdown
              data={stats.bySource}
              total={stats.total}
              colorMap={VULN_SOURCE_COLORS}
              labelMap={VULN_SOURCE_LABELS}
            />
          </div>
        </Card>

        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">By Status</h3>
          <div className="mt-4">
            <VulnBarBreakdown
              data={stats.byStatus}
              total={stats.total}
              colorMap={VULN_STATUS_COLORS}
              labelMap={VULN_STATUS_LABELS}
            />
          </div>
        </Card>

        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Top CWE Root Causes
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Most common weakness types
          </p>
          <div className="mt-4">
            <CweList cwes={stats.topCwes} total={stats.total} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function VulnStatTile({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <Card glow>
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{sub}</p>}
    </Card>
  );
}

function GenericDonut({
  data,
  total,
  colorMap,
  labelMap,
  emptyLabel = "No data",
}: {
  data: Record<string, number>;
  total: number;
  colorMap: Record<string, string>;
  labelMap?: Record<string, string>;
  emptyLabel?: string;
}) {
  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-xs text-neutral-400">{emptyLabel}</p>
      </div>
    );
  }

  const segments = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      key,
      value,
      color: colorMap[key] || "#6b7280",
      label: labelMap?.[key] || key,
    }))
    .sort((a, b) => b.value - a.value);

  const R = 50;
  const STROKE = 14;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="currentColor"
            className="text-neutral-100 dark:text-neutral-800"
            strokeWidth={STROKE}
          />
          {segments.map((seg) => {
            const dash = (seg.value / total) * C;
            const el = (
              <circle
                key={seg.key}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform="rotate(-90 70 70)"
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-neutral-900 dark:text-white">{total}</span>
          <span className="text-[10px] text-neutral-500">Total</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-neutral-600 dark:text-neutral-400 capitalize">
              {seg.label}
            </span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VulnRemediationDonut({
  rate,
  remediated,
  total,
}: {
  rate: number;
  remediated: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-xs text-neutral-400">No vulnerabilities</p>
      </div>
    );
  }

  const R = 50;
  const STROKE = 14;
  const C = 2 * Math.PI * R;
  const filledDash = (rate / 100) * C;
  const rateColor = rate >= 80 ? "#22c55e" : rate >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="currentColor"
            className="text-neutral-100 dark:text-neutral-800"
            strokeWidth={STROKE}
          />
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={rateColor}
            strokeWidth={STROKE}
            strokeDasharray={`${filledDash} ${C - filledDash}`}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-neutral-900 dark:text-white">{rate}%</span>
          <span className="text-[10px] text-neutral-500">Fixed</span>
        </div>
      </div>
      <div className="flex gap-6 justify-center">
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Remediated</p>
          <p className="text-lg font-bold text-emerald-600">{remediated}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Open</p>
          <p className="text-lg font-bold text-red-600">{total - remediated}</p>
        </div>
      </div>
    </div>
  );
}

function VulnMonthlyChart({ data }: { data: { month: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1.5" style={{ height: 120 }}>
      {data.map((d) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-neutral-900 dark:text-white">
            {d.count > 0 ? d.count : ""}
          </span>
          <div
            className="w-full rounded-t bg-purple-500 transition-all duration-500"
            style={{
              height: `${maxCount > 0 ? Math.max((d.count / maxCount) * 80, d.count > 0 ? 4 : 0) : 0}px`,
              minHeight: d.count > 0 ? 4 : 0,
            }}
          />
          <span className="text-[9px] text-neutral-400 leading-tight">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

function VulnBarBreakdown({
  data,
  total,
  colorMap,
  labelMap,
}: {
  data: Record<string, number>;
  total: number;
  colorMap: Record<string, string>;
  labelMap: Record<string, string>;
}) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return <p className="py-4 text-center text-xs text-neutral-400">No data</p>;
  }
  const maxVal = sorted[0]?.[1] ?? 1;

  return (
    <div className="space-y-2.5">
      {sorted.map(([key, count]) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              {labelMap[key] || key}
            </span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">
              {count}
              <span className="ml-1 text-neutral-400">
                ({total > 0 ? Math.round((count / total) * 100) : 0}%)
              </span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${maxVal > 0 ? Math.round((count / maxVal) * 100) : 0}%`,
                backgroundColor: colorMap[key] || "#6b7280",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CweList({ cwes, total }: { cwes: { id: string; count: number }[]; total: number }) {
  if (cwes.length === 0) {
    return <p className="py-4 text-center text-xs text-neutral-400">No CWE data recorded</p>;
  }

  const maxCount = cwes[0]?.count ?? 1;

  return (
    <div className="space-y-2.5">
      {cwes.map((cwe) => (
        <div key={cwe.id}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-700 dark:text-neutral-300">
              {cwe.id}
            </span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">
              {cwe.count}
              <span className="ml-1 text-neutral-400">
                ({total > 0 ? Math.round((cwe.count / total) * 100) : 0}%)
              </span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${maxCount > 0 ? Math.round((cwe.count / maxCount) * 100) : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// User Awareness (Training) Tab
// ──────────────────────────────────────────────

const TRAINING_TYPE_LABELS: Record<string, string> = {
  security_awareness: "Security Awareness",
  compliance: "Compliance",
  phishing_simulation: "Phishing Simulation",
  custom: "Custom",
};

const TRAINING_TYPE_COLORS: Record<string, string> = {
  security_awareness: "#3b82f6",
  compliance: "#8b5cf6",
  phishing_simulation: "#f59e0b",
  custom: "#06b6d4",
};

const TRAINING_STATUS_LABELS: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

const TRAINING_STATUS_COLORS: Record<string, string> = {
  assigned: "#9ca3af",
  in_progress: "#3b82f6",
  completed: "#22c55e",
  overdue: "#ef4444",
};

const TRAINING_FREQ_LABELS: Record<string, string> = {
  once: "One-time",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annually: "Annually",
};

const TRAINING_FREQ_COLORS: Record<string, string> = {
  once: "#6b7280",
  monthly: "#3b82f6",
  quarterly: "#8b5cf6",
  annually: "#f59e0b",
};

function UserAwarenessTab({ stats }: { stats: TrainingStats }) {
  return (
    <div className="space-y-6">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <TrainingStatTile
          label="Programs"
          value={String(stats.totalPrograms)}
          color="text-neutral-900 dark:text-white"
        />
        <TrainingStatTile
          label="Assigned"
          value={String(stats.totalAssigned)}
          color="text-blue-600 dark:text-blue-400"
        />
        <TrainingStatTile
          label="Completion Rate"
          value={`${stats.overallCompletionRate}%`}
          sub={`${stats.completedCount} completed`}
          color="text-emerald-600 dark:text-emerald-400"
        />
        <TrainingStatTile
          label="Overdue"
          value={String(stats.overduePrograms)}
          color={
            stats.overduePrograms > 0
              ? "text-red-600 dark:text-red-400"
              : "text-neutral-900 dark:text-white"
          }
        />
        <TrainingStatTile
          label="Avg. Score"
          value={stats.avgScore != null ? `${stats.avgScore}%` : "—"}
          color="text-violet-600 dark:text-violet-400"
        />
      </div>

      {/* Completion Rate + Training Types + Quiz Results */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Completion Rate
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Overall training completion
          </p>
          <div className="mt-4">
            <CompletionRateDonut
              rate={stats.overallCompletionRate}
              completed={stats.completedCount}
              total={stats.totalAssigned}
            />
          </div>
        </Card>

        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Training Types</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Programs by category</p>
          <div className="mt-4">
            <TrainingDonut
              data={stats.byType}
              total={stats.totalPrograms}
              colorMap={TRAINING_TYPE_COLORS}
              labelMap={TRAINING_TYPE_LABELS}
              emptyLabel="No programs"
            />
          </div>
        </Card>

        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Quiz Results</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Pass / fail rates from assessments
          </p>
          <div className="mt-4">
            <QuizResultsCard results={stats.quizResults} />
          </div>
        </Card>
      </div>

      {/* Monthly Completions */}
      {stats.monthlyCompletions.length > 0 && (
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Monthly Progress
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Training completions per month (last 12 months)
          </p>
          <div className="mt-4">
            <TrainingMonthlyChart data={stats.monthlyCompletions} />
          </div>
        </Card>
      )}

      {/* Status + Frequency */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">By Status</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Assignment completion status
          </p>
          <div className="mt-4">
            <TrainingBarBreakdown
              data={stats.byStatus}
              total={stats.totalAssigned}
              colorMap={TRAINING_STATUS_COLORS}
              labelMap={TRAINING_STATUS_LABELS}
            />
          </div>
        </Card>

        <Card glow>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">By Frequency</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            How often trainings recur
          </p>
          <div className="mt-4">
            <TrainingBarBreakdown
              data={stats.byFrequency}
              total={stats.totalPrograms}
              colorMap={TRAINING_FREQ_COLORS}
              labelMap={TRAINING_FREQ_LABELS}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function TrainingStatTile({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <Card glow>
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{sub}</p>}
    </Card>
  );
}

function CompletionRateDonut({
  rate,
  completed,
  total,
}: {
  rate: number;
  completed: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-xs text-neutral-400">No assignments</p>
      </div>
    );
  }

  const R = 50;
  const STROKE = 14;
  const C = 2 * Math.PI * R;
  const filledDash = (rate / 100) * C;
  const rateColor = rate >= 80 ? "#22c55e" : rate >= 50 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="currentColor"
            className="text-neutral-100 dark:text-neutral-800"
            strokeWidth={STROKE}
          />
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke={rateColor}
            strokeWidth={STROKE}
            strokeDasharray={`${filledDash} ${C - filledDash}`}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-neutral-900 dark:text-white">{rate}%</span>
          <span className="text-[10px] text-neutral-500">Complete</span>
        </div>
      </div>
      <div className="flex gap-6 justify-center">
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Completed</p>
          <p className="text-lg font-bold text-emerald-600">{completed}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Remaining</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-white">{total - completed}</p>
        </div>
      </div>
    </div>
  );
}

function TrainingDonut({
  data,
  total,
  colorMap,
  labelMap,
  emptyLabel = "No data",
}: {
  data: Record<string, number>;
  total: number;
  colorMap: Record<string, string>;
  labelMap: Record<string, string>;
  emptyLabel?: string;
}) {
  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-xs text-neutral-400">{emptyLabel}</p>
      </div>
    );
  }

  const segments = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      key,
      value,
      color: colorMap[key] || "#6b7280",
      label: labelMap[key] || key,
    }))
    .sort((a, b) => b.value - a.value);

  const R = 50;
  const STROKE = 14;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="currentColor"
            className="text-neutral-100 dark:text-neutral-800"
            strokeWidth={STROKE}
          />
          {segments.map((seg) => {
            const dash = (seg.value / total) * C;
            const el = (
              <circle
                key={seg.key}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform="rotate(-90 70 70)"
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-neutral-900 dark:text-white">{total}</span>
          <span className="text-[10px] text-neutral-500">Total</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">{seg.label}</span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizResultsCard({ results }: { results: TrainingStats["quizResults"] }) {
  if (results.totalAttempts === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-xs text-neutral-400">No quiz attempts</p>
      </div>
    );
  }

  const passRate =
    results.totalAttempts > 0 ? Math.round((results.passed / results.totalAttempts) * 100) : 0;

  const R = 44;
  const STROKE = 12;
  const C = 2 * Math.PI * R;
  const passedDash = (results.passed / results.totalAttempts) * C;
  const failedDash = (results.failed / results.totalAttempts) * C;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="currentColor"
            className="text-neutral-100 dark:text-neutral-800"
            strokeWidth={STROKE}
          />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="#22c55e"
            strokeWidth={STROKE}
            strokeDasharray={`${passedDash} ${C - passedDash}`}
            strokeLinecap="butt"
            transform="rotate(-90 60 60)"
          />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="#ef4444"
            strokeWidth={STROKE}
            strokeDasharray={`${failedDash} ${C - failedDash}`}
            strokeDashoffset={-passedDash}
            strokeLinecap="butt"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-neutral-900 dark:text-white">{passRate}%</span>
          <span className="text-[10px] text-neutral-500">Pass</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Passed</span>
          <span className="text-xs font-medium text-neutral-900 dark:text-white">
            {results.passed}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <span className="text-xs text-neutral-600 dark:text-neutral-400">Failed</span>
          <span className="text-xs font-medium text-neutral-900 dark:text-white">
            {results.failed}
          </span>
        </div>
        {results.avgScore != null && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">Avg:</span>
            <span className="text-xs font-bold text-neutral-900 dark:text-white">
              {results.avgScore}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TrainingMonthlyChart({ data }: { data: { month: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1.5" style={{ height: 120 }}>
      {data.map((d) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-neutral-900 dark:text-white">
            {d.count > 0 ? d.count : ""}
          </span>
          <div
            className="w-full rounded-t bg-emerald-500 transition-all duration-500"
            style={{
              height: `${maxCount > 0 ? Math.max((d.count / maxCount) * 80, d.count > 0 ? 4 : 0) : 0}px`,
              minHeight: d.count > 0 ? 4 : 0,
            }}
          />
          <span className="text-[9px] text-neutral-400 leading-tight">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

function TrainingBarBreakdown({
  data,
  total,
  colorMap,
  labelMap,
}: {
  data: Record<string, number>;
  total: number;
  colorMap: Record<string, string>;
  labelMap: Record<string, string>;
}) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return <p className="py-4 text-center text-xs text-neutral-400">No data</p>;
  }
  const maxVal = sorted[0]?.[1] ?? 1;

  return (
    <div className="space-y-2.5">
      {sorted.map(([key, count]) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              {labelMap[key] || key}
            </span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">
              {count}
              <span className="ml-1 text-neutral-400">
                ({total > 0 ? Math.round((count / total) * 100) : 0}%)
              </span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${maxVal > 0 ? Math.round((count / maxVal) * 100) : 0}%`,
                backgroundColor: colorMap[key] || "#6b7280",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TabUnavailable() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Unable to load data for this tab. You may need to log out and log back in to refresh
        permissions.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Chart Components
// ──────────────────────────────────────────────

function SeverityDonut({ buckets, total }: { buckets: RiskSeverityBuckets; total: number }) {
  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-xs text-neutral-400">No risk data</p>
      </div>
    );
  }

  const segments = [
    { key: "critical", value: buckets.critical, color: SEVERITY_COLORS.critical.fill },
    { key: "high", value: buckets.high, color: SEVERITY_COLORS.high.fill },
    { key: "medium", value: buckets.medium, color: SEVERITY_COLORS.medium.fill },
    { key: "low", value: buckets.low, color: SEVERITY_COLORS.low.fill },
  ].filter((s) => s.value > 0);

  const R = 50;
  const STROKE = 14;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={R}
            fill="none"
            stroke="currentColor"
            className="text-neutral-100 dark:text-neutral-800"
            strokeWidth={STROKE}
          />
          {segments.map((seg) => {
            const dash = (seg.value / total) * C;
            const el = (
              <circle
                key={seg.key}
                cx="70"
                cy="70"
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform="rotate(-90 70 70)"
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-neutral-900 dark:text-white">{total}</span>
          <span className="text-[10px] text-neutral-500">Total</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-neutral-600 dark:text-neutral-400 capitalize">
              {seg.key}
            </span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskHeatmap({ data }: { data: { likelihood: number; impact: number; count: number }[] }) {
  const cellMap = new Map<string, number>();
  for (const d of data) {
    cellMap.set(`${d.likelihood}:${d.impact}`, d.count);
  }

  const impactLabels = ["1", "2", "3", "4", "5"];
  const likelihoodLabels = ["5", "4", "3", "2", "1"];

  function cellColor(l: number, i: number): string {
    const count = cellMap.get(`${l}:${i}`) || 0;
    const score = l * i;
    if (count === 0) return "bg-neutral-50 dark:bg-neutral-800/50";
    if (score >= 20) return "bg-red-500 text-white";
    if (score >= 12) return "bg-orange-400 text-white";
    if (score >= 5) return "bg-yellow-400 text-neutral-900";
    return "bg-green-400 text-neutral-900";
  }

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1">
        <div className="w-6" />
        {impactLabels.map((label) => (
          <div key={label} className="flex-1 text-center text-[10px] text-neutral-400">
            {label}
          </div>
        ))}
      </div>
      {likelihoodLabels.map((lLabel) => {
        const l = Number(lLabel);
        return (
          <div key={l} className="flex items-center gap-1">
            <div className="w-6 text-right text-[10px] text-neutral-400">{lLabel}</div>
            {impactLabels.map((iLabel) => {
              const i = Number(iLabel);
              const count = cellMap.get(`${l}:${i}`) || 0;
              return (
                <div
                  key={`${l}-${i}`}
                  className={`flex-1 aspect-square rounded flex items-center justify-center text-[10px] font-medium ${cellColor(l, i)}`}
                  title={`L${l} × I${i} = ${l * i}${count ? ` (${count} risks)` : ""}`}
                >
                  {count > 0 ? count : ""}
                </div>
              );
            })}
          </div>
        );
      })}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-neutral-400 pl-7">Impact →</span>
        <span className="text-[10px] text-neutral-400">↑ Likelihood</span>
      </div>
    </div>
  );
}

function MonthlyTrendChart({ data }: { data: { month: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1.5" style={{ height: 120 }}>
      {data.map((d) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-neutral-900 dark:text-white">
            {d.count > 0 ? d.count : ""}
          </span>
          <div
            className="w-full rounded-t bg-blue-500 transition-all duration-500"
            style={{
              height: `${maxCount > 0 ? Math.max((d.count / maxCount) * 80, d.count > 0 ? 4 : 0) : 0}px`,
              minHeight: d.count > 0 ? 4 : 0,
            }}
          />
          <span className="text-[9px] text-neutral-400 leading-tight">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

function BreakdownBars({
  data,
  colors,
  total,
  formatLabel,
}: {
  data: Record<string, number>;
  colors: string[];
  total: number;
  formatLabel: (key: string) => string;
}) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return <p className="py-4 text-center text-xs text-neutral-400">No data available</p>;
  }
  const maxVal = sorted[0]?.[1] ?? 1;

  return (
    <div className="space-y-2.5">
      {sorted.map(([key, count], idx) => (
        <div key={key}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              {formatLabel(key)}
            </span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">
              {count}
              <span className="ml-1 text-neutral-400">
                ({total > 0 ? Math.round((count / total) * 100) : 0}%)
              </span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${maxVal > 0 ? Math.round((count / maxVal) * 100) : 0}%`,
                backgroundColor: colors[idx % colors.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EffectivenessDonut({ data }: { data: Record<string, number> }) {
  const segments = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      key,
      value,
      label: EFFECTIVENESS_LABELS[key] || key,
      color: EFFECTIVENESS_COLORS[key] || "#6b7280",
    }));

  const segTotal = segments.reduce((s, seg) => s + seg.value, 0);
  if (segTotal === 0) {
    return <p className="py-4 text-center text-xs text-neutral-400">No data</p>;
  }

  const R = 44;
  const STROKE = 12;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="currentColor"
            className="text-neutral-100 dark:text-neutral-800"
            strokeWidth={STROKE}
          />
          {segments.map((seg) => {
            const dash = (seg.value / segTotal) * C;
            const el = (
              <circle
                key={seg.key}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform="rotate(-90 60 60)"
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-neutral-900 dark:text-white">{segTotal}</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">{seg.label}</span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  not_started: "#9ca3af",
  in_progress: "#3b82f6",
  done: "#22c55e",
  archived: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  done: "Done",
  archived: "Archived",
};

function StatusBreakdown({ data, total }: { data: Record<string, number>; total: number }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return <p className="py-4 text-center text-xs text-neutral-400">No data</p>;
  }

  return (
    <div className="flex items-center gap-6">
      {/* Stacked bar */}
      <div className="flex-1">
        <div className="flex h-4 overflow-hidden rounded-full">
          {entries.map(([key, count]) => (
            <div
              key={key}
              className="transition-all duration-500"
              style={{
                width: `${total > 0 ? (count / total) * 100 : 0}%`,
                backgroundColor: STATUS_COLORS[key] || "#9ca3af",
              }}
              title={`${STATUS_LABELS[key] || key}: ${count}`}
            />
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {entries.map(([key, count]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[key] || "#9ca3af" }}
            />
            <span className="text-xs text-neutral-600 dark:text-neutral-400">
              {STATUS_LABELS[key] || key}
            </span>
            <span className="text-xs font-medium text-neutral-900 dark:text-white">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Shared Small Components
// ──────────────────────────────────────────────

function RiskStatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card glow>
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}

function FrameworkRow({ framework }: { framework: DashboardFrameworkReadiness }) {
  const meta = FRAMEWORK_META[framework.frameworkType] ?? { color: "#6b7280", icon: "📋" };
  const statusCfg = STATUS_BADGE[framework.status];

  return (
    <div className="flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <span className="text-lg">{meta.icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {framework.name}
            </span>
            <MaturityBadge frameworkType={framework.frameworkType} />
          </div>
          <div className="mt-0.5">
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {framework.controlsMet}/{framework.totalControls} controls
          </span>
        </div>
        <div className="h-2 w-24 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${framework.readinessPercentage}%`, backgroundColor: meta.color }}
          />
        </div>
        <span className="w-10 text-right text-xs font-medium text-neutral-500">
          {framework.readinessPercentage}%
        </span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent = "text-neutral-900 dark:text-white",
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <Card glow>
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{sub}</p>
    </Card>
  );
}

function PostureRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
      </div>
      <span className="text-sm font-medium text-neutral-900 dark:text-white">{value}</span>
    </div>
  );
}
