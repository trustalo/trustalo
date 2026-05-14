import type { Manifest } from "../types.js";

export const oktaManifest: Manifest = {
  connector: "okta",
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
        { framework: "essential8", requirement: "ML2-MFA" },
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
      controlMappings: [{ framework: "iso27001", requirement: "A.5.17" }],
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
      ],
    },
  ],
};
