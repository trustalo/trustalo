// ──────────────────────────────────────────────
// Framework types
// ──────────────────────────────────────────────

export const FRAMEWORK_TYPES = {
  iso27001: {
    key: "iso27001",
    name: "ISO 27001",
    description: "Information security management systems — Requirements",
  },
  iso27017: {
    key: "iso27017",
    name: "ISO 27017",
    description:
      "Code of practice for information security controls based on ISO/IEC 27002 for cloud services",
  },
  iso27018: {
    key: "iso27018",
    name: "ISO 27018",
    description:
      "Code of practice for protection of personally identifiable information (PII) in public clouds",
  },
  iso22301: {
    key: "iso22301",
    name: "ISO 22301",
    description: "Business continuity management systems — Requirements",
  },
  iso42001: {
    key: "iso42001",
    name: "ISO 42001",
    description: "Artificial intelligence management system — Requirements",
  },
  soc2: {
    key: "soc2",
    name: "SOC 2",
    description: "Service Organization Control 2 — Trust Services Criteria",
  },
  essential8: {
    key: "essential8",
    name: "Essential Eight",
    description: "ACSC Essential Eight mitigation strategies (Australia)",
  },
  nist_csf_2: {
    key: "nist_csf_2",
    name: "NIST CSF 2.0",
    description: "NIST Cybersecurity Framework v2.0",
  },
  gdpr: {
    key: "gdpr",
    name: "GDPR",
    description:
      "EU General Data Protection Regulation (Regulation 2016/679) — privacy and personal-data protection",
  },
  cps234: {
    key: "cps234",
    name: "APRA CPS 234",
    description:
      "APRA Prudential Standard CPS 234 Information Security — obligations on APRA-regulated entities (banks, insurers, super funds) for information security capability and notification (Australia)",
  },
  hipaa: {
    key: "hipaa",
    name: "HIPAA",
    description:
      "US Health Insurance Portability and Accountability Act (45 CFR Part 164) — Security, Breach Notification and Privacy Rule safeguards for protected health information (US)",
  },
  pci_dss_4: {
    key: "pci_dss_4",
    name: "PCI DSS 4.0",
    description:
      "Payment Card Industry Data Security Standard v4.0.1 — security requirements for entities that store, process or transmit cardholder data",
  },
} as const;

export type FrameworkTypeKey = keyof typeof FRAMEWORK_TYPES;

// ──────────────────────────────────────────────
// Maturity / Tier levels
// ──────────────────────────────────────────────
//
// Generic registry of tiered scales used by frameworks like Essential Eight
// (ml1/ml2/ml3) and NIST CSF Implementation Tiers (tier1–tier4). The web UI
// renders a maturity-level picker only for frameworks listed in
// `TIERED_FRAMEWORK_LEVELS`. Storage is a free-form `String?` on
// `FrameworkInstance.targetMaturityLevel` and `Requirement.maturityLevel`,
// so adding a new scale requires only an entry here.

export const MATURITY_LEVELS = {
  ml1: {
    key: "ml1",
    label: "ML1",
    description: "Maturity Level 1 — baseline mitigation against opportunistic attackers",
  },
  ml2: {
    key: "ml2",
    label: "ML2",
    description: "Maturity Level 2 — protection against attackers willing to invest more time",
  },
  ml3: {
    key: "ml3",
    label: "ML3",
    description: "Maturity Level 3 — protection against adaptive, well-resourced attackers",
  },
  tier1: {
    key: "tier1",
    label: "Tier 1 — Partial",
    description: "Risk-informed, ad hoc cybersecurity practices",
  },
  tier2: {
    key: "tier2",
    label: "Tier 2 — Risk Informed",
    description: "Risk management practices approved by management but not org-wide policy",
  },
  tier3: {
    key: "tier3",
    label: "Tier 3 — Repeatable",
    description: "Formal organization-wide risk management practices",
  },
  tier4: {
    key: "tier4",
    label: "Tier 4 — Adaptive",
    description:
      "Adaptive cybersecurity practices based on lessons learned and predictive indicators",
  },
} as const;

export type MaturityLevelKey = keyof typeof MATURITY_LEVELS;

/** Per-framework ordered list of allowed maturity/tier levels. */
export const TIERED_FRAMEWORK_LEVELS: Partial<Record<FrameworkTypeKey, MaturityLevelKey[]>> = {
  essential8: ["ml1", "ml2", "ml3"],
  nist_csf_2: ["tier1", "tier2", "tier3", "tier4"],
};

// ──────────────────────────────────────────────
// Cross-framework mapping relationships
// ──────────────────────────────────────────────

export const MAPPING_RELATIONSHIPS = {
  EQUIVALENT: "equivalent",
  PARTIAL: "partial",
  INFORMS: "informs",
} as const;

export type MappingRelationship =
  (typeof MAPPING_RELATIONSHIPS)[keyof typeof MAPPING_RELATIONSHIPS];

export const MAPPING_RELATIONSHIP_LABELS: Record<MappingRelationship, string> = {
  equivalent: "Equivalent",
  partial: "Partial overlap",
  informs: "Informative reference",
};

// ──────────────────────────────────────────────
// Status enums
// ──────────────────────────────────────────────

export const EVIDENCE_STATUS = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
} as const;

export type EvidenceStatus = (typeof EVIDENCE_STATUS)[keyof typeof EVIDENCE_STATUS];

export const CONTROL_STATUS = {
  NOT_IMPLEMENTED: "not_implemented",
  PARTIALLY_IMPLEMENTED: "partially_implemented",
  IMPLEMENTED: "implemented",
  NOT_APPLICABLE: "not_applicable",
} as const;

export type ControlStatus = (typeof CONTROL_STATUS)[keyof typeof CONTROL_STATUS];

export const POLICY_STATUS = {
  DRAFT: "draft",
  PENDING_APPROVAL: "pending_approval",
  APPROVED: "approved",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export type PolicyStatus = (typeof POLICY_STATUS)[keyof typeof POLICY_STATUS];

export const INCIDENT_SEVERITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFORMATIONAL: "informational",
} as const;

export type IncidentSeverity = (typeof INCIDENT_SEVERITY)[keyof typeof INCIDENT_SEVERITY];

export const JOB_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const INTEGRATION_STATUS = {
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERROR: "error",
  SYNCING: "syncing",
} as const;

export type IntegrationStatus = (typeof INTEGRATION_STATUS)[keyof typeof INTEGRATION_STATUS];

// ──────────────────────────────────────────────
// Risk matrix
// ──────────────────────────────────────────────

export const RISK_LIKELIHOOD = {
  VERY_LOW: { label: "very_low", value: 1 },
  LOW: { label: "low", value: 2 },
  MEDIUM: { label: "medium", value: 3 },
  HIGH: { label: "high", value: 4 },
  VERY_HIGH: { label: "very_high", value: 5 },
} as const;

export const RISK_IMPACT = {
  VERY_LOW: { label: "very_low", value: 1 },
  LOW: { label: "low", value: 2 },
  MEDIUM: { label: "medium", value: 3 },
  HIGH: { label: "high", value: 4 },
  VERY_HIGH: { label: "very_high", value: 5 },
} as const;

// ──────────────────────────────────────────────
// HTTP status codes
// ──────────────────────────────────────────────

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ──────────────────────────────────────────────
// API defaults
// ──────────────────────────────────────────────

export const API_VERSION_PREFIX = "/api/v1" as const;
export const DEFAULT_PAGE_SIZE = 20 as const;
export const MAX_PAGE_SIZE = 100 as const;
