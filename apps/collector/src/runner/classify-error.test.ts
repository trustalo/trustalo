/**
 * Unit tests for the runner's error classifier.
 *
 * `classifyError` decides retry policy and gap-opening reason, so it
 * has to be precise: a single mis-classification can either spam
 * retries on a permanently-broken token or fail to open a gap when
 * one is needed. The cases below cover the matrix:
 *
 *   - HTTP status hints (401 / 403 / 429 / 5xx)
 *   - Node socket codes (ECONNREFUSED / ETIMEDOUT / ENOTFOUND)
 *   - Free-text message sniffing (rate limit / invalid token / fetch failed)
 *   - Unknown shapes fall back to `check_runtime_error` + retriable
 */

import { describe, expect, test } from "bun:test";
import { classifyError } from "./classify-error.js";

describe("classifyError — HTTP status hints", () => {
  test("401 → credentials_invalid, non-retriable", () => {
    const out = classifyError({ status: 401, message: "Unauthorized" });
    expect(out.reason).toBe("credentials_invalid");
    expect(out.retriable).toBe(false);
  });

  test("403 → credentials_invalid", () => {
    const out = classifyError({ status: 403, message: "Forbidden" });
    expect(out.reason).toBe("credentials_invalid");
    expect(out.retriable).toBe(false);
  });

  test("429 → rate_limited, retriable", () => {
    const out = classifyError({ status: 429, message: "Too many requests" });
    expect(out.reason).toBe("rate_limited");
    expect(out.retriable).toBe(true);
  });

  test("5xx → connection_error, retriable", () => {
    const out = classifyError({ status: 503, message: "Service unavailable" });
    expect(out.reason).toBe("connection_error");
    expect(out.retriable).toBe(true);
  });

  test("axios-shaped response.status is honoured", () => {
    const out = classifyError({
      message: "Request failed",
      response: { status: 401 },
    });
    expect(out.reason).toBe("credentials_invalid");
  });
});

describe("classifyError — socket codes", () => {
  test.each(["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN"])(
    "%s → connection_error, retriable",
    (code) => {
      const err = Object.assign(new Error("network"), { code });
      const out = classifyError(err);
      expect(out.reason).toBe("connection_error");
      expect(out.retriable).toBe(true);
    },
  );

  test("code nested under err.cause is detected", () => {
    const err = Object.assign(new Error("fetch failed"), {
      cause: { code: "ECONNREFUSED" },
    });
    const out = classifyError(err);
    expect(out.reason).toBe("connection_error");
  });
});

describe("classifyError — message sniffing", () => {
  test("'invalid token' → credentials_invalid", () => {
    const out = classifyError(new Error("invalid token"));
    expect(out.reason).toBe("credentials_invalid");
    expect(out.retriable).toBe(false);
  });

  test("'rate limit exceeded' → rate_limited", () => {
    const out = classifyError(new Error("Rate limit exceeded"));
    expect(out.reason).toBe("rate_limited");
    expect(out.retriable).toBe(true);
  });

  test("'fetch failed' → connection_error", () => {
    const out = classifyError(new Error("fetch failed"));
    expect(out.reason).toBe("connection_error");
    expect(out.retriable).toBe(true);
  });
});

describe("classifyError — fallback", () => {
  test("unknown shape → check_runtime_error, retriable", () => {
    const out = classifyError(new Error("Something exploded"));
    expect(out.reason).toBe("check_runtime_error");
    expect(out.retriable).toBe(true);
  });

  test("non-error throwables don't crash the classifier", () => {
    expect(() => classifyError("plain string")).not.toThrow();
    expect(() => classifyError(undefined)).not.toThrow();
    expect(() => classifyError(null)).not.toThrow();
    expect(() => classifyError({ weird: "object" })).not.toThrow();
  });

  test("message is truncated for healthReason cell display", () => {
    const long = "A".repeat(500);
    const out = classifyError(new Error(long));
    expect(out.message.length).toBeLessThanOrEqual(240);
  });
});
