import type { Manifest } from "../types.js";

export const auth0Manifest: Manifest = {
  connector: "auth0",
  version: "1.0.0",
  displayName: "Auth0",
  description:
    "Read-only Auth0 posture: MFA enrolment, connections, rules/actions, tenant security settings, security event logs.",
  iconKey: "auth0",
  category: "identity",
  authType: "oauth2",
  configFields: [
    { key: "domain", label: "Auth0 domain", type: "string", required: true },
    { key: "clientId", label: "M2M client ID", type: "string", required: true },
    { key: "clientSecret", label: "Client secret", type: "secret", required: true },
  ],
  capabilities: [
    {
      key: "auth0.users.mfa",
      title: "User MFA enrolment",
      description: "Sampled MFA enrolment status across users.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.3" },
        { framework: "iso27001", requirement: "A.9.4.2" },
        { framework: "hipaa", requirement: "164.312(d)" },
        { framework: "pci_dss_4", requirement: "8.4.1" },
        { framework: "pci_dss_4", requirement: "8.4.2" },
      ],
    },
    {
      key: "auth0.users.inventory",
      title: "User inventory",
      description: "Tenant user count and identifier metadata.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.9.2.1" },
        { framework: "hipaa", requirement: "164.312(a)(2)(i)" },
        { framework: "pci_dss_4", requirement: "8.2.1" },
      ],
    },
    {
      key: "auth0.connections.inventory",
      title: "Identity connections",
      description: "Configured database / social / enterprise connections.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.9.4.1" },
        { framework: "hipaa", requirement: "164.312(d)" },
      ],
    },
    {
      key: "auth0.rules.inventory",
      title: "Rules inventory",
      description: "Auth0 rules (legacy authorization extensions).",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.9.4.1" },
        { framework: "hipaa", requirement: "164.308(a)(4)(ii)(B)" },
      ],
    },
    {
      key: "auth0.actions.inventory",
      title: "Actions inventory",
      description: "Deployed Auth0 actions.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.9.4.1" },
        { framework: "hipaa", requirement: "164.308(a)(4)(ii)(B)" },
      ],
    },
    {
      key: "auth0.tenant.settings",
      title: "Tenant security settings",
      description: "Tenant-level security flags (clickjack protection, etc.).",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.14.1.2" },
        { framework: "pci_dss_4", requirement: "6.2.4" },
      ],
    },
    {
      key: "auth0.logs.security",
      title: "Security event logs",
      description: "Security-relevant log events (failures, suspicious activity).",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.12.4.1" },
        { framework: "hipaa", requirement: "164.312(b)" },
        { framework: "hipaa", requirement: "164.308(a)(5)(ii)(C)" },
        { framework: "pci_dss_4", requirement: "10.2.1" },
        { framework: "pci_dss_4", requirement: "10.4.1" },
      ],
    },
  ],
};
