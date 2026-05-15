<!--
Pull-request template for Trustalo. Please complete every applicable
section. The two attestations at the bottom (C1 and C2) are required
for every PR that touches AI features. Reviewers must verify them, not
just trust the box.
-->

## Summary

<!-- 1-3 sentences explaining the change and why. Link the Linear / GitHub issue. -->

## Changes

-

## Screenshots / recordings (UI changes)

<!-- Drag in before/after for any user-visible change. -->

## Test plan

- [ ] Unit / integration tests added or updated
- [ ] Manual smoke test against `bun dev` stack
- [ ] Migrations applied cleanly on a fresh DB (`bun run prisma migrate reset`)
- [ ] `bun run typecheck` passes in `apps/api` and `apps/web`
- [ ] `bun run lint` passes

## Framework changes (skip if N/A)

If this PR adds or modifies a compliance framework, review [`docs/compliance-frameworks.md`](../docs/compliance-frameworks.md) and confirm the change is consistent with the documented structure, status conventions, and mappings (or note any deviation in the Summary above).

- [ ] Reviewed the framework documentation; change is consistent or deviation is documented.

## AI feature changes (skip if N/A)

If this PR adds or modifies any LLM-using code path, review [`docs/ai-features.md`](../docs/ai-features.md) and confirm each item below.

- [ ] Provider resolved exclusively via `resolveOrgAI` / `resolveAIProvider`
- [ ] Every AI call audit-logged with `feature`, `provider`, `model`, `outcome`
- [ ] Endpoint is rate-limited per tenant + feature
- [ ] No record is mutated without explicit user acceptance (advisory only)
- [ ] LLM responses parsed via Zod schema (no raw `JSON.parse`)
- [ ] AI features table in `docs/ai-features.md` updated if a new feature was added

## Required attestations

- [ ] **C1 — Original work.** All code in this PR is original work or sourced from a permissively-licensed dependency declared in `package.json`. I have not copied code, prompts, schemas, or migrations from any third-party compliance product.
- [ ] **C2 — Operator-configurable AI.** Any AI behaviour added in this PR is configurable at deployment time via env vars (operator default) and per-org overrides — no provider or model is hardcoded.
