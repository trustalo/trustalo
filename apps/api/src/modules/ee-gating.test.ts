/**
 * Regression guard for Enterprise-feature gating across the API.
 *
 * Every route that performs Enterprise-only behavior MUST call
 * `assertEnterpriseLicense(...)` so that customers without a valid
 * Trustalo Enterprise License hit a clean 402 (mapped by the
 * shared error handler) instead of the underlying AI / agent /
 * Trust-Center logic.
 *
 * Mounting each router against a real Express app + Prisma stub is
 * overkill — what we actually want to prevent is the silent
 * regression where someone refactors a handler and removes the
 * gate. A focused static check over the source files catches that
 * cheaply and never flakes on Prisma / network / env state.
 *
 * Each entry in `EE_GATES` describes a single contract:
 *   - `file`        : the router source file
 *   - `anchor`      : a string literal that uniquely identifies the
 *                     route block (typically `routerName.METHOD("path"`)
 *   - `assert`      : the exact call we expect inside the block
 *
 * When you add a new EE-gated route, add a row here so the test
 * fails loudly if a future change removes the gate. When you
 * un-gate a route deliberately, delete its row.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));

interface RouteGate {
  /** Human-readable label for failure messages. */
  label: string;
  /** Path to the source file, relative to `apps/api/src/modules`. */
  file: string;
  /**
   * Substring that uniquely identifies the start of the route
   * handler / block to inspect. The check looks at everything
   * between this anchor and the *next* anchor of the same router
   * (or end-of-file), so anchors must be globally unique within
   * their file.
   */
  anchor: string;
  /**
   * The literal call we expect to find inside the block. Compared
   * after collapsing whitespace so formatting churn doesn't break
   * the test.
   */
  assert: string;
}

// Routes added / gated in the Enterprise-feature work. When this
// list and the source files disagree, the test fails.
const EE_GATES: RouteGate[] = [
  // ── Risks (AI suggest / decision) ────────────────────────────
  {
    label: "risks.aiSuggestScore",
    file: "risks/router.ts",
    anchor: 'risksRouter.post("/:id/ai-suggest-score"',
    assert: 'await assertEnterpriseLicense("ai")',
  },
  {
    label: "risks.aiScoreDecision",
    file: "risks/router.ts",
    anchor: 'risksRouter.post("/:id/ai-score-decision"',
    assert: 'await assertEnterpriseLicense("ai")',
  },

  // ── Vendors (AI tier suggest / decision) ─────────────────────
  {
    label: "vendors.aiSuggestTier",
    file: "vendors/router.ts",
    anchor: 'vendorsRouter.post("/:id/ai-suggest-tier"',
    assert: 'await assertEnterpriseLicense("ai")',
  },
  {
    label: "vendors.aiTierDecision",
    file: "vendors/router.ts",
    anchor: 'vendorsRouter.post("/:id/ai-tier-decision"',
    assert: 'await assertEnterpriseLicense("ai")',
  },

  // ── Questionnaires (AI import / bulk-answer / per-question) ──
  {
    label: "questionnaires.import",
    file: "questionnaires/router.ts",
    anchor: 'questionnairesRouter.post("/",',
    assert: 'await assertEnterpriseLicense("ai")',
  },
  {
    label: "questionnaires.answerAll",
    file: "questionnaires/router.ts",
    anchor: 'questionnairesRouter.post("/:id/answer-all"',
    assert: 'await assertEnterpriseLicense("ai")',
  },
  {
    label: "questionnaires.answerOne",
    file: "questionnaires/router.ts",
    anchor: 'questionnairesRouter.post("/:id/questions/:qid/answer"',
    assert: 'await assertEnterpriseLicense("ai")',
  },

  // ── Controls (evidence-collection Agent mode + Run) ──────────
  // The agent-mode gate sits inside the `if (body.mode === "agent")`
  // branch of the PUT handler, so we anchor on the route signature
  // and check the whole block.
  {
    label: "controls.evidenceConfigAgentSave",
    file: "controls/router.ts",
    anchor: 'controlsRouter.put("/:id/evidence-config"',
    assert: 'await assertEnterpriseLicense("ai")',
  },
  {
    label: "controls.evidenceConfigRun",
    file: "controls/router.ts",
    anchor: 'controlsRouter.post("/:id/evidence-config/run"',
    assert: 'await assertEnterpriseLicense("ai")',
  },

  // ── AI Config (quiz generation) ──────────────────────────────
  {
    label: "aiConfig.generateQuiz",
    file: "ai-config/router.ts",
    anchor: 'aiConfigRouter.post("/generate-quiz"',
    assert: 'await assertEnterpriseLicense("ai")',
  },

  // ── Trust Center (router-level: all admin endpoints) ─────────
  // The Trust Center gate is applied as a router-level middleware
  // mounted *after* `authorizeResource`, so every admin endpoint
  // inherits it. We anchor on the router definition and verify the
  // middleware is wired in the same module.
  {
    label: "trustCenter.routerLevelAssert",
    file: "trust-center/router.ts",
    anchor: "export const trustCenterRouter",
    assert: 'await assertEnterpriseLicense("trust-center")',
  },
];

function readModuleSource(relPath: string): string {
  // Tests live in `apps/api/src/modules/`, so the relative paths in
  // `EE_GATES` resolve directly off `HERE`.
  return readFileSync(resolve(HERE, relPath), "utf8");
}

/**
 * Extract the substring of `source` starting at the route `anchor`
 * and ending at the next top-level route declaration in the same
 * router (or end-of-file). We detect "next route" by the same
 * `<routerName>.<method>(` shape rather than a fixed list of
 * verbs, so a future addition of `OPTIONS` etc. just works.
 */
function blockFor(source: string, anchor: string): string {
  const start = source.indexOf(anchor);
  if (start === -1) {
    throw new Error(`anchor not found: ${anchor}`);
  }
  const tail = source.slice(start + anchor.length);

  // Identify the router name from the anchor (everything before the
  // first dot). Falls back to `Router(` (e.g. for the
  // router-level-middleware anchor) which won't match anything
  // useful, so the block extends to EOF — that's fine because the
  // assert we look for is always close to the anchor.
  const routerName = anchor.split(".")[0];
  const nextRoutePattern = new RegExp(`\\n${routerName}\\.[a-z]+\\(`);
  const nextMatch = tail.match(nextRoutePattern);
  const end = nextMatch?.index ?? tail.length;

  return anchor + tail.slice(0, end);
}

/** Whitespace-insensitive substring check. */
function containsCall(haystack: string, needle: string): boolean {
  const norm = (s: string) => s.replace(/\s+/g, "");
  return norm(haystack).includes(norm(needle));
}

describe("Enterprise-feature gating · router wiring", () => {
  for (const gate of EE_GATES) {
    test(`${gate.label} · ${gate.file} → ${gate.assert}`, () => {
      const source = readModuleSource(gate.file);
      const block = blockFor(source, gate.anchor);
      expect(
        containsCall(block, gate.assert),
        `Expected ${gate.label} (${gate.file}) block starting at "${gate.anchor}" ` +
          `to contain \`${gate.assert}\`, but it did not. ` +
          `If this gate was intentionally removed, delete the matching row in EE_GATES.`,
      ).toBe(true);
    });
  }

  // Defence in depth: every router file we touched must import the
  // helper. Catches the embarrassing regression where someone deletes
  // every `await assertEnterpriseLicense(...)` call but leaves a
  // dangling unused-import line that lints still tolerate.
  test("every gated router imports assertEnterpriseLicense from @trustalo/license", () => {
    const files = Array.from(new Set(EE_GATES.map((g) => g.file)));
    for (const file of files) {
      const source = readModuleSource(file);
      expect(
        source.includes('from "@trustalo/license"') && source.includes("assertEnterpriseLicense"),
        `${file} must import assertEnterpriseLicense from @trustalo/license`,
      ).toBe(true);
    }
  });

  // Trust Center has a *public* counterpart that intentionally is
  // NOT license-gated (prospects must be able to view a vendor's
  // published Trust Center even from a non-EE deployment). Lock
  // this in so a future hardening pass doesn't accidentally lock
  // prospects out.
  test("trustCenterPublicRouter is intentionally NOT license-gated", () => {
    const source = readModuleSource("trust-center/router.ts");
    const pubStart = source.indexOf("export const trustCenterPublicRouter");
    const pubEnd = source.indexOf("export const trustCenterRouter");
    expect(pubStart).toBeGreaterThan(-1);
    expect(pubEnd).toBeGreaterThan(pubStart);
    const publicBlock = source.slice(pubStart, pubEnd);
    expect(publicBlock.includes("assertEnterpriseLicense")).toBe(false);
  });
});
