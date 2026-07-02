// Seeds the `Integration` catalog in the collector database.
//
// One row per supported connector. The row id is the connector slug —
// human-readable and stable, so foreign keys (`IntegrationConnection.
// integrationId`) and HTTP routes can address an integration by name
// without an extra lookup.
//
// Run via `bun run db:seed` from `apps/collector`.

import { PrismaClient } from "../../generated/prisma/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.COLLECTOR_DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type AuthType = "oauth2" | "api_key" | "iam_role";
type IntegrationCategory =
  | "cloud"
  | "identity"
  | "code_repository"
  | "productivity"
  | "security"
  | "hr"
  | "ai"
  | "custom";

interface IntegrationSeed {
  /** Slug-as-PK; lower-case, stable across releases. */
  id: string;
  name: string;
  description: string;
  authType: AuthType;
  category: IntegrationCategory;
  capabilities: string[];
  configSchema: object;
}

const integrations: IntegrationSeed[] = [
  // ─── Cloud / PaaS ────────────────────────────────────
  {
    id: "aws",
    name: "Amazon Web Services",
    description: "Collect evidence from AWS including IAM, CloudTrail, S3, VPC, and Security Hub",
    authType: "iam_role",
    category: "cloud",
    capabilities: ["iam", "cloudtrail", "s3", "vpc", "security_groups"],
    configSchema: {
      fields: [
        {
          key: "roleArn",
          label: "IAM Role ARN",
          type: "text",
          required: true,
          placeholder: "arn:aws:iam::123456789012:role/TrustaloCollector",
        },
        { key: "externalId", label: "External ID", type: "text", required: true },
        { key: "region", label: "Region", type: "text", required: false, default: "us-east-1" },
      ],
    },
  },
  {
    id: "gcp",
    name: "Google Cloud Platform",
    description:
      "Collect evidence from GCP including IAM, Cloud Audit Logs, Compute, and Cloud Storage",
    authType: "api_key",
    category: "cloud",
    capabilities: ["iam", "audit_logs", "compute", "storage", "networking", "kms"],
    configSchema: {
      fields: [
        { key: "projectId", label: "Project ID", type: "text", required: true },
        {
          key: "serviceAccountKey",
          label: "Service Account Key (JSON)",
          type: "textarea",
          required: true,
          sensitive: true,
        },
      ],
    },
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    description:
      "Collect evidence from Azure including AD, Network Security Groups, Storage, and Key Vault",
    authType: "oauth2",
    category: "cloud",
    capabilities: [
      "ad_users",
      "network_security",
      "storage",
      "key_vault",
      "activity_logs",
      "policy_compliance",
    ],
    configSchema: {
      fields: [
        { key: "azureTenantId", label: "Tenant (Directory) ID", type: "text", required: true },
        { key: "clientId", label: "Application (Client) ID", type: "text", required: true },
        {
          key: "clientSecret",
          label: "Client Secret",
          type: "password",
          required: true,
          sensitive: true,
        },
        { key: "subscriptionId", label: "Subscription ID", type: "text", required: true },
      ],
    },
  },

  // ─── Identity / AaaS ─────────────────────────────────
  {
    id: "okta",
    name: "Okta",
    description:
      "Collect evidence from Okta including users, MFA enrollment, policies, and system logs",
    authType: "api_key",
    category: "identity",
    capabilities: ["users", "mfa", "policies", "groups", "admin_roles", "system_log"],
    configSchema: {
      fields: [
        {
          key: "domain",
          label: "Okta Domain",
          type: "text",
          required: true,
          placeholder: "your-org.okta.com",
        },
        { key: "apiToken", label: "API Token", type: "password", required: true, sensitive: true },
      ],
    },
  },
  {
    id: "auth0",
    name: "Auth0",
    description:
      "Collect evidence from Auth0 including users, MFA, connections, rules, and security settings",
    authType: "oauth2",
    category: "identity",
    capabilities: ["users", "mfa", "connections", "rules_actions", "logs", "branding"],
    configSchema: {
      fields: [
        {
          key: "domain",
          label: "Auth0 Domain",
          type: "text",
          required: true,
          placeholder: "your-tenant.auth0.com",
        },
        { key: "clientId", label: "Client ID (M2M Application)", type: "text", required: true },
        {
          key: "clientSecret",
          label: "Client Secret",
          type: "password",
          required: true,
          sensitive: true,
        },
      ],
    },
  },

  // ─── Source Code ──────────────────────────────────────
  {
    id: "github",
    name: "GitHub",
    description:
      "Collect evidence from GitHub including org members, branch protection, Dependabot, and code scanning",
    authType: "oauth2",
    category: "code_repository",
    capabilities: [
      "org_members",
      "branch_protection",
      "dependabot",
      "code_scanning",
      "secret_scanning",
      "repo_visibility",
    ],
    configSchema: {
      fields: [
        {
          key: "accessToken",
          label: "Personal Access Token / GitHub App Token",
          type: "password",
          required: true,
          sensitive: true,
        },
        { key: "organization", label: "Organization", type: "text", required: true },
      ],
    },
  },
  {
    id: "bitbucket",
    name: "Bitbucket",
    description:
      "Read-only security posture: workspace access, repo visibility, branch restrictions, merge gates (OAuth 2.0 or app password).",
    authType: "oauth2",
    category: "code_repository",
    capabilities: ["access_review", "branch_protection", "merge_controls", "repository_visibility"],
    configSchema: {
      fields: [
        {
          key: "authMethod",
          label: "Authentication",
          type: "select",
          required: true,
          default: "oauth2",
          options: [
            { value: "oauth2", label: "OAuth 2.0 (access token)" },
            { value: "app_password", label: "App password (username + password)" },
          ],
        },
        { key: "workspace", label: "Workspace slug", type: "text", required: true },
        {
          key: "accessToken",
          label: "Access token",
          type: "password",
          required: true,
          sensitive: true,
        },
        { key: "username", label: "Bitbucket username", type: "text", required: false },
        {
          key: "refreshToken",
          label: "Refresh token (optional)",
          type: "password",
          required: false,
          sensitive: true,
        },
      ],
    },
  },

  // ─── Email / Productivity ─────────────────────────────
  {
    id: "google-workspace",
    name: "Google Workspace",
    description:
      "Collect evidence from Google Workspace including users, 2SV, Drive sharing, and admin activity",
    authType: "api_key",
    category: "productivity",
    capabilities: [
      "users",
      "2sv_status",
      "groups",
      "drive_sharing",
      "oauth_apps",
      "admin_activity",
    ],
    configSchema: {
      fields: [
        {
          key: "serviceAccountKey",
          label: "Service Account Key (JSON)",
          type: "textarea",
          required: true,
          sensitive: true,
        },
        { key: "adminEmail", label: "Super Admin Email", type: "text", required: true },
        { key: "domain", label: "Workspace Domain", type: "text", required: true },
      ],
    },
  },
  {
    id: "office365",
    name: "Microsoft Office 365",
    description:
      "Collect evidence from Office 365 including users, MFA, conditional access, DLP, and audit logs",
    authType: "oauth2",
    category: "productivity",
    capabilities: [
      "users_groups",
      "mfa_status",
      "conditional_access",
      "dlp_policies",
      "audit_logs",
      "secure_score",
    ],
    configSchema: {
      fields: [
        { key: "azureTenantId", label: "Tenant (Directory) ID", type: "text", required: true },
        { key: "clientId", label: "Application (Client) ID", type: "text", required: true },
        {
          key: "clientSecret",
          label: "Client Secret",
          type: "password",
          required: true,
          sensitive: true,
        },
      ],
    },
  },
  {
    id: "wazuh",
    name: "Wazuh",
    description:
      "Collect evidence from Wazuh for endpoint security, SIEM detections, cloud workload posture, and control coverage",
    authType: "api_key",
    category: "security",
    capabilities: [
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
    ],
    configSchema: {
      fields: [
        {
          key: "managerUrl",
          label: "Wazuh Manager URL",
          type: "text",
          required: true,
          placeholder: "https://wazuh.example.com:55000",
        },
        {
          key: "username",
          label: "Username",
          type: "text",
          required: true,
        },
        {
          key: "password",
          label: "Password",
          type: "password",
          required: true,
          sensitive: true,
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
        },
      ],
    },
  },

  // ─── AI providers ────────────────────────────────────
  // Stored in the collector catalog so the SecretVault can hold AI keys
  // alongside other tenant-owned secrets. The runtime AI clients in
  // `@trustalo/ai` resolve the active integration via the per-feature /
  // per-tenant precedence chain.
  {
    id: "openai",
    name: "OpenAI",
    description: "Direct OpenAI Chat Completions and Responses APIs.",
    authType: "api_key",
    category: "ai",
    capabilities: ["chat", "embeddings", "moderations"],
    configSchema: {
      fields: [
        { key: "apiKey", label: "API key", type: "password", required: true, sensitive: true },
        { key: "baseUrl", label: "Base URL (optional)", type: "text", required: false },
        { key: "model", label: "Default model", type: "text", required: false },
      ],
    },
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude API (Messages endpoint).",
    authType: "api_key",
    category: "ai",
    capabilities: ["chat", "tool_use"],
    configSchema: {
      fields: [
        { key: "apiKey", label: "API key", type: "password", required: true, sensitive: true },
        { key: "baseUrl", label: "Base URL (optional)", type: "text", required: false },
        { key: "model", label: "Default model", type: "text", required: false },
      ],
    },
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "OpenRouter unified inference proxy (Claude, GPT, Llama, etc.).",
    authType: "api_key",
    category: "ai",
    capabilities: ["chat"],
    configSchema: {
      fields: [
        { key: "apiKey", label: "API key", type: "password", required: true, sensitive: true },
        { key: "model", label: "Default model", type: "text", required: false },
      ],
    },
  },
  {
    id: "bedrock",
    name: "Amazon Bedrock",
    description: "AWS-hosted foundation models (Claude, Llama, Titan).",
    authType: "iam_role",
    category: "ai",
    capabilities: ["chat"],
    configSchema: {
      fields: [
        {
          key: "region",
          label: "AWS region",
          type: "text",
          required: true,
          default: "us-east-1",
        },
        { key: "accessKeyId", label: "Access key ID", type: "text", required: false },
        {
          key: "secretAccessKey",
          label: "Secret access key",
          type: "password",
          required: false,
          sensitive: true,
        },
        { key: "model", label: "Default model id", type: "text", required: false },
      ],
    },
  },
];

async function seed() {
  console.log("[seed] seeding integrations catalog…\n");

  for (const integration of integrations) {
    await prisma.integration.upsert({
      where: { id: integration.id },
      update: {
        name: integration.name,
        description: integration.description,
        authType: integration.authType,
        category: integration.category,
        capabilities: integration.capabilities,
        configSchema: integration.configSchema,
        isActive: true,
      },
      create: {
        id: integration.id,
        name: integration.name,
        description: integration.description,
        authType: integration.authType,
        category: integration.category,
        capabilities: integration.capabilities,
        configSchema: integration.configSchema,
        isActive: true,
      },
    });
    console.log(`  ✓ ${integration.id} (${integration.category})`);
  }

  // Synthetic catalog row that owns custom ("from prompt") HTTP checks.
  // `isActive: false` on purpose: the row must exist for
  // IntegrationConnection/IntegrationCheck FKs, but it is not
  // connectable and must not surface in the public /providers catalog
  // (which filters on `isActive`). The collector also lazily upserts
  // this row on first save (`ensureCustomConnection`), so seeding it is
  // a dev-ergonomics nicety, not a hard requirement.
  await prisma.integration.upsert({
    where: { id: "custom" },
    update: { isActive: false },
    create: {
      id: "custom",
      name: "Custom checks",
      description:
        "Synthetic integration that owns AI-authored and hand-written HTTP checks. Not connectable from the catalog.",
      authType: "api_key",
      category: "custom",
      capabilities: ["http_check"],
      configSchema: { fields: [] },
      isActive: false,
    },
  });
  console.log("  ✓ custom (custom, hidden)");

  console.log(`\n[seed] done — ${integrations.length + 1} integrations seeded`);
}

seed()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
