"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoDrawer } from "@/components/ui/info-drawer";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
  type BCPExerciseItem,
  type BCPExerciseOutcome,
  type BCPExerciseStats,
  type BCPExerciseStatus,
  type BCPExerciseType,
  type BCPPlanItem,
  type CreateBCPExerciseTopLevelInput,
  type MarkConductedInput,
  type MarkReviewedInput,
  type OrgMember,
} from "@/lib/api-client";

// ── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: BCPExerciseType; label: string }[] = [
  { value: "tabletop", label: "Tabletop" },
  { value: "walkthrough", label: "Walkthrough" },
  { value: "simulation", label: "Simulation" },
  { value: "full_scale", label: "Full-scale" },
];

const STATUS_OPTIONS: { value: BCPExerciseStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In progress" },
  { value: "conducted", label: "Conducted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "cancelled", label: "Cancelled" },
];

const OUTCOME_OPTIONS: { value: BCPExerciseOutcome; label: string }[] = [
  { value: "not_met", label: "Not met" },
  { value: "partially_met", label: "Partially met" },
  { value: "met", label: "Met" },
  { value: "exceeded", label: "Exceeded" },
];

const TYPE_LABEL: Record<BCPExerciseType, string> = {
  tabletop: "Tabletop",
  walkthrough: "Walkthrough",
  simulation: "Simulation",
  full_scale: "Full-scale",
};

const STATUS_BADGE: Record<BCPExerciseStatus, { variant: BadgeVariant; label: string }> = {
  planned: { variant: "neutral", label: "Planned" },
  scheduled: { variant: "info", label: "Scheduled" },
  in_progress: { variant: "warning", label: "In Progress" },
  conducted: { variant: "info", label: "Conducted" },
  reviewed: { variant: "success", label: "Reviewed" },
  cancelled: { variant: "neutral", label: "Cancelled" },
};

const OUTCOME_BADGE: Record<BCPExerciseOutcome, { variant: BadgeVariant; label: string }> = {
  not_met: { variant: "danger", label: "Not met" },
  partially_met: { variant: "warning", label: "Partially met" },
  met: { variant: "success", label: "Met" },
  exceeded: { variant: "success", label: "Exceeded" },
};

const SORTABLE_COLUMNS = new Set([
  "title",
  "type",
  "status",
  "scheduledDate",
  "conductedDate",
  "outcomeRating",
  "updatedAt",
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatHours(hours: number | null | undefined): string {
  if (hours == null) return "—";
  if (hours === 0) return "0h";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return rem === 0 ? `${days}d` : `${days}d ${rem}h`;
}

function isOpenStatus(status: BCPExerciseStatus): boolean {
  return status === "planned" || status === "scheduled" || status === "in_progress";
}

function isOverdueScheduled(ex: Pick<BCPExerciseItem, "scheduledDate" | "status">): boolean {
  if (!ex.scheduledDate) return false;
  if (!isOpenStatus(ex.status)) return false;
  return new Date(ex.scheduledDate) < new Date();
}

// ── Icons ────────────────────────────────────────────────────────────────────

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
function CalendarIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V11.25A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
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
function ClipboardIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
      />
    </svg>
  );
}
function ChartIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
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

export default function ExercisesRegisterPage() {
  const [items, setItems] = useState<BCPExerciseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [outcome, setOutcome] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Sort
  const [sortBy, setSortBy] = useState<string>("scheduledDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Side data
  const [stats, setStats] = useState<BCPExerciseStats | null>(null);
  const [plans, setPlans] = useState<BCPPlanItem[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);

  // Modals / drawers
  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<BCPExerciseItem | null>(null);

  // ── Data loaders ───────────────────────────────────────────────────────────

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
      if (type) params.type = type;
      if (status) params.status = status;
      if (outcome) params.outcomeRating = outcome;
      if (planFilter) params.bcpId = planFilter;
      if (overdueOnly) params.overdueOnly = "true";
      const res = await apiClient.listAllBCPExercises(params);
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortDir, search, type, status, outcome, planFilter, overdueOnly]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.getAllBCPExerciseStats();
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
      .listBCPPlans({ page: "1", limit: "200" })
      .then((r) => setPlans(r.data.items))
      .catch(() => setPlans([]));
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
  const planOptions = useMemo(() => plans.map((p) => ({ value: p.id, label: p.title })), [plans]);
  const filtersActive = Boolean(search || type || status || outcome || planFilter || overdueOnly);

  function toggleSort(column: string) {
    if (!SORTABLE_COLUMNS.has(column)) return;
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir(column === "title" ? "asc" : "desc");
    }
    setPage(1);
  }

  function sortDirFor(column: string): SortDir | null {
    return sortBy === column ? sortDir : null;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
          Register of every continuity exercise — tabletops, walkthroughs, simulations, and
          full-scale tests. Track outcomes against RTO/RPO targets and capture lessons learned for
          the corrective-action loop.
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          New Exercise
        </Button>
      </div>

      {/* KPI strip */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            icon={<ClipboardIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            tone="blue"
            value={stats.total}
            label="Exercises"
          />
          <KpiCard
            icon={<CheckIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            tone="emerald"
            value={stats.conductedThisYear}
            label={`Conducted in ${new Date().getFullYear()}`}
          />
          <KpiCard
            icon={<CalendarIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            tone="amber"
            value={stats.upcoming}
            label="Upcoming (30d)"
          />
          <KpiCard
            icon={<AlertIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
            tone="red"
            value={stats.overdue}
            label="Overdue"
            valueClass={stats.overdue > 0 ? "text-red-600" : undefined}
            tooltip="Scheduled date passed but exercise not yet conducted or cancelled."
          />
          <KpiCard
            icon={<ChartIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            tone="purple"
            value={stats.total > 0 ? Math.round((stats.reviewedCount / stats.total) * 100) : 0}
            label="Reviewed Rate"
            suffix="%"
            tooltip="Share of exercises with completed after-action review."
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-72">
          <Input
            id="ex-search"
            placeholder="Search title or scenario…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Select
            id="ex-type"
            options={TYPE_OPTIONS}
            placeholder="All types"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Select
            id="ex-status"
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Select
            id="ex-outcome"
            options={OUTCOME_OPTIONS}
            placeholder="All outcomes"
            value={outcome}
            onChange={(e) => {
              setOutcome(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-52">
          <Select
            id="ex-plan"
            options={planOptions}
            placeholder="All plans"
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
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
              setType("");
              setStatus("");
              setOutcome("");
              setPlanFilter("");
              setOverdueOnly(false);
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
        <span className="ml-auto pb-2 text-sm text-neutral-500 dark:text-neutral-400">
          {total} {total === 1 ? "exercise" : "exercises"}
        </span>
      </div>

      {/* Register table */}
      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <SpinnerIcon />
          </div>
        ) : items.length === 0 ? (
          <EmptyState filtered={filtersActive} onCreate={() => setCreateOpen(true)} />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <SortableHeader
                  label="Exercise"
                  column="title"
                  current={sortDirFor("title")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Type"
                  column="type"
                  current={sortDirFor("type")}
                  onClick={toggleSort}
                />
                <TableHeader>Plan</TableHeader>
                <TableHeader>Facilitator</TableHeader>
                <SortableHeader
                  label="Scheduled"
                  column="scheduledDate"
                  current={sortDirFor("scheduledDate")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Conducted"
                  column="conductedDate"
                  current={sortDirFor("conductedDate")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Status"
                  column="status"
                  current={sortDirFor("status")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Outcome"
                  column="outcomeRating"
                  current={sortDirFor("outcomeRating")}
                  onClick={toggleSort}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((ex) => {
                const stat = STATUS_BADGE[ex.status];
                const overdue = isOverdueScheduled(ex);
                const out = ex.outcomeRating ? OUTCOME_BADGE[ex.outcomeRating] : null;
                return (
                  <TableRow
                    key={ex.id}
                    className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    onClick={() => setActive(ex)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {ex.title}
                        </span>
                        {overdue && (
                          <span
                            title="Scheduled date has passed without being conducted"
                            className="inline-flex h-5 items-center gap-1 rounded-full bg-red-100 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-800 dark:bg-red-950 dark:text-red-300"
                          >
                            Overdue
                          </span>
                        )}
                      </div>
                      {ex.scenario && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-500">
                          {ex.scenario}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{TYPE_LABEL[ex.type]}</span>
                    </TableCell>
                    <TableCell>
                      {ex.bcp ? (
                        <Link
                          href={`/business-continuity/${ex.bcp.id}`}
                          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ex.bcp.title}
                        </Link>
                      ) : (
                        <span className="text-sm text-neutral-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {ex.facilitator?.name ?? (
                          <span className="italic text-neutral-400">Unassigned</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm ${
                          overdue
                            ? "font-medium text-red-600 dark:text-red-400"
                            : "text-neutral-500"
                        }`}
                      >
                        {formatDate(ex.scheduledDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-neutral-500">
                        {formatDate(ex.conductedDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stat.variant}>{stat.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {out ? (
                        <Badge variant={out.variant}>{out.label}</Badge>
                      ) : (
                        <span className="text-sm text-neutral-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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

      <ExerciseFormModal
        mode="create"
        open={createOpen}
        plans={plans}
        members={members}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          refresh();
        }}
      />

      <ExerciseDetailDrawer
        exercise={active}
        plans={plans}
        members={members}
        onClose={() => setActive(null)}
        onChanged={(updated) => {
          setItems((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
          setActive(updated);
          fetchStats();
        }}
        onDeleted={(id) => {
          setItems((prev) => prev.filter((b) => b.id !== id));
          setActive(null);
          fetchStats();
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
  suffix,
  valueClass,
  tooltip,
}: {
  icon: React.ReactNode;
  tone: "blue" | "red" | "amber" | "emerald" | "purple";
  value: number;
  label: string;
  suffix?: string;
  valueClass?: string;
  tooltip?: string;
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
      <div className="flex items-center gap-3" title={tooltip}>
        <div className={`rounded-lg p-2 ${tones[tone]}`}>{icon}</div>
        <div>
          <p className={`text-2xl font-bold ${valueClass ?? "text-neutral-900 dark:text-white"}`}>
            {value}
            {suffix}
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

function EmptyState({ filtered, onCreate }: { filtered: boolean; onCreate: () => void }) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <ClipboardIcon className="h-6 w-6 text-neutral-400" />
      </div>
      <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
        {filtered ? "No exercises match your filters" : "No exercises yet"}
      </h3>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        {filtered
          ? "Try adjusting your search or filters."
          : "Schedule a tabletop or simulation to start validating your continuity plans."}
      </p>
      {!filtered && (
        <Button className="mt-4" size="sm" onClick={onCreate}>
          New Exercise
        </Button>
      )}
    </div>
  );
}

// ── Form modal (create / edit) ───────────────────────────────────────────────

interface ExerciseFormState {
  bcpId: string;
  title: string;
  type: BCPExerciseType;
  status: BCPExerciseStatus;
  scheduledDate: string;
  conductedDate: string;
  facilitatorId: string;
  scenario: string;
  objectives: string;
  scope: string;
  participants: string;
  outcomeRating: BCPExerciseOutcome | "";
  actualRtoHours: string;
  actualRpoHours: string;
  findings: string;
  lessonsLearned: string;
  actionItems: string;
  nextExerciseDate: string;
}

const EMPTY_FORM: ExerciseFormState = {
  bcpId: "",
  title: "",
  type: "tabletop",
  status: "planned",
  scheduledDate: "",
  conductedDate: "",
  facilitatorId: "",
  scenario: "",
  objectives: "",
  scope: "",
  participants: "",
  outcomeRating: "",
  actualRtoHours: "",
  actualRpoHours: "",
  findings: "",
  lessonsLearned: "",
  actionItems: "",
  nextExerciseDate: "",
};

function exerciseToForm(ex: BCPExerciseItem): ExerciseFormState {
  return {
    bcpId: ex.bcpId,
    title: ex.title,
    type: ex.type,
    status: ex.status,
    scheduledDate: ex.scheduledDate ? ex.scheduledDate.slice(0, 10) : "",
    conductedDate: ex.conductedDate ? ex.conductedDate.slice(0, 10) : "",
    facilitatorId: ex.facilitatorId ?? "",
    scenario: ex.scenario ?? "",
    objectives: ex.objectives ?? "",
    scope: ex.scope ?? "",
    participants: ex.participants ?? "",
    outcomeRating: ex.outcomeRating ?? "",
    actualRtoHours: ex.actualRtoHours == null ? "" : String(ex.actualRtoHours),
    actualRpoHours: ex.actualRpoHours == null ? "" : String(ex.actualRpoHours),
    findings: ex.findings ?? "",
    lessonsLearned: ex.lessonsLearned ?? "",
    actionItems: ex.actionItems ?? "",
    nextExerciseDate: ex.nextExerciseDate ? ex.nextExerciseDate.slice(0, 10) : "",
  };
}

function ExerciseFormModal({
  mode,
  open,
  initial,
  plans,
  members,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  open: boolean;
  initial?: BCPExerciseItem;
  plans: BCPPlanItem[];
  members: OrgMember[];
  onClose: () => void;
  onSaved: (ex: BCPExerciseItem) => void;
}) {
  const [form, setForm] = useState<ExerciseFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(initial ? exerciseToForm(initial) : EMPTY_FORM);
  }, [open, initial]);

  const planOptions = useMemo(() => plans.map((p) => ({ value: p.id, label: p.title })), [plans]);
  const memberOptions = useMemo(
    () => [
      { value: "", label: "Unassigned" },
      ...members.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` })),
    ],
    [members],
  );

  function patch<K extends keyof ExerciseFormState>(key: K, value: ExerciseFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.bcpId) return setError("Select a continuity plan");
    if (!form.title.trim()) return setError("Title is required");

    const rto = form.actualRtoHours === "" ? null : Number(form.actualRtoHours);
    const rpo = form.actualRpoHours === "" ? null : Number(form.actualRpoHours);
    if (rto != null && (!Number.isFinite(rto) || rto < 0)) {
      return setError("Actual RTO must be a non-negative number");
    }
    if (rpo != null && (!Number.isFinite(rpo) || rpo < 0)) {
      return setError("Actual RPO must be a non-negative number");
    }

    setSaving(true);
    setError(null);

    const payload: CreateBCPExerciseTopLevelInput = {
      bcpId: form.bcpId,
      title: form.title.trim(),
      type: form.type,
      status: form.status,
      scheduledDate: form.scheduledDate || null,
      conductedDate: form.conductedDate || null,
      facilitatorId: form.facilitatorId || null,
      scenario: form.scenario.trim() || null,
      objectives: form.objectives.trim() || null,
      scope: form.scope.trim() || null,
      participants: form.participants.trim() || null,
      outcomeRating: form.outcomeRating || null,
      actualRtoHours: rto,
      actualRpoHours: rpo,
      findings: form.findings.trim() || null,
      lessonsLearned: form.lessonsLearned.trim() || null,
      actionItems: form.actionItems.trim() || null,
      nextExerciseDate: form.nextExerciseDate || null,
    };

    try {
      const res =
        mode === "create"
          ? await apiClient.createBCPExerciseTopLevel(payload)
          : await apiClient.updateBCPExerciseTopLevel(initial!.id, payload);
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save exercise");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "New Exercise" : "Edit Exercise"}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <FormSection title="Exercise" description="What is being exercised, and how.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SearchableSelect
              id="ex-plan-form"
              label="Continuity Plan *"
              options={planOptions}
              placeholder={planOptions.length ? "Select plan…" : "No plans available"}
              value={form.bcpId}
              onChange={(v) => patch("bcpId", v)}
              disabled={mode === "edit"}
            />
            <SearchableSelect
              id="ex-facilitator"
              label="Facilitator"
              options={memberOptions}
              placeholder="Unassigned"
              value={form.facilitatorId}
              onChange={(v) => patch("facilitatorId", v)}
            />
          </div>
          <Input
            id="ex-title"
            label="Title *"
            placeholder="e.g. Q2 Ransomware Tabletop"
            value={form.title}
            onChange={(e) => patch("title", e.target.value)}
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              id="ex-type-form"
              label="Type *"
              options={TYPE_OPTIONS}
              value={form.type}
              onChange={(e) => patch("type", e.target.value as BCPExerciseType)}
            />
            <Select
              id="ex-status-form"
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => patch("status", e.target.value as BCPExerciseStatus)}
            />
          </div>
        </FormSection>

        <FormSection
          title="Design"
          description="What scenario was simulated and what we wanted to learn."
        >
          <Textarea
            id="ex-scenario"
            label="Scenario"
            placeholder="Describe the disruptive event being simulated."
            value={form.scenario}
            onChange={(e) => patch("scenario", e.target.value)}
            rows={2}
          />
          <Textarea
            id="ex-objectives"
            label="Objectives"
            placeholder="What capabilities or processes were validated?"
            value={form.objectives}
            onChange={(e) => patch("objectives", e.target.value)}
            rows={2}
          />
          <Textarea
            id="ex-scope"
            label="Scope"
            placeholder="Plans, processes, locations, or systems in scope."
            value={form.scope}
            onChange={(e) => patch("scope", e.target.value)}
            rows={2}
          />
          <Textarea
            id="ex-participants"
            label="Participants"
            placeholder="Names and roles — one per line or comma-separated."
            value={form.participants}
            onChange={(e) => patch("participants", e.target.value)}
            rows={2}
          />
        </FormSection>

        <FormSection
          title="Schedule"
          description="When the exercise is planned and (if completed) when it was run."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="ex-scheduled"
              label="Scheduled date"
              type="date"
              value={form.scheduledDate}
              onChange={(e) => patch("scheduledDate", e.target.value)}
            />
            <Input
              id="ex-conducted"
              label="Conducted date"
              type="date"
              value={form.conductedDate}
              onChange={(e) => patch("conductedDate", e.target.value)}
            />
          </div>
        </FormSection>

        <FormSection
          title="Outcome"
          description="How the exercise went, and what we actually achieved."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              id="ex-outcome-form"
              label="Outcome rating"
              options={[{ value: "", label: "Not rated" }, ...OUTCOME_OPTIONS]}
              value={form.outcomeRating}
              onChange={(e) =>
                patch("outcomeRating", (e.target.value || "") as BCPExerciseOutcome | "")
              }
            />
            <Input
              id="ex-actual-rto"
              label="Actual RTO (hours)"
              type="number"
              min="0"
              placeholder="optional"
              value={form.actualRtoHours}
              onChange={(e) => patch("actualRtoHours", e.target.value)}
            />
            <Input
              id="ex-actual-rpo"
              label="Actual RPO (hours)"
              type="number"
              min="0"
              placeholder="optional"
              value={form.actualRpoHours}
              onChange={(e) => patch("actualRpoHours", e.target.value)}
            />
          </div>
          <Textarea
            id="ex-findings"
            label="Findings"
            placeholder="What worked, what failed, what surprised us."
            value={form.findings}
            onChange={(e) => patch("findings", e.target.value)}
            rows={2}
          />
        </FormSection>

        <FormSection
          title="After-action"
          description="Lessons learned, follow-up actions, and next exercise."
        >
          <Textarea
            id="ex-lessons"
            label="Lessons learned"
            placeholder="What we'd do differently next time."
            value={form.lessonsLearned}
            onChange={(e) => patch("lessonsLearned", e.target.value)}
            rows={2}
          />
          <Textarea
            id="ex-actions"
            label="Action items"
            placeholder={
              "One per line, e.g.\n1. Tighten backup window to 4h (Eng)\n2. Add detection rule (SecOps)"
            }
            value={form.actionItems}
            onChange={(e) => patch("actionItems", e.target.value)}
            rows={3}
          />
          <Input
            id="ex-next"
            label="Next exercise date"
            type="date"
            value={form.nextExerciseDate}
            onChange={(e) => patch("nextExerciseDate", e.target.value)}
          />
        </FormSection>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {mode === "create" ? "Create Exercise" : "Save Changes"}
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

function ExerciseDetailDrawer({
  exercise,
  plans,
  members,
  onClose,
  onChanged,
  onDeleted,
}: {
  exercise: BCPExerciseItem | null;
  plans: BCPPlanItem[];
  members: OrgMember[];
  onClose: () => void;
  onChanged: (ex: BCPExerciseItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [conductOpen, setConductOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    setEditing(false);
    setConductOpen(false);
    setReviewOpen(false);
  }, [exercise?.id]);

  if (!exercise) return null;

  const stat = STATUS_BADGE[exercise.status];
  const out = exercise.outcomeRating ? OUTCOME_BADGE[exercise.outcomeRating] : null;
  const overdue = isOverdueScheduled(exercise);

  async function handleDelete() {
    if (!exercise) return;
    if (!confirm(`Delete exercise "${exercise.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await apiClient.deleteBCPExerciseTopLevel(exercise.id);
      onDeleted(exercise.id);
    } catch {
      setDeleting(false);
    }
  }

  const canMarkConducted =
    exercise.status === "planned" ||
    exercise.status === "scheduled" ||
    exercise.status === "in_progress";
  const canMarkReviewed = exercise.status === "conducted";

  return (
    <>
      <InfoDrawer
        open={!!exercise && !editing}
        onClose={onClose}
        title={exercise.title}
        widthClassName="max-w-xl"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={stat.variant}>{stat.label}</Badge>
            <Badge variant="neutral">{TYPE_LABEL[exercise.type]}</Badge>
            {out && <Badge variant={out.variant}>{out.label}</Badge>}
            {overdue && <Badge variant="danger">Overdue</Badge>}
          </div>

          {exercise.scenario && <DetailLong label="Scenario" value={exercise.scenario} />}

          <DetailGrid>
            <DetailField label="Continuity plan">
              {exercise.bcp ? (
                <Link
                  href={`/business-continuity/${exercise.bcp.id}`}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  {exercise.bcp.title}
                </Link>
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Facilitator">
              {exercise.facilitator?.name ?? (
                <span className="italic text-neutral-400">Unassigned</span>
              )}
            </DetailField>
          </DetailGrid>

          {(exercise.objectives || exercise.scope) && (
            <>
              <SectionHeader>Design</SectionHeader>
              {exercise.objectives && <DetailLong label="Objectives" value={exercise.objectives} />}
              {exercise.scope && <DetailLong label="Scope" value={exercise.scope} />}
              {exercise.participants && (
                <DetailLong label="Participants" value={exercise.participants} />
              )}
            </>
          )}

          <SectionHeader>Schedule</SectionHeader>
          <DetailGrid>
            <DetailField label="Scheduled">
              <span className={overdue ? "text-red-600 dark:text-red-400" : ""}>
                {formatDate(exercise.scheduledDate)}
              </span>
            </DetailField>
            <DetailField label="Conducted">{formatDate(exercise.conductedDate)}</DetailField>
          </DetailGrid>

          {(exercise.outcomeRating ||
            exercise.actualRtoHours != null ||
            exercise.actualRpoHours != null ||
            exercise.findings) && (
            <>
              <SectionHeader>Outcome</SectionHeader>
              <DetailGrid>
                <DetailField label="Actual RTO">{formatHours(exercise.actualRtoHours)}</DetailField>
                <DetailField label="Actual RPO">{formatHours(exercise.actualRpoHours)}</DetailField>
              </DetailGrid>
              {exercise.findings && <DetailLong label="Findings" value={exercise.findings} />}
            </>
          )}

          {(exercise.lessonsLearned || exercise.actionItems || exercise.reviewedAt) && (
            <>
              <SectionHeader>After-action</SectionHeader>
              {exercise.lessonsLearned && (
                <DetailLong label="Lessons learned" value={exercise.lessonsLearned} />
              )}
              {exercise.actionItems && (
                <DetailLong label="Action items" value={exercise.actionItems} />
              )}
              <DetailGrid>
                <DetailField label="Reviewed at">{formatDate(exercise.reviewedAt)}</DetailField>
                <DetailField label="Next exercise">
                  {formatDate(exercise.nextExerciseDate)}
                </DetailField>
              </DetailGrid>
            </>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {canMarkConducted && (
              <Button size="sm" variant="secondary" onClick={() => setConductOpen(true)}>
                Mark Conducted
              </Button>
            )}
            {canMarkReviewed && (
              <Button size="sm" variant="secondary" onClick={() => setReviewOpen(true)}>
                Mark Reviewed
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              loading={deleting}
              onClick={handleDelete}
              className="ml-auto"
            >
              Delete
            </Button>
          </div>
        </div>
      </InfoDrawer>

      <ExerciseFormModal
        mode="edit"
        open={editing}
        initial={exercise}
        plans={plans}
        members={members}
        onClose={() => setEditing(false)}
        onSaved={(updated) => {
          setEditing(false);
          onChanged(updated);
        }}
      />

      <MarkConductedModal
        open={conductOpen}
        exercise={exercise}
        onClose={() => setConductOpen(false)}
        onSaved={(updated) => {
          setConductOpen(false);
          onChanged(updated);
        }}
      />

      <MarkReviewedModal
        open={reviewOpen}
        exercise={exercise}
        onClose={() => setReviewOpen(false)}
        onSaved={(updated) => {
          setReviewOpen(false);
          onChanged(updated);
        }}
      />
    </>
  );
}

// ── Quick-action modals (mark conducted / reviewed) ──────────────────────────

function MarkConductedModal({
  open,
  exercise,
  onClose,
  onSaved,
}: {
  open: boolean;
  exercise: BCPExerciseItem;
  onClose: () => void;
  onSaved: (ex: BCPExerciseItem) => void;
}) {
  const [conductedDate, setConductedDate] = useState("");
  const [outcomeRating, setOutcomeRating] = useState<BCPExerciseOutcome | "">("");
  const [actualRtoHours, setActualRtoHours] = useState("");
  const [actualRpoHours, setActualRpoHours] = useState("");
  const [findings, setFindings] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Default conducted date to today; the user can override.
    setConductedDate(new Date().toISOString().slice(0, 10));
    setOutcomeRating(exercise.outcomeRating ?? "");
    setActualRtoHours(exercise.actualRtoHours == null ? "" : String(exercise.actualRtoHours));
    setActualRpoHours(exercise.actualRpoHours == null ? "" : String(exercise.actualRpoHours));
    setFindings(exercise.findings ?? "");
    setError(null);
  }, [open, exercise]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: MarkConductedInput = {
        conductedDate: conductedDate || null,
        outcomeRating: outcomeRating || null,
        actualRtoHours: actualRtoHours === "" ? null : Number(actualRtoHours),
        actualRpoHours: actualRpoHours === "" ? null : Number(actualRpoHours),
        findings: findings.trim() || null,
      };
      const res = await apiClient.markBCPExerciseConducted(exercise.id, payload);
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark conducted");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Mark exercise as conducted" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Record completion details. You can polish the after-action review later via{" "}
          <strong>Mark Reviewed</strong>.
        </p>
        <Input
          id="mc-date"
          label="Conducted date"
          type="date"
          value={conductedDate}
          onChange={(e) => setConductedDate(e.target.value)}
        />
        <Select
          id="mc-outcome"
          label="Outcome rating"
          options={[{ value: "", label: "Not rated yet" }, ...OUTCOME_OPTIONS]}
          value={outcomeRating}
          onChange={(e) => setOutcomeRating((e.target.value || "") as BCPExerciseOutcome | "")}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            id="mc-rto"
            label="Actual RTO (hours)"
            type="number"
            min="0"
            value={actualRtoHours}
            onChange={(e) => setActualRtoHours(e.target.value)}
            placeholder="optional"
          />
          <Input
            id="mc-rpo"
            label="Actual RPO (hours)"
            type="number"
            min="0"
            value={actualRpoHours}
            onChange={(e) => setActualRpoHours(e.target.value)}
            placeholder="optional"
          />
        </div>
        <Textarea
          id="mc-findings"
          label="Findings"
          placeholder="Headline observations from the exercise."
          value={findings}
          onChange={(e) => setFindings(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Mark Conducted
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function MarkReviewedModal({
  open,
  exercise,
  onClose,
  onSaved,
}: {
  open: boolean;
  exercise: BCPExerciseItem;
  onClose: () => void;
  onSaved: (ex: BCPExerciseItem) => void;
}) {
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [nextExerciseDate, setNextExerciseDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLessonsLearned(exercise.lessonsLearned ?? "");
    setActionItems(exercise.actionItems ?? "");
    setNextExerciseDate(exercise.nextExerciseDate ? exercise.nextExerciseDate.slice(0, 10) : "");
    setError(null);
  }, [open, exercise]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: MarkReviewedInput = {
        lessonsLearned: lessonsLearned.trim() || null,
        actionItems: actionItems.trim() || null,
        nextExerciseDate: nextExerciseDate || null,
      };
      const res = await apiClient.markBCPExerciseReviewed(exercise.id, payload);
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark reviewed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Mark exercise as reviewed" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Close the after-action loop. If you leave the next exercise date empty, it will default to
          one year from today.
        </p>
        <Textarea
          id="mr-lessons"
          label="Lessons learned"
          placeholder="Key takeaways for the team."
          value={lessonsLearned}
          onChange={(e) => setLessonsLearned(e.target.value)}
          rows={3}
        />
        <Textarea
          id="mr-actions"
          label="Action items"
          placeholder={
            "One per line, e.g.\n1. Update IR runbook (SecOps)\n2. Schedule re-test in 6 months"
          }
          value={actionItems}
          onChange={(e) => setActionItems(e.target.value)}
          rows={4}
        />
        <Input
          id="mr-next"
          label="Next exercise date"
          type="date"
          value={nextExerciseDate}
          onChange={(e) => setNextExerciseDate(e.target.value)}
        />
        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Mark Reviewed
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Detail primitives (mirrors the BIA page so the UX feels consistent) ─────

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

function DetailLong({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-300">
        {value}
      </p>
    </div>
  );
}
