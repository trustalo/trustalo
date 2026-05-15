import type { Request, Response, NextFunction } from "express";

/**
 * Strip ASCII control characters (CR, LF, and the rest of the C0/C1
 * sets, plus DEL) before interpolating user-controlled strings into a
 * log line. Without this, an attacker can include `%0d%0a` in a request
 * URL to forge fake log entries (CodeQL `js/log-injection`).
 *
 * We bound the result length too — long URLs are also a denial-of-log
 * vector against operators tailing the file.
 */
const MAX_LOG_FIELD_LEN = 2048;
// eslint-disable-next-line no-control-regex -- intentionally targeting C0/C1 control chars
const CONTROL_CHARS = /[\x00-\x1f\x7f-\x9f]/g;

function sanitizeForLog(value: string): string {
  const cleaned = value.replace(CONTROL_CHARS, "");
  return cleaned.length > MAX_LOG_FIELD_LEN ? `${cleaned.slice(0, MAX_LOG_FIELD_LEN)}…` : cleaned;
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
