import type { Manifest } from "../types.js";

/**
 * Azure connector manifest.
 *
 * The Azure provider class lives in `apps/collector/src/integrations/providers/azure`.
 * Its outputs are declared here as `capabilities` so the binder can
 * resolve them through the same FrameworkRef → tenant Control pipeline
 * as manifest checks. Capability keys mirror the `sourceType` values
 * the provider emits to keep the runtime → manifest lookup direct.
 */
export const azureManifest: Manifest = {
  connector: "azure",
  version: "1.0.0",
  displayName: "Microsoft Azure",
  description:
    "Read-only Azure posture: AD users, NSG rules, storage encryption, Key Vault, Policy compliance, diagnostic settings.",
  iconKey: "azure",
  category: "cloud",
  authType: "oauth2",
  configFields: [
    { key: "tenantId", label: "Tenant (Directory) ID", type: "string", required: true },
    { key: "clientId", label: "Application (Client) ID", type: "string", required: true },
    { key: "clientSecret", label: "Client Secret", type: "secret", required: true },
    { key: "subscriptionId", label: "Subscription ID", type: "string", required: true },
  ],
  capabilities: [
    {
      key: "azure.network.nsgs",
      title: "Network Security Group inventory",
      description: "NSGs with their inbound rules; flags unrestricted ingress.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.6" },
        { framework: "iso27001", requirement: "A.13.1.1" },
      ],
    },
    {
      key: "azure.storage.accounts",
      title: "Storage account security",
      description: "Storage accounts with encryption + public-access posture.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.7" },
        { framework: "iso27001", requirement: "A.10.1.1" },
      ],
    },
    {
      key: "azure.keyvault.config",
      title: "Key Vault inventory",
      description: "Key Vaults configured in the subscription.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.10.1.2" },
      ],
    },
    {
      key: "azure.policy.compliance",
      title: "Azure Policy compliance",
      description: "Non-compliant resource counts from Policy state.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.1" },
        { framework: "iso27001", requirement: "A.18.2.2" },
      ],
    },
    {
      key: "azure.ad.users",
      title: "Azure AD user directory",
      description: "Directory users with enabled/disabled status.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.9.2.1" },
      ],
    },
    {
      key: "azure.monitor.diagnostic_settings",
      title: "Diagnostic settings",
      description: "Subscription-level diagnostic settings for activity logs.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.12.4.1" },
      ],
    },
  ],
};
