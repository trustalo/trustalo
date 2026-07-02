"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  type AssetClassification,
  type AssetCriticality,
  type AssetItem,
  type AssetKind,
  type AssetMetadata,
  type AssetStatus,
  type AssetType,
  type AssetStats,
  type AssetsFromTextResult,
  type OrgMember,
} from "@/lib/api-client";

const ASSET_KIND_OPTIONS = [
  { value: "physical", label: "Physical" },
  { value: "virtual", label: "Virtual" },
];

const VIEW_OPTIONS = [
  { value: "active", label: "Active Assets" },
  { value: "deleted", label: "Deleted Assets" },
  { value: "all", label: "All Assets" },
];

const ASSET_TYPE_OPTIONS = [
  { value: "hardware", label: "Hardware" },
  { value: "software", label: "Software" },
  { value: "data", label: "Data" },
  { value: "service", label: "Service" },
  { value: "personnel", label: "Personnel" },
  { value: "facility", label: "Facility" },
  { value: "cloud_resource", label: "Cloud Resource" },
];

const CLASSIFICATION_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "internal", label: "Internal" },
  { value: "confidential", label: "Confidential" },
  { value: "restricted", label: "Restricted" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "under_review", label: "Under Review" },
  { value: "decommissioned", label: "Decommissioned" },
];

const CRITICALITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const CATEGORY_BY_KIND: Record<AssetKind, string[]> = {
  physical: [
    "Laptop",
    "Desktop",
    "Printer",
    "Server",
    "Network Device",
    "Office Site",
    "Badge / Keycard",
    "Other",
  ],
  virtual: [
    "SaaS",
    "Database",
    "Cloud Workload",
    "API",
    "Data Store",
    "Identity System",
    "Backup",
    "Other",
  ],
};

const TYPE_TO_KIND: Record<AssetType, AssetKind> = {
  hardware: "physical",
  personnel: "physical",
  facility: "physical",
  software: "virtual",
  data: "virtual",
  service: "virtual",
  cloud_resource: "virtual",
};

const STATUS_BADGE: Record<AssetStatus, { variant: BadgeVariant; label: string }> = {
  active: { variant: "success", label: "Active" },
  under_review: { variant: "warning", label: "Under Review" },
  decommissioned: { variant: "neutral", label: "Decommissioned" },
};

const CLASS_BADGE: Record<AssetClassification, { variant: BadgeVariant; label: string }> = {
  public: { variant: "success", label: "Public" },
  internal: { variant: "info", label: "Internal" },
  confidential: { variant: "warning", label: "Confidential" },
  restricted: { variant: "danger", label: "Restricted" },
};

const CRITICALITY_BADGE: Record<AssetCriticality, { variant: BadgeVariant; label: string }> = {
  low: { variant: "success", label: "Low" },
  medium: { variant: "info", label: "Medium" },
  high: { variant: "warning", label: "High" },
  critical: { variant: "danger", label: "Critical" },
};

function formatType(type: AssetType): string {
  return type.replace("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function getDeletedAt(asset: AssetItem): string | null {
  return asset.deletedAt;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("");
  const [viewMode, setViewMode] = useState("active");

  const [createOpen, setCreateOpen] = useState(false);
  const [classifyOpen, setClassifyOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AssetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssetItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringAssetId, setRestoringAssetId] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (kindFilter) params.kind = kindFilter;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (classificationFilter) params.classification = classificationFilter;
      if (viewMode === "all") params.includeDeleted = "true";
      if (viewMode === "deleted") params.deletedOnly = "true";
      const res = await apiClient.listAssets(params);
      setAssets(res.data.items);
      setTotal(res.data.total);
    } catch {
      setAssets([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, kindFilter, typeFilter, statusFilter, classificationFilter, viewMode]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.getAssetStats();
      setStats(res.data);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  useEffect(() => {
    fetchStats();
    apiClient
      .listMembers()
      .then((res) => setMembers(res.data))
      .catch(() => setMembers([]));
  }, [fetchStats]);

  const totalPages = Math.ceil(total / limit);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.deleteAsset(deleteTarget.id);
      setDeleteTarget(null);
      fetchAssets();
      fetchStats();
    } catch {
      /* no-op */
    } finally {
      setDeleting(false);
    }
  }

  async function handleRestore(asset: AssetItem) {
    setRestoringAssetId(asset.id);
    try {
      await apiClient.restoreAsset(asset.id);
      fetchAssets();
      fetchStats();
    } finally {
      setRestoringAssetId(null);
    }
  }

  const hasFilters =
    search ||
    kindFilter ||
    typeFilter ||
    statusFilter ||
    classificationFilter ||
    viewMode !== "active";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Assets</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Inventory and classify physical and virtual assets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Managed endpoints are Computer-category assets; their posture lives here under Assets. */}
          <Link
            href="/devices"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 17h4.5M5 3h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8 21h8"
              />
            </svg>
            Device posture
          </Link>
          <Button variant="secondary" onClick={() => setClassifyOpen(true)}>
            <svg
              className="mr-1.5 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
              />
            </svg>
            Classify from text
          </Button>
          <Button onClick={() => setCreateOpen(true)}>Add Asset</Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.total}</p>
              <p className="text-xs text-neutral-500">Total Assets</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.physical}</p>
              <p className="text-xs text-neutral-500">Physical</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-violet-600">{stats.virtual}</p>
              <p className="text-xs text-neutral-500">Virtual</p>
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
              <p className="text-2xl font-bold text-neutral-600">{stats.deleted || 0}</p>
              <p className="text-xs text-neutral-500">Deleted</p>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-52">
          <Select
            id="view-mode"
            options={VIEW_OPTIONS}
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-72">
          <Input
            id="asset-search"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Select
            id="kind-filter"
            options={ASSET_KIND_OPTIONS}
            placeholder="All kinds"
            value={kindFilter}
            onChange={(e) => {
              setKindFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            id="type-filter"
            options={ASSET_TYPE_OPTIONS}
            placeholder="All types"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            id="status-filter"
            options={STATUS_OPTIONS}
            placeholder="All status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            id="classification-filter"
            options={CLASSIFICATION_OPTIONS}
            placeholder="All classifications"
            value={classificationFilter}
            onChange={(e) => {
              setClassificationFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setKindFilter("");
              setTypeFilter("");
              setStatusFilter("");
              setClassificationFilter("");
              setViewMode("active");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
        <span className="ml-auto text-sm text-neutral-500 dark:text-neutral-400">
          {total} asset{total !== 1 ? "s" : ""}
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
        ) : assets.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">
              {hasFilters
                ? "No assets match your filters."
                : "No assets yet. Add your first asset to get started."}
            </p>
            {!hasFilters && (
              <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
                Add Asset
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Asset</TableHeader>
                <TableHeader>Kind</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Criticality</TableHeader>
                <TableHeader>Classification</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Deleted</TableHeader>
                <TableHeader>Owner</TableHeader>
                <TableHeader>Location</TableHeader>
                <TableHeader className="w-20" />
              </TableRow>
            </TableHead>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  {(() => {
                    const deletedAt = getDeletedAt(asset);
                    const isDeleted = deletedAt !== null;
                    return (
                      <>
                        <TableCell>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">
                              {asset.name}
                            </p>
                            {asset.metadata?.category && (
                              <p className="text-xs text-neutral-500">{asset.metadata.category}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={TYPE_TO_KIND[asset.type] === "physical" ? "info" : "neutral"}
                          >
                            {TYPE_TO_KIND[asset.type] === "physical" ? "Physical" : "Virtual"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatType(asset.type)}</TableCell>
                        <TableCell>
                          {asset.metadata?.criticality ? (
                            <Badge variant={CRITICALITY_BADGE[asset.metadata.criticality].variant}>
                              {CRITICALITY_BADGE[asset.metadata.criticality].label}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={CLASS_BADGE[asset.classification].variant}>
                            {CLASS_BADGE[asset.classification].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_BADGE[asset.status].variant}>
                            {STATUS_BADGE[asset.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-neutral-500">
                          {deletedAt ? new Date(deletedAt).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-neutral-500">
                          {asset.owner?.name || "Unassigned"}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-neutral-500">
                          {asset.location || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {!isDeleted && (
                              <>
                                <button
                                  className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                                  title="Edit"
                                  onClick={() => setEditTarget(asset)}
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
                                  onClick={() => setDeleteTarget(asset)}
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
                              </>
                            )}
                            {isDeleted && (
                              <Button
                                size="sm"
                                variant="secondary"
                                loading={restoringAssetId === asset.id}
                                onClick={() => handleRestore(asset)}
                              >
                                Restore
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </>
                    );
                  })()}
                </TableRow>
              ))}
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

      <AssetFormModal
        open={createOpen}
        members={members}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          fetchAssets();
          fetchStats();
        }}
      />

      <ClassifyFromTextModal
        open={classifyOpen}
        onClose={() => setClassifyOpen(false)}
        onCreated={() => {
          fetchAssets();
          fetchStats();
        }}
      />

      {editTarget && (
        <AssetFormModal
          open
          members={members}
          asset={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            fetchAssets();
            fetchStats();
          }}
        />
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Asset">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          <strong>{deleteTarget?.name}</strong> will be marked as deleted and hidden from the
          default assets view. You can restore it later from the deleted assets view.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Mark as Deleted
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AssetFormModal({
  open,
  asset,
  members,
  onClose,
  onSaved,
}: {
  open: boolean;
  asset?: AssetItem;
  members: OrgMember[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!asset;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType>("hardware");
  const [classification, setClassification] = useState<AssetClassification>("internal");
  const [status, setStatus] = useState<AssetStatus>("active");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [category, setCategory] = useState("");
  const [model, setModel] = useState("");
  const [vendor, setVendor] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [cloudProvider, setCloudProvider] = useState("");
  const [accountId, setAccountId] = useState("");
  const [environment, setEnvironment] = useState("");
  const [hostname, setHostname] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyExpiresAt, setWarrantyExpiresAt] = useState("");
  const [criticality, setCriticality] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const assetKind = useMemo<AssetKind>(() => TYPE_TO_KIND[type], [type]);

  useEffect(() => {
    if (!open) return;

    const metadata = asset?.metadata ?? null;
    setName(asset?.name ?? "");
    setType(asset?.type ?? "hardware");
    setClassification(asset?.classification ?? "internal");
    setStatus(asset?.status ?? "active");
    setDescription(asset?.description ?? "");
    setLocation(asset?.location ?? "");
    setOwnerId(asset?.ownerId ?? "");
    setCategory(metadata?.category ?? "");
    setModel(metadata?.model ?? "");
    setVendor(metadata?.vendor ?? "");
    setSerialNumber(metadata?.serialNumber ?? "");
    setAssignedTo(metadata?.assignedTo ?? "");
    setCloudProvider(metadata?.cloudProvider ?? "");
    setAccountId(metadata?.accountId ?? "");
    setEnvironment(metadata?.environment ?? "");
    setHostname(metadata?.hostname ?? "");
    setIpAddress(metadata?.ipAddress ?? "");
    setPurchaseDate(metadata?.purchaseDate ?? "");
    setWarrantyExpiresAt(metadata?.warrantyExpiresAt ?? "");
    setCriticality(metadata?.criticality ?? "");
    setTagsInput((metadata?.tags ?? []).join(", "));
    setError(null);
  }, [open, asset]);

  const ownerOptions = useMemo(
    () => members.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` })),
    [members],
  );
  const categoryOptions = useMemo(
    () => CATEGORY_BY_KIND[assetKind].map((value) => ({ value, label: value })),
    [assetKind],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Asset name is required");
      return;
    }

    setSaving(true);
    setError(null);

    const metadata: AssetMetadata = {
      category: category || undefined,
      model: model || undefined,
      vendor: vendor || undefined,
      serialNumber: serialNumber || undefined,
      assignedTo: assignedTo || undefined,
      cloudProvider: cloudProvider || undefined,
      accountId: accountId || undefined,
      environment: environment || undefined,
      hostname: hostname || undefined,
      ipAddress: ipAddress || undefined,
      purchaseDate: purchaseDate || undefined,
      warrantyExpiresAt: warrantyExpiresAt || undefined,
      criticality: (criticality || undefined) as AssetCriticality | undefined,
      tags: tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      if (isEdit && asset) {
        await apiClient.updateAsset(asset.id, {
          name: name.trim(),
          type,
          classification,
          status,
          description: description || undefined,
          location: location || undefined,
          ownerId: ownerId || null,
          metadata,
        });
      } else {
        await apiClient.createAsset({
          name: name.trim(),
          type,
          classification,
          description: description || undefined,
          location: location || undefined,
          ownerId: ownerId || null,
          metadata,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save asset");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Asset" : "Add New Asset"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Core Details
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="asset-name"
              label="Asset Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Select
              id="asset-type"
              label="Asset Type"
              options={ASSET_TYPE_OPTIONS}
              value={type}
              onChange={(e) => setType(e.target.value as AssetType)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="asset-kind"
              label="Asset Kind"
              value={assetKind === "physical" ? "Physical" : "Virtual"}
              disabled
            />
            <Select
              id="asset-category"
              label="Category"
              options={categoryOptions}
              placeholder={
                assetKind === "physical" ? "e.g. Laptop, Printer..." : "e.g. SaaS, Database..."
              }
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <Textarea
            id="asset-description"
            label="Description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="asset-location"
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Select
              id="asset-owner"
              label="Owner"
              options={ownerOptions}
              placeholder="Unassigned"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Risk Context
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              id="asset-classification"
              label="Classification"
              options={CLASSIFICATION_OPTIONS}
              value={classification}
              onChange={(e) => setClassification(e.target.value as AssetClassification)}
            />
            <Select
              id="asset-criticality"
              label="Criticality"
              options={CRITICALITY_OPTIONS}
              placeholder="Select..."
              value={criticality}
              onChange={(e) => setCriticality(e.target.value)}
            />
            {isEdit ? (
              <Select
                id="asset-status"
                label="Status"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(e) => setStatus(e.target.value as AssetStatus)}
              />
            ) : (
              <Input id="asset-status" label="Status" value="Active" disabled />
            )}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {assetKind === "physical" ? "Physical Inventory" : "Virtual Inventory"}
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="asset-model"
              label="Model / Product"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
            <Input
              id="asset-vendor"
              label="Vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>

          {assetKind === "physical" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                id="asset-serial"
                label="Serial Number"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
              <Input
                id="asset-assigned"
                label="Assigned To"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
              <Input
                id="asset-purchase"
                type="date"
                label="Purchase Date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
              <Input
                id="asset-warranty"
                type="date"
                label="Warranty Expires"
                value={warrantyExpiresAt}
                onChange={(e) => setWarrantyExpiresAt(e.target.value)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                id="asset-cloud-provider"
                label="Cloud Provider"
                value={cloudProvider}
                onChange={(e) => setCloudProvider(e.target.value)}
              />
              <Input
                id="asset-account-id"
                label="Account / Tenant ID"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
              <Input
                id="asset-environment"
                label="Environment"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
              />
              <Input
                id="asset-hostname"
                label="Hostname / Service Name"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
              />
              <Input
                id="asset-ip"
                label="IP / Endpoint"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
            </div>
          )}
          <Input
            id="asset-tags"
            label="Tags"
            placeholder="comma,separated,tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </fieldset>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? "Save Changes" : "Add Asset"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ClassifyFromTextModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [text, setText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<AssetsFromTextResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setText("");
    setResult(null);
    setSelected(new Set());
    setError(null);
  }, [open]);

  const redactionTotal = useMemo(() => {
    if (!result) return 0;
    return Object.values(result.redactions).reduce((sum, n) => sum + n, 0);
  }, [result]);

  async function handleExtract() {
    const trimmed = text.trim();
    if (trimmed.length < 20) {
      setError("Paste at least a couple of sentences describing your systems.");
      return;
    }
    setExtracting(true);
    setError(null);
    try {
      const res = await apiClient.classifyAssetsFromText({ text: trimmed });
      setResult(res.data);
      setSelected(new Set(res.data.proposals.map((_, i) => i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  }

  function toggleSelected(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function handleCreate() {
    if (!result || selected.size === 0) return;
    setCreating(true);
    setError(null);
    try {
      // Apply step is the normal authenticated asset-create call — the
      // AI endpoint only ever stages proposals.
      for (const index of Array.from(selected).sort((a, b) => a - b)) {
        const proposal = result.proposals[index];
        if (!proposal) continue;
        await apiClient.createAsset(proposal.suggestedAsset);
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assets");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Classify Assets from Text" size="lg">
      <div className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {!result ? (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Paste architecture notes, a data-flow description, or a system runbook. AI will
              propose information assets with sensitivity and criticality tiers. Suggestions are
              advisory — nothing is created until you choose.
            </p>
            <Textarea
              id="classify-text"
              label="Source text"
              rows={8}
              placeholder="e.g. Customer records live in a Postgres cluster on AWS. The mobile banking app talks to it through our API gateway..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Emails, phone numbers and IP addresses are redacted before the text reaches the AI
              provider.
            </p>
            <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <Button variant="secondary" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                loading={extracting}
                disabled={text.trim().length < 20}
                onClick={handleExtract}
              >
                Extract Assets
              </Button>
            </div>
          </>
        ) : result.proposals.length === 0 ? (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              No information assets were found in that text. Try pasting a more detailed description
              of your systems and data stores.
            </p>
            <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <Button variant="secondary" type="button" onClick={onClose}>
                Close
              </Button>
              <Button type="button" onClick={() => setResult(null)}>
                Try Different Text
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {result.proposals.length} proposed asset{result.proposals.length !== 1 ? "s" : ""}{" "}
              found. Select the ones to add to the register.
              {redactionTotal > 0 &&
                ` ${redactionTotal} item${redactionTotal !== 1 ? "s were" : " was"} redacted before the text reached the AI provider.`}
            </p>
            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {result.proposals.map((item, index) => (
                <li key={index}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 px-4 py-3 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                      checked={selected.has(index)}
                      onChange={() => toggleSelected(index)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {item.proposal.name}
                        </span>
                        <Badge variant={CLASS_BADGE[item.suggestedAsset.classification].variant}>
                          {CLASS_BADGE[item.suggestedAsset.classification].label}
                        </Badge>
                        <Badge
                          variant={
                            CRITICALITY_BADGE[item.suggestedAsset.metadata.criticality].variant
                          }
                        >
                          {CRITICALITY_BADGE[item.suggestedAsset.metadata.criticality].label}
                        </Badge>
                        <span className="text-xs text-neutral-500">
                          {formatType(item.suggestedAsset.type)} ·{" "}
                          {Math.round(item.proposal.confidence * 100)}% confidence
                        </span>
                      </div>
                      {item.proposal.description && (
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                          {item.proposal.description}
                        </p>
                      )}
                      {item.proposal.rationale && (
                        <p className="mt-1 text-xs italic text-neutral-500 dark:text-neutral-400">
                          {item.proposal.rationale}
                        </p>
                      )}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <Button variant="ghost" type="button" onClick={() => setResult(null)}>
                Back
              </Button>
              <Button variant="secondary" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                loading={creating}
                disabled={selected.size === 0}
                onClick={handleCreate}
              >
                Create {selected.size} Asset{selected.size !== 1 ? "s" : ""}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
