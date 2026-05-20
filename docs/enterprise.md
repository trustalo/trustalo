# Trustalo Enterprise Edition (EE)

This document describes the **Enterprise Edition (EE)** of Trustalo: which features it covers, how EE source code is identified in this repository, and the design of the runtime license-key validation that gates EE features in production.

It is the operator- and contributor-facing companion to the binding legal text in [`LICENSE_EE`](../LICENSE_EE) at the repository root.

---

## TL;DR

- Trustalo is **dual-licensed**. The core is source-available and free for organizations under USD 1 M revenue **and** funding. A subset of files — "EE Files" — are paywalled and require a paid Trustalo Enterprise License for any production use, **regardless of org size**.
- An EE File is any file whose filename contains `.ee.` (e.g. `sso.ee.ts`, `multi-tenant.ee.tsx`) **or** any file located under a directory named `ee` or matching `**/ee/**`.
- The runtime gate is a single helper, `assertEnterpriseLicense(featureId)`, that validates a signed license key from the `TRUSTALO_LICENSE_KEY` env var. EE feature code MUST call it before doing any work.
- The license key is an Ed25519-signed JWT-like token issued by Trustalo. The public verification key ships with the codebase; the signing key never leaves Trustalo.
- This document is the **design** for the runtime gate. The implementation is intentionally not landed yet — see [Implementation roadmap](#implementation-roadmap).

---

## 1. EE feature scope (initial set)

The following capabilities are designated EE from v1.0 onward.

| Feature area | Feature ID(s) | Why it's EE | EE Files in repo |
| --- | --- | --- | --- |
| **SSO / SAML / advanced auth** | `sso` | Enterprise buying signal; high integration burden; not needed by SMBs | `packages/auth-provider-saml.ee/` _(scaffolded; SAML protocol logic to follow)_, `apps/api/src/modules/directory-sync/*.ee.ts` |
| **Multi-org / multi-tenant partner portal** | `multi-tenant` | Used by MSSPs, audit firms, and consultancies who serve multiple client orgs from one deployment | _(planned — `apps/api/src/modules/multi-tenant.ee/`, `apps/web/src/app/(partner).ee/`)_ |
| **AI accelerators** | `ai`, `ai-premium` | LLM inference is expensive, and the AI surface is a primary commercial differentiator; the only AI capabilities that stay free are defence-in-depth utilities (PII scrubbing) and a basic asset-classification bootstrap | See [§1.1 AI scope split](#11-ai-scope-split-free-vs-ee) below |

> **Note — Trustalo ships dual-licensed from day one.** The Core License and Enterprise License are both v1.0 of this project's first public release. There is no pre-existing free grant on EE features to undo: any file matching the EE convention is paywalled from the very first commit it lands in.

### 1.1 AI scope split (free vs EE)

The AI surface is **tiered**. A small set of defensive utilities ships free so any deployment can scrub PII before it reaches a model and run a basic CPS 234 asset-classification bootstrap. Everything that drives a real product workflow — chat, context extraction, questionnaire answering, training-quiz generation, structure agents — is EE.

| AI capability | Tier | Path | Gate |
| --- | --- | --- | --- |
| PII scrubber (defence-in-depth) | Free | `packages/ai/src/extraction/scrub.ts` | none |
| CPS 234 asset-classification bootstrap | Free | `packages/ai/src/extraction/asset-classification.ts` | none |
| AI provider factory + resolver chain | Free | `packages/ai/src/{factory,resolve,errors,types}.ts`, `packages/ai/src/providers/` | none — but the EE features it powers are gated |
| Org-level AI provider config UI/API | Free | `apps/api/src/modules/ai-config/router.ts` (admin endpoints), `apps/api/src/config/ai.ts` | core; the per-feature operations consume it |
| Compliance chat assistant (page-aware chat) | EE | `apps/api/src/modules/chat/router.ee.ts`, `chat/grounding.ee.ts`, `chat/system-prompt.ee.ts` | router-level `assertEnterpriseLicense('ai')` |
| Long-form context extraction from prose | EE | `packages/ai/src/extraction/from-text.ee.ts` | inside `extractContextProposals` |
| Org-context "paste-to-extract" handler | EE | `apps/api/src/modules/organization-context/router.ts` (`POST /from-text` only) | handler-level gate |
| Questionnaire AI answering (single + bulk) | EE | `apps/api/src/modules/questionnaires/answer.ee.ts` | inside `answerOne` and `answerAll`, plus router-level on `POST /:id/answer-all` and `POST /:id/questions/:qid/answer` |
| Questionnaire structure agent (XLSX/DOCX import) | EE | `apps/api/src/modules/questionnaires/structure-agent.ee.ts` | inside `mapXlsxStructure` and `mapDocxStructure`, plus router-level on `POST /` (file upload) |
| Training quiz generation | EE | `packages/ai/src/prompts/quiz.ee.ts`, `apps/api/src/modules/ai-config/router.ts` (`POST /generate-quiz`) | inside `generateQuizQuestions` and at the route handler |

Two feature IDs are reserved:

- `ai` — the umbrella entitlement. Required by every EE-AI entry point above. A token without `ai` cannot run any of them.
- `ai-premium` — reserved for future sub-features that need premium-model selection (Sonnet/Opus tier), agentic workflows, or RAG over a customer's own knowledge base. Tokens that hold `ai-premium` should also hold `ai`; this doc and the issuer script enforce the convention.

Why this split and not "all AI is EE":

- The PII scrubber is a defence-in-depth tool that anyone running Trustalo benefits from regardless of licensing — making it free reduces the chance that an unlicensed deploy still piping data to OpenAI ends up with raw PII in prompts.
- The asset-classification bootstrap is a one-shot extractor with a tiny token footprint and a clear regulatory rationale (CPS 234 §23). Keeping it free preserves a credible "compliance-management without AI accelerators" tier for very small orgs.
- Everything else either has high recurring inference cost, or is the actual product differentiator that justifies the Enterprise License — chat, questionnaire automation, and ingest are the demos that close deals.

The EE feature list is expected to grow. Any new feature classified as EE must:

1. Be approved by the project maintainers before merging.
2. Live in files that match the EE convention (see §2).
3. Call `assertEnterpriseLicense(<featureId>)` at every entry point that performs the EE behavior.
4. Be listed in the table above and in the [Trustalo Enterprise License](../LICENSE_EE) FAQ section of [`README.md`](../README.md).

---

## 2. File naming convention

A file is an "EE File" — and therefore governed by [`LICENSE_EE`](../LICENSE_EE) rather than [`LICENSE`](../LICENSE) — if **any** of the following are true:

| Pattern | Example | Rule |
| --- | --- | --- |
| `.ee.` in filename | `sso.ee.ts`, `tenant-router.ee.tsx`, `policy-prompt.ee.json` | Any file with `.ee.` between two non-empty path segments |
| Directory named `ee` | `apps/api/src/modules/sso/ee/router.ts` | Any file whose path contains a segment exactly equal to `ee` |
| `*.ee/*` directory | `packages/auth-provider-saml.ee/src/index.ts` | Any file whose containing directory name ends with `.ee` |

Recommended layout:

- **Whole packages that are entirely EE:** name the package directory with a `.ee` suffix, e.g. `packages/auth-provider-saml.ee/`. Every file inside is automatically an EE File.
- **A few EE files inside an otherwise-core package:** use the `.ee.` filename suffix, e.g. `apps/api/src/modules/auth/sso.ee.ts`. This keeps the diff small and makes the boundary obvious in code review.
- **An EE-only sub-feature inside a core module:** use an `ee/` subdirectory, e.g. `apps/api/src/modules/ai/ee/agent.ts`.

Anti-patterns to avoid:

- Mixing EE and core logic in the same file. The legal boundary is the file. If the file is core, EVERY line in it is core; if the file is EE, EVERY line is EE. Split the file instead.
- Importing core code from EE is fine. **Importing EE code from core is forbidden** — it would force core users to depend on paywalled code. The build must reject this (see §5).

---

## 3. Runtime license-key validation — design

### 3.1 Goals

1. **Enforceable**: production EE features cannot run without a valid, current, non-revoked, signed license key issued by Trustalo.
2. **Tamper-evident**: removing or short-circuiting the check is a deliberate, source-visible act — making any breach attributable.
3. **Offline-friendly**: most customers run Trustalo in air-gapped or restricted environments. The key MUST validate without a network call to Trustalo.
4. **Cheap to issue**: keys can be generated by Trustalo manually or by a small internal admin tool — no commercial licensing platform needed for v1.
5. **Revocable** without forcing every customer to pull a new build.

### 3.2 Key format

A Trustalo Enterprise License key is a **detached Ed25519-signed compact token** with the structure:

```text
trl_<base64url(payload)>.<base64url(signature)>
```

Where `payload` is JSON:

```json
{
  "v": 1,
  "iss": "trustalo.io",
  "sub": "acme-corp",
  "lid": "lic_01J9XK...",
  "tier": "enterprise",
  "features": ["sso", "multi-tenant", "ai-premium"],
  "max_users": 250,
  "iat": 1716000000,
  "exp": 1747536000,
  "nbf": 1716000000
}
```

| Field | Meaning |
| --- | --- |
| `v` | Schema version. Always `1` for the initial format. |
| `iss` | Issuer — always `"trustalo.io"`. |
| `sub` | Customer identifier (slug or org name) — for logging, not for enforcement. |
| `lid` | Unique license ID — primary key for revocation lookups. |
| `tier` | `"enterprise"` for now; reserved for future tiers like `"team"`, `"partner"`. |
| `features` | Array of feature IDs the key entitles. Validated in `assertEnterpriseLicense(featureId)`. |
| `max_users` | Soft cap; informational only in v1, enforced in a later version. |
| `iat`, `nbf`, `exp` | Standard JWT-style timestamps. `exp` is REQUIRED and short-ish (1y default). |

**Why Ed25519, not JWT/RSA:**

- Ed25519 is small (64-byte signatures), fast, and has a tiny verifier — easy to ship in TypeScript without a heavy crypto dependency.
- The compact, custom-prefixed format (`trl_…`) is deliberately not JWT — it discourages misuse with off-the-shelf JWT libraries that have known footguns (algorithm confusion, `none` algorithm, etc.).
- We control the format end-to-end, including future v2 with rotation/encryption.

### 3.3 Trust root

- Trustalo holds the **Ed25519 private signing key** in an offline secret store (1Password vault for v1; HSM later). It NEVER ships in any artifact.
- The corresponding **public key** is checked into the repo at `packages/license/src/keys/trustalo-license-public.ed25519.pub` and used for verification at runtime. Multiple public keys can be supported in an array to allow key rotation without breaking existing keys.
- Customers paste their issued key into the env var `TRUSTALO_LICENSE_KEY`.

### 3.4 The validator

A single package — `packages/license/` — exports the validator. It is **core, not EE** (it must run in core to gate EE).

```ts
// packages/license/src/types.ts (shipped)
export type FeatureId =
  | "sso"
  | "multi-tenant"
  | "ai" // umbrella entitlement for the AI accelerator surface
  | "ai-premium" // reserved for premium-model / agentic sub-features
  | (string & {});

export interface LicenseClaims {
  v: 1;
  iss: "trustalo.io";
  sub: string;
  lid: string;
  tier: "enterprise";
  features: FeatureId[];
  max_users: number;
  iat: number;
  nbf: number;
  exp: number;
}

export class EnterpriseLicenseError extends Error {
  constructor(
    public readonly featureId: FeatureId,
    public readonly reason: string,
  ) {
    super(`Trustalo Enterprise License required for feature "${featureId}": ${reason}`);
  }
}

export function assertEnterpriseLicense(featureId: FeatureId): void;
export function getLicenseClaims(): LicenseClaims | null;
export function isFeatureEntitled(featureId: FeatureId): boolean;
```

`assertEnterpriseLicense` performs, in order:

1. **Read** `TRUSTALO_LICENSE_KEY` from the environment. If absent, throw `EnterpriseLicenseError(featureId, 'no license key configured')`.
2. **Parse** the `trl_<payload>.<sig>` envelope. Reject malformed input.
3. **Verify** the Ed25519 signature against every trusted public key in `keys/`. Reject if none match.
4. **Decode** the payload, run schema validation (Zod) — reject unknown `v`, missing fields, bad types.
5. **Check temporal claims**: `nbf <= now < exp` (with a 5-minute clock-skew allowance). Reject expired or not-yet-valid keys.
6. **Check feature entitlement**: `featureId` must be in `claims.features`. Reject otherwise.
7. **Check revocation**: see §3.5.
8. If all pass, cache the parsed claims for the process lifetime (claims are immutable for the life of a key) and return.

A small in-memory LRU caches the **verification result** for a given `(key, featureId)` so the EE feature path stays cheap (sub-microsecond).

### 3.5 Revocation

Two-tier strategy, both ship together:

| Mechanism | Pros | Cons | When to use |
| --- | --- | --- | --- |
| **Short `exp`** (max 12 months) | Universally enforced, no infrastructure | Customers must rotate annually | Default. Forces a yearly renewal cycle and naturally limits the blast radius of a leaked key. |
| **CRL via signed manifest** | Allows immediate revocation of a specific `lid` mid-term | Requires an HTTP fetch (with offline fallback) | Only when a key is leaked or a customer breaches contract. |

CRL design:

- Trustalo publishes a signed manifest at `https://license.trustalo.io/crl.json` with shape `{ "revoked": ["lic_01J...", "lic_02K..."], "iat": ..., "sig": "..." }`.
- The validator fetches it at most once per 24 hours, signed with the same Ed25519 key (or a dedicated CRL key).
- If the fetch fails (offline customer), the validator **continues to honor** the locally cached CRL and the `exp` claim. This is the right trade-off — air-gapped customers must not be hard-failed by transient network issues, but a leaked key still expires within at most 24h + the original `exp`.
- A second env var, `TRUSTALO_LICENSE_CRL_URL`, lets enterprise customers point at an internal mirror.

### 3.6 What happens on validation failure

| Failure mode | Behavior |
| --- | --- |
| No key configured AND core feature path | Run normally — core features never call the validator. |
| No key configured AND EE feature path | Fail closed: throw `EnterpriseLicenseError`. The HTTP layer maps it to **402 Payment Required** with a JSON body `{ "error": "enterprise_license_required", "feature": "<id>", "doc": "https://trustalo.io/enterprise" }`. |
| Invalid signature / malformed key | Fail closed. Log a `WARN` (not `ERROR`) — likely a typo. |
| Expired key | Fail closed. Log a `WARN`. The dashboard "License" tile shows an "expired" banner so admins notice. |
| Revoked key | Fail closed. Log an `ERROR`. The license page shows the revocation reason if Trustalo provided one in the CRL. |
| Feature not entitled | Fail closed for that specific feature. Other entitled EE features keep working. |

EE features must NEVER silently degrade to a less-capable behavior — that would let users run "almost EE" without a key. Always fail visibly.

### 3.7 Where the check is called

- **API services**: `assertEnterpriseLicense(featureId)` is called at the top of every EE route handler. Optionally, an Express middleware checks at router-mount time so an unentitled feature returns 402 before doing any work.
- **Background jobs / cron**: at the start of the job's run loop. Jobs gated by EE silently skip themselves with a single log line per hour.
- **Web (Next.js)**: SSR / RSC pages that render EE UI do their own check; if it throws, render a "Contact sales for Enterprise" page instead. The check ALSO happens server-side on every API call — never trust the client.
- **CLI / collector**: at startup, before scheduling EE syncs.

### 3.8 What developers see locally

- Without `TRUSTALO_LICENSE_KEY`, EE features fail with a clear error. Core features work normally.
- The fastest path to unblock local dev is the env var **`TRUSTALO_LICENSE_DEV_BYPASS=1`**, which short-circuits the validator with a synthesised `tier: "developer"` claim entitling every feature. The bypass is **hard-rejected** when `NODE_ENV === "production"`, so it cannot be left in by accident.
- For dev that needs to exercise the actual key path (e.g. testing the 402 response), `bun run license:issue-dev` (in `packages/license/`) generates a short-lived (`tier: "developer"`, 30-day default) signed token using a local keypair. Like the bypass, dev tokens are refused in production builds.
- Workspace tests for EE-only files (e.g. `packages/ai/src/extraction/from-text.ee.test.ts`, `packages/ai/src/prompts/quiz.ee.test.ts`) set `TRUSTALO_LICENSE_DEV_BYPASS=1` at the top of the file. New EE tests should follow the same pattern.

---

## 4. Issuing license keys

License keys are issued by Trustalo's private admin tooling, which is not part of this open repository. Customers receive the `trl_…` string by encrypted email or via the Trustalo Cloud dashboard.

The public verification key for the production signing keypair ships in this repository — see [§3.3 Trust root](#33-trust-root) — so any token the validator accepts is provably signed by Trustalo. The corresponding private key never leaves Trustalo's offline secret store and is never present on customer infrastructure.

For local development, see [§3.8 What developers see locally](#38-what-developers-see-locally) — `TRUSTALO_LICENSE_DEV_BYPASS=1` and `bun run license:issue-dev` cover both supported flows.

---

## 5. Build-time and CI enforcement

In addition to the runtime check, several CI gates protect the EE boundary:

1. **Import-direction lint.** ESLint rule (custom or `eslint-plugin-boundaries`) that fails the build if any non-EE file `import`s an EE file. Core must never depend on EE.
2. **EE-coverage check.** A short script (`scripts/license/check-ee-gates.ts`) walks every EE File and asserts that at least one call to `assertEnterpriseLicense(...)` is reachable from the file's exports. Configurable allowlist for pure-data EE files (e.g. seed data).
3. **License header.** EE files must start with the comment `// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0`. Enforced by a header-check workflow (similar to the existing `no-vendored-agpl.yml`).
4. **Public-key integrity.** A workflow verifies that the checked-in `trustalo-license-public.ed25519.pub` matches a known SHA256 (the actual public-key bytes are not secret, but tamper-detection is cheap). If a contributor PR accidentally changes the public key, CI fails loudly.

---

## 6. Operational checklist for adding a new EE feature

1. **Confirm classification.** EE-by-default for: SSO/SAML, multi-tenant, premium AI, advanced compliance (e.g. HIPAA/CMMC), partner-portal, white-label. Ask in the issue before coding if unsure.
2. **Place files correctly.** Use `.ee.` filename suffix or a `*.ee/` package — see §2.
3. **Add a feature ID.** Append to the `FeatureId` union in [`packages/license/src/types.ts`](../packages/license/src/types.ts) and to the EE feature list in this doc.
4. **Gate every entry point** with `assertEnterpriseLicense('<id>')`. Confirm with `bun run license:check`.
5. **Write a 402 response.** API routes return JSON with the standard payload (§3.6).
6. **Update README + docs.** Mention the new feature in the EE table at the top of this file and in the `README.md` license section.
7. **Tests.** Two paths: with a valid dev key (works), without a key (fails with `EnterpriseLicenseError` and 402).

---

## 7. What's deliberately out of scope for v1

- **Hardware-bound licenses** (machine fingerprinting). Adds support burden, customers hate it, easy to bypass. Skip.
- **Online-only activation.** Air-gapped customers must keep working. Skip.
- **Per-seat metering with phone-home.** v1 trusts the `max_users` claim and audits via contract. Real metering is a future feature, opt-in by the customer.
- **DRM / obfuscation of EE source.** EE source remains readable. The legal threat (LICENSE_EE §3) plus the "removing the check is provably deliberate" property is the deterrent. Trying to hide the source defeats the source-available value-prop.

---

## 8. Implementation roadmap

This document is the design. The implementation lands in three phases:

| Phase | Deliverable | Status |
| --- | --- | --- |
| 0 | Legal text (`LICENSE`, `LICENSE_EE`, `CONTRIBUTOR_LICENSE_AGREEMENT.md`) and this design doc | **Done** |
| 1 | `packages/license/` with Ed25519 verifier, `assertEnterpriseLicense`, dev-bypass + dev-key scripts, 20-test suite | **Done** |
| 2a | Scaffold first real EE package: `packages/auth-provider-saml.ee/` (SAML protocol logic stubbed; license gate live) | **Done** |
| 2b | Convert AI accelerators to EE: rename 8 source files (and their tests) to `.ee.ts`, gate every EE entry point, add 402 mapping in the API error handler | **Done** |
| 2c | Multi-org / partner portal under `apps/api/src/modules/multi-tenant.ee/` and `apps/web/src/app/(partner).ee/` | Not started |
| 2d | CI guards from §5 (import-direction lint, EE-coverage check, SPDX-header workflow, public-key integrity) | Not started |
| 3 | CRL endpoint + 24h fetcher + dashboard "License" tile | Not started |

Cross-references: see [`docs/auth-providers.md`](auth-providers.md) for the auth provider contract that EE auth providers will plug into, and [`docs/ai-features.md`](ai-features.md) for the AI resolver chain that gates premium AI behind EE.
