import OpenAI from "openai";
import type {
  AIProvider,
  AIProviderCredentials,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "../types.js";
import { wrapProviderError } from "../errors.js";

export function createOpenAIProvider(
  credentials: AIProviderCredentials,
  model: string,
): AIProvider {
  const client = new OpenAI({ apiKey: credentials.apiKey });

  return {
    async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
      // Any throw from the OpenAI SDK (`APIError`, network error, etc.)
      // is converted to a sanitized AIProviderError before propagating.
      // Raw SDK errors leak the partially-redacted API key in their
      // `.message` (e.g. "401 Incorrect API key provided: sk-proj-***D6EA")
      // which must NEVER reach end users in the SaaS deployment.
      let response;
      try {
        response = await client.chat.completions.create({
          model,
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 4096,
          ...(options.responseFormat === "json" && {
            response_format: { type: "json_object" },
          }),
        });
      } catch (err) {
        throw wrapProviderError("OpenAI", err);
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
