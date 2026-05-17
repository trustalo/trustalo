/**
 * Evidence-agent presets.
 *
 * A preset is a curated `(agentInstructions, suggestedToolKinds,
 * suggestedScheduleMinutes)` tuple that pre-fills the per-control
 * evidence-agent configuration. Presets are *suggestions*, not
 * mandates — the user reviews + customises before saving.
 *
 * Why presets exist
 * ─────────────────
 * The hardest part of getting an evidence agent live for a regulated
 * framework like APRA CPS 234 is articulating *exactly* what evidence
 * the regulator expects, in language the LLM can act on. Off-the-shelf
 * audits assume you already know that. Presets bake the regulator's
 * own paragraph-level expectations into the prompt so the agent's
 * first run produces audit-grade output.
 *
 * Why this lives in the registry, not seed data
 * ─────────────────────────────────────────────
 * Earlier drafts considered seeding presets into a DB table. Two
 * problems with that approach:
 *
 *   1. Schema drift — any time we tune a preset's wording we'd need a
 *      migration + a per-tenant data backfill. Presets are templates,
 *      not tenant data; they belong in code.
 *   2. Trust + auditability — the API code is the source of truth the
 *      regulator can ask us to demonstrate. A code-side registry has a
 *      git blame trail; a DB row does not.
 *
 * The presets are returned read-only via `GET /control-weaknesses/
 * presets` and consumed by the UI; the existing
 * `PUT /controls/:id/evidence-config` mutation accepts the preset's
 * payload verbatim.
 *
 * Design rules for each preset:
 *   • `id` is stable and prefixed with the framework key + paragraph,
 *     e.g. `cps234-para-28-bau-monitoring`. Renaming is a breaking
 *     change.
 *   • `agentInstructions` is ≤ 4000 chars (well under the 8000 limit
 *     in `evidenceConfigBody`).
 *   • `suggestedToolKinds` lists generic kinds (e.g. `cloud_audit_log`,
 *     `iam`, `siem`) — the UI maps these to the tenant's actual
 *     IntegrationConnections.
 *   • `suggestedScheduleMinutes` reflects regulator expectations of
 *     "embedded BAU monitoring" (Para 27) — daily for high-velocity
 *     evidence (logs), weekly for register-style evidence (asset
 *     classification).
 */

export type EvidenceAgentToolKind =
  | "cloud_audit_log"
  | "siem"
  | "iam"
  | "vcs_audit"
  | "ticketing"
  | "vuln_scanner"
  | "edr"
  | "asset_inventory"
  | "secrets_scanner"
  | "dlp"
  | "backup_orchestrator"
  | "patch_manager";

export interface EvidenceAgentPreset {
  /** Stable identifier — prefixed by framework + paragraph. */
  id: string;
  /** Framework key this preset belongs to (matches FrameworkType enum). */
  frameworkType: string;
  /** Short human label — surfaced in the UI's preset picker. */
  label: string;
  /** One-paragraph description of what the preset does. */
  description: string;
  /** CPS 234 / framework paragraph numbers this preset addresses. */
  citations: string[];
  /** Categories the preset spans — used by the UI to group presets. */
  category: string;
  /** Natural-language directive injected verbatim into the agent prompt. */
  agentInstructions: string;
  /** Tool kinds the agent will probably need. */
  suggestedToolKinds: EvidenceAgentToolKind[];
  /** Cadence in minutes — null = on-demand only. */
  suggestedScheduleMinutes: number | null;
}

/**
 * The CPS 234 preset catalogue. One preset per "evidence pillar" the
 * regulator's HPE 234 questions ask about.
 *
 * Ordered top-to-bottom by category so the picker reads like the
 * standard itself.
 */
export const CPS234_EVIDENCE_AGENT_PRESETS: ReadonlyArray<EvidenceAgentPreset> = [
  {
    id: "cps234-para-23-information-asset-classification",
    frameworkType: "cps234",
    label: "Para 23 — Information-asset classification register",
    description:
      "Verify each in-scope information asset has a current sensitivity + criticality classification, an owner, and review evidence within 12 months.",
    citations: ["CPS234-23"],
    category: "Asset classification",
    agentInstructions: [
      "You are auditing the entity's information-asset classification register against APRA CPS 234 paragraph 23.",
      "",
      "Collect the following evidence and produce a structured summary:",
      "  1. The current asset inventory (use the asset_inventory tool).",
      "  2. For each asset: confirm a sensitivity tier (Restricted/Confidential/Internal/Public), a criticality tier (Critical/High/Medium/Low), and an owner.",
      "  3. The date of the most recent review per asset; flag any reviewed > 12 months ago as stale.",
      "",
      "Cite the source row id for every claim. If the inventory does not expose a classification field, NOTE the gap rather than inventing values. Do NOT classify assets yourself — your job is to evidence the existing classifications.",
    ].join("\n"),
    suggestedToolKinds: ["asset_inventory"],
    suggestedScheduleMinutes: 60 * 24 * 7, // weekly
  },
  {
    id: "cps234-para-25-policy-framework",
    frameworkType: "cps234",
    label: "Para 25 — Information-security policy framework approvals",
    description:
      "Show that the information-security policy framework is approved by the Board (or delegate) and reviewed at planned intervals.",
    citations: ["CPS234-25"],
    category: "Governance",
    agentInstructions: [
      "Per APRA CPS 234 paragraph 25, evidence that the information-security policy framework is current and Board-approved.",
      "",
      "Collect:",
      "  1. The latest version of each policy in the information-security framework (use the vcs_audit / ticketing tools to identify the source of truth).",
      "  2. The approver (must be Board, Risk Committee or documented delegate) and approval date.",
      "  3. Any policy whose nextReviewAt is in the past, or whose lastApprovedAt is > 18 months ago.",
      "",
      "Output a per-policy table: { policyId, name, version, approver, approvedAt, nextReviewAt, status }. Flag exceptions with severity.",
    ].join("\n"),
    suggestedToolKinds: ["vcs_audit", "ticketing"],
    suggestedScheduleMinutes: 60 * 24 * 7,
  },
  {
    id: "cps234-para-27-control-effectiveness",
    frameworkType: "cps234",
    label: "Para 27 — Control-design effectiveness",
    description:
      "Show that the entity's information-security controls are designed and operating to address the threat environment.",
    citations: ["CPS234-27"],
    category: "Control effectiveness",
    agentInstructions: [
      "Per APRA CPS 234 paragraph 27, evidence that information-security controls are operating effectively.",
      "",
      "For each in-scope control with status='implemented':",
      "  1. Pull the most recent evidence artefacts (use the cloud_audit_log, iam and siem tools).",
      "  2. Verify the control is producing telemetry within the last 24 hours (or the agreed control frequency).",
      "  3. List any deviations: missing telemetry, alert backlog > SLA, integration in error state.",
      "",
      "Do NOT change control status — your job is to evidence the existing state. Flag deviations with severity = high if they break BAU monitoring, medium otherwise.",
    ].join("\n"),
    suggestedToolKinds: ["cloud_audit_log", "iam", "siem"],
    suggestedScheduleMinutes: 60 * 24, // daily
  },
  {
    id: "cps234-para-28-bau-monitoring",
    frameworkType: "cps234",
    label: "Para 28 — Embedded BAU monitoring",
    description:
      "Demonstrate that information-security testing is embedded in business-as-usual operations, not just point-in-time projects.",
    citations: ["CPS234-28"],
    category: "Continuous testing",
    agentInstructions: [
      "Per APRA CPS 234 paragraph 28, evidence that information-security testing is embedded in BAU.",
      "",
      "Collect the following from the last 30 days:",
      "  1. CloudTrail (or equivalent cloud audit log) events for IAM, KMS, S3-bucket-policy and security-group changes.",
      "  2. EDR alert volume + MTTR (mean time to respond), broken down by severity.",
      "  3. Vulnerability-scanner runs: cadence, coverage of the asset inventory, and SLA breach count.",
      "  4. Patch manager: % of in-scope hosts patched within the entity's stated patch SLA.",
      "",
      "Produce a single dashboard-style summary keyed by control, with citations to the underlying integration runs. Do NOT run any active scanning yourself — read existing data only.",
    ].join("\n"),
    suggestedToolKinds: ["cloud_audit_log", "edr", "vuln_scanner", "patch_manager"],
    suggestedScheduleMinutes: 60 * 24,
  },
  {
    id: "cps234-para-29-third-party-controls",
    frameworkType: "cps234",
    label: "Para 29 — Third-party / related-party controls",
    description:
      "Verify the controls of related parties or third parties that manage information assets meet the entity's standards.",
    citations: ["CPS234-29"],
    category: "Third-party",
    agentInstructions: [
      "Per APRA CPS 234 paragraph 29, evidence that third parties managing the entity's information assets have controls meeting the entity's standards.",
      "",
      "For each vendor with dataProcessing=true and risk_tier in ('high', 'critical'):",
      "  1. Pull the most recent attestation (SOC 2 Type II, ISO 27001 cert, or equivalent) date and scope.",
      "  2. Verify the attestation covers the SERVICES the entity actually uses, not just the vendor as a whole.",
      "  3. Flag any attestation > 13 months old, scoped exclusions, or qualified opinions.",
      "  4. Surface any open vendor incidents from the last 12 months.",
      "",
      "Output a per-vendor row with: vendor, riskTier, attestationType, attestationDate, scopeCovers, exceptions, openIncidents. Cite the document id for every attestation reference.",
    ].join("\n"),
    suggestedToolKinds: ["ticketing"],
    suggestedScheduleMinutes: 60 * 24 * 7,
  },
  {
    id: "cps234-para-30-incident-response-readiness",
    frameworkType: "cps234",
    label: "Para 30 — Incident-response readiness",
    description:
      "Show that incident-response capabilities have been tested in the last 12 months (tabletop or live exercise).",
    citations: ["CPS234-30"],
    category: "Incident response",
    agentInstructions: [
      "Per APRA CPS 234 paragraph 30, evidence that incident-response capabilities have been tested.",
      "",
      "Collect:",
      "  1. The most recent incident-response exercise: type (tabletop / live), date, scope, participants, outcomes.",
      "  2. The post-exercise after-action report and any open remediation items.",
      "  3. Real incidents in the last 12 months: severity, MTTD, MTTR, Para-33 notifications filed.",
      "",
      "Flag if the most recent exercise is older than 12 months, or if there are unresolved post-exercise remediation items > 90 days old.",
    ].join("\n"),
    suggestedToolKinds: ["ticketing", "siem"],
    suggestedScheduleMinutes: 60 * 24 * 30,
  },
  {
    id: "cps234-para-32-internal-audit-review",
    frameworkType: "cps234",
    label: "Para 32 — Internal-audit review of information security",
    description:
      "Evidence that the entity's internal-audit function (or equivalent) has reviewed the design and operating effectiveness of information-security controls.",
    citations: ["CPS234-32"],
    category: "Independent assurance",
    agentInstructions: [
      "Per APRA CPS 234 paragraph 32, evidence the internal-audit review of information security.",
      "",
      "Collect:",
      "  1. The most recent internal-audit (or equivalent independent assurance) report covering information security.",
      "  2. Date, scope, opinion, recommendations and management's responses.",
      "  3. The status of each recommendation: open / in-progress / closed, with target close date.",
      "",
      "Flag if no review in the last 12 months, or if any high/critical recommendation is overdue.",
    ].join("\n"),
    suggestedToolKinds: ["ticketing"],
    suggestedScheduleMinutes: 60 * 24 * 30,
  },
  {
    id: "cps234-para-35-control-weakness-clock",
    frameworkType: "cps234",
    label: "Para 35 — Control-weakness 10-business-day clock",
    description:
      "Continuously check the ControlWeakness register for weaknesses approaching the 10-business-day APRA notification deadline.",
    citations: ["CPS234-35"],
    category: "Notification clocks",
    agentInstructions: [
      "Per APRA CPS 234 paragraph 35, evidence the entity's tracking of material control weaknesses against the 10-business-day notification clock.",
      "",
      "From the ControlWeakness register:",
      "  1. List every weakness whose remediability is 'not_remediable_in_time' or 'pending' AND whose notificationDeadlineAt is within the next 5 business days.",
      "  2. List every weakness already past its notificationDeadlineAt without an apraNotifiedAt timestamp.",
      "  3. Cross-reference each weakness's controlId with related risk register entries and open incidents.",
      "",
      "Output an urgency-sorted list. Do NOT decide materiality yourself — surface the data and let the user decide.",
    ].join("\n"),
    // No external tool kinds needed — this preset works against the
    // platform's own ControlWeakness register.
    suggestedToolKinds: [],
    suggestedScheduleMinutes: 60 * 8, // every 8 hours
  },
];

/**
 * Look up a preset by id. Returns `null` for unknown ids.
 *
 * Exported for the apply-preset endpoint and unit tests.
 */
export function findEvidenceAgentPreset(id: string): EvidenceAgentPreset | null {
  return CPS234_EVIDENCE_AGENT_PRESETS.find((p) => p.id === id) ?? null;
}

/**
 * Materialise a preset into a payload accepted by `PUT
 * /controls/:id/evidence-config`. Tool kinds map to integration
 * connection ids on the client side; this helper passes through `[]`
 * since the API has no knowledge of the tenant's connection inventory
 * (that lives in the collector). Callers should overlay the resolved
 * connection ids before persisting.
 */
export interface AppliedPresetPayload {
  mode: "agent";
  agentInstructions: string;
  agentToolConnectionIds: string[];
  agentScheduleMinutes: number | null;
  /** Mirror of the original tool kinds for UI display. */
  suggestedToolKinds: EvidenceAgentToolKind[];
}

export function applyEvidenceAgentPreset(preset: EvidenceAgentPreset): AppliedPresetPayload {
  return {
    mode: "agent",
    agentInstructions: preset.agentInstructions,
    agentToolConnectionIds: [],
    agentScheduleMinutes: preset.suggestedScheduleMinutes,
    suggestedToolKinds: preset.suggestedToolKinds,
  };
}
