import type { AIProvider, AIProviderCredentials } from "./types.js";
import { createOpenAIProvider } from "./providers/openai.js";
import { createAnthropicProvider } from "./providers/anthropic.js";
import { createBedrockProvider } from "./providers/bedrock.js";
import { createOpenRouterProvider } from "./providers/openrouter.js";
import { createLiteLLMProvider, type LiteLLMProviderOptions } from "./providers/litellm.js";

export interface CreateAIProviderOptions {
  /**
   * Optional context forwarded to providers that support per-request
   * attribution (today: `litellm`, where the values land in the
   * proxy's spend log and the OpenAI-compatible `user` field). Safe
   * to omit — non-attributing providers ignore the field entirely.
   */
  litellm?: LiteLLMProviderOptions;
}

export function createAIProvider(
  credentials: AIProviderCredentials,
  model: string,
  options: CreateAIProviderOptions = {},
): AIProvider {
  switch (credentials.provider) {
    case "openai":
      return createOpenAIProvider(credentials, model);
    case "anthropic":
      return createAnthropicProvider(credentials, model);
    case "bedrock":
      return createBedrockProvider(credentials, model);
    case "openrouter":
      return createOpenRouterProvider(credentials, model);
    case "litellm":
      return createLiteLLMProvider(credentials, model, options.litellm);
    default:
      throw new Error(`Unsupported AI provider: ${credentials.provider as string}`);
  }
}
