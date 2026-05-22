/**
 * Unit tests for the reconciler's pure diff + reason-mapping helpers.
 *
 * The reconciler's I/O wrapper (`reconcileBindings`) is integration-
 * scope and exercised separately; these tests pin the branching logic
 * that decides "added vs reEnabled vs disabled vs unchanged" and the
 * `disabledReason` for each of the five drift scenarios from the
 * plan.
 */

import { describe, expect, test } from "bun:test";
import { computeReconcileDiff, disabledReasonFromResolver } from "./reconciler.js";

describe("disabledReasonFromResolver — covers all five drift cases", () => {
  test("framework_not_seeded → framework_disabled", () => {
    expect(disabledReasonFromResolver("framework_not_seeded", "ref_unmapped")).toBe(
      "framework_disabled",
    );
  });

  test("framework_not_enabled → framework_disabled", () => {
    expect(disabledReasonFromResolver("framework_not_enabled", "ref_unmapped")).toBe(
      "framework_disabled",
    );
  });

  test("controls_not_applicable → control_not_applicable", () => {
    expect(disabledReasonFromResolver("controls_not_applicable", "ref_unmapped")).toBe(
      "control_not_applicable",
    );
  });

  test("requirement_not_seeded → ref_unmapped", () => {
    expect(disabledReasonFromResolver("requirement_not_seeded", "ref_unmapped")).toBe(
      "ref_unmapped",
    );
  });

  test("no_control_assignments → ref_unmapped", () => {
    expect(disabledReasonFromResolver("no_control_assignments", "ref_unmapped")).toBe(
      "ref_unmapped",
    );
  });

  test("falls back to the explicit trigger reason when resolver is silent", () => {
    expect(disabledReasonFromResolver(undefined, "control_deleted")).toBe("control_deleted");
  });
});

describe("computeReconcileDiff — branching", () => {
  test("no existing rows, all desired → toInsert", () => {
    const out = computeReconcileDiff({
      desiredByManifestKey: new Map([["k1", new Set(["c1", "c2"])]]),
      existingByManifestKey: new Map(),
      reasonByMissing: new Map(),
      manifestRemovedKeys: new Set(),
      fallbackReason: "ref_unmapped",
    });
    expect(out.toInsert).toHaveLength(2);
    expect(out.toReEnable).toHaveLength(0);
    expect(out.toDisable).toHaveLength(0);
  });

  test("desired + enabled existing → unchanged (idempotent rerun)", () => {
    const out = computeReconcileDiff({
      desiredByManifestKey: new Map([["k1", new Set(["c1"])]]),
      existingByManifestKey: new Map([["k1", [{ id: "row1", controlId: "c1", isEnabled: true }]]]),
      reasonByMissing: new Map(),
      manifestRemovedKeys: new Set(),
      fallbackReason: "ref_unmapped",
    });
    expect(out.unchanged).toHaveLength(1);
    expect(out.toInsert).toHaveLength(0);
    expect(out.toDisable).toHaveLength(0);
  });

  test("desired + disabled existing → toReEnable", () => {
    const out = computeReconcileDiff({
      desiredByManifestKey: new Map([["k1", new Set(["c1"])]]),
      existingByManifestKey: new Map([["k1", [{ id: "row1", controlId: "c1", isEnabled: false }]]]),
      reasonByMissing: new Map(),
      manifestRemovedKeys: new Set(),
      fallbackReason: "ref_unmapped",
    });
    expect(out.toReEnable).toHaveLength(1);
  });

  test("not desired + enabled existing → toDisable with reasonByMissing", () => {
    const out = computeReconcileDiff({
      desiredByManifestKey: new Map([["k1", new Set()]]),
      existingByManifestKey: new Map([["k1", [{ id: "row1", controlId: "c1", isEnabled: true }]]]),
      reasonByMissing: new Map([["k1", "framework_disabled"]]),
      manifestRemovedKeys: new Set(),
      fallbackReason: "ref_unmapped",
    });
    expect(out.toDisable).toHaveLength(1);
    expect(out.toDisable[0]?.reason).toBe("framework_disabled");
  });

  test("not desired + already disabled → no change", () => {
    const out = computeReconcileDiff({
      desiredByManifestKey: new Map([["k1", new Set()]]),
      existingByManifestKey: new Map([["k1", [{ id: "row1", controlId: "c1", isEnabled: false }]]]),
      reasonByMissing: new Map(),
      manifestRemovedKeys: new Set(),
      fallbackReason: "ref_unmapped",
    });
    expect(out.toDisable).toHaveLength(0);
    expect(out.toReEnable).toHaveLength(0);
    expect(out.unchanged).toHaveLength(0);
  });

  test("manifest_removed keys soft-disable all enabled rows with that reason", () => {
    const out = computeReconcileDiff({
      desiredByManifestKey: new Map(),
      existingByManifestKey: new Map([
        [
          "removed_key",
          [
            { id: "row1", controlId: "c1", isEnabled: true },
            { id: "row2", controlId: "c2", isEnabled: true },
            { id: "row3", controlId: "c3", isEnabled: false },
          ],
        ],
      ]),
      reasonByMissing: new Map(),
      manifestRemovedKeys: new Set(["removed_key"]),
      fallbackReason: "ref_unmapped",
    });
    expect(out.toDisable).toHaveLength(2);
    expect(out.toDisable.every((d) => d.reason === "manifest_removed")).toBe(true);
  });

  test("falls back to trigger reason when no precise reason is known", () => {
    const out = computeReconcileDiff({
      desiredByManifestKey: new Map([["k1", new Set()]]),
      existingByManifestKey: new Map([["k1", [{ id: "row1", controlId: "c1", isEnabled: true }]]]),
      reasonByMissing: new Map(),
      manifestRemovedKeys: new Set(),
      fallbackReason: "control_deleted",
    });
    expect(out.toDisable[0]?.reason).toBe("control_deleted");
  });

  test("idempotent: re-running the diff against the same state produces no changes", () => {
    const desired = new Map([["k1", new Set(["c1", "c2"])]]);
    const existing = new Map([
      [
        "k1",
        [
          { id: "row1", controlId: "c1", isEnabled: true },
          { id: "row2", controlId: "c2", isEnabled: true },
        ],
      ],
    ]);
    const first = computeReconcileDiff({
      desiredByManifestKey: desired,
      existingByManifestKey: existing,
      reasonByMissing: new Map(),
      manifestRemovedKeys: new Set(),
      fallbackReason: "ref_unmapped",
    });
    expect(first.toInsert).toHaveLength(0);
    expect(first.toDisable).toHaveLength(0);
    expect(first.toReEnable).toHaveLength(0);
    expect(first.unchanged).toHaveLength(2);
  });
});
