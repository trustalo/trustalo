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
  type AIImpactAssessment,
  type AIImpactAssessmentStats,
  type AIImpactStatus,
  type AISystem,
  type CreateAIImpactAssessmentInput,
} from "@/lib/api-client";

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: AIImpactStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_BADGE: Record<AIImpactStatus, { variant: BadgeVariant; label: string }> = {
  pending: { variant: "neutral", label: "Pending" },
  in_review: { variant: "info", label: "In Review" },
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "danger", label: "Rejected" },
};

const SORTABLE = new Set(["createdAt", "approvedAt", "status"]);

// EU AI Act Art. 27 + ISO 42001 Annex B both require these dimensions for a
// fundamental-rights / impact assessment, so we model them explicitly.
const IMPACT_DIMENSIONS: { key: keyof AIImpactAssessment; label: string; placeholder: string }[] = [
  {
    key: "societalImpact",
    label: "Societal impact",
    placeholder: "Who is affected and how — populations, scale, deployment context.",
  },
  {
    key: "ethicalConsiderations",
    label: "Ethical considerations",
    placeholder: "Bias, fairness, autonomy, dignity, dual-use concerns.",
  },
  {
    key: "environmentalImpact",
    label: "Environmental impact",
    placeholder: "Energy use, emissions, water consumption from training & inference.",
  },
  {
    key: "humanOversightMeasures",
    label: "Human oversight",
    placeholder: "Human-in-the-loop controls, escalation, kill switches.",
  },
  {
    key: "transparencyMeasures",
    label: "Transparency",
    placeholder: "Disclosures to end users, opt-out, model cards, documentation.",
  },
];

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
function HourglassIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M6 3h12M6 21h12M6 3v3a6 6 0 006 6 6 6 0 006-6V3M6 21v-3a6 6 0 016-6 6 6 0 016 6v3"
      />
    </svg>
  );
}
function PercentIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M19 5L5 19m2-12a2 2 0 11-4 0 2 2 0 014 0zm14 14a2 2 0 11-4 0 2 2 0 014 0z"
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

export default function AIImpactAssessmentsPage() {
  const [items, setItems] = useState<AIImpactAssessment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [systemFilter, setSystemFilter] = useState("");

  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [stats, setStats] = useState<AIImpactAssessmentStats | null>(null);
  const [systems, setSystems] = useState<AISystem[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<AIImpactAssessment | null>(null);

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
      if (systemFilter) params.aiSystemId = systemFilter;
      const res = await apiClient.listAIImpactAssessments(params);
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortDir, search, statusFilter, systemFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.getAIImpactAssessmentStats();
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
  const filtersActive = Boolean(search || statusFilter || systemFilter);

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
          Fundamental-rights and impact assessments per AI system, covering societal, ethical,
          environmental, oversight, and transparency dimensions (EU AI Act Art. 27 / ISO 42001 Annex
          B).
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          New Impact Assessment
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard
            icon={<ListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            tone="blue"
            value={stats.total}
            label="Assessments"
          />
          <KpiCard
            icon={<CheckIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            tone="emerald"
            value={stats.approvedCount}
            label="Approved"
          />
          <KpiCard
            icon={<HourglassIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            tone="amber"
            value={stats.pendingCount}
            label="Pending / In Review"
            valueClass={stats.pendingCount > 0 ? "text-amber-600" : undefined}
          />
          <KpiCard
            icon={<PercentIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            tone="purple"
            value={stats.approvedRate}
            label="Approved Rate (%)"
          />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-72">
          <Input
            id="ai-search"
            placeholder="Search across impact text…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            id="ai-status"
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-56">
          <Select
            id="ai-system"
            options={systemOptions}
            placeholder="All AI systems"
            value={systemFilter}
            onChange={(e) => {
              setSystemFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setSystemFilter("");
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
                <TableHeader>AI System</TableHeader>
                <TableHeader>Summary</TableHeader>
                <SortableHeader
                  label="Status"
                  column="status"
                  current={sortDirFor("status")}
                  onClick={toggleSort}
                />
                <TableHeader>Assessor</TableHeader>
                <TableHeader>Approver</TableHeader>
                <SortableHeader
                  label="Created"
                  column="createdAt"
                  current={sortDirFor("createdAt")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Decided"
                  column="approvedAt"
                  current={sortDirFor("approvedAt")}
                  onClick={toggleSort}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((a) => {
                const stat = STATUS_BADGE[a.status];
                const summary =
                  a.societalImpact || a.ethicalConsiderations || a.environmentalImpact || "—";
                return (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    onClick={() => setActive(a)}
                  >
                    <TableCell>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {a.aiSystem.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="line-clamp-2 max-w-md text-sm text-neutral-600 dark:text-neutral-400">
                        {summary}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stat.variant}>{stat.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{a.assessedBy.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {a.approvedBy?.name || <span className="italic text-neutral-400">—</span>}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(a.createdAt)}</TableCell>
                    <TableCell>{formatDate(a.approvedAt)}</TableCell>
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

      <ImpactFormModal
        mode="create"
        open={createOpen}
        systems={systems}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          refresh();
        }}
      />

      <ImpactDetailDrawer
        assessment={active}
        systems={systems}
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
        {filtered ? "No assessments match your filters" : "No impact assessments yet"}
      </h3>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        {filtered
          ? "Try adjusting your search or filters."
          : disabled
            ? "Add an AI system in the Inventory tab to begin."
            : "Capture an impact assessment for an AI system to begin."}
      </p>
      {!filtered && !disabled && (
        <Button className="mt-4" size="sm" onClick={onCreate}>
          New Impact Assessment
        </Button>
      )}
    </div>
  );
}

// ── Form ─────────────────────────────────────────────────────────────────────

interface ImpactFormState {
  aiSystemId: string;
  societalImpact: string;
  ethicalConsiderations: string;
  environmentalImpact: string;
  humanOversightMeasures: string;
  transparencyMeasures: string;
  status: AIImpactStatus;
}

const EMPTY_FORM: ImpactFormState = {
  aiSystemId: "",
  societalImpact: "",
  ethicalConsiderations: "",
  environmentalImpact: "",
  humanOversightMeasures: "",
  transparencyMeasures: "",
  status: "pending",
};

function toForm(a: AIImpactAssessment): ImpactFormState {
  return {
    aiSystemId: a.aiSystemId,
    societalImpact: a.societalImpact ?? "",
    ethicalConsiderations: a.ethicalConsiderations ?? "",
    environmentalImpact: a.environmentalImpact ?? "",
    humanOversightMeasures: a.humanOversightMeasures ?? "",
    transparencyMeasures: a.transparencyMeasures ?? "",
    status: a.status,
  };
}

function ImpactFormModal({
  mode,
  open,
  initial,
  systems,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  open: boolean;
  initial?: AIImpactAssessment;
  systems: AISystem[];
  onClose: () => void;
  onSaved: (a: AIImpactAssessment) => void;
}) {
  const [form, setForm] = useState<ImpactFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(initial ? toForm(initial) : EMPTY_FORM);
  }, [open, initial]);

  function patch<K extends keyof ImpactFormState>(key: K, value: ImpactFormState[K]) {
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
      const payload: CreateAIImpactAssessmentInput = {
        aiSystemId: form.aiSystemId,
        societalImpact: form.societalImpact || null,
        ethicalConsiderations: form.ethicalConsiderations || null,
        environmentalImpact: form.environmentalImpact || null,
        humanOversightMeasures: form.humanOversightMeasures || null,
        transparencyMeasures: form.transparencyMeasures || null,
        status: form.status,
      };
      const res =
        mode === "create"
          ? await apiClient.createAIImpactAssessment(payload)
          : await apiClient.updateAIImpactAssessment(initial!.id, {
              societalImpact: payload.societalImpact,
              ethicalConsiderations: payload.ethicalConsiderations,
              environmentalImpact: payload.environmentalImpact,
              humanOversightMeasures: payload.humanOversightMeasures,
              transparencyMeasures: payload.transparencyMeasures,
              status: payload.status,
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
      title={mode === "create" ? "New impact assessment" : "Edit impact assessment"}
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
              id="ai-form-system"
              label="AI system"
              required
              options={systemOpts}
              placeholder="Select a system…"
              value={form.aiSystemId}
              onChange={(e) => patch("aiSystemId", e.target.value)}
              disabled={mode === "edit"}
            />
            <Select
              id="ai-form-status"
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => patch("status", e.target.value as AIImpactStatus)}
            />
          </div>
        </FormSection>

        {IMPACT_DIMENSIONS.map((d) => (
          <FormSection key={String(d.key)} title={d.label}>
            <Textarea
              id={`ai-form-${String(d.key)}`}
              rows={3}
              placeholder={d.placeholder}
              value={(form[d.key as keyof ImpactFormState] as string) ?? ""}
              onChange={(e) => patch(d.key as keyof ImpactFormState, e.target.value as never)}
            />
          </FormSection>
        ))}

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

function ImpactDetailDrawer({
  assessment,
  systems,
  onClose,
  onChanged,
  onDeleted,
}: {
  assessment: AIImpactAssessment | null;
  systems: AISystem[];
  onClose: () => void;
  onChanged: (a: AIImpactAssessment) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    setEditing(false);
  }, [assessment?.id]);

  if (!assessment) return null;

  const stat = STATUS_BADGE[assessment.status];

  async function handleApprove() {
    if (!assessment) return;
    setActing(true);
    try {
      const r = await apiClient.approveAIImpactAssessment(assessment.id);
      onChanged(r.data);
    } catch {
      /* swallow */
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    if (!assessment) return;
    setActing(true);
    try {
      const r = await apiClient.rejectAIImpactAssessment(assessment.id);
      onChanged(r.data);
    } catch {
      /* swallow */
    } finally {
      setActing(false);
    }
  }

  async function handleDelete() {
    if (!assessment) return;
    if (!confirm("Delete this impact assessment? This cannot be undone.")) return;
    setActing(true);
    try {
      await apiClient.deleteAIImpactAssessment(assessment.id);
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
        title={`Impact assessment — ${assessment.aiSystem.name}`}
        widthClassName="max-w-xl"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={stat.variant}>{stat.label}</Badge>
          </div>

          <DetailGrid>
            <DetailField label="AI system">{assessment.aiSystem.name}</DetailField>
            <DetailField label="Assessor">{assessment.assessedBy.name}</DetailField>
            <DetailField label="Decision by">
              {assessment.approvedBy?.name || <span className="italic text-neutral-400">—</span>}
            </DetailField>
            <DetailField label="Decided at">{formatDate(assessment.approvedAt)}</DetailField>
          </DetailGrid>

          {IMPACT_DIMENSIONS.map((d) => {
            const v = assessment[d.key as keyof AIImpactAssessment] as string | null;
            if (!v) return null;
            return (
              <div key={String(d.key)}>
                <SectionHeader>{d.label}</SectionHeader>
                <p className="mt-2 whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-300">
                  {v}
                </p>
              </div>
            );
          })}

          <SectionHeader>Lifecycle</SectionHeader>
          <DetailGrid>
            <DetailField label="Created">{formatDate(assessment.createdAt)}</DetailField>
            <DetailField label="Last updated">{formatDate(assessment.updatedAt)}</DetailField>
          </DetailGrid>

          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {assessment.status !== "approved" && (
              <Button size="sm" variant="secondary" loading={acting} onClick={handleApprove}>
                Approve
              </Button>
            )}
            {assessment.status !== "rejected" && (
              <Button size="sm" variant="secondary" loading={acting} onClick={handleReject}>
                Reject
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

      <ImpactFormModal
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
