"use client";

import { useCallback, useEffect, useState } from "react";
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
  type TrustCenterConfig,
  type TrustResource,
  type TrustResourceType,
  type TrustResourceGating,
  type TrustCenterSubprocessor,
  type TrustCenterAccessRequest,
  type AccessRequestStatus,
  type CreateTrustResourceMeta,
  type DpaStatus,
} from "@/lib/api-client";

const RESOURCE_TYPE_LABELS: Record<TrustResourceType, string> = {
  certificate: "Certificate",
  report: "Report",
  policy: "Policy",
  attestation: "Attestation",
};

const RESOURCE_TYPE_OPTIONS = Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const GATING_LABELS: Record<TrustResourceGating, string> = {
  public: "Public",
  contact_required: "Contact Info Required",
  nda_required: "NDA Required",
};

const GATING_OPTIONS = Object.entries(GATING_LABELS).map(([value, label]) => ({ value, label }));

const GATING_BADGE: Record<TrustResourceGating, { variant: BadgeVariant; label: string }> = {
  public: { variant: "success", label: "Public" },
  contact_required: { variant: "info", label: "Info Required" },
  nda_required: { variant: "warning", label: "NDA Required" },
};

const DPA_BADGE: Record<DpaStatus, { variant: BadgeVariant; label: string }> = {
  not_required: { variant: "neutral", label: "Not Required" },
  not_started: { variant: "neutral", label: "Not Started" },
  requested: { variant: "warning", label: "Requested" },
  received: { variant: "info", label: "Received" },
  approved: { variant: "success", label: "Approved" },
  expired: { variant: "danger", label: "Expired" },
};

const REQUEST_STATUS_BADGE: Record<AccessRequestStatus, { variant: BadgeVariant; label: string }> =
  {
    pending: { variant: "warning", label: "Pending" },
    approved: { variant: "success", label: "Approved" },
    rejected: { variant: "danger", label: "Rejected" },
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

export default function TrustCenterPage() {
  const [config, setConfig] = useState<TrustCenterConfig | null>(null);
  const [resources, setResources] = useState<TrustResource[]>([]);
  const [subprocessors, setSubprocessors] = useState<TrustCenterSubprocessor[]>([]);
  const [accessRequests, setAccessRequests] = useState<TrustCenterAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TrustResource | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [requestFilter, setRequestFilter] = useState<AccessRequestStatus | "all">("pending");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, resourcesRes, subRes, requestsRes] = await Promise.all([
        apiClient.getTrustCenterConfig(),
        apiClient.listTrustResources(),
        apiClient.getTrustCenterSubprocessors(),
        apiClient.listAccessRequests(),
      ]);
      setConfig(configRes.data);
      setResources(resourcesRes.data);
      setSubprocessors(subRes.data);
      setAccessRequests(requestsRes.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function handleToggle() {
    if (!config) return;
    setToggling(true);
    try {
      const res = await apiClient.updateTrustCenterConfig({
        isEnabled: !config.isEnabled,
      });
      setConfig(res.data);
    } catch {
      /* ignore */
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.deleteTrustResource(deleteTarget.id);
      setDeleteTarget(null);
      fetchAll();
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  }

  async function handleTogglePublic(resource: TrustResource) {
    try {
      await apiClient.updateTrustResource(resource.id, {
        isPublic: !resource.isPublic,
      });
      fetchAll();
    } catch {
      /* ignore */
    }
  }

  async function handleDownload(resource: TrustResource) {
    try {
      const res = await apiClient.getTrustResourceDownloadUrl(resource.id);
      window.open(res.data.url, "_blank");
    } catch {
      /* ignore */
    }
  }

  async function handleApprove(requestId: string) {
    try {
      await apiClient.approveAccessRequest(requestId);
      fetchAll();
    } catch {
      /* ignore */
    }
  }

  async function handleReject(requestId: string) {
    const reason = prompt("Rejection reason (optional):");
    try {
      await apiClient.rejectAccessRequest(requestId, reason || undefined);
      fetchAll();
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
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
    );
  }

  const publicCount = resources.filter((r) => r.isPublic).length;
  const pendingRequestCount = accessRequests.filter((r) => r.status === "pending").length;
  const filteredRequests =
    requestFilter === "all"
      ? accessRequests
      : accessRequests.filter((r) => r.status === requestFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Trust Center</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Configure your public-facing trust and compliance portal
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            {config?.isEnabled ? "Enabled" : "Disabled"}
          </span>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              config?.isEnabled ? "bg-blue-600" : "bg-neutral-300 dark:bg-neutral-600"
            }`}
          >
            <div
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${
                config?.isEnabled ? "right-0.5" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Config Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Settings</h2>
            <Button size="sm" variant="secondary" onClick={() => setSettingsOpen(true)}>
              Edit
            </Button>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-neutral-500">Status</dt>
              <dd>
                <Badge variant={config?.isEnabled ? "success" : "neutral"}>
                  {config?.isEnabled ? "Live" : "Offline"}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-500">Custom Domain</dt>
              <dd className="text-neutral-900 dark:text-white">
                {config?.customDomain || "Not configured"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-500">Brand Color</dt>
              <dd className="flex items-center gap-2">
                {config?.brandColor && (
                  <span
                    className="inline-block h-4 w-4 rounded-full border border-neutral-200 dark:border-neutral-700"
                    style={{ backgroundColor: config.brandColor }}
                  />
                )}
                <span className="text-neutral-900 dark:text-white">
                  {config?.brandColor || "Default"}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-500">Published Resources</dt>
              <dd className="text-neutral-900 dark:text-white">{publicCount}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-500">Pending Access Requests</dt>
              <dd>
                {pendingRequestCount > 0 ? (
                  <Badge variant="warning">{pendingRequestCount}</Badge>
                ) : (
                  <span className="text-neutral-900 dark:text-white">0</span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-500">Subprocessors Listed</dt>
              <dd className="text-neutral-900 dark:text-white">{subprocessors.length}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Description</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
            {config?.description || "No description set. Edit settings to add one."}
          </p>
        </Card>
      </div>

      {/* Resources */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            Resources ({resources.length})
          </h2>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            Upload Resource
          </Button>
        </div>
        {resources.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            No resources yet. Upload certificates, reports, policies, or attestations.
          </p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Title</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Framework</TableHeader>
                <TableHeader>Visibility</TableHeader>
                <TableHeader>Access</TableHeader>
                <TableHeader>Uploaded</TableHeader>
                <TableHeader className="w-28" />
              </TableRow>
            </TableHead>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {resource.title}
                      </span>
                      {resource.description && (
                        <p className="mt-0.5 text-xs text-neutral-400 truncate max-w-xs">
                          {resource.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">{RESOURCE_TYPE_LABELS[resource.resourceType]}</Badge>
                  </TableCell>
                  <TableCell>{resource.frameworkType || "—"}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleTogglePublic(resource)}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        resource.isPublic
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {resource.isPublic ? "Public" : "Internal"}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={GATING_BADGE[resource.accessGating]?.variant ?? "neutral"}>
                      {GATING_BADGE[resource.accessGating]?.label ?? resource.accessGating}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(resource.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-blue-600 dark:hover:bg-neutral-800 dark:hover:text-blue-400"
                        title="Download"
                        onClick={() => handleDownload(resource)}
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </button>
                      <button
                        className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                        title="Delete"
                        onClick={() => setDeleteTarget(resource)}
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

      {/* Access Requests */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Access Requests
              {pendingRequestCount > 0 && (
                <Badge variant="warning" className="ml-2">
                  {pendingRequestCount} pending
                </Badge>
              )}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Review and manage requests from visitors who want access to gated resources.
            </p>
          </div>
          <Select
            id="req-filter"
            value={requestFilter}
            onChange={(e) => setRequestFilter(e.target.value as AccessRequestStatus | "all")}
            options={[
              { value: "all", label: "All Requests" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ]}
          />
        </div>

        {filteredRequests.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            {requestFilter === "pending"
              ? "No pending access requests."
              : "No access requests matching this filter."}
          </p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Requester</TableHeader>
                <TableHeader>Company</TableHeader>
                <TableHeader>Resource</TableHeader>
                <TableHeader>NDA</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Requested</TableHeader>
                <TableHeader className="w-32" />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {req.requesterName}
                      </span>
                      <p className="text-xs text-neutral-400">{req.requesterEmail}</p>
                      {req.requesterTitle && (
                        <p className="text-xs text-neutral-400">{req.requesterTitle}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{req.requesterCompany}</TableCell>
                  <TableCell>
                    <span className="text-sm text-neutral-900 dark:text-white">
                      {req.resource?.title || req.resourceId}
                    </span>
                  </TableCell>
                  <TableCell>
                    {req.ndaAccepted ? (
                      <Badge variant="success">Accepted</Badge>
                    ) : (
                      <span className="text-xs text-neutral-400">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={REQUEST_STATUS_BADGE[req.status]?.variant ?? "neutral"}>
                      {REQUEST_STATUS_BADGE[req.status]?.label ?? req.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(req.createdAt)}</TableCell>
                  <TableCell>
                    {req.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="primary" onClick={() => handleApprove(req.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(req.id)}>
                          Reject
                        </Button>
                      </div>
                    )}
                    {req.status === "approved" && req.approvedBy && (
                      <span className="text-xs text-neutral-400">by {req.approvedBy.name}</span>
                    )}
                    {req.status === "rejected" && req.rejectedReason && (
                      <span className="text-xs text-neutral-400" title={req.rejectedReason}>
                        {req.rejectedReason.slice(0, 40)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Subprocessors */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Subprocessors ({subprocessors.length})
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Vendors marked as subprocessors appear here and on your public Trust Center. Manage
              them from the Vendors page.
            </p>
          </div>
        </div>
        {subprocessors.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            No subprocessors yet. Mark vendors as subprocessors from the vendor detail page.
          </p>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Purpose</TableHeader>
                <TableHeader>Data Types</TableHeader>
                <TableHeader>Locations</TableHeader>
                <TableHeader>DPA Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {subprocessors.map((sp) => (
                <TableRow key={sp.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {sp.name}
                      </span>
                      {sp.website && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">{sp.website}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{sp.subprocessorPurpose || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {sp.dataTypesShared.length > 0
                        ? sp.dataTypesShared.map((dt) => (
                            <Badge key={dt} variant="neutral">
                              {dt}
                            </Badge>
                          ))
                        : "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {sp.dataLocations.length > 0 ? sp.dataLocations.join(", ") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={DPA_BADGE[sp.dpaStatus]?.variant ?? "neutral"}>
                      {DPA_BADGE[sp.dpaStatus]?.label ?? sp.dpaStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Settings Modal */}
      {config && (
        <SettingsModal
          open={settingsOpen}
          config={config}
          onClose={() => setSettingsOpen(false)}
          onSaved={() => {
            setSettingsOpen(false);
            fetchAll();
          }}
        />
      )}

      {/* Upload Resource Modal */}
      <UploadResourceModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => {
          setUploadOpen(false);
          fetchAll();
        }}
      />

      {/* Delete Confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Resource">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This will
          permanently remove the file.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ──────────────────────────────────────────────
// Settings Modal
// ──────────────────────────────────────────────

function SettingsModal({
  open,
  config,
  onClose,
  onSaved,
}: {
  open: boolean;
  config: TrustCenterConfig;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setCustomDomain(config.customDomain ?? "");
      setBrandColor(config.brandColor ?? "");
      setDescription(config.description ?? "");
      setError(null);
    }
  }, [open, config]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.updateTrustCenterConfig({
        customDomain: customDomain.trim() || null,
        brandColor: brandColor.trim() || null,
        description: description.trim() || null,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Trust Center Settings">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <Input
          id="tc-domain"
          label="Custom Domain"
          placeholder="trust.yourcompany.com"
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value)}
        />
        <Input
          id="tc-color"
          label="Brand Color"
          placeholder="#3B82F6"
          value={brandColor}
          onChange={(e) => setBrandColor(e.target.value)}
        />
        <Textarea
          id="tc-desc"
          label="Description"
          placeholder="Describe your organization's commitment to security and compliance..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save Settings
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ──────────────────────────────────────────────
// Upload Resource Modal
// ──────────────────────────────────────────────

function UploadResourceModal({
  open,
  onClose,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<TrustResourceType>("report");
  const [frameworkType, setFrameworkType] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [accessGating, setAccessGating] = useState<TrustResourceGating>("public");

  useEffect(() => {
    if (open) {
      setFile(null);
      setTitle("");
      setDescription("");
      setResourceType("report");
      setFrameworkType("");
      setIsPublic(true);
      setAccessGating("public");
      setError(null);
    }
  }, [open]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    if (selected && !title.trim()) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const meta: CreateTrustResourceMeta = {
        title: title.trim(),
        description: description.trim() || null,
        resourceType,
        frameworkType: frameworkType.trim() || null,
        isPublic,
        accessGating,
      };
      await apiClient.uploadTrustResource(file, meta);
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload Resource" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="res-file"
            className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            File *
          </label>
          <input
            id="res-file"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-neutral-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:text-neutral-400 dark:file:bg-blue-950 dark:file:text-blue-300"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          />
        </div>

        <Input
          id="res-title"
          label="Title *"
          placeholder="e.g. SOC 2 Type II Report"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="res-type"
            label="Resource Type"
            options={RESOURCE_TYPE_OPTIONS}
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value as TrustResourceType)}
          />
          <Input
            id="res-framework"
            label="Framework"
            placeholder="e.g. SOC 2, ISO 27001"
            value={frameworkType}
            onChange={(e) => setFrameworkType(e.target.value)}
          />
        </div>

        <Textarea
          id="res-desc"
          label="Description"
          placeholder="Optional description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Publicly visible on Trust Center
            </label>
          </div>
          <Select
            id="res-gating"
            label="Access Level"
            options={GATING_OPTIONS}
            value={accessGating}
            onChange={(e) => setAccessGating(e.target.value as TrustResourceGating)}
          />
        </div>

        {accessGating !== "public" && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 rounded-lg bg-neutral-50 dark:bg-neutral-800 px-3 py-2">
            {accessGating === "contact_required"
              ? "Visitors must provide their name, email, and company to access this resource. Access is granted immediately."
              : "Visitors must accept NDA terms and submit a request. You will need to approve each request manually."}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={uploading}>
            Upload
          </Button>
        </div>
      </form>
    </Modal>
  );
}
