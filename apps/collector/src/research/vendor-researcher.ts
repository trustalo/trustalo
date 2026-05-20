import OpenAI from "openai";
import {
  createAIProvider,
  type AIProvider,
  type AIProviderCredentials,
  type AIProviderType,
} from "@trustalo/ai";
import { createSearchEngine, type SearchEngine, type SearchResult } from "./search/index.js";

/**
 * Resolved AI handoff passed from the API in the SQS message. The
 * shape is intentionally minimal — see
 * apps/api/src/lib/queue.ts::ResolvedAIForCollector for the full type.
 */
export interface ResolvedAIInput {
  provider: AIProviderType;
  model: string;
  source: "operator" | "org" | "feature" | "managed";
  credentials: {
    apiKey?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    baseUrl?: string;
    useDefaultChain?: boolean;
  };
}

/**
 * Legacy fallback used ONLY when the API publisher couldn't resolve
 * AI configuration (no operator default, no org row, no EE license).
 * Kept behind a feature flag so messages in-flight during the rollout
 * still complete; new code should never enter this branch.
 */
let legacyOpenai: OpenAI | null = null;
function getLegacyOpenAI(): OpenAI {
  if (legacyOpenai) return legacyOpenai;
  if (!process.env["OPENAI_API_KEY"]) {
    throw new Error(
      "[research] legacy fallback requested but OPENAI_API_KEY is unset. Configure AI in Settings or set OPENAI_API_KEY.",
    );
  }
  legacyOpenai = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });
  return legacyOpenai;
}

let searchEngine: SearchEngine | null = null;

function getSearchEngine(): SearchEngine {
  if (!searchEngine) {
    searchEngine = createSearchEngine();
  }
  return searchEngine;
}

export interface VendorResearchInput {
  vendorName: string;
  vendorWebsite?: string | null;
  vendorCategory?: string | null;
  vendorDescription?: string | null;
  /**
   * Tenant the research is being run for. Required when `ai` is
   * supplied (so LiteLLM metadata can attribute spend) and harmless
   * to set otherwise — surfaced in audit logs.
   */
  tenantId?: string;
  /**
   * Resolved AI provider+model+credentials produced by the API
   * publisher's `resolveOrgAI("vendor_research")` call. When absent,
   * the legacy OPENAI_MODEL/OPENAI_API_KEY path runs (this branch is
   * scheduled for removal once the new flow has been live for one
   * release; track via the migration note in docs/ai-features.md §8).
   */
  ai?: ResolvedAIInput;
}

export interface VendorResearchResult {
  overallScore: number;
  securityScore: number;
  complianceScore: number;
  reputationScore: number;
  financialScore: number;
  findings: VendorFinding[];
  summary: string;
  recommendations: string;
  dataBreaches: DataBreachInfo[];
  certifications: string[];
  rawData: Record<string, unknown>;
}

export interface VendorFinding {
  category: "security" | "compliance" | "reputation" | "financial" | "operational";
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  source?: string;
}

export interface DataBreachInfo {
  date: string;
  description: string;
  impact: string;
  recordsAffected?: string;
}

// ── Web Search via pluggable engine ──

async function searchSafe(query: string, maxResults = 10): Promise<SearchResult[]> {
  try {
    return await getSearchEngine().search(query, { maxResults });
  } catch (err) {
    console.error(`[research] search error (${getSearchEngine().name}):`, err);
    return [];
  }
}

async function gatherVendorIntelligence(
  input: VendorResearchInput,
): Promise<{ searchResults: SearchResult[]; combinedContext: string }> {
  const vendorName = input.vendorName;
  const queries = [
    `${vendorName} security posture SOC 2 ISO 27001 certifications compliance`,
    `${vendorName} data breach security incident vulnerability`,
    `${vendorName} company overview revenue funding employees`,
    `${vendorName} GDPR CCPA privacy policy data processing`,
  ];

  if (input.vendorWebsite) {
    queries.push(`site:${input.vendorWebsite} security trust compliance`);
  }

  const allResults = await Promise.all(queries.map((q) => searchSafe(q, 5)));
  const searchResults = allResults.flat();

  // Deduplicate by URL
  const seen = new Set<string>();
  const uniqueResults = searchResults.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  const combinedContext = uniqueResults
    .slice(0, 25)
    .map((r, i) => `[Source ${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}\n`)
    .join("\n---\n");

  return { searchResults: uniqueResults, combinedContext };
}

// ── LLM Analysis ──

const RESEARCH_SYSTEM_PROMPT = `You are a cybersecurity and vendor risk analyst performing a deep vendor security assessment. You have been given real-time web search results about a vendor. Analyze these results to produce a comprehensive risk assessment.

Analyze the vendor across these dimensions:
1. **Security Posture** — Known vulnerabilities, security practices, certifications (SOC 2, ISO 27001, etc.), encryption standards, incident response
2. **Compliance** — Regulatory compliance (GDPR, CCPA, HIPAA, PCI DSS), data handling practices, privacy policies
3. **Reputation** — Industry standing, customer reviews, known incidents, media coverage, trust signals
4. **Financial Stability** — Company size, funding, revenue indicators, market position, longevity
5. **Data Breaches** — Any known data breaches, security incidents, or vulnerabilities

For each dimension, provide a score from 0-100 where:
- 90-100: Excellent, industry-leading practices
- 70-89: Good, meets most standards
- 50-69: Adequate but with notable gaps
- 30-49: Concerning, significant risks identified
- 0-29: Critical, major red flags

IMPORTANT: Base your analysis on the provided search results. Cite specific sources when making claims. If information is limited, note this explicitly and score conservatively.

Respond with valid JSON matching this exact structure:
{
  "overallScore": <number 0-100>,
  "securityScore": <number 0-100>,
  "complianceScore": <number 0-100>,
  "reputationScore": <number 0-100>,
  "financialScore": <number 0-100>,
  "summary": "<2-3 paragraph executive summary referencing specific findings>",
  "recommendations": "<bullet-point recommendations for the organization using this vendor>",
  "findings": [
    {
      "category": "security|compliance|reputation|financial|operational",
      "severity": "critical|high|medium|low|info",
      "title": "<finding title>",
      "description": "<detailed description>",
      "source": "<URL or source reference>"
    }
  ],
  "dataBreaches": [
    {
      "date": "<YYYY-MM or approximate>",
      "description": "<what happened>",
      "impact": "<impact description>",
      "recordsAffected": "<number or 'unknown'>"
    }
  ],
  "certifications": ["SOC 2 Type II", "ISO 27001", ...]
}`;

export async function performVendorResearch(
  input: VendorResearchInput,
): Promise<VendorResearchResult> {
  console.log(`[research] gathering intelligence for "${input.vendorName}"...`);

  const { searchResults, combinedContext } = await gatherVendorIntelligence(input);

  console.log(`[research] collected ${searchResults.length} search results, sending to LLM...`);

  const userPrompt = buildResearchPrompt(input, combinedContext);

  const messages = [
    { role: "system" as const, content: RESEARCH_SYSTEM_PROMPT },
    { role: "user" as const, content: userPrompt },
  ];

  let content = "";
  let modelUsed: string;

  if (input.ai) {
    // New path: use the resolved provider from the API. In SaaS this
    // is always LiteLLM (provider == "litellm", source == "managed"),
    // which means the spend is metered against the tenant's wallet.
    const provider = buildProvider(input);
    const completion = await provider.chat({
      messages,
      responseFormat: "json",
      temperature: 0.3,
      maxTokens: 4096,
    });
    content = completion.content;
    modelUsed = completion.model || input.ai.model;
  } else {
    // Legacy fallback. Logs a warning at module load so operators
    // notice during the rollout.
    console.warn(
      "[research] no `ai` field on the message — falling back to OPENAI_MODEL. This branch is deprecated; ensure the API publisher is up-to-date.",
    );
    const completion = await getLegacyOpenAI().chat.completions.create({
      model: process.env["OPENAI_MODEL"] ?? "gpt-4o",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 4096,
    });
    content = completion.choices[0]?.message?.content ?? "";
    modelUsed = completion.model || process.env["OPENAI_MODEL"] || "gpt-4o";
  }

  if (!content) {
    throw new Error("Empty response from AI model");
  }

  const parsed = JSON.parse(content);
  const result = validateAndNormalize(parsed);

  // Attach raw search data for audit trail
  result.rawData = {
    ...result.rawData,
    searchResultCount: searchResults.length,
    searchSources: searchResults.slice(0, 25).map((r) => ({
      title: r.title,
      url: r.url,
      score: r.score,
    })),
    modelUsed,
    providerSource: input.ai?.source ?? "legacy",
    searchEngine: getSearchEngine().name,
    researchedAt: new Date().toISOString(),
  };

  return result;
}

function buildProvider(input: VendorResearchInput): AIProvider {
  if (!input.ai) {
    throw new Error("buildProvider called without ai handoff");
  }
  const creds: AIProviderCredentials = {
    provider: input.ai.provider,
    apiKey: input.ai.credentials.apiKey,
    region: input.ai.credentials.region,
    accessKeyId: input.ai.credentials.accessKeyId,
    secretAccessKey: input.ai.credentials.secretAccessKey,
    baseUrl: input.ai.credentials.baseUrl,
    useDefaultChain: input.ai.credentials.useDefaultChain,
  };
  return createAIProvider(creds, input.ai.model, {
    litellm: {
      tenantId: input.tenantId,
      feature: "vendor_research",
    },
  });
}

function buildResearchPrompt(input: VendorResearchInput, searchContext: string): string {
  let prompt = `Perform a comprehensive security and risk assessment of the following vendor based on the web search results provided.\n\n`;
  prompt += `**Vendor Name:** ${input.vendorName}\n`;

  if (input.vendorWebsite) {
    prompt += `**Website:** ${input.vendorWebsite}\n`;
  }
  if (input.vendorCategory) {
    prompt += `**Category:** ${input.vendorCategory}\n`;
  }
  if (input.vendorDescription) {
    prompt += `**Description:** ${input.vendorDescription}\n`;
  }

  if (searchContext) {
    prompt += `\n--- WEB SEARCH RESULTS ---\n\n${searchContext}\n\n--- END SEARCH RESULTS ---\n`;
  } else {
    prompt += `\nNote: No web search results were available. Provide your assessment based on general knowledge about this vendor, and note that findings could not be verified with current data.\n`;
  }

  prompt += `\nAnalyze all sources carefully. Distinguish between confirmed facts from the search results and your general knowledge. Provide specific source citations where possible.`;

  return prompt;
}

function validateAndNormalize(data: any): VendorResearchResult {
  const clampScore = (val: unknown): number => {
    const n = typeof val === "number" ? val : 50;
    return Math.max(0, Math.min(100, Math.round(n)));
  };

  return {
    overallScore: clampScore(data.overallScore),
    securityScore: clampScore(data.securityScore),
    complianceScore: clampScore(data.complianceScore),
    reputationScore: clampScore(data.reputationScore),
    financialScore: clampScore(data.financialScore),
    summary: typeof data.summary === "string" ? data.summary : "Research completed.",
    recommendations: typeof data.recommendations === "string" ? data.recommendations : "",
    findings: Array.isArray(data.findings)
      ? data.findings.map((f: any) => ({
          category: f.category || "security",
          severity: f.severity || "medium",
          title: f.title || "Finding",
          description: f.description || "",
          source: f.source,
        }))
      : [],
    dataBreaches: Array.isArray(data.dataBreaches)
      ? data.dataBreaches.map((b: any) => ({
          date: b.date || "unknown",
          description: b.description || "",
          impact: b.impact || "",
          recordsAffected: b.recordsAffected,
        }))
      : [],
    certifications: Array.isArray(data.certifications) ? data.certifications : [],
    rawData: data,
  };
}
