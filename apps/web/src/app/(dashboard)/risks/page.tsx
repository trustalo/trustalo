"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  apiClient,
  type RiskItem,
  type RiskStats,
  type RiskCategoryType,
  type RiskStatusType,
  type RiskDepartmentType,
  type TreatmentStrategyType,
  type ProbabilityLevelType,
  type ImpactLevelType,
  type ControlEffectivenessType,
  type ApprovalStatusType,
  type RiskFieldConfig,
  type CreateRiskInput,
  type OrgMember,
} from "@/lib/api-client";

// ──────────────────────────────────────────────
// Constants / Lookups
// ──────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: "operational", label: "Operational" },
  { value: "technical", label: "Technical" },
  { value: "compliance", label: "Compliance" },
  { value: "strategic", label: "Strategic" },
  { value: "financial", label: "Financial" },
  { value: "reputational", label: "Reputational" },
  { value: "security", label: "Security" },
  { value: "privacy", label: "Privacy" },
  { value: "third_party", label: "Third Party" },
  { value: "environmental", label: "Environmental" },
];

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "archived", label: "Archived" },
];

const DEPARTMENT_OPTIONS = [
  { value: "engineering", label: "Engineering" },
  { value: "product", label: "Product" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "legal", label: "Legal" },
  { value: "human_resources", label: "Human Resources" },
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "customer_support", label: "Customer Support" },
  { value: "it", label: "IT" },
  { value: "security", label: "Security" },
  { value: "compliance", label: "Compliance" },
  { value: "executive", label: "Executive" },
  { value: "other", label: "Other" },
];

const TREATMENT_STRATEGY_OPTIONS = [
  { value: "mitigate", label: "Mitigate" },
  { value: "accept", label: "Accept" },
  { value: "transfer", label: "Transfer" },
  { value: "avoid", label: "Avoid" },
  { value: "control", label: "Control" },
];

const PROBABILITY_OPTIONS = [
  { value: "rare", label: "Rare" },
  { value: "unlikely", label: "Unlikely" },
  { value: "possible", label: "Possible" },
  { value: "likely", label: "Likely" },
  { value: "almost_certain", label: "Almost Certain" },
];

const IMPACT_LEVEL_OPTIONS = [
  { value: "negligible", label: "Negligible" },
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "catastrophic", label: "Catastrophic" },
];

const CONTROL_EFFECTIVENESS_OPTIONS = [
  { value: "no_control", label: "No Control" },
  { value: "need_improvement", label: "Need Improvement" },
  { value: "adequate", label: "Adequate" },
  { value: "effective", label: "Effective" },
];

const APPROVAL_OPTIONS = [
  { value: "yes", label: "YES" },
  { value: "no", label: "NO" },
  { value: "na", label: "N/A" },
  { value: "pending", label: "Pending" },
];

const STATUS_BADGE: Record<RiskStatusType, { variant: BadgeVariant; label: string }> = {
  not_started: { variant: "neutral", label: "Not Started" },
  in_progress: { variant: "info", label: "In Progress" },
  done: { variant: "success", label: "Done" },
  archived: { variant: "neutral", label: "Archived" },
};

const CATEGORY_LABEL: Record<RiskCategoryType, string> = {
  operational: "Operational",
  technical: "Technical",
  compliance: "Compliance",
  strategic: "Strategic",
  financial: "Financial",
  reputational: "Reputational",
  security: "Security",
  privacy: "Privacy",
  third_party: "Third Party",
  environmental: "Environmental",
};

const PROBABILITY_LABEL: Record<string, string> = {
  rare: "Rare",
  unlikely: "Unlikely",
  possible: "Possible",
  likely: "Likely",
  almost_certain: "Almost Certain",
};

const IMPACT_LABEL: Record<string, string> = {
  negligible: "Negligible",
  low: "Low",
  moderate: "Moderate",
  high: "High",
  catastrophic: "Catastrophic",
};

const CONTROL_EFF_LABEL: Record<string, string> = {
  no_control: "No Control",
  need_improvement: "Need Improvement",
  adequate: "Adequate",
  effective: "Effective",
};

const TREATMENT_LABEL: Record<string, string> = {
  mitigate: "Mitigate",
  accept: "Accept",
  transfer: "Transfer",
  avoid: "Avoid",
  control: "Control",
};

const APPROVAL_LABEL: Record<string, string> = {
  yes: "YES",
  no: "NO",
  na: "N/A",
  pending: "Pending",
};

function scoreSeverity(score: number): { label: string; variant: BadgeVariant } {
  if (score >= 20) return { label: "Critical", variant: "danger" };
  if (score >= 12) return { label: "High", variant: "warning" };
  if (score >= 5) return { label: "Medium", variant: "info" };
  return { label: "Low", variant: "success" };
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

const FIELD_GROUPS: Record<string, string> = {
  core: "Core",
  inherent_risk: "Inherent Risk",
  controls: "Controls",
  action: "Action Plan",
  approval: "Approvals",
  residual_risk: "Residual Risk",
  other: "Other",
};

type SortDirection = "asc" | "desc";

interface ColumnDef {
  header: string;
  render: (risk: RiskItem) => React.ReactNode;
  minWidth: number;
  sortKey?: string;
}

// Maps sort key to a comparable value for client-side sorting
function getSortValue(risk: RiskItem, sortKey: string): string | number {
  switch (sortKey) {
    case "riskIdentifier":
      return risk.riskIdentifier ?? "";
    case "title":
      return risk.title.toLowerCase();
    case "category":
      return risk.category;
    case "status":
      return risk.status;
    case "businessProcess":
      return risk.businessProcess ?? "";
    case "probability":
      return risk.probabilityScore ?? 0;
    case "impact":
      return risk.impactScore ?? 0;
    case "riskScore":
      return risk.riskScore ?? 0;
    case "controlEffectiveness":
      return risk.controlEffectiveness ?? "";
    case "treatmentStrategy":
      return risk.treatmentStrategy ?? "";
    case "ownerId":
      return risk.owner?.name?.toLowerCase() ?? "zzz";
    case "actionOwnerId":
      return risk.actionOwner?.name?.toLowerCase() ?? risk.actionOwnerName?.toLowerCase() ?? "zzz";
    case "estStartDate":
      return risk.estStartDate ?? "";
    case "estEndDate":
      return risk.estEndDate ?? "";
    case "budgetApproval":
      return risk.budgetApproval ?? "";
    case "managementApproval":
      return risk.managementApproval ?? "";
    case "residualRiskScore":
      return risk.residualRiskScore ?? 0;
    default:
      return "";
  }
}

const TABLE_COLUMNS: Record<string, ColumnDef> = {
  riskIdentifier: {
    header: "Risk ID",
    minWidth: 130,
    sortKey: "riskIdentifier",
    render: (r) => (
      <span className="whitespace-nowrap font-mono text-xs">{r.riskIdentifier || "—"}</span>
    ),
  },
  title: {
    header: "Risk Item",
    minWidth: 220,
    sortKey: "title",
    render: (r) => (
      <div>
        <span className="font-medium">{r.title}</span>
        {r.description && (
          <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-500">{r.description}</p>
        )}
      </div>
    ),
  },
  businessProcess: {
    header: "Business Process",
    minWidth: 140,
    sortKey: "businessProcess",
    render: (r) => <span className="text-sm">{r.businessProcess || "—"}</span>,
  },
  category: {
    header: "Category",
    minWidth: 110,
    sortKey: "category",
    render: (r) => <span className="text-sm">{CATEGORY_LABEL[r.category]}</span>,
  },
  ownerId: {
    header: "Risk Owner",
    minWidth: 120,
    sortKey: "ownerId",
    render: (r) => r.owner?.name || <span className="text-xs text-neutral-400">Unassigned</span>,
  },
  probability: {
    header: "Probability",
    minWidth: 120,
    sortKey: "probability",
    render: (r) => (
      <span className="text-sm">{r.probability ? PROBABILITY_LABEL[r.probability] : "—"}</span>
    ),
  },
  impact: {
    header: "Impact",
    minWidth: 100,
    sortKey: "impact",
    render: (r) => <span className="text-sm">{r.impact ? IMPACT_LABEL[r.impact] : "—"}</span>,
  },
  riskScore: {
    header: "Score",
    minWidth: 90,
    sortKey: "riskScore",
    render: (r) => {
      const sev = scoreSeverity(r.riskScore);
      return <Badge variant={sev.variant}>{sev.label}</Badge>;
    },
  },
  controlEffectiveness: {
    header: "Control Effectiveness",
    minWidth: 160,
    sortKey: "controlEffectiveness",
    render: (r) => (
      <span className="text-sm">
        {r.controlEffectiveness ? CONTROL_EFF_LABEL[r.controlEffectiveness] : "—"}
      </span>
    ),
  },
  controlDescription: {
    header: "Control Description",
    minWidth: 180,
    render: (r) => (
      <span className="max-w-[200px] truncate text-sm">{r.controlDescription || "—"}</span>
    ),
  },
  treatmentStrategy: {
    header: "Treatment Option",
    minWidth: 130,
    sortKey: "treatmentStrategy",
    render: (r) => (
      <span className="text-sm">
        {r.treatmentStrategy ? TREATMENT_LABEL[r.treatmentStrategy] : "—"}
      </span>
    ),
  },
  actionPlan: {
    header: "Action Plan",
    minWidth: 180,
    render: (r) => <span className="max-w-[200px] truncate text-sm">{r.actionPlan || "—"}</span>,
  },
  actionOwnerId: {
    header: "Action Owner",
    minWidth: 120,
    sortKey: "actionOwnerId",
    render: (r) => (
      <span className="text-sm">{r.actionOwner?.name || r.actionOwnerName || "—"}</span>
    ),
  },
  estStartDate: {
    header: "EST Start",
    minWidth: 110,
    sortKey: "estStartDate",
    render: (r) => <span className="whitespace-nowrap text-sm">{formatDate(r.estStartDate)}</span>,
  },
  estEndDate: {
    header: "EST End",
    minWidth: 110,
    sortKey: "estEndDate",
    render: (r) => <span className="whitespace-nowrap text-sm">{formatDate(r.estEndDate)}</span>,
  },
  budgetApproval: {
    header: "Budget Approval",
    minWidth: 130,
    sortKey: "budgetApproval",
    render: (r) => (
      <span className="text-sm">{r.budgetApproval ? APPROVAL_LABEL[r.budgetApproval] : "—"}</span>
    ),
  },
  managementApproval: {
    header: "Mgmt Approval",
    minWidth: 130,
    sortKey: "managementApproval",
    render: (r) => (
      <span className="text-sm">
        {r.managementApproval ? APPROVAL_LABEL[r.managementApproval] : "—"}
      </span>
    ),
  },
  status: {
    header: "Status",
    minWidth: 120,
    sortKey: "status",
    render: (r) => {
      const sb = STATUS_BADGE[r.status];
      return <Badge variant={sb.variant}>{sb.label}</Badge>;
    },
  },
  residualLikelihood: {
    header: "Residual Likelihood",
    minWidth: 150,
    render: (r) => (
      <span className="text-sm">
        {r.residualLikelihood ? PROBABILITY_LABEL[r.residualLikelihood] : "—"}
      </span>
    ),
  },
  residualImpact: {
    header: "Residual Impact",
    minWidth: 130,
    render: (r) => (
      <span className="text-sm">{r.residualImpact ? IMPACT_LABEL[r.residualImpact] : "—"}</span>
    ),
  },
  residualRiskScore: {
    header: "Residual Risk",
    minWidth: 120,
    sortKey: "residualRiskScore",
    render: (r) => {
      if (r.residualRiskScore == null) return <span className="text-xs text-neutral-400">—</span>;
      const sev = scoreSeverity(r.residualRiskScore);
      return <Badge variant={sev.variant}>{sev.label}</Badge>;
    },
  },
  remarks: {
    header: "Remarks",
    minWidth: 180,
    render: (r) => <span className="max-w-[200px] truncate text-sm">{r.remarks || "—"}</span>,
  },
  tags: {
    header: "Tags",
    minWidth: 120,
    render: (r) =>
      r.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {r.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
            >
              {t}
            </span>
          ))}
          {r.tags.length > 2 && (
            <span className="text-[10px] text-neutral-400">+{r.tags.length - 2}</span>
          )}
        </div>
      ) : (
        <span className="text-xs text-neutral-400">—</span>
      ),
  },
};

// Fields that should NOT appear in the table (only on detail page)
const DETAIL_ONLY_FIELDS = new Set([
  "description",
  "riskImpactDescription",
  "riskProperty",
  "probabilityScore",
  "impactScore",
  "treatmentRationale",
]);

// ──────────────────────────────────────────────
// Risk Register Page
// ──────────────────────────────────────────────

export default function RisksPage() {
  const router = useRouter();
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [stats, setStats] = useState<RiskStats | null>(null);
  const [fieldConfig, setFieldConfig] = useState<RiskFieldConfig[]>([]);
  const [configOpen, setConfigOpen] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);

  // Sort state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  // Column widths (keyed by field key, in px)
  const [colWidths, setColWidths] = useState<Record<string, number>>({});

  // Derive visible table columns from field config
  const visibleColumns = useMemo(() => {
    return fieldConfig
      .filter((f) => f.enabled && TABLE_COLUMNS[f.key] && !DETAIL_ONLY_FIELDS.has(f.key))
      .sort((a, b) => a.order - b.order);
  }, [fieldConfig]);

  // Sorted risks (client-side)
  const sortedRisks = useMemo(() => {
    if (!sortKey) return risks;
    const col = TABLE_COLUMNS[sortKey];
    if (!col?.sortKey) return risks;
    return [...risks].sort((a, b) => {
      const av = getSortValue(a, col.sortKey!);
      const bv = getSortValue(b, col.sortKey!);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [risks, sortKey, sortDir]);

  function handleSort(key: string) {
    const col = TABLE_COLUMNS[key];
    if (!col?.sortKey) return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const fetchRisks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const res = await apiClient.listRisks(params);
      setRisks(res.data.items);
      setTotal(res.data.total);
    } catch {
      setRisks([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, categoryFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.getRiskStats();
      setStats(res.data);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchFieldConfig = useCallback(async () => {
    try {
      const res = await apiClient.getRiskFieldConfig();
      setFieldConfig(res.data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchRisks();
  }, [fetchRisks]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  useEffect(() => {
    fetchFieldConfig();
  }, [fetchFieldConfig]);
  useEffect(() => {
    apiClient
      .listMembers()
      .then((r) => setMembers(r.data))
      .catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Risk Register</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Identify, assess, and manage organizational risks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setConfigOpen(true)}>
            <svg
              className="mr-1.5 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Configure Fields
          </Button>
          <Button onClick={() => setCreateOpen(true)}>Add Risk</Button>
        </div>
      </div>

      {/* Stats summary */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total}</p>
              <p className="text-xs text-neutral-500">Total Risks</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.openCount}</p>
              <p className="text-xs text-neutral-500">Open</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.severity.critical}</p>
              <p className="text-xs text-neutral-500">Critical</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{stats.severity.high}</p>
              <p className="text-xs text-neutral-500">High</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {stats.severity.medium + stats.severity.low}
              </p>
              <p className="text-xs text-neutral-500">Medium / Low</p>
            </div>
          </Card>
        </div>
      )}

      {/* Mini 5x5 heatmap */}
      {stats && stats.heatmapData.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Inherent Risk Heatmap
          </h3>
          <RiskHeatmapMini heatmapData={stats.heatmapData} />
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-72">
          <Input
            id="search"
            placeholder="Search risks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            id="status-filter"
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            id="category-filter"
            options={CATEGORY_OPTIONS}
            placeholder="All categories"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {(search || statusFilter || categoryFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setCategoryFilter("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
        <span className="ml-auto text-sm text-neutral-500 dark:text-neutral-400">
          {total} risk{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Risk table */}
      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
        ) : risks.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">
              {search || statusFilter || categoryFilter
                ? "No risks match your filters."
                : "No risks yet. Create your first risk to get started."}
            </p>
            {!search && !statusFilter && !categoryFilter && (
              <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
                Add Risk
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full text-left text-sm"
              style={{
                tableLayout: "fixed",
                minWidth: visibleColumns.reduce(
                  (sum, col) =>
                    sum + (colWidths[col.key] ?? TABLE_COLUMNS[col.key]?.minWidth ?? 100),
                  0,
                ),
              }}
            >
              <colgroup>
                {visibleColumns.map((col) => (
                  <col
                    key={col.key}
                    style={{ width: colWidths[col.key] ?? TABLE_COLUMNS[col.key]?.minWidth ?? 100 }}
                  />
                ))}
              </colgroup>
              <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                <tr>
                  {visibleColumns.map((col) => {
                    const def = TABLE_COLUMNS[col.key];
                    const isSortable = !!def?.sortKey;
                    const isActive = sortKey === col.key;
                    return (
                      <ResizableHeader
                        key={col.key}
                        colKey={col.key}
                        width={colWidths[col.key] ?? def?.minWidth ?? 100}
                        minWidth={def?.minWidth ?? 60}
                        onResize={(w) => setColWidths((prev) => ({ ...prev, [col.key]: w }))}
                        sortable={isSortable}
                        sortDir={isActive ? sortDir : undefined}
                        onSort={() => handleSort(col.key)}
                      >
                        {def?.header ?? col.label}
                      </ResizableHeader>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {sortedRisks.map((risk) => (
                  <tr
                    key={risk.id}
                    className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    onClick={() => router.push(`/risks/${risk.id}`)}
                  >
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className="overflow-hidden text-ellipsis px-4 py-3 text-neutral-700 dark:text-neutral-300"
                      >
                        {TABLE_COLUMNS[col.key]?.render(risk) ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create modal */}
      <CreateRiskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        members={members}
        fieldConfig={fieldConfig}
        onCreated={(id) => {
          setCreateOpen(false);
          router.push(`/risks/${id}`);
        }}
      />

      {/* Field config modal */}
      <FieldConfigModal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        fields={fieldConfig}
        onSaved={(updated) => {
          setFieldConfig(updated);
          setConfigOpen(false);
        }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────
// Resizable + Sortable Table Header
// ──────────────────────────────────────────────

function ResizableHeader({
  colKey: _colKey,
  width,
  minWidth,
  onResize,
  sortable,
  sortDir,
  onSort,
  children,
}: {
  colKey: string;
  width: number;
  minWidth: number;
  onResize: (newWidth: number) => void;
  sortable: boolean;
  sortDir?: SortDirection;
  onSort: () => void;
  children: React.ReactNode;
}) {
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startXRef.current = e.clientX;
    startWidthRef.current = width;

    function onMouseMove(ev: MouseEvent) {
      const delta = ev.clientX - startXRef.current;
      onResize(Math.max(minWidth, startWidthRef.current + delta));
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  return (
    <th
      className="relative select-none px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
      style={{ width }}
    >
      {sortable ? (
        <button
          type="button"
          className="inline-flex items-center gap-1 hover:text-neutral-800 dark:hover:text-neutral-200"
          onClick={onSort}
        >
          {children}
          <span className="inline-flex flex-col text-[8px] leading-none">
            <span
              className={
                sortDir === "asc" ? "text-blue-500" : "text-neutral-300 dark:text-neutral-600"
              }
            >
              &#9650;
            </span>
            <span
              className={
                sortDir === "desc" ? "text-blue-500" : "text-neutral-300 dark:text-neutral-600"
              }
            >
              &#9660;
            </span>
          </span>
        </button>
      ) : (
        children
      )}
      {/* resize handle */}
      <span
        className="absolute right-0 top-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-blue-400/40"
        onMouseDown={onMouseDown}
      />
    </th>
  );
}

// ──────────────────────────────────────────────
// Mini Heatmap (5x5 grid, read-only overview)
// ──────────────────────────────────────────────

function RiskHeatmapMini({
  heatmapData,
}: {
  heatmapData: { likelihood: number; impact: number; count: number }[];
}) {
  const grid = new Map<string, number>();
  for (const d of heatmapData) {
    grid.set(`${d.likelihood}:${d.impact}`, d.count);
  }

  function cellColor(l: number, i: number): string {
    const score = l * i;
    if (score >= 20) return "bg-red-500 dark:bg-red-600";
    if (score >= 12) return "bg-amber-400 dark:bg-amber-500";
    if (score >= 5) return "bg-yellow-300 dark:bg-yellow-400";
    return "bg-emerald-300 dark:bg-emerald-400";
  }

  const impactLabels = ["Negligible", "Minor", "Moderate", "Major", "Catastrophic"];
  const likelihoodLabels = ["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"];

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1">
        <div className="flex flex-col items-end gap-1 pb-6 pr-1">
          {[5, 4, 3, 2, 1].map((l) => (
            <div key={l} className="flex h-10 items-center justify-end">
              <span className="whitespace-nowrap text-[10px] text-neutral-500">
                {likelihoodLabels[l - 1]}
              </span>
            </div>
          ))}
        </div>
        <div>
          <div className="flex flex-col gap-1">
            {[5, 4, 3, 2, 1].map((l) => (
              <div key={l} className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => {
                  const count = grid.get(`${l}:${i}`) || 0;
                  return (
                    <div
                      key={`${l}-${i}`}
                      className={`flex h-10 w-14 items-center justify-center rounded text-xs font-semibold ${
                        count > 0
                          ? `${cellColor(l, i)} text-white`
                          : "bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600"
                      }`}
                      title={`Likelihood: ${l}, Impact: ${i}, Count: ${count}`}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1">
            {impactLabels.map((label) => (
              <div key={label} className="w-14 text-center text-[10px] text-neutral-500">
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[10px] text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-500" /> Critical (20-25)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-amber-400" /> High (12-19)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-yellow-300" /> Medium (5-11)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-emerald-300" /> Low (1-4)
        </span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Field Configuration Modal
// ──────────────────────────────────────────────

function FieldConfigModal({
  open,
  onClose,
  fields,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  fields: RiskFieldConfig[];
  onSaved: (updated: RiskFieldConfig[]) => void;
}) {
  const [localFields, setLocalFields] = useState<RiskFieldConfig[]>([]);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalFields(fields.map((f) => ({ ...f })));
    }
  }, [open, fields]);

  const grouped = useMemo(() => {
    const g: Record<string, RiskFieldConfig[]> = {};
    for (const f of localFields) {
      const group = f.group || "other";
      if (!g[group]) g[group] = [];
      g[group].push(f);
    }
    // Iterate values directly so TS doesn't have to prove the
    // `g[key]` lookup is defined under noUncheckedIndexedAccess.
    for (const arr of Object.values(g)) {
      arr.sort((a, b) => a.order - b.order);
    }
    return g;
  }, [localFields]);

  function toggleField(key: string) {
    setLocalFields((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)));
  }

  function toggleGroup(group: string, enable: boolean) {
    setLocalFields((prev) => prev.map((f) => (f.group === group ? { ...f, enabled: enable } : f)));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await apiClient.updateRiskFieldConfig(localFields);
      onSaved(res.data);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      const res = await apiClient.resetRiskFieldConfig();
      onSaved(res.data);
    } catch {
      /* ignore */
    } finally {
      setResetting(false);
    }
  }

  const enabledCount = localFields.filter((f) => f.enabled).length;

  return (
    <Modal open={open} onClose={onClose} title="Configure Risk Register Fields" size="lg">
      <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
        Choose which fields appear in the risk register table and forms.{" "}
        <strong>{enabledCount}</strong> of {localFields.length} fields enabled.
      </p>

      <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-2">
        {Object.entries(grouped).map(([group, groupFields]) => {
          const allEnabled = groupFields.every((f) => f.enabled);
          const someEnabled = groupFields.some((f) => f.enabled);
          return (
            <div
              key={group}
              className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
            >
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  {FIELD_GROUPS[group] || group}
                </h4>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  onClick={() => toggleGroup(group, !allEnabled)}
                >
                  {allEnabled ? "Disable all" : someEnabled ? "Enable all" : "Enable all"}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {groupFields.map((field) => (
                  <label
                    key={field.key}
                    className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800 ${
                      field.required ? "opacity-70" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600"
                      checked={field.enabled}
                      disabled={field.required}
                      onChange={() => toggleField(field.key)}
                    />
                    <span className="text-neutral-700 dark:text-neutral-300">{field.label}</span>
                    {field.required && (
                      <span className="text-[10px] text-neutral-400">(required)</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button variant="ghost" size="sm" onClick={handleReset} loading={resetting}>
          Reset to Defaults
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save Configuration
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────
// Create Risk Modal — respects field config
// ──────────────────────────────────────────────

function CreateRiskModal({
  open,
  onClose,
  members,
  fieldConfig,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  members: OrgMember[];
  fieldConfig: RiskFieldConfig[];
  onCreated: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [riskImpactDescription, setRiskImpactDescription] = useState("");
  const [category, setCategory] = useState<RiskCategoryType>("operational");
  const [businessProcess, setBusinessProcess] = useState("");
  const [department, setDepartment] = useState("");
  const [probability, setProbability] = useState<string>("");
  const [impact, setImpact] = useState<string>("");
  const [controlDescription, setControlDescription] = useState("");
  const [controlEffectiveness, setControlEffectiveness] = useState("");
  const [treatmentStrategy, setTreatmentStrategy] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [actionOwnerId, setActionOwnerId] = useState("");
  const [estStartDate, setEstStartDate] = useState("");
  const [estEndDate, setEstEndDate] = useState("");
  const [budgetApproval, setBudgetApproval] = useState("");
  const [managementApproval, setManagementApproval] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [remarks, setRemarks] = useState("");

  const enabledKeys = useMemo(
    () => new Set(fieldConfig.filter((f) => f.enabled).map((f) => f.key)),
    [fieldConfig],
  );
  function isVisible(key: string): boolean {
    return enabledKeys.size === 0 || enabledKeys.has(key);
  }

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setRiskImpactDescription("");
      setCategory("operational");
      setBusinessProcess("");
      setDepartment("");
      setProbability("");
      setImpact("");
      setControlDescription("");
      setControlEffectiveness("");
      setTreatmentStrategy("");
      setActionPlan("");
      setActionOwnerId("");
      setEstStartDate("");
      setEstEndDate("");
      setBudgetApproval("");
      setManagementApproval("");
      setOwnerId("");
      setRemarks("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);

    const payload: CreateRiskInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      riskImpactDescription: riskImpactDescription.trim() || undefined,
      category,
      businessProcess: businessProcess.trim() || null,
      department: (department as RiskDepartmentType) || null,
      probability: (probability as ProbabilityLevelType) || null,
      impact: (impact as ImpactLevelType) || null,
      controlDescription: controlDescription.trim() || null,
      controlEffectiveness: (controlEffectiveness as ControlEffectivenessType) || null,
      treatmentStrategy: (treatmentStrategy as TreatmentStrategyType) || null,
      actionPlan: actionPlan.trim() || null,
      actionOwnerId: actionOwnerId || null,
      estStartDate: estStartDate || null,
      estEndDate: estEndDate || null,
      budgetApproval: (budgetApproval as ApprovalStatusType) || null,
      managementApproval: (managementApproval as ApprovalStatusType) || null,
      ownerId: ownerId || null,
      remarks: remarks.trim() || null,
    };

    try {
      const res = await apiClient.createRisk(payload);
      onCreated(res.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create risk");
    } finally {
      setSaving(false);
    }
  }

  const memberOptions = members.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.email})`,
  }));

  return (
    <Modal open={open} onClose={onClose} title="Add New Risk" size="xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Core */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Basic Information
          </legend>
          <Input
            id="title"
            label="Risk Item *"
            placeholder="e.g. Data breach from third-party vendor"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          {isVisible("description") && (
            <Textarea
              id="description"
              label="Description"
              placeholder="Describe the risk scenario..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          )}
          {isVisible("riskImpactDescription") && (
            <Textarea
              id="riskImpact"
              label="Risk Impact Description"
              placeholder="Describe potential consequences..."
              value={riskImpactDescription}
              onChange={(e) => setRiskImpactDescription(e.target.value)}
              rows={2}
            />
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {isVisible("category") && (
              <Select
                id="category"
                label="Category"
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={(e) => setCategory(e.target.value as RiskCategoryType)}
              />
            )}
            {isVisible("businessProcess") && (
              <Input
                id="businessProcess"
                label="Business Process"
                placeholder="e.g. IT Governance"
                value={businessProcess}
                onChange={(e) => setBusinessProcess(e.target.value)}
              />
            )}
            {isVisible("department") && (
              <Select
                id="department"
                label="Department"
                options={DEPARTMENT_OPTIONS}
                placeholder="Select..."
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isVisible("ownerId") && (
              <Select
                id="owner"
                label="Risk Owner"
                options={memberOptions}
                placeholder="Select owner..."
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
              />
            )}
          </div>
        </fieldset>

        {/* Inherent Risk */}
        {(isVisible("probability") || isVisible("impact")) && (
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Inherent Risk Rating
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isVisible("probability") && (
                <Select
                  id="probability"
                  label="Probability"
                  options={PROBABILITY_OPTIONS}
                  placeholder="Select..."
                  value={probability}
                  onChange={(e) => setProbability(e.target.value)}
                />
              )}
              {isVisible("impact") && (
                <Select
                  id="impact"
                  label="Impact"
                  options={IMPACT_LEVEL_OPTIONS}
                  placeholder="Select..."
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                />
              )}
            </div>
          </fieldset>
        )}

        {/* Controls */}
        {(isVisible("controlDescription") ||
          isVisible("controlEffectiveness") ||
          isVisible("treatmentStrategy")) && (
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Controls & Treatment
            </legend>
            {isVisible("controlDescription") && (
              <Textarea
                id="controlDesc"
                label="Control Description"
                placeholder="Describe existing controls..."
                value={controlDescription}
                onChange={(e) => setControlDescription(e.target.value)}
                rows={2}
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isVisible("controlEffectiveness") && (
                <Select
                  id="controlEff"
                  label="Effectiveness of Control"
                  options={CONTROL_EFFECTIVENESS_OPTIONS}
                  placeholder="Select..."
                  value={controlEffectiveness}
                  onChange={(e) => setControlEffectiveness(e.target.value)}
                />
              )}
              {isVisible("treatmentStrategy") && (
                <Select
                  id="treatment"
                  label="Risk Treatment Option"
                  options={TREATMENT_STRATEGY_OPTIONS}
                  placeholder="Select..."
                  value={treatmentStrategy}
                  onChange={(e) => setTreatmentStrategy(e.target.value)}
                />
              )}
            </div>
          </fieldset>
        )}

        {/* Action Plan */}
        {(isVisible("actionPlan") ||
          isVisible("actionOwnerId") ||
          isVisible("estStartDate") ||
          isVisible("estEndDate")) && (
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Action Plan
            </legend>
            {isVisible("actionPlan") && (
              <Textarea
                id="actionPlan"
                label="Action Plan"
                placeholder="Describe planned actions..."
                value={actionPlan}
                onChange={(e) => setActionPlan(e.target.value)}
                rows={2}
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {isVisible("actionOwnerId") && (
                <Select
                  id="actionOwner"
                  label="Action Owner"
                  options={memberOptions}
                  placeholder="Select..."
                  value={actionOwnerId}
                  onChange={(e) => setActionOwnerId(e.target.value)}
                />
              )}
              {isVisible("estStartDate") && (
                <Input
                  id="estStart"
                  label="EST Start Date"
                  type="date"
                  value={estStartDate}
                  onChange={(e) => setEstStartDate(e.target.value)}
                />
              )}
              {isVisible("estEndDate") && (
                <Input
                  id="estEnd"
                  label="EST End Date"
                  type="date"
                  value={estEndDate}
                  onChange={(e) => setEstEndDate(e.target.value)}
                />
              )}
            </div>
          </fieldset>
        )}

        {/* Approvals */}
        {(isVisible("budgetApproval") || isVisible("managementApproval")) && (
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Approvals
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {isVisible("budgetApproval") && (
                <Select
                  id="budgetAppr"
                  label="Budget Approval"
                  options={APPROVAL_OPTIONS}
                  placeholder="Select..."
                  value={budgetApproval}
                  onChange={(e) => setBudgetApproval(e.target.value)}
                />
              )}
              {isVisible("managementApproval") && (
                <Select
                  id="mgmtAppr"
                  label="Management Approval"
                  options={APPROVAL_OPTIONS}
                  placeholder="Select..."
                  value={managementApproval}
                  onChange={(e) => setManagementApproval(e.target.value)}
                />
              )}
            </div>
          </fieldset>
        )}

        {/* Remarks */}
        {isVisible("remarks") && (
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Additional
            </legend>
            <Textarea
              id="remarks"
              label="Remarks"
              placeholder="Any additional notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
            />
          </fieldset>
        )}

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Create Risk
          </Button>
        </div>
      </form>
    </Modal>
  );
}
