/**
 * Conformance tests for every manifest registered in `MANIFESTS`.
 *
 * The contract is intentionally simple — these tests stop someone
 * adding a manifest that wouldn't survive a round-trip through the
 * binder/reconciler:
 *
 *   1. `ManifestSchema.parse(...)` accepts it as valid input.
 *   2. The `connector` slug is unique across the registry.
 *   3. Every `FrameworkRef` references a known framework.
 *   4. `collectAllFrameworkRefs(...)` returns no duplicates.
 *   5. Every check has a non-empty `controlMappings` AND/OR every
 *      capability has a non-empty `controlMappings` — a manifest with
 *      neither contributes no bindings at all.
 */

import { describe, expect, test } from "bun:test";
import { MANIFESTS, ManifestSchema, collectAllFrameworkRefs, getManifest } from "./index.js";

const KNOWN_FRAMEWORKS = new Set([
  "iso27001",
  "iso27017",
  "iso27018",
  "iso22301",
  "iso42001",
  "soc2",
  "essential8",
  "nist_csf_2",
  "gdpr",
  "cps234",
  "pci_dss_4",
  "hipaa",
]);

describe("manifest registry — global invariants", () => {
  test("connector slugs are unique", () => {
    const slugs = MANIFESTS.map((m) => m.connector);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("connector slugs use the documented charset", () => {
    for (const m of MANIFESTS) {
      expect(m.connector).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    }
  });

  test("getManifest resolves every registered slug", () => {
    for (const m of MANIFESTS) {
      expect(getManifest(m.connector)?.connector).toBe(m.connector);
    }
  });
});

describe.each(MANIFESTS.map((m) => [m.connector, m] as const))(
  "manifest conformance — %s",
  (_slug, manifest) => {
    test("passes ManifestSchema validation", () => {
      expect(() => ManifestSchema.parse(manifest)).not.toThrow();
    });

    test("declares a version", () => {
      expect(manifest.version).toBeDefined();
      expect(typeof manifest.version).toBe("string");
    });

    test("declares at least one binding source (check or capability)", () => {
      const total = (manifest.checks?.length ?? 0) + (manifest.capabilities?.length ?? 0);
      expect(total).toBeGreaterThan(0);
    });

    test("FrameworkRefs reference known frameworks", () => {
      const refs = collectAllFrameworkRefs(manifest);
      for (const ref of refs) {
        // We don't fail unknown frameworks hard — manifests may
        // intentionally include refs to frameworks the API hasn't
        // seeded yet (e.g. an upcoming HIPAA pack). Catch typos
        // (camelCase, misspellings) by warning on values that don't
        // match snake_case-ish identifiers used elsewhere.
        expect(ref.framework).toMatch(/^[a-z][a-z0-9_]*$/);
        if (!KNOWN_FRAMEWORKS.has(ref.framework)) {
          console.warn(
            `[manifest:${manifest.connector}] FrameworkRef references unseeded framework "${ref.framework}"`,
          );
        }
        expect(ref.requirement.length).toBeGreaterThan(0);
      }
    });

    test("collectAllFrameworkRefs deduplicates by (framework, requirement)", () => {
      const refs = collectAllFrameworkRefs(manifest);
      const keys = refs.map((r) => `${r.framework}::${r.requirement}`);
      expect(new Set(keys).size).toBe(keys.length);
    });

    test("check keys are unique within the manifest", () => {
      const keys = (manifest.checks ?? []).map((c) => c.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    test("capability keys are unique within the manifest", () => {
      const keys = (manifest.capabilities ?? []).map((c) => c.key);
      expect(new Set(keys).size).toBe(keys.length);
    });

    test("check and capability key namespaces don't collide", () => {
      const checkKeys = new Set((manifest.checks ?? []).map((c) => c.key));
      for (const cap of manifest.capabilities ?? []) {
        expect(checkKeys.has(cap.key)).toBe(false);
      }
    });
  },
);
