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

If this PR adds or modifies a compliance framework, walk every checkbox in
[`.cursor/rules/adding-frameworks.mdc`](../.cursor/rules/adding-frameworks.mdc)
and confirm each is addressed (or marked N/A with a reason).

- [ ] Walked the framework checklist; all items addressed or N/A.

## AI feature changes (skip if N/A)

If this PR adds or modifies any LLM-using code path, walk every checkbox in
[`.cursor/rules/ai-features.mdc`](../.cursor/rules/ai-features.mdc).

- [ ] Provider resolved exclusively via `resolveOrgAI` / `resolveAIProvider`
- [ ] Every AI call audit-logged with `feature`, `provider`, `model`, `outcome`
- [ ] Endpoint is rate-limited per tenant + feature
- [ ] No record is mutated without explicit user acceptance (advisory only)
- [ ] LLM responses parsed via Zod schema (no raw `JSON.parse`)
- [ ] AI features table in `ai-features.mdc` updated if a new feature was added

## Required attestations

- [ ] **C1 — Original work.** All code in this PR is original work or sourced from a permissively-licensed dependency declared in `package.json`. I have not copied code, prompts, schemas, or migrations from any third-party compliance product.
- [ ] **C2 — Operator-configurable AI.** Any AI behaviour added in this PR is configurable at deployment time via env vars (operator default) and per-org overrides — no provider or model is hardcoded.
