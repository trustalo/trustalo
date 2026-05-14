/**
 * Drives the LLM "tool-call" loop for one evidence-agent run.
 *
 * We intentionally use a plain JSON-protocol on top of `chat()` rather
 * than each provider's native function-calling API: the @trustalo/ai
 * package abstracts over four very different vendor SDKs and we don't
 * want this module to fork on provider. Cost is a few extra tokens per
 * turn for the JSON envelope — well worth the portability.
 */

import {
  createAIProvider,
  type AIProvider,
  type AIProviderCredentials,
  type AIProviderType,
  type ChatMessage,
} from "@trustalo/ai";
import type { AgentDecision, AgentToolDescriptor, AgentToolResult } from "./types.js";

const MAX_TURNS = 6;

export interface LlmLoopInput {
  instructions: string;
  controlTitle: string | null;
  tools: AgentToolDescriptor[];
  ai: { provider: string; model: string; credentials: Record<string, unknown> };
}

export interface LlmTurn {
  decision: AgentDecision;
  toolResults: AgentToolResult[];
  rawResponse: string;
}

function systemPrompt(input: LlmLoopInput): string {
  const toolList = input.tools.map((t) => `- ${t.name}: ${t.description}`).join("\n");
  return [
    "You are Trustalo's Evidence Agent.",
    `Your job is to gather audit-grade evidence for the compliance control titled "${input.controlTitle ?? "(untitled)"}".`,
    "You operate by calling tools that wrap the user's already-connected integrations. Each tool maps to a single capability of one connection.",
    "",
    "Rules:",
    "1. Read the user's natural-language instructions carefully and pick the smallest set of tools needed to satisfy them.",
    "2. Respond ONLY with a single JSON object matching this schema:",
    '   { "toolCalls": [ { "name": "<tool>", "args"?: {...} } ], "summary"?: "<final summary>", "keepSourceIds"?: ["<sourceId>", ...] }',
    "3. To execute tools, return a non-empty `toolCalls` array. To finish the run, return an empty `toolCalls` array and provide a `summary`.",
    "4. Never invent tool names. Only use tools listed below verbatim.",
    "5. When finishing, optionally narrow the evidence by listing the `sourceId`s you want to submit in `keepSourceIds`. Omit it to submit everything that was collected.",
    "",
    "Available tools:",
    toolList || "(no tools available)",
  ].join("\n");
}

function userPrompt(input: LlmLoopInput, history: LlmTurn[]): string {
  const parts: string[] = [];
  parts.push("Instructions from the operator:\n" + input.instructions.trim());
  if (history.length > 0) {
    parts.push("\nResults from prior tool calls (most recent last):");
    for (const turn of history) {
      for (const r of turn.toolResults) {
        parts.push(
          `\n[${r.name}] ok=${r.ok} count=${r.count}` +
            (r.errorMessage ? ` error=${r.errorMessage}` : "") +
            (r.preview.length
              ? "\n  preview:\n" +
                r.preview
                  .map(
                    (p, i) =>
                      `   ${i + 1}. ${p.title} — ${p.description} (${p.sourceType}${p.severity ? ", " + p.severity : ""})`,
                  )
                  .join("\n")
              : ""),
        );
      }
    }
  }
  parts.push("\nReturn the next JSON action.");
  return parts.join("\n");
}

function parseDecision(raw: string): AgentDecision {
  const cleaned = stripFences(raw).trim();
  const parsed = JSON.parse(cleaned) as Partial<AgentDecision>;
  const toolCalls = Array.isArray(parsed.toolCalls)
    ? parsed.toolCalls.filter((c) => c && typeof c.name === "string")
    : [];
  return {
    toolCalls,
    summary: typeof parsed.summary === "string" ? parsed.summary : undefined,
    keepSourceIds: Array.isArray(parsed.keepSourceIds)
      ? parsed.keepSourceIds.filter((s) => typeof s === "string")
      : undefined,
  };
}

function stripFences(s: string): string {
  // Models occasionally wrap JSON in ```json … ``` despite response_format=json.
  return s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
}

function buildProvider(ai: LlmLoopInput["ai"]): AIProvider {
  const credentials = {
    provider: ai.provider as AIProviderType,
    ...ai.credentials,
  } as AIProviderCredentials;
  return createAIProvider(credentials, ai.model);
}

export async function* runLlmLoop(
  input: LlmLoopInput,
  executeTools: (calls: { name: string }[]) => Promise<AgentToolResult[]>,
): AsyncGenerator<LlmTurn, void, void> {
  const provider = buildProvider(input.ai);
  const sys = systemPrompt(input);
  const history: LlmTurn[] = [];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const messages: ChatMessage[] = [
      { role: "system", content: sys },
      { role: "user", content: userPrompt(input, history) },
    ];

    const response = await provider.chat({
      messages,
      responseFormat: "json",
      temperature: 0.2,
      maxTokens: 1500,
    });

    let decision: AgentDecision;
    try {
      decision = parseDecision(response.content);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      yield {
        decision: { toolCalls: [], summary: `Agent returned malformed JSON: ${message}` },
        toolResults: [],
        rawResponse: response.content,
      };
      return;
    }

    if (decision.toolCalls.length === 0) {
      yield { decision, toolResults: [], rawResponse: response.content };
      return;
    }

    const toolResults = await executeTools(decision.toolCalls);
    const completedTurn: LlmTurn = { decision, toolResults, rawResponse: response.content };
    history.push(completedTurn);
    yield completedTurn;
  }

  // Hit the turn budget without the agent declaring completion.
  yield {
    decision: {
      toolCalls: [],
      summary: `Stopped after ${MAX_TURNS} turns without a final answer.`,
    },
    toolResults: [],
    rawResponse: "",
  };
}
