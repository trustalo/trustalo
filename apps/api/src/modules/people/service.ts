/**
 * People — the HR / personnel directory. A `Person` is the canonical
 * per-tenant record for anyone in scope for compliance (staff, contractors,
 * vendor contacts). It replaced the old `Membership` model: it carries the
 * org link + role-based access AND HR attributes.
 *
 * Multi-tenant boundary: `Person` is an INTENTIONAL_EXCEPTION to the
 * `prismaWithTenant` allow-list (login resolves a user's Person across tenants
 * via the base client). EVERY query in this module therefore filters
 * `tenantId` EXPLICITLY against the authenticated principal's tenant — never
 * client input.
 *
 * Advisory contract: HR events (background-check cleared, training completed,
 * offboarding finished) emit advisory Evidence (pending_review) via the shared
 * `createAutomatedEvidence` writer — never an auto-approved verdict. See
 * background-checks.ts / checklists.ts.
 */
import { prisma } from "../../db/prisma.js";
import { Prisma } from "../../../generated/prisma/client/index.js";
import type {
  PersonRole,
  PersonStatus,
  PersonKind,
} from "../../../generated/prisma/client/index.js";
import { AuditLog } from "../../mongodb/models/index.js";
import { emitPeopleEvidence } from "./evidence.js";

// Roles a Person can be assigned through the People UI. `owner` is excluded —
// ownership transfer is a separate, deliberate action and there is exactly one
// owner per tenant (mirrors the old members API's owner protection).
export const ASSIGNABLE_PERSON_ROLES = [
  "member",
  "admin",
  "compliance_manager",
  "auditor",
  "viewer",
  "integration_admin",
  "dpo",
] as const;

export type AssignablePersonRole = (typeof ASSIGNABLE_PERSON_ROLES)[number];

// Public projection — never leak the linked User's auth columns.
const personSelect = {
  id: true,
  tenantId: true,
  userId: true,
  email: true,
  fullName: true,
  role: true,
  permissions: true,
  status: true,
  kind: true,
  source: true,
  jobTitle: true,
  department: true,
  employmentType: true,
  managerId: true,
  location: true,
  startDate: true,
  endDate: true,
  invitedAt: true,
  joinedAt: true,
  createdAt: true,
  updatedAt: true,
  manager: { select: { id: true, fullName: true, email: true } },
  user: { select: { id: true, email: true, name: true, lastLoginAt: true } },
} satisfies Prisma.PersonSelect;

export class PeopleError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "PeopleError";
    this.status = status;
    this.code = code;
  }
}

export interface ListPeopleFilters {
  status?: PersonStatus;
  kind?: PersonKind;
  role?: PersonRole;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listPeople(tenantId: string, filters: ListPeopleFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(200, Math.max(1, filters.limit ?? 50));

  const where: Prisma.PersonWhereInput = { tenantId };
  if (filters.status) where.status = filters.status;
  if (filters.kind) where.kind = filters.kind;
  if (filters.role) where.role = filters.role;
  if (filters.department) where.department = filters.department;
  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
      { jobTitle: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.person.findMany({
      where,
      orderBy: [{ fullName: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: personSelect,
    }),
    prisma.person.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getPersonStats(tenantId: string) {
  const rows = await prisma.person.groupBy({
    by: ["status"],
    where: { tenantId },
    _count: { _all: true },
  });
  const byStatus: Record<string, number> = {};
  let total = 0;
  for (const r of rows) {
    byStatus[r.status] = r._count._all;
    total += r._count._all;
  }

  const kindRows = await prisma.person.groupBy({
    by: ["kind"],
    where: { tenantId },
    _count: { _all: true },
  });
  const byKind: Record<string, number> = {};
  for (const r of kindRows) byKind[r.kind] = r._count._all;

  const withLogin = await prisma.person.count({
    where: { tenantId, userId: { not: null } },
  });

  return { total, byStatus, byKind, withLogin };
}

export async function getPerson(tenantId: string, id: string) {
  const person = await prisma.person.findFirst({
    where: { id, tenantId },
    select: personSelect,
  });
  if (!person) {
    throw new PeopleError(404, "NOT_FOUND", "Person not found");
  }
  return person;
}

export interface CreatePersonInput {
  email: string;
  fullName: string;
  kind?: PersonKind;
  role?: AssignablePersonRole;
  jobTitle?: string | null;
  department?: string | null;
  employmentType?: string | null;
  managerId?: string | null;
  location?: string | null;
  startDate?: Date | null;
}

/**
 * Create a login-less Person (HR record only). For people who should be able
 * to sign in, use the invite flow (authService.inviteUser) instead — that
 * provisions a User and links it.
 */
export async function createPerson(tenantId: string, input: CreatePersonInput) {
  const email = input.email.toLowerCase().trim();

  const existing = await prisma.person.findFirst({
    where: { tenantId, email },
    select: { id: true },
  });
  if (existing) {
    throw new PeopleError(409, "CONFLICT", "A person with this email already exists");
  }

  if (input.managerId) await assertManagerInTenant(tenantId, input.managerId);

  const person = await prisma.person.create({
    data: {
      tenantId,
      email,
      fullName: input.fullName.trim(),
      kind: input.kind ?? "employee",
      role: (input.role ?? "member") as PersonRole,
      status: "active",
      source: "manual",
      jobTitle: input.jobTitle ?? null,
      department: input.department ?? null,
      employmentType: input.employmentType ?? null,
      managerId: input.managerId ?? null,
      location: input.location ?? null,
      startDate: input.startDate ?? null,
    },
    select: personSelect,
  });

  void AuditLog.create({
    tenantId,
    action: "create",
    resource: "Person",
    resourceId: person.id,
    details: { email, kind: person.kind, source: "manual" },
  }).catch((err) => console.error("[people] create audit log failed:", err));

  return person;
}

export interface UpdatePersonInput {
  fullName?: string;
  kind?: PersonKind;
  jobTitle?: string | null;
  department?: string | null;
  employmentType?: string | null;
  managerId?: string | null;
  location?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
}

export async function updatePerson(tenantId: string, id: string, input: UpdatePersonInput) {
  const existing = await prisma.person.findFirst({
    where: { id, tenantId },
    select: { id: true, managerId: true },
  });
  if (!existing) throw new PeopleError(404, "NOT_FOUND", "Person not found");

  if (input.managerId !== undefined && input.managerId !== null) {
    if (input.managerId === id) {
      throw new PeopleError(400, "VALIDATION_ERROR", "A person cannot be their own manager");
    }
    await assertManagerInTenant(tenantId, input.managerId);
  }

  const data: Prisma.PersonUpdateInput = {};
  if (input.fullName !== undefined) data.fullName = input.fullName.trim();
  if (input.kind !== undefined) data.kind = input.kind;
  if (input.jobTitle !== undefined) data.jobTitle = input.jobTitle;
  if (input.department !== undefined) data.department = input.department;
  if (input.employmentType !== undefined) data.employmentType = input.employmentType;
  if (input.location !== undefined) data.location = input.location;
  if (input.startDate !== undefined) data.startDate = input.startDate;
  if (input.endDate !== undefined) data.endDate = input.endDate;
  if (input.managerId !== undefined) {
    data.manager = input.managerId ? { connect: { id: input.managerId } } : { disconnect: true };
  }

  const person = await prisma.person.update({
    where: { id },
    data,
    select: personSelect,
  });
  return person;
}

/**
 * Change a Person's role. Mirrors the old members API's owner protection:
 * the owner's role can't be changed here, and you can't promote anyone TO
 * owner (ownership transfer is a separate action). Clears any per-person
 * permission override so the role's permission set takes effect on next login.
 */
export async function updatePersonRole(tenantId: string, id: string, role: AssignablePersonRole) {
  const existing = await prisma.person.findFirst({
    where: { id, tenantId },
    select: { id: true, role: true },
  });
  if (!existing) throw new PeopleError(404, "NOT_FOUND", "Person not found");
  if (existing.role === "owner") {
    throw new PeopleError(403, "FORBIDDEN", "Cannot change the owner's role");
  }

  const person = await prisma.person.update({
    where: { id },
    data: { role: role as PersonRole, permissions: [] },
    select: personSelect,
  });

  void AuditLog.create({
    tenantId,
    action: "update",
    resource: "Person",
    resourceId: id,
    details: { transition: "role_change", from: existing.role, to: role },
  }).catch((err) => console.error("[people] role-change audit log failed:", err));

  return person;
}

/**
 * Change lifecycle status. Phase B layers onboarding/offboarding checklist
 * seeding + offboarding side-effects on top of the transitions here via
 * `onPersonStatusChanged`.
 */
export async function updatePersonStatus(tenantId: string, id: string, status: PersonStatus) {
  const existing = await prisma.person.findFirst({
    where: { id, tenantId },
    select: { id: true, role: true, status: true },
  });
  if (!existing) throw new PeopleError(404, "NOT_FOUND", "Person not found");
  if (existing.role === "owner" && status !== "active") {
    throw new PeopleError(403, "FORBIDDEN", "Cannot suspend or offboard the owner");
  }
  if (existing.status === status) {
    return { person: await getPerson(tenantId, id), previousStatus: existing.status };
  }

  const data: Prisma.PersonUpdateInput = { status };
  if (status === "active") data.joinedAt = new Date();
  if (status === "offboarded") data.endDate = new Date();

  const person = await prisma.person.update({
    where: { id },
    data,
    select: personSelect,
  });

  void AuditLog.create({
    tenantId,
    action: "update",
    resource: "Person",
    resourceId: id,
    details: { transition: "status_change", from: existing.status, to: status },
  }).catch((err) => console.error("[people] status-change audit log failed:", err));

  return { person, previousStatus: existing.status };
}

export async function deletePerson(tenantId: string, id: string) {
  const existing = await prisma.person.findFirst({
    where: { id, tenantId },
    select: { id: true, role: true },
  });
  if (!existing) throw new PeopleError(404, "NOT_FOUND", "Person not found");
  if (existing.role === "owner") {
    throw new PeopleError(403, "FORBIDDEN", "Cannot remove the organization owner");
  }

  await prisma.person.delete({ where: { id } });

  void AuditLog.create({
    tenantId,
    action: "delete",
    resource: "Person",
    resourceId: id,
    details: {},
  }).catch((err) => console.error("[people] delete audit log failed:", err));

  return { id };
}

// ── Self-service (member self-portal: /people/me) ───────────────────────

/** The caller's own Person for this tenant (used by /people/me). */
export async function getMyPerson(tenantId: string, userId: string) {
  const person = await prisma.person.findFirst({
    where: { tenantId, userId },
    select: personSelect,
  });
  if (!person) throw new PeopleError(404, "NOT_FOUND", "No person record for this account");
  return person;
}

/**
 * Policies the caller should read + acknowledge (published policies in their
 * tenant) annotated with their own acknowledgment status. Scoped to the
 * caller's userId so a `member` never sees more than their own ack state.
 */
export async function listMyPolicies(tenantId: string, userId: string) {
  const policies = await prisma.policy.findMany({
    where: { tenantId, status: "published" },
    select: {
      id: true,
      title: true,
      category: true,
      currentVersionId: true,
      updatedAt: true,
      acknowledgments: {
        where: { userId },
        orderBy: { acknowledgedAt: "desc" },
        take: 1,
        select: { id: true, policyVersionId: true, acknowledgedAt: true },
      },
    },
    orderBy: { title: "asc" },
  });

  return policies.map((p) => {
    const ack = p.acknowledgments[0] ?? null;
    const acknowledgedCurrent = Boolean(
      ack && p.currentVersionId && ack.policyVersionId === p.currentVersionId,
    );
    return {
      id: p.id,
      title: p.title,
      category: p.category,
      currentVersionId: p.currentVersionId,
      updatedAt: p.updatedAt,
      acknowledgedAt: ack?.acknowledgedAt ?? null,
      acknowledgedCurrent,
    };
  });
}

/** Acknowledge the current version of a published policy as the caller. */
export async function acknowledgeMyPolicy(tenantId: string, userId: string, policyId: string) {
  const policy = await prisma.policy.findFirst({
    where: { id: policyId, tenantId, status: "published" },
    select: { id: true, currentVersionId: true },
  });
  if (!policy || !policy.currentVersionId) {
    throw new PeopleError(404, "NOT_FOUND", "Published policy not found");
  }

  const existing = await prisma.policyAcknowledgment.findFirst({
    where: { policyId, userId, policyVersionId: policy.currentVersionId },
    select: { id: true },
  });
  if (existing) {
    return { acknowledged: true, alreadyAcknowledged: true };
  }

  await prisma.policyAcknowledgment.create({
    data: {
      tenantId,
      policyId,
      policyVersionId: policy.currentVersionId,
      userId,
    },
  });
  return { acknowledged: true, alreadyAcknowledged: false };
}

/** Training assigned to the caller (their TrainingCompletion rows). */
export async function listMyTraining(tenantId: string, userId: string) {
  const completions = await prisma.trainingCompletion.findMany({
    where: { tenantId, userId },
    select: {
      id: true,
      status: true,
      score: true,
      assignedAt: true,
      completedAt: true,
      trainingProgram: {
        select: { id: true, title: true, type: true, dueDate: true, isRequired: true },
      },
    },
    orderBy: { assignedAt: "desc" },
  });
  return completions;
}

/** Mark one of the caller's own assigned trainings complete. */
export async function completeMyTraining(tenantId: string, userId: string, completionId: string) {
  const completion = await prisma.trainingCompletion.findFirst({
    where: { id: completionId, tenantId, userId },
    select: { id: true, status: true, trainingProgram: { select: { title: true } } },
  });
  if (!completion) throw new PeopleError(404, "NOT_FOUND", "Training assignment not found");

  const updated = await prisma.trainingCompletion.update({
    where: { id: completion.id },
    data: { status: "completed", completedAt: new Date() },
    select: { id: true, status: true, completedAt: true },
  });

  // Advisory evidence (ISO A.6.3 / SOC 2 CC1.4) on first completion only.
  if (completion.status !== "completed") {
    await emitPeopleEvidence(tenantId, "training_completed", {
      title: `Security training completed: ${completion.trainingProgram.title}`,
      description: `User completed "${completion.trainingProgram.title}" on ${new Date().toISOString()}.`,
      sourceId: completionId,
    });
  }
  return updated;
}

// ── Phase D: vendor contact → Person ─────────────────────────────────────

/**
 * Promote a VendorContact to a Person (kind=vendor_contact) so the contact can
 * be vetted (background check), acknowledge policies and take training like
 * staff. Links the new Person to its Vendor. Idempotent on email: if a Person
 * with the contact's email already exists, it is linked to the vendor instead
 * of creating a duplicate.
 */
export async function promoteVendorContact(tenantId: string, contactId: string) {
  const contact = await prisma.vendorContact.findFirst({
    where: { id: contactId, vendor: { tenantId } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      vendor: { select: { id: true, name: true } },
    },
  });
  if (!contact) throw new PeopleError(404, "NOT_FOUND", "Vendor contact not found");
  if (!contact.email) {
    throw new PeopleError(400, "VALIDATION_ERROR", "Vendor contact has no email to vet");
  }
  const email = contact.email.toLowerCase();

  const existing = await prisma.person.findFirst({
    where: { tenantId, email },
    select: { id: true },
  });
  if (existing) {
    return prisma.person.update({
      where: { id: existing.id },
      data: { vendorId: contact.vendor.id, kind: "vendor_contact" },
      select: personSelect,
    });
  }

  const person = await prisma.person.create({
    data: {
      tenantId,
      email,
      fullName: contact.name,
      kind: "vendor_contact",
      role: "member",
      status: "active",
      source: "manual",
      jobTitle: contact.role ?? null,
      vendorId: contact.vendor.id,
    },
    select: personSelect,
  });

  void AuditLog.create({
    tenantId,
    action: "create",
    resource: "Person",
    resourceId: person.id,
    details: { promotedFromVendorContact: contactId, vendorId: contact.vendor.id },
  }).catch((err) => console.error("[people] vendor-contact promote audit log failed:", err));

  return person;
}

// ── Cross-module: resolve a User → their Person ──────────────────────────

/**
 * Find (or lazily create) the Person for a given user in a tenant. Used by
 * device enrollment to attach a device to its owner's Person. A logged-in
 * user normally already has a Person (login provisions one); the create path
 * is a safety net for legacy users whose Person was never backfilled.
 *
 * Returns the personId, or null if the user doesn't exist.
 */
export async function resolvePersonForUser(
  tenantId: string,
  userId: string,
): Promise<string | null> {
  const existing = await prisma.person.findFirst({
    where: { tenantId, userId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) return null;
  const email = user.email.toLowerCase();

  // Don't collide with a login-less Person already created for this email;
  // adopt it by linking the userId instead.
  const byEmail = await prisma.person.findFirst({
    where: { tenantId, email },
    select: { id: true, userId: true },
  });
  if (byEmail) {
    if (!byEmail.userId) {
      await prisma.person.update({ where: { id: byEmail.id }, data: { userId } });
    }
    return byEmail.id;
  }

  const person = await prisma.person.create({
    data: {
      tenantId,
      userId,
      email,
      fullName: user.name,
      role: "member",
      status: "active",
      source: "self_register",
      joinedAt: new Date(),
    },
    select: { id: true },
  });
  return person.id;
}

// ── Helpers ─────────────────────────────────────────────────────────────

async function assertManagerInTenant(tenantId: string, managerId: string) {
  const manager = await prisma.person.findFirst({
    where: { id: managerId, tenantId },
    select: { id: true },
  });
  if (!manager) {
    throw new PeopleError(400, "VALIDATION_ERROR", "Manager must be a person in this tenant");
  }
}
