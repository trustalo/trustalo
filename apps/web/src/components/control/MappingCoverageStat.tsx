"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { apiClient, type FrameworkType, type RequirementMappingItem } from "@/lib/api-client";

interface Props {
  source: FrameworkType;
  target: FrameworkType;
  sourceLabel?: string;
  targetLabel?: string;
}

/**
 * "X% of <source> requirements are also covered by your <target> controls."
 *
 * Lightweight widget for the dashboard / framework detail page. Computes
 * coverage purely from the catalog mappings + the org's adopted frameworks
 * (we use mapping count divided by total source requirements as a proxy).
 *
 * Uncertainty: this currently shows *catalog* coverage not *implementation*
 * coverage — i.e. it tells you which source requirements have a mapped
 * counterpart, not whether your mapped controls are actually implemented.
 * The implementation-aware version will land alongside the related-controls
 * dashboard widget.
 */
export function MappingCoverageStat({ source, target, sourceLabel, targetLabel }: Props) {
  const [pct, setPct] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiClient.listFrameworkMappings({ source, target, limit: 500 }),
      apiClient.listFrameworks({ type: source } as Record<string, string>),
    ])
      .then(([mappingsRes, fwRes]) => {
        if (cancelled) return;
        const mappedSourceIds = new Set(
          (mappingsRes.data as RequirementMappingItem[]).map((m) => m.requirement.id),
        );
        const sourceFw = fwRes.data.items[0];
        const totalReqs = sourceFw?.totalControls ?? 0;
        setCount(mappedSourceIds.size);
        setTotal(totalReqs);
        setPct(totalReqs > 0 ? Math.round((mappedSourceIds.size / totalReqs) * 100) : 0);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load coverage");
      });
    return () => {
      cancelled = true;
    };
  }, [source, target]);

  return (
    <Card padding="sm">
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {sourceLabel ?? source.toUpperCase()} covered by {targetLabel ?? target.toUpperCase()}
      </p>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : (
        <>
          <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {pct === null ? "…" : `${pct}%`}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {count}/{total} requirements mapped
          </p>
        </>
      )}
    </Card>
  );
}
