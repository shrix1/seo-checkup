"use client"

import Container from "@/components/container"
import { FadeIn } from "@/components/motion"
import ScoreRing from "@/components/score-ring"
import { StatusChip, StatusDot } from "@/components/status"
import ToolSearchForm, {
  ToolError,
  ToolExample,
} from "@/components/tool-search-form"
import { Skeleton } from "@/components/ui/skeleton"
import type { CategoryScore } from "@/lib/audit/types"
import { cn, stripScheme } from "@/lib/utils"
import { Gauge, Info, Monitor, Smartphone, Wrench } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const DEFAULT_SITE = "shrix1.com"

type Strategy = "mobile" | "desktop"

function initialQuery(query: string) {
  if (!query) return DEFAULT_SITE
  try {
    return decodeURIComponent(query)
  } catch {
    return query
  }
}

/** Field data is the ranking signal; lab is a single simulated run. */
function sourceOf(value?: string): "field" | "lab" | "none" {
  if (!value) return "none"
  if (value.includes("field")) return "field"
  if (value.includes("lab")) return "lab"
  return "none"
}

function MetricRow({
  label,
  value,
  detail,
  fixHint,
  status,
}: {
  label: string
  value?: string
  detail: string
  fixHint: string
  status: "pass" | "warn" | "fail" | "info"
}) {
  const source = sourceOf(value)
  return (
    <div className="flex gap-3 py-4">
      <StatusDot status={status} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="font-medium">{label}</span>
          {value && (
            <span className="font-mono text-sm tabular">
              {value.split(" · ")[0]}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {source !== "none" && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.6875rem] font-medium",
                source === "field"
                  ? "bg-success-subtle text-success"
                  : "bg-surface-2 text-muted-foreground"
              )}
            >
              {source === "field" ? "Real users" : "Lab simulation"}
            </span>
          )}
        </div>
        {status !== "pass" && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            {status === "info" ? (
              <Info className="mt-px h-3 w-3 shrink-0" aria-hidden />
            ) : (
              <Wrench className="mt-px h-3 w-3 shrink-0" aria-hidden />
            )}
            <span>{fixHint}</span>
          </p>
        )}
      </div>
    </div>
  )
}

function ResultSkeleton() {
  return (
    <div className="mt-10 space-y-6">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-[140px] w-[140px] rounded-full" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="divide-y rounded-lg border px-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-4">
            <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-full max-w-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CoreWebVitalsClient({ query }: { query: string }) {
  const router = useRouter()
  const initial = useMemo(() => initialQuery(query), [query])
  const [value, setValue] = useState(initial)
  const [strategy, setStrategy] = useState<Strategy>("mobile")
  const [result, setResult] = useState<CategoryScore | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const run = useCallback(async (url: string, s: Strategy) => {
    if (!url.trim()) {
      setError("Enter a URL")
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(
        `/api/pagespeed?q=${encodeURIComponent(url.trim())}&strategy=${s}`
      )
      const data = await res.json()
      if (res.status === 429 || data.error === "Rate limit exceeded") {
        const hours =
          typeof data.reset === "number"
            ? Math.max(1, Math.ceil((data.reset - Date.now()) / 3_600_000))
            : "?"
        setError(`Rate limit exceeded. Try again in ${hours} hours.`)
        return
      }
      if (res.status === 501) {
        setError(
          "Core Web Vitals are not configured on this deployment (PAGESPEED_API_KEY is unset)."
        )
        return
      }
      if (!res.ok || !data?.ok) {
        setError(data.error || "Could not measure this URL")
        return
      }
      setResult(data.category as CategoryScore)
    } catch {
      setError("Could not measure this URL")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    void run(initial, "mobile")
  }, [initial, run])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = value.trim() || DEFAULT_SITE
    if (next === initial) {
      void run(next, strategy)
      return
    }
    router.push(`/core-web-vitals?q=${encodeURIComponent(next)}`)
  }

  const switchStrategy = (s: Strategy) => {
    if (s === strategy) return
    setStrategy(s)
    void run(value.trim() || DEFAULT_SITE, s)
  }

  const cwv = result?.checks.filter((c) => c.id.startsWith("cwv-")) ?? []
  const supporting = result?.checks.filter((c) => c.id.startsWith("perf-")) ?? []
  const anyField = cwv.some((c) => sourceOf(c.value) === "field")

  return (
    <Container width="reading" className="relative mt-10">
      <ToolSearchForm
        value={value}
        onChange={setValue}
        onSubmit={onSubmit}
        placeholder="yoursite.com"
        ariaLabel="URL to measure"
        loading={loading}
        buttonLabel="Measure"
        loadingLabel="Measuring…"
      />
      <ToolExample url={DEFAULT_SITE} onPick={() => setValue(DEFAULT_SITE)} />

      {/* Mobile is the default because Google indexes mobile-first. */}
      <div className="mt-5 flex items-center justify-center gap-1 rounded-lg border p-1">
        {(
          [
            { id: "mobile" as const, label: "Mobile", Icon: Smartphone },
            { id: "desktop" as const, label: "Desktop", Icon: Monitor },
          ]
        ).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => switchStrategy(id)}
            aria-pressed={strategy === id}
            disabled={loading}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
              strategy === id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-surface-1 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {error && <ToolError>{error}</ToolError>}
      {loading && <ResultSkeleton />}

      {result && !loading && (
        <FadeIn className="mt-10 space-y-8">
          <header className="flex flex-col items-center text-center">
            <ScoreRing value={result.score} size={140} />
            <p className="mt-4 font-mono text-sm text-muted-foreground">
              {stripScheme(value)}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <StatusChip status="fail" count={result.fail} />
              <StatusChip status="warn" count={result.warn} />
              <StatusChip status="pass" count={result.pass} />
              {result.info > 0 && (
                <StatusChip status="info" count={result.info} />
              )}
            </div>
            <p className="mt-4 max-w-prose text-sm text-muted-foreground">
              {anyField ? (
                <>
                  This origin has enough Chrome traffic to appear in the Chrome
                  UX Report, so the three vitals below are{" "}
                  <strong className="font-medium text-foreground">
                    real user data
                  </strong>{" "}
                  — the same numbers Google ranks on.
                </>
              ) : (
                <>
                  This URL has no Chrome UX Report data, so everything below is a
                  single{" "}
                  <strong className="font-medium text-foreground">
                    simulated run
                  </strong>
                  . Useful for diagnosis, but it is not the number Google ranks
                  on. That needs real traffic.
                </>
              )}
            </p>
          </header>

          <section>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" aria-hidden />
              <h2 className="text-subhead font-semibold">Core Web Vitals</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              The three metrics Google uses as a ranking signal.
            </p>
            <div className="mt-4 divide-y rounded-lg border px-4">
              {cwv.map((c) => (
                <MetricRow key={c.id} {...c} />
              ))}
            </div>
          </section>

          {supporting.length > 0 && (
            <section>
              <h2 className="text-subhead font-semibold">Supporting metrics</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Not ranking signals themselves, but they explain the numbers
                above.
              </p>
              <div className="mt-4 divide-y rounded-lg border px-4">
                {supporting.map((c) => (
                  <MetricRow key={c.id} {...c} />
                ))}
              </div>
            </section>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Speed is one input among many.{" "}
            <Link
              href={`/audit?q=${encodeURIComponent(value.trim() || DEFAULT_SITE)}`}
              className="text-link underline underline-offset-2"
            >
              Run the full audit
            </Link>{" "}
            for crawl access, on-page signals and AI visibility.
          </p>
        </FadeIn>
      )}
    </Container>
  )
}
