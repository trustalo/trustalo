"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import {
  apiClient,
  type Control,
  type EvidenceApprovalStatus,
  type EvidenceItem,
  type EvidenceType as EvidenceKind,
  type CreateEvidenceInput,
  type RenewalFrequency,
} from "@/lib/api-client";

// ─── Shared Constants ────────────────────────────────────────

export const EVIDENCE_STATUS_BADGE: Record<
  EvidenceApprovalStatus,
  { variant: BadgeVariant; label: string }
> = {
  draft: { variant: "neutral", label: "Draft" },
  pending_review: { variant: "warning", label: "Pending Review" },
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "danger", label: "Rejected" },
  expired: { variant: "danger", label: "Expired" },
  stale: { variant: "warning", label: "Stale" },
};

export const EVIDENCE_TYPE_LABELS: Record<EvidenceKind, string> = {
  document: "Document",
  screenshot: "Screenshot",
  link: "Link",
  automated: "Automated",
  attestation: "Attestation",
};

export const EVIDENCE_TYPE_OPTIONS: { value: EvidenceKind; label: string }[] = [
  { value: "document", label: "Document" },
  { value: "screenshot", label: "Screenshot" },
  { value: "link", label: "Link / URL" },
  { value: "automated", label: "Automated Collection" },
  { value: "attestation", label: "Attestation" },
];

export const RENEWAL_FREQ_OPTIONS = [
  { value: "", label: "No renewal" },
  { value: "once", label: "One-time" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semi_annually", label: "Semi-annually" },
  { value: "annually", label: "Annually" },
];

const FILE_EVIDENCE_TYPES: EvidenceKind[] = ["document", "screenshot", "attestation"];

// ─── Shared Helpers ──────────────────────────────────────────

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function expiryBadge(
  expiresAt: string | null,
): { label: string; variant: BadgeVariant } | null {
  const days = daysUntilExpiry(expiresAt);
  if (days === null) return null;
  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, variant: "danger" };
  if (days <= 30) return { label: `${days}d left`, variant: "warning" };
  return null;
}

// ─── Type Icon ───────────────────────────────────────────────

export function TypeIcon({ type }: { type: EvidenceKind }) {
  const cls = "h-4 w-4 flex-shrink-0";
  switch (type) {
    case "document":
      return (
        <svg className={`${cls} text-blue-500`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l3.122 3.12a1.5 1.5 0 01.439 1.061V16.5A1.5 1.5 0 0114.5 18h-10A1.5 1.5 0 013 16.5v-13z" />
        </svg>
      );
    case "screenshot":
      return (
        <svg className={`${cls} text-violet-500`} viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909-3.22-3.22a.75.75 0 00-1.06 0L2.5 11.06z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "link":
      return (
        <svg className={`${cls} text-cyan-500`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
          <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
        </svg>
      );
    case "automated":
      return (
        <svg className={`${cls} text-emerald-500`} viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M14.5 10a4.5 4.5 0 004.284-5.882c-.105-.324-.51-.391-.752-.15L15.34 6.66a.454.454 0 01-.493.101 3.046 3.046 0 01-1.608-1.607.454.454 0 01.1-.493l2.693-2.692c.24-.241.174-.647-.15-.752a4.5 4.5 0 00-5.873 4.575c.055.873-.128 1.808-.8 2.368l-7.23 6.024a2.724 2.724 0 103.837 3.837l6.024-7.23c.56-.672 1.495-.855 2.368-.8.096.007.193.01.291.01zM5 16a1 1 0 11-2 0 1 1 0 012 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "attestation":
      return (
        <svg className={`${cls} text-amber-500`} viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}

function MetaField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">{label}</p>
      <div className="mt-0.5 text-sm text-neutral-800 dark:text-neutral-200">{children}</div>
    </div>
  );
}

// ─── Evidence Detail Modal ───────────────────────────────────

export function EvidenceDetailModal({
  evidence,
  onClose,
  onEdit,
  onReview,
  onSubmitForReview,
  onRenew,
  onNavigateControl,
}: {
  evidence: EvidenceItem;
  onClose: () => void;
  onEdit: (ev: EvidenceItem) => void;
  onReview: (ev: EvidenceItem) => void;
  onSubmitForReview: (id: string) => void;
  onRenew: (id: string) => void;
  onNavigateControl?: (controlId: string) => void;
}) {
  const stBadge = EVIDENCE_STATUS_BADGE[evidence.status];
  const expiry = expiryBadge(evidence.expiresAt);

  return (
    <Modal open onClose={onClose} title="Evidence Details" size="lg">
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {evidence.title}
            </h3>
            <Badge variant={stBadge.variant}>{stBadge.label}</Badge>
            {expiry && <Badge variant={expiry.variant}>{expiry.label}</Badge>}
          </div>
          {evidence.description && (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {evidence.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
          <MetaField label="Type">
            <div className="flex items-center gap-1.5">
              <TypeIcon type={evidence.type} />
              <span>{EVIDENCE_TYPE_LABELS[evidence.type]}</span>
            </div>
          </MetaField>
          <MetaField label="Linked Control">
            {evidence.control ? (
              onNavigateControl ? (
                <button
                  type="button"
                  className="text-left text-blue-600 hover:underline dark:text-blue-400"
                  onClick={() => {
                    onClose();
                    onNavigateControl(evidence.control!.id);
                  }}
                >
                  {evidence.control.title}
                </button>
              ) : (
                <span>{evidence.control.title}</span>
              )
            ) : (
              <span className="text-neutral-400">—</span>
            )}
          </MetaField>
          <MetaField label="Submitted By">
            {evidence.submittedBy?.name ?? "Evidence Agent"}
          </MetaField>
          <MetaField label="Collected">{formatDate(evidence.collectedAt)}</MetaField>
          <MetaField label="Valid From">{formatDate(evidence.validFrom)}</MetaField>
          <MetaField label="Expires">{formatDate(evidence.expiresAt)}</MetaField>
          {evidence.renewalFrequency && (
            <MetaField label="Renewal Frequency">
              {evidence.renewalFrequency.replace("_", " ")}
            </MetaField>
          )}
          {evidence.nextRenewalDate && (
            <MetaField label="Next Renewal">{formatDate(evidence.nextRenewalDate)}</MetaField>
          )}
          {evidence.sourceType && (
            <MetaField label="Source">
              {evidence.sourceType}
              {evidence.sourceId ? ` (${evidence.sourceId})` : ""}
            </MetaField>
          )}
        </div>

        {(evidence.fileKey || evidence.externalUrl) && (
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Attachment
            </p>
            {evidence.fileKey && evidence.fileName && (
              <div className="flex items-center gap-3">
                <TypeIcon type="document" />
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {evidence.fileName}
                  </p>
                  {evidence.fileSize && (
                    <p className="text-xs text-neutral-400">{formatFileSize(evidence.fileSize)}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  onClick={async () => {
                    try {
                      const res = await apiClient.getEvidenceDownloadUrl(evidence.id);
                      window.open(res.data.url, "_blank");
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  Download
                </button>
              </div>
            )}
            {evidence.externalUrl && (
              <a
                href={evidence.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                <TypeIcon type="link" />
                {evidence.externalUrl}
              </a>
            )}
          </div>
        )}

        {evidence.reviewedBy && (
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Review
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Reviewed by <strong>{evidence.reviewedBy.name}</strong> on{" "}
              {formatDate(evidence.reviewedAt)}
            </p>
            {evidence.reviewNotes && (
              <p className="mt-1 rounded bg-neutral-50 px-3 py-2 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                {evidence.reviewNotes}
              </p>
            )}
          </div>
        )}

        {evidence.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {evidence.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          {(evidence.status === "draft" || evidence.status === "rejected") && (
            <Button variant="secondary" size="sm" onClick={() => onSubmitForReview(evidence.id)}>
              Submit for Review
            </Button>
          )}
          {evidence.status === "pending_review" && (
            <Button size="sm" onClick={() => onReview(evidence)}>
              Review
            </Button>
          )}
          {(evidence.status === "expired" || evidence.status === "stale") &&
            evidence.renewalFrequency &&
            evidence.renewalFrequency !== "once" && (
              <Button variant="secondary" size="sm" onClick={() => onRenew(evidence.id)}>
                Renew
              </Button>
            )}
          <Button variant="secondary" size="sm" onClick={() => onEdit(evidence)}>
            Edit
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Evidence Form Modal ─────────────────────────────────────
// Pass fixedControlId to lock the control (used from control detail page).
// When absent, a SearchableSelect lets the user pick any control.

export function EvidenceFormModal({
  evidence,
  fixedControlId,
  onClose,
  onSaved,
}: {
  evidence: EvidenceItem | null;
  fixedControlId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!evidence;
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [controls, setControls] = useState<Control[]>([]);
  const [controlsLoading, setControlsLoading] = useState(false);
  const [controlId, setControlId] = useState(evidence?.controlId || fixedControlId || "");

  const [title, setTitle] = useState(evidence?.title || "");
  const [description, setDescription] = useState(evidence?.description || "");
  const [type, setType] = useState<EvidenceKind>(evidence?.type || "document");
  const [externalUrl, setExternalUrl] = useState(evidence?.externalUrl || "");
  const [expiresAt, setExpiresAt] = useState(
    evidence?.expiresAt ? new Date(evidence.expiresAt).toISOString().split("T")[0] : "",
  );
  const [renewalFrequency, setRenewalFrequency] = useState<RenewalFrequency | "">(
    evidence?.renewalFrequency || "",
  );
  const [reminderDays, setReminderDays] = useState(evidence?.reminderDaysBefore || 30);
  const [tags, setTags] = useState(evidence?.tags.join(", ") || "");

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [existingFile, setExistingFile] = useState<{
    name: string;
    size: number;
    key: string;
  } | null>(
    evidence?.fileKey
      ? {
          name: evidence.fileName || "attachment",
          size: evidence.fileSize || 0,
          key: evidence.fileKey,
        }
      : null,
  );
  const [fileRemoved, setFileRemoved] = useState(false);

  const isFileType = FILE_EVIDENCE_TYPES.includes(type);
  const needsControlSelector = !fixedControlId;

  useEffect(() => {
    if (!needsControlSelector) return;
    setControlsLoading(true);
    apiClient
      .listControls({ limit: "500" })
      .then((res) => setControls(res.data.items))
      .catch(() => {})
      .finally(() => setControlsLoading(false));
  }, [needsControlSelector]);

  const controlOptions = controls.map((c) => ({
    value: c.id,
    label: `${c.title}${c.category ? ` (${c.category})` : ""}`,
  }));

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setError("File must be less than 50 MB");
      return;
    }
    setPendingFile(file);
    setError(null);
  }

  function handleRemoveFile() {
    if (existingFile) {
      setFileRemoved(true);
      setExistingFile(null);
    }
    setPendingFile(null);
  }

  async function handleViewFile() {
    if (!evidence?.id || !evidence.fileKey) return;
    try {
      const res = await apiClient.getEvidenceDownloadUrl(evidence.id);
      window.open(res.data.url, "_blank");
    } catch {
      setError("Failed to get download URL");
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!controlId) {
      setError("Please select a control");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const payload: CreateEvidenceInput = {
        controlId,
        title: title.trim(),
        description: description.trim() || null,
        type,
        externalUrl: (type === "link" ? externalUrl.trim() : "") || null,
        expiresAt: expiresAt || null,
        renewalFrequency: renewalFrequency || null,
        reminderDaysBefore: reminderDays,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      let savedEvidence: EvidenceItem;

      if (isEdit) {
        const res = await apiClient.updateEvidence(evidence.id, payload);
        savedEvidence = res.data;
      } else {
        const res = await apiClient.createEvidence(payload);
        savedEvidence = res.data;
      }

      if (fileRemoved && isEdit && evidence.fileKey) {
        await apiClient.removeEvidenceFile(evidence.id);
      }

      if (pendingFile) {
        setUploading(true);
        await apiClient.uploadEvidenceFile(savedEvidence.id, pendingFile);
        setUploading(false);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      setUploading(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit Evidence" : "Add New Evidence"}
      description={
        isEdit ? "Update evidence details." : "Attach a new compliance artifact to a control."
      }
      size="lg"
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Basic Information
          </legend>
          <Input
            id="ev-title"
            label="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            id="ev-desc"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <Input
            id="ev-tags"
            label="Tags (comma-separated)"
            placeholder="e.g. AWS, quarterly, SOC 2"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Linked Control
          </legend>
          {needsControlSelector ? (
            <SearchableSelect
              id="ev-control"
              label="Control *"
              options={controlOptions}
              placeholder={controlsLoading ? "Loading controls…" : "Select a control…"}
              value={controlId}
              onChange={(val) => setControlId(val)}
              disabled={controlsLoading}
            />
          ) : (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
              <p className="text-xs text-neutral-400">Control</p>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                {evidence?.control?.title || "Current Control"}
              </p>
            </div>
          )}
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Evidence Source
          </legend>
          <Select
            id="ev-type"
            label="Evidence Type"
            options={EVIDENCE_TYPE_OPTIONS}
            value={type}
            onChange={(e) => setType(e.target.value as EvidenceKind)}
          />

          {isFileType && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Attachment
              </label>

              {existingFile && !fileRemoved && !pendingFile && (
                <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
                  <TypeIcon type="document" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                      {existingFile.name}
                    </p>
                    <p className="text-xs text-neutral-500">{formatFileSize(existingFile.size)}</p>
                  </div>
                  {isEdit && evidence?.fileKey && (
                    <button
                      type="button"
                      onClick={handleViewFile}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      View
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              )}

              {pendingFile && (
                <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950">
                  <TypeIcon type="document" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                      {pendingFile.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatFileSize(pendingFile.size)} &middot; Will upload on save
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingFile(null)}
                    className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              )}

              {!pendingFile && (!existingFile || fileRemoved) && (
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 px-6 py-8 transition-colors hover:border-blue-400 hover:bg-neutral-50 dark:border-neutral-600 dark:hover:border-blue-500 dark:hover:bg-neutral-800">
                  <svg className="h-8 w-8 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
                    <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                  </svg>
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                    Click to upload a file
                  </span>
                  <span className="text-xs text-neutral-400">Max 50 MB</span>
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          )}

          {type === "link" && (
            <Input
              id="ev-url"
              label="External URL *"
              type="url"
              placeholder="https://..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
            />
          )}
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Lifecycle &amp; Renewal
          </legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              id="ev-expires"
              label="Expires At"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <Select
              id="ev-renewal"
              label="Renewal Frequency"
              options={RENEWAL_FREQ_OPTIONS}
              value={renewalFrequency}
              onChange={(e) => setRenewalFrequency(e.target.value as RenewalFrequency | "")}
            />
            <Input
              id="ev-reminder"
              label="Remind Before (days)"
              type="number"
              min={1}
              max={365}
              value={String(reminderDays)}
              onChange={(e) => setReminderDays(Number(e.target.value) || 30)}
            />
          </div>
        </fieldset>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving || uploading} onClick={handleSave}>
            {uploading ? "Uploading…" : isEdit ? "Update Evidence" : "Add Evidence"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Delete Evidence Modal ───────────────────────────────────

export function DeleteEvidenceModal({
  evidence,
  onClose,
  onDeleted,
}: {
  evidence: EvidenceItem;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await apiClient.deleteEvidence(evidence.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete evidence");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Delete Evidence" size="sm">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Are you sure you want to delete{" "}
          <strong className="text-neutral-900 dark:text-white">{evidence.title}</strong>?
          {evidence.control && (
            <span>
              {" "}
              It will be removed from <strong>{evidence.control.title}</strong>.
            </span>
          )}{" "}
          This action cannot be undone.
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

// ─── Review Evidence Modal ───────────────────────────────────

export function ReviewEvidenceModal({
  evidence,
  onClose,
  onReviewed,
}: {
  evidence: EvidenceItem;
  onClose: () => void;
  onReviewed: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: "approve" | "reject") {
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.reviewEvidence(evidence.id, action, notes.trim() || undefined);
      onReviewed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Review Evidence" size="md">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {evidence.title}
          </p>
          {evidence.description && (
            <p className="mt-1 text-sm text-neutral-500">{evidence.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-400">
            <span>Type: {EVIDENCE_TYPE_LABELS[evidence.type]}</span>
            <span>Submitted by {evidence.submittedBy?.name ?? "Evidence Agent"}</span>
            {evidence.control && <span>Control: {evidence.control.title}</span>}
          </div>
          {evidence.externalUrl && (
            <a
              href={evidence.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-sm text-blue-500 hover:underline"
            >
              {evidence.externalUrl}
            </a>
          )}
          {evidence.fileKey && evidence.fileName && (
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-blue-500 hover:underline"
              onClick={async () => {
                try {
                  const res = await apiClient.getEvidenceDownloadUrl(evidence.id);
                  window.open(res.data.url, "_blank");
                } catch {
                  /* ignore */
                }
              }}
            >
              <TypeIcon type="document" />
              {evidence.fileName}
              {evidence.fileSize ? ` (${formatFileSize(evidence.fileSize)})` : ""}
            </button>
          )}
        </div>

        <Textarea
          id="review-notes"
          label="Review Notes (optional)"
          placeholder="Add feedback or reason for rejection…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={submitting}
            onClick={() => handleAction("reject")}
          >
            Reject
          </Button>
          <Button size="sm" loading={submitting} onClick={() => handleAction("approve")}>
            Approve
          </Button>
        </div>
      </div>
    </Modal>
  );
}
