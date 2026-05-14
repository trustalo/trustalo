"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import { MiniEditor } from "@/components/ui/mini-editor";
import {
  apiClient,
  type BCPPlanItem,
  type BCPStats,
  type BCPStatus,
  type OrgMember,
} from "@/lib/api-client";

// ── Constants ──

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const STATUS_BADGE: Record<BCPStatus, { variant: BadgeVariant; label: string }> = {
  draft: { variant: "neutral", label: "Draft" },
  under_review: { variant: "warning", label: "Under Review" },
  approved: { variant: "info", label: "Approved" },
  active: { variant: "success", label: "Active" },
  archived: { variant: "neutral", label: "Archived" },
};

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

function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ── Icons ──

function ShieldIcon({ className = "h-5 w-5" }: { className?: string }) {
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
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
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

// ── Page ──

export default function BusinessContinuityPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<BCPPlanItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stats, setStats] = useState<BCPStats | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await apiClient.listBCPPlans(params);
      setPlans(res.data.items);
      setTotal(res.data.total);
    } catch {
      setPlans([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.getBCPStats();
      setStats(res.data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    apiClient
      .listMembers()
      .then((r) => setMembers(r.data))
      .catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Page-level action bar (workspace title and tabs come from layout) */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <svg
            className="mr-1.5 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Plan
        </Button>
      </div>

      {/* Stats overview */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-7">
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950">
                <ShieldIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats.totalPlans}
                </p>
                <p className="text-xs text-neutral-500">Total Plans</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950">
                <ShieldIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.byStatus.active || 0}</p>
                <p className="text-xs text-neutral-500">Active</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950">
                <ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.byStatus.under_review || 0}
                </p>
                <p className="text-xs text-neutral-500">Under Review</p>
              </div>
            </div>
          </Card>
          <Card>
            <div
              className="flex items-center gap-3"
              title="Plans whose next review date has already passed."
            >
              <div className="rounded-lg bg-red-50 p-2 dark:bg-red-950">
                <AlertIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${stats.overdueReviews > 0 ? "text-red-600" : "text-neutral-900 dark:text-white"}`}
                >
                  {stats.overdueReviews}
                </p>
                <p className="text-xs text-neutral-500">Overdue Reviews</p>
              </div>
            </div>
          </Card>
          <Card>
            <div
              className="flex items-center gap-3"
              title="Plans whose next review date falls within the next 30 days."
            >
              <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950">
                <ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${stats.upcomingReviews > 0 ? "text-amber-600" : "text-neutral-900 dark:text-white"}`}
                >
                  {stats.upcomingReviews}
                </p>
                <p className="text-xs text-neutral-500">Reviews Due (30d)</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-950">
                <ChartIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.totalBIA}</p>
                <p className="text-xs text-neutral-500">Impact Analyses</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-50 p-2 dark:bg-cyan-950">
                <ClockIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-600">{stats.totalExercises}</p>
                <p className="text-xs text-neutral-500">Exercises</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-72">
          <Input
            id="bcp-search"
            placeholder="Search plans..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            id="bcp-status"
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {(search || statusFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
        <span className="ml-auto text-sm text-neutral-500 dark:text-neutral-400">
          {total} plan{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Plans table */}
      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <SpinnerIcon />
          </div>
        ) : plans.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <ShieldIcon className="h-6 w-6 text-neutral-400" />
            </div>
            <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
              {search || statusFilter
                ? "No plans match your filters"
                : "No business continuity plans yet"}
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {search || statusFilter
                ? "Try adjusting your search or filters."
                : "Create your first plan to start managing business continuity."}
            </p>
            {!search && !statusFilter && (
              <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
                Create Plan
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Plan</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Owner</TableHeader>
                <TableHeader>Version</TableHeader>
                <TableHeader>BIA</TableHeader>
                <TableHeader>Exercises</TableHeader>
                <TableHeader>Next Review</TableHeader>
                <TableHeader>Last Updated</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {plans.map((plan) => {
                const badge = STATUS_BADGE[plan.status];
                const reviewOverdue = isOverdue(plan.nextReviewDate);
                return (
                  <TableRow
                    key={plan.id}
                    className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    onClick={() => router.push(`/business-continuity/${plan.id}`)}
                  >
                    <TableCell>
                      <div>
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {plan.title}
                        </span>
                        {plan.description && (
                          <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-500">
                            {plan.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{plan.owner?.name || "Unassigned"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-neutral-500">
                        {plan.version || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{plan._count.impactAnalyses}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{plan._count.exercises}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm ${
                          reviewOverdue
                            ? "font-medium text-red-600 dark:text-red-400"
                            : "text-neutral-500"
                        }`}
                      >
                        {formatDate(plan.nextReviewDate)}
                        {reviewOverdue && <span className="ml-1 text-xs">(overdue)</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-neutral-500">{formatDate(plan.updatedAt)}</span>
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

      {/* Create plan modal */}
      <CreatePlanModal
        open={createOpen}
        members={members}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          setCreateOpen(false);
          router.push(`/business-continuity/${id}`);
        }}
      />
    </div>
  );
}

// ── Create Plan Modal ──

function CreatePlanModal({
  open,
  members,
  onClose,
  onCreated,
}: {
  open: boolean;
  members: OrgMember[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.0");
  const [ownerId, setOwnerId] = useState("");
  const [nextReviewDate, setNextReviewDate] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setVersion("1.0");
      setOwnerId("");
      setNextReviewDate("");
      setError(null);
    }
  }, [open]);

  const memberOptions = members.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.email})`,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!ownerId) {
      setError("Owner is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await apiClient.createBCPPlan({
        title: title.trim(),
        description: description.trim() || null,
        version: version.trim() || null,
        ownerId,
        nextReviewDate: nextReviewDate || null,
      });
      onCreated(res.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Business Continuity Plan" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <Input
          id="bcp-title"
          label="Plan Title *"
          placeholder="e.g. IT Disaster Recovery Plan"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <MiniEditor
          id="bcp-description"
          label="Description"
          placeholder="Describe the scope and objectives of this plan..."
          content={description}
          onChange={setDescription}
          minHeight="100px"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="bcp-owner"
            label="Plan Owner *"
            options={memberOptions}
            placeholder="Select owner..."
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          />
          <Input
            id="bcp-version"
            label="Version"
            placeholder="e.g. 1.0"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </div>

        <Input
          id="bcp-review-date"
          label="Next Review Date"
          type="date"
          value={nextReviewDate}
          onChange={(e) => setNextReviewDate(e.target.value)}
        />

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Create Plan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
