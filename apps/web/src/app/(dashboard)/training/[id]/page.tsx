"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  type TrainingProgramDetail,
  type TrainingCompletion,
  type TrainingCompletionStatus,
  type TrainingType,
  type TrainingFrequency,
  type OrgMember,
  type TrainingQuizListItem,
} from "@/lib/api-client";

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

function statusBadgeVariant(status: TrainingCompletionStatus): BadgeVariant {
  switch (status) {
    case "completed":
      return "success";
    case "in_progress":
      return "info";
    case "overdue":
      return "danger";
    case "assigned":
      return "neutral";
  }
}

const STATUS_LABELS: Record<TrainingCompletionStatus, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TrainingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [program, setProgram] = useState<TrainingProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);
  const [quizzes, setQuizzes] = useState<TrainingQuizListItem[]>([]);
  const [userRole, setUserRole] = useState<string>("member");
  const [detailTab, setDetailTab] = useState<"quizzes" | "progress">("quizzes");

  useEffect(() => {
    setUserRole(apiClient.getCurrentUserRole() ?? "member");
  }, []);

  const isOfficer = !["member", "viewer"].includes(userRole);

  const fetchProgram = useCallback(async () => {
    setLoading(true);
    try {
      const [programRes, quizzesRes] = await Promise.all([
        apiClient.getTrainingProgram(id),
        apiClient.listQuizzes(id),
      ]);
      setProgram(programRes.data);
      setQuizzes(quizzesRes.data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  async function openAssignModal() {
    setAssignModalOpen(true);
    try {
      const res = await apiClient.listMembers();
      setMembers(res.data);
    } catch {
      // handle error
    }
  }

  async function handleAssign() {
    if (selectedUserIds.size === 0) return;
    setAssigning(true);
    try {
      await apiClient.assignTrainingUsers(id, Array.from(selectedUserIds));
      setAssignModalOpen(false);
      setSelectedUserIds(new Set());
      fetchProgram();
    } catch {
      // handle error
    } finally {
      setAssigning(false);
    }
  }

  async function handleStatusChange(
    completion: TrainingCompletion,
    newStatus: TrainingCompletionStatus,
  ) {
    try {
      await apiClient.updateTrainingCompletion(id, completion.id, {
        status: newStatus,
      });
      fetchProgram();
    } catch {
      // handle error
    }
  }

  async function handleRemoveCompletion(completionId: string) {
    try {
      await apiClient.removeTrainingCompletion(id, completionId);
      fetchProgram();
    } catch {
      // handle error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-500 dark:text-neutral-400">Program not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push("/training")}>
          Back to Training
        </Button>
      </div>
    );
  }

  const completions = program.completions ?? [];
  const totalAssigned = completions.length;
  const completedCount = completions.filter((c) => c.status === "completed").length;
  const inProgressCount = completions.filter((c) => c.status === "in_progress").length;
  const overdueCount = completions.filter((c) => c.status === "overdue").length;
  const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  const assignedUserIds = new Set(completions.map((c) => c.userId));
  const availableMembers = members.filter((m) => !assignedUserIds.has(m.id));

  return (
    <div className="space-y-6">
      {/* Back + Title */}
      <div>
        <button
          onClick={() => router.push("/training")}
          className="mb-3 flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Training
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{program.title}</h1>
            {program.description && (
              <p className="mt-1 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
                {program.description}
              </p>
            )}
          </div>
          <Button onClick={openAssignModal}>Assign Employees</Button>
        </div>
      </div>

      {/* Program Info + Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              Program Details
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500 dark:text-neutral-400">Type</dt>
                <dd className="font-medium text-neutral-900 dark:text-white">
                  {TYPE_LABELS[program.type]}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500 dark:text-neutral-400">Frequency</dt>
                <dd className="font-medium text-neutral-900 dark:text-white">
                  {FREQUENCY_LABELS[program.frequency]}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500 dark:text-neutral-400">Required</dt>
                <dd>
                  {program.isRequired ? (
                    <Badge variant="danger">Required</Badge>
                  ) : (
                    <Badge variant="neutral">Optional</Badge>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500 dark:text-neutral-400">Due Date</dt>
                <dd className="font-medium text-neutral-900 dark:text-white">
                  {formatDate(program.dueDate)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500 dark:text-neutral-400">Created</dt>
                <dd className="font-medium text-neutral-900 dark:text-white">
                  {formatDate(program.createdAt)}
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            Completion Overview
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniStat label="Total Assigned" value={totalAssigned} />
            <MiniStat
              label="Completed"
              value={completedCount}
              valueClass="text-emerald-600 dark:text-emerald-400"
            />
            <MiniStat
              label="In Progress"
              value={inProgressCount}
              valueClass="text-blue-600 dark:text-blue-400"
            />
            <MiniStat
              label="Overdue"
              value={overdueCount}
              valueClass="text-red-600 dark:text-red-400"
            />
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Overall Progress</span>
              <span className="font-semibold text-neutral-900 dark:text-white">
                {completionRate}%
              </span>
            </div>
            <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabbed Section: Quizzes / Employee Progress */}
      <Card padding="none">
        <div className="border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between px-6">
            <nav className="-mb-px flex gap-6">
              <button
                onClick={() => setDetailTab("quizzes")}
                className={`border-b-2 py-3.5 text-sm font-medium transition-colors ${
                  detailTab === "quizzes"
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                    />
                  </svg>
                  Quizzes
                  {quizzes.length > 0 && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {quizzes.length}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setDetailTab("progress")}
                className={`border-b-2 py-3.5 text-sm font-medium transition-colors ${
                  detailTab === "progress"
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                  Employee Progress
                  {completions.length > 0 && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                      {completions.length}
                    </span>
                  )}
                </span>
              </button>
            </nav>
            {detailTab === "quizzes" && isOfficer && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/training/${id}/quiz`)}
              >
                Manage Quizzes
              </Button>
            )}
          </div>
        </div>

        {/* Quizzes Tab Content */}
        {detailTab === "quizzes" && (
          <div className="p-6">
            {quizzes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 py-10 text-center dark:border-neutral-700">
                <svg
                  className="mx-auto h-8 w-8 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  />
                </svg>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  No quizzes created yet.
                  {isOfficer && ' Click "Manage Quizzes" to create one.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-700"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {quiz.title}
                        </p>
                        {quiz.isPublished ? (
                          <Badge variant="success">Published</Badge>
                        ) : (
                          <Badge variant="neutral">Draft</Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex gap-3 text-xs text-neutral-400">
                        <span>{quiz._count.questions} questions</span>
                        <span>Pass: {quiz.passingScore}%</span>
                        <span>{quiz._count.attempts} attempts</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {quiz.isPublished && (
                        <Button
                          size="sm"
                          onClick={() => router.push(`/training/${id}/quiz/${quiz.id}/take`)}
                        >
                          Take Quiz
                        </Button>
                      )}
                      {isOfficer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/training/${id}/quiz/${quiz.id}/results`)}
                        >
                          Results
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Employee Progress Tab Content */}
        {detailTab === "progress" && (
          <>
            {completions.length === 0 ? (
              <div className="py-12 text-center">
                <svg
                  className="mx-auto h-8 w-8 text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  No employees assigned yet. Click &quot;Assign Employees&quot; to get started.
                </p>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Employee</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Assigned</TableHeader>
                    <TableHeader>Completed</TableHeader>
                    <TableHeader>Score</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {completions.map((completion) => (
                    <TableRow key={completion.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {completion.user.name}
                          </p>
                          <p className="text-xs text-neutral-400">{completion.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(completion.status)}>
                          {STATUS_LABELS[completion.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(completion.assignedAt)}</TableCell>
                      <TableCell>{formatDate(completion.completedAt)}</TableCell>
                      <TableCell>
                        {completion.score != null ? `${completion.score}%` : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {completion.status !== "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(completion, "completed")}
                            >
                              Mark Complete
                            </Button>
                          )}
                          {completion.status === "assigned" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(completion, "in_progress")}
                            >
                              Start
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                            onClick={() => handleRemoveCompletion(completion.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </Card>

      {/* Assign Employees Modal */}
      <Modal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedUserIds(new Set());
        }}
        title="Assign Employees"
        description="Select employees to assign to this training program."
        size="lg"
      >
        {availableMembers.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
            All organization members are already assigned to this program.
          </p>
        ) : (
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {availableMembers.map((member) => (
              <label
                key={member.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.has(member.id)}
                  onChange={(e) => {
                    const next = new Set(selectedUserIds);
                    if (e.target.checked) {
                      next.add(member.id);
                    } else {
                      next.delete(member.id);
                    }
                    setSelectedUserIds(next);
                  }}
                  className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {member.name}
                  </p>
                  <p className="text-xs text-neutral-400">{member.email}</p>
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-between">
          {availableMembers.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (selectedUserIds.size === availableMembers.length) {
                  setSelectedUserIds(new Set());
                } else {
                  setSelectedUserIds(new Set(availableMembers.map((m) => m.id)));
                }
              }}
            >
              {selectedUserIds.size === availableMembers.length ? "Deselect All" : "Select All"}
            </Button>
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setAssignModalOpen(false);
                setSelectedUserIds(new Set());
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              loading={assigning}
              disabled={selectedUserIds.size === 0}
            >
              Assign ({selectedUserIds.size})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MiniStat({
  label,
  value,
  valueClass = "text-neutral-900 dark:text-white",
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
    </div>
  );
}
