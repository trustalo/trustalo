// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0
//
// Typed wrapper around the subset of LiteLLM's admin REST that Trustalo
// needs for provisioning + spend reporting. Documented contract surface
// only; LiteLLM occasionally adds fields, which is fine because every
// response shape is parsed through Zod with `passthrough` so unknown
// keys are preserved on the typed return value (the consumer just won't
// see them in IntelliSense).
//
// Endpoints implemented (LiteLLM Proxy v1.x admin API):
//   POST   /key/generate            - mint a new virtual key
//   POST   /key/update              - rotate budget/allowlist/duration
//   POST   /key/delete              - revoke
//   GET    /key/info                - look up by key
//   POST   /spend/logs              - paginated spend log (since timestamp)
//   GET    /global/spend/keys       - aggregate spend per key
//
// All requests:
//   - Authenticate with `Authorization: Bearer ${masterKey}`
//   - Timeout at 15s
//   - Throw a typed LiteLLMAdminError on non-2xx, preserving the LiteLLM
//     error envelope so the caller (provisioning code) can surface a
//     helpful message in the Trustalo admin UI.

import { z } from "zod";

export interface LiteLLMAdminClientOptions {
  baseUrl: string;
  masterKey: string;
  /** Defaults to 15_000 ms. Tighten in tests to fail fast. */
  timeoutMs?: number;
  /** Override `fetch` for testing. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

const DEFAULT_TIMEOUT_MS = 15_000;

export class LiteLLMAdminError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = "LiteLLMAdminError";
  }
}

// ── Schemas ───────────────────────────────────────────────────────

const keyInfoSchema = z
  .object({
    key: z.string().nullish(),
    token: z.string().nullish(),
    key_name: z.string().nullish(),
    user_id: z.string().nullish(),
    team_id: z.string().nullish(),
    max_budget: z.number().nullish(),
    spend: z.number().nullish(),
    models: z.array(z.string()).nullish(),
    rpm_limit: z.number().nullish(),
    tpm_limit: z.number().nullish(),
    expires: z.string().nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .passthrough();

const generateKeyResponseSchema = z
  .object({
    key: z.string(),
    expires: z.string().nullish(),
    user_id: z.string().nullish(),
    team_id: z.string().nullish(),
    models: z.array(z.string()).nullish(),
    max_budget: z.number().nullish(),
    spend: z.number().nullish(),
    key_name: z.string().nullish(),
    token: z.string().nullish(),
  })
  .passthrough();

const spendLogEntrySchema = z
  .object({
    request_id: z.string(),
    api_key: z.string().nullish(),
    user: z.string().nullish(),
    team_id: z.string().nullish(),
    model: z.string(),
    spend: z.number(),
    total_tokens: z.number().nullish(),
    prompt_tokens: z.number().nullish(),
    completion_tokens: z.number().nullish(),
    startTime: z.string().nullish(),
    endTime: z.string().nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .passthrough();

export type LiteLLMKeyInfo = z.infer<typeof keyInfoSchema>;
export type LiteLLMSpendLogEntry = z.infer<typeof spendLogEntrySchema>;

export class LiteLLMAdminClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: LiteLLMAdminClientOptions) {
    if (!opts.baseUrl) throw new Error("LiteLLMAdminClient: baseUrl is required");
    if (!opts.masterKey) throw new Error("LiteLLMAdminClient: masterKey is required");
    this.baseUrl = stripTrailingSlashes(opts.baseUrl);
    this.headers = {
      Authorization: `Bearer ${opts.masterKey}`,
      "Content-Type": "application/json",
    };
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  /**
   * Mint a fresh virtual key. Idempotency is the caller's responsibility
   * — `team_id` + `key_name` typically suffice as a natural key on the
   * LiteLLM side (re-generating with the same name updates the existing
   * key on most LiteLLM versions; older versions just create a duplicate).
   */
  async generateKey(args: {
    keyAlias: string;
    teamId?: string;
    userId?: string;
    models: string[];
    /** Max budget in USD (LiteLLM's unit). `null` for unlimited. */
    maxBudgetUsd: number | null;
    rpmLimit?: number;
    tpmLimit?: number;
    metadata?: Record<string, unknown>;
    /** ISO-8601 duration string, e.g. "365d" for a 1y key. Optional. */
    duration?: string;
  }): Promise<{ key: string; raw: LiteLLMKeyInfo }> {
    const body: Record<string, unknown> = {
      key_alias: args.keyAlias,
      models: args.models,
      metadata: args.metadata,
      ...(args.teamId !== undefined && { team_id: args.teamId }),
      ...(args.userId !== undefined && { user_id: args.userId }),
      ...(args.maxBudgetUsd !== null && { max_budget: args.maxBudgetUsd }),
      ...(args.rpmLimit !== undefined && { rpm_limit: args.rpmLimit }),
      ...(args.tpmLimit !== undefined && { tpm_limit: args.tpmLimit }),
      ...(args.duration !== undefined && { duration: args.duration }),
    };

    const raw = await this.request("POST", "/key/generate", body, generateKeyResponseSchema);
    return { key: raw.key, raw };
  }

  async updateKey(args: {
    key: string;
    maxBudgetUsd?: number | null;
    models?: string[];
    metadata?: Record<string, unknown>;
    rpmLimit?: number;
    tpmLimit?: number;
  }): Promise<LiteLLMKeyInfo> {
    const body: Record<string, unknown> = { key: args.key };
    if (args.maxBudgetUsd !== undefined) body.max_budget = args.maxBudgetUsd;
    if (args.models !== undefined) body.models = args.models;
    if (args.metadata !== undefined) body.metadata = args.metadata;
    if (args.rpmLimit !== undefined) body.rpm_limit = args.rpmLimit;
    if (args.tpmLimit !== undefined) body.tpm_limit = args.tpmLimit;

    return this.request("POST", "/key/update", body, keyInfoSchema);
  }

  async deleteKey(key: string): Promise<void> {
    await this.requestRaw("POST", "/key/delete", { keys: [key] });
  }

  async keyInfo(key: string): Promise<LiteLLMKeyInfo> {
    return this.request(
      "GET",
      `/key/info?key=${encodeURIComponent(key)}`,
      undefined,
      keyInfoSchema,
    );
  }

  /**
   * Paginated spend log. LiteLLM's endpoint takes a request body even for
   * what is logically a GET; we go with POST to match.
   */
  async spendLogs(args: {
    apiKey?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): Promise<LiteLLMSpendLogEntry[]> {
    const body: Record<string, unknown> = {};
    if (args.apiKey) body.api_key = args.apiKey;
    if (args.startTime) body.start_date = args.startTime.toISOString();
    if (args.endTime) body.end_date = args.endTime.toISOString();
    if (args.limit) body.limit = args.limit;

    const raw = await this.requestRaw("POST", "/spend/logs", body);
    const arr = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as any).data)
        ? (raw as any).data
        : [];
    return arr.map((row: unknown) => spendLogEntrySchema.parse(row));
  }

  // ── HTTP ─────────────────────────────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    schema: z.ZodSchema<T>,
  ): Promise<T> {
    const raw = await this.requestRaw(method, path, body);
    return schema.parse(raw);
  }

  private async requestRaw(method: string, path: string, body: unknown): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: this.headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const text = await res.text();
      let parsed: unknown = text;
      if (text.length > 0) {
        try {
          parsed = JSON.parse(text);
        } catch {
          // Non-JSON response is unexpected from LiteLLM admin endpoints.
          // Fall through with the text and let the caller's status check
          // surface the parse failure as a non-2xx error.
        }
      }
      if (!res.ok) {
        const message =
          parsed && typeof parsed === "object" && "detail" in parsed
            ? String((parsed as { detail?: unknown }).detail ?? "")
            : typeof parsed === "string"
              ? parsed
              : `HTTP ${res.status}`;
        throw new LiteLLMAdminError(res.status, parsed, `LiteLLM ${method} ${path}: ${message}`);
      }
      return parsed;
    } finally {
      clearTimeout(timer);
    }
  }
}

function stripTrailingSlashes(input: string): string {
  let end = input.length;
  while (end > 0 && input.charCodeAt(end - 1) === 47) {
    end--;
  }
  return end === input.length ? input : input.slice(0, end);
}
