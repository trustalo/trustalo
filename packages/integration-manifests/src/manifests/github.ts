import type { Manifest } from "../types.js";

export const githubManifest: Manifest = {
  connector: "github",
  version: "1.0.0",
  displayName: "GitHub",
  description:
    "Verifies organization-level security: 2FA enforcement, branch protection on default branches, secret scanning, dependency review.",
  iconKey: "github",
  category: "code",
  authType: "personal_access_token",
  configFields: [
    {
      key: "organization",
      label: "GitHub organization",
      type: "string",
      required: true,
    },
    {
      key: "token",
      label: "Personal access token (read-only, org admin)",
      type: "secret",
      required: true,
      helpText:
        "Needs `read:org` and `repo` (read) scopes. Trustalo will list repos and read settings only.",
    },
  ],
  checks: [
    {
      key: "github.org.two_factor_enforced",
      title: "Two-factor auth is enforced for the organization",
      description: "GitHub `two_factor_requirement_enabled` is true.",
      severity: "critical",
      runner: "http",
      params: {
        method: "GET",
        urlTemplate: "https://api.github.com/orgs/{{organization}}",
        assertJsonPath: "$.two_factor_requirement_enabled",
        assertEquals: true,
      },
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.5.17" },
        { framework: "essential8", requirement: "ML2-MFA" },
      ],
    },
    {
      key: "github.repos.default_branch_protected",
      title: "All non-archived repos protect their default branch",
      description: "Default branch requires PR review, status checks, and disallows force pushes.",
      severity: "high",
      runner: "http",
      params: { method: "GET", urlTemplate: "https://api.github.com/orgs/{{organization}}/repos" },
      controlMappings: [
        { framework: "soc2", requirement: "CC8.1" },
        { framework: "iso27001", requirement: "A.8.31" },
      ],
    },
    {
      key: "github.org.secret_scanning_enabled",
      title: "Secret scanning is enabled at the org level",
      description:
        "GitHub Advanced Security: secret_scanning_enabled_for_new_repositories is true.",
      severity: "high",
      runner: "http",
      params: {
        method: "GET",
        urlTemplate: "https://api.github.com/orgs/{{organization}}",
        assertJsonPath: "$.secret_scanning_enabled_for_new_repositories",
        assertEquals: true,
      },
      controlMappings: [
        { framework: "soc2", requirement: "CC7.1" },
        { framework: "iso27001", requirement: "A.8.28" },
      ],
    },
  ],
  capabilities: [
    {
      key: "github.org.members",
      title: "Organization members",
      description: "Org members with 2FA enrolment status.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.3" },
        { framework: "iso27001", requirement: "A.9.4.2" },
      ],
    },
    {
      key: "github.repos.visibility",
      title: "Repository visibility inventory",
      description: "Public/private/archived split across all repos.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.7" },
        { framework: "iso27001", requirement: "A.9.4.1" },
      ],
    },
    {
      key: "github.repos.branch_protection",
      title: "Default-branch protection coverage",
      description: "Per-repo default branch protection status (sampled).",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC8.1" },
        { framework: "iso27001", requirement: "A.14.2.2" },
      ],
    },
    {
      key: "github.security.dependabot",
      title: "Dependabot alerts",
      description: "Open Dependabot alerts and critical-severity counts.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC7.1" },
        { framework: "iso27001", requirement: "A.12.6.1" },
      ],
    },
    {
      key: "github.security.secret_scanning",
      title: "Secret scanning alerts",
      description: "Open secret-scanning alerts across sampled repos.",
      defaultSeverity: "critical",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "iso27001", requirement: "A.9.4.3" },
      ],
    },
  ],
};
