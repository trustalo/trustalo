/**
 * Deployment-mode configuration.
 *
 * Trustalo ships in two postures:
 *
 *   • saas         — Trustalo-hosted multi-tenant. Operators (us) own
 *                    the AI keys, S3 buckets, etc. End users are
 *                    customer staff (CISOs, ISOs, GRC analysts) who
 *                    must NEVER see internal/upstream provider error
 *                    messages, API key fragments, file paths, hostnames,
 *                    or stack traces. They get friendly, actionable
 *                    error copy and we keep the gory detail in logs.
 *
 *   • self_hosted  — Customer-deployed (k8s, docker-compose). The end
 *                    user IS the operator/admin and can usefully see
 *                    the upstream error to fix their own configuration.
 *                    Even here we still scrub obvious secrets from the
 *                    response — defense in depth.
 *
 * The default is `saas` because leaking-by-omission is the dangerous
 * mode. A self-hosted deploy explicitly sets DEPLOYMENT_MODE=self_hosted.
 */

export type DeploymentMode = "saas" | "self_hosted";

let cached: DeploymentMode | null = null;

/** Resolved once at first read. Tests can call `__resetDeploymentMode()`. */
export function getDeploymentMode(): DeploymentMode {
  if (cached) return cached;
  const raw = (process.env.DEPLOYMENT_MODE ?? "saas").trim().toLowerCase();
  cached = raw === "self_hosted" || raw === "self-hosted" ? "self_hosted" : "saas";
  return cached;
}

export function isSaaSMode(): boolean {
  return getDeploymentMode() === "saas";
}

/** Test hook. */
export function __resetDeploymentMode(): void {
  cached = null;
}

// ─── Secret / PII scrubbing ────────────────────────────────────────

/**
 * Patterns that must NEVER appear in a response body, regardless of
 * deployment mode. Each pattern replaces the match with a fixed
 * redaction so logs/responses remain readable.
 *
 * Order matters: longer / more-specific patterns first so the generic
 * "sk-…" fallback doesn't shadow project keys.
 */
const SECRET_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // OpenAI project keys (sk-proj-XXXX… or sk-svcacct-XXXX…), incl. the
  // partially-redacted form `sk-proj-***D6EA` we saw leak in the UI.
  { pattern: /sk-(?:proj|svcacct)-[A-Za-z0-9*_\-]{4,}/g, replacement: "[REDACTED_OPENAI_KEY]" },
  // Generic OpenAI keys: sk- followed by 20+ chars (avoid clobbering
  // english words by requiring a long alnum tail).
  { pattern: /\bsk-[A-Za-z0-9]{20,}/g, replacement: "[REDACTED_OPENAI_KEY]" },
  // Anthropic: sk-ant-… plus possible variants.
  { pattern: /\bsk-ant-[A-Za-z0-9_\-]{10,}/g, replacement: "[REDACTED_ANTHROPIC_KEY]" },
  // OpenRouter: sk-or-…
  { pattern: /\bsk-or-[A-Za-z0-9_\-]{10,}/g, replacement: "[REDACTED_OPENROUTER_KEY]" },
  // AWS access key ids (AKIA / ASIA + 16 chars).
  { pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, replacement: "[REDACTED_AWS_KEY]" },
  // JWT-like tokens (xxx.yyy.zzz, very rough).
  {
    pattern: /\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b/g,
    replacement: "[REDACTED_JWT]",
  },
  // Bearer tokens.
  { pattern: /\bBearer\s+[A-Za-z0-9_.\-]+/gi, replacement: "Bearer [REDACTED]" },
  // Long opaque hex tokens (32+ chars) commonly used as API keys.
  { pattern: /\b[a-f0-9]{32,}\b/gi, replacement: "[REDACTED_TOKEN]" },
];

/**
 * Strip secret-looking substrings from any user-facing error string.
 * Always run before sending an error to the wire — including in
 * self-hosted mode.
 */
export function scrubSecrets(message: string): string {
  let out = message;
  for (const { pattern, replacement } of SECRET_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/**
 * Decide what error message the user should see for an unknown / 5xx
 * error. In SaaS mode we always return a generic copy; in self-hosted
 * mode we keep the original (still scrubbed) so the admin can debug.
 */
export function publicErrorMessage(rawMessage: string, fallback: string): string {
  if (isSaaSMode()) return fallback;
  return scrubSecrets(rawMessage);
}
