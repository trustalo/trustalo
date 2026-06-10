-- CreateEnum
CREATE TYPE "PersonStatus" AS ENUM ('invited', 'active', 'suspended', 'offboarded');

-- CreateEnum
CREATE TYPE "PersonKind" AS ENUM ('employee', 'contractor', 'vendor_contact', 'service_account', 'other');

-- CreateEnum
CREATE TYPE "PersonSource" AS ENUM ('manual', 'invite', 'directory_sync', 'self_register');

-- CreateEnum
CREATE TYPE "PersonRole" AS ENUM ('member', 'owner', 'admin', 'compliance_manager', 'auditor', 'viewer', 'integration_admin', 'dpo');

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "PersonRole" NOT NULL DEFAULT 'member',
    "permissions" TEXT[],
    "status" "PersonStatus" NOT NULL DEFAULT 'invited',
    "kind" "PersonKind" NOT NULL DEFAULT 'employee',
    "source" "PersonSource" NOT NULL DEFAULT 'manual',
    "jobTitle" TEXT,
    "department" TEXT,
    "employmentType" TEXT,
    "managerId" TEXT,
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "invitedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Person_tenantId_idx" ON "Person"("tenantId");

-- CreateIndex
CREATE INDEX "Person_tenantId_status_idx" ON "Person"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Person_userId_idx" ON "Person"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_tenantId_userId_key" ON "Person"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_tenantId_email_key" ON "Person"("tenantId", "email");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: one Person per existing Membership (carry role/permissions/status,
-- email + name from User). Existing members keep their exact role. Membership
-- is retained until the new People path is verified (dropped in a follow-up).
INSERT INTO "Person" (
  "id", "tenantId", "userId", "email", "fullName", "role", "permissions",
  "status", "kind", "source", "invitedAt", "joinedAt", "createdAt", "updatedAt"
)
SELECT
  m."id", m."tenantId", m."userId", u."email", u."name",
  m."role"::text::"PersonRole", m."permissions",
  m."status"::text::"PersonStatus",
  'employee'::"PersonKind", 'manual'::"PersonSource",
  m."invitedAt", m."joinedAt", m."createdAt", m."updatedAt"
FROM "Membership" m
JOIN "User" u ON u."id" = m."userId"
ON CONFLICT DO NOTHING;
