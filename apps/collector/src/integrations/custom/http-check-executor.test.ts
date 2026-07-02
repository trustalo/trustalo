/**
 * Unit tests for the shared HTTP check executor.
 *
 * `runHttpCheck` takes injectable `fetch` / DNS-lookup / TLS-probe deps
 * so the full pipeline (host safety → header resolution → assertion
 * evaluation) runs without network access. The same executor serves the
 * wizard's "Test before save" route and the scheduled runner, so these
 * tests pin the behaviour of both.
 */

import { describe, expect, test } from "bun:test";
import { HttpCheckSpecSchema } from "@trustalo/integration-manifests";
import {
  resolveHeaders,
  runHttpCheck,
  SecretPlaceholderError,
  type RunHttpCheckOptions,
} from "./http-check-executor.js";

const PUBLIC_LOOKUP: RunHttpCheckOptions["lookupImpl"] = async () => [
  { address: "93.184.216.34", family: 4 },
];

function spec(overrides: Record<string, unknown> = {}) {
  return HttpCheckSpecSchema.parse({
    url: "https://status.example.com/health",
    expect: { statusCode: 200 },
    ...overrides,
  });
}

interface RecordedRequest {
  url: string;
  init: RequestInit | undefined;
}

function fetchStub(
  response: () => Response,
  calls: RecordedRequest[] = [],
): { fetchImpl: typeof fetch; calls: RecordedRequest[] } {
  const fetchImpl = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return response();
  }) as typeof fetch;
  return { fetchImpl, calls };
}

describe("runHttpCheck — assertions", () => {
  test("passes when status, body substring and header all match", async () => {
    const { fetchImpl } = fetchStub(
      () =>
        new Response("service is healthy", {
          status: 200,
          headers: { "x-frame-options": "DENY" },
        }),
    );
    const result = await runHttpCheck(
      spec({
        expect: {
          statusCode: 200,
          bodyContains: "Healthy",
          headerEquals: { "X-Frame-Options": "DENY" },
        },
      }),
      { fetchImpl, lookupImpl: PUBLIC_LOOKUP },
    );
    expect(result.status).toBe("pass");
    expect(result.failures).toHaveLength(0);
    expect(result.responseStatus).toBe(200);
  });

  test("fails with one failure per unmet expectation", async () => {
    const { fetchImpl } = fetchStub(() => new Response("nope", { status: 503 }));
    const result = await runHttpCheck(
      spec({ expect: { statusCode: 200, bodyContains: "healthy" } }),
      { fetchImpl, lookupImpl: PUBLIC_LOOKUP },
    );
    expect(result.status).toBe("fail");
    expect(result.failures).toHaveLength(2);
    expect(result.failures[0]).toContain("expected status 200, got 503");
  });

  test("TLS expiry assertion fails when the cert expires too soon", async () => {
    const { fetchImpl } = fetchStub(() => new Response("ok", { status: 200 }));
    const soon = Date.now() + 5 * 86_400_000;
    const result = await runHttpCheck(spec({ expect: { statusCode: 200, tlsValidForDays: 30 } }), {
      fetchImpl,
      lookupImpl: PUBLIC_LOOKUP,
      tlsProbeImpl: async () => ({ validTo: new Date(soon).toUTCString(), validToMs: soon }),
    });
    expect(result.status).toBe("fail");
    expect(result.failures[0]).toContain("TLS certificate valid only until");
  });

  test("body snippet is capped at 500 chars", async () => {
    const { fetchImpl } = fetchStub(() => new Response("x".repeat(5_000), { status: 200 }));
    const result = await runHttpCheck(spec(), { fetchImpl, lookupImpl: PUBLIC_LOOKUP });
    expect(result.bodySnippet?.length).toBe(500);
  });
});

describe("runHttpCheck — safety rails", () => {
  test("plain http URLs are rejected with BLOCKED_SCHEME", async () => {
    const { fetchImpl, calls } = fetchStub(() => new Response("ok"));
    const parsed = spec();
    const result = await runHttpCheck(
      { ...parsed, url: "http://example.com" },
      { fetchImpl, lookupImpl: PUBLIC_LOOKUP },
    );
    expect(result.status).toBe("error");
    expect(result.error).toContain("BLOCKED_SCHEME");
    expect(calls).toHaveLength(0);
  });

  test("hosts resolving to private/loopback addresses are blocked", async () => {
    const { fetchImpl, calls } = fetchStub(() => new Response("ok"));
    const result = await runHttpCheck(spec(), {
      fetchImpl,
      lookupImpl: async () => [{ address: "127.0.0.1", family: 4 }],
    });
    expect(result.status).toBe("error");
    expect(result.error).toContain("BLOCKED_PRIVATE_IP");
    expect(calls).toHaveLength(0);
  });

  test("private IP literals are blocked without a DNS lookup", async () => {
    const { fetchImpl, calls } = fetchStub(() => new Response("ok"));
    const parsed = spec();
    const result = await runHttpCheck(
      { ...parsed, url: "https://192.168.1.10/admin" },
      { fetchImpl, lookupImpl: PUBLIC_LOOKUP },
    );
    expect(result.status).toBe("error");
    expect(result.error).toContain("BLOCKED_PRIVATE_IP");
    expect(calls).toHaveLength(0);
  });

  test("literal Authorization headers are stripped before the request", async () => {
    const { fetchImpl, calls } = fetchStub(() => new Response("ok", { status: 200 }));
    await runHttpCheck(
      spec({ headers: { Authorization: "Bearer leaked-token", "X-Probe": "trustalo" } }),
      { fetchImpl, lookupImpl: PUBLIC_LOOKUP },
    );
    const sent = calls[0]?.init?.headers as Record<string, string>;
    expect(sent["Authorization"]).toBeUndefined();
    expect(sent["X-Probe"]).toBe("trustalo");
  });
});

describe("runHttpCheck — SecretVault placeholders", () => {
  test("{{secret:KEY}} resolves from the vault payload and is allowed in Authorization", async () => {
    const { fetchImpl, calls } = fetchStub(() => new Response("ok", { status: 200 }));
    const result = await runHttpCheck(
      spec({ headers: { Authorization: "Bearer {{secret:statusToken}}" } }),
      {
        fetchImpl,
        lookupImpl: PUBLIC_LOOKUP,
        secrets: { statusToken: "s3cr3t-value" },
      },
    );
    expect(result.status).toBe("pass");
    const sent = calls[0]?.init?.headers as Record<string, string>;
    expect(sent["Authorization"]).toBe("Bearer s3cr3t-value");
  });

  test("an unresolvable placeholder fails closed (no request is sent)", async () => {
    const { fetchImpl, calls } = fetchStub(() => new Response("ok", { status: 200 }));
    const result = await runHttpCheck(
      spec({ headers: { Authorization: "Bearer {{secret:missing}}" } }),
      { fetchImpl, lookupImpl: PUBLIC_LOOKUP, secrets: {} },
    );
    expect(result.status).toBe("error");
    expect(result.error).toContain('no secret named "missing"');
    expect(calls).toHaveLength(0);
  });
});

describe("resolveHeaders", () => {
  test("throws SecretPlaceholderError for unknown keys", () => {
    expect(() => resolveHeaders({ "X-Token": "{{secret:nope}}" }, {})).toThrow(
      SecretPlaceholderError,
    );
  });

  test("substitutes multiple placeholders in one value", () => {
    const out = resolveHeaders(
      { "X-Combined": "{{secret:a}}:{{secret:b}}" },
      { a: "left", b: "right" },
    );
    expect(out["X-Combined"]).toBe("left:right");
  });

  test("strips cookie and proxy-authorization literals case-insensitively", () => {
    const out = resolveHeaders({ Cookie: "session=1", "PROXY-AUTHORIZATION": "x", Ok: "1" }, {});
    expect(out).toEqual({ Ok: "1" });
  });
});
