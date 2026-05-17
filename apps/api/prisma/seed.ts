/// <reference types="bun" />
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedPolicyTemplates } from "./seed-policy-templates";
import {
  ISO27001_FRAMEWORK,
  ISO27017_FRAMEWORK,
  ISO27018_FRAMEWORK,
  ISO22301_FRAMEWORK,
  ISO42001_FRAMEWORK,
  SOC2_FRAMEWORK,
  ESSENTIAL8_FRAMEWORK,
  NIST_CSF_2_FRAMEWORK,
  GDPR_FRAMEWORK,
  CPS234_FRAMEWORK,
  type FrameworkDef,
} from "./frameworks/index.js";
import { MAPPINGS } from "./mappings/index.js";

const connectionString = process.env.API_DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const FRAMEWORKS: FrameworkDef[] = [
  ISO27001_FRAMEWORK,
  ISO27017_FRAMEWORK,
  ISO27018_FRAMEWORK,
  ISO22301_FRAMEWORK,
  ISO42001_FRAMEWORK,
  SOC2_FRAMEWORK,
  ESSENTIAL8_FRAMEWORK,
  NIST_CSF_2_FRAMEWORK,
  GDPR_FRAMEWORK,
  CPS234_FRAMEWORK,
];

/** Local test account; override with SEED_TEST_USER_EMAIL / SEED_TEST_USER_PASSWORD. */
async function seedTestUser() {
  const email = process.env.SEED_TEST_USER_EMAIL ?? "test@test.com";
  const password = process.env.SEED_TEST_USER_PASSWORD ?? "test.test";
  const orgSlug = "seed-test-org";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  ⏭ Test user already exists (${email}), skipping`);
    return;
  }

  const passwordHash = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 12,
  });

  await prisma.$transaction(async (tx) => {
    let tenant = await tx.tenant.findUnique({ where: { slug: orgSlug } });
    if (!tenant) {
      tenant = await tx.tenant.create({
        data: { name: "Test Organization", slug: orgSlug },
      });
    }

    const user = await tx.user.create({
      data: {
        email,
        name: "Test User",
        passwordHash,
        emailVerified: true,
        // Bind this user to the local credential provider so `AUTH_PROVIDER=local`
        // can find it via the (authProvider, externalId) unique key. Without
        // this, AuthService.completeLogin will fail to look the user up.
        authProvider: "local",
        externalId: email,
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: "owner",
        status: "active",
        joinedAt: new Date(),
      },
    });
  });

  console.log(`  ✓ Test user: ${email} / org slug: ${orgSlug}`);
}

async function seedFrameworks() {
  for (const fw of FRAMEWORKS) {
    const existing = await prisma.framework.findFirst({
      where: { frameworkType: fw.frameworkType },
    });

    if (existing) {
      console.log(`  ⏭ ${fw.name} already exists (${existing.id}), skipping`);
      continue;
    }

    const framework = await prisma.framework.create({
      data: {
        name: fw.name,
        version: fw.version,
        description: fw.description,
        frameworkType: fw.frameworkType as any,
        totalControls: fw.requirements.length,
        isActive: true,
        requirements: {
          create: fw.requirements.map((req, idx) => ({
            identifier: req.identifier,
            title: req.title,
            description: req.description,
            evidenceGuidance: req.evidenceGuidance,
            category: req.category,
            maturityLevel: req.maturityLevel,
            sortOrder: idx + 1,
          })),
        },
      },
    });

    console.log(`  ✓ ${fw.name} — ${fw.requirements.length} requirements (${framework.id})`);
  }
}

/** Adopt all seeded frameworks for the test org, creating controls and requirement assignments. */
async function adoptFrameworksForTestOrg() {
  const orgSlug = "seed-test-org";
  const org = await prisma.tenant.findUnique({ where: { slug: orgSlug } });
  if (!org) {
    console.log(`  ⏭ No org "${orgSlug}" found, skipping framework adoption`);
    return;
  }

  const frameworks = await prisma.framework.findMany({
    where: { isActive: true },
    include: { requirements: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });

  let totalControls = 0;

  for (const fw of frameworks) {
    const existingInstance = await prisma.frameworkInstance.findUnique({
      where: { tenantId_frameworkId: { tenantId: org.id, frameworkId: fw.id } },
    });

    if (existingInstance) {
      console.log(`  ⏭ ${fw.name} already adopted, skipping`);
      continue;
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const instance = await tx.frameworkInstance.create({
          data: { tenantId: org.id, frameworkId: fw.id },
        });

        const alreadyMapped = new Set(
          (
            await tx.controlRequirementAssignment.findMany({
              where: {
                tenantId: org.id,
                requirementId: { in: fw.requirements.map((r) => r.id) },
              },
              select: { requirementId: true },
            })
          ).map((m) => m.requirementId),
        );

        let created = 0;
        for (const req of fw.requirements) {
          if (alreadyMapped.has(req.id)) continue;

          const control = await tx.control.create({
            data: {
              tenantId: org.id,
              title: `${req.identifier}: ${req.title}`,
              description: req.description,
              implementationDetails: req.evidenceGuidance,
              category: req.category,
              status: "not_implemented",
            },
          });

          await tx.controlRequirementAssignment.create({
            data: {
              tenantId: org.id,
              controlId: control.id,
              requirementId: req.id,
              frameworkInstanceId: instance.id,
            },
          });

          created++;
        }

        return created;
      },
      { timeout: 60_000 },
    );

    totalControls += result;
    console.log(`  ✓ ${fw.name} — ${result} controls created`);
  }

  console.log(`  Total: ${totalControls} controls adopted for "${orgSlug}"`);
}

/**
 * Seeds catalog-level cross-framework requirement mappings.
 *
 * Idempotent: each mapping is uniquely identified by
 * (sourceRequirementId, targetRequirementId, relationship).
 * Skips mappings whose source or target requirement isn't present —
 * this lets us ship a mapping JSON before its target framework lands
 * without breaking the seed.
 */
async function seedFrameworkMappings() {
  let inserted = 0;
  let skipped = 0;

  for (const set of MAPPINGS) {
    const sourceFw = await prisma.framework.findFirst({
      where: { frameworkType: set.sourceFramework as any },
      include: { requirements: { select: { id: true, identifier: true } } },
    });
    const targetFw = await prisma.framework.findFirst({
      where: { frameworkType: set.targetFramework as any },
      include: { requirements: { select: { id: true, identifier: true } } },
    });

    if (!sourceFw || !targetFw) {
      console.log(
        `  ⏭ Mapping ${set.sourceFramework}→${set.targetFramework}: framework missing, skipping`,
      );
      continue;
    }

    const srcByIdent = new Map(sourceFw.requirements.map((r) => [r.identifier, r.id]));
    const tgtByIdent = new Map(targetFw.requirements.map((r) => [r.identifier, r.id]));

    for (const m of set.mappings) {
      const sourceId = srcByIdent.get(m.source);
      const targetId = tgtByIdent.get(m.target);

      if (!sourceId || !targetId) {
        skipped++;
        continue;
      }

      await prisma.frameworkRequirementMapping.upsert({
        where: {
          sourceRequirementId_targetRequirementId_relationship: {
            sourceRequirementId: sourceId,
            targetRequirementId: targetId,
            relationship: m.relationship,
          },
        },
        update: { rationale: m.rationale ?? null, source: set.source },
        create: {
          sourceRequirementId: sourceId,
          targetRequirementId: targetId,
          relationship: m.relationship,
          rationale: m.rationale,
          source: set.source,
        },
      });

      inserted++;
    }
  }

  console.log(
    `  ✓ ${inserted} cross-framework mappings upserted (${skipped} skipped — missing requirements)`,
  );
}

async function seed() {
  console.log("Seeding test user…");
  await seedTestUser();

  console.log("\nSeeding frameworks and requirements…");
  await seedFrameworks();

  const counts = await prisma.framework.findMany({
    select: { name: true, _count: { select: { requirements: true } } },
  });
  console.log("\nFramework summary:");
  let total = 0;
  for (const c of counts) {
    console.log(`  ${c.name}: ${c._count.requirements} requirements`);
    total += c._count.requirements;
  }
  console.log(`  Total: ${total} requirements across ${counts.length} frameworks`);

  console.log("\nSeeding cross-framework mappings…");
  await seedFrameworkMappings();

  console.log("\nAdopting frameworks for test org…");
  await adoptFrameworksForTestOrg();

  await seedPolicyTemplates(prisma);
}

seed()
  .then(() => {
    console.log("\nSeed completed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
