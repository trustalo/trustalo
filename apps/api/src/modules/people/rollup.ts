/**
 * Per-person compliance rollups + full profile aggregation.
 *
 * The rollup composes a person's device posture, training completion, policy
 * acknowledgment, and latest background-check status into a single "readiness"
 * signal surfaced on the People list and profile. Computed on read, batched to
 * avoid N+1 (one query per signal across the whole page).
 *
 * This is the entity M5 (the device UI) plugs into: a device's assigned person
 * and a person's fleet posture both flow from here.
 */
import { prisma } from "../../db/prisma.js";
import {
  getPerson,
  listMyPolicies,
  listMyTraining,
  listPeople,
  type ListPeopleFilters,
} from "./service.js";

export type Readiness = "ready" | "at_risk" | "invited" | "suspended" | "offboarded";

export interface PersonRollup {
  deviceCount: number;
  devicesAtRisk: number;
  trainingAssigned: number;
  trainingCompleted: number;
  trainingPct: number;
  policiesTotal: number;
  policiesAcknowledged: number;
  policyPct: number;
  backgroundCheckStatus: string | null;
  readiness: Readiness;
}

const RISK_SIGNAL = (d: {
  status: string;
  diskEncryption: string;
  firewall: string;
  screenLock: string;
  antivirus: string;
  agentHealthy: boolean;
}) =>
  d.status === "stale" ||
  d.status === "revoked" ||
  !d.agentHealthy ||
  [d.diskEncryption, d.firewall, d.screenLock, d.antivirus].includes("fail");

interface PersonLite {
  id: string;
  userId: string | null;
  status: string;
}

/**
 * Compute rollups for a set of people in one batched pass. Returns a map keyed
 * by personId.
 */
export async function computeRollups(
  tenantId: string,
  people: ReadonlyArray<PersonLite>,
): Promise<Map<string, PersonRollup>> {
  const personIds = people.map((p) => p.id);
  const userIds = people.map((p) => p.userId).filter((u): u is string => Boolean(u));

  const [devices, bgChecks, completions, publishedPolicies] = await Promise.all([
    personIds.length
      ? prisma.device.findMany({
          where: { tenantId, personId: { in: personIds } },
          select: {
            personId: true,
            status: true,
            diskEncryption: true,
            firewall: true,
            screenLock: true,
            antivirus: true,
            agentHealthy: true,
          },
        })
      : Promise.resolve([]),
    personIds.length
      ? prisma.backgroundCheck.findMany({
          where: { tenantId, personId: { in: personIds } },
          orderBy: { createdAt: "desc" },
          select: { personId: true, status: true },
        })
      : Promise.resolve([]),
    userIds.length
      ? prisma.trainingCompletion.findMany({
          where: { tenantId, userId: { in: userIds } },
          select: { userId: true, status: true },
        })
      : Promise.resolve([]),
    prisma.policy.findMany({
      where: { tenantId, status: "published" },
      select: { id: true, currentVersionId: true },
    }),
  ]);

  const publishedIds = publishedPolicies.map((p) => p.id);
  const currentVersionByPolicy = new Map(publishedPolicies.map((p) => [p.id, p.currentVersionId]));
  const acks =
    userIds.length && publishedIds.length
      ? await prisma.policyAcknowledgment.findMany({
          where: { tenantId, userId: { in: userIds }, policyId: { in: publishedIds } },
          select: { userId: true, policyId: true, policyVersionId: true },
        })
      : [];

  // Index signals by person/user.
  const devicesByPerson = groupBy(devices, (d) => d.personId ?? "");
  const latestBgByPerson = new Map<string, string>();
  for (const c of bgChecks) {
    if (!latestBgByPerson.has(c.personId)) latestBgByPerson.set(c.personId, c.status);
  }
  const completionsByUser = groupBy(completions, (c) => c.userId);
  const acksByUser = groupBy(acks, (a) => a.userId);
  const policiesTotal = publishedPolicies.length;

  const result = new Map<string, PersonRollup>();
  for (const p of people) {
    const devs = devicesByPerson.get(p.id) ?? [];
    const deviceCount = devs.length;
    const devicesAtRisk = devs.filter(RISK_SIGNAL).length;

    const comps = (p.userId && completionsByUser.get(p.userId)) || [];
    const trainingAssigned = comps.length;
    const trainingCompleted = comps.filter((c) => c.status === "completed").length;
    const trainingPct =
      trainingAssigned === 0 ? 100 : Math.round((trainingCompleted / trainingAssigned) * 100);

    const userAcks = (p.userId && acksByUser.get(p.userId)) || [];
    const ackedCurrent = new Set(
      userAcks
        .filter((a) => currentVersionByPolicy.get(a.policyId) === a.policyVersionId)
        .map((a) => a.policyId),
    );
    const policiesAcknowledged = ackedCurrent.size;
    const policyPct =
      policiesTotal === 0 ? 100 : Math.round((policiesAcknowledged / policiesTotal) * 100);

    const backgroundCheckStatus = latestBgByPerson.get(p.id) ?? null;

    result.set(p.id, {
      deviceCount,
      devicesAtRisk,
      trainingAssigned,
      trainingCompleted,
      trainingPct,
      policiesTotal,
      policiesAcknowledged,
      policyPct,
      backgroundCheckStatus,
      readiness: deriveReadiness(p.status, {
        devicesAtRisk,
        trainingPct,
        policyPct,
        backgroundCheckStatus,
      }),
    });
  }
  return result;
}

export function deriveReadiness(
  status: string,
  s: {
    devicesAtRisk: number;
    trainingPct: number;
    policyPct: number;
    backgroundCheckStatus: string | null;
  },
): Readiness {
  if (status === "invited") return "invited";
  if (status === "suspended") return "suspended";
  if (status === "offboarded") return "offboarded";
  const atRisk =
    s.devicesAtRisk > 0 ||
    s.trainingPct < 100 ||
    s.policyPct < 100 ||
    s.backgroundCheckStatus === "flagged" ||
    s.backgroundCheckStatus === "expired";
  return atRisk ? "at_risk" : "ready";
}

export async function listPeopleWithRollup(tenantId: string, filters: ListPeopleFilters) {
  const { items, total, page, limit } = await listPeople(tenantId, filters);
  const rollups = await computeRollups(tenantId, items);
  return {
    items: items.map((p) => ({ ...p, rollup: rollups.get(p.id) ?? null })),
    total,
    page,
    limit,
  };
}

/** Full Person profile: base record + rollup + all profile-tab data. */
export async function getPersonProfile(tenantId: string, id: string) {
  const person = await getPerson(tenantId, id);
  const rollups = await computeRollups(tenantId, [
    { id: person.id, userId: person.userId, status: person.status },
  ]);

  const [devices, assignedAssets, backgroundChecks, checklist] = await Promise.all([
    prisma.device.findMany({
      where: { tenantId, personId: id },
      select: {
        id: true,
        hostname: true,
        platform: true,
        status: true,
        lastSeenAt: true,
        diskEncryption: true,
        firewall: true,
        screenLock: true,
        antivirus: true,
        agentHealthy: true,
      },
      orderBy: [{ lastSeenAt: { sort: "desc", nulls: "last" } }],
    }),
    prisma.asset.findMany({
      where: { tenantId, assignedPersonId: id, deletedAt: null },
      select: { id: true, name: true, type: true, classification: true, status: true },
      orderBy: { name: "asc" },
    }),
    prisma.backgroundCheck.findMany({
      where: { tenantId, personId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.personChecklistItem.findMany({
      where: { tenantId, personId: id },
      orderBy: [{ kind: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const training = person.userId ? await listMyTraining(tenantId, person.userId) : [];
  const policies = person.userId ? await listMyPolicies(tenantId, person.userId) : [];

  return {
    ...person,
    rollup: rollups.get(id) ?? null,
    devices,
    assignedAssets,
    backgroundChecks,
    checklist,
    training,
    policies,
  };
}

function groupBy<T, K>(items: ReadonlyArray<T>, key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const arr = map.get(k);
    if (arr) arr.push(item);
    else map.set(k, [item]);
  }
  return map;
}
