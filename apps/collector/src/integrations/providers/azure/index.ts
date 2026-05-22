import { ClientSecretCredential } from "@azure/identity";
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

interface AzureClient {
  credential: ClientSecretCredential;
  tenantId: string;
  subscriptionId: string;
  accessToken: string;
}

const MGMT_BASE = "https://management.azure.com";
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function azureMgmtFetch(
  client: AzureClient,
  path: string,
  apiVersion: string,
): Promise<unknown> {
  const url = `${MGMT_BASE}${path}?api-version=${apiVersion}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${client.accessToken}`, "Content-Type": "application/json" },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Azure API ${resp.status}: ${body}`);
  }
  return resp.json();
}

async function azureGraphFetch(token: string, path: string): Promise<unknown> {
  const resp = await fetch(`${GRAPH_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Azure Graph API ${resp.status}: ${body}`);
  }
  return resp.json();
}

export class AzureProvider implements IntegrationProvider {
  readonly id = "azure";
  readonly name = "Microsoft Azure";
  readonly description =
    "Collect evidence from Azure including AD, Network Security Groups, Storage, and Key Vault";
  readonly version = "1.0.0";
  readonly category = "cloud" as const;
  readonly authType = "oauth2" as const;
  readonly capabilities = [
    "ad_users",
    "network_security",
    "storage",
    "key_vault",
    "activity_logs",
    "policy_compliance",
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
    { key: "subscriptionId", label: "Subscription ID", type: "text", required: true },
  ];

  async connect(credentials: DecryptedCredentials): Promise<ProviderConnection> {
    const tenantId = credentials["tenantId"]!;
    const clientId = credentials["clientId"]!;
    const clientSecret = credentials["clientSecret"]!;
    const subscriptionId = credentials["subscriptionId"]!;

    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const tokenResp = await credential.getToken("https://management.azure.com/.default");

    const client: AzureClient = {
      credential,
      tenantId,
      subscriptionId,
      accessToken: tokenResp.token,
    };

    return { id: `azure-${Date.now()}`, integration: this.id, client };
  }

  async collectEvidence(
    connection: ProviderConnection,
    options: CollectOptions,
  ): Promise<EvidenceResult[]> {
    const client = connection.client as AzureClient;
    const results: EvidenceResult[] = [];
    const now = new Date();
    const subPath = `/subscriptions/${client.subscriptionId}`;

    // --- Network Security Groups ---
    try {
      const nsgResp = (await azureMgmtFetch(
        client,
        `${subPath}/providers/Microsoft.Network/networkSecurityGroups`,
        "2023-11-01",
      )) as Record<string, unknown>;
      const nsgs = (nsgResp["value"] as Array<Record<string, unknown>>) ?? [];
      const openNsgs = nsgs.filter((nsg) => {
        const props = nsg["properties"] as Record<string, unknown>;
        const rules = (props?.["securityRules"] as Array<Record<string, unknown>>) ?? [];
        return rules.some((rule) => {
          const ruleProps = rule["properties"] as Record<string, unknown>;
          return (
            ruleProps?.["sourceAddressPrefix"] === "*" &&
            ruleProps?.["access"] === "Allow" &&
            ruleProps?.["direction"] === "Inbound"
          );
        });
      });

      results.push({
        title: "Azure Network Security Groups",
        description: `${nsgs.length} NSGs found, ${openNsgs.length} with unrestricted inbound rules`,
        manifestKey: "azure.network.nsgs",
        sourceType: "azure.network.nsgs",
        sourceId: `azure-nsgs-${client.subscriptionId}`,
        rawData: {
          totalNsgs: nsgs.length,
          openNsgs: openNsgs.length,
          nsgs: nsgs.map((n) => ({ name: n["name"], location: n["location"], id: n["id"] })),
        },
        severity: openNsgs.length > 0 ? "high" : "info",
        controlMapping: ["CC6.1", "CC6.6", "SC-7", "A.13.1.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[azure] failed to collect NSGs:", err);
    }

    // --- Storage Accounts ---
    try {
      const storageResp = (await azureMgmtFetch(
        client,
        `${subPath}/providers/Microsoft.Storage/storageAccounts`,
        "2023-05-01",
      )) as Record<string, unknown>;
      const accounts = (storageResp["value"] as Array<Record<string, unknown>>) ?? [];
      const insecureAccounts = accounts.filter((a) => {
        const props = a["properties"] as Record<string, unknown>;
        return !props?.["supportsHttpsTrafficOnly"] || !props?.["encryption"];
      });

      results.push({
        title: "Azure Storage Account Security",
        description: `${accounts.length} storage accounts, ${insecureAccounts.length} with potential security issues`,
        manifestKey: "azure.storage.accounts",
        sourceType: "azure.storage.accounts",
        sourceId: `azure-storage-${client.subscriptionId}`,
        rawData: {
          totalAccounts: accounts.length,
          insecureAccounts: insecureAccounts.length,
          accounts: accounts.map((a) => {
            const props = a["properties"] as Record<string, unknown>;
            return {
              name: a["name"],
              location: a["location"],
              httpsOnly: props?.["supportsHttpsTrafficOnly"],
              encryption: !!props?.["encryption"],
            };
          }),
        },
        severity: insecureAccounts.length > 0 ? "high" : "info",
        controlMapping: ["CC6.1", "CC6.7", "SC-28", "A.10.1.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[azure] failed to collect storage accounts:", err);
    }

    // --- Key Vault ---
    try {
      const kvResp = (await azureMgmtFetch(
        client,
        `${subPath}/providers/Microsoft.KeyVault/vaults`,
        "2023-07-01",
      )) as Record<string, unknown>;
      const vaults = (kvResp["value"] as Array<Record<string, unknown>>) ?? [];

      results.push({
        title: "Azure Key Vault Configuration",
        description: `${vaults.length} key vaults configured`,
        manifestKey: "azure.keyvault.config",
        sourceType: "azure.keyvault.config",
        sourceId: `azure-keyvault-${client.subscriptionId}`,
        rawData: {
          totalVaults: vaults.length,
          vaults: vaults.map((v) => {
            const props = v["properties"] as Record<string, unknown>;
            return {
              name: v["name"],
              location: v["location"],
              enableSoftDelete: props?.["enableSoftDelete"],
              enablePurgeProtection: props?.["enablePurgeProtection"],
            };
          }),
        },
        severity: vaults.length === 0 ? "medium" : "info",
        controlMapping: ["CC6.1", "SC-12", "A.10.1.2"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[azure] failed to collect key vaults:", err);
    }

    // --- Policy Compliance ---
    try {
      const policyResp = (await azureMgmtFetch(
        client,
        `${subPath}/providers/Microsoft.PolicyInsights/policyStates/latest/summarize`,
        "2019-10-01",
      )) as Record<string, unknown>;
      const summaries = (policyResp["value"] as Array<Record<string, unknown>>) ?? [];
      const summary = summaries[0] as Record<string, unknown> | undefined;
      const nonCompliantResources =
        (summary?.["results"] as Record<string, unknown>)?.["nonCompliantResources"] ?? 0;

      results.push({
        title: "Azure Policy Compliance",
        description: `${nonCompliantResources} non-compliant resources`,
        manifestKey: "azure.policy.compliance",
        sourceType: "azure.policy.compliance",
        sourceId: `azure-policy-${client.subscriptionId}`,
        rawData: { nonCompliantResources, summary },
        severity: (nonCompliantResources as number) > 0 ? "medium" : "info",
        controlMapping: ["CC7.1", "CA-7", "A.18.2.2"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[azure] failed to collect policy compliance:", err);
    }

    // --- Azure AD Users (via Graph API) ---
    try {
      const graphToken = await client.credential.getToken("https://graph.microsoft.com/.default");
      const usersResp = (await azureGraphFetch(
        graphToken.token,
        "/users?$select=id,displayName,userPrincipalName,accountEnabled,createdDateTime&$top=999",
      )) as Record<string, unknown>;
      const users = (usersResp["value"] as Array<Record<string, unknown>>) ?? [];
      const disabledUsers = users.filter((u) => !u["accountEnabled"]);

      results.push({
        title: "Azure AD Users",
        description: `${users.length} users, ${disabledUsers.length} disabled accounts`,
        manifestKey: "azure.ad.users",
        sourceType: "azure.ad.users",
        sourceId: `azure-ad-users-${client.tenantId}`,
        rawData: {
          totalUsers: users.length,
          disabledUsers: disabledUsers.length,
          users: users.map((u) => ({
            id: u["id"],
            displayName: u["displayName"],
            enabled: u["accountEnabled"],
          })),
        },
        severity: "info",
        controlMapping: ["CC6.1", "CC6.2", "AC-2", "A.9.2.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[azure] failed to collect AD users:", err);
    }

    // --- Activity Log (Diagnostic Settings) ---
    try {
      const diagResp = (await azureMgmtFetch(
        client,
        `${subPath}/providers/Microsoft.Insights/diagnosticSettings`,
        "2021-05-01-preview",
      )) as Record<string, unknown>;
      const settings = (diagResp["value"] as Array<Record<string, unknown>>) ?? [];

      results.push({
        title: "Azure Diagnostic Settings",
        description: `${settings.length} diagnostic settings configured at subscription level`,
        manifestKey: "azure.monitor.diagnostic_settings",
        sourceType: "azure.monitor.diagnostic_settings",
        sourceId: `azure-diag-${client.subscriptionId}`,
        rawData: {
          totalSettings: settings.length,
          settings: settings.map((s) => ({ name: s["name"], id: s["id"] })),
        },
        severity: settings.length === 0 ? "high" : "info",
        controlMapping: ["CC7.2", "AU-2", "AU-6", "A.12.4.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[azure] failed to collect diagnostic settings:", err);
    }

    console.log(`[azure] collected ${results.length} evidence items for org=${options.tenantId}`);
    return results;
  }

  async testConnection(connection: ProviderConnection): Promise<ConnectionTestResult> {
    try {
      const client = connection.client as AzureClient;
      const sub = (await azureMgmtFetch(
        client,
        `/subscriptions/${client.subscriptionId}`,
        "2022-12-01",
      )) as Record<string, unknown>;

      return {
        success: true,
        message: "Successfully authenticated with Microsoft Azure",
        details: {
          subscriptionId: client.subscriptionId,
          displayName: sub["displayName"],
          state: sub["state"],
        },
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to connect to Azure",
      };
    }
  }

  async disconnect(_connection: ProviderConnection): Promise<void> {
    // OAuth tokens managed by Azure Identity SDK
  }

  getRequiredPermissions(): PermissionRequirement[] {
    return [
      {
        resource: "subscription",
        permission: "Reader",
        description: "Read access to subscription resources",
        required: true,
      },
      {
        resource: "network",
        permission: "Microsoft.Network/*/read",
        description: "Read network security groups",
        required: true,
      },
      {
        resource: "storage",
        permission: "Microsoft.Storage/*/read",
        description: "Read storage accounts",
        required: true,
      },
      {
        resource: "keyvault",
        permission: "Microsoft.KeyVault/*/read",
        description: "Read key vault configuration",
        required: true,
      },
      {
        resource: "policy",
        permission: "Microsoft.PolicyInsights/*/read",
        description: "Read policy compliance",
        required: true,
      },
      {
        resource: "graph",
        permission: "User.Read.All",
        description: "Read all Azure AD user profiles",
        required: true,
      },
      {
        resource: "graph",
        permission: "AuditLog.Read.All",
        description: "Read audit and sign-in logs",
        required: false,
      },
    ];
  }
}
