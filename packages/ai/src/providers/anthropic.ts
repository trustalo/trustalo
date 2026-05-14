import type {
  AIProvider,
  AIProviderCredentials,
  ChatCompletionOptions,
  ChatCompletionResult,
} from "../types.js";
import { AIProviderError, wrapProviderError } from "../errors.js";

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicResponse {
  content: { type: string; text: string }[];
  model: string;
  usage: { input_tokens: number; output_tokens: number };
}

export function createAnthropicProvider(
  credentials: AIProviderCredentials,
  model: string,
): AIProvider {
  const baseUrl = credentials.baseUrl || "https://api.anthropic.com";

  return {
    async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
      const systemMessage = options.messages.find((m) => m.role === "system");
      const chatMessages: AnthropicMessage[] = options.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const body: Record<string, unknown> = {
        model,
        messages: chatMessages,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
      };

      if (systemMessage) {
        body.system = systemMessage.content;
      }

      let response: Response;
      try {
        response = await fetch(`${baseUrl}/v1/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": credentials.apiKey ?? "",
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(body),
        });
      } catch (err) {
        // Network failure (DNS, connection refused, abort) — never
        // includes the api key but does include the URL/host. Wrap.
        throw wrapProviderError("Anthropic", err);
      }

      if (!response.ok) {
        // Discard the upstream body — it can echo our key fragments
        // back. The status code alone is enough for the wrapper to
        // produce a meaningful public message.
        await response.text().catch(() => "");
        throw new AIProviderError({
          kind:
            response.status === 401 || response.status === 403
              ? "auth"
              : response.status === 429
                ? "rate_limit"
                : response.status >= 500
                  ? "server_error"
                  : "bad_request",
          provider: "Anthropic",
          status: response.status,
          publicMessage:
            response.status === 401 || response.status === 403
              ? "Anthropic rejected our credentials. Please contact your administrator to re-check the AI provider configuration."
              : response.status === 429
                ? "Anthropic is rate-limiting requests right now. Please retry in a moment."
                : response.status >= 500
                  ? "Anthropic is currently unavailable. Please try again shortly."
                  : "Anthropic could not process the request.",
        });
      }

      const data = (await response.json()) as AnthropicResponse;
      const textBlock = data.content.find((c) => c.type === "text");

      return {
        content: textBlock?.text ?? "",
        model: data.model,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
      };
    },
  };
}
