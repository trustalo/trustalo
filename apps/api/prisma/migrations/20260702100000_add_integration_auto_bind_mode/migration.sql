-- Backfill migration: `Tenant.integrationAutoBindMode` exists in the Prisma
-- schema (schema/tenant.prisma) but never had a migration, so fresh installs
-- created via `prisma migrate deploy` were missing the column and crashed on
-- the first Tenant query (P2022 in `db:seed`). Long-lived dev databases got
-- the column via `prisma db push`, which is why the drift went unnoticed.
-- Both statements are guarded so the migration also applies cleanly on those
-- already-pushed databases.

-- CreateEnum (guarded: may already exist on db-push'd databases)
DO $$ BEGIN
  CREATE TYPE "IntegrationAutoBindMode" AS ENUM ('auto', 'suggest', 'off');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable (guarded for the same reason)
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "integrationAutoBindMode" "IntegrationAutoBindMode" NOT NULL DEFAULT 'suggest';
