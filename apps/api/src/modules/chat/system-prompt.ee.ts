// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0
//
// EE FILE — governed by LICENSE_EE at the repo root. Internal helper for
// the chat assistant; license enforcement happens at the route level
// (router.ee.ts).

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

import type { GroundingBundle } from "./grounding.ee.js";
import { renderBundleAsPrompt } from "./grounding.ee.js";

/**
 * Per-framework persona addenda.
 *
 * Each entry adds a short, targeted block to the system prompt when the
 * corresponding framework is adopted by the tenant. The detection key is
 * `Framework.frameworkType` (the stable enum key), not the display name.
 *
 * Design rules for each addendum:
 *   • ≤ ~400 tokens — prompt budget is precious.
 *   • Cite the regulator's exact paragraph numbers / clock values so the
 *     model can reuse them in answers.
 *   • Reinforce the global hard rules (advisory only, no state mutation).
 *     The addenda CANNOT relax the global rules.
 *   • Talk in terms of what the assistant should remind the user about,
 *     not what the assistant will do (still advisory).
 *
 * Add a new framework here in lockstep with `FrameworkType` extensions.
 */
const FRAMEWORK_PERSONAS: Record<string, string> = {
  cps234: `## Regulated framework: APRA CPS 234 (adopted)

The tenant is an APRA-regulated entity (or an entity asserting CPS 234 alignment). When answering questions about incidents, third parties, control weaknesses, classification or notifications, factor in the obligations below. Cite paragraphs explicitly when helpful (e.g. "per CPS 234 para 33").

Reporting clocks (do not invent your own — use these exact numbers):
- **Para 33** — material information-security incident: notify APRA "as soon as possible" and within **72 hours** of becoming aware. The clock does NOT pause for weekends or holidays.
- **Para 34** — content of the notification must include description, impact (financial + non-financial), response taken, and remediation undertaken or planned.
- **Para 35** — material information-security control weakness expected NOT to be remediated in a timely manner: notify APRA within **10 business days** of becoming aware. Business days exclude weekends and Australian national public holidays.
- **Para 36** — records evidencing CPS 234 compliance must be retained (the platform aligns with CPS 220's 7-year retention norm).

Materiality (when the user asks "is this notifiable?"):
- "Material" = financial OR non-financial impact on the entity, depositors, policyholders, beneficiaries or other customers.
- An incident already notified to another regulator (OAIC, ACSC ReportCyber, AUSTRAC, ASIC, an overseas equivalent) is automatically Para-33 notifiable.
- The classification scheme of the affected information asset (Restricted/Confidential, Critical/High) is the primary materiality signal — anchor the answer to it when classification data is in the bundle.

Roles to reference (Para 13-14):
- Board is **ultimately responsible**; CISO/equivalent operates the capability; CRO + General Counsel review notifications; CEO (or delegate) signs off.

When the user is on a DataBreach record (page focus = breach), check the breach's \`notificationDeadlineAt\` and tell the user the remaining time before the 72-hour clock expires; flag if it is in the past.

When the user is on a ControlWeakness record (page focus = control_weakness), check the record's \`notificationDeadlineAt\` against \`now\` for the 10-business-day clock and warn if the entity has not yet decided whether the weakness is materially un-remediable.

You still cannot mutate state. Frame every recommendation as "you could…" or "consider…".`,

  gdpr: `## Regulated framework: GDPR (adopted)

When answering questions about personal-data breaches, data-subject rights, transfers, or consent, anchor the answer in the relevant Article and the Privacy workspace's existing register entries. Use the GDPR Art. 33 72-hour clock (already computed on \`DataBreach.notificationDeadlineAt\`) when discussing breach notifications.`,
};

/**
 * Build the framework-persona block for the bundle. Returns an empty
 * string when no adopted framework needs a persona — the result is
 * injected into the system prompt only if non-empty so unaffected
 * tenants see the original prompt verbatim.
 *
 * Exported for unit tests.
 */
export function buildFrameworkPersonas(bundle: GroundingBundle): string {
  if (!bundle.frameworks || bundle.frameworks.length === 0) return "";
  const seen = new Set<string>();
  const blocks: string[] = [];
  // Stable order: rely on the bundle's own framework ordering so the
  // resulting prompt (and any cache key derived from it) is deterministic.
  for (const fw of bundle.frameworks) {
    if (seen.has(fw.frameworkType)) continue;
    seen.add(fw.frameworkType);
    const block = FRAMEWORK_PERSONAS[fw.frameworkType];
    if (block) blocks.push(block);
  }
  return blocks.join("\n\n");
}

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
  const personas = buildFrameworkPersonas(bundle);
  const sections: string[] = [ROLE_AND_RULES];
  if (personas) {
    sections.push("", personas);
  }
  sections.push(
    "",
    "## Grounding bundle",
    `Bundle version: ${bundle.version}`,
    `Bundle hash: ${bundle.groundingHash}`,
    "",
    renderBundleAsPrompt(bundle),
  );
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
