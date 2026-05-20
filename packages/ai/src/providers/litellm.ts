/**
 * LiteLLM proxy provider.
 *
 * LiteLLM (https://github.com/BerriAI/litellm) is an OpenAI-API-compatible
 * gateway that fronts ~100 upstream model providers. Trustalo uses it for
 * two distinct purposes:
 *
 *  1. **Bring-your-own proxy** (core / free): an operator can stand up
 *     LiteLLM in their own VPC, configure providers + virtual keys there,
 *     and point the per-org `AIProviderConfig.baseUrl` at it. The provider
 *     row stores the LiteLLM virtual key in `apiKey`. No EE license is
 *     required for this use case — it is just another OpenAI-compatible
 *     endpoint.
 *
 *  2. **Trustalo-managed routing + metered billing** (EE — see
 *     `packages/billing.ee` and `apps/api/src/modules/billing.ee`): the
 *     SaaS deployment forces every tenant's traffic through Trustalo's
 *     own LiteLLM proxy with a per-tenant virtual key. The proxy then
 *     reports usage + cost back to the API which credits/debits the
 *     tenant's prepaid wallet and renders the dashboard. EE-only because
 *     the metering + Stripe surface is paywalled.
 *
 * Implementation detail: LiteLLM speaks the OpenAI Chat Completions
 * format verbatim, including `response_format: { type: "json_object" }`,
 * so this provider is a thin wrapper around the `openai` SDK pointed at
 * the proxy URL. The tenant + feature are forwarded in the `metadata`
 * field (recognised by LiteLLM's spend logger) and `user` (recognised
 * by OpenAI-compatible abuse tracking). NEVER pass real org credentials
 * here — the proxy authenticates with the virtual key in `credentials.apiKey`.
 */

import OpenAI from "openai";
import type {
  AIProvider,
  AIProviderCredentials,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "../types.js";
import { wrapProviderError } from "../errors.js";

export interface LiteLLMProviderOptions {
  /**
   * Forwarded as `user` and `metadata.trustalo_tenant_id` on every
   * upstream call so LiteLLM's spend log can attribute the cost to the
   * right tenant. Required in managed mode; optional in BYO mode.
   */
  tenantId?: string;
  /** Forwarded as `metadata.trustalo_feature` for per-feature cost reports. */
  feature?: string;
}

export function createLiteLLMProvider(
  credentials: AIProviderCredentials,
  model: string,
  options: LiteLLMProviderOptions = {},
): AIProvider {
  if (!credentials.baseUrl) {
    throw new Error("LiteLLM provider requires credentials.baseUrl (the proxy URL)");
  }
  if (!credentials.apiKey) {
    throw new Error("LiteLLM provider requires credentials.apiKey (the virtual key)");
  }

  const client = new OpenAI({
    apiKey: credentials.apiKey,
    baseURL: credentials.baseUrl.replace(/\/+$/, ""),
  });

  return {
    async chat(opts: ChatCompletionOptions): Promise<ChatCompletionResult> {
      // Build the OpenAI request body. The `metadata` field is a
      // LiteLLM-specific extension (not part of the upstream OpenAI
      // schema), so we widen via a typed-but-permissive shape and pass
      // the request through the SDK's standard non-streaming variant.
      const body: Record<string, unknown> = {
        model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 4096,
        stream: false,
      };
      if (opts.responseFormat === "json") {
        body.response_format = { type: "json_object" };
      }
      if (options.tenantId) {
        body.user = options.tenantId;
      }
      if (options.tenantId || options.feature) {
        body.metadata = {
          ...(options.tenantId && { trustalo_tenant_id: options.tenantId }),
          ...(options.feature && { trustalo_feature: options.feature }),
        };
      }

      let response;
      try {
        // Cast through `unknown` because the SDK's union overload
        // (`stream: true` → Stream, `stream: false` → ChatCompletion)
        // can't narrow from a `Record<string, unknown>`. Setting
        // `stream: false` above guarantees the non-streaming variant.
        response = await client.chat.completions.create(
          body as unknown as Parameters<typeof client.chat.completions.create>[0] & {
            stream: false;
          },
        );
      } catch (err) {
        throw wrapProviderError("LiteLLM", err);
      }

      if (!("choices" in response)) {
        // Defensive: should never happen since stream=false.
        throw new Error("LiteLLM returned a streaming response unexpectedly");
      }

      const choice = response.choices[0];
      return {
        content: choice?.message?.content ?? "",
        model: response.model,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
      };
    },
  };
}
