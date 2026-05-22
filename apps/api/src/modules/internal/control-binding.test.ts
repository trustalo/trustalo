/**
 * Unit tests for `shapeResolvedRefs` — the pure shaping step extracted
 * from `resolveFrameworkRefs`. Covers every branch of the resolver's
 * "reason" classification so reviewers can see exactly which `reason`
 * each input pattern surfaces.
 */

import { describe, expect, test } from "bun:test";
import { shapeResolvedRefs, type ResolverLookups } from "./control-binding.js";

function emptyLookups(): ResolverLookups {
  return {
    frameworkBySlug: new Map(),
    requirementByKey: new Map(),
    controlIdsByRequirementId: new Map(),
    naAssignmentSet: new Set(),
  };
}

describe("shapeResolvedRefs", () => {
  test("unknown framework → framework_not_seeded", () => {
    const out = shapeResolvedRefs([{ framework: "imaginary", requirement: "X.1" }], emptyLookups());
    expect(out[0]?.reason).toBe("framework_not_seeded");
    expect(out[0]?.controlIds).toEqual([]);
  });

  test("known framework but unknown requirement → requirement_not_seeded", () => {
    const lookups = emptyLookups();
    lookups.frameworkBySlug.set("soc2", { id: "fw_soc2" });
    const out = shapeResolvedRefs([{ framework: "soc2", requirement: "CC9.9" }], lookups);
    expect(out[0]?.reason).toBe("requirement_not_seeded");
  });

  test("known requirement with no enabled assignments → no_control_assignments", () => {
    const lookups = emptyLookups();
    lookups.frameworkBySlug.set("soc2", { id: "fw_soc2" });
    lookups.requirementByKey.set("fw_soc2::CC6.1", { id: "req1", title: "Access" });
    const out = shapeResolvedRefs([{ framework: "soc2", requirement: "CC6.1" }], lookups);
    expect(out[0]?.reason).toBe("no_control_assignments");
    expect(out[0]?.requirementId).toBe("req1");
  });

  test("controls exist but are not_applicable → controls_not_applicable", () => {
    const lookups = emptyLookups();
    lookups.frameworkBySlug.set("soc2", { id: "fw_soc2" });
    lookups.requirementByKey.set("fw_soc2::CC6.1", { id: "req1", title: "Access" });
    lookups.naAssignmentSet.add("req1");
    const out = shapeResolvedRefs([{ framework: "soc2", requirement: "CC6.1" }], lookups);
    expect(out[0]?.reason).toBe("controls_not_applicable");
  });

  test("successful resolution returns sorted controlIds with no reason", () => {
    const lookups = emptyLookups();
    lookups.frameworkBySlug.set("soc2", { id: "fw_soc2" });
    lookups.requirementByKey.set("fw_soc2::CC6.1", { id: "req1", title: "Access" });
    lookups.controlIdsByRequirementId.set("req1", new Set(["ctrl_a", "ctrl_b"]));
    const out = shapeResolvedRefs([{ framework: "soc2", requirement: "CC6.1" }], lookups);
    expect(out[0]?.reason).toBeUndefined();
    expect(out[0]?.controlIds.sort()).toEqual(["ctrl_a", "ctrl_b"]);
  });

  test("preserves input order even when refs partially fail", () => {
    const lookups = emptyLookups();
    lookups.frameworkBySlug.set("soc2", { id: "fw_soc2" });
    lookups.requirementByKey.set("fw_soc2::CC6.1", { id: "req1", title: "Access" });
    lookups.controlIdsByRequirementId.set("req1", new Set(["ctrl_a"]));

    const out = shapeResolvedRefs(
      [
        { framework: "unknown", requirement: "X" },
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC9.9" },
      ],
      lookups,
    );

    expect(out[0]?.reason).toBe("framework_not_seeded");
    expect(out[1]?.controlIds).toEqual(["ctrl_a"]);
    expect(out[2]?.reason).toBe("requirement_not_seeded");
  });
});
