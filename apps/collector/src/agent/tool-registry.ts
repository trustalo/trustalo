/**
 * Tool registry for the evidence agent.
 *
 * Each (connection × capability) pair is exposed as a separate tool the
 * LLM can call. We do not expose connections as opaque "run everything"
 * tools because:
 *   - The agent must be able to pick a narrow capability (e.g. only
 *     `branch_protection` from a GitHub connection) without dragging
 *     in unrelated noise.
 *   - The transcript persisted to AgentRun records exactly which tool
 *     was invoked, which is important for auditability.
 */

import { prisma } from "../db/prisma.js";
import { providerRegistry } from "../integrations/core/registry.js";
import type { AgentToolDescriptor } from "./types.js";

function sanitizeForToolName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function buildToolName(
  providerSlug: string,
  capability: string,
  connectionName: string,
): string {
  return [
    sanitizeForToolName(providerSlug),
    sanitizeForToolName(capability),
    sanitizeForToolName(connectionName),
  ]
    .filter(Boolean)
    .join("__");
}

/**
 * Loads `IntegrationConnection`s for the given org+ids and expands each
 * provider's capability list into a flat tool array.
 *
 * Connections that don't resolve in the registry (legacy provider, mid-
 * deploy slug rename) are silently skipped — better to run with a
 * subset than to fail the whole run.
 */
export async function loadAgentTools(
  tenantId: string,
  connectionIds: string[],
): Promise<AgentToolDescriptor[]> {
  if (connectionIds.length === 0) return [];

  const connections = await prisma.integrationConnection.findMany({
    where: {
      tenantId,
      id: { in: connectionIds },
      isActive: true,
    },
    include: { integration: { select: { id: true, name: true } } },
  });

  const tools: AgentToolDescriptor[] = [];
  for (const connection of connections) {
    const provider = providerRegistry.get(connection.integration.id);
    if (!provider) continue;
    for (const capability of provider.capabilities) {
      tools.push({
        name: buildToolName(connection.integration.id, capability, connection.name),
        description: `${provider.name} → ${capability} (connection: ${connection.name})`,
        connectionId: connection.id,
        connectionName: connection.name,
        providerSlug: connection.integration.id,
        providerName: connection.integration.name,
        capability,
      });
    }
  }
  return tools;
}
