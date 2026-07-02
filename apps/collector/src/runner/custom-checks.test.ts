/**
 * End-to-end tests for the scheduled custom-check path (sans DB):
 *
 *   saved IntegrationCheck row → shared HTTP executor (mocked target)
 *   → per-check outcome + IntegrationCheckResult data → EvidenceResult
 *   items → `/internal/evidence/bulk` submission (mocked API).
 *
 * `executeCustomChecks` is the pure core the runner calls for the
 * synthetic `custom` connection; `submitEvidence` is the exact same
 * bulk path built-in connectors use, exercised here with a patched
 * `globalThis.fetch` (mirrors the wazuh connector test convention).
 */

import { afterEach, describe, expect, test } from "bun:test";
import {
  runHttpCheck,
  type RunHttpCheckOptions,
} from "../integrations/custom/http-check-executor.js";
import { submitEvidence } from "../lib/api-client.js";
import { executeCustomChecks, type CustomCheckRow } from "./custom-checks.js";

const originalFetch = globalThis.fetch;
const originalSecret = process.env["SERVICE_AUTH_SECRET"];

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalSecret === undefined) delete process.env["SERVICE_AUTH_SECRET"];
  else process.env["SERVICE_AUTH_SECRET"] = originalSecret;
});

/** Executor wired to a fake HTTPS target instead of the network. */
function executeVia(target: () => Response) {
  const options: RunHttpCheckOptions = {
    fetchImpl: (async () => target()) as unknown as typeof fetch,
    lookupImpl: async () => [{ address: "93.184.216.34", family: 4 }],
  };
  return (spec: Parameters<typeof runHttpCheck>[0], opts: RunHttpCheckOptions) =>
    runHttpCheck(spec, { ...options, secrets: opts.secrets ?? {} });
}

function checkRow(overrides: Partial<CustomCheckRow> = {}): CustomCheckRow {
  return {
    id: "chk_1",
    manifestKey: "custom.abc123",
    title: "security.txt is reachable",
    description: "Verifies the well-known security contact file.",
    severity: "medium",
    runner: "http",
    spec: {
      url: "https://example.com/.well-known/security.txt",
      method: "GET",
      headers: {},
      timeoutMs: 10_000,
      expect: { statusCode: 200, bodyContains: "Contact" },
    },
    consecutiveFailures: 0,
    healthState: "healthy",
    ...overrides,
  };
}

describe("executeCustomChecks — saved HTTP check end-to-end", () => {
  test("passing check produces a pass outcome + evidence in the connector wire shape", async () => {
    const outcomes = await executeCustomChecks([checkRow()], {
      execute: executeVia(() => new Response("Contact: security@example.com", { status: 200 })),
      now: () => new Date("2026-07-02T06:00:00Z"),
    });

    expect(outcomes).toHaveLength(1);
    const outcome = outcomes[0]!;
    expect(outcome.status).toBe("pass");
    expect(outcome.errorMessage).toBeNull();
    expect(outcome.durationMs).toBeGreaterThanOrEqual(0);

    // Evidence mirrors what provider connectors emit, so the runner's
    // binding lookup + bulk submission treats it uniformly.
    expect(outcome.evidence).not.toBeNull();
    expect(outcome.evidence!.manifestKey).toBe("custom.abc123");
    expect(outcome.evidence!.sourceType).toBe("custom.abc123");
    expect(outcome.evidence!.sourceId).toBe("chk_1");
    expect(outcome.evidence!.severity).toBe("medium");
    expect(outcome.evidence!.title).toContain("passed");
    expect(outcome.evidence!.collectedAt.toISOString()).toBe("2026-07-02T06:00:00.000Z");
    expect(outcome.evidence!.rawData["responseStatus"]).toBe(200);
  });

  test("failing assertion produces fail outcome + evidence describing the failures", async () => {
    const outcomes = await executeCustomChecks([checkRow()], {
      execute: executeVia(() => new Response("gone", { status: 404 })),
    });
    const outcome = outcomes[0]!;
    expect(outcome.status).toBe("fail");
    expect(outcome.evidence).not.toBeNull();
    expect(outcome.evidence!.title).toContain("failed");
    expect(outcome.evidence!.description).toContain("expected status 200, got 404");
  });

  test("runtime error produces an error outcome and NO evidence", async () => {
    const outcomes = await executeCustomChecks([checkRow()], {
      execute: executeVia(() => {
        throw new Error("ECONNRESET");
      }),
    });
    const outcome = outcomes[0]!;
    expect(outcome.status).toBe("error");
    expect(outcome.errorMessage).toContain("ECONNRESET");
    expect(outcome.evidence).toBeNull();
  });

  test("a stored spec that no longer validates errors that check only", async () => {
    const outcomes = await executeCustomChecks(
      [checkRow({ id: "bad", spec: { nope: true } }), checkRow({ id: "good" })],
      {
        execute: executeVia(() => new Response("Contact: x", { status: 200 })),
      },
    );
    expect(outcomes.find((o) => o.checkId === "bad")?.status).toBe("error");
    expect(outcomes.find((o) => o.checkId === "bad")?.errorMessage).toContain("INVALID_SPEC");
    expect(outcomes.find((o) => o.checkId === "good")?.status).toBe("pass");
  });

  test("browser checks are skipped with the structured not_supported reason", async () => {
    const outcomes = await executeCustomChecks([checkRow({ runner: "browser" })], {
      execute: executeVia(() => new Response("never called")),
    });
    const outcome = outcomes[0]!;
    expect(outcome.status).toBe("skipped");
    expect(outcome.errorMessage).toContain("BROWSER_RUNNER_NOT_AVAILABLE");
    expect(outcome.evidence).toBeNull();
  });

  test("vault secrets flow into {{secret:KEY}} placeholders", async () => {
    let sentAuth: string | undefined;
    const outcomes = await executeCustomChecks(
      [
        checkRow({
          spec: {
            url: "https://example.com/private-status",
            method: "GET",
            headers: { Authorization: "Bearer {{secret:probeToken}}" },
            timeoutMs: 10_000,
            expect: { statusCode: 200 },
          },
        }),
      ],
      {
        secrets: { probeToken: "vault-token" },
        execute: (spec, opts) =>
          runHttpCheck(spec, {
            ...opts,
            fetchImpl: (async (_url: Parameters<typeof fetch>[0], init?: RequestInit) => {
              sentAuth = (init?.headers as Record<string, string>)["Authorization"];
              return new Response("ok", { status: 200 });
            }) as typeof fetch,
            lookupImpl: async () => [{ address: "93.184.216.34", family: 4 }],
          }),
      },
    );
    expect(outcomes[0]!.status).toBe("pass");
    expect(sentAuth).toBe("Bearer vault-token");
  });
});

describe("evidence submission — same bulk path as built-in connectors", () => {
  test("submitEvidence POSTs custom-check evidence to /internal/evidence/bulk with bindings", async () => {
    process.env["SERVICE_AUTH_SECRET"] = "test-secret";

    const [outcome] = await executeCustomChecks([checkRow()], {
      execute: executeVia(() => new Response("Contact: security@example.com", { status: 200 })),
    });

    let captured: { url: string; headers: Record<string, string>; body: unknown } | null = null;
    globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      captured = {
        url: String(input),
        headers: (init?.headers ?? {}) as Record<string, string>,
        body: JSON.parse(String(init?.body)),
      };
      return new Response(JSON.stringify({ success: true, data: { created: 1, orphans: 0 } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    const result = await submitEvidence("tenant_1", [
      { ...outcome!.evidence!, controlIds: ["ctl_1", "ctl_2"] },
    ]);

    expect(result.success).toBe(true);
    expect(result.data?.created).toBe(1);

    expect(captured).not.toBeNull();
    const req = captured!;
    expect(req.url).toContain("/internal/evidence/bulk");
    expect(req.headers["X-Organization-Id"]).toBe("tenant_1");
    // HMAC service auth — the collector→API trust boundary.
    expect(req.headers["x-service-caller"]).toBe("collector");
    expect(req.headers["x-service-signature"]).toBeTruthy();

    const wire = (req.body as { evidence: Array<Record<string, unknown>> }).evidence[0]!;
    expect(wire["manifestKey"]).toBe("custom.abc123");
    expect(wire["sourceType"]).toBe("custom.abc123");
    expect(wire["controlIds"]).toEqual(["ctl_1", "ctl_2"]);
    expect(typeof wire["collectedAt"]).toBe("string");
  });
});
