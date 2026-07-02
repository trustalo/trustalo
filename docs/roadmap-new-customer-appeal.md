# Roadmap: making Trustalo more appealing to new customers

_Drafted July 2026 from a product-capability inventory of this repo and market research on the compliance-automation category (Vanta/Drata/Secureframe/Sprinto and open-source alternatives Probo, Comp AI, Eramba, CISO Assistant)._

## Where Trustalo stands

Trustalo already ships most of what buyers treat as table stakes in 2026: continuous evidence collection (10 connectors), multi-framework cross-mapping (10 frameworks), risk register, vendor/TPRM with AI tiering, trust center, questionnaire automation, policy templates + acknowledgment, training, a People/HR module, and a native device-posture agent. The device agent and one-click evidence connectors directly answer the top complaint about open-source GRC tools ("no pre-built connectors that collect CloudTrail on day one").

The gaps that lose new-customer evaluations fall into four buckets:

1. **Missing table-stakes modules** — notifications/alerting (none today), user access reviews, auditor handoff/export, finished SAML SSO.
2. **Missing framework packs** — HIPAA, PCI DSS 4.0, NIS2, DORA, EU AI Act, CMMC 2.0. (SOC 2, ISO 2700x, ISO 42001, GDPR, NIST CSF, Essential Eight, APRA CPS 234 are shipped.)
3. **First-impression breakage** — stubbed endpoints that 503 in demos, missing admin UIs for shipped backend features, no seeded demo environment.
4. **Positioning** — the market's #1 complaint about incumbents is renewal price shock and per-framework pricing; Trustalo's unlimited-framework, self-hosted, data-resident model is the answer but isn't marketed as such.

## Phase 1 — Conversion blockers and quick wins (~first 6 weeks)

| # | Item | Why | Where | Effort |
| --- | --- | --- | --- | --- |
| 1.1 | **Notifications & alerting** — email + Slack/Teams webhooks; alert rules for failing controls, failed integration syncs, at-risk devices/people, breach-notification clocks, expiring background checks and training | Continuous monitoring without alerting reads as a toy; only wholly missing table-stakes module | New `apps/api/src/modules/notifications/`; hooks from evidence/device/incident flows | M |
| 1.2 | **HIPAA + PCI DSS 4.0 framework packs** | Tier-2 universal demand; present in every competitor catalog; the framework engine + cross-mappings make this content work, not platform work | `apps/api/prisma/frameworks/` per `.cursor/rules/adding-frameworks.mdc` | M (content-heavy) |
| 1.3 | **Auditor handoff** — per-framework audit-ready evidence bundle export + read-only external-auditor access (the `auditor` RBAC role already exists) | Structured auditor handoff is a buyer screening item; SoA export already exists to build on | `audits` + `evidence` modules | M |
| 1.4 | **Finish in-flight stubs that break demos**: custom-integrations from-prompt (503 today), asset-classification-from-prose endpoint (helper is built and tested), directory-sync settings UI, device enrollment-token UI, questionnaire import moved to SQS | Evaluators hit these within the first hour; each is mostly wiring | See gap list in inventory; e.g. `packages/ai/src/extraction/asset-classification.ts`, `apps/api/src/modules/directory-sync/` | S each |
| 1.5 | **Evaluation experience** — one-command docker-compose demo with seeded tenant (frameworks adopted, sample evidence, demo devices/people), plus a 15-minute quickstart | Open-source GRC's cited 4–6 week self-serve onboarding is a churn point; a great first hour wins deals | `docs/installation.md`, seed scripts | S–M |
| 1.6 | **Positioning sweep** — README + site copy: "unlimited frameworks, transparent pricing, your data stays home"; explicit contrast to per-framework/renewal-shock pricing | #1 buyer complaint about incumbents; costs nothing to claim credibly | `README.md`, docs | S |

## Phase 2 — Table-stakes completion (weeks 6–16)

| # | Item | Why | Where | Effort |
| --- | --- | --- | --- | --- |
| 2.1 | **User access reviews module** — periodic review campaigns over identity data already collected (Okta, Auth0, Google Workspace, M365, GitHub); reviewer sign-off emits advisory evidence | Table stakes; the raw data is already in the evidence store, so this is workflow + UI | New `access-reviews` module in API + web | M–L |
| 2.2 | **SAML 2.0 protocol completion** (EE) | Hard enterprise deal blocker; scaffold exists | `packages/auth-provider-saml.ee/` | M |
| 2.3 | **NIS2 + DORA framework packs** | Fastest-growing EU demand; synergizes with the self-hosted data-residency pitch; cross-map to shipped ISO 27001 | `apps/api/prisma/frameworks/` | M (content) |
| 2.4 | **Integration expansion, highest-signal first**: GitLab runtime connector (manifest already exists), one HRIS (people sync), one MDM (Intune or Jamf, complementing the device agent), Jira/ticketing, Slack (doubles as a notification channel) | 10 connectors vs incumbents' 200+ is the most visible catalog gap; also publish a "write your own connector" SDK guide for non-standard stacks | `apps/collector/src/integrations/providers/`, `docs/integrations.md` | S–M each |
| 2.5 | **Trust center upgrade** (EE) — NDA-gated document sharing, subprocessor list (the privacy module already has the register — surface it), custom domain | "Trust management" is the category's current bundling trend (Drata bought SafeBase for $250M); also an EE revenue lever | `trust-center` module | M |

## Phase 3 — Differentiators (quarter 2+)

| # | Item | Why | Where | Effort |
| --- | --- | --- | --- | --- |
| 3.1 | **EU AI Act pack + "AI governance" positioning** | Trustalo already ships ISO 42001 and an AI-governance module — few competitors have either; EU AI Act applies broadly from Aug 2026 and ~76% of orgs plan ISO 42001 as their AI-governance backbone. Mostly marketing + one framework pack | Frameworks dir + site | S–M |
| 3.2 | **CMMC 2.0 readiness pack** | Phase 2 mandatory Nov 2026; ~80k defense-industrial-base companies, assessor shortage; self-hosting appeals strongly to this buyer | Frameworks dir | M (content) |
| 3.3 | **Partner/MSP portal** (EE, design complete) | Distribution multiplier — MSSPs and audit firms each bring many small customers | `apps/api/src/modules/multi-tenant.ee/`, `apps/web/src/app/(partner).ee/` | L |
| 3.4 | **MCP server + agent polish** — read-only MCP server exposing compliance posture to Claude/Cursor; true streaming chat; native JSON mode for Anthropic/Bedrock; route vendor research through `resolveOrgAI` | Vanta shipped an MCP server in 2026; for a source-available, developer-friendly product this is cheap, on-brand, and keeps the advisory-only AI contract | `packages/ai/`, new MCP entry point | M |
| 3.5 | **Billing/seat metering UI** (EE) | Backend exists in `packages/billing.ee/`; needed before the SaaS/EE motion scales | Settings UI | M |

## Explicitly deprioritized

- **GCS/Azure Blob storage and Pub/Sub/Service Bus queue providers** — real requests will come from specific deals; the provider pattern makes them fast to add when they do.
- **Continuous-pentesting partnerships** — research did not confirm this as a mainstream differentiator.
- **More AU-regional frameworks** — AU coverage (Essential Eight, APRA CPS 234) is already ahead of the market.

## Success criteria

- Phase 1: an evaluator can go from `git clone` to a populated dashboard in under 15 minutes; no 5xx from any linked UI surface; alerting demoable.
- Phase 2: framework catalog covers tiers 1–3 of market demand (SOC 2, ISO 27001, HIPAA, GDPR, PCI, NIS2, DORA); access reviews and SAML close enterprise-checklist gaps.
- Phase 3: at least one partner-portal design customer; EU AI Act / ISO 42001 story shipped ahead of the Aug 2026 enforcement date.
