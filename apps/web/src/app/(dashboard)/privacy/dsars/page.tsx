"use client";

/**
 * Data Subject Access Requests (DSARs / DSRs) — GDPR Articles 12–22.
 *
 * Headline UX: a per-row SLA pill showing time-until-due against the 1-month
 * default deadline (Art. 12(3)) and the optional 2-month extension (Art. 12(3)
 * second sub-paragraph). Extensions are explicit user actions that update the
 * stored `extendedDueAt` and surface as a separate badge.
 *
 * Lifecycle:
 *   received → identity_pending? → in_progress → (extended?) → fulfilled | refused → closed
 */

import { useCallback, useEffect, useMemo, useState } from "react";
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
  type CreateDSARRequestInput,
  type DSARChannel,
  type DSARRequest,
  type DSARStatus,
  type DSARType,
  type OrgMember,
  type PrivacyStats,
  type ProcessingActivity,
} from "@/lib/api-client";
import {
  AlertIcon,
  ClockIcon,
  DetailField,
  DetailGrid,
  DetailLong,
  EmptyState,
  FormSection,
  KpiCard,
  ListIcon,
  PlusIcon,
  ShieldIcon,
  SortableHeader,
  SpinnerIcon,
  UserGroupIcon,
  formatDate,
  timeUntil,
  type SortDir,
} from "../_components";
import {
  DSAR_CHANNEL_OPTIONS,
  DSAR_STATUS_BADGE,
  DSAR_STATUS_OPTIONS,
  DSAR_TYPE_OPTIONS,
  OPEN_DSAR_STATUSES,
  dsarTypeLabel,
} from "../_constants";

const SORTABLE = new Set(["receivedAt", "dueAt", "extendedDueAt", "status", "updatedAt"]);

const NEXT_TRANSITIONS: Record<DSARStatus, DSARStatus[]> = {
  received: ["identity_pending", "in_progress", "refused", "closed"],
  identity_pending: ["in_progress", "refused", "closed"],
  in_progress: ["fulfilled", "refused", "closed"],
  extended: ["fulfilled", "refused", "closed"],
  fulfilled: ["closed"],
  refused: ["closed"],
  closed: [],
};

const TRANSITION_LABEL: Record<DSARStatus, string> = {
  received: "Mark received",
  identity_pending: "Request identity verification",
  in_progress: "Start work",
  extended: "Mark extended",
  fulfilled: "Fulfil",
  refused: "Refuse",
  closed: "Close",
};

export default function DSARsPage() {
  const [items, setItems] = useState<DSARRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [sortBy, setSortBy] = useState("receivedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [stats, setStats] = useState<PrivacyStats | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<DSARRequest | null>(null);

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
      if (typeFilter) params.requestType = typeFilter;
      if (openOnly) params.openOnly = "true";
      if (overdueOnly) params.overdueOnly = "true";
      const res = await apiClient.listDSARRequests(params);
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortDir, searchTerm, statusFilter, typeFilter, openOnly, overdueOnly]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  useEffect(() => {
    apiClient
      .getPrivacyStats()
      .then((r) => setStats(r.data))
      .catch(() => {});
    apiClient
      .listMembers()
      .then((r) => setMembers(r.data))
      .catch(() => setMembers([]));
    apiClient
      .listProcessingActivities({ page: "1", limit: "200" })
      .then((r) => setActivities(r.data.items))
      .catch(() => setActivities([]));
  }, []);

  const refresh = useCallback(() => {
    fetchItems();
    apiClient
      .getPrivacyStats()
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, [fetchItems]);

  const totalPages = Math.ceil(total / limit);
  const filtersActive = Boolean(
    searchTerm || statusFilter || typeFilter || openOnly || overdueOnly,
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

  const dsarStats = stats?.dsars;
  const openCount =
    (dsarStats?.byStatus.received ?? 0) +
    (dsarStats?.byStatus.identity_pending ?? 0) +
    (dsarStats?.byStatus.in_progress ?? 0) +
    (dsarStats?.byStatus.extended ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
          Data-subject rights queue (Art. 12–22). Default response window is one month from receipt;
          you may extend by two further months for complex requests, with a written explanation to
          the requester.
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          Log Request
        </Button>
      </div>

      {dsarStats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <KpiCard
            icon={<ListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            tone="blue"
            value={dsarStats.total}
            label="Total requests"
          />
          <KpiCard
            icon={<UserGroupIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            tone="amber"
            value={openCount}
            label="Open"
            valueClass={openCount > 0 ? "text-amber-600" : undefined}
          />
          <KpiCard
            icon={<AlertIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
            tone="red"
            value={dsarStats.overdue}
            label="Overdue"
            valueClass={dsarStats.overdue > 0 ? "text-red-600" : undefined}
          />
          <KpiCard
            icon={<ShieldIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            tone="emerald"
            value={dsarStats.byStatus.fulfilled ?? 0}
            label="Fulfilled"
          />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-72">
          <Input
            id="dsar-search"
            placeholder="Search subject name, email…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            id="dsar-status"
            options={DSAR_STATUS_OPTIONS}
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-56">
          <Select
            id="dsar-type"
            options={DSAR_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            placeholder="All request types"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
            checked={openOnly}
            onChange={(e) => {
              setOpenOnly(e.target.checked);
              setPage(1);
            }}
          />
          Open only
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-neutral-300 text-red-600 focus:ring-red-500 dark:border-neutral-700 dark:bg-neutral-900"
            checked={overdueOnly}
            onChange={(e) => {
              setOverdueOnly(e.target.checked);
              setPage(1);
            }}
          />
          Overdue only
        </label>
        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
              setTypeFilter("");
              setOpenOnly(false);
              setOverdueOnly(false);
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
        <span className="ml-auto pb-2 text-sm text-neutral-500 dark:text-neutral-400">
          {total} {total === 1 ? "request" : "requests"}
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
            title="No DSARs received"
            hint="Requests come in from your privacy notice / web form. Log them here as soon as they arrive."
            cta={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                Log Request
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Subject</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Channel</TableHeader>
                <SortableHeader
                  label="Status"
                  column="status"
                  current={sortDirFor("status")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Received"
                  column="receivedAt"
                  current={sortDirFor("receivedAt")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Due"
                  column="dueAt"
                  current={sortDirFor("dueAt")}
                  onClick={toggleSort}
                />
                <TableHeader>SLA</TableHeader>
                <TableHeader>Assignee</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((d) => {
                const stat = DSAR_STATUS_BADGE[d.status];
                const open = OPEN_DSAR_STATUSES.includes(d.status);
                const dueDate = d.extendedDueAt ?? d.dueAt;
                const sla = open ? timeUntil(dueDate) : null;
                return (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    onClick={() => setActive(d)}
                  >
                    <TableCell>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {d.subjectName}
                      </span>
                      {d.subjectEmail && (
                        <p className="text-[11px] text-neutral-500">{d.subjectEmail}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{dsarTypeLabel(d.requestType)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{d.channel.replace("_", " ")}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stat.variant}>{stat.label}</Badge>
                      {d.extendedAt && (
                        <p className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400">
                          Extended
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(d.receivedAt)}</TableCell>
                    <TableCell>{formatDate(dueDate)}</TableCell>
                    <TableCell>
                      {sla ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                            sla.overdue
                              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              : sla.imminent
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          <ClockIcon className="h-3 w-3" />
                          {sla.label}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          {d.fulfilledAt ? "Done" : "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {d.assignee?.name ?? <span className="italic text-neutral-400">—</span>}
                      </span>
                    </TableCell>
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

      <DSARFormModal
        mode="create"
        open={createOpen}
        members={members}
        activities={activities}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          refresh();
        }}
      />

      <DSARDetailDrawer
        item={active}
        members={members}
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

interface DSARFormState {
  subjectName: string;
  subjectEmail: string;
  subjectIdentifier: string;
  requestType: DSARType;
  channel: DSARChannel;
  status: DSARStatus;
  receivedAt: string;
  responseNotes: string;
  refusalReason: string;
  responseFileKey: string;
  assigneeId: string;
  processingActivityIds: string[];
}

function emptyForm(): DSARFormState {
  return {
    subjectName: "",
    subjectEmail: "",
    subjectIdentifier: "",
    requestType: "access",
    channel: "email",
    status: "received",
    receivedAt: new Date().toISOString().slice(0, 10),
    responseNotes: "",
    refusalReason: "",
    responseFileKey: "",
    assigneeId: "",
    processingActivityIds: [],
  };
}

function toForm(d: DSARRequest): DSARFormState {
  return {
    subjectName: d.subjectName,
    subjectEmail: d.subjectEmail ?? "",
    subjectIdentifier: d.subjectIdentifier ?? "",
    requestType: d.requestType,
    channel: d.channel,
    status: d.status,
    receivedAt: d.receivedAt.slice(0, 10),
    responseNotes: d.responseNotes ?? "",
    refusalReason: d.refusalReason ?? "",
    responseFileKey: d.responseFileKey ?? "",
    assigneeId: d.assigneeId ?? "",
    processingActivityIds: (d.processingActivities ?? []).map((a) => a.id),
  };
}

function DSARFormModal({
  mode,
  open,
  initial,
  members,
  activities,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  open: boolean;
  initial?: DSARRequest;
  members: OrgMember[];
  activities: ProcessingActivity[];
  onClose: () => void;
  onSaved: (d: DSARRequest) => void;
}) {
  const [form, setForm] = useState<DSARFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(initial ? toForm(initial) : emptyForm());
  }, [open, initial]);

  function patch<K extends keyof DSARFormState>(k: K, v: DSARFormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleActivity(id: string) {
    setForm((f) => {
      const next = f.processingActivityIds.includes(id)
        ? f.processingActivityIds.filter((x) => x !== id)
        : [...f.processingActivityIds, id];
      return { ...f, processingActivityIds: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subjectName.trim()) return setError("Subject name is required.");
    setSaving(true);
    setError(null);
    try {
      const payload: CreateDSARRequestInput = {
        subjectName: form.subjectName,
        subjectEmail: form.subjectEmail || null,
        subjectIdentifier: form.subjectIdentifier || null,
        requestType: form.requestType,
        channel: form.channel,
        status: form.status,
        receivedAt: form.receivedAt || undefined,
        responseNotes: form.responseNotes || null,
        refusalReason: form.refusalReason || null,
        responseFileKey: form.responseFileKey || null,
        assigneeId: form.assigneeId || null,
        processingActivityIds: form.processingActivityIds,
      };
      const res =
        mode === "create"
          ? await apiClient.createDSARRequest(payload)
          : await apiClient.updateDSARRequest(initial!.id, payload);
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save request.");
    } finally {
      setSaving(false);
    }
  }

  const memberOpts = useMemo(
    () => [
      { value: "", label: "Unassigned" },
      ...members.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` })),
    ],
    [members],
  );
  const typeOpts = DSAR_TYPE_OPTIONS.map((o) => ({
    value: o.value,
    label: `${o.label} (${o.article})`,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Log DSAR" : "Edit DSAR"}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <FormSection title="Data subject">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="dsar-form-name"
              label="Subject name"
              required
              value={form.subjectName}
              onChange={(e) => patch("subjectName", e.target.value)}
            />
            <Input
              id="dsar-form-email"
              label="Subject email"
              type="email"
              value={form.subjectEmail}
              onChange={(e) => patch("subjectEmail", e.target.value)}
            />
          </div>
          <Input
            id="dsar-form-identifier"
            label="Other identifier (optional)"
            placeholder="Customer ID, account number…"
            value={form.subjectIdentifier}
            onChange={(e) => patch("subjectIdentifier", e.target.value)}
          />
        </FormSection>

        <FormSection title="Request">
          <div className="grid grid-cols-3 gap-3">
            <Select
              id="dsar-form-type"
              label="Request type"
              options={typeOpts}
              value={form.requestType}
              onChange={(e) => patch("requestType", e.target.value as DSARType)}
            />
            <Select
              id="dsar-form-channel"
              label="Channel received via"
              options={DSAR_CHANNEL_OPTIONS}
              value={form.channel}
              onChange={(e) => patch("channel", e.target.value as DSARChannel)}
            />
            <Input
              id="dsar-form-received"
              label="Received at"
              type="date"
              required
              value={form.receivedAt}
              onChange={(e) => patch("receivedAt", e.target.value)}
            />
          </div>
          <Select
            id="dsar-form-status"
            label="Status"
            options={DSAR_STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => patch("status", e.target.value as DSARStatus)}
            disabled={mode === "create"}
          />
        </FormSection>

        <FormSection
          title="Linked processing activities"
          description="Tick the activities the requested data resides in."
        >
          {activities.length === 0 ? (
            <p className="text-xs italic text-neutral-500">No processing activities yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activities.map((a) => {
                const on = form.processingActivityIds.includes(a.id);
                return (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => toggleActivity(a.id)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      on
                        ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-300"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>
          )}
        </FormSection>

        <FormSection title="Response">
          <Textarea
            id="dsar-form-notes"
            label="Response notes"
            rows={3}
            placeholder="Internal notes — actions taken, what was sent, who reviewed."
            value={form.responseNotes}
            onChange={(e) => patch("responseNotes", e.target.value)}
          />
          <Input
            id="dsar-form-file"
            label="Response file (S3 key, optional)"
            placeholder="dsar-responses/2026/abc123.zip"
            value={form.responseFileKey}
            onChange={(e) => patch("responseFileKey", e.target.value)}
          />
          <Textarea
            id="dsar-form-refusal"
            label="Refusal reason (if refusing)"
            rows={2}
            placeholder="Manifestly unfounded / excessive (Art. 12(5)) — explain why."
            value={form.refusalReason}
            onChange={(e) => patch("refusalReason", e.target.value)}
          />
          <Select
            id="dsar-form-assignee"
            label="Assignee"
            options={memberOpts}
            value={form.assigneeId}
            onChange={(e) => patch("assigneeId", e.target.value)}
          />
        </FormSection>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {mode === "create" ? "Log request" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Detail drawer ────────────────────────────────────────────────────────────

function DSARDetailDrawer({
  item,
  members,
  activities,
  onClose,
  onChanged,
  onDeleted,
}: {
  item: DSARRequest | null;
  members: OrgMember[];
  activities: ProcessingActivity[];
  onClose: () => void;
  onChanged: (d: DSARRequest) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [acting, setActing] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendReason, setExtendReason] = useState("");

  useEffect(() => {
    setEditing(false);
    setExtendOpen(false);
    setExtendReason("");
  }, [item?.id]);

  if (!item) return null;
  const stat = DSAR_STATUS_BADGE[item.status];
  const open = OPEN_DSAR_STATUSES.includes(item.status);
  const dueDate = item.extendedDueAt ?? item.dueAt;
  const sla = open ? timeUntil(dueDate) : null;
  const allowed = NEXT_TRANSITIONS[item.status] ?? [];
  const canExtend = open && !item.extendedAt;
  const needsIdentity = item.status === "identity_pending";

  async function transition(next: DSARStatus) {
    if (!item) return;
    setActing(true);
    try {
      const r = await apiClient.transitionDSARRequest(item.id, { status: next });
      onChanged(r.data);
    } finally {
      setActing(false);
    }
  }

  async function handleVerifyIdentity() {
    if (!item) return;
    setActing(true);
    try {
      const r = await apiClient.verifyDSARIdentity(item.id);
      onChanged(r.data);
    } finally {
      setActing(false);
    }
  }

  async function confirmExtend() {
    if (!item) return;
    setActing(true);
    try {
      const r = await apiClient.extendDSARRequest(item.id, extendReason || undefined);
      onChanged(r.data);
      setExtendOpen(false);
      setExtendReason("");
    } finally {
      setActing(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm(`Delete DSAR from "${item.subjectName}"? This cannot be undone.`)) return;
    setActing(true);
    try {
      await apiClient.deleteDSARRequest(item.id);
      onDeleted(item.id);
    } catch {
      setActing(false);
    }
  }

  return (
    <>
      <InfoDrawer
        open={!!item && !editing && !extendOpen}
        onClose={onClose}
        title={`${dsarTypeLabel(item.requestType)} — ${item.subjectName}`}
        widthClassName="max-w-xl"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={stat.variant}>{stat.label}</Badge>
            {item.extendedAt && <Badge variant="warning">Extended (+2 months)</Badge>}
            {item.identityVerifiedAt && <Badge variant="success">Identity verified</Badge>}
          </div>

          {sla && (
            <div
              className={`rounded-lg border p-3 ${
                sla.overdue
                  ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950"
                  : sla.imminent
                    ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"
                    : "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950"
              }`}
            >
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                <p className="text-sm font-semibold">
                  {sla.overdue ? `Overdue by ${sla.label.replace("−", "")}` : `Due in ${sla.label}`}
                </p>
              </div>
              <p className="mt-1 text-xs">
                Received {formatDate(item.receivedAt)} · due {formatDate(dueDate)}
                {item.extendedAt && " (extended)"}
              </p>
            </div>
          )}

          <DetailGrid>
            <DetailField label="Subject email">{item.subjectEmail ?? "—"}</DetailField>
            <DetailField label="Other identifier">{item.subjectIdentifier ?? "—"}</DetailField>
            <DetailField label="Channel">
              <span className="capitalize">{item.channel.replace("_", " ")}</span>
            </DetailField>
            <DetailField label="Assignee">
              {item.assignee?.name ?? <span className="italic text-neutral-400">—</span>}
            </DetailField>
            <DetailField label="Identity verified">
              {formatDate(item.identityVerifiedAt)}
            </DetailField>
            <DetailField label="Fulfilled">{formatDate(item.fulfilledAt)}</DetailField>
          </DetailGrid>

          {item.processingActivities && item.processingActivities.length > 0 && (
            <DetailField label="Linked processing activities">
              <div className="mt-1 flex flex-wrap gap-1">
                {item.processingActivities.map((a) => (
                  <Badge key={a.id} variant="neutral">
                    {a.name}
                  </Badge>
                ))}
              </div>
            </DetailField>
          )}

          {item.responseNotes && (
            <DetailLong title="Response notes">{item.responseNotes}</DetailLong>
          )}
          {item.refusalReason && (
            <DetailLong title="Refusal reason">{item.refusalReason}</DetailLong>
          )}
          {item.responseFileKey && (
            <DetailField label="Response file">
              <code className="text-xs">{item.responseFileKey}</code>
            </DetailField>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {needsIdentity && (
              <Button size="sm" variant="primary" loading={acting} onClick={handleVerifyIdentity}>
                Mark identity verified
              </Button>
            )}
            {canExtend && (
              <Button size="sm" variant="secondary" onClick={() => setExtendOpen(true)}>
                Extend (+2 months)
              </Button>
            )}
            {allowed.map((next) => (
              <Button
                key={next}
                size="sm"
                variant={
                  next === "fulfilled" ? "primary" : next === "refused" ? "danger" : "secondary"
                }
                loading={acting}
                onClick={() => transition(next)}
              >
                {TRANSITION_LABEL[next]}
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

      <DSARFormModal
        mode="edit"
        open={editing}
        initial={item}
        members={members}
        activities={activities}
        onClose={() => setEditing(false)}
        onSaved={(updated) => {
          setEditing(false);
          onChanged(updated);
        }}
      />

      {/* Extension reason modal — Art. 12(3) requires informing the data
          subject of the extension and the reasons for it. */}
      <Modal
        open={extendOpen}
        onClose={() => setExtendOpen(false)}
        title="Extend response window"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Article 12(3) allows extending the response window by up to two further months for
            complex requests. You must inform the data subject of the extension and the reasons for
            the delay within the original one-month period.
          </p>
          <Textarea
            id="dsar-extend-reason"
            label="Reason (logged for audit)"
            rows={3}
            value={extendReason}
            onChange={(e) => setExtendReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setExtendOpen(false)}>
              Cancel
            </Button>
            <Button loading={acting} onClick={confirmExtend}>
              Extend
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
