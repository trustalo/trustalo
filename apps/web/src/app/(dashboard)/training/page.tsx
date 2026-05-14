"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
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
  type TrainingProgram,
  type TrainingStats,
  type TrainingType,
  type TrainingFrequency,
  type CreateTrainingInput,
} from "@/lib/api-client";

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "security_awareness", label: "Security Awareness" },
  { value: "compliance", label: "Compliance" },
  { value: "phishing_simulation", label: "Phishing Simulation" },
  { value: "custom", label: "Custom" },
];

const STATUS_TABS = [
  { key: "all", label: "All Programs" },
  { key: "active", label: "Active" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
] as const;

const FREQUENCY_OPTIONS = [
  { value: "once", label: "One-time" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

const TYPE_LABELS: Record<TrainingType, string> = {
  security_awareness: "Security Awareness",
  compliance: "Compliance",
  phishing_simulation: "Phishing Simulation",
  custom: "Custom",
};

const FREQUENCY_LABELS: Record<TrainingFrequency, string> = {
  once: "One-time",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annually: "Annually",
};

function typeBadgeVariant(type: TrainingType): BadgeVariant {
  switch (type) {
    case "security_awareness":
      return "info";
    case "compliance":
      return "success";
    case "phishing_simulation":
      return "warning";
    case "custom":
      return "neutral";
  }
}

function completionColor(rate: number): string {
  if (rate >= 80) return "bg-emerald-500";
  if (rate >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const INITIAL_FORM: CreateTrainingInput = {
  title: "",
  type: "security_awareness",
  description: "",
  frequency: "annually",
  isRequired: true,
  dueDate: null,
};

export default function TrainingPage() {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusTab, setStatusTab] = useState<string>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [form, setForm] = useState<CreateTrainingInput>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TrainingProgram | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (search) params.search = search;
      if (typeFilter !== "all") params.type = typeFilter;
      if (statusTab !== "all") params.status = statusTab;

      const [programsRes, statsRes] = await Promise.all([
        apiClient.listTrainingPrograms(params),
        apiClient.getTrainingStats(),
      ]);
      setPrograms(programsRes.data.items);
      setTotal(programsRes.data.total);
      setStats(statsRes.data);
    } catch {
      // API might not be available yet during dev
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, statusTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreate() {
    setEditingProgram(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
  }

  function openEdit(program: TrainingProgram) {
    setEditingProgram(program);
    setForm({
      title: program.title,
      type: program.type,
      description: program.description || "",
      frequency: program.frequency,
      isRequired: program.isRequired,
      dueDate: program.dueDate ? program.dueDate.slice(0, 10) : null,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        dueDate: form.dueDate || null,
        description: form.description || null,
      };
      if (editingProgram) {
        await apiClient.updateTrainingProgram(editingProgram.id, payload);
      } else {
        await apiClient.createTrainingProgram(payload);
      }
      setModalOpen(false);
      fetchData();
    } catch {
      // error handling
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.deleteTrainingProgram(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch {
      // error handling
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Training</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Manage security awareness and compliance training programs for your organization
          </p>
        </div>
        <Button onClick={openCreate}>Create Program</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Programs"
          value={stats?.totalPrograms ?? 0}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          }
          color="blue"
        />
        <StatsCard
          label="Completion Rate"
          value={`${stats?.overallCompletionRate ?? 0}%`}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          color="emerald"
        />
        <StatsCard
          label="Overdue"
          value={stats?.overduePrograms ?? 0}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          color="red"
        />
        <StatsCard
          label="Employees Assigned"
          value={stats?.totalAssigned ?? 0}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
          color="amber"
        />
      </div>

      {/* Filters & Search */}
      <Card padding="none">
        <div className="border-b border-neutral-200 dark:border-neutral-800">
          {/* Status Tabs */}
          <div className="flex gap-0 px-4">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusTab(tab.key);
                  setPage(1);
                }}
                className={`relative border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  statusTab === tab.key
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-[240px] flex-1">
            <Input
              placeholder="Search programs..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-48">
            <Select
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : programs.length === 0 ? (
          <EmptyState onCreateClick={openCreate} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Program</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Frequency</TableHeader>
                  <TableHeader>Required</TableHeader>
                  <TableHeader>Completion</TableHeader>
                  <TableHeader>Due Date</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {programs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell>
                      <Link
                        href={`/training/${program.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {program.title}
                      </Link>
                      {program.description && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-400 dark:text-neutral-500">
                          {program.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeBadgeVariant(program.type)}>
                        {TYPE_LABELS[program.type]}
                      </Badge>
                    </TableCell>
                    <TableCell>{FREQUENCY_LABELS[program.frequency]}</TableCell>
                    <TableCell>
                      {program.isRequired ? (
                        <Badge variant="danger">Required</Badge>
                      ) : (
                        <Badge variant="neutral">Optional</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                          <div
                            className={`h-full rounded-full transition-all ${completionColor(program.completionRate)}`}
                            style={{
                              width: `${program.completionRate}%`,
                            }}
                          />
                        </div>
                        <span className="min-w-[3ch] text-xs text-neutral-500">
                          {program.completionRate}%
                        </span>
                        <span className="text-xs text-neutral-400">
                          ({program.completedCount}/{program.totalAssigned})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          program.isOverdue
                            ? "font-medium text-red-600 dark:text-red-400"
                            : "text-neutral-500"
                        }
                      >
                        {formatDate(program.dueDate)}
                        {program.isOverdue && <span className="ml-1 text-xs">(overdue)</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(program)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                          onClick={() => setDeleteTarget(program)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <p className="text-sm text-neutral-500">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
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

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProgram ? "Edit Program" : "Create Training Program"}
        description={
          editingProgram
            ? "Update the details of this training program."
            : "Set up a new training program and assign it to employees."
        }
        size="lg"
      >
        <div className="space-y-4">
          <Input
            id="title"
            label="Program Title"
            placeholder="e.g., Security Awareness Training"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            id="description"
            label="Description"
            placeholder="Brief description of the training program..."
            value={form.description ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              id="type"
              label="Type"
              options={TYPE_OPTIONS.filter((o) => o.value !== "all")}
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  type: e.target.value as TrainingType,
                }))
              }
            />
            <Select
              id="frequency"
              label="Frequency"
              options={FREQUENCY_OPTIONS}
              value={form.frequency ?? "annually"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  frequency: e.target.value as TrainingFrequency,
                }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="dueDate"
              label="Due Date"
              type="date"
              value={form.dueDate ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  dueDate: e.target.value || null,
                }))
              }
            />
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={form.isRequired ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, isRequired: e.target.checked }))}
                  className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                Required for all employees
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.title.trim()}>
              {editingProgram ? "Save Changes" : "Create Program"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Program"
        description="This action cannot be undone."
        size="sm"
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? All associated
          completion records will also be removed.
        </p>
        <div className="mt-4 flex justify-end gap-3">
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

// --- Sub-components ---

function StatsCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "emerald" | "red" | "amber";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  };

  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`rounded-lg p-2.5 ${colorMap[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
        <svg
          className="h-8 w-8 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
        No training programs yet
      </h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
        Create your first training program to start tracking security awareness and compliance
        training across your organization.
      </p>
      <Button className="mt-4" onClick={onCreateClick}>
        Create First Program
      </Button>
    </div>
  );
}
