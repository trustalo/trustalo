-- CreateEnum
CREATE TYPE "AgentRunStatus" AS ENUM ('pending', 'running', 'succeeded', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "AgentRunTrigger" AS ENUM ('manual', 'scheduled', 'api');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('connected', 'disconnected', 'error', 'syncing', 'pending_auth');

-- CreateEnum
CREATE TYPE "IntegrationCheckStatus" AS ENUM ('pass', 'fail', 'error', 'skipped', 'pending');

-- CreateEnum
CREATE TYPE "IntegrationCheckSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('oauth2', 'api_key', 'iam_role');

-- CreateEnum
CREATE TYPE "IntegrationCategory" AS ENUM ('cloud', 'identity', 'code_repository', 'productivity', 'security', 'hr', 'ai', 'custom');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('scheduled', 'manual', 'triggered');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('running', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "RetryStatus" AS ENUM ('pending', 'retrying', 'succeeded', 'failed', 'exhausted');

-- CreateEnum
CREATE TYPE "SecretScope" AS ENUM ('integration_connection', 'webhook', 'ad_hoc');

-- CreateEnum
CREATE TYPE "SyncAction" AS ENUM ('full_sync', 'incremental_sync', 'test_connection', 'credential_refresh');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('started', 'completed', 'failed', 'partial');

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "controlTitle" TEXT,
    "trigger" "AgentRunTrigger" NOT NULL DEFAULT 'api',
    "status" "AgentRunStatus" NOT NULL DEFAULT 'pending',
    "instructions" TEXT NOT NULL,
    "toolConnectionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "aiCredentialsEncrypted" TEXT,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "transcript" JSONB,
    "summary" TEXT,
    "toolCallSummary" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'pending_auth',
    "secretId" TEXT,
    "config" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "lastErrorMessage" TEXT,
    "syncFrequencyMinutes" INTEGER NOT NULL DEFAULT 1440,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationCheck" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "manifestKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "IntegrationCheckSeverity" NOT NULL DEFAULT 'medium',
    "schedule" TEXT NOT NULL DEFAULT '0 6 * * *',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "runner" TEXT NOT NULL DEFAULT 'manifest',
    "spec" JSONB,
    "aiPrompt" TEXT,
    "aiModel" TEXT,
    "lastStatus" "IntegrationCheckStatus" NOT NULL DEFAULT 'pending',
    "lastRunAt" TIMESTAMP(3),
    "lastEvidenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationCheckControl" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "integrationCheckId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationCheckControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationCheckResult" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "integrationCheckId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "status" "IntegrationCheckStatus" NOT NULL,
    "payload" JSONB,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "evidenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationCheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "authType" "AuthType" NOT NULL,
    "category" "IntegrationCategory" NOT NULL,
    "configSchema" JSONB,
    "capabilities" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionJobRun" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "runNumber" INTEGER NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "resultSummary" JSONB,
    "errorDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionJobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionRetry" (
    "id" TEXT NOT NULL,
    "jobRunId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "RetryStatus" NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "backoffMs" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionRetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretVault" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scope" "SecretScope" NOT NULL DEFAULT 'integration_connection',
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "encryptedPayload" TEXT NOT NULL,
    "kmsKeyId" TEXT,
    "rotatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecretVault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "action" "SyncAction" NOT NULL,
    "status" "SyncStatus" NOT NULL DEFAULT 'started',
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentRun_tenantId_idx" ON "AgentRun"("tenantId");

-- CreateIndex
CREATE INDEX "AgentRun_tenantId_controlId_idx" ON "AgentRun"("tenantId", "controlId");

-- CreateIndex
CREATE INDEX "AgentRun_status_createdAt_idx" ON "AgentRun"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AgentRun_tenantId_status_idx" ON "AgentRun"("tenantId", "status");

-- CreateIndex
CREATE INDEX "IntegrationConnection_tenantId_idx" ON "IntegrationConnection"("tenantId");

-- CreateIndex
CREATE INDEX "IntegrationConnection_tenantId_status_idx" ON "IntegrationConnection"("tenantId", "status");

-- CreateIndex
CREATE INDEX "IntegrationConnection_secretId_idx" ON "IntegrationConnection"("secretId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_tenantId_integrationId_name_key" ON "IntegrationConnection"("tenantId", "integrationId", "name");

-- CreateIndex
CREATE INDEX "IntegrationCheck_tenantId_idx" ON "IntegrationCheck"("tenantId");

-- CreateIndex
CREATE INDEX "IntegrationCheck_lastStatus_idx" ON "IntegrationCheck"("lastStatus");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationCheck_connectionId_manifestKey_key" ON "IntegrationCheck"("connectionId", "manifestKey");

-- CreateIndex
CREATE INDEX "IntegrationCheckControl_tenantId_idx" ON "IntegrationCheckControl"("tenantId");

-- CreateIndex
CREATE INDEX "IntegrationCheckControl_controlId_idx" ON "IntegrationCheckControl"("controlId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationCheckControl_integrationCheckId_controlId_key" ON "IntegrationCheckControl"("integrationCheckId", "controlId");

-- CreateIndex
CREATE INDEX "IntegrationCheckResult_tenantId_createdAt_idx" ON "IntegrationCheckResult"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "IntegrationCheckResult_integrationCheckId_createdAt_idx" ON "IntegrationCheckResult"("integrationCheckId", "createdAt");

-- CreateIndex
CREATE INDEX "IntegrationCheckResult_status_idx" ON "IntegrationCheckResult"("status");

-- CreateIndex
CREATE INDEX "Integration_category_idx" ON "Integration"("category");

-- CreateIndex
CREATE INDEX "CollectionJob_tenantId_idx" ON "CollectionJob"("tenantId");

-- CreateIndex
CREATE INDEX "CollectionJob_tenantId_status_idx" ON "CollectionJob"("tenantId", "status");

-- CreateIndex
CREATE INDEX "CollectionJob_connectionId_idx" ON "CollectionJob"("connectionId");

-- CreateIndex
CREATE INDEX "CollectionJob_status_scheduledAt_idx" ON "CollectionJob"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "CollectionJobRun_tenantId_idx" ON "CollectionJobRun"("tenantId");

-- CreateIndex
CREATE INDEX "CollectionJobRun_jobId_runNumber_idx" ON "CollectionJobRun"("jobId", "runNumber");

-- CreateIndex
CREATE INDEX "CollectionJobRun_jobId_createdAt_idx" ON "CollectionJobRun"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "CollectionRetry_tenantId_idx" ON "CollectionRetry"("tenantId");

-- CreateIndex
CREATE INDEX "CollectionRetry_jobRunId_idx" ON "CollectionRetry"("jobRunId");

-- CreateIndex
CREATE INDEX "CollectionRetry_status_scheduledAt_idx" ON "CollectionRetry"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "SecretVault_tenantId_idx" ON "SecretVault"("tenantId");

-- CreateIndex
CREATE INDEX "SecretVault_tenantId_scope_idx" ON "SecretVault"("tenantId", "scope");

-- CreateIndex
CREATE INDEX "SecretVault_ownerType_ownerId_idx" ON "SecretVault"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "SyncLog_tenantId_idx" ON "SyncLog"("tenantId");

-- CreateIndex
CREATE INDEX "SyncLog_connectionId_createdAt_idx" ON "SyncLog"("connectionId", "createdAt");

-- CreateIndex
CREATE INDEX "SyncLog_tenantId_action_idx" ON "SyncLog"("tenantId", "action");

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationCheck" ADD CONSTRAINT "IntegrationCheck_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationCheck" ADD CONSTRAINT "IntegrationCheck_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationCheckControl" ADD CONSTRAINT "IntegrationCheckControl_integrationCheckId_fkey" FOREIGN KEY ("integrationCheckId") REFERENCES "IntegrationCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationCheckControl" ADD CONSTRAINT "IntegrationCheckControl_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationCheckResult" ADD CONSTRAINT "IntegrationCheckResult_integrationCheckId_fkey" FOREIGN KEY ("integrationCheckId") REFERENCES "IntegrationCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationCheckResult" ADD CONSTRAINT "IntegrationCheckResult_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionJob" ADD CONSTRAINT "CollectionJob_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionJobRun" ADD CONSTRAINT "CollectionJobRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "CollectionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionRetry" ADD CONSTRAINT "CollectionRetry_jobRunId_fkey" FOREIGN KEY ("jobRunId") REFERENCES "CollectionJobRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
