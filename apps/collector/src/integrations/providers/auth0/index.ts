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

interface Auth0Client {
  domain: string;
  accessToken: string;
}

async function auth0Fetch(client: Auth0Client, path: string): Promise<unknown> {
  const url = `https://${client.domain}/api/v2${path}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${client.accessToken}`, "Content-Type": "application/json" },
  });

  if (resp.status === 429) {
    const retryAfter = parseInt(resp.headers.get("retry-after") ?? "2", 10);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return auth0Fetch(client, path);
  }

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Auth0 API ${resp.status}: ${body}`);
  }
  return resp.json();
}

export class Auth0Provider implements IntegrationProvider {
  readonly id = "auth0";
  readonly name = "Auth0";
  readonly description =
    "Collect evidence from Auth0 including users, MFA, connections, rules, and security settings";
  readonly version = "1.0.0";
  readonly category = "identity" as const;
  readonly authType = "oauth2" as const;
  readonly capabilities = ["users", "mfa", "connections", "rules_actions", "logs", "branding"];
  readonly configSchema: CredentialField[] = [
    {
      key: "domain",
      label: "Auth0 Domain",
      type: "text",
      required: true,
      placeholder: "your-tenant.auth0.com",
      description: "Your Auth0 tenant domain",
    },
    {
      key: "clientId",
      label: "Client ID (M2M Application)",
      type: "text",
      required: true,
      description: "Client ID of a Machine-to-Machine application",
    },
    {
      key: "clientSecret",
      label: "Client Secret",
      type: "password",
      required: true,
      sensitive: true,
    },
  ];

  async connect(credentials: DecryptedCredentials): Promise<ProviderConnection> {
    const domain = credentials["domain"]!.replace(/^https?:\/\//, "").replace(/\/$/, "");

    const tokenResp = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: credentials["clientId"],
        client_secret: credentials["clientSecret"],
        audience: `https://${domain}/api/v2/`,
      }),
    });

    if (!tokenResp.ok) {
      const body = await tokenResp.text();
      throw new Error(`Auth0 token exchange failed: ${tokenResp.status} ${body}`);
    }

    const tokenData = (await tokenResp.json()) as { access_token: string };
    const client: Auth0Client = { domain, accessToken: tokenData.access_token };

    return { id: `auth0-${Date.now()}`, integration: this.id, client };
  }

  async collectEvidence(
    connection: ProviderConnection,
    options: CollectOptions,
  ): Promise<EvidenceResult[]> {
    const client = connection.client as Auth0Client;
    const results: EvidenceResult[] = [];
    const now = new Date();

    // --- Users & MFA ---
    try {
      const usersResp = (await auth0Fetch(
        client,
        "/users?per_page=100&include_totals=true",
      )) as Record<string, unknown>;
      const total = usersResp["total"] as number;
      const users = (usersResp["users"] as Array<Record<string, unknown>>) ?? [];

      let mfaEnrolled = 0;
      for (const user of users) {
        try {
          const enrollments = (await auth0Fetch(
            client,
            `/users/${user["user_id"]}/enrollments`,
          )) as Array<Record<string, unknown>>;
          if (enrollments.length > 0) mfaEnrolled++;
        } catch {
          /* skip individual errors */
        }
      }

      results.push({
        title: "Auth0 User MFA Enrollment",
        description: `${total} total users, ${mfaEnrolled} of ${users.length} sampled have MFA enrolled`,
        sourceType: "auth0.users.mfa",
        sourceId: `auth0-mfa-${client.domain}`,
        rawData: { totalUsers: total, sampledUsers: users.length, mfaEnrolled },
        severity: mfaEnrolled < users.length ? "high" : "info",
        controlMapping: ["CC6.1", "CC6.3", "IA-2", "A.9.4.2"],
        collectedAt: now,
      });

      results.push({
        title: "Auth0 User Inventory",
        description: `${total} total users in tenant`,
        sourceType: "auth0.users.inventory",
        sourceId: `auth0-users-${client.domain}`,
        rawData: {
          totalUsers: total,
          users: users.map((u) => ({
            userId: u["user_id"],
            email: u["email"],
            emailVerified: u["email_verified"],
            lastLogin: u["last_login"],
            loginsCount: u["logins_count"],
            blocked: u["blocked"],
          })),
        },
        severity: "info",
        controlMapping: ["CC6.1", "AC-2", "A.9.2.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[auth0] failed to collect users/MFA:", err);
    }

    // --- Connections (Identity Providers) ---
    try {
      const connections = (await auth0Fetch(client, "/connections")) as Array<
        Record<string, unknown>
      >;
      results.push({
        title: "Auth0 Identity Connections",
        description: `${connections.length} identity connections configured`,
        sourceType: "auth0.connections.inventory",
        sourceId: `auth0-connections-${client.domain}`,
        rawData: {
          totalConnections: connections.length,
          connections: connections.map((c) => ({
            id: c["id"],
            name: c["name"],
            strategy: c["strategy"],
            enabled_clients: (c["enabled_clients"] as string[])?.length ?? 0,
          })),
        },
        severity: "info",
        controlMapping: ["CC6.1", "IA-8", "A.9.4.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[auth0] failed to collect connections:", err);
    }

    // --- Rules & Actions ---
    try {
      const rules = (await auth0Fetch(client, "/rules")) as Array<Record<string, unknown>>;
      results.push({
        title: "Auth0 Rules",
        description: `${rules.length} rules configured`,
        sourceType: "auth0.rules.inventory",
        sourceId: `auth0-rules-${client.domain}`,
        rawData: {
          totalRules: rules.length,
          rules: rules.map((r) => ({
            id: r["id"],
            name: r["name"],
            enabled: r["enabled"],
            order: r["order"],
            stage: r["stage"],
          })),
        },
        severity: "info",
        controlMapping: ["CC6.1", "AC-3", "A.9.4.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[auth0] failed to collect rules:", err);
    }

    // --- Actions ---
    try {
      const actionsResp = (await auth0Fetch(client, "/actions/actions?deployed=true")) as Record<
        string,
        unknown
      >;
      const actions = (actionsResp["actions"] as Array<Record<string, unknown>>) ?? [];
      results.push({
        title: "Auth0 Actions",
        description: `${actions.length} deployed actions`,
        sourceType: "auth0.actions.inventory",
        sourceId: `auth0-actions-${client.domain}`,
        rawData: {
          totalActions: actions.length,
          actions: actions.map((a) => ({
            id: a["id"],
            name: a["name"],
            status: a["status"],
            supported_triggers: a["supported_triggers"],
          })),
        },
        severity: "info",
        controlMapping: ["CC6.1", "AC-3", "A.9.4.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[auth0] failed to collect actions:", err);
    }

    // --- Tenant Settings ---
    try {
      const tenant = (await auth0Fetch(client, "/tenants/settings")) as Record<string, unknown>;
      const flags = (tenant["flags"] as Record<string, unknown>) ?? {};

      results.push({
        title: "Auth0 Tenant Security Settings",
        description: "Tenant-level security configuration",
        sourceType: "auth0.tenant.settings",
        sourceId: `auth0-tenant-${client.domain}`,
        rawData: {
          enabledLocales: tenant["enabled_locales"],
          sandboxVersion: tenant["sandbox_version"],
          flags: {
            enablePublicSignupUserExistsError: flags["enable_public_signup_user_exists_error"],
            disableClickjackProtection: flags["disable_clickjack_protection_headers"],
            enableApisSection: flags["enable_apis_section"],
            noDisclosureEnterpriseConnections: flags["no_disclose_enterprise_connections"],
          },
        },
        severity: flags["disable_clickjack_protection_headers"] ? "medium" : "info",
        controlMapping: ["CC6.1", "SC-8", "A.14.1.2"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[auth0] failed to collect tenant settings:", err);
    }

    // --- Logs (recent events) ---
    try {
      const since = options.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
      const logs = (await auth0Fetch(
        client,
        `/logs?from=${since.toISOString()}&take=100&q=type:(f OR fu OR fp OR fsa OR limit_wc)`,
      )) as Array<Record<string, unknown>>;

      results.push({
        title: "Auth0 Security Events",
        description: `${logs.length} security-relevant events (failures, suspicious activity)`,
        sourceType: "auth0.logs.security",
        sourceId: `auth0-logs-${client.domain}-${now.toISOString().split("T")[0]}`,
        rawData: {
          totalEvents: logs.length,
          events: logs.slice(0, 50).map((l) => ({
            type: l["type"],
            date: l["date"],
            description: l["description"],
            ip: l["ip"],
            user_agent: l["user_agent"],
          })),
        },
        severity: logs.length > 10 ? "medium" : "info",
        controlMapping: ["CC7.2", "AU-2", "AU-6", "A.12.4.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[auth0] failed to collect logs:", err);
    }

    console.log(`[auth0] collected ${results.length} evidence items for org=${options.tenantId}`);
    return results;
  }

  async testConnection(connection: ProviderConnection): Promise<ConnectionTestResult> {
    try {
      const client = connection.client as Auth0Client;
      const tenant = (await auth0Fetch(client, "/tenants/settings")) as Record<string, unknown>;

      return {
        success: true,
        message: "Successfully authenticated with Auth0",
        details: { domain: client.domain, friendlyName: tenant["friendly_name"] },
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to connect to Auth0",
      };
    }
  }

  async disconnect(_connection: ProviderConnection): Promise<void> {
    // M2M tokens expire naturally
  }

  getRequiredPermissions(): PermissionRequirement[] {
    return [
      {
        resource: "users",
        permission: "read:users",
        description: "Read user profiles",
        required: true,
      },
      {
        resource: "users",
        permission: "read:user_idp_tokens",
        description: "Read user MFA enrollments",
        required: true,
      },
      {
        resource: "connections",
        permission: "read:connections",
        description: "Read identity connections",
        required: true,
      },
      { resource: "rules", permission: "read:rules", description: "Read rules", required: true },
      {
        resource: "actions",
        permission: "read:actions",
        description: "Read actions",
        required: true,
      },
      {
        resource: "tenant",
        permission: "read:tenant_settings",
        description: "Read tenant settings",
        required: true,
      },
      { resource: "logs", permission: "read:logs", description: "Read log events", required: true },
    ];
  }
}
