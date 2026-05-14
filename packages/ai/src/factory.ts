import type { AIProvider, AIProviderCredentials } from "./types.js";
import { createOpenAIProvider } from "./providers/openai.js";
import { createAnthropicProvider } from "./providers/anthropic.js";
import { createBedrockProvider } from "./providers/bedrock.js";
import { createOpenRouterProvider } from "./providers/openrouter.js";

export function createAIProvider(credentials: AIProviderCredentials, model: string): AIProvider {
  switch (credentials.provider) {
    case "openai":
      return createOpenAIProvider(credentials, model);
    case "anthropic":
      return createAnthropicProvider(credentials, model);
    case "bedrock":
      return createBedrockProvider(credentials, model);
    case "openrouter":
      return createOpenRouterProvider(credentials, model);
    default:
      throw new Error(`Unsupported AI provider: ${credentials.provider}`);
  }
}
