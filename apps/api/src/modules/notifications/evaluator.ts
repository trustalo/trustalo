/**
 * Periodic alert-rule evaluator.
 *
 * Every tick (NOTIFICATIONS_EVALUATOR_INTERVAL_MS, default 5 min) it walks
 * the active tenants, evaluates each ENABLED alert rule against existing
 * state, and fans new alerts out to every enabled channel. Design points:
 *
 *  - READ-ONLY over other modules' tables. Alerting scans state; it never
 *    hooks into domain writes, so other modules stay unaware of it.
 *  - Deduped via NotificationDelivery.dedupeKey: each key embeds the rule,
 *    the entity id, and (where the data supports it) a condition-generation
 *    component — e.g. the background check's expiry date — so a persisting
 *    condition alerts once, while a renewed-then-re-expiring one alerts
 *    again.
 *  - Cheap: every query is an indexed, tenant-scoped lookup; the per-rule
 *    evaluators are pure functions over the fetched rows (unit-tested with
 *    fixtures).
 *  - Fail-soft: a channel/network/collector failure marks the delivery
 *    `failed` (and is audit-logged best-effort) but never crashes the tick.
 */

import { createHash } from "node:crypto";
import { prisma, prismaWithTenant } from "../../db/prisma.js";
import { listConnectionsForOrg } from "../../lib/collector-client.js";
import { AuditLog } from "../../mongodb/models/index.js";
import { failingRequiredSignals, DEFAULT_REQUIRED_SIGNALS } from "../devices/service.js";
import { ensureAlertRules, RULE_LABELS, type RuleKey } from "./service.js";
import { deliverToChannel, type AlertMessage, type DeliverableChannel } from "./channels/index.js";

// GDPR Art. 33: notify the supervisory authority within 72 hours of
// becoming aware of a personal-data breach. Incident rows carry no explicit
// deadline column, so the evaluator derives it from detection time.
const BREACH_CLOCK_HOURS = 72;

export interface CandidateAlert {
  dedupeKey: string;
  summary: string;
  linkPath: string;
}

// ── Pure per-rule evaluators (fixture-tested) ───────────────────────

const SEVERITY_ORDER = ["low", "medium", "high", "critical"] as const;

function severityAtLeast(severity: string, min: string): boolean {
  return SEVERITY_ORDER.indexOf(severity as never) >= SEVERITY_ORDER.indexOf(min as never);
}

/**
 * control_failing — Control.status has no failure state and no transition
 * history, so the honest "a control regressed / is at risk" signal in this
 * schema is an UNRESOLVED ControlWeakness row (status open/triaging/
 * remediating) at or above the configured severity. Each weakness alerts
 * once (dedupe on its id); closing and re-opening a weakness creates a new
 * row, hence a new alert.
 */
export function evaluateControlFailing(
  weaknesses: Array<{ id: string; title: string; severity: string; status: string }>,
  config: { minSeverity?: string },
): CandidateAlert[] {
  const minSeverity = config.minSeverity ?? "medium";
  return weaknesses
    .filter((w) => severityAtLeast(w.severity, minSeverity))
    .map((w) => ({
      dedupeKey: `control_failing:${w.id}`,
      summary: `Control weakness "${w.title}" (${w.severity}) is ${w.status}`,
      linkPath: "/controls",
    }));
}

/**
 * integration_sync_failed — the collector owns connection state; the
 * evaluator reads its per-tenant connection summaries and alerts on any
 * ACTIVE connection whose status is `error` (the collector sets that when
 * the latest sync/collection run failed). Dedupe is per connection; the
 * key has no generation component, so a connection that recovers and later
 * fails again re-alerts only after the ledger row ages out of relevance —
 * an accepted v1 simplification (the status carries no failure timestamp).
 */
export function evaluateIntegrationSyncFailed(
  connections: Array<{
    id: string;
    name: string;
    status: string;
    isActive: boolean;
    provider: { slug: string; name: string };
  }>,
): CandidateAlert[] {
  return connections
    .filter((c) => c.isActive && c.status === "error")
    .map((c) => ({
      dedupeKey: `integration_sync_failed:${c.id}`,
      summary: `Integration sync failing for ${c.provider.name} connection "${c.name}"`,
      linkPath: "/integrations",
    }));
}

/**
 * device_at_risk — a device alerts when it has gone `stale` (missed its
 * heartbeat window; the device sweep flips the status) or when any posture
 * signal the tenant EVALUATES (Settings → evaluated posture signals) is
 * failing. The dedupe key embeds the sorted failing-signal set + staleness,
 * so a device that recovers and later fails in a different way re-alerts.
 */
export function evaluateDeviceAtRisk(
  devices: Array<{
    id: string;
    hostname: string | null;
    platform: string;
    status: string;
    diskEncryption: string;
    firewall: string;
    screenLock: string;
    antivirus: string;
    latestPosture?: unknown;
  }>,
  requiredSignals: string[],
): CandidateAlert[] {
  const alerts: CandidateAlert[] = [];
  for (const device of devices) {
    const failing = failingRequiredSignals(device, requiredSignals);
    const stale = device.status === "stale";
    if (failing.length === 0 && !stale) continue;
    const parts = [...failing].sort();
    if (stale) parts.push("stale");
    const label = device.hostname ?? `${device.platform} device`;
    const reasons = [
      ...(stale ? ["missed check-ins (stale)"] : []),
      ...(failing.length > 0 ? [`failing: ${[...failing].sort().join(", ")}`] : []),
    ].join("; ");
    alerts.push({
      dedupeKey: `device_at_risk:${device.id}:${parts.join("|")}`,
      summary: `Device "${label}" is at risk — ${reasons}`,
      linkPath: "/devices",
    });
  }
  return alerts;
}

/**
 * device_malware_detected — the agent's endpoint-protection providers report
 * detections inside `latestPosture.avDetail` (product-agnostic: ClamAV's
 * VirusEvent hook + scheduled scans today, other products later). One alert
 * per distinct detection — the dedupe key hashes product|signature|file|
 * detectedAt, so a persisting detection alerts once while a new hit on the
 * same device alerts again. A scan-level fallback covers the edge where a
 * scan reports infections but the per-detection list is empty (its dedupe key
 * embeds the scan timestamp as the generation component).
 */
export function evaluateDeviceMalware(
  devices: Array<{
    id: string;
    hostname: string | null;
    platform: string;
    latestPosture?: unknown;
  }>,
): CandidateAlert[] {
  const alerts: CandidateAlert[] = [];
  for (const device of devices) {
    const raw =
      device.latestPosture && typeof device.latestPosture === "object"
        ? (device.latestPosture as Record<string, unknown>)
        : {};
    const detail =
      raw.avDetail && typeof raw.avDetail === "object"
        ? (raw.avDetail as Record<string, unknown>)
        : null;
    if (!detail) continue;

    const label = device.hostname ?? `${device.platform} device`;
    const product = typeof detail.product === "string" ? detail.product : "unknown";
    const detections = Array.isArray(detail.recentDetections) ? detail.recentDetections : [];

    let reported = 0;
    for (const entry of detections) {
      if (!entry || typeof entry !== "object") continue;
      const d = entry as Record<string, unknown>;
      const signature = typeof d.signature === "string" ? d.signature : "";
      if (signature === "") continue;
      const file = typeof d.file === "string" ? d.file : "";
      const detectedAt = typeof d.detectedAt === "string" ? d.detectedAt : "";
      const fingerprint = createHash("sha256")
        .update(`${product}|${signature}|${file}|${detectedAt}`)
        .digest("hex")
        .slice(0, 32);
      alerts.push({
        dedupeKey: `device_malware_detected:${device.id}:${fingerprint}`,
        summary: `Malware detected on "${label}": ${signature}${file ? ` in ${file}` : ""} (${product})`,
        linkPath: "/devices",
      });
      reported += 1;
    }

    const infectedCount = typeof detail.infectedCount === "number" ? detail.infectedCount : 0;
    if (reported === 0 && detail.lastScanResult === "infected" && infectedCount > 0) {
      const scanAt = typeof detail.lastScanAt === "string" ? detail.lastScanAt : "unknown";
      alerts.push({
        dedupeKey: `device_malware_detected:${device.id}:scan:${scanAt}`,
        summary: `Malware detected on "${label}": scan found ${infectedCount} infected file(s) (${product})`,
        linkPath: "/devices",
      });
    }
  }
  return alerts;
}

/**
 * person_offboarding_incomplete — a Person whose status is `offboarded`
 * still has `pending` offboarding checklist items, and the offboarding is
 * older than the configured number of days (endDate when set, else the
 * oldest pending offboarding item's creation time). Dedupe is per person.
 */
export function evaluateOffboardingIncomplete(
  people: Array<{
    personId: string;
    fullName: string;
    endDate: Date | null;
    oldestPendingCreatedAt: Date;
    pendingCount: number;
  }>,
  config: { olderThanDays?: number },
  now: Date,
): CandidateAlert[] {
  const olderThanDays = config.olderThanDays ?? 7;
  const cutoff = now.getTime() - olderThanDays * 24 * 60 * 60 * 1000;
  return people
    .filter((p) => (p.endDate ?? p.oldestPendingCreatedAt).getTime() <= cutoff)
    .map((p) => ({
      dedupeKey: `person_offboarding_incomplete:${p.personId}`,
      summary: `${p.fullName} was offboarded over ${olderThanDays} day(s) ago with ${p.pendingCount} offboarding item(s) still open`,
      linkPath: "/people",
    }));
}

/**
 * background_check_expiring — a cleared (or already-expired) background
 * check whose expiresAt falls within the configured window. The dedupe key
 * embeds the expiry date, so renewing the check (new expiresAt) re-arms
 * the alert for the next cycle.
 */
export function evaluateBackgroundCheckExpiring(
  checks: Array<{
    id: string;
    type: string;
    status: string;
    expiresAt: Date | null;
    personName: string;
  }>,
  config: { thresholdDays?: number },
  now: Date,
): CandidateAlert[] {
  const thresholdDays = config.thresholdDays ?? 30;
  const windowEnd = now.getTime() + thresholdDays * 24 * 60 * 60 * 1000;
  return checks
    .filter(
      (c) =>
        c.expiresAt !== null &&
        c.expiresAt.getTime() <= windowEnd &&
        (c.status === "cleared" || c.status === "expired"),
    )
    .map((c) => {
      const expired = c.expiresAt!.getTime() <= now.getTime();
      return {
        dedupeKey: `background_check_expiring:${c.id}:${c.expiresAt!.toISOString()}`,
        summary: `${c.personName}'s ${c.type} background check ${expired ? "has expired" : `expires on ${c.expiresAt!.toISOString().slice(0, 10)}`}`,
        linkPath: "/people",
      };
    });
}

/**
 * training_overdue — an assignment (TrainingCompletion) that is not
 * `completed` while its program's due date is more than `graceDays` in the
 * past. The dedupe key embeds the due date, so the next training cycle
 * (new due date) re-arms the alert.
 */
export function evaluateTrainingOverdue(
  completions: Array<{
    id: string;
    status: string;
    userName: string;
    programTitle: string;
    dueDate: Date | null;
  }>,
  config: { graceDays?: number },
  now: Date,
): CandidateAlert[] {
  const graceDays = config.graceDays ?? 0;
  const cutoff = now.getTime() - graceDays * 24 * 60 * 60 * 1000;
  return completions
    .filter((c) => c.status !== "completed" && c.dueDate !== null && c.dueDate.getTime() <= cutoff)
    .map((c) => ({
      dedupeKey: `training_overdue:${c.id}:${c.dueDate!.toISOString()}`,
      summary: `${c.userName} has not completed "${c.programTitle}" (due ${c.dueDate!.toISOString().slice(0, 10)})`,
      linkPath: "/training",
    }));
}

/**
 * incident_breach_clock — two sources share the rule because both carry a
 * regulatory notification clock:
 *   • Incident rows flagged `regulatoryNotificationRequired` and not yet
 *     notified: the model stores no deadline, so the evaluator derives
 *     GDPR's 72h from `detectedAt` (falling back to `createdAt`).
 *   • DataBreach rows (privacy module) flagged for supervisory-authority
 *     notification and not yet notified: these store an explicit
 *     `notificationDeadlineAt` (Art. 33 72h snapshot), which is used as-is.
 * Alerts fire when the deadline is within `thresholdHours` (or already
 * missed). Dedupe is per entity — the clock only runs once per incident.
 */
export function evaluateBreachClock(
  incidents: Array<{
    id: string;
    title: string;
    detectedAt: Date | null;
    createdAt: Date;
  }>,
  breaches: Array<{ id: string; title: string; notificationDeadlineAt: Date }>,
  config: { thresholdHours?: number },
  now: Date,
): CandidateAlert[] {
  const thresholdHours = config.thresholdHours ?? 24;
  const horizon = now.getTime() + thresholdHours * 60 * 60 * 1000;
  const alerts: CandidateAlert[] = [];

  for (const incident of incidents) {
    const deadline =
      (incident.detectedAt ?? incident.createdAt).getTime() + BREACH_CLOCK_HOURS * 60 * 60 * 1000;
    if (deadline > horizon) continue;
    const overdue = deadline <= now.getTime();
    alerts.push({
      dedupeKey: `incident_breach_clock:incident:${incident.id}`,
      summary: `Regulatory notification for incident "${incident.title}" is ${overdue ? "OVERDUE" : `due within ${thresholdHours}h`} (72h clock)`,
      linkPath: "/incidents",
    });
  }
  for (const breach of breaches) {
    if (breach.notificationDeadlineAt.getTime() > horizon) continue;
    const overdue = breach.notificationDeadlineAt.getTime() <= now.getTime();
    alerts.push({
      dedupeKey: `incident_breach_clock:breach:${breach.id}`,
      summary: `Supervisory-authority notification for data breach "${breach.title}" is ${overdue ? "OVERDUE" : `due within ${thresholdHours}h`}`,
      linkPath: "/privacy",
    });
  }
  return alerts;
}

// ── Tenant tick orchestration ───────────────────────────────────────

/**
 * The narrow, structural slice of the tenant-scoped Prisma client the tick
 * uses. Kept loose (`any` args) so tests can drive the tick with a plain
 * in-memory fake instead of a database.
 */
export interface TenantTickDb {
  alertRule: {
    findMany(args: any): Promise<any[]>;
    createMany(args: any): Promise<unknown>;
  };
  notificationChannel: { findMany(args: any): Promise<any[]> };
  notificationDelivery: {
    findMany(args: any): Promise<any[]>;
    createMany(args: any): Promise<unknown>;
  };
  controlWeakness: { findMany(args: any): Promise<any[]> };
  device: { findMany(args: any): Promise<any[]> };
  tenantSettings: { findFirst(args: any): Promise<any | null> };
  personChecklistItem: { findMany(args: any): Promise<any[]> };
  backgroundCheck: { findMany(args: any): Promise<any[]> };
  trainingCompletion: { findMany(args: any): Promise<any[]> };
  incident: { findMany(args: any): Promise<any[]> };
  dataBreach: { findMany(args: any): Promise<any[]> };
}

export interface TenantTickDeps {
  db: TenantTickDb;
  tenant: { id: string; name: string };
  /** Collector lookup; may reject (collector down) — the rule is skipped. */
  listConnections: (tenantId: string) => Promise<
    Array<{
      id: string;
      name: string;
      status: string;
      isActive: boolean;
      provider: { slug: string; name: string };
    }>
  >;
  deliver: (channel: DeliverableChannel, message: AlertMessage) => Promise<void>;
  now: () => Date;
}

export interface TenantTickResult {
  sent: number;
  failed: number;
  suppressed: number;
}

async function collectCandidates(
  ruleKey: RuleKey,
  config: Record<string, unknown>,
  deps: TenantTickDeps,
): Promise<CandidateAlert[]> {
  const { db, tenant } = deps;
  const now = deps.now();
  switch (ruleKey) {
    case "control_failing": {
      const weaknesses = await db.controlWeakness.findMany({
        where: { status: { in: ["open", "triaging", "remediating"] } },
        select: { id: true, title: true, severity: true, status: true },
      });
      return evaluateControlFailing(weaknesses, config as { minSeverity?: string });
    }
    case "integration_sync_failed": {
      const connections = await deps.listConnections(tenant.id);
      return evaluateIntegrationSyncFailed(connections);
    }
    case "device_at_risk": {
      const [settings, devices] = await Promise.all([
        db.tenantSettings.findFirst({ select: { devicePostureRequiredSignals: true } }),
        db.device.findMany({
          where: { status: { in: ["active", "stale"] } },
          select: {
            id: true,
            hostname: true,
            platform: true,
            status: true,
            diskEncryption: true,
            firewall: true,
            screenLock: true,
            antivirus: true,
            latestPosture: true,
          },
        }),
      ]);
      const requiredSignals = settings?.devicePostureRequiredSignals ?? [
        ...DEFAULT_REQUIRED_SIGNALS,
      ];
      return evaluateDeviceAtRisk(devices, requiredSignals);
    }
    case "device_malware_detected": {
      const devices = await db.device.findMany({
        where: { status: { in: ["active", "stale"] } },
        select: { id: true, hostname: true, platform: true, latestPosture: true },
      });
      return evaluateDeviceMalware(devices);
    }
    case "person_offboarding_incomplete": {
      // Person is deliberately NOT auto-tenant-scoped (login resolves it
      // across tenants), so the relation filter carries tenantId explicitly.
      const items = await db.personChecklistItem.findMany({
        where: {
          kind: "offboarding",
          status: "pending",
          person: { status: "offboarded", tenantId: tenant.id },
        },
        select: {
          createdAt: true,
          person: { select: { id: true, fullName: true, endDate: true } },
        },
      });
      const byPerson = new Map<
        string,
        {
          personId: string;
          fullName: string;
          endDate: Date | null;
          oldestPendingCreatedAt: Date;
          pendingCount: number;
        }
      >();
      for (const item of items) {
        const existing = byPerson.get(item.person.id);
        if (existing) {
          existing.pendingCount += 1;
          if (item.createdAt < existing.oldestPendingCreatedAt) {
            existing.oldestPendingCreatedAt = item.createdAt;
          }
        } else {
          byPerson.set(item.person.id, {
            personId: item.person.id,
            fullName: item.person.fullName,
            endDate: item.person.endDate,
            oldestPendingCreatedAt: item.createdAt,
            pendingCount: 1,
          });
        }
      }
      return evaluateOffboardingIncomplete(
        [...byPerson.values()],
        config as { olderThanDays?: number },
        now,
      );
    }
    case "background_check_expiring": {
      const thresholdDays = (config.thresholdDays as number | undefined) ?? 30;
      const checks = await db.backgroundCheck.findMany({
        where: {
          status: { in: ["cleared", "expired"] },
          expiresAt: { not: null, lte: new Date(now.getTime() + thresholdDays * 86_400_000) },
        },
        select: {
          id: true,
          type: true,
          status: true,
          expiresAt: true,
          person: { select: { fullName: true } },
        },
      });
      return evaluateBackgroundCheckExpiring(
        checks.map((c) => ({ ...c, personName: c.person.fullName })),
        config as { thresholdDays?: number },
        now,
      );
    }
    case "training_overdue": {
      const completions = await db.trainingCompletion.findMany({
        where: {
          status: { in: ["assigned", "in_progress", "overdue"] },
          trainingProgram: { dueDate: { not: null, lt: now } },
        },
        select: {
          id: true,
          status: true,
          user: { select: { name: true } },
          trainingProgram: { select: { title: true, dueDate: true } },
        },
      });
      return evaluateTrainingOverdue(
        completions.map((c) => ({
          id: c.id,
          status: c.status,
          userName: c.user.name,
          programTitle: c.trainingProgram.title,
          dueDate: c.trainingProgram.dueDate,
        })),
        config as { graceDays?: number },
        now,
      );
    }
    case "incident_breach_clock": {
      const [incidents, breaches] = await Promise.all([
        db.incident.findMany({
          where: {
            regulatoryNotificationRequired: true,
            regulatoryNotifiedAt: null,
            status: { in: ["reported", "investigating", "contained"] },
          },
          select: { id: true, title: true, detectedAt: true, createdAt: true },
        }),
        db.dataBreach.findMany({
          where: {
            supervisoryAuthorityNotificationRequired: true,
            supervisoryAuthorityNotifiedAt: null,
            status: { in: ["open", "investigating", "contained"] },
          },
          select: { id: true, title: true, notificationDeadlineAt: true },
        }),
      ]);
      return evaluateBreachClock(incidents, breaches, config as { thresholdHours?: number }, now);
    }
  }
}

/**
 * Evaluate every enabled rule for one tenant and deliver new (non-deduped)
 * alerts to every enabled channel. Exposed for tests; `runEvaluatorTick`
 * wires the production deps.
 */
export async function runTenantTick(deps: TenantTickDeps): Promise<TenantTickResult> {
  const { db, tenant } = deps;
  const result: TenantTickResult = { sent: 0, failed: 0, suppressed: 0 };

  const channels = (await db.notificationChannel.findMany({
    where: { enabled: true },
    select: { id: true, type: true, name: true, configEnc: true },
  })) as DeliverableChannel[];
  // No destinations — evaluating would only build a backlog nobody sees.
  if (channels.length === 0) return result;

  const rules = await ensureAlertRules(db, tenant.id);

  for (const rule of rules) {
    if (!rule.enabled) continue;
    let candidates: CandidateAlert[];
    try {
      candidates = await collectCandidates(rule.ruleKey, rule.config, deps);
    } catch (err) {
      // A single rule failing (e.g. collector unreachable) must not stall
      // the rest of the tick.
      console.warn(
        `[notifications] rule ${rule.ruleKey} evaluation failed for tenant ${tenant.id}:`,
        err instanceof Error ? err.message : err,
      );
      continue;
    }
    if (candidates.length === 0) continue;

    // Dedupe: any existing delivery row (sent or failed) suppresses the key.
    const existing = await db.notificationDelivery.findMany({
      where: { dedupeKey: { in: candidates.map((c) => c.dedupeKey) } },
      select: { dedupeKey: true },
    });
    const seen = new Set(existing.map((d) => d.dedupeKey));
    const fresh = candidates.filter((c) => !seen.has(c.dedupeKey));
    result.suppressed += candidates.length - fresh.length;
    if (fresh.length === 0) continue;

    const deliveryRows: Array<{
      tenantId: string;
      ruleKey: RuleKey;
      dedupeKey: string;
      channelId: string;
      status: "sent" | "failed";
      summary: string;
    }> = [];

    for (const alert of fresh) {
      const message: AlertMessage = {
        ruleKey: rule.ruleKey,
        ruleLabel: RULE_LABELS[rule.ruleKey],
        summary: alert.summary,
        tenantName: tenant.name,
        linkPath: alert.linkPath,
      };
      for (const channel of channels) {
        let status: "sent" | "failed" = "sent";
        try {
          await deps.deliver(channel, message);
          result.sent += 1;
        } catch (err) {
          status = "failed";
          result.failed += 1;
          console.warn(
            `[notifications] delivery to channel ${channel.id} (${channel.type}) failed:`,
            err instanceof Error ? err.message : err,
          );
          // Best-effort audit trail for the failed outbound call.
          void AuditLog.create({
            tenantId: tenant.id,
            userId: "system:notifications",
            action: "update",
            resource: "NotificationDelivery",
            resourceId: channel.id,
            details: {
              transition: "delivery_failed",
              ruleKey: rule.ruleKey,
              channelType: channel.type,
              error: err instanceof Error ? err.message : String(err),
            },
          }).catch(() => {});
        }
        deliveryRows.push({
          tenantId: tenant.id,
          ruleKey: rule.ruleKey,
          dedupeKey: alert.dedupeKey,
          channelId: channel.id,
          status,
          summary: alert.summary,
        });
      }
    }

    if (deliveryRows.length > 0) {
      await db.notificationDelivery.createMany({ data: deliveryRows });
    }
  }

  return result;
}

// ── Scheduler (lifecycle-wired in src/index.ts) ─────────────────────

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

function evaluatorIntervalMs(): number {
  const raw = parseInt(process.env.NOTIFICATIONS_EVALUATOR_INTERVAL_MS ?? "", 10);
  return Number.isFinite(raw) && raw >= 15_000 ? raw : DEFAULT_INTERVAL_MS;
}

let handle: ReturnType<typeof setInterval> | null = null;
let ticking = false;

/** One full pass over all active tenants. Exported for ops/debug use. */
export async function runEvaluatorTick(): Promise<void> {
  const tenants = await prisma.tenant.findMany({
    where: { status: "active" },
    select: { id: true, name: true },
  });
  for (const tenant of tenants) {
    try {
      const res = await runTenantTick({
        db: prismaWithTenant(tenant.id) as unknown as TenantTickDb,
        tenant,
        listConnections: listConnectionsForOrg,
        deliver: deliverToChannel,
        now: () => new Date(),
      });
      if (res.sent > 0 || res.failed > 0) {
        console.log(
          `[notifications] tenant ${tenant.id}: ${res.sent} sent, ${res.failed} failed, ${res.suppressed} suppressed`,
        );
      }
    } catch (err) {
      console.error(`[notifications] tick failed for tenant ${tenant.id}:`, err);
    }
  }
}

export async function startNotificationEvaluator(): Promise<void> {
  if (handle) return;
  if (process.env.NOTIFICATIONS_EVALUATOR_DISABLED === "1") {
    console.log("[notifications] evaluator disabled via NOTIFICATIONS_EVALUATOR_DISABLED");
    return;
  }
  const run = () => {
    if (ticking) return; // never overlap slow ticks
    ticking = true;
    runEvaluatorTick()
      .catch((err) => console.error("[notifications] evaluator tick failed:", err))
      .finally(() => {
        ticking = false;
      });
  };
  handle = setInterval(run, evaluatorIntervalMs());
  // Don't keep the event loop alive solely for the evaluator.
  if (typeof handle.unref === "function") handle.unref();
}

export async function stopNotificationEvaluator(): Promise<void> {
  if (handle) {
    clearInterval(handle);
    handle = null;
  }
}
