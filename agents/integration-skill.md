# Trustalo - Integration Domain Knowledge

Reference for AI agents working on the Collector service and integration providers. Covers architecture, the provider interface, how to add new providers, credential management, scheduling, and the evidence submission flow.

---

## Collector Architecture

The Collector (`apps/collector`) is a standalone Express.js 5 service that owns the integration domain. It runs on port 4001 and has its own PostgreSQL database, completely separate from the API's database.

**Ownership boundaries:**

- Collector owns: integration providers, connections, credentials, collection jobs, job runs, sync logs
- API owns: evidence storage, control mapping, compliance domain
- Collector submits evidence to API via internal REST calls (never accesses API's database directly)

**Directory structure:**

```
apps/collector/
├── prisma/                      # Collector-specific Prisma schema files
├── scripts/
│   └── combine-schemas.ts       # Merges split .prisma files into one schema
├── src/
│   ├── db/
│   │   └── prisma.ts            # Prisma client singleton
│   ├── integrations/
│   │   └── core/
│   │       ├── types.ts         # Integration interface and related types
│   │       ├── registry.ts      # Singleton provider registry
│   │       ├── encryption.ts    # AES-256-GCM credential encryption
│   │       └── index.ts         # Barrel export
│   ├── lib/
│   │   └── api-client.ts        # REST client for submitting evidence to API
│   ├── middleware/
│   │   ├── authenticate.ts      # JWT validation via @trustalo/auth
│   │   ├── authorize.ts         # Permission checks via @trustalo/auth
│   │   ├── error-handler.ts     # Centralized error response formatting
│   │   └── tenant-context.ts    # Extracts tenantId from JWT
│   ├── routes/
│   │   ├── providers.ts         # GET /providers, GET /providers/:slug
│   │   ├── connections.ts       # CRUD for integration connections
│   │   ├── jobs.ts              # Job trigger, list, cancel, run history
│   │   └── sync-logs.ts         # Sync log listing with filters
│   ├── scheduler/
│   │   └── index.ts             # Periodic job dispatcher (60s tick interval)
│   └── index.ts                 # App bootstrap, middleware chain, server start
├── package.json
└── tsconfig.json
```

---

## Integration Interface

Every integration provider must implement this interface (defined in `src/integrations/core/types.ts`):

```typescript
interface Integration {
  readonly id: string; // Unique identifier (UUID or similar)
  readonly name: string; // Human-readable name (e.g., "AWS Security Hub")
  readonly version: string; // Provider version (semver)
  readonly authType: "oauth2" | "api_key" | "iam_role";
  readonly capabilities: string[]; // What evidence this provider can collect

  connect(credentials: DecryptedCredentials): Promise<ProviderConnection>;
  collectEvidence(
    connection: ProviderConnection,
    options: CollectOptions,
  ): Promise<EvidenceResult[]>;
  testConnection(connection: ProviderConnection): Promise<ConnectionTestResult>;
  disconnect(connection: ProviderConnection): Promise<void>;
  getRequiredPermissions(): PermissionRequirement[];
}
```

**Supporting types:**

| Type | Purpose |
| --- | --- |
| `DecryptedCredentials` | `Record<string, string \| undefined>` — decrypted key-value pairs |
| `ProviderConnection` | Holds `id`, `provider` slug, and the SDK `client` instance |
| `CollectOptions` | `tenantId`, `connectionId`, optional `incremental` and `since` |
| `EvidenceResult` | Title, description, sourceType, sourceId, rawData, severity, controlMapping, collectedAt |
| `ConnectionTestResult` | `success` boolean, `message`, optional `details` |
| `PermissionRequirement` | `resource`, `permission`, `description`, `required` |

---

## How to Add a New Integration Provider

### Step-by-step

1. **Create the provider file**

   Create `apps/collector/src/integrations/providers/<slug>.ts` (e.g., `aws-security-hub.ts`).

2. **Implement the Integration interface**

   ```typescript
   import type {
     Integration,
     DecryptedCredentials,
     ProviderConnection,
     CollectOptions,
     EvidenceResult,
     ConnectionTestResult,
     PermissionRequirement,
   } from "../core/types.js";

   export const awsSecurityHubProvider: Integration = {
     id: "aws-security-hub",
     name: "AWS Security Hub",
     version: "1.0.0",
     authType: "iam_role",
     capabilities: ["security_findings", "compliance_status", "config_rules"],

     async connect(credentials: DecryptedCredentials): Promise<ProviderConnection> {
       // Initialize the AWS SDK client with the provided credentials
       // Return a ProviderConnection with the client attached
     },

     async collectEvidence(
       connection: ProviderConnection,
       options: CollectOptions,
     ): Promise<EvidenceResult[]> {
       // Use the client from connection to fetch findings/config
       // Map raw data to EvidenceResult[]
       // Support incremental collection via options.since
     },

     async testConnection(connection: ProviderConnection): Promise<ConnectionTestResult> {
       // Make a lightweight API call to verify access
       // Return { success: true/false, message }
     },

     async disconnect(connection: ProviderConnection): Promise<void> {
       // Clean up SDK client if needed
     },

     getRequiredPermissions(): PermissionRequirement[] {
       return [
         {
           resource: "SecurityHub",
           permission: "securityhub:GetFindings",
           description: "Read security findings from Security Hub",
           required: true,
         },
       ];
     },
   };
   ```

3. **Register the provider**

   In `apps/collector/src/integrations/providers/index.ts` (or create it), import and register:

   ```typescript
   import { providerRegistry } from "../core/registry.js";
   import { awsSecurityHubProvider } from "./aws-security-hub.js";

   providerRegistry.register("aws-security-hub", awsSecurityHubProvider);
   ```

   Ensure this file is imported during app startup (e.g., from `src/index.ts`).

4. **Seed the provider in the database**

   Insert a row into the `Integration` table so connections can reference it:

   ```sql
   INSERT INTO "Integration" (id, slug, name, description, "authType", category, capabilities, "isActive")
   VALUES (
     gen_random_uuid(),
     'aws-security-hub',
     'AWS Security Hub',
     'Collects security findings and compliance status from AWS Security Hub',
     'iam_role',
     'cloud_security',
     '{"security_findings", "compliance_status", "config_rules"}',
     true
   );
   ```

5. **Add any required dependencies**

   ```bash
   cd apps/collector && bun add @aws-sdk/client-securityhub
   ```

6. **Test**
   - Start the collector: `bun run dev:collector`
   - Create a connection via `POST /connections`
   - Test the connection via `POST /connections/:id/test`
   - Trigger a manual collection via `POST /jobs/trigger`

---

## Available Provider Categories

Providers are organized by category. Each category targets specific compliance evidence types.

| Category        | Example Providers                | Evidence Types                          |
| --------------- | -------------------------------- | --------------------------------------- |
| cloud_security  | AWS Security Hub, Azure Defender | Findings, config compliance, alerts     |
| identity        | AWS IAM, Azure AD, Okta          | User lists, MFA status, access policies |
| code_repository | GitHub, GitLab, Bitbucket        | Branch protection, PR reviews, SAST     |
| infrastructure  | AWS Config, Terraform Cloud      | Resource inventory, drift detection     |
| monitoring      | Datadog, CloudWatch, PagerDuty   | Uptime metrics, incident response time  |
| vulnerability   | Snyk, Qualys, Nessus             | Vulnerability scans, patch status       |
| endpoint        | CrowdStrike, SentinelOne         | Endpoint protection status, detections  |
| hr              | BambooHR, Workday                | Employee lists, training completion     |
| ticketing       | Jira, Linear, ServiceNow         | Change management, incident tickets     |

---

## Credential Encryption

Integration credentials are encrypted at rest using **AES-256-GCM** (defined in `src/integrations/core/encryption.ts`).

**How it works:**

1. The encryption key is derived from the `ENCRYPTION_KEY` environment variable via SHA-256
2. `encrypt(plaintext, key)` generates a random 16-byte IV, encrypts with AES-256-GCM, and returns `base64(IV + authTag + ciphertext)`
3. `decrypt(ciphertext, key)` reverses the process, extracting IV and auth tag from the base64 payload
4. The auth tag (16 bytes) provides integrity verification — tampered ciphertext will fail decryption

Credentials are stored directly on the connection:

- Creating or updating a connection replaces the `secretId (FK -> SecretVault)` value on `IntegrationConnection`
- Historical encrypted credential rows are intentionally not stored
- If credential audit history is needed later, record metadata-only audit events rather than duplicating secret material

**Security notes:**

- `ENCRYPTION_KEY` must be a strong random value in production (the `.env.example` has a placeholder)
- Credentials are only decrypted in memory when actively connecting to a provider
- Decrypted credentials are never logged or persisted outside the encrypted field

---

## Scheduler Design

The scheduler runs inside the Collector process (not as a separate service). Defined in `src/scheduler/index.ts`.

**Behavior:**

1. On startup, `startScheduler()` is called and runs an initial check immediately
2. Every 60 seconds (configurable via `CHECK_INTERVAL_MS`), the scheduler ticks
3. Each tick queries for active connections (`isActive: true`, `status: "connected"`) that are due for collection
4. A connection is "due" when `lastSyncAt + syncFrequencyMinutes` is in the past (or `lastSyncAt` is null)
5. Connections with an already-running job (`pending`, `queued`, or `running` status) are skipped
6. For each due connection, a `CollectionJob` record is created with `type: "scheduled"` and `status: "pending"`

**Job lifecycle:**

```
pending -> queued -> running -> completed | failed
                                    \-> cancelled (manual)
```

**Job types:**

- `scheduled` — created by the scheduler based on `syncFrequencyMinutes`
- `manual` — created by a user via `POST /jobs/trigger`

**Graceful shutdown:**

- `stopScheduler()` clears the interval timer
- Called during SIGTERM/SIGINT handling before the HTTP server closes

---

## Evidence Submission Flow

The end-to-end flow from integration collection to the API evidence store:

```
1. Scheduler creates CollectionJob (type: scheduled)
   OR user triggers via POST /jobs/trigger (type: manual)
          │
          ▼
2. Job runner picks up pending job
   - Loads connection + provider from registry
   - Decrypts credentials
   - Calls provider.connect(credentials)
          │
          ▼
3. Provider collects evidence
   - Calls provider.collectEvidence(connection, options)
   - Returns EvidenceResult[] (title, sourceType, rawData, controlMapping, etc.)
          │
          ▼
4. Collector submits to API
   - POST /api/v1/evidence/bulk
   - Headers: X-Internal-Key, X-Organization-Id, Content-Type: application/json
   - Body: { evidence: [...mapped EvidenceResult items] }
          │
          ▼
5. API processes evidence
   - Validates and stores in MongoDB (evidence-document model)
   - Links to controls via controlMapping field
   - Updates compliance posture metrics
          │
          ▼
6. Job status updated
   - On success: job status -> "completed", connection.lastSyncAt updated
   - On failure: job status -> "failed", error recorded in sync log
```

**API client details** (`src/lib/api-client.ts`):

- Base URL: `API_BASE_URL` env var (default `http://localhost:4000`)
- Authentication: `X-Internal-Key` header for service-to-service auth
- Tenant context: `X-Organization-Id` header
- Available functions:
  - `submitEvidence(tenantId, evidence[])` — bulk evidence submission
  - `getControlMappings(tenantId)` — fetch control mappings for evidence tagging

---

## Collector API Endpoints

All endpoints (except `/health`) require JWT authentication and tenant context.

### Health Check

```
GET /health
Response: { status: "ok", service: "collector", timestamp: "..." }
```

### Providers

```
GET /providers
  → Lists active integration providers (id, slug, name, description, authType, category, capabilities)

GET /providers/:slug
  → Provider details with connection count for the current organization
```

### Connections

```
POST /connections
  Permission: integrations:manage
  Body: { integrationId, name, credentials: {}, config?: {}, syncFrequencyMinutes?: number }
  → Creates connection, encrypts credentials, creates credential version

GET /connections
  Permission: integrations:read
  Query: ?status=connected
  → Lists connections for current organization

GET /connections/:id
  Permission: integrations:read
  → Connection details with job and sync log counts

PUT /connections/:id
  Permission: integrations:manage
  Body: { name?, credentials?, config?, syncFrequencyMinutes?, isActive? }
  → Updates connection; re-encrypts and versions credentials if changed

DELETE /connections/:id
  Permission: integrations:manage
  → Disconnects provider (best-effort) then deletes connection

POST /connections/:id/test
  Permission: integrations:manage
  → Decrypts credentials, connects to provider, runs testConnection()
  → Updates connection status to "connected" or "error"
  → Creates sync log entry for the test
```

### Jobs

```
POST /jobs/trigger
  Permission: integrations:manage
  Body: { connectionId, priority?: number }
  → Creates manual collection job (rejects if one already running)

GET /jobs
  Permission: integrations:read
  Query: ?status=pending&connectionId=...&limit=50&offset=0
  → Lists collection jobs with pagination

GET /jobs/:id
  Permission: integrations:read
  → Job details with recent runs

GET /jobs/:id/runs
  Permission: integrations:read
  → All runs for a job with retry details

POST /jobs/:id/cancel
  Permission: integrations:manage
  → Cancels a pending/queued/running job
```

### Sync Logs

```
GET /sync-logs
  Permission: integrations:read
  Query: ?connectionId=...&action=test_connection&status=completed&limit=50&offset=0
  → Lists sync log entries with pagination
```
