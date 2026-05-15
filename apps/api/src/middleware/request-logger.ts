import type { Request, Response, NextFunction } from "express";

/**
 * Sanitize user-controlled values before interpolating them into a log
 * line. We do two things:
 *
 *   1. Truncate to MAX_LOG_FIELD_LEN. Long URLs are a denial-of-log
 *      vector against operators tailing the file.
 *   2. Pass the value through JSON.stringify, which quotes the string
 *      and escapes every control character — CR, LF, the rest of the
 *      C0/C1 sets, plus U+2028 / U+2029 (which many log viewers also
 *      treat as line terminators). This prevents an attacker from
 *      forging fake log entries via `%0d%0a` in a request URL
 *      (CodeQL `js/log-injection`, which also recognizes
 *      JSON.stringify as a sanitizer).
 *
 * Log output format becomes: `["GET"] "/api/foo" → 200 (5ms)`.
 */
const MAX_LOG_FIELD_LEN = 2048;

function sanitizeForLog(value: string): string {
  const truncated =
    value.length > MAX_LOG_FIELD_LEN ? `${value.slice(0, MAX_LOG_FIELD_LEN)}…` : value;
  return JSON.stringify(truncated);
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const method = sanitizeForLog(req.method);
    const url = sanitizeForLog(req.originalUrl);
    console.log(`[${method}] ${url} → ${res.statusCode} (${duration}ms)`);
  });

  next();
}
