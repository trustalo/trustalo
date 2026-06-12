/**
 * Onboarding / offboarding checklists per Person.
 *
 * Items are templated and seeded on lifecycle transitions:
 *   - invited → active   seeds the onboarding set
 *   - * → offboarded     seeds the offboarding set AND revokes the person's
 *                        devices (offboarded people also can't log in, since
 *                        completeLogin only admits active/invited Person rows).
 *
 * Completing the full offboarding set emits advisory Evidence (ISO A.6.5).
 * Seeding is idempotent via the @@unique([personId, kind, key]) constraint.
 */
import { prisma } from "../../db/prisma.js";
import type { PersonStatus } from "../../../generated/prisma/client/index.js";
import { AuditLog } from "../../mongodb/models/index.js";
import { PeopleError } from "./service.js";
import { emitPeopleEvidence } from "./evidence.js";

type ChecklistKind = "onboarding" | "offboarding";
type ItemStatus = "pending" | "done" | "na";

export const ONBOARDING_TEMPLATE: { key: string; label: string }[] = [
  { key: "background_check", label: "Complete background / reference check" },
  { key: "sign_policies", label: "Acknowledge required security policies" },
  { key: "security_training", label: "Complete security awareness training" },
  { key: "provision_accounts", label: "Provision accounts with least privilege" },
  { key: "issue_device", label: "Issue and enroll a managed device" },
  { key: "mfa_enrolled", label: "Enroll in multi-factor authentication" },
];

export const OFFBOARDING_TEMPLATE: { key: string; label: string }[] = [
  { key: "revoke_access", label: "Revoke application + system access" },
  { key: "collect_device", label: "Collect / wipe issued devices" },
  { key: "disable_login", label: "Disable SSO / directory account" },
  { key: "transfer_ownership", label: "Reassign owned records and assets" },
  { key: "exit_interview", label: "Conduct exit interview / confirm NDA" },
];

const TEMPLATES: Record<ChecklistKind, { key: string; label: string }[]> = {
  onboarding: ONBOARDING_TEMPLATE,
  offboarding: OFFBOARDING_TEMPLATE,
};

async function assertPerson(tenantId: string, personId: string) {
  const person = await prisma.person.findFirst({
    where: { id: personId, tenantId },
    select: { id: true, fullName: true },
  });
  if (!person) throw new PeopleError(404, "NOT_FOUND", "Person not found");
  return person;
}

export async function getPersonChecklist(tenantId: string, personId: string) {
  await assertPerson(tenantId, personId);
  return prisma.personChecklistItem.findMany({
    where: { tenantId, personId },
    orderBy: [{ kind: "asc" }, { createdAt: "asc" }],
  });
}

/** Idempotently seed a checklist from its template; returns the full set. */
export async function seedChecklist(tenantId: string, personId: string, kind: ChecklistKind) {
  await assertPerson(tenantId, personId);
  const template = TEMPLATES[kind];
  await prisma.personChecklistItem.createMany({
    data: template.map((t) => ({ tenantId, personId, kind, key: t.key, label: t.label })),
    skipDuplicates: true,
  });
  return prisma.personChecklistItem.findMany({
    where: { tenantId, personId, kind },
    orderBy: { createdAt: "asc" },
  });
}

export async function completeChecklistItem(
  tenantId: string,
  personId: string,
  itemId: string,
  status: ItemStatus,
) {
  await assertPerson(tenantId, personId);
  const item = await prisma.personChecklistItem.findFirst({
    where: { id: itemId, tenantId, personId },
  });
  if (!item) throw new PeopleError(404, "NOT_FOUND", "Checklist item not found");

  const updated = await prisma.personChecklistItem.update({
    where: { id: itemId },
    data: { status, completedAt: status === "done" ? new Date() : null },
  });

  // If this completes the whole offboarding set, emit advisory evidence once.
  if (item.kind === "offboarding") {
    await maybeEmitOffboardingComplete(tenantId, personId);
  }
  return updated;
}

/**
 * React to a Person status transition: seed the relevant checklist and run
 * offboarding side-effects. Called by the router after `updatePersonStatus`
 * (kept out of the service to avoid an import cycle).
 */
export async function onPersonStatusChanged(
  tenantId: string,
  person: { id: string; fullName: string },
  fromStatus: PersonStatus,
  toStatus: PersonStatus,
): Promise<void> {
  if (fromStatus === toStatus) return;

  if (toStatus === "active" && fromStatus === "invited") {
    await seedChecklist(tenantId, person.id, "onboarding");
  }

  if (toStatus === "offboarded") {
    await seedChecklist(tenantId, person.id, "offboarding");
    // Revoke the person's devices (best-effort; inventory stays for audit).
    const revoked = await prisma.device.updateMany({
      where: { tenantId, personId: person.id, status: { notIn: ["revoked", "retired"] } },
      data: { status: "revoked" },
    });
    void AuditLog.create({
      tenantId,
      action: "update",
      resource: "Person",
      resourceId: person.id,
      details: { transition: "offboarding_side_effects", devicesRevoked: revoked.count },
    }).catch((err) => console.error("[people] offboarding audit log failed:", err));
  }
}

async function maybeEmitOffboardingComplete(tenantId: string, personId: string) {
  const items = await prisma.personChecklistItem.findMany({
    where: { tenantId, personId, kind: "offboarding" },
    select: { status: true },
  });
  if (items.length === 0) return;
  const allResolved = items.every((i) => i.status === "done" || i.status === "na");
  if (!allResolved) return;

  // Dedupe: only emit once. We use a marker checklist item key check — emit
  // happens at most once per offboarding cycle because evidence is deduped by
  // (manifestKey, sourceId=personId, controlId) in createAutomatedEvidence.
  const person = await prisma.person.findFirst({
    where: { id: personId, tenantId },
    select: { fullName: true },
  });
  await emitPeopleEvidence(tenantId, "offboarding_completed", {
    title: `Offboarding completed: ${person?.fullName ?? personId}`,
    description: `All offboarding checklist items resolved for "${
      person?.fullName ?? personId
    }" (access revoked, devices collected, account disabled).`,
    sourceId: personId,
    rawData: { itemsResolved: items.length },
  });
}

export type { ChecklistKind, ItemStatus };
