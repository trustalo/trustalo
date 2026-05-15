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
import { MiniEditor } from "@/components/ui/mini-editor";
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
  type BCPPlanDetail,
  type BCPStatus,
  type CriticalityLevel,
  type BCPExerciseType,
  type BCPExerciseStatus,
  type OrgMember,
} from "@/lib/api-client";

// ── Constants ──

type TabId = "overview" | "bia" | "exercises";

const STATUS_BADGE: Record<BCPStatus, { variant: BadgeVariant; label: string }> = {
  draft: { variant: "neutral", label: "Draft" },
  under_review: { variant: "warning", label: "Under Review" },
  approved: { variant: "info", label: "Approved" },
  active: { variant: "success", label: "Active" },
  archived: { variant: "neutral", label: "Archived" },
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const CRITICALITY_OPTIONS = [
  { value: "mission_critical", label: "Mission Critical" },
  { value: "business_critical", label: "Business Critical" },
  { value: "business_operational", label: "Business Operational" },
  { value: "administrative", label: "Administrative" },
];

const CRITICALITY_BADGE: Record<CriticalityLevel, { variant: BadgeVariant; label: string }> = {
  mission_critical: { variant: "danger", label: "Mission Critical" },
  business_critical: { variant: "warning", label: "Business Critical" },
  business_operational: { variant: "info", label: "Business Operational" },
  administrative: { variant: "neutral", label: "Administrative" },
};

const EXERCISE_TYPE_OPTIONS = [
  { value: "tabletop", label: "Tabletop" },
  { value: "walkthrough", label: "Walkthrough" },
  { value: "simulation", label: "Simulation" },
  { value: "full_scale", label: "Full Scale" },
];

const EXERCISE_TYPE_LABEL: Record<BCPExerciseType, string> = {
  tabletop: "Tabletop",
  walkthrough: "Walkthrough",
  simulation: "Simulation",
  full_scale: "Full Scale",
};

// Mirrors the `BCPExerciseStatus` Prisma enum
// (apps/api/prisma/schema/bcp.prisma): planned | scheduled | in_progress
// | conducted | reviewed | cancelled. The page previously only mapped
// 3 of the 6 values, which made TypeScript complain and would have
// rendered no badge at all once an exercise transitioned to the
// scheduled / in_progress / cancelled states.
const EXERCISE_STATUS_BADGE: Record<BCPExerciseStatus, { variant: BadgeVariant; label: string }> = {
  planned: { variant: "info", label: "Planned" },
  scheduled: { variant: "info", label: "Scheduled" },
  in_progress: { variant: "warning", label: "In Progress" },
  conducted: { variant: "warning", label: "Conducted" },
  reviewed: { variant: "success", label: "Reviewed" },
  cancelled: { variant: "neutral", label: "Cancelled" },
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatHours(hours: number): string {
  if (hours < 1) return `${hours * 60}m`;
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remaining = hours % 24;
  return remaining > 0 ? `${days}d ${remaining}h` : `${days}d`;
}

function SpinnerIcon() {
  return (
    <svg className="h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ── Page ──

export default function BCPDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [plan, setPlan] = useState<BCPPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [biaCreateOpen, setBiaCreateOpen] = useState(false);
  const [exerciseCreateOpen, setExerciseCreateOpen] = useState(false);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getBCPPlan(planId);
      setPlan(res.data);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  useEffect(() => {
    apiClient
      .listMembers()
      .then((r) => setMembers(r.data))
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <SpinnerIcon />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Plan not found</h2>
        <p className="mt-2 text-sm text-neutral-500">
          The business continuity plan you are looking for does not exist.
        </p>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => router.push("/business-continuity")}
        >
          Back to Plans
        </Button>
      </div>
    );
  }

  const statusBadge = STATUS_BADGE[plan.status];

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "bia", label: "Impact Analysis", count: plan.impactAnalyses.length },
    { id: "exercises", label: "Exercises", count: plan.exercises.length },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Header */}
      <div>
        <button
          onClick={() => router.push("/business-continuity")}
          className="mb-3 flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Business Continuity
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{plan.title}</h1>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit Plan
            </Button>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          </div>
        </div>
        {plan.description && (
          <p className="mt-2 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
            {plan.description}
          </p>
        )}
      </div>

      {/* Plan details summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Owner</p>
          <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">
            {plan.owner?.name || "Unassigned"}
          </p>
          {plan.owner?.email && <p className="text-xs text-neutral-400">{plan.owner.email}</p>}
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">Version</p>
          <p className="mt-1 font-mono text-sm text-neutral-900 dark:text-white">
            {plan.version || "—"}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Last Reviewed
          </p>
          <p className="mt-1 text-sm text-neutral-900 dark:text-white">
            {formatDate(plan.lastReviewedAt)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Next Review
          </p>
          <p
            className={`mt-1 text-sm ${plan.nextReviewDate && new Date(plan.nextReviewDate) < new Date() ? "font-medium text-red-600" : "text-neutral-900 dark:text-white"}`}
          >
            {formatDate(plan.nextReviewDate)}
            {plan.nextReviewDate && new Date(plan.nextReviewDate) < new Date() && (
              <span className="ml-1 text-xs">(overdue)</span>
            )}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab plan={plan} />}
      {activeTab === "bia" && (
        <BIATab plan={plan} onAdd={() => setBiaCreateOpen(true)} onRefresh={fetchPlan} />
      )}
      {activeTab === "exercises" && (
        <ExercisesTab plan={plan} onAdd={() => setExerciseCreateOpen(true)} onRefresh={fetchPlan} />
      )}

      {/* Modals */}
      <EditPlanModal
        open={editOpen}
        plan={plan}
        members={members}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          fetchPlan();
        }}
      />

      <DeletePlanModal
        open={deleteOpen}
        plan={plan}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => router.push("/business-continuity")}
      />

      <CreateBIAModal
        open={biaCreateOpen}
        bcpId={planId}
        onClose={() => setBiaCreateOpen(false)}
        onCreated={() => {
          setBiaCreateOpen(false);
          fetchPlan();
        }}
      />

      <CreateExerciseModal
        open={exerciseCreateOpen}
        bcpId={planId}
        onClose={() => setExerciseCreateOpen(false)}
        onCreated={() => {
          setExerciseCreateOpen(false);
          fetchPlan();
        }}
      />
    </div>
  );
}

// ── Overview Tab ──

function OverviewTab({ plan }: { plan: BCPPlanDetail }) {
  const topBIA = plan.impactAnalyses
    .filter(
      (b) =>
        b.criticalityLevel === "mission_critical" || b.criticalityLevel === "business_critical",
    )
    .slice(0, 5);

  const upcomingExercises = plan.exercises
    .filter((e) => e.status === "planned" && e.scheduledDate)
    .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Quick stats */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Plan Summary
        </h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-neutral-500">Impact Analyses</dt>
            <dd className="mt-0.5 text-lg font-semibold text-neutral-900 dark:text-white">
              {plan.impactAnalyses.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Exercises</dt>
            <dd className="mt-0.5 text-lg font-semibold text-neutral-900 dark:text-white">
              {plan.exercises.length}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Mission Critical Processes</dt>
            <dd className="mt-0.5 text-lg font-semibold text-red-600">
              {plan.impactAnalyses.filter((b) => b.criticalityLevel === "mission_critical").length}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-500">Exercises Completed</dt>
            <dd className="mt-0.5 text-lg font-semibold text-emerald-600">
              {plan.exercises.filter((e) => e.status === "reviewed").length}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Timeline card */}
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Timeline
        </h3>
        <div className="space-y-3">
          <TimelineRow label="Created" date={plan.createdAt} />
          {plan.approvedAt && <TimelineRow label="Approved" date={plan.approvedAt} />}
          {plan.lastReviewedAt && <TimelineRow label="Last Reviewed" date={plan.lastReviewedAt} />}
          {plan.nextReviewDate && (
            <TimelineRow
              label="Next Review"
              date={plan.nextReviewDate}
              highlight={new Date(plan.nextReviewDate) < new Date()}
            />
          )}
          <TimelineRow label="Last Updated" date={plan.updatedAt} />
        </div>
      </Card>

      {/* Critical BIA */}
      {topBIA.length > 0 && (
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Critical Business Processes
          </h3>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Process</TableHeader>
                <TableHeader>Criticality</TableHeader>
                <TableHeader>RTO</TableHeader>
                <TableHeader>RPO</TableHeader>
                <TableHeader>MTD</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {topBIA.map((bia) => {
                const crit = CRITICALITY_BADGE[bia.criticalityLevel];
                return (
                  <TableRow key={bia.id}>
                    <TableCell className="font-medium">{bia.processName}</TableCell>
                    <TableCell>
                      <Badge variant={crit.variant}>{crit.label}</Badge>
                    </TableCell>
                    <TableCell>{formatHours(bia.rtoHours)}</TableCell>
                    <TableCell>{formatHours(bia.rpoHours)}</TableCell>
                    <TableCell>{formatHours(bia.maxTolerableDowntimeHours)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Upcoming exercises */}
      {upcomingExercises.length > 0 && (
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Upcoming Exercises
          </h3>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Exercise</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Scheduled</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {upcomingExercises.map((ex) => {
                const sb = EXERCISE_STATUS_BADGE[ex.status];
                return (
                  <TableRow key={ex.id}>
                    <TableCell className="font-medium">{ex.title}</TableCell>
                    <TableCell>{EXERCISE_TYPE_LABEL[ex.type]}</TableCell>
                    <TableCell>{formatDate(ex.scheduledDate)}</TableCell>
                    <TableCell>
                      <Badge variant={sb.variant}>{sb.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function TimelineRow({
  label,
  date,
  highlight,
}: {
  label: string;
  date: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-500">{label}</span>
      <span
        className={`text-sm ${highlight ? "font-medium text-red-600 dark:text-red-400" : "text-neutral-900 dark:text-white"}`}
      >
        {formatDate(date)}
      </span>
    </div>
  );
}

// ── BIA Tab ──

function BIATab({
  plan,
  onAdd,
  onRefresh,
}: {
  plan: BCPPlanDetail;
  onAdd: () => void;
  onRefresh: () => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(biaId: string) {
    setDeleting(biaId);
    try {
      await apiClient.deleteBIA(plan.id, biaId);
      onRefresh();
    } catch {
      /* ignore */
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Identify critical business processes and their recovery objectives.
        </p>
        <Button size="sm" onClick={onAdd}>
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Process
        </Button>
      </div>

      {plan.impactAnalyses.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <svg
                className="h-5 w-5 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
              No impact analyses yet
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Add business processes to assess their criticality and recovery targets.
            </p>
            <Button className="mt-4" size="sm" onClick={onAdd}>
              Add Process
            </Button>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Process</TableHeader>
                <TableHeader>Criticality</TableHeader>
                <TableHeader>RTO</TableHeader>
                <TableHeader>RPO</TableHeader>
                <TableHeader>MTD</TableHeader>
                <TableHeader>Financial Impact/hr</TableHeader>
                <TableHeader>Dependencies</TableHeader>
                <TableHeader className="w-20"></TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {plan.impactAnalyses.map((bia) => {
                const crit = CRITICALITY_BADGE[bia.criticalityLevel];
                return (
                  <TableRow key={bia.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{bia.processName}</span>
                        {bia.description && (
                          <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-500">
                            {bia.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={crit.variant}>{crit.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{formatHours(bia.rtoHours)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{formatHours(bia.rpoHours)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {formatHours(bia.maxTolerableDowntimeHours)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {bia.financialImpactPerHour != null
                        ? `$${Number(bia.financialImpactPerHour).toLocaleString()}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span className="max-w-[150px] truncate text-sm text-neutral-500">
                        {bia.dependencies || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={deleting === bia.id}
                        onClick={() => handleDelete(bia.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ── Exercises Tab ──

function ExercisesTab({
  plan,
  onAdd,
  onRefresh,
}: {
  plan: BCPPlanDetail;
  onAdd: () => void;
  onRefresh: () => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(exerciseId: string) {
    setDeleting(exerciseId);
    try {
      await apiClient.deleteBCPExercise(plan.id, exerciseId);
      onRefresh();
    } catch {
      /* ignore */
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Schedule and track testing exercises for this plan.
        </p>
        <Button size="sm" onClick={onAdd}>
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Schedule Exercise
        </Button>
      </div>

      {plan.exercises.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <svg
                className="h-5 w-5 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
              No exercises yet
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Schedule tabletop, walkthrough, or full-scale exercises to test this plan.
            </p>
            <Button className="mt-4" size="sm" onClick={onAdd}>
              Schedule Exercise
            </Button>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Exercise</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Scheduled</TableHeader>
                <TableHeader>Conducted</TableHeader>
                <TableHeader>Findings</TableHeader>
                <TableHeader className="w-20"></TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {plan.exercises.map((ex) => {
                const sb = EXERCISE_STATUS_BADGE[ex.status];
                return (
                  <TableRow key={ex.id}>
                    <TableCell>
                      <span className="font-medium">{ex.title}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{EXERCISE_TYPE_LABEL[ex.type]}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sb.variant}>{sb.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(ex.scheduledDate)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatDate(ex.conductedDate)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="max-w-[200px] truncate text-sm text-neutral-500">
                        {ex.findings || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={deleting === ex.id}
                        onClick={() => handleDelete(ex.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ── Edit Plan Modal ──

function EditPlanModal({
  open,
  plan,
  members,
  onClose,
  onSaved,
}: {
  open: boolean;
  plan: BCPPlanDetail;
  members: OrgMember[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("");
  const [status, setStatus] = useState<BCPStatus>("draft");
  const [ownerId, setOwnerId] = useState("");
  const [nextReviewDate, setNextReviewDate] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(plan.title);
      setDescription(plan.description || "");
      setVersion(plan.version || "");
      setStatus(plan.status);
      setOwnerId(plan.ownerId);
      setNextReviewDate(plan.nextReviewDate ? plan.nextReviewDate.slice(0, 10) : "");
      setError(null);
    }
  }, [open, plan]);

  const memberOptions = members.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!ownerId) {
      setError("Owner is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiClient.updateBCPPlan(plan.id, {
        title: title.trim(),
        description: description.trim() || null,
        version: version.trim() || null,
        status,
        ownerId,
        nextReviewDate: nextReviewDate || null,
        lastReviewedAt:
          status !== plan.status && plan.status === "under_review" && status === "approved"
            ? new Date().toISOString()
            : undefined,
        approvedAt:
          status !== plan.status && status === "approved" ? new Date().toISOString() : undefined,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Business Continuity Plan" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <Input
          id="edit-title"
          label="Plan Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <MiniEditor
          id="edit-desc"
          label="Description"
          content={description}
          onChange={setDescription}
          minHeight="100px"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="edit-status"
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value as BCPStatus)}
          />
          <Select
            id="edit-owner"
            label="Owner *"
            options={memberOptions}
            placeholder="Select owner..."
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="edit-version"
            label="Version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
          <Input
            id="edit-review"
            label="Next Review Date"
            type="date"
            value={nextReviewDate}
            onChange={(e) => setNextReviewDate(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Delete Plan Modal ──

function DeletePlanModal({
  open,
  plan,
  onClose,
  onDeleted,
}: {
  open: boolean;
  plan: BCPPlanDetail;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiClient.deleteBCPPlan(plan.id);
      onDeleted();
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Delete Plan" size="sm">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Are you sure you want to delete <strong>{plan.title}</strong>? This will also delete all
        associated impact analyses and exercises. This action cannot be undone.
      </p>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" loading={deleting} onClick={handleDelete}>
          Delete Plan
        </Button>
      </div>
    </Modal>
  );
}

// ── Create BIA Modal ──

function CreateBIAModal({
  open,
  bcpId,
  onClose,
  onCreated,
}: {
  open: boolean;
  bcpId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [processName, setProcessName] = useState("");
  const [description, setDescription] = useState("");
  const [criticalityLevel, setCriticalityLevel] =
    useState<CriticalityLevel>("business_operational");
  const [rtoHours, setRtoHours] = useState("4");
  const [rpoHours, setRpoHours] = useState("1");
  const [mtdHours, setMtdHours] = useState("24");
  const [financialImpact, setFinancialImpact] = useState("");
  const [dependencies, setDependencies] = useState("");

  useEffect(() => {
    if (open) {
      setProcessName("");
      setDescription("");
      setCriticalityLevel("business_operational");
      setRtoHours("4");
      setRpoHours("1");
      setMtdHours("24");
      setFinancialImpact("");
      setDependencies("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!processName.trim()) {
      setError("Process name is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiClient.createBIA(bcpId, {
        processName: processName.trim(),
        description: description.trim() || null,
        criticalityLevel,
        rtoHours: parseInt(rtoHours) || 0,
        rpoHours: parseInt(rpoHours) || 0,
        maxTolerableDowntimeHours: parseInt(mtdHours) || 0,
        financialImpactPerHour: financialImpact ? parseFloat(financialImpact) : null,
        dependencies: dependencies.trim() || null,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create impact analysis");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Business Impact Analysis" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <Input
          id="bia-process"
          label="Process Name *"
          placeholder="e.g. Payment Processing"
          value={processName}
          onChange={(e) => setProcessName(e.target.value)}
          required
        />
        <MiniEditor
          id="bia-desc"
          label="Description"
          placeholder="Describe the business process..."
          content={description}
          onChange={setDescription}
          minHeight="80px"
        />

        <Select
          id="bia-criticality"
          label="Criticality Level"
          options={CRITICALITY_OPTIONS}
          value={criticalityLevel}
          onChange={(e) => setCriticalityLevel(e.target.value as CriticalityLevel)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            id="bia-rto"
            label="RTO (hours)"
            type="number"
            min="0"
            value={rtoHours}
            onChange={(e) => setRtoHours(e.target.value)}
            helperText="Recovery Time Objective"
          />
          <Input
            id="bia-rpo"
            label="RPO (hours)"
            type="number"
            min="0"
            value={rpoHours}
            onChange={(e) => setRpoHours(e.target.value)}
            helperText="Recovery Point Objective"
          />
          <Input
            id="bia-mtd"
            label="MTD (hours)"
            type="number"
            min="0"
            value={mtdHours}
            onChange={(e) => setMtdHours(e.target.value)}
            helperText="Max Tolerable Downtime"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="bia-financial"
            label="Financial Impact per Hour ($)"
            type="number"
            min="0"
            step="0.01"
            value={financialImpact}
            onChange={(e) => setFinancialImpact(e.target.value)}
            placeholder="e.g. 5000"
          />
          <Input
            id="bia-deps"
            label="Dependencies"
            value={dependencies}
            onChange={(e) => setDependencies(e.target.value)}
            placeholder="e.g. AWS, Payment gateway"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Add Process
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Create Exercise Modal ──

function CreateExerciseModal({
  open,
  bcpId,
  onClose,
  onCreated,
}: {
  open: boolean;
  bcpId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<BCPExerciseType>("tabletop");
  const [scheduledDate, setScheduledDate] = useState("");
  const [findings, setFindings] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setType("tabletop");
      setScheduledDate("");
      setFindings("");
      setLessonsLearned("");
      setError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiClient.createBCPExercise(bcpId, {
        title: title.trim(),
        type,
        scheduledDate: scheduledDate || null,
        findings: findings.trim() || null,
        lessonsLearned: lessonsLearned.trim() || null,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exercise");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Schedule Exercise" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <Input
          id="ex-title"
          label="Exercise Title *"
          placeholder="e.g. Q2 Tabletop Exercise"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="ex-type"
            label="Exercise Type"
            options={EXERCISE_TYPE_OPTIONS}
            value={type}
            onChange={(e) => setType(e.target.value as BCPExerciseType)}
          />
          <Input
            id="ex-date"
            label="Scheduled Date"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
        </div>

        <MiniEditor
          id="ex-findings"
          label="Findings"
          placeholder="Document any pre-exercise expectations or known gaps..."
          content={findings}
          onChange={setFindings}
          minHeight="80px"
        />
        <MiniEditor
          id="ex-lessons"
          label="Lessons Learned"
          placeholder="Document lessons learned after the exercise..."
          content={lessonsLearned}
          onChange={setLessonsLearned}
          minHeight="80px"
        />

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Schedule Exercise
          </Button>
        </div>
      </form>
    </Modal>
  );
}
