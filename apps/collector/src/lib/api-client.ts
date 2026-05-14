import type { EvidenceResult } from "../integrations/core/types.js";
import { signServiceRequest, toHeaderRecord } from "./service-auth.js";

const API_BASE_URL = process.env["API_BASE_URL"] ?? "http://localhost:4000";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

interface ControlMapping {
  controlId: string;
  controlCode: string;
  evidenceTypes: string[];
}

async function apiRequest<T>(
  method: string,
  path: string,
  tenantId: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`;
  const serializedBody = body !== undefined ? JSON.stringify(body) : undefined;
  const signature = signServiceRequest({
    caller: "collector",
    method,
    path,
    body: serializedBody ?? null,
  });

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Organization-Id": tenantId,
      ...toHeaderRecord(signature),
    },
    body: serializedBody,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} — ${JSON.stringify(errorBody)}`,
    );
  }

  return response.json() as Promise<ApiResponse<T>>;
}

/**
 * Submit collected evidence to the main Trustalo API for storage and control mapping.
 */
export async function submitEvidence(
  tenantId: string,
  evidence: EvidenceResult[],
): Promise<ApiResponse<{ created: number; updated: number }>> {
  return apiRequest("POST", "/api/v1/evidence/bulk", tenantId, {
    evidence: evidence.map((e) => ({
      title: e.title,
      description: e.description,
      sourceType: e.sourceType,
      sourceId: e.sourceId,
      rawData: e.rawData,
      severity: e.severity,
      controlMapping: e.controlMapping,
      collectedAt: e.collectedAt.toISOString(),
    })),
  });
}

/**
 * Fetch control mappings from the API so the collector can tag evidence
 * with the appropriate compliance controls.
 */
export async function getControlMappings(tenantId: string): Promise<ApiResponse<ControlMapping[]>> {
  return apiRequest("GET", "/api/v1/controls/mappings", tenantId);
}

/**
 * Bulk-submit evidence collected by the per-control evidence agent.
 * This hits the API's `/internal/...` namespace (shared-secret auth, no
 * user JWT) because evidence-agent runs are kicked off by a service-to-
 * service call rather than an authenticated browser session.
 */
export interface AgentEvidenceItem {
  title: string;
  description?: string | null;
  sourceType: string;
  sourceId: string;
  externalUrl?: string | null;
  rawData?: Record<string, unknown>;
  collectedAt: Date;
  metadata?: Record<string, unknown> | null;
}

export async function submitAgentEvidence(
  tenantId: string,
  controlId: string,
  agentRunId: string,
  evidence: AgentEvidenceItem[],
): Promise<ApiResponse<{ created: number; ids: string[] }>> {
  const path = "/internal/agent-evidence/bulk";
  const url = `${API_BASE_URL}${path}`;
  const serializedBody = JSON.stringify({
    controlId,
    agentRunId,
    evidence: evidence.map((e) => ({
      ...e,
      collectedAt: e.collectedAt.toISOString(),
    })),
  });
  const signature = signServiceRequest({
    caller: "collector",
    method: "POST",
    path,
    body: serializedBody,
  });
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Organization-Id": tenantId,
      ...toHeaderRecord(signature),
    },
    body: serializedBody,
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      `Agent evidence submission failed: ${response.status} ${response.statusText} — ${JSON.stringify(errorBody)}`,
    );
  }
  return response.json() as Promise<ApiResponse<{ created: number; ids: string[] }>>;
}
