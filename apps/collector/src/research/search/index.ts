export type {
  SearchEngine,
  SearchEngineConfig,
  SearchEngineType,
  SearchResult,
  SearchOptions,
} from "./interface.js";

export { TavilySearchEngine } from "./tavily.js";
export { SerperSearchEngine } from "./serper.js";
export { GoogleSearchEngine } from "./google.js";
export { BraveSearchEngine } from "./brave.js";

import type { SearchEngine, SearchEngineConfig, SearchEngineType } from "./interface.js";
import { TavilySearchEngine } from "./tavily.js";
import { SerperSearchEngine } from "./serper.js";
import { GoogleSearchEngine } from "./google.js";
import { BraveSearchEngine } from "./brave.js";

/**
 * Create a search engine from config. Reads from the provided config object,
 * falling back to environment variables if config values are not set.
 */
export function createSearchEngine(config?: Partial<SearchEngineConfig>): SearchEngine {
  const engineType: SearchEngineType =
    config?.engine ?? (process.env["SEARCH_ENGINE"] as SearchEngineType) ?? "tavily";

  switch (engineType) {
    case "tavily": {
      const apiKey = config?.tavilyApiKey ?? process.env["TAVILY_API_KEY"] ?? "";
      return new TavilySearchEngine(apiKey);
    }

    case "serper": {
      const apiKey = config?.serperApiKey ?? process.env["SERPER_API_KEY"] ?? "";
      return new SerperSearchEngine(apiKey);
    }

    case "google": {
      const apiKey = config?.googleApiKey ?? process.env["GOOGLE_API_KEY"] ?? "";
      const cx = config?.googleSearchEngineId ?? process.env["GOOGLE_SEARCH_ENGINE_ID"] ?? "";
      return new GoogleSearchEngine(apiKey, cx);
    }

    case "brave": {
      const apiKey = config?.braveApiKey ?? process.env["BRAVE_API_KEY"] ?? "";
      return new BraveSearchEngine(apiKey);
    }

    default:
      throw new Error(
        `Unsupported search engine: "${engineType}". Available: tavily, serper, google, brave`,
      );
  }
}
