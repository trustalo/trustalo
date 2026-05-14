"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import type { AuditItem, AuditType, AuditStatus, CreateAuditInput } from "@/lib/api-client";

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

const AUDIT_TYPE_OPTIONS = [
  { value: "internal", label: "Internal" },
  { value: "external", label: "External" },
  { value: "certification", label: "Certification" },
];

const AUDIT_STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AuditsPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canWrite = hasPermission("audits:write");

  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const fetchAudits = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: "20" };
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      if (search.trim()) params.search = search.trim();
      const res = await apiClient.listAudits(params);
      setAudits(res.data.items);
      setTotal(res.data.total);
    } catch {
      setAudits([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType, search]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const stats = useMemo(() => {
    return {
      total,
      planned: audits.filter((a) => a.status === "planned").length,
      inProgress: audits.filter((a) => a.status === "in_progress").length,
      completed: audits.filter((a) => a.status === "completed").length,
      totalFindings: audits.reduce((sum, a) => sum + (a._count?.findings ?? 0), 0),
    };
  }, [audits, total]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Audits</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Plan, track, and manage internal and external audit activities
          </p>
        </div>
        {canWrite && <Button onClick={() => setShowCreate(true)}>Schedule Audit</Button>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        <StatCard label="Total Audits" value={stats.total} color="blue" />
        <StatCard label="Planned" value={stats.planned} color="gray" />
        <StatCard label="In Progress" value={stats.inProgress} color="indigo" />
        <StatCard label="Completed" value={stats.completed} color="emerald" />
        <StatCard label="Open Findings" value={stats.totalFindings} color="amber" />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <Input
              label="Search"
              placeholder="Search audits by name…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-44">
            <Select
              label="Status"
              placeholder="All statuses"
              options={AUDIT_STATUS_OPTIONS}
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-44">
            <Select
              label="Type"
              placeholder="All types"
              options={AUDIT_TYPE_OPTIONS}
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {(filterStatus || filterType || search) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStatus("");
                setFilterType("");
                setSearch("");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-neutral-400">
            Loading audits…
          </div>
        ) : audits.length === 0 ? (
          <EmptyState canWrite={canWrite} onCreate={() => setShowCreate(true)} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Audit</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Start</TableHeader>
                  <TableHeader>End</TableHeader>
                  <TableHeader>Findings</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {audits.map((audit) => (
                  <TableRow
                    key={audit.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/audits/${audit.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">
                          {audit.title}
                        </p>
                        {audit.auditorOrganization && (
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {audit.auditorOrganization}
                            {audit.auditorName ? ` · ${audit.auditorName}` : ""}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={TYPE_CONFIG[audit.type].variant}>
                        {TYPE_CONFIG[audit.type].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_CONFIG[audit.status].variant}>
                        {STATUS_CONFIG[audit.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-neutral-500 text-sm">
                      {formatDate(audit.scheduledStartDate)}
                    </TableCell>
                    <TableCell className="text-neutral-500 text-sm">
                      {formatDate(audit.scheduledEndDate)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm tabular-nums">{audit._count?.findings ?? 0}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <p className="text-xs text-neutral-500">
                  Page {page} of {totalPages} · {total} audit{total !== 1 ? "s" : ""}
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
          </>
        )}
      </Card>

      {/* Create Modal */}
      {showCreate && (
        <CreateAuditModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchAudits();
          }}
        />
      )}
    </div>
  );
}

// ─── Stat card ──────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    gray: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
    indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  };

  return (
    <div className={`rounded-xl px-4 py-3 ${colorMap[color] ?? colorMap.gray}`}>
      <p className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────
function EmptyState({ canWrite, onCreate }: { canWrite: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <svg
        className="h-12 w-12 text-neutral-300 dark:text-neutral-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
      <p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
        No audits found
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        {canWrite
          ? "Schedule your first audit to get started."
          : "Audits will appear here once they are created."}
      </p>
      {canWrite && (
        <Button size="sm" className="mt-4" onClick={onCreate}>
          Schedule Audit
        </Button>
      )}
    </div>
  );
}

// ─── Create Modal ───────────────────────────────────────────
function CreateAuditModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateAuditInput>({
    title: "",
    type: "internal",
    description: "",
    auditorName: "",
    auditorOrganization: "",
    scheduledStartDate: "",
    scheduledEndDate: "",
  });

  const set = (key: keyof CreateAuditInput, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload: CreateAuditInput = {
        title: form.title.trim(),
        type: form.type,
        description: form.description || null,
        auditorName: form.auditorName || null,
        auditorOrganization: form.auditorOrganization || null,
        scheduledStartDate: form.scheduledStartDate || null,
        scheduledEndDate: form.scheduledEndDate || null,
      };
      await apiClient.createAudit(payload);
      onCreated();
    } catch {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Schedule Audit"
      description="Create a new audit engagement"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          required
          placeholder="e.g. SOC 2 Type II Annual Audit"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
        <Select
          label="Type"
          options={AUDIT_TYPE_OPTIONS}
          value={form.type}
          onChange={(e) => set("type", e.target.value)}
        />
        <Textarea
          label="Description"
          placeholder="Scope, objectives, and other details…"
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Auditor Name"
            placeholder="Jane Smith"
            value={form.auditorName ?? ""}
            onChange={(e) => set("auditorName", e.target.value)}
          />
          <Input
            label="Audit Firm"
            placeholder="Deloitte"
            value={form.auditorOrganization ?? ""}
            onChange={(e) => set("auditorOrganization", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Date"
            type="date"
            value={typeof form.scheduledStartDate === "string" ? form.scheduledStartDate : ""}
            onChange={(e) => set("scheduledStartDate", e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={typeof form.scheduledEndDate === "string" ? form.scheduledEndDate : ""}
            onChange={(e) => set("scheduledEndDate", e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!form.title.trim()}>
            Create Audit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
