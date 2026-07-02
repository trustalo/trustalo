import type { Manifest } from "../types.js";

export const oktaManifest: Manifest = {
  connector: "okta",
  version: "1.0.0",
  displayName: "Okta",
  description:
    "Verifies global session lifetime, MFA factors, password policy, and admin role assignments.",
  iconKey: "okta",
  category: "identity",
  authType: "api_key",
  configFields: [
    {
      key: "domain",
      label: "Okta domain (e.g. acme.okta.com)",
      type: "string",
      required: true,
    },
    {
      key: "apiToken",
      label: "API token (read-only)",
      type: "secret",
      required: true,
    },
  ],
  checks: [
    {
      key: "okta.policy.mfa_required_signin",
      title: "Global sign-on policy requires MFA",
      description: "Default sign-on policy has at least one MFA factor required.",
      severity: "critical",
      runner: "http",
      params: {
        method: "GET",
        urlTemplate: "https://{{domain}}/api/v1/policies?type=OKTA_SIGN_ON",
      },
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.5.17" },
        { framework: "essential8", requirement: "E8-MFA-ML2" },
        { framework: "hipaa", requirement: "164.312(d)" },
        { framework: "pci_dss_4", requirement: "8.4.1" },
        { framework: "pci_dss_4", requirement: "8.4.2" },
      ],
    },
    {
      key: "okta.policy.password_strength",
      title: "Password policy meets baseline strength",
      description:
        "Length ≥ 14, requires upper/lower/number/symbol, lockout after 5 failed attempts.",
      severity: "high",
      runner: "http",
      params: {
        method: "GET",
        urlTemplate: "https://{{domain}}/api/v1/policies?type=PASSWORD",
      },
      controlMappings: [
        { framework: "iso27001", requirement: "A.5.17" },
        { framework: "hipaa", requirement: "164.308(a)(5)(ii)(D)" },
        { framework: "pci_dss_4", requirement: "8.3.6" },
        { framework: "pci_dss_4", requirement: "8.3.4" },
      ],
    },
    {
      key: "okta.admins.count_within_threshold",
      title: "Super-admin count is ≤ 3",
      description: "Excessive super-admins increase blast radius on credential loss.",
      severity: "medium",
      runner: "http",
      params: {
        method: "GET",
        urlTemplate: "https://{{domain}}/api/v1/iam/assignees/users",
      },
      controlMappings: [
        { framework: "soc2", requirement: "CC6.3" },
        { framework: "iso27001", requirement: "A.5.18" },
        { framework: "hipaa", requirement: "164.308(a)(4)(ii)(B)" },
        { framework: "hipaa", requirement: "164.308(a)(4)(ii)(C)" },
        { framework: "pci_dss_4", requirement: "7.2.2" },
        { framework: "pci_dss_4", requirement: "7.2.5" },
      ],
    },
  ],
  capabilities: [
    {
      key: "okta.users.mfa",
      title: "Per-user MFA enrolment",
      description: "Active users with MFA enrolment status.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.3" },
        { framework: "iso27001", requirement: "A.8.5" },
        { framework: "hipaa", requirement: "164.312(d)" },
        { framework: "pci_dss_4", requirement: "8.4.1" },
        { framework: "pci_dss_4", requirement: "8.4.2" },
      ],
    },
    {
      key: "okta.users.inventory",
      title: "User directory inventory",
      description: "All active users with profile + status.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.5.16" },
        { framework: "hipaa", requirement: "164.312(a)(2)(i)" },
        { framework: "pci_dss_4", requirement: "8.2.1" },
      ],
    },
    {
      key: "okta.groups.inventory",
      title: "Group inventory",
      description: "Configured groups with membership summary.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.8.2" },
        { framework: "hipaa", requirement: "164.308(a)(4)(ii)(C)" },
        { framework: "pci_dss_4", requirement: "7.2.1" },
      ],
    },
    {
      key: "okta.policies.sign_on",
      title: "Sign-on policies",
      description: "Sign-on policies with priority and conditions.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.8.3" },
        { framework: "hipaa", requirement: "164.312(d)" },
        { framework: "pci_dss_4", requirement: "8.4.1" },
      ],
    },
    {
      key: "okta.policies.password",
      title: "Password policies",
      description: "Per-policy password complexity requirements.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.5.17" },
        { framework: "hipaa", requirement: "164.308(a)(5)(ii)(D)" },
        { framework: "pci_dss_4", requirement: "8.3.6" },
      ],
    },
    {
      key: "okta.logs.security_events",
      title: "Security event log",
      description: "Security-relevant system log events in the last 24 hours.",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.2" },
        { framework: "iso27001", requirement: "A.8.15" },
        { framework: "hipaa", requirement: "164.312(b)" },
        { framework: "hipaa", requirement: "164.308(a)(1)(ii)(D)" },
        { framework: "pci_dss_4", requirement: "10.2.1" },
        { framework: "pci_dss_4", requirement: "10.4.1" },
      ],
    },
  ],
};
