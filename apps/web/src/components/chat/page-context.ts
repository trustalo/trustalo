/**
 * Derive a {@link ChatPageContext} from the current pathname.
 *
 * The chat assistant is page-aware: when the user is on a record-detail
 * route (e.g. `/risks/abc123`), we tag the chat turn with the route +
 * record id so the backend can pin that record to the top of the
 * grounding bundle. The user can then ask "what should we do about
 * this risk?" without re-stating the record name.
 *
 * Patterns are intentionally conservative: we only set `recordKind`
 * when the route shape unambiguously maps to a known tenant entity.
 * Adding a new pattern here is a one-line change; mismatches just
 * fall back to a path-only context (still useful — the assistant
 * sees "the user is on the Vendors list").
 */
import type { ChatPageContext, ChatPageRecordKind } from "@/lib/api-client";

interface RoutePattern {
  /** Compiled regex; the first capture group is the record id. */
  pattern: RegExp;
  recordKind: ChatPageRecordKind;
}

// Order matters: more specific patterns first.
const ROUTE_PATTERNS: RoutePattern[] = [
  { pattern: /^\/risks\/([^/?#]+)(?:\/.*)?$/, recordKind: "risk" },
  { pattern: /^\/policies\/([^/?#]+)(?:\/.*)?$/, recordKind: "policy" },
  { pattern: /^\/vendors\/([^/?#]+)(?:\/.*)?$/, recordKind: "vendor" },
  { pattern: /^\/controls\/([^/?#]+)(?:\/.*)?$/, recordKind: "control" },
  { pattern: /^\/frameworks\/([^/?#]+)(?:\/.*)?$/, recordKind: "framework" },
];

// Routes whose first segment is a tenant kind but the trailing token
// is a section name, not a record id. These should NOT be treated as
// focus-record routes.
const NON_RECORD_TOKENS = new Set([
  "new",
  "create",
  "import",
  "settings",
  "templates",
  "register",
  "list",
]);

export function derivePageContext(pathname: string, documentTitle?: string): ChatPageContext {
  for (const { pattern, recordKind } of ROUTE_PATTERNS) {
    const match = pattern.exec(pathname);
    if (!match) continue;
    const recordId = match[1];
    if (!recordId || NON_RECORD_TOKENS.has(recordId)) {
      // List page or special action — fall through to path-only context.
      break;
    }
    return {
      path: pathname,
      title: documentTitle ?? null,
      recordKind,
      recordId,
    };
  }
  return {
    path: pathname,
    title: documentTitle ?? null,
    recordKind: null,
    recordId: null,
  };
}
