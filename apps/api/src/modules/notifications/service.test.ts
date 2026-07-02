import { describe, expect, test } from "bun:test";
import { isEncryptedString } from "../../lib/crypto-envelope.js";
import {
  channelConfigPreview,
  channelCreateSchema,
  channelPatchSchema,
  decryptChannelConfig,
  encryptChannelConfig,
  ensureAlertRules,
  parseChannelConfig,
  parseRuleConfig,
  rulePatchSchema,
  RULE_KEYS,
} from "./service.js";

describe("channel config encryption", () => {
  test("round-trips through the enc:v1 envelope — never plaintext at rest", () => {
    const config = { url: "https://hooks.slack.com/services/T000/B000/secret-token" };
    const stored = encryptChannelConfig(config);

    expect(isEncryptedString(stored)).toBe(true);
    expect(stored.startsWith("enc:v1:")).toBe(true);
    expect(stored).not.toContain("hooks.slack.com");
    expect(stored).not.toContain("secret-token");

    expect(decryptChannelConfig(stored)).toEqual(config);
  });

  test("email recipient lists are also enveloped", () => {
    const config = { recipients: ["security@example.com", "ops@example.com"] };
    const stored = encryptChannelConfig(config);
    expect(isEncryptedString(stored)).toBe(true);
    expect(stored).not.toContain("example.com");
    expect(decryptChannelConfig(stored)).toEqual(config);
  });
});

describe("channel config preview", () => {
  test("webhook preview exposes only the host, never path or token", () => {
    const preview = channelConfigPreview("slack_webhook", {
      url: "https://hooks.slack.com/services/T000/B000/secret-token",
    });
    expect(preview).toBe("https://hooks.slack.com/…");
    expect(preview).not.toContain("secret-token");
  });

  test("email preview masks the first address and counts the rest", () => {
    expect(
      channelConfigPreview("email", {
        recipients: ["security@example.com", "ops@example.com", "ciso@example.com"],
      }),
    ).toBe("se…@example.com +2 more");
    expect(channelConfigPreview("email", { recipients: ["a@b.co"] })).toBe("…@b.co");
  });
});

describe("channel schemas", () => {
  test("accepts each channel type with its own config shape", () => {
    expect(
      channelCreateSchema.parse({
        type: "email",
        name: "Security team",
        config: { recipients: ["security@example.com"] },
      }).type,
    ).toBe("email");
    expect(
      channelCreateSchema.parse({
        type: "teams_webhook",
        name: "Compliance room",
        config: { url: "https://example.webhook.office.com/webhookb2/abc" },
      }).type,
    ).toBe("teams_webhook");
  });

  test("rejects http (non-https) webhook URLs", () => {
    expect(() =>
      channelCreateSchema.parse({
        type: "slack_webhook",
        name: "Bad",
        config: { url: "http://hooks.slack.com/services/x" },
      }),
    ).toThrow();
  });

  test("rejects mismatched config for the type", () => {
    expect(() =>
      channelCreateSchema.parse({
        type: "email",
        name: "Oops",
        config: { url: "https://hooks.slack.com/services/x" },
      }),
    ).toThrow();
    expect(() => parseChannelConfig("slack_webhook", { recipients: ["a@b.co"] })).toThrow();
  });

  test("rejects server-side fields echoed back into a write", () => {
    // A client must never be able to round-trip the masked preview or the
    // ciphertext into storage.
    expect(() =>
      channelCreateSchema.parse({
        type: "slack_webhook",
        name: "Echo",
        config: { url: "https://hooks.slack.com/x", configPreview: "https://…" },
      }),
    ).toThrow();
    expect(() =>
      channelCreateSchema.parse({
        type: "slack_webhook",
        name: "Echo",
        config: { url: "https://hooks.slack.com/x" },
        configEnc: "enc:v1:abc",
      }),
    ).toThrow();
    expect(() => channelPatchSchema.parse({ configPreview: "https://…" })).toThrow();
    expect(() => channelPatchSchema.parse({})).toThrow();
  });
});

describe("rule config schemas", () => {
  test("defaults apply on empty config", () => {
    expect(parseRuleConfig("control_failing", {})).toEqual({ minSeverity: "medium" });
    expect(parseRuleConfig("background_check_expiring", {})).toEqual({ thresholdDays: 30 });
    expect(parseRuleConfig("person_offboarding_incomplete", {})).toEqual({ olderThanDays: 7 });
    expect(parseRuleConfig("training_overdue", {})).toEqual({ graceDays: 0 });
    expect(parseRuleConfig("incident_breach_clock", {})).toEqual({ thresholdHours: 24 });
  });

  test("rejects out-of-bounds thresholds and unknown fields", () => {
    expect(() => parseRuleConfig("background_check_expiring", { thresholdDays: 0 })).toThrow();
    expect(() => parseRuleConfig("incident_breach_clock", { thresholdHours: 10_000 })).toThrow();
    expect(() => parseRuleConfig("device_at_risk", { anything: true })).toThrow();
    expect(() => rulePatchSchema.parse({})).toThrow();
    expect(rulePatchSchema.parse({ enabled: false })).toEqual({ enabled: false });
  });
});

describe("ensureAlertRules — lazy per-tenant defaults", () => {
  function fakeRuleDb() {
    const rows: Array<{ id: string; ruleKey: string; enabled: boolean; config: unknown }> = [];
    return {
      rows,
      alertRule: {
        async findMany(_args: unknown) {
          return rows.map((r) => ({ ...r }));
        },
        async createMany(args: { data: Array<{ ruleKey: string; config: unknown }> }) {
          for (const d of args.data) {
            rows.push({
              id: `rule_${rows.length}`,
              ruleKey: d.ruleKey,
              enabled: true,
              config: d.config,
            });
          }
          return { count: args.data.length };
        },
      },
    };
  }

  test("seeds all rules enabled with default thresholds on first read", async () => {
    const db = fakeRuleDb();
    const rules = await ensureAlertRules(db, "tenant-1");
    expect(rules.map((r) => r.ruleKey)).toEqual([...RULE_KEYS]);
    expect(rules.every((r) => r.enabled)).toBe(true);
    expect(rules.find((r) => r.ruleKey === "background_check_expiring")?.config).toEqual({
      thresholdDays: 30,
    });
  });

  test("second read does not duplicate rows and preserves stored state", async () => {
    const db = fakeRuleDb();
    await ensureAlertRules(db, "tenant-1");
    db.rows.find((r) => r.ruleKey === "training_overdue")!.enabled = false;
    const rules = await ensureAlertRules(db, "tenant-1");
    expect(db.rows.length).toBe(RULE_KEYS.length);
    expect(rules.find((r) => r.ruleKey === "training_overdue")?.enabled).toBe(false);
  });

  test("unparseable stored config degrades to defaults instead of leaking", async () => {
    const db = fakeRuleDb();
    await ensureAlertRules(db, "tenant-1");
    db.rows.find((r) => r.ruleKey === "incident_breach_clock")!.config = {
      thresholdHours: "not-a-number",
      injected: true,
    };
    const rules = await ensureAlertRules(db, "tenant-1");
    expect(rules.find((r) => r.ruleKey === "incident_breach_clock")?.config).toEqual({
      thresholdHours: 24,
    });
  });
});
