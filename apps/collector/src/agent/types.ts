/**
 * Shared types for the per-control evidence agent.
 *
 * The agent runs entirely inside the collector. It receives natural-
 * language instructions plus a list of `IntegrationConnection` ids it
 * is allowed to touch, then drives an LLM loop that calls integration
 * provider capabilities as tools. Final evidence items are POSTed back
 * to the API's internal bulk endpoint and stamped with the controlId.
 */

import type { EvidenceResult } from "../integrations/core/types.js";

export interface AgentToolDescriptor {
  /** Stable, LLM-facing tool name, e.g. `github__org_members__main-org`. */
  name: string;
  /** Human description used in the LLM system prompt. */
  description: string;
  connectionId: string;
  connectionName: string;
  providerSlug: string;
  providerName: string;
  capability: string;
}

export interface AgentToolCall {
  name: string;
  /** Optional free-form arguments (currently unused; reserved for filters). */
  args?: Record<string, unknown>;
}

export interface AgentToolResult {
  name: string;
  ok: boolean;
  /** Number of evidence items returned by this tool call. */
  count: number;
  /**
   * Compact preview the LLM sees in the next turn so it can decide what to
   * keep / how to write the summary. Heavier `rawData` payloads are
   * dropped before being shown to the model to control token cost.
   */
  preview: Array<{
    title: string;
    description: string;
    sourceType: string;
    severity?: string;
  }>;
  errorMessage?: string;
}

export interface AgentDecision {
  /**
   * Tool calls to execute next. When this is empty the agent is
   * considered done and `summary` + `keepSourceIds` are used to finalise
   * the run.
   */
  toolCalls: AgentToolCall[];
  /**
   * Final human-readable summary of what was collected. Populated on
   * the final turn; ignored otherwise.
   */
  summary?: string;
  /**
   * Subset of previously-collected evidence sourceIds the agent wants
   * to submit to the API. When omitted on the final turn, all collected
   * evidence is submitted.
   */
  keepSourceIds?: string[];
}

export interface AgentRunInput {
  tenantId: string;
  controlId: string;
  controlTitle: string | null;
  instructions: string;
  toolConnectionIds: string[];
  ai: {
    provider: string;
    model: string;
    credentials: Record<string, unknown>;
  };
  trigger: "manual" | "scheduled" | "api";
}

export interface CollectedEvidence extends EvidenceResult {
  /** Which tool produced this item — used for transcript/keep filter. */
  producedBy: string;
}
