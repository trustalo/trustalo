"use client";

import { useCallback, useEffect, useState } from "react";
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
  type TaskItem,
  type TaskStats,
  type TaskStatus,
  type TaskPriority,
  type TaskSourceModule,
  type TaskFrequency,
  type CreateTaskInput,
  type OrgMember,
} from "@/lib/api-client";

// --- Constants ---

const MODULE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Modules" },
  { value: "training", label: "Training" },
  { value: "control", label: "Controls" },
  { value: "risk", label: "Risks" },
  { value: "evidence", label: "Evidence" },
  { value: "vendor", label: "Vendors" },
  { value: "asset", label: "Assets" },
  { value: "audit", label: "Audits" },
  { value: "policy", label: "Policies" },
  { value: "bcp", label: "Business Continuity" },
  { value: "incident", label: "Incidents" },
];

const STATUS_TABS = [
  { key: "all", label: "All Tasks" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const FREQUENCY_OPTIONS = [
  { value: "once", label: "One-time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const MODULE_LABELS: Record<TaskSourceModule, string> = {
  training: "Training",
  control: "Controls",
  risk: "Risks",
  evidence: "Evidence",
  vendor: "Vendors",
  asset: "Assets",
  audit: "Audits",
  policy: "Policies",
  bcp: "BCP",
  incident: "Incidents",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

function priorityBadgeVariant(priority: TaskPriority): BadgeVariant {
  switch (priority) {
    case "critical":
      return "danger";
    case "high":
      return "warning";
    case "medium":
      return "info";
    case "low":
      return "neutral";
  }
}

function statusBadgeVariant(status: TaskStatus): BadgeVariant {
  switch (status) {
    case "completed":
      return "success";
    case "in_progress":
      return "info";
    case "overdue":
      return "danger";
    case "pending":
    case "cancelled":
      return "neutral";
    // Defensive default keeps TS' control-flow analysis happy if a new
    // status is added to the API enum before this map is updated.
    default:
      return "neutral";
  }
}

function moduleBadgeVariant(mod: TaskSourceModule | null): BadgeVariant {
  if (!mod) return "neutral";
  switch (mod) {
    case "training":
      return "info";
    case "control":
      return "success";
    case "risk":
      return "warning";
    case "evidence":
      return "info";
    case "vendor":
      return "neutral";
    default:
      return "neutral";
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const INITIAL_FORM: CreateTaskInput = {
  title: "",
  description: "",
  priority: "medium",
  sourceModule: null,
  assigneeId: null,
  dueDate: null,
  frequency: "once",
};

const MEMBER_ONLY_ROLES = new Set(["member", "viewer"]);

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [userRole, setUserRole] = useState<string>("member");
  useEffect(() => {
    setUserRole(apiClient.getCurrentUserRole() ?? "member");
  }, []);
  const isMemberRole = MEMBER_ONLY_ROLES.has(userRole);

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [form, setForm] = useState<CreateTaskInput>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<OrgMember[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (search) params.search = search;
      if (statusTab !== "all") params.status = statusTab;
      if (priorityFilter !== "all") params.priority = priorityFilter;
      if (moduleFilter !== "all") params.sourceModule = moduleFilter;
      if (isMemberRole || myTasksOnly) params.myTasks = "true";

      const [tasksRes, statsRes] = await Promise.all([
        apiClient.listTasks(params),
        apiClient.getTaskStats(),
      ]);
      setTasks(tasksRes.data.items);
      setTotal(tasksRes.data.total);
      setStats(statsRes.data);
    } catch {
      // API might not be running
    } finally {
      setLoading(false);
    }
  }, [page, search, statusTab, priorityFilter, moduleFilter, myTasksOnly, isMemberRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function openCreate() {
    setEditingTask(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
    try {
      const res = await apiClient.listMembers();
      setMembers(res.data);
    } catch {
      // handle error
    }
  }

  async function openEdit(task: TaskItem) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      sourceModule: task.sourceModule,
      assigneeId: task.assigneeId,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : null,
      frequency: task.frequency || "once",
    });
    setModalOpen(true);
    try {
      const res = await apiClient.listMembers();
      setMembers(res.data);
    } catch {
      // handle error
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: CreateTaskInput = {
        ...form,
        description: form.description || null,
        dueDate: form.dueDate || null,
        assigneeId: form.assigneeId || null,
        sourceModule: form.sourceModule || null,
      };
      if (editingTask) {
        await apiClient.updateTask(editingTask.id, payload);
      } else {
        await apiClient.createTask(payload);
      }
      setModalOpen(false);
      fetchData();
    } catch {
      // error handling
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete(taskId: string) {
    try {
      await apiClient.completeTask(taskId);
      fetchData();
    } catch {
      // error handling
    }
  }

  async function handleDelete(taskId: string) {
    try {
      await apiClient.deleteTask(taskId);
      fetchData();
    } catch {
      // error handling
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Tasks</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Track and manage compliance tasks across all modules
          </p>
        </div>
        <Button onClick={openCreate}>Create Task</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label={isMemberRole ? "Pending" : "My Pending"}
          value={stats?.myPending ?? 0}
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          }
          color="blue"
        />
        <StatsCard
          label="Total Tasks"
          value={stats?.total ?? 0}
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
          color="neutral"
        />
        <StatsCard
          label="Overdue"
          value={stats?.overdueCount ?? 0}
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
          label="Completed"
          value={stats?.byStatus?.completed ?? 0}
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
      </div>

      {/* Module Breakdown */}
      {stats && Object.keys(stats.byModule).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.byModule).map(([mod, count]) => (
            <button
              key={mod}
              onClick={() => {
                setModuleFilter(mod === moduleFilter ? "all" : mod);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                moduleFilter === mod
                  ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              }`}
            >
              {MODULE_LABELS[mod as TaskSourceModule] || mod}
              <span className="rounded-full bg-neutral-200 px-1.5 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
                {count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Content Card */}
      <Card padding="none">
        {/* Status Tabs */}
        <div className="border-b border-neutral-200 dark:border-neutral-800">
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
                {tab.key !== "all" && stats?.byStatus?.[tab.key] != null && (
                  <span className="ml-1.5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-neutral-800">
                    {stats.byStatus[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-[200px] flex-1">
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-40">
            <Select
              options={PRIORITY_OPTIONS}
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-44">
            <Select
              options={MODULE_OPTIONS}
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {!isMemberRole && (
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800">
              <input
                type="checkbox"
                checked={myTasksOnly}
                onChange={(e) => {
                  setMyTasksOnly(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-neutral-600 dark:text-neutral-300">My tasks only</span>
            </label>
          )}
        </div>

        {/* Tasks Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState onCreateClick={openCreate} />
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Task</TableHeader>
                  <TableHeader>Module</TableHeader>
                  <TableHeader>Priority</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Assignee</TableHeader>
                  <TableHeader>Due Date</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{task.title}</p>
                        {task.description && (
                          <p className="mt-0.5 max-w-sm truncate text-xs text-neutral-400 dark:text-neutral-500">
                            {task.description}
                          </p>
                        )}
                        {task.frequency && task.frequency !== "once" && (
                          <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-blue-500">
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Recurring ({task.frequency})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.sourceModule ? (
                        <Badge variant={moduleBadgeVariant(task.sourceModule)}>
                          {MODULE_LABELS[task.sourceModule]}
                        </Badge>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityBadgeVariant(task.priority)}>
                        {PRIORITY_LABELS[task.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(task.status)}>
                        {STATUS_LABELS[task.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.assignee ? (
                        <div>
                          <p className="text-sm text-neutral-900 dark:text-white">
                            {task.assignee.name}
                          </p>
                        </div>
                      ) : (
                        <span className="text-neutral-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          task.isOverdue
                            ? "font-medium text-red-600 dark:text-red-400"
                            : "text-neutral-500"
                        }
                      >
                        {formatDate(task.dueDate)}
                        {task.isOverdue && <span className="ml-1 text-xs">(overdue)</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {task.status !== "completed" && task.status !== "cancelled" && (
                          <Button variant="ghost" size="sm" onClick={() => handleComplete(task.id)}>
                            Complete
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEdit(task)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                          onClick={() => handleDelete(task.id)}
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
        title={editingTask ? "Edit Task" : "Create Task"}
        description={
          editingTask ? "Update task details." : "Create a new compliance task and assign it."
        }
        size="lg"
      >
        <div className="space-y-4">
          <Input
            id="task-title"
            label="Title"
            placeholder="e.g., Complete annual security awareness training"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <Textarea
            id="task-description"
            label="Description"
            placeholder="Details about what needs to be done..."
            value={form.description ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              id="task-priority"
              label="Priority"
              options={PRIORITY_OPTIONS.filter((o) => o.value !== "all")}
              value={form.priority ?? "medium"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  priority: e.target.value as TaskPriority,
                }))
              }
            />
            <Select
              id="task-module"
              label="Related Module"
              options={MODULE_OPTIONS}
              value={form.sourceModule ?? "all"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  sourceModule:
                    e.target.value === "all" ? null : (e.target.value as TaskSourceModule),
                }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="task-due"
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
            <Select
              id="task-frequency"
              label="Recurrence"
              options={FREQUENCY_OPTIONS}
              value={form.frequency ?? "once"}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  frequency: e.target.value as TaskFrequency,
                }))
              }
            />
          </div>
          <Select
            id="task-assignee"
            label="Assignee"
            placeholder="Select assignee..."
            options={members.map((m) => ({
              value: m.id,
              label: `${m.name} (${m.email})`,
            }))}
            value={form.assigneeId ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                assigneeId: e.target.value || null,
              }))
            }
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.title.trim()}>
              {editingTask ? "Save Changes" : "Create Task"}
            </Button>
          </div>
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
  color: "blue" | "emerald" | "red" | "amber" | "neutral";
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
    neutral: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">No tasks yet</h3>
      <p className="mt-1 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
        Create tasks to track compliance activities across training, controls, risks, evidence,
        vendors, and more.
      </p>
      <Button className="mt-4" onClick={onCreateClick}>
        Create First Task
      </Button>
    </div>
  );
}
