# Trustalo — AI Features Reference

> Scope: `/Users/nuwan/workspace/workhub24/trustalo`. Generated from a code-grounded review of `packages/ai`, `apps/api/src/modules/*`, `apps/collector/src/*`, and `apps/web/src/*`. Every feature below is wired to a real route/file; deprecated or planned items are called out.

## Table of Contents

1. [Architecture overview](#1-architecture-overview)
2. [Core AI package (`@trustalo/ai`)](#2-core-ai-package-trustaloai)
3. [Configuration & resolution](#3-configuration--resolution-resolveorgai)
4. [Feature catalog (one row per LLM feature)](#4-feature-catalog)
5. [AI features in detail](#5-ai-features-in-detail)
   - 5.1 [Compliance Assistant chat](#51-compliance-assistant-chat-chat_assistant)
   - 5.2 [Context extraction (paste-to-context)](#52-context-extraction-context_extraction)
   - 5.3 [Questionnaire structure agent](#53-questionnaire-structure-agent-questionnaire_answering)
   - 5.4 [Questionnaire AI answering](#54-questionnaire-ai-answering-questionnaire_answering)
   - 5.5 [Policy AI Write (generate / rewrite / expand / summarize / improve)](#55-policy-ai-write-policy_generation)
   - 5.6 [Policy: draft from organization context](#56-policy-draft-from-context-policy_generation)
   - 5.7 [Risk score suggestion](#57-risk-score-suggestion-risk_scoring)
   - 5.8 [Vendor tier suggestion](#58-vendor-tier-suggestion-vendor_scoring)
   - 5.9 [Integrations: NL → automated check spec](#59-integrations--natural-language-to-automated-check-automated_check_generation)
   - 5.10 [Evidence collection agent (multi-turn tool loop)](#510-evidence-collection-agent-evidence_agent)
   - 5.11 [Training quiz generator](#511-training-quiz-generator-quiz_generation)
   - 5.12 [Vendor research (deep / scheduled)](#512-vendor-research-collector-only-not-via-resolveorgai)
6. [AI Governance module (no LLM)](#6-ai-governance-module-no-llm)
7. [Cross-cutting concerns](#7-cross-cutting-concerns)
8. [Known gaps & alternatives](#8-known-gaps--alternatives)

---

## 1. Architecture overview

Trustalo is a Bun monorepo with three apps and one shared AI package:

| Component | Path | Role in AI |
| --- | --- | --- |
| `apps/api` (Express, port 4000) | `apps/api/src/modules/**` | Owns most LLM features and routes them through `resolveOrgAI`. |
| `apps/collector` (Express, port 4001) | `apps/collector/src/*` | Runs two LLM workloads off the API process: **evidence agent** loop and **vendor research**. |
| `apps/web` (Next.js 16) | `apps/web/src/**` | UI: chat drawer, advisory banners, AI Write modal, evidence agent panel, AI usage dashboard, AI settings. |
| `packages/ai` (`@trustalo/ai`) | `packages/ai/src/*` | Provider abstraction, resolution precedence, error sanitizer, PII scrub, context extraction helper, quiz prompt helper. |

There are **two distinct LLM execution paths**:

1. **Standard path** — every API LLM feature uses `resolveOrgAI(tenantId, feature)` → returns `{ client, model, providerSource }` → call `client.chat(...)`. Provider/model are tenant-configurable.
2. **Vendor research path** — collector calls the OpenAI SDK directly with `process.env.OPENAI_MODEL ?? "gpt-4o"`. This path is **not** governed by per-org `AIFeatureConfig` (intentional today, see [§8](#8-known-gaps--alternatives)).

---

## 2. Core AI package (`@trustalo/ai`)

Located at `packages/ai/src/`. This package is consumed as TypeScript source (`main` / `types` → `./src/index.ts`).

### 2.1 Public surface (`index.ts`)

Re-exports from:

- `types.ts` — `AIProvider`, `AIProviderType`, `AIFeatureType`, `ChatMessage`, `ChatCompletionOptions`, `ChatCompletionResult`, plus catalogs `PROVIDER_LABELS`, `PROVIDER_MODELS`, `PROVIDER_DEFAULT_MODEL`, `FEATURE_LABELS`.
- `factory.ts` — `createAIProvider(credentials, model)`.
- `resolve.ts` — `resolveAIProvider`, `AINotConfiguredError`, `OperatorAIDefaults`, `OrgProviderRow`, `OrgFeatureRow`, `ResolveContext`, `ResolvedAI`.
- `errors.ts` — `AIProviderError`, `AIProviderErrorKind`, `wrapProviderError`.
- `extraction/from-text.ts` — `extractContextProposals`, `CONTEXT_CATEGORIES`, related types.
- `extraction/asset-classification.ts` — `extractAssetClassifications`, `ASSET_SENSITIVITY_TIERS`, `ASSET_CRITICALITY_TIERS`, related types. CPS 234 Para 23 bootstrap helper.
- `extraction/scrub.ts` — `scrubPii`, `ScrubResult`.
- `prompts/quiz.ts` — `generateQuizQuestions`.

### 2.2 Provider contract

```typescript
interface AIProvider {
  chat(options: ChatCompletionOptions): Promise<ChatCompletionResult>;
}

interface ChatCompletionOptions {
  messages: ChatMessage[]; // role: system | user | assistant
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json"; // honored by OpenAI/OpenRouter only
}

interface ChatCompletionResult {
  content: string;
  model: string;
  usage?: { promptTokens; completionTokens; totalTokens };
}
```

- **Streaming**: not exposed by the abstraction.
- **Tool / function calling**: not exposed by the abstraction.
- **JSON mode**: structurally supported, but only **OpenAI** and **OpenRouter** actually pass `response_format: { type: "json_object" }` to the upstream API. Anthropic and Bedrock paths rely on prompt instructions + post-parse fence-stripping.

### 2.3 Provider implementations

| Provider | File | Transport | JSON mode | Notes |
| --- | --- | --- | --- | --- |
| OpenAI | `providers/openai.ts` | `openai` SDK `chat.completions.create` | Yes (`response_format`) | Default `temperature` 0.7, `max_tokens` 4096. |
| Anthropic | `providers/anthropic.ts` | Direct `fetch` to `/v1/messages` (no SDK) | Prompt-only | Splits system from user/assistant; header `anthropic-version: 2023-06-01`. |
| Bedrock | `providers/bedrock.ts` | Manual SigV4 to `bedrock-runtime.<region>.amazonaws.com/.../converse` | Prompt-only | Credentials: `useDefaultChain` → `@aws-sdk/credential-providers` `fromNodeProviderChain()`; static keys; final fallback to default chain. Region from `credentials.region` → `AWS_REGION` → `us-east-1`. |
| OpenRouter | `providers/openrouter.ts` | `openai` SDK with `baseURL: openrouter.ai/api/v1` | Yes | Sends fixed `HTTP-Referer: https://trustalo.app` and `X-Title: Trustalo` headers. |

All providers wrap upstream errors in `AIProviderError` via `wrapProviderError(provider, raw)`, classified into kinds: `auth | rate_limit | timeout | bad_request | server_error | unavailable | unknown`. `Error.message` is set to the sanitized `publicMessage` so raw SDK strings (which can leak partial keys) never reach clients.

### 2.4 Default models (`PROVIDER_DEFAULT_MODEL`)

```
openai     → gpt-4o-mini
anthropic  → claude-3-5-sonnet-20241022
bedrock    → anthropic.claude-3-5-sonnet-20241022-v2:0
openrouter → openai/gpt-4o-mini
```

Used when an org enables a provider without specifying a model (and the operator hasn't set `AI_DEFAULT_MODEL`).

### 2.5 Helpers in the package

- **`scrubPii(text)`** — regex-based redaction of email, phone, IP, large numbers, URL credentials. Returns `{ text, redactions, total }`. Run on user-supplied text **before** it reaches any provider in chat and context-extraction.
- **`extractContextProposals(provider, input)`** — system+user prompts ask for compliance org-facts proposals; caps proposals at 8 (ceiling 20), truncates input at 12k chars, limits existing-fact refs to 60. Calls `provider.chat({ temperature: 0.1, responseFormat: "json", maxTokens: 1500 })`. Strips markdown fences, validates with Zod `ExtractionResultSchema`, falls back to per-element `rescuePartial`. Strips invalid `supersedesContextId`.
- **`extractAssetClassifications(provider, input)`** — CPS 234 Para 23 bootstrap. Reads pasted architecture / data-flow prose and returns `(name, sensitivity, criticality, kind?, confidence)` proposals using fixed tier vocabularies (`Restricted | Confidential | Internal | Public` × `Critical | High | Medium | Low`). Default cap 12 (ceiling 30). Mirrors `extractContextProposals` conventions: PII pre-pass via `scrubPii`, `provider.chat({ temperature: 0.1, responseFormat: "json", maxTokens: 1500 })`, Zod-validated with per-element `rescuePartial`. The helper is **not yet wired to an API route**; callers (today: anticipated `/api/v1/assets/from-text`) are responsible for `resolveOrgAI("context_extraction")` resolution, audit logging, and rate-limiting. See [§8](#8-known-gaps--alternatives).
- **`generateQuizQuestions(provider, input)`** — quiz prompt builder; calls `provider.chat({ temperature: 0.7, maxTokens: 4096, responseFormat: "json" })`. Throws if `questions` is missing in the response.

### 2.6 What the package does **not** do

- No retries / backoff.
- No streaming.
- No tool/function-calling.
- No usage aggregation, costing, or billing — `usage` is returned per call but not collected here.

---

## 3. Configuration & resolution (`resolveOrgAI`)

The orchestrator that every API LLM feature goes through:

`apps/api/src/config/ai.ts` exposes:

```typescript
resolveOrgAI(tenantId: string, feature: AIFeatureType): Promise<ResolvedAI>
//   ResolvedAI = { client: AIProvider, model: string, providerSource: AIResolutionSource }
```

Internally it loads operator defaults from `process.env`, loads cached org Prisma rows (`AIProviderConfig`, `AIFeatureConfig`), and delegates to `resolveAIProvider` in `packages/ai/src/resolve.ts`.

### 3.1 Resolution precedence (finest first)

1. **Per-feature row** (`AIFeatureConfig` for `(tenantId, feature)`, `isEnabled`):
   - Use `featureRow.provider` and `featureRow.model`.
   - Credentials come from a matching enabled `AIProviderConfig` row, OR — if none — operator credentials, but **only if** `operator.provider === featureRow.provider` and operator is enabled.
   - If credentials cannot be resolved, the feature row is **dangling** and skipped (falls through to next step).

2. **Per-org default provider** — first `isEnabled` `AIProviderConfig` row.
   - Model = operator's `AI_DEFAULT_MODEL` if set, else `PROVIDER_DEFAULT_MODEL[orgProvider.provider]`.

3. **Operator default** (`process.env`):
   - `AI_PROVIDER` ∈ `openai | anthropic | bedrock | openrouter | none`.
   - `AI_DEFAULT_MODEL` (optional).
   - Provider-specific keys: `OPENAI_*`, `ANTHROPIC_*`, `OPENROUTER_*`, Bedrock `AI_BEDROCK_*` (or default IAM chain).

4. **None of the above** → throws `AINotConfiguredError` (mapped to **HTTP 503** by `error-handler.ts`).

### 3.2 Credential merge (BYOK)

`mergeCredentials` in `resolve.ts`: org row wins per field, operator fills gaps. For Bedrock, if the org leaves static keys empty, `useDefaultChain` is inherited from the operator default — so an org can rely on the platform's IAM role.

Important: if the operator picks a provider but its required credentials are missing, AI is **fail-closed** with a clear `disabledReason`. There is no silent switch to another provider — this is intentional for compliance/trust.

### 3.3 Caching

`config/ai.ts` caches loaded rows for **5 minutes** per org. `invalidateAIConfigCache(tenantId)` is called from `ai-config/router.ts` whenever a provider or feature row is upserted or deleted.

### 3.4 Org-level configuration UI/API (`/api/v1/ai-config`)

All routes require `settings:read` / `settings:write`. Base: `apps/api/src/modules/ai-config/router.ts`.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/providers` | Lists `AIProviderConfig`, **secrets masked**. |
| PUT | `/providers/:provider` | Upsert with `apiKey`, `region`, `accessKeyId`, `secretAccessKey`, `baseUrl`, `isEnabled`. |
| DELETE | `/providers/:provider` | Removes the row. |
| POST | `/providers/:provider/test` | Sends `Say 'connected' in one word.` against a per-provider default test model. |
| GET | `/features` | Lists `AIFeatureConfig`. |
| PUT | `/features/:feature` | Upsert `provider`, `model`, `isEnabled?`. |
| DELETE | `/features/:feature` | Remove override. |
| GET | `/health` | For each `FEATURE_LABELS` key, runs `resolveOrgAI` and returns `ok / provider / model / source` or `error`. For `quiz_generation`, also runs a 1-token chat to measure latency. |
| POST | `/generate-quiz` | See [§5.11](#511-training-quiz-generator-quiz_generation). |

Caveat: the route's Zod `featureEnum` does **not** include `chat_assistant`, `context_extraction`, or `evidence_agent`, even though those exist in the Prisma `AIFeature` enum and are resolved at runtime. To configure those per-feature today, rows must be set via DB/seeds. See [§8](#8-known-gaps--alternatives).

### 3.5 Prisma data model (`prisma/schema/ai-config.prisma`)

- **`AIProviderConfig`** — one row per `(tenantId, provider)`. Fields: `apiKey?`, `region?`, `accessKeyId?`, `secretAccessKey?`, `baseUrl?`, `isEnabled`.
- **`AIFeatureConfig`** — one row per `(tenantId, feature)`. Fields: `provider`, `model`, `isEnabled`.
- **`AIFeature` enum** — covers all features in [§4](#4-feature-catalog).

---

## 4. Feature catalog

| # | Feature key | User-facing surface | Where (API path) | Provider used | Sync/Async |
| --- | --- | --- | --- | --- | --- |
| 1 | `chat_assistant` | Compliance Assistant chat drawer | `POST /api/v1/chat/conversations/:id/turn[/stream]` | `resolveOrgAI` | Sync chat; SSE transport (single-token frame today) |
| 2 | `context_extraction` | Settings → AI context "Paste text"; chat side-effect | `POST /api/v1/organization-context/from-text`; chat turn second pass | `resolveOrgAI` | Sync |
| 3 | `questionnaire_answering` | Questionnaire **import** mapping | `POST /api/v1/questionnaires` (file/CSV) | `resolveOrgAI` | Async (in-process `setImmediate`) |
| 4 | `questionnaire_answering` | Questionnaire **AI answer** (single + bulk) | `POST /api/v1/questionnaires/:id/answer-all` and `…/questions/:qid/answer` | `resolveOrgAI` | Sync (bulk: bounded concurrency 4) |
| 5 | `policy_generation` | Rich-text editor "AI Write" | `POST /api/v1/policies/:id/ai/generate` | `resolveOrgAI` | Sync |
| 6 | `policy_generation` | "Generate from context" placeholder fill | `POST /api/v1/policies/:id/ai/draft-from-context` | `resolveOrgAI` | Sync |
| 7 | `risk_scoring` | Risk detail "AI suggestion available" | `POST /api/v1/risks/:id/ai-suggest-score` | `resolveOrgAI` | Sync |
| 8 | `vendor_scoring` | Vendor detail "Suggest tier" | `POST /api/v1/vendors/:id/ai-suggest-tier` | `resolveOrgAI` | Sync |
| 9 | `automated_check_generation` | Custom integration "from prompt" | `POST /api/v1/integrations/from-prompt` | `resolveOrgAI` | Sync |
| 10 | `evidence_agent` | Control evidence agent run | `POST /api/v1/controls/:id/evidence-config/run` → collector `agent/llm-loop.ts` | `resolveOrgAI` (creds passed to collector) | Async (collector); HTTP 202 |
| 11 | `quiz_generation` | Settings AI / Training quiz | `POST /api/v1/ai-config/generate-quiz` | `resolveOrgAI` | Sync |
| 12 | (env `OPENAI_MODEL`) | Vendor research deep dive | `POST /api/v1/vendors/:id/research` → SQS → collector `research/vendor-researcher.ts` | OpenAI SDK directly | Async (SQS) |

---

## 5. AI features in detail

### 5.1 Compliance Assistant chat (`chat_assistant`)

- **Module:** `apps/api/src/modules/chat/` (`router.ts`, `grounding.ts`, `system-prompt.ts`).
- **UI:** `apps/web/src/components/chat/{chat-provider,chat-drawer,chat-fab}.tsx` mounted from `(dashboard)/layout.tsx`.
- **Auth:** `authorizeResource("settings:read", "settings:write")` on the router.

#### Purpose

In-app compliance assistant that answers natural-language questions about the organization's compliance posture (policies, risks, vendors, controls, frameworks, prior chat) using **only** data assembled into a server-built grounding bundle. It **cannot mutate tenant state**. New facts the assistant infers from user input become **`TenantContextProposal`** rows for human review.

#### Routes

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/v1/chat/conversations` | Lists conversations created by the current user. Optional `includeArchived`. |
| POST | `/api/v1/chat/conversations` | Creates a new conversation. Optional `title`. |
| PATCH | `/api/v1/chat/conversations/:id` | `title`, `archive`. |
| DELETE | `/api/v1/chat/conversations/:id` | Hard delete; messages cascade. |
| GET | `/api/v1/chat/conversations/:id/messages` | Full transcript. |
| POST | `/api/v1/chat/conversations/:id/turn` | Non-streaming turn. |
| POST | `/api/v1/chat/conversations/:id/turn/stream` | SSE: `token`, `complete`, `proposals`, `error`. |
| GET | `/api/v1/chat/proposals/stream` | SSE of pending `TenantContextProposal` (LISTEN/NOTIFY + 60 s safety refresh). |

#### Turn body

```json
{
  "message": "string (≤ 4000 chars; PII-scrubbed before LLM)",
  "pageContext": {
    "path": "/risks/abc",
    "title": "...",
    "recordKind": "risk | policy | vendor | control | framework",
    "recordId": "..."
  }
}
```

#### Flow (`runChatTurn`)

1. Persist the user `Message` (raw content, for the transcript).
2. **Build the grounding bundle** via `buildGroundingBundle` — parallel tenant-scoped reads of `TenantContext`, policy summaries, risks, vendors, controls, frameworks, recent messages; optional **focus row** from `pageContext`. Hard caps; deterministic SHA-256 `groundingHash` over the citation set + page context.
3. **`scrubPii`** on the user's text for outbound LLM calls.
4. Resolve `chat_assistant` → call `client.chat(messages, responseFormat: "json", temperature: 0.2)`.
5. **Parse the assistant envelope** (`{ answer, citations[] }`); `filterValidCitations` drops hallucinated ids; falls back to a plain answer string if parse fails.
6. Persist the assistant `Message` with `groundingHash`, citations, and model metadata. Set conversation title from the first response if needed.
7. Audit: `ChatAIAssistantTurn`.
8. If the per-feature rate-limit token allows, run a parallel **context extraction** pass (see [§5.2](#52-context-extraction-context_extraction)) on the user's text; create `TenantContextProposal` rows; update `message.proposalIds`; `pg_notify` subscribers.

#### Prompt (assistant)

System prompt built in `system-prompt.ts` + `grounding.renderBundleAsPrompt`:

- Role: "Trustalo's compliance assistant".
- Hard rules: only use the grounding bundle and this conversation; no state mutation; no secrets/PII; cite using bundle ids.
- **Framework personas (`buildFrameworkPersonas`)** — when the tenant has adopted a regulated framework, a small persona block is injected between the global rules and the grounding bundle. Today wired for `cps234` (72-hour Para 33 clock, 10-business-day Para 35 clock, materiality cues) and `gdpr` (Art. 33 hook). Detected by `Framework.frameworkType` (the stable enum key), not by display name, and unit-tested in `system-prompt.test.ts`. Bundle version bumped to `v1.1` to invalidate prior `groundingHash` reproducibility audits.
- Output: a **single JSON object** `{ answer: markdown, citations: [{kind, id}] }` where `kind ∈ policy | risk | vendor | control | framework | context | message`.

#### Streaming behavior

`AIProvider.chat()` returns a full completion today, so the `/turn/stream` route emits **one** `event: token` containing the full `delta`, then `complete` (and optionally `proposals`). The contract is forward-compatible with true token streaming.

#### Rate limits (in-process)

- 30 turns/min per org for `chat_assistant`.
- 30 extractions/min per org for `context_extraction` (separate bucket).

#### Whether it's RAG

Not vector RAG — there is no embedding search. It is **structured retrieval + grounding**: the server selects fixed slices of relational data with hard caps and a stable hash. Citations are validated against the bundle.

#### DB (`prisma/schema/chat.prisma` + `organization-context.prisma`)

- `Conversation`, `Message` (`modelUsed`, `providerSource`, `groundingHash`, `citations`, `proposalIds`).
- `TenantContext`, `TenantContextProposal`.

---

### 5.2 Context extraction (`context_extraction`)

Two entry points, same engine.

- **Module:** `apps/api/src/modules/organization-context/router.ts`; engine `packages/ai/src/extraction/from-text.ts`.
- **UI:** `apps/web/src/app/(dashboard)/settings/ai-context/page.tsx` (paste-to-extract); chat drawer "Suggestions" tab also shows the same proposals.
- **Auth:** organization context permissions on the router.

#### Purpose

Turn pasted prose (e.g. a Word doc, security summary) — or a chat message — into a list of reviewable "fact proposals" categorized into `company`, `tech_stack`, `processes`, `data_handling`, `risk_appetite`, `team`. Proposals must be **accepted by a human** before they merge into `TenantContext`. Supports `supersedesContextId` so an updated fact can replace an older one.

#### Routes

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/v1/organization-context/from-text` | Body `{ text: 20–20 000 chars, maxProposals?: 1–20 }`. Response `{ proposals, dropped, redactions, modelUsed, providerSource }`. |
| GET | `/api/v1/organization-context/proposals` | Pending proposals (drives chat "Suggestions" tab and Settings). |
| POST | `/api/v1/organization-context/proposals/:id/accept` | Promotes proposal to `TenantContext` in a transaction. **No LLM**. |
| POST | `/api/v1/organization-context/proposals/:id/reject` | Marks rejected. **No LLM**. |

#### Flow

1. Rate limit (`consumeToken` `context_extraction`).
2. `scrubPii(text)` (returns redaction counts surfaced in the response for the UI).
3. Load active `organizationContext` ids/categories/questions (no answer text — used as supersede hints).
4. `resolveOrgAI(tenantId, "context_extraction")`.
5. `extractContextProposals(ai.client, { text, existingContext, maxProposals })` — builds the prompt below, calls `provider.chat({ temperature: 0.1, responseFormat: "json", maxTokens: 1500 })`, validates with Zod (with per-element `rescuePartial`).
6. Insert each surviving proposal into `TenantContextProposal` with provenance (`modelUsed`, `providerSource`, redactions).
7. Audit + `pg_notify` chat subscribers.

#### Prompt (summary)

- **System:** "compliance analyst extracting durable org facts"; output strictly `{ "proposals": [...] }`; categories enum; no PII; superseding rules.
- **User:** "Extract up to N…" + scrubbed text (truncated at 12 000 chars) + list of existing `(id, category, question)` entries (no answer text) + cap reminder.

#### DB (`prisma/schema/organization-context.prisma`)

- `TenantContext` — accepted facts (the grounding source).
- `TenantContextProposal` — staged proposals with provenance.

---

### 5.3 Questionnaire structure agent (`questionnaire_answering`)

- **Module:** `apps/api/src/modules/questionnaires/structure-agent.ts` (~1 400 lines), driven by `import-job.ts` after `POST /api/v1/questionnaires`.
- **UI:** `apps/web/src/app/(dashboard)/questionnaires/new/page.tsx` (file picker + job polling).
- **Auth:** `authorizeResource("vendors:read", "vendors:write")` on the router.

#### Purpose

When a customer uploads an `.xlsx` or `.docx` security questionnaire, deterministically map the workbook so the platform can later **export answers back into the same file**. For each sheet/table the agent produces:

- A `documentKind` (`xlsx` | `docx`).
- A discriminated-union sheet kind: `instructions | metadata | question_table | matrix`.
- For each question, the **A1 question cell** and **A1 answer cell**, parent/child links, and `contextLabels` (e.g. domain, sub-section, requirement).
- Cover-page metadata (e.g. customer name) surfaced as `metadataFacts`.

CSV imports do **not** invoke this agent — they use heuristics in `csv.ts`.

#### Routes (relevant)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/v1/questionnaires` | Multipart or JSON. Creates a `QuestionnaireImportJob` (`pending`), uploads non-CSV blob to S3, runs `setImmediate(runImportJob)`, returns **202** + `jobId`. |
| GET | `/api/v1/questionnaires/jobs/:jobId` | Returns `status`, per-sheet `progress`, `errorCode`, `errorMessage`, `questionnaireId` once done. |

#### Flow

1. Job marked `running`; download file if needed.
2. **CSV** → `runCsvJob` (heuristic; no LLM); job `completed` or `failed` with `NO_QUESTION_COLUMN`.
3. **DOCX** → `extractDocxTablesFromBuffer` then `mapDocxStructure`.
4. **XLSX** → `mapXlsxStructure`. The agent calls per sheet with **three tiers** (`Promise.allSettled` across sheets in `runPerSheet`):
   - `SYSTEM_PROMPT_SINGLE_SHEET` (strict)
   - `SYSTEM_PROMPT_SIMPLIFIED` (recovery on parse/validation failure)
   - `SYSTEM_PROMPT_LITE` (fallback when strict times out or repeatedly fails)
5. Per-sheet `withTimeout(120 000 ms)`; on timeout, falls back to lite. Provider errors on strict can re-throw without lite (see code comments).
6. `parseXlsxWithMap` / `parseDocxWithMap` (no LLM) builds `Question` rows + `metadataFacts`.
7. Persist via `questionnaire.create` + `insertStructuredQuestions` with parent ordering.
8. Job ends as `completed` or `partial` (with skipped-sheet list in `errorMessage`).

#### LLM call shape

```typescript
aiClient.chat({
  messages: [{ role: "system", content: SYSTEM_PROMPT_* }, { role: "user", content: buildSheetPrompt(...) }],
  temperature: 0,
  maxTokens: ...,
  responseFormat: "json",
});
```

User prompts include sheet/table preview, merged-cell info, dimensions, and an `# OBSERVATIONS` block with heuristic header-row and question-row hints.

#### Output validation

The LLM output is parsed into a Zod-validated `WorkbookMap`. Markdown fences are stripped; `null` keys are removed via `stripNulls`; `sheetName` is forced to match the input. `StructureAgentError` is raised for unrecoverable shape problems.

#### DB (`prisma/schema/questionnaires.prisma`)

- `QuestionnaireImportJob` — `status`, `progress` (per-sheet rows), `errorCode`, `errorMessage`, `questionnaireId`.
- `Questionnaire` — `structureMap`, `metadataFacts`, `originalFileKey`, etc.
- `Question` — `answerCellA1`, `contextLabels`, `parentQuestionId`, sheet/table indices.

#### Async transport

Currently in-process via `setImmediate(runImportJob)`. There is **no questionnaire SQS topic**; `lib/queue.ts` only declares vendor-research and integration-check queues. Comments in the code call out future SQS/BullMQ as a possible swap.

---

### 5.4 Questionnaire AI answering (`questionnaire_answering`)

- **Module:** `apps/api/src/modules/questionnaires/answer.ts`. Note: there is **no** separate `answer-agent.ts`.

#### Purpose

Generate a **draft** answer for one or many questions, grounded in:

- Approved policies (capped body),
- Active `TenantContext` rows,
- `FrameworkInstance` names adopted by the org,
- Implemented / partial controls,
- **Approved `Answer`s from other questionnaires** (past wording reuse).

Drafts are saved with `status = "draft"` (or `pending` when empty) and `generatedByAi = true` for human review. `Answer.aiSources`, `aiConfidence`, `aiModel` capture provenance.

#### Routes

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/:id/answer-all` | Bulk; only questions without any `Answer`. Bounded concurrency `ANSWER_BULK_CONCURRENCY = 4`. Sets questionnaire `status = "in_progress"`. Returns `{ counts, failures[] }`. |
| POST | `/:id/questions/:qid/answer` | Single question; clears reviewer on update. |

#### Flow (`answerOne` / `answerAll`)

1. Load question + parent + questionnaire `metadataFacts` if needed.
2. `loadGrounding` (once per bulk run) — policies, context, frameworks, controls, past approved answers.
3. `resolveOrgAI(tenantId, "questionnaire_answering")` — same feature key as the structure agent.
4. `client.chat({ responseFormat: "json", temperature: 0.2, maxTokens: 700 })`.
5. Parse `AnswerSchema` (Zod) after fence-stripping.
6. Upsert into `Answer` with `aiSources`, `aiConfidence`, `aiModel`.

#### Prompt structure

- **System:** JSON only; no fabrication; yes/no/draft length rules; cite `sources`; honor parent question and `contextLabels`; explicit JSON shape.
- **User:** question type + text, optional section, parent question, `contextLabels`, metadata facts, choices, frameworks list, controls block, policies block, past approved Q→A pairs, `JSON.stringify(grounding.context)`.

#### Error handling

- Bulk: per-question try/catch → `failures[]`; never throws for a single failure.
- `AINotConfiguredError` → 503; `AIProviderError` → status mapped by `kind` (429, 502, 503, 504, …).

#### DB

- `Answer` — `content`, `status`, `generatedByAi`, `aiConfidence`, `aiSources` (JSON), `aiModel`. (`aiPrompt` exists in the schema but isn't populated by the current path.)

---

### 5.5 Policy AI Write (`policy_generation`)

- **Module:** `apps/api/src/modules/policies/router.ts`.
- **UI:** `apps/web/src/components/ui/rich-editor.tsx` (`AiWriteModal`, bubble "✨", footer "✨ AI Write", slash-command "AI Write").
- **Auth:** policy permissions.

#### Routes

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/api/v1/policies/:id/ai/generate` | `{ prompt, context?, action?: "generate" \| "rewrite" \| "expand" \| "summarize" \| "improve" }` | Returns `{ content: htmlString }`. |

#### Flow

1. `resolveOrgAI(tenantId, "policy_generation")`.
2. Build a **per-action system prompt** ("expert policy writer"; produce clean HTML; no code fences).
3. Send messages: optional "current content" user message followed by the user's prompt.
4. `client.chat(...)` (text mode, not JSON).
5. Audit `PolicyAIDraft` (with usage) and return `{ content }`.

The handler does not write to Prisma — the editor decides whether to insert/save.

---

### 5.6 Policy: draft from context (`policy_generation`)

- **Module:** `apps/api/src/modules/policies/router.ts` (`/ai/draft-from-context`).
- **UI:** Policy detail page in draft mode shows a blue strip "Generate from context" → opens `AIProposalModal` with a diff and "Save as new version".

#### Routes

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/api/v1/policies/:id/ai/draft-from-context` | `{ templateSlug?, instructions? }` | Returns `{ draftHtml, replacements, unfilled, sourceLabel, templateSlug, baseVersionId, provider, model }`. |

#### Flow

1. Load the policy + latest version + the controls' frameworks (via `policyControl` + `requirementMap`).
2. Resolve a template (`policyTemplate`) by slug or fall back to current content.
3. Load all active `organizationContext` rows.
4. `resolveOrgAI(tenantId, "policy_generation")`.
5. `client.chat({ responseFormat: "json" })` — JSON output `{ draftHtml, replacements, unfilled }`.
6. `organizationContext.updateMany` to bump `lastUsedAt` for rows that were sent (drives "freshness" UI in Settings → AI context).
7. Audit `PolicyAIDraft` and return.

#### Prompt (summary)

- **System:** senior compliance writer; only replace placeholder text; preserve HTML structure; do not invent; output JSON with `draftHtml`, `replacements`, `unfilled`.
- **User:** source label, frameworks list, placeholder names, **JSON array of org Q&A** from `organizationContext`, optional instructions, the full template HTML.

> The unrelated `POST /api/v1/policies/:id/import` (DOCX upload) uses **Mammoth** (DOCX → HTML) — no LLM.

---

### 5.7 Risk score suggestion (`risk_scoring`)

- **Module:** `apps/api/src/modules/risks/ai-suggest-score.ts`, wired in `risks/router.ts`.
- **UI:** `apps/web/src/components/ai/risk-score-suggestion-banner.tsx` on `risks/[id]/page.tsx`. Shows a dashed box "AI suggestion available" → clicking "Suggest score" produces an `AdvisoryBanner` with **Likelihood / Impact / Score**, rationale, and **Apply / Dismiss / Refine** actions.

#### Routes

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/v1/risks/:id/ai-suggest-score` | Returns advisory `{ likelihood, impact, riskScore, rationale, similarRiskIds, confidence, caveats, modelUsed, providerSource, generatedAt, suggestionId, riskId }`. |
| POST | `/api/v1/risks/:id/ai-score-decision` | **No LLM** — records `audit` for user decision (`apply` / `dismiss` / `refine`). The actual score change is a normal `PATCH /:id` on the risk. |

#### Flow

1. Load the target risk; sample up to 200 peer risks.
2. `rankBySimilarity` (Jaccard over title/description tokens).
3. Load `organizationContext` rows in selected categories.
4. `resolveOrgAI(..., "risk_scoring")`.
5. `client.chat({ responseFormat: "json" })`.
6. Zod-validate the suggestion.
7. **Filter `similar_risk_ids`** to those that were actually in the peer list (anti-hallucination guard).
8. Audit `RiskAIScoreSuggestion`; return.

#### Prompt (summary)

- **System:** risk analyst; JSON only; 1–5 scales for likelihood and impact; `similar_risk_ids` must be from the provided set; include `confidence` and `caveats`.
- **User:** target risk JSON; peer list with similarity scores; business-context JSON from `organizationContext` (or "none" caveat).

#### Storage

Suggestions are **ephemeral** (no Prisma write besides the audit row). Apply happens via the existing risk PATCH.

---

### 5.8 Vendor tier suggestion (`vendor_scoring`)

- **Module:** `apps/api/src/modules/vendors/ai-suggest-tier.ts`, wired in `vendors/router.ts`.
- **UI:** `apps/web/src/components/ai/vendor-tier-suggestion-banner.tsx` on `vendors/[id]/page.tsx`. Same pattern as the risk banner.

#### Routes

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/v1/vendors/:id/ai-suggest-tier` | Returns `{ tier ∈ critical \| high \| medium \| low, rationale, factors, confidence, caveats, modelUsed, providerSource, suggestionId, vendorId, generatedAt }`. |
| POST | `/api/v1/vendors/:id/ai-tier-decision` | **No LLM** — audit only. Applying tier uses normal vendor PATCH. |

#### Flow

1. Load vendor + latest `vendorResearch` (if any) + peers grouped by tier + `organizationContext` rows for `company` / `data_handling` / `risk_appetite`.
2. `resolveOrgAI(..., "vendor_scoring")`.
3. `client.chat({ responseFormat: "json" })`.
4. Zod-validate; audit `VendorAITierSuggestion`; return.

#### Prompt (summary)

- **System:** third-party risk analyst; output JSON; tier enum; cite peer patterns.
- **User:** vendor JSON; latest research JSON or "none"; peers-by-tier JSON; business-context Q&A (or "none" caveat).

This consumes vendor research output ([§5.12](#512-vendor-research-collector-only-not-via-resolveorgai)) opportunistically.

---

### 5.9 Integrations — natural language to automated check (`automated_check_generation`)

- **Module:** `apps/api/src/modules/integrations/from-prompt.ts` (core); `integrations/router.ts` (wiring).
- **UI:** `apps/web/src/app/(dashboard)/integrations/custom/new/page.tsx` — three-step wizard: **Prompt → Spec → Test**.
- **Schema validation:** `@trustalo/integration-manifests`.

#### Routes

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/v1/integrations/from-prompt` | LLM. Returns `{ runner: "http" \| "browser", spec, suggestedTitle, suggestedDescription, suggestedSeverity, suggestedSchedule, modelUsed, providerSource }`. |
| POST | `/api/v1/integrations/from-prompt/test` | **No LLM** — runs the HTTP spec via `runHttpCheck`. Browser spec is **501** today. |
| POST | `/api/v1/integrations/from-prompt/save` | **No LLM** — validates and persists `integrationCheck`. (`modelUsed` from the prompt step is stored for bookkeeping.) |

#### Flow

1. **Pre-LLM safety:** `assertPromptIsSafe` runs a denylist of destructive / injection terms — this is a guardrail since spec actions become real outbound HTTP/browser checks.
2. `resolveOrgAI(..., "automated_check_generation")`.
3. `client.chat({ responseFormat: "json" })`.
4. Validate with Zod `RawAiResponseSchema`, then narrow into `HttpCheckSpecSchema` or `BrowserCheckSpecSchema`. Failure → `GeneratedSpecInvalidError`.
5. Audit `IntegrationCheckDraft`; return.

#### Prompt (summary)

- **System:** read-only check; choose `http` vs `browser`; refuse mutating actions; field-level rules; output JSON with `runner` and `spec`.
- **User:** `User request:\n{prompt}`.

---

### 5.10 Evidence collection agent (`evidence_agent`)

- **Modules (API):** `apps/api/src/modules/controls/router.ts`, `apps/api/src/lib/collector-client.ts`.
- **Modules (collector):** `apps/collector/src/agent/llm-loop.ts`, `agent/agent-runner.ts`, `routes/internal.ts`.
- **UI:** `apps/web/src/components/evidence/evidence-agent-panel.tsx` embedded in `controls/[id]/page.tsx`.

#### Purpose

For a control, run a **multi-turn LLM loop** that the collector executes. Each turn the LLM returns a JSON envelope with `{ toolCalls?, summary?, keepSourceIds? }`. Tool calls map to the integration connections the user has whitelisted (e.g. AWS, GitHub). Evidence is then submitted back to the API as if a normal collector job had produced it.

#### Routes (API)

| Method | Path | Notes |
| --- | --- | --- |
| GET / PATCH | `/api/v1/controls/:id/evidence-config` | Manual vs `agent`; `agentInstructions`, `agentToolConnectionIds`. |
| GET | `/api/v1/controls/evidence-config/available-tools` | Lists integration connections the user can hand to the agent. |
| POST | `/api/v1/controls/:id/evidence-config/run` | Requires `mode === "agent"`, non-empty instructions, ≥1 tool. Resolves `evidence_agent` (503 if not configured). Returns **202** with the run row. |
| GET | `/api/v1/controls/:id/evidence-config/runs[/:runId]` | Proxies to the collector. |

#### Flow

1. API resolves `evidence_agent`; encrypts and forwards credentials in the internal POST to the collector (`createAgentRun`).
2. Collector persists `agentRun` (`pending`), responds **202**, then runs `executeAgentRun` asynchronously.
3. `runLlmLoop` is a generator capped at **6 turns**:
   - System: "Trustalo's Evidence Agent"; output JSON only; control title; tool name/description list.
   - User: operator instructions + previews of prior tool results.
   - Call shape: `provider.chat({ responseFormat: "json", temperature: 0.2, maxTokens: 1500 })`.
   - Each `toolCall` is dispatched against the corresponding integration connection.
4. `submitAgentEvidence` posts evidence back to the API.
5. Run status is updated; UI polls every 4 s while `pending` / `running`.

#### DB

- API: `controlEvidenceCollectionConfig` (mode + agent fields + `agentLastRun*`).
- Collector Prisma: `agentRun`.

---

### 5.11 Training quiz generator (`quiz_generation`)

- **Module:** `apps/api/src/modules/ai-config/router.ts` (`POST /generate-quiz`); engine `packages/ai/src/prompts/quiz.ts`.

#### Route

| Method | Path | Body |
| --- | --- | --- |
| POST | `/api/v1/ai-config/generate-quiz` | `{ topic, numberOfQuestions, difficulty?, additionalContext? }` |

#### Flow

1. `resolveOrgAI(tenantId, "quiz_generation")`.
2. `generateQuizQuestions(ai.client, body)` — calls `provider.chat({ temperature: 0.7, maxTokens: 4096, responseFormat: "json" })`. Throws if the JSON lacks `questions`.
3. Returns the parsed quiz.

This is also the feature `/ai-config/health` uses for its 1-token latency ping.

---

### 5.12 Vendor research (collector-only; **not** via `resolveOrgAI`)

- **Modules:**
  - API: `apps/api/src/modules/vendors/router.ts` (publish + internal due-for-research), `apps/api/src/workers/research-results.ts`, `apps/api/src/lib/queue.ts`.
  - Collector: `apps/collector/src/research/vendor-researcher.ts`, `routes/research.ts` (SQS subscriber), `research/scheduler.ts`.

#### Purpose

Periodic / on-demand third-party risk research that runs a web search, then asks an LLM to synthesize a structured report (security / compliance / reputation / financial / breach dimensions; 0–100 rubric) with breach history and certifications.

#### Routes / triggers

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/v1/vendors/:id/research` | User-triggered. Creates `vendorResearch` (pending) + publishes to SQS `vendorResearchRequests`. |
| GET | `/api/v1/vendors/internal/due-for-research` | Internal (`x-internal-key`). The collector scheduler calls this and enqueues `periodic_update` for due vendors. |

#### LLM call shape (collector)

- Direct **OpenAI SDK**: `openai.chat.completions.create`.
- **Model**: `process.env.OPENAI_MODEL ?? "gpt-4o"`. **Not** routed through `resolveOrgAI` or `AIFeatureConfig`.
- `response_format: { type: "json_object" }`.

#### Prompt (summary)

- **System (`RESEARCH_SYSTEM_PROMPT`):** dimensions, 0–100 rubric, JSON shape with summary, recommendations, findings, breaches, certifications.
- **User:** vendor attributes + `--- WEB SEARCH RESULTS ---` block (or note when empty).

#### Async transport

- Request → SQS `vendorResearchRequests` → collector subscriber → OpenAI → results queue.
- API worker `research-results.ts` persists into `vendorResearch`, bumps `vendor.lastResearchedAt`, updates `knownVendor` (if linked), creates a `vendorAssessment` on success.

---

## 6. AI Governance module (no LLM)

- **Module:** `apps/api/src/modules/ai-governance/router.ts` (~1 200 lines).
- **Schema:** `prisma/schema/ai-governance.prisma`.
- **UI:** `apps/web/src/app/(dashboard)/ai-governance/*` (sidebar label "AI governance").
- **Auth:** `authorizeResource("ai:read", "ai:write")`.

This module is a **GRC register** for AI systems the organization uses or builds — aligned with **EU AI Act / NIST AI RMF / ISO 42001** terminology. It is **CRUD + stats + approval workflows** over Prisma; **it does not call any LLM**.

| Sub-resource | Notes |
| --- | --- |
| `/stats` | Counts of `AISystem` by risk level and lifecycle stage. |
| `/risk-assessments` (+ `/stats`, `.../complete`, `.../approve`) | Component risks: bias, privacy, safety, security, misuse; optional overall override; `nextReviewDate` and overdue stats. |
| `/impact-assessments` (+ `/stats`, `.../approve`, `.../reject`) | Free-text impact / ethical / oversight fields. |
| `/incidents` (+ `/stats`, transitions `investigate`, `mitigate`, `resolve`, `close`) | Categories: bias, hallucination, etc. |
| `/` and `/:id` | `AISystem` inventory CRUD (registered after the static paths above to avoid Express ordering conflicts). |

> Naming caveat: "ai-governance" is **organizational** AI governance. It is **not** the runtime governance/audit log of Trustalo's own LLM usage — those audits live separately as `audit` events emitted by each AI route (e.g. `ChatAIAssistantTurn`, `RiskAIScoreSuggestion`, `PolicyAIDraft`, `IntegrationCheckDraft`, `VendorAITierSuggestion`).

---

## 7. Cross-cutting concerns

### 7.1 Audit logging & AI usage dashboard

Every standard-path LLM feature emits an `audit` event (e.g. `PolicyAIDraft`, `RiskAIScoreSuggestion`, `VendorAITierSuggestion`, `IntegrationCheckDraft`, `ChatAIAssistantTurn`) with the resolved model and outcome.

The Settings → **AI Usage** tab (`apps/web/src/app/(dashboard)/settings/_components/ai-usage-tab.tsx`) reads from `GET /api/v1/dashboards/ai-usage?days=…` — KPIs: generations, approved, rejected, acceptance %, plus a per-feature table (7 / 30 / 90 day window). Per the file comment, **raw prompts are not exposed in the UI** (audit-log only).

The legacy route `/dashboard/ai-usage/page.tsx` redirects to `/settings`.

### 7.2 Error mapping (`apps/api/src/middleware/error-handler.ts`)

| Error                                     | HTTP |
| ----------------------------------------- | ---- |
| `AINotConfiguredError`                    | 503  |
| `AIProviderError.kind === "auth"`         | 401  |
| `AIProviderError.kind === "rate_limit"`   | 429  |
| `AIProviderError.kind === "bad_request"`  | 400  |
| `AIProviderError.kind === "timeout"`      | 504  |
| `AIProviderError.kind === "unavailable"`  | 502  |
| `AIProviderError.kind === "server_error"` | 502  |
| Unknown                                   | 500  |

In SaaS mode, messages also pass through `scrubSecrets` before being returned to the client.

### 7.3 PII scrubbing

`scrubPii` (regex: email, phone, IP, large numbers, URL credentials) is run on user text **before** it reaches any LLM in the chat assistant and context-extraction paths. Returned redaction counts are surfaced in the UI so users see the scrubber is active.

### 7.4 Anti-hallucination patterns

- **Chat:** citation ids are validated against the grounding bundle (`filterValidCitations`).
- **Risk suggestions:** `similar_risk_ids` are filtered to actually-provided peer ids.
- **Questionnaire structure:** Zod-validated `WorkbookMap`; `sheetName` forced to match input.
- **Integration prompts:** `assertPromptIsSafe` denylist + Zod `RawAiResponseSchema` and a strict per-runner spec schema.
- **Context extraction:** Zod schema; `supersedesContextId` stripped if not in provided refs.

### 7.5 Rate limits

In-process per-feature token buckets (`consumeToken`):

- `chat_assistant`: 30 turns / min / org.
- `context_extraction`: 30 extractions / min / org.

### 7.6 Frontend integration patterns

- **State:** plain React `useState` + `useEffect` + imperative `apiClient` calls (TanStack Query is **not** used for AI flows today).
- **Streaming:** chat uses `fetch` + `parseSseStream` against `/turn/stream`; proposals use a long-lived SSE with 5 s reconnect backoff and 60 s safety refresh.
- **Banners:** Risk and vendor advisory banners share a similar Apply / Dismiss / Refine UX.
- **Page context:** `chat/page-context.ts` derives `recordKind` / `recordId` from the URL so the chat backend can ground on the open record.

---

## 8. Known gaps & alternatives

1. **`featureEnum` mismatch in `ai-config/router.ts`** — `chat_assistant`, `context_extraction`, and `evidence_agent` exist in the Prisma `AIFeature` enum but are not in the route's Zod `featureEnum`. Per-feature CRUD for those three is therefore unreachable via the public API today; rows must be set via DB / seeds. **Fix:** extend the enum in `router.ts`.

2. **Vendor research bypasses `resolveOrgAI`** — the collector calls OpenAI directly with `OPENAI_MODEL`. **Alternative:** introduce a dedicated `vendor_research` `AIFeatureType`, route via `resolveOrgAI` from the collector, and unify credential / model / audit story with the rest of the stack.

3. **Streaming is single-frame for chat** — the SSE contract is forward-compatible, but the provider abstraction returns a full completion. **Alternative:** add `chatStream` to `AIProvider`; OpenAI and Anthropic both support streaming.

4. **No central retries** — every feature gets one shot. **Alternative:** thin wrapper around `chat` with exponential backoff on `rate_limit` / `server_error`.

5. **Anthropic / Bedrock JSON mode** — `responseFormat: "json"` is honored only by OpenAI / OpenRouter today; Anthropic and Bedrock rely on prompts + parse-fence-stripping. **Alternative:** wire Anthropic tool-use / Bedrock Converse JSON-schema constraints for parity.

6. **Chat auth uses `settings:*` permissions** — fine for now; if chat is offered to broader roles a dedicated `chat:*` scope would be cleaner.

7. **Token / cost tracking** — `ChatCompletionResult.usage` is populated but not aggregated. The AI Usage dashboard counts generations and outcomes, not tokens or cost. **Alternative:** persist `usage` per audit row to enable cost-per-feature reports.

8. **Questionnaire async transport is in-process** — `setImmediate(runImportJob)` is fine for short documents but loses jobs on restart. **Alternative:** publish to SQS and consume from a worker, mirroring the vendor-research pattern.

9. **`extractAssetClassifications` is not yet routed** — the CPS 234 Para 23 helper exists in `@trustalo/ai` and is fully unit-tested, but no API endpoint exposes it today. **Next step:** wire `POST /api/v1/assets/from-text` (auth `assets:write`, rate-limited via the existing `context_extraction` bucket, audited via `AssetAIClassification`) and a paste-to-classify UI on the Asset register.

---

### Appendix: developer-facing skills (not runtime AI)

`trustalo/agents/SKILL.md`, `compliance-skill.md`, and `integration-skill.md` are **Cursor instruction packs for developers** working on this repo (monorepo overview, compliance-domain knowledge for ISO 27001/27017/27018/22301/42001/SOC 2/etc., and `Integration` contract). They are not invoked at runtime by any application code.
