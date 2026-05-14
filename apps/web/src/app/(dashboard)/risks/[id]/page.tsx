"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { InfoDrawer, InfoLink } from "@/components/ui/info-drawer";
import { RiskMatrixHelpContent } from "@/components/help/risk-matrix-help";
import { RiskScoreSuggestionBanner } from "@/components/ai/risk-score-suggestion-banner";
import {
  apiClient,
  type RiskDetail,
  type RiskFieldConfig,
  type RiskMatrixChangeItem,
  type RiskCategoryType,
  type RiskStatusType,
  type RiskDepartmentType,
  type TreatmentStrategyType,
  type TreatmentStatusType,
  type ProbabilityLevelType,
  type ImpactLevelType,
  type ControlEffectivenessType,
  type ApprovalStatusType,
  type RiskAssessmentItem,
  type RiskTreatmentItem,
  type OrgMember,
} from "@/lib/api-client";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: "operational", label: "Operational" },
  { value: "technical", label: "Technical" },
  { value: "compliance", label: "Compliance" },
  { value: "strategic", label: "Strategic" },
  { value: "financial", label: "Financial" },
  { value: "reputational", label: "Reputational" },
  { value: "security", label: "Security" },
  { value: "privacy", label: "Privacy" },
  { value: "third_party", label: "Third Party" },
  { value: "environmental", label: "Environmental" },
];

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "archived", label: "Archived" },
];

const DEPARTMENT_OPTIONS = [
  { value: "engineering", label: "Engineering" },
  { value: "product", label: "Product" },
  { value: "operations", label: "Operations" },
  { value: "finance", label: "Finance" },
  { value: "legal", label: "Legal" },
  { value: "human_resources", label: "Human Resources" },
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "customer_support", label: "Customer Support" },
  { value: "it", label: "IT" },
  { value: "security", label: "Security" },
  { value: "compliance", label: "Compliance" },
  { value: "executive", label: "Executive" },
  { value: "other", label: "Other" },
];

const TREATMENT_STRATEGY_OPTIONS = [
  { value: "mitigate", label: "Mitigate" },
  { value: "accept", label: "Accept" },
  { value: "transfer", label: "Transfer" },
  { value: "avoid", label: "Avoid" },
  { value: "control", label: "Control" },
];

const PROBABILITY_OPTIONS = [
  { value: "rare", label: "Rare" },
  { value: "unlikely", label: "Unlikely" },
  { value: "possible", label: "Possible" },
  { value: "likely", label: "Likely" },
  { value: "almost_certain", label: "Almost Certain" },
];

const IMPACT_LEVEL_OPTIONS = [
  { value: "negligible", label: "Negligible" },
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "catastrophic", label: "Catastrophic" },
];

const CONTROL_EFFECTIVENESS_OPTIONS = [
  { value: "no_control", label: "No Control" },
  { value: "need_improvement", label: "Need Improvement" },
  { value: "adequate", label: "Adequate" },
  { value: "effective", label: "Effective" },
];

const APPROVAL_OPTIONS = [
  { value: "yes", label: "YES" },
  { value: "no", label: "NO" },
  { value: "na", label: "N/A" },
  { value: "pending", label: "Pending" },
];

const TREATMENT_STATUS_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

const LIKELIHOOD_SCORE_OPTIONS = [
  { value: "1", label: "1 — Rare" },
  { value: "2", label: "2 — Unlikely" },
  { value: "3", label: "3 — Possible" },
  { value: "4", label: "4 — Likely" },
  { value: "5", label: "5 — Almost Certain" },
];

const IMPACT_SCORE_OPTIONS = [
  { value: "1", label: "1 — Negligible" },
  { value: "2", label: "2 — Minor" },
  { value: "3", label: "3 — Moderate" },
  { value: "4", label: "4 — Major" },
  { value: "5", label: "5 — Catastrophic" },
];

const STATUS_BADGE: Record<RiskStatusType, { variant: BadgeVariant; label: string }> = {
  not_started: { variant: "neutral", label: "Not Started" },
  in_progress: { variant: "info", label: "In Progress" },
  done: { variant: "success", label: "Done" },
  archived: { variant: "neutral", label: "Archived" },
};

const TREATMENT_STATUS_BADGE: Record<
  TreatmentStatusType,
  { variant: BadgeVariant; label: string }
> = {
  planned: { variant: "neutral", label: "Planned" },
  in_progress: { variant: "info", label: "In Progress" },
  completed: { variant: "success", label: "Completed" },
  overdue: { variant: "danger", label: "Overdue" },
  cancelled: { variant: "neutral", label: "Cancelled" },
};

const CATEGORY_LABEL: Record<RiskCategoryType, string> = {
  operational: "Operational",
  technical: "Technical",
  compliance: "Compliance",
  strategic: "Strategic",
  financial: "Financial",
  reputational: "Reputational",
  security: "Security",
  privacy: "Privacy",
  third_party: "Third Party",
  environmental: "Environmental",
};

const PROBABILITY_LABEL: Record<string, string> = {
  rare: "Rare",
  unlikely: "Unlikely",
  possible: "Possible",
  likely: "Likely",
  almost_certain: "Almost Certain",
};

const IMPACT_LABEL: Record<string, string> = {
  negligible: "Negligible",
  low: "Low",
  moderate: "Moderate",
  high: "High",
  catastrophic: "Catastrophic",
};

const CONTROL_EFF_LABEL: Record<string, string> = {
  no_control: "No Control",
  need_improvement: "Need Improvement",
  adequate: "Adequate",
  effective: "Effective",
};

const TREATMENT_LABEL: Record<string, string> = {
  mitigate: "Mitigate",
  accept: "Accept",
  transfer: "Transfer",
  avoid: "Avoid",
  control: "Control",
};

const APPROVAL_LABEL: Record<string, string> = {
  yes: "YES",
  no: "NO",
  na: "N/A",
  pending: "Pending",
};

function scoreSeverity(score: number): { label: string; variant: BadgeVariant } {
  if (score >= 20) return { label: "Critical", variant: "danger" };
  if (score >= 12) return { label: "High", variant: "warning" };
  if (score >= 5) return { label: "Medium", variant: "info" };
  return { label: "Low", variant: "success" };
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ──────────────────────────────────────────────
// Risk Detail Page
// ──────────────────────────────────────────────

type TabId = "overview" | "matrix" | "assessments" | "treatments";

export default function RiskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const riskId = params.id;

  const [risk, setRisk] = useState<RiskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [fieldConfig, setFieldConfig] = useState<RiskFieldConfig[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const enabledKeys = useMemo(
    () => new Set(fieldConfig.filter((f) => f.enabled).map((f) => f.key)),
    [fieldConfig],
  );
  function isVisible(key: string): boolean {
    return enabledKeys.size === 0 || enabledKeys.has(key);
  }

  const fetchRisk = useCallback(async () => {
    try {
      const res = await apiClient.getRisk(riskId);
      setRisk(res.data);
    } catch {
      setError("Risk not found");
    } finally {
      setLoading(false);
    }
  }, [riskId]);

  useEffect(() => {
    fetchRisk();
  }, [fetchRisk]);
  useEffect(() => {
    apiClient
      .listMembers()
      .then((r) => setMembers(r.data))
      .catch(() => {});
    apiClient
      .getRiskFieldConfig()
      .then((r) => setFieldConfig(r.data))
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <svg className="h-8 w-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
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
    );
  }

  if (error || !risk) {
    return (
      <div className="py-32 text-center">
        <p className="text-lg text-neutral-500">{error || "Risk not found"}</p>
        <Button className="mt-4" variant="secondary" onClick={() => router.push("/risks")}>
          Back to Risk Register
        </Button>
      </div>
    );
  }

  const sb = STATUS_BADGE[risk.status] ?? {
    variant: "neutral" as BadgeVariant,
    label: risk.status,
  };
  const inherentSeverity = scoreSeverity(risk.riskScore);
  const residualSeverity =
    risk.residualRiskScore != null ? scoreSeverity(risk.residualRiskScore) : null;

  const assessmentCount = risk.assessments?.length ?? risk._count?.assessments ?? 0;
  const treatmentCount = risk.treatments?.length ?? risk._count?.treatments ?? 0;

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "matrix", label: "Risk Matrix" },
    { id: "assessments", label: `Assessments (${assessmentCount})` },
    { id: "treatments", label: `Treatment Plans (${treatmentCount})` },
  ];

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/risks")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Back to Risk Register
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              {risk.riskIdentifier && (
                <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  {risk.riskIdentifier}
                </span>
              )}
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{risk.title}</h1>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={sb.variant}>{sb.label}</Badge>
              <Badge variant={inherentSeverity.variant}>
                Inherent: {risk.riskScore} ({inherentSeverity.label})
              </Badge>
              {risk.residualRiskScore != null && residualSeverity && (
                <Badge variant={residualSeverity.variant}>
                  Residual: {risk.residualRiskScore} ({residualSeverity.label})
                </Badge>
              )}
              {risk.businessProcess && (
                <span className="text-sm text-neutral-500">{risk.businessProcess}</span>
              )}
              <span className="text-sm text-neutral-500">{CATEGORY_LABEL[risk.category]}</span>
              {risk.treatmentStrategy && (
                <Badge variant="info">{TREATMENT_LABEL[risk.treatmentStrategy]}</Badge>
              )}
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && (
        <OverviewTab risk={risk} members={members} onSaved={fetchRisk} isVisible={isVisible} />
      )}
      {activeTab === "matrix" && <RiskMatrixTab risk={risk} onSaved={fetchRisk} />}
      {activeTab === "assessments" && (
        <AssessmentsTab risk={risk} members={members} onSaved={fetchRisk} />
      )}
      {activeTab === "treatments" && (
        <TreatmentsTab risk={risk} members={members} onSaved={fetchRisk} />
      )}

      {/* Metadata */}
      <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
        <div className="flex gap-8 text-xs text-neutral-400">
          <span>Created {formatDate(risk.createdAt)}</span>
          <span>Last updated {formatDate(risk.updatedAt)}</span>
          {risk.owner && <span>Owner: {risk.owner.name}</span>}
        </div>
      </div>

      {/* Delete modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Risk" size="sm">
        <DeleteRiskConfirm
          risk={risk}
          onCancel={() => setDeleteOpen(false)}
          onDeleted={() => router.push("/risks")}
        />
      </Modal>
    </div>
  );
}

// ──────────────────────────────────────────────
// Overview Tab — all fields, respects field config
// ──────────────────────────────────────────────

function OverviewTab({
  risk,
  members,
  onSaved,
  isVisible,
}: {
  risk: RiskDetail;
  members: OrgMember[];
  onSaved: () => void;
  isVisible: (key: string) => boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [title, setTitle] = useState(risk.title);
  const [description, setDescription] = useState(risk.description || "");
  const [riskImpactDescription, setRiskImpactDescription] = useState(
    risk.riskImpactDescription || "",
  );
  const [category, setCategory] = useState(risk.category);
  const [businessProcess, setBusinessProcess] = useState(risk.businessProcess || "");
  const [department, setDepartment] = useState(risk.department || "");
  const [status, setStatus] = useState(risk.status);
  const [ownerId, setOwnerId] = useState(risk.ownerId || "");
  const [probability, setProbability] = useState(risk.probability || "");
  const [impact, setImpact] = useState(risk.impact || "");
  const [controlDescription, setControlDescription] = useState(risk.controlDescription || "");
  const [controlEffectiveness, setControlEffectiveness] = useState(risk.controlEffectiveness || "");
  const [tStrategy, setTStrategy] = useState(risk.treatmentStrategy || "");
  const [tDescription, setTDescription] = useState(risk.treatmentRationale || "");
  const [actionPlan, setActionPlan] = useState(risk.actionPlan || "");
  const [actionOwnerId, setActionOwnerId] = useState(risk.actionOwnerId || "");
  const [estStartDate, setEstStartDate] = useState(
    risk.estStartDate ? new Date(risk.estStartDate).toISOString().split("T")[0] : "",
  );
  const [estEndDate, setEstEndDate] = useState(
    risk.estEndDate ? new Date(risk.estEndDate).toISOString().split("T")[0] : "",
  );
  const [budgetApproval, setBudgetApproval] = useState(risk.budgetApproval || "");
  const [managementApproval, setManagementApproval] = useState(risk.managementApproval || "");
  const [residualLikelihood, setResidualLikelihood] = useState(risk.residualLikelihood || "");
  const [residualImpact, setResidualImpact] = useState(risk.residualImpact || "");
  const [remarks, setRemarks] = useState(risk.remarks || "");
  const [tags, setTags] = useState(risk.tags.join(", "));

  useEffect(() => {
    setTitle(risk.title);
    setDescription(risk.description || "");
    setRiskImpactDescription(risk.riskImpactDescription || "");
    setCategory(risk.category);
    setBusinessProcess(risk.businessProcess || "");
    setDepartment(risk.department || "");
    setStatus(risk.status);
    setOwnerId(risk.ownerId || "");
    setProbability(risk.probability || "");
    setImpact(risk.impact || "");
    setControlDescription(risk.controlDescription || "");
    setControlEffectiveness(risk.controlEffectiveness || "");
    setTStrategy(risk.treatmentStrategy || "");
    setTDescription(risk.treatmentRationale || "");
    setActionPlan(risk.actionPlan || "");
    setActionOwnerId(risk.actionOwnerId || "");
    setEstStartDate(
      risk.estStartDate ? new Date(risk.estStartDate).toISOString().split("T")[0] : "",
    );
    setEstEndDate(risk.estEndDate ? new Date(risk.estEndDate).toISOString().split("T")[0] : "");
    setBudgetApproval(risk.budgetApproval || "");
    setManagementApproval(risk.managementApproval || "");
    setResidualLikelihood(risk.residualLikelihood || "");
    setResidualImpact(risk.residualImpact || "");
    setRemarks(risk.remarks || "");
    setTags(risk.tags.join(", "));
  }, [risk]);

  async function handleSave() {
    if (!title.trim()) {
      setSaveError("Title is required");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await apiClient.updateRisk(risk.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        riskImpactDescription: riskImpactDescription.trim() || null,
        category: category as RiskCategoryType,
        businessProcess: businessProcess.trim() || null,
        department: (department as RiskDepartmentType) || null,
        status: status as RiskStatusType,
        ownerId: ownerId || null,
        probability: (probability as ProbabilityLevelType) || null,
        impact: (impact as ImpactLevelType) || null,
        controlDescription: controlDescription.trim() || null,
        controlEffectiveness: (controlEffectiveness as ControlEffectivenessType) || null,
        treatmentStrategy: (tStrategy as TreatmentStrategyType) || null,
        treatmentRationale: tDescription.trim() || null,
        actionPlan: actionPlan.trim() || null,
        actionOwnerId: actionOwnerId || null,
        estStartDate: estStartDate || null,
        estEndDate: estEndDate || null,
        budgetApproval: (budgetApproval as ApprovalStatusType) || null,
        managementApproval: (managementApproval as ApprovalStatusType) || null,
        residualLikelihood: (residualLikelihood as ProbabilityLevelType) || null,
        residualImpact: (residualImpact as ImpactLevelType) || null,
        remarks: remarks.trim() || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setSaveSuccess(true);
      onSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const memberOptions = members.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` }));

  return (
    <Card>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Risk Details
          </h3>
          <Button loading={saving} onClick={handleSave}>
            Save Changes
          </Button>
        </div>

        {saveError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Risk saved successfully.
          </div>
        )}

        {/* Core */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Risk Details
          </legend>
          <Input
            id="title"
            label="Risk Item *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          {isVisible("description") && (
            <Textarea
              id="description"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          )}
          {isVisible("riskImpactDescription") && (
            <Textarea
              id="riskImpact"
              label="Risk Impact Description"
              value={riskImpactDescription}
              onChange={(e) => setRiskImpactDescription(e.target.value)}
              rows={3}
            />
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {isVisible("category") && (
              <Select
                id="category"
                label="Category"
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={(e) => setCategory(e.target.value as RiskCategoryType)}
              />
            )}
            {isVisible("businessProcess") && (
              <Input
                id="businessProcess"
                label="Business Process"
                value={businessProcess}
                onChange={(e) => setBusinessProcess(e.target.value)}
              />
            )}
            {isVisible("department") && (
              <Select
                id="department"
                label="Department"
                options={DEPARTMENT_OPTIONS}
                placeholder="Select..."
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isVisible("status") && (
              <Select
                id="status"
                label="Status"
                options={STATUS_OPTIONS}
                value={status}
                onChange={(e) => setStatus(e.target.value as RiskStatusType)}
              />
            )}
            {isVisible("ownerId") && (
              <Select
                id="owner"
                label="Risk Owner"
                options={memberOptions}
                placeholder="Select owner..."
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
              />
            )}
          </div>
          {isVisible("tags") && (
            <Input
              id="tags"
              label="Tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          )}
        </fieldset>

        {/* Inherent Risk */}
        {(isVisible("probability") || isVisible("impact")) && (
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Inherent Risk
            </legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {isVisible("probability") && (
                <Select
                  id="probability"
                  label="Probability"
                  options={PROBABILITY_OPTIONS}
                  placeholder="Select..."
                  value={probability}
                  onChange={(e) => setProbability(e.target.value)}
                />
              )}
              {isVisible("impact") && (
                <Select
                  id="impact"
                  label="Impact"
                  options={IMPACT_LEVEL_OPTIONS}
                  placeholder="Select..."
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                />
              )}
              {isVisible("riskScore") && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Score
                  </label>
                  <div className="flex h-[38px] items-center gap-2">
                    <Badge
                      variant={scoreSeverity(risk.riskScore).variant}
                      className="text-base px-3 py-1"
                    >
                      {risk.riskScore}
                    </Badge>
                    <span className="text-sm text-neutral-500">
                      {scoreSeverity(risk.riskScore).label}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </fieldset>
        )}

        {/* Controls */}
        {(isVisible("controlDescription") ||
          isVisible("controlEffectiveness") ||
          isVisible("treatmentStrategy")) && (
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Controls & Treatment
            </legend>
            {isVisible("controlDescription") && (
              <Textarea
                id="controlDesc"
                label="Control Description"
                value={controlDescription}
                onChange={(e) => setControlDescription(e.target.value)}
                rows={3}
              />
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {isVisible("controlEffectiveness") && (
                <Select
                  id="controlEff"
                  label="Effectiveness of Control"
                  options={CONTROL_EFFECTIVENESS_OPTIONS}
                  placeholder="Select..."
                  value={controlEffectiveness}
                  onChange={(e) => setControlEffectiveness(e.target.value)}
                />
              )}
              {isVisible("treatmentStrategy") && (
                <Select
                  id="treatment"
                  label="Risk Treatment Option"
                  options={TREATMENT_STRATEGY_OPTIONS}
                  placeholder="Select..."
                  value={tStrategy}
                  onChange={(e) => setTStrategy(e.target.value)}
                />
              )}
            </div>
            {isVisible("treatmentStrategy") && tStrategy && (
              <Textarea
                id="tDesc"
                label="Treatment Description"
                value={tDescription}
                onChange={(e) => setTDescription(e.target.value)}
                rows={3}
              />
            )}
          </fieldset>
        )}

        {/* Action Plan */}
        {(isVisible("actionPlan") ||
          isVisible("actionOwnerId") ||
          isVisible("estStartDate") ||
          isVisible("estEndDate")) && (
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Action Plan
            </legend>
            {isVisible("actionPlan") && (
              <Textarea
                id="actionPlan"
                label="Action Plan"
                value={actionPlan}
                onChange={(e) => setActionPlan(e.target.value)}
                rows={3}
              />
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {isVisible("actionOwnerId") && (
                <Select
                  id="actionOwner"
                  label="Action Owner"
                  options={memberOptions}
                  placeholder="Select..."
                  value={actionOwnerId}
                  onChange={(e) => setActionOwnerId(e.target.value)}
                />
              )}
              {isVisible("estStartDate") && (
                <Input
                  id="estStart"
                  label="EST Start Date"
                  type="date"
                  value={estStartDate}
                  onChange={(e) => setEstStartDate(e.target.value)}
                />
              )}
              {isVisible("estEndDate") && (
                <Input
                  id="estEnd"
                  label="EST End Date"
                  type="date"
                  value={estEndDate}
                  onChange={(e) => setEstEndDate(e.target.value)}
                />
              )}
            </div>
          </fieldset>
        )}

        {/* Approvals */}
        {(isVisible("budgetApproval") || isVisible("managementApproval")) && (
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Approvals
            </legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {isVisible("budgetApproval") && (
                <Select
                  id="budgetAppr"
                  label="Budget Approval"
                  options={APPROVAL_OPTIONS}
                  placeholder="Select..."
                  value={budgetApproval}
                  onChange={(e) => setBudgetApproval(e.target.value)}
                />
              )}
              {isVisible("managementApproval") && (
                <Select
                  id="mgmtAppr"
                  label="Management Approval"
                  options={APPROVAL_OPTIONS}
                  placeholder="Select..."
                  value={managementApproval}
                  onChange={(e) => setManagementApproval(e.target.value)}
                />
              )}
            </div>
          </fieldset>
        )}

        {/* Residual Risk */}
        {(isVisible("residualLikelihood") || isVisible("residualImpact")) && (
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Residual Risk
            </legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {isVisible("residualLikelihood") && (
                <Select
                  id="resLikelihood"
                  label="Residual Likelihood"
                  options={PROBABILITY_OPTIONS}
                  placeholder="Select..."
                  value={residualLikelihood}
                  onChange={(e) => setResidualLikelihood(e.target.value)}
                />
              )}
              {isVisible("residualImpact") && (
                <Select
                  id="resImpact"
                  label="Residual Impact"
                  options={IMPACT_LEVEL_OPTIONS}
                  placeholder="Select..."
                  value={residualImpact}
                  onChange={(e) => setResidualImpact(e.target.value)}
                />
              )}
              {isVisible("residualRiskScore") && risk.residualRiskScore != null && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Residual Score
                  </label>
                  <div className="flex h-[38px] items-center gap-2">
                    <Badge
                      variant={scoreSeverity(risk.residualRiskScore).variant}
                      className="text-base px-3 py-1"
                    >
                      {risk.residualRiskScore}
                    </Badge>
                    <span className="text-sm text-neutral-500">
                      {scoreSeverity(risk.residualRiskScore).label}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </fieldset>
        )}

        {/* Remarks */}
        {isVisible("remarks") && (
          <fieldset className="space-y-4">
            <legend className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Additional
            </legend>
            <Textarea
              id="remarks"
              label="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </fieldset>
        )}
      </div>
    </Card>
  );
}

// ──────────────────────────────────────────────
// Risk Matrix Tab — interactive 5x5 heatmaps
// ──────────────────────────────────────────────

function formatMatrixPos(l: number, i: number): string {
  return `${l}×${i} (${l * i})`;
}

function RiskMatrixTab({ risk, onSaved }: { risk: RiskDetail; onSaved: () => void }) {
  const [inherentL, setInherentL] = useState(risk.probabilityScore);
  const [inherentI, setInherentI] = useState(risk.impactScore);
  const [residualL, setResidualL] = useState(risk.residualLikelihoodScore ?? risk.probabilityScore);
  const [residualI, setResidualI] = useState(risk.residualImpactScore ?? risk.impactScore);
  const [saving, setSaving] = useState<"inherent" | "residual" | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [history, setHistory] = useState<RiskMatrixChangeItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await apiClient.listRiskMatrixChanges(risk.id, { limit: 50 });
      setHistory(res.data);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [risk.id]);

  useEffect(() => {
    setInherentL(risk.probabilityScore);
    setInherentI(risk.impactScore);
    setResidualL(risk.residualLikelihoodScore ?? risk.probabilityScore);
    setResidualI(risk.residualImpactScore ?? risk.impactScore);
  }, [risk]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const inherentDirty = inherentL !== risk.probabilityScore || inherentI !== risk.impactScore;
  const residualDirty =
    residualL !== (risk.residualLikelihoodScore ?? risk.probabilityScore) ||
    residualI !== (risk.residualImpactScore ?? risk.impactScore);

  const inherentDisplayScore = inherentDirty ? inherentL * inherentI : risk.riskScore;
  const residualDisplayScore = residualDirty
    ? residualL * residualI
    : (risk.residualRiskScore ?? residualL * residualI);

  async function saveInherent() {
    setSaving("inherent");
    try {
      await apiClient.updateRisk(risk.id, {
        probabilityScore: inherentL,
        impactScore: inherentI,
        changeSource: "matrix",
      });
      setSuccess("Inherent risk updated");
      onSaved();
      await loadHistory();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      /* ignore */
    } finally {
      setSaving(null);
    }
  }

  async function saveResidual() {
    setSaving("residual");
    try {
      await apiClient.updateRisk(risk.id, {
        residualLikelihoodScore: residualL,
        residualImpactScore: residualI,
        changeSource: "matrix",
      });
      setSuccess("Residual risk updated");
      onSaved();
      await loadHistory();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      /* ignore */
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <InfoDrawer
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="How the risk matrix works"
        widthClassName="max-w-lg"
      >
        <RiskMatrixHelpContent />
      </InfoDrawer>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Use the grids to set likelihood and impact. Save each side when you are ready to persist
          changes.
        </p>
        <InfoLink onClick={() => setHelpOpen(true)} label="How this works" />
      </div>

      <RiskScoreSuggestionBanner
        riskId={risk.id}
        currentLikelihood={risk.probabilityScore}
        currentImpact={risk.impactScore}
        onApply={async (likelihood, impact) => {
          setInherentL(likelihood);
          setInherentI(impact);
          await apiClient.updateRisk(risk.id, {
            probabilityScore: likelihood,
            impactScore: impact,
            changeSource: "matrix",
          });
          onSaved();
          await loadHistory();
        }}
      />

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Inherent Risk
                </h3>
                <p className="text-xs text-neutral-500">Risk level before any controls</p>
              </div>
              <div className="text-right">
                <Badge
                  variant={scoreSeverity(inherentL * inherentI).variant}
                  className="text-lg px-3 py-1"
                >
                  {inherentL * inherentI}
                </Badge>
                <p className="mt-1 text-xs text-neutral-500">
                  {scoreSeverity(inherentL * inherentI).label}
                </p>
              </div>
            </div>
            <RiskMatrix
              activeLikelihood={inherentL}
              activeImpact={inherentI}
              onSelect={(l, i) => {
                setInherentL(l);
                setInherentI(i);
              }}
            />
            {inherentDirty && (
              <div className="flex justify-end">
                <Button size="sm" loading={saving === "inherent"} onClick={saveInherent}>
                  Save Inherent Risk
                </Button>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Residual Risk
                </h3>
                <p className="text-xs text-neutral-500">Risk level after controls applied</p>
              </div>
              <div className="text-right">
                <Badge
                  variant={scoreSeverity(residualL * residualI).variant}
                  className="text-lg px-3 py-1"
                >
                  {residualL * residualI}
                </Badge>
                <p className="mt-1 text-xs text-neutral-500">
                  {scoreSeverity(residualL * residualI).label}
                </p>
              </div>
            </div>
            <RiskMatrix
              activeLikelihood={residualL}
              activeImpact={residualI}
              onSelect={(l, i) => {
                setResidualL(l);
                setResidualI(i);
              }}
            />
            {residualDirty && (
              <div className="flex justify-end">
                <Button size="sm" loading={saving === "residual"} onClick={saveResidual}>
                  Save Residual Risk
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              Risk Reduction
            </h3>
            <p className="text-xs text-neutral-500">
              Compares displayed inherent vs residual scores
              {inherentDirty || residualDirty ? " (includes unsaved grid edits)" : ""}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                {inherentDisplayScore}
              </p>
              <p className="text-[10px] text-neutral-500">Inherent</p>
            </div>
            <svg
              className="h-5 w-5 shrink-0 text-neutral-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-center">
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                {residualDisplayScore}
              </p>
              <p className="text-[10px] text-neutral-500">Residual</p>
            </div>
            <div className="text-center">
              {(() => {
                const inh = inherentDisplayScore;
                const res = residualDisplayScore;
                const reduction = inh - res;
                const pct = inh > 0 ? Math.round((reduction / inh) * 100) : 0;
                return (
                  <Badge
                    variant={reduction > 0 ? "success" : reduction === 0 ? "neutral" : "danger"}
                  >
                    {reduction > 0
                      ? `-${pct}%`
                      : reduction === 0
                        ? "No change"
                        : `+${Math.abs(pct)}%`}
                  </Badge>
                );
              })()}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Matrix change history
          </h3>
          <p className="text-xs text-neutral-500">
            Recorded when matrix positions are saved (tab, overview, or assessment)
          </p>
        </div>
        {historyLoading ? (
          <p className="text-sm text-neutral-500">Loading history…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-neutral-500">No matrix changes recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>When</TableHeader>
                  <TableHeader>User</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>From</TableHeader>
                  <TableHeader>To</TableHeader>
                  <TableHeader>Source</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(row.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell className="text-xs">{row.changedBy?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs capitalize">{row.kind}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.prevLikelihood != null && row.prevImpact != null
                        ? formatMatrixPos(row.prevLikelihood, row.prevImpact)
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatMatrixPos(row.newLikelihood, row.newImpact)}
                    </TableCell>
                    <TableCell className="text-xs capitalize">{row.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────
// Interactive 5x5 Risk Matrix
// ──────────────────────────────────────────────

function RiskMatrix({
  activeLikelihood,
  activeImpact,
  onSelect,
}: {
  activeLikelihood: number;
  activeImpact: number;
  onSelect: (likelihood: number, impact: number) => void;
}) {
  const likelihoodLabels = ["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"];
  const impactLabels = ["Negligible", "Minor", "Moderate", "Major", "Catastrophic"];

  function cellColor(l: number, i: number): string {
    const score = l * i;
    if (score >= 20) return "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500";
    if (score >= 12)
      return "bg-amber-400 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-400";
    if (score >= 5)
      return "bg-yellow-300 hover:bg-yellow-400 dark:bg-yellow-400 dark:hover:bg-yellow-300";
    return "bg-emerald-300 hover:bg-emerald-400 dark:bg-emerald-400 dark:hover:bg-emerald-300";
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1">
        <div className="flex flex-col items-end gap-1 pb-7 pr-1">
          {[5, 4, 3, 2, 1].map((l) => (
            <div key={l} className="flex h-11 items-center justify-end">
              <span className="whitespace-nowrap text-[10px] text-neutral-500">
                {l}. {likelihoodLabels[l - 1]}
              </span>
            </div>
          ))}
        </div>
        <div>
          <div className="flex flex-col gap-1">
            {[5, 4, 3, 2, 1].map((l) => (
              <div key={l} className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => {
                  const isActive = l === activeLikelihood && i === activeImpact;
                  return (
                    <button
                      key={`${l}-${i}`}
                      type="button"
                      onClick={() => onSelect(l, i)}
                      className={`flex h-11 w-16 items-center justify-center rounded text-xs font-bold transition-all ${cellColor(l, i)} ${
                        isActive
                          ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-900 shadow-lg scale-105"
                          : "text-white/80"
                      }`}
                      title={`Likelihood: ${l}, Impact: ${i}, Score: ${l * i}`}
                    >
                      {isActive ? (
                        <span className="flex items-center gap-0.5">
                          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
                          {l * i}
                        </span>
                      ) : (
                        l * i
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1">
            {impactLabels.map((label, idx) => (
              <div key={label} className="w-16 text-center text-[10px] text-neutral-500">
                {idx + 1}. {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Assessments Tab
// ──────────────────────────────────────────────

function AssessmentsTab({
  risk,
  members,
  onSaved,
}: {
  risk: RiskDetail;
  members: OrgMember[];
  onSaved: () => void;
}) {
  const [assessments, setAssessments] = useState<RiskAssessmentItem[]>(risk.assessments);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [iL, setIL] = useState(String(risk.probabilityScore));
  const [iI, setII] = useState(String(risk.impactScore));
  const [rL, setRL] = useState(String(risk.residualLikelihoodScore ?? risk.probabilityScore));
  const [rI, setRI] = useState(String(risk.residualImpactScore ?? risk.impactScore));
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setAssessments(risk.assessments);
  }, [risk]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await apiClient.createRiskAssessment(risk.id, {
        inherentLikelihood: Number(iL),
        inherentImpact: Number(iI),
        residualLikelihood: Number(rL),
        residualImpact: Number(rI),
        notes: notes.trim() || undefined,
      });
      setAssessments((prev) => [res.data, ...prev]);
      setShowForm(false);
      setNotes("");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assessment");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(assessmentId: string) {
    try {
      await apiClient.deleteRiskAssessment(risk.id, assessmentId);
      setAssessments((prev) => prev.filter((a) => a.id !== assessmentId));
      onSaved();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Assessment History
          </h3>
          <p className="text-xs text-neutral-500">
            Track how this risk has been assessed over time
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New Assessment"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Select
                id="a-il"
                label="Inherent Likelihood"
                options={LIKELIHOOD_SCORE_OPTIONS}
                value={iL}
                onChange={(e) => setIL(e.target.value)}
              />
              <Select
                id="a-ii"
                label="Inherent Impact"
                options={IMPACT_SCORE_OPTIONS}
                value={iI}
                onChange={(e) => setII(e.target.value)}
              />
              <Select
                id="a-rl"
                label="Residual Likelihood"
                options={LIKELIHOOD_SCORE_OPTIONS}
                value={rL}
                onChange={(e) => setRL(e.target.value)}
              />
              <Select
                id="a-ri"
                label="Residual Impact"
                options={IMPACT_SCORE_OPTIONS}
                value={rI}
                onChange={(e) => setRI(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">Inherent Score</label>
                <Badge
                  variant={scoreSeverity(Number(iL) * Number(iI)).variant}
                  className="text-base px-3 py-1 block text-center"
                >
                  {Number(iL) * Number(iI)}
                </Badge>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-500">Residual Score</label>
                <Badge
                  variant={scoreSeverity(Number(rL) * Number(rI)).variant}
                  className="text-base px-3 py-1 block text-center"
                >
                  {Number(rL) * Number(rI)}
                </Badge>
              </div>
            </div>
            <Textarea
              id="a-notes"
              label="Assessment Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                Record Assessment
              </Button>
            </div>
          </form>
        </Card>
      )}

      {assessments.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-sm text-neutral-500">No assessments recorded yet.</p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Date</TableHeader>
                <TableHeader>Assessor</TableHeader>
                <TableHeader>Inherent</TableHeader>
                <TableHeader>Residual</TableHeader>
                <TableHeader>Notes</TableHeader>
                <TableHeader className="w-16" />
              </TableRow>
            </TableHead>
            <TableBody>
              {assessments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-sm">{formatDate(a.assessedAt)}</TableCell>
                  <TableCell className="text-sm">{a.assessedBy.name}</TableCell>
                  <TableCell>
                    <Badge variant={scoreSeverity(a.inherentLikelihood * a.inherentImpact).variant}>
                      {a.inherentLikelihood * a.inherentImpact}
                    </Badge>
                    <span className="ml-1 text-xs text-neutral-400">
                      {a.inherentLikelihood}x{a.inherentImpact}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={scoreSeverity(a.residualLikelihood * a.residualImpact).variant}>
                      {a.residualLikelihood * a.residualImpact}
                    </Badge>
                    <span className="ml-1 text-xs text-neutral-400">
                      {a.residualLikelihood}x{a.residualImpact}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-xs truncate text-sm text-neutral-500">{a.notes || "—"}</p>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                      onClick={() => handleDelete(a.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Treatments Tab
// ──────────────────────────────────────────────

function TreatmentsTab({
  risk,
  members,
  onSaved,
}: {
  risk: RiskDetail;
  members: OrgMember[];
  onSaved: () => void;
}) {
  const [treatments, setTreatments] = useState<RiskTreatmentItem[]>(risk.treatments);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RiskTreatmentItem | null>(null);

  useEffect(() => {
    setTreatments(risk.treatments);
  }, [risk]);

  async function handleDelete(treatmentId: string) {
    try {
      await apiClient.deleteRiskTreatment(risk.id, treatmentId);
      setTreatments((prev) => prev.filter((t) => t.id !== treatmentId));
      onSaved();
    } catch {
      /* ignore */
    }
  }

  async function handleStatusChange(treatment: RiskTreatmentItem, newStatus: TreatmentStatusType) {
    try {
      const res = await apiClient.updateRiskTreatment(risk.id, treatment.id, {
        status: newStatus,
        completedAt: newStatus === "completed" ? new Date().toISOString() : null,
      });
      setTreatments((prev) => prev.map((t) => (t.id === treatment.id ? res.data : t)));
      onSaved();
    } catch {
      /* ignore */
    }
  }

  const completedCount = treatments.filter((t) => t.status === "completed").length;
  const totalCount = treatments.length;

  return (
    <div className="space-y-6">
      {totalCount > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Treatment Progress
              </h3>
              <p className="text-xs text-neutral-500">
                {completedCount} of {totalCount} completed
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : "0%",
                  }}
                />
              </div>
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
              </span>
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Treatment Plans
          </h3>
          <p className="text-xs text-neutral-500">Actions to address this risk</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          Add Treatment Plan
        </Button>
      </div>

      {treatments.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-sm text-neutral-500">No treatment plans defined yet.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {treatments.map((t) => {
            const tsb = TREATMENT_STATUS_BADGE[t.status];
            const isOverdue =
              t.dueDate &&
              new Date(t.dueDate) < new Date() &&
              t.status !== "completed" &&
              t.status !== "cancelled";
            return (
              <Card key={t.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {t.title}
                      </h4>
                      <Badge variant={tsb.variant}>{tsb.label}</Badge>
                      <Badge variant="neutral">{TREATMENT_LABEL[t.strategy]}</Badge>
                      {isOverdue && <Badge variant="danger">Overdue</Badge>}
                    </div>
                    {t.description && (
                      <p className="mt-1 text-sm text-neutral-500">{t.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-neutral-400">
                      <span>Assigned to {t.responsible.name}</span>
                      {t.dueDate && <span>Due {formatDate(t.dueDate)}</span>}
                      {t.completedAt && <span>Completed {formatDate(t.completedAt)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {t.status !== "completed" && t.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStatusChange(t, "completed")}
                      >
                        Complete
                      </Button>
                    )}
                    <button
                      type="button"
                      title="Edit"
                      onClick={() => setEditTarget(t)}
                      className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Delete"
                      onClick={() => handleDelete(t.id)}
                      className="rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {createOpen && (
        <TreatmentFormModal
          riskId={risk.id}
          members={members}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            onSaved();
          }}
        />
      )}
      {editTarget && (
        <TreatmentFormModal
          riskId={risk.id}
          members={members}
          treatment={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            onSaved();
          }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Treatment Form Modal (create / edit)
// ──────────────────────────────────────────────

function TreatmentFormModal({
  riskId,
  members,
  treatment,
  onClose,
  onSaved,
}: {
  riskId: string;
  members: OrgMember[];
  treatment?: RiskTreatmentItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!treatment;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(treatment?.title || "");
  const [strategy, setStrategy] = useState<TreatmentStrategyType>(
    treatment?.strategy || "mitigate",
  );
  const [description, setDescription] = useState(treatment?.description || "");
  const [responsibleId, setResponsibleId] = useState(treatment?.responsibleId || "");
  const [dueDate, setDueDate] = useState(
    treatment?.dueDate ? new Date(treatment.dueDate).toISOString().split("T")[0] : "",
  );
  const [status, setStatus] = useState<TreatmentStatusType>(treatment?.status || "planned");

  const memberOptions = members.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!responsibleId) {
      setError("Responsible person is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await apiClient.updateRiskTreatment(riskId, treatment!.id, {
          title: title.trim(),
          strategy,
          description: description.trim() || undefined,
          responsibleId,
          dueDate: dueDate || undefined,
          status,
        });
      } else {
        await apiClient.createRiskTreatment(riskId, {
          title: title.trim(),
          strategy,
          description: description.trim() || undefined,
          responsibleId,
          dueDate: dueDate || undefined,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save treatment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit Treatment Plan" : "Add Treatment Plan"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        <Input
          id="t-title"
          label="Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          id="t-description"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="t-strategy"
            label="Strategy"
            options={TREATMENT_STRATEGY_OPTIONS}
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as TreatmentStrategyType)}
          />
          {isEdit && (
            <Select
              id="t-status"
              label="Status"
              options={TREATMENT_STATUS_OPTIONS}
              value={status}
              onChange={(e) => setStatus(e.target.value as TreatmentStatusType)}
            />
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="t-responsible"
            label="Responsible Person *"
            options={memberOptions}
            placeholder="Select..."
            value={responsibleId}
            onChange={(e) => setResponsibleId(e.target.value)}
          />
          <Input
            id="t-due"
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? "Update" : "Create"} Treatment Plan
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ──────────────────────────────────────────────
// Delete Risk Confirmation
// ──────────────────────────────────────────────

function DeleteRiskConfirm({
  risk,
  onCancel,
  onDeleted,
}: {
  risk: RiskDetail;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await apiClient.deleteRisk(risk.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete risk");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Are you sure you want to delete{" "}
        <strong className="text-neutral-900 dark:text-white">{risk.title}</strong>? This will
        permanently remove all associated assessments and treatment plans. This action cannot be
        undone.
      </p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
          Delete Risk
        </Button>
      </div>
    </div>
  );
}
