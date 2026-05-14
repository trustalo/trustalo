import type { Manifest } from "../types.js";

export const googleWorkspaceManifest: Manifest = {
  connector: "google_workspace",
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
      ],
    },
    {
      key: "google.password_policy.min_length",
      title: "Password policy enforces ≥ 12 characters",
      description: "Domain-wide setting `passwordMinLength` is at least 12.",
      severity: "high",
      runner: "oauth_api",
      params: { api: "admin.security.passwordSettings" },
      controlMappings: [{ framework: "iso27001", requirement: "A.5.17" }],
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
      ],
    },
  ],
};
