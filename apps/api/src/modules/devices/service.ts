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
import { resolvePersonForUser } from "../people/service.js";
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
// Append-only posture history (DevicePostureSnapshot) is kept for 1 day, then
// pruned by the sweep. The device keeps its latest inline posture; only the
// drift trail is bounded.
const SNAPSHOT_RETENTION_MS = 24 * 60 * 60 * 1000;

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

// The posture signals a tenant can choose to EVALUATE — a `fail` on one of
// these raises a posture issue / marks the device at-risk (and, for the four
// `column` signals, emits advisory evidence). The first four are first-class
// Device columns; the rest live in the check-in `raw` blob (Device.latestPosture).
export const EVALUABLE_POSTURE_SIGNALS = [
  { key: "diskEncryption", label: "Disk encryption", source: "column" },
  { key: "firewall", label: "Host firewall", source: "column" },
  { key: "screenLock", label: "Screen lock", source: "column" },
  { key: "antivirus", label: "Antivirus / EDR", source: "column" },
  { key: "autoUpdate", label: "Automatic updates", source: "raw" },
  { key: "mdmEnrolled", label: "MDM managed", source: "raw" },
  { key: "gatekeeper", label: "Gatekeeper", source: "raw" },
  { key: "sip", label: "System Integrity Protection", source: "raw" },
] as const;

export const POSTURE_SIGNAL_KEYS: string[] = EVALUABLE_POSTURE_SIGNALS.map((s) => s.key);

// Default evaluated set when a tenant hasn't customised it: the four core
// signals (preserves the original behaviour). Extended signals are optional.
export const DEFAULT_REQUIRED_SIGNALS: string[] = [
  "diskEncryption",
  "firewall",
  "screenLock",
  "antivirus",
];

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

// Default device-agent cadence when a tenant hasn't customised it: 30 minutes.
const DEFAULT_CHECKIN_INTERVAL_SECONDS = 1800;

/**
 * The tenant-configured device check-in cadence (seconds). Set under Settings;
 * read at enrollment (stamped on the Device) and on every check-in (returned as
 * `nextCheckInSeconds` so a change propagates to every agent on its next beat).
 */
async function getTenantCheckInInterval(tenantId: string): Promise<number> {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
    select: { deviceCheckInIntervalSeconds: true },
  });
  return settings?.deviceCheckInIntervalSeconds ?? DEFAULT_CHECKIN_INTERVAL_SECONDS;
}

/**
 * The posture signals this tenant evaluates. A null settings row (tenant never
 * customised) → the default core set; an explicitly empty array → evaluate
 * none (the tenant opted everything to optional).
 */
export async function getTenantRequiredSignals(tenantId: string): Promise<string[]> {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
    select: { devicePostureRequiredSignals: true },
  });
  return settings?.devicePostureRequiredSignals ?? DEFAULT_REQUIRED_SIGNALS;
}

/**
 * Given a device's posture (inline columns + the raw `latestPosture` blob) and
 * the tenant's evaluated-signal set, return the keys that are FAILING and
 * required — i.e. the posture issues. Optional signals (not in the set) are
 * skipped, so a `fail` there never raises an issue. Pure + shared by the people
 * rollup so "at-risk" and the device-drawer "issues" agree.
 */
export function failingRequiredSignals(
  device: {
    diskEncryption: string;
    firewall: string;
    screenLock: string;
    antivirus: string;
    latestPosture?: unknown;
  },
  requiredSignals: Iterable<string>,
): string[] {
  const required = new Set(requiredSignals);
  const raw =
    device.latestPosture && typeof device.latestPosture === "object"
      ? (device.latestPosture as Record<string, unknown>)
      : {};
  const failing: string[] = [];
  for (const sig of EVALUABLE_POSTURE_SIGNALS) {
    if (!required.has(sig.key)) continue;
    const value =
      sig.source === "column" ? (device as Record<string, unknown>)[sig.key] : raw[sig.key];
    if (value === "fail") failing.push(sig.key);
  }
  return failing;
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

  // Resolve the enrolling user → their Person so the device (and its Computer
  // Asset) is attached to a person for the per-person fleet posture rollup.
  const personId = input.enrolledByUserId
    ? await resolvePersonForUser(input.tenantId, input.enrolledByUserId)
    : null;
  // Stamp the tenant-configured cadence onto the device at enrollment.
  const checkInIntervalSeconds = await getTenantCheckInInterval(input.tenantId);

  if (input.hardwareId) {
    const existing = await prisma.device.findFirst({
      where: { tenantId: input.tenantId, hardwareId: input.hardwareId },
      select: { id: true, assetId: true },
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
          checkInIntervalSeconds,
          ...(personId ? { personId } : {}),
        },
        select: { id: true, secretKeyId: true, checkInIntervalSeconds: true },
      });
      if (personId) {
        await prisma.asset.update({
          where: { id: existing.assetId },
          data: { assignedPersonId: personId },
        });
      }
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
        assignedPersonId: personId ?? null,
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
        personId: personId ?? null,
        enrollmentTokenId: input.enrollmentTokenId ?? null,
        checkInIntervalSeconds,
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

  // Live tenant cadence: returned to the agent and synced onto the device row
  // (so a Settings change reaches every agent on its next beat, and stale
  // detection tracks the same interval).
  const interval = await getTenantCheckInInterval(tenantId);

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
        checkInIntervalSeconds: interval,
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

  // Only EVALUATED signals emit advisory evidence. Agent health is always
  // evaluated; a core signal the tenant marked optional no longer produces
  // findings (it's still recorded inline + in the audit log below).
  const requiredFields = new Set(await getTenantRequiredSignals(tenantId));
  const fieldByManifestKey = new Map<string, string>(POSTURE_SIGNALS.map((s) => [s.key, s.field]));
  const evidenceTransitions = transitions.filter((t) => {
    if (t.key === AGENT_HEALTH_KEY) return true;
    const field = fieldByManifestKey.get(t.key);
    return field ? requiredFields.has(field) : true;
  });

  let evidenceCreated = 0;
  if (evidenceTransitions.length > 0) {
    const items = await buildEvidenceItems(
      tenantId,
      deviceId,
      hostname,
      input.collectedAt,
      evidenceTransitions,
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
    nextCheckInSeconds: interval,
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
export async function sweepStaleDevices(): Promise<{
  markedStale: number;
  noncesPruned: number;
  snapshotsPruned: number;
}> {
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

  // Retention: drop posture-history snapshots older than 1 day.
  const snapshots = await prisma.devicePostureSnapshot.deleteMany({
    where: { collectedAt: { lt: new Date(now.getTime() - SNAPSHOT_RETENTION_MS) } },
  });

  return {
    markedStale: stale.length,
    noncesPruned: pruned.count,
    snapshotsPruned: snapshots.count,
  };
}
