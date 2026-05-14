import type { SearchEngine, SearchResult, SearchOptions } from "./interface.js";

const TAVILY_BASE_URL = "https://api.tavily.com";

interface TavilyResponse {
  results: { title: string; url: string; content: string; score: number }[];
  answer?: string;
}

export class TavilySearchEngine implements SearchEngine {
  readonly name = "tavily" as const;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("TavilySearchEngine: apiKey is required");
    this.apiKey = apiKey;
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const maxResults = options?.maxResults ?? 10;

    const response = await fetch(`${TAVILY_BASE_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        max_results: maxResults,
        search_depth: "advanced",
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Tavily search failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as TavilyResponse;

    return (data.results ?? []).map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score ?? 0,
    }));
  }
}
