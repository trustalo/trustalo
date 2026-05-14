"use client";

/**
 * Records of Processing Activities (RoPA) — Article 30 register.
 *
 * Acts as the workspace landing page because:
 *   1. RoPA is the foundation every other GDPR artefact (DPIA, breach, DSAR)
 *      links back to.
 *   2. It is what auditors most often ask for first.
 *
 * Design follows the inventory pattern used by AI Governance:
 *   - KPI strip (totals, due-for-review, special-category exposure)
 *   - Filter bar (search + lawful basis + status + role + sensitive-only)
 *   - Sortable table (server-side sort)
 *   - Click-row detail drawer with inline edit + lifecycle actions
 *   - Create/edit modal sectioned to mirror the Art. 30 record structure
 */

import Link from "next/link";
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
  type CreateProcessingActivityInput,
  type DataCategory,
  type LawfulBasis,
  type OrgMember,
  type PrivacyStats,
  type ProcessingActivity,
  type ProcessingActivityStatus,
  type ProcessingRole,
  type SubjectCategory,
  type TransferMechanism,
  type VendorItem,
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
  UserGroupIcon,
  formatDate,
  type SortDir,
} from "./_components";
import {
  DATA_CATEGORY_OPTIONS,
  LAWFUL_BASIS_OPTIONS,
  PA_STATUS_BADGE,
  PA_STATUS_OPTIONS,
  PROCESSING_ROLE_OPTIONS,
  SENSITIVE_CATEGORIES,
  SUBJECT_CATEGORY_OPTIONS,
  TRANSFER_MECHANISM_OPTIONS,
  dataCategoryLabel,
  lawfulBasisLabel,
  subjectCategoryLabel,
  transferMechanismLabel,
} from "./_constants";

const SORTABLE = new Set([
  "name",
  "createdAt",
  "updatedAt",
  "status",
  "lastReviewedAt",
  "nextReviewAt",
]);

export default function ProcessingActivitiesPage() {
  const [items, setItems] = useState<ProcessingActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [basisFilter, setBasisFilter] = useState("");
  const [sensitiveOnly, setSensitiveOnly] = useState(false);
  const [dueForReview, setDueForReview] = useState(false);

  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [stats, setStats] = useState<PrivacyStats | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [active, setActive] = useState<ProcessingActivity | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
        sortBy,
        sortDir,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;
      if (basisFilter) params.lawfulBasis = basisFilter;
      if (sensitiveOnly) params.sensitive = "true";
      if (dueForReview) params.dueForReview = "true";
      const res = await apiClient.listProcessingActivities(params);
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
    search,
    statusFilter,
    roleFilter,
    basisFilter,
    sensitiveOnly,
    dueForReview,
  ]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.getPrivacyStats();
      setStats(res.data);
    } catch {
      /* swallow */
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  useEffect(() => {
    apiClient
      .listMembers()
      .then((r) => setMembers(r.data))
      .catch(() => setMembers([]));
    apiClient
      .listVendors({ page: "1", limit: "200" })
      .then((r) => setVendors(r.data.items))
      .catch(() => setVendors([]));
  }, []);

  const refresh = useCallback(() => {
    fetchItems();
    fetchStats();
  }, [fetchItems, fetchStats]);

  const totalPages = Math.ceil(total / limit);
  const filtersActive = Boolean(
    search || statusFilter || roleFilter || basisFilter || sensitiveOnly || dueForReview,
  );

  function toggleSort(column: string) {
    if (!SORTABLE.has(column)) return;
    if (sortBy === column) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(column);
      setSortDir("desc");
    }
    setPage(1);
  }
  const sortDirFor = (c: string): SortDir | null => (sortBy === c ? sortDir : null);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
          Article 30 register of all processing activities. One row per processing purpose — what
          data is collected, why, on what lawful basis, who receives it, how long it is kept.
          Reviewed annually.
        </p>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          New Activity
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            icon={<ListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            tone="blue"
            value={stats.processingActivities.total}
            label="Total activities"
          />
          <KpiCard
            icon={<ShieldIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            tone="emerald"
            value={stats.processingActivities.byStatus.active ?? 0}
            label="Active"
          />
          <KpiCard
            icon={<AlertIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
            tone="amber"
            value={stats.processingActivities.dueForReview}
            label="Due for review"
            valueClass={stats.processingActivities.dueForReview > 0 ? "text-amber-600" : undefined}
          />
          <KpiCard
            icon={<FlameIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
            tone="red"
            value={stats.dpias.total}
            label="DPIAs filed"
            hint="Across all activities"
          />
          <KpiCard
            icon={<UserGroupIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            tone="purple"
            value={stats.dsars.total}
            label="DSARs received"
            hint={stats.dsars.overdue > 0 ? `${stats.dsars.overdue} overdue` : "On track"}
          />
        </div>
      )}

      <FilterBar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatus={(v) => {
          setStatusFilter(v);
          setPage(1);
        }}
        roleFilter={roleFilter}
        onRole={(v) => {
          setRoleFilter(v);
          setPage(1);
        }}
        basisFilter={basisFilter}
        onBasis={(v) => {
          setBasisFilter(v);
          setPage(1);
        }}
        sensitiveOnly={sensitiveOnly}
        onSensitive={(v) => {
          setSensitiveOnly(v);
          setPage(1);
        }}
        dueForReview={dueForReview}
        onDueForReview={(v) => {
          setDueForReview(v);
          setPage(1);
        }}
        active={filtersActive}
        onClear={() => {
          setSearch("");
          setStatusFilter("");
          setRoleFilter("");
          setBasisFilter("");
          setSensitiveOnly(false);
          setDueForReview(false);
          setPage(1);
        }}
        total={total}
      />

      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <SpinnerIcon />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            filtered={filtersActive}
            title="No processing activities yet"
            hint="Build your Art. 30 register: every purpose for which you process personal data needs a record."
            cta={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                Add first activity
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <SortableHeader
                  label="Name"
                  column="name"
                  current={sortDirFor("name")}
                  onClick={toggleSort}
                />
                <TableHeader>Purpose</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader>Lawful basis</TableHeader>
                <TableHeader>Data</TableHeader>
                <SortableHeader
                  label="Status"
                  column="status"
                  current={sortDirFor("status")}
                  onClick={toggleSort}
                />
                <SortableHeader
                  label="Next review"
                  column="nextReviewAt"
                  current={sortDirFor("nextReviewAt")}
                  onClick={toggleSort}
                />
                <TableHeader>DPIA / Breach</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((p) => {
                const stat = PA_STATUS_BADGE[p.status];
                const sensitive = p.dataCategories.some((c) => SENSITIVE_CATEGORIES.includes(c));
                const transfer = p.crossBorderTransfer;
                return (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    onClick={() => setActive(p)}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {p.name}
                        </span>
                        {p.owner && (
                          <span className="text-[11px] text-neutral-500">
                            Owner: {p.owner.name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {p.purpose}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{p.role.replace("_", " ")}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{lawfulBasisLabel(p.lawfulBasis)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {sensitive && <Badge variant="danger">Sensitive</Badge>}
                        {transfer && <Badge variant="warning">Transfer</Badge>}
                        <span className="text-[11px] text-neutral-500">
                          {p.dataCategories.length} cat.
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stat.variant}>{stat.label}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(p.nextReviewAt)}</TableCell>
                    <TableCell>
                      <span className="text-xs text-neutral-500">
                        {p._count?.dpias ?? 0} DPIA · {p._count?.breaches ?? 0} breach
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

      <ProcessingActivityFormModal
        mode="create"
        open={createOpen}
        members={members}
        vendors={vendors}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          refresh();
        }}
      />

      <DetailDrawer
        item={active}
        members={members}
        vendors={vendors}
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

// ── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar(props: {
  search: string;
  onSearch: (v: string) => void;
  statusFilter: string;
  onStatus: (v: string) => void;
  roleFilter: string;
  onRole: (v: string) => void;
  basisFilter: string;
  onBasis: (v: string) => void;
  sensitiveOnly: boolean;
  onSensitive: (v: boolean) => void;
  dueForReview: boolean;
  onDueForReview: (v: boolean) => void;
  active: boolean;
  onClear: () => void;
  total: number;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-72">
        <Input
          id="pa-search"
          placeholder="Search name, purpose…"
          value={props.search}
          onChange={(e) => props.onSearch(e.target.value)}
        />
      </div>
      <div className="w-44">
        <Select
          id="pa-status"
          options={PA_STATUS_OPTIONS}
          placeholder="All statuses"
          value={props.statusFilter}
          onChange={(e) => props.onStatus(e.target.value)}
        />
      </div>
      <div className="w-40">
        <Select
          id="pa-role"
          options={PROCESSING_ROLE_OPTIONS}
          placeholder="Any role"
          value={props.roleFilter}
          onChange={(e) => props.onRole(e.target.value)}
        />
      </div>
      <div className="w-56">
        <Select
          id="pa-basis"
          options={LAWFUL_BASIS_OPTIONS}
          placeholder="Any lawful basis"
          value={props.basisFilter}
          onChange={(e) => props.onBasis(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 pb-2 text-sm text-neutral-700 dark:text-neutral-300">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
          checked={props.sensitiveOnly}
          onChange={(e) => props.onSensitive(e.target.checked)}
        />
        Sensitive data
      </label>
      <label className="flex items-center gap-2 pb-2 text-sm text-neutral-700 dark:text-neutral-300">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
          checked={props.dueForReview}
          onChange={(e) => props.onDueForReview(e.target.checked)}
        />
        Due for review
      </label>
      {props.active && (
        <Button variant="ghost" size="sm" onClick={props.onClear}>
          Clear filters
        </Button>
      )}
      <span className="ml-auto pb-2 text-sm text-neutral-500 dark:text-neutral-400">
        {props.total} {props.total === 1 ? "activity" : "activities"}
      </span>
    </div>
  );
}

// ── Form ─────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  purpose: string;
  role: ProcessingRole;
  lawfulBasis: LawfulBasis;
  lawfulBasisJustification: string;
  dataCategories: DataCategory[];
  subjectCategories: SubjectCategory[];
  dataElements: string;
  recipients: string;
  crossBorderTransfer: boolean;
  transferMechanism: TransferMechanism | "";
  transferDestinations: string;
  retentionPeriod: string;
  securityMeasures: string;
  ownerId: string;
  status: ProcessingActivityStatus;
  nextReviewAt: string;
  vendorIds: string[];
}

const EMPTY_FORM: FormState = {
  name: "",
  purpose: "",
  role: "controller",
  lawfulBasis: "consent",
  lawfulBasisJustification: "",
  dataCategories: [],
  subjectCategories: [],
  dataElements: "",
  recipients: "",
  crossBorderTransfer: false,
  transferMechanism: "",
  transferDestinations: "",
  retentionPeriod: "",
  securityMeasures: "",
  ownerId: "",
  status: "draft",
  nextReviewAt: "",
  vendorIds: [],
};

function toForm(p: ProcessingActivity): FormState {
  return {
    name: p.name,
    purpose: p.purpose,
    role: p.role,
    lawfulBasis: p.lawfulBasis,
    lawfulBasisJustification: p.lawfulBasisJustification ?? "",
    dataCategories: p.dataCategories,
    subjectCategories: p.subjectCategories,
    dataElements: p.dataElements.join(", "),
    recipients: p.recipients.join(", "),
    crossBorderTransfer: p.crossBorderTransfer,
    transferMechanism: p.transferMechanism ?? "",
    transferDestinations: p.transferDestinations.join(", "),
    retentionPeriod: p.retentionPeriod ?? "",
    securityMeasures: p.securityMeasures ?? "",
    ownerId: p.ownerId ?? "",
    status: p.status,
    nextReviewAt: p.nextReviewAt ? p.nextReviewAt.slice(0, 10) : "",
    vendorIds: (p.vendors ?? []).map((v) => v.id),
  };
}

function ProcessingActivityFormModal({
  mode,
  open,
  initial,
  members,
  vendors,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  open: boolean;
  initial?: ProcessingActivity;
  members: OrgMember[];
  vendors: VendorItem[];
  onClose: () => void;
  onSaved: (p: ProcessingActivity) => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(initial ? toForm(initial) : EMPTY_FORM);
  }, [open, initial]);

  function patch<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleArray<T extends string>(key: keyof FormState, value: T) {
    setForm((f) => {
      const arr = (f[key] as unknown as T[]) ?? [];
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...f, [key]: next } as FormState;
    });
  }

  function splitCsv(s: string): string[] {
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.purpose.trim()) return setError("Purpose is required.");
    setSaving(true);
    setError(null);
    try {
      const payload: CreateProcessingActivityInput = {
        name: form.name,
        purpose: form.purpose,
        role: form.role,
        lawfulBasis: form.lawfulBasis,
        lawfulBasisJustification: form.lawfulBasisJustification || null,
        dataCategories: form.dataCategories,
        subjectCategories: form.subjectCategories,
        dataElements: splitCsv(form.dataElements),
        recipients: splitCsv(form.recipients),
        crossBorderTransfer: form.crossBorderTransfer,
        transferMechanism: form.crossBorderTransfer ? form.transferMechanism || null : null,
        transferDestinations: form.crossBorderTransfer ? splitCsv(form.transferDestinations) : [],
        retentionPeriod: form.retentionPeriod || null,
        securityMeasures: form.securityMeasures || null,
        ownerId: form.ownerId || null,
        status: form.status,
        nextReviewAt: form.nextReviewAt || null,
        vendorIds: form.vendorIds,
      };
      const res =
        mode === "create"
          ? await apiClient.createProcessingActivity(payload)
          : await apiClient.updateProcessingActivity(initial!.id, payload);
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save activity.");
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
  const vendorOpts = useMemo(() => vendors.map((v) => ({ value: v.id, label: v.name })), [vendors]);
  const basisOpts = LAWFUL_BASIS_OPTIONS.map((o) => ({ value: o.value, label: o.label }));
  const transferOpts = TRANSFER_MECHANISM_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "New processing activity" : "Edit processing activity"}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <FormSection title="Identification">
          <Input
            id="pa-form-name"
            label="Activity name"
            required
            placeholder="Customer support ticketing"
            value={form.name}
            onChange={(e) => patch("name", e.target.value)}
          />
          <Textarea
            id="pa-form-purpose"
            label="Purpose"
            required
            rows={2}
            placeholder="To provide support to customers and resolve product issues."
            value={form.purpose}
            onChange={(e) => patch("purpose", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              id="pa-form-role"
              label="Processing role"
              options={PROCESSING_ROLE_OPTIONS}
              value={form.role}
              onChange={(e) => patch("role", e.target.value as ProcessingRole)}
            />
            <Select
              id="pa-form-owner"
              label="Owner"
              options={memberOpts}
              value={form.ownerId}
              onChange={(e) => patch("ownerId", e.target.value)}
            />
          </div>
        </FormSection>

        <FormSection title="Lawful basis (Art. 6)">
          <Select
            id="pa-form-basis"
            label="Lawful basis"
            options={basisOpts}
            value={form.lawfulBasis}
            onChange={(e) => patch("lawfulBasis", e.target.value as LawfulBasis)}
          />
          <Textarea
            id="pa-form-basis-just"
            label="Justification"
            rows={2}
            placeholder="Why is this the right basis? Required for legitimate-interests; recommended for consent."
            value={form.lawfulBasisJustification}
            onChange={(e) => patch("lawfulBasisJustification", e.target.value)}
          />
        </FormSection>

        <FormSection title="Data and subjects">
          <CheckboxGroup
            label="Data categories"
            options={DATA_CATEGORY_OPTIONS}
            selected={form.dataCategories}
            onToggle={(v) => toggleArray("dataCategories", v)}
          />
          <CheckboxGroup
            label="Subject categories"
            options={SUBJECT_CATEGORY_OPTIONS}
            selected={form.subjectCategories}
            onToggle={(v) => toggleArray("subjectCategories", v)}
          />
          <Textarea
            id="pa-form-elements"
            label="Specific data elements (comma-separated)"
            rows={2}
            placeholder="email, name, IP address, support transcript"
            value={form.dataElements}
            onChange={(e) => patch("dataElements", e.target.value)}
          />
          <Textarea
            id="pa-form-recipients"
            label="Recipients (comma-separated)"
            rows={2}
            placeholder="Internal support team, Zendesk (processor), legal counsel"
            value={form.recipients}
            onChange={(e) => patch("recipients", e.target.value)}
          />
        </FormSection>

        <FormSection
          title="Cross-border transfers (Chap. V)"
          description="Tick if data leaves the EU/EEA. The transfer mechanism is then required."
        >
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
              checked={form.crossBorderTransfer}
              onChange={(e) => patch("crossBorderTransfer", e.target.checked)}
            />
            Personal data is transferred outside the EU/EEA
          </label>
          {form.crossBorderTransfer && (
            <div className="grid grid-cols-2 gap-3">
              <Select
                id="pa-form-transfer-mech"
                label="Transfer mechanism"
                options={transferOpts}
                placeholder="Select…"
                value={form.transferMechanism}
                onChange={(e) => patch("transferMechanism", e.target.value as TransferMechanism)}
              />
              <Input
                id="pa-form-transfer-dest"
                label="Destinations (comma-separated)"
                placeholder="US, India"
                value={form.transferDestinations}
                onChange={(e) => patch("transferDestinations", e.target.value)}
              />
            </div>
          )}
        </FormSection>

        <FormSection title="Retention and security">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="pa-form-retention"
              label="Retention period"
              placeholder="3 years from last contact"
              value={form.retentionPeriod}
              onChange={(e) => patch("retentionPeriod", e.target.value)}
            />
            <Input
              id="pa-form-next-review"
              label="Next review at"
              type="date"
              value={form.nextReviewAt}
              onChange={(e) => patch("nextReviewAt", e.target.value)}
            />
          </div>
          <Textarea
            id="pa-form-security"
            label="Security measures (Art. 32)"
            rows={3}
            placeholder="Encryption at rest and in transit, role-based access, MFA on admin accounts."
            value={form.securityMeasures}
            onChange={(e) => patch("securityMeasures", e.target.value)}
          />
        </FormSection>

        <FormSection
          title="Processors / sub-processors"
          description="Vendors that process this data on your behalf (Art. 28)."
        >
          <CheckboxGroup
            label=""
            options={vendorOpts}
            selected={form.vendorIds}
            onToggle={(v) => toggleArray("vendorIds", v)}
            empty="No vendors yet — add them in the Vendors workspace."
          />
        </FormSection>

        <FormSection title="Status">
          <Select
            id="pa-form-status"
            label="Status"
            options={PA_STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => patch("status", e.target.value as ProcessingActivityStatus)}
          />
        </FormSection>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {mode === "create" ? "Create activity" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CheckboxGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
  empty,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (v: T) => void;
  empty?: string;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{label}</p>
      )}
      {options.length === 0 ? (
        <p className="text-xs italic text-neutral-500">{empty ?? "No options"}</p>
      ) : (
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
      )}
    </div>
  );
}

// ── Detail drawer ────────────────────────────────────────────────────────────

function DetailDrawer({
  item,
  members,
  vendors,
  onClose,
  onChanged,
  onDeleted,
}: {
  item: ProcessingActivity | null;
  members: OrgMember[];
  vendors: VendorItem[];
  onClose: () => void;
  onChanged: (p: ProcessingActivity) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    setEditing(false);
  }, [item?.id]);

  if (!item) return null;
  const stat = PA_STATUS_BADGE[item.status];
  const sensitive = item.dataCategories.some((c) => SENSITIVE_CATEGORIES.includes(c));

  async function handleMarkReviewed() {
    if (!item) return;
    setActing(true);
    try {
      const r = await apiClient.markProcessingActivityReviewed(item.id);
      onChanged(r.data);
    } finally {
      setActing(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setActing(true);
    try {
      await apiClient.deleteProcessingActivity(item.id);
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
        title={item.name}
        widthClassName="max-w-xl"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={stat.variant}>{stat.label}</Badge>
            <Badge variant="neutral" className="capitalize">
              {item.role.replace("_", " ")}
            </Badge>
            <Badge variant="info">{lawfulBasisLabel(item.lawfulBasis)}</Badge>
            {sensitive && <Badge variant="danger">Sensitive data</Badge>}
            {item.crossBorderTransfer && <Badge variant="warning">Cross-border transfer</Badge>}
          </div>

          <p className="whitespace-pre-line text-sm text-neutral-600 dark:text-neutral-400">
            {item.purpose}
          </p>

          {/* Suggestion banner: sensitive data + no DPIA → recommend a DPIA */}
          {sensitive && (item._count?.dpias ?? 0) === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <p className="font-medium">DPIA recommended</p>
              <p className="mt-1 text-xs">
                This activity processes special-category or otherwise sensitive data. GDPR Art. 35
                likely requires a Data Protection Impact Assessment.{" "}
                <Link
                  href={`/privacy/dpias?processingActivityId=${item.id}&new=1`}
                  className="font-medium underline"
                >
                  Start a DPIA
                </Link>
              </p>
            </div>
          )}

          <DetailGrid>
            <DetailField label="Owner">
              {item.owner?.name || <span className="italic text-neutral-400">Unassigned</span>}
            </DetailField>
            <DetailField label="Last reviewed">{formatDate(item.lastReviewedAt)}</DetailField>
            <DetailField label="Next review">{formatDate(item.nextReviewAt)}</DetailField>
            <DetailField label="Retention">{item.retentionPeriod || "—"}</DetailField>
          </DetailGrid>

          {item.lawfulBasisJustification && (
            <DetailLong title="Lawful basis justification">
              {item.lawfulBasisJustification}
            </DetailLong>
          )}

          <DetailGrid>
            <DetailField label="Data categories">
              <div className="mt-1 flex flex-wrap gap-1">
                {item.dataCategories.length === 0 ? (
                  <span className="italic text-neutral-400">—</span>
                ) : (
                  item.dataCategories.map((c) => (
                    <Badge
                      key={c}
                      variant={SENSITIVE_CATEGORIES.includes(c) ? "danger" : "neutral"}
                    >
                      {dataCategoryLabel(c)}
                    </Badge>
                  ))
                )}
              </div>
            </DetailField>
            <DetailField label="Subjects">
              <div className="mt-1 flex flex-wrap gap-1">
                {item.subjectCategories.length === 0 ? (
                  <span className="italic text-neutral-400">—</span>
                ) : (
                  item.subjectCategories.map((s) => (
                    <Badge key={s} variant="neutral">
                      {subjectCategoryLabel(s)}
                    </Badge>
                  ))
                )}
              </div>
            </DetailField>
          </DetailGrid>

          {item.dataElements.length > 0 && (
            <DetailField label="Specific data elements">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {item.dataElements.join(", ")}
              </p>
            </DetailField>
          )}

          {item.recipients.length > 0 && (
            <DetailField label="Recipients">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {item.recipients.join(", ")}
              </p>
            </DetailField>
          )}

          {item.crossBorderTransfer && (
            <DetailLong title="Cross-border transfer">
              <span>
                Mechanism: <strong>{transferMechanismLabel(item.transferMechanism)}</strong>
                <br />
                Destinations: {item.transferDestinations.join(", ") || "—"}
              </span>
            </DetailLong>
          )}

          {item.securityMeasures && (
            <DetailLong title="Security measures">{item.securityMeasures}</DetailLong>
          )}

          {item.vendors && item.vendors.length > 0 && (
            <DetailField label="Sub-processors">
              <div className="mt-1 flex flex-wrap gap-1">
                {item.vendors.map((v) => (
                  <Link
                    key={v.id}
                    href={`/vendors/${v.id}`}
                    className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    {v.name}
                  </Link>
                ))}
              </div>
            </DetailField>
          )}

          {item.dpias && item.dpias.length > 0 && (
            <div>
              <h4 className="border-b border-neutral-200 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                DPIAs ({item.dpias.length})
              </h4>
              <ul className="mt-2 space-y-1 text-sm">
                {item.dpias.map((d) => (
                  <li key={d.id} className="flex items-center justify-between">
                    <Link
                      href={`/privacy/dpias?id=${d.id}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {d.title}
                    </Link>
                    <span className="text-xs text-neutral-500">{d.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button size="sm" variant="secondary" loading={acting} onClick={handleMarkReviewed}>
              Mark reviewed
            </Button>
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

      <ProcessingActivityFormModal
        mode="edit"
        open={editing}
        initial={item}
        members={members}
        vendors={vendors}
        onClose={() => setEditing(false)}
        onSaved={(updated) => {
          setEditing(false);
          onChanged(updated);
        }}
      />
    </>
  );
}
