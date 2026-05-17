import { describe, expect, test } from "bun:test";
import {
  CPS234_EVIDENCE_AGENT_PRESETS,
  applyEvidenceAgentPreset,
  findEvidenceAgentPreset,
} from "./evidence-agent-presets.js";

describe("CPS234_EVIDENCE_AGENT_PRESETS", () => {
  test("includes at least the eight pillar presets", () => {
    expect(CPS234_EVIDENCE_AGENT_PRESETS.length).toBeGreaterThanOrEqual(8);
  });

  test("every preset has a unique id", () => {
    const ids = CPS234_EVIDENCE_AGENT_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every preset id is namespaced under cps234-", () => {
    for (const p of CPS234_EVIDENCE_AGENT_PRESETS) {
      expect(p.id.startsWith("cps234-")).toBe(true);
    }
  });

  test("every preset references a CPS 234 paragraph in its citations", () => {
    for (const p of CPS234_EVIDENCE_AGENT_PRESETS) {
      expect(p.citations.length).toBeGreaterThanOrEqual(1);
      for (const c of p.citations) {
        expect(c).toMatch(/^CPS234-\d+/);
      }
    }
  });

  test("every preset's agentInstructions fits the 8000-char API limit", () => {
    for (const p of CPS234_EVIDENCE_AGENT_PRESETS) {
      expect(p.agentInstructions.length).toBeGreaterThan(50);
      expect(p.agentInstructions.length).toBeLessThanOrEqual(8000);
    }
  });

  test("every preset has a non-empty label, description and category", () => {
    for (const p of CPS234_EVIDENCE_AGENT_PRESETS) {
      expect(p.label.trim().length).toBeGreaterThan(0);
      expect(p.description.trim().length).toBeGreaterThan(0);
      expect(p.category.trim().length).toBeGreaterThan(0);
    }
  });

  test("every frameworkType is 'cps234'", () => {
    for (const p of CPS234_EVIDENCE_AGENT_PRESETS) {
      expect(p.frameworkType).toBe("cps234");
    }
  });

  test("schedules (when present) are at least 15 minutes — matches API validator", () => {
    for (const p of CPS234_EVIDENCE_AGENT_PRESETS) {
      if (p.suggestedScheduleMinutes !== null) {
        expect(p.suggestedScheduleMinutes).toBeGreaterThanOrEqual(15);
      }
    }
  });
});

describe("findEvidenceAgentPreset", () => {
  test("returns the preset for a known id", () => {
    const got = findEvidenceAgentPreset("cps234-para-28-bau-monitoring");
    expect(got).not.toBeNull();
    expect(got!.id).toBe("cps234-para-28-bau-monitoring");
  });

  test("returns null for an unknown id", () => {
    expect(findEvidenceAgentPreset("does-not-exist")).toBeNull();
  });
});

describe("applyEvidenceAgentPreset", () => {
  test("returns a payload that switches the control to agent mode", () => {
    const preset = findEvidenceAgentPreset("cps234-para-28-bau-monitoring")!;
    const payload = applyEvidenceAgentPreset(preset);
    expect(payload.mode).toBe("agent");
    expect(payload.agentInstructions).toBe(preset.agentInstructions);
    expect(payload.agentScheduleMinutes).toBe(preset.suggestedScheduleMinutes);
    // Tool connection ids start empty — UI overlays the resolved ids.
    expect(payload.agentToolConnectionIds).toEqual([]);
    // Original tool kinds are surfaced for the UI.
    expect(payload.suggestedToolKinds).toEqual(preset.suggestedToolKinds);
  });

  test("is idempotent — same preset always yields the same payload", () => {
    const preset = findEvidenceAgentPreset("cps234-para-23-information-asset-classification")!;
    const a = applyEvidenceAgentPreset(preset);
    const b = applyEvidenceAgentPreset(preset);
    expect(a).toEqual(b);
  });
});
