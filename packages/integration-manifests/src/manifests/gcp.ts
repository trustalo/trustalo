import type { Manifest } from "../types.js";

export const gcpManifest: Manifest = {
  connector: "gcp",
  version: "1.0.0",
  displayName: "Google Cloud Platform",
  description:
    "Read-only GCP posture: IAM policy, service accounts, compute instances, firewall rules, storage and audit logs.",
  iconKey: "gcp",
  category: "cloud",
  authType: "service_account",
  configFields: [
    { key: "projectId", label: "Project ID", type: "string", required: true },
    {
      key: "serviceAccountKey",
      label: "Service Account Key (JSON)",
      type: "secret",
      required: true,
    },
  ],
  capabilities: [
    {
      key: "gcp.iam.policy",
      title: "Project IAM policy",
      description: "Role bindings, member counts, and admin/owner role assignments.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.3" },
        { framework: "iso27001", requirement: "A.9.2.3" },
        { framework: "hipaa", requirement: "164.308(a)(4)(ii)(B)" },
        { framework: "hipaa", requirement: "164.308(a)(4)(ii)(C)" },
        { framework: "pci_dss_4", requirement: "7.2.1" },
        { framework: "pci_dss_4", requirement: "7.2.2" },
      ],
    },
    {
      key: "gcp.iam.service_accounts",
      title: "Service account inventory",
      description: "All service accounts in the project.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.9.2.1" },
        { framework: "hipaa", requirement: "164.308(a)(4)(ii)(B)" },
        { framework: "pci_dss_4", requirement: "7.2.5" },
      ],
    },
    {
      key: "gcp.compute.instances",
      title: "Compute instances",
      description: "Compute instances; flags those with external IPs.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.6" },
        { framework: "iso27001", requirement: "A.13.1.1" },
        { framework: "pci_dss_4", requirement: "1.4.1" },
      ],
    },
    {
      key: "gcp.compute.firewall_rules",
      title: "Firewall rules",
      description: "Firewall rules with unrestricted ingress (0.0.0.0/0) flagged.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.6" },
        { framework: "iso27001", requirement: "A.13.1.1" },
        { framework: "pci_dss_4", requirement: "1.3.1" },
        { framework: "pci_dss_4", requirement: "1.4.1" },
      ],
    },
    {
      key: "gcp.storage.security",
      title: "Cloud Storage security",
      description: "Buckets without public access prevention enforced.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.7" },
        { framework: "iso27001", requirement: "A.10.1.1" },
        { framework: "pci_dss_4", requirement: "1.4.1" },
      ],
    },
    {
      key: "gcp.logging.audit_config",
      title: "Audit logging configuration",
      description: "Project audit log configurations.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.12.4.1" },
        { framework: "hipaa", requirement: "164.312(b)" },
        { framework: "hipaa", requirement: "164.308(a)(1)(ii)(D)" },
        { framework: "pci_dss_4", requirement: "10.2.1" },
      ],
    },
  ],
};
