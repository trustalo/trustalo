"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  type CreateControlInput,
  type FrameworkInstance,
  type FrameworkType,
  type OrgMember,
} from "@/lib/api-client";

const STATUS_FILTER_OPTIONS = [
  { value: "not_implemented", label: "Not Implemented" },
  { value: "partially_implemented", label: "Partially Implemented" },
  { value: "implemented", label: "Implemented" },
];

const ALL_STATUS_OPTIONS = [
  ...STATUS_FILTER_OPTIONS,
  { value: "not_applicable", label: "Not Applicable" },
];

const STATUS_BADGE: Record<ControlStatus, { variant: BadgeVariant; label: string }> = {
  not_implemented: { variant: "danger", label: "Not Implemented" },
  partially_implemented: { variant: "warning", label: "Partially Implemented" },
  implemented: { variant: "success", label: "Implemented" },
  not_applicable: { variant: "neutral", label: "Not Applicable" },
};

const FW_BADGE: Record<FrameworkType, { label: string; variant: BadgeVariant }> = {
  iso27001: { label: "27001", variant: "info" },
  iso27017: { label: "27017", variant: "info" },
  iso27018: { label: "27018", variant: "info" },
  iso22301: { label: "22301", variant: "warning" },
  iso42001: { label: "42001", variant: "neutral" },
  soc2: { label: "SOC 2", variant: "success" },
  essential8: { label: "E8", variant: "warning" },
  nist_csf_2: { label: "CSF", variant: "info" },
  gdpr: { label: "GDPR", variant: "info" },
  cps234: { label: "CPS 234", variant: "warning" },
  hipaa: { label: "HIPAA", variant: "success" },
  pci_dss_4: { label: "PCI DSS", variant: "info" },
};

function getFrameworkBadges(ctrl: Control) {
  if (!ctrl.controlRequirementAssignments || ctrl.controlRequirementAssignments.length === 0)
    return [];
  const seen = new Set<FrameworkType>();
  const badges: { type: FrameworkType; label: string; variant: BadgeVariant }[] = [];
  for (const m of ctrl.controlRequirementAssignments) {
    const ft = m.requirement.framework.frameworkType;
    if (!seen.has(ft)) {
      seen.add(ft);
      badges.push({ type: ft, ...FW_BADGE[ft] });
    }
  }
  return badges;
}

/**
 * Returns the highest maturity-level marker present on this control's
 * requirements (e.g. "ML2" for an E8 control). Returns null when none of
 * the requirements carry a maturity marker.
 */
function getMaturityChip(ctrl: Control): string | null {
  if (!ctrl.controlRequirementAssignments?.length) return null;
  const levels = ctrl.controlRequirementAssignments
    .map((m) => m.requirement.maturityLevel)
    .filter((v): v is string => Boolean(v));
  if (levels.length === 0) return null;
  // Lexicographic ordering works for "ml1" < "ml2" < "ml3" and "tier1"…"tier4".
  const max = levels.sort().pop()!;
  // First uppercase the prefix ("ml1" -> "ML1", "tier1" -> "TIER1"),
  // then expand the verbose "Tier" form for readability ("TIER1" ->
  // "Tier 1"). Essential Eight's "ML1/2/3" stays compact by convention.
  return max.replace(/^(ml|tier)/i, (m) => m.toUpperCase()).replace(/^TIER/, "Tier ");
}

function getEvidenceHealthBadge(ctrl: Control): { label: string; variant: BadgeVariant } {
  const evidenceList = ctrl.evidence || [];
  const count = ctrl._count?.evidence ?? evidenceList.length;
  if (count === 0) return { label: "No Evidence", variant: "danger" };

  const now = Date.now();
  const hasExpired = evidenceList.some(
    (e) => e.status === "expired" || (e.expiresAt && new Date(e.expiresAt).getTime() < now),
  );
  if (hasExpired) return { label: "Expired", variant: "danger" };

  const hasExpiringSoon = evidenceList.some((e) => {
    if (!e.expiresAt) return false;
    const days = Math.ceil((new Date(e.expiresAt).getTime() - now) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 30;
  });
  if (hasExpiringSoon) return { label: "Expiring", variant: "warning" };

  const allApproved = evidenceList.length > 0 && evidenceList.every((e) => e.status === "approved");
  if (allApproved) return { label: `${count} OK`, variant: "success" };

  return { label: `${count} items`, variant: "neutral" };
}

function isPredefined(ctrl: Control) {
  return ctrl.controlRequirementAssignments && ctrl.controlRequirementAssignments.length > 0;
}

// ─── Controls List ────────────────────────────────────────────

export default function ControlsPage() {
  const router = useRouter();
  const [controls, setControls] = useState<Control[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState("");
  const [showNotApplicable, setShowNotApplicable] = useState(false);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);
  const [frameworkInstances, setFrameworkInstances] = useState<FrameworkInstance[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Control | null>(null);

  const fetchControls = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (frameworkFilter) params.frameworkId = frameworkFilter;
      if (showNotApplicable) params.includeNotApplicable = "true";
      const res = await apiClient.listControls(params);
      setControls(res.data.items);
      setTotal(res.data.total);
    } catch {
      setControls([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, categoryFilter, frameworkFilter, showNotApplicable]);

  useEffect(() => {
    fetchControls();
  }, [fetchControls]);

  useEffect(() => {
    apiClient
      .listMembers()
      .then((r) => setMembers(r.data))
      .catch(() => {});
    apiClient
      .listFrameworkInstances()
      .then((r) => {
        setFrameworkInstances(r.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = frameworkFilter ? { frameworkId: frameworkFilter } : undefined;
    apiClient
      .getControlCategories(params)
      .then((r) => {
        setCategoryOptions(r.data.map((c: string) => ({ value: c, label: c })));
      })
      .catch(() => {});
  }, [frameworkFilter]);

  const visibleCategoryOptions = useMemo(() => {
    if (categoryFilter && !categoryOptions.some((o) => o.value === categoryFilter)) {
      return [{ value: categoryFilter, label: categoryFilter }, ...categoryOptions];
    }
    return categoryOptions;
  }, [categoryOptions, categoryFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Controls</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Manage security controls and their implementation status
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Add Control</Button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-72">
          <Input
            id="search"
            placeholder="Search controls…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-52">
          <Select
            id="status-filter"
            options={STATUS_FILTER_OPTIONS}
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-64">
          <Select
            id="category-filter"
            options={visibleCategoryOptions}
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
            id="framework-filter"
            options={frameworkInstances
              .filter((fi) => fi.isEnabled)
              .map((fi) => ({ value: fi.framework.id, label: fi.framework.name }))}
            placeholder="All frameworks"
            value={frameworkFilter}
            onChange={(e) => {
              setFrameworkFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {(search || statusFilter || categoryFilter || frameworkFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setCategoryFilter("");
              setFrameworkFilter("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
        <label className="ml-auto flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <input
            type="checkbox"
            checked={showNotApplicable}
            onChange={(e) => {
              setShowNotApplicable(e.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
          />
          Show N/A
        </label>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {total} control{total !== 1 ? "s" : ""}
        </span>
      </div>

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
        ) : controls.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">
              {search || statusFilter || categoryFilter || frameworkFilter
                ? "No controls match your filters."
                : "No controls yet. Create your first control to get started."}
            </p>
            {!search && !statusFilter && !categoryFilter && !frameworkFilter && (
              <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
                Add Control
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Control</TableHeader>
                <TableHeader className="w-40">Status</TableHeader>
                <TableHeader className="w-28">Evidence</TableHeader>
                <TableHeader>Frameworks</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Owner</TableHeader>
                <TableHeader className="w-20" />
              </TableRow>
            </TableHead>
            <TableBody>
              {controls.map((ctrl) => {
                const fwBadges = getFrameworkBadges(ctrl);
                const evBadge = getEvidenceHealthBadge(ctrl);
                const maturityChip = getMaturityChip(ctrl);
                return (
                  <TableRow
                    key={ctrl.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/controls/${ctrl.id}`)}
                  >
                    <TableCell>
                      <span className="font-medium">{ctrl.title}</span>
                      {ctrl.description && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-500">
                          {ctrl.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[ctrl.status].variant}>
                        {STATUS_BADGE[ctrl.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={evBadge.variant}>{evBadge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {fwBadges.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {fwBadges.map((b) => (
                            <Badge key={b.type} variant={b.variant}>
                              {b.label}
                            </Badge>
                          ))}
                          {maturityChip && (
                            <Badge variant="neutral" title="Maturity level">
                              {maturityChip}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>{ctrl.category || "—"}</TableCell>
                    <TableCell>{ctrl.owner?.name || "Unassigned"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {!isPredefined(ctrl) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                            onClick={() => setDeleteTarget(ctrl)}
                          >
                            Delete
                          </Button>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

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

      {/* Create modal — kept for quick creation from the list */}
      <CreateControlModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        members={members}
        categoryOptions={categoryOptions}
        onCreated={(id) => {
          setCreateOpen(false);
          router.push(`/controls/${id}`);
        }}
      />

      <DeleteConfirmModal
        control={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          setDeleteTarget(null);
          fetchControls();
        }}
      />
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────

function CreateControlModal({
  open,
  onClose,
  members,
  categoryOptions,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  members: OrgMember[];
  categoryOptions: { value: string; label: string }[];
  onCreated: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ControlStatus>("not_implemented");
  const [category, setCategory] = useState("");
  const [ownerId, setOwnerId] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setStatus("not_implemented");
      setCategory("");
      setOwnerId("");
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
    const payload: CreateControlInput = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      category: category || null,
      ownerId: ownerId || null,
    };
    try {
      const res = await apiClient.createControl(payload);
      onCreated(res.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create control");
    } finally {
      setSaving(false);
    }
  }

  const memberOptions = members.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Control"
      description="Add a new security control. You can configure details and framework mappings on the next page."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <Input
          id="title"
          label="Title *"
          placeholder="e.g. Access Control Policy"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          id="description"
          label="Description"
          placeholder="Brief description…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            id="status"
            label="Status"
            options={ALL_STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value as ControlStatus)}
          />
          <Select
            id="category"
            label="Category"
            options={categoryOptions}
            placeholder="Select a category…"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <Select
          id="owner"
          label="Owner"
          options={memberOptions}
          placeholder="Select an owner…"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
        />
        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Create & Configure
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────

function DeleteConfirmModal({
  control,
  onClose,
  onDeleted,
}: {
  control: Control | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!control) return null;

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await apiClient.deleteControl(control!.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete control");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal open={!!control} onClose={onClose} title="Delete Control" size="sm">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Are you sure you want to delete{" "}
          <strong className="text-neutral-900 dark:text-white">{control.title}</strong>? This action
          cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
