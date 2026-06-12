-- CreateEnum
CREATE TYPE "DeviceEnrollmentTokenStatus" AS ENUM ('active', 'consumed', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('macos', 'windows', 'linux');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('pending', 'active', 'stale', 'revoked', 'retired');

-- CreateEnum
CREATE TYPE "PostureSignalState" AS ENUM ('pass', 'fail', 'unknown');

-- CreateTable
CREATE TABLE "DeviceEnrollmentToken" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT,
    "status" "DeviceEnrollmentTokenStatus" NOT NULL DEFAULT 'active',
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceEnrollmentToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "secretEnc" TEXT NOT NULL,
    "secretKeyId" INTEGER NOT NULL DEFAULT 1,
    "platform" "DevicePlatform" NOT NULL,
    "osVersion" TEXT,
    "agentVersion" TEXT,
    "hostname" TEXT,
    "hardwareId" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'pending',
    "enrolledById" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "checkInIntervalSeconds" INTEGER NOT NULL DEFAULT 3600,
    "diskEncryption" "PostureSignalState" NOT NULL DEFAULT 'unknown',
    "firewall" "PostureSignalState" NOT NULL DEFAULT 'unknown',
    "screenLock" "PostureSignalState" NOT NULL DEFAULT 'unknown',
    "antivirus" "PostureSignalState" NOT NULL DEFAULT 'unknown',
    "agentHealthy" BOOLEAN NOT NULL DEFAULT true,
    "lastPostureAt" TIMESTAMP(3),
    "latestPosture" JSONB,
    "enrollmentTokenId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevicePostureSnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "diskEncryption" "PostureSignalState" NOT NULL,
    "firewall" "PostureSignalState" NOT NULL,
    "screenLock" "PostureSignalState" NOT NULL,
    "antivirus" "PostureSignalState" NOT NULL,
    "agentHealthy" BOOLEAN NOT NULL,
    "osVersion" TEXT,
    "agentVersion" TEXT,
    "raw" JSONB,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevicePostureSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceNonce" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceNonce_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceEnrollmentToken_tokenHash_key" ON "DeviceEnrollmentToken"("tokenHash");

-- CreateIndex
CREATE INDEX "DeviceEnrollmentToken_tenantId_idx" ON "DeviceEnrollmentToken"("tenantId");

-- CreateIndex
CREATE INDEX "DeviceEnrollmentToken_tenantId_status_idx" ON "DeviceEnrollmentToken"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Device_assetId_key" ON "Device"("assetId");

-- CreateIndex
CREATE INDEX "Device_tenantId_idx" ON "Device"("tenantId");

-- CreateIndex
CREATE INDEX "Device_tenantId_status_idx" ON "Device"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Device_tenantId_lastSeenAt_idx" ON "Device"("tenantId", "lastSeenAt");

-- CreateIndex
CREATE INDEX "Device_tenantId_hardwareId_idx" ON "Device"("tenantId", "hardwareId");

-- CreateIndex
CREATE INDEX "DevicePostureSnapshot_tenantId_deviceId_collectedAt_idx" ON "DevicePostureSnapshot"("tenantId", "deviceId", "collectedAt");

-- CreateIndex
CREATE INDEX "DeviceNonce_seenAt_idx" ON "DeviceNonce"("seenAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceNonce_deviceId_nonce_key" ON "DeviceNonce"("deviceId", "nonce");

-- AddForeignKey
ALTER TABLE "DeviceEnrollmentToken" ADD CONSTRAINT "DeviceEnrollmentToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceEnrollmentToken" ADD CONSTRAINT "DeviceEnrollmentToken_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_enrolledById_fkey" FOREIGN KEY ("enrolledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_enrollmentTokenId_fkey" FOREIGN KEY ("enrollmentTokenId") REFERENCES "DeviceEnrollmentToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicePostureSnapshot" ADD CONSTRAINT "DevicePostureSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevicePostureSnapshot" ADD CONSTRAINT "DevicePostureSnapshot_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceNonce" ADD CONSTRAINT "DeviceNonce_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
