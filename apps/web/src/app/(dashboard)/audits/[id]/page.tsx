"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
import { apiClient } from "@/lib/api-client";
import { usePermissions } from "@/lib/use-permissions";
import type {
  AuditDetail,
  AuditFindingItem,
  AuditDocument,
  AuditStatus,
  AuditType,
  AuditFindingSeverity,
  AuditFindingStatus,
  UpdateAuditInput,
  CreateAuditFindingInput,
  UpdateAuditFindingInput,
} from "@/lib/api-client";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const STATUS_CONFIG: Record<AuditStatus, { label: string; variant: BadgeVariant }> = {
  planned: { label: "Planned", variant: "neutral" },
  in_progress: { label: "In Progress", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

const TYPE_CONFIG: Record<AuditType, { label: string; variant: BadgeVariant }> = {
  internal: { label: "Internal", variant: "info" },
  external: { label: "External", variant: "warning" },
  certification: { label: "Certification", variant: "success" },
};

const SEVERITY_CONFIG: Record<AuditFindingSeverity, { label: string; variant: BadgeVariant }> = {
  critical: { label: "Critical", variant: "danger" },
  major: { label: "Major", variant: "warning" },
  minor: { label: "Minor", variant: "info" },
  observation: { label: "Observation", variant: "neutral" },
  opportunity: { label: "Opportunity", variant: "success" },
};

const FINDING_STATUS_CONFIG: Record<AuditFindingStatus, { label: string; variant: BadgeVariant }> =
  {
    open: { label: "Open", variant: "danger" },
    in_progress: { label: "In Progress", variant: "info" },
    remediated: { label: "Remediated", variant: "warning" },
    verified: { label: "Verified", variant: "success" },
    closed: { label: "Closed", variant: "neutral" },
  };

const AUDIT_STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const AUDIT_TYPE_OPTIONS = [
  { value: "internal", label: "Internal" },
  { value: "external", label: "External" },
  { value: "certification", label: "Certification" },
];

const SEVERITY_OPTIONS = [
  { value: "critical", label: "Critical" },
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "observation", label: "Observation" },
  { value: "opportunity", label: "Improvement Opportunity" },
];

const FINDING_STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "remediated", label: "Remediated" },
  { value: "verified", label: "Verified" },
  { value: "closed", label: "Closed" },
];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Tab = "overview" | "findings" | "documents";

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canWrite = hasPermission("audits:write");

  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showEdit, setShowEdit] = useState(false);
  const [showAddFinding, setShowAddFinding] = useState(false);
  const [editingFinding, setEditingFinding] = useState<AuditFindingItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchAudit = useCallback(async () => {
    if (!id) return;
    try {
      const res = await apiClient.getAudit(id);
      setAudit(res.data);
    } catch {
      setAudit(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  async function handleDelete() {
    if (!id) return;
    await apiClient.deleteAudit(id);
    router.push("/audits");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-neutral-400">Loading audit…</div>
    );
  }

  if (!audit) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-neutral-500">Audit not found</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => router.push("/audits")}
        >
          Back to Audits
        </Button>
      </div>
    );
  }

  const openFindings =
    audit.findings?.filter((f) => f.status === "open" || f.status === "in_progress").length ?? 0;

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "findings", label: "Findings", count: audit.findings?.length ?? 0 },
    { key: "documents", label: "Documents", count: audit.documents?.length ?? 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <button
          onClick={() => router.push("/audits")}
          className="mb-3 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Audits
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-2xl font-bold text-neutral-900 dark:text-white">
                {audit.title}
              </h1>
              <Badge variant={STATUS_CONFIG[audit.status].variant}>
                {STATUS_CONFIG[audit.status].label}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
              <Badge variant={TYPE_CONFIG[audit.type].variant}>
                {TYPE_CONFIG[audit.type].label}
              </Badge>
              {audit.auditorOrganization && <span>{audit.auditorOrganization}</span>}
              {audit.auditorName && <span>· {audit.auditorName}</span>}
            </div>
          </div>
          {canWrite && (
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Scheduled Start" value={formatDate(audit.scheduledStartDate)} />
        <MiniStat label="Scheduled End" value={formatDate(audit.scheduledEndDate)} />
        <MiniStat label="Total Findings" value={String(audit.findings?.length ?? 0)} />
        <MiniStat label="Open Findings" value={String(openFindings)} highlight={openFindings > 0} />
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs tabular-nums dark:bg-neutral-800">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab audit={audit} />}
      {activeTab === "findings" && (
        <FindingsTab
          auditId={id}
          findings={audit.findings ?? []}
          canWrite={canWrite}
          onAddFinding={() => setShowAddFinding(true)}
          onEditFinding={setEditingFinding}
          onRefresh={fetchAudit}
        />
      )}
      {activeTab === "documents" && (
        <DocumentsTab
          auditId={id}
          documents={audit.documents ?? []}
          canWrite={canWrite}
          onRefresh={fetchAudit}
        />
      )}

      {/* Modals */}
      {showEdit && (
        <EditAuditModal
          audit={audit}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            fetchAudit();
          }}
        />
      )}
      {showAddFinding && (
        <FindingModal
          auditId={id}
          onClose={() => setShowAddFinding(false)}
          onSaved={() => {
            setShowAddFinding(false);
            fetchAudit();
          }}
        />
      )}
      {editingFinding && (
        <FindingModal
          auditId={id}
          finding={editingFinding}
          onClose={() => setEditingFinding(null)}
          onSaved={() => {
            setEditingFinding(null);
            fetchAudit();
          }}
        />
      )}
      {showDeleteConfirm && (
        <Modal open onClose={() => setShowDeleteConfirm(false)} title="Delete Audit" size="sm">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            This will permanently delete the audit, all findings, and all uploaded documents. This
            action cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Delete Permanently
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Mini stat ──────────────────────────────────────────────
function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-semibold tabular-nums ${highlight ? "text-amber-600 dark:text-amber-400" : "text-neutral-900 dark:text-white"}`}
      >
        {value}
      </p>
    </Card>
  );
}

// ─── Overview Tab ───────────────────────────────────────────
function OverviewTab({ audit }: { audit: AuditDetail }) {
  const fields = [
    { label: "Description", value: audit.description || "No description provided" },
    { label: "Auditor", value: audit.auditorName || "—" },
    { label: "Audit Firm", value: audit.auditorOrganization || "—" },
    { label: "Scheduled Start", value: formatDate(audit.scheduledStartDate) },
    { label: "Scheduled End", value: formatDate(audit.scheduledEndDate) },
    { label: "Actual Start", value: formatDate(audit.actualStartDate) },
    { label: "Actual End", value: formatDate(audit.actualEndDate) },
    { label: "Created", value: formatDate(audit.createdAt) },
  ];

  return (
    <Card>
      <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Audit Details</h3>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.label}>
            <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {f.label}
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-200">
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

// ─── Findings Tab ───────────────────────────────────────────
function FindingsTab({
  auditId,
  findings,
  canWrite,
  onAddFinding,
  onEditFinding,
  onRefresh,
}: {
  auditId: string;
  findings: AuditFindingItem[];
  canWrite: boolean;
  onAddFinding: () => void;
  onEditFinding: (f: AuditFindingItem) => void;
  onRefresh: () => void;
}) {
  async function handleDeleteFinding(findingId: string) {
    await apiClient.deleteAuditFinding(auditId, findingId);
    onRefresh();
  }

  if (findings.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center py-12">
          <svg
            className="h-10 w-10 text-neutral-300 dark:text-neutral-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2 text-sm text-neutral-500">No findings recorded</p>
          {canWrite && (
            <Button size="sm" className="mt-3" onClick={onAddFinding}>
              Add Finding
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {canWrite && (
        <div className="flex justify-end">
          <Button size="sm" onClick={onAddFinding}>
            Add Finding
          </Button>
        </div>
      )}
      <Card padding="none">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Finding</TableHeader>
              <TableHeader>Severity</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Assignee</TableHeader>
              <TableHeader>Due Date</TableHeader>
              {canWrite && <TableHeader className="w-20">Actions</TableHeader>}
            </TableRow>
          </TableHead>
          <TableBody>
            {findings.map((f) => (
              <TableRow key={f.id}>
                <TableCell>
                  <p className="font-medium text-neutral-900 dark:text-white">{f.title}</p>
                  {f.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{f.description}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={SEVERITY_CONFIG[f.severity].variant}>
                    {SEVERITY_CONFIG[f.severity].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={FINDING_STATUS_CONFIG[f.status].variant}>
                    {FINDING_STATUS_CONFIG[f.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-neutral-500">
                  {f.assignedTo?.name ?? "—"}
                </TableCell>
                <TableCell className="text-sm text-neutral-500">{formatDate(f.dueDate)}</TableCell>
                {canWrite && (
                  <TableCell>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEditFinding(f)}
                        className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
                        title="Edit"
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
                        onClick={() => handleDeleteFinding(f.id)}
                        className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                        title="Delete"
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
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ─── Documents Tab ──────────────────────────────────────────
function DocumentsTab({
  auditId,
  documents,
  canWrite,
  onRefresh,
}: {
  auditId: string;
  documents: AuditDocument[];
  canWrite: boolean;
  onRefresh: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await apiClient.uploadAuditDocument(auditId, file);
      onRefresh();
    } catch {
      // upload failed
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(doc: AuditDocument) {
    try {
      const res = await apiClient.getAuditDocumentDownloadUrl(auditId, doc.id);
      window.open(res.data.url, "_blank");
    } catch {
      // download failed
    }
  }

  async function handleDelete(docId: string) {
    await apiClient.deleteAuditDocument(auditId, docId);
    onRefresh();
  }

  function fileIcon(mimeType: string | null) {
    if (!mimeType) return "📄";
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.includes("pdf")) return "📕";
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv"))
      return "📊";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("zip") || mimeType.includes("archive")) return "📦";
    return "📄";
  }

  return (
    <div className="space-y-3">
      {canWrite && (
        <div className="flex justify-end">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            accept="*/*"
          />
          <Button size="sm" onClick={() => fileInputRef.current?.click()} loading={uploading}>
            Upload Document
          </Button>
        </div>
      )}

      {documents.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-12">
            <svg
              className="h-10 w-10 text-neutral-300 dark:text-neutral-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mt-2 text-sm text-neutral-500">No documents uploaded</p>
            <p className="mt-1 text-xs text-neutral-400">
              Upload audit reports, evidence packages, certifications, and supporting files.
            </p>
            {canWrite && (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() => fileInputRef.current?.click()}
                loading={uploading}
              >
                Choose File
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <span className="text-xl">{fileIcon(doc.mimeType)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                    {doc.fileName ?? "Untitled"}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {formatBytes(doc.fileSize)} · Uploaded {formatDate(doc.createdAt)}
                    {doc.uploadedBy && ` by ${doc.uploadedBy.name}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-blue-600 dark:hover:bg-neutral-800"
                    title="Download"
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
                  {canWrite && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      title="Delete"
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
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Drag-and-drop area */}
      {canWrite && <DropZone auditId={auditId} onUploaded={onRefresh} />}
    </div>
  );
}

// ─── Drag & Drop Zone ───────────────────────────────────────
function DropZone({ auditId, onUploaded }: { auditId: string; onUploaded: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        await apiClient.uploadAuditDocument(auditId, file);
      }
      onUploaded();
    } catch {
      // upload failed
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`mt-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
        dragging
          ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950"
          : "border-neutral-300 dark:border-neutral-700"
      }`}
    >
      {uploading ? (
        <p className="text-sm text-neutral-500">Uploading…</p>
      ) : (
        <p className="text-sm text-neutral-500">Drag and drop files here to upload</p>
      )}
    </div>
  );
}

// ─── Edit Audit Modal ───────────────────────────────────────
function EditAuditModal({
  audit,
  onClose,
  onSaved,
}: {
  audit: AuditDetail;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateAuditInput>({
    title: audit.title,
    type: audit.type,
    status: audit.status,
    description: audit.description ?? "",
    auditorName: audit.auditorName ?? "",
    auditorOrganization: audit.auditorOrganization ?? "",
    scheduledStartDate: audit.scheduledStartDate?.split("T")[0] ?? "",
    scheduledEndDate: audit.scheduledEndDate?.split("T")[0] ?? "",
    actualStartDate: audit.actualStartDate?.split("T")[0] ?? "",
    actualEndDate: audit.actualEndDate?.split("T")[0] ?? "",
  });

  const set = (key: keyof UpdateAuditInput, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.updateAudit(audit.id, {
        ...form,
        description: form.description || null,
        auditorName: form.auditorName || null,
        auditorOrganization: form.auditorOrganization || null,
        scheduledStartDate: form.scheduledStartDate || null,
        scheduledEndDate: form.scheduledEndDate || null,
        actualStartDate: form.actualStartDate || null,
        actualEndDate: form.actualEndDate || null,
      });
      onSaved();
    } catch {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Edit Audit" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          required
          value={form.title ?? ""}
          onChange={(e) => set("title", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Type"
            options={AUDIT_TYPE_OPTIONS}
            value={form.type ?? ""}
            onChange={(e) => set("type", e.target.value)}
          />
          <Select
            label="Status"
            options={AUDIT_STATUS_OPTIONS}
            value={form.status ?? ""}
            onChange={(e) => set("status", e.target.value)}
          />
        </div>
        <Textarea
          label="Description"
          value={typeof form.description === "string" ? form.description : ""}
          onChange={(e) => set("description", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Auditor Name"
            value={typeof form.auditorName === "string" ? form.auditorName : ""}
            onChange={(e) => set("auditorName", e.target.value)}
          />
          <Input
            label="Audit Firm"
            value={typeof form.auditorOrganization === "string" ? form.auditorOrganization : ""}
            onChange={(e) => set("auditorOrganization", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Scheduled Start"
            type="date"
            value={typeof form.scheduledStartDate === "string" ? form.scheduledStartDate : ""}
            onChange={(e) => set("scheduledStartDate", e.target.value)}
          />
          <Input
            label="Scheduled End"
            type="date"
            value={typeof form.scheduledEndDate === "string" ? form.scheduledEndDate : ""}
            onChange={(e) => set("scheduledEndDate", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Actual Start"
            type="date"
            value={typeof form.actualStartDate === "string" ? form.actualStartDate : ""}
            onChange={(e) => set("actualStartDate", e.target.value)}
          />
          <Input
            label="Actual End"
            type="date"
            value={typeof form.actualEndDate === "string" ? form.actualEndDate : ""}
            onChange={(e) => set("actualEndDate", e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Finding Modal (Create / Edit) ──────────────────────────
function FindingModal({
  auditId,
  finding,
  onClose,
  onSaved,
}: {
  auditId: string;
  finding?: AuditFindingItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!finding;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateAuditFindingInput>({
    title: finding?.title ?? "",
    severity: finding?.severity ?? "minor",
    description: finding?.description ?? "",
    status: finding?.status ?? "open",
    dueDate: finding?.dueDate?.split("T")[0] ?? "",
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        description: form.description || null,
        dueDate: form.dueDate || null,
      };
      if (isEdit && finding) {
        await apiClient.updateAuditFinding(auditId, finding.id, payload as UpdateAuditFindingInput);
      } else {
        await apiClient.createAuditFinding(auditId, payload);
      }
      onSaved();
    } catch {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit Finding" : "Add Finding"}
      description={isEdit ? "Update finding details" : "Record a new audit finding"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          required
          placeholder="e.g. Missing access review documentation"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Severity"
            options={SEVERITY_OPTIONS}
            value={form.severity}
            onChange={(e) => set("severity", e.target.value)}
          />
          <Select
            label="Status"
            options={FINDING_STATUS_OPTIONS}
            value={form.status ?? "open"}
            onChange={(e) => set("status", e.target.value)}
          />
        </div>
        <Textarea
          label="Description"
          placeholder="Detailed description of the finding, impact, and recommendation…"
          value={typeof form.description === "string" ? form.description : ""}
          onChange={(e) => set("description", e.target.value)}
        />
        <Input
          label="Due Date"
          type="date"
          value={typeof form.dueDate === "string" ? form.dueDate : ""}
          onChange={(e) => set("dueDate", e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!form.title.trim()}>
            {isEdit ? "Update Finding" : "Add Finding"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
