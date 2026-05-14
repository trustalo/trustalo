"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RichEditor, type RichEditorHandle } from "@/components/ui/rich-editor";
import { AIProposalModal } from "@/components/policy/ai-proposal-modal";
import { PolicyDiff } from "@/components/policy/policy-diff";
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
  type PolicyDetail,
  type PolicyStatus,
  type PolicyVersion,
  type PolicyControlMapping,
  type PolicyCommentData,
  type Control,
  type ControlStatus,
  type OrgMember,
  type PolicyDraftFromContext,
} from "@/lib/api-client";
import { sanitizeHtml } from "@/lib/sanitize-html";

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
  pending_approval: { variant: "warning", label: "Needs Approval" },
  approved: { variant: "info", label: "Approved" },
  published: { variant: "success", label: "Published" },
  archived: { variant: "neutral", label: "Archived" },
};

const CONTROL_STATUS_BADGE: Record<ControlStatus, { variant: BadgeVariant; label: string }> = {
  not_implemented: { variant: "danger", label: "Not Implemented" },
  partially_implemented: { variant: "warning", label: "Partial" },
  implemented: { variant: "success", label: "Implemented" },
  not_applicable: { variant: "neutral", label: "N/A" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

type TabKey = "overview" | "policy" | "versions" | "controls";

// ─── Detail Page ──────────────────────────────────────────────

export default function PolicyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const policyId = params.id;

  const [policy, setPolicy] = useState<PolicyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [saveFlash, setSaveFlash] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [changesModalOpen, setChangesModalOpen] = useState(false);
  const editorContentRef = useRef<string>("");

  const fetchPolicy = useCallback(async () => {
    try {
      const res = await apiClient.getPolicy(policyId);
      setPolicy(res.data);
    } catch {
      setError("Policy not found");
    } finally {
      setLoading(false);
    }
  }, [policyId]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);
  useEffect(() => {
    apiClient
      .listMembers()
      .then((r) => setMembers(r.data))
      .catch(() => {});
  }, []);

  async function handleAction(action: () => Promise<{ data: PolicyDetail }>, successMsg: string) {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await action();
      setPolicy(res.data);
      setActionMsg({ type: "success", text: successMsg });
    } catch (e) {
      setActionMsg({ type: "error", text: e instanceof Error ? e.message : "Action failed" });
    } finally {
      setActionLoading(false);
    }
  }

  const handleApprove = () =>
    handleAction(() => apiClient.approvePolicy(policyId), "Policy approved");
  const handlePublish = () =>
    handleAction(() => apiClient.publishPolicy(policyId), "Policy published");
  const handleDuplicate = () =>
    handleAction(
      () => apiClient.duplicatePolicy(policyId),
      "Draft created — you can now edit the new version",
    ).then(() => setActiveTab("policy"));

  async function handleSaveDraft() {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const content = editorContentRef.current;
      if (content) {
        await apiClient.savePolicyContent(policyId, content);
      }
      await fetchPolicy();
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 2500);
    } catch (e) {
      setActionMsg({ type: "error", text: e instanceof Error ? e.message : "Failed to save" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSaveAndSubmit() {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const content = editorContentRef.current;
      if (content) {
        await apiClient.savePolicyContent(policyId, content);
      }
      const res = await apiClient.submitPolicyForReview(policyId);
      setPolicy(res.data);
      setActionMsg({ type: "success", text: "Saved and submitted for review" });
    } catch (e) {
      setActionMsg({ type: "error", text: e instanceof Error ? e.message : "Failed to submit" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRequestChanges(notes: string) {
    setActionLoading(true);
    setActionMsg(null);
    try {
      const res = await apiClient.requestPolicyChanges(policyId, notes);
      setPolicy(res.data);
      setChangesModalOpen(false);
      setActionMsg({ type: "success", text: "Changes requested — policy moved back to draft" });
    } catch (e) {
      setActionMsg({ type: "error", text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <svg className="h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
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

  if (error || !policy) {
    return (
      <div className="py-32 text-center">
        <p className="text-lg text-neutral-500">{error || "Policy not found"}</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push("/policies")}>
          Back to Policies
        </Button>
      </div>
    );
  }

  const statusBadge = STATUS_BADGE[policy.status];
  const currentVersion = policy.versions[0] ?? null;
  const versionNum = currentVersion?.versionNumber ?? 0;

  return (
    <div className="space-y-0">
      {/* ── Breadcrumb ── */}
      <div className="mb-2">
        <button
          type="button"
          onClick={() => router.push("/policies")}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Policies
        </button>
        <span className="ml-2 text-sm text-neutral-400">/</span>
        <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-300">{policy.title}</span>
      </div>

      {/* ── Header (Drata-style) ── */}
      <div className="flex items-start justify-between border-b border-neutral-200 pb-4 dark:border-neutral-700">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{policy.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            {versionNum > 0 && (
              <span className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Version {versionNum}
              </span>
            )}
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            <span>Created {formatDate(policy.createdAt)}</span>
            {currentVersion?.approvedAt && (
              <span>Approved {formatDate(currentVersion.approvedAt)}</span>
            )}
            {policy.status === "published" && <span>Published {formatDate(policy.updatedAt)}</span>}
            <span className="text-neutral-400">Last saved {timeAgo(policy.updatedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Draft: save explicitly or save & submit */}
          {policy.status === "draft" && (
            <>
              {saveFlash && <span className="text-xs font-medium text-emerald-500">Saved</span>}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveDraft}
                loading={actionLoading}
              >
                Save
              </Button>
              <Button size="sm" onClick={handleSaveAndSubmit} loading={actionLoading}>
                Submit for Review
              </Button>
            </>
          )}
          {/* Pending approval: reviewer can request changes or approve */}
          {policy.status === "pending_approval" && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setChangesModalOpen(true)}
                disabled={actionLoading}
              >
                Request Changes
              </Button>
              <Button size="sm" onClick={handleApprove} loading={actionLoading}>
                Approve
              </Button>
            </>
          )}
          {/* Approved: edit (back to draft) or publish */}
          {policy.status === "approved" && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  handleAction(
                    () =>
                      apiClient.requestPolicyChanges(
                        policyId,
                        "Editing policy content before publishing",
                      ),
                    "Policy moved to draft for editing",
                  )
                }
                loading={actionLoading}
              >
                Edit Policy
              </Button>
              <Button size="sm" onClick={handlePublish} loading={actionLoading}>
                Publish
              </Button>
            </>
          )}
          {/* Published only: Duplicate to create a new draft version */}
          {policy.status === "published" && (
            <Button variant="secondary" size="sm" onClick={handleDuplicate} loading={actionLoading}>
              Duplicate as Draft
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      {/* ── Action feedback (errors only) ── */}
      {actionMsg && actionMsg.type === "error" && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {actionMsg.text}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="mt-4 border-b border-neutral-200 dark:border-neutral-700">
        <nav className="-mb-px flex gap-6">
          {[
            { key: "overview" as TabKey, label: "Overview" },
            { key: "policy" as TabKey, label: "Policy" },
            { key: "versions" as TabKey, label: "Version History" },
            { key: "controls" as TabKey, label: "Controls" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${activeTab === tab.key ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400" : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:hover:text-neutral-300"}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab Content ── */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <OverviewTab policy={policy} members={members} onSaved={fetchPolicy} />
        )}
        {activeTab === "policy" && (
          <PolicyEditorTab policy={policy} editorContentRef={editorContentRef} />
        )}
        {activeTab === "versions" && <VersionsTab policyId={policy.id} />}
        {activeTab === "controls" && <ControlsTab policyId={policy.id} onSaved={fetchPolicy} />}
      </div>

      {/* ── Modals ── */}
      <DeletePolicyModal
        policy={deleteOpen ? policy : null}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => router.push("/policies")}
      />
      {changesModalOpen && (
        <RequestChangesModal
          onClose={() => setChangesModalOpen(false)}
          onSubmit={handleRequestChanges}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

// ─── Overview Tab (Drata-style two-column) ────────────────────

function OverviewTab({
  policy,
  members,
  onSaved,
}: {
  policy: PolicyDetail;
  members: OrgMember[];
  onSaved: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left: Details */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Details
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          </div>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Name</dt>
              <dd className="mt-0.5 font-medium text-neutral-900 dark:text-white">
                {policy.title}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500 dark:text-neutral-400">Renewal Date</dt>
              <dd className="mt-0.5 text-neutral-900 dark:text-white">
                {formatDate(policy.renewalDate)}
              </dd>
            </div>
            {policy.description && (
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400">Description</dt>
                <dd className="mt-0.5 text-neutral-900 dark:text-white">{policy.description}</dd>
              </div>
            )}
            {policy.category && (
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400">Category</dt>
                <dd className="mt-0.5">
                  <Badge variant="neutral">{policy.category}</Badge>
                </dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Linked Controls */}
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Linked Controls
          </h3>
          {policy.policyControls.length === 0 ? (
            <p className="text-sm text-neutral-400">No controls linked yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {policy.policyControls.map((pc) => (
                <Badge key={pc.id} variant={CONTROL_STATUS_BADGE[pc.control.status].variant}>
                  {pc.control.title}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {/* Acknowledgments summary */}
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Acknowledgments
          </h3>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {policy._count.acknowledgments}
              </p>
              <p className="text-xs text-neutral-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{policy._count.versions}</p>
              <p className="text-xs text-neutral-500">Versions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{policy._count.policyControls}</p>
              <p className="text-xs text-neutral-500">Controls</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Right: Approval & Owner */}
      <div className="space-y-6">
        {/* Review and approval */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Review and Approval
          </h3>
          <div className="space-y-3">
            {(() => {
              const v = policy.versions[0];
              if (!v) return <p className="text-sm text-neutral-400">No version to review.</p>;
              if (v.approvedBy) {
                return (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      {v.approvedBy.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        {v.approvedBy.name}
                      </p>
                      <p className="text-xs text-neutral-500">{v.approvedBy.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="success">Approved</Badge>
                      <p className="mt-0.5 text-xs text-neutral-400">{formatDate(v.approvedAt)}</p>
                    </div>
                  </div>
                );
              }
              return (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Awaiting approval for Version {v.versionNumber}
                </div>
              );
            })()}
          </div>
        </Card>

        {/* Owner */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Owner
          </h3>
          {policy.owner && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                {policy.owner.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {policy.owner.name}
                </p>
                <p className="text-xs text-neutral-500">{policy.owner.email}</p>
              </div>
            </div>
          )}
        </Card>

        {/* Quick stats */}
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Status
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">Status</dt>
              <dd>
                <Badge variant={STATUS_BADGE[policy.status].variant}>
                  {STATUS_BADGE[policy.status].label}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Current Version</dt>
              <dd className="font-mono text-neutral-900 dark:text-white">
                v{policy._count.versions || 0}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Last Updated</dt>
              <dd className="text-neutral-900 dark:text-white">{formatDate(policy.updatedAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">Created</dt>
              <dd className="text-neutral-900 dark:text-white">{formatDate(policy.createdAt)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {editOpen && (
        <EditDetailsModal
          policy={policy}
          members={members}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            onSaved();
          }}
        />
      )}
    </div>
  );
}

function EditDetailsModal({
  policy,
  members,
  onClose,
  onSaved,
}: {
  policy: PolicyDetail;
  members: OrgMember[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(policy.title);
  const [description, setDescription] = useState(policy.description || "");
  const [category, setCategory] = useState(policy.category || "");
  const [ownerId, setOwnerId] = useState(policy.ownerId || "");
  const [renewalDate, setRenewalDate] = useState(
    policy.renewalDate ? new Date(policy.renewalDate).toISOString().split("T")[0] : "",
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiClient.updatePolicy(policy.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        ownerId: ownerId || undefined,
        renewalDate: renewalDate || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const memberOptions = members.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` }));

  return (
    <Modal open onClose={onClose} title="Edit Policy Details" size="lg">
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <Input
          id="title"
          label="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          id="description"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            id="category"
            label="Category"
            options={CATEGORY_OPTIONS}
            placeholder="Select…"
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
          label="Owner"
          options={memberOptions}
          placeholder="Select…"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
        />
        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Policy Editor Tab ────────────────────────────────────────

function PolicyEditorTab({
  policy,
  editorContentRef,
}: {
  policy: PolicyDetail;
  editorContentRef: React.RefObject<string>;
}) {
  const currentVersion = policy.versions[0];
  const initialContent = currentVersion?.content || "";
  const isDraft = policy.status === "draft";
  const [editing, setEditing] = useState(isDraft);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [comments, setComments] = useState<PolicyCommentData[]>([]);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentHighlight, setCommentHighlight] = useState<{
    text: string;
    from: number;
    to: number;
  } | null>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const editorRef = useRef<RichEditorHandle>(null);

  useEffect(() => {
    (editorContentRef as React.MutableRefObject<string>).current = initialContent;
  }, [initialContent, editorContentRef]);

  useEffect(() => {
    setEditing(isDraft);
  }, [isDraft]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await apiClient.listPolicyComments(policy.id);
      setComments(res.data);
    } catch {
      setComments([]);
    }
  }, [policy.id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleContentChange = useCallback(
    (html: string) => {
      (editorContentRef as React.MutableRefObject<string>).current = html;
    },
    [editorContentRef],
  );

  const handleAutoSave = useCallback(
    async (html: string) => {
      setSaveStatus("saving");
      try {
        await apiClient.savePolicyContent(policy.id, html);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    },
    [policy.id],
  );

  const handleComment = useCallback((selectedText: string, from: number, to: number) => {
    setCommentHighlight({ text: selectedText, from, to });
    setCommentsOpen(true);
    setShowCommentForm(true);
  }, []);

  async function submitComment() {
    if (!newComment.trim()) return;
    setCommentSubmitting(true);
    try {
      await apiClient.createPolicyComment(policy.id, {
        content: newComment.trim(),
        policyVersionId: currentVersion?.id,
        highlightedText: commentHighlight?.text,
        fromPos: commentHighlight?.from,
        toPos: commentHighlight?.to,
      });
      setNewComment("");
      setCommentHighlight(null);
      setShowCommentForm(false);
      fetchComments();
    } catch {
      /* silent */
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function resolveComment(commentId: string) {
    try {
      await apiClient.resolvePolicyComment(policy.id, commentId);
      fetchComments();
    } catch {
      /* silent */
    }
  }

  async function replyToComment(parentId: string, content: string) {
    try {
      await apiClient.createPolicyComment(policy.id, { content, parentId });
      fetchComments();
    } catch {
      /* silent */
    }
  }

  async function editComment(commentId: string, content: string) {
    try {
      await apiClient.updatePolicyComment(policy.id, commentId, content);
      fetchComments();
    } catch {
      /* silent */
    }
  }

  async function deleteComment(commentId: string) {
    try {
      await apiClient.deletePolicyComment(policy.id, commentId);
      fetchComments();
    } catch {
      /* silent */
    }
  }

  const currentUserId = apiClient.getCurrentUserId();

  const handleAiGenerate = useCallback(
    async (prompt: string, context: string, action: string): Promise<string | null> => {
      try {
        // Pass the user-selected action through unchanged. The previous
        // `action: action as "generate"` cast silently lost rewrite/expand/
        // summarize/improve at the type layer (they still flowed through
        // at runtime, but TS was misleading).
        const res = await apiClient.generatePolicyContent(policy.id, {
          prompt,
          context,
          action: action as "generate" | "rewrite" | "expand" | "summarize" | "improve",
        });
        return res.data.content;
      } catch {
        return null;
      }
    },
    [policy.id],
  );

  // ── AI draft-from-context (Phase 1: AI accelerators) ────────────────
  // Triggered from the toolbar above the editor. The result is shown in
  // a modal with a diff against the current version; only the user's
  // explicit Accept creates a new PolicyVersion via savePolicyContent().
  const [aiProposalOpen, setAiProposalOpen] = useState(false);
  const [aiProposal, setAiProposal] = useState<PolicyDraftFromContext | null>(null);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleDraftFromContext = useCallback(async () => {
    setAiDrafting(true);
    setAiError(null);
    try {
      const res = await apiClient.draftPolicyFromContext(policy.id);
      setAiProposal(res.data);
      setAiProposalOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate AI draft";
      // Surface a friendlier hint when AI is not configured at the
      // operator/org level so the user knows to head to settings.
      setAiError(
        /not configured/i.test(msg)
          ? "AI is not configured. Visit Settings → AI to choose a provider."
          : msg,
      );
    } finally {
      setAiDrafting(false);
    }
  }, [policy.id]);

  const handleAcceptAiProposal = useCallback(
    async (acceptedHtml: string) => {
      // savePolicyContent creates a new draft version when the policy
      // is in draft status, or updates the current draft. Reuses the
      // existing autosave path so we don't introduce a new write code path.
      await apiClient.savePolicyContent(policy.id, acceptedHtml);
      (editorContentRef as React.MutableRefObject<string>).current = acceptedHtml;
      // Force the editor to pick up the new content on next render via
      // a router refresh — cheap and correct, avoids juggling editor
      // imperative APIs that don't have a public "set content" handle.
      window.location.reload();
    },
    [policy.id, editorContentRef],
  );

  const handleCommentClick = useCallback((comment: PolicyCommentData) => {
    if (comment.fromPos != null && comment.toPos != null) {
      setActiveCommentId(comment.id);
      setCommentsOpen(true);
      editorRef.current?.scrollToRange(comment.fromPos, comment.toPos);
    }
  }, []);

  const handleCommentDeselect = useCallback(() => {
    setActiveCommentId(null);
    editorRef.current?.clearHighlight();
  }, []);

  const handleImportFile = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        const res = await apiClient.importPolicyFile(policy.id, file);
        return res.data.html;
      } catch {
        return null;
      }
    },
    [policy.id],
  );

  const showReadOnly = !editing && !isDraft;
  const infoIcon = (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  );
  const unresolvedCount = comments.filter((c) => !c.resolved).length;

  return (
    <div className={`relative ${commentsOpen ? "flex gap-4" : ""}`}>
      {/* Editor column */}
      <div className="min-w-0 flex-1 space-y-3">
        {/* Save status */}
        {editing && saveStatus !== "idle" && (
          <div className="flex items-center gap-2 text-xs">
            {saveStatus === "saving" && <span className="text-amber-500">Saving…</span>}
            {saveStatus === "saved" && <span className="text-emerald-500">Saved</span>}
            {saveStatus === "error" && <span className="text-red-500">Save failed</span>}
          </div>
        )}

        {showReadOnly && policy.status === "approved" && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {infoIcon} This policy is <strong>approved</strong>. Use <strong>Edit Policy</strong>{" "}
            above to make changes.
          </div>
        )}
        {showReadOnly && (policy.status === "published" || policy.status === "archived") && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
            {infoIcon} This policy is <strong>published</strong> and read-only. Use{" "}
            <strong>Duplicate as Draft</strong> above.
          </div>
        )}
        {showReadOnly && policy.status === "pending_approval" && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
            {infoIcon} This policy is <strong>pending approval</strong>. Content is locked until
            reviewed.
          </div>
        )}

        {/* AI draft-from-context toolbar — only when editing a draft. */}
        {editing && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-xs dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex items-start gap-2 text-blue-800 dark:text-blue-200">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.158c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.286 3.957c.3.922-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.176 0l-3.366 2.446c-.784.57-1.838-.196-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.158a1 1 0 00.95-.69L9.049 2.927z" />
              </svg>
              <div>
                <div className="font-semibold">
                  Draft this policy from your organisation context
                </div>
                <div className="opacity-75">
                  Replaces every{" "}
                  <code className="rounded bg-white/60 px-1 dark:bg-neutral-900/60">
                    [[PLACEHOLDER]]
                  </code>{" "}
                  with content tailored from <em>Settings → AI Context</em>. You will see a diff
                  before anything is saved.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {aiError && <span className="text-red-600 dark:text-red-400">{aiError}</span>}
              <Button size="sm" onClick={handleDraftFromContext} loading={aiDrafting}>
                {aiDrafting ? "Drafting…" : "Generate from context"}
              </Button>
            </div>
          </div>
        )}

        <RichEditor
          ref={editorRef}
          content={initialContent}
          onChange={editing ? handleContentChange : undefined}
          onSave={editing ? handleAutoSave : undefined}
          onComment={handleComment}
          onAiGenerate={editing ? handleAiGenerate : undefined}
          onImportFile={editing ? handleImportFile : undefined}
          editable={editing}
          placeholder="Type '/' for commands, or start writing…"
        />

        <AIProposalModal
          open={aiProposalOpen}
          draft={aiProposal}
          baseHtml={initialContent}
          onAccept={handleAcceptAiProposal}
          onClose={() => setAiProposalOpen(false)}
        />
      </div>

      {/* Comments toggle button — always visible when sidebar is hidden */}
      {!commentsOpen && (
        <button
          type="button"
          onClick={() => setCommentsOpen(true)}
          title="Show comments"
          className="absolute right-2 top-1 flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-500 shadow-sm transition-colors hover:bg-neutral-50 hover:text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 01-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 01-1.33 0l-1.713-3.293a.75.75 0 00-.642-.413 41.108 41.108 0 01-3.55-.414C1.993 13.245 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902z"
              clipRule="evenodd"
            />
          </svg>
          {unresolvedCount > 0 && (
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-900 dark:text-blue-300">
              {unresolvedCount}
            </span>
          )}
        </button>
      )}

      {/* Comments sidebar — only rendered when open */}
      {commentsOpen && (
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-4 space-y-3">
            {/* Header with close button */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M3.43 2.524A41.29 41.29 0 0110 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.102 41.102 0 01-3.55.414c-.28.02-.521.18-.643.413l-1.712 3.293a.75.75 0 01-1.33 0l-1.713-3.293a.75.75 0 00-.642-.413 41.108 41.108 0 01-3.55-.414C1.993 13.245 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902z"
                    clipRule="evenodd"
                  />
                </svg>
                Comments
                {unresolvedCount > 0 && (
                  <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                    {unresolvedCount}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCommentsOpen(false);
                  handleCommentDeselect();
                }}
                title="Hide comments"
                className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {/* New comment form — shown via + button or bubble menu */}
            {showCommentForm ? (
              <div className="rounded-lg border border-blue-200 bg-white p-3 dark:border-blue-800 dark:bg-neutral-900">
                {commentHighlight && (
                  <div className="mb-2 flex items-start gap-1.5 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    <svg
                      className="mt-0.5 h-3 w-3 flex-shrink-0 opacity-60"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.274 1.765 11.28 11.28 0 00.757.433c.12.063.218.11.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      &ldquo;{commentHighlight.text.slice(0, 80)}
                      {commentHighlight.text.length > 80 ? "…" : ""}&rdquo;
                    </span>
                  </div>
                )}
                <textarea
                  autoFocus
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment…"
                  rows={2}
                  className="w-full resize-none rounded border border-neutral-200 bg-transparent px-2.5 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none dark:border-neutral-600 dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitComment();
                    }
                  }}
                />
                <div className="mt-2 flex justify-end gap-2">
                  {commentHighlight && (
                    <button
                      type="button"
                      onClick={() => setCommentHighlight(null)}
                      className="text-xs text-neutral-400 hover:text-neutral-600"
                    >
                      Clear selection
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowCommentForm(false);
                      setCommentHighlight(null);
                      setNewComment("");
                    }}
                    className="text-xs text-neutral-400 hover:text-neutral-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitComment}
                    disabled={!newComment.trim() || commentSubmitting}
                    className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {commentSubmitting ? "…" : "Post"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCommentForm(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 py-2 text-xs text-neutral-400 transition-colors hover:border-blue-400 hover:text-blue-500 dark:border-neutral-600 dark:hover:border-blue-500 dark:hover:text-blue-400"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Add comment
              </button>
            )}

            {/* Comment threads */}
            {comments.length === 0 && !showCommentForm && (
              <p className="px-1 text-xs text-neutral-400">
                Select text and click the comment icon to add inline comments.
              </p>
            )}
            {comments.map((c) => (
              <CommentThread
                key={c.id}
                comment={c}
                policyId={policy.id}
                currentUserId={currentUserId}
                isActive={activeCommentId === c.id}
                onClick={handleCommentClick}
                onDeselect={handleCommentDeselect}
                onResolve={resolveComment}
                onReply={replyToComment}
                onEdit={editComment}
                onDelete={deleteComment}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const QUICK_EMOJIS = ["👍", "👎", "❤️", "😄", "🎉", "🤔", "👀", "🔥", "✅", "❌"];

function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
        title="Add emoji"
      >
        😀
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 flex gap-0.5 rounded-lg border border-neutral-200 bg-white p-1.5 shadow-lg dark:border-neutral-600 dark:bg-neutral-800">
          {QUICK_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                onSelect(e);
                setOpen(false);
              }}
              className="flex h-7 w-7 items-center justify-center rounded text-base transition-transform hover:scale-125 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentThread({
  comment,
  currentUserId,
  isActive,
  onClick,
  onDeselect,
  onResolve,
  onReply,
  onEdit,
  onDelete,
}: {
  comment: PolicyCommentData;
  policyId: string;
  currentUserId: string | null;
  isActive: boolean;
  onClick: (comment: PolicyCommentData) => void;
  onDeselect: () => void;
  onResolve: (id: string) => void;
  onReply: (parentId: string, content: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const hasPosition = comment.fromPos != null && comment.toPos != null;
  const isOwner = currentUserId === comment.user.id;

  function handleSaveEdit() {
    if (editText.trim() && editText.trim() !== comment.content) {
      onEdit(comment.id, editText.trim());
    }
    setEditing(false);
  }

  function insertEmoji(emoji: string) {
    if (editing) setEditText((t) => t + emoji);
    else if (showReply) setReplyText((t) => t + emoji);
  }

  return (
    <div
      className={`group rounded-lg border p-3 text-sm transition-all ${
        isActive
          ? "border-amber-300 bg-amber-50/50 ring-1 ring-amber-200 dark:border-amber-700 dark:bg-amber-900/20 dark:ring-amber-800"
          : comment.resolved
            ? "border-neutral-100 bg-neutral-50 opacity-60 dark:border-neutral-800 dark:bg-neutral-800/30"
            : "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
      }`}
    >
      {comment.highlightedText && (
        <button
          type="button"
          onClick={() => {
            if (isActive) onDeselect();
            else onClick(comment);
          }}
          className={`mb-2 w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
            hasPosition
              ? "cursor-pointer border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
              : "cursor-default bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
          }`}
        >
          <span className="flex items-center gap-1.5">
            {hasPosition && (
              <svg
                className="h-3 w-3 flex-shrink-0 opacity-60"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.274 1.765 11.28 11.28 0 00.757.433c.12.063.218.11.281.14l.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>
              &ldquo;{comment.highlightedText.slice(0, 100)}
              {comment.highlightedText.length > 100 ? "…" : ""}&rdquo;
            </span>
          </span>
        </button>
      )}
      <div className="flex items-start gap-2">
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          {comment.user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
              {comment.user.name}
            </span>
            <span className="text-[10px] text-neutral-400">{timeAgo(comment.createdAt)}</span>
            {isOwner && !editing && (
              <span className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    setEditText(comment.content);
                  }}
                  className="rounded p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                  title="Edit"
                >
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded p-0.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  title="Delete"
                >
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </span>
            )}
          </div>
          {editing ? (
            <div className="mt-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="w-full resize-none rounded border border-blue-300 bg-transparent px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400 dark:border-blue-700"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                  if (e.key === "Escape") setEditing(false);
                }}
              />
              <div className="mt-1 flex items-center gap-2">
                <EmojiPicker onSelect={insertEmoji} />
                <div className="ml-auto flex gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded px-2 py-0.5 text-[10px] text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="rounded bg-blue-600 px-2 py-0.5 text-[10px] text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 text-neutral-700 dark:text-neutral-300">{comment.content}</p>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mt-2 flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs dark:border-red-800 dark:bg-red-900/30">
          <span className="flex-1 text-red-700 dark:text-red-300">Delete this comment?</span>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="rounded px-2 py-0.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onDelete(comment.id);
              setConfirmDelete(false);
            }}
            className="rounded bg-red-600 px-2 py-0.5 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      )}

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="ml-8 mt-2 space-y-2 border-l-2 border-neutral-100 pl-3 dark:border-neutral-700">
          {comment.replies.map((r) => (
            <div key={r.id} className="flex items-start gap-2">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[9px] font-semibold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                {r.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <span className="text-[10px] font-medium text-neutral-700 dark:text-neutral-300">
                  {r.user.name}
                </span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">{r.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {!comment.resolved && !editing && (
        <div className="mt-2 flex items-center gap-2 border-t border-neutral-100 pt-2 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => setShowReply(!showReply)}
            className="text-[11px] text-blue-600 hover:text-blue-800 dark:text-blue-400"
          >
            Reply
          </button>
          <button
            type="button"
            onClick={() => onResolve(comment.id)}
            className="text-[11px] text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
          >
            Resolve
          </button>
          <EmojiPicker onSelect={(emoji) => onReply(comment.id, emoji)} />
        </div>
      )}
      {comment.resolved && comment.resolvedBy && (
        <p className="mt-1 text-[10px] text-emerald-500">Resolved by {comment.resolvedBy.name}</p>
      )}

      {showReply && (
        <div className="mt-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply…"
              className="flex-1 rounded border border-neutral-200 bg-transparent px-2 py-1 text-xs dark:border-neutral-600"
              onKeyDown={(e) => {
                if (e.key === "Enter" && replyText.trim()) {
                  onReply(comment.id, replyText.trim());
                  setReplyText("");
                  setShowReply(false);
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (replyText.trim()) {
                  onReply(comment.id, replyText.trim());
                  setReplyText("");
                  setShowReply(false);
                }
              }}
              className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
            >
              Send
            </button>
          </div>
          <div className="mt-1">
            <EmojiPicker onSelect={insertEmoji} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Versions Tab ─────────────────────────────────────────────

function VersionsTab({ policyId }: { policyId: string }) {
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // When a user clicks "Compare with v(N-1)" we render the diff in
  // place inside the version card. Only one comparison at a time —
  // cheaper than letting the user open multiple side-by-sides.
  const [diffingId, setDiffingId] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.listPolicyVersions(policyId);
      setVersions(res.data);
    } catch {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [policyId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Version History
        </h3>
        <p className="text-xs text-neutral-400">
          {versions.length} version{versions.length !== 1 ? "s" : ""}
        </p>
      </div>

      {versions.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-500">
              No versions yet. Go to the <strong>Policy</strong> tab to start writing.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {versions.map((v, idx) => {
            const isDraft = idx === 0 && !v.approvedAt;
            const isPublished = v.approvedAt != null;
            // Adjacent older version for the "Compare with v(N-1)" diff.
            // versions[] is ordered newest-first by the API.
            const previous = versions[idx + 1];
            return (
              <Card key={v.id}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                          Version {v.versionNumber}
                        </span>
                        {idx === 0 && <Badge variant="success">Current</Badge>}
                        {isDraft && <Badge variant="neutral">Draft</Badge>}
                        {isPublished && <Badge variant="info">Approved</Badge>}
                      </div>
                      {v.changeNotes && (
                        <p className="mt-1 text-sm text-neutral-500">{v.changeNotes}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-neutral-400">
                        <span>By {v.createdBy.name}</span>
                        <span>{formatDateTime(v.createdAt)}</span>
                        {v.approvedBy && (
                          <span>
                            Approved by {v.approvedBy.name} on {formatDate(v.approvedAt)}
                          </span>
                        )}
                        {v._count?.acknowledgments !== undefined && (
                          <span>
                            {v._count.acknowledgments} ack
                            {v._count.acknowledgments !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {previous && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDiffingId(diffingId === v.id ? null : v.id);
                            setExpandedId(null);
                          }}
                        >
                          {diffingId === v.id
                            ? "Hide diff"
                            : `Compare with v${previous.versionNumber}`}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setExpandedId(expandedId === v.id ? null : v.id);
                          setDiffingId(null);
                        }}
                      >
                        {expandedId === v.id ? "Hide" : "View"}
                      </Button>
                    </div>
                  </div>
                  {expandedId === v.id && (
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(v.content) }}
                      />
                    </div>
                  )}
                  {diffingId === v.id && previous && (
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                      <PolicyDiff
                        beforeHtml={previous.content}
                        afterHtml={v.content}
                        beforeLabel={`v${previous.versionNumber}`}
                        afterLabel={`v${v.versionNumber}`}
                      />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Controls Tab ─────────────────────────────────────────────

function ControlsTab({ policyId, onSaved }: { policyId: string; onSaved: () => void }) {
  const [mappings, setMappings] = useState<PolicyControlMapping[]>([]);
  const [allControls, setAllControls] = useState<Control[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMappings = useCallback(async () => {
    try {
      const res = await apiClient.getPolicyControls(policyId);
      setMappings(res.data);
      setSelected(new Set(res.data.map((m) => m.controlId)));
    } catch {
      setMappings([]);
    }
  }, [policyId]);

  const fetchControls = useCallback(async () => {
    try {
      const res = await apiClient.listControls({ limit: "100" });
      setAllControls(res.data.items);
    } catch {
      setAllControls([]);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchMappings(), fetchControls()]).finally(() => setLoading(false));
  }, [fetchMappings, fetchControls]);

  function toggleControl(controlId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(controlId)) next.delete(controlId);
      else next.add(controlId);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const res = await apiClient.updatePolicyControls(policyId, [...selected]);
      setMappings(res.data);
      setSaveSuccess(true);
      setEditMode(false);
      onSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  const lowerSearch = searchTerm.toLowerCase();
  const filteredControls = searchTerm
    ? allControls.filter(
        (c) =>
          c.title.toLowerCase().includes(lowerSearch) ||
          (c.category || "").toLowerCase().includes(lowerSearch),
      )
    : allControls;
  const controlsByCategory = new Map<string, Control[]>();
  for (const c of filteredControls) {
    const cat = c.category || "Uncategorized";
    if (!controlsByCategory.has(cat)) controlsByCategory.set(cat, []);
    controlsByCategory.get(cat)!.push(c);
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Linked Controls
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              {mappings.length} control{mappings.length !== 1 ? "s" : ""} linked
            </p>
          </div>
          <Button
            size="sm"
            variant={editMode ? "secondary" : "primary"}
            onClick={() => {
              if (editMode) {
                setSelected(new Set(mappings.map((m) => m.controlId)));
                setEditMode(false);
              } else setEditMode(true);
            }}
          >
            {editMode ? "Cancel" : "Edit Mappings"}
          </Button>
        </div>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
      {saveSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Control mappings saved.
        </div>
      )}

      {!editMode ? (
        mappings.length > 0 && (
          <Card padding="none">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Control</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Category</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {mappings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.control.title}</TableCell>
                    <TableCell>
                      <Badge variant={CONTROL_STATUS_BADGE[m.control.status].variant}>
                        {CONTROL_STATUS_BADGE[m.control.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{m.control.category || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      ) : (
        <Card>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Map Controls
                </h3>
                <span className="text-xs text-neutral-500">{selected.size} selected</span>
              </div>
              <Button loading={saving} onClick={handleSave}>
                Save Mappings
              </Button>
            </div>
            <Input
              id="ctrl-search"
              placeholder="Search controls…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
              {[...controlsByCategory.entries()].map(([cat, controls]) => (
                <div
                  key={cat}
                  className="border-b border-neutral-200 last:border-b-0 dark:border-neutral-700"
                >
                  <div className="bg-neutral-50 px-4 py-2 dark:bg-neutral-800/50">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      {cat}
                    </p>
                  </div>
                  {controls.map((ctrl) => (
                    <label
                      key={ctrl.id}
                      className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(ctrl.id)}
                        onChange={() => toggleControl(ctrl.id)}
                        className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          {ctrl.title}
                        </span>
                      </div>
                      <Badge variant={CONTROL_STATUS_BADGE[ctrl.status].variant}>
                        {CONTROL_STATUS_BADGE[ctrl.status].label}
                      </Badge>
                    </label>
                  ))}
                </div>
              ))}
              {filteredControls.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-neutral-400">
                  {searchTerm ? "No controls match your search." : "No controls found."}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Request Changes Modal ────────────────────────────────────

function RequestChangesModal({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (notes: string) => void;
  loading: boolean;
}) {
  const [notes, setNotes] = useState("");
  return (
    <Modal open onClose={onClose} title="Request Changes" size="md">
      <div className="space-y-4">
        <p className="text-sm text-neutral-500">
          Describe the changes needed. The policy will be moved back to Draft status.
        </p>
        <Textarea
          id="change-notes"
          label="Change Notes *"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe what needs to change…"
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={loading}
            disabled={!notes.trim()}
            onClick={() => onSubmit(notes.trim())}
          >
            Request Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────

function DeletePolicyModal({
  policy,
  onClose,
  onDeleted,
}: {
  policy: PolicyDetail | null;
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
      setError(err instanceof Error ? err.message : "Failed to delete");
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
          Delete <strong className="text-neutral-900 dark:text-white">{policy.title}</strong>? All
          versions, controls, and acknowledgments will be removed. This cannot be undone.
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

// ─── Helpers ──────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-12">
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
