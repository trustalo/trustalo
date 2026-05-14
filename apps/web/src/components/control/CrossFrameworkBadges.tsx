"use client";

import { useEffect, useState } from "react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
  apiClient,
  type CrossFrameworkRequirement,
  type CrossFrameworkRelationship,
  type FrameworkType,
  type RequirementMappingItem,
} from "@/lib/api-client";

// Per-framework visual style. Colors mirror the FRAMEWORK_META used elsewhere
// in the dashboard so users get consistent affordances across pages.
const FRAMEWORK_VARIANT: Partial<Record<FrameworkType, BadgeVariant>> = {
  iso27001: "info",
  iso27017: "info",
  iso27018: "info",
  iso22301: "success",
  iso42001: "warning",
  soc2: "danger",
  essential8: "warning",
  nist_csf_2: "info",
  gdpr: "info",
};

const FRAMEWORK_LABEL: Partial<Record<FrameworkType, string>> = {
  iso27001: "ISO 27001",
  iso27017: "ISO 27017",
  iso27018: "ISO 27018",
  iso22301: "ISO 22301",
  iso42001: "ISO 42001",
  soc2: "SOC 2",
  essential8: "E8",
  nist_csf_2: "CSF",
  gdpr: "GDPR",
};

const RELATIONSHIP_LABEL: Record<CrossFrameworkRelationship, string> = {
  equivalent: "≡",
  partial: "≈",
  informs: "→",
};

interface InlineProps {
  // From the inline payload on a Control. Renders without a network call.
  inline: CrossFrameworkRequirement[];
  totalCount: number;
  requirementId?: string;
}

interface FullListProps {
  // Loads the full mapping list from /requirements/:id/mappings.
  requirementId: string;
}

/**
 * Compact pill list of related cross-framework requirements.
 * Used on the control detail page to show "this control also satisfies …".
 */
export function CrossFrameworkBadges({ inline, totalCount, requirementId }: InlineProps) {
  const remainder = Math.max(0, totalCount - inline.length);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {inline.map((req) => {
        const variant = FRAMEWORK_VARIANT[req.framework.frameworkType] ?? "neutral";
        const fwLabel = FRAMEWORK_LABEL[req.framework.frameworkType] ?? req.framework.name;
        return (
          <Badge
            key={req.id}
            variant={variant}
            title={`${RELATIONSHIP_LABEL[req.relationship]} ${req.title}`}
          >
            {fwLabel} · {req.identifier}
          </Badge>
        );
      })}
      {remainder > 0 && requirementId && (
        <Badge variant="neutral" title="View all related requirements">
          +{remainder} more
        </Badge>
      )}
      {totalCount === 0 && (
        <span className="text-xs text-neutral-400">No cross-framework links</span>
      )}
    </div>
  );
}

/**
 * Full mapping list — loads from the API. Use on a dedicated mappings tab
 * or modal where the user wants to see every related requirement.
 */
export function FullCrossFrameworkList({ requirementId }: FullListProps) {
  const [mappings, setMappings] = useState<RequirementMappingItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getRequirementMappings(requirementId)
      .then((res) => {
        if (!cancelled) setMappings(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load mappings");
      });
    return () => {
      cancelled = true;
    };
  }, [requirementId]);

  if (error) {
    return <p className="text-xs text-red-600">{error}</p>;
  }
  if (!mappings) {
    return <p className="text-xs text-neutral-400">Loading mappings…</p>;
  }
  if (mappings.length === 0) {
    return <p className="text-xs text-neutral-400">No cross-framework links.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {mappings.map((m) => {
        const variant = FRAMEWORK_VARIANT[m.requirement.framework.frameworkType] ?? "neutral";
        const fwLabel =
          FRAMEWORK_LABEL[m.requirement.framework.frameworkType] ?? m.requirement.framework.name;
        return (
          <li key={m.id} className="flex items-center gap-2 text-sm">
            <Badge variant={variant}>{fwLabel}</Badge>
            <span className="font-medium text-neutral-800 dark:text-neutral-200">
              {m.requirement.identifier}
            </span>
            <span className="text-neutral-600 dark:text-neutral-400">{m.requirement.title}</span>
            <span className="ml-auto text-xs text-neutral-400" title={m.rationale ?? m.source}>
              {RELATIONSHIP_LABEL[m.relationship]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
