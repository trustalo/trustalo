import type {
  CollectOptions,
  ConnectionTestResult,
  CredentialField,
  DecryptedCredentials,
  EvidenceResult,
  IntegrationProvider,
  PermissionRequirement,
  ProviderConnection,
} from "../../core/types.js";

interface BitbucketClient {
  workspace: string;
  authHeader: string;
}

/**
 * Bitbucket Cloud — read-only security posture evidence.
 *
 * **Preferred auth:** OAuth 2.0 (Atlassian OAuth consumer). Bitbucket scope names are coarse:
 * `repository` covers repo metadata and many security APIs but also allows reading source over HTTPS;
 * `account` is needed for workspace member listing. Branch restrictions / default reviewers may require
 * `repository:admin` on some accounts — grant the minimum that makes the collector succeed.
 *
 * - Authorize: `https://bitbucket.org/site/oauth2/authorize`
 * - Token: `https://bitbucket.org/site/oauth2/access_token`
 *
 * **Legacy:** App password + username (HTTP Basic). Same APIs; use only if OAuth is not available.
 *
 * @see https://developer.atlassian.com/cloud/bitbucket/rest/intro/#authentication
 */
export class BitbucketProvider implements IntegrationProvider {
  readonly id = "bitbucket";
  readonly name = "Bitbucket";
  readonly description =
    "Read-only security posture: workspace access, repo visibility, branch restrictions, merge gates.";
  readonly version = "1.1.0";
  readonly category = "code_repository" as const;
  readonly authType = "oauth2" as const;
  readonly capabilities = [
    "access_review",
    "branch_protection",
    "merge_controls",
    "repository_visibility",
  ];

  readonly configSchema: CredentialField[] = [
    {
      key: "authMethod",
      label: "Authentication",
      type: "select",
      required: true,
      default: "oauth2",
      description:
        "OAuth 2.0 (recommended): Bitbucket consumer + authorize URL. Prefer smallest scopes that still allow sync (often repository + account). App password: legacy Basic auth.",
      options: [
        { value: "oauth2", label: "OAuth 2.0 (access token)" },
        { value: "app_password", label: "App password (username + password)" },
      ],
    },
    {
      key: "workspace",
      label: "Workspace slug",
      type: "text",
      required: true,
      placeholder: "my-workspace",
      description: "Bitbucket workspace ID (from the workspace URL).",
    },
    {
      key: "accessToken",
      label: "Access token",
      type: "password",
      required: true,
      sensitive: true,
      placeholder: "OAuth access token or app password",
      description:
        "OAuth: paste access_token from the token response. App password: paste the generated app password.",
    },
    {
      key: "username",
      label: "Bitbucket username",
      type: "text",
      required: false,
      placeholder: "Only for app password",
      description: "Required only for App password (Basic auth). Leave empty for OAuth Bearer.",
      showWhen: { key: "authMethod", value: "app_password" },
    },
    {
      key: "refreshToken",
      label: "Refresh token (optional)",
      type: "password",
      required: false,
      sensitive: true,
      description:
        "If the token response included refresh_token, store it for future rotation (optional collector support).",
      showWhen: { key: "authMethod", value: "oauth2" },
    },
    {
      key: "oauthClientId",
      label: "OAuth client ID (optional)",
      type: "text",
      required: false,
      description: "OAuth consumer key — used with refresh token to obtain new access tokens.",
      showWhen: { key: "authMethod", value: "oauth2" },
    },
    {
      key: "oauthClientSecret",
      label: "OAuth client secret (optional)",
      type: "password",
      required: false,
      sensitive: true,
      description: "OAuth consumer secret — paired with client ID for refresh.",
      showWhen: { key: "authMethod", value: "oauth2" },
    },
  ];

  private buildClient(credentials: DecryptedCredentials): BitbucketClient {
    const workspace = credentials["workspace"]?.trim();
    const accessToken = credentials["accessToken"]?.trim();
    const authMethod = credentials["authMethod"]?.trim() || "oauth2";
    const username = credentials["username"]?.trim();

    if (!workspace || !accessToken) {
      throw new Error("Workspace and access token are required");
    }
    if (authMethod === "app_password" && !username) {
      throw new Error("Username is required when using App password authentication");
    }

    const authHeader =
      username && username.length > 0
        ? `Basic ${Buffer.from(`${username}:${accessToken}`).toString("base64")}`
        : `Bearer ${accessToken}`;

    return { workspace, authHeader };
  }

  async connect(credentials: DecryptedCredentials): Promise<ProviderConnection> {
    const client = this.buildClient(credentials);
    return {
      id: `bitbucket-${Date.now()}`,
      integration: this.id,
      client,
    };
  }

  async collectEvidence(
    connection: ProviderConnection,
    options: CollectOptions,
  ): Promise<EvidenceResult[]> {
    const client = connection.client as BitbucketClient;
    const now = new Date();
    const results: EvidenceResult[] = [];

    try {
      results.push(await this.collectWorkspaceMembers(client, now));
    } catch (err) {
      console.error("[bitbucket] workspace members:", err);
    }
    try {
      results.push(await this.collectRepositoryVisibility(client, now));
    } catch (err) {
      console.error("[bitbucket] repo visibility:", err);
    }
    try {
      results.push(await this.collectBranchRestrictions(client, now));
    } catch (err) {
      console.error("[bitbucket] branch restrictions:", err);
    }
    try {
      results.push(await this.collectDefaultReviewers(client, now));
    } catch (err) {
      console.error("[bitbucket] default reviewers:", err);
    }

    console.log(
      `[bitbucket] collected ${results.length} evidence items for org=${options.tenantId}`,
    );
    return results;
  }

  async testConnection(connection: ProviderConnection): Promise<ConnectionTestResult> {
    try {
      const client = connection.client as BitbucketClient;
      const res = await fetch(`https://api.bitbucket.org/2.0/workspaces/${client.workspace}`, {
        headers: { Authorization: client.authHeader, Accept: "application/json" },
      });
      if (!res.ok) {
        return {
          success: false,
          message: `Bitbucket API error: ${res.status} ${res.statusText}`,
        };
      }
      const data = (await res.json()) as { name?: string; slug?: string };
      return {
        success: true,
        message: `Connected to workspace: ${data.name || data.slug || client.workspace}`,
        details: { workspace: data.slug ?? client.workspace, name: data.name },
      };
    } catch (e) {
      return {
        success: false,
        message: e instanceof Error ? e.message : "Unknown error",
      };
    }
  }

  async disconnect(_connection: ProviderConnection): Promise<void> {
    /* no remote revoke for app passwords / static tokens */
  }

  getRequiredPermissions(): PermissionRequirement[] {
    return [
      {
        resource: "bitbucket",
        permission: "repository",
        description:
          "List repos, visibility, and branch restriction APIs (Bitbucket ties many reads to this scope)",
        required: true,
      },
      {
        resource: "bitbucket",
        permission: "account",
        description: "Read workspace membership / user context where required by the API",
        required: true,
      },
      {
        resource: "bitbucket",
        permission: "repository:admin",
        description:
          "If GET branch-restrictions or default-reviewers fails with 403, grant read admin on repos (no source write)",
        required: false,
      },
    ];
  }

  private async collectWorkspaceMembers(
    client: BitbucketClient,
    collectedAt: Date,
  ): Promise<EvidenceResult> {
    const members: Array<{ uuid?: string; display_name?: string; type?: string }> = [];
    let url: string | null =
      `https://api.bitbucket.org/2.0/workspaces/${client.workspace}/members?page_len=100`;

    while (url) {
      const res = await fetch(url, {
        headers: { Authorization: client.authHeader, Accept: "application/json" },
      });
      if (!res.ok) break;
      const data = (await res.json()) as {
        values?: Array<{ user?: { uuid?: string; display_name?: string; type?: string } }>;
        next?: string | null;
      };
      for (const v of data.values || []) {
        if (v.user) members.push(v.user);
      }
      url = data.next || null;
    }

    return {
      title: "Bitbucket workspace members",
      description: `${members.length} user(s) with workspace access (access review).`,
      manifestKey: "bitbucket.workspace.members",
      sourceType: "bitbucket.workspace.members",
      sourceId: `bitbucket-members-${client.workspace}`,
      rawData: { memberCount: members.length, members: members.slice(0, 500) },
      severity: "info",
      controlMapping: ["CC6.1", "CC6.3", "IA-2", "A.9.4.2"],
      collectedAt,
    };
  }

  private async collectRepositoryVisibility(
    client: BitbucketClient,
    collectedAt: Date,
  ): Promise<EvidenceResult> {
    const repos: Array<{ slug?: string; name?: string; is_private?: boolean; full_name?: string }> =
      [];
    let url: string | null =
      `https://api.bitbucket.org/2.0/repositories/${client.workspace}?page_len=100`;

    while (url) {
      const res = await fetch(url, {
        headers: { Authorization: client.authHeader, Accept: "application/json" },
      });
      if (!res.ok) break;
      const data = (await res.json()) as {
        values?: Array<{ slug?: string; name?: string; is_private?: boolean; full_name?: string }>;
        next?: string | null;
      };
      repos.push(...(data.values || []));
      url = data.next || null;
    }

    const publicRepos = repos.filter((r) => r.is_private === false);

    return {
      title: "Bitbucket repository visibility",
      description: `${repos.length} repo(s); ${publicRepos.length} public.`,
      manifestKey: "bitbucket.repos.visibility",
      sourceType: "bitbucket.repos.visibility",
      sourceId: `bitbucket-repos-${client.workspace}`,
      rawData: {
        totalRepos: repos.length,
        publicRepoCount: publicRepos.length,
        publicRepos: publicRepos.map((r) => ({ slug: r.slug, full_name: r.full_name })),
        repos: repos.map((r) => ({
          slug: r.slug,
          full_name: r.full_name,
          is_private: r.is_private,
        })),
      },
      severity: publicRepos.length > 0 ? "medium" : "low",
      controlMapping: ["CC6.1", "CC6.7", "AC-3", "A.9.4.1"],
      collectedAt,
    };
  }

  private async collectBranchRestrictions(
    client: BitbucketClient,
    collectedAt: Date,
  ): Promise<EvidenceResult> {
    const restrictions: Array<{
      repo: string;
      pattern?: string;
      kind?: string;
      usersCount?: number;
      groupsCount?: number;
    }> = [];

    let repoUrl: string | null =
      `https://api.bitbucket.org/2.0/repositories/${client.workspace}?page_len=50`;
    while (repoUrl) {
      const repoRes = await fetch(repoUrl, {
        headers: { Authorization: client.authHeader, Accept: "application/json" },
      });
      if (!repoRes.ok) break;
      const repoData = (await repoRes.json()) as {
        values?: Array<{ slug?: string; full_name?: string }>;
        next?: string | null;
      };

      for (const repo of repoData.values || []) {
        if (!repo.slug) continue;
        let brUrl: string | null =
          `https://api.bitbucket.org/2.0/repositories/${client.workspace}/${repo.slug}/branch-restrictions?page_len=50`;
        while (brUrl) {
          const brRes = await fetch(brUrl, {
            headers: { Authorization: client.authHeader, Accept: "application/json" },
          });
          if (!brRes.ok) break;
          const brData = (await brRes.json()) as {
            values?: Array<{
              pattern?: string;
              kind?: string;
              users?: unknown[];
              groups?: unknown[];
            }>;
            next?: string | null;
          };
          for (const br of brData.values || []) {
            restrictions.push({
              repo: repo.full_name || repo.slug,
              pattern: br.pattern,
              kind: br.kind,
              usersCount: Array.isArray(br.users) ? br.users.length : 0,
              groupsCount: Array.isArray(br.groups) ? br.groups.length : 0,
            });
          }
          brUrl = brData.next || null;
        }
      }
      repoUrl = repoData.next || null;
    }

    return {
      title: "Bitbucket branch restrictions",
      description: `${restrictions.length} restriction rule(s) across repositories.`,
      manifestKey: "bitbucket.repos.branch_restrictions",
      sourceType: "bitbucket.repos.branch_restrictions",
      sourceId: `bitbucket-branch-${client.workspace}`,
      rawData: { restrictionCount: restrictions.length, restrictions: restrictions.slice(0, 500) },
      severity: restrictions.length === 0 ? "high" : "info",
      controlMapping: ["CC8.1", "CM-3", "A.14.2.2"],
      collectedAt,
    };
  }

  private async collectDefaultReviewers(
    client: BitbucketClient,
    collectedAt: Date,
  ): Promise<EvidenceResult> {
    const reviewerConfigs: Array<{ repo: string; defaultReviewersCount: number }> = [];

    let repoUrl: string | null =
      `https://api.bitbucket.org/2.0/repositories/${client.workspace}?page_len=30`;
    while (repoUrl) {
      const repoRes = await fetch(repoUrl, {
        headers: { Authorization: client.authHeader, Accept: "application/json" },
      });
      if (!repoRes.ok) break;
      const repoData = (await repoRes.json()) as {
        values?: Array<{ slug?: string; full_name?: string }>;
        next?: string | null;
      };

      for (const repo of repoData.values || []) {
        if (!repo.slug) continue;
        const drRes = await fetch(
          `https://api.bitbucket.org/2.0/repositories/${client.workspace}/${repo.slug}/default-reviewers`,
          { headers: { Authorization: client.authHeader, Accept: "application/json" } },
        );
        if (!drRes.ok) continue;
        const drData = (await drRes.json()) as { values?: unknown[] };
        reviewerConfigs.push({
          repo: repo.full_name || repo.slug,
          defaultReviewersCount: (drData.values || []).length,
        });
      }
      repoUrl = repoData.next || null;
    }

    const withoutReviewers = reviewerConfigs.filter((c) => c.defaultReviewersCount === 0);

    return {
      title: "Bitbucket default reviewers",
      description: `${reviewerConfigs.length} repo(s) checked; ${withoutReviewers.length} with no default reviewers.`,
      manifestKey: "bitbucket.repos.default_reviewers",
      sourceType: "bitbucket.repos.default_reviewers",
      sourceId: `bitbucket-reviewers-${client.workspace}`,
      rawData: {
        reposChecked: reviewerConfigs.length,
        reposWithoutDefaultReviewers: withoutReviewers.map((c) => c.repo),
        reviewerConfigs,
      },
      severity: withoutReviewers.length > reviewerConfigs.length / 2 ? "medium" : "low",
      controlMapping: ["CC8.1", "CM-3", "A.14.2.2"],
      collectedAt,
    };
  }
}
