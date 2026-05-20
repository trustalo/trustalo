-- CreateEnum
CREATE TYPE "TenantBillingMode" AS ENUM ('managed', 'byok_passthrough', 'disabled');

-- CreateEnum
CREATE TYPE "TenantLiteLLMKeyStatus" AS ENUM ('active', 'suspended', 'expired', 'rotating');

-- CreateEnum
CREATE TYPE "CreditTransactionKind" AS ENUM ('purchase', 'grant', 'refund', 'debit', 'adjustment', 'promotion_expiry');

-- AlterEnum
ALTER TYPE "AIFeature" ADD VALUE 'vendor_research';

-- AlterEnum
ALTER TYPE "AIProvider" ADD VALUE 'litellm';

-- DropForeignKey
ALTER TABLE "ControlWeakness" DROP CONSTRAINT "ControlWeakness_assigneeId_fkey";

-- DropForeignKey
ALTER TABLE "ControlWeakness" DROP CONSTRAINT "ControlWeakness_controlId_fkey";

-- DropForeignKey
ALTER TABLE "ControlWeakness" DROP CONSTRAINT "ControlWeakness_reportedById_fkey";

-- DropForeignKey
ALTER TABLE "ControlWeakness" DROP CONSTRAINT "ControlWeakness_tenantId_fkey";

-- AlterTable
ALTER TABLE "ExternalIdentityMapping" ALTER COLUMN "externalGroupIds" DROP DEFAULT;

-- CreateTable
CREATE TABLE "TenantBillingConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "mode" "TenantBillingMode" NOT NULL DEFAULT 'managed',
    "monthlySpendCapMicrocents" BIGINT,
    "modelTierOverride" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantBillingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantLiteLLMKey" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "litellmKeyId" TEXT NOT NULL,
    "virtualKeyCipher" TEXT NOT NULL,
    "modelAllowlist" TEXT[],
    "status" "TenantLiteLLMKeyStatus" NOT NULL DEFAULT 'active',
    "budgetMaxMicrocents" BIGINT,
    "observedSpendMicrocents" BIGINT NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantLiteLLMKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditWallet" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "balanceMicrocents" BIGINT NOT NULL DEFAULT 0,
    "lifetimeCreditedMicrocents" BIGINT NOT NULL DEFAULT 0,
    "lifetimeDebitedMicrocents" BIGINT NOT NULL DEFAULT 0,
    "lowBalanceThresholdMicrocents" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amountMicrocents" BIGINT NOT NULL,
    "kind" "CreditTransactionKind" NOT NULL,
    "reason" TEXT,
    "externalRef" TEXT,
    "balanceAfterMicrocents" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiteLLMSpendEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "feature" "AIFeature" NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "rawCostMicrocents" BIGINT NOT NULL,
    "markedUpMicrocents" BIGINT NOT NULL,
    "litellmRequestId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiteLLMSpendEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantAIUsageMonth" (
    "tenantId" TEXT NOT NULL,
    "yearMonth" TEXT NOT NULL,
    "totalPromptTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCompletionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalRawCostMicrocents" BIGINT NOT NULL DEFAULT 0,
    "totalBilledMicrocents" BIGINT NOT NULL DEFAULT 0,
    "byFeature" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantAIUsageMonth_pkey" PRIMARY KEY ("tenantId","yearMonth")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantBillingConfig_tenantId_key" ON "TenantBillingConfig"("tenantId");

-- CreateIndex
CREATE INDEX "TenantBillingConfig_tenantId_idx" ON "TenantBillingConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantLiteLLMKey_tenantId_key" ON "TenantLiteLLMKey"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantLiteLLMKey_litellmKeyId_key" ON "TenantLiteLLMKey"("litellmKeyId");

-- CreateIndex
CREATE INDEX "TenantLiteLLMKey_tenantId_idx" ON "TenantLiteLLMKey"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditWallet_tenantId_key" ON "CreditWallet"("tenantId");

-- CreateIndex
CREATE INDEX "CreditWallet_tenantId_idx" ON "CreditWallet"("tenantId");

-- CreateIndex
CREATE INDEX "CreditTransaction_tenantId_createdAt_idx" ON "CreditTransaction"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditTransaction_walletId_createdAt_idx" ON "CreditTransaction"("walletId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LiteLLMSpendEvent_litellmRequestId_key" ON "LiteLLMSpendEvent"("litellmRequestId");

-- CreateIndex
CREATE INDEX "LiteLLMSpendEvent_tenantId_occurredAt_idx" ON "LiteLLMSpendEvent"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "LiteLLMSpendEvent_tenantId_feature_occurredAt_idx" ON "LiteLLMSpendEvent"("tenantId", "feature", "occurredAt");

-- AddForeignKey
ALTER TABLE "TenantBillingConfig" ADD CONSTRAINT "TenantBillingConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantLiteLLMKey" ADD CONSTRAINT "TenantLiteLLMKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditWallet" ADD CONSTRAINT "CreditWallet_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "CreditWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlWeakness" ADD CONSTRAINT "ControlWeakness_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlWeakness" ADD CONSTRAINT "ControlWeakness_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlWeakness" ADD CONSTRAINT "ControlWeakness_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlWeakness" ADD CONSTRAINT "ControlWeakness_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
