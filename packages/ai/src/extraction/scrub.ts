/**
 * PII pre-pass — runs on user text BEFORE it leaves Trustalo for the LLM.
 *
 * The compliance assistant and the paste-to-extract flow both accept
 * free-form prose written by humans. People copy-paste runbooks, support
 * tickets, vendor emails, employee names, customer addresses, IP
 * addresses from production logs and so on. Forwarding that verbatim
 * to a third-party model has two costs:
 *
 *   1. Confidentiality — sending raw PII to OpenAI/Anthropic/Bedrock can
 *      itself be a regulated transfer (Art. 28/Art. 44 GDPR, sub-processor
 *      requirements). Trustalo's value prop is that customers don't have
 *      to think about that.
 *   2. Quality — names and email addresses are rarely useful to a fact
 *      extractor. Stripping them keeps the model focused on the actual
 *      compliance signal ("we run on AWS", not "Alice from accounts said
 *      we run on AWS").
 *
 * Scope intentionally narrow:
 *   • Email addresses                 → "[email]"
 *   • E.164 / formatted phone numbers → "[phone]"
 *   • IPv4 / IPv6 addresses           → "[ip]"
 *   • Long digit runs (≥9 digits)     → "[number]"     (catches CC, SSN, NID)
 *   • URL credentials (`https://user:pass@host`) → "https://[host]"
 *
 * Out of scope (handled at the prompt layer instead):
 *   • Person names — not reliably detectable without an NER model and
 *     replacing every capitalised word breaks compliance terminology.
 *   • Free-form addresses — same reason. The system prompt instructs
 *     the model not to extract personal data.
 *
 * Returns the scrubbed text plus a redaction summary so call sites can
 * surface "we redacted N items before sending" to the user when useful.
 */

export interface ScrubResult {
  text: string;
  redactions: {
    email: number;
    phone: number;
    ip: number;
    number: number;
    urlCredential: number;
  };
  /** Total tokens of all redactions, for one-line UI summary. */
  total: number;
}

const PATTERNS: Array<{
  key: keyof ScrubResult["redactions"];
  re: RegExp;
  replace: string;
}> = [
  // URL credentials must run BEFORE the email pattern so foo:bar@host
  // isn't rewritten to "[email]".
  {
    key: "urlCredential",
    re: /\b(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi,
    replace: "$1",
  },
  {
    key: "email",
    re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replace: "[email]",
  },
  // IPv4 first (more restrictive), then IPv6.
  {
    key: "ip",
    re: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    replace: "[ip]",
  },
  {
    key: "ip",
    // Matches uncompressed and compressed IPv6 (with `::`) without
    // greedily eating non-IPv6 hex sequences elsewhere in the text.
    re: /\b(?:[A-F0-9]{1,4}:){2,7}[A-F0-9]{1,4}\b|::[A-F0-9:]+\b/gi,
    replace: "[ip]",
  },
  {
    key: "phone",
    // E.164-ish + common formatted forms. Conservative on minimum
    // length to avoid catching version numbers.
    re: /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}(?:[\s.-]?\d{2,4})?/g,
    replace: "[phone]",
  },
  {
    key: "number",
    // Catches credit-card / SSN / national-ID style runs. Phone is
    // already handled above; this is a final net.
    re: /\b\d{9,}\b/g,
    replace: "[number]",
  },
];

export function scrubPii(input: string): ScrubResult {
  let text = input;
  const redactions = { email: 0, phone: 0, ip: 0, number: 0, urlCredential: 0 };

  for (const { key, re, replace } of PATTERNS) {
    let count = 0;
    text = text.replace(re, (...args) => {
      count += 1;
      // Honour capture-group back-references in `replace` (the URL
      // credential pattern uses $1) without losing the match handler.
      if (replace.includes("$")) {
        const captures = args.slice(1, -2) as string[];
        return replace.replace(/\$(\d)/g, (_, i) => captures[Number(i) - 1] ?? "");
      }
      return replace;
    });
    redactions[key] += count;
  }

  const total =
    redactions.email +
    redactions.phone +
    redactions.ip +
    redactions.number +
    redactions.urlCredential;

  return { text, redactions, total };
}
