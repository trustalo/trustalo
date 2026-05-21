import { afterEach, describe, expect, test } from "bun:test";
import { WazuhProvider } from "./index.js";
import type { DecryptedCredentials } from "../../core/types.js";

const provider = new WazuhProvider();

const ALL_CAPABILITIES = [
  "configuration_assessment",
  "malware_detection",
  "file_integrity_monitoring",
  "vulnerability_detection",
  "log_analysis",
  "threat_hunting",
  "incident_response",
  "regulatory_compliance",
  "it_hygiene",
  "container_security",
  "cloud_posture",
  "agents_inventory",
  "mitre_coverage",
  "rbac_review",
];

interface FetchCall {
  url: string;
  init?: (RequestInit & { tls?: { rejectUnauthorized: boolean } }) | undefined;
}

type FetchHandler = () => Response | Promise<Response>;

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function authResponse(): Response {
  return jsonResponse({ data: { token: "test-jwt-token" } });
}

function affectedItemsResponse(items: unknown[] = []): Response {
  return jsonResponse({
    data: { affected_items: items, total_affected_items: items.length },
  });
}

// Lightweight `fetch` mock. Handlers are matched in insertion order via
// substring match, so register the most specific paths first.
function installFetchMock(handlers: ReadonlyMap<string, FetchHandler>): {
  calls: FetchCall[];
} {
  const calls: FetchCall[] = [];
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = input instanceof Request ? input.url : input.toString();
    calls.push({ url, init: init as FetchCall["init"] });
    for (const [matcher, handler] of handlers) {
      if (url.includes(matcher)) {
        return handler();
      }
    }
    return affectedItemsResponse();
  }) as typeof fetch;
  return { calls };
}

const baseCreds = (override: Partial<DecryptedCredentials> = {}): DecryptedCredentials => ({
  managerUrl: "https://wazuh.example.com:55000",
  username: "wazuh",
  password: "secret",
  verifyTls: "true",
  ...override,
});

interface MockClient {
  managerUrl: string;
  username: string;
  password: string;
  verifyTls: boolean;
  enabledCapabilities: Set<string>;
}

describe("WazuhProvider.connect", () => {
  test("returns a runtime tagged with the integration slug", async () => {
    const conn = await provider.connect(baseCreds());
    expect(conn.integration).toBe("wazuh");
  });

  test("strips trailing slashes and trims whitespace in managerUrl", async () => {
    const conn = await provider.connect(
      baseCreds({ managerUrl: "  https://wazuh.example.com:55000///  " }),
    );
    const client = conn.client as MockClient;
    expect(client.managerUrl).toBe("https://wazuh.example.com:55000");
  });

  test("treats missing verifyTls as true (verification on by default)", async () => {
    const conn = await provider.connect(baseCreds({ verifyTls: undefined }));
    expect((conn.client as MockClient).verifyTls).toBe(true);
  });

  test('treats verifyTls="false" as boolean false', async () => {
    const conn = await provider.connect(baseCreds({ verifyTls: "false" }));
    expect((conn.client as MockClient).verifyTls).toBe(false);
  });

  test.each([
    ["managerUrl", baseCreds({ managerUrl: "" })],
    ["username", baseCreds({ username: "" })],
    ["password", baseCreds({ password: "" })],
  ])("rejects when %s is missing", async (_field, creds) => {
    await expect(provider.connect(creds)).rejects.toThrow(/incomplete/);
  });

  describe("enabledCapabilities parsing", () => {
    test("undefined → all capabilities", async () => {
      const conn = await provider.connect(baseCreds({ enabledCapabilities: undefined }));
      const set = (conn.client as MockClient).enabledCapabilities;
      expect(set.size).toBe(ALL_CAPABILITIES.length);
    });

    test("empty string → all capabilities", async () => {
      const conn = await provider.connect(baseCreds({ enabledCapabilities: "" }));
      const set = (conn.client as MockClient).enabledCapabilities;
      expect(set.size).toBe(ALL_CAPABILITIES.length);
    });

    test("'all' (case-insensitive, whitespace tolerant) → all capabilities", async () => {
      const conn = await provider.connect(baseCreds({ enabledCapabilities: " ALL " }));
      const set = (conn.client as MockClient).enabledCapabilities;
      expect(set.size).toBe(ALL_CAPABILITIES.length);
    });

    test("subset → only those capabilities", async () => {
      const conn = await provider.connect(
        baseCreds({ enabledCapabilities: "vulnerability_detection, log_analysis" }),
      );
      const set = (conn.client as MockClient).enabledCapabilities;
      expect([...set].sort()).toEqual(["log_analysis", "vulnerability_detection"]);
    });

    test("unknown capability names are dropped silently", async () => {
      const conn = await provider.connect(
        baseCreds({ enabledCapabilities: "vulnerability_detection,not_a_thing" }),
      );
      const set = (conn.client as MockClient).enabledCapabilities;
      expect([...set]).toEqual(["vulnerability_detection"]);
    });

    test("when every entry is unknown → falls back to all (forgiving default)", async () => {
      const conn = await provider.connect(baseCreds({ enabledCapabilities: "nope, bogus" }));
      const set = (conn.client as MockClient).enabledCapabilities;
      expect(set.size).toBe(ALL_CAPABILITIES.length);
    });
  });
});

describe("WazuhProvider catalog metadata", () => {
  test("advertised capabilities match the canonical list", () => {
    expect([...provider.capabilities].sort()).toEqual([...ALL_CAPABILITIES].sort());
  });

  test("getRequiredPermissions includes manager:read for the manager endpoints", () => {
    const permissions = provider.getRequiredPermissions();
    const slugs = permissions.map((p) => p.permission);
    expect(slugs).toContain("manager:read");
    expect(slugs).toContain("agents:read");
    expect(slugs).toContain("vulnerability:read");
    expect(slugs).toContain("mitre:read");
    expect(slugs).toContain("security:read");
  });

  test("configSchema declares password and enabledCapabilities fields", () => {
    const keys = provider.configSchema.map((field) => field.key);
    expect(keys).toEqual([
      "managerUrl",
      "username",
      "password",
      "verifyTls",
      "enabledCapabilities",
    ]);

    const passwordField = provider.configSchema.find((f) => f.key === "password");
    expect(passwordField?.type).toBe("password");
    expect(passwordField?.sensitive).toBe(true);

    const enabledField = provider.configSchema.find((f) => f.key === "enabledCapabilities");
    expect(enabledField?.required).toBe(false);
  });
});

describe("WazuhProvider.testConnection", () => {
  test("returns success with manager details on the happy path", async () => {
    installFetchMock(
      new Map<string, FetchHandler>([
        ["/security/user/authenticate", authResponse],
        [
          "/manager/info",
          () =>
            affectedItemsResponse([
              { hostname: "wazuh-1", version: "v4.7.0", name: "wazuh-master" },
            ]),
        ],
      ]),
    );

    const conn = await provider.connect(baseCreds());
    const result = await provider.testConnection(conn);

    expect(result.success).toBe(true);
    expect(result.details).toEqual({
      hostname: "wazuh-1",
      version: "v4.7.0",
      manager: "wazuh-master",
    });
  });

  test("returns failure when authentication fails", async () => {
    installFetchMock(
      new Map<string, FetchHandler>([
        ["/security/user/authenticate", () => jsonResponse({ error: "Invalid credentials" }, 401)],
      ]),
    );

    const conn = await provider.connect(baseCreds());
    const result = await provider.testConnection(conn);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/401/);
  });
});

describe("WazuhProvider TLS handling", () => {
  test("verifyTls=false sets per-request tls.rejectUnauthorized=false", async () => {
    const { calls } = installFetchMock(
      new Map<string, FetchHandler>([
        ["/security/user/authenticate", authResponse],
        ["/manager/info", () => affectedItemsResponse([{ hostname: "x", version: "v4.7.0" }])],
      ]),
    );

    const conn = await provider.connect(baseCreds({ verifyTls: "false" }));
    await provider.testConnection(conn);

    const tlsCalls = calls.filter((call) => call.init?.tls !== undefined);
    expect(tlsCalls.length).toBeGreaterThanOrEqual(1);
    expect(tlsCalls[0]?.init?.tls).toEqual({ rejectUnauthorized: false });
  });

  test("verifyTls=true does not include the tls option", async () => {
    const { calls } = installFetchMock(
      new Map<string, FetchHandler>([
        ["/security/user/authenticate", authResponse],
        ["/manager/info", () => affectedItemsResponse([{ hostname: "x", version: "v4.7.0" }])],
      ]),
    );

    const conn = await provider.connect(baseCreds({ verifyTls: "true" }));
    await provider.testConnection(conn);

    const tlsCalls = calls.filter((call) => call.init?.tls !== undefined);
    expect(tlsCalls).toHaveLength(0);
  });

  test("does not mutate process.env.NODE_TLS_REJECT_UNAUTHORIZED (regression)", async () => {
    const before = process.env["NODE_TLS_REJECT_UNAUTHORIZED"];
    installFetchMock(
      new Map<string, FetchHandler>([
        ["/security/user/authenticate", authResponse],
        ["/manager/info", () => affectedItemsResponse([{ hostname: "x", version: "v4.7.0" }])],
      ]),
    );

    const conn = await provider.connect(baseCreds({ verifyTls: "false" }));
    await provider.testConnection(conn);

    expect(process.env["NODE_TLS_REJECT_UNAUTHORIZED"]).toBe(before);
  });
});

describe("WazuhProvider.collectEvidence capability gating", () => {
  function happyPathHandlers(): Map<string, FetchHandler> {
    // Order matters: more-specific matchers come first.
    return new Map<string, FetchHandler>([
      ["/security/user/authenticate", authResponse],
      ["/manager/info", () => affectedItemsResponse([{ version: "v4.7.0" }])],
      ["/manager/status", () => affectedItemsResponse([{ status: "running" }])],
      [
        "/manager/configuration",
        () => affectedItemsResponse([{ "active-response": [{ command: "firewall-drop" }] }]),
      ],
      ["/manager/stats/analysisd", () => jsonResponse({ data: { events_processed: 1 } })],
      ["/agents/summary/status", () => jsonResponse({ data: { total: 2, active: 2 } })],
      [
        "/agents",
        () =>
          affectedItemsResponse([
            { id: "001", status: "active" },
            { id: "002", status: "active" },
          ]),
      ],
      ["/sca/", () => affectedItemsResponse([{ result: "passed" }])],
      ["/syscheck/", () => affectedItemsResponse([])],
      ["/rootcheck/", () => affectedItemsResponse([])],
      ["/vulnerability/", () => affectedItemsResponse([])],
      ["/security/users", () => affectedItemsResponse([])],
      ["/security/roles", () => affectedItemsResponse([])],
      ["/security/policies", () => affectedItemsResponse([])],
      ["/mitre/techniques", () => affectedItemsResponse([])],
      ["/mitre/groups", () => affectedItemsResponse([])],
      ["/rules", () => affectedItemsResponse([{ id: 1, groups: ["pci_dss"] }])],
      ["/experimental/syscollector/packages", () => affectedItemsResponse([])],
    ]);
  }

  const collectOptions = { tenantId: "tenant-1", connectionId: "conn-1" };

  test("only-vulnerability still fetches the agent listing (regression for hoisted dependency)", async () => {
    const { calls } = installFetchMock(happyPathHandlers());

    const conn = await provider.connect(
      baseCreds({ enabledCapabilities: "vulnerability_detection" }),
    );
    const evidence = await provider.collectEvidence(conn, collectOptions);

    const sourceTypes = new Set(evidence.map((e) => e.sourceType));
    expect(sourceTypes.has("wazuh.vulnerabilities")).toBe(true);
    expect(sourceTypes.has("wazuh.agents.summary")).toBe(false);
    expect(sourceTypes.has("wazuh.agents.inventory")).toBe(false);

    const agentsListed = calls.some((c) => /\/agents\?/.test(c.url));
    const agentsSummaryCalled = calls.some((c) => c.url.includes("/agents/summary/status"));
    expect(agentsListed).toBe(true);
    expect(agentsSummaryCalled).toBe(true);
  });

  test("disabling unrelated capabilities skips their fetches", async () => {
    const { calls } = installFetchMock(happyPathHandlers());

    const conn = await provider.connect(baseCreds({ enabledCapabilities: "rbac_review" }));
    const evidence = await provider.collectEvidence(conn, collectOptions);

    const sourceTypes = new Set(evidence.map((e) => e.sourceType));
    expect(sourceTypes.has("wazuh.security.rbac")).toBe(true);
    expect(sourceTypes.has("wazuh.vulnerabilities")).toBe(false);
    expect(sourceTypes.has("wazuh.fim.changes")).toBe(false);
    expect(sourceTypes.has("wazuh.compliance.coverage")).toBe(false);

    const fetchedRules = calls.some((c) => c.url.includes("/rules?"));
    const fetchedAgents = calls.some((c) => /\/agents\?/.test(c.url));
    expect(fetchedRules).toBe(false);
    expect(fetchedAgents).toBe(false);
  });

  test("rules fetch is shared across all rule-coverage capabilities", async () => {
    const { calls } = installFetchMock(happyPathHandlers());

    const conn = await provider.connect(
      baseCreds({
        enabledCapabilities: "regulatory_compliance, container_security, cloud_posture",
      }),
    );
    const evidence = await provider.collectEvidence(conn, collectOptions);

    const sourceTypes = new Set(evidence.map((e) => e.sourceType));
    expect(sourceTypes.has("wazuh.compliance.coverage")).toBe(true);
    expect(sourceTypes.has("wazuh.containers.rule_coverage")).toBe(true);
    expect(sourceTypes.has("wazuh.cloud.rule_coverage")).toBe(true);

    const rulesCalls = calls.filter((c) => c.url.includes("/rules?"));
    // One paginated fetch (which terminates after one page in this mock).
    expect(rulesCalls).toHaveLength(1);
  });

  test("incident_response uses /manager/configuration?section=active-response (real endpoint)", async () => {
    const { calls } = installFetchMock(happyPathHandlers());

    const conn = await provider.connect(baseCreds({ enabledCapabilities: "incident_response" }));
    const evidence = await provider.collectEvidence(conn, collectOptions);

    expect(evidence.map((e) => e.sourceType)).toContain("wazuh.active_response.configuration");
    const arCall = calls.find((c) => c.url.includes("/manager/configuration"));
    expect(arCall?.url).toContain("section=active-response");
  });

  test("every emitted EvidenceResult has a non-empty controlMapping and a stable sourceType", async () => {
    installFetchMock(happyPathHandlers());

    const conn = await provider.connect(baseCreds());
    const evidence = await provider.collectEvidence(conn, collectOptions);

    expect(evidence.length).toBeGreaterThan(0);
    for (const item of evidence) {
      expect(item.sourceType.startsWith("wazuh.")).toBe(true);
      expect(item.controlMapping?.length ?? 0).toBeGreaterThan(0);
      expect(typeof item.sourceId).toBe("string");
      expect(item.sourceId.length).toBeGreaterThan(0);
    }
  });

  test("handles total absence of agents (Manager API up, no agents enrolled)", async () => {
    const handlers = happyPathHandlers();
    handlers.set("/agents", () => affectedItemsResponse([]));
    handlers.set("/agents/summary/status", () => jsonResponse({ data: { total: 0 } }));
    installFetchMock(handlers);

    const conn = await provider.connect(
      baseCreds({ enabledCapabilities: "vulnerability_detection,agents_inventory" }),
    );
    const evidence = await provider.collectEvidence(conn, collectOptions);

    // Should still emit evidence rows (just with empty arrays) — never throw.
    const sourceTypes = evidence.map((e) => e.sourceType);
    expect(sourceTypes).toContain("wazuh.vulnerabilities");
    expect(sourceTypes).toContain("wazuh.agents.inventory");
  });
});
