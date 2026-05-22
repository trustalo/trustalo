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

interface GCPClient {
  auth: GoogleAuth;
  projectId: string;
}

async function gcpFetch(client: GCPClient, url: string): Promise<unknown> {
  const authClient = await client.auth.getClient();
  const token = await authClient.getAccessToken();
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`GCP API ${resp.status}: ${body}`);
  }
  return resp.json();
}

export class GCPProvider implements IntegrationProvider {
  readonly id = "gcp";
  readonly name = "Google Cloud Platform";
  readonly description =
    "Collect evidence from GCP including IAM, Cloud Audit Logs, Compute, and Cloud Storage";
  readonly version = "1.0.0";
  readonly category = "cloud" as const;
  readonly authType = "api_key" as const;
  readonly capabilities = ["iam", "audit_logs", "compute", "storage", "networking", "kms"];
  readonly configSchema: CredentialField[] = [
    {
      key: "projectId",
      label: "Project ID",
      type: "text",
      required: true,
      placeholder: "my-project-id",
    },
    {
      key: "serviceAccountKey",
      label: "Service Account Key (JSON)",
      type: "textarea",
      required: true,
      sensitive: true,
      description: "Paste the full JSON key file content",
    },
  ];

  async connect(credentials: DecryptedCredentials): Promise<ProviderConnection> {
    const keyData = JSON.parse(credentials["serviceAccountKey"]!);
    const auth = new GoogleAuth({
      credentials: keyData,
      scopes: [
        "https://www.googleapis.com/auth/cloud-platform.read-only",
        "https://www.googleapis.com/auth/iam",
        "https://www.googleapis.com/auth/logging.read",
      ],
    });

    const projectId = credentials["projectId"] ?? keyData.project_id;
    const client: GCPClient = { auth, projectId };

    return { id: `gcp-${Date.now()}`, integration: this.id, client };
  }

  async collectEvidence(
    connection: ProviderConnection,
    options: CollectOptions,
  ): Promise<EvidenceResult[]> {
    const client = connection.client as GCPClient;
    const results: EvidenceResult[] = [];
    const now = new Date();
    const base = "https://cloudresourcemanager.googleapis.com/v1";
    const computeBase = "https://compute.googleapis.com/compute/v1";
    const iamBase = "https://iam.googleapis.com/v1";
    const storageBase = "https://storage.googleapis.com/storage/v1";

    // --- IAM Policy ---
    try {
      const policy = (await gcpFetch(
        client,
        `${base}/projects/${client.projectId}:getIamPolicy`,
      )) as Record<string, unknown>;
      const bindings = (policy["bindings"] as Array<{ role: string; members: string[] }>) ?? [];
      const totalMembers = new Set(bindings.flatMap((b) => b.members)).size;
      const adminBindings = bindings.filter(
        (b) => b.role.includes("admin") || b.role.includes("owner"),
      );

      results.push({
        title: "GCP IAM Policy",
        description: `${totalMembers} unique members across ${bindings.length} role bindings, ${adminBindings.length} admin/owner roles`,
        manifestKey: "gcp.iam.policy",
        sourceType: "gcp.iam.policy",
        sourceId: `gcp-iam-policy-${client.projectId}`,
        rawData: {
          totalMembers,
          totalBindings: bindings.length,
          adminBindings: adminBindings.length,
          bindings,
        },
        severity: adminBindings.length > 5 ? "medium" : "info",
        controlMapping: ["CC6.1", "CC6.3", "AC-2", "A.9.2.3"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[gcp] failed to collect IAM policy:", err);
    }

    // --- Service Accounts ---
    try {
      const saResp = (await gcpFetch(
        client,
        `${iamBase}/projects/${client.projectId}/serviceAccounts`,
      )) as Record<string, unknown>;
      const accounts = (saResp["accounts"] as Array<Record<string, unknown>>) ?? [];

      results.push({
        title: "GCP Service Accounts",
        description: `${accounts.length} service accounts found`,
        manifestKey: "gcp.iam.service_accounts",
        sourceType: "gcp.iam.service_accounts",
        sourceId: `gcp-sa-${client.projectId}`,
        rawData: {
          totalAccounts: accounts.length,
          accounts: accounts.map((a) => ({
            email: a["email"],
            displayName: a["displayName"],
            disabled: a["disabled"],
          })),
        },
        severity: "info",
        controlMapping: ["CC6.1", "AC-2", "A.9.2.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[gcp] failed to collect service accounts:", err);
    }

    // --- Compute Instances ---
    try {
      const instancesResp = (await gcpFetch(
        client,
        `${computeBase}/projects/${client.projectId}/aggregated/instances`,
      )) as Record<string, unknown>;
      const items =
        (instancesResp["items"] as Record<
          string,
          { instances?: Array<Record<string, unknown>> }
        >) ?? {};
      const allInstances: Array<Record<string, unknown>> = [];
      for (const zone of Object.values(items)) {
        if (zone.instances) allInstances.push(...zone.instances);
      }

      const publicInstances = allInstances.filter((inst) => {
        const nics =
          (inst["networkInterfaces"] as Array<{
            accessConfigs?: Array<Record<string, unknown>>;
          }>) ?? [];
        return nics.some((nic) => nic.accessConfigs?.some((ac) => ac["natIP"]));
      });

      results.push({
        title: "GCP Compute Instances",
        description: `${allInstances.length} instances, ${publicInstances.length} with external IPs`,
        manifestKey: "gcp.compute.instances",
        sourceType: "gcp.compute.instances",
        sourceId: `gcp-compute-${client.projectId}`,
        rawData: {
          totalInstances: allInstances.length,
          publicInstances: publicInstances.length,
          instances: allInstances.map((i) => ({
            name: i["name"],
            zone: i["zone"],
            status: i["status"],
          })),
        },
        severity: publicInstances.length > 0 ? "medium" : "info",
        controlMapping: ["CC6.1", "CC6.6", "SC-7", "A.13.1.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[gcp] failed to collect compute instances:", err);
    }

    // --- Firewall Rules ---
    try {
      const fwResp = (await gcpFetch(
        client,
        `${computeBase}/projects/${client.projectId}/global/firewalls`,
      )) as Record<string, unknown>;
      const rules = (fwResp["items"] as Array<Record<string, unknown>>) ?? [];
      const openRules = rules.filter((r) => {
        const ranges = (r["sourceRanges"] as string[]) ?? [];
        return ranges.includes("0.0.0.0/0") && r["direction"] === "INGRESS";
      });

      results.push({
        title: "GCP Firewall Rules",
        description: `${rules.length} firewall rules, ${openRules.length} with unrestricted ingress (0.0.0.0/0)`,
        manifestKey: "gcp.compute.firewall_rules",
        sourceType: "gcp.compute.firewall_rules",
        sourceId: `gcp-firewall-${client.projectId}`,
        rawData: {
          totalRules: rules.length,
          openRules: openRules.length,
          rules: openRules.map((r) => ({
            name: r["name"],
            direction: r["direction"],
            allowed: r["allowed"],
          })),
        },
        severity: openRules.length > 0 ? "high" : "info",
        controlMapping: ["CC6.1", "CC6.6", "SC-7", "A.13.1.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[gcp] failed to collect firewall rules:", err);
    }

    // --- Cloud Storage Buckets ---
    try {
      const bucketsResp = (await gcpFetch(
        client,
        `${storageBase}/b?project=${client.projectId}`,
      )) as Record<string, unknown>;
      const buckets = (bucketsResp["items"] as Array<Record<string, unknown>>) ?? [];
      const publicBuckets = buckets.filter((b) => {
        const iamConfig = b["iamConfiguration"] as Record<string, unknown> | undefined;
        return iamConfig?.["publicAccessPrevention"] !== "enforced";
      });

      results.push({
        title: "GCP Cloud Storage Security",
        description: `${buckets.length} buckets, ${publicBuckets.length} without public access prevention enforced`,
        manifestKey: "gcp.storage.security",
        sourceType: "gcp.storage.security",
        sourceId: `gcp-storage-${client.projectId}`,
        rawData: {
          totalBuckets: buckets.length,
          publicBuckets: publicBuckets.length,
          buckets: buckets.map((b) => ({
            name: b["name"],
            location: b["location"],
            storageClass: b["storageClass"],
          })),
        },
        severity: publicBuckets.length > 0 ? "medium" : "info",
        controlMapping: ["CC6.1", "CC6.7", "SC-28", "A.10.1.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[gcp] failed to collect storage buckets:", err);
    }

    // --- Audit Logging ---
    try {
      const projectResp = (await gcpFetch(
        client,
        `${base}/projects/${client.projectId}`,
      )) as Record<string, unknown>;
      const auditConfigs = (projectResp["auditConfigs"] as Array<Record<string, unknown>>) ?? [];

      results.push({
        title: "GCP Audit Logging Configuration",
        description: `${auditConfigs.length} audit log configurations found`,
        manifestKey: "gcp.logging.audit_config",
        sourceType: "gcp.logging.audit_config",
        sourceId: `gcp-audit-${client.projectId}`,
        rawData: { totalConfigs: auditConfigs.length, configs: auditConfigs },
        severity: auditConfigs.length === 0 ? "high" : "info",
        controlMapping: ["CC7.2", "AU-2", "AU-3", "A.12.4.1"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[gcp] failed to collect audit logging:", err);
    }

    console.log(`[gcp] collected ${results.length} evidence items for org=${options.tenantId}`);
    return results;
  }

  async testConnection(connection: ProviderConnection): Promise<ConnectionTestResult> {
    try {
      const client = connection.client as GCPClient;
      const project = (await gcpFetch(
        client,
        `https://cloudresourcemanager.googleapis.com/v1/projects/${client.projectId}`,
      )) as Record<string, unknown>;

      return {
        success: true,
        message: "Successfully authenticated with Google Cloud Platform",
        details: {
          projectId: client.projectId,
          projectName: project["name"],
          projectNumber: project["projectNumber"],
        },
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to connect to GCP",
      };
    }
  }

  async disconnect(_connection: ProviderConnection): Promise<void> {
    // Service account tokens expire naturally
  }

  getRequiredPermissions(): PermissionRequirement[] {
    return [
      {
        resource: "project",
        permission: "resourcemanager.projects.get",
        description: "View project details",
        required: true,
      },
      {
        resource: "project",
        permission: "resourcemanager.projects.getIamPolicy",
        description: "View project IAM policy",
        required: true,
      },
      {
        resource: "iam",
        permission: "iam.serviceAccounts.list",
        description: "List service accounts",
        required: true,
      },
      {
        resource: "compute",
        permission: "compute.instances.list",
        description: "List compute instances",
        required: true,
      },
      {
        resource: "compute",
        permission: "compute.firewalls.list",
        description: "List firewall rules",
        required: true,
      },
      {
        resource: "storage",
        permission: "storage.buckets.list",
        description: "List storage buckets",
        required: true,
      },
      {
        resource: "logging",
        permission: "logging.logEntries.list",
        description: "Read audit logs",
        required: true,
      },
    ];
  }
}
