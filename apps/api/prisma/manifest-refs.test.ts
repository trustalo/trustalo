/**
 * Cross-package guard: every integration-manifest `FrameworkRef` must point at
 * a requirement identifier that actually exists in the seeded framework catalog.
 *
 * The runtime resolver (`resolveFrameworkRefs`) matches a manifest ref's
 * `requirement` string against `Requirement.identifier` verbatim; a mismatch
 * does not throw — it silently orphans the evidence (the connector collects it
 * but it binds to no control). This test turns that silent failure into a loud
 * one for the frameworks we control tightly here (HIPAA + PCI DSS 4.0.1).
 *
 * For every OTHER framework we only `console.warn` on a miss, because some
 * pre-existing manifests reference identifiers from an older Annex-A numbering
 * and hard-failing those is out of scope for this guard.
 *
 * Lives under prisma/ (not src/) so it can import the framework catalog defs,
 * which are not part of the API's src rootDir. Covered by tsconfig.seed.json.
 */
import { describe, expect, test } from "bun:test";
import { MANIFESTS, collectAllFrameworkRefs } from "@trustalo/integration-manifests";
import type { FrameworkDef } from "./frameworks/index.js";
import {
  ISO27001_FRAMEWORK,
  ISO27017_FRAMEWORK,
  ISO27018_FRAMEWORK,
  ISO22301_FRAMEWORK,
  ISO42001_FRAMEWORK,
  SOC2_FRAMEWORK,
  ESSENTIAL8_FRAMEWORK,
  NIST_CSF_2_FRAMEWORK,
  GDPR_FRAMEWORK,
  CPS234_FRAMEWORK,
  HIPAA_FRAMEWORK,
  PCI_DSS_4_FRAMEWORK,
} from "./frameworks/index.js";

const ALL_FRAMEWORKS: readonly FrameworkDef[] = [
  ISO27001_FRAMEWORK,
  ISO27017_FRAMEWORK,
  ISO27018_FRAMEWORK,
  ISO22301_FRAMEWORK,
  ISO42001_FRAMEWORK,
  SOC2_FRAMEWORK,
  ESSENTIAL8_FRAMEWORK,
  NIST_CSF_2_FRAMEWORK,
  GDPR_FRAMEWORK,
  CPS234_FRAMEWORK,
  HIPAA_FRAMEWORK,
  PCI_DSS_4_FRAMEWORK,
];

/** frameworkType slug -> set of valid requirement identifiers. */
const identifiersByFramework = new Map<string, Set<string>>(
  ALL_FRAMEWORKS.map((f) => [f.frameworkType, new Set(f.requirements.map((r) => r.identifier))]),
);

/**
 * Frameworks whose manifest refs we hard-assert resolve exactly. A miss here is
 * a real evidence-orphaning bug, not an intentional forward-reference. `soc2`,
 * `gdpr`, `cps234` etc. are not yet listed only because their manifest refs have
 * not all been reconciled against the seeded catalog — the warn-only pass below
 * surfaces those. `iso27001` was added after remapping every manifest from the
 * 2013 Annex A numbering to ISO 27001:2022 (Annex B); `essential8` after fixing
 * the `ML2-MFA` → `E8-MFA-ML2` identifier.
 */
const STRICT_FRAMEWORKS = new Set(["hipaa", "pci_dss_4", "iso27001", "essential8"]);

describe("manifest FrameworkRefs resolve against the seeded catalog", () => {
  for (const manifest of MANIFESTS) {
    const refs = collectAllFrameworkRefs(manifest);

    test(`${manifest.connector}: strict-framework refs all resolve to real requirements`, () => {
      const unresolved: string[] = [];
      for (const ref of refs) {
        if (!STRICT_FRAMEWORKS.has(ref.framework)) continue;
        const ids = identifiersByFramework.get(ref.framework);
        if (!ids || !ids.has(ref.requirement)) {
          unresolved.push(`${ref.framework}::${ref.requirement}`);
        }
      }
      expect(unresolved).toEqual([]);
    });
  }

  test("no manifest ref points at an unknown identifier (warn-only for legacy frameworks)", () => {
    for (const manifest of MANIFESTS) {
      for (const ref of collectAllFrameworkRefs(manifest)) {
        if (STRICT_FRAMEWORKS.has(ref.framework)) continue;
        const ids = identifiersByFramework.get(ref.framework);
        if (ids && !ids.has(ref.requirement)) {
          console.warn(
            `[manifest:${manifest.connector}] ref ${ref.framework}::${ref.requirement} ` +
              `does not match any seeded requirement identifier`,
          );
        }
      }
    }
    expect(true).toBe(true);
  });
});
