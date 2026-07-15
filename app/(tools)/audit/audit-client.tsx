"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { FadeIn } from "@/components/motion"
import { AHREFS_DR_ATTRIBUTION } from "@/lib/ahrefs-dr"
import type { AuditCheck, AuditReport, CheckStatus } from "@/lib/audit/types"
import { cn } from "@/lib/utils"
import { Check, ChevronDown, Copy, ExternalLink, Loader } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const DEFAULT_SITE = "https://shrix1.com"

function initialQuery(query: string) {
  if (!query) return DEFAULT_SITE
  try {
    return decodeURIComponent(query)
  } catch {
    return query
  }
}

function statusColor(status: CheckStatus) {
  if (status === "pass") return "text-emerald-600 dark:text-emerald-400"
  if (status === "warn") return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

function statusDot(status: CheckStatus) {
  if (status === "pass") return "bg-emerald-500"
  if (status === "warn") return "bg-amber-500"
  return "bg-red-500"
}

function reportToMarkdown(report: AuditReport): string {
  const lines = [
    `# SEO Audit — ${report.domain}`,
    `Score: ${report.score}/100`,
    `Audited: ${report.auditedAt}`,
    `URL: ${report.finalUrl}`,
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
    ...report.categories.flatMap((cat) => [
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

function CheckRow({ check }: { check: AuditCheck }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b border-border/60 last:border-0">
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <span
          className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", statusDot(check.status))}
          aria-hidden
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-medium text-sm">{check.label}</span>
            <span
              className={cn(
                "text-xs font-mono uppercase tracking-wide",
                statusColor(check.status)
              )}
            >
              {check.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{check.detail}</p>
          {check.value && (
            <p className="text-xs font-mono mt-1 break-all text-foreground/80">
              {check.value}
            </p>
          )}
          {check.status !== "pass" && (
            <p className="text-xs mt-1.5 text-muted-foreground">
              Fix: {check.fixHint}
            </p>
          )}
        </div>
      </div>
      {check.deepLink && (
        <Link
          href={check.deepLink}
          className="text-xs underline underline-offset-2 shrink-0 inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          Open tool <ExternalLink className="h-3 w-3" />
        </Link>
      )}
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
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({
    onpage: true,
    crawl: true,
    trust: true,
  })
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

  const copyReport = async () => {
    if (!report) return
    await navigator.clipboard.writeText(reportToMarkdown(report))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-8">
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://example.com"
          className="font-mono"
          aria-label="Site URL to audit"
        />
        <Button type="submit" disabled={loading} className="shrink-0">
          {loading ? (
            <>
              <Loader className="h-4 w-4 animate-spin mr-2" />
              Auditing…
            </>
          ) : (
            "Run free audit"
          )}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-2 font-mono">
        Try{" "}
        <button
          type="button"
          className="underline underline-offset-2"
          onClick={() => {
            setValue(DEFAULT_SITE)
            if (DEFAULT_SITE === initial) {
              void run(DEFAULT_SITE)
              return
            }
            router.push(`/audit?q=${encodeURIComponent(DEFAULT_SITE)}`)
          }}
        >
          {DEFAULT_SITE}
        </button>
      </p>

      {error && (
        <p className="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {loading && (
        <div className="mt-10 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {report && !loading && (
        <FadeIn className="mt-10 space-y-10">
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="font-mono text-sm text-muted-foreground">
                {report.domain}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(report.auditedAt).toLocaleString()}
              </p>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-6xl font-bold font-mono tracking-tight">
                  {report.score}
                </span>
                <span className="text-muted-foreground text-sm">/ 100</span>
              </div>
              <div className="mt-3 flex gap-4 text-xs font-mono">
                <span className="text-red-600 dark:text-red-400">
                  {report.fail} fail
                </span>
                <span className="text-amber-600 dark:text-amber-400">
                  {report.warn} warn
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {report.pass} pass
                </span>
              </div>
              {typeof report.domainRating === "number" && (
                <p className="mt-3 text-sm text-muted-foreground">
                  DR {Math.round(report.domainRating)} ·{" "}
                  <Link
                    href={AHREFS_DR_ATTRIBUTION.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    {AHREFS_DR_ATTRIBUTION.text}
                  </Link>
                  {" · "}
                  <Link
                    href={AHREFS_DR_ATTRIBUTION.license}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    License
                  </Link>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={copyReport}>
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy report
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void run(value)}
              >
                Re-run
              </Button>
            </div>
          </header>

          {report.fixFirst.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold">Fix first</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Highest-impact issues, ordered by severity.
              </p>
              <div className="mt-4 rounded-lg border px-4">
                {report.fixFirst.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <h3 className="text-lg font-semibold">All checks</h3>
            {report.categories.map((cat) => {
              const open = openCats[cat.id] ?? true
              return (
                <div key={cat.id} className="rounded-lg border overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                    onClick={() =>
                      setOpenCats((prev) => ({ ...prev, [cat.id]: !open }))
                    }
                    aria-expanded={open}
                  >
                    <div>
                      <span className="font-medium">{cat.label}</span>
                      <span className="ml-2 font-mono text-sm text-muted-foreground">
                        {cat.score}/100
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                      <span className="text-red-600 dark:text-red-400">
                        {cat.fail}
                      </span>
                      <span className="text-amber-600 dark:text-amber-400">
                        {cat.warn}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {cat.pass}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          open && "rotate-180"
                        )}
                      />
                    </div>
                  </button>
                  {open && (
                    <div className="px-4 border-t bg-muted/20">
                      {cat.checks.map((check) => (
                        <CheckRow key={check.id} check={check} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        </FadeIn>
      )}
    </div>
  )
}
