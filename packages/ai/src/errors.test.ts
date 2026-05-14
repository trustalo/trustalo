import { describe, expect, test } from "bun:test";
import { AIProviderError, wrapProviderError } from "./errors.js";

describe("AIProviderError", () => {
  test("stores sanitized metadata and cause", () => {
    const cause = new Error("raw upstream message");
    const err = new AIProviderError({
      kind: "auth",
      provider: "OpenAI",
      publicMessage: "OpenAI rejected our credentials.",
      status: 401,
      cause,
    });
    expect(err.name).toBe("AIProviderError");
    expect(err.message).toBe("OpenAI rejected our credentials.");
    expect(err.publicMessage).toBe("OpenAI rejected our credentials.");
    expect(err.kind).toBe("auth");
    expect(err.provider).toBe("OpenAI");
    expect(err.status).toBe(401);
    expect(err.isAIProviderError).toBe(true);
    expect(err.cause).toBe(cause);
  });
});

describe("wrapProviderError", () => {
  test("returns already-wrapped errors unchanged", () => {
    const original = new AIProviderError({
      kind: "unknown",
      provider: "OpenAI",
      publicMessage: "already wrapped",
    });
    expect(wrapProviderError("OpenAI", original)).toBe(original);
  });

  test("maps auth status", () => {
    const wrapped = wrapProviderError("OpenAI", { status: 401, message: "bad key" });
    expect(wrapped.kind).toBe("auth");
    expect(wrapped.status).toBe(401);
    expect(wrapped.publicMessage).toContain("rejected our credentials");
  });

  test("maps rate limiting", () => {
    const wrapped = wrapProviderError("OpenAI", { statusCode: 429, message: "quota" });
    expect(wrapped.kind).toBe("rate_limit");
    expect(wrapped.publicMessage).toContain("rate-limiting");
  });

  test("maps bad requests", () => {
    const wrapped = wrapProviderError("OpenAI", { status: 422, message: "bad input" });
    expect(wrapped.kind).toBe("bad_request");
    expect(wrapped.publicMessage).toContain("could not process");
  });

  test("maps timeout by code/name/message", () => {
    expect(wrapProviderError("OpenAI", { code: "ETIMEDOUT", message: "network" }).kind).toBe("timeout");
    expect(wrapProviderError("OpenAI", { name: "TimeoutError", message: "network" }).kind).toBe(
      "timeout",
    );
    expect(wrapProviderError("OpenAI", new Error("request timeout exceeded")).kind).toBe("timeout");
  });

  test("maps server errors", () => {
    const wrapped = wrapProviderError("OpenAI", { status: 503, message: "upstream down" });
    expect(wrapped.kind).toBe("server_error");
  });

  test("maps network unavailability", () => {
    const wrapped = wrapProviderError("OpenAI", {
      code: "ECONNREFUSED",
      message: "ECONNREFUSED localhost",
    });
    expect(wrapped.kind).toBe("unavailable");
    expect(wrapped.publicMessage).toContain("unreachable");
  });

  test("defaults to unknown", () => {
    const wrapped = wrapProviderError("OpenAI", 42);
    expect(wrapped.kind).toBe("unknown");
    expect(wrapped.publicMessage).toBe("OpenAI request failed.");
  });
});
