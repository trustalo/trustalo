/**
 * ==========================================================
 *  INTEGRATION PROVIDER TEMPLATE
 * ==========================================================
 *
 *  How to add a new integration provider:
 *
 *  1. Copy this entire directory to a new folder under
 *     src/integrations/providers/<your-slug>/
 *
 *  2. Rename the class (e.g. TemplateProvider → JiraProvider)
 *
 *  3. Set the readonly properties:
 *     - id:           unique slug matching the DB record (e.g. "jira")
 *     - name:         human-readable display name
 *     - description:  what evidence this provider collects
 *     - version:      semver of this provider implementation
 *     - category:     one of "cloud" | "identity" | "code_repository" | "productivity" | "security" | "hr" | "custom"
 *     - authType:     one of "oauth2" | "api_key" | "iam_role"
 *     - capabilities: list of evidence domains this provider can collect
 *     - configSchema: credential fields the UI should render
 *
 *  4. Implement each method:
 *     - connect()              → create an authenticated client
 *     - collectEvidence()      → call provider APIs and return EvidenceResult[]
 *     - testConnection()       → lightweight health check
 *     - disconnect()           → clean up sessions/tokens
 *     - getRequiredPermissions() → document what scopes/roles are needed
 *
 *  5. Register in src/integrations/register.ts:
 *
 *       import { JiraProvider } from "./providers/jira/index.js";
 *       providerRegistry.register("jira", new JiraProvider());
 *
 *  6. Add a seed entry in src/seed/providers.ts so the DB can discover it.
 *
 *  7. Install any SDK dependencies in package.json.
 * ==========================================================
 */

import type {
  IntegrationProvider,
  DecryptedCredentials,
  ProviderConnection,
  CollectOptions,
  EvidenceResult,
  ConnectionTestResult,
  PermissionRequirement,
  CredentialField,
  ProviderCategory,
} from "../../core/types.js";

export class TemplateProvider implements IntegrationProvider {
  readonly id = "template";
  readonly name = "Template Provider";
  readonly description = "Describe what evidence this provider collects";
  readonly version = "0.1.0";
  readonly category: ProviderCategory = "custom";
  readonly authType = "api_key" as const;
  readonly capabilities = ["example_capability"];
  readonly configSchema: CredentialField[] = [
    {
      key: "apiKey",
      label: "API Key",
      type: "password",
      required: true,
      sensitive: true,
      description: "Your provider API key",
    },
  ];

  async connect(credentials: DecryptedCredentials): Promise<ProviderConnection> {
    return {
      id: `${this.id}-${Date.now()}`,
      integration: this.id,
      client: { apiKey: credentials["apiKey"] },
    };
  }

  async collectEvidence(
    _connection: ProviderConnection,
    options: CollectOptions,
  ): Promise<EvidenceResult[]> {
    const results: EvidenceResult[] = [];

    // For each capability, call the relevant API and map responses
    // to EvidenceResult objects:
    //
    // results.push({
    //   title: "MFA enabled for all users",
    //   description: "All 42 users have MFA enabled",
    //   sourceType: "template.users.mfa",
    //   sourceId: "unique-id-from-provider",
    //   rawData: { /* raw API response */ },
    //   severity: "info",
    //   controlMapping: ["CC6.1", "IA-2"],
    //   collectedAt: new Date(),
    // });

    console.log(`[${this.id}] collecting evidence for org=${options.tenantId}`);
    return results;
  }

  async testConnection(connection: ProviderConnection): Promise<ConnectionTestResult> {
    try {
      return {
        success: true,
        message: `Successfully connected to ${this.name}`,
        details: { connectionId: connection.id },
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Connection test failed",
      };
    }
  }

  async disconnect(_connection: ProviderConnection): Promise<void> {
    // Revoke tokens, close sessions, etc.
  }

  getRequiredPermissions(): PermissionRequirement[] {
    return [
      {
        resource: "api",
        permission: "read",
        description: "Read access to the provider API",
        required: true,
      },
    ];
  }
}
