-- CreateTable
CREATE TABLE "DeviceAuthCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "codeChallenge" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceAuthCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeviceAuthCode_code_key" ON "DeviceAuthCode"("code");

-- CreateIndex
CREATE INDEX "DeviceAuthCode_userId_idx" ON "DeviceAuthCode"("userId");

-- CreateIndex
CREATE INDEX "DeviceAuthCode_expiresAt_idx" ON "DeviceAuthCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "DeviceAuthCode" ADD CONSTRAINT "DeviceAuthCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceAuthCode" ADD CONSTRAINT "DeviceAuthCode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

