// ──────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────

export const Role = {
  OWNER: "owner",
  ADMIN: "admin",
  COMPLIANCE_MANAGER: "compliance_manager",
  AUDITOR: "auditor",
  VIEWER: "viewer",
  INTEGRATION_ADMIN: "integration_admin",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const Permission = {
  FRAMEWORKS_READ: "frameworks:read",
  FRAMEWORKS_WRITE: "frameworks:write",
  POLICIES_READ: "policies:read",
  POLICIES_WRITE: "policies:write",
  EVIDENCE_READ: "evidence:read",
  EVIDENCE_WRITE: "evidence:write",
  EVIDENCE_APPROVE: "evidence:approve",
  RISKS_READ: "risks:read",
  RISKS_WRITE: "risks:write",
  CONTROLS_READ: "controls:read",
  CONTROLS_WRITE: "controls:write",
  VENDORS_READ: "vendors:read",
  VENDORS_WRITE: "vendors:write",
  AUDITS_READ: "audits:read",
  AUDITS_WRITE: "audits:write",
  INTEGRATIONS_READ: "integrations:read",
  INTEGRATIONS_MANAGE: "integrations:manage",
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",
  USERS_READ: "users:read",
  USERS_MANAGE: "users:manage",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

// ──────────────────────────────────────────────
// Core domain types
// ──────────────────────────────────────────────

export interface Tenant {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly plan: string;
  readonly status: string;
  readonly settings: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** @deprecated use `Tenant`. Kept as a transitional alias. */
export type Organization = Tenant;

export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly createdAt: string;
}

// ──────────────────────────────────────────────
// Compliance domain types
// ──────────────────────────────────────────────

export interface Framework {
  readonly id: string;
  readonly tenantId: string;
  readonly type: string;
  readonly name: string;
  readonly version: string;
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Requirement {
  readonly id: string;
  readonly tenantId: string;
  readonly frameworkId: string;
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Control {
  readonly id: string;
  readonly tenantId: string;
  readonly requirementId: string | null;
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly status: string;
  readonly ownerId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Policy {
  readonly id: string;
  readonly tenantId: string;
  readonly title: string;
  readonly content: string;
  readonly version: number;
  readonly status: string;
  readonly ownerId: string | null;
  readonly approvedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Risk {
  readonly id: string;
  readonly tenantId: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: string;
  readonly department: string | null;
  readonly status: string;
  readonly inherentLikelihood: number;
  readonly inherentImpact: number;
  readonly residualLikelihood: number | null;
  readonly residualImpact: number | null;
  readonly riskScore: number;
  readonly treatmentStrategy: string | null;
  readonly treatmentRationale: string | null;
  readonly ownerId: string | null;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type VendorRiskTier = "critical" | "high" | "medium" | "low";
export type VendorStatus = "active" | "under_review" | "approved" | "rejected" | "offboarded";

export interface VendorContact {
  readonly id: string;
  readonly vendorId: string;
  readonly name: string;
  readonly email: string | null;
  readonly role: string | null;
  readonly phone: string | null;
  readonly isPrimary: boolean;
}

export interface Vendor {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly description: string | null;
  readonly website: string | null;
  readonly category: string | null;
  readonly riskTier: VendorRiskTier;
  readonly status: VendorStatus;
  readonly dataProcessing: boolean;
  readonly contractStartDate: string | null;
  readonly contractEndDate: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly contacts?: readonly VendorContact[];
  readonly _count?: { assessments: number; contacts: number };
}

export interface Asset {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly type: string;
  readonly owner: string | null;
  readonly classification: string;
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Incident {
  readonly id: string;
  readonly tenantId: string;
  readonly title: string;
  readonly description: string;
  readonly severity: string;
  readonly status: string;
  readonly reportedBy: string;
  readonly resolvedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Task {
  readonly id: string;
  readonly tenantId: string;
  readonly title: string;
  readonly description: string;
  readonly assigneeId: string | null;
  readonly dueDate: string | null;
  readonly status: string;
  readonly priority: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ──────────────────────────────────────────────
// Evidence
// ──────────────────────────────────────────────

export interface EvidenceDocument {
  readonly id: string;
  readonly tenantId: string;
  readonly sourceType: string;
  readonly sourceId: string;
  readonly title: string;
  readonly description: string | null;
  readonly fileUrl: string | null;
  readonly collectedAt: string;
  readonly expiresAt: string | null;
  readonly status: string;
}

// ──────────────────────────────────────────────
// Integration
// ──────────────────────────────────────────────

export interface IntegrationConnection {
  readonly id: string;
  readonly tenantId: string;
  /** Catalog slug, e.g. "github" / "aws". Stable, human-readable. */
  readonly integrationId: string;
  readonly status: string;
  readonly lastSyncAt: string | null;
}

// ──────────────────────────────────────────────
// API helpers
// ──────────────────────────────────────────────

export interface PaginationMeta {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
}

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
  readonly meta?: PaginationMeta;
}

export interface PaginationParams {
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: string;
  readonly sortOrder?: "asc" | "desc";
}

// ──────────────────────────────────────────────
// Multi-tenancy context
// ──────────────────────────────────────────────

export interface TenantContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly role: Role;
  readonly permissions: readonly Permission[];
}
