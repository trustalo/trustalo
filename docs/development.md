# Development Guide

This document covers the day-to-day developer loop: workspace scripts, project structure, the conventions you must follow (Prettier, the Cursor / Claude rules, the AI-features checklist), and how the parts of the repo fit together.

For first-run installation see [`installation.md`](installation.md). For the project overview see the [project README](../README.md). For the AI agent contract (mandatory for any AI-touching PR) see [`ai-features.md`](ai-features.md) and [`../.cursor/rules/ai-features.mdc`](../.cursor/rules/ai-features.mdc).

---

## Available scripts

Run from the repository root.

| Script | What it does |
| --- | --- |
| `bun dev` / `bun run dev` | Start API + Web concurrently. |
| `bun dev:all` / `bun run dev:all` | Start API + Web + Collector concurrently. |
| `bun run dev:api` | Start API only. |
| `bun run dev:web` | Start Web only. |
| `bun run dev:collector` | Start Collector only. |
| `bun run setup:local` | Bootstrap local env files, Docker services, dependencies, Prisma clients, migrations, and seed data. |
| `bun run build` | Build every package and app. |
| `bun run test` | Run workspace test suites (`@trustalo/api`, `@trustalo/auth`, `@trustalo/ai`). |
| `bun run test:coverage` | Run coverage suites and print per-package `All files` coverage tables. |
| `bun run typecheck` | Type-check every package and app via Turborepo. |
| `bun run lint` | Lint every package and app via Turborepo. |
| `bun run format` | Apply Prettier across the repo (see `.prettierrc.json`). |
| `bun run format:check` | CI gate — fails on unformatted files. |
| `bun run db:generate:api` | Generate the API Prisma client. |
| `bun run db:generate:collector` | Generate the Collector Prisma client. |
| `bun run db:migrate:api` | Apply API migrations. |
| `bun run db:migrate:collector` | Apply Collector migrations. |
| `bun run db:seed:api` | Seed reference data (frameworks, controls). |
| `bun run db:seed:demo:api` | Seed a demo organization with sample policies, risks, vendors. |
| `bun run license:check` | Walk node_modules and fail on any non-allowlisted dependency license. |
| `bun run license:report` | Print the full distribution of dependency licenses. |
| `bun run clean` | Remove all `node_modules/` directories. |

---

## Daily workflow

1. **Bring up infra**: `docker compose up -d`
2. **Pull dependency changes**: `bun install`
3. **Apply new migrations** (after pulling): `bun run db:migrate:api && bun run db:migrate:collector`
4. **Start dev servers**: `bun run dev` (or `bun run dev:all` if you need the Collector too)
5. **Modify Prisma schemas**: edit the split `.prisma` files under `apps/<service>/prisma/`, then re-run `db:generate` and `db:migrate` for that service.
6. **Add shared types**: update `packages/shared/src/` and import via `@trustalo/shared`.
7. **Add integrations**: implement the `Integration` interface under `apps/collector/src/integrations/providers/`.
8. **Format before committing**: `bun run format`. Prettier is mandatory — see [`../.cursor/rules/prettier-formatting.mdc`](../.cursor/rules/prettier-formatting.mdc).
9. **Run tests**: `bun run test` and `bun run test:coverage`.
10. **Type-check**: `bun run typecheck` (CI runs this too).

---

## Project structure

```
trustalo/
├── apps/
│   ├── api/
│   │   ├── prisma/                    Split Prisma schema files
│   │   ├── scripts/
│   │   │   └── combine-schemas.ts     Merge split .prisma files into one
│   │   └── src/
│   │       ├── config/                Centralised env + security validation
│   │       ├── db/                    Prisma + Mongoose clients
│   │       ├── lib/                   Crypto envelope, service-auth, queue, audit
│   │       ├── middleware/            Auth, tenant context, error handling, logging
│   │       ├── modules/               API domain modules (router/service/validation)
│   │       │   ├── auth/
│   │       │   ├── frameworks/
│   │       │   ├── controls/
│   │       │   ├── policies/
│   │       │   ├── risks/
│   │       │   ├── evidence/
│   │       │   ├── vendors/
│   │       │   ├── assets/
│   │       │   ├── incidents/
│   │       │   ├── audits/
│   │       │   ├── bcp/
│   │       │   ├── ai-governance/
│   │       │   ├── training/
│   │       │   ├── trust-center/
│   │       │   ├── organizations/
│   │       │   ├── tasks/
│   │       │   ├── questionnaires/
│   │       │   ├── chat/
│   │       │   ├── privacy/
│   │       │   ├── internal/          HMAC-gated service-to-service routes
│   │       │   └── dashboards/
│   │       └── mongodb/models/        Mongoose document models
│   ├── collector/
│   │   ├── prisma/                    Collector Prisma schema
│   │   ├── scripts/
│   │   │   └── combine-schemas.ts
│   │   └── src/
│   │       ├── db/
│   │       ├── integrations/core/     Provider interface, registry, encryption
│   │       ├── lib/                   API client, service-auth (HMAC), scheduler
│   │       ├── middleware/
│   │       ├── routes/                Providers, connections, jobs, sync-logs
│   │       └── research/              Periodic vendor research scheduler
│   └── web/
│       └── src/
│           ├── app/                   Next.js App Router pages
│           ├── components/ui/         Shared UI components
│           ├── lib/                   API + Collector HTTP clients
│           └── proxy.ts               Per-request CSP nonce + security headers
├── packages/
│   ├── shared/src/                    Types, Zod schemas, constants, utilities
│   ├── auth/src/                      JWT, RBAC, middleware (cookie + bearer)
│   ├── auth-provider-{local,cognito,keycloak}/
│   ├── storage/src/                   Storage interface + S3 provider
│   ├── queue/src/                     Queue interface + SQS provider
│   ├── ai/                            Provider resolution, PII scrubber, prompt guard
│   └── integration-manifests/         Per-provider check manifests
├── docs/                              Long-form documentation (this folder)
├── examples/                          Worked examples (auth provider template, …)
├── docker-compose.yml                 PostgreSQL x2, MongoDB, LocalStack
├── package.json                       Workspace scripts
└── tsconfig.base.json                 Shared TypeScript config
```

---

## Conventions

Everything in this section is enforced (lint, format, CI, or rule) — not a suggestion.

### Formatting

Prettier 3.8 owns formatting. Run `bun run format` before every commit; `bun run format:check` is the CI gate. Full rule at [`../.cursor/rules/prettier-formatting.mdc`](../.cursor/rules/prettier-formatting.mdc).

### AI features

Every code path that calls an LLM must:

- Go through `resolveAIProvider` (no raw provider SDK calls in app code).
- Emit a typed audit log entry with the resolved feature/provider/model.
- Be rate-limited per tenant per feature.
- Stay advisory — humans approve every write.
- Be original work (no vendored AGPL code, no copy-paste from other compliance tools).

The non-negotiable contract lives at [`../.cursor/rules/ai-features.mdc`](../.cursor/rules/ai-features.mdc).

### Originality

Every PR adds the originality attestation from [`../.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md). Two CI workflows back this up:

- `.github/workflows/no-vendored-agpl.yml` — fails on committed source files that carry an AGPL license header.
- `.github/workflows/license-check.yml` — walks every resolved dependency in `node_modules/` and fails on any non-allowlisted license.

### Security

The most recent hardening is summarised in the README's [Security posture section](../README.md#security-posture). When you modify any of those files (crypto envelope, service-auth, cookie session, CORS config, CSP proxy), expect close review.

### Agent rules

The repository's persistent guidance for AI coding assistants lives in three places — all three should stay in sync:

- [`../.cursor/rules/*.mdc`](../.cursor/rules/) — Cursor (single source of truth).
- [`../AGENTS.md`](../AGENTS.md) — vendor-neutral summary for any agent that reads `AGENTS.md` (Copilot, Aider, OpenCode, etc.).
- [`../CLAUDE.md`](../CLAUDE.md) — Claude Code equivalent.

---

## Contributing checklist

Before opening a PR:

- [ ] `bun run format`
- [ ] `bun run typecheck`
- [ ] `bun run lint`
- [ ] `bun run test`
- [ ] `bun run test:coverage`
- [ ] PR coverage gate passes (minimum package-level line coverage >= 75%).
- [ ] If the PR adds or modifies an AI feature, every checkbox in [`../.cursor/rules/ai-features.mdc`](../.cursor/rules/ai-features.mdc) is green.
- [ ] If the PR adds or removes an env var, the relevant `.env.example` is updated and the variable is documented in [`installation.md`](installation.md).
- [ ] Originality attestation in [`../.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md) is checked.

---

## See also

- [`installation.md`](installation.md) — first-run setup.
- [Project README](../README.md) — overview and links to every other doc.
- [`architecture.md`](architecture.md) — service boundaries and data flow.
- [`database-design.md`](database-design.md) — Prisma + Mongoose schemas.
- [`auth-providers.md`](auth-providers.md) — pluggable auth contract and walkthroughs.
- [`api-reference.md`](api-reference.md) — REST endpoints.
- [`ai-features.md`](ai-features.md) — operator + tenant AI configuration and audit.
- [`integrations.md`](integrations.md) — adding a Collector integration provider.
- [`permissions-matrix.md`](permissions-matrix.md) — roles and the permissions each one grants.
- [`compliance-frameworks.md`](compliance-frameworks.md) — supported frameworks and mappings.
