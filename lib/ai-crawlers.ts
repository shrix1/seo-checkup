/**
 * Crawler registry used by the robots.txt matrix and the audit's AI-access check.
 *
 * The distinction that matters in 2026 is purpose. Vendors split training from
 * search: GPTBot is not OAI-SearchBot, ClaudeBot is not Claude-SearchBot. Blocking
 * a training crawler protects your content from model training; blocking a search
 * crawler removes you from that assistant's answers and the citation traffic
 * those answers send back. They are very different decisions.
 */

export type CrawlerPurpose = "search" | "training" | "assistant"

export type Crawler = {
  name: string
  vendor: string
  purpose: CrawlerPurpose
  /** What blocking this crawler actually costs you */
  impact: string
}

export const PURPOSE_LABELS: Record<CrawlerPurpose, string> = {
  search: "Search & citations",
  training: "Model training",
  assistant: "User-triggered fetch",
}

export const PURPOSE_HINTS: Record<CrawlerPurpose, string> = {
  search:
    "Indexes your pages so assistants can cite and link to you. Blocking these removes you from AI answers.",
  training:
    "Collects pages to train models. Blocking these does not affect whether you appear in AI answers.",
  assistant:
    "Fetches a page live when a user asks about it. Blocking these breaks link previews and direct lookups.",
}

/** Classic search engines — kept separate so the matrix can lead with them. */
export const SEARCH_CRAWLERS: Crawler[] = [
  {
    name: "Googlebot",
    vendor: "Google",
    purpose: "search",
    impact: "Google Search indexing",
  },
  {
    name: "Bingbot",
    vendor: "Microsoft",
    purpose: "search",
    impact: "Bing and Copilot indexing",
  },
  {
    name: "DuckDuckBot",
    vendor: "DuckDuckGo",
    purpose: "search",
    impact: "DuckDuckGo indexing",
  },
]

export const AI_CRAWLERS: Crawler[] = [
  {
    name: "OAI-SearchBot",
    vendor: "OpenAI",
    purpose: "search",
    impact: "Being cited in ChatGPT search results",
  },
  {
    name: "ChatGPT-User",
    vendor: "OpenAI",
    purpose: "assistant",
    impact: "ChatGPT fetching your page when a user asks",
  },
  {
    name: "GPTBot",
    vendor: "OpenAI",
    purpose: "training",
    impact: "OpenAI model training",
  },
  {
    name: "Claude-SearchBot",
    vendor: "Anthropic",
    purpose: "search",
    impact: "Being cited in Claude's search results",
  },
  {
    name: "Claude-User",
    vendor: "Anthropic",
    purpose: "assistant",
    impact: "Claude fetching your page when a user asks",
  },
  {
    name: "ClaudeBot",
    vendor: "Anthropic",
    purpose: "training",
    impact: "Anthropic model training",
  },
  {
    name: "PerplexityBot",
    vendor: "Perplexity",
    purpose: "search",
    impact: "Being cited in Perplexity answers",
  },
  {
    name: "Perplexity-User",
    vendor: "Perplexity",
    purpose: "assistant",
    impact: "Perplexity fetching your page on demand",
  },
  {
    name: "Google-Extended",
    vendor: "Google",
    purpose: "training",
    impact: "Gemini model training (does not affect Google Search)",
  },
  {
    name: "Applebot-Extended",
    vendor: "Apple",
    purpose: "training",
    impact: "Apple Intelligence model training",
  },
  {
    name: "Amazonbot",
    vendor: "Amazon",
    purpose: "training",
    impact: "Alexa and Amazon model training",
  },
  {
    name: "meta-externalagent",
    vendor: "Meta",
    purpose: "training",
    impact: "Meta AI model training",
  },
  {
    name: "Bytespider",
    vendor: "ByteDance",
    purpose: "training",
    impact: "ByteDance model training",
  },
  {
    name: "CCBot",
    vendor: "Common Crawl",
    purpose: "training",
    impact: "Common Crawl corpus, used by many model trainers",
  },
]

export const ALL_CRAWLERS: Crawler[] = [...SEARCH_CRAWLERS, ...AI_CRAWLERS]

/** The crawlers whose loss actually costs traffic, used for the audit check. */
export const CITATION_CRAWLERS = AI_CRAWLERS.filter(
  (c) => c.purpose === "search"
)
