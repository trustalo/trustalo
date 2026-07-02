# Notifications & Alerting

Trustalo ships a built-in alerting module that watches compliance posture and pushes alerts to **email**, **Slack**, and **Microsoft Teams**. It is a core feature (no enterprise license required) and is managed under **Settings → Notifications**.

## How it works

Alerting is implemented as a **periodic rule evaluator** (`apps/api/src/modules/notifications/evaluator.ts`), not as hooks inside other modules. Every tick (default: 5 minutes) the evaluator walks the active tenants, runs each **enabled** alert rule as a cheap, indexed, read-only query over existing state, and fans new alerts out to every **enabled** channel.

Key properties:

- **Read-only over other modules.** The evaluator scans controls, devices, People, training, incidents, privacy, and collector connection state; it never writes to them and they are unaware of it.
- **Deduped.** Every alert carries a stable `dedupeKey` — `<ruleKey>:<entityId>[:<condition-generation>]` — recorded in `NotificationDelivery`. A persisting condition alerts **once**, not every tick. Where the data supports it the key embeds a generation component (e.g. a background check's expiry date, a device's failing-signal set), so a condition that recovers and later re-breaks alerts again.
- **Fail-soft.** A failing channel (webhook 500, SMTP down) marks that delivery `failed`, is audit-logged, and never crashes the evaluator. A collector outage skips only the integration rule for that tick.
- **Skips silent tenants.** If a tenant has no enabled channels, its rules are not evaluated at all.

## Alert rules

Rules are seeded lazily per tenant with sensible defaults on first read (all enabled). Thresholds are editable in the UI or via `PATCH /api/v1/notifications/rules/:ruleKey`.

| Rule key | Fires when… | Config (default) |
| --- | --- | --- |
| `control_failing` | An unresolved `ControlWeakness` (status `open`/`triaging`/`remediating`) exists at or above the configured severity. `Control.status` itself has no failure state or history, so weaknesses are the honest failing signal. | `minSeverity: medium` |
| `integration_sync_failed` | An **active** collector `IntegrationConnection` is in `error` state (its latest sync/collection run failed). Read via the collector's internal API; the integrations tables are never touched directly. | — |
| `device_at_risk` | A device is failing a posture signal the tenant **evaluates** (Settings → evaluated posture signals) or has gone `stale` (missed heartbeats). Dedupe key embeds the failing-signal set, so new failures re-alert. | — |
| `person_offboarding_incomplete` | A `Person` with status `offboarded` still has `pending` offboarding checklist items, and the offboarding (endDate, else oldest pending item) is older than the threshold. | `olderThanDays: 7` |
| `background_check_expiring` | A `cleared` (or already `expired`) background check has `expiresAt` within the window. Renewing the check re-arms the alert (the expiry date is part of the dedupe key). | `thresholdDays: 30` |
| `training_overdue` | A training assignment is not `completed` while its program due date is more than the grace period in the past. The due date is part of the dedupe key, so the next cycle re-alerts. | `graceDays: 0` |
| `incident_breach_clock` | A regulatory notification clock is within the threshold (or missed): `Incident` rows flagged `regulatoryNotificationRequired` and not yet notified (GDPR 72h derived from `detectedAt`), and privacy `DataBreach` rows with an unmet Art. 33 `notificationDeadlineAt`. | `thresholdHours: 24` |

## Channels

Channels are managed under **Settings → Notifications** (RBAC: `settings:read` / `settings:write`). Channel config is **write-only**: it is encrypted at rest with the AES-256-GCM envelope (`enc:v1:` — see `apps/api/src/lib/crypto-envelope.ts`) and the API only ever returns a masked preview. Every channel has a **Test** button (`POST /api/v1/notifications/channels/:id/test`) that fires a synthetic alert through the stored config.

### Email

Stores a recipient list. Delivery uses a minimal built-in SMTP client (STARTTLS / implicit TLS / `AUTH LOGIN`) configured by the **operator** via environment variables — there is no per-tenant SMTP config:

| Env var | Meaning |
| --- | --- |
| `SMTP_HOST` | Relay hostname. Unset ⇒ email delivery fails in production; in development the message is logged to stdout instead. |
| `SMTP_PORT` | Default `587` (or `465` when `SMTP_SECURE=true`). |
| `SMTP_SECURE` | `true` for implicit TLS (port 465); otherwise STARTTLS is used when the server offers it. |
| `SMTP_USER` / `SMTP_PASS` | Optional `AUTH LOGIN` credentials. |
| `SMTP_FROM` | From header/envelope, default `Trustalo Alerts <alerts@localhost>`. |

### Slack webhook

1. In Slack: **Apps → Incoming Webhooks → Add to Slack**, pick a channel, and copy the generated `https://hooks.slack.com/services/…` URL.
2. In Trustalo: **Settings → Notifications → Add channel → Slack webhook**, paste the URL, then hit **Test**.

The URL is a credential — treat it like a password. Trustalo encrypts it at rest and never displays it again; rotating it in Slack means re-saving the channel.

### Microsoft Teams webhook

1. In Teams: channel **… → Workflows** (or the legacy **Connectors → Incoming Webhook**) and create a webhook that posts to the channel; copy the URL.
2. In Trustalo: **Settings → Notifications → Add channel → Teams webhook**, paste the URL, then hit **Test**.

Messages are posted as a `MessageCard` payload, which both the legacy connector and Workflows-based webhooks accept.

## Evaluator configuration

| Env var | Meaning |
| --- | --- |
| `NOTIFICATIONS_EVALUATOR_INTERVAL_MS` | Tick interval, default `300000` (5 min), min 15 s. |
| `NOTIFICATIONS_EVALUATOR_DISABLED` | Set to `1` to not start the evaluator at all. |
| `WEB_APP_URL` | Base URL used for links in outbound messages (falls back to the first `CORS_ALLOWED_ORIGINS` entry). |

The evaluator is started/stopped alongside the other background workers in `apps/api/src/index.ts`.

## API surface

All endpoints are tenant-scoped (JWT-derived `tenantId`), audit-logged on mutation, and gated by `settings:read` / `settings:write`:

- `GET  /api/v1/notifications/channels` — list (masked previews only)
- `POST /api/v1/notifications/channels` — create (`type`, `name`, `config`)
- `PATCH /api/v1/notifications/channels/:id` — rename / enable / replace config
- `DELETE /api/v1/notifications/channels/:id`
- `POST /api/v1/notifications/channels/:id/test` — synthetic test alert
- `GET  /api/v1/notifications/rules` — list (lazily seeds defaults)
- `PATCH /api/v1/notifications/rules/:ruleKey` — enable/disable, thresholds
- `GET  /api/v1/notifications/deliveries?limit=N` — recent delivery feed

## Data model

Three tenant-scoped tables (`apps/api/prisma/schema/notification.prisma`): `NotificationChannel` (encrypted config), `AlertRule` (per-tenant enable/threshold state), and `NotificationDelivery` (per-channel delivery log doubling as the dedupe ledger — rows survive channel deletion via `SET NULL` so dedupe history is preserved).
