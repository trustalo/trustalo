/**
 * Device-posture domain logic shared by the agent and admin routers.
 *
 * Boundary (multi-tenant + advisory contract):
 *  - `tenantId` always comes from the authenticated principal (enrollment
 *    token row or user JWT), never from client input.
 *  - A device's self-reported posture is INVENTORY telemetry and is written
 *    straight onto the Device/Asset row. The COMPLIANCE interpretation is
 *    emitted as advisory Evidence (pending_review) via the shared
 *    `createAutomatedEvidence` writer — never an auto-approved verdict.
 */
import { createHash } from "node:crypto";
import { prisma } from "../../db/prisma.js";
import { Prisma } from "../../../generated/prisma/client/index.js";
import { endpointAgentManifest } from "@trustalo/integration-manifests";
import { resolveFrameworkRefs } from "../internal/control-binding.js";
import { createAutomatedEvidence, type AutomatedEvidenceItem } from "../evidence/ingest-service.js";
import { generateDeviceSecret } from "../../lib/device-auth.js";
import { encryptString } from "../../lib/crypto-envelope.js";
import { AuditLog } from "../../mongodb/models/index.js";

export type DevicePlatform = "macos" | "windows" | "linux";
export type SignalState = "pass" | "fail" | "unknown";
type Severity = "critical" | "high" | "medium" | "low" | "info";

// Stale detection: a device that has missed this many check-in intervals is
// flagged `stale` (and an agent-health finding is raised). Nonce ledger rows
// are pruned once older than the signature clock-skew window.
const STALE_INTERVAL_FACTOR = 3;
const NONCE_RETENTION_MS = 10 * 60 * 1000;

// signal manifestKey -> framework refs / default severity, sourced from the
// endpoint-agent manifest so control mappings live in exactly one place.
const SIGNAL_REFS: Record<string, { framework: string; requirement: string }[]> =
  Object.fromEntries(
    (endpointAgentManifest.capabilities ?? []).map((c) => [
      c.key,
      (c.controlMappings ?? []).map((m) => ({
        framework: m.framework,
        requirement: m.requirement,
      })),
    ]),
  );
const SIGNAL_SEVERITY: Record<string, Severity> = Object.fromEntries(
  (endpointAgentManifest.capabilities ?? []).map((c) => [
    c.key,
    (c.defaultSeverity as Severity) ?? "medium",
  ]),
);

// Posture-signal field on Device/check-in ↔ manifestKey ↔ display label.
const POSTURE_SIGNALS = [
  { field: "diskEncryption", key: "device.disk_encryption", label: "Disk encryption" },
  { field: "firewall", key: "device.firewall", label: "Host firewall" },
  { field: "screenLock", key: "device.screen_lock", label: "Screen lock" },
  { field: "antivirus", key: "device.antivirus", label: "Antivirus / EDR" },
] as const;

const AGENT_HEALTH_KEY = "device.agent_health";

// ── Enrollment tokens ───────────────────────────────────────────────

export function hashEnrollmentToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/** A new admin enrollment token: `det_` + 24 random bytes (hex). */
export function generateEnrollmentTokenRaw(): string {
  // device-agent secret reuse keeps the dependency surface small.
  return `det_${generateDeviceSecret().slice(0, 48)}`;
}

export interface ConsumedToken {
  tokenId: string;
  tenantId: string;
}

/**
 * Validate + atomically consume one use of an enrollment token. The guarded
 * `updateMany` (status/expiry/useCount predicate + increment) is atomic at
 * the row level, closing the multi-use race. Returns null if the token is
 * missing/expired/revoked/exhausted.
 */
export async function consumeEnrollmentToken(rawToken: string): Promise<ConsumedToken | null> {
  const tokenHash = hashEnrollmentToken(rawToken);
  const token = await prisma.deviceEnrollmentToken.findUnique({
    where: { tokenHash },
    select: { id: true, tenantId: true, maxUses: true },
  });
  if (!token) return null;

  const now = new Date();
  const consumed = await prisma.deviceEnrollmentToken.updateMany({
    where: {
      id: token.id,
      status: "active",
      expiresAt: { gt: now },
      useCount: { lt: token.maxUses },
    },
    data: { useCount: { increment: 1 } },
  });
  if (consumed.count !== 1) return null;

  // Flip to `consumed` once the final use is taken.
  const fresh = await prisma.deviceEnrollmentToken.findUnique({
    where: { id: token.id },
    select: { useCount: true, maxUses: true },
  });
  if (fresh && fresh.useCount >= fresh.maxUses) {
    await prisma.deviceEnrollmentToken.update({
      where: { id: token.id },
      data: { status: "consumed", consumedAt: now },
    });
  }

  return { tokenId: token.id, tenantId: token.tenantId };
}

// ── Enrollment ──────────────────────────────────────────────────────

export interface EnrollDeviceInput {
  tenantId: string;
  platform: DevicePlatform;
  hostname?: string | null;
  hardwareId?: string | null;
  osVersion?: string | null;
  agentVersion?: string | null;
  enrolledByUserId?: string | null;
  enrollmentTokenId?: string | null;
}

export interface EnrollDeviceResult {
  deviceId: string;
  deviceSecret: string;
  secretKeyId: number;
  checkInIntervalSeconds: number;
  reused: boolean;
}

/**
 * Create (or, for a known hardwareId, re-enroll) a device and return its
 * one-time raw secret. Re-enrollment reuses the existing Computer Asset and
 * rotates the secret rather than spawning a duplicate asset after an OS
 * reinstall. Writes use the base client with an explicit `tenantId` (taken
 * from the authenticated context, never client input) — the same pattern
 * the internal evidence path uses.
 */
export async function enrollDevice(input: EnrollDeviceInput): Promise<EnrollDeviceResult> {
  const secret = generateDeviceSecret();
  const secretEnc = encryptString(secret);
  const computerName = input.hostname?.trim() || `${input.platform} device`;

  if (input.hardwareId) {
    const existing = await prisma.device.findFirst({
      where: { tenantId: input.tenantId, hardwareId: input.hardwareId },
      select: { id: true },
    });
    if (existing) {
      const updated = await prisma.device.update({
        where: { id: existing.id },
        data: {
          secretEnc,
          secretKeyId: { increment: 1 },
          status: "pending",
          platform: input.platform,
          osVersion: input.osVersion ?? null,
          agentVersion: input.agentVersion ?? null,
          hostname: input.hostname ?? null,
          enrolledById: input.enrolledByUserId ?? null,
          enrollmentTokenId: input.enrollmentTokenId ?? null,
          enrolledAt: new Date(),
        },
        select: { id: true, secretKeyId: true, checkInIntervalSeconds: true },
      });
      return {
        deviceId: updated.id,
        deviceSecret: secret,
        secretKeyId: updated.secretKeyId,
        checkInIntervalSeconds: updated.checkInIntervalSeconds,
        reused: true,
      };
    }
  }

  const device = await prisma.$transaction(async (tx) => {
    const asset = await tx.asset.create({
      data: {
        tenantId: input.tenantId,
        name: computerName,
        type: "hardware",
        ownerId: input.enrolledByUserId ?? null,
        metadata: {
          category: "computer",
          hostname: input.hostname ?? null,
          serialNumber: input.hardwareId ?? null,
          managedBy: "trustalo-device-agent",
        } as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });
    return tx.device.create({
      data: {
        tenantId: input.tenantId,
        assetId: asset.id,
        secretEnc,
        platform: input.platform,
        osVersion: input.osVersion ?? null,
        agentVersion: input.agentVersion ?? null,
        hostname: input.hostname ?? null,
        hardwareId: input.hardwareId ?? null,
        status: "pending",
        enrolledById: input.enrolledByUserId ?? null,
        enrollmentTokenId: input.enrollmentTokenId ?? null,
      },
      select: { id: true, secretKeyId: true, checkInIntervalSeconds: true },
    });
  });

  return {
    deviceId: device.id,
    deviceSecret: secret,
    secretKeyId: device.secretKeyId,
    checkInIntervalSeconds: device.checkInIntervalSeconds,
    reused: false,
  };
}

/** Rotate a device's per-device secret; returns the new raw secret once. */
export async function rotateDeviceSecret(
  tenantId: string,
  deviceId: string,
): Promise<{ secret: string; secretKeyId: number } | null> {
  const existing = await prisma.device.findFirst({
    where: { id: deviceId, tenantId },
    select: { id: true },
  });
  if (!existing) return null;
  const secret = generateDeviceSecret();
  const updated = await prisma.device.update({
    where: { id: deviceId },
    data: { secretEnc: encryptString(secret), secretKeyId: { increment: 1 } },
    select: { secretKeyId: true },
  });
  return { secret, secretKeyId: updated.secretKeyId };
}

// ── Check-in ────────────────────────────────────────────────────────

export interface CheckInSignals {
  diskEncryption: SignalState;
  firewall: SignalState;
  screenLock: SignalState;
  antivirus: SignalState;
  agentHealthy: boolean;
}

export interface CheckInInput {
  collectedAt: Date;
  osVersion?: string | null;
  agentVersion?: string | null;
  signals: CheckInSignals;
  raw?: Record<string, unknown> | null;
}

export interface CheckInResult {
  status: string;
  nextCheckInSeconds: number;
  evidenceCreated: number;
}

/**
 * Record a posture check-in: update the device's inline (live) posture +
 * append a history snapshot, then emit advisory Evidence for any signal that
 * CHANGED state since the last check-in (a fresh `fail` is a finding; a fresh
 * `pass` is positive proof). Emitting only on transition keeps the review
 * queue meaningful under hourly heartbeats without needing a unique index.
 */
export async function recordCheckIn(
  deviceId: string,
  tenantId: string,
  input: CheckInInput,
): Promise<CheckInResult> {
  const prev = await prisma.device.findUnique({
    where: { id: deviceId },
    select: {
      diskEncryption: true,
      firewall: true,
      screenLock: true,
      antivirus: true,
      agentHealthy: true,
      hostname: true,
      checkInIntervalSeconds: true,
    },
  });

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.device.update({
      where: { id: deviceId },
      data: {
        status: "active",
        lastSeenAt: now,
        lastPostureAt: input.collectedAt,
        diskEncryption: input.signals.diskEncryption,
        firewall: input.signals.firewall,
        screenLock: input.signals.screenLock,
        antivirus: input.signals.antivirus,
        agentHealthy: input.signals.agentHealthy,
        osVersion: input.osVersion ?? undefined,
        agentVersion: input.agentVersion ?? undefined,
        latestPosture: (input.raw ?? input.signals) as unknown as Prisma.InputJsonValue,
      },
    });
    await tx.devicePostureSnapshot.create({
      data: {
        tenantId,
        deviceId,
        diskEncryption: input.signals.diskEncryption,
        firewall: input.signals.firewall,
        screenLock: input.signals.screenLock,
        antivirus: input.signals.antivirus,
        agentHealthy: input.signals.agentHealthy,
        osVersion: input.osVersion ?? null,
        agentVersion: input.agentVersion ?? null,
        raw: input.raw ? (input.raw as Prisma.InputJsonValue) : undefined,
        collectedAt: input.collectedAt,
      },
    });
  });

  // Determine which signals transitioned.
  const hostname = prev?.hostname ?? deviceId;
  const transitions: {
    key: string;
    label: string;
    oldState: SignalState;
    newState: SignalState;
  }[] = [];
  for (const sig of POSTURE_SIGNALS) {
    const oldState = (prev?.[sig.field] as SignalState | undefined) ?? "unknown";
    const newState = input.signals[sig.field];
    if (newState !== oldState)
      transitions.push({ key: sig.key, label: sig.label, oldState, newState });
  }
  const oldHealth: SignalState = prev ? (prev.agentHealthy ? "pass" : "fail") : "unknown";
  const newHealth: SignalState = input.signals.agentHealthy ? "pass" : "fail";
  if (newHealth !== oldHealth) {
    transitions.push({
      key: AGENT_HEALTH_KEY,
      label: "Agent health",
      oldState: oldHealth,
      newState: newHealth,
    });
  }

  let evidenceCreated = 0;
  if (transitions.length > 0) {
    const items = await buildEvidenceItems(
      tenantId,
      deviceId,
      hostname,
      input.collectedAt,
      transitions,
    );
    if (items.length > 0) {
      const result = await createAutomatedEvidence(tenantId, items);
      evidenceCreated = result.created;
    }
  }

  void AuditLog.create({
    tenantId,
    action: "update",
    resource: "Device",
    resourceId: deviceId,
    details: {
      transition: "check_in",
      signals: input.signals,
      osVersion: input.osVersion ?? null,
      agentVersion: input.agentVersion ?? null,
      transitionedSignals: transitions.map((t) => ({
        key: t.key,
        from: t.oldState,
        to: t.newState,
      })),
      evidenceCreated,
    },
  }).catch((err) => console.error("[devices] check-in audit log failed:", err));

  return {
    status: "active",
    nextCheckInSeconds: prev?.checkInIntervalSeconds ?? 3600,
    evidenceCreated,
  };
}

function severityFor(key: string, state: SignalState): Severity {
  if (state === "fail") return SIGNAL_SEVERITY[key] ?? "medium";
  if (state === "pass") return "info";
  return "low";
}

async function buildEvidenceItems(
  tenantId: string,
  deviceId: string,
  hostname: string,
  collectedAt: Date,
  transitions: { key: string; label: string; oldState: SignalState; newState: SignalState }[],
): Promise<AutomatedEvidenceItem[]> {
  // Resolve every transitioned signal's refs in one batched call.
  const allRefs = transitions.flatMap((t) => SIGNAL_REFS[t.key] ?? []);
  const resolved = allRefs.length ? await resolveFrameworkRefs(tenantId, allRefs) : [];
  const controlIdsByRefKey = new Map(
    resolved.map((r) => [`${r.framework}::${r.requirement}`, r.controlIds]),
  );

  return transitions.map((t) => {
    const refs = SIGNAL_REFS[t.key] ?? [];
    const controlIds = [
      ...new Set(
        refs.flatMap((r) => controlIdsByRefKey.get(`${r.framework}::${r.requirement}`) ?? []),
      ),
    ];
    return {
      title: `${t.label}: ${t.newState.toUpperCase()}`,
      description: `Device "${hostname}" reported ${t.label.toLowerCase()} = ${t.newState} (was ${t.oldState}) at ${collectedAt.toISOString()}.`,
      manifestKey: t.key,
      sourceId: deviceId,
      rawData: {
        signal: t.key,
        state: t.newState,
        previousState: t.oldState,
        hostname,
      },
      severity: severityFor(t.key, t.newState),
      controlIds,
      collectedAt,
    } satisfies AutomatedEvidenceItem;
  });
}

// ── Stale-device sweep ──────────────────────────────────────────────

/**
 * Flip `active` devices that have missed STALE_INTERVAL_FACTOR heartbeats to
 * `stale`, raise a `device.agent_health` advisory finding for each (absence
 * of signal is itself a finding), and prune expired replay nonces. Safe to
 * run on an interval; returns counts for logging.
 */
export async function sweepStaleDevices(): Promise<{ markedStale: number; noncesPruned: number }> {
  const now = new Date();

  const candidates = await prisma.device.findMany({
    where: { status: "active", lastSeenAt: { not: null } },
    select: {
      id: true,
      tenantId: true,
      hostname: true,
      lastSeenAt: true,
      checkInIntervalSeconds: true,
    },
  });

  const stale = candidates.filter(
    (d) =>
      d.lastSeenAt !== null &&
      now.getTime() - d.lastSeenAt.getTime() >
        d.checkInIntervalSeconds * STALE_INTERVAL_FACTOR * 1000,
  );

  for (const d of stale) {
    await prisma.device.update({ where: { id: d.id }, data: { status: "stale" } });
    const refs = SIGNAL_REFS[AGENT_HEALTH_KEY] ?? [];
    const resolved = refs.length ? await resolveFrameworkRefs(d.tenantId, refs) : [];
    const controlIds = [...new Set(resolved.flatMap((r) => r.controlIds))];
    await createAutomatedEvidence(d.tenantId, [
      {
        title: "Agent health: FAIL",
        description: `Device "${d.hostname ?? d.id}" stopped reporting; last seen ${d.lastSeenAt?.toISOString() ?? "never"}. Marked stale.`,
        manifestKey: AGENT_HEALTH_KEY,
        sourceId: d.id,
        rawData: { signal: AGENT_HEALTH_KEY, state: "fail", reason: "missed_heartbeats" },
        severity: SIGNAL_SEVERITY[AGENT_HEALTH_KEY] ?? "medium",
        controlIds,
        collectedAt: now,
      },
    ]);
    void AuditLog.create({
      tenantId: d.tenantId,
      action: "update",
      resource: "Device",
      resourceId: d.id,
      details: { transition: "marked_stale", lastSeenAt: d.lastSeenAt?.toISOString() ?? null },
    }).catch((err) => console.error("[devices] stale audit log failed:", err));
  }

  const pruned = await prisma.deviceNonce.deleteMany({
    where: { seenAt: { lt: new Date(now.getTime() - NONCE_RETENTION_MS) } },
  });

  return { markedStale: stale.length, noncesPruned: pruned.count };
}
