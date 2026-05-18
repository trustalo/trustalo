# Installation

This document covers everything you need to install and run Trustalo locally on a developer machine: prerequisites, first-run setup, environment variables, the docker-compose infrastructure, and troubleshooting for the most common first-time errors.

For the day-to-day developer loop (workflow, available scripts, project structure, conventions), see [`development.md`](development.md).

For the project overview, see the [project README](../README.md).

---

## Prerequisites

| Tool | Version | Why |
| --- | --- | --- |
| [Bun](https://bun.sh/) | 1.3+ | Runtime + package manager. Native `bun:test` runner. |
| [Docker](https://www.docker.com/) | 24+ | One PostgreSQL container (with two logical databases), MongoDB, and LocalStack via docker-compose. |
| Native toolchain headers | bundled | Some native deps (bcrypt, sharp) compile against Bun. |

A working `git`, a POSIX shell, and the following host ports free on `localhost`: `3000` (Web), `4000` (API), `4001` (Collector), `4566` (LocalStack), `5433` (Postgres), `27018` (MongoDB).

---

## Quick start

```bash
# 1. Clone the repository and step into it.
git clone <your-fork-url> trustalo
cd trustalo

# 2. Run the local setup command. It copies env templates, starts Docker,
#    installs dependencies, generates Prisma clients, applies migrations,
#    and seeds API + Collector data.
bun run setup:local

# 3. Start every service together. `bun dev` runs API + Web only;
#    `bun dev:all` adds the Collector so background sync works.
bun dev:all
```

The demo seed creates these local users:

```text
test@test.com / test.test
alex.chen@demo.trustalo.io / Password.123
morgan.lee@demo.trustalo.io / Password.123
priya.patel@demo.trustalo.io / Password.123
sam.rivera@demo.trustalo.io / Password.123
jordan.kim@demo.trustalo.io / Password.123
```

If you prefer to run each setup step yourself:

```bash
# Copy shared and app-level environment templates.
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/collector/.env.example apps/collector/.env
cp apps/web/.env.example apps/web/.env.local

# Bring up Postgres, MongoDB, and LocalStack (S3 + SQS). The single
# Postgres container hosts two databases (trustalo_api, trustalo_collector)
# provisioned by scripts/init-databases.sh.
docker compose up -d

# Install workspace dependencies.
bun install

# Generate the Prisma clients for the API and Collector schemas.
bun run db:generate:api
bun run db:generate:collector

# Apply migrations to both schemas.
bun run db:migrate:api
bun run db:migrate:collector

# Seed reference data, a demo organization, and the Collector integration catalog.
bun run db:seed:api
bun run db:seed:demo:api
bun run --filter @trustalo/collector db:seed

# Start every service together.
bun dev:all
```

After the dev servers boot you should see:

| Service | URL | Notes |
| --- | --- | --- |
| Web UI | [http://localhost:3000](http://localhost:3000) | Next.js 16, App Router. |
| API | [http://localhost:4000](http://localhost:4000) | Express 5 + Prisma + Mongoose. |
| Collector | [http://localhost:4001](http://localhost:4001) | Express 5 + Prisma. |
| API health | [http://localhost:4000/health](http://localhost:4000/health) | Liveness probe. |
| AI health | `GET /api/v1/ai-config/health` | Resolved AI provider per feature. |
| LocalStack | [http://localhost:4566](http://localhost:4566) | S3 + SQS endpoints used by the dev stack. |

---

## Environment variables

Every variable is documented in the per-app `.env.example` files. The root `.env.example` documents shared defaults, but Prisma and the app dev servers load app-local env files too, so local setup requires `apps/api/.env`, `apps/collector/.env`, and `apps/web/.env.local`. `bun run setup:local` creates those files for you without overwriting existing copies.

The table below is the short list of "things you will probably touch."

| Variable | Default | Description |
| --- | --- | --- |
| `API_PORT` | `4000` | API server port. |
| `COLLECTOR_PORT` | `4001` | Collector server port. |
| `WEB_PORT` | `3000` | Web frontend port. |
| `NODE_ENV` | `development` | When `production`, several configs fail-closed on missing security values. |
| `JWT_SECRET` | — | JWT signing secret. Required in production. Minimum entropy enforced at boot. |
| `JWT_EXPIRES_IN` | `24h` | JWT token TTL. |
| `SESSION_COOKIE_DOMAIN` | — | Optional. Set when web + API share a parent domain in production. |
| `API_DATABASE_URL` | `postgresql://...localhost:5433/trustalo_api` | API PostgreSQL connection. |
| `COLLECTOR_DATABASE_URL` | `postgresql://...localhost:5433/trustalo_collector` | Collector PostgreSQL connection (same instance, second database). |
| `MONGODB_URL` | `mongodb://...localhost:27018` | MongoDB connection string. |
| `STORAGE_PROVIDER` | `s3` | Storage backend. |
| `S3_BUCKET` | `trustalo-files` | S3 bucket name. |
| `S3_ENDPOINT` | `http://localhost:4566` | S3 endpoint. LocalStack in dev. |
| `QUEUE_PROVIDER` | `sqs` | Queue backend. |
| `SQS_ENDPOINT` | `http://localhost:4566` | SQS endpoint. LocalStack in dev. |
| `SQS_EVIDENCE_QUEUE_URL` | — | Evidence processing queue URL. |
| `SQS_JOBS_QUEUE_URL` | — | Jobs processing queue URL. |
| `CORS_ALLOWED_ORIGINS` | — | Comma-separated origin allowlist. Required in production. Dev fallback = localhost-\*. |
| `AI_PROVIDER_CONFIG_ENCRYPTION_KEY` | dev fallback | 64-hex-char AES-256-GCM key for the encrypted-credentials envelope. Required in prod. |
| `SERVICE_AUTH_SECRET` | `API_INTERNAL_KEY` (legacy) | HMAC-SHA256 secret shared between API and Collector. |
| `AUTH_PROVIDER` | `local` | `local` \| `cognito` \| `keycloak` \| `external`. |
| `AI_PROVIDER` | `none` | `bedrock` \| `openai` \| `anthropic` \| `openrouter` \| `none`. |

See [`auth-providers.md`](auth-providers.md) for the auth-provider contract and [the AI provider section of the README](../README.md#ai-provider-self-hosting) for the operator-default → org → per-feature precedence chain.

---

## Docker services

`docker compose up -d` brings up everything the app needs at runtime.

| Service | Image | Host port | Purpose |
| --- | --- | --- | --- |
| `postgres` | `postgres:17` | `5433` | One container, two databases: `trustalo_api` + `trustalo_collector`. |
| `mongodb` | `mongo:8` | `27018` | Evidence + document store (host port differs from container's `27017`). |
| `localstack` | `localstack/localstack:3` | `4566` | S3 + SQS emulation. Pinned to v3 — newer images require a paid token. |

The compose file lives at [`docker-compose.yml`](../docker-compose.yml). The second Postgres database (`trustalo_collector`) is created by [`scripts/init-databases.sh`](../scripts/init-databases.sh) on first container boot. Volumes are named, so `docker compose down` preserves your data and `docker compose down -v` wipes it.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `EADDRINUSE` on 4000/4001/3000 | Another process owns the port. Set `API_PORT` / `COLLECTOR_PORT` / `PORT` to override. |
| `Prisma migration failed` | The Postgres container did not finish booting. Wait a few seconds or re-run `docker compose up -d`. |
| `password authentication failed for user "trustalo"` | Old volume from a pre-rebrand checkout. Run `docker compose down -v && docker compose up -d` to recreate volumes. |
| `[security] CORS_ALLOWED_ORIGINS is required in production` | You set `NODE_ENV=production` without an explicit origin allowlist. Define `CORS_ALLOWED_ORIGINS`. |
| AI features return 503 `AINotConfiguredError` | No provider configured at any layer. Set `AI_PROVIDER` + the matching key, or configure the org in Settings → AI. |
| Cookie session not flowing in browser | Browsers won't accept `SameSite=Lax` across mismatched parent domains. Use `SESSION_COOKIE_DOMAIN` in production. |
| `Both middleware file and proxy file are detected` (Next.js) | Stale Next.js cache. Restart the web dev server; the file is `apps/web/src/proxy.ts` per Next.js 16. |

---

## See also

- [`development.md`](development.md) — daily-loop scripts, project structure, conventions.
- [Project README](../README.md) — overview and links to every other doc.
- [`architecture.md`](architecture.md) — service boundaries and data flow.
- [`database-design.md`](database-design.md) — Prisma + Mongoose schemas.
- [`auth-providers.md`](auth-providers.md) — pluggable auth contract and walkthroughs.
- [`api-reference.md`](api-reference.md) — REST endpoints.
- [`ai-features.md`](ai-features.md) — operator + tenant AI configuration and audit.
- [`integrations.md`](integrations.md) — adding a Collector integration provider.
- [`permissions-matrix.md`](permissions-matrix.md) — roles and the permissions each one grants.
- [`compliance-frameworks.md`](compliance-frameworks.md) — supported frameworks and mappings.
