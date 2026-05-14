/**
 * Typed errors thrown by AI provider adapters.
 *
 * All four provider implementations (openai, anthropic, bedrock,
 * openrouter) wrap their SDK errors with `AIProviderError` so callers
 * — and ultimately the API error middleware — never see raw upstream
 * messages. Raw messages from the OpenAI/Anthropic SDKs include the
 * partially-redacted API key (e.g. `sk-proj-***D6EA`), the upstream
 * URL, and other operator-only detail that must not reach end users
 * in our SaaS deployment.
 *
 * The error preserves the original cause for server-side logging.
 */

export type AIProviderErrorKind =
  | "auth" /** 401 / invalid key / expired credentials */
  | "rate_limit" /** 429 / quota exceeded */
  | "timeout"
  | "bad_request" /** 400 / invalid input / context-length exceeded */
  | "server_error" /** 5xx upstream */
  | "unavailable" /** network error, DNS failure, connection refused */
  | "unknown";

export interface AIProviderErrorInit {
  kind: AIProviderErrorKind;
  /** Which provider raised it (openai | anthropic | bedrock | openrouter). */
  provider: string;
  /** Public-safe message, already scrubbed of secrets. */
  publicMessage: string;
  /** HTTP status returned by the provider, if any. */
  status?: number;
  /** Original SDK error for server-side logging. NEVER serialize. */
  cause?: unknown;
}

export class AIProviderError extends Error {
  readonly kind: AIProviderErrorKind;
  readonly provider: string;
  readonly status?: number;
  /** True — flagged so the error middleware can treat it specially. */
  readonly isAIProviderError = true;
  /**
   * Public-safe message. The base `Error.message` is the same string
   * so logs/`toString()` are also safe.
   */
  readonly publicMessage: string;
  override readonly cause?: unknown;

  constructor(init: AIProviderErrorInit) {
    super(init.publicMessage);
    this.name = "AIProviderError";
    this.kind = init.kind;
    this.provider = init.provider;
    this.status = init.status;
    this.publicMessage = init.publicMessage;
    this.cause = init.cause;
  }
}

/**
 * Convert any thrown value from an AI provider SDK into an
 * `AIProviderError` with a sanitized public message. The detection
 * is best-effort using shape (status code, error name) rather than
 * SDK-specific subclasses so we don't take a runtime dep on every
 * provider's typings.
 */
export function wrapProviderError(provider: string, raw: unknown): AIProviderError {
  // Already wrapped — keep the original.
  if (raw instanceof AIProviderError) return raw;

  const status = readNumberProp(raw, "status") ?? readNumberProp(raw, "statusCode");
  const name = readStringProp(raw, "name") ?? "";
  const errCode = readStringProp(raw, "code") ?? "";
  const rawMessage = raw instanceof Error ? raw.message : String(raw);

  let kind: AIProviderErrorKind = "unknown";
  let publicMessage = `${provider} request failed.`;

  if (status === 401 || status === 403) {
    kind = "auth";
    publicMessage = `${provider} rejected our credentials. Please contact your administrator to re-check the AI provider configuration.`;
  } else if (status === 429) {
    kind = "rate_limit";
    publicMessage = `${provider} is rate-limiting requests right now. Please retry in a moment.`;
  } else if (status === 400 || status === 422) {
    kind = "bad_request";
    publicMessage = `${provider} could not process the request. The input may be too large or malformed.`;
  } else if (
    status === 408 ||
    /timeout/i.test(name) ||
    /timeout/i.test(rawMessage) ||
    errCode === "ETIMEDOUT"
  ) {
    kind = "timeout";
    publicMessage = `${provider} took too long to respond. Please try again.`;
  } else if (status && status >= 500 && status < 600) {
    kind = "server_error";
    publicMessage = `${provider} is currently unavailable. Please try again shortly.`;
  } else if (
    /ENOTFOUND|ECONNREFUSED|ECONNRESET|EAI_AGAIN/.test(errCode) ||
    /ENOTFOUND|ECONNREFUSED|ECONNRESET|EAI_AGAIN/.test(rawMessage)
  ) {
    kind = "unavailable";
    publicMessage = `${provider} is currently unreachable. Please try again shortly.`;
  }

  return new AIProviderError({
    kind,
    provider,
    publicMessage,
    status,
    cause: raw,
  });
}

function readNumberProp(o: unknown, key: string): number | undefined {
  if (typeof o !== "object" || o === null) return undefined;
  const v = (o as Record<string, unknown>)[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function readStringProp(o: unknown, key: string): string | undefined {
  if (typeof o !== "object" || o === null) return undefined;
  const v = (o as Record<string, unknown>)[key];
  return typeof v === "string" ? v : undefined;
}
