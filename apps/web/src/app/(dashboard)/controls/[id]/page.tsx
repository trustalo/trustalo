"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  apiClient,
  type Control,
  type ControlStatus,
  type CreateControlInput,
  type EvidenceItem,
  type FrameworkType,
  type FrameworkWithRequirements,
  type OrgMember,
} from "@/lib/api-client";
import {
  EVIDENCE_STATUS_BADGE,
  EVIDENCE_TYPE_LABELS,
  formatDate,
  daysUntilExpiry,
  expiryBadge as expiryIndicator,
  TypeIcon,
  EvidenceFormModal,
  EvidenceDetailModal,
  DeleteEvidenceModal,
  ReviewEvidenceModal,
} from "@/components/evidence/evidence-modals";
import { CrossFrameworkBadges } from "@/components/control/CrossFrameworkBadges";
import { EvidenceAgentPanel } from "@/components/evidence/evidence-agent-panel";

const STATUS_OPTIONS = [
  { value: "not_implemented", label: "Not Implemented" },
  { value: "partially_implemented", label: "Partially Implemented" },
  { value: "implemented", label: "Implemented" },
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

function isPredefined(ctrl: Control) {
  return ctrl.controlRequirementAssignments && ctrl.controlRequirementAssignments.length > 0;
}

// ─── Detail Page ──────────────────────────────────────────────

export default function ControlDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const controlId = params.id;

  const [control, setControl] = useState<Control | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [catalog, setCatalog] = useState<FrameworkWithRequirements[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "evidence" | "frameworks">("details");

  const fetchControl = useCallback(async () => {
    try {
      const res = await apiClient.getControl(controlId);
      setControl(res.data);
    } catch {
      setError("Control not found");
    } finally {
      setLoading(false);
    }
  }, [controlId]);

  useEffect(() => {
    fetchControl();
  }, [fetchControl]);
  useEffect(() => {
    apiClient
      .listMembers()
      .then((r) => setMembers(r.data))
      .catch(() => {});
    apiClient
      .getFrameworkCatalog()
      .then((r) => setCatalog(r.data))
      .catch(() => {});
    apiClient
      .getControlCategories()
      .then((r) => {
        setCategoryOptions(r.data.map((c: string) => ({ value: c, label: c })));
      })
      .catch(() => {});
  }, []);

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

  if (error || !control) {
    return (
      <div className="py-32 text-center">
        <p className="text-lg text-neutral-500">{error || "Control not found"}</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push("/controls")}>
          Back to Controls
        </Button>
      </div>
    );
  }

  async function handleToggleApplicability() {
    // The early-return above handles the loading / not-found case, but
    // TS can't narrow `control` inside this closure (state setter
    // could in theory race), so re-check explicitly.
    if (!control) return;
    const newStatus = control.status === "not_applicable" ? "not_implemented" : "not_applicable";
    try {
      await apiClient.updateControl(control.id, { status: newStatus });
      fetchControl();
    } catch {
      /* ignore */
    }
  }

  const statusBadge = STATUS_BADGE[control.status];
  const fwBadges = getFrameworkBadges(control);
  const evHealth = getEvidenceHealth(control);
  const maturityChip = getMaturityChip(control);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/controls")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back to Controls
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{control.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              <Badge variant={evHealth.variant}>{evHealth.label}</Badge>
              {fwBadges.map((b) => (
                <Badge key={b.type} variant={b.variant}>
                  {b.label} ({b.count})
                </Badge>
              ))}
              {maturityChip && (
                <Badge variant="neutral" title="Maturity level">
                  {maturityChip}
                </Badge>
              )}
              {control.category && (
                <span className="text-sm text-neutral-500">{control.category}</span>
              )}
            </div>

            {(control.relatedRequirementsCount ?? 0) > 0 && (
              <div className="mt-3 flex items-start gap-2">
                <span className="pt-0.5 text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Also satisfies
                </span>
                <CrossFrameworkBadges
                  inline={control.relatedRequirements ?? []}
                  totalCount={control.relatedRequirementsCount ?? 0}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {isPredefined(control) ? (
              control.status === "not_applicable" ? (
                <Button variant="secondary" size="sm" onClick={handleToggleApplicability}>
                  Restore
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={handleToggleApplicability}>
                  Mark N/A
                </Button>
              )
            ) : (
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="-mb-px flex gap-6">
          {(["details", "evidence", "frameworks"] as const).map((tab) => {
            let label = "Control Details";
            if (tab === "evidence")
              label = `Evidence (${control._count?.evidence ?? control.evidence?.length ?? 0})`;
            if (tab === "frameworks")
              label = `Framework Mappings (${control.controlRequirementAssignments?.length || 0})`;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "details" && (
        <ControlDetailsTab
          control={control}
          members={members}
          categoryOptions={categoryOptions}
          onSaved={fetchControl}
        />
      )}
      {activeTab === "evidence" && (
        <EvidenceTab controlId={control.id} onCountChange={fetchControl} />
      )}
      {activeTab === "frameworks" && (
        <FrameworkMappingsTab control={control} catalog={catalog} onSaved={fetchControl} />
      )}

      {/* Metadata */}
      <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
        <div className="flex gap-8 text-xs text-neutral-400">
          <span>Created {formatDate(control.createdAt)}</span>
          <span>Last updated {formatDate(control.updatedAt)}</span>
          {control.lastReviewedAt && (
            <span>Last reviewed {formatDate(control.lastReviewedAt)}</span>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <DeleteConfirmModal
        control={deleteOpen ? control : null}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => router.push("/controls")}
      />
    </div>
  );
}

// ─── Control Details Tab ──────────────────────────────────────

function ControlDetailsTab({
  control,
  members,
  categoryOptions,
  onSaved,
}: {
  control: Control;
  members: OrgMember[];
  categoryOptions: { value: string; label: string }[];
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [title, setTitle] = useState(control.title);
  const [description, setDescription] = useState(control.description || "");
  const [implementationDetails, setImplementationDetails] = useState(
    control.implementationDetails || "",
  );
  const [status, setStatus] = useState<ControlStatus>(control.status);
  const [category, setCategory] = useState(control.category || "");
  const [ownerId, setOwnerId] = useState(control.ownerId || "");
  const [reviewDate, setReviewDate] = useState(
    control.reviewDate ? new Date(control.reviewDate).toISOString().split("T")[0] : "",
  );

  useEffect(() => {
    setTitle(control.title);
    setDescription(control.description || "");
    setImplementationDetails(control.implementationDetails || "");
    setStatus(control.status);
    setCategory(control.category || "");
    setOwnerId(control.ownerId || "");
    setReviewDate(
      control.reviewDate ? new Date(control.reviewDate).toISOString().split("T")[0] : "",
    );
  }, [control]);

  async function handleSave() {
    if (!title.trim()) {
      setSaveError("Title is required");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    const payload: CreateControlInput = {
      title: title.trim(),
      description: description.trim() || null,
      implementationDetails: implementationDetails.trim() || null,
      status,
      category: category || null,
      ownerId: ownerId || null,
      reviewDate: reviewDate || null,
    };
    try {
      await apiClient.updateControl(control.id, payload);
      setSaveSuccess(true);
      onSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const memberOptions = members.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` }));

  return (
    <Card>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Control Details
          </h3>
          <Button loading={saving} onClick={handleSave}>
            Save Changes
          </Button>
        </div>

        {saveError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Control saved successfully.
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
          placeholder="Brief description of this control…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            id="status"
            label="Status"
            options={STATUS_OPTIONS}
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            id="owner"
            label="Owner"
            options={memberOptions}
            placeholder="Select an owner…"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          />
          <Input
            id="reviewDate"
            label="Review Date"
            type="date"
            value={reviewDate}
            onChange={(e) => setReviewDate(e.target.value)}
          />
        </div>

        <Textarea
          id="implementationDetails"
          label="Implementation Details"
          placeholder="Describe how this control is implemented…"
          rows={6}
          value={implementationDetails}
          onChange={(e) => setImplementationDetails(e.target.value)}
        />
      </div>
    </Card>
  );
}

// ─── Framework Mappings Tab ───────────────────────────────────

function FrameworkMappingsTab({
  control,
  catalog,
  onSaved,
}: {
  control: Control;
  catalog: FrameworkWithRequirements[];
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const ids = new Set((control.controlRequirementAssignments || []).map((m) => m.requirementId));
    setSelected(ids);
    const expandedFws = new Set<string>();
    for (const m of control.controlRequirementAssignments || []) {
      expandedFws.add(m.requirement.framework.id);
    }
    setExpanded(expandedFws);
    setDirty(false);
  }, [control]);

  function toggle(reqId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(reqId)) next.delete(reqId);
      else next.add(reqId);
      return next;
    });
    setDirty(true);
  }

  function toggleFramework(fwId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(fwId)) next.delete(fwId);
      else next.add(fwId);
      return next;
    });
  }

  function selectAllInFramework(fw: FrameworkWithRequirements) {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = fw.requirements.every((r) => next.has(r.id));
      for (const r of fw.requirements) {
        if (allSelected) next.delete(r.id);
        else next.add(r.id);
      }
      return next;
    });
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      await apiClient.updateControlRequirementAssignments(control.id, [...selected]);
      setSaveSuccess(true);
      setDirty(false);
      onSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save mappings");
    } finally {
      setSaving(false);
    }
  }

  const lowerSearch = searchTerm.toLowerCase();

  // Summary of currently-mapped frameworks
  const mappingsByFramework = new Map<
    string,
    { name: string; type: FrameworkType; count: number }
  >();
  for (const m of control.controlRequirementAssignments || []) {
    const fw = m.requirement.framework;
    if (!mappingsByFramework.has(fw.id)) {
      mappingsByFramework.set(fw.id, { name: fw.name, type: fw.frameworkType, count: 0 });
    }
    mappingsByFramework.get(fw.id)!.count++;
  }

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Current Mappings
            </h3>
            {mappingsByFramework.size === 0 ? (
              <p className="mt-1 text-sm text-neutral-400">No framework requirements mapped yet.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {[...mappingsByFramework.values()].map((fw) => (
                  <Badge key={fw.type} variant={FW_BADGE[fw.type].variant}>
                    {fw.name} — {fw.count} requirement{fw.count !== 1 ? "s" : ""}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-neutral-500">
            {control.controlRequirementAssignments?.length || 0} total
          </span>
        </div>
      </Card>

      {/* Editor */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Select Requirements
              </h3>
              <span className="text-xs text-neutral-500">
                {selected.size} selected
                {dirty && <span className="ml-2 text-amber-500">(unsaved)</span>}
              </span>
            </div>
            <Button loading={saving} disabled={!dirty} onClick={handleSave}>
              Save Mappings
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}
          {saveSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Framework mappings saved successfully.
            </div>
          )}

          <Input
            id="fw-search"
            placeholder="Search requirements…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
            {catalog.map((fw) => {
              const filteredReqs = searchTerm
                ? fw.requirements.filter(
                    (r) =>
                      r.identifier.toLowerCase().includes(lowerSearch) ||
                      r.title.toLowerCase().includes(lowerSearch) ||
                      (r.category || "").toLowerCase().includes(lowerSearch),
                  )
                : fw.requirements;

              if (searchTerm && filteredReqs.length === 0) return null;

              const isExpanded = expanded.has(fw.id) || !!searchTerm;
              const selectedCount = fw.requirements.filter((r) => selected.has(r.id)).length;
              const allSelected = selectedCount === fw.requirements.length;

              return (
                <div
                  key={fw.id}
                  className="border-b border-neutral-200 last:border-b-0 dark:border-neutral-700"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    onClick={() => toggleFramework(fw.id)}
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className={`h-4 w-4 text-neutral-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <Badge variant={FW_BADGE[fw.frameworkType].variant}>
                        {FW_BADGE[fw.frameworkType].label}
                      </Badge>
                      <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        {fw.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs ${selectedCount > 0 ? "font-semibold text-blue-600 dark:text-blue-400" : "text-neutral-500"}`}
                    >
                      {selectedCount}/{fw.requirements.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-neutral-100 bg-neutral-50/50 px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900/50">
                      <button
                        type="button"
                        className="mb-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        onClick={() => selectAllInFramework(fw)}
                      >
                        {allSelected ? "Deselect all" : "Select all"}
                      </button>

                      {groupByCategory(filteredReqs).map(([cat, reqs]) => (
                        <div key={cat} className="mb-3">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                            {cat}
                          </p>
                          {reqs.map((req) => (
                            <label
                              key={req.id}
                              className="flex cursor-pointer items-start gap-2.5 rounded px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                            >
                              <input
                                type="checkbox"
                                checked={selected.has(req.id)}
                                onChange={() => toggle(req.id)}
                                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm">
                                <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                                  {req.identifier}
                                </span>
                                <span className="text-neutral-600 dark:text-neutral-400">
                                  {" "}
                                  — {req.title}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Evidence Tab ─────────────────────────────────────────────

function EvidenceTab({
  controlId,
  onCountChange,
}: {
  controlId: string;
  onCountChange: () => void;
}) {
  const router = useRouter();
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [formModalItem, setFormModalItem] = useState<EvidenceItem | null | "new">(null);
  const [detailTarget, setDetailTarget] = useState<EvidenceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EvidenceItem | null>(null);
  const [reviewModalItem, setReviewModalItem] = useState<EvidenceItem | null>(null);

  const limit = 10;

  const fetchEvidence = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.listEvidence({
        controlId,
        page: String(page),
        limit: String(limit),
      });
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [controlId, page]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  function handleFormSaved() {
    setFormModalItem(null);
    fetchEvidence();
    onCountChange();
  }

  async function handleSubmitForReview(id: string) {
    try {
      await apiClient.submitEvidenceForReview(id);
      fetchEvidence();
    } catch {
      /* ignore */
    }
  }

  async function handleRenew(id: string) {
    try {
      await apiClient.renewEvidence(id);
      fetchEvidence();
    } catch {
      /* ignore */
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Per-control collection mode (manual vs evidence agent) */}
      <EvidenceAgentPanel controlId={controlId} onRunCompleted={fetchEvidence} />

      {/* Summary */}
      <EvidenceHealthBanner items={items} total={total} />

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push(`/evidence?controlId=${controlId}`)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.75 3.5a.75.75 0 000 1.5h4.531a1 1 0 01.768.36l2.317 2.78a2.5 2.5 0 01-.04 3.22l-2.277 2.734a1 1 0 01-.768.36H4.75a.75.75 0 000 1.5h4.531a2.5 2.5 0 001.92-.9l2.277-2.733a4 4 0 00.064-5.152l-2.317-2.78A2.5 2.5 0 009.281 3.5H4.75z" />
            <path d="M14.25 6.249a.75.75 0 000 1.5h1a.75.75 0 000-1.5h-1zm0 6a.75.75 0 000 1.5h1a.75.75 0 000-1.5h-1z" />
          </svg>
          View in Evidence Library
        </button>
        <Button onClick={() => setFormModalItem("new")}>+ Add Evidence</Button>
      </div>

      {/* Evidence list */}
      {loading ? (
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
      ) : items.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-500">No evidence attached to this control yet.</p>
            <p className="mt-1 text-xs text-neutral-400">
              Click "Add Evidence" to attach documents, links, or attestations.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((ev) => {
            const statusBadge = EVIDENCE_STATUS_BADGE[ev.status];
            const expiry = expiryIndicator(ev.expiresAt);
            return (
              <Card key={ev.id}>
                <div
                  className="flex cursor-pointer items-start justify-between gap-4"
                  onClick={() => setDetailTarget(ev)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <TypeIcon type={ev.type} />
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {ev.title}
                      </h4>
                      <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      {expiry && <Badge variant={expiry.variant}>{expiry.label}</Badge>}
                      <Badge variant="neutral">{EVIDENCE_TYPE_LABELS[ev.type]}</Badge>
                    </div>
                    {ev.description && (
                      <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{ev.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-neutral-400">
                      <span>Submitted by {ev.submittedBy?.name ?? "Evidence Agent"}</span>
                      <span>Collected {formatDate(ev.collectedAt)}</span>
                      {ev.renewalFrequency && ev.renewalFrequency !== "once" && (
                        <span>Renews {ev.renewalFrequency.replace("_", "-")}</span>
                      )}
                      {ev.fileKey && ev.fileName && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-blue-500 hover:underline"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await apiClient.getEvidenceDownloadUrl(ev.id);
                              window.open(res.data.url, "_blank");
                            } catch {
                              /* ignore */
                            }
                          }}
                        >
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M3 3.5A1.5 1.5 0 014.5 2h6.879a1.5 1.5 0 011.06.44l3.122 3.12a1.5 1.5 0 01.439 1.061V16.5A1.5 1.5 0 0114.5 18h-10A1.5 1.5 0 013 16.5v-13z" />
                          </svg>
                          {ev.fileName}
                        </button>
                      )}
                      {ev.externalUrl && (
                        <a
                          href={ev.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-500 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                            <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                          </svg>
                          External link
                        </a>
                      )}
                      {ev.reviewedBy && (
                        <span>
                          Reviewed by {ev.reviewedBy.name} on {formatDate(ev.reviewedAt)}
                        </span>
                      )}
                    </div>
                    {ev.reviewNotes && (
                      <p className="mt-1 rounded bg-neutral-50 px-2 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        Review notes: {ev.reviewNotes}
                      </p>
                    )}
                    {ev.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ev.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div
                    className="flex flex-shrink-0 items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(ev.status === "draft" || ev.status === "rejected") && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSubmitForReview(ev.id)}
                      >
                        Submit for Review
                      </Button>
                    )}
                    {ev.status === "pending_review" && (
                      <Button size="sm" onClick={() => setReviewModalItem(ev)}>
                        Review
                      </Button>
                    )}
                    {(ev.status === "expired" || ev.status === "stale") &&
                      ev.renewalFrequency &&
                      ev.renewalFrequency !== "once" && (
                        <Button size="sm" onClick={() => handleRenew(ev.id)}>
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
                </div>
              </Card>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <p className="text-xs text-neutral-500">{total} total evidence items</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center text-xs text-neutral-500">
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
        </div>
      )}

      {/* Shared modals */}
      {formModalItem && (
        <EvidenceFormModal
          fixedControlId={controlId}
          evidence={formModalItem === "new" ? null : formModalItem}
          onClose={() => setFormModalItem(null)}
          onSaved={handleFormSaved}
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
            setReviewModalItem(ev);
          }}
          onSubmitForReview={async (id) => {
            await handleSubmitForReview(id);
            setDetailTarget(null);
          }}
          onRenew={async (id) => {
            await handleRenew(id);
            setDetailTarget(null);
          }}
        />
      )}

      {deleteTarget && (
        <DeleteEvidenceModal
          evidence={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            fetchEvidence();
            onCountChange();
          }}
        />
      )}

      {reviewModalItem && (
        <ReviewEvidenceModal
          evidence={reviewModalItem}
          onClose={() => setReviewModalItem(null)}
          onReviewed={() => {
            setReviewModalItem(null);
            fetchEvidence();
          }}
        />
      )}
    </div>
  );
}

function EvidenceHealthBanner({ items, total }: { items: EvidenceItem[]; total: number }) {
  const now = Date.now();
  const approved = items.filter(
    (e) => e.status === "approved" && (!e.expiresAt || new Date(e.expiresAt).getTime() > now),
  ).length;
  const expired = items.filter(
    (e) => e.status === "expired" || (e.expiresAt && new Date(e.expiresAt).getTime() < now),
  ).length;
  const pending = items.filter((e) => e.status === "pending_review").length;
  const expiringSoon = items.filter((e) => {
    if (!e.expiresAt || e.status === "expired") return false;
    const days = daysUntilExpiry(e.expiresAt);
    return days !== null && days >= 0 && days <= 30;
  }).length;

  if (total === 0) return null;

  return (
    <Card>
      <div className="flex flex-wrap gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{total}</p>
          <p className="text-xs text-neutral-500">Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-emerald-600">{approved}</p>
          <p className="text-xs text-neutral-500">Approved</p>
        </div>
        {pending > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{pending}</p>
            <p className="text-xs text-neutral-500">Pending Review</p>
          </div>
        )}
        {expiringSoon > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{expiringSoon}</p>
            <p className="text-xs text-neutral-500">Expiring Soon</p>
          </div>
        )}
        {expired > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{expired}</p>
            <p className="text-xs text-neutral-500">Expired</p>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────

function getFrameworkBadges(ctrl: Control) {
  if (!ctrl.controlRequirementAssignments || ctrl.controlRequirementAssignments.length === 0)
    return [];
  const seen = new Set<FrameworkType>();
  const badges: { type: FrameworkType; label: string; variant: BadgeVariant; count: number }[] = [];
  for (const m of ctrl.controlRequirementAssignments) {
    const ft = m.requirement.framework.frameworkType;
    if (!seen.has(ft)) {
      seen.add(ft);
      const info = FW_BADGE[ft];
      const count = ctrl.controlRequirementAssignments.filter(
        (x) => x.requirement.framework.frameworkType === ft,
      ).length;
      badges.push({ type: ft, ...info, count });
    }
  }
  return badges;
}

/** Highest maturity-level marker among the control's mapped requirements (e.g. "ML2"). */
function getMaturityChip(ctrl: Control): string | null {
  if (!ctrl.controlRequirementAssignments?.length) return null;
  const levels = ctrl.controlRequirementAssignments
    .map((m) => m.requirement.maturityLevel)
    .filter((v): v is string => Boolean(v));
  if (levels.length === 0) return null;
  const max = levels.sort().pop()!;
  if (/^ml\d+$/i.test(max)) return max.toUpperCase();
  if (/^tier\d+$/i.test(max)) return max.replace(/^tier/i, "Tier ");
  return max;
}

function groupByCategory(
  reqs: { id: string; identifier: string; title: string; category: string | null }[],
) {
  const groups = new Map<string, typeof reqs>();
  for (const r of reqs) {
    const cat = r.category || "General";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(r);
  }
  return [...groups.entries()];
}

function getEvidenceHealth(ctrl: Control): { label: string; variant: BadgeVariant } {
  const evidenceList = ctrl.evidence || [];
  if (evidenceList.length === 0) return { label: "No Evidence", variant: "danger" };

  const now = Date.now();
  const hasExpired = evidenceList.some(
    (e) => e.status === "expired" || (e.expiresAt && new Date(e.expiresAt).getTime() < now),
  );
  if (hasExpired) return { label: "Evidence Expired", variant: "danger" };

  const hasExpiringSoon = evidenceList.some((e) => {
    if (!e.expiresAt) return false;
    const days = Math.ceil((new Date(e.expiresAt).getTime() - now) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 30;
  });
  if (hasExpiringSoon) return { label: "Evidence Expiring Soon", variant: "warning" };

  const allApproved = evidenceList.every((e) => e.status === "approved");
  if (allApproved) return { label: "Evidence Up-to-date", variant: "success" };

  const hasPending = evidenceList.some((e) => e.status === "pending_review");
  if (hasPending) return { label: "Evidence Pending Review", variant: "warning" };

  return { label: `${evidenceList.length} Evidence`, variant: "neutral" };
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
