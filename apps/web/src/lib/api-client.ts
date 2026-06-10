const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const TOKEN_KEY = "trustalo_token";

// ---------- Shared Types ----------
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ---------- Auth ----------
/**
 * Mirrors the API's `GET /auth/config` response. The web app uses this to
 * decide which login UI to render (credential form vs. redirect button).
 */
export interface AuthProviderDescriptor {
  providerId: string;
  displayName: string;
  kind: "credential" | "redirect";
  capabilities: {
    register?: boolean;
    resetPassword?: boolean;
    mfa?: boolean;
    socialLogin?: boolean;
  };
}

export type ControlStatus =
  | "not_implemented"
  | "partially_implemented"
  | "implemented"
  | "not_applicable";

export interface ControlOwner {
  id: string;
  name: string;
  email: string;
}

export type FrameworkType =
  | "iso27001"
  | "iso27017"
  | "iso27018"
  | "iso22301"
  | "iso42001"
  | "soc2"
  | "essential8"
  | "nist_csf_2"
  | "gdpr"
  | "cps234";

export interface FrameworkRef {
  id: string;
  name: string;
  frameworkType: FrameworkType;
}

export interface Requirement {
  id: string;
  identifier: string;
  title: string;
  category: string | null;
  /** Optional maturity/tier marker (e.g. "ml1"|"ml2"|"ml3" for Essential Eight). */
  maturityLevel?: string | null;
  framework?: FrameworkRef;
}

export interface ControlRequirementAssignment {
  id: string;
  requirementId: string;
  controlId: string;
  requirement: Requirement & { framework: FrameworkRef };
}

export interface FrameworkWithRequirements {
  id: string;
  name: string;
  frameworkType: FrameworkType;
  description: string | null;
  totalControls: number;
  requirements: Requirement[];
}

export type FrameworkInstanceStatus =
  | "not_started"
  | "in_progress"
  | "ready_for_audit"
  | "certified";

export interface FrameworkInstance {
  id: string;
  tenantId: string;
  frameworkId: string;
  status: FrameworkInstanceStatus;
  isEnabled: boolean;
  targetDate: string | null;
  /** ml1/ml2/ml3, tier1–tier4, etc. Null for non-tiered frameworks. */
  targetMaturityLevel: string | null;
  certifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  framework: FrameworkRef & { description: string | null };
}

export type CrossFrameworkRelationship = "equivalent" | "partial" | "informs";

export interface CrossFrameworkRequirement {
  id: string;
  identifier: string;
  title: string;
  framework: FrameworkRef;
  relationship: CrossFrameworkRelationship;
}

export interface RequirementMappingItem {
  id: string;
  relationship: CrossFrameworkRelationship;
  rationale: string | null;
  source: string;
  direction: "outgoing" | "incoming";
  requirement: {
    id: string;
    identifier: string;
    title: string;
    framework: FrameworkRef & { version?: string };
  };
}

export interface FrameworkInstanceStats {
  totalControls: number;
  controlsMet: number;
  controlsInProgress: number;
  controlsNotMet: number;
  totalRequirements: number;
  requirementsMapped: number;
  readinessPercentage: number;
}

export interface FrameworkInstanceWithStats extends FrameworkInstance {
  stats: FrameworkInstanceStats;
}

export interface CatalogFramework extends FrameworkWithRequirements {
  isAdopted: boolean;
  requirementCount: number;
}

export type EvidenceApprovalStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "expired"
  | "stale";

export type EvidenceType = "document" | "screenshot" | "link" | "automated" | "attestation";

export type RenewalFrequency = "once" | "monthly" | "quarterly" | "semi_annually" | "annually";

export interface EvidenceSubmitter {
  id: string;
  name: string;
  email: string;
}

export interface EvidenceItem {
  id: string;
  tenantId: string;
  controlId: string;
  title: string;
  description: string | null;
  type: EvidenceType;
  status: EvidenceApprovalStatus;
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  externalUrl: string | null;
  sourceType: string | null;
  sourceId: string | null;
  collectedAt: string;
  validFrom: string;
  expiresAt: string | null;
  renewalFrequency: RenewalFrequency | null;
  nextRenewalDate: string | null;
  reminderDaysBefore: number;
  lastReminderSentAt: string | null;
  submittedById: string | null;
  submittedBy: EvidenceSubmitter | null;
  reviewedById: string | null;
  reviewedBy: EvidenceSubmitter | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  control?: { id: string; title: string; status: ControlStatus; category: string | null };
}

export interface EvidenceListResponse {
  items: EvidenceItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateEvidenceInput {
  controlId: string;
  title: string;
  description?: string | null;
  type?: EvidenceType;
  status?: EvidenceApprovalStatus;
  externalUrl?: string | null;
  validFrom?: string;
  expiresAt?: string | null;
  renewalFrequency?: RenewalFrequency | null;
  reminderDaysBefore?: number;
  tags?: string[];
  fileName?: string | null;
  fileKey?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
}

export interface EvidenceHealthSummary {
  total: number;
  approved: number;
  expired: number;
  expiringSoon: number;
  pendingReview: number;
  draft: number;
  rejected: number;
}

export interface EvidenceSummary {
  id: string;
  status: EvidenceApprovalStatus;
  expiresAt: string | null;
}

export interface PolicyCommentUser {
  id: string;
  name: string;
  email: string;
}

export interface PolicyCommentReply {
  id: string;
  content: string;
  createdAt: string;
  user: PolicyCommentUser;
}

export interface PolicyCommentData {
  id: string;
  policyId: string;
  policyVersionId: string | null;
  userId: string;
  content: string;
  highlightedText: string | null;
  fromPos: number | null;
  toPos: number | null;
  resolved: boolean;
  resolvedAt: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  user: PolicyCommentUser;
  resolvedBy: PolicyCommentUser | null;
  replies: PolicyCommentReply[];
}

export interface Control {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  implementationDetails: string | null;
  status: ControlStatus;
  category: string | null;
  ownerId: string | null;
  owner: ControlOwner | null;
  reviewDate: string | null;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  controlRequirementAssignments: ControlRequirementAssignment[];
  evidence?: EvidenceSummary[];
  _count?: { evidence: number };
  /** Set on single control GET. Total cross-framework related requirements. */
  relatedRequirementsCount?: number;
  /** Set on single control GET. Top 3 related requirements (full list via mappings endpoint). */
  relatedRequirements?: CrossFrameworkRequirement[];
}

export interface ControlListResponse {
  items: Control[];
  total: number;
  page: number;
  limit: number;
}

// ── Per-control evidence-collection config (manual vs agent) ──
export type EvidenceCollectionMode = "manual" | "agent";
export type EvidenceAgentLastStatus = "idle" | "queued" | "running" | "succeeded" | "failed";

export interface EvidenceCollectionConfig {
  controlId: string;
  mode: EvidenceCollectionMode;
  agentInstructions: string | null;
  agentToolConnectionIds: string[];
  agentScheduleMinutes: number | null;
  agentLastRunAt: string | null;
  agentLastStatus: EvidenceAgentLastStatus;
  agentLastRunId: string | null;
  agentLastSummary: string | null;
}

export interface UpdateEvidenceConfigInput {
  mode: EvidenceCollectionMode;
  agentInstructions?: string | null;
  agentToolConnectionIds?: string[];
  agentScheduleMinutes?: number | null;
}

export interface EvidenceAgentRun {
  id: string;
  controlId: string;
  controlTitle?: string | null;
  status: "pending" | "running" | "succeeded" | "failed" | "cancelled";
  trigger: "manual" | "scheduled" | "api";
  evidenceCount: number;
  errorCount: number;
  errorMessage: string | null;
  summary: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceAgentRunDetail extends EvidenceAgentRun {
  transcript?: unknown;
  toolCallSummary?: Record<string, number> | null;
}

export interface EvidenceAgentToolConnection {
  id: string;
  name: string;
  status: string;
  isActive: boolean;
  provider: {
    slug: string;
    name: string;
    category?: string;
    capabilities?: string[];
  };
}

export interface CreateControlInput {
  title: string;
  description?: string | null;
  implementationDetails?: string | null;
  status?: ControlStatus;
  category?: string | null;
  ownerId?: string | null;
  reviewDate?: string | null;
}

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export type TenantPlan = "free" | "starter" | "professional" | "enterprise";
export type TenantStatus = "active" | "suspended" | "cancelled";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated use `Tenant`. Kept as a transitional alias for the web UI. */
export type Organization = Tenant;

export interface TenantSettings {
  id: string;
  tenantId: string;
  companySize: string | null;
  industry: string | null;
  country: string | null;
  timezone: string | null;
  logoUrl: string | null;
  defaults: SecurityDefaults | null;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityDefaults {
  mfaRequired?: boolean;
  sessionTimeoutMinutes?: number;
  passwordMinLength?: number;
  passwordRequireUppercase?: boolean;
  passwordRequireLowercase?: boolean;
  passwordRequireNumbers?: boolean;
  passwordRequireSymbols?: boolean;
}

/** @deprecated use `TenantSettings`. */
export type OrganizationSettings = TenantSettings;

export interface UpdateOrganizationSettingsInput {
  companySize?: string | null;
  industry?: string | null;
  country?: string | null;
  timezone?: string | null;
  logoUrl?: string | null;
  defaults?: SecurityDefaults | null;
}

export interface InviteMemberInput {
  email: string;
  role: string;
}

// ---------- People (HR / personnel directory) ----------

export type PersonRole =
  | "member"
  | "owner"
  | "admin"
  | "compliance_manager"
  | "auditor"
  | "viewer"
  | "integration_admin"
  | "dpo";
export type PersonStatus = "invited" | "active" | "suspended" | "offboarded";
export type PersonKind = "employee" | "contractor" | "vendor_contact" | "service_account" | "other";
export type PersonSource = "manual" | "invite" | "directory_sync" | "self_register";
export type PersonReadiness = "ready" | "at_risk" | "invited" | "suspended" | "offboarded";

export interface PersonRollup {
  deviceCount: number;
  devicesAtRisk: number;
  trainingAssigned: number;
  trainingCompleted: number;
  trainingPct: number;
  policiesTotal: number;
  policiesAcknowledged: number;
  policyPct: number;
  backgroundCheckStatus: string | null;
  readiness: PersonReadiness;
}

export interface PersonManagerRef {
  id: string;
  fullName: string;
  email: string;
}

export interface PersonListItem {
  id: string;
  tenantId: string;
  userId: string | null;
  email: string;
  fullName: string;
  role: PersonRole;
  permissions: string[];
  status: PersonStatus;
  kind: PersonKind;
  source: PersonSource;
  jobTitle: string | null;
  department: string | null;
  employmentType: string | null;
  managerId: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  invitedAt: string | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
  manager: PersonManagerRef | null;
  user: { id: string; email: string; name: string; lastLoginAt: string | null } | null;
  rollup: PersonRollup | null;
}

export interface PersonListResponse {
  items: PersonListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface PersonStats {
  total: number;
  byStatus: Record<string, number>;
  byKind: Record<string, number>;
  withLogin: number;
}

export type BackgroundCheckType =
  | "identity"
  | "criminal"
  | "employment"
  | "education"
  | "credit"
  | "reference"
  | "other";
export type BackgroundCheckStatus =
  | "not_started"
  | "in_progress"
  | "cleared"
  | "flagged"
  | "expired";

export interface BackgroundCheckItem {
  id: string;
  tenantId: string;
  personId: string;
  type: BackgroundCheckType;
  status: BackgroundCheckStatus;
  provider: string | null;
  reference: string | null;
  adverseFindings: boolean;
  notes: string | null;
  requestedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ChecklistKind = "onboarding" | "offboarding";
export type ChecklistItemStatus = "pending" | "done" | "na";

export interface ChecklistItem {
  id: string;
  tenantId: string;
  personId: string;
  kind: ChecklistKind;
  key: string;
  label: string;
  status: ChecklistItemStatus;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MyPolicyItem {
  id: string;
  title: string;
  category: string | null;
  currentVersionId: string | null;
  updatedAt: string;
  acknowledgedAt: string | null;
  acknowledgedCurrent: boolean;
}

export interface MyTrainingItem {
  id: string;
  status: "assigned" | "in_progress" | "completed" | "overdue";
  score: number | null;
  assignedAt: string;
  completedAt: string | null;
  trainingProgram: {
    id: string;
    title: string;
    type: string;
    dueDate: string | null;
    isRequired: boolean;
  };
}

export interface PersonDeviceSummary {
  id: string;
  hostname: string | null;
  platform: string;
  status: string;
  lastSeenAt: string | null;
  diskEncryption: string;
  firewall: string;
  screenLock: string;
  antivirus: string;
  agentHealthy: boolean;
}

export interface PersonAssignedAsset {
  id: string;
  name: string;
  type: string;
  classification: string;
  status: string;
}

export interface PersonDetail extends PersonListItem {
  devices: PersonDeviceSummary[];
  assignedAssets: PersonAssignedAsset[];
  backgroundChecks: BackgroundCheckItem[];
  checklist: ChecklistItem[];
  training: MyTrainingItem[];
  policies: MyPolicyItem[];
}

export interface CreatePersonInput {
  email: string;
  fullName: string;
  kind?: PersonKind;
  role?: PersonRole;
  jobTitle?: string | null;
  department?: string | null;
  employmentType?: string | null;
  managerId?: string | null;
  location?: string | null;
  startDate?: string | null;
}

export interface UpdatePersonInput {
  fullName?: string;
  kind?: PersonKind;
  jobTitle?: string | null;
  department?: string | null;
  employmentType?: string | null;
  managerId?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface InvitePersonInput {
  email: string;
  role?: PersonRole;
}

export interface CreateBackgroundCheckInput {
  type?: BackgroundCheckType;
  status?: BackgroundCheckStatus;
  provider?: string | null;
  reference?: string | null;
  adverseFindings?: boolean;
  notes?: string | null;
  requestedAt?: string | null;
  completedAt?: string | null;
  expiresAt?: string | null;
}

// ---------- Devices (endpoint posture, M5) ----------

export type DevicePlatform = "macos" | "windows" | "linux";
export type DeviceStatus = "pending" | "active" | "stale" | "revoked" | "retired";
export type PostureSignalState = "pass" | "fail" | "unknown";

export interface DevicePersonRef {
  id: string;
  fullName: string;
  email: string;
}

export interface DeviceListItem {
  id: string;
  hostname: string | null;
  platform: DevicePlatform;
  osVersion: string | null;
  agentVersion: string | null;
  status: DeviceStatus;
  lastSeenAt: string | null;
  lastPostureAt: string | null;
  enrolledAt: string;
  diskEncryption: PostureSignalState;
  firewall: PostureSignalState;
  screenLock: PostureSignalState;
  antivirus: PostureSignalState;
  agentHealthy: boolean;
  assetId: string;
  asset: { id: string; name: string } | null;
  personId: string | null;
  person: DevicePersonRef | null;
}

export interface DeviceListResponse {
  items: DeviceListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface DeviceDetail extends DeviceListItem {
  latestPosture: Record<string, unknown> | null;
  hardwareId: string | null;
  checkInIntervalSeconds: number;
}

export type DirectorySyncProvider = "entra" | "google_workspace";
export type DirectorySyncFrequencyMinutes = 1440 | 10080;
export type DirectorySyncDefaultStatus = "active" | "invited";

export interface DirectorySyncGroupRoleMapping {
  externalGroupId: string;
  externalGroupName?: string | null;
  role: "admin" | "compliance_manager" | "auditor" | "viewer" | "integration_admin" | "dpo";
}

export interface EntraDirectorySyncCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export interface GoogleWorkspaceDirectorySyncCredentials {
  serviceAccountJson: string;
  adminEmail: string;
}

export interface DirectorySyncConfig {
  id: string;
  provider: DirectorySyncProvider;
  isEnabled: boolean;
  syncFrequencyMinutes: DirectorySyncFrequencyMinutes;
  defaultRole: "admin" | "compliance_manager" | "auditor" | "viewer" | "integration_admin" | "dpo";
  defaultStatus: DirectorySyncDefaultStatus;
  groupRoleMappings: DirectorySyncGroupRoleMapping[];
  lastSyncAt: string | null;
  lastSyncStatus: "pending" | "running" | "succeeded" | "failed" | "cancelled" | null;
  lastSyncError: string | null;
  hasCredentials: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DirectorySyncRun {
  id: string;
  tenantId: string;
  configId: string;
  provider: DirectorySyncProvider;
  status: "pending" | "running" | "succeeded" | "failed" | "cancelled";
  triggeredBy: "schedule" | "manual";
  startedAt: string | null;
  finishedAt: string | null;
  usersDiscovered: number;
  usersCreated: number;
  usersUpdated: number;
  usersSuspended: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertDirectorySyncConfigInput {
  isEnabled: boolean;
  syncFrequencyMinutes: DirectorySyncFrequencyMinutes;
  defaultRole: "admin" | "compliance_manager" | "auditor" | "viewer" | "integration_admin" | "dpo";
  defaultStatus: DirectorySyncDefaultStatus;
  groupRoleMappings: DirectorySyncGroupRoleMapping[];
  credentials: EntraDirectorySyncCredentials | GoogleWorkspaceDirectorySyncCredentials;
}

// ---------- Policy Types ----------

export type PolicyStatus = "draft" | "pending_approval" | "approved" | "published" | "archived";

export interface PolicyOwner {
  id: string;
  name: string;
  email: string;
}

export interface PolicyListItem {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  status: PolicyStatus;
  category: string | null;
  ownerId: string;
  owner: PolicyOwner;
  currentVersionId: string | null;
  renewalDate: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    versions: number;
    acknowledgments: number;
    policyControls: number;
  };
}

export interface PolicyListResponse {
  items: PolicyListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface PolicyVersion {
  id: string;
  policyId: string;
  versionNumber: number;
  content: string;
  changeNotes: string | null;
  createdById: string;
  createdBy: PolicyOwner;
  approvedById: string | null;
  approvedBy: PolicyOwner | null;
  approvedAt: string | null;
  createdAt: string;
  _count?: { acknowledgments: number };
  acknowledgments?: PolicyAcknowledgment[];
}

export interface PolicyControlMapping {
  id: string;
  policyId: string;
  controlId: string;
  control: {
    id: string;
    title: string;
    status: ControlStatus;
    category: string | null;
    owner?: PolicyOwner | null;
  };
  createdAt: string;
}

export interface PolicyAcknowledgment {
  id: string;
  policyId: string;
  policyVersionId: string;
  userId: string;
  user: PolicyOwner;
  policyVersion: { id: string; versionNumber: number };
  acknowledgedAt: string;
  createdAt: string;
}

export interface PolicyDetail extends PolicyListItem {
  versions: PolicyVersion[];
  policyControls: PolicyControlMapping[];
}

export type PolicyFrameworkCode =
  | "iso27001"
  | "iso27017"
  | "iso27018"
  | "iso22301"
  | "iso42001"
  | "soc2"
  | "essential8"
  | "nist_csf_2"
  | "gdpr"
  | "cps234";

export interface PolicyTemplateListItem {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  category: string | null;
  frameworkTypes: PolicyFrameworkCode[];
  tags: string[];
  sortOrder: number;
  updatedAt: string;
}

export interface PolicyTemplateDetail extends PolicyTemplateListItem {
  contentHtml: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePolicyInput {
  title: string;
  ownerId: string;
  description?: string;
  category?: string;
  renewalDate?: string;
  /** System policy template — creates version 1 with template HTML */
  templateId?: string;
}

// ---------- AI Draft From Context (Phase 1) ----------

export interface PolicyDraftReplacement {
  placeholder: string;
  source: "context" | "template" | "policy" | "framework" | "default";
  value: string;
}

export interface PolicyDraftFromContext {
  draftHtml: string;
  replacements: PolicyDraftReplacement[];
  unfilled: string[];
  sourceLabel: "template" | "current_version" | "empty";
  templateSlug: string | null;
  baseVersionId: string | null;
  provider: string;
  model: string;
}

// ---------- Organization Context ----------

export type OrganizationContextCategory =
  | "company"
  | "tech_stack"
  | "processes"
  | "data_handling"
  | "risk_appetite"
  | "team";

export type OrganizationContextSource = "onboarding" | "inferred" | "manual";

export type OrganizationContextStatus = "active" | "superseded" | "archived";

export interface OrganizationContextEntry {
  id: string;
  tenantId: string;
  category: OrganizationContextCategory;
  question: string;
  answer: string;
  source: OrganizationContextSource;
  confidence: number;
  status: OrganizationContextStatus;
  supersedesId: string | null;
  provenance: Record<string, unknown> | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationContextUpsert {
  category: OrganizationContextCategory;
  question: string;
  answer: string;
  source?: OrganizationContextSource;
  confidence?: number;
}

// ── Phase 1 of "ongoing AI context": review-queue proposal types ──
export type OrganizationContextProposalStatus = "pending" | "accepted" | "rejected";
export type OrganizationContextProposalKind = "paste" | "chat" | "inferred";

export interface TenantContextProposal {
  id: string;
  tenantId: string;
  kind: OrganizationContextProposalKind;
  category: OrganizationContextCategory;
  question: string;
  answer: string;
  confidence: number;
  rationale: string | null;
  provenance: Record<string, unknown> | null;
  supersedesContextId: string | null;
  status: OrganizationContextProposalStatus;
  decidedAt: string | null;
  decidedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContextExtractionResult {
  proposals: TenantContextProposal[];
  dropped: number;
  redactions: {
    email: number;
    phone: number;
    ip: number;
    number: number;
    urlCredential: number;
  };
  modelUsed: string;
  providerSource: "operator" | "org" | "feature";
}

export interface AcceptProposalBody {
  category?: OrganizationContextCategory;
  question?: string;
  answer?: string;
  /** null detaches the supersedes link, omit to keep the proposal's value. */
  supersedesContextId?: string | null;
}

// ── Phase 2 of "ongoing AI context": chat assistant types ──
export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatCitationKind =
  | "context"
  | "policy"
  | "risk"
  | "vendor"
  | "control"
  | "framework"
  | "message";

export interface ChatCitation {
  kind: ChatCitationKind;
  id: string;
  label: string;
}

export interface ChatConversation {
  id: string;
  tenantId: string;
  title: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface ChatMessage {
  id: string;
  tenantId: string;
  conversationId: string;
  role: ChatMessageRole;
  content: string;
  modelUsed: string | null;
  providerSource: string | null;
  groundingHash: string | null;
  citations: ChatCitation[];
  proposalIds: string[];
  createdAt: string;
}

export interface ChatTurnResult {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  proposalIds: string[];
}

/** Streaming events emitted by `streamChatTurn`. */
export type ChatStreamEvent =
  | { type: "token"; delta: string }
  | {
      type: "complete";
      messageId: string;
      citations: ChatCitation[];
      modelUsed: string | null;
      providerSource: string | null;
      groundingHash: string | null;
    }
  | { type: "proposals"; messageId: string; proposalIds: string[] }
  | { type: "error"; error: string };

/**
 * Page context passed alongside chat turns so the assistant can answer
 * questions like "what should I do about this risk?" without the user
 * having to copy/paste an id. The drawer fills this in from the
 * current pathname; route patterns map to recordKind+recordId on the
 * client (see `derivePageContext` in `chat/page-context.ts`).
 */
export type ChatPageRecordKind = "risk" | "policy" | "vendor" | "control" | "framework";

export interface ChatPageContext {
  path: string;
  title?: string | null;
  recordKind?: ChatPageRecordKind | null;
  recordId?: string | null;
}

// ---------- Vendor Types ----------

export type VendorRiskTier = "critical" | "high" | "medium" | "low";
export type VendorStatus = "active" | "under_review" | "approved" | "rejected" | "offboarded";
export type DpaStatus =
  | "not_required"
  | "not_started"
  | "requested"
  | "received"
  | "approved"
  | "expired";

export interface VendorContact {
  id: string;
  vendorId: string;
  name: string;
  email: string | null;
  role: string | null;
  phone: string | null;
  isPrimary: boolean;
}

export interface VendorAssessmentItem {
  id: string;
  vendorId: string;
  tenantId: string;
  assessedById: string;
  score: number | null;
  findings: string | null;
  nextReviewDate: string | null;
  researchId: string | null;
  createdAt: string;
  assessedBy: { id: string; name: string; email: string };
}

export interface VendorListResponse {
  items: VendorItem[];
  total: number;
  page: number;
  limit: number;
}

export type ResearchFrequency = "weekly" | "biweekly" | "monthly" | "yearly" | "none";

export type ResearchStatus = "pending" | "in_progress" | "completed" | "failed";

export interface KnownVendorItem {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
  category: string | null;
  logoUrl: string | null;
  headquarters: string | null;
  employeeRange: string | null;
  foundedYear: number | null;
  certifications: string[];
  overallScore: number | null;
  lastResearchedAt: string | null;
}

export interface VendorResearchItem {
  id: string;
  vendorId: string | null;
  knownVendorId: string | null;
  tenantId: string | null;
  status: ResearchStatus;
  researchType: string;
  overallScore: number | null;
  securityScore: number | null;
  complianceScore: number | null;
  reputationScore: number | null;
  financialScore: number | null;
  findings: VendorResearchFinding[] | null;
  summary: string | null;
  recommendations: string | null;
  dataBreaches: VendorDataBreach[] | null;
  certifications: string[] | null;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface VendorResearchFinding {
  category: string;
  severity: string;
  title: string;
  description: string;
  source?: string;
}

export interface VendorDataBreach {
  date: string;
  description: string;
  impact: string;
  recordsAffected?: string;
}

export interface VendorItem {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  website: string | null;
  category: string | null;
  riskTier: VendorRiskTier;
  status: VendorStatus;
  dataProcessing: boolean;
  isSubprocessor: boolean;
  subprocessorPurpose: string | null;
  dataTypesShared: string[];
  dataLocations: string[];
  dpaStatus: DpaStatus;
  dpaExpiresAt: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  knownVendorId: string | null;
  researchFrequency: ResearchFrequency;
  lastResearchedAt: string | null;
  nextResearchAt: string | null;
  createdAt: string;
  updatedAt: string;
  contacts?: VendorContact[];
  knownVendor?: {
    id: string;
    name: string;
    logoUrl: string | null;
    overallScore: number | null;
  } | null;
  _count?: { assessments: number; contacts: number; researches: number };
}

export interface VendorDetail extends VendorItem {
  contacts?: VendorContact[];
  assessments?: VendorAssessmentItem[];
  researches?: VendorResearchItem[];
  documents?: VendorDocumentItem[];
  knownVendor?: KnownVendorItem | null;
}

export interface CreateVendorInput {
  name: string;
  description?: string;
  website?: string;
  category?: string;
  riskTier?: VendorRiskTier;
  dataProcessing?: boolean;
  isSubprocessor?: boolean;
  subprocessorPurpose?: string | null;
  dataTypesShared?: string[];
  dataLocations?: string[];
  dpaStatus?: DpaStatus;
  dpaExpiresAt?: string | null;
  knownVendorId?: string;
  researchFrequency?: ResearchFrequency;
}

export interface UpdateVendorInput extends Partial<CreateVendorInput> {
  status?: VendorStatus;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
}

export interface CreateVendorContactInput {
  name: string;
  email?: string;
  role?: string;
  phone?: string;
  isPrimary?: boolean;
}

export type VendorDocumentType =
  | "agreement"
  | "nda"
  | "sla"
  | "dpa"
  | "sow"
  | "msa"
  | "insurance_certificate"
  | "security_assessment"
  | "compliance_report"
  | "other";

export interface VendorDocumentItem {
  id: string;
  vendorId: string;
  tenantId: string;
  documentType: VendorDocumentType;
  title: string;
  description: string | null;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  expiresAt: string | null;
  uploadedById: string;
  uploadedBy: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface VendorStats {
  total: number;
  byStatus: Record<string, number>;
  byRiskTier: Record<string, number>;
  dataProcessingCount: number;
  contractsExpiringSoon: number;
}

// ---------- Risk Types ----------

export type RiskCategoryType =
  | "operational"
  | "technical"
  | "compliance"
  | "strategic"
  | "financial"
  | "reputational"
  | "security"
  | "privacy"
  | "third_party"
  | "environmental";

export type RiskStatusType = "not_started" | "in_progress" | "done" | "archived";

export type TreatmentStrategyType = "mitigate" | "accept" | "transfer" | "avoid" | "control";
export type TreatmentStatusType = "planned" | "in_progress" | "completed" | "overdue" | "cancelled";
export type ProbabilityLevelType = "rare" | "unlikely" | "possible" | "likely" | "almost_certain";
export type ImpactLevelType = "negligible" | "low" | "moderate" | "high" | "catastrophic";
export type ControlEffectivenessType = "no_control" | "need_improvement" | "adequate" | "effective";
export type ApprovalStatusType = "yes" | "no" | "na" | "pending";

export type RiskDepartmentType =
  | "engineering"
  | "product"
  | "operations"
  | "finance"
  | "legal"
  | "human_resources"
  | "sales"
  | "marketing"
  | "customer_support"
  | "it"
  | "security"
  | "compliance"
  | "executive"
  | "other";

export interface RiskOwner {
  id: string;
  name: string;
  email: string;
}

export interface RiskItem {
  id: string;
  tenantId: string;
  riskIdentifier: string | null;
  title: string;
  description: string | null;
  riskImpactDescription: string | null;
  category: RiskCategoryType;
  businessProcess: string | null;
  department: RiskDepartmentType | null;
  status: RiskStatusType;
  probability: ProbabilityLevelType | null;
  probabilityScore: number;
  impact: ImpactLevelType | null;
  impactScore: number;
  riskScore: number;
  residualLikelihood: ProbabilityLevelType | null;
  residualLikelihoodScore: number | null;
  residualImpact: ImpactLevelType | null;
  residualImpactScore: number | null;
  residualRiskScore: number | null;
  controlDescription: string | null;
  controlEffectiveness: ControlEffectivenessType | null;
  treatmentStrategy: TreatmentStrategyType | null;
  treatmentRationale: string | null;
  actionPlan: string | null;
  actionOwnerId: string | null;
  actionOwnerName: string | null;
  actionOwner: RiskOwner | null;
  estStartDate: string | null;
  estEndDate: string | null;
  budgetApproval: ApprovalStatusType | null;
  managementApproval: ApprovalStatusType | null;
  ownerId: string | null;
  owner: RiskOwner | null;
  riskProperty: string | null;
  remarks: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  _count?: { assessments: number; treatments: number };
}

export interface RiskAssessmentItem {
  id: string;
  riskId: string;
  tenantId: string;
  assessedById: string;
  inherentLikelihood: number;
  inherentImpact: number;
  residualLikelihood: number;
  residualImpact: number;
  notes: string | null;
  assessedAt: string;
  createdAt: string;
  assessedBy: RiskOwner;
}

export interface RiskTreatmentItem {
  id: string;
  riskId: string;
  tenantId: string;
  strategy: TreatmentStrategyType;
  title: string;
  description: string | null;
  responsibleId: string;
  responsible: RiskOwner;
  dueDate: string | null;
  completedAt: string | null;
  status: TreatmentStatusType;
  createdAt: string;
  updatedAt: string;
}

export interface RiskDetail extends RiskItem {
  assessments: RiskAssessmentItem[];
  treatments: RiskTreatmentItem[];
}

export type RiskMatrixChangeKind = "inherent" | "residual";

export interface RiskMatrixChangeItem {
  id: string;
  riskId: string;
  tenantId: string;
  kind: RiskMatrixChangeKind;
  source: string;
  changedById: string;
  prevLikelihood: number | null;
  prevImpact: number | null;
  prevScore: number | null;
  newLikelihood: number;
  newImpact: number;
  newScore: number;
  createdAt: string;
  changedBy: RiskOwner;
}

export interface RiskListResponse {
  items: RiskItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateRiskInput {
  title: string;
  description?: string;
  riskImpactDescription?: string;
  category?: RiskCategoryType;
  businessProcess?: string | null;
  department?: RiskDepartmentType | null;
  probability?: ProbabilityLevelType | null;
  probabilityScore?: number;
  impact?: ImpactLevelType | null;
  impactScore?: number;
  residualLikelihood?: ProbabilityLevelType | null;
  residualLikelihoodScore?: number | null;
  residualImpact?: ImpactLevelType | null;
  residualImpactScore?: number | null;
  controlDescription?: string | null;
  controlEffectiveness?: ControlEffectivenessType | null;
  treatmentStrategy?: TreatmentStrategyType | null;
  treatmentRationale?: string | null;
  actionPlan?: string | null;
  actionOwnerId?: string | null;
  actionOwnerName?: string | null;
  estStartDate?: string | null;
  estEndDate?: string | null;
  budgetApproval?: ApprovalStatusType | null;
  managementApproval?: ApprovalStatusType | null;
  ownerId?: string | null;
  riskProperty?: string | null;
  remarks?: string | null;
  tags?: string[];
}

export interface CreateRiskAssessmentInput {
  inherentLikelihood: number;
  inherentImpact: number;
  residualLikelihood: number;
  residualImpact: number;
  notes?: string;
}

export interface CreateRiskTreatmentInput {
  title: string;
  strategy: TreatmentStrategyType;
  description?: string;
  responsibleId: string;
  dueDate?: string;
}

export interface RiskFieldConfig {
  key: string;
  label: string;
  enabled: boolean;
  required: boolean;
  group: string;
  order: number;
}

export interface RiskSeverityBuckets {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface RiskStats {
  total: number;
  openCount: number;
  severity: RiskSeverityBuckets;
  residualSeverity: RiskSeverityBuckets;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byDepartment: Record<string, number>;
  byBusinessProcess: Record<string, number>;
  byControlEffectiveness: Record<string, number>;
  heatmapData: { likelihood: number; impact: number; count: number }[];
  residualHeatmapData: { likelihood: number; impact: number; count: number }[];
  monthlyTrend: { month: string; count: number }[];
}

// ---------- Asset Types ----------

export type AssetType =
  | "hardware"
  | "software"
  | "data"
  | "service"
  | "personnel"
  | "facility"
  | "cloud_resource";

export type AssetClassification = "public" | "internal" | "confidential" | "restricted";
export type AssetStatus = "active" | "decommissioned" | "under_review";
export type AssetKind = "physical" | "virtual";
export type AssetCriticality = "low" | "medium" | "high" | "critical";

export interface AssetOwnerRef {
  id: string;
  name: string;
  email: string;
}

export interface AssetMetadata {
  category?: string | null;
  serialNumber?: string | null;
  model?: string | null;
  vendor?: string | null;
  purchaseDate?: string | null;
  warrantyExpiresAt?: string | null;
  assignedTo?: string | null;
  hostname?: string | null;
  ipAddress?: string | null;
  cloudProvider?: string | null;
  accountId?: string | null;
  environment?: string | null;
  criticality?: AssetCriticality;
  tags?: string[];
}

export interface AssetItem {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  type: AssetType;
  classification: AssetClassification;
  ownerId: string | null;
  owner: AssetOwnerRef | null;
  deletedById: string | null;
  deletedBy: AssetOwnerRef | null;
  deletedAt: string | null;
  location: string | null;
  status: AssetStatus;
  metadata: AssetMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetListResponse {
  items: AssetItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AssetStats {
  total: number;
  deleted: number;
  physical: number;
  virtual: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byClassification: Record<string, number>;
}

// ---------- Incident Types ----------

export type IncidentSeverity = "critical" | "high" | "medium" | "low" | "informational";

export type IncidentStatus =
  | "reported"
  | "investigating"
  | "contained"
  | "resolved"
  | "closed"
  | "lessons_learned";

export interface IncidentItem {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedById: string;
  assignedToId: string | null;
  detectedAt: string | null;
  resolvedAt: string | null;
  rootCause: string | null;
  regulatoryNotificationRequired: boolean;
  regulatoryNotifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentListResponse {
  items: IncidentItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateIncidentInput {
  title: string;
  severity: IncidentSeverity;
  reportedById: string;
  description?: string;
  assignedToId?: string;
  detectedAt?: string;
}

export interface UpdateIncidentInput {
  title?: string;
  severity?: IncidentSeverity;
  reportedById?: string;
  description?: string;
  assignedToId?: string;
  detectedAt?: string;
  status?: IncidentStatus;
  resolvedAt?: string | null;
  rootCause?: string | null;
  regulatoryNotificationRequired?: boolean;
  regulatoryNotifiedAt?: string | null;
}

export interface IncidentStats {
  total: number;
  openCount: number;
  resolvedCount: number;
  resolutionRate: number;
  mttrHours: number | null;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  monthlyTrend: { month: string; count: number }[];
  topReporters: { id: string; name: string; count: number }[];
  regulatory: { required: number; notified: number };
}

export interface CreateAssetInput {
  name: string;
  type: AssetType;
  description?: string;
  classification?: AssetClassification;
  ownerId?: string | null;
  location?: string;
  metadata?: AssetMetadata;
}

export interface UpdateAssetInput extends Partial<CreateAssetInput> {
  status?: AssetStatus;
}

// ---------- Vulnerability Types ----------

export type VulnerabilitySeverity = "critical" | "high" | "medium" | "low" | "informational";

export type VulnerabilityStatus =
  | "open"
  | "confirmed"
  | "in_progress"
  | "remediated"
  | "accepted"
  | "false_positive";

export type VulnerabilitySource = "scan" | "pentest" | "bug_bounty" | "manual" | "vendor_advisory";

export interface VulnerabilityItem {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  severity: VulnerabilitySeverity;
  status: VulnerabilityStatus;
  source: VulnerabilitySource;
  cvssScore: number | null;
  cveId: string | null;
  cweId: string | null;
  affectedComponent: string | null;
  productionImpact: boolean;
  reportedById: string;
  assignedToId: string | null;
  detectedAt: string | null;
  remediatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VulnerabilityListResponse {
  items: VulnerabilityItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateVulnerabilityInput {
  title: string;
  severity: VulnerabilitySeverity;
  reportedById: string;
  description?: string;
  source?: VulnerabilitySource;
  cvssScore?: number;
  cveId?: string;
  cweId?: string;
  affectedComponent?: string;
  productionImpact?: boolean;
  assignedToId?: string;
  detectedAt?: string;
}

export interface UpdateVulnerabilityInput extends Partial<CreateVulnerabilityInput> {
  status?: VulnerabilityStatus;
  remediatedAt?: string | null;
}

export interface VulnerabilityStats {
  total: number;
  openCount: number;
  remediatedCount: number;
  remediationRate: number;
  mttrHours: number | null;
  productionImpactCount: number;
  productionImpactRate: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  cvssDistribution: { none: number; low: number; medium: number; high: number; critical: number };
  topCwes: { id: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
}

// ---------- BCP Types ----------

export type BCPStatus = "draft" | "approved" | "active" | "under_review" | "archived";
export type CriticalityLevel =
  | "mission_critical"
  | "business_critical"
  | "business_operational"
  | "administrative";
export type BCPExerciseType = "tabletop" | "walkthrough" | "simulation" | "full_scale";
export type BCPExerciseStatus =
  | "planned"
  | "scheduled"
  | "in_progress"
  | "conducted"
  | "reviewed"
  | "cancelled";
export type BCPExerciseOutcome = "not_met" | "partially_met" | "met" | "exceeded";

export interface BCPOwner {
  id: string;
  name: string;
  email: string;
}

export interface BCPPlanItem {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  version: string | null;
  status: BCPStatus;
  ownerId: string;
  owner: BCPOwner;
  approvedAt: string | null;
  lastReviewedAt: string | null;
  nextReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { impactAnalyses: number; exercises: number };
}

export interface BCPPlanListResponse {
  items: BCPPlanItem[];
  total: number;
  page: number;
  limit: number;
}

export type BIAStatus = "draft" | "under_review" | "approved" | "archived";

// Lightweight expansions returned by the cross-plan BIA endpoints. Only
// present when the BIA was loaded via `/api/v1/bcp/bia*`; the legacy nested
// list at `/api/v1/bcp/:id/bia` returns the bare row.
export interface BIAOwner {
  id: string;
  name: string;
  email: string;
}

export interface BIAParentPlan {
  id: string;
  title: string;
  status: BCPStatus;
}

export interface BusinessImpactAnalysis {
  id: string;
  tenantId: string;
  bcpId: string;
  processName: string;
  description: string | null;
  criticalityLevel: CriticalityLevel;
  rtoHours: number;
  rpoHours: number;
  maxTolerableDowntimeHours: number;
  // MTPD (Maximum Tolerable Period of Disruption) — regulatory ceiling. RTO
  // greater than MTPD signals a recovery gap.
  mtpdHours: number | null;
  // Server returns Decimal as string; coerce to Number when arithmetic is
  // needed. Kept as `number | string | null` so existing callers that read
  // it as a number keep compiling.
  financialImpactPerHour: number | string | null;
  dependencies: string | null;
  operationalImpact: string | null;
  regulatoryImpact: string | null;
  reputationalImpact: string | null;
  status: BIAStatus;
  ownerId: string | null;
  approvedAt: string | null;
  lastReviewedAt: string | null;
  nextReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Present on cross-plan endpoints only.
  owner?: BIAOwner | null;
  bcp?: BIAParentPlan;
}

export interface BIAListResponse {
  items: BusinessImpactAnalysis[];
  total: number;
  page: number;
  limit: number;
}

export interface BIAStats {
  total: number;
  byCriticality: Record<string, number>;
  byStatus: Record<string, number>;
  overdueReviews: number;
  upcomingReviews: number;
  recoveryGaps: number;
}

// Mirrors `BIAOwner`/`BIAParentPlan` for the cross-plan exercise register.
export interface BCPExerciseFacilitator {
  id: string;
  name: string;
  email: string;
}

export interface BCPExerciseItem {
  id: string;
  tenantId: string;
  bcpId: string;
  title: string;
  type: BCPExerciseType;
  scheduledDate: string | null;
  conductedDate: string | null;
  status: BCPExerciseStatus;
  scenario: string | null;
  objectives: string | null;
  scope: string | null;
  facilitatorId: string | null;
  participants: string | null;
  outcomeRating: BCPExerciseOutcome | null;
  actualRtoHours: number | null;
  actualRpoHours: number | null;
  findings: string | null;
  lessonsLearned: string | null;
  actionItems: string | null;
  nextExerciseDate: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Present on cross-plan endpoints only.
  facilitator?: BCPExerciseFacilitator | null;
  bcp?: BIAParentPlan;
}

export interface BCPExerciseListResponse {
  items: BCPExerciseItem[];
  total: number;
  page: number;
  limit: number;
}

export interface BCPExerciseStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byOutcome: Record<string, number>;
  conductedThisYear: number;
  upcoming: number;
  overdue: number;
  reviewedCount: number;
}

export interface BCPPlanDetail extends Omit<BCPPlanItem, "_count"> {
  impactAnalyses: BusinessImpactAnalysis[];
  exercises: BCPExerciseItem[];
}

export interface CreateBCPPlanInput {
  title: string;
  description?: string | null;
  version?: string | null;
  status?: BCPStatus;
  ownerId: string;
  approvedAt?: string | null;
  lastReviewedAt?: string | null;
  nextReviewDate?: string | null;
}

export interface CreateBIAInput {
  processName: string;
  description?: string | null;
  criticalityLevel: CriticalityLevel;
  rtoHours: number;
  rpoHours: number;
  maxTolerableDowntimeHours: number;
  mtpdHours?: number | null;
  financialImpactPerHour?: number | null;
  dependencies?: string | null;
  operationalImpact?: string | null;
  regulatoryImpact?: string | null;
  reputationalImpact?: string | null;
  status?: BIAStatus;
  ownerId?: string | null;
  lastReviewedAt?: string | null;
  nextReviewDate?: string | null;
}

// Top-level create — the parent plan id is supplied in the body rather than
// derived from the URL, so the cross-plan register can author BIAs without
// first navigating into a plan.
export interface CreateBIATopLevelInput extends CreateBIAInput {
  bcpId: string;
}

export interface CreateBCPExerciseInput {
  title: string;
  type: BCPExerciseType;
  scheduledDate?: string | null;
  conductedDate?: string | null;
  status?: BCPExerciseStatus;
  scenario?: string | null;
  objectives?: string | null;
  scope?: string | null;
  facilitatorId?: string | null;
  participants?: string | null;
  outcomeRating?: BCPExerciseOutcome | null;
  actualRtoHours?: number | null;
  actualRpoHours?: number | null;
  findings?: string | null;
  lessonsLearned?: string | null;
  actionItems?: string | null;
  nextExerciseDate?: string | null;
  reviewedAt?: string | null;
}

export interface CreateBCPExerciseTopLevelInput extends CreateBCPExerciseInput {
  bcpId: string;
}

export interface MarkConductedInput {
  conductedDate?: string | null;
  outcomeRating?: BCPExerciseOutcome | null;
  actualRtoHours?: number | null;
  actualRpoHours?: number | null;
  findings?: string | null;
}

export interface MarkReviewedInput {
  lessonsLearned?: string | null;
  actionItems?: string | null;
  nextExerciseDate?: string | null;
}

export interface BCPStats {
  totalPlans: number;
  byStatus: Record<string, number>;
  overdueReviews: number;
  upcomingReviews: number;
  totalBIA: number;
  totalExercises: number;
}

// ---------- Task Types ----------

export type TaskType = "manual" | "automated" | "recurring";
export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue" | "cancelled";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskFrequency = "once" | "daily" | "weekly" | "monthly" | "quarterly" | "annually";
export type TaskSourceModule =
  | "training"
  | "control"
  | "risk"
  | "evidence"
  | "vendor"
  | "asset"
  | "audit"
  | "policy"
  | "bcp"
  | "incident";

export interface TaskAssignee {
  id: string;
  name: string;
  email: string;
}

export interface TaskItem {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  controlId: string | null;
  sourceModule: TaskSourceModule | null;
  sourceId: string | null;
  dueDate: string | null;
  completedAt: string | null;
  frequency: TaskFrequency | null;
  nextDueDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: TaskAssignee | null;
  isOverdue: boolean;
}

export interface TaskListResponse {
  items: TaskItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  type?: TaskType;
  priority?: TaskPriority;
  assigneeId?: string | null;
  controlId?: string | null;
  sourceModule?: TaskSourceModule | null;
  sourceId?: string | null;
  dueDate?: string | null;
  frequency?: TaskFrequency | null;
}

export interface TaskStats {
  total: number;
  myPending: number;
  overdueCount: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byModule: Record<string, number>;
}

// ---------- License Types ----------

export interface LicenseStatus {
  /**
   * True when the deployment has a valid Enterprise (or developer-tier)
   * Trustalo license loaded. Drives client-side pre-gating of EE-only
   * affordances (AI buttons, etc.).
   */
  enterprise: boolean;
  tier: "enterprise" | "developer" | null;
  features: string[];
}

// ---------- AI Config Types ----------

export type AIProviderType = "openai" | "anthropic" | "bedrock" | "openrouter";
export type AIFeatureType =
  | "quiz_generation"
  | "risk_analysis"
  | "policy_drafting"
  | "vendor_assessment"
  | "incident_summary"
  | "control_suggestion"
  // Phase 1+ (AI accelerators): new AI feature surfaces.
  | "policy_generation"
  | "automated_check_generation"
  | "risk_scoring"
  | "vendor_scoring"
  | "questionnaire_answering"
  | "trust_center_summary";

export interface AIProviderConfigItem {
  id: string;
  tenantId: string;
  provider: AIProviderType;
  apiKey: string | null;
  region: string | null;
  accessKeyId: string | null;
  secretAccessKey: string | null;
  baseUrl: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIFeatureConfigItem {
  id: string;
  tenantId: string;
  feature: AIFeatureType;
  provider: AIProviderType;
  model: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIProviderTestResult {
  status: string;
  model: string;
  response: string;
}

export interface GeneratedQuizData {
  title: string;
  description: string;
  questions: {
    text: string;
    type: "multiple_choice" | "true_false";
    points: number;
    options: { text: string; isCorrect: boolean }[];
  }[];
}

export const AI_PROVIDER_LABELS: Record<AIProviderType, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  bedrock: "AWS Bedrock",
  openrouter: "OpenRouter",
};

export const AI_PROVIDER_MODELS: Record<AIProviderType, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4.1", label: "GPT-4.1" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { value: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
    { value: "o3-mini", label: "o3 Mini" },
  ],
  anthropic: [
    { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  ],
  bedrock: [
    { value: "anthropic.claude-sonnet-4-20250514-v1:0", label: "Claude Sonnet 4 (Bedrock)" },
    { value: "anthropic.claude-3-5-sonnet-20241022-v2:0", label: "Claude 3.5 Sonnet v2 (Bedrock)" },
    { value: "amazon.nova-pro-v1:0", label: "Amazon Nova Pro" },
    { value: "amazon.nova-lite-v1:0", label: "Amazon Nova Lite" },
  ],
  openrouter: [
    { value: "anthropic/claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { value: "openai/gpt-4o", label: "GPT-4o" },
    { value: "google/gemini-2.5-pro-preview", label: "Gemini 2.5 Pro" },
    { value: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick" },
  ],
};

export const AI_FEATURE_LABELS: Record<AIFeatureType, string> = {
  quiz_generation: "Quiz Generation",
  risk_analysis: "Risk Analysis",
  policy_drafting: "Policy Drafting",
  vendor_assessment: "Vendor Assessment",
  incident_summary: "Incident Summary",
  control_suggestion: "Control Suggestions",
  policy_generation: "Policy Generation (from context)",
  automated_check_generation: "Automated Check Generation",
  risk_scoring: "AI Risk Scoring",
  vendor_scoring: "AI Vendor Scoring",
  questionnaire_answering: "Questionnaire Answering",
  trust_center_summary: "Trust Center Summaries",
};

// ---------- Quiz Types ----------

export type QuizQuestionType = "multiple_choice" | "true_false" | "multi_select";

export interface QuizOptionItem {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface QuizQuestionItem {
  id: string;
  quizId: string;
  text: string;
  type: QuizQuestionType;
  sortOrder: number;
  points: number;
  options: QuizOptionItem[];
}

export interface TrainingQuizListItem {
  id: string;
  trainingProgramId: string;
  tenantId: string;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { questions: number; attempts: number };
}

export interface TrainingQuizDetail extends Omit<TrainingQuizListItem, "_count"> {
  questions: QuizQuestionItem[];
  _count: { attempts: number };
}

export interface QuizAttemptAnswer {
  id: string;
  questionId: string;
  optionId: string | null;
  isCorrect: boolean;
  question: { id: string; text: string; points: number };
  option: { id: string; text: string } | null;
}

export interface QuizAttemptItem {
  id: string;
  quizId: string;
  userId: string;
  tenantId: string;
  score: number | null;
  totalPoints: number | null;
  percentage: number | null;
  passed: boolean | null;
  startedAt: string;
  completedAt: string | null;
  user?: { id: string; name: string; email: string };
  answers?: QuizAttemptAnswer[];
}

export interface CreateQuizInput {
  title: string;
  description?: string | null;
  passingScore?: number;
  timeLimitMinutes?: number | null;
  shuffleQuestions?: boolean;
  questions: {
    text: string;
    type?: QuizQuestionType;
    sortOrder?: number;
    points?: number;
    options: { text: string; isCorrect: boolean; sortOrder?: number }[];
  }[];
}

export interface SubmitQuizInput {
  answers: { questionId: string; optionId: string }[];
}

// ---------- Training Types ----------

export type TrainingType = "security_awareness" | "compliance" | "phishing_simulation" | "custom";

export type TrainingFrequency = "once" | "monthly" | "quarterly" | "annually";

export type TrainingCompletionStatus = "assigned" | "in_progress" | "completed" | "overdue";

export interface TrainingCompletionUser {
  id: string;
  name: string;
  email: string;
}

export interface TrainingCompletion {
  id: string;
  trainingProgramId: string;
  userId: string;
  tenantId: string;
  status: TrainingCompletionStatus;
  score: number | null;
  completedAt: string | null;
  assignedAt: string;
  createdAt: string;
  user: TrainingCompletionUser;
}

export interface TrainingProgram {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  type: TrainingType;
  frequency: TrainingFrequency;
  isRequired: boolean;
  content: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  totalAssigned: number;
  completedCount: number;
  completionRate: number;
  isOverdue: boolean;
}

export interface TrainingProgramDetail extends Omit<
  TrainingProgram,
  "totalAssigned" | "completedCount" | "completionRate" | "isOverdue"
> {
  completions: TrainingCompletion[];
}

export interface TrainingListResponse {
  items: TrainingProgram[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTrainingInput {
  title: string;
  type: TrainingType;
  description?: string | null;
  frequency?: TrainingFrequency;
  isRequired?: boolean;
  content?: string | null;
  dueDate?: string | null;
}

export interface TrainingStats {
  totalPrograms: number;
  overallCompletionRate: number;
  overduePrograms: number;
  totalAssigned: number;
  completedCount: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byFrequency: Record<string, number>;
  monthlyCompletions: { month: string; count: number }[];
  avgScore: number | null;
  quizResults: {
    totalAttempts: number;
    passed: number;
    failed: number;
    avgScore: number | null;
  };
}

// ---------- Dashboard Types ----------

export interface DashboardFrameworkReadiness {
  instanceId: string;
  frameworkId: string;
  name: string;
  frameworkType: FrameworkType;
  status: FrameworkInstanceStatus;
  readinessPercentage: number;
  controlsMet: number;
  totalControls: number;
  totalRequirements: number;
}

export interface DashboardOverview {
  counts: {
    controls: number;
    policies: number;
    risks: number;
    vendors: number;
    assets: number;
    incidents: number;
    audits: number;
    highSeverityRisks: number;
  };
  evidence: {
    total: number;
    approved: number;
    expired: number;
    automatedPercentage: number;
  };
  frameworks: {
    total: number;
    certified: number;
    readiness: DashboardFrameworkReadiness[];
    overallControlsMet: number;
    overallControlsTotal: number;
  };
  enabledFrameworkTypes: FrameworkType[];
}

// ---------- AI usage dashboard ----------
export interface AIUsageFeatureRow {
  feature: string;
  label: string;
  generations: number;
  approvals: number;
  rejections: number;
  edits: number;
  promptTokens: number;
  completionTokens: number;
  rawCostMicrocents: string;
  billedMicrocents: string;
  acceptanceRate: number | null;
}

export interface AIUsageDailyPoint {
  date: string;
  generations: number;
  decisions: number;
}

export interface AIUsageRecentEntry {
  at: string;
  feature: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  decision: string | null;
  provider: string | null;
  model: string | null;
}

export interface AIUsageDashboard {
  window: { from: string; to: string; days: number };
  usageSource: "spend+audit" | "audit_only";
  currentMonthCredits: {
    from: string;
    to: string;
    available: boolean;
    billedMicrocents: string | null;
    calls: number | null;
  };
  totals: {
    generations: number;
    approvals: number;
    rejections: number;
    edits: number;
    promptTokens: number;
    completionTokens: number;
    rawCostMicrocents: string;
    billedMicrocents: string;
  };
  features: AIUsageFeatureRow[];
  daily: AIUsageDailyPoint[];
  recent: AIUsageRecentEntry[];
}

// ---------- Audit Types ----------
export type AuditType = "internal" | "external" | "certification";
export type AuditStatus = "planned" | "in_progress" | "completed" | "cancelled";
export type AuditFindingSeverity = "critical" | "major" | "minor" | "observation" | "opportunity";
export type AuditFindingStatus = "open" | "in_progress" | "remediated" | "verified" | "closed";

export interface AuditItem {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  type: AuditType;
  frameworkInstanceId: string | null;
  status: AuditStatus;
  auditorName: string | null;
  auditorOrganization: string | null;
  scheduledStartDate: string | null;
  scheduledEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { findings: number };
}

export interface AuditDetail extends AuditItem {
  findings: AuditFindingItem[];
  documents?: AuditDocument[];
}

export interface AuditFindingItem {
  id: string;
  auditId: string;
  tenantId: string;
  title: string;
  description: string | null;
  severity: AuditFindingSeverity;
  status: AuditFindingStatus;
  controlId: string | null;
  assignedToId: string | null;
  dueDate: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: { id: string; name: string; email: string } | null;
  control?: { id: string; title: string } | null;
}

export interface AuditDocument {
  id: string;
  auditId: string;
  tenantId: string;
  fileName: string | null;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedById: string;
  uploadedBy?: { id: string; name: string; email: string } | null;
  createdAt: string;
}

export interface AuditListResponse {
  items: AuditItem[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateAuditInput {
  title: string;
  type: AuditType;
  description?: string | null;
  frameworkInstanceId?: string | null;
  status?: AuditStatus;
  auditorName?: string | null;
  auditorOrganization?: string | null;
  scheduledStartDate?: string | null;
  scheduledEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
}

export type UpdateAuditInput = Partial<CreateAuditInput>;

export interface CreateAuditFindingInput {
  title: string;
  severity: AuditFindingSeverity;
  description?: string | null;
  status?: AuditFindingStatus;
  controlId?: string | null;
  assignedToId?: string | null;
  dueDate?: string | null;
}

export type UpdateAuditFindingInput = Partial<CreateAuditFindingInput>;

// ---------- AI Governance Types ----------
export type AISystemType =
  | "machine_learning"
  | "deep_learning"
  | "nlp"
  | "computer_vision"
  | "generative_ai"
  | "other";

export type AILifecycleStage =
  | "design"
  | "development"
  | "testing"
  | "deployment"
  | "monitoring"
  | "decommissioned";

export type AIRiskLevel = "minimal" | "limited" | "high" | "unacceptable";

export interface AISystemOwner {
  id: string;
  name: string;
  email: string;
}

export interface AISystem {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  purpose: string | null;
  type: AISystemType;
  lifecycleStage: AILifecycleStage;
  riskLevel: AIRiskLevel;
  dataTypes: string[];
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  owner: AISystemOwner | null;
  _count?: { riskAssessments: number; impactAssessments: number };
}

export interface AISystemListResponse {
  items: AISystem[];
  total: number;
  page: number;
  limit: number;
}

export interface AIGovernanceStats {
  total: number;
  byRiskLevel: Record<string, number>;
  byLifecycleStage: Record<string, number>;
}

export interface CreateAISystemInput {
  name: string;
  type: AISystemType;
  description?: string | null;
  purpose?: string | null;
  lifecycleStage?: AILifecycleStage;
  riskLevel?: AIRiskLevel;
  dataTypes?: string[];
  ownerId?: string | null;
}

export type UpdateAISystemInput = Partial<CreateAISystemInput>;

// ---------- AI Risk Assessments ----------
export type RiskRating = "low" | "medium" | "high";
export type AIRiskAssessmentStatus = "draft" | "in_progress" | "completed" | "approved";

export interface AISystemSummary {
  id: string;
  name: string;
  type: AISystemType;
  riskLevel: AIRiskLevel;
  lifecycleStage: AILifecycleStage;
}

export interface AIRiskAssessment {
  id: string;
  tenantId: string;
  aiSystemId: string;
  assessedById: string;
  title: string | null;
  methodology: string | null;
  biasRisk: RiskRating;
  privacyRisk: RiskRating;
  safetyRisk: RiskRating;
  securityRisk: RiskRating;
  misuseRisk: RiskRating;
  overallRisk: RiskRating | null;
  residualRisk: RiskRating | null;
  mitigationPlan: string | null;
  status: AIRiskAssessmentStatus;
  approvedById: string | null;
  approvedAt: string | null;
  assessedAt: string;
  nextReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
  aiSystem: AISystemSummary;
  assessedBy: AISystemOwner;
  approvedBy: AISystemOwner | null;
}

export interface AIRiskAssessmentListResponse {
  items: AIRiskAssessment[];
  total: number;
  page: number;
  limit: number;
}

export interface AIRiskAssessmentStats {
  total: number;
  byStatus: Record<string, number>;
  byOverallRisk: Record<string, number>;
  overdueReviews: number;
  upcomingReviews: number;
  highRiskCount: number;
}

export interface CreateAIRiskAssessmentInput {
  aiSystemId: string;
  title?: string | null;
  methodology?: string | null;
  biasRisk: RiskRating;
  privacyRisk: RiskRating;
  safetyRisk: RiskRating;
  securityRisk: RiskRating;
  misuseRisk: RiskRating;
  overallRisk?: RiskRating | null;
  residualRisk?: RiskRating | null;
  mitigationPlan?: string | null;
  status?: AIRiskAssessmentStatus;
  nextReviewDate?: string | null;
}

export type UpdateAIRiskAssessmentInput = Partial<Omit<CreateAIRiskAssessmentInput, "aiSystemId">>;

// ---------- AI Impact Assessments ----------
export type AIImpactStatus = "pending" | "in_review" | "approved" | "rejected";

export interface AIImpactAssessment {
  id: string;
  tenantId: string;
  aiSystemId: string;
  assessedById: string;
  societalImpact: string | null;
  ethicalConsiderations: string | null;
  environmentalImpact: string | null;
  humanOversightMeasures: string | null;
  transparencyMeasures: string | null;
  status: AIImpactStatus;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  aiSystem: AISystemSummary;
  assessedBy: AISystemOwner;
  approvedBy: AISystemOwner | null;
}

export interface AIImpactAssessmentListResponse {
  items: AIImpactAssessment[];
  total: number;
  page: number;
  limit: number;
}

export interface AIImpactAssessmentStats {
  total: number;
  byStatus: Record<string, number>;
  approvedCount: number;
  pendingCount: number;
  approvedRate: number;
}

export interface CreateAIImpactAssessmentInput {
  aiSystemId: string;
  societalImpact?: string | null;
  ethicalConsiderations?: string | null;
  environmentalImpact?: string | null;
  humanOversightMeasures?: string | null;
  transparencyMeasures?: string | null;
  status?: AIImpactStatus;
}

export type UpdateAIImpactAssessmentInput = Partial<
  Omit<CreateAIImpactAssessmentInput, "aiSystemId">
>;

// ---------- AI Incidents ----------
export type AIIncidentSeverity = "low" | "medium" | "high" | "critical";
export type AIIncidentCategory =
  | "bias"
  | "drift"
  | "hallucination"
  | "accuracy"
  | "privacy"
  | "security"
  | "safety"
  | "misuse"
  | "availability"
  | "other";
export type AIIncidentStatus = "open" | "investigating" | "mitigated" | "resolved" | "closed";

export interface AIIncident {
  id: string;
  tenantId: string;
  aiSystemId: string;
  title: string;
  description: string | null;
  category: AIIncidentCategory;
  severity: AIIncidentSeverity;
  status: AIIncidentStatus;
  detectedAt: string;
  reportedAt: string;
  resolvedAt: string | null;
  rootCause: string | null;
  remediation: string | null;
  externalNotificationRequired: boolean;
  externalNotificationSentAt: string | null;
  reportedById: string | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  aiSystem: AISystemSummary;
  reportedBy: AISystemOwner | null;
  assignee: AISystemOwner | null;
}

export interface AIIncidentListResponse {
  items: AIIncident[];
  total: number;
  page: number;
  limit: number;
}

export interface AIIncidentStats {
  total: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  openCount: number;
  criticalOpenCount: number;
  resolvedThisMonth: number;
  meanResolutionHours: number;
}

export interface CreateAIIncidentInput {
  aiSystemId: string;
  title: string;
  description?: string | null;
  category: AIIncidentCategory;
  severity: AIIncidentSeverity;
  status?: AIIncidentStatus;
  detectedAt?: string;
  rootCause?: string | null;
  remediation?: string | null;
  externalNotificationRequired?: boolean;
  externalNotificationSentAt?: string | null;
  assigneeId?: string | null;
}

export type UpdateAIIncidentInput = Partial<Omit<CreateAIIncidentInput, "aiSystemId">>;

export interface AIIncidentTransitionInput {
  rootCause?: string | null;
  remediation?: string | null;
}

// ---------- Privacy / GDPR Types ----------

export type LawfulBasis =
  | "consent"
  | "contract"
  | "legal_obligation"
  | "vital_interests"
  | "public_task"
  | "legitimate_interests";

export type DataCategory =
  | "identity"
  | "contact"
  | "financial"
  | "health"
  | "location"
  | "online_identifier"
  | "demographic"
  | "employment"
  | "usage"
  | "special_category"
  | "criminal"
  | "other";

export type SubjectCategory =
  | "customer"
  | "employee"
  | "prospect"
  | "supplier_contact"
  | "minor"
  | "website_visitor"
  | "patient"
  | "other";

export type TransferMechanism =
  | "none_eu_eea"
  | "adequacy_decision"
  | "scc"
  | "bcr"
  | "derogation_art_49";

export type ProcessingRole = "controller" | "processor" | "joint_controller";

export type ProcessingActivityStatus = "draft" | "active" | "under_review" | "retired";

export type DPIAStatus = "draft" | "in_review" | "approved" | "rejected";
export type DPIANecessity = "required" | "recommended" | "not_required";

export type DataBreachSeverity = "low" | "medium" | "high" | "critical";
export type DataBreachCategory = "confidentiality" | "integrity" | "availability" | "combined";
export type DataBreachStatus = "open" | "investigating" | "contained" | "notified" | "closed";

export type DSARType =
  | "access"
  | "rectification"
  | "erasure"
  | "restriction"
  | "portability"
  | "objection"
  | "automated_decision"
  | "withdraw_consent";

export type DSARStatus =
  | "received"
  | "identity_pending"
  | "in_progress"
  | "extended"
  | "fulfilled"
  | "refused"
  | "closed";

export type DSARChannel = "email" | "web_form" | "post" | "phone" | "in_person";

export interface ProcessingActivitySummary {
  id: string;
  name: string;
  role: ProcessingRole;
  lawfulBasis: LawfulBasis;
  status: ProcessingActivityStatus;
}

export interface ProcessingActivity {
  id: string;
  tenantId: string;
  name: string;
  purpose: string;
  role: ProcessingRole;
  lawfulBasis: LawfulBasis;
  lawfulBasisJustification: string | null;
  dataCategories: DataCategory[];
  subjectCategories: SubjectCategory[];
  dataElements: string[];
  recipients: string[];
  crossBorderTransfer: boolean;
  transferMechanism: TransferMechanism | null;
  transferDestinations: string[];
  retentionPeriod: string | null;
  securityMeasures: string | null;
  ownerId: string | null;
  status: ProcessingActivityStatus;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; name: string; email: string } | null;
  vendors?: { id: string; name: string; riskTier: VendorRiskTier }[];
  _count?: { dpias: number; breaches: number; risks: number };
  // detail-only fields
  dpias?: {
    id: string;
    title: string;
    status: DPIAStatus;
    necessity: DPIANecessity;
    residualRisk: "low" | "medium" | "high" | null;
    createdAt: string;
  }[];
  breaches?: {
    id: string;
    title: string;
    status: DataBreachStatus;
    severity: DataBreachSeverity;
    discoveredAt: string;
  }[];
  risks?: { id: string; title: string; status: string; riskScore: number }[];
}

export interface ProcessingActivityListResponse {
  items: ProcessingActivity[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateProcessingActivityInput {
  name: string;
  purpose: string;
  role?: ProcessingRole;
  lawfulBasis: LawfulBasis;
  lawfulBasisJustification?: string | null;
  dataCategories?: DataCategory[];
  subjectCategories?: SubjectCategory[];
  dataElements?: string[];
  recipients?: string[];
  crossBorderTransfer?: boolean;
  transferMechanism?: TransferMechanism | null;
  transferDestinations?: string[];
  retentionPeriod?: string | null;
  securityMeasures?: string | null;
  ownerId?: string | null;
  status?: ProcessingActivityStatus;
  nextReviewAt?: string | null;
  vendorIds?: string[];
}

export type UpdateProcessingActivityInput = Partial<CreateProcessingActivityInput>;

export interface DPIA {
  id: string;
  tenantId: string;
  processingActivityId: string;
  assessedById: string;
  title: string;
  necessity: DPIANecessity;
  necessityProportionality: string | null;
  riskToRights: string | null;
  mitigations: string | null;
  consultedDpo: boolean;
  consultedDataSubjects: boolean;
  residualRisk: "low" | "medium" | "high" | null;
  status: DPIAStatus;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  processingActivity?: ProcessingActivitySummary;
  assessedBy?: { id: string; name: string; email: string };
  approvedBy?: { id: string; name: string; email: string } | null;
}

export interface DPIAListResponse {
  items: DPIA[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateDPIAInput {
  processingActivityId: string;
  title: string;
  necessity?: DPIANecessity;
  necessityProportionality?: string | null;
  riskToRights?: string | null;
  mitigations?: string | null;
  consultedDpo?: boolean;
  consultedDataSubjects?: boolean;
  residualRisk?: "low" | "medium" | "high" | null;
  status?: DPIAStatus;
}

export type UpdateDPIAInput = Partial<Omit<CreateDPIAInput, "processingActivityId">>;

export interface DataBreach {
  id: string;
  tenantId: string;
  processingActivityId: string | null;
  title: string;
  description: string | null;
  category: DataBreachCategory;
  severity: DataBreachSeverity;
  status: DataBreachStatus;
  occurredAt: string | null;
  discoveredAt: string;
  notificationDeadlineAt: string;
  containedAt: string | null;
  resolvedAt: string | null;
  affectedRecordsEstimate: number | null;
  affectedSubjectCategories: SubjectCategory[];
  dataCategoriesInvolved: DataCategory[];
  rootCause: string | null;
  containment: string | null;
  remediation: string | null;
  supervisoryAuthorityNotificationRequired: boolean;
  supervisoryAuthorityNotifiedAt: string | null;
  supervisoryAuthorityReference: string | null;
  dataSubjectsNotificationRequired: boolean;
  dataSubjectsNotifiedAt: string | null;
  reportedById: string | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  processingActivity?: ProcessingActivitySummary | null;
  reportedBy?: { id: string; name: string; email: string } | null;
  assignee?: { id: string; name: string; email: string } | null;
}

export interface DataBreachListResponse {
  items: DataBreach[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateDataBreachInput {
  title: string;
  description?: string | null;
  category: DataBreachCategory;
  severity: DataBreachSeverity;
  status?: DataBreachStatus;
  occurredAt?: string | null;
  discoveredAt?: string;
  notificationDeadlineAt?: string;
  affectedRecordsEstimate?: number | null;
  affectedSubjectCategories?: SubjectCategory[];
  dataCategoriesInvolved?: DataCategory[];
  rootCause?: string | null;
  containment?: string | null;
  remediation?: string | null;
  supervisoryAuthorityNotificationRequired?: boolean;
  dataSubjectsNotificationRequired?: boolean;
  processingActivityId?: string | null;
  assigneeId?: string | null;
}

export type UpdateDataBreachInput = Partial<CreateDataBreachInput>;

export interface DataBreachTransitionInput {
  status: DataBreachStatus;
  supervisoryAuthorityReference?: string | null;
}

export interface DSARRequest {
  id: string;
  tenantId: string;
  subjectName: string;
  subjectEmail: string | null;
  subjectIdentifier: string | null;
  requestType: DSARType;
  channel: DSARChannel;
  status: DSARStatus;
  receivedAt: string;
  dueAt: string;
  extendedAt: string | null;
  extendedDueAt: string | null;
  identityVerifiedAt: string | null;
  fulfilledAt: string | null;
  closedAt: string | null;
  refusalReason: string | null;
  responseNotes: string | null;
  responseFileKey: string | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; name: string; email: string } | null;
  processingActivities?: ProcessingActivitySummary[];
}

export interface DSARRequestListResponse {
  items: DSARRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateDSARRequestInput {
  subjectName: string;
  subjectEmail?: string | null;
  subjectIdentifier?: string | null;
  requestType: DSARType;
  channel: DSARChannel;
  status?: DSARStatus;
  receivedAt?: string;
  responseNotes?: string | null;
  refusalReason?: string | null;
  responseFileKey?: string | null;
  assigneeId?: string | null;
  processingActivityIds?: string[];
}

export type UpdateDSARRequestInput = Partial<CreateDSARRequestInput>;

export interface DSARTransitionInput {
  status: DSARStatus;
  responseNotes?: string | null;
  refusalReason?: string | null;
}

export interface PrivacyStats {
  processingActivities: {
    total: number;
    byStatus: Record<string, number>;
    dueForReview: number;
  };
  dpias: { total: number; byStatus: Record<string, number> };
  breaches: {
    total: number;
    open: number;
    notificationDeadlinePassed: number;
  };
  dsars: {
    total: number;
    byStatus: Record<string, number>;
    overdue: number;
  };
}

export interface PrivacySubprocessor {
  id: string;
  name: string;
  riskTier: VendorRiskTier;
  status: VendorStatus;
  dpaStatus: DpaStatus;
  dpaExpiresAt: string | null;
  dataTypesShared: string[];
  dataLocations: string[];
  subprocessorPurpose: string | null;
  processingActivities: ProcessingActivitySummary[];
}

export interface PrivacySubprocessorListResponse {
  items: PrivacySubprocessor[];
  total: number;
}

// ---------- Trust Center Types ----------

export type TrustResourceType = "certificate" | "report" | "policy" | "attestation";
export type TrustResourceGating = "public" | "contact_required" | "nda_required";
export type AccessRequestStatus = "pending" | "approved" | "rejected";

export interface TrustCenterConfig {
  id: string;
  tenantId: string;
  isEnabled: boolean;
  customDomain: string | null;
  brandColor: string | null;
  logoUrl: string | null;
  description: string | null;
  faqs: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface TrustResource {
  id: string;
  tenantId: string;
  trustCenterConfigId: string;
  title: string;
  description: string | null;
  frameworkType: string | null;
  resourceType: TrustResourceType;
  fileUrl: string;
  isPublic: boolean;
  accessGating: TrustResourceGating;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTrustCenterConfigInput {
  isEnabled?: boolean;
  customDomain?: string | null;
  brandColor?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  faqs?: unknown;
}

export interface CreateTrustResourceMeta {
  title: string;
  description?: string | null;
  frameworkType?: string | null;
  resourceType: TrustResourceType;
  isPublic?: boolean;
  accessGating?: TrustResourceGating;
}

export interface TrustCenterSubprocessor {
  id: string;
  name: string;
  website: string | null;
  category: string | null;
  subprocessorPurpose: string | null;
  dataTypesShared: string[];
  dataLocations: string[];
  dpaStatus: DpaStatus;
}

export interface TrustCenterAccessRequest {
  id: string;
  tenantId: string;
  resourceId: string;
  requesterName: string;
  requesterEmail: string;
  requesterCompany: string;
  requesterTitle: string | null;
  reason: string | null;
  status: AccessRequestStatus;
  ndaAccepted: boolean;
  approvedById: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  accessToken: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  resource?: { id: string; title: string; resourceType: TrustResourceType };
  approvedBy?: { id: string; name: string; email: string } | null;
}

export interface SubmitAccessRequestInput {
  resourceId: string;
  requesterName: string;
  requesterEmail: string;
  requesterCompany: string;
  requesterTitle?: string;
  reason?: string;
  ndaAccepted?: boolean;
}

export interface AccessRequestResult {
  status: "approved" | "pending" | "already_approved" | "already_pending";
  accessToken?: string;
}

export type TrustCenterPublicMode = "live" | "snapshot";

export interface PublicTrustPolicy {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  publicSummary: string | null;
  updatedAt: string;
  currentVersionId: string | null;
}

export interface PublicTrustFramework {
  id: string;
  name: string;
  version: string;
  frameworkType: FrameworkType;
  status: "not_started" | "in_progress" | "ready_for_audit" | "certified";
  targetMaturityLevel: string | null;
  certifiedAt: string | null;
}

export interface PublicTrustControlPosture {
  total: number;
  implemented: number;
  partial: number;
  notImplemented: number;
  notApplicable: number;
  scorePercent: number;
}

export interface PublicTrustEvidenceFreshness {
  total: number;
  fresh: number;
  expiringSoon: number;
  expired: number;
  lastCollectedAt: string | null;
}

export interface PublicTrustVerifiedBadge {
  framework: string;
  version: string;
  certifiedAt: string | null;
}

export interface PublicTrustCenterData {
  organization: { name: string; slug: string };
  config: {
    brandColor: string | null;
    logoUrl: string | null;
    description: string | null;
    faqs: unknown;
    publicMode: TrustCenterPublicMode;
  };
  resources: TrustResource[];
  subprocessors: TrustCenterSubprocessor[];
  policies: PublicTrustPolicy[];
  frameworks: PublicTrustFramework[];
  controlPosture: PublicTrustControlPosture;
  evidenceFreshness: PublicTrustEvidenceFreshness;
  verifiedBadge: PublicTrustVerifiedBadge | null;
  generatedAt: string;
  snapshotPublishedAt?: string;
}

export type TrustCenterEventType =
  | "view"
  | "resource_view"
  | "resource_download"
  | "access_request";

export interface TrustCenterEvent {
  id: string;
  type: TrustCenterEventType;
  resourceId: string | null;
  visitorIp: string | null;
  visitorUa: string | null;
  visitorEmail: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface TrustCenterSnapshotSummary {
  id: string;
  createdAt: string;
  publishedById: string;
  publishedBy?: { id: string; name: string; email: string } | null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Minimal SSE parser used by the chat client. Reads frames of the form
 *
 *   event: <name>\n
 *   data: <json>\n
 *   \n
 *
 * and yields `{ type: <name>, ...data }`. Unknown events are skipped
 * silently so the server can add new event types without breaking
 * older clients. Closes when the response body ends or the consumer
 * stops iterating.
 */
async function* parseSseStream(
  responsePromise: Promise<Response>,
  onUnauthorized?: () => void,
): AsyncGenerator<Record<string, unknown> & { type: string }> {
  const response = await responsePromise;
  if (response.status === 401) {
    onUnauthorized?.();
    return;
  }
  if (!response.ok || !response.body) {
    let message = `SSE request failed with status ${response.status}`;
    try {
      const errBody = (await response.json()) as { error?: string };
      if (errBody?.error) message = errBody.error;
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    yield { type: "error", error: message };
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    // SSE frames are separated by a blank line (\n\n).
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      let event = "message";
      let dataLine = "";
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLine += line.slice(5).trim();
      }
      if (!dataLine) continue;
      try {
        const data = JSON.parse(dataLine);
        yield { type: event, ...(data as object) };
      } catch {
        // Malformed JSON in a data frame — log to console and skip.
        // eslint-disable-next-line no-console
        console.warn("[sse] dropped malformed frame", dataLine);
      }
    }
  }
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== "undefined") {
      this.token = sessionStorage.getItem(TOKEN_KEY);
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(TOKEN_KEY, token);
      // Remove legacy persistent token storage.
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getCurrentUserId(): string | null {
    if (!this.token) return null;
    try {
      const parts = this.token.split(".");
      if (!parts[1]) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.userId || payload.sub || null;
    } catch {
      return null;
    }
  }

  getCurrentUserRole(): string | null {
    if (!this.token) return null;
    try {
      const parts = this.token.split(".");
      if (!parts[1]) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.role || null;
    } catch {
      return null;
    }
  }

  private redirectToLogin() {
    if (typeof window === "undefined") return;
    this.clearToken();
    window.location.href = "/login";
  }

  private redirectToLoginOnUnauthorized(response: Response): boolean {
    if (response.status !== 401 || typeof window === "undefined") return false;
    this.redirectToLogin();
    return true;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      // Send the httpOnly session cookie. The Authorization header is
      // still set above for environments where the cookie can't reach
      // the API (e.g. a fully different parent domain); the API accepts
      // either.
      credentials: "include",
    });

    if (!response.ok) {
      if (this.redirectToLoginOnUnauthorized(response)) {
        throw new ApiError(401, "Session expired", "TOKEN_EXPIRED");
      }
      const error = await response
        .json()
        .catch(() => ({ error: { message: response.statusText } }));
      throw new ApiError(
        response.status,
        error.error?.message || "Request failed",
        error.error?.code,
      );
    }

    return response.json() as Promise<T>;
  }

  private async uploadFile<T>(path: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);
    const headers: Record<string, string> = {};
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: formData,
      credentials: "include",
    });
    if (!response.ok) {
      if (this.redirectToLoginOnUnauthorized(response)) {
        throw new ApiError(401, "Session expired", "TOKEN_EXPIRED");
      }
      const error = await response
        .json()
        .catch(() => ({ error: { message: response.statusText } }));
      throw new ApiError(
        response.status,
        error.error?.message || "Upload failed",
        error.error?.code,
      );
    }
    return response.json() as Promise<T>;
  }

  // ---------- Auth ----------
  /**
   * Returns the active auth provider's public descriptor. Drives which login
   * UI is rendered (credential form vs. "Sign in with Cognito" button).
   */
  getAuthConfig() {
    return this.request<ApiResponse<AuthProviderDescriptor>>("GET", "/api/v1/auth/config");
  }

  login(email: string, password: string) {
    return this.request<{ token: string; user: unknown }>("POST", "/api/v1/auth/login", {
      email,
      password,
    });
  }

  register(data: { email: string; password: string; name: string; organizationName: string }) {
    return this.request<{ token: string; user: unknown }>("POST", "/api/v1/auth/register", data);
  }

  /**
   * Begins a redirect-based login flow. Returns the authorize URL to which
   * the browser should be sent (Cognito Hosted UI for the cognito provider).
   */
  startOAuthFlow(redirectUri: string) {
    const qs = new URLSearchParams({ redirectUri }).toString();
    return this.request<ApiResponse<{ authorizationUrl: string; state: string }>>(
      "GET",
      `/api/v1/auth/oauth/start?${qs}`,
    );
  }

  /**
   * Completes a redirect-based login flow. Pass through the entire query
   * string the IdP returned to /auth/callback.
   */
  completeOAuthFlow(query: Record<string, string>, redirectUri: string) {
    const qs = new URLSearchParams({ ...query, redirectUri }).toString();
    return this.request<{ token: string; user: unknown; organization: unknown }>(
      "GET",
      `/api/v1/auth/oauth/callback?${qs}`,
    );
  }

  getMe() {
    return this.request<{ user: unknown }>("GET", "/api/v1/auth/me");
  }

  logout(postLogoutRedirectUri?: string) {
    return this.request<ApiResponse<{ logoutUrl: string | null }>>("POST", "/api/v1/auth/logout", {
      postLogoutRedirectUri,
    });
  }

  // ---------- Frameworks ----------
  listFrameworks(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<{ items: FrameworkWithRequirements[]; total: number }>>(
      "GET",
      `/api/v1/frameworks${qs}`,
    );
  }

  getFrameworkCatalog() {
    return this.request<ApiResponse<CatalogFramework[]>>("GET", "/api/v1/frameworks/catalog");
  }

  listFrameworkInstances() {
    return this.request<ApiResponse<FrameworkInstance[]>>(
      "GET",
      "/api/v1/frameworks/instances/list",
    );
  }

  listFrameworkInstancesWithStats() {
    return this.request<ApiResponse<FrameworkInstanceWithStats[]>>(
      "GET",
      "/api/v1/frameworks/instances/stats",
    );
  }

  getFramework(id: string) {
    return this.request<ApiResponse<FrameworkWithRequirements>>("GET", `/api/v1/frameworks/${id}`);
  }

  adoptFramework(
    frameworkId: string,
    options?: { targetDate?: string; targetMaturityLevel?: string | null },
  ) {
    return this.request<ApiResponse<FrameworkInstance & { controlsCreated: number }>>(
      "POST",
      "/api/v1/frameworks/instances",
      { frameworkId, ...options },
    );
  }

  toggleFrameworkInstance(instanceId: string, isEnabled: boolean) {
    return this.request<ApiResponse<FrameworkInstance>>(
      "PATCH",
      `/api/v1/frameworks/instances/${instanceId}/toggle`,
      { isEnabled },
    );
  }

  updateFrameworkInstance(
    instanceId: string,
    data: {
      status?: FrameworkInstanceStatus;
      targetDate?: string | null;
      isEnabled?: boolean;
      targetMaturityLevel?: string | null;
    },
  ) {
    return this.request<ApiResponse<FrameworkInstance>>(
      "PATCH",
      `/api/v1/frameworks/instances/${instanceId}`,
      data,
    );
  }

  getRequirementMappings(requirementId: string) {
    return this.request<ApiResponse<RequirementMappingItem[]>>(
      "GET",
      `/api/v1/frameworks/requirements/${requirementId}/mappings`,
    );
  }

  listFrameworkMappings(params?: {
    source?: FrameworkType;
    target?: FrameworkType;
    relationship?: CrossFrameworkRelationship;
    limit?: number;
  }) {
    const qs = new URLSearchParams();
    if (params?.source) qs.set("source", params.source);
    if (params?.target) qs.set("target", params.target);
    if (params?.relationship) qs.set("relationship", params.relationship);
    if (params?.limit != null) qs.set("limit", String(params.limit));
    const qsStr = qs.toString() ? `?${qs}` : "";
    return this.request<ApiResponse<RequirementMappingItem[]>>(
      "GET",
      `/api/v1/frameworks/mappings${qsStr}`,
    );
  }

  removeFrameworkInstance(instanceId: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/frameworks/instances/${instanceId}`,
    );
  }

  // ---------- Controls ----------
  listControls(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<ControlListResponse>>("GET", `/api/v1/controls${qs}`);
  }

  getControl(id: string) {
    return this.request<ApiResponse<Control>>("GET", `/api/v1/controls/${id}`);
  }

  createControl(data: CreateControlInput) {
    return this.request<ApiResponse<Control>>("POST", "/api/v1/controls", data);
  }

  updateControl(id: string, data: Partial<CreateControlInput>) {
    return this.request<ApiResponse<Control>>("PATCH", `/api/v1/controls/${id}`, data);
  }

  deleteControl(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/controls/${id}`);
  }

  getControlCategories(params?: { frameworkId?: string }) {
    const qs = params?.frameworkId ? `?frameworkId=${encodeURIComponent(params.frameworkId)}` : "";
    return this.request<ApiResponse<string[]>>("GET", `/api/v1/controls/categories${qs}`);
  }

  getControlRequirementAssignments(controlId: string) {
    return this.request<ApiResponse<ControlRequirementAssignment[]>>(
      "GET",
      `/api/v1/controls/${controlId}/mappings`,
    );
  }

  updateControlRequirementAssignments(controlId: string, requirementIds: string[]) {
    return this.request<ApiResponse<ControlRequirementAssignment[]>>(
      "PUT",
      `/api/v1/controls/${controlId}/mappings`,
      { requirementIds },
    );
  }

  // ---------- Evidence-collection config & agent ----------
  getEvidenceConfig(controlId: string) {
    return this.request<ApiResponse<EvidenceCollectionConfig>>(
      "GET",
      `/api/v1/controls/${controlId}/evidence-config`,
    );
  }

  updateEvidenceConfig(controlId: string, data: UpdateEvidenceConfigInput) {
    return this.request<ApiResponse<EvidenceCollectionConfig>>(
      "PUT",
      `/api/v1/controls/${controlId}/evidence-config`,
      data,
    );
  }

  triggerEvidenceAgentRun(controlId: string) {
    return this.request<ApiResponse<EvidenceAgentRun>>(
      "POST",
      `/api/v1/controls/${controlId}/evidence-config/run`,
    );
  }

  listEvidenceAgentRuns(controlId: string, params?: { limit?: number }) {
    const qs = params?.limit ? `?limit=${params.limit}` : "";
    return this.request<ApiResponse<EvidenceAgentRun[]>>(
      "GET",
      `/api/v1/controls/${controlId}/evidence-config/runs${qs}`,
    );
  }

  getEvidenceAgentRun(controlId: string, runId: string) {
    return this.request<ApiResponse<EvidenceAgentRunDetail>>(
      "GET",
      `/api/v1/controls/${controlId}/evidence-config/runs/${runId}`,
    );
  }

  listEvidenceAgentTools() {
    return this.request<ApiResponse<EvidenceAgentToolConnection[]>>(
      "GET",
      `/api/v1/controls/evidence-config/available-tools`,
    );
  }

  // ---------- Evidence ----------
  listEvidence(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<EvidenceListResponse>>("GET", `/api/v1/evidence${qs}`);
  }

  getEvidence(id: string) {
    return this.request<ApiResponse<EvidenceItem>>("GET", `/api/v1/evidence/${id}`);
  }

  createEvidence(data: CreateEvidenceInput) {
    return this.request<ApiResponse<EvidenceItem>>("POST", "/api/v1/evidence", data);
  }

  updateEvidence(id: string, data: Partial<CreateEvidenceInput>) {
    return this.request<ApiResponse<EvidenceItem>>("PATCH", `/api/v1/evidence/${id}`, data);
  }

  deleteEvidence(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/evidence/${id}`);
  }

  reviewEvidence(id: string, action: "approve" | "reject", reviewNotes?: string) {
    return this.request<ApiResponse<EvidenceItem>>("POST", `/api/v1/evidence/${id}/review`, {
      action,
      reviewNotes,
    });
  }

  submitEvidenceForReview(id: string) {
    return this.request<ApiResponse<EvidenceItem>>("POST", `/api/v1/evidence/${id}/submit`);
  }

  renewEvidence(id: string) {
    return this.request<ApiResponse<EvidenceItem>>("POST", `/api/v1/evidence/${id}/renew`);
  }

  getEvidenceHealth() {
    return this.request<ApiResponse<EvidenceHealthSummary>>("GET", "/api/v1/evidence/health");
  }

  checkEvidenceExpirations() {
    return this.request<ApiResponse<unknown>>("POST", "/api/v1/evidence/check-expirations");
  }

  async uploadEvidenceFile(evidenceId: string, file: File): Promise<ApiResponse<EvidenceItem>> {
    const headers: Record<string, string> = {
      "Content-Type": file.type || "application/octet-stream",
      "X-File-Name": encodeURIComponent(file.name),
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const buffer = await file.arrayBuffer();
    const response = await fetch(`${this.baseUrl}/api/v1/evidence/${evidenceId}/upload`, {
      method: "POST",
      headers,
      body: buffer,
      credentials: "include",
    });

    if (!response.ok) {
      if (this.redirectToLoginOnUnauthorized(response)) {
        throw new ApiError(401, "Session expired", "TOKEN_EXPIRED");
      }
      const error = await response.json().catch(() => ({ error: { message: "Upload failed" } }));
      throw new ApiError(
        response.status,
        error.error?.message || `Upload failed: ${response.status}`,
      );
    }
    return response.json();
  }

  getEvidenceDownloadUrl(evidenceId: string) {
    return this.request<
      ApiResponse<{ url: string; fileName: string | null; mimeType: string | null }>
    >("GET", `/api/v1/evidence/${evidenceId}/download-url`);
  }

  removeEvidenceFile(evidenceId: string) {
    return this.request<ApiResponse<EvidenceItem>>("DELETE", `/api/v1/evidence/${evidenceId}/file`);
  }

  // ---------- Organization ----------
  getOrganization() {
    return this.request<ApiResponse<Organization>>("GET", "/api/v1/organizations");
  }

  updateOrganization(data: { name: string }) {
    return this.request<ApiResponse<Organization>>("PATCH", "/api/v1/organizations", data);
  }

  getOrganizationSettings() {
    return this.request<ApiResponse<OrganizationSettings>>("GET", "/api/v1/organizations/settings");
  }

  updateOrganizationSettings(data: UpdateOrganizationSettingsInput) {
    return this.request<ApiResponse<OrganizationSettings>>(
      "PATCH",
      "/api/v1/organizations/settings",
      data,
    );
  }

  listMembers() {
    return this.request<ApiResponse<OrgMember[]>>("GET", "/api/v1/organizations/members");
  }

  inviteMember(data: InviteMemberInput) {
    return this.request<ApiResponse<OrgMember>>(
      "POST",
      "/api/v1/organizations/members/invite",
      data,
    );
  }

  updateMemberRole(memberId: string, role: string) {
    return this.request<ApiResponse<OrgMember>>(
      "PATCH",
      `/api/v1/organizations/members/${memberId}`,
      { role },
    );
  }

  removeMember(memberId: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/organizations/members/${memberId}`,
    );
  }

  // ---------- People ----------

  listPeople(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<PersonListResponse>>("GET", `/api/v1/people${qs}`);
  }

  getPeopleStats() {
    return this.request<ApiResponse<PersonStats>>("GET", "/api/v1/people/stats");
  }

  getPerson(id: string) {
    return this.request<ApiResponse<PersonDetail>>("GET", `/api/v1/people/${id}`);
  }

  createPerson(data: CreatePersonInput) {
    return this.request<ApiResponse<PersonListItem>>("POST", "/api/v1/people", data);
  }

  invitePerson(data: InvitePersonInput) {
    return this.request<ApiResponse<{ userId: string; personId: string; status: string }>>(
      "POST",
      "/api/v1/people/invite",
      data,
    );
  }

  updatePerson(id: string, data: UpdatePersonInput) {
    return this.request<ApiResponse<PersonListItem>>("PATCH", `/api/v1/people/${id}`, data);
  }

  updatePersonRole(id: string, role: PersonRole) {
    return this.request<ApiResponse<PersonListItem>>("PATCH", `/api/v1/people/${id}/role`, {
      role,
    });
  }

  setPersonStatus(id: string, status: PersonStatus) {
    return this.request<ApiResponse<PersonListItem>>("POST", `/api/v1/people/${id}/status`, {
      status,
    });
  }

  deletePerson(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/people/${id}`);
  }

  promoteVendorContact(contactId: string) {
    return this.request<ApiResponse<PersonListItem>>(
      "POST",
      `/api/v1/people/from-vendor-contact/${contactId}`,
    );
  }

  listBackgroundChecks(personId: string) {
    return this.request<ApiResponse<{ items: BackgroundCheckItem[] }>>(
      "GET",
      `/api/v1/people/${personId}/background-checks`,
    );
  }

  createBackgroundCheck(personId: string, data: CreateBackgroundCheckInput) {
    return this.request<ApiResponse<BackgroundCheckItem>>(
      "POST",
      `/api/v1/people/${personId}/background-checks`,
      data,
    );
  }

  updateBackgroundCheck(
    personId: string,
    checkId: string,
    data: Partial<CreateBackgroundCheckInput>,
  ) {
    return this.request<ApiResponse<BackgroundCheckItem>>(
      "PATCH",
      `/api/v1/people/${personId}/background-checks/${checkId}`,
      data,
    );
  }

  getPersonChecklist(personId: string) {
    return this.request<ApiResponse<{ items: ChecklistItem[] }>>(
      "GET",
      `/api/v1/people/${personId}/checklist`,
    );
  }

  seedPersonChecklist(personId: string, kind: ChecklistKind) {
    return this.request<ApiResponse<{ items: ChecklistItem[] }>>(
      "POST",
      `/api/v1/people/${personId}/checklist/seed`,
      { kind },
    );
  }

  completeChecklistItem(personId: string, itemId: string, status: ChecklistItemStatus = "done") {
    return this.request<ApiResponse<ChecklistItem>>(
      "POST",
      `/api/v1/people/${personId}/checklist/${itemId}/complete`,
      { status },
    );
  }

  // Self-portal (member self-service)
  getMyPerson() {
    return this.request<ApiResponse<PersonListItem>>("GET", "/api/v1/people/me");
  }

  listMyPolicies() {
    return this.request<ApiResponse<{ items: MyPolicyItem[] }>>(
      "GET",
      "/api/v1/people/me/policies",
    );
  }

  acknowledgeMyPolicy(policyId: string) {
    return this.request<ApiResponse<{ acknowledged: boolean; alreadyAcknowledged: boolean }>>(
      "POST",
      `/api/v1/people/me/policies/${policyId}/acknowledge`,
    );
  }

  listMyTraining() {
    return this.request<ApiResponse<{ items: MyTrainingItem[] }>>(
      "GET",
      "/api/v1/people/me/training",
    );
  }

  completeMyTraining(completionId: string) {
    return this.request<ApiResponse<{ id: string; status: string; completedAt: string }>>(
      "POST",
      `/api/v1/people/me/training/${completionId}/complete`,
    );
  }

  // ---------- Devices (endpoint posture, M5) ----------

  listDevices(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<DeviceListResponse>>("GET", `/api/v1/devices${qs}`);
  }

  getDevice(id: string) {
    return this.request<ApiResponse<DeviceDetail>>("GET", `/api/v1/devices/${id}`);
  }

  revokeDevice(id: string) {
    return this.request<ApiResponse<{ revoked: boolean }>>("POST", `/api/v1/devices/${id}/revoke`);
  }

  listDirectorySyncConfigs() {
    return this.request<ApiResponse<DirectorySyncConfig[]>>(
      "GET",
      "/api/v1/directory-sync/configs",
    );
  }

  upsertDirectorySyncConfig(provider: DirectorySyncProvider, data: UpsertDirectorySyncConfigInput) {
    return this.request<ApiResponse<DirectorySyncConfig>>(
      "PUT",
      `/api/v1/directory-sync/configs/${provider}`,
      data,
    );
  }

  testDirectorySyncConfig(
    provider: DirectorySyncProvider,
    credentials?: EntraDirectorySyncCredentials | GoogleWorkspaceDirectorySyncCredentials,
  ) {
    return this.request<
      ApiResponse<{ provider: DirectorySyncProvider; usersSampled: number; success: boolean }>
    >(
      "POST",
      `/api/v1/directory-sync/configs/${provider}/test`,
      credentials ? { credentials } : {},
    );
  }

  triggerDirectorySync(provider: DirectorySyncProvider) {
    return this.request<ApiResponse<DirectorySyncRun | { status: "already_running" }>>(
      "POST",
      `/api/v1/directory-sync/configs/${provider}/sync`,
    );
  }

  listDirectorySyncRuns(params?: { provider?: DirectorySyncProvider; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.provider) query.set("provider", params.provider);
    if (params?.limit) query.set("limit", String(params.limit));
    const qs = query.size > 0 ? `?${query.toString()}` : "";
    return this.request<ApiResponse<DirectorySyncRun[]>>("GET", `/api/v1/directory-sync/runs${qs}`);
  }

  deleteDirectorySyncConfig(provider: DirectorySyncProvider) {
    return this.request<ApiResponse<{ provider: DirectorySyncProvider }>>(
      "DELETE",
      `/api/v1/directory-sync/configs/${provider}`,
    );
  }

  // ---------- Policies ----------
  listPolicies(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<PolicyListResponse>>("GET", `/api/v1/policies${qs}`);
  }

  getPolicy(id: string) {
    return this.request<ApiResponse<PolicyDetail>>("GET", `/api/v1/policies/${id}`);
  }

  listPolicyTemplates(params?: { framework?: PolicyFrameworkCode }) {
    const qs = params?.framework ? `?framework=${encodeURIComponent(params.framework)}` : "";
    return this.request<ApiResponse<PolicyTemplateListItem[]>>(
      "GET",
      `/api/v1/policies/templates${qs}`,
    );
  }

  getPolicyTemplate(templateId: string) {
    return this.request<ApiResponse<PolicyTemplateDetail>>(
      "GET",
      `/api/v1/policies/templates/${templateId}`,
    );
  }

  createPolicy(data: CreatePolicyInput) {
    return this.request<ApiResponse<PolicyDetail>>("POST", "/api/v1/policies", data);
  }

  updatePolicy(id: string, data: Partial<CreatePolicyInput> & { status?: PolicyStatus }) {
    return this.request<ApiResponse<PolicyDetail>>("PATCH", `/api/v1/policies/${id}`, data);
  }

  deletePolicy(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/policies/${id}`);
  }

  getPolicyCategories() {
    return this.request<ApiResponse<string[]>>("GET", "/api/v1/policies/categories");
  }

  listPolicyVersions(policyId: string) {
    return this.request<ApiResponse<PolicyVersion[]>>(
      "GET",
      `/api/v1/policies/${policyId}/versions`,
    );
  }

  createPolicyVersion(policyId: string, data: { content: string; changeNotes?: string }) {
    return this.request<ApiResponse<PolicyVersion>>(
      "POST",
      `/api/v1/policies/${policyId}/versions`,
      data,
    );
  }

  getPolicyControls(policyId: string) {
    return this.request<ApiResponse<PolicyControlMapping[]>>(
      "GET",
      `/api/v1/policies/${policyId}/controls`,
    );
  }

  updatePolicyControls(policyId: string, controlIds: string[]) {
    return this.request<ApiResponse<PolicyControlMapping[]>>(
      "PUT",
      `/api/v1/policies/${policyId}/controls`,
      { controlIds },
    );
  }

  listPolicyAcknowledgments(policyId: string) {
    return this.request<ApiResponse<PolicyAcknowledgment[]>>(
      "GET",
      `/api/v1/policies/${policyId}/acknowledgments`,
    );
  }

  acknowledgPolicy(policyId: string) {
    return this.request<ApiResponse<PolicyAcknowledgment>>(
      "POST",
      `/api/v1/policies/${policyId}/acknowledge`,
    );
  }

  approvePolicy(policyId: string) {
    return this.request<ApiResponse<PolicyDetail>>("POST", `/api/v1/policies/${policyId}/approve`);
  }

  requestPolicyChanges(policyId: string, notes: string) {
    return this.request<ApiResponse<PolicyDetail>>(
      "POST",
      `/api/v1/policies/${policyId}/request-changes`,
      { notes },
    );
  }

  publishPolicy(policyId: string) {
    return this.request<ApiResponse<PolicyDetail>>("POST", `/api/v1/policies/${policyId}/publish`);
  }

  savePolicyContent(policyId: string, content: string) {
    return this.request<ApiResponse<void>>("PUT", `/api/v1/policies/${policyId}/content`, {
      content,
    });
  }

  duplicatePolicy(policyId: string) {
    return this.request<ApiResponse<PolicyDetail>>(
      "POST",
      `/api/v1/policies/${policyId}/duplicate`,
    );
  }

  submitPolicyForReview(policyId: string) {
    return this.request<ApiResponse<PolicyDetail>>(
      "POST",
      `/api/v1/policies/${policyId}/submit-for-review`,
    );
  }

  // ---------- Policy Comments ----------
  listPolicyComments(policyId: string) {
    return this.request<ApiResponse<PolicyCommentData[]>>(
      "GET",
      `/api/v1/policies/${policyId}/comments`,
    );
  }

  createPolicyComment(
    policyId: string,
    data: {
      content: string;
      policyVersionId?: string;
      highlightedText?: string;
      fromPos?: number;
      toPos?: number;
      parentId?: string;
    },
  ) {
    return this.request<ApiResponse<PolicyCommentData>>(
      "POST",
      `/api/v1/policies/${policyId}/comments`,
      data,
    );
  }

  resolvePolicyComment(policyId: string, commentId: string) {
    return this.request<ApiResponse<PolicyCommentData>>(
      "POST",
      `/api/v1/policies/${policyId}/comments/${commentId}/resolve`,
    );
  }

  updatePolicyComment(policyId: string, commentId: string, content: string) {
    return this.request<ApiResponse<PolicyCommentData>>(
      "PATCH",
      `/api/v1/policies/${policyId}/comments/${commentId}`,
      { content },
    );
  }

  deletePolicyComment(policyId: string, commentId: string) {
    return this.request<ApiResponse<void>>(
      "DELETE",
      `/api/v1/policies/${policyId}/comments/${commentId}`,
    );
  }

  // ---------- Policy AI ----------
  generatePolicyContent(
    policyId: string,
    data: {
      prompt: string;
      context?: string;
      action?: "generate" | "rewrite" | "expand" | "summarize" | "improve";
    },
  ) {
    return this.request<ApiResponse<{ content: string }>>(
      "POST",
      `/api/v1/policies/${policyId}/ai/generate`,
      data,
    );
  }

  draftPolicyFromContext(
    policyId: string,
    data: { templateSlug?: string; instructions?: string } = {},
  ) {
    return this.request<ApiResponse<PolicyDraftFromContext>>(
      "POST",
      `/api/v1/policies/${policyId}/ai/draft-from-context`,
      data,
    );
  }

  // ---------- Organization Context (AI training facts) ----------
  listOrganizationContext(
    options: {
      category?: OrganizationContextCategory;
      includeHistory?: boolean;
    } = {},
  ) {
    const params = new URLSearchParams();
    if (options.category) params.set("category", options.category);
    if (options.includeHistory) params.set("includeHistory", "true");
    const qs = params.toString() ? `?${params.toString()}` : "";
    return this.request<ApiResponse<OrganizationContextEntry[]>>(
      "GET",
      `/api/v1/organization-context${qs}`,
    );
  }

  createOrganizationContext(data: OrganizationContextUpsert) {
    return this.request<ApiResponse<OrganizationContextEntry>>(
      "POST",
      `/api/v1/organization-context`,
      data,
    );
  }

  bulkUpsertOrganizationContext(entries: OrganizationContextUpsert[]) {
    return this.request<ApiResponse<OrganizationContextEntry[]>>(
      "POST",
      `/api/v1/organization-context/bulk`,
      { entries },
    );
  }

  updateOrganizationContext(id: string, data: Partial<OrganizationContextUpsert>) {
    return this.request<ApiResponse<OrganizationContextEntry>>(
      "PATCH",
      `/api/v1/organization-context/${id}`,
      data,
    );
  }

  deleteOrganizationContext(id: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/organization-context/${id}`,
    );
  }

  // ---------- Organization Context: AI extraction & proposals ----------
  /**
   * Submit free-form text (paste from a doc, meeting note, etc.) to be
   * extracted into pending TenantContextProposal rows. Server-side
   * we PII-scrub before invoking the LLM, and every result must still be
   * accepted by a human via {@link acceptOrganizationContextProposal}.
   */
  extractOrganizationContextFromText(data: { text: string; maxProposals?: number }) {
    return this.request<ApiResponse<ContextExtractionResult>>(
      "POST",
      `/api/v1/organization-context/from-text`,
      data,
    );
  }

  listOrganizationContextProposals(options: { status?: OrganizationContextProposalStatus } = {}) {
    const qs = options.status ? `?status=${options.status}` : "";
    return this.request<ApiResponse<TenantContextProposal[]>>(
      "GET",
      `/api/v1/organization-context/proposals${qs}`,
    );
  }

  acceptOrganizationContextProposal(proposalId: string, edits: AcceptProposalBody = {}) {
    return this.request<
      ApiResponse<{
        proposal: TenantContextProposal;
        contextEntry: OrganizationContextEntry;
        supersededId: string | null;
      }>
    >("POST", `/api/v1/organization-context/proposals/${proposalId}/accept`, edits);
  }

  rejectOrganizationContextProposal(proposalId: string, reason?: string) {
    return this.request<ApiResponse<TenantContextProposal>>(
      "POST",
      `/api/v1/organization-context/proposals/${proposalId}/reject`,
      reason ? { reason } : {},
    );
  }

  // ---------- Chat (compliance assistant) ----------
  listChatConversations(options: { includeArchived?: boolean } = {}) {
    const qs = options.includeArchived ? "?includeArchived=true" : "";
    return this.request<ApiResponse<ChatConversation[]>>("GET", `/api/v1/chat/conversations${qs}`);
  }

  createChatConversation(data: { title?: string } = {}) {
    return this.request<ApiResponse<ChatConversation>>("POST", `/api/v1/chat/conversations`, data);
  }

  updateChatConversation(conversationId: string, data: { title?: string; archive?: boolean }) {
    return this.request<ApiResponse<ChatConversation>>(
      "PATCH",
      `/api/v1/chat/conversations/${conversationId}`,
      data,
    );
  }

  deleteChatConversation(conversationId: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/chat/conversations/${conversationId}`,
    );
  }

  listChatMessages(conversationId: string) {
    return this.request<ApiResponse<ChatMessage[]>>(
      "GET",
      `/api/v1/chat/conversations/${conversationId}/messages`,
    );
  }

  /**
   * Non-streaming chat turn. Useful for tests and for clients that don't
   * want to wire up SSE; the streaming variant below is preferred for
   * the interactive UI because it can render the assistant reply and
   * any extracted proposals as they arrive.
   */
  sendChatTurn(conversationId: string, message: string, pageContext?: ChatPageContext | null) {
    return this.request<ApiResponse<ChatTurnResult>>(
      "POST",
      `/api/v1/chat/conversations/${conversationId}/turn`,
      pageContext ? { message, pageContext } : { message },
    );
  }

  /**
   * Streaming chat turn. Returns an async iterable of {@link ChatStreamEvent}
   * so the caller can `for await` over it. Behind the scenes this opens
   * a POST request to the SSE endpoint and parses the `event:`/`data:`
   * frames into typed events. The connection closes when the server emits
   * the `complete` event (or `error`).
   */
  streamChatTurn(
    conversationId: string,
    message: string,
    options: { signal?: AbortSignal; pageContext?: ChatPageContext | null } = {},
  ): AsyncIterable<ChatStreamEvent> {
    const url = `${this.baseUrl}/api/v1/chat/conversations/${conversationId}/turn/stream`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const body = options.pageContext ? { message, pageContext: options.pageContext } : { message };

    return parseSseStream(
      fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        credentials: "include",
        signal: options.signal,
      }),
      () => this.redirectToLogin(),
    ) as AsyncIterable<ChatStreamEvent>;
  }

  /**
   * Subscribe to the org-wide pending-proposals stream. Emits a fresh
   * snapshot of pending proposals every poll tick.
   */
  streamChatProposals(
    signal?: AbortSignal,
  ): AsyncIterable<
    { type: "proposals"; proposals: TenantContextProposal[] } | { type: "error"; error: string }
  > {
    const url = `${this.baseUrl}/api/v1/chat/proposals/stream`;
    const headers: Record<string, string> = {
      Accept: "text/event-stream",
    };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    return parseSseStream(
      fetch(url, { method: "GET", headers, credentials: "include", signal }),
      () => this.redirectToLogin(),
    ) as AsyncIterable<
      { type: "proposals"; proposals: TenantContextProposal[] } | { type: "error"; error: string }
    >;
  }

  // ---------- Policy File Import ----------
  importPolicyFile(policyId: string, file: File) {
    return this.uploadFile<ApiResponse<{ html: string; filename: string }>>(
      `/api/v1/policies/${policyId}/import`,
      file,
    );
  }

  // ---------- Risk Field Config ----------
  getRiskFieldConfig() {
    return this.request<ApiResponse<RiskFieldConfig[]>>("GET", "/api/v1/risks/field-config");
  }

  updateRiskFieldConfig(fields: RiskFieldConfig[]) {
    return this.request<ApiResponse<RiskFieldConfig[]>>("PUT", "/api/v1/risks/field-config", {
      fields,
    });
  }

  resetRiskFieldConfig() {
    return this.request<ApiResponse<RiskFieldConfig[]>>("POST", "/api/v1/risks/field-config/reset");
  }

  // ---------- Risks ----------
  listRisks(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<RiskListResponse>>("GET", `/api/v1/risks${qs}`);
  }

  getRisk(id: string) {
    return this.request<ApiResponse<RiskDetail>>("GET", `/api/v1/risks/${id}`);
  }

  createRisk(data: CreateRiskInput) {
    return this.request<ApiResponse<RiskItem>>("POST", "/api/v1/risks", data);
  }

  updateRisk(
    id: string,
    data: Partial<CreateRiskInput> & {
      status?: RiskStatusType;
      changeSource?: "matrix" | "overview";
    },
  ) {
    return this.request<ApiResponse<RiskItem>>("PATCH", `/api/v1/risks/${id}`, data);
  }

  listRiskMatrixChanges(riskId: string, params?: { limit?: number }) {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set("limit", String(params.limit));
    const qs = q.toString() ? `?${q}` : "";
    return this.request<ApiResponse<RiskMatrixChangeItem[]>>(
      "GET",
      `/api/v1/risks/${riskId}/matrix-changes${qs}`,
    );
  }

  deleteRisk(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/risks/${id}`);
  }

  getRiskStats() {
    return this.request<ApiResponse<RiskStats>>("GET", "/api/v1/risks/stats");
  }

  // ---------- Risk Assessments ----------
  listRiskAssessments(riskId: string) {
    return this.request<ApiResponse<RiskAssessmentItem[]>>(
      "GET",
      `/api/v1/risks/${riskId}/assessments`,
    );
  }

  createRiskAssessment(riskId: string, data: CreateRiskAssessmentInput) {
    return this.request<ApiResponse<RiskAssessmentItem>>(
      "POST",
      `/api/v1/risks/${riskId}/assessments`,
      data,
    );
  }

  deleteRiskAssessment(riskId: string, assessmentId: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/risks/${riskId}/assessments/${assessmentId}`,
    );
  }

  // ---------- Risk Treatments ----------
  listRiskTreatments(riskId: string) {
    return this.request<ApiResponse<RiskTreatmentItem[]>>(
      "GET",
      `/api/v1/risks/${riskId}/treatments`,
    );
  }

  createRiskTreatment(riskId: string, data: CreateRiskTreatmentInput) {
    return this.request<ApiResponse<RiskTreatmentItem>>(
      "POST",
      `/api/v1/risks/${riskId}/treatments`,
      data,
    );
  }

  updateRiskTreatment(
    riskId: string,
    treatmentId: string,
    data: Partial<CreateRiskTreatmentInput> & {
      status?: TreatmentStatusType;
      completedAt?: string | null;
    },
  ) {
    return this.request<ApiResponse<RiskTreatmentItem>>(
      "PATCH",
      `/api/v1/risks/${riskId}/treatments/${treatmentId}`,
      data,
    );
  }

  deleteRiskTreatment(riskId: string, treatmentId: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/risks/${riskId}/treatments/${treatmentId}`,
    );
  }

  // ---------- Vendors ----------
  listVendors(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<VendorListResponse>>("GET", `/api/v1/vendors${qs}`);
  }

  getVendor(id: string) {
    return this.request<ApiResponse<VendorDetail>>("GET", `/api/v1/vendors/${id}`);
  }

  createVendor(data: CreateVendorInput) {
    return this.request<ApiResponse<VendorItem>>("POST", "/api/v1/vendors", data);
  }

  updateVendor(id: string, data: UpdateVendorInput) {
    return this.request<ApiResponse<VendorItem>>("PATCH", `/api/v1/vendors/${id}`, data);
  }

  deleteVendor(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/vendors/${id}`);
  }

  getVendorStats() {
    return this.request<ApiResponse<VendorStats>>("GET", "/api/v1/vendors/stats");
  }

  // ---------- Known Vendors (global catalog) ----------
  searchKnownVendors(search?: string, limit?: number) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (limit) params.set("limit", String(limit));
    const qs = params.toString() ? `?${params}` : "";
    return this.request<ApiResponse<KnownVendorItem[]>>("GET", `/api/v1/vendors/known${qs}`);
  }

  getKnownVendor(id: string) {
    return this.request<ApiResponse<KnownVendorItem>>("GET", `/api/v1/vendors/known/${id}`);
  }

  createVendorFromKnown(data: {
    knownVendorId: string;
    researchFrequency?: ResearchFrequency;
    riskTier?: VendorRiskTier;
    dataProcessing?: boolean;
  }) {
    return this.request<ApiResponse<VendorItem>>("POST", "/api/v1/vendors/from-known", data);
  }

  // ---------- Vendor Research ----------
  getVendorResearch(vendorId: string) {
    return this.request<ApiResponse<VendorResearchItem[]>>(
      "GET",
      `/api/v1/vendors/${vendorId}/research`,
    );
  }

  triggerVendorResearch(vendorId: string) {
    return this.request<ApiResponse<VendorResearchItem>>(
      "POST",
      `/api/v1/vendors/${vendorId}/research`,
    );
  }

  updateResearchSettings(vendorId: string, researchFrequency: ResearchFrequency) {
    return this.request<ApiResponse<VendorItem>>(
      "PATCH",
      `/api/v1/vendors/${vendorId}/research-settings`,
      { researchFrequency },
    );
  }

  // ---------- Vendor Documents ----------
  async uploadVendorDocument(
    vendorId: string,
    file: File,
    meta: {
      documentType?: VendorDocumentType;
      title?: string;
      description?: string;
      expiresAt?: string;
    },
  ): Promise<ApiResponse<VendorDocumentItem>> {
    const headers: Record<string, string> = {
      "Content-Type": file.type || "application/octet-stream",
      "X-File-Name": encodeURIComponent(file.name),
    };
    if (meta.documentType) headers["X-Document-Type"] = meta.documentType;
    if (meta.title) headers["X-Document-Title"] = encodeURIComponent(meta.title);
    if (meta.description) headers["X-Document-Description"] = encodeURIComponent(meta.description);
    if (meta.expiresAt) headers["X-Document-Expires-At"] = meta.expiresAt;
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const buffer = await file.arrayBuffer();
    const response = await fetch(`${this.baseUrl}/api/v1/vendors/${vendorId}/documents`, {
      method: "POST",
      headers,
      body: buffer,
      credentials: "include",
    });

    if (!response.ok) {
      if (this.redirectToLoginOnUnauthorized(response)) {
        throw new ApiError(401, "Session expired", "TOKEN_EXPIRED");
      }
      const error = await response.json().catch(() => ({ error: { message: "Upload failed" } }));
      throw new ApiError(
        response.status,
        error.error?.message || "Upload failed",
        error.error?.code,
      );
    }
    return response.json();
  }

  listVendorDocuments(vendorId: string) {
    return this.request<ApiResponse<VendorDocumentItem[]>>(
      "GET",
      `/api/v1/vendors/${vendorId}/documents`,
    );
  }

  getVendorDocumentDownloadUrl(vendorId: string, documentId: string) {
    return this.request<
      ApiResponse<{ url: string; fileName: string | null; mimeType: string | null }>
    >("GET", `/api/v1/vendors/${vendorId}/documents/${documentId}/download-url`);
  }

  deleteVendorDocument(vendorId: string, documentId: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/vendors/${vendorId}/documents/${documentId}`,
    );
  }

  // ---------- Vendor Contacts ----------
  createVendorContact(vendorId: string, data: CreateVendorContactInput) {
    return this.request<ApiResponse<VendorContact>>(
      "POST",
      `/api/v1/vendors/${vendorId}/contacts`,
      data,
    );
  }

  updateVendorContact(
    vendorId: string,
    contactId: string,
    data: Partial<CreateVendorContactInput>,
  ) {
    return this.request<ApiResponse<VendorContact>>(
      "PATCH",
      `/api/v1/vendors/${vendorId}/contacts/${contactId}`,
      data,
    );
  }

  deleteVendorContact(vendorId: string, contactId: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/vendors/${vendorId}/contacts/${contactId}`,
    );
  }

  // ---------- Dashboard ----------
  getDashboardOverview() {
    return this.request<ApiResponse<DashboardOverview>>("GET", "/api/v1/dashboards/overview");
  }

  getAIUsage(days: number = 30) {
    return this.request<ApiResponse<AIUsageDashboard>>(
      "GET",
      `/api/v1/dashboards/ai-usage?days=${days}`,
    );
  }

  // ---------- Assets ----------
  listAssets(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<AssetListResponse>>("GET", `/api/v1/assets${qs}`);
  }

  getAssetStats() {
    return this.request<ApiResponse<AssetStats>>("GET", "/api/v1/assets/stats");
  }

  getAsset(id: string) {
    return this.request<ApiResponse<AssetItem>>("GET", `/api/v1/assets/${id}`);
  }

  createAsset(data: CreateAssetInput) {
    return this.request<ApiResponse<AssetItem>>("POST", "/api/v1/assets", data);
  }

  updateAsset(id: string, data: UpdateAssetInput) {
    return this.request<ApiResponse<AssetItem>>("PATCH", `/api/v1/assets/${id}`, data);
  }

  deleteAsset(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/assets/${id}`);
  }

  restoreAsset(id: string) {
    return this.request<ApiResponse<AssetItem>>("POST", `/api/v1/assets/${id}/restore`);
  }

  // ---------- Incidents ----------
  getIncidentStats() {
    return this.request<ApiResponse<IncidentStats>>("GET", "/api/v1/incidents/stats");
  }

  listIncidents(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<IncidentListResponse>>("GET", `/api/v1/incidents${qs}`);
  }

  getIncident(id: string) {
    return this.request<ApiResponse<IncidentItem>>("GET", `/api/v1/incidents/${id}`);
  }

  createIncident(data: CreateIncidentInput) {
    return this.request<ApiResponse<IncidentItem>>("POST", "/api/v1/incidents", data);
  }

  updateIncident(id: string, data: UpdateIncidentInput) {
    return this.request<ApiResponse<IncidentItem>>("PATCH", `/api/v1/incidents/${id}`, data);
  }

  deleteIncident(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/incidents/${id}`);
  }

  // ---------- Vulnerabilities ----------
  getVulnerabilityStats() {
    return this.request<ApiResponse<VulnerabilityStats>>("GET", "/api/v1/vulnerabilities/stats");
  }

  listVulnerabilities(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<VulnerabilityListResponse>>(
      "GET",
      `/api/v1/vulnerabilities${qs}`,
    );
  }

  getVulnerability(id: string) {
    return this.request<ApiResponse<VulnerabilityItem>>("GET", `/api/v1/vulnerabilities/${id}`);
  }

  createVulnerability(data: CreateVulnerabilityInput) {
    return this.request<ApiResponse<VulnerabilityItem>>("POST", "/api/v1/vulnerabilities", data);
  }

  updateVulnerability(id: string, data: UpdateVulnerabilityInput) {
    return this.request<ApiResponse<VulnerabilityItem>>(
      "PATCH",
      `/api/v1/vulnerabilities/${id}`,
      data,
    );
  }

  deleteVulnerability(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/vulnerabilities/${id}`);
  }

  // ---------- Business Continuity Plans ----------
  listBCPPlans(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<BCPPlanListResponse>>("GET", `/api/v1/bcp${qs}`);
  }

  getBCPPlan(id: string) {
    return this.request<ApiResponse<BCPPlanDetail>>("GET", `/api/v1/bcp/${id}`);
  }

  createBCPPlan(data: CreateBCPPlanInput) {
    return this.request<ApiResponse<BCPPlanItem>>("POST", "/api/v1/bcp", data);
  }

  updateBCPPlan(id: string, data: Partial<CreateBCPPlanInput>) {
    return this.request<ApiResponse<BCPPlanItem>>("PATCH", `/api/v1/bcp/${id}`, data);
  }

  deleteBCPPlan(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/bcp/${id}`);
  }

  getBCPStats() {
    return this.request<ApiResponse<BCPStats>>("GET", "/api/v1/bcp/stats");
  }

  // ---------- BIA (nested under BCP, used by the per-plan view) ----------
  listBIA(bcpId: string) {
    return this.request<ApiResponse<BusinessImpactAnalysis[]>>("GET", `/api/v1/bcp/${bcpId}/bia`);
  }

  createBIA(bcpId: string, data: CreateBIAInput) {
    return this.request<ApiResponse<BusinessImpactAnalysis>>(
      "POST",
      `/api/v1/bcp/${bcpId}/bia`,
      data,
    );
  }

  updateBIA(bcpId: string, biaId: string, data: Partial<CreateBIAInput>) {
    return this.request<ApiResponse<BusinessImpactAnalysis>>(
      "PATCH",
      `/api/v1/bcp/${bcpId}/bia/${biaId}`,
      data,
    );
  }

  deleteBIA(bcpId: string, biaId: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/bcp/${bcpId}/bia/${biaId}`);
  }

  // ---------- BIA cross-plan register ----------
  // These operate on BIAs across every plan in the org and return the parent
  // plan + owner inline. Powers the /business-continuity/bia page.
  listAllBIA(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<BIAListResponse>>("GET", `/api/v1/bcp/bia${qs}`);
  }

  getAllBIAStats() {
    return this.request<ApiResponse<BIAStats>>("GET", "/api/v1/bcp/bia/stats");
  }

  getBIA(biaId: string) {
    return this.request<ApiResponse<BusinessImpactAnalysis>>("GET", `/api/v1/bcp/bia/${biaId}`);
  }

  createBIATopLevel(data: CreateBIATopLevelInput) {
    return this.request<ApiResponse<BusinessImpactAnalysis>>("POST", "/api/v1/bcp/bia", data);
  }

  updateBIATopLevel(biaId: string, data: Partial<CreateBIAInput>) {
    return this.request<ApiResponse<BusinessImpactAnalysis>>(
      "PATCH",
      `/api/v1/bcp/bia/${biaId}`,
      data,
    );
  }

  deleteBIATopLevel(biaId: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/bcp/bia/${biaId}`);
  }

  approveBIA(biaId: string) {
    return this.request<ApiResponse<BusinessImpactAnalysis>>(
      "POST",
      `/api/v1/bcp/bia/${biaId}/approve`,
    );
  }

  // ---------- BCP Exercises (nested under BCP, used by per-plan view) ----------
  listBCPExercises(bcpId: string) {
    return this.request<ApiResponse<BCPExerciseItem[]>>("GET", `/api/v1/bcp/${bcpId}/exercises`);
  }

  createBCPExercise(bcpId: string, data: CreateBCPExerciseInput) {
    return this.request<ApiResponse<BCPExerciseItem>>(
      "POST",
      `/api/v1/bcp/${bcpId}/exercises`,
      data,
    );
  }

  updateBCPExercise(bcpId: string, exerciseId: string, data: Partial<CreateBCPExerciseInput>) {
    return this.request<ApiResponse<BCPExerciseItem>>(
      "PATCH",
      `/api/v1/bcp/${bcpId}/exercises/${exerciseId}`,
      data,
    );
  }

  deleteBCPExercise(bcpId: string, exerciseId: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/bcp/${bcpId}/exercises/${exerciseId}`,
    );
  }

  // ---------- BCP Exercises cross-plan register ----------
  // These power /business-continuity/exercises and return the parent plan
  // and facilitator inline.
  listAllBCPExercises(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<BCPExerciseListResponse>>("GET", `/api/v1/bcp/exercises${qs}`);
  }

  getAllBCPExerciseStats() {
    return this.request<ApiResponse<BCPExerciseStats>>("GET", "/api/v1/bcp/exercises/stats");
  }

  getBCPExercise(exerciseId: string) {
    return this.request<ApiResponse<BCPExerciseItem>>("GET", `/api/v1/bcp/exercises/${exerciseId}`);
  }

  createBCPExerciseTopLevel(data: CreateBCPExerciseTopLevelInput) {
    return this.request<ApiResponse<BCPExerciseItem>>("POST", "/api/v1/bcp/exercises", data);
  }

  updateBCPExerciseTopLevel(exerciseId: string, data: Partial<CreateBCPExerciseInput>) {
    return this.request<ApiResponse<BCPExerciseItem>>(
      "PATCH",
      `/api/v1/bcp/exercises/${exerciseId}`,
      data,
    );
  }

  deleteBCPExerciseTopLevel(exerciseId: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/bcp/exercises/${exerciseId}`,
    );
  }

  markBCPExerciseConducted(exerciseId: string, data: MarkConductedInput = {}) {
    return this.request<ApiResponse<BCPExerciseItem>>(
      "POST",
      `/api/v1/bcp/exercises/${exerciseId}/mark-conducted`,
      data,
    );
  }

  markBCPExerciseReviewed(exerciseId: string, data: MarkReviewedInput = {}) {
    return this.request<ApiResponse<BCPExerciseItem>>(
      "POST",
      `/api/v1/bcp/exercises/${exerciseId}/mark-reviewed`,
      data,
    );
  }

  // ---------- AI Governance ----------
  listAISystems(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<AISystemListResponse>>("GET", `/api/v1/ai-governance${qs}`);
  }

  getAISystem(id: string) {
    return this.request<ApiResponse<AISystem>>("GET", `/api/v1/ai-governance/${id}`);
  }

  getAIGovernanceStats() {
    return this.request<ApiResponse<AIGovernanceStats>>("GET", "/api/v1/ai-governance/stats");
  }

  createAISystem(data: CreateAISystemInput) {
    return this.request<ApiResponse<AISystem>>("POST", "/api/v1/ai-governance", data);
  }

  updateAISystem(id: string, data: UpdateAISystemInput) {
    return this.request<ApiResponse<AISystem>>("PATCH", `/api/v1/ai-governance/${id}`, data);
  }

  deleteAISystem(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/ai-governance/${id}`);
  }

  // ---------- AI Risk Assessments ----------
  listAIRiskAssessments(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<AIRiskAssessmentListResponse>>(
      "GET",
      `/api/v1/ai-governance/risk-assessments${qs}`,
    );
  }

  getAIRiskAssessmentStats() {
    return this.request<ApiResponse<AIRiskAssessmentStats>>(
      "GET",
      "/api/v1/ai-governance/risk-assessments/stats",
    );
  }

  getAIRiskAssessment(id: string) {
    return this.request<ApiResponse<AIRiskAssessment>>(
      "GET",
      `/api/v1/ai-governance/risk-assessments/${id}`,
    );
  }

  createAIRiskAssessment(data: CreateAIRiskAssessmentInput) {
    return this.request<ApiResponse<AIRiskAssessment>>(
      "POST",
      "/api/v1/ai-governance/risk-assessments",
      data,
    );
  }

  updateAIRiskAssessment(id: string, data: UpdateAIRiskAssessmentInput) {
    return this.request<ApiResponse<AIRiskAssessment>>(
      "PATCH",
      `/api/v1/ai-governance/risk-assessments/${id}`,
      data,
    );
  }

  deleteAIRiskAssessment(id: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/ai-governance/risk-assessments/${id}`,
    );
  }

  completeAIRiskAssessment(id: string) {
    return this.request<ApiResponse<AIRiskAssessment>>(
      "POST",
      `/api/v1/ai-governance/risk-assessments/${id}/complete`,
    );
  }

  approveAIRiskAssessment(id: string) {
    return this.request<ApiResponse<AIRiskAssessment>>(
      "POST",
      `/api/v1/ai-governance/risk-assessments/${id}/approve`,
    );
  }

  // ---------- AI Impact Assessments ----------
  listAIImpactAssessments(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<AIImpactAssessmentListResponse>>(
      "GET",
      `/api/v1/ai-governance/impact-assessments${qs}`,
    );
  }

  getAIImpactAssessmentStats() {
    return this.request<ApiResponse<AIImpactAssessmentStats>>(
      "GET",
      "/api/v1/ai-governance/impact-assessments/stats",
    );
  }

  getAIImpactAssessment(id: string) {
    return this.request<ApiResponse<AIImpactAssessment>>(
      "GET",
      `/api/v1/ai-governance/impact-assessments/${id}`,
    );
  }

  createAIImpactAssessment(data: CreateAIImpactAssessmentInput) {
    return this.request<ApiResponse<AIImpactAssessment>>(
      "POST",
      "/api/v1/ai-governance/impact-assessments",
      data,
    );
  }

  updateAIImpactAssessment(id: string, data: UpdateAIImpactAssessmentInput) {
    return this.request<ApiResponse<AIImpactAssessment>>(
      "PATCH",
      `/api/v1/ai-governance/impact-assessments/${id}`,
      data,
    );
  }

  deleteAIImpactAssessment(id: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/ai-governance/impact-assessments/${id}`,
    );
  }

  approveAIImpactAssessment(id: string) {
    return this.request<ApiResponse<AIImpactAssessment>>(
      "POST",
      `/api/v1/ai-governance/impact-assessments/${id}/approve`,
    );
  }

  rejectAIImpactAssessment(id: string) {
    return this.request<ApiResponse<AIImpactAssessment>>(
      "POST",
      `/api/v1/ai-governance/impact-assessments/${id}/reject`,
    );
  }

  // ---------- AI Incidents ----------
  listAIIncidents(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<AIIncidentListResponse>>(
      "GET",
      `/api/v1/ai-governance/incidents${qs}`,
    );
  }

  getAIIncidentStats() {
    return this.request<ApiResponse<AIIncidentStats>>(
      "GET",
      "/api/v1/ai-governance/incidents/stats",
    );
  }

  getAIIncident(id: string) {
    return this.request<ApiResponse<AIIncident>>("GET", `/api/v1/ai-governance/incidents/${id}`);
  }

  createAIIncident(data: CreateAIIncidentInput) {
    return this.request<ApiResponse<AIIncident>>("POST", "/api/v1/ai-governance/incidents", data);
  }

  updateAIIncident(id: string, data: UpdateAIIncidentInput) {
    return this.request<ApiResponse<AIIncident>>(
      "PATCH",
      `/api/v1/ai-governance/incidents/${id}`,
      data,
    );
  }

  deleteAIIncident(id: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/ai-governance/incidents/${id}`,
    );
  }

  transitionAIIncident(
    id: string,
    transition: "investigate" | "mitigate" | "resolve" | "close",
    data: AIIncidentTransitionInput = {},
  ) {
    return this.request<ApiResponse<AIIncident>>(
      "POST",
      `/api/v1/ai-governance/incidents/${id}/${transition}`,
      data,
    );
  }

  // ---------- Privacy / GDPR ----------

  getPrivacyStats() {
    return this.request<ApiResponse<PrivacyStats>>("GET", "/api/v1/privacy/stats");
  }

  // Processing Activities (RoPA, Art. 30)
  listProcessingActivities(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<ProcessingActivityListResponse>>(
      "GET",
      `/api/v1/privacy/processing-activities${qs}`,
    );
  }

  getProcessingActivity(id: string) {
    return this.request<ApiResponse<ProcessingActivity>>(
      "GET",
      `/api/v1/privacy/processing-activities/${id}`,
    );
  }

  createProcessingActivity(data: CreateProcessingActivityInput) {
    return this.request<ApiResponse<ProcessingActivity>>(
      "POST",
      "/api/v1/privacy/processing-activities",
      data,
    );
  }

  updateProcessingActivity(id: string, data: UpdateProcessingActivityInput) {
    return this.request<ApiResponse<ProcessingActivity>>(
      "PATCH",
      `/api/v1/privacy/processing-activities/${id}`,
      data,
    );
  }

  markProcessingActivityReviewed(id: string, nextReviewAt?: string | null) {
    return this.request<ApiResponse<ProcessingActivity>>(
      "POST",
      `/api/v1/privacy/processing-activities/${id}/mark-reviewed`,
      { nextReviewAt },
    );
  }

  deleteProcessingActivity(id: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/privacy/processing-activities/${id}`,
    );
  }

  // DPIAs (Art. 35)
  listDPIAs(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<DPIAListResponse>>("GET", `/api/v1/privacy/dpias${qs}`);
  }

  getDPIA(id: string) {
    return this.request<ApiResponse<DPIA>>("GET", `/api/v1/privacy/dpias/${id}`);
  }

  createDPIA(data: CreateDPIAInput) {
    return this.request<ApiResponse<DPIA>>("POST", "/api/v1/privacy/dpias", data);
  }

  updateDPIA(id: string, data: UpdateDPIAInput) {
    return this.request<ApiResponse<DPIA>>("PATCH", `/api/v1/privacy/dpias/${id}`, data);
  }

  transitionDPIA(id: string, transition: "submit" | "approve" | "reject" | "reopen") {
    return this.request<ApiResponse<DPIA>>("POST", `/api/v1/privacy/dpias/${id}/transition`, {
      transition,
    });
  }

  deleteDPIA(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/privacy/dpias/${id}`);
  }

  // Personal-Data Breach Register (Arts. 33/34)
  listDataBreaches(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<DataBreachListResponse>>(
      "GET",
      `/api/v1/privacy/data-breaches${qs}`,
    );
  }

  getDataBreach(id: string) {
    return this.request<ApiResponse<DataBreach>>("GET", `/api/v1/privacy/data-breaches/${id}`);
  }

  createDataBreach(data: CreateDataBreachInput) {
    return this.request<ApiResponse<DataBreach>>("POST", "/api/v1/privacy/data-breaches", data);
  }

  updateDataBreach(id: string, data: UpdateDataBreachInput) {
    return this.request<ApiResponse<DataBreach>>(
      "PATCH",
      `/api/v1/privacy/data-breaches/${id}`,
      data,
    );
  }

  transitionDataBreach(id: string, data: DataBreachTransitionInput) {
    return this.request<ApiResponse<DataBreach>>(
      "POST",
      `/api/v1/privacy/data-breaches/${id}/transition`,
      data,
    );
  }

  notifyDataBreachSubjects(id: string) {
    return this.request<ApiResponse<DataBreach>>(
      "POST",
      `/api/v1/privacy/data-breaches/${id}/notify-subjects`,
    );
  }

  deleteDataBreach(id: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/privacy/data-breaches/${id}`,
    );
  }

  // Data-Subject Access Requests (Arts. 12-22)
  listDSARRequests(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<DSARRequestListResponse>>("GET", `/api/v1/privacy/dsars${qs}`);
  }

  getDSARRequest(id: string) {
    return this.request<ApiResponse<DSARRequest>>("GET", `/api/v1/privacy/dsars/${id}`);
  }

  createDSARRequest(data: CreateDSARRequestInput) {
    return this.request<ApiResponse<DSARRequest>>("POST", "/api/v1/privacy/dsars", data);
  }

  updateDSARRequest(id: string, data: UpdateDSARRequestInput) {
    return this.request<ApiResponse<DSARRequest>>("PATCH", `/api/v1/privacy/dsars/${id}`, data);
  }

  extendDSARRequest(id: string, reason?: string) {
    return this.request<ApiResponse<DSARRequest>>("POST", `/api/v1/privacy/dsars/${id}/extend`, {
      reason,
    });
  }

  verifyDSARIdentity(id: string) {
    return this.request<ApiResponse<DSARRequest>>(
      "POST",
      `/api/v1/privacy/dsars/${id}/verify-identity`,
    );
  }

  transitionDSARRequest(id: string, data: DSARTransitionInput) {
    return this.request<ApiResponse<DSARRequest>>(
      "POST",
      `/api/v1/privacy/dsars/${id}/transition`,
      data,
    );
  }

  deleteDSARRequest(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/privacy/dsars/${id}`);
  }

  // Sub-processors saved view (vendors filtered for GDPR sub-processor program)
  listPrivacySubprocessors(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<PrivacySubprocessorListResponse>>(
      "GET",
      `/api/v1/privacy/sub-processors${qs}`,
    );
  }

  // ---------- Tasks ----------
  listTasks(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<TaskListResponse>>("GET", `/api/v1/tasks${qs}`);
  }

  getTask(id: string) {
    return this.request<ApiResponse<TaskItem>>("GET", `/api/v1/tasks/${id}`);
  }

  createTask(data: CreateTaskInput) {
    return this.request<ApiResponse<TaskItem>>("POST", "/api/v1/tasks", data);
  }

  updateTask(id: string, data: Partial<CreateTaskInput> & { status?: TaskStatus }) {
    return this.request<ApiResponse<TaskItem>>("PATCH", `/api/v1/tasks/${id}`, data);
  }

  deleteTask(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/tasks/${id}`);
  }

  completeTask(id: string) {
    return this.request<ApiResponse<TaskItem>>("POST", `/api/v1/tasks/${id}/complete`);
  }

  getTaskStats() {
    return this.request<ApiResponse<TaskStats>>("GET", "/api/v1/tasks/stats");
  }

  processOverdueTasks() {
    return this.request<ApiResponse<{ updated: number }>>("POST", "/api/v1/tasks/process-overdue");
  }

  // ---------- Training ----------
  listTrainingPrograms(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<TrainingListResponse>>("GET", `/api/v1/training${qs}`);
  }

  getTrainingProgram(id: string) {
    return this.request<ApiResponse<TrainingProgramDetail>>("GET", `/api/v1/training/${id}`);
  }

  createTrainingProgram(data: CreateTrainingInput) {
    return this.request<ApiResponse<TrainingProgram>>("POST", "/api/v1/training", data);
  }

  updateTrainingProgram(id: string, data: Partial<CreateTrainingInput>) {
    return this.request<ApiResponse<TrainingProgram>>("PATCH", `/api/v1/training/${id}`, data);
  }

  deleteTrainingProgram(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/training/${id}`);
  }

  getTrainingStats() {
    return this.request<ApiResponse<TrainingStats>>("GET", "/api/v1/training/stats");
  }

  assignTrainingUsers(programId: string, userIds: string[]) {
    return this.request<ApiResponse<TrainingCompletion[]>>(
      "POST",
      `/api/v1/training/${programId}/assign`,
      { userIds },
    );
  }

  updateTrainingCompletion(
    programId: string,
    completionId: string,
    data: { status: TrainingCompletionStatus; score?: number | null },
  ) {
    return this.request<ApiResponse<TrainingCompletion>>(
      "PATCH",
      `/api/v1/training/${programId}/completions/${completionId}`,
      data,
    );
  }

  removeTrainingCompletion(programId: string, completionId: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/training/${programId}/completions/${completionId}`,
    );
  }

  // ---------- Training Quizzes ----------
  listQuizzes(programId: string) {
    return this.request<ApiResponse<TrainingQuizListItem[]>>(
      "GET",
      `/api/v1/training/${programId}/quizzes`,
    );
  }

  getQuiz(programId: string, quizId: string) {
    return this.request<ApiResponse<TrainingQuizDetail>>(
      "GET",
      `/api/v1/training/${programId}/quizzes/${quizId}`,
    );
  }

  createQuiz(programId: string, data: CreateQuizInput) {
    return this.request<ApiResponse<TrainingQuizDetail>>(
      "POST",
      `/api/v1/training/${programId}/quizzes`,
      data,
    );
  }

  updateQuiz(
    programId: string,
    quizId: string,
    data: Partial<{
      title: string;
      description: string | null;
      passingScore: number;
      timeLimitMinutes: number | null;
      shuffleQuestions: boolean;
      isPublished: boolean;
    }>,
  ) {
    return this.request<ApiResponse<TrainingQuizListItem>>(
      "PATCH",
      `/api/v1/training/${programId}/quizzes/${quizId}`,
      data,
    );
  }

  updateQuizQuestions(programId: string, quizId: string, questions: CreateQuizInput["questions"]) {
    return this.request<ApiResponse<TrainingQuizDetail>>(
      "PUT",
      `/api/v1/training/${programId}/quizzes/${quizId}/questions`,
      { questions },
    );
  }

  deleteQuiz(programId: string, quizId: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/training/${programId}/quizzes/${quizId}`,
    );
  }

  getQuizForTaking(programId: string, quizId: string) {
    return this.request<ApiResponse<TrainingQuizDetail>>(
      "GET",
      `/api/v1/training/${programId}/quizzes/${quizId}/take`,
    );
  }

  submitQuiz(programId: string, quizId: string, data: SubmitQuizInput) {
    return this.request<ApiResponse<QuizAttemptItem>>(
      "POST",
      `/api/v1/training/${programId}/quizzes/${quizId}/submit`,
      data,
    );
  }

  listQuizAttempts(programId: string, quizId: string) {
    return this.request<ApiResponse<QuizAttemptItem[]>>(
      "GET",
      `/api/v1/training/${programId}/quizzes/${quizId}/attempts`,
    );
  }

  // ---------- License ----------
  getLicenseStatus() {
    return this.request<ApiResponse<LicenseStatus>>("GET", "/api/v1/license/status");
  }

  // ---------- AI Config ----------
  listAIProviders() {
    return this.request<ApiResponse<AIProviderConfigItem[]>>("GET", "/api/v1/ai-config/providers");
  }

  upsertAIProvider(
    provider: AIProviderType,
    data: {
      apiKey?: string | null;
      region?: string | null;
      accessKeyId?: string | null;
      secretAccessKey?: string | null;
      baseUrl?: string | null;
      isEnabled?: boolean;
    },
  ) {
    return this.request<ApiResponse<AIProviderConfigItem>>(
      "PUT",
      `/api/v1/ai-config/providers/${provider}`,
      data,
    );
  }

  deleteAIProvider(provider: AIProviderType) {
    return this.request<ApiResponse<null>>("DELETE", `/api/v1/ai-config/providers/${provider}`);
  }

  testAIProvider(provider: AIProviderType) {
    return this.request<ApiResponse<AIProviderTestResult>>(
      "POST",
      `/api/v1/ai-config/providers/${provider}/test`,
    );
  }

  listAIFeatures() {
    return this.request<ApiResponse<AIFeatureConfigItem[]>>("GET", "/api/v1/ai-config/features");
  }

  upsertAIFeature(
    feature: AIFeatureType,
    data: {
      provider: AIProviderType;
      model: string;
      isEnabled?: boolean;
    },
  ) {
    return this.request<ApiResponse<AIFeatureConfigItem>>(
      "PUT",
      `/api/v1/ai-config/features/${feature}`,
      data,
    );
  }

  deleteAIFeature(feature: AIFeatureType) {
    return this.request<ApiResponse<null>>("DELETE", `/api/v1/ai-config/features/${feature}`);
  }

  generateQuizWithAI(data: {
    topic: string;
    numberOfQuestions?: number;
    difficulty?: "beginner" | "intermediate" | "advanced";
    additionalContext?: string;
  }) {
    return this.request<ApiResponse<GeneratedQuizData>>(
      "POST",
      "/api/v1/ai-config/generate-quiz",
      data,
    );
  }

  // ---------- Audits ----------
  listAudits(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<ApiResponse<AuditListResponse>>("GET", `/api/v1/audits${qs}`);
  }

  getAudit(id: string) {
    return this.request<ApiResponse<AuditDetail>>("GET", `/api/v1/audits/${id}`);
  }

  createAudit(data: CreateAuditInput) {
    return this.request<ApiResponse<AuditItem>>("POST", "/api/v1/audits", data);
  }

  updateAudit(id: string, data: UpdateAuditInput) {
    return this.request<ApiResponse<AuditItem>>("PATCH", `/api/v1/audits/${id}`, data);
  }

  deleteAudit(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/audits/${id}`);
  }

  // ---------- Audit Findings ----------
  listAuditFindings(auditId: string) {
    return this.request<ApiResponse<AuditFindingItem[]>>(
      "GET",
      `/api/v1/audits/${auditId}/findings`,
    );
  }

  createAuditFinding(auditId: string, data: CreateAuditFindingInput) {
    return this.request<ApiResponse<AuditFindingItem>>(
      "POST",
      `/api/v1/audits/${auditId}/findings`,
      data,
    );
  }

  updateAuditFinding(auditId: string, findingId: string, data: UpdateAuditFindingInput) {
    return this.request<ApiResponse<AuditFindingItem>>(
      "PATCH",
      `/api/v1/audits/${auditId}/findings/${findingId}`,
      data,
    );
  }

  deleteAuditFinding(auditId: string, findingId: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/audits/${auditId}/findings/${findingId}`,
    );
  }

  // ---------- Audit Documents ----------
  async uploadAuditDocument(auditId: string, file: File): Promise<ApiResponse<AuditDocument>> {
    const headers: Record<string, string> = {
      "Content-Type": file.type || "application/octet-stream",
      "X-File-Name": encodeURIComponent(file.name),
    };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    const buffer = await file.arrayBuffer();
    const response = await fetch(`${this.baseUrl}/api/v1/audits/${auditId}/documents`, {
      method: "POST",
      headers,
      body: buffer,
      credentials: "include",
    });
    if (!response.ok) {
      if (this.redirectToLoginOnUnauthorized(response)) {
        throw new ApiError(401, "Session expired", "TOKEN_EXPIRED");
      }
      const error = await response.json().catch(() => ({ error: { message: "Upload failed" } }));
      throw new ApiError(
        response.status,
        error.error?.message || "Upload failed",
        error.error?.code,
      );
    }
    return response.json();
  }

  listAuditDocuments(auditId: string) {
    return this.request<ApiResponse<AuditDocument[]>>("GET", `/api/v1/audits/${auditId}/documents`);
  }

  deleteAuditDocument(auditId: string, documentId: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/audits/${auditId}/documents/${documentId}`,
    );
  }

  getAuditDocumentDownloadUrl(auditId: string, documentId: string) {
    return this.request<ApiResponse<{ url: string; fileName: string | null }>>(
      "GET",
      `/api/v1/audits/${auditId}/documents/${documentId}/download-url`,
    );
  }

  // ---------- Trust Center ----------
  getTrustCenterConfig() {
    return this.request<ApiResponse<TrustCenterConfig>>("GET", "/api/v1/trust-center");
  }

  updateTrustCenterConfig(data: UpdateTrustCenterConfigInput) {
    return this.request<ApiResponse<TrustCenterConfig>>("PATCH", "/api/v1/trust-center", data);
  }

  listTrustResources() {
    return this.request<ApiResponse<TrustResource[]>>("GET", "/api/v1/trust-center/resources");
  }

  async uploadTrustResource(
    file: File,
    meta: CreateTrustResourceMeta,
  ): Promise<ApiResponse<TrustResource>> {
    const headers: Record<string, string> = {
      "Content-Type": file.type || "application/octet-stream",
      "X-File-Name": encodeURIComponent(file.name),
      "X-Resource-Meta": encodeURIComponent(JSON.stringify(meta)),
    };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const buffer = await file.arrayBuffer();
    const response = await fetch(`${this.baseUrl}/api/v1/trust-center/resources`, {
      method: "POST",
      headers,
      body: buffer,
      credentials: "include",
    });

    if (!response.ok) {
      if (this.redirectToLoginOnUnauthorized(response)) {
        throw new ApiError(401, "Session expired", "TOKEN_EXPIRED");
      }
      const error = await response.json().catch(() => ({ error: { message: "Upload failed" } }));
      throw new ApiError(
        response.status,
        error.error?.message || "Upload failed",
        error.error?.code,
      );
    }
    return response.json();
  }

  updateTrustResource(resourceId: string, data: Partial<CreateTrustResourceMeta>) {
    return this.request<ApiResponse<TrustResource>>(
      "PATCH",
      `/api/v1/trust-center/resources/${resourceId}`,
      data,
    );
  }

  getTrustResourceDownloadUrl(resourceId: string) {
    return this.request<ApiResponse<{ url: string; title: string }>>(
      "GET",
      `/api/v1/trust-center/resources/${resourceId}/download-url`,
    );
  }

  deleteTrustResource(resourceId: string) {
    return this.request<ApiResponse<{ id: string }>>(
      "DELETE",
      `/api/v1/trust-center/resources/${resourceId}`,
    );
  }

  getTrustCenterSubprocessors() {
    return this.request<ApiResponse<TrustCenterSubprocessor[]>>(
      "GET",
      "/api/v1/trust-center/subprocessors",
    );
  }

  getPublicTrustCenter(slug: string) {
    return this.request<ApiResponse<PublicTrustCenterData>>(
      "GET",
      `/api/v1/trust-center/public/${slug}`,
    );
  }

  getPublicTrustResourceDownloadUrl(slug: string, resourceId: string) {
    return this.request<ApiResponse<{ url: string; title: string }>>(
      "GET",
      `/api/v1/trust-center/public/${slug}/resources/${resourceId}/download-url`,
    );
  }

  // ---------- Trust Center Access Requests (public) ----------
  submitAccessRequest(slug: string, data: SubmitAccessRequestInput) {
    return this.request<ApiResponse<AccessRequestResult>>(
      "POST",
      `/api/v1/trust-center/public/${slug}/access-requests`,
      data,
    );
  }

  downloadWithAccessToken(accessToken: string) {
    return this.request<ApiResponse<{ url: string; title: string }>>(
      "POST",
      "/api/v1/trust-center/public/access/download",
      { accessToken },
    );
  }

  // ---------- Trust Center Access Requests (admin) ----------
  listAccessRequests(params?: { status?: AccessRequestStatus }) {
    const qs = params?.status ? `?status=${params.status}` : "";
    return this.request<ApiResponse<TrustCenterAccessRequest[]>>(
      "GET",
      `/api/v1/trust-center/access-requests${qs}`,
    );
  }

  approveAccessRequest(requestId: string) {
    return this.request<ApiResponse<TrustCenterAccessRequest>>(
      "POST",
      `/api/v1/trust-center/access-requests/${requestId}/approve`,
    );
  }

  rejectAccessRequest(requestId: string, reason?: string) {
    return this.request<ApiResponse<TrustCenterAccessRequest>>(
      "POST",
      `/api/v1/trust-center/access-requests/${requestId}/reject`,
      { reason },
    );
  }

  // ---------- Trust Center Snapshots + Events (admin) ----------
  listTrustCenterSnapshots() {
    return this.request<ApiResponse<TrustCenterSnapshotSummary[]>>(
      "GET",
      `/api/v1/trust-center/snapshots`,
    );
  }

  publishTrustCenterSnapshot() {
    return this.request<ApiResponse<TrustCenterSnapshotSummary>>(
      "POST",
      `/api/v1/trust-center/snapshots`,
    );
  }

  listTrustCenterEvents(params?: { type?: TrustCenterEventType; since?: string }) {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.since) qs.set("since", params.since);
    const tail = qs.toString() ? `?${qs.toString()}` : "";
    return this.request<ApiResponse<{ events: TrustCenterEvent[]; total: number }>>(
      "GET",
      `/api/v1/trust-center/events${tail}`,
    );
  }

  // ---------- Trust Center Public events (visitor beacons) ----------
  recordPublicTrustEvent(
    slug: string,
    body: { type: TrustCenterEventType; resourceId?: string; metadata?: Record<string, unknown> },
  ) {
    return this.request<ApiResponse<unknown>>(
      "POST",
      `/api/v1/trust-center/public/${slug}/event`,
      body,
    );
  }

  // ---------- Integrations (Phase 3 manifest-driven) ----------
  listIntegrationCatalog() {
    return this.request<ApiResponse<IntegrationCatalogItem[]>>(
      "GET",
      `/api/v1/integrations/catalog`,
    );
  }

  getIntegrationManifest(connector: string) {
    return this.request<ApiResponse<IntegrationManifest>>(
      "GET",
      `/api/v1/integrations/catalog/${connector}`,
    );
  }

  listIntegrations() {
    return this.request<ApiResponse<IntegrationSummary[]>>("GET", `/api/v1/integrations`);
  }

  connectIntegration(body: {
    connector: string;
    displayName: string;
    config: Record<string, unknown>;
  }) {
    return this.request<ApiResponse<IntegrationSummary>>("POST", `/api/v1/integrations`, body);
  }

  disconnectIntegration(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/integrations/${id}`);
  }

  listIntegrationChecks(integrationId: string) {
    return this.request<ApiResponse<IntegrationCheckItem[]>>(
      "GET",
      `/api/v1/integrations/${integrationId}/checks`,
    );
  }

  runIntegrationCheck(integrationId: string, checkId: string) {
    return this.request<ApiResponse<{ queued: boolean }>>(
      "POST",
      `/api/v1/integrations/${integrationId}/checks/${checkId}/run`,
    );
  }

  listIntegrationResults(integrationId: string, limit = 50) {
    return this.request<ApiResponse<IntegrationCheckResultItem[]>>(
      "GET",
      `/api/v1/integrations/${integrationId}/results?limit=${limit}`,
    );
  }

  // ---------- Phase 4: natural-language → automated check ----------
  generateCheckFromPrompt(prompt: string) {
    return this.request<ApiResponse<GeneratedCheckDraft>>(
      "POST",
      `/api/v1/integrations/from-prompt`,
      { prompt },
    );
  }

  testCheckSpec(body: { runner: "http" | "browser"; spec: unknown }) {
    return this.request<ApiResponse<HttpCheckTestResult>>(
      "POST",
      `/api/v1/integrations/from-prompt/test`,
      body,
    );
  }

  saveCheckFromPrompt(body: SaveCheckFromPromptInput) {
    return this.request<ApiResponse<IntegrationCheckItem>>(
      "POST",
      `/api/v1/integrations/from-prompt/save`,
      body,
    );
  }

  // ---------- Phase 5: AI risk + vendor scoring ----------

  suggestRiskScore(riskId: string) {
    return this.request<ApiResponse<RiskScoreSuggestion>>(
      "POST",
      `/api/v1/risks/${riskId}/ai-suggest-score`,
    );
  }

  recordRiskScoreDecision(riskId: string, body: RiskScoreDecisionInput) {
    return this.request<
      ApiResponse<{ suggestionId: string; decision: RiskScoreDecisionInput["decision"] }>
    >("POST", `/api/v1/risks/${riskId}/ai-score-decision`, body);
  }

  suggestVendorTier(vendorId: string) {
    return this.request<ApiResponse<VendorTierSuggestion>>(
      "POST",
      `/api/v1/vendors/${vendorId}/ai-suggest-tier`,
    );
  }

  recordVendorTierDecision(vendorId: string, body: VendorTierDecisionInput) {
    return this.request<
      ApiResponse<{ suggestionId: string; decision: VendorTierDecisionInput["decision"] }>
    >("POST", `/api/v1/vendors/${vendorId}/ai-tier-decision`, body);
  }

  // ---------- Phase 6: AI questionnaire answering ----------

  /**
   * Kick off an async questionnaire import. Returns a jobId — poll
   * `getQuestionnaireImportJob(jobId)` until status is terminal
   * (`completed` | `partial` | `failed`).
   */
  createQuestionnaire(body: CreateQuestionnaireInput) {
    return this.request<ApiResponse<QuestionnaireImportJobAck>>(
      "POST",
      `/api/v1/questionnaires`,
      body,
    );
  }

  /**
   * Multipart upload variant for .xlsx / .xls / .docx / .csv binaries.
   * Returns a jobId — same polling contract as the JSON-body variant.
   */
  async createQuestionnaireFromFile(
    file: File,
    meta: Omit<CreateQuestionnaireInput, "csv">,
  ): Promise<ApiResponse<QuestionnaireImportJobAck>> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", meta.name);
    if (meta.requester) formData.append("requester", meta.requester);
    if (meta.vendorId) formData.append("vendorId", meta.vendorId);
    if (meta.dueDate) formData.append("dueDate", meta.dueDate);
    if (meta.formatHint) formData.append("formatHint", meta.formatHint);

    const headers: Record<string, string> = {};
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const response = await fetch(`${this.baseUrl}/api/v1/questionnaires`, {
      method: "POST",
      headers,
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      if (this.redirectToLoginOnUnauthorized(response)) {
        throw new ApiError(401, "Session expired", "TOKEN_EXPIRED");
      }
      const error = await response
        .json()
        .catch(() => ({ error: { message: response.statusText } }));
      throw new ApiError(
        response.status,
        error.error?.message || "Upload failed",
        error.error?.code,
      );
    }
    return response.json() as Promise<ApiResponse<QuestionnaireImportJobAck>>;
  }

  /**
   * Polling endpoint for an in-flight questionnaire import. Safe to
   * call once a second; the server returns the same row each time
   * with progress.sheets[] mutated in place as the structure agent
   * settles each sheet.
   */
  getQuestionnaireImportJob(jobId: string) {
    return this.request<ApiResponse<QuestionnaireImportJob>>(
      "GET",
      `/api/v1/questionnaires/jobs/${jobId}`,
    );
  }

  listQuestionnaires() {
    return this.request<ApiResponse<QuestionnaireListItem[]>>("GET", `/api/v1/questionnaires`);
  }

  getQuestionnaire(id: string) {
    return this.request<ApiResponse<QuestionnaireDetail>>("GET", `/api/v1/questionnaires/${id}`);
  }

  updateQuestionnaire(id: string, body: UpdateQuestionnaireInput) {
    return this.request<ApiResponse<QuestionnaireListItem>>(
      "PATCH",
      `/api/v1/questionnaires/${id}`,
      body,
    );
  }

  deleteQuestionnaire(id: string) {
    return this.request<ApiResponse<{ id: string }>>("DELETE", `/api/v1/questionnaires/${id}`);
  }

  answerAllQuestionnaire(id: string) {
    return this.request<
      ApiResponse<{
        total: number;
        answered: number;
        skipped: number;
        failures: Array<{ questionId: string; error: string }>;
      }>
    >("POST", `/api/v1/questionnaires/${id}/answer-all`);
  }

  generateAnswer(questionnaireId: string, questionId: string) {
    return this.request<ApiResponse<QuestionAnswer>>(
      "POST",
      `/api/v1/questionnaires/${questionnaireId}/questions/${questionId}/answer`,
    );
  }

  reviewAnswer(questionnaireId: string, questionId: string, body: ReviewAnswerInput) {
    return this.request<ApiResponse<QuestionAnswer>>(
      "PATCH",
      `/api/v1/questionnaires/${questionnaireId}/questions/${questionId}/answer`,
      body,
    );
  }

  async downloadQuestionnaireCsv(id: string, suggestedName: string): Promise<void> {
    return this.downloadQuestionnaire(id, suggestedName, "csv");
  }

  /**
   * Download an exported questionnaire in the requested format.
   *
   * Use `format = "xlsx"` / `"docx"` for round-tripped exports — the
   * server writes answers back into the customer's original file and
   * preserves their formatting / branding. Falls through with a clear
   * error message when round-trip metadata isn't available.
   *
   * `include = "approved"` (default) writes only CISO/ISO-approved
   * answers; `include = "all"` also includes drafts.
   */
  async downloadQuestionnaire(
    id: string,
    suggestedName: string,
    format: QuestionnaireExportFormat,
    include: QuestionnaireExportInclude = "approved",
  ): Promise<void> {
    const headers: Record<string, string> = {};
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    const url = `${API_URL}/api/v1/questionnaires/${id}/export.${format}?include=${include}`;
    const res = await fetch(url, { headers, credentials: "include" });
    if (!res.ok) {
      let detail = "";
      try {
        const body = (await res.json()) as { error?: string };
        if (body?.error) detail = `: ${body.error}`;
      } catch {
        /* not JSON */
      }
      throw new Error(`Export failed (${res.status})${detail}`);
    }
    const blob = await res.blob();
    const dlUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = dlUrl;
    a.download = `${suggestedName.replace(/[^a-z0-9-_]+/gi, "_")}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(dlUrl);
  }
}

// Types live below the class so they're hoisted via TS declaration merging.

export type IntegrationCategory =
  | "cloud"
  | "identity"
  | "code"
  | "productivity"
  | "endpoint"
  | "security";

export type IntegrationCheckSeverity = "low" | "medium" | "high" | "critical";
export type IntegrationCheckStatus = "pass" | "fail" | "error" | "skipped" | "pending";

export interface IntegrationCatalogItem {
  connector: string;
  displayName: string;
  description: string;
  iconKey: string;
  category: IntegrationCategory;
  authType: string;
  checkCount: number;
}

export interface IntegrationManifestConfigField {
  key: string;
  label: string;
  type: "string" | "secret" | "boolean" | "number" | "select";
  required: boolean;
  options?: { value: string; label: string }[];
  helpText?: string;
  defaultValue?: unknown;
}

export interface IntegrationManifestCheck {
  key: string;
  title: string;
  description: string;
  severity: IntegrationCheckSeverity;
  schedule: string;
  runner: "aws_sdk" | "http" | "oauth_api" | "browser";
  controlMappings: { framework: string; requirement: string; note?: string }[];
}

export interface IntegrationManifest extends IntegrationCatalogItem {
  configFields: IntegrationManifestConfigField[];
  checks: IntegrationManifestCheck[];
}

export interface IntegrationSummary {
  id: string;
  tenantId: string;
  connector: string;
  displayName: string;
  status: "connected" | "disconnected" | "error" | "paused";
  lastSyncAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { checks: number };
}

export interface IntegrationCheckItem {
  id: string;
  manifestKey: string;
  title: string;
  description: string | null;
  severity: IntegrationCheckSeverity;
  schedule: string;
  isEnabled: boolean;
  lastStatus: IntegrationCheckStatus;
  lastRunAt: string | null;
  controls: { control: { id: string; title: string } }[];
  results: {
    id: string;
    status: IntegrationCheckStatus;
    createdAt: string;
    durationMs: number | null;
    errorMessage: string | null;
  }[];
}

export interface IntegrationCheckResultItem {
  id: string;
  status: IntegrationCheckStatus;
  payload: unknown;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: string;
  evidenceId: string | null;
  integrationCheck: {
    id: string;
    title: string;
    manifestKey: string;
    severity: IntegrationCheckSeverity;
  };
}

// ─── Phase 4: natural-language → automated check ───────────────────────

export interface HttpCheckSpec {
  url: string;
  method: "GET" | "HEAD";
  headers: Record<string, string>;
  timeoutMs: number;
  expect: {
    statusCode?: number;
    bodyContains?: string;
    headerEquals?: Record<string, string>;
    tlsValidForDays?: number;
  };
}

export type BrowserCheckStep =
  | { action: "navigate"; url: string }
  | { action: "click"; selector: string }
  | { action: "type"; selector: string; value: string }
  | { action: "wait_for"; selector: string; timeoutMs: number }
  | { action: "screenshot"; name: string };

export interface BrowserCheckSpec {
  steps: BrowserCheckStep[];
  expect: { containsText?: string; screenshotName?: string };
}

export interface GeneratedCheckDraft {
  runner: "http" | "browser";
  spec: HttpCheckSpec | BrowserCheckSpec;
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedSeverity: IntegrationCheckSeverity;
  suggestedSchedule: string;
  suggestedFrameworkRefs: { framework: string; requirement: string; note?: string }[];
  modelUsed: string;
  providerSource: "operator" | "org" | "feature";
}

export interface HttpCheckTestResult {
  status: "pass" | "fail" | "error";
  durationMs: number;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  bodySnippet?: string;
  tlsValidUntil?: string;
  failures: string[];
  error?: string;
}

export interface SaveCheckFromPromptInput {
  prompt: string;
  runner: "http" | "browser";
  spec: HttpCheckSpec | BrowserCheckSpec;
  title: string;
  description: string;
  severity: IntegrationCheckSeverity;
  schedule: string;
  modelUsed: string;
  controlIds?: string[];
}

// ---------- Phase 5: AI risk + vendor scoring ----------

export type AIProviderSource = "operator" | "org" | "feature";

export interface RiskScoreSuggestion {
  suggestionId: string;
  riskId: string;
  likelihood: number;
  impact: number;
  riskScore: number;
  rationale: string;
  similarRiskIds: string[];
  confidence: number;
  caveats: string[];
  modelUsed: string;
  providerSource: AIProviderSource;
  generatedAt: string;
}

export interface RiskScoreDecisionInput {
  suggestionId: string;
  decision: "applied" | "dismissed" | "refined";
  appliedLikelihood?: number;
  appliedImpact?: number;
  refineNotes?: string;
}

export interface VendorTierSuggestion {
  suggestionId: string;
  vendorId: string;
  tier: VendorRiskTier;
  rationale: string;
  factors: string[];
  confidence: number;
  caveats: string[];
  modelUsed: string;
  providerSource: AIProviderSource;
  generatedAt: string;
}

export interface VendorTierDecisionInput {
  suggestionId: string;
  decision: "applied" | "dismissed" | "refined";
  appliedTier?: VendorRiskTier;
  refineNotes?: string;
}

// ---------- Phase 6: Questionnaire types ----------

/**
 * 202-response payload from POST /api/v1/questionnaires. The actual
 * Questionnaire row hasn't been created yet — the client must poll
 * `getQuestionnaireImportJob` until the job is terminal.
 */
export interface QuestionnaireImportJobAck {
  jobId: string;
  status: QuestionnaireImportJobStatus;
}

export type QuestionnaireImportJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "partial"
  | "failed";

export type QuestionnaireImportJobPhase =
  | "queued"
  | "downloading"
  | "parsing"
  | "mapping"
  | "persisting";

export interface QuestionnaireImportSheetProgress {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  /** Set after the agent classifies the sheet. */
  kind?: "instructions" | "metadata" | "question_table" | "matrix" | "csv";
  /** Number of questions extracted from this sheet. Set on completion. */
  questionCount?: number;
  durationMs?: number;
  /** Public-safe error string if status === "failed". */
  error?: string;
}

export interface QuestionnaireImportProgress {
  phase: QuestionnaireImportJobPhase;
  totalSheets: number;
  completedSheets: number;
  failedSheets: number;
  sheets: QuestionnaireImportSheetProgress[];
  elapsedMs?: number;
}

export interface QuestionnaireImportJob {
  jobId: string;
  status: QuestionnaireImportJobStatus;
  name: string;
  sourceFormat: QuestionnaireSourceFormat | null;
  /** Set when status transitions to completed/partial — points at the new Questionnaire. */
  questionnaireId: string | null;
  progress: QuestionnaireImportProgress;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export type QuestionnaireSourceFormat = "csv" | "caiq" | "sig" | "xlsx" | "docx" | "custom";

export type QuestionnaireExportFormat = "csv" | "xlsx" | "docx";

export type QuestionnaireExportInclude = "approved" | "all";
export type QuestionnaireStatus = "draft" | "in_progress" | "completed" | "exported";
export type QuestionType = "yes_no" | "short_text" | "long_text" | "multiple_choice";
export type AnswerStatus = "pending" | "draft" | "approved" | "rejected";

export interface CreateQuestionnaireInput {
  name: string;
  requester?: string;
  vendorId?: string;
  dueDate?: string;
  csv: string;
  formatHint?: QuestionnaireSourceFormat;
}

export interface UpdateQuestionnaireInput {
  name?: string;
  requester?: string | null;
  vendorId?: string | null;
  dueDate?: string | null;
  status?: QuestionnaireStatus;
}

export interface QuestionnaireListItem {
  id: string;
  name: string;
  sourceFormat: QuestionnaireSourceFormat;
  requester: string | null;
  vendor: { id: string; name: string } | null;
  importedBy: { id: string; name: string; email: string } | null;
  dueDate: string | null;
  status: QuestionnaireStatus;
  questionCount: number;
  answerCount: number;
  progress: { approved: number; draft: number; pending: number; rejected: number };
  /** True when the original file is in storage and supports xlsx/docx export. */
  roundTrippable: boolean;
  originalFilename: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionAnswerSource {
  kind: "policy" | "context" | "framework" | "control" | "past_answer";
  ref: string;
  snippet?: string;
}

export interface QuestionAnswer {
  id: string;
  questionId: string;
  questionnaireId: string;
  content: string;
  status: AnswerStatus;
  generatedByAi: boolean;
  aiConfidence: number | null;
  aiSources: QuestionAnswerSource[];
  aiModel: string | null;
  reviewedById: string | null;
  reviewedBy?: { id: string; name: string; email: string } | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionnaireQuestion {
  id: string;
  sequenceNumber: number;
  sectionTitle: string | null;
  questionText: string;
  questionType: QuestionType;
  choices: string[];
  answers: QuestionAnswer[];
  /** Source-document position metadata (xlsx/docx round-trip imports). */
  sourceSheetName: string | null;
  sourceTableIndex: number | null;
  /** Self-link for nested sub-questions (e.g. "a) ..." under a parent). */
  parentQuestionId: string | null;
  /** Free-shape labels: domain, subDomain, controlId, evidence, column, … */
  contextLabels: Record<string, string> | null;
  /** A1 cell ref where the answer is written on export (xlsx/docx). */
  answerCellA1: string | null;
}

/**
 * One sheet/page extracted from the original document by the
 * structure agent. Used to render the per-sheet tab UI.
 */
export interface QuestionnaireSheet {
  sheetName: string;
  kind: "metadata" | "instructions" | "question_table" | "matrix" | "csv";
  questionCount: number;
  facts: Array<{ label: string; answerCellA1: string; value?: string }>;
}

export interface QuestionnaireDetail {
  id: string;
  name: string;
  sourceFormat: QuestionnaireSourceFormat;
  requester: string | null;
  vendor: { id: string; name: string } | null;
  importedBy: { id: string; name: string; email: string } | null;
  dueDate: string | null;
  status: QuestionnaireStatus;
  headers: string[];
  questions: QuestionnaireQuestion[];
  /** Per-sheet groups for the sheet-tabbed UI. */
  sheets: QuestionnaireSheet[];
  /** True when the original file is in storage and supports xlsx/docx export. */
  roundTrippable: boolean;
  originalFilename: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewAnswerInput {
  content?: string;
  status?: "approved" | "rejected" | "draft";
}

export const apiClient = new ApiClient(API_URL);
