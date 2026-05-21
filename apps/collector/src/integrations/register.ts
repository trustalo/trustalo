import { providerRegistry } from "./core/registry.js";

// --- Cloud / PaaS ---
import { AWSProvider } from "./providers/aws/index.js";
import { GCPProvider } from "./providers/gcp/index.js";
import { AzureProvider } from "./providers/azure/index.js";

// --- Identity / AaaS ---
import { OktaProvider } from "./providers/okta/index.js";
import { Auth0Provider } from "./providers/auth0/index.js";

// --- Source Code ---
import { GitHubProvider } from "./providers/github/index.js";
import { BitbucketProvider } from "./providers/bitbucket/index.js";

// --- Email / Productivity ---
import { GoogleWorkspaceProvider } from "./providers/google-workspace/index.js";
import { Office365Provider } from "./providers/office365/index.js";
import { WazuhProvider } from "./providers/wazuh/index.js";

// ────────────────────────────────────────────────
// Future categories — add new providers here:
//
// --- Security ---
//   e.g. CrowdStrike, Snyk, SonarQube, Qualys
//
// --- HR ---
//   e.g. BambooHR, Gusto, Rippling
//
// --- Ticketing / Project Management ---
//   e.g. Jira, Linear, Asana
//
// --- Communication ---
//   e.g. Slack, Microsoft Teams
//
// --- Monitoring / Observability ---
//   e.g. Datadog, PagerDuty, Splunk
//
// --- MDM / Endpoint ---
//   e.g. Jamf, Kandji, Intune
// ────────────────────────────────────────────────

export function registerAllProviders(): void {
  // Cloud / PaaS
  providerRegistry.register("aws", new AWSProvider());
  providerRegistry.register("gcp", new GCPProvider());
  providerRegistry.register("azure", new AzureProvider());

  // Identity / AaaS
  providerRegistry.register("okta", new OktaProvider());
  providerRegistry.register("auth0", new Auth0Provider());

  // Source Code
  providerRegistry.register("github", new GitHubProvider());
  providerRegistry.register("bitbucket", new BitbucketProvider());

  // Email / Productivity
  providerRegistry.register("google-workspace", new GoogleWorkspaceProvider());
  providerRegistry.register("office365", new Office365Provider());

  // Security
  providerRegistry.register("wazuh", new WazuhProvider());

  console.log(`[registry] ${providerRegistry.size} providers registered`);
}
