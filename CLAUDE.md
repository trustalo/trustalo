# CLAUDE.md

Project-level instructions for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Claude auto-loads this file when it runs in this repository.

The **single source of truth** for repo conventions is [`.cursor/rules/*.mdc`](.cursor/rules/). The same content is summarised for vendor-neutral tooling in [`AGENTS.md`](AGENTS.md). This file mirrors those summaries for Claude.

---

## Read these first

When you start a task, scan the rule that matches the file(s) you are about to touch:

| Topic | Source of truth | When it applies |
| --- | --- | --- |
| Code formatting (Prettier) | [`.cursor/rules/prettier-formatting.mdc`](.cursor/rules/prettier-formatting.mdc) | Always. Run `bun run format` before any commit; CI gate is `bun run format:check`. |
| AI feature contract | [`.cursor/rules/ai-features.mdc`](.cursor/rules/ai-features.mdc) | Any LLM or AI-feature path in `apps/api`, `apps/collector`, `apps/web`, `packages/ai`, or `packages/license`. |
| Enterprise features | [`.cursor/rules/enterprise-features.mdc`](.cursor/rules/enterprise-features.mdc) | Any `.ee.*` file, `**/ee/**` path, `.ee` package, or license-gated feature. |
| Adding a new framework | [`.cursor/rules/adding-frameworks.mdc`](.cursor/rules/adding-frameworks.mdc) | Any PR that touches `apps/api/prisma/frameworks/**` or framework-aware UI. |
| Pull requests | [`.cursor/rules/pull-request-template.mdc`](.cursor/rules/pull-request-template.mdc) | Any time an agent creates or updates a PR. |

The Cursor `.mdc` files are markdown with YAML frontmatter. Read them directly — they were written for an AI coding assistant.

---

## Non-negotiables (short form)

1. **Originality.** Trustalo is an independent, source-available product. Never copy source, prompts, schemas, or migrations from any third-party compliance tool. Every PR adds the originality attestation in [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md).
2. **AI is advisory and licensed.** No AI code path may directly mutate a customer record. Every suggestion lands in `pending` / `draft` and emits an audit log entry. User-facing Enterprise AI surfaces must call `assertEnterpriseLicense("ai")`; local development may use `TRUSTALO_LICENSE_DEV_BYPASS=1`.
3. **Multi-tenant isolation.** `tenantId` is derived from the JWT, never from a request header. Use `prismaWithTenant` for tenant-scoped queries. The `Tenant` model replaced the historical `Organization` — see [`docs/schema-design-intent.md`](docs/schema-design-intent.md).
4. **Service-to-service auth is HMAC-signed.** API ↔ Collector calls use `lib/service-auth.ts`. The legacy `X-Internal-Key` fallback is being retired.
5. **Secrets at rest are encrypted** with the AES-256-GCM envelope from `apps/api/src/lib/crypto-envelope.ts` (`enc:v1:` prefix). Integration credentials live in the collector `SecretVault` table and are referenced from `IntegrationConnection.secretId`.
6. **Before pushing**: `bun run format && bun run typecheck && bun run lint`.

---

## Operating tips for Claude in this repo

- The runtime is **Bun**, not Node. Use `bun install`, `bun run …`, `bun test`, and short aliases such as `bun dev` / `bun dev:all`. Don't suggest `npm` / `pnpm` / `yarn` commands.
- The unit-test runner is the built-in `bun:test` — `import { describe, expect, test } from "bun:test";`. There is no `vitest` or `jest` configured.
- The web app is Next.js 16 (App Router). The CSP nonce middleware lives at `apps/web/src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`).
- Database identifiers use the **`trustalo`** prefix throughout. A rebrand sweep from `Trustra` → `Trustalo` was completed; new code must use `Trustalo` / `trustalo` / `@trustalo/*`.
- Prettier owns formatting. Do not hand-craft alignment; do not add `// prettier-ignore` without a justifying comment.
- Long-form documentation lives in [`docs/`](docs/). Update the matching doc whenever you change behaviour.

---

## Getting around the codebase

- [Project README](README.md) — overview, architecture, security posture.
- [`docs/installation.md`](docs/installation.md) — first-run setup.
- [`docs/development.md`](docs/development.md) — daily loop, scripts, project structure, conventions.
- [`docs/architecture.md`](docs/architecture.md) — service boundaries and data flow.
- [`docs/database-design.md`](docs/database-design.md) — Prisma + Mongoose schemas.
- [`docs/schema-design-intent.md`](docs/schema-design-intent.md) — column-to-standard mapping; consult before renaming columns or arguing about IP similarity.
- [`docs/api-reference.md`](docs/api-reference.md) — REST endpoints.
- [`docs/ai-features.md`](docs/ai-features.md) — AI configuration, audit, rate limiting, advisory contract.
- [`docs/auth-providers.md`](docs/auth-providers.md) — pluggable auth providers.
- [`docs/integrations.md`](docs/integrations.md) — Collector integration framework.
- [`docs/permissions-matrix.md`](docs/permissions-matrix.md) — RBAC roles and permissions.
- [`docs/people.md`](docs/people.md) — People directory / HR; the `Person` model (replaced `Membership`), self-service, advisory evidence.
- [`docs/device-agent.md`](docs/device-agent.md) — endpoint device-posture agent + Devices UI.
- [`docs/notifications.md`](docs/notifications.md) — notifications & alerting: the periodic rule evaluator, alert rules, email/Slack/Teams channels, env vars.
- [`docs/compliance-frameworks.md`](docs/compliance-frameworks.md) — supported frameworks and mappings.

---

## Subdirectory overrides

Claude Code supports per-directory `CLAUDE.md` files that layer on top of this one. The repo does not currently use subdirectory overrides — if you need a per-app or per-package rule (for example, web-only component conventions), add a `.cursor/rules/*.mdc` with `globs` first so Cursor and the AGENTS.md ecosystem stay aligned, then mirror it as needed.
