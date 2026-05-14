/**
 * Top-level entry point for executing one evidence-agent run.
 *
 * Lifecycle:
 *   1. Create an AgentRun row in `pending` (encrypts AI credentials at rest).
 *   2. Hand back to the caller so the HTTP request returns quickly with a
 *      run id.
 *   3. Run the LLM loop in the background, persisting status transitions
 *      and a transcript along the way.
 *   4. Submit kept evidence to the API and finalise the row as
 *      `succeeded` or `failed`.
 */

import { prisma } from "../db/prisma.js";
import { encrypt, decrypt } from "../integrations/core/encryption.js";
import { loadAgentTools } from "./tool-registry.js";
import { ToolExecutor } from "./tool-executor.js";
import { runLlmLoop, type LlmTurn } from "./llm-loop.js";
import { submitAgentEvidence } from "../lib/api-client.js";
import type { AgentRunInput, CollectedEvidence } from "./types.js";

interface AgentRunRecord {
  id: string;
  tenantId: string;
  controlId: string;
  controlTitle: string | null;
  status: string;
  evidenceCount: number;
  errorCount: number;
  errorMessage: string | null;
  summary: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
  createdAt: Date;
  updatedAt: Date;
  trigger: string;
}

export async function createAndQueueAgentRun(input: AgentRunInput): Promise<AgentRunRecord> {
  const aiCredentialsEncrypted = encrypt(JSON.stringify(input.ai.credentials));

  const run = await prisma.agentRun.create({
    data: {
      tenantId: input.tenantId,
      controlId: input.controlId,
      controlTitle: input.controlTitle,
      trigger: input.trigger,
      status: "pending",
      instructions: input.instructions,
      toolConnectionIds: input.toolConnectionIds,
      aiProvider: input.ai.provider,
      aiModel: input.ai.model,
      aiCredentialsEncrypted,
    },
    select: runSelect,
  });

  // Run asynchronously; the HTTP caller already has the run id.
  void executeAgentRun(run.id).catch((err) => {
    console.error(`[agent] unhandled error in run=${run.id}:`, err);
  });

  return run;
}

const runSelect = {
  id: true,
  tenantId: true,
  controlId: true,
  controlTitle: true,
  trigger: true,
  status: true,
  evidenceCount: true,
  errorCount: true,
  errorMessage: true,
  summary: true,
  startedAt: true,
  completedAt: true,
  durationMs: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function executeAgentRun(runId: string): Promise<void> {
  const run = await prisma.agentRun.findUnique({ where: { id: runId } });
  if (!run) {
    console.error(`[agent] run=${runId} disappeared before execution`);
    return;
  }
  if (!run.aiCredentialsEncrypted || !run.aiProvider || !run.aiModel) {
    await markFailed(runId, "Missing AI configuration on agent run");
    return;
  }

  const startedAt = new Date();
  await prisma.agentRun.update({
    where: { id: runId },
    data: { status: "running", startedAt },
  });

  try {
    const tools = await loadAgentTools(run.tenantId, run.toolConnectionIds);
    if (tools.length === 0) {
      await markFailed(runId, "No usable tools found for the configured connections");
      return;
    }

    const toolByName = new Map(tools.map((t) => [t.name, t]));
    const executor = new ToolExecutor(run.tenantId, toolByName);

    let credentials: Record<string, unknown>;
    try {
      credentials = JSON.parse(decrypt(run.aiCredentialsEncrypted));
    } catch (err) {
      await markFailed(
        runId,
        `Failed to decrypt AI credentials: ${err instanceof Error ? err.message : String(err)}`,
      );
      return;
    }

    const collected: CollectedEvidence[] = [];
    const toolCallCounts = new Map<string, number>();
    const transcriptTurns: Array<{
      decision: LlmTurn["decision"];
      toolResults: LlmTurn["toolResults"];
      rawResponse: string;
    }> = [];
    let finalSummary: string | null = null;
    let keepSourceIds: string[] | null = null;

    const loop = runLlmLoop(
      {
        instructions: run.instructions,
        controlTitle: run.controlTitle,
        tools,
        ai: { provider: run.aiProvider, model: run.aiModel, credentials },
      },
      async (calls) => {
        const results = [];
        for (const call of calls) {
          toolCallCounts.set(call.name, (toolCallCounts.get(call.name) ?? 0) + 1);
          const { result, evidence } = await executor.execute(call.name);
          collected.push(...evidence);
          results.push(result);
        }
        return results;
      },
    );

    for await (const turn of loop) {
      transcriptTurns.push({
        decision: turn.decision,
        toolResults: turn.toolResults,
        rawResponse: turn.rawResponse,
      });
      if (turn.decision.toolCalls.length === 0) {
        finalSummary = turn.decision.summary ?? null;
        keepSourceIds = turn.decision.keepSourceIds ?? null;
      }
    }

    const toSubmit = filterKeepers(collected, keepSourceIds);

    let createdCount = 0;
    if (toSubmit.length > 0) {
      const submission = await submitAgentEvidence(
        run.tenantId,
        run.controlId,
        runId,
        toSubmit.map((e) => ({
          title: e.title,
          description: e.description,
          sourceType: e.sourceType,
          sourceId: e.sourceId,
          rawData: e.rawData,
          collectedAt: e.collectedAt,
          metadata: { producedBy: e.producedBy, severity: e.severity ?? null },
        })),
      );
      if (!submission.success) {
        throw new Error(submission.error?.message ?? "Evidence submission failed");
      }
      createdCount = submission.data?.created ?? toSubmit.length;
    }

    const completedAt = new Date();
    await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: "succeeded",
        summary: finalSummary,
        evidenceCount: createdCount,
        toolCallSummary: Object.fromEntries(toolCallCounts),
        transcript: transcriptTurns as unknown as object,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        // Wipe credentials at rest as soon as the run is done.
        aiCredentialsEncrypted: null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markFailed(runId, message, startedAt);
  }
}

function filterKeepers(
  collected: CollectedEvidence[],
  keepSourceIds: string[] | null,
): CollectedEvidence[] {
  if (!keepSourceIds || keepSourceIds.length === 0) return collected;
  const keep = new Set(keepSourceIds);
  return collected.filter((e) => keep.has(e.sourceId));
}

async function markFailed(runId: string, message: string, startedAt?: Date): Promise<void> {
  const completedAt = new Date();
  await prisma.agentRun.update({
    where: { id: runId },
    data: {
      status: "failed",
      errorMessage: message,
      errorCount: 1,
      completedAt,
      durationMs: startedAt ? completedAt.getTime() - startedAt.getTime() : null,
      aiCredentialsEncrypted: null,
    },
  });
}

export async function listAgentRuns(
  tenantId: string,
  params: { controlId?: string; limit?: number },
): Promise<AgentRunRecord[]> {
  return prisma.agentRun.findMany({
    where: { tenantId, ...(params.controlId ? { controlId: params.controlId } : {}) },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(params.limit ?? 20, 1), 100),
    select: runSelect,
  });
}

export async function getAgentRun(tenantId: string, id: string) {
  return prisma.agentRun.findFirst({
    where: { id, tenantId },
    select: { ...runSelect, transcript: true, toolCallSummary: true },
  });
}
