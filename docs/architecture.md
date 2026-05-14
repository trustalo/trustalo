# Trustalo Architecture

## Overview

Trustalo is a compliance management platform built as a Bun monorepo with TypeScript. The system consists of three applications and a set of shared packages, designed for multi-tenancy with row-level isolation.

## Monorepo Structure

```
trustalo/
├── apps/
│   ├── web/                         # Next.js 16 SSR frontend
│   ├── api/                         # Express.js compliance API
│   └── collector/                   # Express.js integration collector
├── packages/
│   ├── shared/                      # @trustalo/shared
│   ├── auth/                        # @trustalo/auth
│   ├── auth-provider-local/         # @trustalo/auth-provider-local
│   ├── auth-provider-cognito/       # @trustalo/auth-provider-cognito
│   ├── auth-provider-keycloak/      # @trustalo/auth-provider-keycloak
│   ├── ai/                          # @trustalo/ai (provider resolver + guardrails)
│   ├── integration-manifests/       # @trustalo/integration-manifests
│   ├── storage/                     # @trustalo/storage (S3 today)
│   └── queue/                       # @trustalo/queue (SQS today)
├── package.json
├── turbo.json
└── tsconfig.base.json
```

## Technology Stack

| Component     | Technology              |
| ------------- | ----------------------- |
| Runtime       | Bun                     |
| Language      | TypeScript 5.x (strict) |
| Frontend      | Next.js 16 (SSR)        |
| Backend APIs  | Express.js              |
| SQL ORM       | Prisma 7                |
| Document ORM  | Mongoose 9              |
| File Storage  | AWS S3                  |
| Message Queue | AWS SQS                 |
| Auth          | JWT + RBAC              |

## Applications

### Web (`apps/web`)

Next.js 16 server-side rendered application. Serves as the primary user interface for compliance management, dashboards, policy workflows, and the public trust center.

- Communicates with the **API** for all compliance operations
- Communicates with the **Collector** for integration management
- Handles authentication flows via the shared `@trustalo/auth` package

### API (`apps/api`)

Express.js service that owns all compliance domain logic. Port **4000**.

- Owns PostgreSQL (Prisma 7) for relational compliance data
- Owns MongoDB (Mongoose 9) for evidence documents, audit logs, and snapshots
- Exposes REST endpoints for frameworks, controls, policies, risks, vendors, assets, incidents, audits, BCP, AI governance, training, trust center, and dashboards
- Receives evidence submissions from the Collector service

### Collector (`apps/collector`)

Express.js service responsible for third-party integrations. Port **4001**.

- Owns its own PostgreSQL database (Prisma 7) for integration metadata, connections, jobs, and secret-vault rows
- Hosts nine registered connectors today: `aws`, `gcp`, `azure`, `okta`, `auth0`, `github`, `bitbucket`, `google-workspace`, `office365` (see [`integrations.md`](integrations.md))
- Collects evidence and submits it to the API in HMAC-signed batches at `/internal/evidence/bulk`
- Runs a 60 s scheduler and a 10 s runner with exponential-backoff retries
- Hosts a vendor-research subsystem (queue subscriber + pluggable web-search providers) and an evidence-agent loop invoked by the API

## Shared Packages

### @trustalo/shared

Common types, constants, validation schemas, error classes, and utility functions used across all three applications.

### @trustalo/auth

JWT-based authentication and RBAC authorization. Provides middleware for token verification, role checking, and permission enforcement. The provider plug-in protocol used by the cookie/Bearer middleware lives here; concrete providers ship in `@trustalo/auth-provider-{local,cognito,keycloak}`. See [`auth-providers.md`](auth-providers.md).

**Roles (7):**

| Role | Description |
| --- | --- |
| `owner` | Every permission, including `users:manage` and `settings:write`. One per organization. |
| `admin` | Every permission except `users:manage` and `settings:write`. Includes `integrations:manage`. |
| `compliance_manager` | Read + write across the compliance domain (frameworks, controls, policies, risks, evidence, vendors, audits, BCP, AI, …). |
| `auditor` | Read-only across the platform plus `evidence:approve` and `audits:write`. |
| `viewer` | Read-only across the platform. |
| `integration_admin` | Scoped to `integrations:read`, `integrations:manage`, and `evidence:read`. |
| `dpo` | GDPR Data Protection Officer. Read across the platform, plus write on `privacy`, `incidents`, `evidence`, and `vendors`. |

Source of truth: [`packages/auth/src/rbac.ts`](../packages/auth/src/rbac.ts). Permissions are resource-scoped (e.g. `policies:write`, `privacy:read`, `vulnerabilities:write`, `integrations:manage`); the full matrix is in [`permissions-matrix.md`](permissions-matrix.md).

### @trustalo/ai

Single resolver for every LLM call in the system. Owns the three-layer precedence chain (operator default → org override → per-feature override), the PII scrubber, the prompt guard, and the typed audit-log emitter. App code never imports a provider SDK directly. See [`ai-features.md`](ai-features.md).

### @trustalo/integration-manifests

Declarative check manifests used by the custom-integration / "from prompt" pipeline. Distinct from the runtime connectors registered inside the Collector — these manifests describe HTTP probes the user can run without writing a new connector. Manifests ship today for `aws`, `github`, `google-workspace`, `okta`, `microsoft-365`, and `gitlab`.

### @trustalo/storage

Abstraction layer over file-storage backends. Uses a **provider pattern** so adding a new backend is an interface implementation, not a fork.

```typescript
interface StorageProvider {
  upload(key: string, data: Buffer, metadata?: Record<string, string>): Promise<StorageResult>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}
```

Shipped today: `S3StorageProvider`. A `_template` scaffold lives next to it; GCS and Azure Blob providers are not implemented yet.

### @trustalo/queue

Abstraction layer over message-queue backends, same provider pattern.

```typescript
interface QueueProvider {
  publish(topic: string, message: QueueMessage): Promise<void>;
  subscribe(topic: string, handler: MessageHandler): Promise<void>;
  acknowledge(receiptHandle: string): Promise<void>;
}
```

Shipped today: `SQSQueueProvider`. A `_template` scaffold lives next to it; Pub/Sub and Azure Service Bus providers are not implemented yet.

## Multi-Tenancy

All data is isolated at the row level using an `tenantId` column/field on every table and document.

- **Prisma middleware** automatically injects `tenantId` filters on all queries and sets it on creates
- **Mongoose hooks** enforce the same pattern for MongoDB documents
- Tenant context is extracted from the authenticated JWT and propagated through request context

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Browser                       │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    Web (Next.js 16 SSR)                       │
│                       apps/web                               │
└─────────┬──────────────────────────────────┬─────────────────┘
          │                                  │
          │ Compliance operations             │ Integration management
          │ (frameworks, policies,            │ (connections, jobs,
          │  risks, audits, etc.)             │  sync status)
          ▼                                  ▼
┌─────────────────────┐          ┌──────────────────────────┐
│   API (Express.js)  │◄─────── │  Collector (Express.js)  │
│     apps/api        │ Evidence │    apps/collector        │
│     Port 4000       │ Submit   │    Port 4001             │
├─────────────────────┤          ├──────────────────────────┤
│ PostgreSQL (Prisma)  │          │ PostgreSQL (Prisma)      │
│ MongoDB (Mongoose)   │          │                          │
└────────┬────────────┘          └──────────┬───────────────┘
         │                                  │
         ▼                                  ▼
┌─────────────────┐               ┌────────────────────────────┐
│    AWS S3       │               │  External Providers        │
│  (via storage)  │               │  AWS · GCP · Azure ·        │
├─────────────────┤               │  Okta · Auth0 · GitHub ·    │
│    AWS SQS      │               │  Bitbucket · Google         │
│  (via queue)    │               │  Workspace · Office 365     │
└─────────────────┘               └────────────────────────────┘
```

**Key data flows:**

1. **Web -> API**: All compliance CRUD operations (frameworks, controls, policies, risks, vendors, assets, incidents, audits, BCP, AI governance, training, trust center, dashboards)
2. **Web -> Collector**: Integration connection setup, job management, sync status monitoring
3. **Collector -> API**: Evidence submission after collection from external providers. The Collector gathers evidence from third-party services and POSTs it to the API for storage and control mapping.

## Database Ownership

Each service owns and manages its own database(s). There is no shared database access between services.

| Service   | Databases                              |
| --------- | -------------------------------------- |
| API       | PostgreSQL (compliance data) + MongoDB |
| Collector | PostgreSQL (integration metadata)      |

## Infrastructure Services

| Service | Purpose               | Abstraction Package |
| ------- | --------------------- | ------------------- |
| AWS S3  | File/evidence storage | @trustalo/storage   |
| AWS SQS | Async event messaging | @trustalo/queue     |

Both use the provider pattern, so swapping to GCP (GCS / Pub/Sub) or Azure (Blob Storage / Service Bus) is an interface implementation, not a fork. Only S3 and SQS ship today; the `_template` directory next to each is the starting point for a new backend.
