import type { SearchEngine, SearchResult, SearchOptions } from "./interface.js";

const BRAVE_BASE_URL = "https://api.search.brave.com/res/v1/web/search";

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  extra_snippets?: string[];
}

interface BraveResponse {
  web?: { results: BraveWebResult[] };
}

export class BraveSearchEngine implements SearchEngine {
  readonly name = "brave" as const;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("BraveSearchEngine: apiKey is required");
    this.apiKey = apiKey;
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    // Brave max is 20 per request
    const maxResults = Math.min(options?.maxResults ?? 10, 20);

    const params = new URLSearchParams({
      q: query,
      count: String(maxResults),
      text_decorations: "false",
    });

    const response = await fetch(`${BRAVE_BASE_URL}?${params}`, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": this.apiKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Brave search failed (${response.status}): ${text}`);
    }

    const data = (await response.json()) as BraveResponse;

    return (data.web?.results ?? []).map((r, index) => {
      const extraContent = r.extra_snippets?.join(" ") ?? "";
      return {
        title: r.title,
        url: r.url,
        content: extraContent ? `${r.description} ${extraContent}` : r.description,
        score: 1 - index / maxResults,
      };
    });
  }
}
