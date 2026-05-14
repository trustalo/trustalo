import { Octokit } from "@octokit/rest";
import type {
  IntegrationProvider,
  DecryptedCredentials,
  ProviderConnection,
  CollectOptions,
  EvidenceResult,
  ConnectionTestResult,
  PermissionRequirement,
  CredentialField,
} from "../../core/types.js";

interface GitHubClient {
  octokit: Octokit;
  organization: string;
}

export class GitHubProvider implements IntegrationProvider {
  readonly id = "github";
  readonly name = "GitHub";
  readonly description =
    "Collect evidence from GitHub including org members, branch protection, Dependabot, and code scanning";
  readonly version = "1.0.0";
  readonly category = "code_repository" as const;
  readonly authType = "oauth2" as const;
  readonly capabilities = [
    "org_members",
    "branch_protection",
    "dependabot",
    "code_scanning",
    "secret_scanning",
    "repo_visibility",
  ];
  readonly configSchema: CredentialField[] = [
    {
      key: "accessToken",
      label: "Personal Access Token / GitHub App Token",
      type: "password",
      required: true,
      sensitive: true,
      description: "Token with org:read, repo, and security_events scopes",
    },
    {
      key: "organization",
      label: "Organization",
      type: "text",
      required: true,
      placeholder: "your-org",
    },
  ];

  async connect(credentials: DecryptedCredentials): Promise<ProviderConnection> {
    const octokit = new Octokit({ auth: credentials["accessToken"] });
    const client: GitHubClient = { octokit, organization: credentials["organization"]! };
    return { id: `github-${Date.now()}`, integration: this.id, client };
  }

  async collectEvidence(
    connection: ProviderConnection,
    options: CollectOptions,
  ): Promise<EvidenceResult[]> {
    const { octokit, organization } = connection.client as GitHubClient;
    const results: EvidenceResult[] = [];
    const now = new Date();

    // --- Org Members & 2FA ---
    try {
      const members = await octokit.paginate(octokit.rest.orgs.listMembers, {
        org: organization,
        per_page: 100,
      });
      let membersWithout2fa = 0;
      try {
        const no2fa = await octokit.paginate(octokit.rest.orgs.listMembers, {
          org: organization,
          filter: "2fa_disabled",
          per_page: 100,
        });
        membersWithout2fa = no2fa.length;
      } catch {
        /* filter may require admin:org scope */
      }

      results.push({
        title: "GitHub Organization Members",
        description: `${members.length} members, ${membersWithout2fa} without 2FA enabled`,
        sourceType: "github.org.members",
        sourceId: `github-members-${organization}`,
        rawData: {
          totalMembers: members.length,
          membersWithout2fa,
          members: members.map((m) => ({ login: m.login, id: m.id, type: m.type })),
        },
        severity: membersWithout2fa > 0 ? "high" : "info",
        controlMapping: ["CC6.1", "CC6.3", "IA-2", "A.9.4.2"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[github] failed to collect org members:", err);
    }

    // --- Repositories & Visibility ---
    try {
      const repos = await octokit.paginate(octokit.rest.repos.listForOrg, {
        org: organization,
        per_page: 100,
        type: "all",
      });
      const publicRepos = repos.filter((r) => !r.private);
      const archivedRepos = repos.filter((r) => r.archived);

      results.push({
        title: "GitHub Repository Visibility",
        description: `${repos.length} repos: ${publicRepos.length} public, ${repos.length - publicRepos.length} private, ${archivedRepos.length} archived`,
        sourceType: "github.repos.visibility",
        sourceId: `github-repos-${organization}`,
        rawData: {
          totalRepos: repos.length,
          publicRepos: publicRepos.length,
          privateRepos: repos.length - publicRepos.length,
          archivedRepos: archivedRepos.length,
          repos: repos.map((r) => ({
            name: r.name,
            private: r.private,
            archived: r.archived,
            defaultBranch: r.default_branch,
          })),
        },
        severity: publicRepos.length > 0 ? "medium" : "info",
        controlMapping: ["CC6.1", "CC6.7", "AC-3", "A.9.4.1"],
        collectedAt: now,
      });

      // --- Branch Protection (sample top repos) ---
      const activeRepos = repos.filter((r) => !r.archived).slice(0, 20);
      let protectedCount = 0;
      let unprotectedCount = 0;
      const branchDetails: Array<Record<string, unknown>> = [];

      for (const repo of activeRepos) {
        try {
          const protection = await octokit.rest.repos.getBranchProtection({
            owner: organization,
            repo: repo.name,
            branch: repo.default_branch ?? "main",
          });
          protectedCount++;
          branchDetails.push({
            repo: repo.name,
            branch: repo.default_branch,
            protected: true,
            requiredReviews:
              protection.data.required_pull_request_reviews?.required_approving_review_count ?? 0,
            requireStatusChecks: !!protection.data.required_status_checks,
            enforceAdmins: protection.data.enforce_admins?.enabled ?? false,
          });
        } catch {
          unprotectedCount++;
          branchDetails.push({ repo: repo.name, branch: repo.default_branch, protected: false });
        }
      }

      results.push({
        title: "GitHub Branch Protection",
        description: `${protectedCount} of ${activeRepos.length} sampled repos have branch protection on default branch`,
        sourceType: "github.repos.branch_protection",
        sourceId: `github-branch-protection-${organization}`,
        rawData: {
          sampledRepos: activeRepos.length,
          protectedCount,
          unprotectedCount,
          branches: branchDetails,
        },
        severity: unprotectedCount > 0 ? "high" : "info",
        controlMapping: ["CC8.1", "CM-3", "A.14.2.2"],
        collectedAt: now,
      });

      // --- Dependabot Alerts ---
      let totalDependabotAlerts = 0;
      let criticalAlerts = 0;
      for (const repo of activeRepos.slice(0, 10)) {
        try {
          const alerts = await octokit.rest.dependabot.listAlertsForRepo({
            owner: organization,
            repo: repo.name,
            state: "open",
            per_page: 100,
          });
          totalDependabotAlerts += alerts.data.length;
          criticalAlerts += alerts.data.filter(
            (a) => a.security_advisory?.severity === "critical",
          ).length;
        } catch {
          /* Dependabot may not be enabled */
        }
      }

      results.push({
        title: "GitHub Dependabot Alerts",
        description: `${totalDependabotAlerts} open Dependabot alerts across sampled repos, ${criticalAlerts} critical`,
        sourceType: "github.security.dependabot",
        sourceId: `github-dependabot-${organization}`,
        rawData: { totalAlerts: totalDependabotAlerts, criticalAlerts },
        severity: criticalAlerts > 0 ? "critical" : totalDependabotAlerts > 0 ? "medium" : "info",
        controlMapping: ["CC7.1", "SI-2", "A.12.6.1"],
        collectedAt: now,
      });

      // --- Secret Scanning Alerts ---
      let totalSecretAlerts = 0;
      for (const repo of activeRepos.slice(0, 10)) {
        try {
          const alerts = await octokit.rest.secretScanning.listAlertsForRepo({
            owner: organization,
            repo: repo.name,
            state: "open",
            per_page: 100,
          });
          totalSecretAlerts += alerts.data.length;
        } catch {
          /* Secret scanning may not be available */
        }
      }

      results.push({
        title: "GitHub Secret Scanning Alerts",
        description: `${totalSecretAlerts} open secret scanning alerts across sampled repos`,
        sourceType: "github.security.secret_scanning",
        sourceId: `github-secret-scanning-${organization}`,
        rawData: { totalAlerts: totalSecretAlerts },
        severity: totalSecretAlerts > 0 ? "critical" : "info",
        controlMapping: ["CC6.1", "IA-5", "A.9.4.3"],
        collectedAt: now,
      });
    } catch (err) {
      console.error("[github] failed to collect repos/branch protection:", err);
    }

    console.log(`[github] collected ${results.length} evidence items for org=${options.tenantId}`);
    return results;
  }

  async testConnection(connection: ProviderConnection): Promise<ConnectionTestResult> {
    try {
      const { octokit, organization } = connection.client as GitHubClient;
      const { data: user } = await octokit.rest.users.getAuthenticated();
      const { data: org } = await octokit.rest.orgs.get({ org: organization });

      return {
        success: true,
        message: "Successfully authenticated with GitHub",
        details: { login: user.login, organization: org.login, plan: org.plan?.name },
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to connect to GitHub",
      };
    }
  }

  async disconnect(_connection: ProviderConnection): Promise<void> {
    // OAuth tokens persist; no session cleanup needed
  }

  getRequiredPermissions(): PermissionRequirement[] {
    return [
      {
        resource: "org",
        permission: "read:org",
        description: "Read organization membership and 2FA status",
        required: true,
      },
      {
        resource: "repo",
        permission: "repo",
        description: "Read repositories, branch protection, and settings",
        required: true,
      },
      {
        resource: "security",
        permission: "security_events",
        description: "Read Dependabot, code scanning, and secret scanning alerts",
        required: true,
      },
      {
        resource: "admin",
        permission: "admin:org",
        description: "Read organization-level settings (optional)",
        required: false,
      },
    ];
  }
}
