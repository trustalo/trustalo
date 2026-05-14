"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoDrawer } from "@/components/ui/info-drawer";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  type AIRiskAssessment,
  type AIRiskAssessmentStats,
  type AIRiskAssessmentStatus,
  type AISystem,
  type CreateAIRiskAssessmentInput,
  type RiskRating,
} from "@/lib/api-client";

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: AIRiskAssessmentStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "approved", label: "Approved" },
];

const RATING_OPTIONS: { value: RiskRating; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const STATUS_BADGE: Record<AIRiskAssessmentStatus, { variant: BadgeVariant; label: string }> = {
  draft: { variant: "neutral", label: "Draft" },
  in_progress: { variant: "info", label: "In Progress" },
  completed: { variant: "warning", label: "Completed" },
  approved: { variant: "success", label: "Approved" },
};

const RATING_BADGE: Record<RiskRating, { variant: BadgeVariant; label: string }> = {
  low: { variant: "success", label: "Low" },
  medium: { variant: "warning", label: "Medium" },
  high: { variant: "danger", label: "High" },
};

// Component dimensions follow the structured taxonomy used by NIST AI RMF
// + EU AI Act risk categories. Editing one field at a time matches the
// detail-drawer flow Drata / Vanta use for control assessments.
const RISK_DIMENSIONS = [
  { key: "biasRisk", label: "Bias / fairness" },
  { key: "privacyRisk", label: "Privacy" },
  { key: "safetyRisk", label: "Safety" },
  { key: "securityRisk", label: "Security" },
  { key: "misuseRisk", label: "Misuse" },
] as const;

const SORTABLE = new Set(["assessedAt", "nextReviewDate", "overallRisk", "status", "updatedAt"]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function isOverdue(s: string | null | undefined): boolean {
  if (!s) return false;
  return new Date(s) < new Date();
}

// ── Inline icons ─────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg
      className="mr-1.5 h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
function ListIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 5.25h16.5m-16.5 6.75h16.5m-16.5 6.75h16.5"
      />
    </svg>
  );
}
function FlameIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
      />
    </svg>
  );
}
function AlertIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}
function ClockIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
function CheckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
function SortIcon({ direction }: { direction?: "asc" | "desc" | null }) {
  return (
    <svg
      className={`h-3.5 w-3.5 ${direction ? "text-blue-600" : "text-neutral-400"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      {direction === "asc" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      ) : direction === "desc" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
      )}
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg className="h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc";

export default function AIRiskAssessmentsPage() {
  const [items, setItems] = useState<AIRiskAssessment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [systemFilter, setSystemFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [sortBy, setSortBy] = useState<string>("assessedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [stats, setStats] = useState<AIRiskAssessmentStats | null>(null);
  const [systems, setSystems] = useState<AISystem[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<AIRiskAssessment | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
        sortBy,
        sortDir,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (riskFilter) params.overallRisk = riskFilter;
      if (systemFilter) params.aiSystemId = systemFilter;
      if (overdueOnly) params.overdueOnly = "true";
      const res = await apiClient.listAIRiskAssessments(params);
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortDir, search, statusFilter, riskFilter, systemFilter, overdueOnly]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.getAIRiskAssessmentStats();
      setStats(res.data);
    } catch {
      /* swallow */
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    apiClient
      .listAISystems({ page: "1", limit: "200" })
      .then((r) => setSystems(r.data.items))
      .catch(() => setSystems([]));
  }, []);

  const refresh = useCallback(() => {
    fetchItems();
    fetchStats();
  }, [fetchItems, fetchStats]);

  const totalPages = Math.ceil(total / limit);
  const systemOptions = useMemo(
    () => systems.map((s) => ({ value: s.id, label: s.name })),
    [systems],
  );
  const filtersActive = Boolean(
    search || statusFilter || riskFilter || systemFilter || overdueOnly,
  );

  function toggleSort(column: string) {
    if (!SORTABLE.has(column)) return;
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
    setPage(1);
  }

  function sortDirFor(column: string): SortDir | null {
    return sortBy === column ? sortDir : null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
          Structured risk assessments per AI system across bias, privacy, safety, security, and
          misuse. Overall rating is auto-derived from the highest component, with optional manual
          override and residual-risk capture.
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          New Assessment
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            icon={<ListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            tone="blue"
            value={stats.total}
            label="Assessments"
          />
          <KpiCard
            icon={<FlameIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
            tone="red"
            value={stats.highRiskCount}
            label="High-risk"
            valueClass={stats.highRiskCount > 0 ? "text-red-600" : undefined}
          />
          <KpiCard
            icon={<CheckIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            tone="emerald"
            value={stats.byStatus.approved || 0}
            label="Approved"
          />
          <KpiCard
            icon={<AlertIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
            tone="red"
            value={stats.overdueReviews}
            label="Overdue Reviews"
            valueClass={stats.overdueReviews > 0 ? "text-red-600" : undefined}
          />
          <KpiCard
            icon={<ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            tone="amber"
            value={stats.upcomingReviews}
            label="Reviews Due (30d)"
          />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-72">
          <Input
            id="ar-search"
            placeholder="Search title, methodology, mitigation…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            id="ar-status"
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Select
            id="ar-risk"
            options={RATING_OPTIONS}
            placeholder="All risk levels"
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-56">
          <Select
            id="ar-system"
            options={systemOptions}
            placeholder="All AI systems"
            value={systemFilter}
            onChange={(e) => {
              setSystemFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
            checked={overdueOnly}
            onChange={(e) => {
              setOverdueOnly(e.target.checked);
              setPage(1);
            }}
          />
          Overdue only
        </label>
        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setRiskFilter("");
              setSystemFilter("");
              setOverdueOnly(false);
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
        <span className="ml-auto pb-2 text-sm text-neutral-500 dark:text-neutral-400">
          {total} {total === 1 ? "assessment" : "assessments"}
        </span>
      </div>

      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <SpinnerIcon />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            filtered={filtersActive}
            onCreate={() => setCreateOpen(true)}
            disabled={systems.length === 0}
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Assessment</TableHeader>
                <TableHeader>AI System</TableHeader>
                <SortableHeader
                  label="Overall"
                  column="overallRisk"
                  current={sortDirFor("overallRisk")}
                  onClick={toggleSort}
                />
                <TableHeader>Residual</TableHeader>
                <SortableHeader
                  label="Status"
                  column="status"
                  current={sortDirFor("status")}
                  onClick={toggleSort}
                />
                <TableHeader>Assessed by</TableHeader>
                <SortableHeader
                  label="Assessed"
                  column="assessedAt"
                  current={sortDirFor("assessedAt")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Next Review"
                  column="nextReviewDate"
                  current={sortDirFor("nextReviewDate")}
                  onClick={toggleSort}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((a) => {
                const overdue = isOverdue(a.nextReviewDate);
                const stat = STATUS_BADGE[a.status];
                return (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    onClick={() => setActive(a)}
                  >
                    <TableCell>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {a.title || "Untitled assessment"}
                      </span>
                      {a.methodology && <p className="text-xs text-neutral-500">{a.methodology}</p>}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{a.aiSystem.name}</span>
                    </TableCell>
                    <TableCell>
                      {a.overallRisk ? (
                        <Badge variant={RATING_BADGE[a.overallRisk].variant}>
                          {RATING_BADGE[a.overallRisk].label}
                        </Badge>
                      ) : (
                        <span className="text-sm text-neutral-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.residualRisk ? (
                        <Badge variant={RATING_BADGE[a.residualRisk].variant}>
                          {RATING_BADGE[a.residualRisk].label}
                        </Badge>
                      ) : (
                        <span className="text-sm text-neutral-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={stat.variant}>{stat.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{a.assessedBy.name}</span>
                    </TableCell>
                    <TableCell>{formatDate(a.assessedAt)}</TableCell>
                    <TableCell>
                      <span className={overdue ? "text-red-600 dark:text-red-400" : ""}>
                        {formatDate(a.nextReviewDate)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <RiskFormModal
        mode="create"
        open={createOpen}
        systems={systems}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          refresh();
        }}
      />

      <RiskDetailDrawer
        assessment={active}
        systems={systems}
        onClose={() => setActive(null)}
        onChanged={(updated) => {
          setActive(updated);
          refresh();
        }}
        onDeleted={(id) => {
          setActive(null);
          refresh();
          if (items.length === 1 && page > 1) setPage((p) => p - 1);
          void id;
        }}
      />
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  icon,
  tone,
  value,
  label,
  valueClass,
}: {
  icon: React.ReactNode;
  tone: "blue" | "red" | "amber" | "emerald" | "purple";
  value: number;
  label: string;
  valueClass?: string;
}) {
  const tones: Record<typeof tone, string> = {
    blue: "bg-blue-50 dark:bg-blue-950",
    red: "bg-red-50 dark:bg-red-950",
    amber: "bg-amber-50 dark:bg-amber-950",
    emerald: "bg-emerald-50 dark:bg-emerald-950",
    purple: "bg-purple-50 dark:bg-purple-950",
  };
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${tones[tone]}`}>{icon}</div>
        <div>
          <p className={`text-2xl font-bold ${valueClass ?? "text-neutral-900 dark:text-white"}`}>
            {value}
          </p>
          <p className="text-xs text-neutral-500">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function SortableHeader({
  label,
  column,
  current,
  onClick,
}: {
  label: string;
  column: string;
  current: SortDir | null;
  onClick: (column: string) => void;
}) {
  return (
    <TableHeader>
      <button
        type="button"
        onClick={() => onClick(column)}
        className="-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {label}
        <SortIcon direction={current} />
      </button>
    </TableHeader>
  );
}

function EmptyState({
  filtered,
  onCreate,
  disabled,
}: {
  filtered: boolean;
  onCreate: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <ListIcon className="h-6 w-6 text-neutral-400" />
      </div>
      <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
        {filtered ? "No assessments match your filters" : "No risk assessments yet"}
      </h3>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        {filtered
          ? "Try adjusting your search or filters."
          : disabled
            ? "Add an AI system in the Inventory tab to begin."
            : "Capture a structured risk assessment for an AI system to begin."}
      </p>
      {!filtered && !disabled && (
        <Button className="mt-4" size="sm" onClick={onCreate}>
          New Assessment
        </Button>
      )}
    </div>
  );
}

// ── Form ─────────────────────────────────────────────────────────────────────

interface RiskFormState {
  aiSystemId: string;
  title: string;
  methodology: string;
  biasRisk: RiskRating;
  privacyRisk: RiskRating;
  safetyRisk: RiskRating;
  securityRisk: RiskRating;
  misuseRisk: RiskRating;
  overallRisk: "" | RiskRating;
  residualRisk: "" | RiskRating;
  mitigationPlan: string;
  status: AIRiskAssessmentStatus;
  nextReviewDate: string;
}

const EMPTY_FORM: RiskFormState = {
  aiSystemId: "",
  title: "",
  methodology: "",
  biasRisk: "low",
  privacyRisk: "low",
  safetyRisk: "low",
  securityRisk: "low",
  misuseRisk: "low",
  overallRisk: "",
  residualRisk: "",
  mitigationPlan: "",
  status: "draft",
  nextReviewDate: "",
};

function toForm(a: AIRiskAssessment): RiskFormState {
  return {
    aiSystemId: a.aiSystemId,
    title: a.title ?? "",
    methodology: a.methodology ?? "",
    biasRisk: a.biasRisk,
    privacyRisk: a.privacyRisk,
    safetyRisk: a.safetyRisk,
    securityRisk: a.securityRisk,
    misuseRisk: a.misuseRisk,
    overallRisk: a.overallRisk ?? "",
    residualRisk: a.residualRisk ?? "",
    mitigationPlan: a.mitigationPlan ?? "",
    status: a.status,
    nextReviewDate: a.nextReviewDate ? a.nextReviewDate.slice(0, 10) : "",
  };
}

function RiskFormModal({
  mode,
  open,
  initial,
  systems,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  open: boolean;
  initial?: AIRiskAssessment;
  systems: AISystem[];
  onClose: () => void;
  onSaved: (a: AIRiskAssessment) => void;
}) {
  const [form, setForm] = useState<RiskFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(initial ? toForm(initial) : EMPTY_FORM);
  }, [open, initial]);

  function patch<K extends keyof RiskFormState>(key: K, value: RiskFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.aiSystemId && mode === "create") {
      setError("Pick an AI system.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: CreateAIRiskAssessmentInput = {
        aiSystemId: form.aiSystemId,
        title: form.title || null,
        methodology: form.methodology || null,
        biasRisk: form.biasRisk,
        privacyRisk: form.privacyRisk,
        safetyRisk: form.safetyRisk,
        securityRisk: form.securityRisk,
        misuseRisk: form.misuseRisk,
        overallRisk: form.overallRisk === "" ? null : form.overallRisk,
        residualRisk: form.residualRisk === "" ? null : form.residualRisk,
        mitigationPlan: form.mitigationPlan || null,
        status: form.status,
        nextReviewDate: form.nextReviewDate || null,
      };
      const res =
        mode === "create"
          ? await apiClient.createAIRiskAssessment(payload)
          : await apiClient.updateAIRiskAssessment(initial!.id, {
              title: payload.title,
              methodology: payload.methodology,
              biasRisk: payload.biasRisk,
              privacyRisk: payload.privacyRisk,
              safetyRisk: payload.safetyRisk,
              securityRisk: payload.securityRisk,
              misuseRisk: payload.misuseRisk,
              overallRisk: payload.overallRisk,
              residualRisk: payload.residualRisk,
              mitigationPlan: payload.mitigationPlan,
              status: payload.status,
              nextReviewDate: payload.nextReviewDate,
            });
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save assessment.");
    } finally {
      setSaving(false);
    }
  }

  const systemOpts = useMemo(() => systems.map((s) => ({ value: s.id, label: s.name })), [systems]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "New risk assessment" : "Edit risk assessment"}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <FormSection title="Scope">
          <div className="grid grid-cols-2 gap-3">
            <Select
              id="ar-form-system"
              label="AI system"
              required
              options={systemOpts}
              placeholder="Select a system…"
              value={form.aiSystemId}
              onChange={(e) => patch("aiSystemId", e.target.value)}
              disabled={mode === "edit"}
            />
            <Select
              id="ar-form-status"
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => patch("status", e.target.value as AIRiskAssessmentStatus)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="ar-form-title"
              label="Title"
              placeholder="Q2 quarterly assessment"
              value={form.title}
              onChange={(e) => patch("title", e.target.value)}
            />
            <Input
              id="ar-form-methodology"
              label="Methodology"
              placeholder="NIST AI RMF / EU AI Act / ISO 42001"
              value={form.methodology}
              onChange={(e) => patch("methodology", e.target.value)}
            />
          </div>
        </FormSection>

        <FormSection
          title="Risk dimensions"
          description="Rate each dimension. The overall rating defaults to the highest unless you override it."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {RISK_DIMENSIONS.map((d) => (
              <Select
                key={d.key}
                id={`ar-form-${d.key}`}
                label={d.label}
                options={RATING_OPTIONS}
                value={form[d.key]}
                onChange={(e) => patch(d.key, e.target.value as RiskRating)}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              id="ar-form-overall"
              label="Overall (override)"
              options={[{ value: "", label: "Auto from dimensions" }, ...RATING_OPTIONS]}
              value={form.overallRisk}
              onChange={(e) => patch("overallRisk", e.target.value as "" | RiskRating)}
            />
            <Select
              id="ar-form-residual"
              label="Residual risk (post-mitigation)"
              options={[{ value: "", label: "Not yet rated" }, ...RATING_OPTIONS]}
              value={form.residualRisk}
              onChange={(e) => patch("residualRisk", e.target.value as "" | RiskRating)}
            />
          </div>
        </FormSection>

        <FormSection title="Mitigation">
          <Textarea
            id="ar-form-mitigation"
            label="Mitigation plan"
            rows={4}
            placeholder="Describe controls, monitoring, and human oversight applied…"
            value={form.mitigationPlan}
            onChange={(e) => patch("mitigationPlan", e.target.value)}
          />
        </FormSection>

        <FormSection title="Review">
          <Input
            id="ar-form-next-review"
            label="Next review date"
            type="date"
            value={form.nextReviewDate}
            onChange={(e) => patch("nextReviewDate", e.target.value)}
          />
        </FormSection>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {mode === "create" ? "Create assessment" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h3>
        {description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

// ── Detail drawer ────────────────────────────────────────────────────────────

function RiskDetailDrawer({
  assessment,
  systems,
  onClose,
  onChanged,
  onDeleted,
}: {
  assessment: AIRiskAssessment | null;
  systems: AISystem[];
  onClose: () => void;
  onChanged: (a: AIRiskAssessment) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    setEditing(false);
  }, [assessment?.id]);

  if (!assessment) return null;

  const stat = STATUS_BADGE[assessment.status];
  const overdue = isOverdue(assessment.nextReviewDate);

  async function handleComplete() {
    if (!assessment) return;
    setActing(true);
    try {
      const r = await apiClient.completeAIRiskAssessment(assessment.id);
      onChanged(r.data);
    } catch {
      /* swallow */
    } finally {
      setActing(false);
    }
  }

  async function handleApprove() {
    if (!assessment) return;
    setActing(true);
    try {
      const r = await apiClient.approveAIRiskAssessment(assessment.id);
      onChanged(r.data);
    } catch {
      /* swallow */
    } finally {
      setActing(false);
    }
  }

  async function handleDelete() {
    if (!assessment) return;
    if (!confirm("Delete this risk assessment? This cannot be undone.")) return;
    setActing(true);
    try {
      await apiClient.deleteAIRiskAssessment(assessment.id);
      onDeleted(assessment.id);
    } catch {
      setActing(false);
    }
  }

  return (
    <>
      <InfoDrawer
        open={!!assessment && !editing}
        onClose={onClose}
        title={assessment.title || `Risk assessment for ${assessment.aiSystem.name}`}
        widthClassName="max-w-xl"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={stat.variant}>{stat.label}</Badge>
            {assessment.overallRisk && (
              <Badge variant={RATING_BADGE[assessment.overallRisk].variant}>
                Overall: {RATING_BADGE[assessment.overallRisk].label}
              </Badge>
            )}
            {assessment.residualRisk && (
              <Badge variant={RATING_BADGE[assessment.residualRisk].variant}>
                Residual: {RATING_BADGE[assessment.residualRisk].label}
              </Badge>
            )}
            {overdue && <Badge variant="danger">Review overdue</Badge>}
          </div>

          <DetailGrid>
            <DetailField label="AI system">{assessment.aiSystem.name}</DetailField>
            <DetailField label="Methodology">{assessment.methodology || "—"}</DetailField>
            <DetailField label="Assessed by">{assessment.assessedBy.name}</DetailField>
            <DetailField label="Approved by">
              {assessment.approvedBy?.name || (
                <span className="italic text-neutral-400">Not yet approved</span>
              )}
            </DetailField>
          </DetailGrid>

          <SectionHeader>Risk dimensions</SectionHeader>
          <DetailGrid cols={4}>
            {RISK_DIMENSIONS.map((d) => {
              const v = assessment[d.key];
              return (
                <DetailField key={d.key} label={d.label}>
                  <Badge variant={RATING_BADGE[v].variant}>{RATING_BADGE[v].label}</Badge>
                </DetailField>
              );
            })}
          </DetailGrid>

          {assessment.mitigationPlan && (
            <>
              <SectionHeader>Mitigation plan</SectionHeader>
              <p className="whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-300">
                {assessment.mitigationPlan}
              </p>
            </>
          )}

          <SectionHeader>Lifecycle</SectionHeader>
          <DetailGrid>
            <DetailField label="Assessed at">{formatDate(assessment.assessedAt)}</DetailField>
            <DetailField label="Approved at">{formatDate(assessment.approvedAt)}</DetailField>
            <DetailField label="Next review">
              <span className={overdue ? "text-red-600 dark:text-red-400" : ""}>
                {formatDate(assessment.nextReviewDate)}
              </span>
            </DetailField>
            <DetailField label="Last updated">{formatDate(assessment.updatedAt)}</DetailField>
          </DetailGrid>

          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {assessment.status !== "completed" && assessment.status !== "approved" && (
              <Button size="sm" variant="secondary" loading={acting} onClick={handleComplete}>
                Mark completed
              </Button>
            )}
            {assessment.status !== "approved" && (
              <Button size="sm" variant="secondary" loading={acting} onClick={handleApprove}>
                Approve
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              loading={acting}
              onClick={handleDelete}
              className="ml-auto"
            >
              Delete
            </Button>
          </div>
        </div>
      </InfoDrawer>

      <RiskFormModal
        mode="edit"
        open={editing}
        initial={assessment}
        systems={systems}
        onClose={() => setEditing(false)}
        onSaved={(updated) => {
          setEditing(false);
          onChanged(updated);
        }}
      />
    </>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="border-b border-neutral-200 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
      {children}
    </h4>
  );
}

function DetailGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 4 }) {
  return (
    <div className={`grid gap-3 ${cols === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>
      {children}
    </div>
  );
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
      <div className="mt-0.5 text-sm text-neutral-900 dark:text-neutral-100">{children}</div>
    </div>
  );
}
