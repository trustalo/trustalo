/**
 * Background checks — pre-employment / periodic vetting per Person.
 *
 * Tenant-scoped explicitly (the People module uses the base client). A check
 * transitioning to `cleared` emits advisory Evidence (ISO A.6.1 screening).
 * An expiry sweep flips long-past `cleared` checks to `expired`.
 */
import { z } from "zod";
import { prisma } from "../../db/prisma.js";
import { AuditLog } from "../../mongodb/models/index.js";
import { PeopleError } from "./service.js";
import { emitPeopleEvidence } from "./evidence.js";

const checkType = z.enum([
  "identity",
  "criminal",
  "employment",
  "education",
  "credit",
  "reference",
  "other",
]);
const checkStatus = z.enum(["not_started", "in_progress", "cleared", "flagged", "expired"]);

export const backgroundCheckCreateSchema = z.object({
  type: checkType.default("identity"),
  status: checkStatus.default("not_started"),
  provider: z.string().max(200).nullable().optional(),
  reference: z.string().max(200).nullable().optional(),
  adverseFindings: z.boolean().optional(),
  notes: z.string().max(5000).nullable().optional(),
  requestedAt: z.coerce.date().nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});

export const backgroundCheckUpdateSchema = backgroundCheckCreateSchema.partial();

type CreateInput = z.infer<typeof backgroundCheckCreateSchema>;
type UpdateInput = z.infer<typeof backgroundCheckUpdateSchema>;

async function assertPerson(tenantId: string, personId: string) {
  const person = await prisma.person.findFirst({
    where: { id: personId, tenantId },
    select: { id: true, fullName: true },
  });
  if (!person) throw new PeopleError(404, "NOT_FOUND", "Person not found");
  return person;
}

export async function listBackgroundChecks(tenantId: string, personId: string) {
  await assertPerson(tenantId, personId);
  return prisma.backgroundCheck.findMany({
    where: { tenantId, personId },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function createBackgroundCheck(
  tenantId: string,
  personId: string,
  input: CreateInput,
) {
  const person = await assertPerson(tenantId, personId);
  const check = await prisma.backgroundCheck.create({
    data: {
      tenantId,
      personId,
      type: input.type,
      status: input.status,
      provider: input.provider ?? null,
      reference: input.reference ?? null,
      adverseFindings: input.adverseFindings ?? false,
      notes: input.notes ?? null,
      requestedAt: input.requestedAt ?? null,
      completedAt: input.completedAt ?? (input.status === "cleared" ? new Date() : null),
      expiresAt: input.expiresAt ?? null,
    },
  });

  if (check.status === "cleared") {
    await emitClearedEvidence(tenantId, person.fullName, check);
  }
  void auditCheck(tenantId, personId, check.id, "create", {
    status: check.status,
    type: check.type,
  });
  return check;
}

export async function updateBackgroundCheck(
  tenantId: string,
  personId: string,
  checkId: string,
  input: UpdateInput,
) {
  await assertPerson(tenantId, personId);
  const existing = await prisma.backgroundCheck.findFirst({
    where: { id: checkId, tenantId, personId },
  });
  if (!existing) throw new PeopleError(404, "NOT_FOUND", "Background check not found");

  const data: Record<string, unknown> = {};
  if (input.type !== undefined) data.type = input.type;
  if (input.status !== undefined) data.status = input.status;
  if (input.provider !== undefined) data.provider = input.provider;
  if (input.reference !== undefined) data.reference = input.reference;
  if (input.adverseFindings !== undefined) data.adverseFindings = input.adverseFindings;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.requestedAt !== undefined) data.requestedAt = input.requestedAt;
  if (input.expiresAt !== undefined) data.expiresAt = input.expiresAt;
  if (input.completedAt !== undefined) data.completedAt = input.completedAt;
  // Auto-stamp completion when newly cleared without an explicit date.
  if (
    input.status === "cleared" &&
    existing.status !== "cleared" &&
    input.completedAt === undefined
  ) {
    data.completedAt = new Date();
  }

  const check = await prisma.backgroundCheck.update({ where: { id: checkId }, data });

  // Emit advisory evidence only on the not-cleared → cleared transition.
  if (check.status === "cleared" && existing.status !== "cleared") {
    const person = await prisma.person.findFirst({
      where: { id: personId, tenantId },
      select: { fullName: true },
    });
    await emitClearedEvidence(tenantId, person?.fullName ?? personId, check);
  }
  void auditCheck(tenantId, personId, checkId, "update", {
    from: existing.status,
    to: check.status,
  });
  return check;
}

/**
 * Flip `cleared` checks whose `expiresAt` is in the past to `expired`. Safe to
 * run on an interval; returns the count flipped.
 */
export async function sweepExpiredBackgroundChecks(): Promise<{ expired: number }> {
  const now = new Date();
  const result = await prisma.backgroundCheck.updateMany({
    where: { status: "cleared", expiresAt: { not: null, lt: now } },
    data: { status: "expired" },
  });
  return { expired: result.count };
}

async function emitClearedEvidence(
  tenantId: string,
  personName: string,
  check: { id: string; type: string; provider: string | null; completedAt: Date | null },
) {
  await emitPeopleEvidence(tenantId, "background_check_cleared", {
    title: `Background check cleared: ${personName}`,
    description: `${check.type} background check for "${personName}" cleared${
      check.provider ? ` via ${check.provider}` : ""
    } on ${(check.completedAt ?? new Date()).toISOString()}.`,
    sourceId: check.id,
    rawData: { checkType: check.type, provider: check.provider },
  });
}

function auditCheck(
  tenantId: string,
  personId: string,
  checkId: string,
  action: "create" | "update",
  details: Record<string, unknown>,
) {
  return AuditLog.create({
    tenantId,
    action,
    resource: "BackgroundCheck",
    resourceId: checkId,
    details: { personId, ...details },
  }).catch((err: unknown) => console.error("[people] background-check audit log failed:", err));
}
