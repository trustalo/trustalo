-- Add ControlWeakness register for APRA CPS 234 Para 35.
--
-- Stores the 10-business-day APRA notification clock and the
-- materiality + remediability decision for an information-security
-- control weakness. Mirrors the DataBreach pattern: severity / status
-- enums, snapshotted notification deadline, optional reporter +
-- assignee, indexed by (status, severity, notificationDeadlineAt).

CREATE TYPE "ControlWeaknessSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE "ControlWeaknessStatus" AS ENUM (
  'open',
  'triaging',
  'notified',
  'remediating',
  'closed'
);

CREATE TYPE "ControlWeaknessRemediabilityDecision" AS ENUM (
  'pending',
  'remediable_in_time',
  'not_remediable_in_time'
);

CREATE TABLE "ControlWeakness" (
  "id"                        TEXT PRIMARY KEY,
  "tenantId"                  TEXT NOT NULL,
  "controlId"                 TEXT,
  "title"                     TEXT NOT NULL,
  "description"               TEXT,
  "severity"                  "ControlWeaknessSeverity" NOT NULL,
  "status"                    "ControlWeaknessStatus" NOT NULL DEFAULT 'open',
  "discoveredAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notificationDeadlineAt"    TIMESTAMP(3) NOT NULL,
  "expectedRemediationAt"     TIMESTAMP(3),
  "remediatedAt"              TIMESTAMP(3),
  "remediability"             "ControlWeaknessRemediabilityDecision" NOT NULL DEFAULT 'pending',
  "rootCause"                 TEXT,
  "remediationPlan"           TEXT,
  "apraNotificationRequired"  BOOLEAN NOT NULL DEFAULT FALSE,
  "apraNotifiedAt"            TIMESTAMP(3),
  "apraReference"             TEXT,
  "reportedById"              TEXT,
  "assigneeId"                TEXT,
  "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                 TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ControlWeakness_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "ControlWeakness_controlId_fkey"
    FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE SET NULL,
  CONSTRAINT "ControlWeakness_reportedById_fkey"
    FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL,
  CONSTRAINT "ControlWeakness_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX "ControlWeakness_tenantId_idx" ON "ControlWeakness"("tenantId");
CREATE INDEX "ControlWeakness_status_idx" ON "ControlWeakness"("status");
CREATE INDEX "ControlWeakness_severity_idx" ON "ControlWeakness"("severity");
CREATE INDEX "ControlWeakness_notificationDeadlineAt_idx" ON "ControlWeakness"("notificationDeadlineAt");
CREATE INDEX "ControlWeakness_discoveredAt_idx" ON "ControlWeakness"("discoveredAt");
