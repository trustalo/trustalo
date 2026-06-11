-- AlterTable
ALTER TABLE "TenantSettings" ADD COLUMN     "devicePostureRequiredSignals" TEXT[] DEFAULT ARRAY['diskEncryption', 'firewall', 'screenLock', 'antivirus']::TEXT[];
