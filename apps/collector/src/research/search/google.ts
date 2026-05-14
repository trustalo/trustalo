import type { SearchEngine, SearchResult, SearchOptions } from "./interface.js";

const GOOGLE_CSE_BASE_URL = "https://www.googleapis.com/customsearch/v1";

interface GoogleCSEItem {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

interface GoogleCSEResponse {
  items?: GoogleCSEItem[];
  searchInformation?: { totalResults: string };
}

export class GoogleSearchEngine implements SearchEngine {
  readonly name = "google" as const;
  private apiKey: string;
  private searchEngineId: string;

  constructor(apiKey: string, searchEngineId: string) {
    if (!apiKey) throw new Error("GoogleSearchEngine: apiKey is required");
    if (!searchEngineId) throw new Error("GoogleSearchEngine: searchEngineId (cx) is required");
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    // Google CSE max is 10 per request
    const maxResults = Math.min(options?.maxResults ?? 10, 10);

    const params = new URLSearchParams({
      key: this.apiKey,
      cx: this.searchEngineId,
      q: query,
      num: String(maxResults),
    });

    const response = await fetch(`${GOOGLE_CSE_BASE_URL}?${params}`);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google CSE search failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as GoogleCSEResponse;

    return (data.items ?? []).map((item, index) => ({
      title: item.title,
      url: item.link,
      content: item.snippet,
      score: 1 - index / maxResults,
    }));
  }
}
