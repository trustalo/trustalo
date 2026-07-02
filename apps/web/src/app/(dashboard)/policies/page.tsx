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
  type PolicyListItem,
  type PolicyStatus,
  type CreatePolicyInput,
  type OrgMember,
  type PolicyTemplateListItem,
  type PolicyFrameworkCode,
} from "@/lib/api-client";

const TEMPLATE_FRAMEWORK_FILTER: { value: string; label: string }[] = [
  { value: "", label: "All frameworks" },
  { value: "iso27001", label: "ISO 27001" },
  { value: "iso27017", label: "ISO 27017 (cloud)" },
  { value: "iso27018", label: "ISO 27018 (PII in cloud)" },
  { value: "iso22301", label: "ISO 22301 (BC)" },
  { value: "iso42001", label: "ISO 42001 (AI)" },
  { value: "soc2", label: "SOC 2" },
  { value: "essential8", label: "Essential Eight (AU)" },
  { value: "nist_csf_2", label: "NIST CSF 2.0" },
  { value: "gdpr", label: "GDPR" },
  { value: "cps234", label: "APRA CPS 234 (AU)" },
  { value: "hipaa", label: "HIPAA (US)" },
  { value: "pci_dss_4", label: "PCI DSS 4.0" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const CATEGORY_OPTIONS = [
  { value: "Governance", label: "Governance" },
  { value: "HR & Conduct", label: "HR & Conduct" },
  { value: "Data Protection", label: "Data Protection" },
  { value: "Identity & Access", label: "Identity & Access" },
  { value: "Operations", label: "Operations" },
  { value: "Network Security", label: "Network Security" },
  { value: "Physical Security", label: "Physical Security" },
  { value: "Incident Response", label: "Incident Response" },
  { value: "Business Continuity", label: "Business Continuity" },
  { value: "Risk Management", label: "Risk Management" },
  { value: "Compliance", label: "Compliance" },
  { value: "Vendor Management", label: "Vendor Management" },
  { value: "Asset Management", label: "Asset Management" },
  { value: "Change Management", label: "Change Management" },
  { value: "Privacy", label: "Privacy" },
  { value: "Cloud Security", label: "Cloud Security" },
  { value: "AI & Automation", label: "AI & Automation" },
  { value: "Training & Awareness", label: "Training & Awareness" },
];

const STATUS_BADGE: Record<PolicyStatus, { variant: BadgeVariant; label: string }> = {
  draft: { variant: "neutral", label: "Draft" },
  pending_approval: { variant: "warning", label: "Pending Approval" },
  approved: { variant: "info", label: "Approved" },
  published: { variant: "success", label: "Published" },
  archived: { variant: "neutral", label: "Archived" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renewalIndicator(
  renewalDate: string | null,
): { label: string; variant: BadgeVariant } | null {
  if (!renewalDate) return null;
  const days = Math.ceil((new Date(renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `Overdue ${Math.abs(days)}d`, variant: "danger" };
  if (days <= 30) return { label: `Due in ${days}d`, variant: "warning" };
  return null;
}

// ─── Policies List ────────────────────────────────────────────

export default function PoliciesPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<PolicyListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [members, setMembers] = useState<OrgMember[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PolicyListItem | null>(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const res = await apiClient.listPolicies(params);
      setPolicies(res.data.items);
      setTotal(res.data.total);
    } catch {
      setPolicies([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  useEffect(() => {
    apiClient
      .listMembers()
      .then((r) => setMembers(r.data))
      .catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Policies</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Manage organizational security and compliance policies
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Create Policy</Button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-72">
          <Input
            id="search"
            placeholder="Search policies…"
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
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-52">
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
          {total} polic{total !== 1 ? "ies" : "y"}
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
        ) : policies.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">
              {search || statusFilter || categoryFilter
                ? "No policies match your filters."
                : "No policies yet. Create your first policy to get started."}
            </p>
            {!search && !statusFilter && !categoryFilter && (
              <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
                Create Policy
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Policy</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Owner</TableHeader>
                <TableHeader>Controls</TableHeader>
                <TableHeader>Versions</TableHeader>
                <TableHeader>Renewal</TableHeader>
                <TableHeader className="w-20" />
              </TableRow>
            </TableHead>
            <TableBody>
              {policies.map((policy) => {
                const renewal = renewalIndicator(policy.renewalDate);
                return (
                  <TableRow
                    key={policy.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/policies/${policy.id}`)}
                  >
                    <TableCell>
                      <span className="font-medium">{policy.title}</span>
                      {policy.description && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-500">
                          {policy.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[policy.status].variant}>
                        {STATUS_BADGE[policy.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{policy.category || "—"}</TableCell>
                    <TableCell>{policy.owner?.name || "Unassigned"}</TableCell>
                    <TableCell>
                      <span className="text-sm">{policy._count.policyControls}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">v{policy._count.versions || 0}</span>
                    </TableCell>
                    <TableCell>
                      {renewal ? (
                        <Badge variant={renewal.variant}>{renewal.label}</Badge>
                      ) : (
                        <span className="text-sm text-neutral-500">
                          {formatDate(policy.renewalDate)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-blue-600 dark:hover:bg-neutral-800 dark:hover:text-blue-400"
                        title="View policy"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/policies/${policy.id}`);
                        }}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                          <path
                            fillRule="evenodd"
                            d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
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

      <CreatePolicyModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        members={members}
        onCreated={(id) => {
          setCreateOpen(false);
          router.push(`/policies/${id}`);
        }}
      />

      <DeleteConfirmModal
        policy={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={() => {
          setDeleteTarget(null);
          fetchPolicies();
        }}
      />
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────

function CreatePolicyModal({
  open,
  onClose,
  members,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  members: OrgMember[];
  onCreated: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [templates, setTemplates] = useState<PolicyTemplateListItem[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [frameworkFilter, setFrameworkFilter] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setCategory("");
      setOwnerId("");
      setRenewalDate("");
      setError(null);
      setFrameworkFilter("");
      setSelectedTemplateId("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setTemplatesLoading(true);
    const params =
      frameworkFilter && frameworkFilter.length > 0
        ? { framework: frameworkFilter as PolicyFrameworkCode }
        : undefined;
    apiClient
      .listPolicyTemplates(params)
      .then((r) => setTemplates(r.data))
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false));
  }, [open, frameworkFilter]);

  function applyTemplateSelection(id: string) {
    setSelectedTemplateId(id);
    if (!id) return;
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setTitle(t.title);
    if (t.category) setCategory(t.category);
    setDescription(t.shortDescription || "");
  }

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
    const payload: CreatePolicyInput = {
      title: title.trim(),
      ownerId,
      description: description.trim() || undefined,
      category: category || undefined,
      renewalDate: renewalDate || undefined,
      ...(selectedTemplateId ? { templateId: selectedTemplateId } : {}),
    };
    try {
      const res = await apiClient.createPolicy(payload);
      onCreated(res.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create policy");
    } finally {
      setSaving(false);
    }
  }

  const memberOptions = members.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.email})`,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Policy"
      description="Start from a library template with clear placeholders, or create an empty policy and author from scratch on the detail page."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Policy template library
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              id="template-framework-filter"
              label="Filter by framework"
              options={TEMPLATE_FRAMEWORK_FILTER}
              placeholder="All frameworks"
              value={frameworkFilter}
              onChange={(e) => {
                setFrameworkFilter(e.target.value);
                setSelectedTemplateId("");
              }}
            />
            <Select
              id="policy-template"
              label="Template"
              options={[
                { value: "", label: templatesLoading ? "Loading…" : "No template (blank policy)" },
                ...templates.map((t) => ({
                  value: t.id,
                  label:
                    t.frameworkTypes.length === 0
                      ? `${t.title} (all frameworks)`
                      : `${t.title} (${t.frameworkTypes.join(", ")})`,
                })),
              ]}
              placeholder="Choose a template…"
              value={selectedTemplateId}
              onChange={(e) => applyTemplateSelection(e.target.value)}
            />
          </div>
          {selectedTemplateId && (
            <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
              Title, category, and description are filled from the template. You can edit them
              before creating. The editor will open with template content and{" "}
              <code className="rounded bg-neutral-200 px-1 dark:bg-neutral-700">
                [[PLACEHOLDERS]]
              </code>{" "}
              to replace.
            </p>
          )}
        </div>
        <Input
          id="title"
          label="Title *"
          placeholder="e.g. Information Security Policy"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          id="description"
          label="Description"
          placeholder="Brief description of this policy…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            id="category"
            label="Category"
            options={CATEGORY_OPTIONS}
            placeholder="Select a category…"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            id="renewalDate"
            label="Renewal Date"
            type="date"
            value={renewalDate}
            onChange={(e) => setRenewalDate(e.target.value)}
          />
        </div>
        <Select
          id="owner"
          label="Owner *"
          options={memberOptions}
          placeholder="Select a policy owner…"
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
  policy,
  onClose,
  onDeleted,
}: {
  policy: PolicyListItem | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!policy) return null;

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await apiClient.deletePolicy(policy!.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete policy");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal open={!!policy} onClose={onClose} title="Delete Policy" size="sm">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Are you sure you want to delete{" "}
          <strong className="text-neutral-900 dark:text-white">{policy.title}</strong>? This will
          also remove all versions, control mappings, and acknowledgments. This action cannot be
          undone.
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
