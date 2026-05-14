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

interface OktaClient {
  domain: string;
  apiToken: string;
}

async function oktaFetch(client: OktaClient, path: string): Promise<unknown> {
  const url = `https://${client.domain}/api/v1${path}`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `SSWS ${client.apiToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (resp.status === 429) {
    const retryAfter = parseInt(resp.headers.get("x-rate-limit-reset") ?? "1", 10);
    const waitMs = Math.max(retryAfter * 1000 - Date.now(), 1000);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return oktaFetch(client, path);
  }

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Okta API ${resp.status}: ${body}`);
  }
  return resp.json();
}

async function oktaFetchAll<T>(client: OktaClient, path: string, limit = 200): Promise<T[]> {
  const results: T[] = [];
  let url: string | null =
    `https://${client.domain}/api/v1${path}${path.includes("?") ? "&" : "?"}limit=${limit}`;

  while (url) {
    const resp: Response = await fetch(url, {
      headers: { Authorization: `SSWS ${client.apiToken}`, Accept: "application/json" },
    });

    if (resp.status === 429) {
      const retryAfter = parseInt(resp.headers.get("x-rate-limit-reset") ?? "1", 10);
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(retryAfter * 1000 - Date.now(), 1000)),
      );
      continue;
    }

    if (!resp.ok) throw new Error(`Okta API ${resp.status}: ${await resp.text()}`);
    const data = (await resp.json()) as T[];
    results.push(...data);

    const linkHeader: string | null = resp.headers.get("link");
    const nextMatch: RegExpMatchArray | null | undefined =
      linkHeader?.match(/<([^>]+)>;\s*rel="next"/);
    url = nextMatch?.[1] ?? null;
  }

  return results;
}

export class OktaProvider implements IntegrationProvider {
  readonly id = "okta";
  readonly name = "Okta";
  readonly description =
    "Collect evidence from Okta including users, MFA enrollment, policies, and system logs";
  readonly version = "1.0.0";
  readonly category = "identity" as const;
  readonly authType = "api_key" as const;
  readonly capabilities = ["users", "mfa", "policies", "groups", "admin_roles", "system_log"];
  readonly configSchema: CredentialField[] = [
    {
      key: "domain",
      label: "Okta Domain",
      type: "text",
      required: true,
      placeholder: "your-org.okta.com",
      description: "Your Okta organization domain (without https://)",
    },
    {
      key: "apiToken",
      label: "API Token",
      type: "password",
      required: true,
      sensitive: true,
      description: "Okta API token with read-only admin permissions",
    },
  ];

  async connect(credentials: DecryptedCredentials): Promise<ProviderConnection> {
    const domain = credentials["domain"]!.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const client: OktaClient = { domain, apiToken: credentials["apiToken"]! };
    return { id: `okta-${Date.now()}`, integration: this.id, client };
  }

  async collectEvidence(
    connection: ProviderConnection,
    options: CollectOptions,
  ): Promise<EvidenceResult[]> {
    const client = connection.client as OktaClient;
    const results: EvidenceResult[] = [];
    const now = new Date();

    // --- Users & MFA Status ---
    try {
      const users = await oktaFetchAll<Record<string, unknown>>(
        client,
        '/users?filter=status eq "ACTIVE"',
      );
      let mfaEnrolled = 0;

      for (const user of users.slice(0, 500)) {
        try {
          const factors = (await oktaFetch(client, `/users/${user["id"]}/factors`)) as Array<
            Record<string, unknown>
          >;
          const activeFactors = factors.filter((f) => f["status"] === "ACTIVE");
          if (activeFactors.length > 0) mfaEnrolled++;
        } catch {
          /* skip individual user errors */
        }
      }

      const usersWithoutMfa = users.length - mfaEnrolled;

      results.push({
        title: "Okta User MFA Enrollment",
        description: `${users.length} active users, ${mfaEnrolled} with MFA enrolled, ${usersWithoutMfa} without MFA`,
        sourceType: "okta.users.mfa",
        sourceId: `okta-mfa-${client.domain}`,
        rawData: { totalUsers: users.length, mfaEnrolled, usersWithoutMfa },
        severity: usersWithoutMfa > 0 ? "high" : "info",
        controlMapping: ["CC6.1", "CC6.3", "IA-2", "A.9.4.2"],
        collectedAt: now,
      });

      results.push({
        title: "Okta User Inventory",
        description: `${users.length} active users in the organization`,
        sourceType: "okta.users.inventory",
        sourceId: `okta-users-${client.domain}`,
        rawData: {
          totalUsers: users.length,
          users: users.slice(0, 100).map((u) => ({
            id: u["id"],
            login: (u["profile"] as Record<string, unknown>)?.["login"],
            status: u["status"],
            created: u["created"],
            lastLogin: u["lastLogin"],
          })),
        },
        severity: "info",
        controlMapping: ["CC6.1", "AC-2", "A.9.2.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[okta] failed to collect users/MFA:", err);
    }

    // --- Groups ---
    try {
      const groups = await oktaFetchAll<Record<string, unknown>>(client, "/groups");
      results.push({
        title: "Okta Groups",
        description: `${groups.length} groups configured`,
        sourceType: "okta.groups.inventory",
        sourceId: `okta-groups-${client.domain}`,
        rawData: {
          totalGroups: groups.length,
          groups: groups.map((g) => ({
            id: g["id"],
            name: (g["profile"] as Record<string, unknown>)?.["name"],
            type: g["type"],
          })),
        },
        severity: "info",
        controlMapping: ["CC6.1", "AC-2", "A.9.2.3"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[okta] failed to collect groups:", err);
    }

    // --- Sign-On Policies ---
    try {
      const policies = (await oktaFetch(client, "/policies?type=OKTA_SIGN_ON")) as Array<
        Record<string, unknown>
      >;
      results.push({
        title: "Okta Sign-On Policies",
        description: `${policies.length} sign-on policies configured`,
        sourceType: "okta.policies.sign_on",
        sourceId: `okta-policies-${client.domain}`,
        rawData: {
          totalPolicies: policies.length,
          policies: policies.map((p) => ({
            id: p["id"],
            name: p["name"],
            status: p["status"],
            type: p["type"],
          })),
        },
        severity: policies.length === 0 ? "high" : "info",
        controlMapping: ["CC6.1", "AC-7", "A.9.4.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[okta] failed to collect sign-on policies:", err);
    }

    // --- Password Policies ---
    try {
      const passwordPolicies = (await oktaFetch(client, "/policies?type=PASSWORD")) as Array<
        Record<string, unknown>
      >;
      results.push({
        title: "Okta Password Policies",
        description: `${passwordPolicies.length} password policies configured`,
        sourceType: "okta.policies.password",
        sourceId: `okta-password-policies-${client.domain}`,
        rawData: {
          totalPolicies: passwordPolicies.length,
          policies: passwordPolicies.map((p) => ({
            id: p["id"],
            name: p["name"],
            status: p["status"],
            settings: p["settings"],
          })),
        },
        severity: "info",
        controlMapping: ["CC6.1", "IA-5", "A.9.4.3"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[okta] failed to collect password policies:", err);
    }

    // --- System Log (recent security events) ---
    try {
      const since = options.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
      const sinceStr = since.toISOString();
      const events = (await oktaFetch(
        client,
        `/logs?since=${sinceStr}&filter=eventType eq "user.session.start" or eventType eq "policy.lifecycle.update" or eventType eq "user.lifecycle.suspend"&limit=100`,
      )) as Array<Record<string, unknown>>;

      results.push({
        title: "Okta System Log Events",
        description: `${events.length} security-relevant events in the last 24 hours`,
        sourceType: "okta.logs.security_events",
        sourceId: `okta-logs-${client.domain}-${now.toISOString().split("T")[0]}`,
        rawData: {
          totalEvents: events.length,
          events: events.slice(0, 50).map((e) => ({
            eventType: e["eventType"],
            displayMessage: e["displayMessage"],
            severity: e["severity"],
            published: e["published"],
            actor: (e["actor"] as Record<string, unknown>)?.["displayName"],
          })),
        },
        severity: "info",
        controlMapping: ["CC7.2", "AU-2", "AU-6", "A.12.4.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[okta] failed to collect system log:", err);
    }

    console.log(`[okta] collected ${results.length} evidence items for org=${options.tenantId}`);
    return results;
  }

  async testConnection(connection: ProviderConnection): Promise<ConnectionTestResult> {
    try {
      const client = connection.client as OktaClient;
      const org = (await oktaFetch(client, "/org")) as Record<string, unknown>;

      return {
        success: true,
        message: "Successfully authenticated with Okta",
        details: {
          companyName: org["companyName"],
          subdomain: org["subdomain"],
          status: org["status"],
        },
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to connect to Okta",
      };
    }
  }

  async disconnect(_connection: ProviderConnection): Promise<void> {
    // API tokens are long-lived; no session to close
  }

  getRequiredPermissions(): PermissionRequirement[] {
    return [
      {
        resource: "users",
        permission: "okta.users.read",
        description: "Read user profiles",
        required: true,
      },
      {
        resource: "users",
        permission: "okta.users.credentials.read",
        description: "Read user MFA factors",
        required: true,
      },
      {
        resource: "groups",
        permission: "okta.groups.read",
        description: "Read groups",
        required: true,
      },
      {
        resource: "policies",
        permission: "okta.policies.read",
        description: "Read policies",
        required: true,
      },
      {
        resource: "logs",
        permission: "okta.logs.read",
        description: "Read system logs",
        required: true,
      },
    ];
  }
}
