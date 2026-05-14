import OpenAI from "openai";
import type {
  AIProvider,
  AIProviderCredentials,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "../types.js";
import { wrapProviderError } from "../errors.js";

export function createOpenRouterProvider(
  credentials: AIProviderCredentials,
  model: string,
): AIProvider {
  const client = new OpenAI({
    apiKey: credentials.apiKey,
    baseURL: credentials.baseUrl || "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://trustalo.app",
      "X-Title": "Trustalo",
    },
  });

  return {
    async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
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
        throw wrapProviderError("OpenRouter", err);
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
