import DOMPurify from "isomorphic-dompurify";

/**
 * Strip every HTML tag and return only the text content. Built on
 * DOMPurify so we use a real HTML parser instead of regex (regex-based
 * HTML stripping was flagged by CodeQL `js/bad-tag-filter` and
 * `js/incomplete-multi-character-sanitization`: e.g. an attacker could
 * smuggle `<sty<style>le>` past a single regex pass).
 *
 * Output is a single line of whitespace-collapsed text, suitable for
 * length budgets and AI prompt construction (which is the only caller
 * today).
 */
export function stripHtml(input: string): string {
  const text = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  return text.replace(/[\s\u00a0]+/g, " ").trim();
}
