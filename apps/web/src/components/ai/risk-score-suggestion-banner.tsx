/**
 * Phase 5 (AI accelerators): Risk-score advisory banner.
 *
 * Wraps <AdvisoryBanner /> with the risk-specific generate / apply /
 * dismiss / refine plumbing. The "Apply" action calls the parent's
 * onApply with the suggested likelihood + impact so the host page
 * can route the change through the existing PATCH /risks/:id endpoint
 * — keeping all matrix-change auditing & residual-score recompute
 * logic in one place.
 *
 * "Refine" simply re-fetches a new suggestion. The audit trail on the
 * server-side captures the Apply / Dismiss decision via a separate
 * /ai-score-decision call.
 */

"use client";

import { useState } from "react";
import { apiClient, type RiskScoreSuggestion } from "@/lib/api-client";
import { isEnterpriseLicenseError, useAiGated, useEnterpriseToast } from "@/lib/enterprise-license";
import { AdvisoryBanner } from "./advisory-banner";
import { EnterpriseRequiredBanner } from "./enterprise-required-banner";

interface Props {
  riskId: string;
  currentLikelihood: number;
  currentImpact: number;
  /** Called when the user clicks Apply. Should perform the PATCH. */
  onApply: (likelihood: number, impact: number) => Promise<void>;
}

export function RiskScoreSuggestionBanner({
  riskId,
  currentLikelihood,
  currentImpact,
  onApply,
}: Props) {
  const [suggestion, setSuggestion] = useState<RiskScoreSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aiGated = useAiGated();
  const enterpriseToast = useEnterpriseToast();

  async function handleGenerate() {
    if (aiGated) {
      enterpriseToast.show("AI risk scoring");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.suggestRiskScore(riskId);
      setSuggestion(res.data);
    } catch (err) {
      if (isEnterpriseLicenseError(err)) {
        enterpriseToast.show("AI risk scoring");
      } else {
        setError(err instanceof Error ? err.message : "Failed to get AI suggestion");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!suggestion) return;
    setApplying(true);
    setError(null);
    try {
      await onApply(suggestion.likelihood, suggestion.impact);
      await apiClient.recordRiskScoreDecision(riskId, {
        suggestionId: suggestion.suggestionId,
        decision: "applied",
        appliedLikelihood: suggestion.likelihood,
        appliedImpact: suggestion.impact,
      });
      setSuggestion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply suggestion");
    } finally {
      setApplying(false);
    }
  }

  async function handleDismiss() {
    if (!suggestion) return;
    try {
      await apiClient.recordRiskScoreDecision(riskId, {
        suggestionId: suggestion.suggestionId,
        decision: "dismissed",
      });
    } catch {
      // Best-effort — clearing the banner is the user-visible action.
    }
    setSuggestion(null);
  }

  async function handleRefine() {
    if (!suggestion) return;
    try {
      await apiClient.recordRiskScoreDecision(riskId, {
        suggestionId: suggestion.suggestionId,
        decision: "refined",
      });
    } catch {
      // Best-effort.
    }
    await handleGenerate();
  }

  const toast = (
    <EnterpriseRequiredBanner
      open={enterpriseToast.open}
      feature={enterpriseToast.feature}
      onClose={enterpriseToast.dismiss}
    />
  );

  if (!suggestion && !loading && !error) {
    return (
      <div className="space-y-2">
        {toast}
        <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/40 p-3 dark:border-blue-800 dark:bg-blue-950/20">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <span className="font-semibold">AI suggestion available.</span>{" "}
              <span className="text-blue-800/80 dark:text-blue-200/80">
                Get a likelihood and impact recommendation grounded in this org's other risks.
              </span>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700"
            >
              Suggest score
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !suggestion) {
    return (
      <div className="space-y-2">
        {toast}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            Generating AI score suggestion…
          </span>
        </div>
      </div>
    );
  }

  if (error && !suggestion) {
    return (
      <div className="space-y-2">
        {toast}
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={handleGenerate}
              className="shrink-0 rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-neutral-900 dark:text-red-200 dark:hover:bg-neutral-800"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!suggestion) return toast;

  const likelihoodChanged = suggestion.likelihood !== currentLikelihood;
  const impactChanged = suggestion.impact !== currentImpact;

  return (
    <div className="space-y-2">
      {toast}
      <AdvisoryBanner
        title="AI-suggested risk score"
        subtitle={
          likelihoodChanged || impactChanged
            ? `Differs from current (L${currentLikelihood} × I${currentImpact} = ${currentLikelihood * currentImpact})`
            : "Matches the current score — accepting affirms the existing rating."
        }
        rationale={suggestion.rationale}
        confidence={suggestion.confidence}
        caveats={suggestion.caveats}
        modelUsed={suggestion.modelUsed}
        providerSource={suggestion.providerSource}
        generatedAt={suggestion.generatedAt}
        fields={[
          {
            label: "Likelihood",
            value: `${suggestion.likelihood} / 5`,
            tint: likelihoodChanged ? "amber" : "blue",
          },
          {
            label: "Impact",
            value: `${suggestion.impact} / 5`,
            tint: impactChanged ? "amber" : "blue",
          },
          {
            label: "Score",
            value: suggestion.riskScore,
            tint:
              suggestion.riskScore >= 15 ? "red" : suggestion.riskScore >= 8 ? "amber" : "green",
          },
        ]}
        applying={applying}
        onApply={handleApply}
        onDismiss={handleDismiss}
        onRefine={handleRefine}
        refining={loading}
        error={error}
      />
    </div>
  );
}
