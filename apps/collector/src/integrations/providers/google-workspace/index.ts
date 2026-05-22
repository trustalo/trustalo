import { GoogleAuth } from "google-auth-library";
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

interface GWSClient {
  auth: GoogleAuth;
  domain: string;
  adminEmail: string;
}

async function gwsFetch(client: GWSClient, url: string): Promise<unknown> {
  const authClient = await client.auth.getClient();
  const token = await authClient.getAccessToken();
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Google Workspace API ${resp.status}: ${body}`);
  }
  return resp.json();
}

export class GoogleWorkspaceProvider implements IntegrationProvider {
  readonly id = "google-workspace";
  readonly name = "Google Workspace";
  readonly description =
    "Collect evidence from Google Workspace including users, 2SV, Drive sharing, and admin activity";
  readonly version = "1.0.0";
  readonly category = "productivity" as const;
  readonly authType = "api_key" as const;
  readonly capabilities = [
    "users",
    "2sv_status",
    "groups",
    "drive_sharing",
    "oauth_apps",
    "admin_activity",
  ];
  readonly configSchema: CredentialField[] = [
    {
      key: "serviceAccountKey",
      label: "Service Account Key (JSON)",
      type: "textarea",
      required: true,
      sensitive: true,
      description: "Service account with domain-wide delegation enabled",
    },
    {
      key: "adminEmail",
      label: "Super Admin Email",
      type: "text",
      required: true,
      placeholder: "admin@yourdomain.com",
      description: "Super admin email for impersonation",
    },
    {
      key: "domain",
      label: "Workspace Domain",
      type: "text",
      required: true,
      placeholder: "yourdomain.com",
    },
  ];

  async connect(credentials: DecryptedCredentials): Promise<ProviderConnection> {
    const keyData = JSON.parse(credentials["serviceAccountKey"]!);
    const adminEmail = credentials["adminEmail"]!;
    const domain = credentials["domain"]!;

    const auth = new GoogleAuth({
      credentials: keyData,
      scopes: [
        "https://www.googleapis.com/auth/admin.directory.user.readonly",
        "https://www.googleapis.com/auth/admin.directory.group.readonly",
        "https://www.googleapis.com/auth/admin.reports.audit.readonly",
        "https://www.googleapis.com/auth/admin.directory.domain.readonly",
      ],
      clientOptions: { subject: adminEmail },
    });

    const client: GWSClient = { auth, domain, adminEmail };
    return { id: `google-workspace-${Date.now()}`, integration: this.id, client };
  }

  async collectEvidence(
    connection: ProviderConnection,
    options: CollectOptions,
  ): Promise<EvidenceResult[]> {
    const client = connection.client as GWSClient;
    const results: EvidenceResult[] = [];
    const now = new Date();
    const dirBase = "https://admin.googleapis.com/admin/directory/v1";
    const reportsBase = "https://admin.googleapis.com/admin/reports/v1";

    // --- Users & 2-Step Verification ---
    try {
      const usersResp = (await gwsFetch(
        client,
        `${dirBase}/users?domain=${client.domain}&maxResults=500&projection=full`,
      )) as Record<string, unknown>;
      const users = (usersResp["users"] as Array<Record<string, unknown>>) ?? [];
      let usersWithout2sv = 0;
      let suspendedUsers = 0;

      for (const user of users) {
        if (!(user["isEnrolledIn2Sv"] as boolean)) usersWithout2sv++;
        if (user["suspended"] as boolean) suspendedUsers++;
      }

      results.push({
        title: "Google Workspace 2-Step Verification",
        description: `${users.length} users, ${usersWithout2sv} without 2-Step Verification, ${suspendedUsers} suspended`,
        manifestKey: "google_workspace.users.2sv",
        sourceType: "google_workspace.users.2sv",
        sourceId: `gws-2sv-${client.domain}`,
        rawData: {
          totalUsers: users.length,
          usersWithout2sv,
          suspendedUsers,
          users: users.map((u) => ({
            email: u["primaryEmail"] as string,
            isAdmin: u["isAdmin"],
            is2svEnrolled: u["isEnrolledIn2Sv"],
            is2svEnforced: u["isEnforcedIn2Sv"],
            suspended: u["suspended"],
            lastLoginTime: u["lastLoginTime"],
          })),
        },
        severity: usersWithout2sv > 0 ? "high" : "info",
        controlMapping: ["CC6.1", "CC6.3", "IA-2", "A.9.4.2"],
        collectedAt: now,
      });

      results.push({
        title: "Google Workspace User Inventory",
        description: `${users.length} users in ${client.domain}`,
        manifestKey: "google_workspace.users.inventory",
        sourceType: "google_workspace.users.inventory",
        sourceId: `gws-users-${client.domain}`,
        rawData: {
          totalUsers: users.length,
          adminUsers: users.filter((u) => u["isAdmin"]).length,
          suspendedUsers,
        },
        severity: "info",
        controlMapping: ["CC6.1", "AC-2", "A.9.2.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[google-workspace] failed to collect users/2SV:", err);
    }

    // --- Groups ---
    try {
      const groupsResp = (await gwsFetch(
        client,
        `${dirBase}/groups?domain=${client.domain}&maxResults=200`,
      )) as Record<string, unknown>;
      const groups = (groupsResp["groups"] as Array<Record<string, unknown>>) ?? [];

      results.push({
        title: "Google Workspace Groups",
        description: `${groups.length} groups configured`,
        manifestKey: "google_workspace.groups.inventory",
        sourceType: "google_workspace.groups.inventory",
        sourceId: `gws-groups-${client.domain}`,
        rawData: {
          totalGroups: groups.length,
          groups: groups.map((g) => ({
            email: g["email"],
            name: g["name"],
            directMembersCount: g["directMembersCount"],
          })),
        },
        severity: "info",
        controlMapping: ["CC6.1", "AC-2", "A.9.2.3"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[google-workspace] failed to collect groups:", err);
    }

    // --- Admin Activity Logs ---
    try {
      const since = options.since ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const activitiesResp = (await gwsFetch(
        client,
        `${reportsBase}/activity/users/all/applications/admin?startTime=${since.toISOString()}&maxResults=100`,
      )) as Record<string, unknown>;
      const activities = (activitiesResp["items"] as Array<Record<string, unknown>>) ?? [];

      results.push({
        title: "Google Workspace Admin Activity",
        description: `${activities.length} admin activities in the last 7 days`,
        manifestKey: "google_workspace.logs.admin_activity",
        sourceType: "google_workspace.logs.admin_activity",
        sourceId: `gws-admin-activity-${client.domain}-${now.toISOString().split("T")[0]}`,
        rawData: {
          totalActivities: activities.length,
          activities: activities.slice(0, 50).map((a) => ({
            actor: (a["actor"] as Record<string, unknown>)?.["email"],
            eventName: (a["events"] as Array<Record<string, unknown>>)?.[0]?.["name"],
            time: (a["id"] as Record<string, unknown>)?.["time"],
          })),
        },
        severity: "info",
        controlMapping: ["CC7.2", "AU-2", "AU-6", "A.12.4.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[google-workspace] failed to collect admin activity:", err);
    }

    // --- Login Activity (suspicious logins) ---
    try {
      const since = options.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
      const loginResp = (await gwsFetch(
        client,
        `${reportsBase}/activity/users/all/applications/login?startTime=${since.toISOString()}&eventName=login_failure&maxResults=100`,
      )) as Record<string, unknown>;
      const loginEvents = (loginResp["items"] as Array<Record<string, unknown>>) ?? [];

      results.push({
        title: "Google Workspace Failed Logins",
        description: `${loginEvents.length} failed login attempts in the last 24 hours`,
        manifestKey: "google_workspace.logs.login_failures",
        sourceType: "google_workspace.logs.login_failures",
        sourceId: `gws-login-failures-${client.domain}-${now.toISOString().split("T")[0]}`,
        rawData: { totalFailures: loginEvents.length },
        severity: loginEvents.length > 20 ? "medium" : "info",
        controlMapping: ["CC7.2", "AC-7", "AU-6", "A.12.4.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[google-workspace] failed to collect login activity:", err);
    }

    console.log(
      `[google-workspace] collected ${results.length} evidence items for org=${options.tenantId}`,
    );
    return results;
  }

  async testConnection(connection: ProviderConnection): Promise<ConnectionTestResult> {
    try {
      const client = connection.client as GWSClient;
      await gwsFetch(
        client,
        `https://admin.googleapis.com/admin/directory/v1/users?domain=${client.domain}&maxResults=1`,
      );

      return {
        success: true,
        message: "Successfully authenticated with Google Workspace",
        details: { domain: client.domain, adminEmail: client.adminEmail },
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to connect to Google Workspace",
      };
    }
  }

  async disconnect(_connection: ProviderConnection): Promise<void> {
    // Service account tokens expire naturally
  }

  getRequiredPermissions(): PermissionRequirement[] {
    return [
      {
        resource: "users",
        permission: "admin.directory.user.readonly",
        description: "Read user profiles and 2SV status",
        required: true,
      },
      {
        resource: "groups",
        permission: "admin.directory.group.readonly",
        description: "Read groups",
        required: true,
      },
      {
        resource: "audit",
        permission: "admin.reports.audit.readonly",
        description: "Read admin and login activity reports",
        required: true,
      },
      {
        resource: "domains",
        permission: "admin.directory.domain.readonly",
        description: "Read domain details",
        required: false,
      },
    ];
  }
}
