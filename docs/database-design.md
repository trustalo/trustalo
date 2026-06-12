# Database Design

Trustalo uses three databases across two services. Each service owns and manages its databases independently -- there is no shared database access.

## Database Overview

| Database           | Engine     | ORM        | Owner     | Purpose                               |
| ------------------ | ---------- | ---------- | --------- | ------------------------------------- |
| trustalo_api       | PostgreSQL | Prisma 7   | API       | Relational compliance data            |
| trustalo_docs      | MongoDB    | Mongoose 9 | API       | Documents, logs, snapshots            |
| trustalo_collector | PostgreSQL | Prisma 7   | Collector | Integration metadata and job tracking |

## Multi-Tenancy Enforcement

Tenancy is the primary partitioning axis. Every row that belongs to a customer carries a `tenantId` foreign key to the `Tenant` model. The shape is enforced in three places, layered defence-in-depth style:

1. **Schema constraint.** The Prisma schema declares the FK + a `(tenantId, …)` compound unique/index on every tenant-scoped table.
2. **Per-request Prisma extension.** The `prismaWithTenant(tenantId)` helper in `apps/api/src/db/prisma.ts` returns a `$extends` client that auto-injects `tenantId` on writes and `where.tenantId` on reads for an explicit allowlist of models.
3. **Tenant-allowlist guard.** `scripts/check-tenant-allowlist.ts` runs in CI and fails the build if a tenant-scoped Prisma model is missing from the allowlist — preventing accidental cross-tenant leaks from new models.

**Prisma extension (PostgreSQL):**

```typescript
export function prismaWithTenant(tenantId: string) {
  return prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        if (!model || !TENANT_SCOPED_MODELS.includes(model)) return query(args);
        if (operation === "create" || operation === "createMany") {
          // Inject tenantId on writes.
          (args.data as Record<string, unknown>).tenantId = tenantId;
        } else if (READ_OR_MUTATE_OPS.has(operation)) {
          // Constrain reads/updates/deletes by tenantId.
          (args.where as Record<string, unknown>).tenantId = tenantId;
        }
        return query(args);
      },
    },
  });
}
```

**Mongoose hooks (MongoDB):**

```typescript
schema.pre(/^find/, function () {
  this.where({ tenantId: getRequestContext().tenantId });
});

schema.pre("save", function () {
  this.tenantId = getRequestContext().tenantId;
});
```

> **Note (2026-05):** The historical `organizationId` column was renamed to `tenantId` and the `Organization` model became `Tenant`. The semantics did not change — the term "tenant" was adopted to match how the rest of the industry describes the SaaS isolation boundary (ISO/IEC 27017 §7.1, NIST SP 800-210). See [schema-design-intent.md](./schema-design-intent.md) for the column-to-standard mapping rationale.

## Split Schema Approach (Prisma)

Both the API and Collector use a split schema approach where models are defined in separate `.prisma` files and combined via a build script before generation.

```
prisma/
├── base.prisma          # datasource + generator config
├── schema/
│   ├── tenant.prisma
│   ├── user.prisma
│   ├── framework.prisma
│   ├── control.prisma
│   └── ...
└── schema.prisma        # generated (combined output)
```

The combine script concatenates all `.prisma` files into a single `schema.prisma` before running `prisma generate` or `prisma migrate`.

---

## API PostgreSQL Models

### Tenant & Users

**Tenant** — the SaaS isolation boundary. Every other tenant-scoped model references this table via `tenantId`. The shape intentionally stays minimal: display fields and customer-specific settings live in `TenantSettings` so the row stays cheap to read on every authenticated request.

| Field     | Type     | Notes                                         |
| --------- | -------- | --------------------------------------------- |
| id        | UUID     | Primary key                                   |
| name      | String   | Display name                                  |
| slug      | String   | Unique, URL-safe identifier                   |
| domain    | String?  | Email domain for SSO matching                 |
| plan      | Enum     | free, pro, enterprise (commercial plan)       |
| status    | Enum     | active, suspended, archived                   |
| industry  | String?  | Free-text; used for benchmarks and AI prompts |
| createdAt | DateTime |                                               |
| updatedAt | DateTime |                                               |

**User**

| Field        | Type      | Notes       |
| ------------ | --------- | ----------- |
| id           | UUID      | Primary key |
| email        | String    | Unique      |
| name         | String    |             |
| passwordHash | String    |             |
| avatarUrl    | String?   |             |
| lastLoginAt  | DateTime? |             |
| createdAt    | DateTime  |             |
| updatedAt    | DateTime  |             |

**Person** (replaced the old `Membership` model — see [`people.md`](people.md) for the full HR model)

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID | Primary key |
| tenantId | UUID | FK -> Tenant |
| userId | UUID? | FK -> User (null for people without a login) |
| email | String | Unique per tenant |
| fullName | String | Denormalised so login-less people work |
| role | Enum | PersonRole: `member` (default), owner, admin, compliance_manager, auditor, viewer, integration_admin, dpo |
| permissions | String[] | Resource-scoped overrides; take precedence over the role's defaults |
| status | Enum | PersonStatus: invited, active, suspended, offboarded |
| kind | Enum | employee, contractor, vendor_contact, service_account, other |
| source | Enum | manual, invite, directory_sync, self_register |
| managerId | UUID? | Self-FK (org hierarchy) |
| vendorId | UUID? | FK -> Vendor (vendor-contact-as-Person) |
| createdAt | DateTime |  |
| updatedAt | DateTime |  |

> HR attributes (jobTitle, department, employmentType, location, startDate/endDate) and sub-resources (background checks, onboarding/offboarding checklist, device/asset associations) are documented in [`people.md`](people.md).

**DirectorySyncConfig**

| Field                | Type      | Notes                                                      |
| -------------------- | --------- | ---------------------------------------------------------- |
| id                   | UUID      | Primary key                                                |
| tenantId             | UUID      | FK -> Tenant                                               |
| provider             | Enum      | entra, google_workspace                                    |
| isEnabled            | Boolean   | Scheduler considers config when true                       |
| syncFrequencyMinutes | Int       | Allowed values: 1440 (24h), 10080 (7d)                     |
| defaultRole          | Enum      | PersonRole fallback when no group mapping matches          |
| defaultStatus        | Enum      | invited, active                                            |
| groupRoleMappings    | JSON?     | Optional provider group -> Trustalo role mappings          |
| encryptedCredentials | Text      | AES-256-GCM envelope from `crypto-envelope.ts` (`enc:v1:`) |
| lastSyncAt           | DateTime? | Last completed run timestamp                               |
| lastSyncStatus       | Enum?     | pending, running, succeeded, failed, cancelled             |
| lastSyncError        | String?   | Last failure message                                       |
| createdAt            | DateTime  |                                                            |
| updatedAt            | DateTime  |                                                            |

**DirectorySyncRun**

| Field           | Type      | Notes                                          |
| --------------- | --------- | ---------------------------------------------- |
| id              | UUID      | Primary key                                    |
| tenantId        | UUID      | FK -> Tenant                                   |
| configId        | UUID      | FK -> DirectorySyncConfig                      |
| provider        | Enum      | entra, google_workspace                        |
| status          | Enum      | pending, running, succeeded, failed, cancelled |
| triggeredBy     | Enum      | schedule, manual                               |
| startedAt       | DateTime? |                                                |
| finishedAt      | DateTime? |                                                |
| usersDiscovered | Int       | Total users fetched from provider in this run  |
| usersCreated    | Int       | New `User` rows created                        |
| usersUpdated    | Int       | People updated/upserted                        |
| usersSuspended  | Int       | People suspended because user disappeared      |
| errorMessage    | String?   | Failure details for UI history                 |
| createdAt       | DateTime  |                                                |
| updatedAt       | DateTime  |                                                |

**ExternalIdentityMapping**

| Field               | Type     | Notes                                             |
| ------------------- | -------- | ------------------------------------------------- |
| id                  | UUID     | Primary key                                       |
| tenantId            | UUID     | FK -> Tenant                                      |
| configId            | UUID     | FK -> DirectorySyncConfig                         |
| provider            | Enum     | entra, google_workspace                           |
| externalId          | String   | Stable directory object ID                        |
| userId              | UUID     | FK -> User                                        |
| externalEmail       | String   | Last email seen from directory                    |
| externalDisplayName | String?  | Last display name seen from directory             |
| externalGroupIds    | String[] | Groups seen for role-mapping resolution           |
| lastSeenAt          | DateTime | Used to detect stale users and suspend membership |
| createdAt           | DateTime |                                                   |
| updatedAt           | DateTime |                                                   |

### Compliance Frameworks

**Framework**

| Field             | Type   | Notes                     |
| ----------------- | ------ | ------------------------- |
| id                | UUID   | Primary key               |
| name              | String | e.g., "ISO 27001:2022"    |
| slug              | String | Unique identifier         |
| version           | String |                           |
| description       | String |                           |
| totalRequirements | Int    |                           |
| metadata          | JSON   | Framework-specific config |

**FrameworkInstance**

| Field         | Type      | Notes                                                |
| ------------- | --------- | ---------------------------------------------------- |
| id            | UUID      | Primary key                                          |
| tenantId      | UUID      | FK -> Tenant                                         |
| frameworkId   | UUID      | FK -> Framework                                      |
| status        | Enum      | not_started, in_progress, ready_for_audit, certified |
| scope         | String?   | ISMS scope statement                                 |
| startDate     | DateTime? |                                                      |
| targetDate    | DateTime? |                                                      |
| certifiedDate | DateTime? |                                                      |
| createdAt     | DateTime  |                                                      |

**Requirement**

| Field       | Type   | Notes                        |
| ----------- | ------ | ---------------------------- |
| id          | UUID   | Primary key                  |
| frameworkId | UUID   | FK -> Framework              |
| code        | String | e.g., "A.5.1"                |
| title       | String |                              |
| description | String |                              |
| category    | String | Theme/section grouping       |
| parentId    | UUID?  | Self-reference for hierarchy |

**ControlRequirementAssignment**

| Field               | Type    | Notes                      |
| ------------------- | ------- | -------------------------- |
| id                  | UUID    | Primary key                |
| tenantId            | UUID    | FK -> Tenant               |
| requirementId       | UUID    | FK -> Requirement          |
| controlId           | UUID    | FK -> Control              |
| frameworkInstanceId | UUID    | FK -> FrameworkInstance    |
| status              | String? | Optional assignment status |

### Controls

**Control**

| Field                | Type      | Notes                                                 |
| -------------------- | --------- | ----------------------------------------------------- |
| id                   | UUID      | Primary key                                           |
| tenantId             | UUID      | FK -> Tenant                                          |
| code                 | String    | Internal control identifier                           |
| title                | String    |                                                       |
| description          | String    |                                                       |
| implementationStatus | Enum      | not_implemented, partial, implemented, not_applicable |
| ownerId              | UUID?     | FK -> User                                            |
| evidenceFrequency    | Enum      | one_time, monthly, quarterly, annually                |
| lastEvidenceDate     | DateTime? |                                                       |
| createdAt            | DateTime  |                                                       |
| updatedAt            | DateTime  |                                                       |

### Policies

**Policy**

| Field          | Type      | Notes                                |
| -------------- | --------- | ------------------------------------ |
| id             | UUID      | Primary key                          |
| tenantId       | UUID      | FK -> Tenant                         |
| title          | String    |                                      |
| status         | Enum      | draft, in_review, approved, archived |
| ownerId        | UUID      | FK -> User                           |
| approvedById   | UUID?     | FK -> User                           |
| approvedAt     | DateTime? |                                      |
| nextReviewDate | DateTime? |                                      |
| createdAt      | DateTime  |                                      |
| updatedAt      | DateTime  |                                      |

**PolicyVersion**

| Field       | Type     | Notes                         |
| ----------- | -------- | ----------------------------- |
| id          | UUID     | Primary key                   |
| policyId    | UUID     | FK -> Policy                  |
| version     | Int      | Auto-incrementing             |
| content     | Text     | Markdown content              |
| fileUrl     | String?  | S3 key for uploaded documents |
| changelog   | String?  |                               |
| createdById | UUID     | FK -> User                    |
| createdAt   | DateTime |                               |

**PolicyAcknowledgment**

| Field           | Type     | Notes               |
| --------------- | -------- | ------------------- |
| id              | UUID     | Primary key         |
| policyId        | UUID     | FK -> Policy        |
| policyVersionId | UUID     | FK -> PolicyVersion |
| userId          | UUID     | FK -> User          |
| acknowledgedAt  | DateTime |                     |
| ipAddress       | String?  |                     |

### Risk Management

**Risk**

| Field       | Type     | Notes                                                    |
| ----------- | -------- | -------------------------------------------------------- |
| id          | UUID     | Primary key                                              |
| tenantId    | UUID     | FK -> Tenant                                             |
| title       | String   |                                                          |
| description | String   |                                                          |
| category    | Enum     | operational, technical, compliance, strategic, financial |
| likelihood  | Int      | 1-5 scale                                                |
| impact      | Int      | 1-5 scale                                                |
| riskScore   | Int      | Computed: likelihood \* impact                           |
| status      | Enum     | identified, assessed, treated, accepted, closed          |
| ownerId     | UUID?    | FK -> User                                               |
| createdAt   | DateTime |                                                          |
| updatedAt   | DateTime |                                                          |

**RiskAssessment**

| Field          | Type     | Notes                         |
| -------------- | -------- | ----------------------------- |
| id             | UUID     | Primary key                   |
| tenantId       | UUID     | FK -> Tenant                  |
| title          | String   |                               |
| assessmentDate | DateTime |                               |
| methodology    | String   | e.g., "Qualitative 5x5"       |
| status         | Enum     | draft, in_progress, completed |
| conductedById  | UUID     | FK -> User                    |
| createdAt      | DateTime |                               |

**RiskTreatment**

| Field         | Type      | Notes                             |
| ------------- | --------- | --------------------------------- |
| id            | UUID      | Primary key                       |
| riskId        | UUID      | FK -> Risk                        |
| treatmentType | Enum      | mitigate, transfer, avoid, accept |
| description   | String    |                                   |
| controlId     | UUID?     | FK -> Control (if mitigating)     |
| status        | Enum      | planned, in_progress, completed   |
| dueDate       | DateTime? |                                   |
| createdAt     | DateTime  |                                   |

### Vendor Management

**Vendor**

| Field         | Type     | Notes                            |
| ------------- | -------- | -------------------------------- |
| id            | UUID     | Primary key                      |
| tenantId      | UUID     | FK -> Tenant                     |
| name          | String   |                                  |
| category      | String   | e.g., "Cloud Infrastructure"     |
| riskTier      | Enum     | critical, high, medium, low      |
| status        | Enum     | active, under_review, offboarded |
| website       | String?  |                                  |
| dataProcessed | JSON?    | Types of data shared             |
| createdAt     | DateTime |                                  |
| updatedAt     | DateTime |                                  |

**VendorAssessment**

| Field          | Type      | Notes                           |
| -------------- | --------- | ------------------------------- |
| id             | UUID      | Primary key                     |
| vendorId       | UUID      | FK -> Vendor                    |
| assessmentDate | DateTime  |                                 |
| score          | Int?      | Assessment score                |
| status         | Enum      | pending, in_progress, completed |
| findings       | JSON      | Assessment results              |
| nextReviewDate | DateTime? |                                 |
| conductedById  | UUID      | FK -> User                      |
| createdAt      | DateTime  |                                 |

**VendorContact**

| Field     | Type    | Notes        |
| --------- | ------- | ------------ |
| id        | UUID    | Primary key  |
| vendorId  | UUID    | FK -> Vendor |
| name      | String  |              |
| email     | String  |              |
| role      | String  |              |
| isPrimary | Boolean |              |

### Asset Management

**Asset**

| Field          | Type     | Notes                                        |
| -------------- | -------- | -------------------------------------------- |
| id             | UUID     | Primary key                                  |
| tenantId       | UUID     | FK -> Tenant                                 |
| name           | String   |                                              |
| type           | Enum     | hardware, software, data, service, personnel |
| classification | Enum     | public, internal, confidential, restricted   |
| ownerId        | UUID?    | FK -> User                                   |
| status         | Enum     | active, decommissioned                       |
| metadata       | JSON     | Type-specific attributes                     |
| createdAt      | DateTime |                                              |
| updatedAt      | DateTime |                                              |

### Incident Management

**Incident**

| Field        | Type      | Notes                                                |
| ------------ | --------- | ---------------------------------------------------- |
| id           | UUID      | Primary key                                          |
| tenantId     | UUID      | FK -> Tenant                                         |
| title        | String    |                                                      |
| description  | String    |                                                      |
| severity     | Enum      | critical, high, medium, low                          |
| status       | Enum      | reported, investigating, contained, resolved, closed |
| reportedById | UUID      | FK -> User                                           |
| assignedToId | UUID?     | FK -> User                                           |
| reportedAt   | DateTime  |                                                      |
| resolvedAt   | DateTime? |                                                      |
| rootCause    | String?   |                                                      |
| createdAt    | DateTime  |                                                      |
| updatedAt    | DateTime  |                                                      |

**IncidentTimeline**

| Field         | Type     | Notes                       |
| ------------- | -------- | --------------------------- |
| id            | UUID     | Primary key                 |
| incidentId    | UUID     | FK -> Incident              |
| action        | String   | Description of action taken |
| performedById | UUID     | FK -> User                  |
| timestamp     | DateTime |                             |

### Audit Management

**Audit**

| Field               | Type      | Notes                                      |
| ------------------- | --------- | ------------------------------------------ |
| id                  | UUID      | Primary key                                |
| tenantId            | UUID      | FK -> Tenant                               |
| title               | String    |                                            |
| type                | Enum      | internal, external                         |
| frameworkInstanceId | UUID?     | FK -> FrameworkInstance                    |
| status              | Enum      | planned, in_progress, completed, cancelled |
| leadAuditorId       | UUID?     | FK -> User                                 |
| startDate           | DateTime  |                                            |
| endDate             | DateTime? |                                            |
| summary             | String?   |                                            |
| createdAt           | DateTime  |                                            |

**AuditFinding**

| Field          | Type      | Notes                                                              |
| -------------- | --------- | ------------------------------------------------------------------ |
| id             | UUID      | Primary key                                                        |
| auditId        | UUID      | FK -> Audit                                                        |
| controlId      | UUID?     | FK -> Control                                                      |
| type           | Enum      | nonconformity_major, nonconformity_minor, observation, opportunity |
| description    | String    |                                                                    |
| recommendation | String?   |                                                                    |
| status         | Enum      | open, in_remediation, closed                                       |
| dueDate        | DateTime? |                                                                    |
| createdAt      | DateTime  |                                                                    |

### Business Continuity

**BusinessContinuityPlan**

| Field          | Type      | Notes                             |
| -------------- | --------- | --------------------------------- |
| id             | UUID      | Primary key                       |
| tenantId       | UUID      | FK -> Tenant                      |
| title          | String    |                                   |
| type           | Enum      | bcp, drp                          |
| status         | Enum      | draft, approved, active, archived |
| version        | Int       |                                   |
| content        | Text      |                                   |
| ownerId        | UUID      | FK -> User                        |
| lastTestedAt   | DateTime? |                                   |
| nextReviewDate | DateTime? |                                   |
| createdAt      | DateTime  |                                   |
| updatedAt      | DateTime  |                                   |

**BusinessImpactAnalysis**

| Field           | Type     | Notes                       |
| --------------- | -------- | --------------------------- |
| id              | UUID     | Primary key                 |
| tenantId        | UUID     | FK -> Tenant                |
| processName     | String   |                             |
| criticality     | Enum     | critical, high, medium, low |
| rto             | Int      | Minutes                     |
| rpo             | Int      | Minutes                     |
| dependencies    | JSON     | Upstream/downstream systems |
| financialImpact | JSON?    | Impact per time period      |
| createdAt       | DateTime |                             |
| updatedAt       | DateTime |                             |

**BCPExercise**

| Field         | Type      | Notes                                   |
| ------------- | --------- | --------------------------------------- |
| id            | UUID      | Primary key                             |
| tenantId      | UUID      | FK -> Tenant                            |
| planId        | UUID      | FK -> BusinessContinuityPlan            |
| type          | Enum      | tabletop, walkthrough, simulation, full |
| scheduledDate | DateTime  |                                         |
| conductedDate | DateTime? |                                         |
| status        | Enum      | scheduled, completed, cancelled         |
| findings      | JSON?     | Lessons learned                         |
| actualRto     | Int?      | Measured RTO in minutes                 |
| actualRpo     | Int?      | Measured RPO in minutes                 |
| createdAt     | DateTime  |                                         |

### AI Governance

**AISystem**

| Field       | Type      | Notes                                          |
| ----------- | --------- | ---------------------------------------------- |
| id          | UUID      | Primary key                                    |
| tenantId    | UUID      | FK -> Tenant                                   |
| name        | String    |                                                |
| description | String    |                                                |
| type        | Enum      | ml_model, generative_ai, rule_based, hybrid    |
| riskLevel   | Enum      | unacceptable, high, limited, minimal           |
| status      | Enum      | development, testing, deployed, decommissioned |
| purpose     | String    |                                                |
| dataInputs  | JSON      | Data sources and types                         |
| ownerId     | UUID      | FK -> User                                     |
| deployedAt  | DateTime? |                                                |
| createdAt   | DateTime  |                                                |
| updatedAt   | DateTime  |                                                |

**AIRiskAssessment**

| Field            | Type     | Notes                     |
| ---------------- | -------- | ------------------------- |
| id               | UUID     | Primary key               |
| aiSystemId       | UUID     | FK -> AISystem            |
| assessmentDate   | DateTime |                           |
| biasRisk         | JSON     | Bias evaluation results   |
| privacyRisk      | JSON     | Privacy impact evaluation |
| safetyRisk       | JSON     | Safety evaluation results |
| transparencyRisk | JSON     | Explainability assessment |
| overallRiskScore | Int      | Composite risk score      |
| mitigations      | JSON     | Proposed mitigations      |
| conductedById    | UUID     | FK -> User                |
| createdAt        | DateTime |                           |

**AIImpactAssessment**

| Field               | Type     | Notes                                    |
| ------------------- | -------- | ---------------------------------------- |
| id                  | UUID     | Primary key                              |
| aiSystemId          | UUID     | FK -> AISystem                           |
| stakeholders        | JSON     | Affected groups                          |
| humanRightsImpact   | JSON     | Rights impact evaluation                 |
| environmentalImpact | JSON     | Environmental considerations             |
| societalImpact      | JSON     | Broader societal effects                 |
| ethicalReviewStatus | Enum     | pending, approved, rejected, conditional |
| reviewedById        | UUID?    | FK -> User                               |
| createdAt           | DateTime |                                          |

### Tasks & Evidence

**Task**

| Field       | Type      | Notes                                 |
| ----------- | --------- | ------------------------------------- |
| id          | UUID      | Primary key                           |
| tenantId    | UUID      | FK -> Tenant                          |
| title       | String    |                                       |
| description | String?   |                                       |
| controlId   | UUID?     | FK -> Control                         |
| assigneeId  | UUID?     | FK -> User                            |
| status      | Enum      | open, in_progress, completed, overdue |
| priority    | Enum      | critical, high, medium, low           |
| dueDate     | DateTime? |                                       |
| completedAt | DateTime? |                                       |
| createdAt   | DateTime  |                                       |
| updatedAt   | DateTime  |                                       |

**TaskEvidence**

| Field            | Type     | Notes                                  |
| ---------------- | -------- | -------------------------------------- |
| id               | UUID     | Primary key                            |
| taskId           | UUID     | FK -> Task                             |
| controlId        | UUID     | FK -> Control                          |
| type             | Enum     | file, screenshot, log, automated, link |
| fileUrl          | String?  | S3 key                                 |
| externalUrl      | String?  | External link                          |
| description      | String?  |                                        |
| collectedAt      | DateTime |                                        |
| source           | Enum     | manual, integration                    |
| integrationJobId | String?  | Reference to collector job             |
| createdAt        | DateTime |                                        |

### Training

**TrainingProgram**

| Field            | Type     | Notes                                                     |
| ---------------- | -------- | --------------------------------------------------------- |
| id               | UUID     | Primary key                                               |
| tenantId         | UUID     | FK -> Tenant                                              |
| title            | String   |                                                           |
| description      | String   |                                                           |
| type             | Enum     | security_awareness, compliance, role_specific, onboarding |
| frequency        | Enum     | one_time, quarterly, annually                             |
| content          | Text?    | Training material                                         |
| externalUrl      | String?  | Link to external LMS                                      |
| requiredForRoles | JSON     | Which roles must complete                                 |
| createdAt        | DateTime |                                                           |
| updatedAt        | DateTime |                                                           |

**TrainingCompletion**

| Field          | Type     | Notes                          |
| -------------- | -------- | ------------------------------ |
| id             | UUID     | Primary key                    |
| programId      | UUID     | FK -> TrainingProgram          |
| userId         | UUID     | FK -> User                     |
| completedAt    | DateTime |                                |
| score          | Int?     | Assessment score if applicable |
| certificateUrl | String?  | S3 key for certificate         |

### Trust Center

**TrustCenterConfig**

| Field        | Type     | Notes                     |
| ------------ | -------- | ------------------------- |
| id           | UUID     | Primary key               |
| tenantId     | UUID     | FK -> Tenant (unique)     |
| enabled      | Boolean  |                           |
| customDomain | String?  |                           |
| logoUrl      | String?  |                           |
| primaryColor | String?  |                           |
| description  | String?  | Public-facing description |
| contactEmail | String?  |                           |
| settings     | JSON     | Display preferences       |
| createdAt    | DateTime |                           |
| updatedAt    | DateTime |                           |

**TrustResource**

| Field        | Type     | Notes                              |
| ------------ | -------- | ---------------------------------- |
| id           | UUID     | Primary key                        |
| tenantId     | UUID     | FK -> Tenant                       |
| title        | String   |                                    |
| type         | Enum     | certification, policy, report, faq |
| visibility   | Enum     | public, nda_required               |
| fileUrl      | String?  | S3 key                             |
| externalUrl  | String?  |                                    |
| displayOrder | Int      |                                    |
| createdAt    | DateTime |                                    |
| updatedAt    | DateTime |                                    |

---

## Collector PostgreSQL Models

**Integration**

| Field        | Type    | Notes                          |
| ------------ | ------- | ------------------------------ |
| id           | UUID    | Primary key                    |
| slug         | String  | Unique (e.g., "aws", "github") |
| name         | String  |                                |
| description  | String  |                                |
| category     | String  | e.g., "cloud", "devops"        |
| logoUrl      | String? |                                |
| configSchema | JSON    | Required fields for connection |
| capabilities | JSON    | List of evidence types         |
| isActive     | Boolean |                                |

**IntegrationConnection**

| Field                | Type      | Notes                                                   |
| -------------------- | --------- | ------------------------------------------------------- |
| id                   | UUID      | Primary key                                             |
| tenantId             | UUID      | Tenant isolation                                        |
| integrationId        | String    | FK -> Integration (slug, e.g. `"github"`, `"aws"`)      |
| name                 | String    | User-defined label                                      |
| status               | Enum      | connected, disconnected, error, syncing, pending_auth   |
| config               | JSON      | Non-sensitive configuration                             |
| syncFrequencyMinutes | Int       | Cadence in minutes                                      |
| lastSyncAt           | DateTime? |                                                         |
| lastErrorMessage     | String?   | Most recent failure reason                              |
| secretId             | UUID?     | FK -> SecretVault. Null until credentials are provided. |
| isActive             | Boolean   | Soft-disable flag (paused without losing config)        |
| createdAt            | DateTime  |                                                         |
| updatedAt            | DateTime  |                                                         |

**SecretVault** — credentials store decoupled from the connection table so the row carrying the AES-GCM ciphertext can have a tighter access policy than the connection metadata it secures.

| Field       | Type      | Notes                                            |
| ----------- | --------- | ------------------------------------------------ |
| id          | UUID      | Primary key                                      |
| tenantId    | UUID      | Tenant isolation                                 |
| name        | String    | Logical label (e.g. `"github-prod"`)             |
| ciphertext  | String    | AES-256-GCM ciphertext (base64)                  |
| iv          | String    | 12-byte IV (base64)                              |
| authTag     | String    | 16-byte GCM tag (base64)                         |
| keyVersion  | Int       | Envelope-key generation, supports rotation       |
| algorithm   | String    | Always `"aes-256-gcm"` on write; read-only field |
| createdById | UUID?     | Actor that originally wrote the secret           |
| rotatedAt   | DateTime? | Last rotation timestamp                          |
| createdAt   | DateTime  |                                                  |
| updatedAt   | DateTime  |                                                  |

**CollectionJob**

| Field        | Type      | Notes                               |
| ------------ | --------- | ----------------------------------- |
| id           | UUID      | Primary key                         |
| connectionId | UUID      | FK -> IntegrationConnection         |
| tenantId     | UUID      | Tenant isolation                    |
| status       | Enum      | pending, running, completed, failed |
| triggeredBy  | Enum      | scheduler, manual                   |
| startedAt    | DateTime? |                                     |
| completedAt  | DateTime? |                                     |
| createdAt    | DateTime  |                                     |

**CollectionJobRun**

| Field          | Type     | Notes                    |
| -------------- | -------- | ------------------------ |
| id             | UUID     | Primary key              |
| jobId          | UUID     | FK -> CollectionJob      |
| capability     | String   | Specific evidence type   |
| status         | Enum     | success, failed, skipped |
| itemsCollected | Int      |                          |
| error          | String?  |                          |
| durationMs     | Int      |                          |
| createdAt      | DateTime |                          |

**CollectionRetry**

| Field     | Type     | Notes                  |
| --------- | -------- | ---------------------- |
| id        | UUID     | Primary key            |
| jobRunId  | UUID     | FK -> CollectionJobRun |
| attempt   | Int      |                        |
| error     | String   |                        |
| retryAt   | DateTime |                        |
| createdAt | DateTime |                        |

**SyncLog**

| Field        | Type     | Notes                       |
| ------------ | -------- | --------------------------- |
| id           | UUID     | Primary key                 |
| connectionId | UUID     | FK -> IntegrationConnection |
| tenantId     | UUID     | Tenant isolation            |
| action       | String   | e.g., "collect", "test"     |
| status       | Enum     | success, failed             |
| details      | JSON?    | Diagnostic information      |
| createdAt    | DateTime |                             |

---

## MongoDB Collections

All MongoDB documents include `tenantId` for tenant isolation.

**EvidenceDocument**

| Field       | Type     | Notes                               |
| ----------- | -------- | ----------------------------------- |
| \_id        | ObjectId | Primary key                         |
| tenantId    | String   | Tenant isolation                    |
| controlId   | String   | Reference to API control            |
| type        | String   | file, log, config, screenshot       |
| source      | String   | manual, aws, github, etc.           |
| content     | Mixed    | Flexible evidence payload           |
| fileUrl     | String?  | S3 key for binary evidence          |
| metadata    | Object   | Source-specific metadata            |
| collectedAt | Date     |                                     |
| expiresAt   | Date?    | Auto-expiry for time-bound evidence |
| createdAt   | Date     |                                     |

**AuditLog**

| Field      | Type     | Notes                   |
| ---------- | -------- | ----------------------- |
| \_id       | ObjectId | Primary key             |
| tenantId   | String   | Tenant isolation        |
| userId     | String   | Actor                   |
| action     | String   | e.g., "policy.approved" |
| resource   | String   | Resource type           |
| resourceId | String   | Target resource ID      |
| changes    | Object?  | Before/after diff       |
| ipAddress  | String   |                         |
| userAgent  | String   |                         |
| timestamp  | Date     |                         |

**ComplianceSnapshot**

| Field               | Type     | Notes                           |
| ------------------- | -------- | ------------------------------- |
| \_id                | ObjectId | Primary key                     |
| tenantId            | String   | Tenant isolation                |
| frameworkInstanceId | String   | Reference to framework instance |
| snapshotDate        | Date     |                                 |
| overallScore        | Number   | Percentage complete             |
| controlStats        | Object   | Counts by implementation status |
| requirementStats    | Object   | Counts by satisfaction status   |
| riskStats           | Object   | Counts by risk level            |
| createdAt           | Date     |                                 |

**QuestionnaireResponse**

| Field        | Type     | Notes                      |
| ------------ | -------- | -------------------------- |
| \_id         | ObjectId | Primary key                |
| tenantId     | String   | Tenant isolation           |
| vendorId     | String?  | For vendor assessments     |
| templateId   | String   |                            |
| respondentId | String   |                            |
| responses    | Array    | Question-answer pairs      |
| status       | String   | draft, submitted, reviewed |
| submittedAt  | Date?    |                            |
| createdAt    | Date     |                            |

**SecurityFinding**

| Field       | Type     | Notes                                 |
| ----------- | -------- | ------------------------------------- |
| \_id        | ObjectId | Primary key                           |
| tenantId    | String   | Tenant isolation                      |
| source      | String   | Integration or scanner name           |
| severity    | String   | critical, high, medium, low           |
| title       | String   |                                       |
| description | String   |                                       |
| resource    | Object   | Affected resource details             |
| controlIds  | Array    | Mapped control references             |
| status      | String   | open, in_progress, resolved, accepted |
| detectedAt  | Date     |                                       |
| resolvedAt  | Date?    |                                       |
| createdAt   | Date     |                                       |
