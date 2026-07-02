-- Add HIPAA and PCI DSS v4 to the FrameworkType enum.
--
-- HIPAA is the US health-data regulation (45 CFR Part 164 — Security,
-- Breach Notification and Privacy Rules) for covered entities and
-- business associates. PCI DSS v4.0.1 is the payment-card industry
-- security standard for entities that store, process or transmit
-- cardholder data. The enum values match the keys used in the seed
-- catalogue (`apps/api/prisma/frameworks/hipaa.ts`,
-- `apps/api/prisma/frameworks/pci-dss-4.ts`), the shared constants
-- (`packages/shared/src/constants`), and the Zod validators in the API
-- and web layers.
--
-- The seed (`apps/api/prisma/seed.ts`) handles the data side once this
-- migration runs: new Framework, Requirement and
-- FrameworkRequirementMapping rows (hipaa → iso27001/soc2,
-- pci_dss_4 → iso27001/soc2). No data backfill is required at the
-- database layer.

ALTER TYPE "FrameworkType" ADD VALUE IF NOT EXISTS 'hipaa';
ALTER TYPE "FrameworkType" ADD VALUE IF NOT EXISTS 'pci_dss_4';
