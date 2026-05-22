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

export interface SubmitEvidenceItemWire {
  title: string;
  description: string;
  /**
   * Authoritative routing key. The API uses this to look up
   * IntegrationCheckControl bindings and attach the resulting Evidence
   * row(s) to the bound tenant Controls.
   */
  manifestKey: string;
  /**
   * @deprecated Mirrors `manifestKey`. Older API builds still read this
   * field, so we forward both for one release.
   */
  sourceType?: string;
  sourceId: string;
  rawData: Record<string, unknown>;
  severity?: "critical" | "high" | "medium" | "low" | "info";
  /**
   * @deprecated Free-form control codes from before the manifest-driven
   * binding pipeline. Newer evidence is routed by `manifestKey`.
   */
  controlMapping?: string[];
  collectedAt: string;
  /**
   * Optional pre-resolved tenant Control ids the collector wants the
   * API to attach the evidence to. When the binder runs at connect
   * time, the collector knows the controlIds upfront and can short-
   * circuit the API's resolution lookup.
   */
  controlIds?: string[];
}

/**
 * Submit collected evidence to the main Trustalo API for storage and
 * control mapping. `manifestKey` is the authoritative routing field;
 * the API looks up `IntegrationCheckControl` bindings on the collector
 * side, but this helper can also pre-pass `controlIds` when the caller
 * already resolved them (e.g. the runner with binding lookups in hand).
 */
export async function submitEvidence(
  tenantId: string,
  evidence: (EvidenceResult & { controlIds?: string[] })[],
): Promise<ApiResponse<{ created: number; orphans: number }>> {
  // Internal HMAC-authed endpoint; collector→API traffic never carries
  // a user JWT. The handler creates one Evidence row per
  // (manifestKey × controlId) pair; items with empty `controlIds[]`
  // are counted as orphans and not persisted (the runner already
  // emits a structured warning for those upstream).
  return apiRequest("POST", "/internal/evidence/bulk", tenantId, {
    evidence: evidence.map<SubmitEvidenceItemWire>((e) => ({
      title: e.title,
      description: e.description,
      manifestKey: e.manifestKey,
      sourceType: e.sourceType ?? e.manifestKey,
      sourceId: e.sourceId,
      rawData: e.rawData,
      severity: e.severity,
      controlMapping: e.controlMapping,
      controlIds: e.controlIds,
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

/**
 * Resolved-ref shape returned by the API's
 * `POST /internal/controls/resolve-framework-refs` endpoint. Kept in
 * sync with `ResolvedRef` in
 * `apps/api/src/modules/internal/control-binding.ts`.
 */
export interface ResolvedFrameworkRef {
  framework: string;
  requirement: string;
  requirementId: string | null;
  requirementTitle: string | null;
  controlIds: string[];
  reason?:
    | "framework_not_seeded"
    | "framework_not_enabled"
    | "requirement_not_seeded"
    | "no_control_assignments"
    | "controls_not_applicable";
}

/**
 * Fetch the tenant's `integrationAutoBindMode` setting from the API.
 * Hits the internal HMAC-authed endpoint added in the tenant-policy
 * step; returns `null` if the endpoint isn't available (e.g. older
 * API builds) so the binder can fall back to its conservative
 * `DEFAULT_AUTO_BIND_MODE`.
 */
export async function fetchTenantAutoBindMode(
  tenantId: string,
): Promise<"auto" | "suggest" | "off" | null> {
  const path = "/internal/tenants/auto-bind-mode";
  const url = `${API_BASE_URL}${path}`;
  const signature = signServiceRequest({
    caller: "collector",
    method: "GET",
    path,
    body: "",
  });
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { "X-Organization-Id": tenantId, ...toHeaderRecord(signature) },
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;
  const body = (await response.json().catch(() => null)) as ApiResponse<{
    mode: "auto" | "suggest" | "off";
  }> | null;
  if (!body?.success || !body.data) return null;
  return body.data.mode;
}

/**
 * Wire payload accepted by `POST /internal/coverage-gaps/escalate`.
 * Kept in sync with `escalateGapBody` in
 * `apps/api/src/modules/internal/router.ts`.
 */
export interface EscalateGapWire {
  gapId: string;
  integrationCheckId: string;
  severity: "low" | "medium" | "high" | "critical";
  reason: string;
  affectedControlIds: string[];
  openedAt: string;
  lastErrorMessage?: string | null;
  createControlWeakness?: boolean;
  /**
   * Flag the API uses to suppress per-tenant ControlWeakness creation
   * when the same provider is failing across many tenants. The audit
   * log still records the escalation; the platform team owns the
   * recovery.
   */
  platformOutage?: boolean;
}

/**
 * POST a single coverage-gap escalation to the API. The API writes an
 * audit-log entry and optionally creates a ControlWeakness row. Returns
 * the created `controlWeaknessId` (or `null`) so the caller can persist
 * it back on the gap and avoid duplicate weaknesses next tick.
 */
export async function escalateCoverageGap(
  tenantId: string,
  payload: EscalateGapWire,
): Promise<{ controlWeaknessId: string | null }> {
  const result = await apiRequest<{ controlWeaknessId: string | null }>(
    "POST",
    "/internal/coverage-gaps/escalate",
    tenantId,
    payload,
  );
  if (!result.success || !result.data) {
    throw new Error(`Gap escalation failed: ${JSON.stringify(result.error ?? result)}`);
  }
  return result.data;
}

/**
 * Resolve a batch of manifest FrameworkRefs against a tenant's
 * adopted frameworks + Control catalogue. The collector calls this at
 * connect time (binder) and on every reconciler tick.
 *
 * Refs that don't resolve to any controls come back with
 * `controlIds: []` and a `reason` — that's normal and not an error;
 * the binder records them as "unresolved" so the UI can show "this
 * integration will contribute to N controls; M refs aren't covered by
 * your adopted frameworks yet".
 */
export async function resolveFrameworkRefs(
  tenantId: string,
  refs: ReadonlyArray<{ framework: string; requirement: string; note?: string }>,
): Promise<ResolvedFrameworkRef[]> {
  const path = "/internal/controls/resolve-framework-refs";
  const url = `${API_BASE_URL}${path}`;
  const serializedBody = JSON.stringify({ refs });
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
      `Framework-ref resolution failed: ${response.status} ${response.statusText} — ${JSON.stringify(errorBody)}`,
    );
  }
  const body = (await response.json()) as ApiResponse<{ refs: ResolvedFrameworkRef[] }>;
  if (!body.success || !body.data) {
    throw new Error(
      `Framework-ref resolution returned non-success: ${JSON.stringify(body.error ?? body)}`,
    );
  }
  return body.data.refs;
}
