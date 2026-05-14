"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  apiClient,
  type IncidentItem,
  type IncidentSeverity,
  type IncidentStatus,
  type OrgMember,
} from "@/lib/api-client";

const SEVERITY_OPTIONS = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "informational", label: "Informational" },
];

const STATUS_OPTIONS = [
  { value: "reported", label: "Reported" },
  { value: "investigating", label: "Investigating" },
  { value: "contained", label: "Contained" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "lessons_learned", label: "Lessons Learned" },
];

const STATUS_BADGE: Record<IncidentStatus, { label: string; variant: BadgeVariant }> = {
  reported: { label: "Reported", variant: "neutral" },
  investigating: { label: "Investigating", variant: "info" },
  contained: { label: "Contained", variant: "warning" },
  resolved: { label: "Resolved", variant: "success" },
  closed: { label: "Closed", variant: "success" },
  lessons_learned: { label: "Lessons Learned", variant: "neutral" },
};

const SEVERITY_BADGE: Record<IncidentSeverity, { label: string; variant: BadgeVariant }> = {
  critical: { label: "Critical", variant: "danger" },
  high: { label: "High", variant: "warning" },
  medium: { label: "Medium", variant: "info" },
  low: { label: "Low", variant: "success" },
  informational: { label: "Informational", variant: "neutral" },
};

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatDateOnly(dateStr: string | null | undefined): string {
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

function calculateOpenIncidents(items: IncidentItem[]): number {
  return items.filter((i) => !["resolved", "closed", "lessons_learned"].includes(i.status)).length;
}

function calculateCriticalOpen(items: IncidentItem[]): number {
  return items.filter(
    (i) =>
      (i.severity === "critical" || i.severity === "high") &&
      !["resolved", "closed", "lessons_learned"].includes(i.status),
  ).length;
}

function calculateMttaHours(items: IncidentItem[]): number | null {
  const withDetected = items.filter((i) => i.detectedAt);
  if (withDetected.length === 0) return null;
  const totalHours = withDetected.reduce((sum, incident) => {
    const start = new Date(incident.detectedAt as string).getTime();
    const end = new Date(incident.createdAt).getTime();
    return sum + Math.max(0, end - start) / (1000 * 60 * 60);
  }, 0);
  return totalHours / withDetected.length;
}

function calculateRegulatoryAlerts(items: IncidentItem[]): number {
  return items.filter(
    (i) =>
      i.regulatoryNotificationRequired &&
      !["resolved", "closed", "lessons_learned"].includes(i.status),
  ).length;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (search.trim()) params.search = search.trim();
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await apiClient.listIncidents(params);
      setIncidents(res.data.items);
      setTotal(res.data.total);
    } catch {
      setIncidents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [limit, page, search, severityFilter, statusFilter]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await apiClient.listMembers();
      setMembers(res.data);
    } catch {
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const totalPages = Math.ceil(total / limit);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members]);

  const stats = useMemo(() => {
    return {
      open: calculateOpenIncidents(incidents),
      criticalOpen: calculateCriticalOpen(incidents),
      mttaHours: calculateMttaHours(incidents),
      regulatoryOpen: calculateRegulatoryAlerts(incidents),
    };
  }, [incidents]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Incidents</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Triage, investigate, and close security incidents with clear ownership and SLA-focused
            visibility.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Report Incident</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.open}</p>
            <p className="text-xs text-neutral-500">Open Queue</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.criticalOpen}</p>
            <p className="text-xs text-neutral-500">High / Critical Open</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {stats.mttaHours == null ? "—" : `${stats.mttaHours.toFixed(1)}h`}
            </p>
            <p className="text-xs text-neutral-500">Mean Time to Acknowledge</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{stats.regulatoryOpen}</p>
            <p className="text-xs text-neutral-500">Regulatory Attention</p>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-72">
          <Input
            id="incident-search"
            placeholder="Search incident title or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="w-52">
          <Select
            id="incident-severity"
            options={SEVERITY_OPTIONS}
            placeholder="All severities"
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="w-52">
          <Select
            id="incident-status"
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {(search || severityFilter || statusFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setSeverityFilter("");
              setStatusFilter("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}

        <span className="ml-auto text-sm text-neutral-500 dark:text-neutral-400">
          {total} incident{total !== 1 ? "s" : ""}
        </span>
      </div>

      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
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
        ) : incidents.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">
              {search || severityFilter || statusFilter
                ? "No incidents match your filters."
                : "No incidents reported yet. Start by logging your first incident."}
            </p>
            {!search && !severityFilter && !statusFilter && (
              <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
                Report Incident
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Incident</TableHeader>
                <TableHeader>Severity</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Owner</TableHeader>
                <TableHeader>Detected</TableHeader>
                <TableHeader>Last Updated</TableHeader>
                <TableHeader>Regulatory</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium text-neutral-900 dark:text-white">
                        {incident.title}
                      </span>
                      {incident.description && (
                        <p className="mt-0.5 max-w-[28rem] truncate text-xs text-neutral-500">
                          {incident.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={SEVERITY_BADGE[incident.severity].variant}>
                      {SEVERITY_BADGE[incident.severity].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[incident.status].variant}>
                      {STATUS_BADGE[incident.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {memberMap.get(incident.assignedToId || "") ||
                      memberMap.get(incident.reportedById) ||
                      "Unassigned"}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {formatDateOnly(incident.detectedAt)}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {formatDateTime(incident.updatedAt)}
                  </TableCell>
                  <TableCell>
                    {incident.regulatoryNotificationRequired ? (
                      <Badge variant={incident.regulatoryNotifiedAt ? "success" : "warning"}>
                        {incident.regulatoryNotifiedAt ? "Notified" : "Required"}
                      </Badge>
                    ) : (
                      <span className="text-sm text-neutral-400">No</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Page {page} of {totalPages}
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

      <CreateIncidentModal
        open={createOpen}
        members={members}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          fetchIncidents();
        }}
      />
    </div>
  );
}

function CreateIncidentModal({
  open,
  members,
  onClose,
  onCreated,
}: {
  open: boolean;
  members: OrgMember[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("high");
  const [reportedById, setReportedById] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [detectedAt, setDetectedAt] = useState("");

  useEffect(() => {
    if (!open) return;
    const currentUserId = apiClient.getCurrentUserId() || "";
    const firstMemberId = members[0]?.id || "";
    const defaultReporter = currentUserId || firstMemberId;

    setTitle("");
    setDescription("");
    setSeverity("high");
    setReportedById(defaultReporter);
    setAssignedToId("");
    setDetectedAt(new Date().toISOString().slice(0, 16));
    setError(null);
  }, [open, members]);

  const memberOptions = members.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.email})`,
  }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Incident title is required.");
      return;
    }
    if (!reportedById) {
      setError("A reporter must be selected.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiClient.createIncident({
        title: title.trim(),
        description: description.trim() || undefined,
        severity,
        reportedById,
        assignedToId: assignedToId || undefined,
        detectedAt: detectedAt ? new Date(detectedAt).toISOString() : undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to report incident.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report Incident"
      description="Capture the incident quickly so triage and communication can start immediately."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <Input
          id="incident-title"
          label="Incident Title *"
          placeholder="e.g. Unauthorized access attempt in production"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          id="incident-description"
          label="Description"
          placeholder="What happened, what systems were affected, and what has been done so far?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="incident-severity-input"
            label="Severity"
            options={SEVERITY_OPTIONS}
            value={severity}
            onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
          />
          <Input
            id="incident-detected-at"
            label="Detected At"
            type="datetime-local"
            value={detectedAt}
            onChange={(e) => setDetectedAt(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="incident-reported-by"
            label="Reported By *"
            options={memberOptions}
            placeholder="Select reporter..."
            value={reportedById}
            onChange={(e) => setReportedById(e.target.value)}
          />
          <Select
            id="incident-assigned-to"
            label="Assigned To"
            options={memberOptions}
            placeholder="Unassigned"
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
          />
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
          Inspired by modern compliance workflows: log quickly, assign ownership early, and keep
          lifecycle states explicit.
        </div>

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Create Incident
          </Button>
        </div>
      </form>
    </Modal>
  );
}
