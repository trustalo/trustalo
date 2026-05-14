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
  type VendorItem,
  type VendorStats,
  type VendorRiskTier,
  type VendorStatus,
  type ResearchFrequency,
  type KnownVendorItem,
  type CreateVendorInput,
  type OrgMember,
} from "@/lib/api-client";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const RISK_TIER_OPTIONS = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "offboarded", label: "Offboarded" },
];

const CATEGORY_SUGGESTIONS = [
  "Cloud Infrastructure",
  "CRM",
  "Collaboration",
  "Identity & Access",
  "Observability",
  "Communications",
  "Payment Processing",
  "Data Analytics",
  "Security",
  "HR & People",
  "Developer Tools",
  "Marketing",
  "Legal & Compliance",
  "Customer Support",
  "Finance & Accounting",
  "AI & Machine Learning",
  "Other",
];

const RESEARCH_FREQUENCY_OPTIONS = [
  { value: "none", label: "No automatic research" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const RISK_BADGE: Record<VendorRiskTier, { variant: BadgeVariant; label: string }> = {
  critical: { variant: "danger", label: "Critical" },
  high: { variant: "warning", label: "High" },
  medium: { variant: "info", label: "Medium" },
  low: { variant: "success", label: "Low" },
};

const STATUS_BADGE: Record<VendorStatus, { variant: BadgeVariant; label: string }> = {
  active: { variant: "success", label: "Active" },
  under_review: { variant: "warning", label: "Under Review" },
  approved: { variant: "info", label: "Approved" },
  rejected: { variant: "danger", label: "Rejected" },
  offboarded: { variant: "neutral", label: "Offboarded" },
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

function isContractExpiringSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const end = new Date(dateStr);
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  return end >= now && end <= thirtyDays;
}

// ──────────────────────────────────────────────
// Vendors Page
// ──────────────────────────────────────────────

export default function VendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [riskTierFilter, setRiskTierFilter] = useState("");
  const [stats, setStats] = useState<VendorStats | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<VendorItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (riskTierFilter) params.riskTier = riskTierFilter;
      const res = await apiClient.listVendors(params);
      setVendors(res.data.items);
      setTotal(res.data.total);
    } catch {
      setVendors([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, riskTierFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.getVendorStats();
      setStats(res.data);
    } catch {
      /* stats are non-critical */
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalPages = Math.ceil(total / limit);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.deleteVendor(deleteTarget.id);
      setDeleteTarget(null);
      fetchVendors();
      fetchStats();
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  }

  function handleCreated() {
    setCreateOpen(false);
    fetchVendors();
    fetchStats();
  }

  function handleUpdated() {
    setEditVendor(null);
    fetchVendors();
    fetchStats();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Vendors</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Manage third-party vendor risk and compliance
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Add Vendor</Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total}</p>
              <p className="text-xs text-neutral-500">Total Vendors</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.byStatus.active || 0}</p>
              <p className="text-xs text-neutral-500">Active</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {(stats.byRiskTier.critical || 0) + (stats.byRiskTier.high || 0)}
              </p>
              <p className="text-xs text-neutral-500">High / Critical Risk</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.dataProcessingCount}</p>
              <p className="text-xs text-neutral-500">Data Processors</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-500">{stats.contractsExpiringSoon}</p>
              <p className="text-xs text-neutral-500">Contracts Expiring</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-72">
          <Input
            id="search"
            placeholder="Search vendors..."
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
            id="risk-filter"
            options={RISK_TIER_OPTIONS}
            placeholder="All risk tiers"
            value={riskTierFilter}
            onChange={(e) => {
              setRiskTierFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {(search || statusFilter || riskTierFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setRiskTierFilter("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
        <span className="ml-auto text-sm text-neutral-500 dark:text-neutral-400">
          {total} vendor{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
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
        ) : vendors.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">
              {search || statusFilter || riskTierFilter
                ? "No vendors match your filters."
                : "No vendors yet. Add your first vendor to get started."}
            </p>
            {!search && !statusFilter && !riskTierFilter && (
              <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
                Add Vendor
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Vendor</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Risk Tier</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Data Processing</TableHeader>
                <TableHeader>Contract End</TableHeader>
                <TableHeader className="w-20" />
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow
                  key={vendor.id}
                  className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  onClick={() => router.push(`/vendors/${vendor.id}`)}
                >
                  <TableCell>
                    <div>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {vendor.name}
                      </span>
                      {vendor.website && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-400">
                          {vendor.website.replace(/^https?:\/\//, "")}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{vendor.category || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={RISK_BADGE[vendor.riskTier].variant}>
                      {RISK_BADGE[vendor.riskTier].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[vendor.status].variant}>
                      {STATUS_BADGE[vendor.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {vendor.dataProcessing ? (
                      <span className="text-red-600 dark:text-red-400">Yes</span>
                    ) : (
                      "No"
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        isContractExpiringSoon(vendor.contractEndDate)
                          ? "font-medium text-amber-600 dark:text-amber-400"
                          : "text-neutral-500"
                      }
                    >
                      {formatDate(vendor.contractEndDate)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                        title="Edit"
                        onClick={() => setEditVendor(vendor)}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                        title="Delete"
                        onClick={() => setDeleteTarget(vendor)}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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

      {/* Create Modal */}
      <VendorFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={handleCreated}
      />

      {/* Edit Modal */}
      {editVendor && (
        <VendorFormModal
          open
          vendor={editVendor}
          onClose={() => setEditVendor(null)}
          onSaved={handleUpdated}
        />
      )}

      {/* Delete Confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Vendor">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will also
          remove all associated contacts and assessments. This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Delete Vendor
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ──────────────────────────────────────────────
// Known Vendor Search (typeahead)
// ──────────────────────────────────────────────

function KnownVendorSearch({
  onSelect,
  selectedId,
  onClear,
}: {
  onSelect: (vendor: KnownVendorItem) => void;
  selectedId: string | null;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnownVendorItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<KnownVendorItem | null>(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.searchKnownVendors(query, 10);
        setResults(res.data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (selectedId && selected) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950">
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{selected.name}</p>
          {selected.category && (
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {selected.category}
              {selected.overallScore != null && ` · Score: ${selected.overallScore}/100`}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            setQuery("");
            onClear();
          }}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        id="known-vendor-search"
        label="Select from Known Vendors"
        placeholder="Search known vendors (e.g. AWS, Stripe, Okta)..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && (results.length > 0 || searching) && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          {searching && <div className="px-4 py-3 text-sm text-neutral-500">Searching...</div>}
          {results.map((kv) => (
            <button
              key={kv.id}
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
              onClick={() => {
                setSelected(kv);
                setOpen(false);
                setQuery("");
                onSelect(kv);
              }}
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-white">{kv.name}</p>
                <p className="text-xs text-neutral-500">
                  {[kv.category, kv.headquarters].filter(Boolean).join(" · ")}
                </p>
              </div>
              {kv.overallScore != null && (
                <Badge
                  variant={
                    kv.overallScore >= 80 ? "success" : kv.overallScore >= 60 ? "warning" : "danger"
                  }
                >
                  {kv.overallScore}/100
                </Badge>
              )}
            </button>
          ))}
          {!searching && query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-neutral-500">
              No known vendors found. You can still add a custom vendor below.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Vendor Form Modal (Create + Edit)
// ──────────────────────────────────────────────

function VendorFormModal({
  open,
  vendor,
  onClose,
  onSaved,
}: {
  open: boolean;
  vendor?: VendorItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!vendor;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState("");
  const [riskTier, setRiskTier] = useState<VendorRiskTier>("medium");
  const [status, setStatus] = useState<VendorStatus>("active");
  const [dataProcessing, setDataProcessing] = useState(false);
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");
  const [knownVendorId, setKnownVendorId] = useState<string | null>(null);
  const [researchFrequency, setResearchFrequency] = useState<ResearchFrequency>("monthly");

  useEffect(() => {
    if (open) {
      setName(vendor?.name ?? "");
      setDescription(vendor?.description ?? "");
      setWebsite(vendor?.website ?? "");
      setCategory(vendor?.category ?? "");
      setRiskTier(vendor?.riskTier ?? "medium");
      setStatus(vendor?.status ?? "active");
      setDataProcessing(vendor?.dataProcessing ?? false);
      setKnownVendorId(vendor?.knownVendorId ?? null);
      setResearchFrequency(vendor?.researchFrequency ?? "monthly");
      setContractStartDate(
        vendor?.contractStartDate
          ? new Date(vendor.contractStartDate).toISOString().split("T")[0]
          : "",
      );
      setContractEndDate(
        vendor?.contractEndDate ? new Date(vendor.contractEndDate).toISOString().split("T")[0] : "",
      );
      setError(null);
    }
  }, [open, vendor]);

  function handleKnownVendorSelect(kv: KnownVendorItem) {
    setKnownVendorId(kv.id);
    setName(kv.name);
    if (kv.website) setWebsite(kv.website);
    if (kv.category) setCategory(kv.category);
    if (kv.description) setDescription(kv.description);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vendor name is required");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      if (isEdit) {
        await apiClient.updateVendor(vendor.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          website: website.trim() || undefined,
          category: category.trim() || undefined,
          riskTier,
          status,
          dataProcessing,
          researchFrequency,
          contractStartDate: contractStartDate || null,
          contractEndDate: contractEndDate || null,
        });
      } else if (knownVendorId) {
        await apiClient.createVendorFromKnown({
          knownVendorId,
          researchFrequency,
          riskTier,
          dataProcessing,
        });
      } else {
        await apiClient.createVendor({
          name: name.trim(),
          description: description.trim() || undefined,
          website: website.trim() || undefined,
          category: category.trim() || undefined,
          riskTier,
          dataProcessing,
          researchFrequency,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vendor");
    } finally {
      setSaving(false);
    }
  }

  const categoryOptions = CATEGORY_SUGGESTIONS.map((c) => ({
    value: c,
    label: c,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Vendor" : "Add New Vendor"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {!isEdit && (
          <>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
              <strong>Tip:</strong> Search the known vendor catalog to auto-fill details and reuse
              existing research, or add a custom vendor below. AI-powered deep research will run
              automatically after adding.
            </div>

            <KnownVendorSearch
              onSelect={handleKnownVendorSelect}
              selectedId={knownVendorId}
              onClear={() => {
                setKnownVendorId(null);
                setName("");
                setWebsite("");
                setCategory("");
                setDescription("");
              }}
            />

            {knownVendorId && (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
                Fields auto-filled from known vendor catalog. Existing research will be reused if
                recent; otherwise a fresh deep research will be triggered.
              </div>
            )}
          </>
        )}

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Vendor Information
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="vendor-name"
              label="Vendor Name *"
              placeholder="e.g. AWS, Salesforce, Stripe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={!!knownVendorId && !isEdit}
            />
            <Input
              id="vendor-website"
              label="Website"
              placeholder="e.g. https://aws.amazon.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <Textarea
            id="vendor-description"
            label="Description"
            placeholder="Brief description of the vendor and services used..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <Select
            id="vendor-category"
            label="Category"
            options={categoryOptions}
            placeholder="Select category..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Risk & Compliance
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              id="vendor-risk-tier"
              label="Risk Tier"
              options={RISK_TIER_OPTIONS}
              value={riskTier}
              onChange={(e) => setRiskTier(e.target.value as VendorRiskTier)}
            />
            {isEdit && (
              <Select
                id="vendor-status"
                label="Status"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(e) => setStatus(e.target.value as VendorStatus)}
              />
            )}
          </div>
          <label className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600"
              checked={dataProcessing}
              onChange={(e) => setDataProcessing(e.target.checked)}
            />
            This vendor processes personal or sensitive data
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Automated Research
          </legend>
          <Select
            id="vendor-research-frequency"
            label="Research Frequency"
            options={RESEARCH_FREQUENCY_OPTIONS}
            value={researchFrequency}
            onChange={(e) => setResearchFrequency(e.target.value as ResearchFrequency)}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            The collector will automatically perform deep vendor research at this interval. An
            initial research will be triggered immediately when the vendor is added.
          </p>
        </fieldset>

        {isEdit && (
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Contract
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                id="contract-start"
                label="Contract Start"
                type="date"
                value={contractStartDate}
                onChange={(e) => setContractStartDate(e.target.value)}
              />
              <Input
                id="contract-end"
                label="Contract End"
                type="date"
                value={contractEndDate}
                onChange={(e) => setContractEndDate(e.target.value)}
              />
            </div>
          </fieldset>
        )}

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? "Save Changes" : "Add Vendor"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
