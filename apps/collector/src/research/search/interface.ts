export type SearchEngineType = "tavily" | "serper" | "google" | "brave";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface SearchOptions {
  maxResults?: number;
}

export interface SearchEngine {
  readonly name: SearchEngineType;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}

export interface SearchEngineConfig {
  engine: SearchEngineType;

  // Tavily
  tavilyApiKey?: string;

  // Serper
  serperApiKey?: string;

  // Google Custom Search
  googleApiKey?: string;
  googleSearchEngineId?: string;

  // Brave Search
  braveApiKey?: string;
}
