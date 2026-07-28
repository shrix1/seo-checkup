import { blogPath, features } from "@/lib/site"

export type LearnLink = { label: string; href: string }

export type LearnSection = {
  id: string
  acronym: string
  title: string
  /** One-line definition used in the summary table */
  short: string
  /** Question-shaped heading, which is itself an AEO signal */
  question: string
  answer: string
  body: string[]
  checks: string[]
  actions: string[]
  links: LearnLink[]
  /** Set when SeoCheckup deliberately does not score this discipline */
  caveat?: string
}

export const LEARN_UPDATED = "2026-07-28"

export const LEARN_SECTIONS: LearnSection[] = [
  {
    id: "seo",
    acronym: "SEO",
    title: "Search Engine Optimization",
    short: "Rank in Google and Bing.",
    question: "What is SEO and what still matters in 2026?",
    answer:
      "SEO is making a page reachable, indexable and relevant enough that a search engine ranks it. Nothing about that has been replaced — every newer discipline below is built on top of it.",
    body: [
      "A search engine has to do three things before you can rank at all: fetch the page, understand it, and decide it is worth showing. Most sites that struggle are failing the first two, not the third.",
      "Order matters when you fix things. A brilliant title on a page that robots.txt blocks is worth nothing, so crawl access comes before on-page work, which comes before chasing links.",
    ],
    checks: [
      "robots.txt reachability, and whether the exact page you audited is crawlable by Googlebot",
      "XML sitemap discovery and expansion, including nested indexes",
      "Title and meta description measured in rendered pixels, not characters",
      "Canonical correctness, hreflang self-reference, H1 structure, image alt coverage",
      "HTTP→HTTPS and www canonicalization, redirect chains, real 404s",
      "Ahrefs Domain Rating as an authority proxy",
    ],
    actions: [
      "Fix anything blocking a crawl first — a Disallow rule, a noindex, a soft 404.",
      "Give every indexable page an absolute, self-referencing canonical.",
      "Write titles that render under 580px and descriptions under 920px. Character counts lie because Google truncates on width.",
      "Collapse redirect chains so every URL resolves in one hop.",
    ],
    links: [
      { label: "Run a site audit", href: features.audit.toolPath },
      { label: "Check your robots.txt", href: features.robots.toolPath },
      { label: "Expand your sitemap", href: features.sitemap.toolPath },
    ],
  },
  {
    id: "pseo",
    acronym: "PSEO",
    title: "Programmatic SEO",
    short: "Generate many pages from structured data.",
    question: "What is programmatic SEO and when does it backfire?",
    answer:
      "Programmatic SEO generates a page per combination of some dimensions — tool × language, city × service, integration × platform — to capture long-tail queries at a scale nobody could write by hand.",
    body: [
      "It works when each generated page genuinely answers a different question. It fails when the only thing that changes between pages is a swapped noun, because search engines classify the rest as duplicate and quietly drop them.",
      "The failure mode is rarely a penalty. It is that a few thousand pages get crawled once, judged thin, and never revisited — which also burns the crawl budget you needed for the pages that do matter.",
    ],
    checks: [
      "Sitemap expansion at scale, so you can see every URL a template actually produced",
      "Duplicate, cross-host and non-HTTPS URLs inside the sitemap",
      "Whether every lastmod is the same date — the usual sign a CMS is writing build time, which makes the field useless to crawlers",
      "Content depth on the page you audit, to catch thin templates",
    ],
    actions: [
      "Make each page carry something only that page can say: real data, real numbers, a real example.",
      "Split large sets into a sitemap index rather than one file over the 50,000-URL limit.",
      "Write an honest lastmod per URL, or leave it out entirely.",
      "Internal-link the cluster so pages are reachable without the sitemap.",
    ],
    links: [
      { label: "Expand your sitemap", href: features.sitemap.toolPath },
      { label: "Check a generated page", href: features.audit.toolPath },
    ],
  },
  {
    id: "aeo",
    acronym: "AEO",
    title: "Answer Engine Optimization",
    short: "Get cited by ChatGPT, Claude and Perplexity.",
    question: "What is AEO and how is it different from SEO?",
    answer:
      "AEO is optimizing to be quoted inside an AI-generated answer rather than listed as a blue link. Ranking gets you considered; being extractable, self-contained and current gets you cited.",
    body: [
      "The single biggest blocker is technical, not editorial: most answer engines do not execute JavaScript. If your copy is rendered client-side, they fetch your page and see an empty shell.",
      "The second is format. Answer engines parse Markdown far more reliably than HTML, and it costs roughly 60–80% fewer tokens to read. That is why serving a Markdown twin of each page — the same content at /page.md, or at the same URL when the request sends Accept: text/markdown — has turned into a real convention with a published specification behind it.",
      "The third is shape. A passage that makes sense on its own, under a heading phrased the way a person would ask the question, is what actually gets lifted into an answer.",
    ],
    checks: [
      "Markdown twin detection at /page.md, /index.md and via Accept: text/markdown content negotiation",
      "Conformance against AEO Specification v1.0 — Content-Type, X-Markdown-Tokens, X-Robots-Tag: noindex and Vary: Accept, plus the recommended nosniff and X-AEO-Version",
      "Whether the twin is advertised with Link: rel=\"alternate\" so agents do not have to guess the URL",
      "llms.txt, llms-full.txt and ai.txt discovery",
      "Whether your copy survives without JavaScript",
      "Answer-ready schema, question-shaped headings, linkable section anchors, freshness and author signals",
    ],
    actions: [
      "Server-render the main content. Everything else here is wasted if the body only exists after hydration.",
      "Serve a Markdown twin and advertise it with a Link: rel=\"alternate\" header and Vary: Accept.",
      "Phrase section headings as questions, answer in the first paragraph beneath, and give each heading a stable id so an answer can deep-link to the passage.",
      "Put an accurate dateModified in your schema. Most AI citations go to pages updated within the past year.",
      "Optionally publish /llms.txt as an index. Be realistic about it: adoption is around 10% of sites, AI crawlers request the file in roughly 0.1% of their visits, and Google has said it will not support it. Useful as a single entry point for documentation, not as a ranking tactic.",
    ],
    links: [
      { label: "Audit your AEO readiness", href: features.audit.toolPath },
      { label: "Check AI crawler access", href: features.robots.toolPath },
      {
        label: "How to run a free SEO audit",
        href: blogPath("free-website-seo-audit"),
      },
    ],
  },
  {
    id: "geo",
    acronym: "GEO",
    title: "Generative Engine Optimization",
    short: "Manage how you are represented across AI answers.",
    question: "What is GEO, and why is there no GEO score here?",
    answer:
      "GEO is the strategic layer above AEO: not just whether one page can be cited, but how your brand is described across generative engines — including in sources you do not own.",
    body: [
      "AEO is a property of a page. GEO is a property of a reputation, and it is measured by asking engines real questions over time and watching which brands they name and how they frame them.",
      "That cannot be derived from fetching one URL, which is why SeoCheckup does not print a GEO score. Inventing one from page signals would be a number with nothing behind it.",
      "What a single-URL audit can do is verify the prerequisites. If ChatGPT's or Perplexity's crawlers cannot reach you, or your content only exists after JavaScript runs, no amount of GEO strategy will help — you are not in the candidate set at all.",
    ],
    checks: [
      "Whether the answer-engine crawlers that drive citations — OAI-SearchBot, Claude-SearchBot, PerplexityBot — are allowed",
      "The training-versus-search crawler split, so blocking training does not accidentally cost you citations",
      "Your declared content usage policy via the Content-Signal directive",
      "Everything in the AEO section, which is the technical floor GEO sits on",
    ],
    actions: [
      "Never block the search crawlers. GPTBot is not OAI-SearchBot and ClaudeBot is not Claude-SearchBot — blocking training is a content decision, blocking search removes you from answers.",
      "State your policy explicitly with Content-Signal: search=yes, ai-input=yes, ai-train=no rather than leaving it implied by Disallow rules.",
      "Track it properly: ask the engines your real buying questions on a schedule and record which sources they cite. That is the only honest GEO measurement.",
      "Earn mentions in the third-party sources engines already trust, because much of what they say about you comes from pages you do not control.",
    ],
    caveat:
      "SeoCheckup checks the technical prerequisites for GEO, not GEO itself. Measuring it needs prompt tracking across engines over time.",
    links: [
      { label: "Check AI crawler access", href: features.robots.toolPath },
      { label: "Run a site audit", href: features.audit.toolPath },
    ],
  },
]
