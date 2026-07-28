import AuditForm from "@/components/audit-form"
import Container from "@/components/container"
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/motion"
import ScoreRing from "@/components/score-ring"
import { StatusDot } from "@/components/status"
import ToolCard from "@/components/tool-card"
import type { CheckStatus } from "@/lib/audit/types"
import { features } from "@/lib/site"
import {
  AreaChart,
  Bot,
  FileImage,
  FileSearch,
  Globe2,
  Shield,
  MessageSquareQuote,
  Stethoscope,
  TrendingUp,
} from "lucide-react"
// Bot is used for both the Robots tool tile and the AI category card.
import Link from "next/link"

const DEMO = "shrix1.com"

const tools = [
  {
    icon: Stethoscope,
    title: "Site Audit",
    content:
      "One URL for on-page, robots, sitemap, headers, and Domain Rating.",
    link: features.audit.landingPath,
  },
  {
    icon: TrendingUp,
    title: "Domain Rating",
    content: "Look up the Ahrefs Domain Rating for any domain, free.",
    link: features.domainRating.landingPath,
  },
  {
    icon: AreaChart,
    title: "Sitemap Checker",
    content: "Expand sitemap indexes and list every URL they declare.",
    link: features.sitemap.landingPath,
  },
  {
    icon: FileImage,
    title: "Meta Tags Checker",
    content: "Preview search and social cards before you publish.",
    link: features.metadata.landingPath,
  },
  {
    icon: Bot,
    title: "Robots.txt Viewer",
    content: "Read crawl directives and confirm your sitemap is declared.",
    link: features.robots.landingPath,
  },
]

/**
 * Mirrors the four categories in lib/audit/run-audit.ts. Counts are the base
 * set; two checks are conditional (page-fetch fires only on failure, and the
 * sitemap membership check only when a sitemap actually resolves).
 */
const categories = [
  {
    icon: FileSearch,
    label: "On-page",
    count: 15,
    items:
      "Title and description measured in rendered pixels, H1, canonical correctness, lang, charset, viewport, favicon, indexability, JSON-LD, Open Graph, Twitter Card, image alt coverage, hreflang, content depth",
  },
  {
    icon: Globe2,
    label: "Robots & sitemap",
    count: 8,
    items:
      "robots.txt, whether this exact page is crawlable, sitemap declaration and expansion, HTTP→HTTPS, www canonicalization, redirect chains, and real 404s",
  },
  {
    icon: Shield,
    label: "Trust & security",
    count: 9,
    items:
      "HTTPS, mixed content, HSTS, CSP, frame protection, MIME sniffing, Referrer-Policy, Cache-Control, Ahrefs Domain Rating",
  },
  {
    icon: Bot,
    label: "AI crawler access",
    count: 3,
    items:
      "Whether ChatGPT, Claude and Perplexity search crawlers can reach you, assistant fetch access, and your declared content-usage policy",
  },
  {
    icon: MessageSquareQuote,
    label: "Answer engines (AEO)",
    count: 8,
    items:
      "Markdown twin, llms.txt, whether your copy survives without JavaScript, answer-ready schema, question-shaped headings, linkable sections, freshness and author signals",
  },
]

const sampleChecks: {
  status: CheckStatus
  label: string
  detail: string
  value?: string
}[] = [
  {
    status: "fail",
    label: "Canonical URL",
    detail: "No canonical link found — duplicate URLs can split ranking signals.",
  },
  {
    status: "warn",
    label: "Meta description",
    detail: "214 characters. Google truncates around 160.",
    value: "Free site audit for any website — check sitemap, meta tags…",
  },
  {
    status: "pass",
    label: "robots.txt reachable",
    detail: "Returned 200 and declares a sitemap.",
    value: "Sitemap: https://example.com/sitemap.xml",
  },
]

export default function HomeHero() {
  return (
    <>
      {/* Hero */}
      <section className="border-b">
        <Container width="page" className="py-16 md:py-24">
          <FadeIn className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <h1 className="text-title font-semibold sm:text-display">
              Every technical SEO check, unlocked.
            </h1>
            <p className="mt-4 max-w-xl text-subhead text-muted-foreground">
              Paste any URL — a homepage or a deep page — for 43 checks across
              on-page signals, crawl access, security, AI crawler access, and
              how citable you are to answer engines.
            </p>

            <div className="mt-8 w-full max-w-xl">
              <AuditForm defaultValue={DEMO} />
            </div>

            <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <li>43 checks</li>
              <li aria-hidden>·</li>
              <li>No account</li>
              <li aria-hidden>·</li>
              <li>Nothing paywalled</li>
              <li aria-hidden>·</li>
              <li>Results in seconds</li>
            </ul>
          </FadeIn>
        </Container>
      </section>

      {/* What it checks */}
      <section className="border-b">
        <Container width="page" className="py-16 md:py-20">
          <h2 className="text-heading font-semibold">What the audit checks</h2>
          <p className="mt-2 max-w-xl text-body text-muted-foreground">
            Five categories, scored separately so you know where the damage is.
            New to the acronyms?{" "}
            <Link
              href="/learn"
              className="text-link underline underline-offset-2"
            >
              SEO, PSEO, AEO and GEO explained
            </Link>
            .
          </p>
          <StaggerChildren className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <StaggerItem key={cat.label}>
                <div className="h-full rounded-lg border bg-background p-5">
                  <div className="flex items-center gap-2.5">
                    <cat.icon
                      className="h-[18px] w-[18px] text-muted-foreground"
                      aria-hidden
                    />
                    <h3 className="font-medium">{cat.label}</h3>
                    <span className="ml-auto font-mono text-xs text-muted-foreground tabular">
                      {cat.count}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {cat.items}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </Container>
      </section>

      {/* Sample report */}
      <section className="border-b bg-surface-1">
        <Container width="page" className="py-16 md:py-20">
          <div className="grid items-start gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-12">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-label font-medium uppercase text-muted-foreground">
                Sample report
              </span>
              <div className="mt-4">
                <ScoreRing value={78} size={140} />
              </div>
              <p className="mt-4 max-w-[26ch] text-center text-sm text-muted-foreground md:text-left">
                Every check is scored and ranked, worst first — no summary
                that hides the detail behind an upgrade.
              </p>
            </div>

            <div>
              <h2 className="text-heading font-semibold">Fix first</h2>
              <p className="mt-2 text-body text-muted-foreground">
                Highest-impact issues, ordered by severity.
              </p>
              <div className="mt-5 divide-y rounded-lg border bg-background">
                {sampleChecks.map((check) => (
                  <div
                    key={check.label}
                    className="flex items-start gap-3 px-4 py-3.5"
                  >
                    <StatusDot status={check.status} className="mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{check.label}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {check.detail}
                      </p>
                      {check.value && (
                        <p className="mt-1.5 truncate rounded bg-surface-2 px-2 py-1 font-mono text-xs text-muted-foreground">
                          {check.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                <Link
                  href={`/audit?q=${encodeURIComponent(DEMO)}`}
                  className="text-link underline underline-offset-2"
                >
                  See a live report
                </Link>{" "}
                or{" "}
                <Link
                  href={features.audit.landingPath}
                  className="text-link underline underline-offset-2"
                >
                  read how the audit works
                </Link>
                .
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Tools */}
      <section>
        <Container width="page" className="py-16 md:py-20">
          <h2 className="text-heading font-semibold">Or run one check</h2>
          <p className="mt-2 max-w-xl text-body text-muted-foreground">
            Each tool works standalone and the audit deep-links straight into
            them.
          </p>
          <StaggerChildren className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <StaggerItem key={tool.title} className="h-full">
                <ToolCard
                  icon={tool.icon}
                  title={tool.title}
                  content={tool.content}
                  link={tool.link}
                />
              </StaggerItem>
            ))}
          </StaggerChildren>
        </Container>
      </section>
    </>
  )
}
