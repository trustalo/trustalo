/**
 * Executes one agent tool call: connect to the underlying integration,
 * run that provider's `collectEvidence`, then filter the results down
 * to the requested capability.
 *
 * To keep run cost bounded we cache `collectEvidence` output per
 * connection for the lifetime of an AgentRun — the LLM may call several
 * capabilities of the same connection across turns, and re-running the
 * full collection each time would be wasteful.
 */

import { prisma } from "../db/prisma.js";
import { providerRegistry } from "../integrations/core/registry.js";
import { SecretVaultService } from "../secret-vault/service.js";
import type { EvidenceResult } from "../integrations/core/types.js";
import type { AgentToolDescriptor, AgentToolResult, CollectedEvidence } from "./types.js";

export class ToolExecutor {
  private cache = new Map<string, EvidenceResult[]>();

  constructor(
    private readonly tenantId: string,
    private readonly toolByName: Map<string, AgentToolDescriptor>,
  ) {}

  async execute(
    toolName: string,
  ): Promise<{ result: AgentToolResult; evidence: CollectedEvidence[] }> {
    const tool = this.toolByName.get(toolName);
    if (!tool) {
      return {
        result: {
          name: toolName,
          ok: false,
          count: 0,
          preview: [],
          errorMessage: `Unknown tool '${toolName}'`,
        },
        evidence: [],
      };
    }

    let collected: EvidenceResult[];
    try {
      collected = await this.collectForConnection(tool);
    } catch (err) {
      return {
        result: {
          name: toolName,
          ok: false,
          count: 0,
          preview: [],
          errorMessage: err instanceof Error ? err.message : String(err),
        },
        evidence: [],
      };
    }

    const matches = filterByCapability(collected, tool.capability);
    const evidence: CollectedEvidence[] = matches.map((e) => ({
      ...e,
      producedBy: toolName,
    }));

    return {
      result: {
        name: toolName,
        ok: true,
        count: evidence.length,
        preview: evidence.slice(0, 5).map((e) => ({
          title: e.title,
          description: e.description,
          sourceType: e.sourceType,
          severity: e.severity,
        })),
      },
      evidence,
    };
  }

  private async collectForConnection(tool: AgentToolDescriptor): Promise<EvidenceResult[]> {
    const cached = this.cache.get(tool.connectionId);
    if (cached) return cached;

    const connection = await prisma.integrationConnection.findUnique({
      where: { id: tool.connectionId },
      include: { integration: { select: { id: true } } },
    });
    if (!connection || connection.tenantId !== this.tenantId) {
      throw new Error(`Connection '${tool.connectionId}' not available for this tenant`);
    }

    const provider = providerRegistry.get(connection.integration.id);
    if (!provider) {
      throw new Error(`Connector '${connection.integration.id}' is not registered`);
    }

    if (!connection.secretId) {
      throw new Error(
        `Connection '${connection.id}' has no SecretVault entry — credentials missing`,
      );
    }
    const credentials = await SecretVaultService.read(connection.secretId);
    const providerConnection = await provider.connect(credentials);
    try {
      const test = await provider.testConnection(providerConnection);
      if (!test.success) {
        throw new Error(`Connection test failed: ${test.message}`);
      }
      const evidence = await provider.collectEvidence(providerConnection, {
        tenantId: this.tenantId,
        connectionId: connection.id,
        incremental: false,
      });
      this.cache.set(tool.connectionId, evidence);
      return evidence;
    } finally {
      try {
        await provider.disconnect(providerConnection);
      } catch {
        // Disconnect failures are not actionable for the agent loop.
      }
    }
  }
}

/**
 * Capability matching:
 *   - Providers tag each evidence item with a dotted `sourceType` such as
 *     `github.org.members` or `github.branch_protection`.
 *   - The capability strings on the provider are slugs like
 *     `org_members`, `branch_protection`.
 *
 * We normalise both sides to lowercase alpha-numeric tokens and check if
 * the capability tokens are all present in the source tokens. This is
 * intentionally tolerant — providers vary in how they namespace
 * sourceTypes and an over-strict match would silently drop evidence.
 */
function filterByCapability(items: EvidenceResult[], capability: string): EvidenceResult[] {
  const capTokens = capability
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (capTokens.length === 0) return items;

  return items.filter((item) => {
    const sourceTokens = item.sourceType
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
    return capTokens.every((t) => sourceTokens.includes(t));
  });
}
