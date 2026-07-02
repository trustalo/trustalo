import { describe, expect, test } from "bun:test";
import {
  buildChatSystemPrompt,
  buildFrameworkPersonas,
  parseAssistantEnvelope,
} from "./system-prompt.ee.js";
import type { GroundingBundle, FrameworkSummary } from "./grounding.ee.js";

function makeFramework(overrides: Partial<FrameworkSummary> = {}): FrameworkSummary {
  return {
    id: "fw-1",
    name: "ISO 27001",
    version: "2022",
    status: "in_progress",
    frameworkType: "iso27001",
    ...overrides,
  };
}

function makeBundle(overrides: Partial<GroundingBundle> = {}): GroundingBundle {
  return {
    version: "v1.1",
    tenantId: "tenant-1",
    contexts: [],
    policies: [],
    risks: [],
    vendors: [],
    controls: [],
    frameworks: [],
    recentMessages: [],
    pageContext: null,
    focusCitation: null,
    citations: [],
    groundingHash: "hash-stub",
    ...overrides,
  };
}

describe("buildFrameworkPersonas", () => {
  test("returns empty string when no frameworks adopted", () => {
    const bundle = makeBundle();
    expect(buildFrameworkPersonas(bundle)).toBe("");
  });

  test("returns empty string when adopted frameworks have no persona", () => {
    const bundle = makeBundle({
      frameworks: [makeFramework({ frameworkType: "iso27001" })],
    });
    // ISO 27001 has no dedicated persona today — only CPS 234 / GDPR /
    // HIPAA / PCI DSS do.
    expect(buildFrameworkPersonas(bundle)).toBe("");
  });

  test("emits HIPAA persona when hipaa is adopted", () => {
    const bundle = makeBundle({
      frameworks: [
        makeFramework({
          id: "fw-hipaa",
          frameworkType: "hipaa",
          name: "HIPAA",
        }),
      ],
    });
    const personas = buildFrameworkPersonas(bundle);
    expect(personas).toContain("HIPAA");
    expect(personas).toContain("60 calendar days");
    expect(personas).toContain("164.404");
    expect(personas).toContain("business associate");
    expect(personas).toContain("Addressable");
  });

  test("emits PCI DSS persona when pci_dss_4 is adopted", () => {
    const bundle = makeBundle({
      frameworks: [
        makeFramework({
          id: "fw-pci",
          frameworkType: "pci_dss_4",
          name: "PCI DSS",
        }),
      ],
    });
    const personas = buildFrameworkPersonas(bundle);
    expect(personas).toContain("PCI DSS v4.0.1");
    expect(personas).toContain("three months");
    expect(personas).toContain("11.3.2");
    expect(personas).toContain("customized approach");
  });

  test("emits CPS 234 persona when cps234 is adopted", () => {
    const bundle = makeBundle({
      frameworks: [
        makeFramework({
          id: "fw-cps234",
          frameworkType: "cps234",
          name: "APRA CPS 234",
        }),
      ],
    });
    const personas = buildFrameworkPersonas(bundle);
    expect(personas).toContain("CPS 234");
    expect(personas).toContain("72 hours");
    expect(personas).toContain("10 business days");
    expect(personas).toContain("Para 33");
    expect(personas).toContain("Para 35");
  });

  test("does not duplicate the persona when same frameworkType appears twice", () => {
    const bundle = makeBundle({
      frameworks: [
        makeFramework({ id: "fw-a", frameworkType: "cps234" }),
        makeFramework({ id: "fw-b", frameworkType: "cps234" }),
      ],
    });
    const personas = buildFrameworkPersonas(bundle);
    const occurrences = personas.match(/Regulated framework: APRA CPS 234/g) ?? [];
    expect(occurrences.length).toBe(1);
  });

  test("emits both personas in stable order when CPS 234 + GDPR are both adopted", () => {
    const bundle = makeBundle({
      frameworks: [
        makeFramework({ id: "fw-1", frameworkType: "cps234" }),
        makeFramework({ id: "fw-2", frameworkType: "gdpr" }),
      ],
    });
    const personas = buildFrameworkPersonas(bundle);
    expect(personas.indexOf("CPS 234")).toBeLessThan(personas.indexOf("GDPR"));
  });
});

describe("buildChatSystemPrompt", () => {
  test("includes the global hard rules and bundle metadata", () => {
    const bundle = makeBundle();
    const prompt = buildChatSystemPrompt({ bundle });
    expect(prompt).toContain("Trustalo's compliance assistant");
    expect(prompt).toContain("Bundle version: v1.1");
    expect(prompt).toContain("Bundle hash: hash-stub");
  });

  test("does NOT include any persona block for non-regulated frameworks", () => {
    const bundle = makeBundle({
      frameworks: [makeFramework({ frameworkType: "iso27001" })],
    });
    const prompt = buildChatSystemPrompt({ bundle });
    expect(prompt).not.toContain("Regulated framework:");
  });

  test("includes the CPS 234 persona only when cps234 is adopted", () => {
    const bundle = makeBundle({
      frameworks: [makeFramework({ frameworkType: "cps234" })],
    });
    const prompt = buildChatSystemPrompt({ bundle });
    expect(prompt).toContain("Regulated framework: APRA CPS 234");
    expect(prompt).toContain("72 hours");
    expect(prompt).toContain("10 business days");
    // Persona must come BEFORE the grounding bundle SECTION HEADER so
    // the model treats it as part of the role definition. (We anchor on
    // the literal section header `## Grounding bundle`, not the phrase
    // "Grounding bundle" which also appears in ROLE_AND_RULES.)
    expect(prompt.indexOf("Regulated framework: APRA CPS 234")).toBeLessThan(
      prompt.indexOf("## Grounding bundle"),
    );
  });

  test("appends inline user turn when supplied", () => {
    const bundle = makeBundle();
    const prompt = buildChatSystemPrompt({ bundle, inlineUserTurn: "Are we Para 33 notifiable?" });
    expect(prompt).toContain("## User turn");
    expect(prompt).toContain("Are we Para 33 notifiable?");
  });
});

describe("parseAssistantEnvelope", () => {
  test("parses a clean JSON envelope", () => {
    const out = parseAssistantEnvelope(JSON.stringify({ answer: "ok", citations: [] }));
    expect(out).not.toBeNull();
    expect(out!.answer).toBe("ok");
    expect(out!.citations).toEqual([]);
  });

  test("strips ```json fences", () => {
    const out = parseAssistantEnvelope('```json\n{"answer":"ok","citations":[]}\n```');
    expect(out).not.toBeNull();
    expect(out!.answer).toBe("ok");
  });

  test("returns null for non-JSON content", () => {
    expect(parseAssistantEnvelope("hello there")).toBeNull();
  });

  test("returns null when answer is missing", () => {
    expect(parseAssistantEnvelope('{"citations":[]}')).toBeNull();
  });
});
