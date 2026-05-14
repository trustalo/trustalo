import type { SearchEngine, SearchResult, SearchOptions } from "./interface.js";

const SERPER_BASE_URL = "https://google.serper.dev";

interface SerperOrganicResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

interface SerperResponse {
  organic: SerperOrganicResult[];
  knowledgeGraph?: { description?: string };
}

export class SerperSearchEngine implements SearchEngine {
  readonly name = "serper" as const;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("SerperSearchEngine: apiKey is required");
    this.apiKey = apiKey;
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const maxResults = options?.maxResults ?? 10;

    const response = await fetch(`${SERPER_BASE_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": this.apiKey,
      },
      body: JSON.stringify({
        q: query,
        num: maxResults,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Serper search failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as SerperResponse;

    return (data.organic ?? []).map((r) => ({
      title: r.title,
      url: r.link,
      content: r.snippet,
      score: 1 - (r.position - 1) / maxResults,
    }));
  }
}
