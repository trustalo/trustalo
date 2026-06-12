# Integration Framework

The **Collector** service owns every third-party integration. It connects to external systems, collects evidence, and submits it to the API for control mapping. Browsing the catalog is public; everything that touches a tenant's data is JWT-protected.

This page documents the integration contract, the connectors that ship today, and the steps to add a new one. The authoritative source is the code under [`apps/collector/src/integrations/`](../apps/collector/src/integrations/) — when this doc and the code disagree, the code wins.

---

## Architecture

```
┌─────────────┐                 ┌────────────────────────────────────────────────┐
│   Web App   │   manage        │                  Collector Service             │
│  (UI)       │──────────────-> │                                                │
└──────┬──────┘   connections   │  ┌─────────────────┐   ┌────────────────────┐  │
       │                        │  │ Provider        │   │ Scheduler          │  │
       │                        │  │ Registry        │   │ (60s tick)         │  │
       │                        │  └────────┬────────┘   └─────────┬──────────┘  │
       │                        │           │                       │             │
       │                        │           ▼                       ▼             │
       │                        │  ┌─────────────────┐   ┌────────────────────┐  │
       │                        │  │ Connectors      │   │ Runner             │  │
       │   Bearer/cookie        │  │ AWS · GCP · ... │   │ (poll → connect    │  │
       │   forwarded            │  └────────┬────────┘   │  → testConnection  │  │
       │                        │           │             │  → collectEvidence │  │
       │                        │           │             │  → submitEvidence) │  │
       │                        │           ▼             └─────────┬──────────┘  │
       │                        │  ┌──────────────────────────────────────────┐  │
       │                        │  │ Collector PostgreSQL                     │  │
       │                        │  │ (Integration, IntegrationConnection,     │  │
       │                        │  │  CollectionJob, CollectionJobRun,        │  │
       │                        │  │  SyncLog, SecretVault)                   │  │
       │                        │  └──────────────────────────────────────────┘  │
       │                        └──────────────────────────┬─────────────────────┘
       │                                                   │ HMAC-signed POST
       │                                                   ▼
       │                                          ┌──────────────────┐
       └─────────────────────────────────────────>│   API Service    │
                  (compliance UI for evidence)    │  /evidence/bulk  │
                                                  └──────────────────┘
```

Two terms to keep straight:

- **Integration** (catalog row, `Integration` Prisma model) — the catalog entry a tenant connects to. The `Integration.id` doubles as the connector slug, e.g. `github`, `aws`.
- **IntegrationConnector** (TypeScript interface) — the runtime plugin that knows how to talk to that provider. One per slug under [`apps/collector/src/integrations/providers/`](../apps/collector/src/integrations/providers/).

> Wire-level note: the catalog HTTP path is `/providers` for backward compatibility, and some response fields still use the legacy `provider`/`providers` names alongside the new `integration`/`integrations` fields. See [`apps/collector/src/routes/providers.ts`](../apps/collector/src/routes/providers.ts) for the deprecated-alias contract.

---

## Connector interface

Every connector under `apps/collector/src/integrations/providers/<slug>/index.ts` implements `IntegrationConnector` from [`apps/collector/src/integrations/core/types.ts`](../apps/collector/src/integrations/core/types.ts):

```typescript
export interface IntegrationConnector {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly category: IntegrationCategory;
  readonly authType: "oauth2" | "api_key" | "iam_role";
  readonly capabilities: string[];
  readonly configSchema: CredentialField[];

  connect(credentials: DecryptedCredentials): Promise<IntegrationRuntime>;
  collectEvidence(
    connection: IntegrationRuntime,
    options: CollectOptions,
  ): Promise<EvidenceResult[]>;
  testConnection(connection: IntegrationRuntime): Promise<ConnectionTestResult>;
  disconnect(connection: IntegrationRuntime): Promise<void>;
  getRequiredPermissions(): PermissionRequirement[];
}

type IntegrationCategory =
  | "cloud"
  | "identity"
  | "code_repository"
  | "productivity"
  | "security"
  | "hr"
  | "ai"
  | "custom";
```

Key shape choices:

- `collectEvidence` is called **once per sync** (not once per capability). It returns a flat array of `EvidenceResult` items; each item carries a `sourceType` like `aws.iam` that downstream consumers use to fan out.
- `configSchema` is a flat array of `CredentialField` descriptors — the Web UI renders the form straight from this array.
- `getRequiredPermissions` returns the IAM/scope expectations the operator must grant to the principal. These are surfaced in the UI before a connection is created.

`EvidenceResult` is also worth knowing because the runner forwards it to the API verbatim:

```typescript
interface EvidenceResult {
  title: string;
  description: string;
  sourceType: string; // e.g. "github.branch_protection"
  sourceId: string; // stable id from the source system
  rawData: Record<string, unknown>;
  severity?: "critical" | "high" | "medium" | "low" | "info";
  controlMapping?: string[];
  collectedAt: Date;
}
```

---

## Provider registry & lifecycle

Connectors register at process boot in [`apps/collector/src/integrations/register.ts`](../apps/collector/src/integrations/register.ts):

```typescript
providerRegistry.register("aws", new AWSProvider());
providerRegistry.register("gcp", new GCPProvider());
// ...
```

Order of operations for a sync job:

1. **Scheduler** ([`apps/collector/src/scheduler/index.ts`](../apps/collector/src/scheduler/index.ts)) ticks every 60 s. For each active `IntegrationConnection` with no in-flight job whose `lastSyncAt + syncFrequencyMinutes` has passed, it inserts a `CollectionJob` row with status `pending`.
2. **Runner** ([`apps/collector/src/runner/index.ts`](../apps/collector/src/runner/index.ts)) polls every 10 s, up to 3 concurrent jobs. For each pending job:
   - `connect(credentials)` → `IntegrationRuntime`
   - `testConnection(runtime)` → must succeed
   - `collectEvidence(runtime, { tenantId, connectionId, incremental, since })`
   - `disconnect(runtime)`
   - Batches evidence (50 items / call) and POSTs to the API at `/internal/evidence/bulk`, HMAC-signed.
3. On any failure the runner records a `CollectionRetry` row with exponential backoff (`2 s · 2^attempt`, max 3 attempts). A 4th failure marks the connection `error` and surfaces `lastErrorMessage` in the UI.

`syncFrequencyMinutes` is per-connection (`min 5`, `max 43_200`). Manual triggers bypass the scheduler — they insert a `pending` `CollectionJob` directly.

---

## Credential storage

Credentials never live on the `IntegrationConnection` row. They are stored in the **SecretVault** table and referenced by `IntegrationConnection.secretId`:

- Vault writes happen inside the same Prisma transaction as the connection create/update so an orphan secret is impossible (see [`apps/collector/src/routes/connections.ts`](../apps/collector/src/routes/connections.ts) lines 58–92 for the two-step write).
- Payloads are encrypted at rest with AES-256-GCM (the same envelope scheme as the API, keyed by `AI_PROVIDER_CONFIG_ENCRYPTION_KEY`). See `apps/collector/src/integrations/core/encryption.ts`.
- Rotating credentials on `PUT /connections/:id` updates the existing vault row in place; the connection row is unchanged.
- Deleting a connection deletes its vault row inside the same transaction. The connector's `disconnect` is called on a best-effort basis before the delete.

---

## Connectors shipped today

Ten connectors are registered. Capabilities below are read directly from each `index.ts`.

| Slug (`id`) | Display name | Category | Auth type | Capabilities |
| --- | --- | --- | --- | --- |
| `aws` | Amazon Web Services | `cloud` | `iam_role` | `iam`, `cloudtrail`, `s3`, `vpc`, `security_groups` |
| `gcp` | Google Cloud Platform | `cloud` | `api_key`<sup>\*</sup> | `iam`, `audit_logs`, `compute`, `storage`, `networking`, `kms` |
| `azure` | Microsoft Azure | `cloud` | `oauth2` | `ad_users`, `network_security`, `storage`, `key_vault`, `activity_logs`, `policy_compliance` |
| `okta` | Okta | `identity` | `api_key` | `users`, `mfa`, `policies`, `groups`, `admin_roles`, `system_log` |
| `auth0` | Auth0 | `identity` | `oauth2`<sup>\*\*</sup> | `users`, `mfa`, `connections`, `rules_actions`, `logs`, `branding` |
| `github` | GitHub | `code_repository` | `oauth2`<sup>\*\*\*</sup> | `org_members`, `branch_protection`, `dependabot`, `code_scanning`, `secret_scanning`, `repo_visibility` |
| `bitbucket` | Bitbucket | `code_repository` | `oauth2` | `access_review`, `branch_protection`, `merge_controls`, `repository_visibility` |
| `google-workspace` | Google Workspace | `productivity` | `api_key`<sup>\*</sup> | `users`, `2sv_status`, `groups`, `drive_sharing`, `oauth_apps`, `admin_activity` |
| `office365` | Microsoft Office 365 | `productivity` | `oauth2` | `users_groups`, `mfa_status`, `conditional_access`, `dlp_policies`, `audit_logs`, `secure_score` |
| `wazuh` | Wazuh | `security` | `api_key`<sup>\*\*\*\*</sup> | `configuration_assessment`, `malware_detection`, `file_integrity_monitoring`, `vulnerability_detection`, `log_analysis`, `threat_hunting`, `incident_response`, `regulatory_compliance`, `it_hygiene`, `container_security`, `cloud_posture`, `agents_inventory`, `mitre_coverage`, `rbac_review` |

<sup>\*</sup> `api_key` here means a service-account JSON key (GCP) or a service-account JSON key plus domain-wide delegation (Google Workspace) — not a literal API key string. <sup>**</sup> Auth0 uses an M2M client-credentials OAuth2 flow. <sup>\***</sup> GitHub currently accepts a personal-access token or a fine-grained PAT through the `oauth2` field; a GitHub-App flow is planned. <sup>\*\*\*\*</sup> Wazuh accepts the Manager API username/password (used to obtain a short-lived JWT internally); a per-connection `enabledCapabilities` field lets operators select a subset of capabilities to collect.

The required IAM/scope/permission set for each connector is returned by `getRequiredPermissions()` and surfaced in the UI before the operator submits credentials.

### `@trustalo/integration-manifests` (separate track)

The `packages/integration-manifests` workspace exports declarative **check manifests** used by the custom-integration / "from prompt" pipeline. These are not the same thing as the runtime connectors above — they describe HTTP probes the user can run without writing a new connector. Manifests ship today for `aws`, `github`, `google-workspace`, `okta`, `microsoft-365`, and `gitlab`. Note that `gitlab` has a manifest but no runtime connector yet.

---

## HTTP surface

All connector routes are mounted at the **collector root** (no `/api` prefix). The web app and the API use `http://localhost:15003` directly.

### Public

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/health` | Liveness probe. Reports registered connector count. |
| `GET` | `/providers` | Flat catalog. No auth. |
| `GET` | `/providers/catalog` | Catalog grouped by `IntegrationCategory`. No auth. Includes deprecated `providers` alias next to `integrations`. |
| `GET` | `/providers/registry` | Registered connectors with their `configSchema` and `capabilities`. No auth. |
| `GET` | `/providers/:slug` | Catalog row + `getRequiredPermissions()` if the connector is registered. Per-tenant `_count` only when the request carries a Bearer token. |

### JWT-protected

Every route below requires a valid JWT and runs through `extractTenantContext`. Permission checks come from `@trustalo/auth`.

**Connections** — [`apps/collector/src/routes/connections.ts`](../apps/collector/src/routes/connections.ts)

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `POST` | `/connections` | `integrations:manage` | Create connection. Body: `{ integrationId, name, credentials, config?, syncFrequencyMinutes? }`. Writes the vault row in the same transaction. |
| `GET` | `/connections` | `integrations:read` | List the org's connections (optional `?status=`). |
| `GET` | `/connections/:id` | `integrations:read` | Get a connection with `_count` of jobs + sync logs. |
| `PUT` | `/connections/:id` | `integrations:manage` | Update name, config, sync frequency, active flag, or rotate credentials in place. |
| `DELETE` | `/connections/:id` | `integrations:manage` | Best-effort `disconnect()`, then delete the connection + vault row in one transaction. |
| `POST` | `/connections/:id/test` | `integrations:manage` | `connect()` + `testConnection()`. Updates `status` + `lastErrorMessage` and writes a `SyncLog`. |

**Jobs** — [`apps/collector/src/routes/jobs.ts`](../apps/collector/src/routes/jobs.ts)

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `POST` | `/jobs/trigger` | `integrations:manage` | Body: `{ connectionId, priority? }`. 409 if a job is already `pending`/`queued`/`running`. |
| `GET` | `/jobs` | `integrations:read` | List jobs. Filters: `status`, `connectionId`. Cursor params: `limit` (≤100), `offset`. |
| `GET` | `/jobs/:id` | `integrations:read` | Get a job with the last 5 runs. |
| `GET` | `/jobs/:id/runs` | `integrations:read` | Full run history for a job, including retries. |
| `POST` | `/jobs/:id/cancel` | `integrations:manage` | Allowed only when status ∈ `{pending, queued, running}`. |

**Sync logs** — [`apps/collector/src/routes/sync-logs.ts`](../apps/collector/src/routes/sync-logs.ts)

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/sync-logs` | `integrations:read` | List sync logs. Filters: `connectionId`, `action`, `status`. |

### Service-to-service

Mounted at `/internal` and `/research`, gated by a shared HMAC + `X-Organization-Id` header — not JWT. Used by the API for evidence-agent orchestration and by the research scheduler. See `apps/collector/src/routes/internal.ts` and `apps/collector/src/routes/research.ts`.

The API exposes its own façade at `/api/v1/integrations/*` (forwards browsing/CRUD to the collector under the user's session). Note that the façade currently returns **503 `INTEGRATIONS_PENDING`** for `:id/checks`, `:id/results`, and the `from-prompt` routes — the custom-integration pipeline is in flight.

---

## Adding a new connector

### 1. Copy the template

```
apps/collector/src/integrations/providers/
├── _template/        ← copy this directory
├── aws/
├── azure/
├── ...
└── your-service/
```

[`_template/index.ts`](../apps/collector/src/integrations/providers/_template/index.ts) is a runnable starting point — it satisfies the interface so the registry will accept it.

### 2. Implement `IntegrationConnector`

```typescript
import type {
  IntegrationConnector,
  CredentialField,
  DecryptedCredentials,
  IntegrationRuntime,
  CollectOptions,
  EvidenceResult,
  ConnectionTestResult,
  PermissionRequirement,
} from "../../core/types.js";

export class YourServiceProvider implements IntegrationConnector {
  readonly id = "your-service";
  readonly name = "Your Service";
  readonly description = "One-line description shown in the catalog.";
  readonly version = "1.0.0";
  readonly category = "security" as const;
  readonly authType = "api_key" as const;
  readonly capabilities = ["users", "audit_logs"];

  readonly configSchema: CredentialField[] = [
    {
      key: "apiToken",
      label: "API Token",
      type: "password",
      required: true,
      sensitive: true,
      description: "Read-only API token scoped to audit data.",
    },
  ];

  async connect(credentials: DecryptedCredentials): Promise<IntegrationRuntime> {
    // Build the SDK/HTTP client. Do not network here — defer to testConnection.
    return {
      id: crypto.randomUUID(),
      integration: this.id,
      client: { token: credentials.apiToken },
    };
  }

  async testConnection(connection: IntegrationRuntime): Promise<ConnectionTestResult> {
    // Make a single inexpensive call (e.g. /me) and translate failure modes.
    return { success: true, message: "Connected." };
  }

  async collectEvidence(
    connection: IntegrationRuntime,
    options: CollectOptions,
  ): Promise<EvidenceResult[]> {
    // Use options.incremental + options.since for delta sync where possible.
    return [];
  }

  async disconnect(_connection: IntegrationRuntime): Promise<void> {
    // Free resources. Many SDKs need nothing here.
  }

  getRequiredPermissions(): PermissionRequirement[] {
    return [
      {
        resource: "audit_logs",
        permission: "read",
        description: "Read audit log entries for the past 30 days.",
        required: true,
      },
    ];
  }
}
```

### 3. Register it

In [`apps/collector/src/integrations/register.ts`](../apps/collector/src/integrations/register.ts):

```typescript
import { YourServiceProvider } from "./providers/your-service/index.js";
// ...
providerRegistry.register("your-service", new YourServiceProvider());
```

### 4. Seed the catalog row

Add the matching `Integration` catalog record in [`apps/collector/src/seed/integrations.ts`](../apps/collector/src/seed/integrations.ts) so it appears in `/providers` and the UI:

```typescript
{
  id: "your-service",
  name: "Your Service",
  description: "...",
  category: "security",
  authType: "api_key",
  capabilities: ["users", "audit_logs"],
  configSchema: yourServiceProvider.configSchema,
  isActive: true,
}
```

Run the collector seeder so the row is inserted in the dev database.

### 5. Map evidence to controls

`EvidenceResult.sourceType` is the join key. The API's evidence ingestion uses cross-framework control mappings — adding a new `sourceType` namespace (e.g. `your-service.audit_logs`) is enough for the existing mapping resolver to pick it up. See `docs/compliance-frameworks.md` for the mapping model.

### 6. Test

The scheduler picks up the new connector automatically as soon as a tenant creates an `IntegrationConnection` for it. There is no extra scheduler configuration.

---

## See also

- [`architecture.md`](architecture.md) — where the Collector fits in the wider system.
- [`api-reference.md`](api-reference.md) — full HTTP reference for both services.
- [`permissions-matrix.md`](permissions-matrix.md) — `integrations:*` permissions and the `integration_admin` role.
- [`compliance-frameworks.md`](compliance-frameworks.md) — how evidence is mapped onto control sets.
