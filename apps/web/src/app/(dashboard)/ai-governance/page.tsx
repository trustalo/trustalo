"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
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
import {
  apiClient,
  type AISystem,
  type AISystemType,
  type AILifecycleStage,
  type AIRiskLevel,
  type AIGovernanceStats,
  type CreateAISystemInput,
  type OrgMember,
} from "@/lib/api-client";

// ─── Constants ───────────────────────────────────────────────

const SYSTEM_TYPE_OPTIONS: { value: AISystemType; label: string }[] = [
  { value: "machine_learning", label: "Machine Learning" },
  { value: "deep_learning", label: "Deep Learning" },
  { value: "nlp", label: "NLP" },
  { value: "computer_vision", label: "Computer Vision" },
  { value: "generative_ai", label: "Generative AI" },
  { value: "other", label: "Other" },
];

const LIFECYCLE_OPTIONS: { value: AILifecycleStage; label: string }[] = [
  { value: "design", label: "Design" },
  { value: "development", label: "Development" },
  { value: "testing", label: "Testing" },
  { value: "deployment", label: "Deployment" },
  { value: "monitoring", label: "Monitoring" },
  { value: "decommissioned", label: "Decommissioned" },
];

const RISK_LEVEL_OPTIONS: { value: AIRiskLevel; label: string }[] = [
  { value: "minimal", label: "Minimal" },
  { value: "limited", label: "Limited" },
  { value: "high", label: "High" },
  { value: "unacceptable", label: "Unacceptable" },
];

const RISK_BADGE: Record<AIRiskLevel, { variant: BadgeVariant; label: string }> = {
  minimal: { variant: "success", label: "Minimal" },
  limited: { variant: "info", label: "Limited" },
  high: { variant: "warning", label: "High" },
  unacceptable: { variant: "danger", label: "Unacceptable" },
};

const STAGE_BADGE: Record<AILifecycleStage, { variant: BadgeVariant; label: string }> = {
  design: { variant: "neutral", label: "Design" },
  development: { variant: "info", label: "Development" },
  testing: { variant: "warning", label: "Testing" },
  deployment: { variant: "success", label: "Deployment" },
  monitoring: { variant: "success", label: "Monitoring" },
  decommissioned: { variant: "neutral", label: "Decommissioned" },
};

const TYPE_LABELS: Record<AISystemType, string> = {
  machine_learning: "Machine Learning",
  deep_learning: "Deep Learning",
  nlp: "NLP",
  computer_vision: "Computer Vision",
  generative_ai: "Generative AI",
  other: "Other",
};

// ─── Stats Card ──────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <Card>
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ?? "text-neutral-900 dark:text-white"}`}>
        {value}
      </p>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function AIGovernancePage() {
  const [systems, setSystems] = useState<AISystem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");

  const [stats, setStats] = useState<AIGovernanceStats | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AISystem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AISystem | null>(null);

  const fetchSystems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (stageFilter) params.lifecycleStage = stageFilter;
      if (riskFilter) params.riskLevel = riskFilter;
      const res = await apiClient.listAISystems(params);
      setSystems(res.data.items);
      setTotal(res.data.total);
    } catch {
      setSystems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, typeFilter, stageFilter, riskFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.getAIGovernanceStats();
      setStats(res.data);
    } catch {
      /* stats are non-critical */
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  useEffect(() => {
    fetchStats();
    apiClient
      .listMembers()
      .then((r) => setMembers(r.data))
      .catch(() => {});
  }, [fetchStats]);

  const totalPages = Math.ceil(total / limit);
  const hasFilters = !!(search || typeFilter || stageFilter || riskFilter);

  function handleCreated() {
    setCreateOpen(false);
    fetchSystems();
    fetchStats();
  }

  function handleUpdated() {
    setEditTarget(null);
    fetchSystems();
    fetchStats();
  }

  function handleDeleted() {
    setDeleteTarget(null);
    fetchSystems();
    fetchStats();
  }

  return (
    <div className="space-y-6">
      {/* Page-level action bar (workspace title and tabs come from layout) */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setCreateOpen(true)}>Register AI System</Button>
      </div>

      {/* Stats overview */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
          <StatCard label="Total Systems" value={stats.total} />
          <StatCard
            label="High-Risk Systems"
            value={(stats.byRiskLevel.high ?? 0) + (stats.byRiskLevel.unacceptable ?? 0)}
            accent="text-red-600 dark:text-red-400"
          />
          <StatCard
            label="In Production"
            value={
              (stats.byLifecycleStage.deployment ?? 0) + (stats.byLifecycleStage.monitoring ?? 0)
            }
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="In Development"
            value={
              (stats.byLifecycleStage.design ?? 0) +
              (stats.byLifecycleStage.development ?? 0) +
              (stats.byLifecycleStage.testing ?? 0)
            }
            accent="text-blue-600 dark:text-blue-400"
          />
          <StatCard label="Decommissioned" value={stats.byLifecycleStage.decommissioned ?? 0} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-72">
          <Input
            id="ai-search"
            placeholder="Search AI systems…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-48">
          <Select
            id="type-filter"
            options={SYSTEM_TYPE_OPTIONS}
            placeholder="All types"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-48">
          <Select
            id="stage-filter"
            options={LIFECYCLE_OPTIONS}
            placeholder="All stages"
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-48">
          <Select
            id="risk-filter"
            options={RISK_LEVEL_OPTIONS}
            placeholder="All risk levels"
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setTypeFilter("");
              setStageFilter("");
              setRiskFilter("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
        <span className="ml-auto text-sm text-neutral-500 dark:text-neutral-400">
          {total} system{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
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
        ) : systems.length === 0 ? (
          <div className="py-16 text-center">
            <svg
              className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-4 text-sm font-medium text-neutral-900 dark:text-white">
              {hasFilters ? "No AI systems match your filters" : "No AI systems registered yet"}
            </p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {hasFilters
                ? "Try adjusting your search or filters."
                : "Register your first AI system to start tracking and managing AI governance."}
            </p>
            {!hasFilters && (
              <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
                Register AI System
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>System</TableHeader>
                <TableHeader className="w-36">Type</TableHeader>
                <TableHeader className="w-36">Lifecycle</TableHeader>
                <TableHeader className="w-32">Risk Level</TableHeader>
                <TableHeader className="w-36">Owner</TableHeader>
                <TableHeader className="w-32">Updated</TableHeader>
                <TableHeader className="w-20" />
              </TableRow>
            </TableHead>
            <TableBody>
              {systems.map((sys) => (
                <TableRow key={sys.id}>
                  <TableCell>
                    <span className="font-medium">{sys.name}</span>
                    {sys.description && (
                      <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-500">
                        {sys.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{TYPE_LABELS[sys.type]}</TableCell>
                  <TableCell>
                    <Badge variant={STAGE_BADGE[sys.lifecycleStage].variant}>
                      {STAGE_BADGE[sys.lifecycleStage].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={RISK_BADGE[sys.riskLevel].variant}>
                      {RISK_BADGE[sys.riskLevel].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sys.owner?.name || <span className="text-neutral-400">Unassigned</span>}
                  </TableCell>
                  <TableCell className="text-neutral-500">
                    {new Date(sys.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditTarget(sys)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                        onClick={() => setDeleteTarget(sys)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
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

      {/* Modals */}
      <AISystemFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        members={members}
        onSaved={handleCreated}
      />

      {editTarget && (
        <AISystemFormModal
          open
          system={editTarget}
          onClose={() => setEditTarget(null)}
          members={members}
          onSaved={handleUpdated}
        />
      )}

      <DeleteConfirmModal
        system={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}

// ─── Create / Edit Modal ─────────────────────────────────────

function AISystemFormModal({
  open,
  system,
  onClose,
  members,
  onSaved,
}: {
  open: boolean;
  system?: AISystem;
  onClose: () => void;
  members: OrgMember[];
  onSaved: () => void;
}) {
  const isEdit = !!system;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<AISystemType>("machine_learning");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [lifecycleStage, setLifecycleStage] = useState<AILifecycleStage>("design");
  const [riskLevel, setRiskLevel] = useState<AIRiskLevel>("minimal");
  const [dataTypes, setDataTypes] = useState("");
  const [ownerId, setOwnerId] = useState("");

  useEffect(() => {
    if (open) {
      setName(system?.name ?? "");
      setType(system?.type ?? "machine_learning");
      setDescription(system?.description ?? "");
      setPurpose(system?.purpose ?? "");
      setLifecycleStage(system?.lifecycleStage ?? "design");
      setRiskLevel(system?.riskLevel ?? "minimal");
      setDataTypes(system?.dataTypes?.join(", ") ?? "");
      setOwnerId(system?.ownerId ?? "");
      setError(null);
    }
  }, [open, system]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);

    const payload: CreateAISystemInput = {
      name: name.trim(),
      type,
      description: description.trim() || null,
      purpose: purpose.trim() || null,
      lifecycleStage,
      riskLevel,
      dataTypes: dataTypes
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean),
      ownerId: ownerId || null,
    };

    try {
      if (isEdit) {
        await apiClient.updateAISystem(system!.id, payload);
      } else {
        await apiClient.createAISystem(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save AI system");
    } finally {
      setSaving(false);
    }
  }

  const memberOptions = members.map((m) => ({
    value: m.id,
    label: `${m.name} (${m.email})`,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit AI System" : "Register AI System"}
      description={
        isEdit
          ? "Update the details of this AI system."
          : "Add a new AI system to your governance inventory."
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <Input
          id="ai-name"
          label="System Name *"
          placeholder="e.g. Customer Support Chatbot"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            id="ai-type"
            label="System Type *"
            options={SYSTEM_TYPE_OPTIONS}
            value={type}
            onChange={(e) => setType(e.target.value as AISystemType)}
          />
          <Select
            id="ai-risk"
            label="Risk Level"
            options={RISK_LEVEL_OPTIONS}
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value as AIRiskLevel)}
          />
        </div>

        <Textarea
          id="ai-desc"
          label="Description"
          placeholder="Brief description of what this AI system does…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Textarea
          id="ai-purpose"
          label="Purpose / Business Justification"
          placeholder="Why this system exists and what business need it addresses…"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            id="ai-stage"
            label="Lifecycle Stage"
            options={LIFECYCLE_OPTIONS}
            value={lifecycleStage}
            onChange={(e) => setLifecycleStage(e.target.value as AILifecycleStage)}
          />
          <Select
            id="ai-owner"
            label="Owner"
            options={memberOptions}
            placeholder="Select an owner…"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          />
        </div>

        <Input
          id="ai-data-types"
          label="Data Types Processed"
          placeholder="e.g. PII, financial data, health records (comma-separated)"
          helperText="Comma-separated list of data categories this system processes"
          value={dataTypes}
          onChange={(e) => setDataTypes(e.target.value)}
        />

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? "Save Changes" : "Register System"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete Confirmation ─────────────────────────────────────

function DeleteConfirmModal({
  system,
  onClose,
  onDeleted,
}: {
  system: AISystem | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!system) return null;

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await apiClient.deleteAISystem(system!.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete AI system");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal open={!!system} onClose={onClose} title="Delete AI System" size="sm">
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Are you sure you want to delete{" "}
          <strong className="text-neutral-900 dark:text-white">{system.name}</strong>? This will
          also remove all associated risk and impact assessments. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
