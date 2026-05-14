"use client";

/**
 * DPIAs — Data Protection Impact Assessments (GDPR Art. 35).
 *
 * Each DPIA is bound to exactly one ProcessingActivity. The lifecycle
 *   draft → in_review → approved | rejected ↺ draft
 * is enforced server-side; this page surfaces the available transitions as
 * action buttons in the detail drawer.
 *
 * Notable UX decisions:
 *   - "Necessity" is a first-class field (required / recommended / not_required)
 *     so DPIA-skip decisions are still recorded and auditable.
 *   - Approval requires an `approver` user (auto-stamped from the current
 *     session by the API), enforcing the Art. 35(2) DPO consultation duty.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoDrawer } from "@/components/ui/info-drawer";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  apiClient,
  type CreateDPIAInput,
  type DPIA,
  type DPIANecessity,
  type DPIAStatus,
  type PrivacyStats,
  type ProcessingActivity,
} from "@/lib/api-client";
import {
  AlertIcon,
  DetailField,
  DetailGrid,
  DetailLong,
  EmptyState,
  FlameIcon,
  FormSection,
  KpiCard,
  ListIcon,
  PlusIcon,
  ShieldIcon,
  SortableHeader,
  SpinnerIcon,
  formatDate,
  type SortDir,
} from "../_components";
import {
  DPIA_NECESSITY_BADGE,
  DPIA_NECESSITY_OPTIONS,
  DPIA_STATUS_BADGE,
  DPIA_STATUS_OPTIONS,
  RESIDUAL_RISK_BADGE,
  RESIDUAL_RISK_OPTIONS,
  lawfulBasisLabel,
} from "../_constants";

const SORTABLE = new Set(["title", "createdAt", "updatedAt", "status", "approvedAt"]);

const TRANSITIONS: Record<DPIAStatus, ("submit" | "approve" | "reject" | "reopen")[]> = {
  draft: ["submit"],
  in_review: ["approve", "reject"],
  approved: ["reopen"],
  rejected: ["reopen"],
};

const TRANSITION_LABELS: Record<"submit" | "approve" | "reject" | "reopen", string> = {
  submit: "Submit for review",
  approve: "Approve",
  reject: "Reject",
  reopen: "Reopen as draft",
};

export default function DPIAsPage() {
  const search = useSearchParams();
  const focusId = search.get("id");
  const presetActivityId = search.get("processingActivityId");
  const newPreset = search.get("new");

  const [items, setItems] = useState<DPIA[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [necessityFilter, setNecessityFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState("");

  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [stats, setStats] = useState<PrivacyStats | null>(null);
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<DPIA | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
        sortBy,
        sortDir,
      };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (necessityFilter) params.necessity = necessityFilter;
      if (activityFilter) params.processingActivityId = activityFilter;
      const res = await apiClient.listDPIAs(params);
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortDir, searchTerm, statusFilter, necessityFilter, activityFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  useEffect(() => {
    apiClient
      .getPrivacyStats()
      .then((r) => setStats(r.data))
      .catch(() => setStats(null));
    apiClient
      .listProcessingActivities({ page: "1", limit: "200" })
      .then((r) => setActivities(r.data.items))
      .catch(() => setActivities([]));
  }, []);

  // Deep-link from the RoPA "Start a DPIA" suggestion
  useEffect(() => {
    if (newPreset === "1" && presetActivityId) setCreateOpen(true);
  }, [newPreset, presetActivityId]);

  // Deep-link "?id=XXX" — open detail drawer for that DPIA
  useEffect(() => {
    if (!focusId) return;
    const found = items.find((x) => x.id === focusId);
    if (found) setActive(found);
    else
      apiClient
        .getDPIA(focusId)
        .then((r) => setActive(r.data))
        .catch(() => {});
  }, [focusId, items]);

  const refresh = useCallback(() => {
    fetchItems();
    apiClient
      .getPrivacyStats()
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, [fetchItems]);

  const totalPages = Math.ceil(total / limit);
  const filtersActive = Boolean(searchTerm || statusFilter || necessityFilter || activityFilter);
  const activityOpts = useMemo(
    () => activities.map((a) => ({ value: a.id, label: a.name })),
    [activities],
  );

  function toggleSort(c: string) {
    if (!SORTABLE.has(c)) return;
    if (sortBy === c) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(c);
      setSortDir("desc");
    }
    setPage(1);
  }
  const sortDirFor = (c: string): SortDir | null => (sortBy === c ? sortDir : null);

  const dpiaStats = stats?.dpias;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
          Article 35 Data Protection Impact Assessments. Required when processing is likely to
          result in high risk — large-scale special category data, systematic monitoring, automated
          decision-making. Each DPIA is tied to a Processing Activity.
        </p>
        <Button onClick={() => setCreateOpen(true)} disabled={activities.length === 0}>
          <PlusIcon />
          New DPIA
        </Button>
      </div>

      {dpiaStats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <KpiCard
            icon={<ListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            tone="blue"
            value={dpiaStats.total}
            label="Total DPIAs"
          />
          <KpiCard
            icon={<AlertIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            tone="amber"
            value={dpiaStats.byStatus.in_review ?? 0}
            label="In review"
          />
          <KpiCard
            icon={<ShieldIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            tone="emerald"
            value={dpiaStats.byStatus.approved ?? 0}
            label="Approved"
          />
          <KpiCard
            icon={<FlameIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
            tone="red"
            value={dpiaStats.byStatus.rejected ?? 0}
            label="Rejected"
            valueClass={(dpiaStats.byStatus.rejected ?? 0) > 0 ? "text-red-600" : undefined}
          />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-72">
          <Input
            id="dpia-search"
            placeholder="Search title…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            id="dpia-status"
            options={DPIA_STATUS_OPTIONS}
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
            id="dpia-necessity"
            options={DPIA_NECESSITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            placeholder="Any necessity"
            value={necessityFilter}
            onChange={(e) => {
              setNecessityFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-64">
          <Select
            id="dpia-activity"
            options={activityOpts}
            placeholder="Any processing activity"
            value={activityFilter}
            onChange={(e) => {
              setActivityFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
              setNecessityFilter("");
              setActivityFilter("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
        <span className="ml-auto pb-2 text-sm text-neutral-500 dark:text-neutral-400">
          {total} {total === 1 ? "DPIA" : "DPIAs"}
        </span>
      </div>

      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <SpinnerIcon />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            filtered={filtersActive}
            title={activities.length === 0 ? "Add a processing activity first" : "No DPIAs yet"}
            hint={
              activities.length === 0
                ? "DPIAs are bound to a processing activity. Create one in the Records of Processing tab."
                : "Use the New DPIA button when an activity hits the high-risk threshold."
            }
            cta={
              activities.length > 0 ? (
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  Start first DPIA
                </Button>
              ) : null
            }
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <SortableHeader
                  label="Title"
                  column="title"
                  current={sortDirFor("title")}
                  onClick={toggleSort}
                />
                <TableHeader>Activity</TableHeader>
                <TableHeader>Necessity</TableHeader>
                <SortableHeader
                  label="Status"
                  column="status"
                  current={sortDirFor("status")}
                  onClick={toggleSort}
                />
                <TableHeader>Residual</TableHeader>
                <TableHeader>Assessor</TableHeader>
                <SortableHeader
                  label="Approved"
                  column="approvedAt"
                  current={sortDirFor("approvedAt")}
                  onClick={toggleSort}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((d) => {
                const stat = DPIA_STATUS_BADGE[d.status];
                const nec = DPIA_NECESSITY_BADGE[d.necessity];
                const res = d.residualRisk ? RESIDUAL_RISK_BADGE[d.residualRisk] : null;
                return (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    onClick={() => setActive(d)}
                  >
                    <TableCell>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {d.title}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{d.processingActivity?.name ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={nec.variant}>{nec.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stat.variant}>{stat.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {res ? (
                        <Badge variant={res.variant}>{res.label}</Badge>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {d.assessedBy?.name ?? <span className="italic text-neutral-400">—</span>}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(d.approvedAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <DPIAFormModal
        mode="create"
        open={createOpen}
        activities={activities}
        presetActivityId={presetActivityId}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          refresh();
        }}
      />

      <DPIADetailDrawer
        item={active}
        activities={activities}
        onClose={() => setActive(null)}
        onChanged={(updated) => {
          setActive(updated);
          refresh();
        }}
        onDeleted={() => {
          setActive(null);
          refresh();
          if (items.length === 1 && page > 1) setPage((p) => p - 1);
        }}
      />
    </div>
  );
}

// ── Form ─────────────────────────────────────────────────────────────────────

interface DPIAFormState {
  processingActivityId: string;
  title: string;
  necessity: DPIANecessity;
  necessityProportionality: string;
  riskToRights: string;
  mitigations: string;
  consultedDpo: boolean;
  consultedDataSubjects: boolean;
  residualRisk: "low" | "medium" | "high" | "";
  status: DPIAStatus;
}

const EMPTY_FORM: DPIAFormState = {
  processingActivityId: "",
  title: "",
  necessity: "required",
  necessityProportionality: "",
  riskToRights: "",
  mitigations: "",
  consultedDpo: false,
  consultedDataSubjects: false,
  residualRisk: "",
  status: "draft",
};

function toForm(d: DPIA): DPIAFormState {
  return {
    processingActivityId: d.processingActivityId,
    title: d.title,
    necessity: d.necessity,
    necessityProportionality: d.necessityProportionality ?? "",
    riskToRights: d.riskToRights ?? "",
    mitigations: d.mitigations ?? "",
    consultedDpo: d.consultedDpo,
    consultedDataSubjects: d.consultedDataSubjects,
    residualRisk: d.residualRisk ?? "",
    status: d.status,
  };
}

function DPIAFormModal({
  mode,
  open,
  initial,
  activities,
  presetActivityId,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  open: boolean;
  initial?: DPIA;
  activities: ProcessingActivity[];
  presetActivityId?: string | null;
  onClose: () => void;
  onSaved: (d: DPIA) => void;
}) {
  const [form, setForm] = useState<DPIAFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initial) {
      setForm(toForm(initial));
    } else {
      setForm({
        ...EMPTY_FORM,
        processingActivityId: presetActivityId ?? "",
      });
    }
  }, [open, initial, presetActivityId]);

  function patch<K extends keyof DPIAFormState>(k: K, v: DPIAFormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return setError("Title is required.");
    if (mode === "create" && !form.processingActivityId)
      return setError("Pick a processing activity.");
    setSaving(true);
    setError(null);
    try {
      const base: Omit<CreateDPIAInput, "processingActivityId"> = {
        title: form.title,
        necessity: form.necessity,
        necessityProportionality: form.necessityProportionality || null,
        riskToRights: form.riskToRights || null,
        mitigations: form.mitigations || null,
        consultedDpo: form.consultedDpo,
        consultedDataSubjects: form.consultedDataSubjects,
        residualRisk: form.residualRisk || null,
        status: form.status,
      };
      const res =
        mode === "create"
          ? await apiClient.createDPIA({ ...base, processingActivityId: form.processingActivityId })
          : await apiClient.updateDPIA(initial!.id, base);
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save DPIA.");
    } finally {
      setSaving(false);
    }
  }

  const activityOpts = useMemo(
    () => activities.map((a) => ({ value: a.id, label: a.name })),
    [activities],
  );
  const necessityOpts = DPIA_NECESSITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
  const residualOpts = [
    { value: "", label: "Not yet determined" },
    ...RESIDUAL_RISK_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "New DPIA" : "Edit DPIA"}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <FormSection title="Scope">
          <Select
            id="dpia-form-activity"
            label="Processing activity"
            required
            options={activityOpts}
            placeholder="Select an activity…"
            value={form.processingActivityId}
            onChange={(e) => patch("processingActivityId", e.target.value)}
            disabled={mode === "edit"}
          />
          <Input
            id="dpia-form-title"
            label="DPIA title"
            required
            placeholder="DPIA — automated CV screening for hiring"
            value={form.title}
            onChange={(e) => patch("title", e.target.value)}
          />
          <Select
            id="dpia-form-necessity"
            label="Necessity (Art. 35(1))"
            options={necessityOpts}
            value={form.necessity}
            onChange={(e) => patch("necessity", e.target.value as DPIANecessity)}
          />
        </FormSection>

        <FormSection
          title="Necessity and proportionality"
          description="Why this processing is necessary and proportionate to the purpose."
        >
          <Textarea
            id="dpia-form-prop"
            rows={3}
            value={form.necessityProportionality}
            onChange={(e) => patch("necessityProportionality", e.target.value)}
          />
        </FormSection>

        <FormSection title="Risks to data subjects">
          <Textarea
            id="dpia-form-risk"
            rows={4}
            placeholder="What harms could materialise? Discrimination, identity theft, loss of control over data…"
            value={form.riskToRights}
            onChange={(e) => patch("riskToRights", e.target.value)}
          />
        </FormSection>

        <FormSection title="Mitigations">
          <Textarea
            id="dpia-form-mit"
            rows={4}
            placeholder="Controls put in place to address the risks: pseudonymisation, human-in-loop, opt-out…"
            value={form.mitigations}
            onChange={(e) => patch("mitigations", e.target.value)}
          />
        </FormSection>

        <FormSection title="Consultations and outcome">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
                checked={form.consultedDpo}
                onChange={(e) => patch("consultedDpo", e.target.checked)}
              />
              DPO consulted (Art. 35(2))
            </label>
            <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
                checked={form.consultedDataSubjects}
                onChange={(e) => patch("consultedDataSubjects", e.target.checked)}
              />
              Data subjects consulted (Art. 35(9))
            </label>
          </div>
          <Select
            id="dpia-form-residual"
            label="Residual risk after mitigations"
            options={residualOpts}
            value={form.residualRisk}
            onChange={(e) =>
              patch("residualRisk", e.target.value as "" | "low" | "medium" | "high")
            }
          />
          {form.residualRisk === "high" && (
            <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              High residual risk requires prior consultation with the supervisory authority under
              Art. 36 before the processing begins.
            </div>
          )}
          <Select
            id="dpia-form-status"
            label="Status"
            options={DPIA_STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => patch("status", e.target.value as DPIAStatus)}
            disabled={mode === "create"}
          />
        </FormSection>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {mode === "create" ? "Create DPIA" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Detail drawer ────────────────────────────────────────────────────────────

function DPIADetailDrawer({
  item,
  activities,
  onClose,
  onChanged,
  onDeleted,
}: {
  item: DPIA | null;
  activities: ProcessingActivity[];
  onClose: () => void;
  onChanged: (d: DPIA) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    setEditing(false);
  }, [item?.id]);

  if (!item) return null;
  const stat = DPIA_STATUS_BADGE[item.status];
  const nec = DPIA_NECESSITY_BADGE[item.necessity];
  const res = item.residualRisk ? RESIDUAL_RISK_BADGE[item.residualRisk] : null;
  const allowed = TRANSITIONS[item.status] ?? [];
  const activity = item.processingActivity;
  const fullActivity = activities.find((a) => a.id === item.processingActivityId);

  async function transition(t: "submit" | "approve" | "reject" | "reopen") {
    if (!item) return;
    setActing(true);
    try {
      const r = await apiClient.transitionDPIA(item.id, t);
      onChanged(r.data);
    } finally {
      setActing(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm(`Delete DPIA "${item.title}"? This cannot be undone.`)) return;
    setActing(true);
    try {
      await apiClient.deleteDPIA(item.id);
      onDeleted(item.id);
    } catch {
      setActing(false);
    }
  }

  return (
    <>
      <InfoDrawer
        open={!!item && !editing}
        onClose={onClose}
        title={item.title}
        widthClassName="max-w-xl"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={stat.variant}>{stat.label}</Badge>
            <Badge variant={nec.variant}>{nec.label}</Badge>
            {res && <Badge variant={res.variant}>Residual: {res.label}</Badge>}
            {item.consultedDpo && <Badge variant="info">DPO consulted</Badge>}
            {item.consultedDataSubjects && <Badge variant="info">Subjects consulted</Badge>}
          </div>

          <DetailGrid>
            <DetailField label="Processing activity">
              {activity?.name ?? fullActivity?.name ?? "—"}
            </DetailField>
            <DetailField label="Lawful basis">
              {fullActivity ? lawfulBasisLabel(fullActivity.lawfulBasis) : "—"}
            </DetailField>
            <DetailField label="Assessed by">{item.assessedBy?.name ?? "—"}</DetailField>
            <DetailField label="Approved by">
              {item.approvedBy?.name ?? <span className="italic text-neutral-400">—</span>}
            </DetailField>
            <DetailField label="Approved at">{formatDate(item.approvedAt)}</DetailField>
            <DetailField label="Last updated">{formatDate(item.updatedAt)}</DetailField>
          </DetailGrid>

          {item.necessityProportionality && (
            <DetailLong title="Necessity & proportionality">
              {item.necessityProportionality}
            </DetailLong>
          )}
          {item.riskToRights && (
            <DetailLong title="Risks to rights">{item.riskToRights}</DetailLong>
          )}
          {item.mitigations && <DetailLong title="Mitigations">{item.mitigations}</DetailLong>}

          {item.residualRisk === "high" && item.status === "approved" && (
            <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Approved with high residual risk. Confirm Art. 36 prior consultation with the
              supervisory authority is on file.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {allowed.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={t === "approve" ? "primary" : t === "reject" ? "danger" : "secondary"}
                loading={acting}
                onClick={() => transition(t)}
              >
                {TRANSITION_LABELS[t]}
              </Button>
            ))}
            <Button
              size="sm"
              variant="danger"
              loading={acting}
              onClick={handleDelete}
              className="ml-auto"
            >
              Delete
            </Button>
          </div>
        </div>
      </InfoDrawer>

      <DPIAFormModal
        mode="edit"
        open={editing}
        initial={item}
        activities={activities}
        onClose={() => setEditing(false)}
        onSaved={(updated) => {
          setEditing(false);
          onChanged(updated);
        }}
      />
    </>
  );
}
