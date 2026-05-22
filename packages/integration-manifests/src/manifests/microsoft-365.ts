import type { Manifest } from "../types.js";

export const microsoft365Manifest: Manifest = {
  // Slug matches `Integration.id` in the collector seed ("office365").
  // The display name retains "Microsoft 365" — only the routing slug
  // is normalised to keep manifest lookups by integrationId direct.
  connector: "office365",
  version: "1.0.0",
  displayName: "Microsoft 365",
  description:
    "Validates Conditional Access policies, MFA enforcement, and audit log retention via Microsoft Graph.",
  iconKey: "microsoft_365",
  category: "productivity",
  authType: "oauth2",
  configFields: [
    { key: "tenantId", label: "Azure tenant ID", type: "string", required: true },
    { key: "clientId", label: "Application (client) ID", type: "string", required: true },
    { key: "clientSecret", label: "Client secret", type: "secret", required: true },
  ],
  checks: [
    {
      key: "m365.conditional_access.mfa_for_admins",
      title: "Conditional Access requires MFA for admin roles",
      description: "At least one enabled CA policy targets all privileged roles and requires MFA.",
      severity: "critical",
      runner: "oauth_api",
      params: { api: "graph.policies.conditionalAccessPolicies" },
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "essential8", requirement: "ML2-MFA" },
      ],
    },
    {
      key: "m365.audit.unified_log_enabled",
      title: "Unified audit log is enabled",
      description: "ExchangeOnline `UnifiedAuditLogIngestionEnabled` is true.",
      severity: "high",
      runner: "oauth_api",
      params: { api: "graph.security.auditLog.signIns" },
      controlMappings: [
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.8.15" },
      ],
    },
    {
      key: "m365.users.legacy_auth_blocked",
      title: "Legacy authentication is blocked",
      description: "Conditional Access blocks legacy auth clients (no IMAP/POP/SMTP basic auth).",
      severity: "high",
      runner: "oauth_api",
      params: { api: "graph.policies.conditionalAccessPolicies" },
      controlMappings: [{ framework: "iso27001", requirement: "A.8.5" }],
    },
  ],
  capabilities: [
    {
      key: "office365.users.inventory",
      title: "User inventory",
      description: "All users with enabled/disabled status.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.9.2.1" },
      ],
    },
    {
      key: "office365.users.mfa",
      title: "Per-user MFA enrolment",
      description: "Graph credentialUserRegistrationDetails report.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.3" },
        { framework: "iso27001", requirement: "A.9.4.2" },
      ],
    },
    {
      key: "office365.identity.conditional_access",
      title: "Conditional Access policies",
      description: "Inventory of enabled and report-only CA policies.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.9.4.1" },
      ],
    },
    {
      key: "office365.groups.security",
      title: "Security group inventory",
      description: "Security-enabled directory groups.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.9.2.3" },
      ],
    },
    {
      key: "office365.security.secure_score",
      title: "Microsoft Secure Score",
      description: "Tenant-level secure score against the maximum achievable.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.1" },
        { framework: "iso27001", requirement: "A.18.2.2" },
      ],
    },
    {
      key: "office365.logs.failed_signins",
      title: "Failed sign-ins",
      description: "Failed sign-in attempts in the monitored period.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.12.4.1" },
      ],
    },
  ],
};
