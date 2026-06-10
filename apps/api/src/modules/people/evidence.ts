/**
 * People → advisory Evidence emitter.
 *
 * HR/compliance milestones (background check cleared, training completed,
 * offboarding finished) are mapped to framework requirements and landed as
 * advisory Evidence in `pending_review` via the same shared writer the device
 * agent uses. Nothing here auto-approves — it just routes proof to a human
 * review queue, honoring the platform's advisory-never-auto-mutate contract.
 */
import { resolveFrameworkRefs } from "../internal/control-binding.js";
import { createAutomatedEvidence } from "../evidence/ingest-service.js";

type Severity = "critical" | "high" | "medium" | "low" | "info";

export const PEOPLE_EVIDENCE = {
  // Pre-employment screening (ISO 27001:2022 A.6.1).
  background_check_cleared: {
    manifestKey: "people.background_check",
    refs: [{ framework: "iso27001", requirement: "A.6.1" }],
    severity: "info" as Severity,
  },
  // Security awareness, education & training (ISO A.6.3 / SOC 2 CC1.4).
  training_completed: {
    manifestKey: "people.training",
    refs: [
      { framework: "iso27001", requirement: "A.6.3" },
      { framework: "soc2", requirement: "CC1.4" },
    ],
    severity: "info" as Severity,
  },
  // Termination / change of employment responsibilities (ISO A.6.5).
  offboarding_completed: {
    manifestKey: "people.offboarding",
    refs: [{ framework: "iso27001", requirement: "A.6.5" }],
    severity: "info" as Severity,
  },
} as const;

export type PeopleEvidenceKind = keyof typeof PEOPLE_EVIDENCE;

/**
 * Resolve the event's framework refs to the tenant's adopted Control ids and
 * emit one advisory Evidence row per control. Returns `{ created: 0 }` (a
 * no-op) when the tenant hasn't adopted any of the mapped controls — exactly
 * like the device path, where un-adopted frameworks simply produce no proof.
 */
export async function emitPeopleEvidence(
  tenantId: string,
  kind: PeopleEvidenceKind,
  opts: {
    title: string;
    description: string;
    sourceId: string;
    rawData?: Record<string, unknown> | null;
    collectedAt?: Date;
  },
): Promise<{ created: number }> {
  const def = PEOPLE_EVIDENCE[kind];
  const resolved = await resolveFrameworkRefs(tenantId, def.refs);
  const controlIds = [...new Set(resolved.flatMap((r) => r.controlIds))];
  if (controlIds.length === 0) return { created: 0 };

  const result = await createAutomatedEvidence(tenantId, [
    {
      title: opts.title,
      description: opts.description,
      manifestKey: def.manifestKey,
      sourceId: opts.sourceId,
      rawData: opts.rawData ?? null,
      severity: def.severity,
      controlIds,
      collectedAt: opts.collectedAt ?? new Date(),
    },
  ]);
  return { created: result.created };
}
