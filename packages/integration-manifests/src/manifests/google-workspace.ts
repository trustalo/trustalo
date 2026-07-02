import type { Manifest } from "../types.js";

export const googleWorkspaceManifest: Manifest = {
  // Matches `Integration.id` in the collector seed; also the slug the
  // provider runtime class registers under in `register.ts`.
  connector: "google-workspace",
  version: "1.0.0",
  displayName: "Google Workspace",
  description:
    "Checks domain-wide password policy, 2-step verification enforcement, and admin audit logging.",
  iconKey: "google_workspace",
  category: "identity",
  authType: "service_account",
  configFields: [
    {
      key: "customerId",
      label: "Customer ID",
      type: "string",
      required: true,
      helpText: "Found under Admin Console → Account → Account settings.",
    },
    {
      key: "delegatedAdmin",
      label: "Delegated admin email",
      type: "string",
      required: true,
    },
    {
      key: "serviceAccountKey",
      label: "Service account JSON key",
      type: "secret",
      required: true,
    },
  ],
  checks: [
    {
      key: "google.users.two_step_enforced",
      title: "All admin users have 2-Step Verification enabled",
      description: "Lists users with role-assignments and confirms `isEnforcedIn2Sv` is true.",
      severity: "critical",
      runner: "oauth_api",
      params: { api: "directory.users.list" },
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "essential8", requirement: "ML2-MFA" },
        { framework: "hipaa", requirement: "164.312(d)" },
        { framework: "pci_dss_4", requirement: "8.4.1" },
        { framework: "pci_dss_4", requirement: "8.4.2" },
      ],
    },
    {
      key: "google.password_policy.min_length",
      title: "Password policy enforces ≥ 12 characters",
      description: "Domain-wide setting `passwordMinLength` is at least 12.",
      severity: "high",
      runner: "oauth_api",
      params: { api: "admin.security.passwordSettings" },
      controlMappings: [
        { framework: "iso27001", requirement: "A.5.17" },
        { framework: "hipaa", requirement: "164.308(a)(5)(ii)(D)" },
        { framework: "pci_dss_4", requirement: "8.3.6" },
      ],
    },
    {
      key: "google.audit.admin_logging_enabled",
      title: "Admin audit logging is retained ≥ 6 months",
      description: "Reports API confirms admin events are accessible.",
      severity: "medium",
      runner: "oauth_api",
      params: { api: "reports.activities.admin" },
      controlMappings: [
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.8.15" },
        { framework: "hipaa", requirement: "164.312(b)" },
        { framework: "hipaa", requirement: "164.308(a)(1)(ii)(D)" },
        { framework: "pci_dss_4", requirement: "10.2.1" },
        { framework: "pci_dss_4", requirement: "10.5.1" },
      ],
    },
  ],
  capabilities: [
    {
      key: "google_workspace.users.2sv",
      title: "User 2-Step Verification status",
      description: "Per-user 2SV enrolment and suspension status.",
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
      key: "google_workspace.users.inventory",
      title: "User directory inventory",
      description: "Full list of users with role + last-login metadata.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.9.2.1" },
        { framework: "hipaa", requirement: "164.312(a)(2)(i)" },
        { framework: "pci_dss_4", requirement: "8.2.1" },
      ],
    },
    {
      key: "google_workspace.groups.inventory",
      title: "Group inventory",
      description: "Domain groups with membership counts for access reviews.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.9.2.3" },
        { framework: "hipaa", requirement: "164.308(a)(4)(ii)(C)" },
        { framework: "pci_dss_4", requirement: "7.2.1" },
        { framework: "pci_dss_4", requirement: "7.2.4" },
      ],
    },
    {
      key: "google_workspace.logs.admin_activity",
      title: "Admin activity audit log",
      description: "Reports API admin events from the last 7 days.",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.12.4.1" },
        { framework: "hipaa", requirement: "164.312(b)" },
        { framework: "hipaa", requirement: "164.308(a)(1)(ii)(D)" },
        { framework: "pci_dss_4", requirement: "10.2.1" },
        { framework: "pci_dss_4", requirement: "10.2.2" },
      ],
    },
    {
      key: "google_workspace.logs.login_failures",
      title: "Failed login attempts",
      description: "Failed sign-in events in the last 24 hours.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.12.4.1" },
        { framework: "hipaa", requirement: "164.308(a)(5)(ii)(C)" },
        { framework: "hipaa", requirement: "164.312(b)" },
        { framework: "pci_dss_4", requirement: "10.2.1" },
        { framework: "pci_dss_4", requirement: "8.3.4" },
      ],
    },
  ],
};
