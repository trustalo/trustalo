/**
 * Phase 5 (AI accelerators): Vendor-tier advisory banner.
 *
 * Companion to <RiskScoreSuggestionBanner /> with the same lifecycle:
 * generate → preview → Apply / Dismiss / Refine. Apply delegates the
 * actual tier change to the host page via `onApply` so we go through
 * the standard PATCH /vendors/:id flow (and its existing audit trail).
 */

"use client";

import { useState } from "react";
import { apiClient, type VendorTierSuggestion, type VendorRiskTier } from "@/lib/api-client";
import { AdvisoryBanner } from "./advisory-banner";

interface Props {
  vendorId: string;
  currentTier: VendorRiskTier;
  onApply: (tier: VendorRiskTier) => Promise<void>;
}

const TIER_TINT: Record<VendorRiskTier, "red" | "amber" | "blue" | "green"> = {
  critical: "red",
  high: "amber",
  medium: "blue",
  low: "green",
};

export function VendorTierSuggestionBanner({ vendorId, currentTier, onApply }: Props) {
  const [suggestion, setSuggestion] = useState<VendorTierSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.suggestVendorTier(vendorId);
      setSuggestion(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get AI suggestion");
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!suggestion) return;
    setApplying(true);
    setError(null);
    try {
      await onApply(suggestion.tier);
      await apiClient.recordVendorTierDecision(vendorId, {
        suggestionId: suggestion.suggestionId,
        decision: "applied",
        appliedTier: suggestion.tier,
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
      await apiClient.recordVendorTierDecision(vendorId, {
        suggestionId: suggestion.suggestionId,
        decision: "dismissed",
      });
    } catch {
      // Best-effort.
    }
    setSuggestion(null);
  }

  async function handleRefine() {
    if (!suggestion) return;
    try {
      await apiClient.recordVendorTierDecision(vendorId, {
        suggestionId: suggestion.suggestionId,
        decision: "refined",
      });
    } catch {
      // Best-effort.
    }
    await handleGenerate();
  }

  if (!suggestion && !loading && !error) {
    return (
      <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/40 p-3 dark:border-blue-800 dark:bg-blue-950/20">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <span className="font-semibold">AI suggestion available.</span>{" "}
            <span className="text-blue-800/80 dark:text-blue-200/80">
              Get a risk-tier recommendation grounded in this org's existing vendor calibration.
            </span>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700"
          >
            Suggest tier
          </button>
        </div>
      </div>
    );
  }

  if (loading && !suggestion) {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Generating AI tier suggestion…
        </span>
      </div>
    );
  }

  if (error && !suggestion) {
    return (
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
    );
  }

  if (!suggestion) return null;

  const tierChanged = suggestion.tier !== currentTier;

  return (
    <AdvisoryBanner
      title="AI-suggested vendor risk tier"
      subtitle={
        tierChanged
          ? `Differs from current tier (${currentTier})`
          : "Matches the current tier — accepting affirms the existing rating."
      }
      rationale={suggestion.rationale}
      confidence={suggestion.confidence}
      caveats={suggestion.caveats}
      modelUsed={suggestion.modelUsed}
      providerSource={suggestion.providerSource}
      generatedAt={suggestion.generatedAt}
      fields={[
        {
          label: "Tier",
          value: suggestion.tier,
          tint: TIER_TINT[suggestion.tier],
        },
        ...suggestion.factors.slice(0, 4).map((factor) => ({
          label: "Factor",
          value: factor,
          tint: "blue" as const,
        })),
      ]}
      applying={applying}
      onApply={handleApply}
      onDismiss={handleDismiss}
      onRefine={handleRefine}
      refining={loading}
      error={error}
    />
  );
}
