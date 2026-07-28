"use client"

import Container from "@/components/container"
import { FadeIn } from "@/components/motion"
import ScoreRing, { scoreBand } from "@/components/score-ring"
import { StatusChip, StatusCount, StatusDot } from "@/components/status"
import { TocRail, type TocItem } from "@/components/toc"
import ToolSearchForm, {
  ToolError,
  ToolExample,
} from "@/components/tool-search-form"
import { Button } from "@/components/ui/button"
import Disclosure from "@/components/ui/disclosure"
import { Skeleton } from "@/components/ui/skeleton"
import { Claude, Cursor, OpenAI } from "@lobehub/icons"
import { AHREFS_DR_ATTRIBUTION } from "@/lib/ahrefs-dr"
import type {
  AuditCategoryId,
  AuditCheck,
  AuditReport,
  CategoryScore,
} from "@/lib/audit/types"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  Bot,
  Check,
  Copy,
  ExternalLink,
  FileSearch,
  Gauge,
  Globe2,
  Info,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  Shield,
  Sparkles,
  TrendingUp,
  Wrench,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const DEFAULT_SITE = "shrix1.com"

function initialQuery(query: string) {
  if (!query) return DEFAULT_SITE
  try {
    return decodeURIComponent(query)
  } catch {
    return query
  }
}

const categoryIcon: Record<AuditCategoryId, LucideIcon> = {
  onpage: FileSearch,
  crawl: Globe2,
  trust: Shield,
  ai: Bot,
  aeo: MessageSquareQuote,
  performance: Gauge,
}

/**
 * `extra` carries the categories that arrive after the audit itself — right
 * now just Core Web Vitals. They are appended rather than merged so the
 * headline score in the export always matches the one on screen.
 */
function reportToMarkdown(
  report: AuditReport,
  extra: CategoryScore[] = []
): string {
  const lines = [
    `# SEO Audit — ${report.domain}`,
    `Score: ${report.score}/100`,
    `Audited: ${report.auditedAt}`,
    `URL audited: ${report.pageUrl}`,
    `Final URL: ${report.finalUrl}`,
    typeof report.domainRating === "number"
      ? `Domain Rating: ${Math.round(report.domainRating)} (${AHREFS_DR_ATTRIBUTION.text})`
      : null,
    "",
    "## Fix first",
    ...report.fixFirst.map(
      (c) =>
        `- [${c.status.toUpperCase()}] ${c.label}: ${c.detail}. Fix: ${c.fixHint}`
    ),
    "",
    ...[...report.categories, ...extra].flatMap((cat) => [
      `## ${cat.label} (${cat.score}/100)`,
      ...cat.checks.map(
        (c) =>
          `- [${c.status.toUpperCase()}] ${c.label}: ${c.value ?? ""} — ${c.detail}`
      ),
      "",
    ]),
  ]
  return lines.filter((l) => l !== null).join("\n")
}

/**
 * The "Fix with AI" export. This is pasted straight into an assistant, so it
 * carries the vocabulary and the exact spec rules the model needs — otherwise
 * it invents plausible-sounding header names for the newer AEO conventions.
 */
function reportToAiPrompt(
  report: AuditReport,
  extra: CategoryScore[] = []
): string {
  const drLine =
    typeof report.domainRating === "number"
      ? `- Domain Rating: ${Math.round(report.domainRating)}/100`
      : null

  const findingsByCategory = [...report.categories, ...extra].flatMap((cat) => {
    // `info` findings are ungraded observations, not work — keep them out of
    // the remediation list so the model does not invent fixes for them.
    const issues = cat.checks.filter(
      (c) => c.status === "fail" || c.status === "warn"
    )
    if (issues.length === 0) {
      return [`### ${cat.label} — ${cat.score}/100`, "All checks pass.", ""]
    }
    return [
      `### ${cat.label} — ${cat.score}/100 (${cat.fail} fail, ${cat.warn} warn, ${cat.pass} pass)`,
      ...issues.flatMap((c) => [
        `- [${c.status.toUpperCase()}] ${c.label}`,
        `  Detail: ${c.detail}`,
        ...(c.value ? [`  Measured: ${c.value}`] : []),
        `  Hint: ${c.fixHint}`,
      ]),
      "",
    ]
  })

  const lines = [
    "You are an experienced technical SEO engineer. Use the audit below to produce a concrete remediation plan for this specific site.",
    "",
    "## Context: the four disciplines this audit covers",
    "- **SEO** — can a search engine fetch, understand and rank the page. Crawl access, indexability, on-page signals, canonicalization, authority.",
    "- **PSEO (programmatic SEO)** — many pages generated from structured data. The risk is thin or duplicate templates that get crawled once and dropped.",
    "- **AEO (answer engine optimization)** — being quoted inside an AI answer rather than listed as a link. Rewards content that is server-rendered, self-contained, well-structured and cheap for a machine to read.",
    "- **GEO (generative engine optimization)** — how the brand is represented across generative answers. Cannot be measured from one URL; this audit only verifies its technical prerequisites.",
    "",
    "## Reference: conventions you may need to write",
    "Do not invent header or file names for these. The correct forms are:",
    "",
    "**Markdown twin** — serve the same page as Markdown so answer engines can read it cheaply (roughly 60–80% fewer tokens than HTML). Two accepted mechanisms:",
    "1. URL suffix: `/pricing` also answers at `/pricing.md`; the site root answers at `/index.md`.",
    "2. Content negotiation: the same URL returns Markdown when the request sends `Accept: text/markdown`.",
    "",
    "**AEO Specification v1.0 (dualmark.dev)** — the Markdown response MUST send:",
    "- `Content-Type: text/markdown; charset=utf-8`",
    "- `X-Markdown-Tokens: <integer>` (estimated token count of the body)",
    "- `X-Robots-Tag: noindex` (so the twin is not indexed as duplicate content)",
    "- `Vary: Accept`",
    "",
    "The HTML response MUST advertise the twin and MUST set `Vary: Accept`:",
    '- `Link: </pricing.md>; rel="alternate"; type="text/markdown"`',
    "",
    "SHOULD (recommended): return `406 Not Acceptable` when neither HTML nor Markdown is acceptable; send `X-Content-Type-Options: nosniff`; send `X-AEO-Version: 1.0`.",
    "",
    "**Discovery files** — `/llms.txt` (an index of your key pages, in Markdown), `/llms-full.txt` (their full text inlined for single-fetch ingestion), `/ai.txt` (your AI usage policy).",
    "",
    "**AI crawlers** — training and search crawlers are different and must be treated separately. `GPTBot` is not `OAI-SearchBot`; `ClaudeBot` is not `Claude-SearchBot`. Blocking a training crawler is a content-licensing decision. Blocking a search crawler removes the site from AI answers and the referral traffic they send.",
    "",
    "**Content-Signal** — a robots.txt directive declaring permitted uses, e.g. `Content-Signal: search=yes, ai-input=yes, ai-train=no`.",
    "",
    "**Snippet width** — Google truncates titles and descriptions by rendered pixel width, not character count. Budget roughly 580px for titles and 920px for descriptions on desktop.",
    "",
    "## Site",
    `- Domain: ${report.domain}`,
    `- URL audited: ${report.pageUrl}`,
    `- Final URL after redirects: ${report.finalUrl}`,
    `- Audit type: ${report.isHomepage ? "homepage" : "page-level (site-wide checks still ran against the origin)"}`,
    drLine,
    `- Overall score: ${report.score}/100`,
    `- Checks: ${report.fail} fail, ${report.warn} warn, ${report.pass} pass${
      report.info > 0 ? `, ${report.info} ungraded (reported, not scored)` : ""
    }`,
    "",
    "## Instructions",
    "- Work in severity order: every FAIL first, then WARN. Do not restate passing checks.",
    "- Group your plan by the four disciplines above so it is clear what each fix buys.",
    "- Give concrete, copy-pasteable changes: robots.txt lines, meta tags, HTTP response headers, JSON-LD blocks, sitemap entries, framework config.",
    "- Tie every recommendation to a specific finding below. Do not invent rankings, traffic or any metric not present here.",
    "- Where Core Web Vitals appear, respect the label on each one. `field` means real Chrome telemetry and is the number Google ranks on; `lab simulation` is a single simulated run, useful for diagnosis only. Never present a lab number as the ranking signal, and never treat a missing metric as a good one.",
    "- Where a fix depends on the stack, say which layer it belongs in (CDN/edge, server middleware, framework config, template).",
    "- End with the three changes that would move the score most, and why.",
    "",
    "## Findings",
    "",
    ...findingsByCategory,
  ]

  return lines.filter((l) => l !== null).join("\n")
}

/**
 * The agents this prompt is written for, shown on the button itself so it is
 * obvious what to do with it. Decorative — the button's accessible name still
 * reads "Fix with agents".
 */
function AgentMarks() {
  return (
    <span className="ml-2 inline-flex items-center gap-1 opacity-70" aria-hidden>
      <Claude size={13} />
      <OpenAI size={13} />
      <Cursor size={13} />
    </span>
  )
}

/**
 * Report actions. Rendered in the header on narrow screens and in the sticky
 * contents rail from xl up, so exactly one copy is on screen at any width —
 * and on wide screens they stay reachable as you scroll the report.
 */
function ReportActions({
  layout,
  copied,
  promptCopied,
  onCopyReport,
  onCopyPrompt,
  onRerun,
}: {
  layout: "row" | "stack"
  copied: boolean
  promptCopied: boolean
  onCopyReport: () => void
  onCopyPrompt: () => void
  onRerun: () => void
}) {
  const stack = layout === "stack"
  const buttonClass = stack ? "w-full justify-start" : undefined

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        !stack && "shrink-0 items-end"
      )}
    >
      {stack && (
        <p className="text-label font-medium uppercase text-muted-foreground">
          Actions
        </p>
      )}
      <div className={cn(stack ? "flex flex-col gap-2" : "flex flex-wrap gap-2")}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCopyPrompt}
        title="Copy a remediation prompt written for Claude, ChatGPT or Cursor"
        className={cn(buttonClass, stack && "justify-between")}
      >
        {promptCopied ? (
          <>
            <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Prompt copied
          </>
        ) : (
          <>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Fix with agents
            <AgentMarks />
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCopyReport}
        className={buttonClass}
      >
        {copied ? (
          <>
            <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Copied
          </>
        ) : (
          <>
            <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Copy report
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onRerun}
        className={buttonClass}
      >
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
        Re-run
      </Button>
      </div>
    </div>
  )
}

/**
 * Counts up while a long job runs. PageSpeed Insights takes 15-40s, which is
 * well past the point where a static spinner starts reading as "stuck" — a
 * moving number is the cheapest way to show it is still working.
 */
function useElapsedSeconds(active: boolean): number {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!active) return
    const startedAt = Date.now()
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [active])

  return active ? seconds : 0
}

/**
 * Per-category scores at a glance, so the shape of the problem is visible
 * without scrolling. Each ring jumps to its section.
 */
function CategoryRings({
  report,
  perf,
  perfLoading,
  perfFailed,
  onRetryPerf,
  elapsed,
}: {
  report: AuditReport
  perf: CategoryScore | null
  perfLoading: boolean
  perfFailed: boolean
  onRetryPerf: () => void
  elapsed: number
}) {
  const cats = perf ? [...report.categories, perf] : report.categories
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cats.map((cat) => {
        const Icon = categoryIcon[cat.id]
        const band = scoreBand(cat.score)
        return (
          <a
            key={cat.id}
            href={`#audit-${cat.id}`}
            onClick={(e) => {
              const target = document.getElementById(`audit-${cat.id}`)
              if (!target) return
              e.preventDefault()
              target.scrollIntoView({ behavior: "smooth", block: "start" })
              window.history.replaceState(null, "", `#audit-${cat.id}`)
            }}
            className="flex flex-col items-center gap-2 rounded-lg border bg-background px-3 py-4 text-center transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:border-border-strong hover:bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ScoreRing value={cat.score} size={64} strokeWidth={5} suffix={null} />
            {/* Between the score and the label, on its own line: inline with
                the label it floated badly against the two- and three-line
                category names. */}
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="text-xs font-medium leading-tight">
              {cat.label}
            </span>
            <span className="text-[0.6875rem] text-muted-foreground tabular">
              {cat.pass}/{cat.checks.length} passing
            </span>
            <span className={cn("text-[0.6875rem] font-medium", band.text)}>
              {cat.fail > 0
                ? `${cat.fail} to fix`
                : cat.warn > 0
                  ? `${cat.warn} to review`
                  : "All clear"}
            </span>
          </a>
        )
      })}

      {/* Holds the slot while PageSpeed Insights runs, so the grid does not
          reflow under the cursor 20 seconds after the report appears. Mirrors
          the real card's layout exactly so nothing shifts when it lands. */}
      {perfLoading && (
        <div
          className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-background px-3 py-4 text-center"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="grid h-16 w-16 place-items-center">
            <Loader2
              className="h-7 w-7 animate-spin text-primary"
              aria-hidden
            />
          </span>
          <Gauge className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="text-xs font-medium leading-tight text-muted-foreground">
            Speed (Core Web Vitals)
          </span>
          <span className="text-[0.6875rem] text-muted-foreground tabular">
            measuring… {elapsed}s
          </span>
        </div>
      )}

      {perfFailed && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-background px-3 py-4 text-center">
          <span className="grid h-16 w-16 place-items-center">
            <Gauge className="h-7 w-7 text-muted-foreground/50" aria-hidden />
          </span>
          <Gauge className="h-4 w-4 text-muted-foreground" aria-hidden />
          <span className="text-xs font-medium leading-tight text-muted-foreground">
            Speed (Core Web Vitals)
          </span>
          <button
            type="button"
            onClick={onRetryPerf}
            className="rounded text-[0.6875rem] font-medium text-link underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            unavailable — retry
          </button>
        </div>
      )}
    </div>
  )
}

function CheckRow({ check }: { check: AuditCheck }) {
  return (
    <div className="flex gap-3 py-3.5">
      <StatusDot status={check.status} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-sm font-medium">{check.label}</span>
          {check.deepLink && (
            <Link
              href={check.deepLink}
              className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
            >
              Open tool <ExternalLink className="h-3 w-3" aria-hidden />
            </Link>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{check.detail}</p>
        {check.value && (
          <p className="mt-2 break-all rounded bg-surface-2 px-2 py-1 font-mono text-xs text-foreground/80">
            {check.value}
          </p>
        )}
        {check.status !== "pass" && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            {/* An info finding has no fix — the hint is context, not work. */}
            {check.status === "info" ? (
              <Info className="mt-px h-3 w-3 shrink-0" aria-hidden />
            ) : (
              <Wrench className="mt-px h-3 w-3 shrink-0" aria-hidden />
            )}
            <span>{check.fixHint}</span>
          </p>
        )}
      </div>
    </div>
  )
}

function ReportSkeleton() {
  return (
    <div className="mt-10 space-y-8">
      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <Skeleton className="h-[214px] w-full rounded-xl sm:w-[220px]" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
      <span className="sr-only">Running audit</span>
    </div>
  )
}

export default function AuditClient({ query }: { query: string }) {
  const router = useRouter()
  const initial = useMemo(() => initialQuery(query), [query])
  const [value, setValue] = useState(initial)
  const [report, setReport] = useState<AuditReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)
  /**
   * Keyed by the URL it describes so "still measuring" is derived rather than
   * set at the top of an effect — a stale result from a previous audit can
   * never be shown against the current one.
   */
  const [perfResult, setPerfResult] = useState<{
    url: string
    category: CategoryScore | null
  } | null>(null)
  const [perfAttempt, setPerfAttempt] = useState(0)
  const hasFetched = useRef(false)

  const run = useCallback(async (url: string) => {
    if (!url.trim()) {
      setError("Enter a URL")
      return
    }
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const res = await fetch(`/api/audit?q=${encodeURIComponent(url.trim())}`)
      const data = await res.json()
      if (res.status === 429 || data.error === "Rate limit exceeded") {
        const resetMs = data.reset
        const hours =
          typeof resetMs === "number"
            ? Math.max(1, Math.ceil((resetMs - Date.now()) / 3_600_000))
            : "?"
        setError(`Rate limit exceeded. Try again in ${hours} hours.`)
        return
      }
      if (!res.ok) {
        setError(data.error || "Audit failed")
        return
      }
      setReport(data as AuditReport)
    } catch {
      setError("Audit failed")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    void run(initial)
  }, [initial, run])

  /**
   * PageSpeed Insights takes 15-30s, so it runs only once the report is on
   * screen and the category drops in when it lands.
   *
   * It deliberately does not feed the headline score. Field data exists only
   * for origins with enough Chrome traffic to be sampled, so folding it in
   * would make two sites' scores mean different things depending on how
   * popular they are.
   */
  useEffect(() => {
    if (!report) return
    const controller = new AbortController()
    const url = report.pageUrl
    ;(async () => {
      try {
        const res = await fetch(
          `/api/pagespeed?q=${encodeURIComponent(url)}`,
          { signal: controller.signal }
        )
        const data = await res.json()
        setPerfResult({
          url,
          // No key, PSI down, or rate limited — the rest of the report stands
          // on its own, so record the attempt and render nothing.
          category: res.ok && data?.ok ? (data.category as CategoryScore) : null,
        })
      } catch {
        if (!controller.signal.aborted) setPerfResult({ url, category: null })
      }
    })()
    return () => controller.abort()
  }, [report, perfAttempt])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = value.trim() || DEFAULT_SITE
    if (next === initial) {
      void run(next)
      return
    }
    // Navigate only — remount via key={query} runs the audit once.
    router.push(`/audit?q=${encodeURIComponent(next)}`)
  }

  // Settled only when the stored result belongs to the report on screen.
  const perfSettled = Boolean(report) && perfResult?.url === report?.pageUrl
  const perf = perfSettled ? (perfResult?.category ?? null) : null
  const perfLoading = Boolean(report) && !perfSettled
  // Settled with nothing to show: PSI timed out, errored, or has no key.
  // Saying so beats a spinner that quietly disappears after a minute.
  const perfFailed = perfSettled && !perf
  const retryPerf = () => {
    setPerfResult(null)
    setPerfAttempt((n) => n + 1)
  }
  const perfElapsed = useElapsedSeconds(perfLoading)
  const extraCategories = useMemo(() => (perf ? [perf] : []), [perf])

  const copyReport = async () => {
    if (!report) return
    await navigator.clipboard.writeText(
      reportToMarkdown(report, extraCategories)
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyAiPrompt = async () => {
    if (!report) return
    await navigator.clipboard.writeText(
      reportToAiPrompt(report, extraCategories)
    )
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  const band = report ? scoreBand(report.score) : null

  const tocItems = useMemo<TocItem[]>(() => {
    if (!report) return []
    const items: TocItem[] = [{ id: "audit-overview", label: "Overview" }]
    if (report.fixFirst.length > 0) {
      items.push({
        id: "audit-fix-first",
        label: "Fix first",
        badge: {
          text: String(report.fixFirst.length),
          tone: report.fail > 0 ? "danger" : "warning",
        },
      })
    }
    for (const cat of perf ? [...report.categories, perf] : report.categories) {
      items.push({
        id: `audit-${cat.id}`,
        label: cat.label,
        badge:
          cat.fail > 0
            ? { text: String(cat.fail), tone: "danger" }
            : cat.warn > 0
              ? { text: String(cat.warn), tone: "warning" }
              : undefined,
      })
    }
    if (!perf && perfLoading) {
      items.push({ id: "audit-performance-loading", label: "Speed (measuring…)" })
    }
    return items
  }, [report, perf, perfLoading])

  return (
    <Container width="reading" className="relative mt-10">
      <ToolSearchForm
        value={value}
        onChange={setValue}
        onSubmit={onSubmit}
        ariaLabel="Site URL to audit"
        loading={loading}
        buttonLabel="Run free audit"
        loadingLabel="Auditing…"
      />
      <ToolExample
        url={DEFAULT_SITE}
        onPick={() => {
          setValue(DEFAULT_SITE)
          if (DEFAULT_SITE === initial) {
            void run(DEFAULT_SITE)
            return
          }
          router.push(`/audit?q=${encodeURIComponent(DEFAULT_SITE)}`)
        }}
      />

      {error && <ToolError>{error}</ToolError>}

      {loading && <ReportSkeleton />}

      {report && !loading && (
        <TocRail
          items={tocItems}
          footer={
            <ReportActions
              layout="stack"
              copied={copied}
              promptCopied={promptCopied}
              onCopyReport={() => void copyReport()}
              onCopyPrompt={() => void copyAiPrompt()}
              onRerun={() => void run(value)}
            />
          }
        />
      )}

      {report && !loading && (
        <FadeIn className="mt-10 space-y-10">
          <header id="audit-overview" className="scroll-mt-28 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-medium">
                  {report.pageUrl}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {report.isHomepage
                    ? "Homepage audit"
                    : "Page-level audit · site checks still run against the origin"}
                  {" · "}
                  {new Date(report.auditedAt).toLocaleString()}
                </p>
              </div>
              <div className="xl:hidden">
              <ReportActions
                layout="row"
                copied={copied}
                promptCopied={promptCopied}
                onCopyReport={() => void copyReport()}
                onCopyPrompt={() => void copyAiPrompt()}
                onRerun={() => void run(value)}
              />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
              {/* Audit score — the primary metric */}
              <div className="flex flex-col items-center rounded-xl border bg-surface-1 px-6 py-6 sm:w-[220px]">
                <span className="text-label font-medium uppercase text-muted-foreground">
                  Audit score
                </span>
                <div className="mt-4">
                  <ScoreRing value={report.score} size={132} />
                </div>
                {band && (
                  <span className={cn("mt-3 text-sm font-medium", band.text)}>
                    {band.label}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <StatusChip status="fail" count={report.fail} />
                  <StatusChip status="warn" count={report.warn} />
                  <StatusChip status="pass" count={report.pass} />
                  {report.info > 0 && (
                    <StatusChip status="info" count={report.info} />
                  )}
                  {/* The report is already complete at this point — this says
                      one more category is still on its way, so a reader does
                      not take the summary as final and leave. */}
                  {perfLoading && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md border border-dashed px-2 py-1 text-xs font-medium text-muted-foreground"
                      aria-live="polite"
                    >
                      <Loader2
                        className="h-3.5 w-3.5 animate-spin text-primary"
                        aria-hidden
                      />
                      Measuring speed
                      <span className="tabular opacity-70">{perfElapsed}s</span>
                    </span>
                  )}
                </div>

                {/* Domain Rating — secondary */}
                <div className="flex flex-1 flex-col justify-center rounded-xl border px-5 py-5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" aria-hidden />
                    <span className="text-label font-medium uppercase">
                      Domain Rating
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-mono text-[2.75rem] font-semibold leading-none tracking-tight tabular">
                      {typeof report.domainRating === "number"
                        ? Math.round(report.domainRating)
                        : "—"}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                  {typeof report.domainRating !== "number" && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {report.domainRatingError || "Unavailable"}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <Link
                      href={`/domain-rating?q=${encodeURIComponent(report.domain)}`}
                      className="inline-flex items-center gap-1 underline underline-offset-2 transition-colors hover:text-foreground"
                    >
                      Open DR tool <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>
                    <span className="opacity-60" aria-hidden>
                      ·
                    </span>
                    <a
                      href={AHREFS_DR_ATTRIBUTION.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 opacity-70 transition-opacity hover:opacity-100"
                    >
                      {AHREFS_DR_ATTRIBUTION.text}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <CategoryRings
              report={report}
              perf={perf}
              perfLoading={perfLoading}
              perfFailed={perfFailed}
              onRetryPerf={retryPerf}
              elapsed={perfElapsed}
            />
          </header>

          {report.fixFirst.length > 0 && (
            <section id="audit-fix-first" className="scroll-mt-28">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
                <h2 className="text-subhead font-semibold">Fix first</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Highest-impact issues, ordered by severity.
              </p>
              <div className="mt-4 divide-y rounded-lg border px-4">
                {report.fixFirst.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-subhead font-semibold">All checks</h2>
            {(perf ? [...report.categories, perf] : report.categories).map(
              (cat) => {
              const CatIcon = categoryIcon[cat.id]
              const catBand = scoreBand(cat.score)
              return (
                <Disclosure
                  key={cat.id}
                  id={`audit-${cat.id}`}
                  className="scroll-mt-28"
                  defaultOpen
                  contentClassName="divide-y"
                  trigger={
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <CatIcon
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="font-medium">{cat.label}</span>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-1 w-12 overflow-hidden rounded-full bg-border"
                          aria-hidden
                        >
                          <span
                            className={cn(
                              "block h-full rounded-full",
                              catBand.bg
                            )}
                            style={{ width: `${cat.score}%` }}
                          />
                        </span>
                        <span className="font-mono text-xs text-muted-foreground tabular">
                          {cat.score}
                        </span>
                      </span>
                      <span className="ml-auto flex items-center gap-2.5">
                        <StatusCount status="fail" count={cat.fail} />
                        <StatusCount status="warn" count={cat.warn} />
                        <StatusCount status="pass" count={cat.pass} />
                        {cat.info > 0 && (
                          <StatusCount status="info" count={cat.info} />
                        )}
                      </span>
                    </span>
                  }
                >
                  {cat.checks.map((check) => (
                    <CheckRow key={check.id} check={check} />
                  ))}
                </Disclosure>
                )
              }
            )}

            {perfLoading && (
              <div
                id="audit-performance-loading"
                className="scroll-mt-28 rounded-lg border border-dashed px-4 py-3.5"
                aria-live="polite"
                aria-busy="true"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <Gauge
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="font-medium">Speed (Core Web Vitals)</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2
                      className="h-3.5 w-3.5 animate-spin text-primary"
                      aria-hidden
                    />
                    <span className="tabular">{perfElapsed}s</span>
                  </span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  PageSpeed Insights is loading the page on a simulated device.
                  This usually takes 15–30 seconds, and longer on a heavy page.
                  Everything above is already final.
                </p>

                {/* One row per metric it will return, so the block keeps its
                    height and the page does not jump when the data lands. */}
                <div className="mt-4 space-y-3">
                  {[
                    "Largest Contentful Paint",
                    "Interaction to Next Paint",
                    "Cumulative Layout Shift",
                    "Total Blocking Time",
                  ].map((label) => (
                    <div key={label} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                      <span className="text-sm text-muted-foreground/70">
                        {label}
                      </span>
                      <Skeleton className="ml-auto h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {perfFailed && (
              <div className="rounded-lg border border-dashed px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <Gauge
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="font-medium text-muted-foreground">
                    Speed (Core Web Vitals)
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  PageSpeed Insights did not return in time. It is a separate
                  Google service and is occasionally slow — every other check in
                  this report is unaffected.
                </p>
                <button
                  type="button"
                  onClick={retryPerf}
                  className="mt-3 inline-flex items-center gap-1.5 rounded text-sm text-link underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Measure speed again
                </button>
              </div>
            )}
          </section>
        </FadeIn>
      )}
    </Container>
  )
}
