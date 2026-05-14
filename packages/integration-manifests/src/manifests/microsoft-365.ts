import type { Manifest } from "../types.js";

export const microsoft365Manifest: Manifest = {
  connector: "microsoft_365",
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
};
