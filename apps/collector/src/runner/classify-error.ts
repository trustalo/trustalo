/**
 * Classifies thrown errors into a structured taxonomy that drives:
 *  - retry policy (`retriable` decides whether the runner schedules a retry)
 *  - gap-opening reason (`gapReason`)
 *  - the human-readable string surfaced as `healthReason` on the check.
 *
 * The taxonomy intentionally stays small. Provider modules can throw
 * raw `Error`s; we sniff message/status/code shape here instead of
 * forcing every provider to wrap things. Anything unrecognised falls
 * back to `check_runtime_error` and is treated as retriable — we'd
 * rather pay an extra retry than open a gap on a transient bug.
 */

import type { CoverageGapReason } from "../../generated/prisma/client/index.js";

export interface ClassifiedError {
  reason: CoverageGapReason;
  retriable: boolean;
  // Short human-readable string for `IntegrationCheck.healthReason`.
  // Kept under ~120 chars so it fits in UI cells.
  message: string;
}

/**
 * Inspect anything thrown and return its classification. The function
 * is intentionally defensive — it never throws, even on circular or
 * exotic shapes.
 */
export function classifyError(err: unknown): ClassifiedError {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const message = truncate(rawMessage, 240);

  // Pull a numeric HTTP status off the most common shapes used in this
  // codebase (axios-ish `.response.status`, fetch wrappers exposing
  // `.status`, or `.code` set to a number).
  const status = pickStatus(err);
  const code = pickCode(err);
  const lower = rawMessage.toLowerCase();

  if (
    status === 401 ||
    status === 403 ||
    /unauthorized|forbidden|invalid[_ ]?(token|credentials)|expired token|access denied/.test(lower)
  ) {
    return {
      reason: "credentials_invalid",
      retriable: false,
      message: `Credentials rejected (${status ?? "auth error"})`,
    };
  }

  if (status === 429 || /rate[_ ]?limit|too many requests|throttl/.test(lower)) {
    return {
      reason: "rate_limited",
      retriable: true,
      message: "Upstream rate-limited the request",
    };
  }

  if (
    code === "ECONNREFUSED" ||
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    /network|socket|timeout|ECONN|ENOTFOUND|fetch failed|dns/.test(lower)
  ) {
    return {
      reason: "connection_error",
      retriable: true,
      message: `Cannot reach upstream (${code ?? "network error"})`,
    };
  }

  if (typeof status === "number" && status >= 500) {
    return {
      reason: "connection_error",
      retriable: true,
      message: `Upstream returned ${status}`,
    };
  }

  return {
    reason: "check_runtime_error",
    retriable: true,
    message,
  };
}

function pickStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const e = err as Record<string, unknown>;
  if (typeof e.status === "number") return e.status;
  if (typeof e.statusCode === "number") return e.statusCode;
  const resp = e.response as Record<string, unknown> | undefined;
  if (resp && typeof resp.status === "number") return resp.status;
  return undefined;
}

function pickCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const e = err as Record<string, unknown>;
  if (typeof e.code === "string") return e.code;
  const cause = e.cause as Record<string, unknown> | undefined;
  if (cause && typeof cause.code === "string") return cause.code;
  return undefined;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1)}…`;
}
