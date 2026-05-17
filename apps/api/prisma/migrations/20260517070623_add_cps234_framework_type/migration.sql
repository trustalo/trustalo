-- Add APRA CPS 234 to the FrameworkType enum.
--
-- CPS 234 is the Australian prudential regulator's Information Security
-- standard for banks, insurers and super funds. The enum value matches the
-- key used in the seed catalogue (`apps/api/prisma/frameworks/cps234.ts`),
-- the shared constants (`packages/shared/src/constants`), and the Zod
-- validators in the API and web layers.
--
-- The seed (`apps/api/prisma/seed.ts`) handles the data side once this
-- migration runs: new Framework, Requirement, FrameworkRequirementMapping
-- (cps234 → iso27001) and PolicyTemplate rows. No data backfill is
-- required at the database layer.

ALTER TYPE "FrameworkType" ADD VALUE IF NOT EXISTS 'cps234';
