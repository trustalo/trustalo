# Quickstart — evaluate Trustalo in 15 minutes

This is the fastest honest path from `git clone` to a running, fully populated compliance platform on your own machine. One command stands up the infrastructure and seeds a realistic demo tenant ("**Acme Demo Co**"); the guided tour below walks the product the way an evaluation actually goes.

For the per-step manual setup, every environment variable, and troubleshooting, see [`installation.md`](installation.md). For the day-to-day developer loop, see [`development.md`](development.md).

---

## What you get

The demo tenant is seeded so every workspace has something real to look at in the first session:

- **All 12 frameworks adopted** (ISO 27001/27017/27018/22301/42001, SOC 2, NIST CSF 2.0, GDPR, Essential Eight, APRA CPS 234, HIPAA, PCI DSS 4.0.1 — ~630 controls), with **ISO 27001, SOC 2 and HIPAA in active flight** at a realistic ~40% implemented / ~30% in-progress spread.
- **14 people** across the HR lifecycle — active staff, a contractor, an incoming hire with an onboarding checklist, and one **offboarding in progress with open checklist items** — plus 3 background checks (one expiring in two weeks).
- **4 enrolled devices** with posture history — one **at risk (disk encryption off)**, one stale.
- 7 policies (published/draft/pending-approval mix) with partial acknowledgments, 23 evidence artefacts (approved/pending mix), 10 risks, 8 assessed vendors, 4 incidents, 8 vulnerabilities.
- A data breach with the **72-hour GDPR notification clock running**, 4 DSARs, 3 audits (one certification audit mid-fieldwork, one internal HIPAA audit scheduled) with open findings, a live Trust Center, and an inbound security questionnaire with AI-drafted answers.

Everything is obviously fake: the org is named **Acme Demo Co**, all people live at `@demo.trustalo.io`, and seeded rows carry a `demoSeed` marker where the schema has a metadata column. The seed is idempotent — re-running it never duplicates data.

---

## Prerequisites (2 minutes)

| Tool                              | Version                     |
| --------------------------------- | --------------------------- |
| [Bun](https://bun.sh/)            | 1.3+                        |
| [Docker](https://www.docker.com/) | 24+ (with `docker compose`) |
| `git` + a POSIX shell             | any recent                  |

Free local ports: `15000` (Web), `15002` (API), `15003` (Collector), `5433` (Postgres), `27018` (MongoDB), `4566` (LocalStack).

---

## Step 1 — one command setup (~5 minutes)

```bash
git clone <your-fork-url> trustalo && cd trustalo
bun run setup:local
```

`setup:local` copies env templates (only when missing), starts Postgres + MongoDB + LocalStack via docker-compose, installs dependencies, generates Prisma clients, applies migrations, and runs **both** seeds — the base seed (frameworks, ~630 adopted controls, cross-framework mappings, policy templates) and the demo seed (everything listed above). It is idempotent; re-run it any time.

## Step 2 — start the app

```bash
bun dev:all
```

| Service   | URL                      |
| --------- | ------------------------ |
| Web UI    | <http://localhost:15000> |
| API       | <http://localhost:15002> |
| Collector | <http://localhost:15003> |

> `bun dev` starts only API + Web. Use `bun dev:all` so the Collector is up when you try an integration in the tour.

## Step 3 — sign in

Open <http://localhost:15000> and log in with any seeded account (local email + password auth is the default provider):

| Email                          | Password       | Role                                  |
| ------------------------------ | -------------- | ------------------------------------- |
| `test@test.com`                | `test.test`    | owner                                 |
| `alex.chen@demo.trustalo.io`   | `Password.123` | admin (CISO persona)                  |
| `morgan.lee@demo.trustalo.io`  | `Password.123` | compliance manager                    |
| `priya.patel@demo.trustalo.io` | `Password.123` | compliance manager (eng lead persona) |
| `sam.rivera@demo.trustalo.io`  | `Password.123` | DPO                                   |
| `jordan.kim@demo.trustalo.io`  | `Password.123` | auditor (external)                    |

Override the defaults with `SEED_TEST_USER_EMAIL` / `SEED_TEST_USER_PASSWORD` (base seed) and `SEED_DEMO_PASSWORD` (demo personas) before seeding.

---

## Step 4 — the 10-minute tour

Each stop is a page in the left navigation.

1. **Dashboard** (`/dashboard`) — framework readiness for the three in-flight programs, open tasks (one overdue), and the compliance posture tiles. This is the "is it alive?" screen.
2. **Frameworks** (`/frameworks`) — all 12 frameworks are adopted; ISO 27001, SOC 2 and HIPAA are `in_progress` with target dates. There is no per-framework purchase — adopting another framework is a click, not a contract change.
3. **Controls** (`/controls`) — filter by status to see the implemented / partially-implemented / not-started spread; open a control to see its owner, review dates and linked evidence.
4. **Evidence** (`/evidence`) — named artefacts ("Okta access review export — Q2 2026", "Backup restoration test log — May 2026", …) in an approved/pending review mix.
5. **People** (`/people`) — 14 people across the lifecycle. Open **Quinn Baxter** for the offboarding-in-progress checklist (laptop not yet reclaimed), **Noah Almeida** for onboarding, and note **Taylor Nguyen**'s background check expiring in two weeks.
6. **Devices** (`/devices`) — the enrolled fleet. `acme-mba-taylor` reports **disk encryption off** (at risk, with posture-drift history); `acme-xps-riley` is stale. Real machines enroll through the cross-platform Go agent — see [`device-agent.md`](device-agent.md).
7. **Risks** (`/risks`) — 10 scored risks with inherent vs residual ratings, treatments and owners.
8. **Vendors** (`/vendors`) — 8 vendors across risk tiers with assessments, DPA status and sub-processor flags.
9. **Questionnaires** (`/questionnaires`) — the inbound "BigProspect Vendor Security Assessment" with AI-drafted answers in approved/draft/pending states (AI output is always advisory — a human approves every answer).
10. **Privacy** (`/privacy/data-breaches`) — the "Misdirected payroll PDF" breach with the 72-hour GDPR notification clock counting down, plus DSARs in various states.
11. **Trust Center** (`/trust-center`) — enabled and populated: public policies, gated reports, and a pending access request to approve.
12. **Integrations** (`/integrations`) — the connector catalog (AWS, GCP, Azure, Okta, Auth0, GitHub, Bitbucket, Google Workspace, Microsoft 365, Wazuh). Connect one with read-only credentials and the Collector proposes control bindings and starts submitting evidence — suggestions land as `pending`, never auto-approved.

---

## Resetting or re-seeding

- Re-run the seeds any time — they are idempotent and only add missing rows:

  ```bash
  bun run db:seed:api && bun run db:seed:demo:api
  ```

- Full reset (wipes Docker volumes, then rebuild everything):

  ```bash
  docker compose down -v
  bun run setup:local
  ```

---

## Next steps

- [`installation.md`](installation.md) — manual setup path, environment variables, troubleshooting.
- [`architecture.md`](architecture.md) — service boundaries and data flow.
- [`integrations.md`](integrations.md) — the Collector framework and how to add a connector.
- [`device-agent.md`](device-agent.md) — enrolling real machines with the endpoint agent.
- [`ai-features.md`](ai-features.md) — configuring an AI provider (the demo runs fine without one; AI features fail closed until configured).
