import { describe, expect, test } from "bun:test";
import {
  DEFAULT_REQUIRED_SIGNALS,
  EVALUABLE_POSTURE_SIGNALS,
  POSTURE_SIGNAL_KEYS,
  deviceAvSummary,
  failingRequiredSignals,
} from "./service.js";

const base = {
  diskEncryption: "pass",
  firewall: "pass",
  screenLock: "pass",
  antivirus: "pass",
  latestPosture: null as unknown,
};

describe("evaluable posture-signal catalog", () => {
  test("catalog is the four core columns + extended raw signals", () => {
    expect(EVALUABLE_POSTURE_SIGNALS.map((s) => s.key)).toEqual([
      "diskEncryption",
      "firewall",
      "screenLock",
      "antivirus",
      "autoUpdate",
      "mdmEnrolled",
      "gatekeeper",
      "sip",
      "avHealth",
    ]);
  });

  test("signal keys are unique", () => {
    expect(new Set(POSTURE_SIGNAL_KEYS).size).toBe(POSTURE_SIGNAL_KEYS.length);
  });

  test("default evaluated set is the four core signals and is a subset of the catalog", () => {
    expect([...DEFAULT_REQUIRED_SIGNALS].sort()).toEqual(
      ["antivirus", "diskEncryption", "firewall", "screenLock"].sort(),
    );
    for (const k of DEFAULT_REQUIRED_SIGNALS) expect(POSTURE_SIGNAL_KEYS).toContain(k);
  });
});

describe("failingRequiredSignals", () => {
  test("flags a failing core signal that is evaluated (default set)", () => {
    expect(failingRequiredSignals({ ...base, firewall: "fail" }, DEFAULT_REQUIRED_SIGNALS)).toEqual(
      ["firewall"],
    );
  });

  test("does NOT flag a failing core signal the tenant marked optional", () => {
    // firewall omitted from the evaluated set → its fail is informational only
    const required = ["diskEncryption", "screenLock", "antivirus"];
    expect(failingRequiredSignals({ ...base, firewall: "fail" }, required)).toEqual([]);
  });

  test("ignores failing extended signals by default (MDM not evaluated)", () => {
    const d = { ...base, latestPosture: { mdmEnrolled: "fail" } };
    expect(failingRequiredSignals(d, DEFAULT_REQUIRED_SIGNALS)).toEqual([]);
  });

  test("flags an extended signal once the tenant opts to evaluate it", () => {
    const d = { ...base, latestPosture: { mdmEnrolled: "fail" } };
    expect(failingRequiredSignals(d, [...DEFAULT_REQUIRED_SIGNALS, "mdmEnrolled"])).toEqual([
      "mdmEnrolled",
    ]);
  });

  test("a passing extended signal is never an issue", () => {
    const d = { ...base, latestPosture: { gatekeeper: "pass" } };
    expect(failingRequiredSignals(d, ["gatekeeper"])).toEqual([]);
  });

  test("missing latestPosture is safe", () => {
    expect(failingRequiredSignals({ ...base }, ["mdmEnrolled"])).toEqual([]);
  });

  test("empty evaluated set → no issues even with multiple failures", () => {
    const d = { ...base, firewall: "fail", latestPosture: { mdmEnrolled: "fail" } };
    expect(failingRequiredSignals(d, [])).toEqual([]);
  });
});

describe("deviceAvSummary", () => {
  test("projects product, health, and infection count from latestPosture", () => {
    expect(
      deviceAvSummary({
        avHealth: "pass",
        avDetail: { product: "clamav", infectedCount: 2 },
      }),
    ).toEqual({ avProduct: "clamav", avHealth: "pass", avInfectedCount: 2 });
  });

  test("missing or malformed posture degrades to nulls", () => {
    expect(deviceAvSummary(null)).toEqual({ avProduct: null, avHealth: null, avInfectedCount: 0 });
    expect(deviceAvSummary("posture")).toEqual({
      avProduct: null,
      avHealth: null,
      avInfectedCount: 0,
    });
    expect(deviceAvSummary({ avHealth: "sideways", avDetail: { product: 7 } })).toEqual({
      avProduct: null,
      avHealth: null,
      avInfectedCount: 0,
    });
  });

  test("negative or non-numeric infection counts are ignored", () => {
    expect(deviceAvSummary({ avDetail: { product: "clamav", infectedCount: -3 } })).toEqual({
      avProduct: "clamav",
      avHealth: null,
      avInfectedCount: 0,
    });
  });
});
