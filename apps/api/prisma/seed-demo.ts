/// <reference types="bun" />
//
// Demo seed — populates the existing `seed-test-org` tenancy with rich
// sample data so every workspace in the platform shows something
// interesting during a live demo. Idempotent: re-running only adds
// rows that don't already exist.
//
// Pre-requisites:
//   1. `bun run db:migrate` has been applied
//   2. `bun run db:seed`     has been run (creates the org + frameworks
//      and adopts ~600 controls into `seed-test-org`)
//
// Run with:
//   bun run db:seed:demo            (from apps/api)
//   bun run db:seed:demo:api        (from repo root)
//
// All demo users authenticate via the local provider with
// password `Password.123` unless overridden.
//
// Everything created here is OBVIOUSLY fake: the org is renamed to
// "Acme Demo Co", every person lives at @demo.trustalo.io, and rows
// with a JSON metadata column carry a `demoSeed: true` marker.

import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client/index.js";
import { encryptString } from "../src/lib/crypto-envelope";

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Password.123";
const ORG_SLUG = process.env.SEED_DEMO_ORG_SLUG ?? "seed-test-org";
const DEMO_ORG_NAME = "Acme Demo Co";

const connectionString = process.env.API_DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ────────────────────────────────────────────────────────────────────
// Date helpers — keep generated timestamps deterministic-ish so the
// demo "looks lived-in" without being a wall of `now()`.
// ────────────────────────────────────────────────────────────────────
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS);
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * DAY_MS);
}
function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * HOUR_MS);
}

// Round-robin picker so we don't have to assign owners by hand.
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

// ────────────────────────────────────────────────────────────────────
// Personas — every demo user goes here. Keep emails predictable
// so the presenter can log in as any persona on stage.
// ────────────────────────────────────────────────────────────────────
type DemoPersona = {
  email: string;
  name: string;
  role:
    | "owner"
    | "admin"
    | "compliance_manager"
    | "auditor"
    | "viewer"
    | "integration_admin"
    | "dpo";
  jobTitle: string;
  department: string;
};

const PERSONAS: DemoPersona[] = [
  {
    email: "alex.chen@demo.trustalo.io",
    name: "Alex Chen (CISO)",
    role: "admin",
    jobTitle: "Chief Information Security Officer",
    department: "Security",
  },
  {
    email: "morgan.lee@demo.trustalo.io",
    name: "Morgan Lee (Compliance Lead)",
    role: "compliance_manager",
    jobTitle: "Compliance Lead",
    department: "Compliance",
  },
  {
    email: "priya.patel@demo.trustalo.io",
    name: "Priya Patel (Eng Lead)",
    role: "compliance_manager",
    jobTitle: "Engineering Lead",
    department: "Engineering",
  },
  {
    email: "sam.rivera@demo.trustalo.io",
    name: "Sam Rivera (DPO)",
    role: "dpo",
    jobTitle: "Data Protection Officer",
    department: "Legal",
  },
  {
    email: "jordan.kim@demo.trustalo.io",
    name: "Jordan Kim (External Auditor)",
    role: "auditor",
    jobTitle: "External Auditor",
    department: "External",
  },
];

type SeedContext = {
  orgId: string;
  testUserId: string;
  users: Awaited<ReturnType<typeof seedDemoUsers>>;
};

// ────────────────────────────────────────────────────────────────────
// Step 0 — locate the org seeded by the base `seed.ts`.
// ────────────────────────────────────────────────────────────────────
async function loadOrg() {
  const org = await prisma.tenant.findUnique({ where: { slug: ORG_SLUG } });
  if (!org) {
    throw new Error(
      `Org "${ORG_SLUG}" not found. Run \`bun run db:seed\` from apps/api first ` +
        `to create the test org and adopt the framework catalog.`,
    );
  }

  const baseUser = await prisma.user.findUnique({ where: { email: "test@test.com" } });
  if (!baseUser) {
    throw new Error("Base test user not found. Run `bun run db:seed` first.");
  }

  // Rename the tenancy so the demo data is unmistakably fake.
  if (org.name !== DEMO_ORG_NAME) {
    await prisma.tenant.update({ where: { id: org.id }, data: { name: DEMO_ORG_NAME } });
    org.name = DEMO_ORG_NAME;
  }

  // The base seed links the test user to the org; older databases seeded
  // before the People module may miss the Person row, so backfill it —
  // login resolves the tenant through Person.
  const basePerson = await prisma.person.findFirst({
    where: { tenantId: org.id, userId: baseUser.id },
  });
  if (!basePerson) {
    await prisma.person.create({
      data: {
        userId: baseUser.id,
        tenantId: org.id,
        email: baseUser.email,
        fullName: baseUser.name,
        role: "owner",
        status: "active",
        joinedAt: daysAgo(365),
      },
    });
  }

  return { org, baseUser };
}

// ────────────────────────────────────────────────────────────────────
// Step 1 — Demo users + memberships. Idempotent on (email).
// ────────────────────────────────────────────────────────────────────
async function seedDemoUsers(orgId: string) {
  const created: { id: string; email: string; name: string; role: DemoPersona["role"] }[] = [];

  for (const persona of PERSONAS) {
    let user = await prisma.user.findUnique({ where: { email: persona.email } });

    if (!user) {
      const passwordHash = await Bun.password.hash(DEMO_PASSWORD, {
        algorithm: "bcrypt",
        cost: 12,
      });
      user = await prisma.user.create({
        data: {
          email: persona.email,
          name: persona.name,
          passwordHash,
          emailVerified: true,
          authProvider: "local",
          externalId: persona.email,
        },
      });
    }

    const existingPerson = await prisma.person.findFirst({
      where: { userId: user.id, tenantId: orgId },
    });
    if (!existingPerson) {
      await prisma.person.create({
        data: {
          userId: user.id,
          tenantId: orgId,
          email: user.email,
          fullName: user.name,
          role: persona.role,
          status: "active",
          jobTitle: persona.jobTitle,
          department: persona.department,
          startDate: daysAgo(400),
          joinedAt: daysAgo(120),
        },
      });
    }

    created.push({ id: user.id, email: user.email, name: user.name, role: persona.role });
  }

  console.log(`  ✓ ${created.length} demo personas ready (password: ${DEMO_PASSWORD})`);
  return created;
}

// ────────────────────────────────────────────────────────────────────
// Step 1b — People directory. Login-less Person rows across the HR
// lifecycle (active / invited / offboarded) plus background checks and
// on/offboarding checklists so the People workspace looks lived-in.
// ────────────────────────────────────────────────────────────────────
async function seedPeopleDirectory(ctx: SeedContext) {
  const DIRECTORY: Array<{
    email: string;
    fullName: string;
    jobTitle: string;
    department: string;
    kind: "employee" | "contractor";
    status: "invited" | "active" | "offboarded";
    startDaysAgo: number;
    endDaysAgo?: number;
    location: string;
  }> = [
    {
      email: "taylor.nguyen@demo.trustalo.io",
      fullName: "Taylor Nguyen",
      jobTitle: "Senior Backend Engineer",
      department: "Engineering",
      kind: "employee",
      status: "active",
      startDaysAgo: 500,
      location: "Sydney, AU",
    },
    {
      email: "riley.thompson@demo.trustalo.io",
      fullName: "Riley Thompson",
      jobTitle: "Customer Success Manager",
      department: "Customer Success",
      kind: "employee",
      status: "active",
      startDaysAgo: 300,
      location: "Melbourne, AU",
    },
    {
      email: "casey.fischer@demo.trustalo.io",
      fullName: "Casey Fischer",
      jobTitle: "Finance Manager",
      department: "Finance",
      kind: "employee",
      status: "active",
      startDaysAgo: 700,
      location: "Sydney, AU",
    },
    {
      email: "jamie.oconnor@demo.trustalo.io",
      fullName: "Jamie O'Connor",
      jobTitle: "IT Administrator",
      department: "IT",
      kind: "employee",
      status: "active",
      startDaysAgo: 250,
      location: "Sydney, AU",
    },
    {
      email: "dana.whitfield@demo.trustalo.io",
      fullName: "Dana Whitfield",
      jobTitle: "Sales Director",
      department: "Sales",
      kind: "employee",
      status: "active",
      startDaysAgo: 420,
      location: "Singapore, SG",
    },
    {
      email: "harper.singh@demo.trustalo.io",
      fullName: "Harper Singh",
      jobTitle: "Security Contractor (Pen Testing)",
      department: "Security",
      kind: "contractor",
      status: "active",
      startDaysAgo: 45,
      location: "Remote",
    },
    {
      email: "noah.almeida@demo.trustalo.io",
      fullName: "Noah Almeida",
      jobTitle: "Junior Software Engineer",
      department: "Engineering",
      kind: "employee",
      status: "invited",
      startDaysAgo: -7, // starts next week
      location: "Sydney, AU",
    },
    {
      email: "quinn.baxter@demo.trustalo.io",
      fullName: "Quinn Baxter",
      jobTitle: "Support Engineer",
      department: "Customer Success",
      kind: "employee",
      status: "offboarded",
      startDaysAgo: 600,
      endDaysAgo: 3,
      location: "Melbourne, AU",
    },
  ];

  for (const d of DIRECTORY) {
    const existing = await prisma.person.findFirst({
      where: { tenantId: ctx.orgId, email: d.email },
    });
    if (existing) continue;
    await prisma.person.create({
      data: {
        tenantId: ctx.orgId,
        email: d.email,
        fullName: d.fullName,
        role: "member",
        status: d.status,
        kind: d.kind,
        source: "manual",
        jobTitle: d.jobTitle,
        department: d.department,
        location: d.location,
        employmentType: d.kind === "contractor" ? "contract" : "full_time",
        startDate: d.startDaysAgo >= 0 ? daysAgo(d.startDaysAgo) : daysFromNow(-d.startDaysAgo),
        endDate: d.endDaysAgo !== undefined ? daysAgo(d.endDaysAgo) : null,
        invitedAt: d.status === "invited" ? daysAgo(2) : null,
        joinedAt: d.status === "invited" ? null : daysAgo(Math.max(d.startDaysAgo, 0)),
      },
    });
  }

  // Background checks — one cleared long-term, one cleared but expiring
  // soon (renewal pressure on the dashboard), one still in progress.
  const CHECKS: Array<{
    personEmail: string;
    type: "identity" | "criminal" | "reference";
    status: "cleared" | "in_progress";
    provider: string;
    completedDaysAgo?: number;
    expiresDaysFromNow?: number;
  }> = [
    {
      personEmail: "taylor.nguyen@demo.trustalo.io",
      type: "criminal",
      status: "cleared",
      provider: "Checkmate Screening",
      completedDaysAgo: 350,
      expiresDaysFromNow: 14, // expiring soon
    },
    {
      personEmail: "riley.thompson@demo.trustalo.io",
      type: "identity",
      status: "cleared",
      provider: "Checkmate Screening",
      completedDaysAgo: 280,
      expiresDaysFromNow: 320,
    },
    {
      personEmail: "noah.almeida@demo.trustalo.io",
      type: "reference",
      status: "in_progress",
      provider: "Checkmate Screening",
    },
  ];

  for (const c of CHECKS) {
    const person = await prisma.person.findFirst({
      where: { tenantId: ctx.orgId, email: c.personEmail },
    });
    if (!person) continue;
    const exists = await prisma.backgroundCheck.findFirst({
      where: { personId: person.id, type: c.type },
    });
    if (exists) continue;
    await prisma.backgroundCheck.create({
      data: {
        tenantId: ctx.orgId,
        personId: person.id,
        type: c.type,
        status: c.status,
        provider: c.provider,
        reference: `DEMO-${c.type.toUpperCase()}-${person.id.slice(-6)}`,
        requestedAt: daysAgo(c.completedDaysAgo !== undefined ? c.completedDaysAgo + 7 : 3),
        completedAt: c.completedDaysAgo !== undefined ? daysAgo(c.completedDaysAgo) : null,
        expiresAt: c.expiresDaysFromNow !== undefined ? daysFromNow(c.expiresDaysFromNow) : null,
      },
    });
  }

  // Onboarding checklist for the incoming hire; offboarding checklist —
  // deliberately half-finished — for the person leaving this week.
  const CHECKLISTS: Array<{
    personEmail: string;
    kind: "onboarding" | "offboarding";
    items: Array<{ key: string; label: string; status: "pending" | "done"; dueInDays: number }>;
  }> = [
    {
      personEmail: "noah.almeida@demo.trustalo.io",
      kind: "onboarding",
      items: [
        { key: "contract_signed", label: "Sign employment contract", status: "done", dueInDays: 0 },
        { key: "okta_account", label: "Provision Okta account", status: "pending", dueInDays: 6 },
        { key: "mdm_enroll", label: "Enroll laptop in MDM", status: "pending", dueInDays: 7 },
        {
          key: "security_training",
          label: "Complete Security Awareness 101",
          status: "pending",
          dueInDays: 14,
        },
      ],
    },
    {
      personEmail: "quinn.baxter@demo.trustalo.io",
      kind: "offboarding",
      items: [
        { key: "sso_disabled", label: "Disable SSO access", status: "done", dueInDays: 0 },
        { key: "vpn_revoked", label: "Revoke VPN certificate", status: "done", dueInDays: 0 },
        { key: "laptop_return", label: "Reclaim MacBook Pro", status: "pending", dueInDays: 4 },
        { key: "payroll_removed", label: "Remove from payroll", status: "pending", dueInDays: 7 },
        { key: "exit_interview", label: "Conduct exit interview", status: "pending", dueInDays: 5 },
      ],
    },
  ];

  for (const list of CHECKLISTS) {
    const person = await prisma.person.findFirst({
      where: { tenantId: ctx.orgId, email: list.personEmail },
    });
    if (!person) continue;
    for (const item of list.items) {
      await prisma.personChecklistItem.upsert({
        where: { personId_kind_key: { personId: person.id, kind: list.kind, key: item.key } },
        update: {},
        create: {
          tenantId: ctx.orgId,
          personId: person.id,
          kind: list.kind,
          key: item.key,
          label: item.label,
          status: item.status,
          dueAt: daysFromNow(item.dueInDays),
          completedAt: item.status === "done" ? daysAgo(1) : null,
        },
      });
    }
  }

  console.log(
    `  ✓ ${DIRECTORY.length} directory people, ${CHECKS.length} background checks, ` +
      `${CHECKLISTS.reduce((n, l) => n + l.items.length, 0)} checklist items`,
  );
}

// ────────────────────────────────────────────────────────────────────
// Step 2 — Org settings + AI-grounding "facts wallet" entries so
// AI features (policy drafting, questionnaire answers, chat) feel
// informed about the company during the demo.
// ────────────────────────────────────────────────────────────────────
async function seedOrgProfile(orgId: string) {
  await prisma.tenantSettings.upsert({
    where: { tenantId: orgId },
    update: {},
    create: {
      tenantId: orgId,
      companySize: "51-200",
      industry: "SaaS / B2B Software",
      country: "AU",
      timezone: "Australia/Sydney",
    },
  });

  const facts: {
    category: "company" | "tech_stack" | "processes" | "data_handling" | "risk_appetite" | "team";
    question: string;
    answer: string;
  }[] = [
    {
      category: "company",
      question: "What does the company do?",
      answer:
        "Acme Demo Co is a B2B SaaS platform that helps mid-market companies manage their compliance and risk programs. Founded in 2021, headquartered in Sydney, Australia.",
    },
    {
      category: "company",
      question: "Where is the company headquartered and where do customers reside?",
      answer:
        "Headquarters in Sydney, Australia. Customers primarily in APAC (60%), North America (25%) and EMEA (15%).",
    },
    {
      category: "tech_stack",
      question: "What is the core technology stack?",
      answer:
        "TypeScript across the stack: Node.js / Bun on the API tier, React + Vite on the web tier, PostgreSQL 16 as the primary datastore, Redis for queues, and S3-compatible object storage.",
    },
    {
      category: "tech_stack",
      question: "Where is production hosted?",
      answer:
        "Production runs on AWS in ap-southeast-2 (Sydney) with a warm DR replica in ap-southeast-4 (Melbourne). All workloads are containerised and orchestrated via ECS Fargate.",
    },
    {
      category: "processes",
      question: "How does the company release software to production?",
      answer:
        "Trunk-based development with mandatory pull requests requiring two approvals. CI runs unit tests, lint, type-check and security scans. Release branches deploy via GitHub Actions to staging, then production after a 1-hour soak window.",
    },
    {
      category: "data_handling",
      question: "How is customer data protected at rest and in transit?",
      answer:
        "All customer data is encrypted at rest with AES-256 (KMS-managed keys with annual rotation) and in transit with TLS 1.2+. Database backups are encrypted and retained for 35 days.",
    },
    {
      category: "data_handling",
      question: "How are personal data subjects' rights handled?",
      answer:
        "DSARs are received via privacy@acmecloud.io and tracked in our DSAR register. Standard SLA is 30 days from verified identity, extendable by 60 days under GDPR Art. 12(3) with subject notification.",
    },
    {
      category: "risk_appetite",
      question: "What is the organisation's risk appetite?",
      answer:
        "Low appetite for security and privacy risks; moderate appetite for operational delivery risk where it accelerates customer outcomes. Catastrophic-impact risks require executive sign-off regardless of likelihood.",
    },
    {
      category: "team",
      question: "Who runs the security & compliance program?",
      answer:
        "Alex Chen (CISO) owns security; Morgan Lee (Compliance Lead) owns the compliance program; Sam Rivera is the appointed Data Protection Officer. The Risk Council meets monthly.",
    },
  ];

  for (const fact of facts) {
    const existing = await prisma.tenantContext.findFirst({
      where: { tenantId: orgId, question: fact.question },
    });
    if (existing) continue;
    await prisma.tenantContext.create({
      data: {
        tenantId: orgId,
        category: fact.category,
        question: fact.question,
        answer: fact.answer,
        source: "onboarding",
        confidence: 1.0,
        status: "active",
        confirmedAt: daysAgo(90),
      },
    });
  }
  console.log(`  ✓ Organization settings + ${facts.length} context entries`);
}

// ────────────────────────────────────────────────────────────────────
// Step 3 — Vendors. Cover a believable supplier mix with assessments,
// contacts, and a couple of documents.
// ────────────────────────────────────────────────────────────────────
async function seedVendors(ctx: SeedContext) {
  const compliance = ctx.users.find((u) => u.role === "compliance_manager")!;
  const ciso = ctx.users.find((u) => u.role === "admin")!;

  const VENDORS: Array<{
    name: string;
    description: string;
    website: string;
    category: string;
    riskTier: "critical" | "high" | "medium" | "low";
    status: "active" | "approved" | "under_review";
    dataProcessing: boolean;
    isSubprocessor: boolean;
    subprocessorPurpose?: string;
    dataTypesShared: string[];
    dataLocations: string[];
    dpaStatus: "approved" | "received" | "not_required" | "requested";
    contractStartDaysAgo: number;
    contractEndDaysFromNow: number;
    assessment: { score: number; findings: string };
  }> = [
    {
      name: "Amazon Web Services",
      description: "Primary cloud infrastructure provider — compute, storage, networking.",
      website: "https://aws.amazon.com",
      category: "Cloud Infrastructure",
      riskTier: "critical",
      status: "approved",
      dataProcessing: true,
      isSubprocessor: true,
      subprocessorPurpose: "Hosts all customer data in ap-southeast-2.",
      dataTypesShared: ["customer_data", "system_logs", "backups"],
      dataLocations: ["AU"],
      dpaStatus: "approved",
      contractStartDaysAgo: 540,
      contractEndDaysFromNow: 180,
      assessment: { score: 92, findings: "SOC 2 Type II + ISO 27001 in scope. No material gaps." },
    },
    {
      name: "GitHub",
      description: "Source code hosting + CI/CD pipelines.",
      website: "https://github.com",
      category: "Engineering",
      riskTier: "high",
      status: "approved",
      dataProcessing: false,
      isSubprocessor: false,
      dataTypesShared: ["source_code"],
      dataLocations: ["US"],
      dpaStatus: "approved",
      contractStartDaysAgo: 720,
      contractEndDaysFromNow: 365,
      assessment: { score: 88, findings: "MFA enforced. Branch protection on production repos." },
    },
    {
      name: "Datadog",
      description: "Application & infrastructure observability.",
      website: "https://datadoghq.com",
      category: "Observability",
      riskTier: "medium",
      status: "approved",
      dataProcessing: true,
      isSubprocessor: true,
      subprocessorPurpose: "Receives operational logs and traces (no PII).",
      dataTypesShared: ["system_logs", "performance_metrics"],
      dataLocations: ["US", "EU"],
      dpaStatus: "approved",
      contractStartDaysAgo: 400,
      contractEndDaysFromNow: 240,
      assessment: { score: 84, findings: "Confirmed PII scrubbing rules in collector." },
    },
    {
      name: "Stripe",
      description: "Payments processor for subscription billing.",
      website: "https://stripe.com",
      category: "Payments",
      riskTier: "high",
      status: "approved",
      dataProcessing: true,
      isSubprocessor: true,
      subprocessorPurpose: "Processes customer billing details.",
      dataTypesShared: ["payment_information", "billing_contact"],
      dataLocations: ["US"],
      dpaStatus: "approved",
      contractStartDaysAgo: 600,
      contractEndDaysFromNow: 365,
      assessment: { score: 95, findings: "PCI-DSS Level 1. SAQ-A scope for our integration." },
    },
    {
      name: "Slack",
      description: "Team communications.",
      website: "https://slack.com",
      category: "Productivity",
      riskTier: "medium",
      status: "approved",
      dataProcessing: true,
      isSubprocessor: false,
      dataTypesShared: ["employee_communications"],
      dataLocations: ["US"],
      dpaStatus: "approved",
      contractStartDaysAgo: 800,
      contractEndDaysFromNow: 200,
      assessment: { score: 80, findings: "DLP rules in place; channel-export requires admin." },
    },
    {
      name: "OpenAI",
      description: "Large-language-model APIs powering AI accelerator features.",
      website: "https://openai.com",
      category: "AI / ML",
      riskTier: "high",
      status: "under_review",
      dataProcessing: true,
      isSubprocessor: true,
      subprocessorPurpose: "Receives prompt content for AI feature inference.",
      dataTypesShared: ["prompt_text"],
      dataLocations: ["US"],
      dpaStatus: "received",
      contractStartDaysAgo: 90,
      contractEndDaysFromNow: 275,
      assessment: {
        score: 72,
        findings:
          "Zero-data-retention enabled. Outstanding: confirm sub-processor list refresh cadence.",
      },
    },
    {
      name: "Snyk",
      description: "SAST + dependency vulnerability scanning.",
      website: "https://snyk.io",
      category: "Security",
      riskTier: "low",
      status: "approved",
      dataProcessing: false,
      isSubprocessor: false,
      dataTypesShared: ["source_code_metadata"],
      dataLocations: ["US"],
      dpaStatus: "not_required",
      contractStartDaysAgo: 365,
      contractEndDaysFromNow: 365,
      assessment: {
        score: 86,
        findings: "Findings synced into our vulnerability register weekly.",
      },
    },
    {
      name: "Notion",
      description: "Internal knowledge base and wiki.",
      website: "https://notion.so",
      category: "Productivity",
      riskTier: "low",
      status: "approved",
      dataProcessing: false,
      isSubprocessor: false,
      dataTypesShared: ["internal_documents"],
      dataLocations: ["US"],
      dpaStatus: "approved",
      contractStartDaysAgo: 480,
      contractEndDaysFromNow: 220,
      assessment: { score: 78, findings: "SSO + SCIM provisioning enforced." },
    },
  ];

  for (let i = 0; i < VENDORS.length; i++) {
    const v = VENDORS[i];
    let vendor = await prisma.vendor.findFirst({
      where: { tenantId: ctx.orgId, name: v.name },
    });
    if (!vendor) {
      vendor = await prisma.vendor.create({
        data: {
          tenantId: ctx.orgId,
          name: v.name,
          description: v.description,
          website: v.website,
          category: v.category,
          riskTier: v.riskTier,
          status: v.status,
          dataProcessing: v.dataProcessing,
          isSubprocessor: v.isSubprocessor,
          subprocessorPurpose: v.subprocessorPurpose,
          dataTypesShared: v.dataTypesShared,
          dataLocations: v.dataLocations,
          dpaStatus: v.dpaStatus,
          dpaExpiresAt: v.dpaStatus === "approved" ? daysFromNow(v.contractEndDaysFromNow) : null,
          contractStartDate: daysAgo(v.contractStartDaysAgo),
          contractEndDate: daysFromNow(v.contractEndDaysFromNow),
          researchFrequency:
            v.riskTier === "critical" || v.riskTier === "high" ? "monthly" : "yearly",
          lastResearchedAt: daysAgo(30 + i * 5),
          nextResearchAt: daysFromNow(60 + i * 10),
        },
      });
    }

    const hasAssessment = await prisma.vendorAssessment.findFirst({
      where: { vendorId: vendor.id },
    });
    if (!hasAssessment) {
      await prisma.vendorAssessment.create({
        data: {
          vendorId: vendor.id,
          tenantId: ctx.orgId,
          assessedById: pick([compliance.id, ciso.id], i),
          score: v.assessment.score,
          findings: v.assessment.findings,
          nextReviewDate: daysFromNow(180),
        },
      });
    }

    const hasContact = await prisma.vendorContact.findFirst({ where: { vendorId: vendor.id } });
    if (!hasContact) {
      await prisma.vendorContact.create({
        data: {
          vendorId: vendor.id,
          name: `${v.name} Account Manager`,
          email: `partners@${new URL(v.website).hostname.replace("www.", "")}`,
          role: "Account Manager",
          isPrimary: true,
        },
      });
    }
  }

  console.log(`  ✓ ${VENDORS.length} vendors with assessments + contacts`);
}

// ────────────────────────────────────────────────────────────────────
// Step 4 — Assets. Cover the AssetType enum cleanly.
// ────────────────────────────────────────────────────────────────────
async function seedAssets(ctx: SeedContext) {
  const ASSETS: Array<{
    name: string;
    type:
      | "hardware"
      | "software"
      | "data"
      | "service"
      | "personnel"
      | "facility"
      | "cloud_resource";
    classification: "public" | "internal" | "confidential" | "restricted";
    description: string;
  }> = [
    {
      name: "Production PostgreSQL Cluster",
      type: "cloud_resource",
      classification: "restricted",
      description: "Primary RDS Aurora cluster (db.r6g.2xlarge, multi-AZ).",
    },
    {
      name: "Production Web Tier (ECS)",
      type: "cloud_resource",
      classification: "confidential",
      description: "ECS Fargate service running the web application.",
    },
    {
      name: "Production API Tier (ECS)",
      type: "cloud_resource",
      classification: "confidential",
      description: "ECS Fargate service running the API.",
    },
    {
      name: "Customer Document Bucket",
      type: "cloud_resource",
      classification: "restricted",
      description: "S3 bucket storing customer-uploaded evidence files.",
    },
    {
      name: "Customer PII Database",
      type: "data",
      classification: "restricted",
      description: "Logical schema holding personal data subject to GDPR/AU Privacy Act.",
    },
    {
      name: "Engineering Laptops",
      type: "hardware",
      classification: "internal",
      description: "MDM-managed MacBook Pro fleet for engineering staff.",
    },
    {
      name: "Datadog Workspace",
      type: "service",
      classification: "internal",
      description: "Centralised logs, metrics and traces.",
    },
    {
      name: "AWS Account — Production",
      type: "cloud_resource",
      classification: "restricted",
      description: "Top-level AWS account hosting all production workloads.",
    },
    {
      name: "GitHub Organization",
      type: "service",
      classification: "confidential",
      description: "Source repositories for all microservices.",
    },
    {
      name: "Identity Provider (Okta)",
      type: "service",
      classification: "confidential",
      description: "SSO + MDM-integrated identity provider.",
    },
    {
      name: "Office — Sydney HQ",
      type: "facility",
      classification: "internal",
      description: "Primary office in Surry Hills with badge access.",
    },
    {
      name: "On-call Engineering Team",
      type: "personnel",
      classification: "internal",
      description: "Rotating 24/7 on-call coverage across two timezones.",
    },
  ];

  const owners = ctx.users.filter((u) => u.role === "admin" || u.role === "compliance_manager");

  for (let i = 0; i < ASSETS.length; i++) {
    const a = ASSETS[i];
    const existing = await prisma.asset.findFirst({
      where: { tenantId: ctx.orgId, name: a.name },
    });
    if (existing) continue;

    await prisma.asset.create({
      data: {
        tenantId: ctx.orgId,
        name: a.name,
        type: a.type,
        classification: a.classification,
        description: a.description,
        ownerId: pick(owners, i).id,
        status: "active",
        location: a.type === "facility" ? "Sydney, AU" : "ap-southeast-2",
      },
    });
  }

  console.log(`  ✓ ${ASSETS.length} assets`);
}

// ────────────────────────────────────────────────────────────────────
// Step 5 — Risks with assessments + treatments.
// ────────────────────────────────────────────────────────────────────
async function seedRisks(ctx: SeedContext) {
  const owners = ctx.users.filter((u) => u.role === "admin" || u.role === "compliance_manager");
  const RISKS: Array<{
    title: string;
    description: string;
    category:
      | "operational"
      | "technical"
      | "compliance"
      | "strategic"
      | "financial"
      | "reputational"
      | "security"
      | "privacy"
      | "third_party"
      | "environmental";
    department:
      | "engineering"
      | "product"
      | "operations"
      | "finance"
      | "legal"
      | "human_resources"
      | "sales"
      | "marketing"
      | "customer_support"
      | "it"
      | "security"
      | "compliance"
      | "executive"
      | "other";
    probability: "rare" | "unlikely" | "possible" | "likely" | "almost_certain";
    impact: "negligible" | "low" | "moderate" | "high" | "catastrophic";
    residualLikelihood: "rare" | "unlikely" | "possible" | "likely" | "almost_certain";
    residualImpact: "negligible" | "low" | "moderate" | "high" | "catastrophic";
    treatmentStrategy: "mitigate" | "accept" | "transfer" | "avoid" | "control";
    actionPlan: string;
    status: "not_started" | "in_progress" | "done";
    tags: string[];
  }> = [
    {
      title: "Sub-processor data exfiltration via compromised AI vendor",
      description:
        "Customer prompt data sent to OpenAI could be retained or exposed if their controls fail.",
      category: "third_party",
      department: "security",
      probability: "unlikely",
      impact: "high",
      residualLikelihood: "rare",
      residualImpact: "moderate",
      treatmentStrategy: "mitigate",
      actionPlan:
        "Enable zero-data-retention; redact PII before send; quarterly vendor re-assessment.",
      status: "in_progress",
      tags: ["ai", "third-party"],
    },
    {
      title: "Regulatory non-compliance with EU AI Act high-risk classification",
      description:
        "Risk-scoring features may meet EU AI Act high-risk thresholds requiring conformity assessment.",
      category: "compliance",
      department: "compliance",
      probability: "possible",
      impact: "high",
      residualLikelihood: "unlikely",
      residualImpact: "moderate",
      treatmentStrategy: "mitigate",
      actionPlan:
        "Complete EU AI Act gap assessment; document human oversight; build conformity assessment plan.",
      status: "in_progress",
      tags: ["ai", "regulation", "eu"],
    },
    {
      title: "Insider threat — privileged engineer exfiltrating customer data",
      description:
        "A small number of engineers have read access to production databases for support workflows.",
      category: "security",
      department: "engineering",
      probability: "rare",
      impact: "catastrophic",
      residualLikelihood: "rare",
      residualImpact: "high",
      treatmentStrategy: "control",
      actionPlan:
        "Enforce just-in-time prod access via approval workflow; expand DLP coverage to query results.",
      status: "in_progress",
      tags: ["insider", "data"],
    },
    {
      title: "DDoS-induced outage of public Trust Center",
      description:
        "Trust Center is a marketing/sales surface that needs availability around procurement events.",
      category: "operational",
      department: "engineering",
      probability: "possible",
      impact: "moderate",
      residualLikelihood: "unlikely",
      residualImpact: "low",
      treatmentStrategy: "mitigate",
      actionPlan: "Front Trust Center with CloudFront + WAF; rate-limit unauthenticated routes.",
      status: "done",
      tags: ["availability"],
    },
    {
      title: "Loss of single-region availability (Sydney AZ outage)",
      description:
        "Production is multi-AZ but single-region. A Sydney-wide outage would extend recovery time.",
      category: "technical",
      department: "engineering",
      probability: "unlikely",
      impact: "high",
      residualLikelihood: "rare",
      residualImpact: "moderate",
      treatmentStrategy: "transfer",
      actionPlan: "Stand up warm DR in Melbourne (in progress). Document failover runbook.",
      status: "in_progress",
      tags: ["dr", "availability"],
    },
    {
      title: "GDPR DSAR SLA breach",
      description: "Spike in DSARs from EU customers may exceed our 30-day response capacity.",
      category: "privacy",
      department: "compliance",
      probability: "possible",
      impact: "moderate",
      residualLikelihood: "unlikely",
      residualImpact: "low",
      treatmentStrategy: "mitigate",
      actionPlan: "Add structured DSAR fulfilment tooling; cross-train two additional handlers.",
      status: "in_progress",
      tags: ["gdpr", "privacy"],
    },
    {
      title: "Phishing leading to credential compromise",
      description: "Targeted phishing of finance/admin staff for fraudulent payment redirection.",
      category: "security",
      department: "operations",
      probability: "likely",
      impact: "moderate",
      residualLikelihood: "possible",
      residualImpact: "low",
      treatmentStrategy: "mitigate",
      actionPlan:
        "Quarterly simulated phishing; mandatory MFA via Okta with hardware-key fallback.",
      status: "in_progress",
      tags: ["phishing", "training"],
    },
    {
      title: "Open-source dependency supply-chain attack",
      description: "Compromised npm package introduces backdoor into build pipeline.",
      category: "technical",
      department: "engineering",
      probability: "possible",
      impact: "high",
      residualLikelihood: "unlikely",
      residualImpact: "moderate",
      treatmentStrategy: "mitigate",
      actionPlan: "Lockfile pinning + Snyk + provenance attestations on production deploys.",
      status: "in_progress",
      tags: ["supply-chain"],
    },
    {
      title: "Customer churn from delayed SOC 2 Type II report",
      description: "Two enterprise prospects gated on receipt of SOC 2 Type II.",
      category: "strategic",
      department: "sales",
      probability: "possible",
      impact: "high",
      residualLikelihood: "unlikely",
      residualImpact: "moderate",
      treatmentStrategy: "mitigate",
      actionPlan:
        "Closed control gaps in observability + access reviews; audit fieldwork scheduled in 6 weeks.",
      status: "in_progress",
      tags: ["soc2", "sales"],
    },
    {
      title: "Improperly classified data in a public S3 bucket",
      description: "Misconfigured bucket policy could expose customer-uploaded evidence.",
      category: "security",
      department: "engineering",
      probability: "unlikely",
      impact: "catastrophic",
      residualLikelihood: "rare",
      residualImpact: "high",
      treatmentStrategy: "mitigate",
      actionPlan: "S3 Block Public Access org-wide; daily Macie scan.",
      status: "in_progress",
      tags: ["aws", "data"],
    },
  ];

  const PROB_SCORE: Record<string, number> = {
    rare: 1,
    unlikely: 2,
    possible: 3,
    likely: 4,
    almost_certain: 5,
  };
  const IMP_SCORE: Record<string, number> = {
    negligible: 1,
    low: 2,
    moderate: 3,
    high: 4,
    catastrophic: 5,
  };

  let created = 0;
  for (let i = 0; i < RISKS.length; i++) {
    const r = RISKS[i];
    const existing = await prisma.risk.findFirst({
      where: { tenantId: ctx.orgId, title: r.title },
    });
    if (existing) continue;

    const probScore = PROB_SCORE[r.probability];
    const impScore = IMP_SCORE[r.impact];
    const resLScore = PROB_SCORE[r.residualLikelihood];
    const resIScore = IMP_SCORE[r.residualImpact];
    const owner = pick(owners, i);
    const actionOwner = pick(owners, i + 1);

    const year = new Date().getFullYear();
    const quarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
    const seq = String(i + 1).padStart(2, "0");
    const riskIdentifier = `${year}-RID-${quarter}-${seq}`;

    const risk = await prisma.risk.create({
      data: {
        tenantId: ctx.orgId,
        riskIdentifier,
        title: r.title,
        description: r.description,
        category: r.category,
        department: r.department,
        status: r.status,
        probability: r.probability,
        probabilityScore: probScore,
        impact: r.impact,
        impactScore: impScore,
        riskScore: probScore * impScore,
        residualLikelihood: r.residualLikelihood,
        residualLikelihoodScore: resLScore,
        residualImpact: r.residualImpact,
        residualImpactScore: resIScore,
        residualRiskScore: resLScore * resIScore,
        treatmentStrategy: r.treatmentStrategy,
        actionPlan: r.actionPlan,
        ownerId: owner.id,
        actionOwnerId: actionOwner.id,
        actionOwnerName: actionOwner.name,
        estStartDate: daysAgo(30),
        estEndDate: daysFromNow(60),
        managementApproval: "yes",
        budgetApproval: r.status === "done" ? "yes" : "pending",
        tags: r.tags,
      },
    });

    await prisma.riskAssessment.create({
      data: {
        riskId: risk.id,
        tenantId: ctx.orgId,
        assessedById: owner.id,
        inherentLikelihood: probScore,
        inherentImpact: impScore,
        residualLikelihood: resLScore,
        residualImpact: resIScore,
        notes: "Initial assessment captured during quarterly Risk Council.",
        assessedAt: daysAgo(45 + i),
      },
    });

    await prisma.riskTreatment.create({
      data: {
        riskId: risk.id,
        tenantId: ctx.orgId,
        strategy: r.treatmentStrategy,
        title: `Treatment plan — ${r.title}`,
        description: r.actionPlan,
        responsibleId: actionOwner.id,
        dueDate: daysFromNow(60),
        status: r.status === "done" ? "completed" : "in_progress",
        completedAt: r.status === "done" ? daysAgo(7) : null,
      },
    });

    created++;
  }

  console.log(`  ✓ ${created} risks (with assessments + treatments)`);
}

// ────────────────────────────────────────────────────────────────────
// Step 6 — Policies with versions, acknowledgments and a comment.
// ────────────────────────────────────────────────────────────────────
async function seedPolicies(ctx: SeedContext) {
  const ciso = ctx.users.find((u) => u.role === "admin")!;
  const compliance = ctx.users.find((u) => u.role === "compliance_manager")!;

  const POLICIES: Array<{
    title: string;
    description: string;
    category: string;
    status: "published" | "draft" | "pending_approval";
    content: string;
  }> = [
    {
      title: "Information Security Policy",
      description:
        "Top-level policy defining the organisation's security objectives and accountabilities.",
      category: "Security",
      status: "published",
      content:
        "# Information Security Policy\n\n## Purpose\n\nDefine how Acme Demo Co protects customer and corporate information assets.\n\n## Scope\n\nApplies to all employees, contractors and third parties handling Acme information.\n\n## Principles\n\n1. Confidentiality, integrity and availability are protected at all times.\n2. Risk-based decisions, reviewed quarterly by the Risk Council.\n3. Defence-in-depth across people, process and technology.\n",
    },
    {
      title: "Access Control Policy",
      description: "Standards for granting, reviewing and revoking access to systems and data.",
      category: "Security",
      status: "published",
      content:
        "# Access Control Policy\n\n## Identity\n\nAll access is provisioned through Okta with SSO + MFA. Hardware security keys are issued to engineers with production access.\n\n## Joiner / Mover / Leaver\n\nProvisioning workflows trigger on HRIS events with a 24-hour SLA. Access reviews are performed quarterly.\n",
    },
    {
      title: "Data Retention & Disposal Policy",
      description: "How long Acme retains different categories of data and how it is disposed of.",
      category: "Privacy",
      status: "published",
      content:
        "# Data Retention & Disposal Policy\n\n## Customer data\n\nRetained for the term of the contract plus 30 days for export, then permanently deleted.\n\n## Logs\n\nApplication logs retained for 90 days; security audit logs for 1 year.\n",
    },
    {
      title: "Incident Response Plan",
      description: "How Acme detects, responds to, and recovers from security incidents.",
      category: "Security",
      status: "published",
      content:
        "# Incident Response Plan\n\n## Severity matrix\n\n| Severity | Trigger | Response time |\n|---|---|---|\n| Critical | Confirmed customer-impacting breach | 15 min |\n| High | Unconfirmed breach signals | 1 hour |\n| Medium | Internal-only impact | Same business day |\n\n## Roles\n\nIncident Commander, Comms Lead, Scribe, Tech Lead.\n",
    },
    {
      title: "Acceptable Use Policy",
      description: "Rules for the use of Acme-issued devices, accounts and networks.",
      category: "HR",
      status: "published",
      content:
        "# Acceptable Use Policy\n\n## Devices\n\nOnly MDM-enrolled devices may access production systems. Personal devices may access email and Slack only.\n\n## Software\n\nThird-party SaaS tools must be approved via the procurement workflow before use with company data.\n",
    },
    {
      title: "AI Acceptable Use Policy",
      description:
        "Guardrails for staff use of AI tools with company and customer data. Still being drafted.",
      category: "Security",
      status: "draft",
      content:
        "# AI Acceptable Use Policy (DRAFT)\n\n## Scope\n\nApplies to all generative-AI tools used with company or customer data.\n\n## Draft rules\n\n1. Customer data may only be sent to approved AI sub-processors with zero-data-retention enabled.\n2. AI-generated output must be reviewed by a human before customer-facing use.\n3. TODO: approved tool list, procurement checklist, logging requirements.\n",
    },
    {
      title: "Vendor Management Policy",
      description:
        "Risk-tiered vendor onboarding, assessment cadence and offboarding requirements.",
      category: "Compliance",
      status: "pending_approval",
      content:
        "# Vendor Management Policy\n\n## Tiering\n\nVendors are tiered critical / high / medium / low based on data access and operational dependency.\n\n## Cadence\n\nCritical and high vendors are re-assessed monthly-to-quarterly; medium and low annually.\n\n## Offboarding\n\nAccess revoked and data return/destruction confirmed within 30 days of contract end.\n",
    },
  ];

  let created = 0;
  for (let i = 0; i < POLICIES.length; i++) {
    const p = POLICIES[i];
    let policy = await prisma.policy.findFirst({
      where: { tenantId: ctx.orgId, title: p.title },
    });
    if (policy) continue;

    const isPublished = p.status === "published";
    policy = await prisma.policy.create({
      data: {
        tenantId: ctx.orgId,
        title: p.title,
        description: p.description,
        category: p.category,
        ownerId: ciso.id,
        status: p.status,
        renewalDate: isPublished ? daysFromNow(180) : null,
        publicSummary: isPublished ? p.description : null,
      },
    });

    const version = await prisma.policyVersion.create({
      data: {
        policyId: policy.id,
        versionNumber: 1,
        content: p.content,
        changeNotes: isPublished ? "Initial published version." : "Working draft.",
        createdById: ciso.id,
        approvedById: isPublished ? ciso.id : null,
        approvedAt: isPublished ? daysAgo(60 + i * 5) : null,
      },
    });

    await prisma.policy.update({
      where: { id: policy.id },
      data: { currentVersionId: version.id },
    });

    // Acknowledgments only make sense for published policies — and we
    // deliberately leave some outstanding so the ack-progress bars show
    // real percentages instead of a wall of 100%.
    if (isPublished) {
      for (let j = 0; j < ctx.users.length; j++) {
        if ((i + j) % 4 === 3) continue; // ~25% still outstanding
        const u = ctx.users[j];
        await prisma.policyAcknowledgment.create({
          data: {
            policyId: policy.id,
            policyVersionId: version.id,
            userId: u.id,
            tenantId: ctx.orgId,
            acknowledgedAt: daysAgo(30 + i + j),
          },
        });
      }
    }

    if (i === 0) {
      await prisma.policyComment.create({
        data: {
          policyId: policy.id,
          policyVersionId: version.id,
          userId: compliance.id,
          tenantId: ctx.orgId,
          content:
            "Reviewed for the Q3 cycle — recommend adding a section on AI usage by end of next quarter.",
        },
      });
    }

    created++;
  }

  console.log(`  ✓ ${created} policies (published/draft mix, versions + partial acks)`);
}

// ────────────────────────────────────────────────────────────────────
// Step 6b — Framework focus. The base seed adopts every framework at
// `not_started`; here we mark ISO 27001, SOC 2 and HIPAA as the active
// programs and walk ~70% of their controls into a realistic spread
// (~40% implemented / ~30% partial / ~30% untouched). Deterministic:
// re-runs land on the same controls with the same statuses.
// ────────────────────────────────────────────────────────────────────
const FOCUS_FRAMEWORKS: Array<{
  type: "iso27001" | "soc2" | "hipaa";
  targetInDays: number;
}> = [
  { type: "iso27001", targetInDays: 60 },
  { type: "soc2", targetInDays: 120 },
  { type: "hipaa", targetInDays: 180 },
];

async function seedFrameworkProgress(ctx: SeedContext) {
  const owners = ctx.users.filter((u) => u.role === "admin" || u.role === "compliance_manager");

  for (const focus of FOCUS_FRAMEWORKS) {
    const framework = await prisma.framework.findFirst({
      where: { frameworkType: focus.type },
    });
    if (!framework) {
      console.log(`  ⏭ Framework "${focus.type}" not found — run base db:seed first`);
      continue;
    }

    const instance = await prisma.frameworkInstance.findUnique({
      where: { tenantId_frameworkId: { tenantId: ctx.orgId, frameworkId: framework.id } },
    });
    if (!instance) {
      console.log(`  ⏭ "${focus.type}" not adopted for this org — run base db:seed first`);
      continue;
    }

    await prisma.frameworkInstance.update({
      where: { id: instance.id },
      data: { status: "in_progress", targetDate: daysFromNow(focus.targetInDays) },
    });

    const assignments = await prisma.controlRequirementAssignment.findMany({
      where: { tenantId: ctx.orgId, frameworkInstanceId: instance.id },
      select: { controlId: true },
      orderBy: { controlId: "asc" },
    });

    let met = 0;
    let partial = 0;
    for (let i = 0; i < assignments.length; i++) {
      const slot = i % 10;
      if (slot >= 7) continue; // ~30% stay not_implemented
      const status = slot < 4 ? "implemented" : "partially_implemented";
      if (status === "implemented") met++;
      else partial++;
      await prisma.control.update({
        where: { id: assignments[i].controlId },
        data: {
          status,
          ownerId: pick(owners, i).id,
          lastReviewedAt: status === "implemented" ? daysAgo(10 + (i % 30)) : null,
          reviewDate: daysFromNow(120 + (i % 60)),
        },
      });
    }

    console.log(
      `  ✓ ${framework.name}: ${met} implemented / ${partial} in progress ` +
        `of ${assignments.length} controls`,
    );
  }
}

// ────────────────────────────────────────────────────────────────────
// Step 7 — Pick a small slice of existing controls and dress them up.
// ────────────────────────────────────────────────────────────────────
async function seedControlOwnersAndEvidence(ctx: SeedContext) {
  const ciso = ctx.users.find((u) => u.role === "admin")!;
  const compliance = ctx.users.find((u) => u.role === "compliance_manager")!;
  const eng = ctx.users.find((u) => u.email.startsWith("priya."))!;

  // Always target the SAME 30 controls so re-runs are idempotent
  // (don't filter by ownerId — we'd just pick a fresh batch each run).
  const controls = await prisma.control.findMany({
    where: { tenantId: ctx.orgId },
    take: 30,
    orderBy: { id: "asc" },
  });

  if (controls.length === 0) {
    console.log("  ⏭ No controls found — run base `db:seed` first to adopt frameworks");
    return;
  }

  const owners = [ciso, compliance, eng];
  for (let i = 0; i < controls.length; i++) {
    const c = controls[i];
    if (c.ownerId) continue;

    const status =
      i % 4 === 0
        ? "implemented"
        : i % 4 === 1
          ? "partially_implemented"
          : i % 4 === 2
            ? "implemented"
            : "not_implemented";

    await prisma.control.update({
      where: { id: c.id },
      data: {
        ownerId: pick(owners, i).id,
        status,
        lastReviewedAt: daysAgo(15 + (i % 10)),
        reviewDate: daysFromNow(180),
      },
    });
  }

  let evidenceCount = 0;
  for (let i = 0; i < Math.min(15, controls.length); i++) {
    const c = controls[i];
    const existing = await prisma.evidence.findFirst({
      where: { tenantId: ctx.orgId, controlId: c.id, title: `Evidence — ${c.title}` },
    });
    if (existing) continue;

    const status: "approved" | "pending_review" | "expired" =
      i % 3 === 0 ? "approved" : i % 3 === 1 ? "pending_review" : "expired";
    const expired = status === "expired";

    await prisma.evidence.create({
      data: {
        tenantId: ctx.orgId,
        controlId: c.id,
        title: `Evidence — ${c.title}`,
        description: "Quarterly evidence collection — exported from internal audit system.",
        type: "document",
        status,
        fileName: `${c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
        fileSize: 245_000 + i * 1024,
        mimeType: "application/pdf",
        validFrom: daysAgo(120 + i),
        expiresAt: expired ? daysAgo(5) : daysFromNow(180),
        renewalFrequency: "quarterly",
        nextRenewalDate: expired ? daysAgo(5) : daysFromNow(90),
        submittedById: pick(owners, i).id,
        reviewedById: status === "approved" ? compliance.id : null,
        reviewedAt: status === "approved" ? daysAgo(10) : null,
        tags: ["quarterly", "audit"],
      },
    });
    evidenceCount++;
  }

  console.log(`  ✓ ${controls.length} controls dressed up + ${evidenceCount} evidence rows`);
}

// ────────────────────────────────────────────────────────────────────
// Step 8 — Incidents.
// ────────────────────────────────────────────────────────────────────
async function seedIncidents(ctx: SeedContext) {
  const ciso = ctx.users.find((u) => u.role === "admin")!;
  const eng = ctx.users.find((u) => u.email.startsWith("priya."))!;
  const compliance = ctx.users.find((u) => u.role === "compliance_manager")!;

  const INCIDENTS: Array<{
    title: string;
    description: string;
    severity: "critical" | "high" | "medium" | "low" | "informational";
    status: "reported" | "investigating" | "contained" | "resolved" | "closed";
    detectedDaysAgo: number;
    resolvedDaysAgo?: number;
    rootCause?: string;
    regulatoryNotificationRequired?: boolean;
    timeline: { action: string; description: string; offsetHours: number }[];
  }> = [
    {
      title: "Suspicious S3 access from unusual IP",
      description: "GuardDuty flagged unusual API calls against the customer-evidence bucket.",
      severity: "high",
      status: "investigating",
      detectedDaysAgo: 2,
      timeline: [
        {
          action: "Alert received",
          description: "GuardDuty finding ingested into incident queue.",
          offsetHours: 0,
        },
        { action: "Triage started", description: "On-call SecOps engaged.", offsetHours: 1 },
        {
          action: "Containment",
          description: "Rotated keys for the affected role.",
          offsetHours: 3,
        },
      ],
    },
    {
      title: "Datadog ingest outage causing log gaps",
      description: "Forwarder fleet stopped publishing for ~25 minutes during a region rollover.",
      severity: "medium",
      status: "resolved",
      detectedDaysAgo: 10,
      resolvedDaysAgo: 10,
      rootCause: "Datadog regional rollover caused a 25-minute disconnection on the agent side.",
      timeline: [
        { action: "Alert received", description: "Heartbeat alert fired.", offsetHours: 0 },
        {
          action: "Vendor contacted",
          description: "Datadog confirmed regional rollover.",
          offsetHours: 1,
        },
        { action: "Restored", description: "Agents reconnected automatically.", offsetHours: 2 },
      ],
    },
    {
      title: "Confirmed phishing email targeted finance team",
      description: "Three finance users received a spoofed invoice email impersonating our CFO.",
      severity: "high",
      status: "contained",
      detectedDaysAgo: 5,
      regulatoryNotificationRequired: false,
      rootCause: "BEC-style impersonation, no payload delivered.",
      timeline: [
        {
          action: "Reported",
          description: "User reported the email through the in-mail report button.",
          offsetHours: 0,
        },
        {
          action: "Removed",
          description: "Email pulled from all mailboxes via security gateway.",
          offsetHours: 2,
        },
        {
          action: "Awareness",
          description: "Org-wide reminder issued; finance team briefed.",
          offsetHours: 8,
        },
      ],
    },
    {
      title: "Production outage — cascading failure in API tier",
      description: "12-minute degradation triggered by a malformed customer integration payload.",
      severity: "high",
      status: "closed",
      detectedDaysAgo: 18,
      resolvedDaysAgo: 17,
      rootCause:
        "A misconfigured customer webhook submitted an oversized payload that exhausted worker memory.",
      timeline: [
        { action: "Alert received", description: "Latency alarms fired.", offsetHours: 0 },
        {
          action: "Mitigated",
          description: "Rate limit applied to offending tenant.",
          offsetHours: 0.2,
        },
        { action: "Resolved", description: "Service restored to normal.", offsetHours: 0.5 },
        {
          action: "Postmortem published",
          description: "Action items: input payload limits + circuit breaker.",
          offsetHours: 24,
        },
      ],
    },
  ];

  let created = 0;
  for (const inc of INCIDENTS) {
    const existing = await prisma.incident.findFirst({
      where: { tenantId: ctx.orgId, title: inc.title },
    });
    if (existing) continue;

    const detected = daysAgo(inc.detectedDaysAgo);
    const incident = await prisma.incident.create({
      data: {
        tenantId: ctx.orgId,
        title: inc.title,
        description: inc.description,
        severity: inc.severity,
        status: inc.status,
        reportedById: pick([ciso.id, eng.id], created),
        assignedToId: pick([ciso.id, eng.id, compliance.id], created),
        detectedAt: detected,
        resolvedAt: inc.resolvedDaysAgo !== undefined ? daysAgo(inc.resolvedDaysAgo) : null,
        rootCause: inc.rootCause,
        regulatoryNotificationRequired: inc.regulatoryNotificationRequired ?? false,
      },
    });

    for (const t of inc.timeline) {
      await prisma.incidentTimeline.create({
        data: {
          incidentId: incident.id,
          tenantId: ctx.orgId,
          action: t.action,
          description: t.description,
          performedById: pick([ciso.id, eng.id], 0),
          createdAt: new Date(detected.getTime() + t.offsetHours * HOUR_MS),
        },
      });
    }
    created++;
  }

  console.log(`  ✓ ${created} incidents with timelines`);
}

// ────────────────────────────────────────────────────────────────────
// Step 9 — Vulnerabilities.
// ────────────────────────────────────────────────────────────────────
async function seedVulnerabilities(ctx: SeedContext) {
  const eng = ctx.users.find((u) => u.email.startsWith("priya."))!;
  const ciso = ctx.users.find((u) => u.role === "admin")!;

  const VULNS: Array<{
    title: string;
    description: string;
    severity: "critical" | "high" | "medium" | "low" | "informational";
    status: "open" | "in_progress" | "remediated" | "accepted";
    source: "scan" | "pentest" | "bug_bounty" | "vendor_advisory";
    cvss?: number;
    cve?: string;
    cwe?: string;
    component: string;
    productionImpact: boolean;
    detectedDaysAgo: number;
    remediatedDaysAgo?: number;
  }> = [
    {
      title: "OpenSSL CVE-2025-1234 in API base image",
      description: "Outdated OpenSSL in API container base image.",
      severity: "high",
      status: "in_progress",
      source: "scan",
      cvss: 7.5,
      cve: "CVE-2025-1234",
      cwe: "CWE-787",
      component: "api-base-image",
      productionImpact: true,
      detectedDaysAgo: 6,
    },
    {
      title: "S3 bucket public access setting drift",
      description:
        "Audit detected one bucket with default public access disabled later than policy threshold.",
      severity: "medium",
      status: "remediated",
      source: "scan",
      cvss: 5.4,
      component: "s3-evidence",
      productionImpact: false,
      detectedDaysAgo: 21,
      remediatedDaysAgo: 17,
    },
    {
      title: "Stored XSS in admin notes field",
      description: "Pentest finding — admin notes editor lacked HTML sanitisation.",
      severity: "high",
      status: "remediated",
      source: "pentest",
      cvss: 7.1,
      cwe: "CWE-79",
      component: "web-admin",
      productionImpact: true,
      detectedDaysAgo: 60,
      remediatedDaysAgo: 45,
    },
    {
      title: "JWT expiry too long for service-to-service tokens",
      description: "Internal review found 30-day JWT lifetime for service tokens.",
      severity: "medium",
      status: "in_progress",
      source: "scan",
      cvss: 5.1,
      component: "auth",
      productionImpact: true,
      detectedDaysAgo: 12,
    },
    {
      title: "Outdated Node.js LTS in collector image",
      description: "Container image pinned to a Node.js LTS line going EOL in 60 days.",
      severity: "low",
      status: "open",
      source: "scan",
      cvss: 3.7,
      component: "collector-image",
      productionImpact: false,
      detectedDaysAgo: 4,
    },
    {
      title: "GitHub Action with overly broad permissions",
      description: "release.yml grants `write-all` instead of scoped permissions.",
      severity: "medium",
      status: "open",
      source: "scan",
      cvss: 5.6,
      component: "ci-pipeline",
      productionImpact: false,
      detectedDaysAgo: 8,
    },
    {
      title: "SSRF in image preview generator",
      description:
        "Bug bounty submission — preview service fetched user-controlled URLs without allowlist.",
      severity: "critical",
      status: "remediated",
      source: "bug_bounty",
      cvss: 9.1,
      cwe: "CWE-918",
      component: "web-preview",
      productionImpact: true,
      detectedDaysAgo: 90,
      remediatedDaysAgo: 80,
    },
    {
      title: "Exposed pprof endpoint on internal service",
      description: "Internal service exposed /debug/pprof to the VPC.",
      severity: "low",
      status: "accepted",
      source: "scan",
      cvss: 3.1,
      component: "background-worker",
      productionImpact: false,
      detectedDaysAgo: 30,
    },
  ];

  let created = 0;
  for (const v of VULNS) {
    const existing = await prisma.vulnerability.findFirst({
      where: { tenantId: ctx.orgId, title: v.title },
    });
    if (existing) continue;
    await prisma.vulnerability.create({
      data: {
        tenantId: ctx.orgId,
        title: v.title,
        description: v.description,
        severity: v.severity,
        status: v.status,
        source: v.source,
        cvssScore: v.cvss,
        cveId: v.cve,
        cweId: v.cwe,
        affectedComponent: v.component,
        productionImpact: v.productionImpact,
        reportedById: ciso.id,
        assignedToId: eng.id,
        detectedAt: daysAgo(v.detectedDaysAgo),
        remediatedAt: v.remediatedDaysAgo !== undefined ? daysAgo(v.remediatedDaysAgo) : null,
      },
    });
    created++;
  }

  console.log(`  ✓ ${created} vulnerabilities`);
}

// ────────────────────────────────────────────────────────────────────
// Step 10 — Audits + findings.
// ────────────────────────────────────────────────────────────────────
async function seedAudits(ctx: SeedContext) {
  const compliance = ctx.users.find((u) => u.role === "compliance_manager")!;
  const auditor = ctx.users.find((u) => u.role === "auditor")!;

  const AUDITS: Array<{
    title: string;
    description: string;
    type: "internal" | "external" | "certification";
    status: "in_progress" | "completed" | "planned";
    frameworkType?: "iso27001" | "soc2" | "hipaa";
    scheduledStartDaysAgo: number;
    scheduledEndDaysFromNow: number;
    actualStartDaysAgo?: number;
    actualEndDaysAgo?: number;
    auditor?: string;
    auditorOrg?: string;
    findings: {
      title: string;
      severity: "critical" | "major" | "minor" | "observation" | "opportunity";
      status: "open" | "in_progress" | "remediated" | "verified" | "closed";
      dueDaysFromNow: number;
    }[];
  }> = [
    {
      title: "ISO 27001 Stage 2 Certification Audit",
      description: "External certification audit covering ISMS scope across cloud platform & corp.",
      type: "certification",
      status: "in_progress",
      frameworkType: "iso27001",
      scheduledStartDaysAgo: 14,
      scheduledEndDaysFromNow: 21,
      actualStartDaysAgo: 14,
      auditor: "Jordan Kim",
      auditorOrg: "Independent Certification Co.",
      findings: [
        {
          title: "Access review evidence for Q2 not retained for full 12 months",
          severity: "minor",
          status: "in_progress",
          dueDaysFromNow: 30,
        },
        {
          title: "Risk register lacks documented residual review cadence",
          severity: "observation",
          status: "open",
          dueDaysFromNow: 45,
        },
        {
          title: "Strong artefact set for cryptography controls",
          severity: "opportunity",
          status: "closed",
          dueDaysFromNow: 0,
        },
      ],
    },
    {
      title: "SOC 2 Type II Readiness Assessment",
      description: "Internal walkthrough ahead of formal SOC 2 fieldwork next quarter.",
      type: "internal",
      status: "completed",
      frameworkType: "soc2",
      scheduledStartDaysAgo: 90,
      scheduledEndDaysFromNow: -60,
      actualStartDaysAgo: 90,
      actualEndDaysAgo: 60,
      findings: [
        {
          title: "Change management — emergency change procedure missing approval log",
          severity: "major",
          status: "remediated",
          dueDaysFromNow: -10,
        },
        {
          title: "Backup restoration test cadence inconsistent",
          severity: "minor",
          status: "verified",
          dueDaysFromNow: -5,
        },
      ],
    },
    {
      title: "HIPAA Security Rule Internal Audit",
      description:
        "Scheduled internal audit of administrative, physical and technical safeguards ahead of the HIPAA program go-live. Two scoping findings carried in from the gap review.",
      type: "internal",
      status: "planned",
      frameworkType: "hipaa",
      scheduledStartDaysAgo: -14, // starts in two weeks
      scheduledEndDaysFromNow: 21,
      findings: [
        {
          title: "ePHI data-flow inventory incomplete for support tooling",
          severity: "major",
          status: "open",
          dueDaysFromNow: 30,
        },
        {
          title: "Business Associate Agreement missing for one downstream vendor",
          severity: "minor",
          status: "in_progress",
          dueDaysFromNow: 21,
        },
      ],
    },
  ];

  for (const a of AUDITS) {
    // Link the audit to the matching adopted framework instance when
    // one exists (base seed adopts every framework for the demo org).
    let frameworkInstanceId: string | null = null;
    if (a.frameworkType) {
      const fw = await prisma.framework.findFirst({
        where: { frameworkType: a.frameworkType },
      });
      if (fw) {
        const instance = await prisma.frameworkInstance.findUnique({
          where: { tenantId_frameworkId: { tenantId: ctx.orgId, frameworkId: fw.id } },
        });
        frameworkInstanceId = instance?.id ?? null;
      }
    }

    let audit = await prisma.audit.findFirst({
      where: { tenantId: ctx.orgId, title: a.title },
    });
    if (!audit) {
      audit = await prisma.audit.create({
        data: {
          tenantId: ctx.orgId,
          title: a.title,
          description: a.description,
          type: a.type,
          status: a.status,
          frameworkInstanceId,
          scheduledStartDate: daysAgo(a.scheduledStartDaysAgo),
          scheduledEndDate: daysFromNow(a.scheduledEndDaysFromNow),
          actualStartDate:
            a.actualStartDaysAgo !== undefined ? daysAgo(a.actualStartDaysAgo) : null,
          actualEndDate: a.actualEndDaysAgo !== undefined ? daysAgo(a.actualEndDaysAgo) : null,
          auditorName: a.auditor,
          auditorOrganization: a.auditorOrg,
        },
      });
    }

    for (const f of a.findings) {
      const existing = await prisma.auditFinding.findFirst({
        where: { auditId: audit.id, title: f.title },
      });
      if (existing) continue;
      await prisma.auditFinding.create({
        data: {
          auditId: audit.id,
          tenantId: ctx.orgId,
          title: f.title,
          severity: f.severity,
          status: f.status,
          assignedToId: compliance.id,
          dueDate:
            f.dueDaysFromNow >= 0 ? daysFromNow(f.dueDaysFromNow) : daysAgo(-f.dueDaysFromNow),
          resolvedAt:
            f.status === "closed" || f.status === "verified" || f.status === "remediated"
              ? daysAgo(15)
              : null,
        },
      });
    }
  }

  console.log(
    `  ✓ ${AUDITS.length} audits with findings (assigned to ${auditor.name.split(" ")[0]})`,
  );
}

// ────────────────────────────────────────────────────────────────────
// Step 11 — Business Continuity (BCP, BIA, exercises).
// ────────────────────────────────────────────────────────────────────
async function seedBcp(ctx: SeedContext) {
  const ciso = ctx.users.find((u) => u.role === "admin")!;
  const eng = ctx.users.find((u) => u.email.startsWith("priya."))!;

  let bcp = await prisma.businessContinuityPlan.findFirst({
    where: { tenantId: ctx.orgId, title: "Acme Demo Co — Enterprise BCP" },
  });
  if (!bcp) {
    bcp = await prisma.businessContinuityPlan.create({
      data: {
        tenantId: ctx.orgId,
        title: "Acme Demo Co — Enterprise BCP",
        description:
          "Top-level BCP covering platform availability, customer support, and corporate functions.",
        version: "2.1",
        status: "active",
        ownerId: ciso.id,
        approvedAt: daysAgo(120),
        lastReviewedAt: daysAgo(60),
        nextReviewDate: daysFromNow(120),
      },
    });
  }

  const BIAS: Array<{
    process: string;
    criticality:
      | "mission_critical"
      | "business_critical"
      | "business_operational"
      | "administrative";
    rto: number;
    rpo: number;
    mtd: number;
    mtpd?: number;
    operationalImpact: string;
  }> = [
    {
      process: "Customer-facing API",
      criticality: "mission_critical",
      rto: 1,
      rpo: 1,
      mtd: 4,
      mtpd: 4,
      operationalImpact: "100% of customer integrations stop working.",
    },
    {
      process: "Web application",
      criticality: "mission_critical",
      rto: 2,
      rpo: 1,
      mtd: 4,
      mtpd: 6,
      operationalImpact: "Customers cannot access dashboards.",
    },
    {
      process: "Authentication (Okta SSO)",
      criticality: "business_critical",
      rto: 1,
      rpo: 1,
      mtd: 2,
      mtpd: 4,
      operationalImpact: "Internal staff cannot access production systems.",
    },
    {
      process: "Customer support (Zendesk)",
      criticality: "business_critical",
      rto: 4,
      rpo: 4,
      mtd: 24,
      mtpd: 24,
      operationalImpact: "Inbound tickets queue but cannot be answered.",
    },
  ];
  for (const b of BIAS) {
    const exists = await prisma.businessImpactAnalysis.findFirst({
      where: { bcpId: bcp.id, processName: b.process },
    });
    if (exists) continue;
    await prisma.businessImpactAnalysis.create({
      data: {
        tenantId: ctx.orgId,
        bcpId: bcp.id,
        processName: b.process,
        criticalityLevel: b.criticality,
        rtoHours: b.rto,
        rpoHours: b.rpo,
        maxTolerableDowntimeHours: b.mtd,
        mtpdHours: b.mtpd,
        operationalImpact: b.operationalImpact,
        status: "approved",
        ownerId: eng.id,
        approvedAt: daysAgo(60),
        lastReviewedAt: daysAgo(30),
        nextReviewDate: daysFromNow(150),
      },
    });
  }

  const EXERCISES: Array<{
    title: string;
    type: "tabletop" | "walkthrough" | "simulation" | "full_scale";
    daysAgo: number;
    outcome: "met" | "partially_met" | "exceeded";
    findings: string;
  }> = [
    {
      title: "Region failover tabletop",
      type: "tabletop",
      daysAgo: 45,
      outcome: "partially_met",
      findings: "Runbook covered the scenario but DNS failover steps need automation.",
    },
    {
      title: "Ransomware response simulation",
      type: "simulation",
      daysAgo: 90,
      outcome: "met",
      findings:
        "Containment + comms timelines met. Recovery time exceeded RTO by 1 hour for finance systems.",
    },
    {
      title: "Provider outage walkthrough — Datadog",
      type: "walkthrough",
      daysAgo: 15,
      outcome: "exceeded",
      findings: "Team identified two additional manual fallbacks not previously documented.",
    },
  ];
  for (const e of EXERCISES) {
    const exists = await prisma.bCPExercise.findFirst({
      where: { bcpId: bcp.id, title: e.title },
    });
    if (exists) continue;
    await prisma.bCPExercise.create({
      data: {
        tenantId: ctx.orgId,
        bcpId: bcp.id,
        title: e.title,
        type: e.type,
        scheduledDate: daysAgo(e.daysAgo + 5),
        conductedDate: daysAgo(e.daysAgo),
        status: "reviewed",
        scenario: e.findings,
        objectives: "Validate recovery procedure, RTO/RPO and team readiness.",
        scope: "Production platform, customer support, on-call runbook.",
        facilitatorId: ciso.id,
        outcomeRating: e.outcome,
        actualRtoHours: 2,
        actualRpoHours: 1,
        findings: e.findings,
        lessonsLearned: "Document follow-ups and integrate into the next quarterly review.",
        nextExerciseDate: daysFromNow(90),
        reviewedAt: daysAgo(e.daysAgo - 1),
      },
    });
  }

  console.log(`  ✓ 1 BCP / ${BIAS.length} BIAs / ${EXERCISES.length} exercises`);
}

// ────────────────────────────────────────────────────────────────────
// Step 12 — AI Governance.
// ────────────────────────────────────────────────────────────────────
async function seedAiGovernance(ctx: SeedContext) {
  const ciso = ctx.users.find((u) => u.role === "admin")!;
  const compliance = ctx.users.find((u) => u.role === "compliance_manager")!;

  const SYSTEMS: Array<{
    name: string;
    description: string;
    type: "machine_learning" | "deep_learning" | "nlp" | "computer_vision" | "generative_ai";
    lifecycle: "development" | "deployment" | "monitoring" | "design";
    riskLevel: "minimal" | "limited" | "high";
    purpose: string;
    dataTypes: string[];
  }> = [
    {
      name: "Compliance Co-pilot (Chat assistant)",
      description:
        "RAG-based assistant that answers compliance questions grounded in the customer's own policies and controls.",
      type: "generative_ai",
      lifecycle: "monitoring",
      riskLevel: "limited",
      purpose: "Reduce time spent answering procurement & audit questions.",
      dataTypes: ["customer_documents", "policies", "controls"],
    },
    {
      name: "Vendor Risk Scoring",
      description: "Aggregates open-source signals into a risk score per vendor.",
      type: "machine_learning",
      lifecycle: "deployment",
      riskLevel: "limited",
      purpose: "Prioritise vendor-review effort.",
      dataTypes: ["vendor_metadata", "open_signals"],
    },
    {
      name: "Questionnaire Auto-answerer",
      description:
        "Generates first-draft answers for inbound security questionnaires using grounded retrieval.",
      type: "generative_ai",
      lifecycle: "deployment",
      riskLevel: "high",
      purpose: "Eliminate 80% of the manual effort drafting questionnaire responses.",
      dataTypes: ["questionnaire_text", "policies", "controls"],
    },
  ];

  for (let i = 0; i < SYSTEMS.length; i++) {
    const s = SYSTEMS[i];
    let system = await prisma.aISystem.findFirst({
      where: { tenantId: ctx.orgId, name: s.name },
    });
    if (!system) {
      system = await prisma.aISystem.create({
        data: {
          tenantId: ctx.orgId,
          name: s.name,
          description: s.description,
          purpose: s.purpose,
          type: s.type,
          lifecycleStage: s.lifecycle,
          riskLevel: s.riskLevel,
          dataTypes: s.dataTypes,
          ownerId: ciso.id,
        },
      });
    }

    const hasRisk = await prisma.aIRiskAssessment.findFirst({ where: { aiSystemId: system.id } });
    if (!hasRisk) {
      await prisma.aIRiskAssessment.create({
        data: {
          aiSystemId: system.id,
          tenantId: ctx.orgId,
          assessedById: compliance.id,
          title: "Initial AI risk assessment",
          methodology: "NIST AI RMF + EU AI Act Article 9",
          biasRisk: "medium",
          privacyRisk: s.riskLevel === "high" ? "high" : "medium",
          safetyRisk: "low",
          securityRisk: "medium",
          misuseRisk: s.riskLevel === "high" ? "high" : "medium",
          overallRisk: s.riskLevel === "high" ? "high" : "medium",
          mitigationPlan:
            "Human-in-the-loop review of all high-impact outputs; quarterly fairness review.",
          residualRisk: "low",
          status: "approved",
          approvedById: ciso.id,
          approvedAt: daysAgo(20),
          nextReviewDate: daysFromNow(90),
        },
      });
    }

    const hasImpact = await prisma.aIImpactAssessment.findFirst({
      where: { aiSystemId: system.id },
    });
    if (!hasImpact) {
      await prisma.aIImpactAssessment.create({
        data: {
          aiSystemId: system.id,
          tenantId: ctx.orgId,
          assessedById: compliance.id,
          societalImpact:
            "Affects compliance teams in Acme's customer base — augments rather than replaces.",
          ethicalConsiderations:
            "Output flagged as AI-generated; human review required before customer-facing use.",
          environmentalImpact: "Negligible at current usage volume.",
          humanOversightMeasures:
            "Reviewer approval gate before any output reaches customers or regulators.",
          transparencyMeasures:
            "Model name + confidence score surfaced in UI for every generated answer.",
          status: "approved",
          approvedById: ciso.id,
          approvedAt: daysAgo(15),
        },
      });
    }
  }

  const firstSystem = await prisma.aISystem.findFirst({
    where: { tenantId: ctx.orgId, name: "Questionnaire Auto-answerer" },
  });
  if (firstSystem) {
    const hasIncident = await prisma.aIIncident.findFirst({
      where: { tenantId: ctx.orgId, aiSystemId: firstSystem.id },
    });
    if (!hasIncident) {
      await prisma.aIIncident.create({
        data: {
          tenantId: ctx.orgId,
          aiSystemId: firstSystem.id,
          title: "Hallucinated control reference in customer questionnaire draft",
          description:
            "Auto-answerer cited control ID `AC-99.7` which does not exist in any framework.",
          category: "hallucination",
          severity: "medium",
          status: "resolved",
          rootCause:
            "Prompt did not constrain the model to controls present in the customer's framework instance.",
          remediation:
            "Added grounding step that filters citations to existing control IDs; added regression test.",
          reportedById: compliance.id,
          assigneeId: ciso.id,
          detectedAt: daysAgo(20),
          reportedAt: daysAgo(20),
          resolvedAt: daysAgo(13),
        },
      });
    }
  }

  console.log(`  ✓ ${SYSTEMS.length} AI systems with risk + impact assessments`);
}

// ────────────────────────────────────────────────────────────────────
// Step 13 — Privacy / GDPR.
// ────────────────────────────────────────────────────────────────────
async function seedPrivacy(ctx: SeedContext) {
  const dpo = ctx.users.find((u) => u.role === "dpo")!;
  const compliance = ctx.users.find((u) => u.role === "compliance_manager")!;

  const ACTIVITIES: Array<{
    name: string;
    purpose: string;
    role: "controller" | "processor";
    lawfulBasis: "contract" | "legitimate_interests" | "legal_obligation" | "consent";
    dataCategories: (
      | "identity"
      | "contact"
      | "financial"
      | "online_identifier"
      | "employment"
      | "usage"
    )[];
    subjectCategories: ("customer" | "employee" | "prospect" | "website_visitor")[];
    dataElements: string[];
    recipients: string[];
    crossBorder: boolean;
    mechanism?: "scc" | "adequacy_decision";
    destinations: string[];
    retention: string;
  }> = [
    {
      name: "Customer account management",
      purpose: "Provision and operate customer SaaS accounts (login, billing, support).",
      role: "controller",
      lawfulBasis: "contract",
      dataCategories: ["identity", "contact", "online_identifier", "usage"],
      subjectCategories: ["customer"],
      dataElements: ["full name", "email", "company", "IP address", "session metadata"],
      recipients: ["AWS (hosting)", "Stripe (billing)", "Datadog (logs)"],
      crossBorder: false,
      destinations: [],
      retention: "Term of contract + 30 days for export; permanent deletion thereafter.",
    },
    {
      name: "Customer support — ticketing & operational outreach",
      purpose: "Respond to inbound support requests and notify customers of operational changes.",
      role: "controller",
      lawfulBasis: "contract",
      dataCategories: ["identity", "contact", "usage"],
      subjectCategories: ["customer"],
      dataElements: ["full name", "email", "ticket history"],
      recipients: ["Zendesk (US)"],
      crossBorder: true,
      mechanism: "scc",
      destinations: ["US"],
      retention: "5 years from ticket close.",
    },
    {
      name: "Marketing — newsletter & product updates",
      purpose: "Send opt-in marketing communications and product updates.",
      role: "controller",
      lawfulBasis: "consent",
      dataCategories: ["identity", "contact", "online_identifier"],
      subjectCategories: ["prospect", "customer"],
      dataElements: ["email", "first name", "preferences"],
      recipients: ["HubSpot (US)"],
      crossBorder: true,
      mechanism: "scc",
      destinations: ["US"],
      retention: "Until opt-out + 12 months suppression list.",
    },
    {
      name: "HR — employee records",
      purpose: "Manage employment relationships, payroll and statutory obligations.",
      role: "controller",
      lawfulBasis: "legal_obligation",
      dataCategories: ["identity", "contact", "financial", "employment"],
      subjectCategories: ["employee"],
      dataElements: ["full name", "tax file number", "bank account", "employment contract"],
      recipients: ["Payroll provider", "Tax authority (ATO)"],
      crossBorder: false,
      destinations: [],
      retention: "7 years post-employment per AU statutory requirement.",
    },
    {
      name: "Website analytics",
      purpose: "Aggregate analytics on marketing site usage to optimise content.",
      role: "controller",
      lawfulBasis: "legitimate_interests",
      dataCategories: ["online_identifier", "usage"],
      subjectCategories: ["website_visitor"],
      dataElements: ["IP address", "page paths", "user-agent"],
      recipients: ["Plausible (EU)"],
      crossBorder: true,
      mechanism: "adequacy_decision",
      destinations: ["EU"],
      retention: "26 months aggregate; raw IP truncated at ingest.",
    },
  ];

  for (const a of ACTIVITIES) {
    const exists = await prisma.processingActivity.findFirst({
      where: { tenantId: ctx.orgId, name: a.name },
    });
    if (exists) continue;
    await prisma.processingActivity.create({
      data: {
        tenantId: ctx.orgId,
        name: a.name,
        purpose: a.purpose,
        role: a.role,
        lawfulBasis: a.lawfulBasis,
        lawfulBasisJustification:
          a.lawfulBasis === "legitimate_interests"
            ? "Balanced against subject expectations; LIA documented."
            : null,
        dataCategories: a.dataCategories,
        subjectCategories: a.subjectCategories,
        dataElements: a.dataElements,
        recipients: a.recipients,
        crossBorderTransfer: a.crossBorder,
        transferMechanism: a.mechanism ?? null,
        transferDestinations: a.destinations,
        retentionPeriod: a.retention,
        securityMeasures:
          "Encryption at rest (AES-256) and in transit (TLS 1.2+); least-privilege access; quarterly access reviews.",
        ownerId: dpo.id,
        status: "active",
        lastReviewedAt: daysAgo(45),
        nextReviewAt: daysFromNow(180),
      },
    });
  }

  const customerAccount = await prisma.processingActivity.findFirst({
    where: { tenantId: ctx.orgId, name: "Customer account management" },
  });
  if (customerAccount) {
    const exists = await prisma.dPIA.findFirst({
      where: { processingActivityId: customerAccount.id },
    });
    if (!exists) {
      await prisma.dPIA.create({
        data: {
          tenantId: ctx.orgId,
          processingActivityId: customerAccount.id,
          assessedById: dpo.id,
          title: "DPIA — Customer account management (re-assessment 2026)",
          necessity: "recommended",
          necessityProportionality:
            "Processing is required to provide the contracted service; data minimisation applied.",
          riskToRights: "Limited — only necessary identifiers and contact details processed.",
          mitigations: "Encryption, access controls, regional residency, deletion on contract end.",
          consultedDpo: true,
          residualRisk: "low",
          status: "approved",
          approvedById: dpo.id,
          approvedAt: daysAgo(10),
        },
      });
    }
  }

  const hrActivity = await prisma.processingActivity.findFirst({
    where: { tenantId: ctx.orgId, name: "HR — employee records" },
  });
  const breachExists = await prisma.dataBreach.findFirst({
    where: { tenantId: ctx.orgId, title: "Misdirected payroll PDF" },
  });
  if (!breachExists) {
    // Discovered ~20 hours ago → the 72-hour GDPR Art. 33 notification
    // clock is RUNNING when the demo tenant is opened (~52h remaining).
    const discoveredAt = hoursAgo(20);
    await prisma.dataBreach.create({
      data: {
        tenantId: ctx.orgId,
        processingActivityId: hrActivity?.id ?? null,
        title: "Misdirected payroll PDF",
        description:
          "A payroll summary PDF for one employee was emailed to an incorrect (but former) employee address.",
        category: "confidentiality",
        severity: "medium",
        status: "investigating",
        occurredAt: hoursAgo(26),
        discoveredAt,
        notificationDeadlineAt: new Date(discoveredAt.getTime() + 72 * HOUR_MS),
        affectedRecordsEstimate: 1,
        affectedSubjectCategories: ["employee"],
        dataCategoriesInvolved: ["identity", "financial", "employment"],
        rootCause: "Auto-complete chose stale email address.",
        containment: "Recipient asked to confirm deletion; mailbox audit under way.",
        remediation: "Pending — disable auto-complete for the outbound payroll mailbox.",
        supervisoryAuthorityNotificationRequired: true,
        dataSubjectsNotificationRequired: true,
        dataSubjectsNotifiedAt: null,
        reportedById: compliance.id,
        assigneeId: dpo.id,
      },
    });
  }

  const DSARS: Array<{
    name: string;
    email: string;
    type: "access" | "erasure" | "rectification" | "portability";
    channel: "email" | "web_form";
    status: "in_progress" | "fulfilled" | "received";
    receivedDaysAgo: number;
  }> = [
    {
      name: "Charlie Smith",
      email: "charlie@example.com",
      type: "access",
      channel: "email",
      status: "in_progress",
      receivedDaysAgo: 5,
    },
    {
      name: "Dana Williams",
      email: "dana@example.org",
      type: "erasure",
      channel: "web_form",
      status: "fulfilled",
      receivedDaysAgo: 28,
    },
    {
      name: "Erin Brown",
      email: "erin@example.net",
      type: "rectification",
      channel: "email",
      status: "fulfilled",
      receivedDaysAgo: 40,
    },
    {
      name: "Felix Garcia",
      email: "felix@example.com",
      type: "portability",
      channel: "web_form",
      status: "received",
      receivedDaysAgo: 1,
    },
  ];
  for (const d of DSARS) {
    const exists = await prisma.dSARRequest.findFirst({
      where: { tenantId: ctx.orgId, subjectEmail: d.email, requestType: d.type },
    });
    if (exists) continue;
    const receivedAt = daysAgo(d.receivedDaysAgo);
    const dueAt = new Date(receivedAt);
    dueAt.setMonth(dueAt.getMonth() + 1);
    await prisma.dSARRequest.create({
      data: {
        tenantId: ctx.orgId,
        subjectName: d.name,
        subjectEmail: d.email,
        requestType: d.type,
        channel: d.channel,
        status: d.status,
        receivedAt,
        dueAt,
        identityVerifiedAt: d.status !== "received" ? daysAgo(d.receivedDaysAgo - 1) : null,
        fulfilledAt: d.status === "fulfilled" ? daysAgo(Math.max(1, d.receivedDaysAgo - 10)) : null,
        responseNotes:
          d.status === "fulfilled" ? "Export package delivered via secure download link." : null,
        assigneeId: dpo.id,
      },
    });
  }

  console.log(
    `  ✓ ${ACTIVITIES.length} processing activities, 1 DPIA, 1 breach, ${DSARS.length} DSARs`,
  );
}

// ────────────────────────────────────────────────────────────────────
// Step 14 — Training programs + completions per persona.
// ────────────────────────────────────────────────────────────────────
async function seedTraining(ctx: SeedContext) {
  const PROGRAMS: Array<{
    title: string;
    description: string;
    type: "security_awareness" | "compliance" | "phishing_simulation" | "custom";
    frequency: "annually" | "quarterly" | "monthly";
  }> = [
    {
      title: "Security Awareness 101",
      description: "Annual baseline training for all staff.",
      type: "security_awareness",
      frequency: "annually",
    },
    {
      title: "GDPR & Privacy Refresher",
      description: "Annual privacy training for staff handling personal data.",
      type: "compliance",
      frequency: "annually",
    },
    {
      title: "Phishing Simulation Q3",
      description: "Quarterly simulated phishing exercise.",
      type: "phishing_simulation",
      frequency: "quarterly",
    },
    {
      title: "Secure Coding Foundations",
      description: "Engineering-only training covering OWASP Top 10.",
      type: "custom",
      frequency: "annually",
    },
  ];

  for (let i = 0; i < PROGRAMS.length; i++) {
    const p = PROGRAMS[i];
    let program = await prisma.trainingProgram.findFirst({
      where: { tenantId: ctx.orgId, title: p.title },
    });
    if (!program) {
      program = await prisma.trainingProgram.create({
        data: {
          tenantId: ctx.orgId,
          title: p.title,
          description: p.description,
          type: p.type,
          frequency: p.frequency,
          isRequired: true,
          dueDate: daysFromNow(60),
        },
      });
    }

    for (let j = 0; j < ctx.users.length; j++) {
      const user = ctx.users[j];
      const exists = await prisma.trainingCompletion.findFirst({
        where: { trainingProgramId: program.id, userId: user.id },
      });
      if (exists) continue;
      const status: "completed" | "in_progress" | "assigned" =
        j === 0 ? "completed" : j === 1 ? "completed" : j === 2 ? "in_progress" : "assigned";
      await prisma.trainingCompletion.create({
        data: {
          trainingProgramId: program.id,
          userId: user.id,
          tenantId: ctx.orgId,
          status,
          score: status === "completed" ? 90 + ((i + j) % 10) : null,
          completedAt: status === "completed" ? daysAgo(10 + j) : null,
          assignedAt: daysAgo(45),
        },
      });
    }
  }

  console.log(`  ✓ ${PROGRAMS.length} training programs (with per-persona completions)`);
}

// ────────────────────────────────────────────────────────────────────
// Step 15 — Tasks across multiple source modules.
// ────────────────────────────────────────────────────────────────────
async function seedTasks(ctx: SeedContext) {
  const ciso = ctx.users.find((u) => u.role === "admin")!;
  const compliance = ctx.users.find((u) => u.role === "compliance_manager")!;
  const eng = ctx.users.find((u) => u.email.startsWith("priya."))!;
  const dpo = ctx.users.find((u) => u.role === "dpo")!;

  const TASKS: Array<{
    title: string;
    description: string;
    status: "pending" | "in_progress" | "completed" | "overdue";
    priority: "critical" | "high" | "medium" | "low";
    sourceModule:
      | "control"
      | "risk"
      | "evidence"
      | "vendor"
      | "audit"
      | "policy"
      | "incident"
      | "dpia";
    assignee: string;
    dueDaysFromNow: number;
    completedDaysAgo?: number;
  }> = [
    {
      title: "Refresh Q4 access review evidence",
      description: "Pull access list export from Okta and attach to ISO 27001 A.5.18.",
      status: "in_progress",
      priority: "high",
      sourceModule: "evidence",
      assignee: compliance.email,
      dueDaysFromNow: 7,
    },
    {
      title: "Close audit finding — emergency change log",
      description: "SOC 2 readiness finding: missing approval log for hotfix change procedure.",
      status: "in_progress",
      priority: "high",
      sourceModule: "audit",
      assignee: eng.email,
      dueDaysFromNow: 14,
    },
    {
      title: "Remediate CVE-2025-1234",
      description: "Patch OpenSSL in API base image; redeploy production.",
      status: "in_progress",
      priority: "critical",
      sourceModule: "control",
      assignee: eng.email,
      dueDaysFromNow: 5,
    },
    {
      title: "Annual policy review — Acceptable Use Policy",
      description: "Review and refresh AUP for the new financial year.",
      status: "pending",
      priority: "medium",
      sourceModule: "policy",
      assignee: ciso.email,
      dueDaysFromNow: 30,
    },
    {
      title: "Vendor re-assessment — OpenAI",
      description: "Quarterly re-assessment of AI sub-processor.",
      status: "pending",
      priority: "high",
      sourceModule: "vendor",
      assignee: compliance.email,
      dueDaysFromNow: 21,
    },
    {
      title: "Risk treatment update — DR runbook",
      description: "Capture Sydney AZ failover runbook in the wiki.",
      status: "in_progress",
      priority: "medium",
      sourceModule: "risk",
      assignee: eng.email,
      dueDaysFromNow: 14,
    },
    {
      title: "Publish quarterly trust update",
      description: "Update Trust Center status post-quarter.",
      status: "pending",
      priority: "medium",
      sourceModule: "policy",
      assignee: compliance.email,
      dueDaysFromNow: 10,
    },
    {
      title: "Annual DPIA review — Customer support",
      description: "Re-assess DPIA for ticketing process.",
      status: "pending",
      priority: "medium",
      sourceModule: "dpia",
      assignee: dpo.email,
      dueDaysFromNow: 60,
    },
    {
      title: "Postmortem follow-up — input payload limits",
      description: "Implement payload size limits highlighted in the API postmortem.",
      status: "completed",
      priority: "high",
      sourceModule: "incident",
      assignee: eng.email,
      dueDaysFromNow: -2,
      completedDaysAgo: 2,
    },
    {
      title: "Q3 phishing simulation rollout",
      description: "Schedule and launch the Q3 phishing campaign.",
      status: "completed",
      priority: "medium",
      sourceModule: "control",
      assignee: ciso.email,
      dueDaysFromNow: -10,
      completedDaysAgo: 10,
    },
    {
      title: "Onboard new vendor — Snyk renewal",
      description: "Renew Snyk contract and refresh DPA.",
      status: "overdue",
      priority: "medium",
      sourceModule: "vendor",
      assignee: compliance.email,
      dueDaysFromNow: -7,
    },
    {
      title: "Verify backup restoration test results",
      description: "Verify monthly backup restoration evidence for PostgreSQL cluster.",
      status: "in_progress",
      priority: "high",
      sourceModule: "evidence",
      assignee: eng.email,
      dueDaysFromNow: 3,
    },
  ];

  let created = 0;
  for (const t of TASKS) {
    const exists = await prisma.task.findFirst({
      where: { tenantId: ctx.orgId, title: t.title },
    });
    if (exists) continue;
    const assignee = ctx.users.find((u) => u.email === t.assignee)!;
    await prisma.task.create({
      data: {
        tenantId: ctx.orgId,
        title: t.title,
        description: t.description,
        type: "manual",
        status: t.status,
        priority: t.priority,
        sourceModule: t.sourceModule,
        assigneeId: assignee.id,
        dueDate: t.dueDaysFromNow >= 0 ? daysFromNow(t.dueDaysFromNow) : daysAgo(-t.dueDaysFromNow),
        completedAt: t.completedDaysAgo !== undefined ? daysAgo(t.completedDaysAgo) : null,
      },
    });
    created++;
  }

  console.log(
    `  ✓ ${created} tasks across ${new Set(TASKS.map((t) => t.sourceModule)).size} source modules`,
  );
}

// ────────────────────────────────────────────────────────────────────
// Step 16 — Trust Center config, public resources and access requests.
// ────────────────────────────────────────────────────────────────────
async function seedTrustCenter(ctx: SeedContext) {
  const ciso = ctx.users.find((u) => u.role === "admin")!;

  const config = await prisma.trustCenterConfig.upsert({
    where: { tenantId: ctx.orgId },
    update: { isEnabled: true },
    create: {
      tenantId: ctx.orgId,
      isEnabled: true,
      brandColor: "#0f172a",
      description: "Acme Demo Co's commitment to security, privacy and compliance — at a glance.",
      faqs: [
        {
          question: "Where is Acme Demo Co data hosted?",
          answer:
            "Production runs on AWS in ap-southeast-2 (Sydney) with DR in ap-southeast-4 (Melbourne).",
        },
        {
          question: "Are you SOC 2 / ISO 27001 certified?",
          answer:
            "ISO 27001 certification audit is in progress; SOC 2 Type II report is targeted within the next quarter.",
        },
        {
          question: "How do I report a security issue?",
          answer: "Email security@acmecloud.io — we respond within one business day.",
        },
      ],
      publicMode: "live",
    },
  });

  const RESOURCES: Array<{
    title: string;
    description: string;
    resourceType: "certificate" | "report" | "policy" | "attestation";
    accessGating: "public" | "contact_required" | "nda_required";
    frameworkType?: string;
  }> = [
    {
      title: "ISO 27001 Statement of Applicability",
      description: "Current SoA for our ISO 27001 ISMS.",
      resourceType: "report",
      accessGating: "contact_required",
      frameworkType: "iso27001",
    },
    {
      title: "SOC 2 Type I Report (current)",
      description: "Most recent SOC 2 Type I attestation.",
      resourceType: "report",
      accessGating: "nda_required",
      frameworkType: "soc2",
    },
    {
      title: "Information Security Policy",
      description: "Top-level published security policy.",
      resourceType: "policy",
      accessGating: "public",
    },
    {
      title: "GDPR Privacy Notice",
      description: "Customer-facing privacy notice.",
      resourceType: "policy",
      accessGating: "public",
    },
    {
      title: "Pen Test Summary 2026",
      description: "Executive summary of the most recent annual pen test.",
      resourceType: "report",
      accessGating: "nda_required",
    },
  ];

  let resourceCount = 0;
  const createdResources: { id: string; title: string }[] = [];
  for (const r of RESOURCES) {
    let resource = await prisma.trustResource.findFirst({
      where: { trustCenterConfigId: config.id, title: r.title },
    });
    if (!resource) {
      resource = await prisma.trustResource.create({
        data: {
          tenantId: ctx.orgId,
          trustCenterConfigId: config.id,
          title: r.title,
          description: r.description,
          resourceType: r.resourceType,
          accessGating: r.accessGating,
          isPublic: r.accessGating === "public",
          frameworkType: r.frameworkType,
          fileUrl: "https://demo.trustalo.io/static/sample.pdf",
        },
      });
      resourceCount++;
    }
    createdResources.push({ id: resource.id, title: resource.title });
  }

  const gatedResource = createdResources.find((r) => r.title === "SOC 2 Type I Report (current)");
  if (gatedResource) {
    const exists = await prisma.trustCenterAccessRequest.findFirst({
      where: {
        tenantId: ctx.orgId,
        resourceId: gatedResource.id,
        requesterEmail: "procurement@bigprospect.com",
      },
    });
    if (!exists) {
      await prisma.trustCenterAccessRequest.create({
        data: {
          tenantId: ctx.orgId,
          resourceId: gatedResource.id,
          requesterName: "Avery Brooks",
          requesterEmail: "procurement@bigprospect.com",
          requesterCompany: "Big Prospect Pty Ltd",
          requesterTitle: "Procurement Lead",
          reason: "Vendor security review for proposed contract.",
          status: "approved",
          ndaAccepted: true,
          approvedById: ciso.id,
          approvedAt: daysAgo(2),
          expiresAt: daysFromNow(30),
        },
      });
    }
    const exists2 = await prisma.trustCenterAccessRequest.findFirst({
      where: {
        tenantId: ctx.orgId,
        resourceId: gatedResource.id,
        requesterEmail: "security@anotherco.io",
      },
    });
    if (!exists2) {
      await prisma.trustCenterAccessRequest.create({
        data: {
          tenantId: ctx.orgId,
          resourceId: gatedResource.id,
          requesterName: "Robin Patel",
          requesterEmail: "security@anotherco.io",
          requesterCompany: "AnotherCo",
          requesterTitle: "Security Engineer",
          reason: "Annual third-party review.",
          status: "pending",
          ndaAccepted: true,
        },
      });
    }
  }

  console.log(
    `  ✓ Trust Center enabled with ${resourceCount} new resources + sample access requests`,
  );
}

// ────────────────────────────────────────────────────────────────────
// Step 17 — A questionnaire with answered questions to demo the AI
// answerer flow.
// ────────────────────────────────────────────────────────────────────
async function seedQuestionnaire(ctx: SeedContext) {
  const compliance = ctx.users.find((u) => u.role === "compliance_manager")!;

  const QUESTIONNAIRE_NAME = "BigProspect Vendor Security Assessment 2026";
  let questionnaire = await prisma.questionnaire.findFirst({
    where: { tenantId: ctx.orgId, name: QUESTIONNAIRE_NAME },
  });
  if (!questionnaire) {
    questionnaire = await prisma.questionnaire.create({
      data: {
        tenantId: ctx.orgId,
        name: QUESTIONNAIRE_NAME,
        sourceFormat: "xlsx",
        requester: "Big Prospect Pty Ltd",
        dueDate: daysFromNow(10),
        status: "in_progress",
        headers: ["Question", "Answer", "Notes"],
        importedById: compliance.id,
      },
    });
  }

  const QUESTIONS: Array<{
    sequence: number;
    section: string;
    text: string;
    type: "yes_no" | "short_text" | "long_text";
    answer: string;
    status: "approved" | "draft" | "pending";
    aiGenerated: boolean;
    aiConfidence?: number;
  }> = [
    {
      sequence: 1,
      section: "Hosting",
      text: "Where is customer data hosted?",
      type: "short_text",
      answer:
        "All customer data is hosted on AWS in ap-southeast-2 (Sydney) with a warm DR replica in ap-southeast-4 (Melbourne).",
      status: "approved",
      aiGenerated: true,
      aiConfidence: 0.92,
    },
    {
      sequence: 2,
      section: "Encryption",
      text: "Is customer data encrypted at rest and in transit?",
      type: "yes_no",
      answer:
        "Yes — AES-256 at rest with KMS-managed keys (annual rotation) and TLS 1.2+ in transit.",
      status: "approved",
      aiGenerated: true,
      aiConfidence: 0.97,
    },
    {
      sequence: 3,
      section: "Identity",
      text: "Describe your authentication and access control model.",
      type: "long_text",
      answer:
        "All access is provisioned through Okta with SSO + MFA. Engineers with production access use hardware security keys. Access reviews are performed quarterly.",
      status: "approved",
      aiGenerated: true,
      aiConfidence: 0.88,
    },
    {
      sequence: 4,
      section: "Compliance",
      text: "Are you SOC 2 / ISO 27001 certified?",
      type: "long_text",
      answer:
        "ISO 27001 Stage 2 certification audit is in progress. SOC 2 Type II report is targeted within the next quarter; the most recent SOC 2 Type I attestation is available on request.",
      status: "draft",
      aiGenerated: true,
      aiConfidence: 0.81,
    },
    {
      sequence: 5,
      section: "Incidents",
      text: "Have you had any reportable security incidents in the last 12 months?",
      type: "yes_no",
      answer:
        "No reportable security incidents requiring regulator or customer notification in the last 12 months.",
      status: "pending",
      aiGenerated: true,
      aiConfidence: 0.74,
    },
    {
      sequence: 6,
      section: "Sub-processors",
      text: "List your sub-processors that handle customer data.",
      type: "long_text",
      answer:
        "AWS (hosting), Stripe (billing), Datadog (operational logs — PII scrubbed), OpenAI (AI feature inference, ZDR enabled).",
      status: "draft",
      aiGenerated: true,
      aiConfidence: 0.85,
    },
  ];

  for (const q of QUESTIONS) {
    const exists = await prisma.question.findFirst({
      where: { questionnaireId: questionnaire.id, sequenceNumber: q.sequence },
    });
    if (exists) continue;
    const question = await prisma.question.create({
      data: {
        tenantId: ctx.orgId,
        questionnaireId: questionnaire.id,
        sequenceNumber: q.sequence,
        sectionTitle: q.section,
        questionText: q.text,
        questionType: q.type,
      },
    });
    await prisma.answer.create({
      data: {
        tenantId: ctx.orgId,
        questionnaireId: questionnaire.id,
        questionId: question.id,
        content: q.answer,
        status: q.status,
        generatedByAi: q.aiGenerated,
        aiConfidence: q.aiConfidence,
        aiSources: ["context:hosting", "policy:Information Security Policy"],
        aiModel: "demo-llm",
        reviewedById: q.status === "approved" ? compliance.id : null,
        reviewedAt: q.status === "approved" ? daysAgo(2) : null,
      },
    });
  }

  console.log(`  ✓ 1 questionnaire with ${QUESTIONS.length} answered questions`);
}

// ────────────────────────────────────────────────────────────────────
// Step 18 — Device fleet. Each device is 1:1 with a hardware Asset and
// assigned to a Person, mirroring what the Go device agent creates on
// enrollment. One laptop reports disk encryption OFF so the Devices
// page has a live at-risk posture story; one is stale (missed
// heartbeats). Secrets are real crypto-envelope blobs so the rows are
// shape-identical to agent-enrolled devices.
// ────────────────────────────────────────────────────────────────────
async function seedDevices(ctx: SeedContext) {
  const DEVICES: Array<{
    hostname: string;
    assetName: string;
    personEmail: string;
    platform: "macos" | "windows" | "linux";
    osVersion: string;
    agentVersion: string;
    status: "active" | "stale";
    enrolledDaysAgo: number;
    lastSeenHoursAgo: number;
    posture: {
      diskEncryption: "pass" | "fail" | "unknown";
      firewall: "pass" | "fail" | "unknown";
      screenLock: "pass" | "fail" | "unknown";
      antivirus: "pass" | "fail" | "unknown";
    };
  }> = [
    {
      hostname: "acme-mbp-alex",
      assetName: 'MacBook Pro 16" — Alex Chen',
      personEmail: "alex.chen@demo.trustalo.io",
      platform: "macos",
      osVersion: "macOS 15.5",
      agentVersion: "0.4.2",
      status: "active",
      enrolledDaysAgo: 60,
      lastSeenHoursAgo: 1,
      posture: { diskEncryption: "pass", firewall: "pass", screenLock: "pass", antivirus: "pass" },
    },
    {
      // The at-risk laptop: FileVault was switched off between check-ins.
      hostname: "acme-mba-taylor",
      assetName: 'MacBook Air 13" — Taylor Nguyen',
      personEmail: "taylor.nguyen@demo.trustalo.io",
      platform: "macos",
      osVersion: "macOS 14.7",
      agentVersion: "0.4.2",
      status: "active",
      enrolledDaysAgo: 45,
      lastSeenHoursAgo: 2,
      posture: {
        diskEncryption: "fail",
        firewall: "pass",
        screenLock: "pass",
        antivirus: "unknown",
      },
    },
    {
      hostname: "acme-tp-jamie",
      assetName: "ThinkPad X1 Carbon — Jamie O'Connor",
      personEmail: "jamie.oconnor@demo.trustalo.io",
      platform: "windows",
      osVersion: "Windows 11 24H2",
      agentVersion: "0.4.1",
      status: "active",
      enrolledDaysAgo: 30,
      lastSeenHoursAgo: 3,
      posture: { diskEncryption: "pass", firewall: "pass", screenLock: "pass", antivirus: "pass" },
    },
    {
      // Stale: last heartbeat 9 days ago — powers the stale-device story.
      hostname: "acme-xps-riley",
      assetName: "Dell XPS 13 (Ubuntu) — Riley Thompson",
      personEmail: "riley.thompson@demo.trustalo.io",
      platform: "linux",
      osVersion: "Ubuntu 24.04 LTS",
      agentVersion: "0.3.9",
      status: "stale",
      enrolledDaysAgo: 90,
      lastSeenHoursAgo: 9 * 24,
      posture: {
        diskEncryption: "pass",
        firewall: "pass",
        screenLock: "unknown",
        antivirus: "unknown",
      },
    },
  ];

  let created = 0;
  for (let i = 0; i < DEVICES.length; i++) {
    const d = DEVICES[i];
    const person = await prisma.person.findFirst({
      where: { tenantId: ctx.orgId, email: d.personEmail },
    });

    let asset = await prisma.asset.findFirst({
      where: { tenantId: ctx.orgId, name: d.assetName },
    });
    if (!asset) {
      asset = await prisma.asset.create({
        data: {
          tenantId: ctx.orgId,
          name: d.assetName,
          type: "hardware",
          classification: "internal",
          description: `Employee endpoint enrolled via the Trustalo device agent (${d.platform}).`,
          assignedPersonId: person?.id ?? null,
          status: "active",
          location: "Fleet",
          metadata: { demoSeed: true },
        },
      });
    }

    let device = await prisma.device.findUnique({ where: { assetId: asset.id } });
    if (!device) {
      const lastSeen = hoursAgo(d.lastSeenHoursAgo);
      device = await prisma.device.create({
        data: {
          tenantId: ctx.orgId,
          assetId: asset.id,
          // Real envelope blob so the row is indistinguishable in shape
          // from an agent-enrolled device. Never used for check-ins.
          secretEnc: encryptString(randomBytes(32).toString("base64url")),
          platform: d.platform,
          osVersion: d.osVersion,
          agentVersion: d.agentVersion,
          hostname: d.hostname,
          hardwareId: `DEMO-HW-${String(i + 1).padStart(4, "0")}`,
          status: d.status,
          personId: person?.id ?? null,
          enrolledAt: daysAgo(d.enrolledDaysAgo),
          lastSeenAt: lastSeen,
          checkInIntervalSeconds: 1800,
          diskEncryption: d.posture.diskEncryption,
          firewall: d.posture.firewall,
          screenLock: d.posture.screenLock,
          antivirus: d.posture.antivirus,
          agentHealthy: true,
          lastPostureAt: lastSeen,
          latestPosture: {
            demoSeed: true,
            source: "seed-demo",
            collectedAt: lastSeen.toISOString(),
          },
        },
      });
      created++;
    }

    const hasSnapshots = await prisma.devicePostureSnapshot.findFirst({
      where: { deviceId: device.id },
    });
    if (!hasSnapshots) {
      // Two-point history. The earlier snapshot always PASSES disk
      // encryption, so the at-risk laptop shows visible posture drift.
      await prisma.devicePostureSnapshot.create({
        data: {
          tenantId: ctx.orgId,
          deviceId: device.id,
          diskEncryption: "pass",
          firewall: d.posture.firewall,
          screenLock: d.posture.screenLock,
          antivirus: d.posture.antivirus,
          agentHealthy: true,
          osVersion: d.osVersion,
          agentVersion: d.agentVersion,
          raw: { demoSeed: true },
          collectedAt: hoursAgo(d.lastSeenHoursAgo + 24),
        },
      });
      await prisma.devicePostureSnapshot.create({
        data: {
          tenantId: ctx.orgId,
          deviceId: device.id,
          diskEncryption: d.posture.diskEncryption,
          firewall: d.posture.firewall,
          screenLock: d.posture.screenLock,
          antivirus: d.posture.antivirus,
          agentHealthy: true,
          osVersion: d.osVersion,
          agentVersion: d.agentVersion,
          raw: { demoSeed: true },
          collectedAt: hoursAgo(d.lastSeenHoursAgo),
        },
      });
    }
  }

  console.log(
    `  ✓ ${created} devices enrolled (1 at-risk: disk encryption off; 1 stale) + posture history`,
  );
}

// ────────────────────────────────────────────────────────────────────
// Step 19 — Evidence library. Named artefacts (metadata only — no file
// blobs) attached to ISO 27001 controls so the evidence workspace
// shows plausible, recognisable titles in a mixed review state.
// ────────────────────────────────────────────────────────────────────
async function seedEvidenceLibrary(ctx: SeedContext) {
  const compliance = ctx.users.find((u) => u.role === "compliance_manager")!;
  const ciso = ctx.users.find((u) => u.role === "admin")!;

  const iso = await prisma.framework.findFirst({ where: { frameworkType: "iso27001" } });
  const instance = iso
    ? await prisma.frameworkInstance.findUnique({
        where: { tenantId_frameworkId: { tenantId: ctx.orgId, frameworkId: iso.id } },
      })
    : null;
  const assignments = instance
    ? await prisma.controlRequirementAssignment.findMany({
        where: { tenantId: ctx.orgId, frameworkInstanceId: instance.id },
        select: { controlId: true },
        orderBy: { controlId: "asc" },
        take: 20,
      })
    : [];
  if (assignments.length === 0) {
    console.log("  ⏭ No ISO 27001 controls found — run base db:seed first");
    return;
  }

  const ITEMS: Array<{
    title: string;
    description: string;
    type: "document" | "screenshot" | "automated" | "link";
    status: "approved" | "pending_review";
    fileName: string;
    mimeType: string;
  }> = [
    {
      title: "Okta access review export — Q2 2026",
      description: "Quarterly user-access review export covering all production systems.",
      type: "automated",
      status: "approved",
      fileName: "okta-access-review-2026-q2.csv",
      mimeType: "text/csv",
    },
    {
      title: "AWS KMS key rotation configuration",
      description: "Console screenshot showing annual rotation enabled on all customer-data CMKs.",
      type: "screenshot",
      status: "approved",
      fileName: "aws-kms-rotation.png",
      mimeType: "image/png",
    },
    {
      title: "Backup restoration test log — May 2026",
      description: "Monthly PostgreSQL point-in-time restore drill with timings and checksums.",
      type: "document",
      status: "pending_review",
      fileName: "backup-restore-test-2026-05.pdf",
      mimeType: "application/pdf",
    },
    {
      title: "Security awareness completion report — FY26",
      description: "Completion report for the annual Security Awareness 101 program.",
      type: "document",
      status: "approved",
      fileName: "security-awareness-fy26.pdf",
      mimeType: "application/pdf",
    },
    {
      title: "Annual penetration test — executive summary 2026",
      description: "Third-party pen test summary; criticals remediated, retest passed.",
      type: "document",
      status: "approved",
      fileName: "pentest-exec-summary-2026.pdf",
      mimeType: "application/pdf",
    },
    {
      title: "S3 Block Public Access account settings export",
      description: "Account-level S3 public-access lockout settings across all AWS accounts.",
      type: "automated",
      status: "pending_review",
      fileName: "s3-bpa-settings.json",
      mimeType: "application/json",
    },
    {
      title: "GitHub branch protection settings — production repos",
      description: "Screenshot of required reviews + status checks on all production repos.",
      type: "screenshot",
      status: "approved",
      fileName: "github-branch-protection.png",
      mimeType: "image/png",
    },
    {
      title: "Incident response tabletop minutes — region failover",
      description: "Minutes and action items from the Sydney-region failover tabletop.",
      type: "document",
      status: "pending_review",
      fileName: "ir-tabletop-region-failover.pdf",
      mimeType: "application/pdf",
    },
  ];

  let created = 0;
  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i];
    const exists = await prisma.evidence.findFirst({
      where: { tenantId: ctx.orgId, title: item.title },
    });
    if (exists) continue;

    const controlId = assignments[(i * 2) % assignments.length].controlId;
    const approved = item.status === "approved";
    await prisma.evidence.create({
      data: {
        tenantId: ctx.orgId,
        controlId,
        title: item.title,
        description: item.description,
        type: item.type,
        status: item.status,
        fileName: item.fileName,
        fileSize: 120_000 + i * 4321,
        mimeType: item.mimeType,
        collectedAt: daysAgo(5 + i * 3),
        validFrom: daysAgo(5 + i * 3),
        expiresAt: daysFromNow(180 + i * 10),
        renewalFrequency: i % 2 === 0 ? "quarterly" : "annually",
        nextRenewalDate: daysFromNow(90 + i * 10),
        submittedById: pick([compliance.id, ciso.id], i),
        reviewedById: approved ? compliance.id : null,
        reviewedAt: approved ? daysAgo(2 + i) : null,
        tags: ["demo", "evidence-library"],
        metadata: { demoSeed: true },
      },
    });
    created++;
  }

  console.log(`  ✓ ${created} named evidence artefacts (approved/pending mix)`);
}

// ────────────────────────────────────────────────────────────────────
// Orchestrator
// ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n→ Seeding demo data into org "${ORG_SLUG}"\n`);

  const { org, baseUser } = await loadOrg();
  console.log(`  Org: ${org.name} (${org.id})`);
  console.log(`  Base user: ${baseUser.email}\n`);

  console.log("→ Demo personas");
  const users = await seedDemoUsers(org.id);

  // Combine the existing test user with demo personas as the assignable
  // pool for downstream entities (so the test user is also active in
  // the system, e.g. as a viewer).
  const allUsers = [
    { id: baseUser.id, email: baseUser.email, name: baseUser.name, role: "owner" as const },
    ...users,
  ];

  const ctx: SeedContext = {
    orgId: org.id,
    testUserId: baseUser.id,
    users: allUsers,
  };

  console.log("\n→ People directory (HR lifecycle)");
  await seedPeopleDirectory(ctx);

  console.log("\n→ Organization profile + AI context");
  await seedOrgProfile(org.id);

  console.log("\n→ Vendors");
  await seedVendors(ctx);

  console.log("\n→ Assets");
  await seedAssets(ctx);

  console.log("\n→ Devices (endpoint posture)");
  await seedDevices(ctx);

  console.log("\n→ Risks");
  await seedRisks(ctx);

  console.log("\n→ Policies");
  await seedPolicies(ctx);

  console.log("\n→ Framework progress (ISO 27001 / SOC 2 / HIPAA)");
  await seedFrameworkProgress(ctx);

  console.log("\n→ Controls (assign owners + evidence)");
  await seedControlOwnersAndEvidence(ctx);

  console.log("\n→ Evidence library");
  await seedEvidenceLibrary(ctx);

  console.log("\n→ Incidents");
  await seedIncidents(ctx);

  console.log("\n→ Vulnerabilities");
  await seedVulnerabilities(ctx);

  console.log("\n→ Audits");
  await seedAudits(ctx);

  console.log("\n→ Business Continuity");
  await seedBcp(ctx);

  console.log("\n→ AI Governance");
  await seedAiGovernance(ctx);

  console.log("\n→ Privacy / GDPR");
  await seedPrivacy(ctx);

  console.log("\n→ Training");
  await seedTraining(ctx);

  console.log("\n→ Tasks");
  await seedTasks(ctx);

  console.log("\n→ Trust Center");
  await seedTrustCenter(ctx);

  console.log("\n→ Questionnaires");
  await seedQuestionnaire(ctx);

  console.log("\n✅ Demo seed complete.\n");
  console.log(`   Org: "${DEMO_ORG_NAME}" (slug: ${ORG_SLUG}) — all data is fake demo data.`);
  console.log("   Login:");
  console.log("     • test@test.com           / test.test         (owner)");
  for (const p of PERSONAS) {
    console.log(`     • ${p.email.padEnd(28)}/ ${DEMO_PASSWORD}        (${p.role})`);
  }
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Demo seed failed:", err);
    process.exit(1);
  });
