/**
 * The channel-agnostic alert payload the evaluator (and the test-send
 * endpoint) hands to a channel sender. Senders format this into their
 * wire shape (SMTP message, Slack/Teams webhook JSON).
 */
export interface AlertMessage {
  /** Rule that fired, e.g. `device_at_risk` (or `test` for test-sends). */
  ruleKey: string;
  /** Human rule label, e.g. "Device at risk". */
  ruleLabel: string;
  /** One-line description of the specific condition. */
  summary: string;
  /** Tenant organization name, shown so shared channels stay unambiguous. */
  tenantName: string;
  /** App path to the relevant page, e.g. `/incidents`. */
  linkPath: string;
}

/**
 * Base URL the web app is served from, for links in outbound messages.
 * `WEB_APP_URL` when set; otherwise the first CORS allowed origin (which is
 * the web app in every deployment profile); otherwise the local-dev default.
 */
export function appBaseUrl(): string {
  const explicit = process.env.WEB_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const corsFirst = process.env.CORS_ALLOWED_ORIGINS?.split(",")[0]?.trim();
  if (corsFirst) return corsFirst.replace(/\/$/, "");
  return "http://localhost:15000";
}

/** `"[Trustalo] Device at risk — Acme Corp"` — shared subject/title line. */
export function alertTitle(message: AlertMessage): string {
  return `[Trustalo] ${message.ruleLabel} — ${message.tenantName}`;
}
