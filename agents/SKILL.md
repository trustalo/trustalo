# Trustalo - Compliance Management Platform

## Overview

Trustalo is a multi-tenant compliance management platform for ISO 27001, 27017, 27018, 22301, 42001, and SOC 2. Built as a Bun monorepo with TypeScript.

## Project Structure

```
trustalo/
├── apps/
│   ├── web/          # Next.js 16 SSR frontend (port 3000)
│   ├── api/          # Express.js 5 API (port 4000) — owns PostgreSQL + MongoDB
│   └── collector/    # Express.js 5 evidence collector (port 4001) — owns its own PostgreSQL
├── packages/
│   ├── shared/       # @trustalo/shared — types, Zod schemas, constants, utils
│   ├── auth/         # @trustalo/auth — JWT auth, RBAC, multi-tenancy middleware
│   ├── storage/      # @trustalo/storage — file storage abstraction (S3 default)
│   └── queue/        # @trustalo/queue — event queue abstraction (SQS default)
├── docker-compose.yml
└── package.json
```

## Key Architecture Decisions

- **Multi-tenant with row-level isolation**: every table and document includes `tenantId`
- **Service-owned databases**: each service owns its databases; no cross-service DB access
- **Dual frontend targets**: web frontend talks to both API and Collector directly
- **Collector-to-API evidence flow**: collector submits evidence to API via internal REST (`POST /api/v1/evidence/bulk`)
- **Split Prisma schemas**: modular `.prisma` files combined via `scripts/combine-schemas.ts`
- **Provider pattern**: pluggable adapters for storage (S3/GCP/Azure) and queue (SQS/Pub-Sub/Service Bus)

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Runtime  | Bun                                     |
| Language | TypeScript 5.x (strict)                 |
| Frontend | Next.js 16.2, React 19, Tailwind CSS v4 |
| Backend  | Express.js 5                            |
| SQL DB   | Prisma 7 + PostgreSQL 17                |
| NoSQL DB | Mongoose 9 + MongoDB 8                  |
| Auth     | JWT + RBAC via @trustalo/auth           |
| Storage  | AWS S3 via @trustalo/storage            |
| Queue    | AWS SQS via @trustalo/queue             |

## API Modules (apps/api)

Each module lives under `src/modules/<name>/` and follows the **router / service / validation** pattern.

| Module        | Route Prefix            | Purpose                               |
| ------------- | ----------------------- | ------------------------------------- |
| auth          | `/api/v1/auth`          | Login, registration, token management |
| organizations | `/api/v1/organizations` | Tenant CRUD and settings              |
| frameworks    | `/api/v1/frameworks`    | Compliance framework lifecycle        |
| controls      | `/api/v1/controls`      | Control definitions and mapping       |
| policies      | `/api/v1/policies`      | Policy document management            |
| risks         | `/api/v1/risks`         | Risk register and assessment          |
| evidence      | `/api/v1/evidence`      | Evidence storage and approval         |
| vendors       | `/api/v1/vendors`       | Third-party vendor management         |
| assets        | `/api/v1/assets`        | Information asset inventory           |
| incidents     | `/api/v1/incidents`     | Security incident tracking            |
| audits        | `/api/v1/audits`        | Internal/external audit management    |
| bcp           | `/api/v1/bcp`           | Business continuity planning          |
| ai-governance | `/api/v1/ai-governance` | AI system governance (ISO 42001)      |
| training      | `/api/v1/training`      | Security awareness training           |
| trust-center  | `/api/v1/trust-center`  | Public trust/compliance portal        |
| dashboards    | `/api/v1/dashboards`    | Compliance metrics and KPIs           |

## Collector Routes (apps/collector)

| Route Prefix   | Purpose                                 |
| -------------- | --------------------------------------- |
| `/providers`   | List and inspect available integrations |
| `/connections` | CRUD for integration connections        |
| `/jobs`        | Trigger and manage collection jobs      |
| `/sync-logs`   | View synchronization history            |

## MongoDB Models (apps/api)

Located in `src/mongodb/models/`:

- `audit-log` — immutable action log per tenant
- `compliance-snapshot` — point-in-time compliance posture
- `evidence-document` — evidence metadata and content
- `questionnaire-response` — vendor/audit questionnaire answers
- `security-finding` — automated and manual security findings

## RBAC Roles and Permissions

Defined in `@trustalo/auth` (`packages/auth/src/rbac.ts`):

| Role               | Access Level                                                |
| ------------------ | ----------------------------------------------------------- |
| owner              | All permissions                                             |
| admin              | All except `users:manage` and `settings:write`              |
| compliance_manager | Full read/write on compliance modules                       |
| auditor            | Read-only + `evidence:approve` + `audits:write`             |
| viewer             | Read-only across all modules                                |
| integration_admin  | `integrations:read`, `integrations:manage`, `evidence:read` |

## Development

```bash
docker compose up -d          # Start PostgreSQL (x2), MongoDB, LocalStack
bun install                   # Install all workspace dependencies
bun run dev:api               # Start API on :4000
bun run dev:collector          # Start Collector on :4001
bun run dev:web               # Start Next.js on :3000
bun run dev                   # Start all services concurrently
```

## Database Commands

```bash
bun run db:generate:api        # Generate Prisma client for API
bun run db:generate:collector  # Generate Prisma client for Collector
bun run db:migrate:api         # Run API database migrations
bun run db:migrate:collector   # Run Collector database migrations
```

## Conventions

1. All tenant-scoped data MUST include `tenantId`.
2. API modules follow the **router / service / validation** pattern.
3. Collector integrations implement the `Integration` interface.
4. Use **Zod** for all request validation.
5. Use `@trustalo/auth` middleware (`authenticate`, `authorize`, `extractTenantContext`) on all protected routes.
6. Error responses: `{ success: false, error: { code, message } }`
7. Success responses: `{ success: true, data, meta? }`
8. Pagination meta: `{ total, page, limit, totalPages, hasNext, hasPrev }`
9. Shared types, schemas, and constants go in `@trustalo/shared`.
10. Never access another service's database directly; use REST or queue.
