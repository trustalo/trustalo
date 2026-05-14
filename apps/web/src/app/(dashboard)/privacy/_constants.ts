/**
 * Single source of truth for all enum labels, options, and badge mappings used
 * across the Privacy/GDPR workspace pages. Mirrors the enums defined in
 * `apps/api/prisma/schema/privacy.prisma` and surfaced through the api-client.
 *
 * Keeping these in one file (rather than re-declaring per page) is what lets
 * the four pages stay consistent — same label phrasing, same colour scheme.
 */

import type { BadgeVariant } from "@/components/ui/badge";
import type {
  DataBreachCategory,
  DataBreachSeverity,
  DataBreachStatus,
  DataCategory,
  DPIANecessity,
  DPIAStatus,
  DSARChannel,
  DSARStatus,
  DSARType,
  LawfulBasis,
  ProcessingActivityStatus,
  ProcessingRole,
  SubjectCategory,
  TransferMechanism,
} from "@/lib/api-client";

// ── Lawful basis (Art. 6) ────────────────────────────────────────────────────

export const LAWFUL_BASIS_OPTIONS: { value: LawfulBasis; label: string; help: string }[] = [
  { value: "consent", label: "Consent", help: "Art. 6(1)(a) — freely-given specific consent" },
  { value: "contract", label: "Contract", help: "Art. 6(1)(b) — performance of a contract" },
  { value: "legal_obligation", label: "Legal obligation", help: "Art. 6(1)(c)" },
  { value: "vital_interests", label: "Vital interests", help: "Art. 6(1)(d) — life-or-death" },
  { value: "public_task", label: "Public task", help: "Art. 6(1)(e)" },
  {
    value: "legitimate_interests",
    label: "Legitimate interests",
    help: "Art. 6(1)(f) — needs LIA",
  },
];

export const lawfulBasisLabel = (b: LawfulBasis): string =>
  LAWFUL_BASIS_OPTIONS.find((o) => o.value === b)?.label ?? b;

// ── Data categories ──────────────────────────────────────────────────────────

export const DATA_CATEGORY_OPTIONS: { value: DataCategory; label: string }[] = [
  { value: "identity", label: "Identity" },
  { value: "contact", label: "Contact" },
  { value: "financial", label: "Financial" },
  { value: "health", label: "Health" },
  { value: "location", label: "Location" },
  { value: "online_identifier", label: "Online identifier" },
  { value: "demographic", label: "Demographic" },
  { value: "employment", label: "Employment" },
  { value: "usage", label: "Usage / behaviour" },
  { value: "special_category", label: "Special category (Art. 9)" },
  { value: "criminal", label: "Criminal (Art. 10)" },
  { value: "other", label: "Other" },
];

export const dataCategoryLabel = (c: DataCategory): string =>
  DATA_CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c;

/**
 * Special-category and criminal data trigger heightened obligations
 * (additional Art. 9/10 conditions, more likely to need DPIA). The UI uses
 * this to badge them in red across the workspace.
 */
export const SENSITIVE_CATEGORIES: DataCategory[] = ["special_category", "criminal", "health"];

// ── Subject categories ──────────────────────────────────────────────────────

export const SUBJECT_CATEGORY_OPTIONS: { value: SubjectCategory; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "employee", label: "Employee" },
  { value: "prospect", label: "Prospect" },
  { value: "supplier_contact", label: "Supplier contact" },
  { value: "minor", label: "Minor (under 16)" },
  { value: "website_visitor", label: "Website visitor" },
  { value: "patient", label: "Patient" },
  { value: "other", label: "Other" },
];

export const subjectCategoryLabel = (s: SubjectCategory): string =>
  SUBJECT_CATEGORY_OPTIONS.find((o) => o.value === s)?.label ?? s;

// ── Cross-border transfer mechanisms (Chap. V) ──────────────────────────────

export const TRANSFER_MECHANISM_OPTIONS: { value: TransferMechanism; label: string }[] = [
  { value: "none_eu_eea", label: "EU/EEA only" },
  { value: "adequacy_decision", label: "Adequacy decision" },
  { value: "scc", label: "SCCs (Standard Contractual Clauses)" },
  { value: "bcr", label: "BCRs (Binding Corporate Rules)" },
  { value: "derogation_art_49", label: "Derogation (Art. 49)" },
];

export const transferMechanismLabel = (m: TransferMechanism | null | undefined): string =>
  m ? (TRANSFER_MECHANISM_OPTIONS.find((o) => o.value === m)?.label ?? m) : "—";

// ── Processing role ─────────────────────────────────────────────────────────

export const PROCESSING_ROLE_OPTIONS: { value: ProcessingRole; label: string }[] = [
  { value: "controller", label: "Controller" },
  { value: "joint_controller", label: "Joint controller" },
  { value: "processor", label: "Processor" },
];

// ── ProcessingActivity status ───────────────────────────────────────────────

export const PA_STATUS_OPTIONS: { value: ProcessingActivityStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "under_review", label: "Under review" },
  { value: "retired", label: "Retired" },
];

export const PA_STATUS_BADGE: Record<
  ProcessingActivityStatus,
  { variant: BadgeVariant; label: string }
> = {
  draft: { variant: "neutral", label: "Draft" },
  active: { variant: "success", label: "Active" },
  under_review: { variant: "warning", label: "Under review" },
  retired: { variant: "neutral", label: "Retired" },
};

// ── DPIA ────────────────────────────────────────────────────────────────────

export const DPIA_STATUS_OPTIONS: { value: DPIAStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export const DPIA_STATUS_BADGE: Record<DPIAStatus, { variant: BadgeVariant; label: string }> = {
  draft: { variant: "neutral", label: "Draft" },
  in_review: { variant: "warning", label: "In review" },
  approved: { variant: "success", label: "Approved" },
  rejected: { variant: "danger", label: "Rejected" },
};

export const DPIA_NECESSITY_OPTIONS: { value: DPIANecessity; label: string; help: string }[] = [
  { value: "required", label: "Required", help: "Likely high risk per Art. 35(1)" },
  { value: "recommended", label: "Recommended", help: "Borderline — document the decision" },
  { value: "not_required", label: "Not required", help: "Low-risk, document why" },
];

export const DPIA_NECESSITY_BADGE: Record<DPIANecessity, { variant: BadgeVariant; label: string }> =
  {
    required: { variant: "danger", label: "Required" },
    recommended: { variant: "warning", label: "Recommended" },
    not_required: { variant: "neutral", label: "Not required" },
  };

export const RESIDUAL_RISK_OPTIONS: { value: "low" | "medium" | "high"; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High — supervisory consultation may be needed" },
];

export const RESIDUAL_RISK_BADGE: Record<
  "low" | "medium" | "high",
  { variant: BadgeVariant; label: string }
> = {
  low: { variant: "success", label: "Low" },
  medium: { variant: "warning", label: "Medium" },
  high: { variant: "danger", label: "High" },
};

// ── Data breach ─────────────────────────────────────────────────────────────

export const BREACH_CATEGORY_OPTIONS: { value: DataBreachCategory; label: string; help: string }[] =
  [
    {
      value: "confidentiality",
      label: "Confidentiality",
      help: "Unauthorised disclosure / access",
    },
    { value: "integrity", label: "Integrity", help: "Unauthorised alteration" },
    {
      value: "availability",
      label: "Availability",
      help: "Loss of access / accidental destruction",
    },
    { value: "combined", label: "Combined", help: "More than one of the above" },
  ];

export const BREACH_SEVERITY_OPTIONS: { value: DataBreachSeverity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export const BREACH_SEVERITY_BADGE: Record<
  DataBreachSeverity,
  { variant: BadgeVariant; label: string }
> = {
  low: { variant: "neutral", label: "Low" },
  medium: { variant: "info", label: "Medium" },
  high: { variant: "warning", label: "High" },
  critical: { variant: "danger", label: "Critical" },
};

export const BREACH_STATUS_OPTIONS: { value: DataBreachStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "contained", label: "Contained" },
  { value: "notified", label: "Notified" },
  { value: "closed", label: "Closed" },
];

export const BREACH_STATUS_BADGE: Record<
  DataBreachStatus,
  { variant: BadgeVariant; label: string }
> = {
  open: { variant: "danger", label: "Open" },
  investigating: { variant: "warning", label: "Investigating" },
  contained: { variant: "info", label: "Contained" },
  notified: { variant: "info", label: "Notified" },
  closed: { variant: "success", label: "Closed" },
};

// ── DSAR ────────────────────────────────────────────────────────────────────

export const DSAR_TYPE_OPTIONS: { value: DSARType; label: string; article: string }[] = [
  { value: "access", label: "Access (subject access copy)", article: "Art. 15" },
  { value: "rectification", label: "Rectification", article: "Art. 16" },
  { value: "erasure", label: "Erasure (right to be forgotten)", article: "Art. 17" },
  { value: "restriction", label: "Restriction of processing", article: "Art. 18" },
  { value: "portability", label: "Data portability", article: "Art. 20" },
  { value: "objection", label: "Objection", article: "Art. 21" },
  { value: "automated_decision", label: "Automated-decision review", article: "Art. 22" },
  { value: "withdraw_consent", label: "Withdraw consent", article: "Art. 7(3)" },
];

export const dsarTypeLabel = (t: DSARType): string =>
  DSAR_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;

export const DSAR_CHANNEL_OPTIONS: { value: DSARChannel; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "web_form", label: "Web form" },
  { value: "post", label: "Post" },
  { value: "phone", label: "Phone" },
  { value: "in_person", label: "In person" },
];

export const DSAR_STATUS_OPTIONS: { value: DSARStatus; label: string }[] = [
  { value: "received", label: "Received" },
  { value: "identity_pending", label: "Identity pending" },
  { value: "in_progress", label: "In progress" },
  { value: "extended", label: "Extended" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "refused", label: "Refused" },
  { value: "closed", label: "Closed" },
];

export const DSAR_STATUS_BADGE: Record<DSARStatus, { variant: BadgeVariant; label: string }> = {
  received: { variant: "info", label: "Received" },
  identity_pending: { variant: "warning", label: "Identity pending" },
  in_progress: { variant: "info", label: "In progress" },
  extended: { variant: "warning", label: "Extended" },
  fulfilled: { variant: "success", label: "Fulfilled" },
  refused: { variant: "danger", label: "Refused" },
  closed: { variant: "neutral", label: "Closed" },
};

/**
 * Statuses that count as "open work" for SLA / KPI purposes. Mirrors the
 * server-side `OPEN_DSAR_STATUSES` in privacy/router.ts.
 */
export const OPEN_DSAR_STATUSES: DSARStatus[] = [
  "received",
  "identity_pending",
  "in_progress",
  "extended",
];
