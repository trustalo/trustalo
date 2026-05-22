import type { Manifest } from "../types.js";

/**
 * Wazuh connector manifest.
 *
 * Wazuh exposes a wide surface area — every capability declared here
 * corresponds 1:1 with a `sourceType` the provider runtime emits in
 * `apps/collector/src/integrations/providers/wazuh/index.ts`. New
 * sourceTypes must be added here before they will resolve to tenant
 * Controls via the binder.
 */
export const wazuhManifest: Manifest = {
  connector: "wazuh",
  version: "1.0.0",
  displayName: "Wazuh",
  description:
    "Endpoint security, SIEM detections, vulnerability scanning, FIM, malware detection, and compliance rule coverage.",
  iconKey: "wazuh",
  category: "security",
  authType: "api_key",
  configFields: [
    { key: "managerUrl", label: "Wazuh Manager URL", type: "string", required: true },
    { key: "username", label: "Username", type: "string", required: true },
    { key: "password", label: "Password", type: "secret", required: true },
  ],
  capabilities: [
    {
      key: "wazuh.manager.status",
      title: "Manager status",
      description: "Wazuh manager version + connectivity status.",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.1" },
        { framework: "iso27001", requirement: "A.8.16" },
      ],
    },
    {
      key: "wazuh.agents.summary",
      title: "Agent connectivity summary",
      description: "Active / disconnected / never-connected agent counts.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.5.9" },
        { framework: "iso27001", requirement: "A.8.16" },
      ],
    },
    {
      key: "wazuh.agents.inventory",
      title: "Endpoint agent inventory",
      description: "All endpoint agents managed by Wazuh.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.5.9" },
        { framework: "iso27001", requirement: "A.8.9" },
      ],
    },
    {
      key: "wazuh.alerts.summary",
      title: "Alert pipeline health",
      description: "Manager analysisd statistics for alert pipeline.",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.8.15" },
        { framework: "iso27001", requirement: "A.8.16" },
      ],
    },
    {
      key: "wazuh.security.rbac",
      title: "Wazuh RBAC",
      description: "RBAC users, roles, and policies in the Wazuh manager.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.3" },
        { framework: "iso27001", requirement: "A.5.15" },
        { framework: "iso27001", requirement: "A.5.18" },
      ],
    },
    {
      key: "wazuh.mitre.coverage",
      title: "MITRE ATT&CK coverage",
      description: "Mapped MITRE techniques and groups from rules.",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "soc2", requirement: "CC7.3" },
        { framework: "iso27001", requirement: "A.8.16" },
      ],
    },
    {
      key: "wazuh.compliance.coverage",
      title: "Compliance rule coverage",
      description: "Detection rules tagged with compliance frameworks.",
      controlMappings: [
        { framework: "soc2", requirement: "CC2.2" },
        { framework: "iso27001", requirement: "A.5.36" },
      ],
    },
    {
      key: "wazuh.containers.rule_coverage",
      title: "Container detection rule coverage",
      description: "Container/Docker detection rule counts.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC7.1" },
        { framework: "iso27001", requirement: "A.8.9" },
      ],
    },
    {
      key: "wazuh.cloud.rule_coverage",
      title: "Cloud detection rule coverage",
      description: "Cloud-provider detection rule counts.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.1" },
        { framework: "iso27001", requirement: "A.8.9" },
      ],
    },
    {
      key: "wazuh.active_response.configuration",
      title: "Active response configuration",
      description: "Active-response commands configured on the manager.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.4" },
        { framework: "iso27001", requirement: "A.5.24" },
        { framework: "iso27001", requirement: "A.5.26" },
      ],
    },
    {
      key: "wazuh.vulnerabilities",
      title: "Vulnerability findings",
      description: "Vulnerability findings across active agents.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.1" },
        { framework: "iso27001", requirement: "A.8.8" },
      ],
    },
    {
      key: "wazuh.fim.changes",
      title: "File integrity changes",
      description: "File integrity events since the last sync.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.8.32" },
        { framework: "iso27001", requirement: "A.8.15" },
      ],
    },
    {
      key: "wazuh.sca.results",
      title: "SCA policy results",
      description: "Security configuration assessment results.",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.1" },
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.8.9" },
        { framework: "iso27001", requirement: "A.8.8" },
      ],
    },
    {
      key: "wazuh.endpoints.malware",
      title: "Endpoint malware findings",
      description: "Malware / rootcheck findings on sampled agents.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.1" },
        { framework: "iso27001", requirement: "A.8.7" },
      ],
    },
    {
      key: "wazuh.endpoints.inventory",
      title: "Endpoint software inventory",
      description: "Installed-package inventory across endpoints.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC7.1" },
        { framework: "iso27001", requirement: "A.8.9" },
        { framework: "iso27001", requirement: "A.5.9" },
      ],
    },
  ],
};
