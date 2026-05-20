-- Add tenant-scoped directory sync models for Entra ID / Google Workspace.
-- Stores encrypted provider credentials, sync run history, and external-id
-- mappings used to reconcile account suspension on removed directory users.

CREATE TYPE "DirectorySyncProvider" AS ENUM ('entra', 'google_workspace');
CREATE TYPE "DirectorySyncDefaultStatus" AS ENUM ('active', 'invited');
CREATE TYPE "DirectorySyncRunStatus" AS ENUM ('pending', 'running', 'succeeded', 'failed', 'cancelled');
CREATE TYPE "DirectorySyncRunTrigger" AS ENUM ('schedule', 'manual');

CREATE TABLE "DirectorySyncConfig" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "provider" "DirectorySyncProvider" NOT NULL,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "syncFrequencyMinutes" INTEGER NOT NULL DEFAULT 1440,
  "defaultRole" "MembershipRole" NOT NULL DEFAULT 'viewer',
  "defaultStatus" "DirectorySyncDefaultStatus" NOT NULL DEFAULT 'invited',
  "groupRoleMappings" JSONB,
  "encryptedCredentials" TEXT NOT NULL,
  "lastSyncAt" TIMESTAMP(3),
  "lastSyncStatus" "DirectorySyncRunStatus",
  "lastSyncError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DirectorySyncConfig_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DirectorySyncConfig_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "DirectorySyncRun" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "configId" TEXT NOT NULL,
  "provider" "DirectorySyncProvider" NOT NULL,
  "status" "DirectorySyncRunStatus" NOT NULL DEFAULT 'pending',
  "triggeredBy" "DirectorySyncRunTrigger" NOT NULL DEFAULT 'schedule',
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "usersDiscovered" INTEGER NOT NULL DEFAULT 0,
  "usersCreated" INTEGER NOT NULL DEFAULT 0,
  "usersUpdated" INTEGER NOT NULL DEFAULT 0,
  "usersSuspended" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DirectorySyncRun_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DirectorySyncRun_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DirectorySyncRun_configId_fkey"
    FOREIGN KEY ("configId") REFERENCES "DirectorySyncConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ExternalIdentityMapping" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "configId" TEXT NOT NULL,
  "provider" "DirectorySyncProvider" NOT NULL,
  "externalId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "externalEmail" TEXT NOT NULL,
  "externalDisplayName" TEXT,
  "externalGroupIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "lastSeenAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ExternalIdentityMapping_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExternalIdentityMapping_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ExternalIdentityMapping_configId_fkey"
    FOREIGN KEY ("configId") REFERENCES "DirectorySyncConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ExternalIdentityMapping_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "DirectorySyncConfig_tenantId_provider_key"
  ON "DirectorySyncConfig"("tenantId", "provider");
CREATE INDEX "DirectorySyncConfig_tenantId_idx" ON "DirectorySyncConfig"("tenantId");
CREATE INDEX "DirectorySyncConfig_tenantId_isEnabled_idx"
  ON "DirectorySyncConfig"("tenantId", "isEnabled");

CREATE INDEX "DirectorySyncRun_tenantId_createdAt_idx"
  ON "DirectorySyncRun"("tenantId", "createdAt");
CREATE INDEX "DirectorySyncRun_configId_status_idx"
  ON "DirectorySyncRun"("configId", "status");

CREATE UNIQUE INDEX "ExternalIdentityMapping_tenantId_provider_externalId_key"
  ON "ExternalIdentityMapping"("tenantId", "provider", "externalId");
CREATE INDEX "ExternalIdentityMapping_tenantId_provider_lastSeenAt_idx"
  ON "ExternalIdentityMapping"("tenantId", "provider", "lastSeenAt");
CREATE INDEX "ExternalIdentityMapping_userId_tenantId_idx"
  ON "ExternalIdentityMapping"("userId", "tenantId");
