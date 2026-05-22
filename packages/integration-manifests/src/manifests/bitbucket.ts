import type { Manifest } from "../types.js";

export const bitbucketManifest: Manifest = {
  connector: "bitbucket",
  version: "1.0.0",
  displayName: "Bitbucket",
  description:
    "Read-only Bitbucket posture: workspace access, repo visibility, branch restrictions, default-reviewer coverage.",
  iconKey: "bitbucket",
  category: "code",
  authType: "oauth2",
  configFields: [
    { key: "workspace", label: "Workspace slug", type: "string", required: true },
    { key: "accessToken", label: "Access token", type: "secret", required: true },
  ],
  capabilities: [
    {
      key: "bitbucket.workspace.members",
      title: "Workspace member access review",
      description: "Users with workspace access for periodic review.",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.3" },
        { framework: "iso27001", requirement: "A.9.4.2" },
      ],
    },
    {
      key: "bitbucket.repos.visibility",
      title: "Repository visibility",
      description: "Public vs private repository split.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC6.1" },
        { framework: "soc2", requirement: "CC6.7" },
        { framework: "iso27001", requirement: "A.9.4.1" },
      ],
    },
    {
      key: "bitbucket.repos.branch_restrictions",
      title: "Branch restrictions",
      description: "Restriction rules guarding default branches.",
      defaultSeverity: "high",
      controlMappings: [
        { framework: "soc2", requirement: "CC8.1" },
        { framework: "iso27001", requirement: "A.14.2.2" },
      ],
    },
    {
      key: "bitbucket.repos.default_reviewers",
      title: "Default reviewer coverage",
      description: "Repos with default reviewers configured.",
      defaultSeverity: "medium",
      controlMappings: [
        { framework: "soc2", requirement: "CC8.1" },
        { framework: "iso27001", requirement: "A.14.2.2" },
      ],
    },
  ],
};
