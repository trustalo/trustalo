-- Notifications & alerting module.
--
-- Three tenant-scoped tables backing Settings → Notifications and the
-- periodic alert-rule evaluator (apps/api/src/modules/notifications):
--
--   NotificationChannel  — alert destinations. `configEnc` always holds an
--                          AES-256-GCM crypto-envelope (enc:v1:) value:
--                          the webhook URL for slack_webhook/teams_webhook
--                          (incoming-webhook URLs are bearer credentials),
--                          or a JSON recipient list for email.
--   AlertRule            — per-tenant enable/threshold state for each
--                          built-in rule, seeded lazily on first read.
--   NotificationDelivery — one attempted delivery per alert per channel;
--                          doubles as the dedupe ledger (dedupeKey) and the
--                          recent-activity feed in the UI.
--
-- See docs/notifications.md for rule semantics and channel setup.

CREATE TYPE "NotificationChannelType" AS ENUM ('email', 'slack_webhook', 'teams_webhook');
CREATE TYPE "AlertRuleKey" AS ENUM (
  'control_failing',
  'integration_sync_failed',
  'device_at_risk',
  'person_offboarding_incomplete',
  'background_check_expiring',
  'training_overdue',
  'incident_breach_clock'
);
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('sent', 'failed');

CREATE TABLE "NotificationChannel" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "type" "NotificationChannelType" NOT NULL,
  "name" TEXT NOT NULL,
  "configEnc" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NotificationChannel_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NotificationChannel_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AlertRule" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "ruleKey" "AlertRuleKey" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "config" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AlertRule_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "NotificationDelivery" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "ruleKey" "AlertRuleKey" NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "channelId" TEXT,
  "status" "NotificationDeliveryStatus" NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NotificationDelivery_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NotificationDelivery_channelId_fkey"
    FOREIGN KEY ("channelId") REFERENCES "NotificationChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "NotificationChannel_tenantId_idx" ON "NotificationChannel"("tenantId");
CREATE INDEX "NotificationChannel_tenantId_enabled_idx"
  ON "NotificationChannel"("tenantId", "enabled");

CREATE UNIQUE INDEX "AlertRule_tenantId_ruleKey_key" ON "AlertRule"("tenantId", "ruleKey");
CREATE INDEX "AlertRule_tenantId_idx" ON "AlertRule"("tenantId");

CREATE INDEX "NotificationDelivery_tenantId_createdAt_idx"
  ON "NotificationDelivery"("tenantId", "createdAt");
CREATE INDEX "NotificationDelivery_tenantId_dedupeKey_idx"
  ON "NotificationDelivery"("tenantId", "dedupeKey");
