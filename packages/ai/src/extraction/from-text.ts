/**
 * Context extraction — turn a paragraph of pasted (or chatted) prose
 * into a list of structured `TenantContext` proposals.
 *
 * Phase 1 of the "ongoing AI context" plan. The extractor runs in two
 * places:
 *
 *   1. /settings/ai-context "Paste to extract" — the user dumps an
 *      onboarding doc, vendor email, runbook, etc. The proposals
 *      surface in a review queue.
 *   2. /chat — every user turn is fed through the same extractor in
 *      parallel with the assistant reply (see chat/grounding.ts).
 *
 * Hard constraints:
 *   • The output is bounded by `MAX_PROPOSALS` so a long paragraph can't
 *     produce 200 review cards.
 *   • Each proposal carries a confidence the model self-assigned. The
 *     review UI surfaces a "Low confidence" chip below 0.5.
 *   • Output is validated against a strict Zod schema; anything off-shape
 *     (extra fields, wrong category, NaN confidence) is dropped silently
 *     rather than crashing the request — extraction is best-effort.
 *   • The model NEVER receives `existingContext` answers verbatim. It
 *     receives a compact `(category, question, answer-hash)` summary so
 *     it can choose to mark a proposal as `supersedes` an existing row
 *     without leaking the existing answer back into its training-data
 *     surface.
 *
 * The extractor also instructs the model to skip personal data (names,
 * addresses, employee identifiers) — those facts shouldn't live in
 * TenantContext at all, they belong on the relevant Privacy or
 * RoPA model.
 */
import { z } from "zod";
import type { AIProvider } from "../types.js";
import { scrubPii } from "./scrub.js";

export const CONTEXT_CATEGORIES = [
  "company",
  "tech_stack",
  "processes",
  "data_handling",
  "risk_appetite",
  "team",
] as const;
export type ContextCategory = (typeof CONTEXT_CATEGORIES)[number];

const FactProposalSchema = z.object({
  category: z.enum(CONTEXT_CATEGORIES),
  question: z.string().trim().min(3).max(200),
  answer: z.string().trim().min(1).max(2000),
  confidence: z.number().min(0).max(1),
  rationale: z.string().trim().max(500).optional(),
  /// Optional: the model thinks this proposal updates an existing fact.
  /// Validated against the existing-context summary client-side; if the
  /// id is unknown the supersedes hint is dropped.
  supersedesContextId: z.string().min(1).max(64).optional(),
});

const ExtractionResultSchema = z.object({
  proposals: z.array(FactProposalSchema),
});

export type FactProposal = z.infer<typeof FactProposalSchema>;
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

/// Compact summary of an existing TenantContext row sent to the
/// extractor so it can flag proposals that supersede an existing fact.
/// Intentionally omits the answer text to limit data exfiltration risk.
export interface ExistingContextRef {
  id: string;
  category: ContextCategory;
  question: string;
}

export interface ExtractContextProposalsInput {
  /** User-supplied prose. Will be PII-scrubbed before reaching the LLM. */
  text: string;
  /** Compact summary of currently-active context rows. */
  existingContext?: ExistingContextRef[];
  /** Override for the upper bound on returned proposals. Default 8. */
  maxProposals?: number;
}

export interface ExtractContextProposalsResult {
  proposals: FactProposal[];
  /** Number of proposals the model returned that we dropped on validation. */
  dropped: number;
  /** PII redaction summary so the caller can show "we redacted N items". */
  redactions: ReturnType<typeof scrubPii>["redactions"];
}

const MAX_PROPOSALS_DEFAULT = 8;
/// Hard cap regardless of caller input — protects the review queue from
/// being flooded by a malicious or buggy caller.
const MAX_PROPOSALS_CEILING = 20;
/// Bound on user input. Larger inputs are truncated with a note in the
/// prompt so the model knows it didn't see everything.
const MAX_INPUT_CHARS = 12_000;
/// Bound on how many existing-context rows we surface to the model.
const MAX_EXISTING_REFS = 60;

const SYSTEM_PROMPT = `You are a compliance analyst that extracts durable, factual statements about an organisation from prose written by one of its employees.

Your output is a JSON object: { "proposals": FactProposal[] }.

Each FactProposal has:
  - category: one of company, tech_stack, processes, data_handling, risk_appetite, team
  - question: the canonical question this fact answers (e.g. "Where do you host production?")
  - answer:   the fact, in the org's own words, ≤ 400 chars
  - confidence: 0..1 self-assessment of how clearly the source text supports the fact
  - rationale: optional one-sentence explanation of why this fact matters for compliance
  - supersedesContextId: optional id from the "existing facts" list when this fact updates / replaces an existing one

Hard rules:
  1. Output ONLY a single JSON object — no markdown fences, no commentary.
  2. Extract DURABLE facts about the organisation only — hosting region, deployment cadence, data classification policy, incident response contact role (NOT name), vendor list, certifications held, etc.
  3. NEVER extract personal data (names, email addresses, phone numbers, customer identifiers, employee IDs). They will already be redacted, but if anything that looks personal slips through, drop it.
  4. NEVER invent facts not supported by the source text. Lower confidence if the source is ambiguous.
  5. If the same fact appears multiple times, return it once with the clearest phrasing.
  6. Prefer to mark proposals as supersedesContextId when they replace an existing row's answer (e.g. "we moved from us-east-1 to ap-southeast-2").
  7. Use the category that best matches; if uncertain, use "company".`;

/**
 * Run the extractor. Returns at most `maxProposals` validated proposals.
 * Drops any malformed proposals silently — extraction is advisory, never
 * mission-critical, so a partial result is better than throwing.
 */
export async function extractContextProposals(
  provider: AIProvider,
  input: ExtractContextProposalsInput,
): Promise<ExtractContextProposalsResult> {
  const cap = Math.min(input.maxProposals ?? MAX_PROPOSALS_DEFAULT, MAX_PROPOSALS_CEILING);

  const scrubbed = scrubPii(input.text.slice(0, MAX_INPUT_CHARS));
  const truncated = input.text.length > MAX_INPUT_CHARS;

  const existing = (input.existingContext ?? []).slice(0, MAX_EXISTING_REFS);

  const userPrompt = [
    `Extract up to ${cap} fact proposals from the source text below.`,
    "",
    truncated
      ? `Source text (TRUNCATED to first ${MAX_INPUT_CHARS} characters — extract only what is supported by what you can see):`
      : "Source text:",
    "```",
    scrubbed.text,
    "```",
    "",
    existing.length > 0
      ? [
          "Existing facts on file (for the supersedes hint — do NOT echo these back unless the source text genuinely updates them):",
          ...existing.map((e) => `  - id=${e.id} [${e.category}] ${e.question}`),
        ].join("\n")
      : "Existing facts on file: (none)",
    "",
    `Respond with: { "proposals": [ /* up to ${cap} entries */ ] }`,
  ].join("\n");

  const completion = await provider.chat({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    responseFormat: "json",
    maxTokens: 1500,
  });

  const parsed = safeParseJson(completion.content);
  if (!parsed) {
    return { proposals: [], dropped: 0, redactions: scrubbed.redactions };
  }

  const validated = ExtractionResultSchema.safeParse(parsed);
  if (!validated.success) {
    // Try a partial-rescue: walk the array element-by-element so a single
    // bad entry doesn't drop the whole batch.
    return rescuePartial(parsed, cap, existing, scrubbed.redactions);
  }

  const validIds = new Set(existing.map((e) => e.id));
  const cleaned = validated.data.proposals.slice(0, cap).map((p) => ({
    ...p,
    // Drop supersedes hints that don't match a known id — prevents the
    // model from inventing ids that would corrupt the supersession
    // chain on accept.
    supersedesContextId:
      p.supersedesContextId && validIds.has(p.supersedesContextId)
        ? p.supersedesContextId
        : undefined,
  }));

  return {
    proposals: cleaned,
    dropped: Math.max(0, validated.data.proposals.length - cleaned.length),
    redactions: scrubbed.redactions,
  };
}

function safeParseJson(raw: string): unknown | null {
  try {
    // Some providers wrap JSON in ```json fences despite responseFormat:json.
    const stripped = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "");
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

function rescuePartial(
  payload: unknown,
  cap: number,
  existing: ExistingContextRef[],
  redactions: ScrubResult["redactions"],
): ExtractContextProposalsResult {
  const list =
    payload && typeof payload === "object" && "proposals" in payload
      ? (payload as { proposals?: unknown[] }).proposals
      : null;
  if (!Array.isArray(list)) {
    return { proposals: [], dropped: 0, redactions };
  }

  const validIds = new Set(existing.map((e) => e.id));
  const accepted: FactProposal[] = [];
  let dropped = 0;
  for (const item of list) {
    if (accepted.length >= cap) {
      dropped += 1;
      continue;
    }
    const parsed = FactProposalSchema.safeParse(item);
    if (!parsed.success) {
      dropped += 1;
      continue;
    }
    accepted.push({
      ...parsed.data,
      supersedesContextId:
        parsed.data.supersedesContextId && validIds.has(parsed.data.supersedesContextId)
          ? parsed.data.supersedesContextId
          : undefined,
    });
  }
  return { proposals: accepted, dropped, redactions };
}

// Re-export for callers that want both — matches the prompts/quiz pattern.
type ScrubResult = ReturnType<typeof scrubPii>;
