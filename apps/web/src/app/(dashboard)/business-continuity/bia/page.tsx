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
  type BCPPlanItem,
  type BIAStats,
  type BIAStatus,
  type BusinessImpactAnalysis,
  type CreateBIATopLevelInput,
  type CriticalityLevel,
  type OrgMember,
} from "@/lib/api-client";

// ── Constants ────────────────────────────────────────────────────────────────

const CRITICALITY_OPTIONS: { value: CriticalityLevel; label: string }[] = [
  { value: "mission_critical", label: "Mission critical" },
  { value: "business_critical", label: "Business critical" },
  { value: "business_operational", label: "Business operational" },
  { value: "administrative", label: "Administrative" },
];

const STATUS_OPTIONS: { value: BIAStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "archived", label: "Archived" },
];

const CRITICALITY_BADGE: Record<CriticalityLevel, { variant: BadgeVariant; label: string }> = {
  mission_critical: { variant: "danger", label: "Mission Critical" },
  business_critical: { variant: "warning", label: "Business Critical" },
  business_operational: { variant: "info", label: "Operational" },
  administrative: { variant: "neutral", label: "Administrative" },
};

const STATUS_BADGE: Record<BIAStatus, { variant: BadgeVariant; label: string }> = {
  draft: { variant: "neutral", label: "Draft" },
  under_review: { variant: "warning", label: "Under Review" },
  approved: { variant: "success", label: "Approved" },
  archived: { variant: "neutral", label: "Archived" },
};

const SORTABLE_COLUMNS = new Set([
  "processName",
  "criticalityLevel",
  "rtoHours",
  "rpoHours",
  "mtpdHours",
  "status",
  "nextReviewDate",
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

function formatMoney(value: number | string | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function isRecoveryGap(bia: Pick<BusinessImpactAnalysis, "rtoHours" | "mtpdHours">): boolean {
  return bia.mtpdHours != null && bia.rtoHours > bia.mtpdHours;
}

// ── Icons (inline to match other pages in the workspace) ─────────────────────

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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
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
function GapIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
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

export default function BIARegisterPage() {
  const [items, setItems] = useState<BusinessImpactAnalysis[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [criticality, setCriticality] = useState("");
  const [status, setStatus] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Sort
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Side data
  const [stats, setStats] = useState<BIAStats | null>(null);
  const [plans, setPlans] = useState<BCPPlanItem[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);

  // Modals / drawers
  const [createOpen, setCreateOpen] = useState(false);
  const [activeBia, setActiveBia] = useState<BusinessImpactAnalysis | null>(null);

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
      if (criticality) params.criticalityLevel = criticality;
      if (status) params.status = status;
      if (planFilter) params.bcpId = planFilter;
      if (overdueOnly) params.overdueOnly = "true";
      const res = await apiClient.listAllBIA(params);
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortDir, search, criticality, status, planFilter, overdueOnly]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.getAllBIAStats();
      setStats(res.data);
    } catch {
      /* swallow — stats card just hides */
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

  // Refresh both list + stats after any mutation.
  const refresh = useCallback(() => {
    fetchItems();
    fetchStats();
  }, [fetchItems, fetchStats]);

  const totalPages = Math.ceil(total / limit);
  const planOptions = useMemo(() => plans.map((p) => ({ value: p.id, label: p.title })), [plans]);
  const filtersActive = Boolean(search || criticality || status || planFilter || overdueOnly);

  function toggleSort(column: string) {
    if (!SORTABLE_COLUMNS.has(column)) return;
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir(column === "processName" ? "asc" : "desc");
    }
    setPage(1);
  }

  function sortDirFor(column: string): SortDir | null {
    return sortBy === column ? sortDir : null;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header action bar (workspace title + tabs come from layout) */}
      <div className="flex items-center justify-between">
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
          Process-level register of every business impact analysis. Use this to spot recovery gaps,
          overdue reviews, and unowned critical processes across all continuity plans.
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          New BIA
        </Button>
      </div>

      {/* KPI strip */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            icon={<ListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            tone="blue"
            value={stats.total}
            label="Processes"
          />
          <KpiCard
            icon={<FlameIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
            tone="red"
            value={stats.byCriticality.mission_critical || 0}
            label="Mission Critical"
            valueClass="text-red-600"
          />
          <KpiCard
            icon={<GapIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            tone="amber"
            value={stats.recoveryGaps}
            label="Recovery Gaps (RTO > MTPD)"
            valueClass={stats.recoveryGaps > 0 ? "text-amber-600" : undefined}
            tooltip="Stated recovery time exceeds the maximum tolerable disruption period."
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

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-72">
          <Input
            id="bia-search"
            placeholder="Search process name or description…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            id="bia-criticality"
            options={CRITICALITY_OPTIONS}
            placeholder="All criticalities"
            value={criticality}
            onChange={(e) => {
              setCriticality(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Select
            id="bia-status"
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-56">
          <Select
            id="bia-plan"
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
              setCriticality("");
              setStatus("");
              setPlanFilter("");
              setOverdueOnly(false);
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
        <span className="ml-auto pb-2 text-sm text-neutral-500 dark:text-neutral-400">
          {total} {total === 1 ? "process" : "processes"}
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
                  label="Process"
                  column="processName"
                  current={sortDirFor("processName")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Criticality"
                  column="criticalityLevel"
                  current={sortDirFor("criticalityLevel")}
                  onClick={toggleSort}
                />
                <TableHeader>Plan</TableHeader>
                <TableHeader>Owner</TableHeader>
                <SortableHeader
                  label="RTO"
                  column="rtoHours"
                  current={sortDirFor("rtoHours")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="RPO"
                  column="rpoHours"
                  current={sortDirFor("rpoHours")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="MTPD"
                  column="mtpdHours"
                  current={sortDirFor("mtpdHours")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Status"
                  column="status"
                  current={sortDirFor("status")}
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
              {items.map((bia) => {
                const crit = CRITICALITY_BADGE[bia.criticalityLevel];
                const stat = STATUS_BADGE[bia.status];
                const reviewOverdue = isOverdue(bia.nextReviewDate);
                const gap = isRecoveryGap(bia);
                return (
                  <TableRow
                    key={bia.id}
                    className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    onClick={() => setActiveBia(bia)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {bia.processName}
                        </span>
                        {gap && (
                          <span
                            title="Recovery gap: RTO exceeds MTPD"
                            className="inline-flex h-5 items-center gap-1 rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          >
                            <GapIcon className="h-3 w-3" />
                            Gap
                          </span>
                        )}
                      </div>
                      {bia.description && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-500">
                          {bia.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={crit.variant}>{crit.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {bia.bcp ? (
                        <Link
                          href={`/business-continuity/${bia.bcp.id}`}
                          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {bia.bcp.title}
                        </Link>
                      ) : (
                        <span className="text-sm text-neutral-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {bia.owner?.name ?? (
                          <span className="italic text-neutral-400">Unassigned</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{formatHours(bia.rtoHours)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{formatHours(bia.rpoHours)}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-mono text-sm ${gap ? "text-amber-600 dark:text-amber-400" : ""}`}
                      >
                        {formatHours(bia.mtpdHours)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stat.variant}>{stat.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm ${
                          reviewOverdue
                            ? "font-medium text-red-600 dark:text-red-400"
                            : "text-neutral-500"
                        }`}
                      >
                        {formatDate(bia.nextReviewDate)}
                        {reviewOverdue && <span className="ml-1 text-xs">(overdue)</span>}
                      </span>
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

      {/* Create modal */}
      <BIAFormModal
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

      {/* Detail / edit drawer */}
      <BIADetailDrawer
        bia={activeBia}
        plans={plans}
        members={members}
        onClose={() => setActiveBia(null)}
        onChanged={(updated) => {
          // Patch the local row optimistically without forcing a full reload.
          setItems((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
          setActiveBia(updated);
          fetchStats();
        }}
        onDeleted={(id) => {
          setItems((prev) => prev.filter((b) => b.id !== id));
          setActiveBia(null);
          fetchStats();
          // If the page is now empty (and not page 1), step back.
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
  tooltip,
}: {
  icon: React.ReactNode;
  tone: "blue" | "red" | "amber" | "emerald" | "purple";
  value: number;
  label: string;
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
        <ListIcon className="h-6 w-6 text-neutral-400" />
      </div>
      <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
        {filtered ? "No BIAs match your filters" : "No business impact analyses yet"}
      </h3>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        {filtered
          ? "Try adjusting your search or filters."
          : "Capture a business process to begin understanding recovery requirements."}
      </p>
      {!filtered && (
        <Button className="mt-4" size="sm" onClick={onCreate}>
          New BIA
        </Button>
      )}
    </div>
  );
}

// ── Create / Edit modal ──────────────────────────────────────────────────────

interface BIAFormState {
  bcpId: string;
  processName: string;
  description: string;
  criticalityLevel: CriticalityLevel;
  rtoHours: string;
  rpoHours: string;
  maxTolerableDowntimeHours: string;
  mtpdHours: string;
  financialImpactPerHour: string;
  ownerId: string;
  status: BIAStatus;
  nextReviewDate: string;
  dependencies: string;
  operationalImpact: string;
  regulatoryImpact: string;
  reputationalImpact: string;
}

const EMPTY_FORM: BIAFormState = {
  bcpId: "",
  processName: "",
  description: "",
  criticalityLevel: "business_critical",
  rtoHours: "",
  rpoHours: "",
  maxTolerableDowntimeHours: "",
  mtpdHours: "",
  financialImpactPerHour: "",
  ownerId: "",
  status: "draft",
  nextReviewDate: "",
  dependencies: "",
  operationalImpact: "",
  regulatoryImpact: "",
  reputationalImpact: "",
};

function biaToForm(bia: BusinessImpactAnalysis): BIAFormState {
  return {
    bcpId: bia.bcpId,
    processName: bia.processName,
    description: bia.description ?? "",
    criticalityLevel: bia.criticalityLevel,
    rtoHours: String(bia.rtoHours),
    rpoHours: String(bia.rpoHours),
    maxTolerableDowntimeHours: String(bia.maxTolerableDowntimeHours),
    mtpdHours: bia.mtpdHours == null ? "" : String(bia.mtpdHours),
    financialImpactPerHour:
      bia.financialImpactPerHour == null ? "" : String(bia.financialImpactPerHour),
    ownerId: bia.ownerId ?? "",
    status: bia.status,
    nextReviewDate: bia.nextReviewDate ? bia.nextReviewDate.slice(0, 10) : "",
    dependencies: bia.dependencies ?? "",
    operationalImpact: bia.operationalImpact ?? "",
    regulatoryImpact: bia.regulatoryImpact ?? "",
    reputationalImpact: bia.reputationalImpact ?? "",
  };
}

function BIAFormModal({
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
  initial?: BusinessImpactAnalysis;
  plans: BCPPlanItem[];
  members: OrgMember[];
  onClose: () => void;
  onSaved: (bia: BusinessImpactAnalysis) => void;
}) {
  const [form, setForm] = useState<BIAFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(initial ? biaToForm(initial) : EMPTY_FORM);
  }, [open, initial]);

  const planOptions = useMemo(() => plans.map((p) => ({ value: p.id, label: p.title })), [plans]);
  const memberOptions = useMemo(
    () => [
      { value: "", label: "Unassigned" },
      ...members.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` })),
    ],
    [members],
  );

  function patch<K extends keyof BIAFormState>(key: K, value: BIAFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Required fields
    if (!form.bcpId) return setError("Select a continuity plan");
    if (!form.processName.trim()) return setError("Process name is required");
    const rto = Number(form.rtoHours);
    const rpo = Number(form.rpoHours);
    const mtd = Number(form.maxTolerableDowntimeHours);
    if (!Number.isFinite(rto) || rto < 0) return setError("RTO must be a non-negative number");
    if (!Number.isFinite(rpo) || rpo < 0) return setError("RPO must be a non-negative number");
    if (!Number.isFinite(mtd) || mtd < 0)
      return setError("Maximum tolerable downtime must be a non-negative number");

    const mtpdNum = form.mtpdHours === "" ? null : Number(form.mtpdHours);
    if (mtpdNum != null && (!Number.isFinite(mtpdNum) || mtpdNum < 0)) {
      return setError("MTPD must be a non-negative number");
    }
    const finNum = form.financialImpactPerHour === "" ? null : Number(form.financialImpactPerHour);
    if (finNum != null && (!Number.isFinite(finNum) || finNum < 0)) {
      return setError("Financial impact must be a non-negative number");
    }

    setSaving(true);
    setError(null);

    const payload: CreateBIATopLevelInput = {
      bcpId: form.bcpId,
      processName: form.processName.trim(),
      description: form.description.trim() || null,
      criticalityLevel: form.criticalityLevel,
      rtoHours: rto,
      rpoHours: rpo,
      maxTolerableDowntimeHours: mtd,
      mtpdHours: mtpdNum,
      financialImpactPerHour: finNum,
      dependencies: form.dependencies.trim() || null,
      operationalImpact: form.operationalImpact.trim() || null,
      regulatoryImpact: form.regulatoryImpact.trim() || null,
      reputationalImpact: form.reputationalImpact.trim() || null,
      status: form.status,
      ownerId: form.ownerId || null,
      nextReviewDate: form.nextReviewDate || null,
    };

    try {
      const res =
        mode === "create"
          ? await apiClient.createBIATopLevel(payload)
          : await apiClient.updateBIATopLevel(initial!.id, payload);
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save BIA");
    } finally {
      setSaving(false);
    }
  }

  // Live "recovery gap" hint inside the form.
  const rtoNum = Number(form.rtoHours);
  const mtpdNum = form.mtpdHours === "" ? null : Number(form.mtpdHours);
  const formGap =
    Number.isFinite(rtoNum) && mtpdNum != null && Number.isFinite(mtpdNum) && rtoNum > mtpdNum;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "New Business Impact Analysis" : "Edit BIA"}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Section: Process identity */}
        <FormSection title="Process" description="What business activity is being analysed.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SearchableSelect
              id="bia-plan"
              label="Continuity Plan *"
              options={planOptions}
              placeholder={planOptions.length ? "Select plan…" : "No plans available"}
              value={form.bcpId}
              onChange={(v) => patch("bcpId", v)}
              disabled={mode === "edit"}
            />
            <SearchableSelect
              id="bia-owner"
              label="Process Owner"
              options={memberOptions}
              placeholder="Unassigned"
              value={form.ownerId}
              onChange={(v) => patch("ownerId", v)}
            />
          </div>
          <Input
            id="bia-process-name"
            label="Process Name *"
            placeholder="e.g. Customer Order Pipeline"
            value={form.processName}
            onChange={(e) => patch("processName", e.target.value)}
            required
          />
          <Textarea
            id="bia-description"
            label="Description"
            placeholder="What does this process do? Who depends on it?"
            value={form.description}
            onChange={(e) => patch("description", e.target.value)}
            rows={2}
          />
        </FormSection>

        {/* Section: Criticality + recovery */}
        <FormSection
          title="Criticality & Recovery Targets"
          description="Set how critical the process is and the windows your business can tolerate."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              id="bia-criticality"
              label="Criticality *"
              options={CRITICALITY_OPTIONS}
              value={form.criticalityLevel}
              onChange={(e) => patch("criticalityLevel", e.target.value as CriticalityLevel)}
            />
            <Select
              id="bia-status-form"
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => patch("status", e.target.value as BIAStatus)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input
              id="bia-rto"
              label="RTO (hours) *"
              type="number"
              min="0"
              value={form.rtoHours}
              onChange={(e) => patch("rtoHours", e.target.value)}
              required
            />
            <Input
              id="bia-rpo"
              label="RPO (hours) *"
              type="number"
              min="0"
              value={form.rpoHours}
              onChange={(e) => patch("rpoHours", e.target.value)}
              required
            />
            <Input
              id="bia-mtd"
              label="MTD (hours) *"
              type="number"
              min="0"
              value={form.maxTolerableDowntimeHours}
              onChange={(e) => patch("maxTolerableDowntimeHours", e.target.value)}
              required
            />
            <Input
              id="bia-mtpd"
              label="MTPD (hours)"
              type="number"
              min="0"
              value={form.mtpdHours}
              onChange={(e) => patch("mtpdHours", e.target.value)}
              placeholder="optional"
            />
          </div>
          <p className="text-xs text-neutral-500">
            <strong>RTO</strong> recovery time objective · <strong>RPO</strong> recovery point
            objective · <strong>MTD</strong> maximum tolerable downtime · <strong>MTPD</strong>{" "}
            maximum tolerable period of disruption (regulatory ceiling).
          </p>
          {formGap && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <strong>Recovery gap:</strong> RTO ({rtoNum}h) exceeds MTPD ({mtpdNum}h). The stated
              recovery target is already non-compliant.
            </div>
          )}
        </FormSection>

        {/* Section: Impact */}
        <FormSection
          title="Impact"
          description="Quantitative and qualitative consequences of disruption."
        >
          <Input
            id="bia-financial"
            label="Financial impact ($/hour)"
            type="number"
            min="0"
            value={form.financialImpactPerHour}
            onChange={(e) => patch("financialImpactPerHour", e.target.value)}
            placeholder="e.g. 15000"
          />
          <Textarea
            id="bia-operational"
            label="Operational impact"
            placeholder="What stops working? Which teams or systems are affected?"
            value={form.operationalImpact}
            onChange={(e) => patch("operationalImpact", e.target.value)}
            rows={2}
          />
          <Textarea
            id="bia-regulatory"
            label="Regulatory / compliance impact"
            placeholder="Any SLAs, reporting deadlines, or breaches triggered by an outage."
            value={form.regulatoryImpact}
            onChange={(e) => patch("regulatoryImpact", e.target.value)}
            rows={2}
          />
          <Textarea
            id="bia-reputational"
            label="Reputational impact"
            placeholder="Customer, partner, or public-perception consequences."
            value={form.reputationalImpact}
            onChange={(e) => patch("reputationalImpact", e.target.value)}
            rows={2}
          />
        </FormSection>

        {/* Section: Dependencies + lifecycle */}
        <FormSection
          title="Dependencies & Lifecycle"
          description="What this process needs to function, and when to revisit the analysis."
        >
          <Textarea
            id="bia-dependencies"
            label="Dependencies"
            placeholder="People, systems, vendors, facilities, data."
            value={form.dependencies}
            onChange={(e) => patch("dependencies", e.target.value)}
            rows={2}
          />
          <Input
            id="bia-next-review"
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
            {mode === "create" ? "Create BIA" : "Save Changes"}
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

// ── Detail / edit drawer ─────────────────────────────────────────────────────

function BIADetailDrawer({
  bia,
  plans,
  members,
  onClose,
  onChanged,
  onDeleted,
}: {
  bia: BusinessImpactAnalysis | null;
  plans: BCPPlanItem[];
  members: OrgMember[];
  onClose: () => void;
  onChanged: (bia: BusinessImpactAnalysis) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reset edit state whenever the active BIA changes / drawer reopens.
  useEffect(() => {
    setEditing(false);
  }, [bia?.id]);

  if (!bia) return null;

  const crit = CRITICALITY_BADGE[bia.criticalityLevel];
  const stat = STATUS_BADGE[bia.status];
  const gap = isRecoveryGap(bia);
  const reviewOverdue = isOverdue(bia.nextReviewDate);

  async function handleApprove() {
    if (!bia) return;
    setApproving(true);
    try {
      const res = await apiClient.approveBIA(bia.id);
      onChanged(res.data);
    } catch {
      /* surfaced via global error toast in future; silent for now */
    } finally {
      setApproving(false);
    }
  }

  async function handleDelete() {
    if (!bia) return;
    if (!confirm(`Delete BIA for "${bia.processName}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await apiClient.deleteBIATopLevel(bia.id);
      onDeleted(bia.id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <>
      <InfoDrawer
        open={!!bia && !editing}
        onClose={onClose}
        title={bia.processName}
        widthClassName="max-w-xl"
      >
        <div className="space-y-5">
          {/* Status row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={crit.variant}>{crit.label}</Badge>
            <Badge variant={stat.variant}>{stat.label}</Badge>
            {gap && <Badge variant="warning">Recovery gap (RTO &gt; MTPD)</Badge>}
            {reviewOverdue && <Badge variant="danger">Review overdue</Badge>}
          </div>

          {bia.description && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{bia.description}</p>
          )}

          {/* Plan + Owner */}
          <DetailGrid>
            <DetailField label="Continuity plan">
              {bia.bcp ? (
                <Link
                  href={`/business-continuity/${bia.bcp.id}`}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  {bia.bcp.title}
                </Link>
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label="Process owner">
              {bia.owner?.name ?? <span className="italic text-neutral-400">Unassigned</span>}
            </DetailField>
          </DetailGrid>

          {/* Recovery targets */}
          <SectionHeader>Recovery targets</SectionHeader>
          <DetailGrid cols={4}>
            <DetailField label="RTO">{formatHours(bia.rtoHours)}</DetailField>
            <DetailField label="RPO">{formatHours(bia.rpoHours)}</DetailField>
            <DetailField label="MTD">{formatHours(bia.maxTolerableDowntimeHours)}</DetailField>
            <DetailField label="MTPD">
              <span className={gap ? "text-amber-600 dark:text-amber-400" : ""}>
                {formatHours(bia.mtpdHours)}
              </span>
            </DetailField>
          </DetailGrid>

          {/* Impact */}
          <SectionHeader>Impact</SectionHeader>
          <DetailGrid>
            <DetailField label="Financial impact / hour">
              {formatMoney(bia.financialImpactPerHour)}
            </DetailField>
          </DetailGrid>
          {(bia.operationalImpact || bia.regulatoryImpact || bia.reputationalImpact) && (
            <div className="space-y-3">
              {bia.operationalImpact && (
                <DetailLong label="Operational impact" value={bia.operationalImpact} />
              )}
              {bia.regulatoryImpact && (
                <DetailLong label="Regulatory / compliance impact" value={bia.regulatoryImpact} />
              )}
              {bia.reputationalImpact && (
                <DetailLong label="Reputational impact" value={bia.reputationalImpact} />
              )}
            </div>
          )}

          {/* Dependencies */}
          {bia.dependencies && (
            <>
              <SectionHeader>Dependencies</SectionHeader>
              <p className="whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-300">
                {bia.dependencies}
              </p>
            </>
          )}

          {/* Lifecycle */}
          <SectionHeader>Lifecycle</SectionHeader>
          <DetailGrid cols={2}>
            <DetailField label="Last reviewed">{formatDate(bia.lastReviewedAt)}</DetailField>
            <DetailField label="Next review">
              <span className={reviewOverdue ? "text-red-600 dark:text-red-400" : ""}>
                {formatDate(bia.nextReviewDate)}
              </span>
            </DetailField>
            <DetailField label="Approved at">{formatDate(bia.approvedAt)}</DetailField>
            <DetailField label="Last updated">{formatDate(bia.updatedAt)}</DetailField>
          </DetailGrid>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {bia.status !== "approved" && (
              <Button size="sm" variant="secondary" loading={approving} onClick={handleApprove}>
                Approve
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

      <BIAFormModal
        mode="edit"
        open={editing}
        initial={bia}
        plans={plans}
        members={members}
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
