# Trustalo Architecture

## Overview

Trustalo is a compliance management platform built as a Bun monorepo with TypeScript. The system consists of three TypeScript services (web, API, collector), a cross-platform **Go endpoint agent**, and a set of shared packages, designed for multi-tenancy with row-level isolation.

## Monorepo Structure

```
trustalo/
├── apps/
│   ├── web/                         # Next.js 16 SSR frontend
│   ├── api/                         # Express 5 compliance API
│   ├── collector/                   # Express 5 integration collector
│   └── device-agent/                # Go endpoint device-posture agent (macOS/Windows/Linux)
├── packages/
│   ├── shared/                      # @trustalo/shared
│   ├── auth/                        # @trustalo/auth
│   ├── auth-provider-local/         # @trustalo/auth-provider-local
│   ├── auth-provider-cognito/       # @trustalo/auth-provider-cognito
│   ├── auth-provider-keycloak/      # @trustalo/auth-provider-keycloak
│   ├── auth-provider-google/        # @trustalo/auth-provider-google
│   ├── auth-provider-microsoft/     # @trustalo/auth-provider-microsoft
│   ├── auth-provider-saml.ee/       # @trustalo/auth-provider-saml (Enterprise)
│   ├── ai/                          # @trustalo/ai (provider resolver + guardrails)
│   ├── license/                     # @trustalo/license (Enterprise license gating)
│   ├── billing.ee/                  # @trustalo/billing (Enterprise)
│   ├── integration-manifests/       # @trustalo/integration-manifests
│   ├── storage/                     # @trustalo/storage (S3 today)
│   └── queue/                       # @trustalo/queue (SQS today)
├── package.json
├── turbo.json
└── tsconfig.base.json
```

## Technology Stack

| Component      | Technology                         |
| -------------- | ---------------------------------- |
| Runtime        | Bun                                |
| Language       | TypeScript 5.x (strict)            |
| Frontend       | Next.js 16 (SSR)                   |
| Backend APIs   | Express 5                          |
| Endpoint agent | Go (single-binary, cross-compiled) |
| SQL ORM        | Prisma 7                           |
| Document ORM   | Mongoose 9                         |
| File Storage   | AWS S3                             |
| Message Queue  | AWS SQS                            |
| Auth           | JWT + RBAC                         |

## Applications

### Web (`apps/web`)

Next.js 16 server-side rendered application. Serves as the primary user interface for compliance management, dashboards, policy workflows, and the public trust center.

- Communicates with the **API** for all compliance operations
- Communicates with the **Collector** for integration management
- Handles authentication flows via the shared `@trustalo/auth` package

### API (`apps/api`)

Express 5 service that owns all compliance domain logic. Port **15002**.

- Owns PostgreSQL (Prisma 7) for relational compliance data
- Owns MongoDB (Mongoose 9) for evidence documents, audit logs, and snapshots
- Exposes REST endpoints for frameworks, controls, policies, risks, vendors, assets, incidents, audits, BCP, AI governance, training, trust center, dashboards, privacy, vulnerabilities, questionnaires, **people** (the HR/personnel directory that replaced `Membership`), and **devices** (endpoint posture)
- Receives evidence submissions from the Collector service over an HMAC-signed internal route
- Terminates the **device-agent** protocol: enrollment, PKCE device-authorization, and HMAC-signed posture check-ins (see [Device agent](#device-agent-appsdevice-agent) below)

### Collector (`apps/collector`)

Express 5 service responsible for third-party integrations. Port **15003**.

- Owns its own PostgreSQL database (Prisma 7) for integration metadata, connections, jobs, and secret-vault rows
- Hosts ten registered connectors today: `aws`, `gcp`, `azure`, `okta`, `auth0`, `github`, `bitbucket`, `google-workspace`, `office365`, `wazuh` (see [`integrations.md`](integrations.md))
- Collects evidence and submits it to the API in HMAC-signed batches at `/internal/evidence/bulk`
- Runs a 60 s scheduler and a 10 s runner with exponential-backoff retries
- Hosts a vendor-research subsystem (queue subscriber + pluggable web-search providers) and an evidence-agent loop invoked by the API

### Device agent (`apps/device-agent`)

Cross-platform (macOS / Windows / Linux) endpoint-posture agent written in **Go** — the one component that is not a TypeScript service. It compiles to a single self-contained binary (`GOOS`/`GOARCH`), ships as both a headless daemon (`cmd/agentd`, launchd/systemd/Windows SCM) and a resident menu-bar app (`cmd/tray`), and talks only to the API.

- **Enrolls once** — via browser sign-in (PKCE device-authorization through the web `/device/authorize` page; works against any auth provider), an interactive user JWT, or an admin-minted enrollment token — then receives a per-device HMAC secret.
- **Heartbeats security posture** on a tenant-controlled interval: each check-in is HMAC-signed (nonce + timestamp replay defense) and reports tri-state signals (disk encryption, host firewall, screen lock, antivirus/EDR, agent health) plus a free-form `raw` blob of hardware/OS inventory and extended posture. **Every probe is an unprivileged read — no root/admin on any OS.**
- Each enrolled machine is 1:1 with a Computer-category **`Asset`** and is assigned to a **`Person`**; posture interpretation is emitted as advisory `Evidence` (`pending_review`), never an auto-approved verdict.

Full detail: [`device-agent.md`](device-agent.md). The agent has no database of its own and no direct link to the Collector — it is a pure API client.

## Shared Packages

### @trustalo/shared

Common types, constants, validation schemas, error classes, and utility functions used across the TypeScript applications (web, API, collector). The Go device agent does not consume it.

### @trustalo/auth

JWT-based authentication and RBAC authorization. Provides middleware for token verification, role checking, and permission enforcement. The provider plug-in protocol used by the cookie/Bearer middleware lives here; concrete providers ship in `@trustalo/auth-provider-{local,cognito,keycloak,google,microsoft}` and `@trustalo/auth-provider-saml` (Enterprise). See [`auth-providers.md`](auth-providers.md).

**Roles (8):**

| Role | Description |
| --- | --- |
| `owner` | Every permission, including `users:manage` and `settings:write`. One per tenant. |
| `admin` | Every permission except `users:manage` and `settings:write`. Includes `integrations:manage`. |
| `compliance_manager` | Read + write across the compliance domain (frameworks, controls, policies, risks, evidence, vendors, audits, BCP, AI, …). |
| `auditor` | Read-only across the platform plus `evidence:approve` and `audits:write`. |
| `viewer` | Read-only across the platform. |
| `integration_admin` | Scoped to `integrations:read`, `integrations:manage`, and `evidence:read`. |
| `dpo` | GDPR Data Protection Officer. Read across the platform, plus write on `privacy`, `incidents`, `evidence`, and `vendors`. |
| `member` | Default for rank-and-file people. Self-service only (`self:read` / `self:write`): view own profile + devices, acknowledge assigned policies, complete assigned training. |

Source of truth: [`packages/auth/src/rbac.ts`](../packages/auth/src/rbac.ts). Permissions are resource-scoped (e.g. `policies:write`, `privacy:read`, `vulnerabilities:write`, `people:write`, `integrations:manage`); the full matrix is in [`permissions-matrix.md`](permissions-matrix.md). New people default to `member`; admins promote to the other seven roles via the People role picker.

### @trustalo/ai

Single resolver for every LLM call in the system. Owns the three-layer precedence chain (operator default → org override → per-feature override), the PII scrubber, the prompt guard, and the typed audit-log emitter. App code never imports a provider SDK directly. See [`ai-features.md`](ai-features.md).

### @trustalo/license

Enterprise license gating. `assertEnterpriseLicense("<feature>")` is the single guard every user-facing Enterprise (`.ee`) surface calls before doing licensed work; local development may bypass it with `TRUSTALO_LICENSE_DEV_BYPASS=1`. See [`enterprise.md`](enterprise.md).

### @trustalo/billing (`billing.ee`)

Enterprise billing/subscription package (an EE file — paid Enterprise License required to run in production). Governs plan/seat metering for licensed deployments.

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

All data is isolated at the row level using a `tenantId` column/field on every table and document.

- **Prisma middleware** automatically injects `tenantId` filters on all queries and sets it on creates
- **Mongoose hooks** enforce the same pattern for MongoDB documents
- Tenant context is extracted from the authenticated JWT and propagated through request context

## Data Flow

```
┌──────────────────────────┐                ┌──────────────────────────────┐
│      Client Browser      │                │      Device Agent (Go)       │
└────────────┬─────────────┘                │      apps/device-agent       │
             │                              │   macOS · Windows · Linux    │
             ▼                              └───────────────┬──────────────┘
┌──────────────────────────────────────────┐               │ enroll + PKCE
│           Web (Next.js 16 SSR)            │               │ device-auth +
│                 apps/web                  │               │ HMAC-signed
└─────────┬──────────────────────┬──────────┘               │ posture check-ins
          │                      │                          │
          │ Compliance ops       │ Integration mgmt         │
          │ (frameworks,         │ (connections, jobs,      │
          │  policies, risks …)  │  sync status)            │
          ▼                      ▼                          │
┌─────────────────────┐   ┌──────────────────────┐          │
│   API (Express 5)   │   │  Collector (Express  │          │
│     apps/api        │◄──┤  5)  apps/collector  │          │
│     Port 15002      │   │      Port 15003      │          │
│                     │   └──────────┬───────────┘          │
│   (also terminates  │◄─── Evidence submit (HMAC) ─────────┘
│   the device proto) │◄────────────────────────────────────
├─────────────────────┤   ┌──────────────────────┐
│ PostgreSQL (Prisma)  │   │ PostgreSQL (Prisma)  │
│ MongoDB (Mongoose)   │   │                      │
└────────┬────────────┘   └──────────┬───────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐        ┌────────────────────────────┐
│  AWS S3 (store) │        │  External Providers         │
│  AWS SQS (queue)│        │  AWS · GCP · Azure · Okta · │
│                 │        │  Auth0 · GitHub · Bitbucket │
│                 │        │  · Google Workspace ·       │
│                 │        │  Office 365 · Wazuh         │
└─────────────────┘        └────────────────────────────┘
```

**Key data flows:**

1. **Web -> API**: All compliance CRUD operations (frameworks, controls, policies, risks, vendors, assets, incidents, audits, BCP, AI governance, training, trust center, dashboards, privacy, vulnerabilities, people, devices)
2. **Web -> Collector**: Integration connection setup, job management, sync status monitoring
3. **Collector -> API**: Evidence submission after collection from external providers. The Collector gathers evidence from third-party services and POSTs it to the API for storage and control mapping.
4. **Device Agent -> API**: One-time enrollment (browser PKCE device-authorization, interactive JWT, or admin enrollment token), then periodic HMAC-signed posture check-ins. Each check-in updates the device's inline posture, appends a snapshot, and emits advisory evidence for changed-and-evaluated signals. The agent never touches the Collector or a database directly — it is a pure API client.

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
