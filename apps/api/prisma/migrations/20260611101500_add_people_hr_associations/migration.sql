-- CreateEnum
CREATE TYPE "BackgroundCheckType" AS ENUM ('identity', 'criminal', 'employment', 'education', 'credit', 'reference', 'other');

-- CreateEnum
CREATE TYPE "BackgroundCheckStatus" AS ENUM ('not_started', 'in_progress', 'cleared', 'flagged', 'expired');

-- CreateEnum
CREATE TYPE "ChecklistKind" AS ENUM ('onboarding', 'offboarding');

-- CreateEnum
CREATE TYPE "ChecklistItemStatus" AS ENUM ('pending', 'done', 'na');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "assignedPersonId" TEXT;

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "personId" TEXT;

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "vendorId" TEXT;

-- CreateTable
CREATE TABLE "BackgroundCheck" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "type" "BackgroundCheckType" NOT NULL DEFAULT 'identity',
    "status" "BackgroundCheckStatus" NOT NULL DEFAULT 'not_started',
    "provider" TEXT,
    "reference" TEXT,
    "adverseFindings" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackgroundCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonChecklistItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "kind" "ChecklistKind" NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "ChecklistItemStatus" NOT NULL DEFAULT 'pending',
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackgroundCheck_tenantId_idx" ON "BackgroundCheck"("tenantId");

-- CreateIndex
CREATE INDEX "BackgroundCheck_personId_idx" ON "BackgroundCheck"("personId");

-- CreateIndex
CREATE INDEX "BackgroundCheck_tenantId_status_idx" ON "BackgroundCheck"("tenantId", "status");

-- CreateIndex
CREATE INDEX "BackgroundCheck_tenantId_expiresAt_idx" ON "BackgroundCheck"("tenantId", "expiresAt");

-- CreateIndex
CREATE INDEX "PersonChecklistItem_tenantId_idx" ON "PersonChecklistItem"("tenantId");

-- CreateIndex
CREATE INDEX "PersonChecklistItem_personId_kind_idx" ON "PersonChecklistItem"("personId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "PersonChecklistItem_personId_kind_key_key" ON "PersonChecklistItem"("personId", "kind", "key");

-- CreateIndex
CREATE INDEX "Asset_tenantId_assignedPersonId_idx" ON "Asset"("tenantId", "assignedPersonId");

-- CreateIndex
CREATE INDEX "Device_tenantId_personId_idx" ON "Device"("tenantId", "personId");

-- CreateIndex
CREATE INDEX "Person_tenantId_vendorId_idx" ON "Person"("tenantId", "vendorId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_assignedPersonId_fkey" FOREIGN KEY ("assignedPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundCheck" ADD CONSTRAINT "BackgroundCheck_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackgroundCheck" ADD CONSTRAINT "BackgroundCheck_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonChecklistItem" ADD CONSTRAINT "PersonChecklistItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonChecklistItem" ADD CONSTRAINT "PersonChecklistItem_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

