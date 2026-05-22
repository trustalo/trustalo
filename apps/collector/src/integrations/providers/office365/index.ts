import { ConfidentialClientApplication } from "@azure/msal-node";
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

interface O365Client {
  accessToken: string;
  tenantId: string;
}

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function graphFetch(client: O365Client, path: string): Promise<unknown> {
  const url = path.startsWith("http") ? path : `${GRAPH_BASE}${path}`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${client.accessToken}`,
      "Content-Type": "application/json",
      ConsistencyLevel: "eventual",
    },
  });

  if (resp.status === 429) {
    const retryAfter = parseInt(resp.headers.get("retry-after") ?? "5", 10);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return graphFetch(client, path);
  }

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Graph API ${resp.status}: ${body}`);
  }
  return resp.json();
}

async function graphPaginate<T>(client: O365Client, path: string, maxPages = 5): Promise<T[]> {
  const results: T[] = [];
  let url: string | null = path.startsWith("http") ? path : `${GRAPH_BASE}${path}`;
  let page = 0;

  while (url && page < maxPages) {
    const resp = (await graphFetch(client, url)) as { value: T[]; "@odata.nextLink"?: string };
    results.push(...(resp.value ?? []));
    url = resp["@odata.nextLink"] ?? null;
    page++;
  }

  return results;
}

export class Office365Provider implements IntegrationProvider {
  readonly id = "office365";
  readonly name = "Microsoft Office 365";
  readonly description =
    "Collect evidence from Office 365 including users, MFA, conditional access, DLP, and audit logs";
  readonly version = "1.0.0";
  readonly category = "productivity" as const;
  readonly authType = "oauth2" as const;
  readonly capabilities = [
    "users_groups",
    "mfa_status",
    "conditional_access",
    "dlp_policies",
    "audit_logs",
    "secure_score",
  ];
  readonly configSchema: CredentialField[] = [
    { key: "tenantId", label: "Tenant (Directory) ID", type: "text", required: true },
    { key: "clientId", label: "Application (Client) ID", type: "text", required: true },
    {
      key: "clientSecret",
      label: "Client Secret",
      type: "password",
      required: true,
      sensitive: true,
    },
  ];

  async connect(credentials: DecryptedCredentials): Promise<ProviderConnection> {
    const tenantId = credentials["tenantId"]!;
    const cca = new ConfidentialClientApplication({
      auth: {
        clientId: credentials["clientId"]!,
        clientSecret: credentials["clientSecret"]!,
        authority: `https://login.microsoftonline.com/${tenantId}`,
      },
    });

    const tokenResp = await cca.acquireTokenByClientCredential({
      scopes: ["https://graph.microsoft.com/.default"],
    });

    if (!tokenResp?.accessToken) {
      throw new Error("Failed to acquire Microsoft Graph access token");
    }

    const client: O365Client = { accessToken: tokenResp.accessToken, tenantId };
    return { id: `office365-${Date.now()}`, integration: this.id, client };
  }

  async collectEvidence(
    connection: ProviderConnection,
    options: CollectOptions,
  ): Promise<EvidenceResult[]> {
    const client = connection.client as O365Client;
    const results: EvidenceResult[] = [];
    const now = new Date();

    // --- Users & MFA Registration ---
    try {
      const users = await graphPaginate<Record<string, unknown>>(
        client,
        "/users?$select=id,displayName,userPrincipalName,accountEnabled,createdDateTime,signInActivity&$top=999",
      );
      const disabledUsers = users.filter((u) => !u["accountEnabled"]);

      results.push({
        title: "Office 365 User Inventory",
        description: `${users.length} users, ${disabledUsers.length} disabled accounts`,
        manifestKey: "office365.users.inventory",
        sourceType: "office365.users.inventory",
        sourceId: `o365-users-${client.tenantId}`,
        rawData: {
          totalUsers: users.length,
          disabledUsers: disabledUsers.length,
          users: users.slice(0, 100).map((u) => ({
            id: u["id"],
            displayName: u["displayName"],
            upn: u["userPrincipalName"],
            enabled: u["accountEnabled"],
          })),
        },
        severity: "info",
        controlMapping: ["CC6.1", "AC-2", "A.9.2.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[office365] failed to collect users:", err);
    }

    // --- MFA Registration Details ---
    try {
      const mfaReport = await graphPaginate<Record<string, unknown>>(
        client,
        "/reports/authenticationMethods/userRegistrationDetails?$top=999",
      );
      const registeredForMfa = mfaReport.filter((r) => r["isMfaRegistered"]);
      const notRegistered = mfaReport.filter((r) => !r["isMfaRegistered"]);

      results.push({
        title: "Office 365 MFA Registration",
        description: `${registeredForMfa.length} of ${mfaReport.length} users registered for MFA, ${notRegistered.length} not registered`,
        manifestKey: "office365.users.mfa",
        sourceType: "office365.users.mfa",
        sourceId: `o365-mfa-${client.tenantId}`,
        rawData: {
          totalUsers: mfaReport.length,
          mfaRegistered: registeredForMfa.length,
          notRegistered: notRegistered.length,
          unregisteredUsers: notRegistered.slice(0, 50).map((u) => ({
            userPrincipalName: u["userPrincipalName"],
            methodsRegistered: u["methodsRegistered"],
          })),
        },
        severity: notRegistered.length > 0 ? "high" : "info",
        controlMapping: ["CC6.1", "CC6.3", "IA-2", "A.9.4.2"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[office365] failed to collect MFA report:", err);
    }

    // --- Conditional Access Policies ---
    try {
      const policies = await graphPaginate<Record<string, unknown>>(
        client,
        "/identity/conditionalAccess/policies",
      );
      const enabledPolicies = policies.filter((p) => p["state"] === "enabled");
      const reportOnlyPolicies = policies.filter(
        (p) => p["state"] === "enabledForReportingButNotEnforced",
      );

      results.push({
        title: "Office 365 Conditional Access Policies",
        description: `${policies.length} policies: ${enabledPolicies.length} enabled, ${reportOnlyPolicies.length} report-only`,
        manifestKey: "office365.identity.conditional_access",
        sourceType: "office365.identity.conditional_access",
        sourceId: `o365-ca-${client.tenantId}`,
        rawData: {
          totalPolicies: policies.length,
          enabledPolicies: enabledPolicies.length,
          reportOnlyPolicies: reportOnlyPolicies.length,
          policies: policies.map((p) => ({
            id: p["id"],
            displayName: p["displayName"],
            state: p["state"],
          })),
        },
        severity: enabledPolicies.length === 0 ? "high" : "info",
        controlMapping: ["CC6.1", "AC-7", "A.9.4.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[office365] failed to collect conditional access:", err);
    }

    // --- Security Groups ---
    try {
      const groups = await graphPaginate<Record<string, unknown>>(
        client,
        "/groups?$filter=securityEnabled eq true&$select=id,displayName,description,membershipRule&$top=999",
      );
      results.push({
        title: "Office 365 Security Groups",
        description: `${groups.length} security groups configured`,
        manifestKey: "office365.groups.security",
        sourceType: "office365.groups.security",
        sourceId: `o365-groups-${client.tenantId}`,
        rawData: {
          totalGroups: groups.length,
          groups: groups.map((g) => ({ id: g["id"], displayName: g["displayName"] })),
        },
        severity: "info",
        controlMapping: ["CC6.1", "AC-2", "A.9.2.3"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[office365] failed to collect security groups:", err);
    }

    // --- Secure Score ---
    try {
      const scoreResp = (await graphFetch(client, "/security/secureScores?$top=1")) as Record<
        string,
        unknown
      >;
      const scores = (scoreResp["value"] as Array<Record<string, unknown>>) ?? [];
      const latestScore = scores[0];

      if (latestScore) {
        const currentScore = latestScore["currentScore"] as number;
        const maxScore = latestScore["maxScore"] as number;
        const percentage = maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0;

        results.push({
          title: "Microsoft Secure Score",
          description: `Score: ${currentScore}/${maxScore} (${percentage}%)`,
          manifestKey: "office365.security.secure_score",
          sourceType: "office365.security.secure_score",
          sourceId: `o365-secure-score-${client.tenantId}`,
          rawData: {
            currentScore,
            maxScore,
            percentage,
            createdDateTime: latestScore["createdDateTime"],
          },
          severity: percentage < 50 ? "high" : percentage < 75 ? "medium" : "info",
          controlMapping: ["CC7.1", "CA-7", "A.18.2.2"],
          collectedAt: now,
        });
      }
    } catch (err) {
      console.error("[office365] failed to collect secure score:", err);
    }

    // --- Sign-In Logs (recent failures) ---
    try {
      const since = options.since ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
      const signIns = await graphPaginate<Record<string, unknown>>(
        client,
        `/auditLogs/signIns?$filter=status/errorCode ne 0 and createdDateTime ge ${since.toISOString()}&$top=100`,
      );

      results.push({
        title: "Office 365 Failed Sign-Ins",
        description: `${signIns.length} failed sign-in attempts in the monitored period`,
        manifestKey: "office365.logs.failed_signins",
        sourceType: "office365.logs.failed_signins",
        sourceId: `o365-failed-signins-${client.tenantId}-${now.toISOString().split("T")[0]}`,
        rawData: {
          totalFailures: signIns.length,
          signIns: signIns.slice(0, 50).map((s) => ({
            userPrincipalName: s["userPrincipalName"],
            appDisplayName: s["appDisplayName"],
            status: s["status"],
            ipAddress: s["ipAddress"],
            createdDateTime: s["createdDateTime"],
          })),
        },
        severity: signIns.length > 20 ? "medium" : "info",
        controlMapping: ["CC7.2", "AC-7", "AU-6", "A.12.4.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[office365] failed to collect sign-in logs:", err);
    }

    console.log(
      `[office365] collected ${results.length} evidence items for org=${options.tenantId}`,
    );
    return results;
  }

  async testConnection(connection: ProviderConnection): Promise<ConnectionTestResult> {
    try {
      const client = connection.client as O365Client;
      const org = (await graphFetch(client, "/organization")) as Record<string, unknown>;
      const orgData = (org["value"] as Array<Record<string, unknown>>)?.[0];

      return {
        success: true,
        message: "Successfully authenticated with Microsoft Office 365",
        details: {
          tenantId: client.tenantId,
          displayName: orgData?.["displayName"],
          verifiedDomains: orgData?.["verifiedDomains"],
        },
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to connect to Office 365",
      };
    }
  }

  async disconnect(_connection: ProviderConnection): Promise<void> {
    // OAuth tokens managed by MSAL; no session cleanup needed
  }

  getRequiredPermissions(): PermissionRequirement[] {
    return [
      {
        resource: "graph",
        permission: "User.Read.All",
        description: "Read all user profiles",
        required: true,
      },
      {
        resource: "graph",
        permission: "Group.Read.All",
        description: "Read all groups",
        required: true,
      },
      {
        resource: "graph",
        permission: "Policy.Read.All",
        description: "Read conditional access and DLP policies",
        required: true,
      },
      {
        resource: "graph",
        permission: "AuditLog.Read.All",
        description: "Read sign-in and audit logs",
        required: true,
      },
      {
        resource: "graph",
        permission: "Reports.Read.All",
        description: "Read MFA registration reports",
        required: true,
      },
      {
        resource: "graph",
        permission: "SecurityEvents.Read.All",
        description: "Read secure score and security events",
        required: true,
      },
      {
        resource: "graph",
        permission: "UserAuthenticationMethod.Read.All",
        description: "Read user auth methods",
        required: false,
      },
    ];
  }
}
