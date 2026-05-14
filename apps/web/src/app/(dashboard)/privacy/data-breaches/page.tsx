"use client";

/**
 * Personal-Data Breach Register — GDPR Articles 33 & 34.
 *
 * The defining UX feature of this page is the prominent 72-hour notification
 * clock for any breach in the open / investigating / contained states. Every
 * row shows time-remaining-or-overdue against `notificationDeadlineAt` and
 * ICO-published guidance: from the moment the controller becomes aware,
 * supervisory-authority notification (Art. 33) is due within 72 hours.
 *
 * Lifecycle (server-enforced):
 *   open → investigating → contained → notified → closed
 *
 * Subject notification (Art. 34) is a separate one-shot action, valid only
 * when `dataSubjectsNotificationRequired === true` and the breach is
 * contained-or-later.
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
  type CreateDataBreachInput,
  type DataBreach,
  type DataBreachCategory,
  type DataBreachSeverity,
  type DataBreachStatus,
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
  formatDate,
  formatDateTime,
  timeUntil,
  type SortDir,
} from "../_components";
import {
  BREACH_CATEGORY_OPTIONS,
  BREACH_SEVERITY_BADGE,
  BREACH_SEVERITY_OPTIONS,
  BREACH_STATUS_BADGE,
  BREACH_STATUS_OPTIONS,
  DATA_CATEGORY_OPTIONS,
  SUBJECT_CATEGORY_OPTIONS,
} from "../_constants";

const SORTABLE = new Set([
  "title",
  "discoveredAt",
  "occurredAt",
  "notificationDeadlineAt",
  "severity",
  "status",
  "updatedAt",
]);

const TRANSITIONS: Record<DataBreachStatus, DataBreachStatus[]> = {
  open: ["investigating", "closed"],
  investigating: ["contained", "closed"],
  contained: ["notified", "closed"],
  notified: ["closed"],
  closed: [],
};

const TRANSITION_LABEL: Record<DataBreachStatus, string> = {
  open: "Reopen",
  investigating: "Start investigation",
  contained: "Mark contained",
  notified: "Mark notified to authority",
  closed: "Close",
};

export default function DataBreachesPage() {
  const [items, setItems] = useState<DataBreach[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [sortBy, setSortBy] = useState("discoveredAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [stats, setStats] = useState<PrivacyStats | null>(null);
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<DataBreach | null>(null);

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
      if (severityFilter) params.severity = severityFilter;
      if (openOnly) params.openOnly = "true";
      if (overdueOnly) params.overdueOnly = "true";
      const res = await apiClient.listDataBreaches(params);
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    sortBy,
    sortDir,
    searchTerm,
    statusFilter,
    severityFilter,
    openOnly,
    overdueOnly,
  ]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  useEffect(() => {
    apiClient
      .getPrivacyStats()
      .then((r) => setStats(r.data))
      .catch(() => {});
    apiClient
      .listProcessingActivities({ page: "1", limit: "200" })
      .then((r) => setActivities(r.data.items))
      .catch(() => setActivities([]));
    apiClient
      .listMembers()
      .then((r) => setMembers(r.data))
      .catch(() => setMembers([]));
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
    searchTerm || statusFilter || severityFilter || openOnly || overdueOnly,
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

  const breachStats = stats?.breaches;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
          Personal-data breach register (Art. 33). Each breach starts a 72-hour clock from discovery
          to supervisory-authority notification. Notify data subjects without undue delay (Art. 34)
          when the breach is likely to result in a high risk to their rights.
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          Log Breach
        </Button>
      </div>

      {breachStats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <KpiCard
            icon={<ListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            tone="blue"
            value={breachStats.total}
            label="Total breaches"
          />
          <KpiCard
            icon={<AlertIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            tone="amber"
            value={breachStats.open}
            label="Open / investigating"
            valueClass={breachStats.open > 0 ? "text-amber-600" : undefined}
          />
          <KpiCard
            icon={<ClockIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
            tone="red"
            value={breachStats.notificationDeadlinePassed}
            label="72h deadline passed"
            valueClass={breachStats.notificationDeadlinePassed > 0 ? "text-red-600" : undefined}
            hint="Open & not yet notified"
          />
          <KpiCard
            icon={<ShieldIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            tone="emerald"
            value={breachStats.total - breachStats.open}
            label="Resolved"
          />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-72">
          <Input
            id="db-search"
            placeholder="Search title, description, root cause…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-44">
          <Select
            id="db-status"
            options={BREACH_STATUS_OPTIONS}
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-40">
          <Select
            id="db-severity"
            options={BREACH_SEVERITY_OPTIONS}
            placeholder="All severities"
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
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
          Past 72h deadline
        </label>
        {filtersActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
              setSeverityFilter("");
              setOpenOnly(false);
              setOverdueOnly(false);
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
        <span className="ml-auto pb-2 text-sm text-neutral-500 dark:text-neutral-400">
          {total} {total === 1 ? "breach" : "breaches"}
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
            title="No breaches logged"
            hint="A clean register is good news. When something happens, log it the moment you become aware to start the 72-hour clock."
            cta={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                Log Breach
              </Button>
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
                <TableHeader>Category</TableHeader>
                <SortableHeader
                  label="Severity"
                  column="severity"
                  current={sortDirFor("severity")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Status"
                  column="status"
                  current={sortDirFor("status")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Discovered"
                  column="discoveredAt"
                  current={sortDirFor("discoveredAt")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="72h clock"
                  column="notificationDeadlineAt"
                  current={sortDirFor("notificationDeadlineAt")}
                  onClick={toggleSort}
                />
                <TableHeader>Subjects</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((b) => {
                const stat = BREACH_STATUS_BADGE[b.status];
                const sev = BREACH_SEVERITY_BADGE[b.severity];
                const cat = BREACH_CATEGORY_OPTIONS.find((c) => c.value === b.category);
                const isOpen = b.status !== "notified" && b.status !== "closed";
                const clock = isOpen ? timeUntil(b.notificationDeadlineAt) : null;
                return (
                  <TableRow
                    key={b.id}
                    className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    onClick={() => setActive(b)}
                  >
                    <TableCell>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {b.title}
                      </span>
                      {b.affectedRecordsEstimate !== null && (
                        <p className="text-[11px] text-neutral-500">
                          ~{b.affectedRecordsEstimate.toLocaleString()} records
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{cat?.label ?? b.category}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sev.variant}>{sev.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stat.variant}>{stat.label}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(b.discoveredAt)}</TableCell>
                    <TableCell>
                      {clock ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                            clock.overdue
                              ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              : clock.imminent
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          <ClockIcon className="h-3 w-3" />
                          {clock.label}
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          {b.supervisoryAuthorityNotifiedAt
                            ? `Notified ${formatDate(b.supervisoryAuthorityNotifiedAt)}`
                            : "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {b.dataSubjectsNotificationRequired ? (
                        b.dataSubjectsNotifiedAt ? (
                          <Badge variant="success">Notified</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
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

      <BreachFormModal
        mode="create"
        open={createOpen}
        activities={activities}
        members={members}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          refresh();
        }}
      />

      <BreachDetailDrawer
        item={active}
        activities={activities}
        members={members}
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

interface BreachFormState {
  title: string;
  description: string;
  category: DataBreachCategory;
  severity: DataBreachSeverity;
  status: DataBreachStatus;
  occurredAt: string;
  discoveredAt: string;
  affectedRecordsEstimate: string;
  affectedSubjectCategories: string[];
  dataCategoriesInvolved: string[];
  rootCause: string;
  containment: string;
  remediation: string;
  supervisoryAuthorityNotificationRequired: boolean;
  dataSubjectsNotificationRequired: boolean;
  processingActivityId: string;
  assigneeId: string;
}

function emptyForm(): BreachFormState {
  return {
    title: "",
    description: "",
    category: "confidentiality",
    severity: "medium",
    status: "open",
    occurredAt: "",
    discoveredAt: new Date().toISOString().slice(0, 10),
    affectedRecordsEstimate: "",
    affectedSubjectCategories: [],
    dataCategoriesInvolved: [],
    rootCause: "",
    containment: "",
    remediation: "",
    supervisoryAuthorityNotificationRequired: true,
    dataSubjectsNotificationRequired: false,
    processingActivityId: "",
    assigneeId: "",
  };
}

function toForm(b: DataBreach): BreachFormState {
  return {
    title: b.title,
    description: b.description ?? "",
    category: b.category,
    severity: b.severity,
    status: b.status,
    occurredAt: b.occurredAt ? b.occurredAt.slice(0, 10) : "",
    discoveredAt: b.discoveredAt.slice(0, 10),
    affectedRecordsEstimate:
      b.affectedRecordsEstimate !== null ? String(b.affectedRecordsEstimate) : "",
    affectedSubjectCategories: b.affectedSubjectCategories,
    dataCategoriesInvolved: b.dataCategoriesInvolved,
    rootCause: b.rootCause ?? "",
    containment: b.containment ?? "",
    remediation: b.remediation ?? "",
    supervisoryAuthorityNotificationRequired: b.supervisoryAuthorityNotificationRequired,
    dataSubjectsNotificationRequired: b.dataSubjectsNotificationRequired,
    processingActivityId: b.processingActivityId ?? "",
    assigneeId: b.assigneeId ?? "",
  };
}

function BreachFormModal({
  mode,
  open,
  initial,
  activities,
  members,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  open: boolean;
  initial?: DataBreach;
  activities: ProcessingActivity[];
  members: OrgMember[];
  onClose: () => void;
  onSaved: (b: DataBreach) => void;
}) {
  const [form, setForm] = useState<BreachFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(initial ? toForm(initial) : emptyForm());
  }, [open, initial]);

  function patch<K extends keyof BreachFormState>(k: K, v: BreachFormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggle(key: "affectedSubjectCategories" | "dataCategoriesInvolved", v: string) {
    setForm((f) => {
      const arr = f[key];
      const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
      return { ...f, [key]: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return setError("Title is required.");
    setSaving(true);
    setError(null);
    try {
      const payload: CreateDataBreachInput = {
        title: form.title,
        description: form.description || null,
        category: form.category,
        severity: form.severity,
        status: form.status,
        occurredAt: form.occurredAt || null,
        discoveredAt: form.discoveredAt || undefined,
        affectedRecordsEstimate: form.affectedRecordsEstimate
          ? Number(form.affectedRecordsEstimate)
          : null,
        affectedSubjectCategories:
          form.affectedSubjectCategories as CreateDataBreachInput["affectedSubjectCategories"],
        dataCategoriesInvolved:
          form.dataCategoriesInvolved as CreateDataBreachInput["dataCategoriesInvolved"],
        rootCause: form.rootCause || null,
        containment: form.containment || null,
        remediation: form.remediation || null,
        supervisoryAuthorityNotificationRequired: form.supervisoryAuthorityNotificationRequired,
        dataSubjectsNotificationRequired: form.dataSubjectsNotificationRequired,
        processingActivityId: form.processingActivityId || null,
        assigneeId: form.assigneeId || null,
      };
      const res =
        mode === "create"
          ? await apiClient.createDataBreach(payload)
          : await apiClient.updateDataBreach(initial!.id, payload);
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save breach.");
    } finally {
      setSaving(false);
    }
  }

  const activityOpts = useMemo(
    () => [
      { value: "", label: "Not linked" },
      ...activities.map((a) => ({ value: a.id, label: a.name })),
    ],
    [activities],
  );
  const memberOpts = useMemo(
    () => [
      { value: "", label: "Unassigned" },
      ...members.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` })),
    ],
    [members],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Log personal-data breach" : "Edit breach"}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {mode === "create" && (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <strong>Reminder:</strong> The Art. 33 72-hour clock starts at the moment specified in{" "}
            <em>Discovered at</em> below. Log the breach immediately and refine details as the
            investigation progresses.
          </div>
        )}

        <FormSection title="Identification">
          <Input
            id="db-form-title"
            label="Title"
            required
            placeholder="Phishing-led credential exposure on customer-success Slack"
            value={form.title}
            onChange={(e) => patch("title", e.target.value)}
          />
          <Textarea
            id="db-form-description"
            label="Description"
            rows={3}
            placeholder="What happened, where, and any user-visible impact."
            value={form.description}
            onChange={(e) => patch("description", e.target.value)}
          />
          <div className="grid grid-cols-3 gap-3">
            <Select
              id="db-form-category"
              label="Category"
              options={BREACH_CATEGORY_OPTIONS}
              value={form.category}
              onChange={(e) => patch("category", e.target.value as DataBreachCategory)}
            />
            <Select
              id="db-form-severity"
              label="Severity"
              options={BREACH_SEVERITY_OPTIONS}
              value={form.severity}
              onChange={(e) => patch("severity", e.target.value as DataBreachSeverity)}
            />
            <Select
              id="db-form-status"
              label="Status"
              options={BREACH_STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => patch("status", e.target.value as DataBreachStatus)}
              disabled={mode === "create"}
            />
          </div>
        </FormSection>

        <FormSection title="Timing">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="db-form-occurred"
              label="Occurred at (best estimate)"
              type="date"
              value={form.occurredAt}
              onChange={(e) => patch("occurredAt", e.target.value)}
            />
            <Input
              id="db-form-discovered"
              label="Discovered at"
              type="date"
              required
              value={form.discoveredAt}
              onChange={(e) => patch("discoveredAt", e.target.value)}
            />
          </div>
        </FormSection>

        <FormSection title="Scope">
          <Input
            id="db-form-records"
            label="Affected records (estimate)"
            type="number"
            min={0}
            placeholder="2400"
            value={form.affectedRecordsEstimate}
            onChange={(e) => patch("affectedRecordsEstimate", e.target.value)}
          />
          <ChipGroup
            label="Affected subject categories"
            options={SUBJECT_CATEGORY_OPTIONS}
            selected={form.affectedSubjectCategories}
            onToggle={(v) => toggle("affectedSubjectCategories", v)}
          />
          <ChipGroup
            label="Data categories involved"
            options={DATA_CATEGORY_OPTIONS}
            selected={form.dataCategoriesInvolved}
            onToggle={(v) => toggle("dataCategoriesInvolved", v)}
          />
          <Select
            id="db-form-activity"
            label="Originating processing activity (optional)"
            options={activityOpts}
            value={form.processingActivityId}
            onChange={(e) => patch("processingActivityId", e.target.value)}
          />
          <Select
            id="db-form-assignee"
            label="Assignee"
            options={memberOpts}
            value={form.assigneeId}
            onChange={(e) => patch("assigneeId", e.target.value)}
          />
        </FormSection>

        <FormSection title="Investigation">
          <Textarea
            id="db-form-rootcause"
            label="Root cause"
            rows={3}
            value={form.rootCause}
            onChange={(e) => patch("rootCause", e.target.value)}
          />
          <Textarea
            id="db-form-containment"
            label="Containment"
            rows={3}
            value={form.containment}
            onChange={(e) => patch("containment", e.target.value)}
          />
          <Textarea
            id="db-form-remediation"
            label="Remediation"
            rows={3}
            value={form.remediation}
            onChange={(e) => patch("remediation", e.target.value)}
          />
        </FormSection>

        <FormSection
          title="Notification"
          description="Art. 33 — supervisory authority within 72h. Art. 34 — data subjects without undue delay if high-risk."
        >
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
              checked={form.supervisoryAuthorityNotificationRequired}
              onChange={(e) => patch("supervisoryAuthorityNotificationRequired", e.target.checked)}
            />
            Supervisory authority notification required (Art. 33)
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-red-600 focus:ring-red-500 dark:border-neutral-700 dark:bg-neutral-900"
              checked={form.dataSubjectsNotificationRequired}
              onChange={(e) => patch("dataSubjectsNotificationRequired", e.target.checked)}
            />
            Data subjects notification required (Art. 34 — high risk)
          </label>
        </FormSection>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {mode === "create" ? "Log breach" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.value);
          return (
            <button
              type="button"
              key={o.value}
              onClick={() => onToggle(o.value)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                on
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-300"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Detail drawer ────────────────────────────────────────────────────────────

function BreachDetailDrawer({
  item,
  activities,
  members,
  onClose,
  onChanged,
  onDeleted,
}: {
  item: DataBreach | null;
  activities: ProcessingActivity[];
  members: OrgMember[];
  onClose: () => void;
  onChanged: (b: DataBreach) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [acting, setActing] = useState(false);
  const [authorityRefOpen, setAuthorityRefOpen] = useState(false);
  const [authorityRef, setAuthorityRef] = useState("");

  useEffect(() => {
    setEditing(false);
    setAuthorityRefOpen(false);
    setAuthorityRef("");
  }, [item?.id]);

  if (!item) return null;
  const stat = BREACH_STATUS_BADGE[item.status];
  const sev = BREACH_SEVERITY_BADGE[item.severity];
  const isOpen = item.status !== "notified" && item.status !== "closed";
  const clock = isOpen ? timeUntil(item.notificationDeadlineAt) : null;
  const allowed = TRANSITIONS[item.status] ?? [];
  const subjectsNotifiable =
    item.dataSubjectsNotificationRequired &&
    !item.dataSubjectsNotifiedAt &&
    (item.status === "contained" || item.status === "notified");

  async function handleTransition(next: DataBreachStatus) {
    if (!item) return;
    if (next === "notified" && item.supervisoryAuthorityNotificationRequired) {
      setAuthorityRefOpen(true);
      return;
    }
    setActing(true);
    try {
      const r = await apiClient.transitionDataBreach(item.id, { status: next });
      onChanged(r.data);
    } finally {
      setActing(false);
    }
  }

  async function confirmAuthorityNotification() {
    if (!item) return;
    setActing(true);
    try {
      const r = await apiClient.transitionDataBreach(item.id, {
        status: "notified",
        supervisoryAuthorityReference: authorityRef || null,
      });
      onChanged(r.data);
      setAuthorityRefOpen(false);
      setAuthorityRef("");
    } finally {
      setActing(false);
    }
  }

  async function notifySubjects() {
    if (!item) return;
    setActing(true);
    try {
      const r = await apiClient.notifyDataBreachSubjects(item.id);
      onChanged(r.data);
    } finally {
      setActing(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm(`Delete breach "${item.title}"? This cannot be undone.`)) return;
    setActing(true);
    try {
      await apiClient.deleteDataBreach(item.id);
      onDeleted(item.id);
    } catch {
      setActing(false);
    }
  }

  return (
    <>
      <InfoDrawer
        open={!!item && !editing && !authorityRefOpen}
        onClose={onClose}
        title={item.title}
        widthClassName="max-w-xl"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={stat.variant}>{stat.label}</Badge>
            <Badge variant={sev.variant}>{sev.label}</Badge>
            <Badge variant="neutral" className="capitalize">
              {item.category.replace("_", " ")}
            </Badge>
          </div>

          {/* 72-hour countdown — the headline UX element of this drawer */}
          {clock && (
            <div
              className={`rounded-lg border p-3 ${
                clock.overdue
                  ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950"
                  : clock.imminent
                    ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"
                    : "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950"
              }`}
            >
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                <p className="text-sm font-semibold">
                  {clock.overdue
                    ? `Art. 33 deadline missed by ${clock.label.replace("−", "")}`
                    : `Art. 33 deadline in ${clock.label}`}
                </p>
              </div>
              <p className="mt-1 text-xs">
                Discovered {formatDateTime(item.discoveredAt)} · deadline{" "}
                {formatDateTime(item.notificationDeadlineAt)}
              </p>
            </div>
          )}

          {item.description && (
            <p className="whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-400">
              {item.description}
            </p>
          )}

          <DetailGrid>
            <DetailField label="Occurred at">
              {formatDate(item.occurredAt) === "—" ? "Unknown" : formatDate(item.occurredAt)}
            </DetailField>
            <DetailField label="Discovered at">{formatDateTime(item.discoveredAt)}</DetailField>
            <DetailField label="Affected records">
              {item.affectedRecordsEstimate !== null
                ? item.affectedRecordsEstimate.toLocaleString()
                : "—"}
            </DetailField>
            <DetailField label="Originating activity">
              {item.processingActivity?.name ??
                activities.find((a) => a.id === item.processingActivityId)?.name ??
                "—"}
            </DetailField>
            <DetailField label="Reported by">{item.reportedBy?.name ?? "—"}</DetailField>
            <DetailField label="Assignee">{item.assignee?.name ?? "Unassigned"}</DetailField>
          </DetailGrid>

          {item.rootCause && <DetailLong title="Root cause">{item.rootCause}</DetailLong>}
          {item.containment && <DetailLong title="Containment">{item.containment}</DetailLong>}
          {item.remediation && <DetailLong title="Remediation">{item.remediation}</DetailLong>}

          <div>
            <h4 className="border-b border-neutral-200 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              Notifications
            </h4>
            <DetailGrid>
              <DetailField label="Authority required">
                {item.supervisoryAuthorityNotificationRequired ? "Yes" : "No"}
              </DetailField>
              <DetailField label="Authority notified at">
                {formatDate(item.supervisoryAuthorityNotifiedAt)}
              </DetailField>
              <DetailField label="Authority reference">
                {item.supervisoryAuthorityReference ?? "—"}
              </DetailField>
              <DetailField label="Subjects required">
                {item.dataSubjectsNotificationRequired ? "Yes" : "No"}
              </DetailField>
              <DetailField label="Subjects notified at">
                {formatDate(item.dataSubjectsNotifiedAt)}
              </DetailField>
            </DetailGrid>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
            {allowed.map((next) => (
              <Button
                key={next}
                size="sm"
                variant="secondary"
                loading={acting}
                onClick={() => handleTransition(next)}
              >
                {TRANSITION_LABEL[next]}
              </Button>
            ))}
            {subjectsNotifiable && (
              <Button size="sm" variant="primary" loading={acting} onClick={notifySubjects}>
                Mark subjects notified
              </Button>
            )}
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

      <BreachFormModal
        mode="edit"
        open={editing}
        initial={item}
        activities={activities}
        members={members}
        onClose={() => setEditing(false)}
        onSaved={(updated) => {
          setEditing(false);
          onChanged(updated);
        }}
      />

      {/* Authority reference modal — captures the case number provided by the
          supervisory authority when notifying. Optional, but valuable in audit. */}
      <Modal
        open={authorityRefOpen}
        onClose={() => setAuthorityRefOpen(false)}
        title="Supervisory authority notification"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            Confirm the breach has been notified to the supervisory authority. Optionally enter the
            case / reference number they returned.
          </p>
          <Input
            id="db-authority-ref"
            label="Authority reference"
            placeholder="e.g. ICO/2026/0042"
            value={authorityRef}
            onChange={(e) => setAuthorityRef(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAuthorityRefOpen(false)}>
              Cancel
            </Button>
            <Button loading={acting} onClick={confirmAuthorityNotification}>
              Mark notified
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
