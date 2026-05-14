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
  type AIIncident,
  type AIIncidentCategory,
  type AIIncidentSeverity,
  type AIIncidentStats,
  type AIIncidentStatus,
  type AISystem,
  type CreateAIIncidentInput,
  type OrgMember,
} from "@/lib/api-client";

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: AIIncidentStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "mitigated", label: "Mitigated" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const SEVERITY_OPTIONS: { value: AIIncidentSeverity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

// Categories from EU AI Act Art. 73 + NIST AI RMF MANAGE-4. Keep labels short
// for table rendering; full descriptions live in the form copy.
const CATEGORY_OPTIONS: { value: AIIncidentCategory; label: string }[] = [
  { value: "bias", label: "Bias / fairness" },
  { value: "drift", label: "Model drift" },
  { value: "hallucination", label: "Hallucination" },
  { value: "accuracy", label: "Accuracy" },
  { value: "privacy", label: "Privacy" },
  { value: "security", label: "Security" },
  { value: "safety", label: "Safety" },
  { value: "misuse", label: "Misuse" },
  { value: "availability", label: "Availability" },
  { value: "other", label: "Other" },
];

const STATUS_BADGE: Record<AIIncidentStatus, { variant: BadgeVariant; label: string }> = {
  open: { variant: "danger", label: "Open" },
  investigating: { variant: "warning", label: "Investigating" },
  mitigated: { variant: "info", label: "Mitigated" },
  resolved: { variant: "success", label: "Resolved" },
  closed: { variant: "neutral", label: "Closed" },
};

const SEVERITY_BADGE: Record<AIIncidentSeverity, { variant: BadgeVariant; label: string }> = {
  low: { variant: "neutral", label: "Low" },
  medium: { variant: "info", label: "Medium" },
  high: { variant: "warning", label: "High" },
  critical: { variant: "danger", label: "Critical" },
};

const SORTABLE = new Set([
  "detectedAt",
  "reportedAt",
  "resolvedAt",
  "severity",
  "status",
  "updatedAt",
]);

const TRANSITIONS: Record<AIIncidentStatus, ("investigate" | "mitigate" | "resolve" | "close")[]> =
  {
    open: ["investigate"],
    investigating: ["mitigate", "resolve"],
    mitigated: ["resolve"],
    resolved: ["close"],
    closed: [],
  };

const TRANSITION_LABELS: Record<"investigate" | "mitigate" | "resolve" | "close", string> = {
  investigate: "Start investigation",
  mitigate: "Mark mitigated",
  resolve: "Resolve",
  close: "Close",
};

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

function categoryLabel(c: AIIncidentCategory): string {
  return CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c;
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

export default function AIIncidentsPage() {
  const [items, setItems] = useState<AIIncident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [systemFilter, setSystemFilter] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  const [sortBy, setSortBy] = useState<string>("detectedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [stats, setStats] = useState<AIIncidentStats | null>(null);
  const [systems, setSystems] = useState<AISystem[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<AIIncident | null>(null);

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
      if (severityFilter) params.severity = severityFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (systemFilter) params.aiSystemId = systemFilter;
      if (openOnly) params.openOnly = "true";
      const res = await apiClient.listAIIncidents(params);
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    sortBy,
    sortDir,
    search,
    statusFilter,
    severityFilter,
    categoryFilter,
    systemFilter,
    openOnly,
  ]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.getAIIncidentStats();
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
    apiClient
      .listMembers()
      .then((r) => setMembers(r.data))
      .catch(() => setMembers([]));
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
    search || statusFilter || severityFilter || categoryFilter || systemFilter || openOnly,
  );

  function toggleSort(column: string) {
    if (!SORTABLE.has(column)) return;
    if (sortBy === column) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
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
          Operational log of AI incidents — bias, drift, hallucinations, privacy/security/safety
          failures. Each incident has a tracked lifecycle from open → investigating → mitigated →
          resolved → closed.
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          New Incident
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            icon={<ListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            tone="blue"
            value={stats.total}
            label="Incidents"
          />
          <KpiCard
            icon={<AlertIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            tone="amber"
            value={stats.openCount}
            label="Open"
            valueClass={stats.openCount > 0 ? "text-amber-600" : undefined}
          />
          <KpiCard
            icon={<FlameIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
            tone="red"
            value={stats.criticalOpenCount}
            label="Critical Open"
            valueClass={stats.criticalOpenCount > 0 ? "text-red-600" : undefined}
          />
          <KpiCard
            icon={<CheckIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            tone="emerald"
            value={stats.resolvedThisMonth}
            label="Resolved (This Month)"
          />
          <KpiCard
            icon={<ClockIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            tone="purple"
            value={stats.meanResolutionHours}
            label="Mean Resolution (h)"
          />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-72">
          <Input
            id="ai-inc-search"
            placeholder="Search title, description, root cause…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            id="ai-inc-status"
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
            id="ai-inc-severity"
            options={SEVERITY_OPTIONS}
            placeholder="All severities"
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            id="ai-inc-category"
            options={CATEGORY_OPTIONS}
            placeholder="All categories"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-56">
          <Select
            id="ai-inc-system"
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
            checked={openOnly}
            onChange={(e) => {
              setOpenOnly(e.target.checked);
              setPage(1);
            }}
          />
          Open only
        </label>
        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setSeverityFilter("");
              setCategoryFilter("");
              setSystemFilter("");
              setOpenOnly(false);
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
        <span className="ml-auto pb-2 text-sm text-neutral-500 dark:text-neutral-400">
          {total} {total === 1 ? "incident" : "incidents"}
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
                <TableHeader>Title</TableHeader>
                <TableHeader>AI System</TableHeader>
                <TableHeader>Category</TableHeader>
                <SortableHeader
                  label="Severity"
                  column="severity"
                  current={sortDirFor("severity")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Status"
                  column="status"
                  current={sortDirFor("status")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Detected"
                  column="detectedAt"
                  current={sortDirFor("detectedAt")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Resolved"
                  column="resolvedAt"
                  current={sortDirFor("resolvedAt")}
                  onClick={toggleSort}
                />
                <TableHeader>Assignee</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((i) => {
                const stat = STATUS_BADGE[i.status];
                const sev = SEVERITY_BADGE[i.severity];
                return (
                  <TableRow
                    key={i.id}
                    className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    onClick={() => setActive(i)}
                  >
                    <TableCell>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {i.title}
                      </span>
                      {i.externalNotificationRequired && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400">
                          External notification required
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{i.aiSystem.name}</TableCell>
                    <TableCell>{categoryLabel(i.category)}</TableCell>
                    <TableCell>
                      <Badge variant={sev.variant}>{sev.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stat.variant}>{stat.label}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(i.detectedAt)}</TableCell>
                    <TableCell>{formatDate(i.resolvedAt)}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {i.assignee?.name || (
                          <span className="italic text-neutral-400">Unassigned</span>
                        )}
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

      <IncidentFormModal
        mode="create"
        open={createOpen}
        systems={systems}
        members={members}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          refresh();
        }}
      />

      <IncidentDetailDrawer
        incident={active}
        systems={systems}
        members={members}
        onClose={() => setActive(null)}
        onChanged={(updated) => {
          setActive(updated);
          refresh();
        }}
        onDeleted={() => {
          setActive(null);
          refresh();
          if (items.length === 1 && page > 1) setPage((p) => p - 1);
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
        {filtered ? "No incidents match your filters" : "No incidents logged yet"}
      </h3>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        {filtered
          ? "Try adjusting your search or filters."
          : disabled
            ? "Add an AI system in the Inventory tab to begin."
            : "Log an incident the moment you spot bias, drift, or any failure."}
      </p>
      {!filtered && !disabled && (
        <Button className="mt-4" size="sm" onClick={onCreate}>
          New Incident
        </Button>
      )}
    </div>
  );
}

// ── Form ─────────────────────────────────────────────────────────────────────

interface IncidentFormState {
  aiSystemId: string;
  title: string;
  description: string;
  category: AIIncidentCategory;
  severity: AIIncidentSeverity;
  status: AIIncidentStatus;
  detectedAt: string;
  rootCause: string;
  remediation: string;
  externalNotificationRequired: boolean;
  externalNotificationSentAt: string;
  assigneeId: string;
}

const EMPTY_FORM: IncidentFormState = {
  aiSystemId: "",
  title: "",
  description: "",
  category: "other",
  severity: "medium",
  status: "open",
  detectedAt: new Date().toISOString().slice(0, 10),
  rootCause: "",
  remediation: "",
  externalNotificationRequired: false,
  externalNotificationSentAt: "",
  assigneeId: "",
};

function toForm(i: AIIncident): IncidentFormState {
  return {
    aiSystemId: i.aiSystemId,
    title: i.title,
    description: i.description ?? "",
    category: i.category,
    severity: i.severity,
    status: i.status,
    detectedAt: i.detectedAt ? i.detectedAt.slice(0, 10) : "",
    rootCause: i.rootCause ?? "",
    remediation: i.remediation ?? "",
    externalNotificationRequired: i.externalNotificationRequired,
    externalNotificationSentAt: i.externalNotificationSentAt
      ? i.externalNotificationSentAt.slice(0, 10)
      : "",
    assigneeId: i.assigneeId ?? "",
  };
}

function IncidentFormModal({
  mode,
  open,
  initial,
  systems,
  members,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  open: boolean;
  initial?: AIIncident;
  systems: AISystem[];
  members: OrgMember[];
  onClose: () => void;
  onSaved: (i: AIIncident) => void;
}) {
  const [form, setForm] = useState<IncidentFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(initial ? toForm(initial) : EMPTY_FORM);
  }, [open, initial]);

  function patch<K extends keyof IncidentFormState>(key: K, value: IncidentFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.aiSystemId && mode === "create") {
      setError("Pick an AI system.");
      return;
    }
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const base: Omit<CreateAIIncidentInput, "aiSystemId"> = {
        title: form.title,
        description: form.description || null,
        category: form.category,
        severity: form.severity,
        status: form.status,
        detectedAt: form.detectedAt || undefined,
        rootCause: form.rootCause || null,
        remediation: form.remediation || null,
        externalNotificationRequired: form.externalNotificationRequired,
        externalNotificationSentAt: form.externalNotificationSentAt || null,
        assigneeId: form.assigneeId || null,
      };
      const res =
        mode === "create"
          ? await apiClient.createAIIncident({ ...base, aiSystemId: form.aiSystemId })
          : await apiClient.updateAIIncident(initial!.id, base);
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save incident.");
    } finally {
      setSaving(false);
    }
  }

  const systemOpts = useMemo(() => systems.map((s) => ({ value: s.id, label: s.name })), [systems]);
  const memberOpts = useMemo(
    () => [
      { value: "", label: "Unassigned" },
      ...members.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` })),
    ],
    [members],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Log AI incident" : "Edit incident"}
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
              id="inc-form-system"
              label="AI system"
              required
              options={systemOpts}
              placeholder="Select a system…"
              value={form.aiSystemId}
              onChange={(e) => patch("aiSystemId", e.target.value)}
              disabled={mode === "edit"}
            />
            <Select
              id="inc-form-assignee"
              label="Assignee"
              options={memberOpts}
              value={form.assigneeId}
              onChange={(e) => patch("assigneeId", e.target.value)}
            />
          </div>
          <Input
            id="inc-form-title"
            label="Title"
            required
            placeholder="Bot leaked competitor name in support reply"
            value={form.title}
            onChange={(e) => patch("title", e.target.value)}
          />
          <Textarea
            id="inc-form-description"
            label="Description"
            rows={3}
            placeholder="What happened, where, and any user-visible impact."
            value={form.description}
            onChange={(e) => patch("description", e.target.value)}
          />
        </FormSection>

        <FormSection title="Classification">
          <div className="grid grid-cols-3 gap-3">
            <Select
              id="inc-form-category"
              label="Category"
              options={CATEGORY_OPTIONS}
              value={form.category}
              onChange={(e) => patch("category", e.target.value as AIIncidentCategory)}
            />
            <Select
              id="inc-form-severity"
              label="Severity"
              options={SEVERITY_OPTIONS}
              value={form.severity}
              onChange={(e) => patch("severity", e.target.value as AIIncidentSeverity)}
            />
            <Select
              id="inc-form-status"
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => patch("status", e.target.value as AIIncidentStatus)}
            />
          </div>
          <Input
            id="inc-form-detected"
            label="Detected at"
            type="date"
            value={form.detectedAt}
            onChange={(e) => patch("detectedAt", e.target.value)}
          />
        </FormSection>

        <FormSection title="Investigation">
          <Textarea
            id="inc-form-rootcause"
            label="Root cause"
            rows={3}
            placeholder="What caused it? Optional until investigated."
            value={form.rootCause}
            onChange={(e) => patch("rootCause", e.target.value)}
          />
          <Textarea
            id="inc-form-remediation"
            label="Remediation"
            rows={3}
            placeholder="Actions taken or planned to prevent recurrence."
            value={form.remediation}
            onChange={(e) => patch("remediation", e.target.value)}
          />
        </FormSection>

        <FormSection
          title="External notification"
          description="EU AI Act Art. 73 requires notifying authorities for serious incidents within 15 days."
        >
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
              checked={form.externalNotificationRequired}
              onChange={(e) => patch("externalNotificationRequired", e.target.checked)}
            />
            External notification required
          </label>
          {form.externalNotificationRequired && (
            <Input
              id="inc-form-notification-sent"
              label="Notification sent at"
              type="date"
              value={form.externalNotificationSentAt}
              onChange={(e) => patch("externalNotificationSentAt", e.target.value)}
            />
          )}
        </FormSection>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {mode === "create" ? "Log incident" : "Save changes"}
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

function IncidentDetailDrawer({
  incident,
  systems,
  members,
  onClose,
  onChanged,
  onDeleted,
}: {
  incident: AIIncident | null;
  systems: AISystem[];
  members: OrgMember[];
  onClose: () => void;
  onChanged: (i: AIIncident) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [acting, setActing] = useState(false);
  const [transitionOpen, setTransitionOpen] = useState<
    null | "investigate" | "mitigate" | "resolve"
  >(null);

  useEffect(() => {
    setEditing(false);
    setTransitionOpen(null);
  }, [incident?.id]);

  if (!incident) return null;

  const stat = STATUS_BADGE[incident.status];
  const sev = SEVERITY_BADGE[incident.severity];
  const allowed = TRANSITIONS[incident.status];

  async function handleClose() {
    if (!incident) return;
    setActing(true);
    try {
      const r = await apiClient.transitionAIIncident(incident.id, "close");
      onChanged(r.data);
    } catch {
      /* swallow */
    } finally {
      setActing(false);
    }
  }

  async function handleDelete() {
    if (!incident) return;
    if (!confirm(`Delete incident "${incident.title}"? This cannot be undone.`)) return;
    setActing(true);
    try {
      await apiClient.deleteAIIncident(incident.id);
      onDeleted(incident.id);
    } catch {
      setActing(false);
    }
  }

  return (
    <>
      <InfoDrawer
        open={!!incident && !editing && !transitionOpen}
        onClose={onClose}
        title={incident.title}
        widthClassName="max-w-xl"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={stat.variant}>{stat.label}</Badge>
            <Badge variant={sev.variant}>{sev.label}</Badge>
            <Badge variant="neutral">{categoryLabel(incident.category)}</Badge>
            {incident.externalNotificationRequired && (
              <Badge variant="warning">
                External notification {incident.externalNotificationSentAt ? "sent" : "required"}
              </Badge>
            )}
          </div>

          {incident.description && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{incident.description}</p>
          )}

          <DetailGrid>
            <DetailField label="AI system">{incident.aiSystem.name}</DetailField>
            <DetailField label="Assignee">
              {incident.assignee?.name || (
                <span className="italic text-neutral-400">Unassigned</span>
              )}
            </DetailField>
            <DetailField label="Reported by">{incident.reportedBy?.name || "—"}</DetailField>
            <DetailField label="Detected at">{formatDate(incident.detectedAt)}</DetailField>
            <DetailField label="Reported at">{formatDate(incident.reportedAt)}</DetailField>
            <DetailField label="Resolved at">{formatDate(incident.resolvedAt)}</DetailField>
          </DetailGrid>

          {incident.rootCause && (
            <>
              <SectionHeader>Root cause</SectionHeader>
              <p className="whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-300">
                {incident.rootCause}
              </p>
            </>
          )}

          {incident.remediation && (
            <>
              <SectionHeader>Remediation</SectionHeader>
              <p className="whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-300">
                {incident.remediation}
              </p>
            </>
          )}

          {incident.externalNotificationRequired && (
            <>
              <SectionHeader>External notification</SectionHeader>
              <DetailGrid>
                <DetailField label="Required">Yes</DetailField>
                <DetailField label="Sent at">
                  {formatDate(incident.externalNotificationSentAt)}
                </DetailField>
              </DetailGrid>
            </>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {allowed.map((t) =>
              t === "close" ? (
                <Button
                  key={t}
                  size="sm"
                  variant="secondary"
                  loading={acting}
                  onClick={handleClose}
                >
                  Close
                </Button>
              ) : (
                <Button key={t} size="sm" variant="secondary" onClick={() => setTransitionOpen(t)}>
                  {TRANSITION_LABELS[t]}
                </Button>
              ),
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

      <IncidentFormModal
        mode="edit"
        open={editing}
        initial={incident}
        systems={systems}
        members={members}
        onClose={() => setEditing(false)}
        onSaved={(updated) => {
          setEditing(false);
          onChanged(updated);
        }}
      />

      {transitionOpen && (
        <TransitionModal
          incident={incident}
          transition={transitionOpen}
          onClose={() => setTransitionOpen(null)}
          onSaved={(updated) => {
            setTransitionOpen(null);
            onChanged(updated);
          }}
        />
      )}
    </>
  );
}

// One quick-action modal for the three "investigate / mitigate / resolve"
// transitions, prompting for the field most relevant to that step.
function TransitionModal({
  incident,
  transition,
  onClose,
  onSaved,
}: {
  incident: AIIncident;
  transition: "investigate" | "mitigate" | "resolve";
  onClose: () => void;
  onSaved: (i: AIIncident) => void;
}) {
  const [rootCause, setRootCause] = useState(incident.rootCause ?? "");
  const [remediation, setRemediation] = useState(incident.remediation ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const r = await apiClient.transitionAIIncident(incident.id, transition, {
        rootCause: rootCause || null,
        remediation: remediation || null,
      });
      onSaved(r.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transition incident.");
    } finally {
      setSaving(false);
    }
  }

  const showRoot = transition !== "resolve" || !!incident.rootCause === false;
  const showRemediation = transition === "mitigate" || transition === "resolve";

  return (
    <Modal open onClose={onClose} title={TRANSITION_LABELS[transition]} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        {showRoot && (
          <Textarea
            id="trans-rootcause"
            label="Root cause"
            rows={3}
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
          />
        )}
        {showRemediation && (
          <Textarea
            id="trans-remediation"
            label="Remediation"
            rows={3}
            value={remediation}
            onChange={(e) => setRemediation(e.target.value)}
          />
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Confirm
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="border-b border-neutral-200 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
      {children}
    </h4>
  );
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
      <div className="mt-0.5 text-sm text-neutral-900 dark:text-neutral-100">{children}</div>
    </div>
  );
}
