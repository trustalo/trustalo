import type { Manifest } from "../types.js";

export const gitlabManifest: Manifest = {
  connector: "gitlab",
  version: "1.0.0",
  displayName: "GitLab",
  description:
    "Verifies group-level 2FA enforcement, signed-commit requirements, container scanning, and SAST defaults.",
  iconKey: "gitlab",
  category: "code",
  authType: "personal_access_token",
  configFields: [
    {
      key: "instanceUrl",
      label: "GitLab instance URL",
      type: "string",
      required: true,
      defaultValue: "https://gitlab.com",
    },
    { key: "groupPath", label: "Group path", type: "string", required: true },
    { key: "token", label: "Personal access token (read-only)", type: "secret", required: true },
  ],
  checks: [
    {
      key: "gitlab.group.two_factor_required",
      title: "Group enforces 2FA for all members",
      description: "Group setting `require_two_factor_authentication` is true.",
      severity: "critical",
      runner: "http",
      params: {
        method: "GET",
        urlTemplate: "{{instanceUrl}}/api/v4/groups/{{groupPath}}",
        assertJsonPath: "$.require_two_factor_authentication",
        assertEquals: true,
      },
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "essential8", requirement: "ML2-MFA" },
        { framework: "hipaa", requirement: "164.312(d)" },
        { framework: "pci_dss_4", requirement: "8.4.1" },
      ],
    },
    {
      key: "gitlab.projects.protected_default_branch",
      title: "All projects protect their default branch",
      description: "Default branch protection forbids force pushes and requires merge approval.",
      severity: "high",
      runner: "http",
      params: {
        method: "GET",
        urlTemplate: "{{instanceUrl}}/api/v4/groups/{{groupPath}}/projects",
      },
      controlMappings: [
        { framework: "soc2", requirement: "CC8.1" },
        { framework: "iso27001", requirement: "A.8.31" },
        { framework: "pci_dss_4", requirement: "6.2.1" },
        { framework: "pci_dss_4", requirement: "6.5.1" },
      ],
    },
    {
      key: "gitlab.security.sast_enabled",
      title: "SAST is enabled in default project templates",
      description: "Group-level CI/CD includes SAST template.",
      severity: "medium",
      runner: "http",
      params: { method: "GET", urlTemplate: "{{instanceUrl}}/api/v4/groups/{{groupPath}}" },
      controlMappings: [
        { framework: "soc2", requirement: "CC7.1" },
        { framework: "iso27001", requirement: "A.8.28" },
        { framework: "pci_dss_4", requirement: "6.2.1" },
        { framework: "pci_dss_4", requirement: "6.3.1" },
      ],
    },
  ],
};
