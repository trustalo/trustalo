/**
 * Chat system prompt — defines the assistant's role, the citation
 * contract, and the JSON envelope it MUST emit.
 *
 * Phase 2 of the "ongoing AI context" plan. Kept in its own module so
 * the prompt can be unit-tested and so the SSE turn handler stays focused
 * on transport concerns.
 *
 * Output contract
 * ───────────────
 * The model must reply as a SINGLE valid JSON object:
 *
 *   {
 *     "answer": "<markdown answer for the user>",
 *     "citations": [
 *       { "kind": "policy" | "risk" | "vendor" | "control"
 *               | "framework" | "context" | "message",
 *         "id": "<id from the grounding bundle>",
 *         "label": "<human label from the bundle>" }
 *     ]
 *   }
 *
 * Why JSON instead of free text:
 *   • Lets us validate citations against the grounding bundle and drop
 *     hallucinated ids (see filterValidCitations in grounding.ts).
 *   • Keeps streaming chunks parseable by buffering until a complete
 *     JSON object is seen, then surfacing the answer + citations to the
 *     client. (Phase 2 ships with non-token-streaming first; the JSON
 *     envelope reuse is a forward-compat hook for incremental SSE.)
 */

import type { GroundingBundle } from "./grounding.js";
import { renderBundleAsPrompt } from "./grounding.js";

const ROLE_AND_RULES = `You are Trustalo's compliance assistant. You help the user reason about their organisation's security, privacy, and compliance posture.

Hard rules — follow ALL of them:

1. ONLY use facts that appear in the "Grounding bundle" section below or in earlier turns of THIS conversation. Do NOT speculate from general knowledge about this organisation. If the bundle does not contain the information needed to answer, say so explicitly.
2. NEVER mutate state. You cannot create, edit, accept, or delete records. You can only suggest the user do something via the UI; you may not pretend to take an action.
3. NEVER expose secrets, API keys, raw PII, or content the user has not already shared in this conversation.
4. When you reference an item from the grounding bundle, cite it. Each citation MUST use one of the bundle ids exactly as it appears (e.g. "policy:abc123", "risk:def456").
5. Output a SINGLE valid JSON object matching the contract below. No prose outside the JSON. No markdown fences. No leading commentary.

Output contract:
{
  "answer": "<markdown text shown to the user>",
  "citations": [
    { "kind": "policy" | "risk" | "vendor" | "control" | "framework" | "context" | "message",
      "id": "<id from the bundle>",
      "label": "<short human label>" }
  ]
}

Style guidance for "answer":
- Be concise. Lead with the takeaway in one sentence, then expand.
- Use Markdown (headings, bullets, code) where it improves clarity.
- When proposing action, frame as "you could…" or "consider…", never "I will…".
- If the user appears to be sharing new facts about their organisation, do NOT add them to the response — a parallel pipeline is extracting them into proposals for the user to review.
`;

export interface BuildSystemPromptInput {
  bundle: GroundingBundle;
  /**
   * The PII-scrubbed user turn (only used here to keep the bundle and
   * turn together in a single system prompt for providers that don't
   * support multi-message system context). For most providers the
   * caller should pass the user turn as a separate `user` message and
   * leave this empty.
   */
  inlineUserTurn?: string;
}

export function buildChatSystemPrompt(input: BuildSystemPromptInput): string {
  const { bundle, inlineUserTurn } = input;
  const sections: string[] = [
    ROLE_AND_RULES,
    "## Grounding bundle",
    `Bundle version: ${bundle.version}`,
    `Bundle hash: ${bundle.groundingHash}`,
    "",
    renderBundleAsPrompt(bundle),
  ];
  if (inlineUserTurn) {
    sections.push("", "## User turn", inlineUserTurn);
  }
  return sections.join("\n");
}

/**
 * Try to parse the model's JSON envelope. Returns `null` when the
 * response is not valid JSON — the caller should surface a generic
 * "model returned an unparseable response" error and audit the failure.
 */
export function parseAssistantEnvelope(
  raw: string,
): { answer: string; citations: unknown[] } | null {
  // Strip common markdown-fence wrappers some models emit despite the
  // contract above.
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  try {
    const parsed = JSON.parse(text);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as { answer?: unknown }).answer !== "string"
    ) {
      return null;
    }
    const citations = Array.isArray((parsed as { citations?: unknown }).citations)
      ? (parsed as { citations: unknown[] }).citations
      : [];
    return {
      answer: (parsed as { answer: string }).answer,
      citations,
    };
  } catch {
    return null;
  }
}
