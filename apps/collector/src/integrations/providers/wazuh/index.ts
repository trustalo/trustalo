import type {
  IntegrationProvider,
  DecryptedCredentials,
  ProviderConnection,
  CollectOptions,
  EvidenceResult,
  ConnectionTestResult,
  PermissionRequirement,
  CredentialField,
} from "../../core/types.js";

type JsonObject = Record<string, unknown>;

interface WazuhClient {
  managerUrl: string;
  username: string;
  password: string;
  verifyTls: boolean;
  enabledCapabilities: Set<string>;
  token?: string;
}

interface WazuhListResult<T> {
  items: T[];
  total: number;
}

// Capabilities that fan out per active agent. Used to decide whether the
// agent listing must be fetched even when the user has disabled the
// "agents_inventory" evidence row itself.
const AGENT_SCOPED_CAPABILITIES = [
  "vulnerability_detection",
  "file_integrity_monitoring",
  "configuration_assessment",
  "malware_detection",
] as const;

// Capabilities that share a single `/rules` fetch.
const RULES_SCOPED_CAPABILITIES = [
  "regulatory_compliance",
  "container_security",
  "cloud_posture",
] as const;

const SUPPORTED_CAPABILITIES = [
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
] as const;

function normalizeManagerUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function toJsonObject(value: unknown): JsonObject {
  return typeof value === "object" && value !== null ? (value as JsonObject) : {};
}

function extractToken(payload: unknown): string | undefined {
  const json = toJsonObject(payload);
  const data = toJsonObject(json["data"]);
  if (typeof data["token"] === "string") return data["token"];
  if (typeof json["token"] === "string") return json["token"];
  return undefined;
}

function parseListResult<T>(payload: unknown): WazuhListResult<T> {
  const json = toJsonObject(payload);
  const data = toJsonObject(json["data"]);
  const affectedItems = data["affected_items"];
  const total = typeof data["total_affected_items"] === "number" ? data["total_affected_items"] : 0;
  return {
    items: Array.isArray(affectedItems) ? (affectedItems as T[]) : [],
    total,
  };
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

function getFirstAffectedItem(payload: unknown): JsonObject {
  const list = parseListResult<JsonObject>(payload);
  return list.items[0] ?? {};
}

function parseEnabledCapabilities(rawValue: string | undefined, defaults: string[]): Set<string> {
  if (!rawValue || !rawValue.trim()) {
    return new Set(defaults);
  }

  const values = rawValue
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (values.includes("all")) {
    return new Set(defaults);
  }

  const supported = new Set(defaults);
  const selected = values.filter((value) => supported.has(value));
  return selected.length > 0 ? new Set(selected) : new Set(defaults);
}

// Bun's fetch accepts a `tls` option for per-request certificate handling.
// Using this avoids the (unsafe) NODE_TLS_REJECT_UNAUTHORIZED env mutation,
// which would leak across the 3 concurrent runner jobs.
type BunRequestInit = RequestInit & { tls?: { rejectUnauthorized: boolean } };

async function fetchWazuhJson(
  client: WazuhClient,
  path: string,
  init: BunRequestInit = {},
): Promise<unknown> {
  const url = `${client.managerUrl}${path}`;
  const headers = new Headers(init.headers ?? {});
  headers.set("Content-Type", "application/json");
  if (client.token) headers.set("Authorization", `Bearer ${client.token}`);

  const requestInit: BunRequestInit = {
    ...init,
    headers,
  };
  if (!client.verifyTls) {
    requestInit.tls = { rejectUnauthorized: false };
  }

  const response = await fetch(url, requestInit);
  if (response.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return fetchWazuhJson(client, path, init);
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Wazuh API ${response.status}: ${body}`);
  }
  return response.json();
}

async function authenticate(client: WazuhClient): Promise<void> {
  const basic = Buffer.from(`${client.username}:${client.password}`).toString("base64");
  const payload = await fetchWazuhJson(client, "/security/user/authenticate", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}` },
  });
  const token = extractToken(payload);
  if (!token) throw new Error("Wazuh authentication succeeded but no token was returned");
  client.token = token;
}

async function wazuhRequest(
  client: WazuhClient,
  path: string,
  init: BunRequestInit = {},
  allowRetry = true,
): Promise<unknown> {
  if (!client.token) await authenticate(client);
  try {
    return await fetchWazuhJson(client, path, init);
  } catch (error) {
    if (!allowRetry || !(error instanceof Error) || !error.message.includes("Wazuh API 401")) {
      throw error;
    }
    client.token = undefined;
    await authenticate(client);
    return fetchWazuhJson(client, path, init);
  }
}

async function paginateWazuh<T>(
  client: WazuhClient,
  basePath: string,
  limit = 100,
): Promise<WazuhListResult<T>> {
  const all: T[] = [];
  let offset = 0;
  let total = 0;

  while (true) {
    const separator = basePath.includes("?") ? "&" : "?";
    const payload = await wazuhRequest(
      client,
      `${basePath}${separator}limit=${limit}&offset=${offset}`,
    );
    const page = parseListResult<T>(payload);
    all.push(...page.items);
    total = Math.max(total, page.total, all.length);
    offset += page.items.length;
    if (page.items.length === 0 || all.length >= total) break;
  }

  return { items: all, total };
}

function ruleHasGroup(rule: JsonObject, candidates: string[]): boolean {
  const groups = rule["groups"];
  if (!Array.isArray(groups)) return false;
  return groups.some((group) => {
    const normalized = String(group).toLowerCase();
    return candidates.some((candidate) => normalized.includes(candidate));
  });
}

export class WazuhProvider implements IntegrationProvider {
  readonly id = "wazuh";
  readonly name = "Wazuh";
  readonly description =
    "Collect evidence from Wazuh for endpoint security, SIEM detections, cloud workload posture, and control coverage.";
  readonly version = "1.0.0";
  readonly category = "security" as const;
  readonly authType = "api_key" as const;
  readonly capabilities: string[] = [...SUPPORTED_CAPABILITIES];
  readonly configSchema: CredentialField[] = [
    {
      key: "managerUrl",
      label: "Wazuh Manager URL",
      type: "text",
      required: true,
      placeholder: "https://wazuh.example.com:55000",
      description: "Base URL for the Wazuh API (port 55000 by default).",
    },
    {
      key: "username",
      label: "Username",
      type: "text",
      required: true,
      description: "Read-only API user configured in Wazuh RBAC.",
    },
    {
      key: "password",
      label: "Password",
      type: "password",
      required: true,
      sensitive: true,
      description: "Password for the Wazuh API user.",
    },
    {
      key: "verifyTls",
      label: "Verify TLS certificates",
      type: "select",
      required: true,
      default: "true",
      options: [
        { value: "true", label: "Yes (recommended)" },
        { value: "false", label: "No (self-signed lab certs)" },
      ],
    },
    {
      key: "enabledCapabilities",
      label: "Enabled capabilities (comma-separated, optional)",
      type: "textarea",
      required: false,
      placeholder:
        "configuration_assessment,malware_detection,file_integrity_monitoring,vulnerability_detection,log_analysis",
      description:
        "Optional comma-separated subset of capabilities to collect. Leave empty (or use 'all') to collect everything.",
    },
  ];

  async connect(credentials: DecryptedCredentials): Promise<ProviderConnection> {
    const managerUrl = normalizeManagerUrl(credentials["managerUrl"] ?? "");
    const username = credentials["username"] ?? "";
    const password = credentials["password"] ?? "";
    const verifyTls = (credentials["verifyTls"] ?? "true").toLowerCase() !== "false";
    const enabledCapabilities = parseEnabledCapabilities(
      credentials["enabledCapabilities"],
      this.capabilities,
    );

    if (!managerUrl || !username || !password) {
      throw new Error(
        "Wazuh credentials are incomplete. managerUrl, username, and password are required.",
      );
    }

    const client: WazuhClient = {
      managerUrl,
      username,
      password,
      verifyTls,
      enabledCapabilities,
    };
    return { id: `wazuh-${Date.now()}`, integration: this.id, client };
  }

  async collectEvidence(
    connection: ProviderConnection,
    options: CollectOptions,
  ): Promise<EvidenceResult[]> {
    const client = connection.client as WazuhClient;
    const results: EvidenceResult[] = [];
    const now = new Date();
    const since = options.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
    const isEnabled = (capability: string): boolean => client.enabledCapabilities.has(capability);

    // The agent listing is required by both `agents_inventory` and any
    // agent-scoped capability (vulnerability_detection, FIM, SCA, malware).
    // Fetching it once up-front prevents capabilities from silently
    // producing zero evidence when `agents_inventory` is not enabled.
    const needsAgentList =
      isEnabled("agents_inventory") ||
      AGENT_SCOPED_CAPABILITIES.some((capability) => isEnabled(capability));

    let activeAgents: JsonObject[] = [];
    let agentSummary: JsonObject = {};
    let agentList: WazuhListResult<JsonObject> = { items: [], total: 0 };

    // ── Manager status (always-on; cheap, useful for diagnostics) ──
    try {
      const managerInfo = await wazuhRequest(client, "/manager/info");
      const managerStatus = await wazuhRequest(client, "/manager/status");
      const infoData = toJsonObject(toJsonObject(managerInfo)["data"]);
      const statusData = toJsonObject(toJsonObject(managerStatus)["data"]);
      const firstAffected = getFirstAffectedItem(managerInfo);

      results.push({
        title: "Wazuh Manager Status",
        description: `Wazuh manager ${String(firstAffected["version"] ?? "version unknown")} status collected`,
        sourceType: "wazuh.manager.status",
        sourceId: "wazuh-manager-status",
        rawData: { managerInfo: infoData, managerStatus: statusData },
        severity: "info",
        controlMapping: ["CC7.1", "CA-7", "A.8.16"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[wazuh] failed to collect manager status:", err);
    }

    // ── Agents listing (used by inventory + per-agent capabilities) ──
    if (needsAgentList) {
      try {
        const summaryPayload = await wazuhRequest(client, "/agents/summary/status");
        agentSummary = toJsonObject(toJsonObject(summaryPayload)["data"]);
        agentList = await paginateWazuh<JsonObject>(client, "/agents");
        activeAgents = agentList.items.filter((agent) => agent["status"] === "active").slice(0, 20);
      } catch (err) {
        console.error("[wazuh] failed to fetch agent listing:", err);
      }
    }

    // ── Agents inventory ──
    if (isEnabled("agents_inventory")) {
      results.push({
        title: "Wazuh Agent Fleet Summary",
        description: `${asNumber(agentSummary["total"], agentList.total)} agents managed by Wazuh`,
        sourceType: "wazuh.agents.summary",
        sourceId: "wazuh-agents-summary",
        rawData: { summary: agentSummary, sampleAgents: agentList.items.slice(0, 50) },
        severity: asNumber(agentSummary["disconnected"]) > 0 ? "medium" : "info",
        controlMapping: ["CC6.1", "CM-8", "CA-7", "A.5.9", "A.8.16"],
        collectedAt: now,
      });

      results.push({
        title: "Wazuh Agent Inventory",
        description: `${agentList.total} endpoint agents inventoried`,
        sourceType: "wazuh.agents.inventory",
        sourceId: "wazuh-agents-inventory",
        rawData: {
          totalAgents: agentList.total,
          activeAgents: activeAgents.length,
          agents: agentList.items.slice(0, 100),
        },
        severity: "info",
        controlMapping: ["CC6.1", "CM-8", "A.5.9", "A.8.9"],
        collectedAt: now,
      });
    }

    // ── SIEM analysis stats ──
    if (isEnabled("log_analysis")) {
      try {
        const analysisdStats = await wazuhRequest(client, "/manager/stats/analysisd");
        results.push({
          title: "Wazuh SIEM Analysis Stats",
          description: "Manager analysisd statistics collected for alert pipeline health",
          sourceType: "wazuh.alerts.summary",
          sourceId: "wazuh-alerts-analysisd",
          rawData: {
            stats: toJsonObject(toJsonObject(analysisdStats)["data"]),
            since: since.toISOString(),
          },
          severity: "info",
          controlMapping: ["CC7.2", "AU-2", "AU-6", "A.8.15", "A.8.16"],
          collectedAt: now,
        });
      } catch (err) {
        console.error("[wazuh] failed to collect SIEM analysis stats:", err);
      }
    }

    // ── RBAC users / roles / policies ──
    if (isEnabled("rbac_review")) {
      try {
        const usersPayload = await wazuhRequest(client, "/security/users");
        const rolesPayload = await wazuhRequest(client, "/security/roles");
        const policiesPayload = await wazuhRequest(client, "/security/policies");
        results.push({
          title: "Wazuh RBAC Configuration",
          description: "Wazuh RBAC users, roles, and policies collected",
          sourceType: "wazuh.security.rbac",
          sourceId: "wazuh-rbac",
          rawData: {
            users: parseListResult<JsonObject>(usersPayload).items,
            roles: parseListResult<JsonObject>(rolesPayload).items,
            policies: parseListResult<JsonObject>(policiesPayload).items,
          },
          severity: "info",
          controlMapping: ["CC6.1", "CC6.3", "AC-2", "AC-6", "A.5.15", "A.5.18"],
          collectedAt: now,
        });
      } catch (err) {
        console.error("[wazuh] failed to collect RBAC configuration:", err);
      }
    }

    // ── MITRE ATT&CK coverage ──
    if (isEnabled("mitre_coverage") || isEnabled("threat_hunting")) {
      try {
        const mitreTechniques = await wazuhRequest(client, "/mitre/techniques");
        const mitreGroups = await wazuhRequest(client, "/mitre/groups");
        results.push({
          title: "Wazuh MITRE ATT&CK Coverage",
          description: "Mapped MITRE techniques and groups collected from Wazuh",
          sourceType: "wazuh.mitre.coverage",
          sourceId: "wazuh-mitre-coverage",
          rawData: {
            techniques: parseListResult<JsonObject>(mitreTechniques).items,
            groups: parseListResult<JsonObject>(mitreGroups).items,
          },
          severity: "info",
          controlMapping: ["CC7.2", "CC7.3", "IR-4", "SI-4", "A.8.16"],
          collectedAt: now,
        });
      } catch (err) {
        console.error("[wazuh] failed to collect MITRE coverage:", err);
      }
    }

    // ── Rule coverage (regulatory + container + cloud, share one fetch) ──
    const needsRules = RULES_SCOPED_CAPABILITIES.some((capability) => isEnabled(capability));
    if (needsRules) {
      try {
        const rulesPayload = await paginateWazuh<JsonObject>(
          client,
          "/rules?relative_dirname=ruleset/rules",
        );

        if (isEnabled("regulatory_compliance")) {
          const complianceGroups = ["pci_dss", "gdpr", "hipaa", "nist_800_53"];
          const complianceRules = rulesPayload.items.filter((rule) =>
            ruleHasGroup(rule, complianceGroups),
          );
          results.push({
            title: "Wazuh Regulatory Rule Coverage",
            description: `${complianceRules.length} compliance-oriented rules detected`,
            sourceType: "wazuh.compliance.coverage",
            sourceId: "wazuh-compliance-rules",
            rawData: {
              complianceGroups,
              count: complianceRules.length,
              rules: complianceRules.slice(0, 200),
            },
            severity: "info",
            controlMapping: ["CC2.2", "CA-2", "A.5.36"],
            collectedAt: now,
          });
        }

        if (isEnabled("container_security")) {
          const containerRules = rulesPayload.items.filter((rule) =>
            ruleHasGroup(rule, ["docker"]),
          );
          results.push({
            title: "Wazuh Container Security Rule Coverage",
            description: `${containerRules.length} container/Docker detection rules configured`,
            sourceType: "wazuh.containers.rule_coverage",
            sourceId: "wazuh-container-rule-coverage",
            rawData: { count: containerRules.length, rules: containerRules.slice(0, 100) },
            severity: containerRules.length === 0 ? "high" : "info",
            controlMapping: ["CC6.1", "CC7.1", "SI-4", "CM-7", "A.8.9"],
            collectedAt: now,
          });
        }

        if (isEnabled("cloud_posture")) {
          const cloudRules = rulesPayload.items.filter((rule) =>
            ruleHasGroup(rule, ["amazon", "aws", "azure", "gcp"]),
          );
          results.push({
            title: "Wazuh Cloud Workload Rule Coverage",
            description: `${cloudRules.length} cloud-provider detection rules configured`,
            sourceType: "wazuh.cloud.rule_coverage",
            sourceId: "wazuh-cloud-rule-coverage",
            rawData: { count: cloudRules.length, rules: cloudRules.slice(0, 100) },
            severity: cloudRules.length === 0 ? "high" : "info",
            controlMapping: ["CC7.1", "CM-6", "RA-5", "A.8.9"],
            collectedAt: now,
          });
        }
      } catch (err) {
        console.error("[wazuh] failed to collect rule coverage:", err);
      }
    }

    // ── Active Response configuration (incident_response) ──
    if (isEnabled("incident_response")) {
      try {
        const arConfigPayload = await wazuhRequest(
          client,
          "/manager/configuration?section=active-response",
        );
        const arConfigItem = getFirstAffectedItem(arConfigPayload);
        const activeResponseConfigs = arConfigItem["active-response"];
        const configuredCount = Array.isArray(activeResponseConfigs)
          ? activeResponseConfigs.length
          : 0;

        results.push({
          title: "Wazuh Active Response Configuration",
          description: `${configuredCount} active-response commands configured on the manager`,
          sourceType: "wazuh.active_response.configuration",
          sourceId: "wazuh-active-response-config",
          rawData: { configuredCount, configurations: activeResponseConfigs ?? [] },
          severity: configuredCount === 0 ? "medium" : "info",
          controlMapping: ["CC7.4", "IR-4", "IR-5", "A.5.24", "A.5.26"],
          collectedAt: now,
        });
      } catch (err) {
        console.error("[wazuh] failed to collect active-response configuration:", err);
      }
    }

    // ── Vulnerability findings (per active agent) ──
    if (isEnabled("vulnerability_detection")) {
      try {
        const allVulnerabilities: JsonObject[] = [];
        for (const agent of activeAgents.slice(0, 10)) {
          const agentId = String(agent["id"] ?? "");
          if (!agentId) continue;

          try {
            const byAgent = await paginateWazuh<JsonObject>(client, `/vulnerability/${agentId}`);
            allVulnerabilities.push(...byAgent.items);
          } catch (firstError) {
            try {
              const fallback = await paginateWazuh<JsonObject>(
                client,
                `/experimental/vulnerability/${agentId}`,
              );
              allVulnerabilities.push(...fallback.items);
            } catch {
              console.error(
                `[wazuh] vulnerability endpoint unavailable for agent=${agentId}:`,
                firstError,
              );
            }
          }
        }

        results.push({
          title: "Wazuh Vulnerability Findings",
          description: `${allVulnerabilities.length} vulnerability findings across sampled active agents`,
          sourceType: "wazuh.vulnerabilities",
          sourceId: "wazuh-vulnerabilities",
          rawData: {
            sampledAgents: activeAgents.length,
            vulnerabilities: allVulnerabilities.slice(0, 500),
          },
          severity: allVulnerabilities.some((item) => item["severity"] === "Critical")
            ? "critical"
            : "info",
          controlMapping: ["CC7.1", "RA-5", "SI-2", "A.8.8"],
          collectedAt: now,
        });
      } catch (err) {
        console.error("[wazuh] failed to collect vulnerability findings:", err);
      }
    }

    // ── File integrity monitoring (per active agent) ──
    if (isEnabled("file_integrity_monitoring")) {
      try {
        const fimChanges: JsonObject[] = [];
        for (const agent of activeAgents.slice(0, 10)) {
          const agentId = String(agent["id"] ?? "");
          if (!agentId) continue;
          try {
            const data = await paginateWazuh<JsonObject>(
              client,
              `/syscheck/${agentId}?q=date>${encodeURIComponent(since.toISOString())}`,
            );
            fimChanges.push(...data.items);
          } catch (err) {
            console.error(`[wazuh] failed FIM collection for agent=${agentId}:`, err);
          }
        }

        results.push({
          title: "Wazuh File Integrity Monitoring",
          description: `${fimChanges.length} file integrity events since ${since.toISOString()}`,
          sourceType: "wazuh.fim.changes",
          sourceId: "wazuh-fim-events",
          rawData: { since: since.toISOString(), changes: fimChanges.slice(0, 300) },
          severity: fimChanges.length > 0 ? "medium" : "info",
          controlMapping: ["CC6.1", "CC7.2", "SI-7", "AU-2", "A.8.32", "A.8.15"],
          collectedAt: now,
        });
      } catch (err) {
        console.error("[wazuh] failed to collect FIM evidence:", err);
      }
    }

    // ── Configuration assessment / SCA (per active agent) ──
    if (isEnabled("configuration_assessment")) {
      try {
        const scaResults: JsonObject[] = [];
        for (const agent of activeAgents.slice(0, 10)) {
          const agentId = String(agent["id"] ?? "");
          if (!agentId) continue;
          try {
            const payload = await wazuhRequest(client, `/sca/${agentId}`);
            const page = parseListResult<JsonObject>(payload);
            scaResults.push(...page.items);
          } catch (err) {
            console.error(`[wazuh] failed SCA collection for agent=${agentId}:`, err);
          }
        }

        results.push({
          title: "Wazuh Configuration Assessment",
          description: `${scaResults.length} SCA policy results from sampled agents`,
          sourceType: "wazuh.sca.results",
          sourceId: "wazuh-sca-results",
          rawData: { sampledAgents: activeAgents.length, checks: scaResults.slice(0, 400) },
          severity: scaResults.some((item) => String(item["result"]).toLowerCase() === "failed")
            ? "high"
            : "info",
          controlMapping: ["CC7.1", "CC7.2", "CM-6", "RA-5", "A.8.9", "A.8.8"],
          collectedAt: now,
        });
      } catch (err) {
        console.error("[wazuh] failed to collect SCA evidence:", err);
      }
    }

    // ── Malware / rootcheck (per active agent) ──
    if (isEnabled("malware_detection")) {
      try {
        const malwareFindings: JsonObject[] = [];
        for (const agent of activeAgents.slice(0, 10)) {
          const agentId = String(agent["id"] ?? "");
          if (!agentId) continue;
          try {
            const payload = await paginateWazuh<JsonObject>(
              client,
              `/rootcheck/${agentId}?q=date>${encodeURIComponent(since.toISOString())}`,
            );
            malwareFindings.push(...payload.items);
          } catch (err) {
            console.error(`[wazuh] failed rootcheck collection for agent=${agentId}:`, err);
          }
        }

        results.push({
          title: "Wazuh Malware and Rootcheck Findings",
          description: `${malwareFindings.length} malware/rootcheck findings since ${since.toISOString()}`,
          sourceType: "wazuh.endpoints.malware",
          sourceId: "wazuh-malware-rootcheck",
          rawData: { since: since.toISOString(), findings: malwareFindings.slice(0, 300) },
          severity: malwareFindings.length > 0 ? "high" : "info",
          controlMapping: ["CC7.1", "SI-3", "SI-4", "A.8.7"],
          collectedAt: now,
        });
      } catch (err) {
        console.error("[wazuh] failed to collect malware evidence:", err);
      }
    }

    // ── IT hygiene / endpoint inventory ──
    if (isEnabled("it_hygiene")) {
      try {
        const packagesPayload = await paginateWazuh<JsonObject>(
          client,
          "/experimental/syscollector/packages",
        );
        results.push({
          title: "Wazuh Endpoint Hygiene Inventory",
          description: `${packagesPayload.total} package inventory records collected`,
          sourceType: "wazuh.endpoints.inventory",
          sourceId: "wazuh-endpoint-hygiene",
          rawData: { records: packagesPayload.items.slice(0, 300) },
          severity: "info",
          controlMapping: ["CC6.1", "CC7.1", "CM-8", "A.8.9", "A.5.9"],
          collectedAt: now,
        });
      } catch (err) {
        console.error("[wazuh] failed to collect endpoint hygiene evidence:", err);
      }
    }

    console.log(`[wazuh] collected ${results.length} evidence items for org=${options.tenantId}`);
    return results;
  }

  async testConnection(connection: ProviderConnection): Promise<ConnectionTestResult> {
    try {
      const client = connection.client as WazuhClient;
      await authenticate(client);
      const infoPayload = await wazuhRequest(client, "/manager/info");
      const details = getFirstAffectedItem(infoPayload);

      return {
        success: true,
        message: "Successfully authenticated with Wazuh Manager",
        details: {
          hostname: details["hostname"],
          version: details["version"],
          manager: details["name"],
        },
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to connect to Wazuh",
      };
    }
  }

  async disconnect(_connection: ProviderConnection): Promise<void> {
    // Wazuh API uses short-lived JWT tokens; no explicit disconnect endpoint required.
  }

  getRequiredPermissions(): PermissionRequirement[] {
    return [
      {
        resource: "agents",
        permission: "agents:read",
        description: "Read endpoint agent inventory and status",
        required: true,
      },
      {
        resource: "sca",
        permission: "sca:read",
        description: "Read Security Configuration Assessment results",
        required: true,
      },
      {
        resource: "syscheck",
        permission: "syscheck:read",
        description: "Read file integrity and rootcheck telemetry",
        required: true,
      },
      {
        resource: "vulnerability",
        permission: "vulnerability:read",
        description: "Read vulnerability detection findings",
        required: true,
      },
      {
        resource: "security",
        permission: "security:read",
        description: "Read RBAC users, roles, and policies",
        required: true,
      },
      {
        resource: "mitre",
        permission: "mitre:read",
        description: "Read MITRE ATT&CK technique and group mappings",
        required: true,
      },
      {
        resource: "manager",
        permission: "manager:read",
        description: "Read manager status, rules, and active-response configuration",
        required: true,
      },
    ];
  }
}
