# API Reference

Trustalo exposes two HTTP services: the main **API** (port 15002) for compliance operations and the **Collector** (port 15003) for integration management. (A third app, the Go endpoint **device agent**, is an API _client_ — its device-facing endpoints are documented under [Devices](#devices) and [Auth](#auth), not a separate service.)

## Common Patterns

### Authentication

All endpoints under `/api/v1/*` except the auth router require a valid JWT. The token can be presented either as a Bearer header or as an `HttpOnly` session cookie issued at login:

```
Authorization: Bearer <jwt_token>
```

The JWT payload includes:

```json
{
  "sub": "user-uuid",
  "orgId": "org-uuid",
  "role": "compliance_manager",
  "permissions": ["frameworks:read", "controls:write", "policies:write"],
  "iat": 1700000000,
  "exp": 1700086400
}
```

See [`auth-providers.md`](auth-providers.md) for the cookie/Bearer flow and the pluggable provider contract.

### Pagination

List endpoints support pagination via query parameters:

| Parameter   | Type   | Default | Description                     |
| ----------- | ------ | ------- | ------------------------------- |
| `page`      | number | 1       | Page number (1-indexed)         |
| `limit`     | number | 20      | Items per page (max 100)        |
| `sortBy`    | string | varies  | Field to sort by                |
| `sortOrder` | string | `desc`  | Sort direction: `asc` or `desc` |

Paginated response envelope:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "title", "message": "Title is required" }]
  }
}
```

Standard error codes:

| HTTP Status | Code               | Description                           |
| ----------- | ------------------ | ------------------------------------- |
| 400         | `VALIDATION_ERROR` | Invalid request body or parameters    |
| 401         | `UNAUTHORIZED`     | Missing or invalid token              |
| 403         | `FORBIDDEN`        | Insufficient permissions              |
| 404         | `NOT_FOUND`        | Resource not found                    |
| 409         | `CONFLICT`         | Resource conflict (e.g., duplicate)   |
| 422         | `UNPROCESSABLE`    | Valid request but business rule error |
| 429         | `RATE_LIMITED`     | Too many requests                     |
| 500         | `INTERNAL_ERROR`   | Unexpected server error               |

### Tenant Context

All requests are scoped to the authenticated user's organization. The `tenantId` is extracted from the JWT and applied automatically. Clients never need to pass it explicitly.

---

## API Service (Port 15002)

Base URL: `http://localhost:15002`. Every business endpoint is mounted under `/api/v1`; auth lives at `/api/v1/auth/*`. The paths below all show the path that follows the base URL.

### Auth

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | No | Register new user + org |
| POST | `/api/v1/auth/login` | No | Login, returns JWT |
| POST | `/api/v1/auth/refresh` | Yes | Refresh access token |
| POST | `/api/v1/auth/logout` | Yes | Invalidate refresh token |
| GET | `/api/v1/auth/me` | Yes | Get current user profile |
| PATCH | `/api/v1/auth/me` | Yes | Update current user profile |
| POST | `/api/v1/auth/change-password` | Yes | Change password |
| GET | `/api/v1/auth/config` | No | Active auth provider config |
| POST | `/api/v1/auth/device/authorize` | Yes | Device-agent consent step — issues a one-time PKCE-bound code (called by the web `/device/authorize` page) |
| POST | `/api/v1/auth/device/token` | No (PKCE) | Exchange the device code + PKCE verifier for a device JWT |

For brevity, the remaining tables omit the `/api/v1` prefix — every endpoint in this document is mounted there.

**POST /api/v1/auth/login** -- Example:

```json
// Request
{
  "email": "user@company.com",
  "password": "securepassword"
}

// Response 200
{
  "accessToken": "<JWT_ACCESS_TOKEN>",
  "refreshToken": "<JWT_REFRESH_TOKEN>",
  "user": {
    "id": "uuid",
    "email": "user@company.com",
    "name": "Jane Smith"
  },
  "organization": {
    "id": "uuid",
    "name": "Acme Corp",
    "slug": "acme-corp"
  }
}
```

### Frameworks

| Method | Endpoint                                  | Description                                |
| ------ | ----------------------------------------- | ------------------------------------------ |
| GET    | `/frameworks`                             | List available frameworks                  |
| GET    | `/frameworks/:id`                         | Get framework details                      |
| GET    | `/frameworks/:id/requirements`            | List framework requirements                |
| POST   | `/framework-instances`                    | Activate a framework for the org           |
| GET    | `/framework-instances`                    | List activated framework instances         |
| GET    | `/framework-instances/:id`                | Get instance with progress stats           |
| PATCH  | `/framework-instances/:id`                | Update scope, target date, status          |
| GET    | `/framework-instances/:id/gap-analysis`   | Get gap analysis report                    |
| GET    | `/frameworks/instances/:id/audit-package` | Download the auditor handoff package (ZIP) |

**POST /framework-instances** -- Example:

```json
// Request
{
  "frameworkId": "uuid",
  "scope": "All cloud infrastructure and customer data processing systems",
  "targetDate": "2025-06-01"
}

// Response 201
{
  "data": {
    "id": "uuid",
    "frameworkId": "uuid",
    "framework": { "name": "ISO 27001:2022", "slug": "iso-27001-2022" },
    "status": "not_started",
    "scope": "All cloud infrastructure and customer data processing systems",
    "targetDate": "2025-06-01T00:00:00.000Z",
    "createdAt": "2024-11-01T10:00:00.000Z"
  }
}
```

**GET /frameworks/instances/:id/audit-package** — Auditor handoff package

Streams a ZIP (`Content-Type: application/zip`) bundling everything an external auditor needs for the framework instance:

| Path in ZIP | Contents |
| --- | --- |
| `manifest.json` | Package format version, generated-at, exporting user, organization name, framework name/version, control counts by status, evidence counts, files included/skipped |
| `controls.csv` | One row per mapped requirement: identifier, title, category, control id/title/status, owner, linked evidence ids |
| `soa.csv` | Statement of Applicability: applicability (derived from `not_applicable` control status), justification (control implementation details), implementation status |
| `evidence/index.csv` | All evidence for the instance's controls: id, title, source (`manual` / `hr_advisory` / `integration`), source type, status, created-at, linked requirements, in-zip file name |
| `evidence/files/…` | Stored files for **approved** evidence only. Files over 50 MB — or past the 500 MB package cap — are skipped with a note in `evidence/index.csv` |

Requires the `frameworks:read`, `evidence:read` and `audits:read` permissions (owner, admin, compliance_manager, auditor, viewer, dpo). Each export writes an `AuditPackageExported` entry to the audit log.

### Controls

| Method | Endpoint                     | Description                  |
| ------ | ---------------------------- | ---------------------------- |
| GET    | `/controls`                  | List controls (with filters) |
| POST   | `/controls`                  | Create a control             |
| GET    | `/controls/:id`              | Get control details          |
| PATCH  | `/controls/:id`              | Update control               |
| DELETE | `/controls/:id`              | Delete control               |
| GET    | `/controls/:id/evidence`     | List evidence for a control  |
| POST   | `/controls/:id/evidence`     | Attach evidence to a control |
| GET    | `/controls/:id/requirements` | List mapped requirements     |

Query filters: `status`, `ownerId`, `frameworkInstanceId`, `search`

### Policies

| Method | Endpoint                          | Description                     |
| ------ | --------------------------------- | ------------------------------- |
| GET    | `/policies`                       | List policies                   |
| POST   | `/policies`                       | Create policy                   |
| GET    | `/policies/:id`                   | Get policy with current version |
| PATCH  | `/policies/:id`                   | Update policy metadata          |
| DELETE | `/policies/:id`                   | Archive policy                  |
| POST   | `/policies/:id/versions`          | Create new version              |
| GET    | `/policies/:id/versions`          | List version history            |
| POST   | `/policies/:id/submit-for-review` | Submit for approval             |
| POST   | `/policies/:id/approve`           | Approve policy                  |
| GET    | `/policies/:id/acknowledgments`   | List acknowledgments            |
| POST   | `/policies/:id/acknowledge`       | Record user acknowledgment      |

**POST /policies** -- Example:

```json
// Request
{
  "title": "Information Security Policy",
  "content": "## Purpose\nThis policy establishes...",
  "ownerId": "user-uuid",
  "nextReviewDate": "2025-06-01"
}

// Response 201
{
  "data": {
    "id": "uuid",
    "title": "Information Security Policy",
    "status": "draft",
    "ownerId": "user-uuid",
    "currentVersion": 1,
    "nextReviewDate": "2025-06-01T00:00:00.000Z",
    "createdAt": "2024-11-01T10:00:00.000Z"
  }
}
```

### Risks

| Method | Endpoint                | Description                |
| ------ | ----------------------- | -------------------------- |
| GET    | `/risks`                | List risks                 |
| POST   | `/risks`                | Create risk                |
| GET    | `/risks/:id`            | Get risk details           |
| PATCH  | `/risks/:id`            | Update risk                |
| DELETE | `/risks/:id`            | Delete risk                |
| POST   | `/risks/:id/treatments` | Add treatment plan         |
| GET    | `/risks/:id/treatments` | List treatments for a risk |
| GET    | `/risk-assessments`     | List risk assessments      |
| POST   | `/risk-assessments`     | Create risk assessment     |
| GET    | `/risk-assessments/:id` | Get assessment details     |
| PATCH  | `/risk-assessments/:id` | Update assessment          |

Query filters: `status`, `category`, `ownerId`, `minScore`, `maxScore`

### Evidence

| Method | Endpoint                 | Description                  |
| ------ | ------------------------ | ---------------------------- |
| GET    | `/evidence`              | List all evidence            |
| POST   | `/evidence`              | Upload evidence              |
| GET    | `/evidence/:id`          | Get evidence details         |
| DELETE | `/evidence/:id`          | Delete evidence              |
| POST   | `/evidence/bulk`         | Bulk upload (from collector) |
| GET    | `/evidence/download/:id` | Get signed download URL      |

**POST /evidence** -- multipart/form-data:

| Field         | Type   | Required | Description                 |
| ------------- | ------ | -------- | --------------------------- |
| `file`        | File   | No\*     | Evidence file               |
| `externalUrl` | String | No\*     | External URL                |
| `controlId`   | String | Yes      | Associated control          |
| `type`        | String | Yes      | file, screenshot, log, link |
| `description` | String | No       | Evidence description        |

\*Either `file` or `externalUrl` is required.

### Vendors

| Method | Endpoint                   | Description              |
| ------ | -------------------------- | ------------------------ |
| GET    | `/vendors`                 | List vendors             |
| POST   | `/vendors`                 | Create vendor            |
| GET    | `/vendors/:id`             | Get vendor details       |
| PATCH  | `/vendors/:id`             | Update vendor            |
| DELETE | `/vendors/:id`             | Delete vendor            |
| POST   | `/vendors/:id/assessments` | Create vendor assessment |
| GET    | `/vendors/:id/assessments` | List assessments         |
| GET    | `/vendors/:id/contacts`    | List vendor contacts     |
| POST   | `/vendors/:id/contacts`    | Add vendor contact       |

Query filters: `riskTier`, `status`, `search`

### Assets

| Method | Endpoint      | Description       |
| ------ | ------------- | ----------------- |
| GET    | `/assets`     | List assets       |
| POST   | `/assets`     | Create asset      |
| GET    | `/assets/:id` | Get asset details |
| PATCH  | `/assets/:id` | Update asset      |
| DELETE | `/assets/:id` | Delete asset      |

Query filters: `type`, `classification`, `status`, `ownerId`, `search`

### Devices

Endpoint device-posture agent. Each enrolled device is a Computer-category `Asset` assigned to a `Person`; the management routes are gated by `assets:*` and the fleet view lives under Assets. The agent's own routes authenticate with a per-device HMAC secret (or, for first enrollment, an enrollment token / user JWT). See [`device-agent.md`](device-agent.md).

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/devices/enroll` | any authenticated user | Self-enroll the caller's own machine (resolves caller → Person, links the Computer asset) |
| GET | `/devices` | `assets:read` | List enrolled devices with posture + assigned person |
| GET | `/devices/:id` | `assets:read` | Device detail — full posture, hardware/OS inventory, assigned person |
| GET | `/devices/:id/posture-history` | `assets:read` | Append-only posture snapshots (pruned after 1 day) |
| POST | `/devices/:id/revoke` | `assets:write` | Revoke a device (silences the agent on its next check-in) |
| POST | `/devices/:id/rotate-secret` | `assets:write` | Rotate the device's HMAC secret |
| GET | `/devices/enrollment-tokens` | `assets:read` | List active enrollment tokens |
| POST | `/devices/enrollment-tokens` | `assets:write` | Mint a short-lived, single-use enrollment token (MDM / mass-deploy) |
| DELETE | `/devices/enrollment-tokens/:id` | `assets:write` | Revoke an enrollment token |
| POST | `/devices/agent/enroll` | enrollment token · basic · device JWT | Agent enrollment — returns the per-device HMAC secret |
| POST | `/devices/agent/check-in` | per-device HMAC | Signed posture heartbeat (nonce + timestamp replay defense); returns `nextCheckInSeconds` |

### People

The HR / personnel directory. The `Person` model replaced the historical `Membership`; management surfaces require `people:*`, and the self-service portal requires `self:*` (the default `member` role). See [`people.md`](people.md).

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/people` | `people:read` | List people (filters: `status`, `kind`, `role`, `department`, `search`) |
| GET | `/people/stats` | `people:read` | Directory rollup (status counts, background-check coverage, training/policy compliance, devices-at-risk) |
| POST | `/people` | `people:write` | Create a person (a login-less person is allowed) |
| POST | `/people/invite` | `people:write` | Invite a person (defaults to the `member` role) |
| POST | `/people/from-vendor-contact/:contactId` | `people:write` | Promote a vendor contact into a Person |
| GET | `/people/:id` | `people:read` | Person profile — HR fields, devices, training/policy rollups |
| PATCH | `/people/:id` | `people:write` | Update HR fields (job title, department, manager, dates, …) |
| PATCH | `/people/:id/role` | `people:write` | Change role (owner-protected) |
| POST | `/people/:id/status` | `people:write` | Lifecycle transition (`invited` / `active` / `suspended` / `offboarded`) |
| DELETE | `/people/:id` | `people:write` | Remove a person |
| GET | `/people/:id/background-checks` | `people:read` | Background-check history |
| POST | `/people/:id/background-checks` | `people:write` | Record a background check |
| PATCH | `/people/:id/background-checks/:checkId` | `people:write` | Update a background check |
| GET | `/people/:id/checklist` | `people:read` | Onboarding / offboarding checklist |
| POST | `/people/:id/checklist/seed` | `people:write` | Seed the checklist from the tenant template |
| POST | `/people/:id/checklist/:itemId/complete` | `people:write` | Mark a checklist item done |

**Self-service portal** (`member` role — every read path scopes strictly to the calling person):

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/people/me` | `self:read` | Own profile + devices |
| GET | `/people/me/policies` | `self:read` | Own assigned policies + acknowledgement status |
| POST | `/people/me/policies/:id/acknowledge` | `self:write` | Acknowledge an assigned policy |
| GET | `/people/me/training` | `self:read` | Own assigned training + completion status |
| POST | `/people/me/training/:id/complete` | `self:write` | Complete an assigned training |

### Incidents

| Method | Endpoint                  | Description           |
| ------ | ------------------------- | --------------------- |
| GET    | `/incidents`              | List incidents        |
| POST   | `/incidents`              | Report incident       |
| GET    | `/incidents/:id`          | Get incident details  |
| PATCH  | `/incidents/:id`          | Update incident       |
| GET    | `/incidents/:id/timeline` | Get incident timeline |
| POST   | `/incidents/:id/timeline` | Add timeline entry    |

Query filters: `severity`, `status`, `assignedToId`, `search`

**POST /incidents** -- Example:

```json
// Request
{
  "title": "Unauthorized access attempt detected",
  "description": "Multiple failed login attempts from IP 203.0.113.42",
  "severity": "high"
}

// Response 201
{
  "data": {
    "id": "uuid",
    "title": "Unauthorized access attempt detected",
    "severity": "high",
    "status": "reported",
    "reportedById": "user-uuid",
    "reportedAt": "2024-11-01T10:00:00.000Z",
    "createdAt": "2024-11-01T10:00:00.000Z"
  }
}
```

### Audits

| Method | Endpoint                          | Description         |
| ------ | --------------------------------- | ------------------- |
| GET    | `/audits`                         | List audits         |
| POST   | `/audits`                         | Create audit        |
| GET    | `/audits/:id`                     | Get audit details   |
| PATCH  | `/audits/:id`                     | Update audit        |
| GET    | `/audits/:id/findings`            | List audit findings |
| POST   | `/audits/:id/findings`            | Create finding      |
| PATCH  | `/audits/:id/findings/:findingId` | Update finding      |

Query filters: `type`, `status`, `frameworkInstanceId`

### Business Continuity

| Method | Endpoint                      | Description                   |
| ------ | ----------------------------- | ----------------------------- |
| GET    | `/bcp/plans`                  | List BCP/DRP plans            |
| POST   | `/bcp/plans`                  | Create plan                   |
| GET    | `/bcp/plans/:id`              | Get plan details              |
| PATCH  | `/bcp/plans/:id`              | Update plan                   |
| GET    | `/bcp/bia`                    | List business impact analyses |
| POST   | `/bcp/bia`                    | Create BIA                    |
| GET    | `/bcp/bia/:id`                | Get BIA details               |
| PATCH  | `/bcp/bia/:id`                | Update BIA                    |
| GET    | `/bcp/exercises`              | List exercises                |
| POST   | `/bcp/exercises`              | Schedule exercise             |
| PATCH  | `/bcp/exercises/:id`          | Update exercise               |
| POST   | `/bcp/exercises/:id/complete` | Record exercise completion    |

### AI Governance

| Method | Endpoint                                        | Description               |
| ------ | ----------------------------------------------- | ------------------------- |
| GET    | `/ai-governance/systems`                        | List AI systems           |
| POST   | `/ai-governance/systems`                        | Register AI system        |
| GET    | `/ai-governance/systems/:id`                    | Get AI system details     |
| PATCH  | `/ai-governance/systems/:id`                    | Update AI system          |
| POST   | `/ai-governance/systems/:id/risk-assessments`   | Create AI risk assessment |
| GET    | `/ai-governance/systems/:id/risk-assessments`   | List risk assessments     |
| POST   | `/ai-governance/systems/:id/impact-assessments` | Create impact assessment  |
| GET    | `/ai-governance/systems/:id/impact-assessments` | List impact assessments   |

**POST /ai-governance/systems** -- Example:

```json
// Request
{
  "name": "Customer Support Chatbot",
  "description": "LLM-powered chatbot for customer inquiries",
  "type": "generative_ai",
  "riskLevel": "limited",
  "purpose": "Automate tier-1 customer support responses",
  "dataInputs": {
    "sources": ["customer_messages", "knowledge_base"],
    "piiInvolved": true
  }
}

// Response 201
{
  "data": {
    "id": "uuid",
    "name": "Customer Support Chatbot",
    "type": "generative_ai",
    "riskLevel": "limited",
    "status": "development",
    "createdAt": "2024-11-01T10:00:00.000Z"
  }
}
```

### Training

| Method | Endpoint                             | Description                 |
| ------ | ------------------------------------ | --------------------------- |
| GET    | `/training/programs`                 | List training programs      |
| POST   | `/training/programs`                 | Create program              |
| GET    | `/training/programs/:id`             | Get program details         |
| PATCH  | `/training/programs/:id`             | Update program              |
| DELETE | `/training/programs/:id`             | Delete program              |
| GET    | `/training/programs/:id/completions` | List completions            |
| POST   | `/training/programs/:id/complete`    | Record completion           |
| GET    | `/training/compliance-report`        | Training compliance summary |

### Trust Center

| Method | Endpoint                                   | Description                |
| ------ | ------------------------------------------ | -------------------------- |
| GET    | `/trust-center/config`                     | Get trust center config    |
| PATCH  | `/trust-center/config`                     | Update trust center config |
| GET    | `/trust-center/resources`                  | List trust resources       |
| POST   | `/trust-center/resources`                  | Add trust resource         |
| PATCH  | `/trust-center/resources/:id`              | Update trust resource      |
| DELETE | `/trust-center/resources/:id`              | Remove trust resource      |
| GET    | `/public/trust-center/:slug`               | Public trust center page   |
| GET    | `/public/trust-center/:slug/resources`     | Public resource listing    |
| GET    | `/public/trust-center/:slug/resources/:id` | Request resource access    |

### Dashboards

| Method | Endpoint                            | Description                        |
| ------ | ----------------------------------- | ---------------------------------- |
| GET    | `/dashboards/overview`              | Org-wide compliance overview       |
| GET    | `/dashboards/framework/:instanceId` | Framework-specific dashboard       |
| GET    | `/dashboards/risks`                 | Risk heatmap and statistics        |
| GET    | `/dashboards/tasks`                 | Task status and assignments        |
| GET    | `/dashboards/evidence-health`       | Evidence freshness and gaps        |
| GET    | `/dashboards/timeline`              | Compliance timeline and milestones |

**GET /dashboards/overview** -- Example Response:

```json
{
  "data": {
    "frameworkInstances": [
      {
        "id": "uuid",
        "frameworkName": "ISO 27001:2022",
        "status": "in_progress",
        "completionPercentage": 72,
        "controlsImplemented": 67,
        "controlsTotal": 93,
        "targetDate": "2025-06-01"
      }
    ],
    "riskSummary": {
      "total": 45,
      "bySeverity": { "critical": 2, "high": 8, "medium": 20, "low": 15 }
    },
    "taskSummary": {
      "total": 120,
      "open": 35,
      "inProgress": 28,
      "completed": 52,
      "overdue": 5
    },
    "evidenceHealth": {
      "upToDate": 180,
      "expiringSoon": 12,
      "expired": 3,
      "missing": 8
    },
    "recentActivity": [
      {
        "action": "policy.approved",
        "resource": "Information Security Policy",
        "user": "Jane Smith",
        "timestamp": "2024-11-01T10:00:00.000Z"
      }
    ]
  }
}
```

---

## Collector Service (Port 15003)

Base URL: `http://localhost:15003`. The Collector mounts routes **at the root** — there is no `/api` prefix.

Auth model on the Collector:

- `/health`, `/providers/*`, `/research/health` — no auth. Browsing the catalog is intentionally public.
- `/internal/*` — HMAC service-auth with `X-Organization-Id`. Used by the API for evidence-agent orchestration and by the vendor-research scheduler.
- `/connections`, `/jobs`, `/sync-logs` — JWT + tenant context, same `@trustalo/auth` middleware as the API. Permission checks are `integrations:read` for safe verbs and `integrations:manage` for mutations.

See [`integrations.md`](integrations.md) for the connector model behind these endpoints.

### Providers (catalog)

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/providers` | Flat catalog of active integrations. |
| GET | `/providers/catalog` | Catalog grouped by category. Includes deprecated `providers` alias next to `integrations`. |
| GET | `/providers/registry` | Connectors registered in this collector process, with their `configSchema`. |
| GET | `/providers/:slug` | Catalog row + `getRequiredPermissions()` if the connector is registered. |

### Connections

| Method | Endpoint | Permission | Description |
| --- | --- | --- | --- |
| GET | `/connections` | `integrations:read` | List the org's connections. Optional `?status=` filter. |
| POST | `/connections` | `integrations:manage` | Create a connection. Stores credentials in `SecretVault`. |
| GET | `/connections/:id` | `integrations:read` | Get a connection with `_count` of jobs and sync logs. |
| PUT | `/connections/:id` | `integrations:manage` | Update name, config, sync frequency, active flag, or rotate credentials in place. |
| DELETE | `/connections/:id` | `integrations:manage` | Disconnect (best-effort) and delete the connection + vault row. |
| POST | `/connections/:id/test` | `integrations:manage` | `connect()` + `testConnection()`. Updates status and writes a `SyncLog`. |

**POST /connections** -- Example:

```json
// Request
{
  "integrationId": "aws",
  "name": "Production AWS Account",
  "config": {
    "region": "us-east-1",
    "accountId": "123456789012"
  },
  "credentials": {
    "roleArn": "arn:aws:iam::123456789012:role/TrustaloCollector",
    "externalId": "..."
  },
  "syncFrequencyMinutes": 1440
}

// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "integrationId": "aws",
    "integration": { "id": "aws", "name": "Amazon Web Services" },
    "name": "Production AWS Account",
    "status": "pending_auth",
    "syncFrequencyMinutes": 1440,
    "createdAt": "2024-11-01T10:00:00.000Z"
  }
}
```

### Jobs

| Method | Endpoint | Permission | Description |
| --- | --- | --- | --- |
| POST | `/jobs/trigger` | `integrations:manage` | Body: `{ connectionId, priority? }`. 409 if a job is already running. |
| GET | `/jobs` | `integrations:read` | List jobs. Filters: `status`, `connectionId`. Cursor: `limit`, `offset`. |
| GET | `/jobs/:id` | `integrations:read` | Get a job with the last 5 runs. |
| GET | `/jobs/:id/runs` | `integrations:read` | Full run history (with retries) for a job. |
| POST | `/jobs/:id/cancel` | `integrations:manage` | Allowed only when status ∈ `{pending, queued, running}`. |

**GET /jobs/:id** -- Example Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "connectionId": "uuid",
    "status": "completed",
    "type": "scheduled",
    "startedAt": "2024-11-01T02:00:00.000Z",
    "completedAt": "2024-11-01T02:03:45.000Z",
    "runs": [
      {
        "id": "uuid",
        "runNumber": 1,
        "status": "completed",
        "durationMs": 3200,
        "evidenceCount": 57,
        "resultSummary": {
          "evidenceCollected": 57,
          "evidenceSubmitted": 57,
          "submitErrors": 0,
          "capabilities": ["iam", "cloudtrail", "s3"]
        }
      }
    ]
  }
}
```

### Sync Logs

| Method | Endpoint | Permission | Description |
| --- | --- | --- | --- |
| GET | `/sync-logs` | `integrations:read` | List sync logs. Filters: `connectionId`, `action`, `status`. |

### Service-to-service (internal)

Mounted at `/internal` and gated by HMAC + `X-Organization-Id` — not JWT. Used by the API for evidence-agent orchestration and by the vendor-research scheduler. The full set of internal routes is documented in code at [`apps/collector/src/routes/internal.ts`](../apps/collector/src/routes/internal.ts).
