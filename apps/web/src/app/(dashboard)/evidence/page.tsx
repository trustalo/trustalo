"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
  type Control,
  type ControlStatus,
  type EvidenceApprovalStatus,
  type EvidenceHealthSummary,
  type EvidenceItem,
  type EvidenceType as EvidenceKind,
} from "@/lib/api-client";
import {
  EVIDENCE_STATUS_BADGE,
  EVIDENCE_TYPE_LABELS,
  TypeIcon,
  formatDate,
  expiryBadge,
  EvidenceFormModal,
  EvidenceDetailModal,
  DeleteEvidenceModal,
  ReviewEvidenceModal,
} from "@/components/evidence/evidence-modals";

// ─── Page-specific constants ─────────────────────────────────

const STATUS_OPTIONS: { value: EvidenceApprovalStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "stale", label: "Stale" },
];

const TYPE_OPTIONS: { value: EvidenceKind | ""; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "document", label: "Document" },
  { value: "screenshot", label: "Screenshot" },
  { value: "link", label: "Link / URL" },
  { value: "automated", label: "Automated" },
  { value: "attestation", label: "Attestation" },
];

const CONTROL_STATUS_BADGE: Record<ControlStatus, { variant: BadgeVariant; label: string }> = {
  not_implemented: { variant: "danger", label: "Not Implemented" },
  partially_implemented: { variant: "warning", label: "Partial" },
  implemented: { variant: "success", label: "Implemented" },
  not_applicable: { variant: "neutral", label: "N/A" },
};

// ─── Main Page ───────────────────────────────────────────────

type QuickFilter = "all" | "needs_attention" | "expiring" | "pending_review" | "expired";

export default function EvidencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Control filter (can be set via URL ?controlId=xxx when navigating from a control)
  const controlIdFromUrl = searchParams.get("controlId") || "";

  // Controls for filter dropdown
  const [controls, setControls] = useState<Control[]>([]);
  const [controlsLoading, setControlsLoading] = useState(false);
  const [controlFilter, setControlFilter] = useState(controlIdFromUrl);

  // Health summary
  const [health, setHealth] = useState<EvidenceHealthSummary | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  // Evidence list
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EvidenceApprovalStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<EvidenceKind | "">("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");

  // Modals
  const [formModalItem, setFormModalItem] = useState<EvidenceItem | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<EvidenceItem | null>(null);
  const [reviewTarget, setReviewTarget] = useState<EvidenceItem | null>(null);
  const [detailTarget, setDetailTarget] = useState<EvidenceItem | null>(null);

  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, typeFilter, quickFilter, controlFilter]);

  // Load controls for filter
  useEffect(() => {
    setControlsLoading(true);
    apiClient
      .listControls({ limit: "500" })
      .then((res) => setControls(res.data.items))
      .catch(() => {})
      .finally(() => setControlsLoading(false));
  }, []);

  const controlOptions = [
    { value: "", label: "All Controls" },
    ...controls.map((c) => ({
      value: c.id,
      label: `${c.title}${c.category ? ` (${c.category})` : ""}`,
    })),
  ];

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const res = await apiClient.getEvidenceHealth();
      setHealth(res.data);
    } catch {
      /* ignore */
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const fetchEvidence = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (debouncedSearch) params.search = debouncedSearch;
      if (controlFilter) params.controlId = controlFilter;

      if (quickFilter === "pending_review") {
        params.status = "pending_review";
      } else if (quickFilter === "expired") {
        params.expired = "true";
      } else if (quickFilter === "expiring") {
        params.expiring = "true";
      } else if (quickFilter === "needs_attention") {
        // compound — handled client-side with full list
      } else {
        if (statusFilter) params.status = statusFilter;
      }

      if (typeFilter) params.type = typeFilter;

      const res = await apiClient.listEvidence(params);
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, typeFilter, quickFilter, controlFilter]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);
  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  function handleFormSaved() {
    setFormModalItem(null);
    fetchEvidence();
    fetchHealth();
  }

  async function handleSubmitForReview(id: string) {
    try {
      await apiClient.submitEvidenceForReview(id);
      fetchEvidence();
      fetchHealth();
    } catch {
      /* ignore */
    }
  }

  async function handleRenew(id: string) {
    try {
      await apiClient.renewEvidence(id);
      fetchEvidence();
      fetchHealth();
    } catch {
      /* ignore */
    }
  }

  function clearControlFilter() {
    setControlFilter("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("controlId");
    router.replace(`/evidence${params.toString() ? `?${params}` : ""}`);
  }

  const totalPages = Math.ceil(total / limit);
  const needsAttentionCount = health ? health.expired + health.expiringSoon + health.rejected : 0;

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Evidence</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Central evidence library across all controls. Upload, review, and track compliance
            artifacts.
          </p>
        </div>
        <Button onClick={() => setFormModalItem("new")}>+ Add Evidence</Button>
      </div>

      {/* ── Health Dashboard ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
        <HealthCard label="Total" value={health?.total} loading={healthLoading} />
        <HealthCard
          label="Approved"
          value={health?.approved}
          loading={healthLoading}
          color="text-emerald-600 dark:text-emerald-400"
        />
        <HealthCard
          label="Pending Review"
          value={health?.pendingReview}
          loading={healthLoading}
          color="text-amber-500"
          onClick={() => setQuickFilter("pending_review")}
          active={quickFilter === "pending_review"}
        />
        <HealthCard
          label="Expiring Soon"
          value={health?.expiringSoon}
          loading={healthLoading}
          color="text-orange-500"
          onClick={() => setQuickFilter("expiring")}
          active={quickFilter === "expiring"}
        />
        <HealthCard
          label="Expired"
          value={health?.expired}
          loading={healthLoading}
          color="text-red-600 dark:text-red-400"
          onClick={() => setQuickFilter("expired")}
          active={quickFilter === "expired"}
        />
        <HealthCard
          label="Draft"
          value={health?.draft}
          loading={healthLoading}
          color="text-neutral-500"
        />
        <HealthCard
          label="Rejected"
          value={health?.rejected}
          loading={healthLoading}
          color="text-red-500"
        />
      </div>

      {/* Needs attention banner */}
      {!healthLoading && needsAttentionCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/50">
          <svg
            className="h-5 w-5 flex-shrink-0 text-amber-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>{needsAttentionCount}</strong> evidence item
            {needsAttentionCount !== 1 ? "s" : ""} need{needsAttentionCount === 1 ? "s" : ""}{" "}
            attention — expired, expiring soon, or rejected.
          </p>
          <button
            type="button"
            className="ml-auto text-sm font-medium text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
            onClick={() =>
              setQuickFilter(quickFilter === "needs_attention" ? "all" : "needs_attention")
            }
          >
            {quickFilter === "needs_attention" ? "Show All" : "View"}
          </button>
        </div>
      )}

      {/* ── Filters ───────────────────────────────────────── */}
      <Card>
        {/* Control scope filter */}
        <div className="flex items-end gap-3">
          <div className="min-w-[280px] max-w-sm flex-1">
            <SearchableSelect
              id="ev-control-filter"
              label="Filter by Control"
              options={controlOptions}
              placeholder={controlsLoading ? "Loading…" : "All Controls"}
              value={controlFilter}
              onChange={(val) => setControlFilter(val)}
              disabled={controlsLoading}
            />
          </div>
          {controlFilter && (
            <button
              type="button"
              onClick={() => router.push(`/controls/${controlFilter}`)}
              className="mb-0.5 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
            >
              View Control
            </button>
          )}
        </div>

        {/* Search + status + type filters */}
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Input
              id="ev-search"
              label="Search"
              placeholder="Search by title, description, or file name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-44">
            <Select
              id="ev-status-filter"
              label="Status"
              options={STATUS_OPTIONS}
              value={quickFilter !== "all" && quickFilter !== "needs_attention" ? "" : statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as EvidenceApprovalStatus | "");
                setQuickFilter("all");
              }}
            />
          </div>
          <div className="w-40">
            <Select
              id="ev-type-filter"
              label="Type"
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as EvidenceKind | "")}
            />
          </div>
          {(search || statusFilter || typeFilter || quickFilter !== "all" || controlFilter) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setTypeFilter("");
                setQuickFilter("all");
                clearControlFilter();
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Quick filter pills */}
        <div className="mt-3 flex flex-wrap gap-2">
          {(["all", "pending_review", "expiring", "expired"] as QuickFilter[]).map((qf) => {
            const labels: Record<QuickFilter, string> = {
              all: "All Evidence",
              needs_attention: "Needs Attention",
              pending_review: "Pending Review",
              expiring: "Expiring Soon",
              expired: "Expired",
            };
            return (
              <button
                key={qf}
                type="button"
                onClick={() => {
                  setQuickFilter(qf);
                  setStatusFilter("");
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  quickFilter === qf
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                }`}
              >
                {labels[qf]}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── Evidence Table ────────────────────────────────── */}
      <Card padding="none">
        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="h-7 w-7 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
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
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <svg
              className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l3.122 3.12a1.5 1.5 0 01.439 1.061V16.5A1.5 1.5 0 0114.5 18h-10A1.5 1.5 0 013 16.5v-13z" />
            </svg>
            <p className="mt-3 text-sm font-medium text-neutral-500">No evidence found</p>
            <p className="mt-1 text-xs text-neutral-400">
              {search || statusFilter || typeFilter || quickFilter !== "all" || controlFilter
                ? "Try adjusting your filters."
                : 'Click "+ Add Evidence" to attach your first compliance artifact.'}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Evidence</TableHeader>
                  <TableHeader>Control</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Submitted By</TableHeader>
                  <TableHeader>Collected</TableHeader>
                  <TableHeader>Expires</TableHeader>
                  <TableHeader className="text-right">Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((ev) => {
                  const stBadge = EVIDENCE_STATUS_BADGE[ev.status];
                  const expBadge = expiryBadge(ev.expiresAt);
                  const controlBadge = ev.control ? CONTROL_STATUS_BADGE[ev.control.status] : null;

                  return (
                    <TableRow
                      key={ev.id}
                      className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                      onClick={() => setDetailTarget(ev)}
                    >
                      <TableCell>
                        <div className="max-w-[260px]">
                          <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                            {ev.title}
                          </p>
                          {ev.description && (
                            <p className="mt-0.5 truncate text-xs text-neutral-400">
                              {ev.description}
                            </p>
                          )}
                          {ev.tags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {ev.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                                >
                                  {tag}
                                </span>
                              ))}
                              {ev.tags.length > 3 && (
                                <span className="text-[10px] text-neutral-400">
                                  +{ev.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ev.control ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/controls/${ev.control!.id}`);
                            }}
                            className="group max-w-[180px] text-left"
                          >
                            <p className="truncate text-sm text-blue-600 group-hover:underline dark:text-blue-400">
                              {ev.control.title}
                            </p>
                            {controlBadge && (
                              <Badge variant={controlBadge.variant} className="mt-0.5">
                                {controlBadge.label}
                              </Badge>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <TypeIcon type={ev.type} />
                          <span className="text-sm text-neutral-600 dark:text-neutral-300">
                            {EVIDENCE_TYPE_LABELS[ev.type]}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={stBadge.variant}>{stBadge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-neutral-600 dark:text-neutral-300">
                          {ev.submittedBy?.name ?? "Evidence Agent"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-neutral-500">
                          {formatDate(ev.collectedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-neutral-500">
                            {formatDate(ev.expiresAt)}
                          </span>
                          {expBadge && <Badge variant={expBadge.variant}>{expBadge.label}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {(ev.status === "draft" || ev.status === "rejected") && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSubmitForReview(ev.id)}
                            >
                              Submit
                            </Button>
                          )}
                          {ev.status === "pending_review" && (
                            <Button size="sm" onClick={() => setReviewTarget(ev)}>
                              Review
                            </Button>
                          )}
                          {(ev.status === "expired" || ev.status === "stale") &&
                            ev.renewalFrequency &&
                            ev.renewalFrequency !== "once" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleRenew(ev.id)}
                              >
                                Renew
                              </Button>
                            )}
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => setFormModalItem(ev)}
                            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => setDeleteTarget(ev)}
                            className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 dark:border-neutral-700">
                <p className="text-xs text-neutral-500">
                  {total} evidence item{total !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-neutral-500">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── Modals (shared components) ────────────────────── */}

      {formModalItem && (
        <EvidenceFormModal
          evidence={formModalItem === "new" ? null : formModalItem}
          onClose={() => setFormModalItem(null)}
          onSaved={handleFormSaved}
        />
      )}

      {deleteTarget && (
        <DeleteEvidenceModal
          evidence={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            fetchEvidence();
            fetchHealth();
          }}
        />
      )}

      {reviewTarget && (
        <ReviewEvidenceModal
          evidence={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onReviewed={() => {
            setReviewTarget(null);
            fetchEvidence();
            fetchHealth();
          }}
        />
      )}

      {detailTarget && (
        <EvidenceDetailModal
          evidence={detailTarget}
          onClose={() => setDetailTarget(null)}
          onEdit={(ev) => {
            setDetailTarget(null);
            setFormModalItem(ev);
          }}
          onReview={(ev) => {
            setDetailTarget(null);
            setReviewTarget(ev);
          }}
          onSubmitForReview={async (id) => {
            await handleSubmitForReview(id);
            setDetailTarget(null);
          }}
          onRenew={async (id) => {
            await handleRenew(id);
            setDetailTarget(null);
          }}
          onNavigateControl={(controlId) => router.push(`/controls/${controlId}`)}
        />
      )}
    </div>
  );
}

// ─── Health Card ──────────────────────────────────────────────

function HealthCard({
  label,
  value,
  loading,
  color,
  onClick,
  active,
}: {
  label: string;
  value: number | undefined;
  loading: boolean;
  color?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-lg border p-3 text-center transition-colors ${
        active
          ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950"
          : "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
      } ${onClick ? "cursor-pointer hover:border-blue-300 dark:hover:border-blue-600" : ""}`}
    >
      {loading ? (
        <div className="mx-auto h-7 w-10 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      ) : (
        <p className={`text-2xl font-bold ${color || "text-neutral-900 dark:text-white"}`}>
          {value ?? 0}
        </p>
      )}
      <p className="mt-0.5 text-[11px] font-medium text-neutral-500">{label}</p>
    </Wrapper>
  );
}
