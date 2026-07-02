import { describe, expect, test } from "bun:test";
import {
  evaluateBackgroundCheckExpiring,
  evaluateBreachClock,
  evaluateControlFailing,
  evaluateDeviceAtRisk,
  evaluateIntegrationSyncFailed,
  evaluateOffboardingIncomplete,
  evaluateTrainingOverdue,
  runTenantTick,
  type TenantTickDb,
  type TenantTickDeps,
} from "./evaluator.js";
import { encryptChannelConfig } from "./service.js";
import type { AlertMessage, DeliverableChannel } from "./channels/index.js";

const NOW = new Date("2026-07-02T12:00:00.000Z");
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000);
const hours = (n: number) => new Date(NOW.getTime() + n * 3_600_000);

// ── Pure rule evaluators ────────────────────────────────────────────

describe("control_failing", () => {
  const weaknesses = [
    { id: "w1", title: "MFA gap", severity: "high", status: "open" },
    { id: "w2", title: "Log retention", severity: "low", status: "triaging" },
    { id: "w3", title: "Old finding", severity: "critical", status: "closed" },
  ];

  test("alerts on unresolved weaknesses at or above minSeverity", () => {
    // Closed weaknesses are filtered by the query; the evaluator only sees
    // open/triaging/remediating rows — pass what the query would return.
    const open = weaknesses.filter((w) => w.status !== "closed");
    const alerts = evaluateControlFailing(open, { minSeverity: "medium" });
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.dedupeKey).toBe("control_failing:w1");
    expect(alerts[0]!.summary).toContain("MFA gap");
  });

  test("minSeverity low includes everything unresolved", () => {
    const open = weaknesses.filter((w) => w.status !== "closed");
    expect(evaluateControlFailing(open, { minSeverity: "low" })).toHaveLength(2);
  });
});

describe("integration_sync_failed", () => {
  test("alerts only on active connections in error state", () => {
    const alerts = evaluateIntegrationSyncFailed([
      {
        id: "c1",
        name: "prod",
        status: "error",
        isActive: true,
        provider: { slug: "github", name: "GitHub" },
      },
      {
        id: "c2",
        name: "old",
        status: "error",
        isActive: false,
        provider: { slug: "aws", name: "AWS" },
      },
      {
        id: "c3",
        name: "ok",
        status: "connected",
        isActive: true,
        provider: { slug: "aws", name: "AWS" },
      },
    ]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.dedupeKey).toBe("integration_sync_failed:c1");
    expect(alerts[0]!.summary).toContain("GitHub");
  });
});

describe("device_at_risk", () => {
  const healthy = {
    id: "d1",
    hostname: "mbp-jane",
    platform: "macos",
    status: "active",
    diskEncryption: "pass",
    firewall: "pass",
    screenLock: "pass",
    antivirus: "pass",
    latestPosture: null as unknown,
  };

  test("alerts on failing evaluated signals with a signal-set generation key", () => {
    const alerts = evaluateDeviceAtRisk(
      [{ ...healthy, diskEncryption: "fail", firewall: "fail" }],
      ["diskEncryption", "firewall", "screenLock", "antivirus"],
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.dedupeKey).toBe("device_at_risk:d1:diskEncryption|firewall");
    expect(alerts[0]!.summary).toContain("mbp-jane");
  });

  test("ignores failing signals the tenant does not evaluate", () => {
    expect(
      evaluateDeviceAtRisk([{ ...healthy, antivirus: "fail" }], ["diskEncryption"]),
    ).toHaveLength(0);
  });

  test("stale devices alert even with passing posture", () => {
    const alerts = evaluateDeviceAtRisk([{ ...healthy, status: "stale" }], ["diskEncryption"]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.dedupeKey).toBe("device_at_risk:d1:stale");
    expect(alerts[0]!.summary).toContain("stale");
  });

  test("raw-blob signals are evaluated when required", () => {
    const alerts = evaluateDeviceAtRisk(
      [{ ...healthy, latestPosture: { mdmEnrolled: "fail" } }],
      ["mdmEnrolled"],
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.dedupeKey).toBe("device_at_risk:d1:mdmEnrolled");
  });
});

describe("person_offboarding_incomplete", () => {
  test("alerts only when the offboarding is older than the threshold", () => {
    const people = [
      {
        personId: "p1",
        fullName: "Jane Doe",
        endDate: days(-10),
        oldestPendingCreatedAt: days(-10),
        pendingCount: 3,
      },
      {
        personId: "p2",
        fullName: "Fresh Leaver",
        endDate: days(-2),
        oldestPendingCreatedAt: days(-2),
        pendingCount: 1,
      },
    ];
    const alerts = evaluateOffboardingIncomplete(people, { olderThanDays: 7 }, NOW);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.dedupeKey).toBe("person_offboarding_incomplete:p1");
    expect(alerts[0]!.summary).toContain("3 offboarding item(s)");
  });

  test("falls back to the oldest pending item when endDate is unset", () => {
    const alerts = evaluateOffboardingIncomplete(
      [
        {
          personId: "p3",
          fullName: "No End Date",
          endDate: null,
          oldestPendingCreatedAt: days(-8),
          pendingCount: 2,
        },
      ],
      { olderThanDays: 7 },
      NOW,
    );
    expect(alerts).toHaveLength(1);
  });
});

describe("background_check_expiring", () => {
  test("alerts inside the window and embeds the expiry in the dedupe key", () => {
    const alerts = evaluateBackgroundCheckExpiring(
      [
        {
          id: "b1",
          type: "criminal",
          status: "cleared",
          expiresAt: days(10),
          personName: "Jane Doe",
        },
        {
          id: "b2",
          type: "identity",
          status: "cleared",
          expiresAt: days(60),
          personName: "Far Future",
        },
        { id: "b3", type: "credit", status: "cleared", expiresAt: null, personName: "No Expiry" },
      ],
      { thresholdDays: 30 },
      NOW,
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.dedupeKey).toBe(`background_check_expiring:b1:${days(10).toISOString()}`);
    expect(alerts[0]!.summary).toContain("Jane Doe");
  });

  test("already-expired checks say so", () => {
    const alerts = evaluateBackgroundCheckExpiring(
      [
        {
          id: "b4",
          type: "criminal",
          status: "expired",
          expiresAt: days(-1),
          personName: "Jane Doe",
        },
      ],
      {},
      NOW,
    );
    expect(alerts[0]!.summary).toContain("has expired");
  });

  test("a renewed check (new expiresAt) produces a new dedupe generation", () => {
    const first = evaluateBackgroundCheckExpiring(
      [{ id: "b1", type: "criminal", status: "cleared", expiresAt: days(5), personName: "J" }],
      {},
      NOW,
    );
    const renewed = evaluateBackgroundCheckExpiring(
      [{ id: "b1", type: "criminal", status: "cleared", expiresAt: days(20), personName: "J" }],
      {},
      NOW,
    );
    expect(first[0]!.dedupeKey).not.toBe(renewed[0]!.dedupeKey);
  });
});

describe("training_overdue", () => {
  test("alerts on incomplete assignments past due plus grace", () => {
    const rows = [
      {
        id: "t1",
        status: "assigned",
        userName: "Jane",
        programTitle: "Security 101",
        dueDate: days(-3),
      },
      {
        id: "t2",
        status: "completed",
        userName: "Done",
        programTitle: "Security 101",
        dueDate: days(-3),
      },
      {
        id: "t3",
        status: "in_progress",
        userName: "Still Fine",
        programTitle: "Security 101",
        dueDate: days(2),
      },
    ];
    const alerts = evaluateTrainingOverdue(rows, { graceDays: 1 }, NOW);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.dedupeKey).toBe(`training_overdue:t1:${days(-3).toISOString()}`);
  });

  test("grace days suppress freshly-overdue assignments", () => {
    const rows = [
      {
        id: "t4",
        status: "assigned",
        userName: "Jane",
        programTitle: "Security 101",
        dueDate: hours(-12),
      },
    ];
    expect(evaluateTrainingOverdue(rows, { graceDays: 1 }, NOW)).toHaveLength(0);
    expect(evaluateTrainingOverdue(rows, { graceDays: 0 }, NOW)).toHaveLength(1);
  });
});

describe("incident_breach_clock", () => {
  test("incident 72h clock derived from detectedAt; alerts within threshold", () => {
    const incidents = [
      // Detected 60h ago → deadline in 12h → inside a 24h threshold.
      { id: "i1", title: "Data leak", detectedAt: hours(-60), createdAt: hours(-60) },
      // Detected 10h ago → deadline in 62h → outside.
      { id: "i2", title: "Fresh incident", detectedAt: hours(-10), createdAt: hours(-10) },
    ];
    const alerts = evaluateBreachClock(incidents, [], { thresholdHours: 24 }, NOW);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.dedupeKey).toBe("incident_breach_clock:incident:i1");
    expect(alerts[0]!.summary).toContain("due within 24h");
  });

  test("missed deadlines are flagged OVERDUE and createdAt backstops detectedAt", () => {
    const alerts = evaluateBreachClock(
      [{ id: "i3", title: "Old one", detectedAt: null, createdAt: hours(-80) }],
      [],
      { thresholdHours: 24 },
      NOW,
    );
    expect(alerts[0]!.summary).toContain("OVERDUE");
  });

  test("data breaches use their stored Art. 33 deadline", () => {
    const alerts = evaluateBreachClock(
      [],
      [
        { id: "db1", title: "Exposed bucket", notificationDeadlineAt: hours(6) },
        { id: "db2", title: "Plenty of time", notificationDeadlineAt: hours(100) },
      ],
      { thresholdHours: 24 },
      NOW,
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.dedupeKey).toBe("incident_breach_clock:breach:db1");
  });
});

// ── Tenant tick: dedupe + fan-out + fail-soft ───────────────────────

interface FakeState {
  weaknesses: Array<{ id: string; title: string; severity: string; status: string }>;
  deliveries: Array<Record<string, unknown>>;
  rules: Array<{ id: string; ruleKey: string; enabled: boolean; config: unknown }>;
  channels: Array<{ id: string; type: string; name: string; configEnc: string; enabled: boolean }>;
}

function fakeDb(state: FakeState): TenantTickDb {
  return {
    alertRule: {
      async findMany() {
        return state.rules.map((r) => ({ ...r }));
      },
      async createMany(args: { data: Array<{ ruleKey: string; config: unknown }> }) {
        for (const d of args.data) {
          state.rules.push({
            id: `rule_${state.rules.length}`,
            ruleKey: d.ruleKey,
            enabled: true,
            config: d.config,
          });
        }
        return { count: args.data.length };
      },
    },
    notificationChannel: {
      async findMany() {
        return state.channels.filter((c) => c.enabled).map((c) => ({ ...c }));
      },
    },
    notificationDelivery: {
      async findMany(args: { where: { dedupeKey: { in: string[] } } }) {
        const keys = new Set(args.where.dedupeKey.in);
        return state.deliveries.filter((d) => keys.has(d.dedupeKey as string));
      },
      async createMany(args: { data: Array<Record<string, unknown>> }) {
        state.deliveries.push(...args.data);
        return { count: args.data.length };
      },
    },
    controlWeakness: {
      async findMany() {
        return state.weaknesses.filter((w) =>
          ["open", "triaging", "remediating"].includes(w.status),
        );
      },
    },
    device: {
      async findMany() {
        return [];
      },
    },
    tenantSettings: {
      async findFirst() {
        return null;
      },
    },
    personChecklistItem: {
      async findMany() {
        return [];
      },
    },
    backgroundCheck: {
      async findMany() {
        return [];
      },
    },
    trainingCompletion: {
      async findMany() {
        return [];
      },
    },
    incident: {
      async findMany() {
        return [];
      },
    },
    dataBreach: {
      async findMany() {
        return [];
      },
    },
  };
}

function makeDeps(
  state: FakeState,
  opts: {
    deliver?: TenantTickDeps["deliver"];
    listConnections?: TenantTickDeps["listConnections"];
  } = {},
): { deps: TenantTickDeps; delivered: Array<{ channelId: string; message: AlertMessage }> } {
  const delivered: Array<{ channelId: string; message: AlertMessage }> = [];
  const deps: TenantTickDeps = {
    db: fakeDb(state),
    tenant: { id: "tenant-1", name: "Acme Corp" },
    listConnections: opts.listConnections ?? (async () => []),
    deliver:
      opts.deliver ??
      (async (channel: DeliverableChannel, message: AlertMessage) => {
        delivered.push({ channelId: channel.id, message });
      }),
    now: () => NOW,
  };
  return { deps, delivered };
}

function baseState(): FakeState {
  return {
    weaknesses: [{ id: "w1", title: "MFA gap", severity: "high", status: "open" }],
    deliveries: [],
    rules: [],
    channels: [
      {
        id: "ch1",
        type: "slack_webhook",
        name: "Alerts",
        configEnc: encryptChannelConfig({ url: "https://hooks.slack.com/services/x" }),
        enabled: true,
      },
      {
        id: "ch2",
        type: "email",
        name: "Security team",
        configEnc: encryptChannelConfig({ recipients: ["sec@example.com"] }),
        enabled: true,
      },
    ],
  };
}

describe("runTenantTick", () => {
  test("fans a new alert out to every enabled channel and records deliveries", async () => {
    const state = baseState();
    const { deps, delivered } = makeDeps(state);
    const result = await runTenantTick(deps);

    expect(result.sent).toBe(2); // one alert × two channels
    expect(result.failed).toBe(0);
    expect(delivered.map((d) => d.channelId).sort()).toEqual(["ch1", "ch2"]);
    expect(delivered[0]!.message.tenantName).toBe("Acme Corp");
    expect(state.deliveries).toHaveLength(2);
    expect(state.deliveries.every((d) => d.status === "sent")).toBe(true);
    // Rules were lazily seeded on the way through.
    expect(state.rules.length).toBeGreaterThan(0);
  });

  test("a persisting condition alerts once — second tick is fully suppressed", async () => {
    const state = baseState();
    const first = makeDeps(state);
    await runTenantTick(first.deps);
    const second = makeDeps(state);
    const result = await runTenantTick(second.deps);

    expect(second.delivered).toHaveLength(0);
    expect(result.sent).toBe(0);
    expect(result.suppressed).toBe(1);
    expect(state.deliveries).toHaveLength(2); // unchanged
  });

  test("a new condition generation (new weakness row) alerts again", async () => {
    const state = baseState();
    await runTenantTick(makeDeps(state).deps);
    // The weakness is closed and a NEW one is opened later — new row id.
    state.weaknesses = [{ id: "w2", title: "MFA gap again", severity: "high", status: "open" }];
    const { deps, delivered } = makeDeps(state);
    const result = await runTenantTick(deps);

    expect(result.sent).toBe(2);
    expect(delivered[0]!.message.summary).toContain("MFA gap again");
  });

  test("no enabled channels → evaluation is skipped entirely", async () => {
    const state = baseState();
    state.channels.forEach((c) => {
      c.enabled = false;
    });
    const { deps, delivered } = makeDeps(state);
    const result = await runTenantTick(deps);
    expect(delivered).toHaveLength(0);
    expect(result).toEqual({ sent: 0, failed: 0, suppressed: 0 });
    expect(state.rules).toHaveLength(0); // rules not even seeded
  });

  test("disabled rules are not evaluated", async () => {
    const state = baseState();
    // Pre-seed rules, then disable control_failing.
    await runTenantTick(makeDeps({ ...state, weaknesses: [] }).deps);
    state.rules.find((r) => r.ruleKey === "control_failing")!.enabled = false;
    const { deps, delivered } = makeDeps(state);
    await runTenantTick(deps);
    expect(delivered).toHaveLength(0);
  });

  test("a failing channel marks the delivery failed but the tick continues", async () => {
    const state = baseState();
    const { deps } = makeDeps(state, {
      deliver: async (channel) => {
        if (channel.id === "ch1") throw new Error("webhook 500");
      },
    });
    const result = await runTenantTick(deps);

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
    const byChannel = Object.fromEntries(state.deliveries.map((d) => [d.channelId, d.status]));
    expect(byChannel.ch1).toBe("failed");
    expect(byChannel.ch2).toBe("sent");
    // The failed key is now in the ledger, so it will not re-fire next tick.
    const next = makeDeps(state);
    const nextResult = await runTenantTick(next.deps);
    expect(nextResult.suppressed).toBe(1);
  });

  test("a collector outage skips integration rule without failing the tick", async () => {
    const state = baseState();
    const { deps, delivered } = makeDeps(state, {
      listConnections: async () => {
        throw new Error("collector unavailable");
      },
    });
    const result = await runTenantTick(deps);
    // control_failing still fired despite the integration rule erroring.
    expect(result.sent).toBe(2);
    expect(delivered.every((d) => d.message.ruleKey === "control_failing")).toBe(true);
  });
});
