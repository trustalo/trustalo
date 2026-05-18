# AGENTS.md

Persistent guidance for AI coding agents working in this repository.

This file is loaded by tools that follow the [AGENTS.md convention](https://github.com/openai/codex/blob/main/AGENTS.md) (Codex, Aider, Continue, OpenCode, GitHub Copilot Workspace, and others). Cursor users get the same rules from [`.cursor/rules/*.mdc`](.cursor/rules/); Claude Code users from [`CLAUDE.md`](CLAUDE.md). The Cursor `.mdc` files are the **single source of truth** — this file is a vendor-neutral pointer, not a re-statement.

---

## Read these first

| Topic | Source of truth | When it applies |
| --- | --- | --- |
| Code formatting (Prettier) | [`.cursor/rules/prettier-formatting.mdc`](.cursor/rules/prettier-formatting.mdc) | Always. Run `bun run format` before any commit; CI gate is `bun run format:check`. |
| AI feature contract | [`.cursor/rules/ai-features.mdc`](.cursor/rules/ai-features.mdc) | Any LLM or AI-feature path in `apps/api`, `apps/collector`, `apps/web`, `packages/ai`, or `packages/license`. |
| Enterprise features | [`.cursor/rules/enterprise-features.mdc`](.cursor/rules/enterprise-features.mdc) | Any `.ee.*` file, `**/ee/**` path, `.ee` package, or license-gated feature. |
| Adding a new framework | [`.cursor/rules/adding-frameworks.mdc`](.cursor/rules/adding-frameworks.mdc) | Any PR that touches `apps/api/prisma/frameworks/**` or framework-aware UI. |
| Pull requests | [`.cursor/rules/pull-request-template.mdc`](.cursor/rules/pull-request-template.mdc) | Any time an agent creates or updates a PR. |

A change that violates any of the rules above should fail review.

---

## Non-negotiables (short form)

1. **Originality.** Trustalo is an independent, source-available product. No copy-pasted source, prompts, schemas, or migrations from any third-party compliance tool. Inspiration is fine; vendoring is not. Every PR adds the originality attestation in [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md). CI enforces this through `no-vendored-agpl.yml` and `license-check.yml`.
2. **AI is advisory and licensed.** No AI code path may directly mutate a customer record. Every suggestion lands in a `pending` / `draft` state with an audit log entry. User-facing Enterprise AI surfaces must call `assertEnterpriseLicense("ai")`; local development may use `TRUSTALO_LICENSE_DEV_BYPASS=1`.
3. **Multi-tenant isolation.** `tenantId` is derived from the JWT in `authenticate` middleware and propagated through `prismaWithTenant(...)`. **Never** trust `X-Tenant-Id` / `X-Organization-Id` (or any other header) for tenant identity. The isolation boundary is the `Tenant` model — see [`docs/schema-design-intent.md`](docs/schema-design-intent.md) for the standards mapping.
4. **Service-to-service auth is HMAC-signed.** API ↔ Collector calls go through `lib/service-auth.ts`. The static `X-Internal-Key` fallback is being retired — do not add new callers that rely on it.
5. **Secrets at rest are encrypted.** AI provider keys live in the API database; integration credentials live in the collector `SecretVault` model. Both use the AES-256-GCM envelope from `apps/api/src/lib/crypto-envelope.ts` (versioned `enc:v1:` prefix). Connection rows reference vault rows via `secretId` — never carry ciphertext inline.
6. **Run the gates before pushing**: `bun run format && bun run typecheck && bun run lint`.

---

## Getting around the codebase

- [Project README](README.md) — overview, architecture, security posture.
- [`docs/installation.md`](docs/installation.md) — first-run setup.
- [`docs/development.md`](docs/development.md) — daily loop, scripts, project structure, conventions.
- [`docs/architecture.md`](docs/architecture.md) — service boundaries and data flow.
- [`docs/database-design.md`](docs/database-design.md) — Prisma + Mongoose schemas.
- [`docs/schema-design-intent.md`](docs/schema-design-intent.md) — column-to-standard mapping; cite when renaming or comparing columns.
- [`docs/api-reference.md`](docs/api-reference.md) — REST endpoints.
- [`docs/ai-features.md`](docs/ai-features.md) — AI configuration, audit, rate limiting, advisory contract.
- [`docs/auth-providers.md`](docs/auth-providers.md) — pluggable auth providers.
- [`docs/integrations.md`](docs/integrations.md) — Collector integration framework.
- [`docs/permissions-matrix.md`](docs/permissions-matrix.md) — RBAC roles and permissions.
- [`docs/compliance-frameworks.md`](docs/compliance-frameworks.md) — supported frameworks and mappings.

---

## When in doubt

- Pattern not covered by a rule? Open an issue first; don't invent conventions in a PR.
- A rule and the code disagree? The rule wins. Update the code, then reference the rule in the PR description.
- A rule is wrong or outdated? Fix the `.cursor/rules/*.mdc` file and re-export the summary to `AGENTS.md` and `CLAUDE.md` in the same PR.
