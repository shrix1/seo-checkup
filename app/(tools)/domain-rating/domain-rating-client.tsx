"use client"

import Container from "@/components/container"
import { FadeIn } from "@/components/motion"
import ScoreRing, { scoreBand } from "@/components/score-ring"
import ToolSearchForm, {
  ToolError,
  ToolExample,
} from "@/components/tool-search-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AHREFS_DR_ATTRIBUTION } from "@/lib/ahrefs-dr"
import { cn } from "@/lib/utils"
import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const DEFAULT_SITE = "https://shrix1.com"

type DrResult = {
  domain: string
  domainRating: number | null
  error?: string
}

function initialQuery(query: string) {
  if (!query) return DEFAULT_SITE
  try {
    return decodeURIComponent(query)
  } catch {
    return query
  }
}

export default function DomainRatingClient({ query }: { query: string }) {
  const router = useRouter()
  const initial = useMemo(() => initialQuery(query), [query])
  const [value, setValue] = useState(initial)
  const [results, setResults] = useState<DrResult[]>([])
  const [truncated, setTruncated] = useState(false)
  const [maxTargets, setMaxTargets] = useState(5)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const run = useCallback(async (input: string) => {
    if (!input.trim()) {
      setError("Enter a domain or URL")
      return
    }
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const res = await fetch(
        `/api/domain-rating?q=${encodeURIComponent(input.trim())}`
      )
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
        setError(data.error || "Could not load Domain Rating")
        return
      }
      setResults(
        Array.isArray(data.results)
          ? data.results
          : [{ domain: data.domain, domainRating: data.domainRating }]
      )
      setTruncated(Boolean(data.truncated))
      if (typeof data.maxTargets === "number") setMaxTargets(data.maxTargets)
    } catch {
      setError("Could not load Domain Rating")
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
    router.push(`/domain-rating?q=${encodeURIComponent(next)}`)
  }

  const sorted = useMemo(
    () =>
      [...results].sort(
        (a, b) => (b.domainRating ?? -1) - (a.domainRating ?? -1)
      ),
    [results]
  )

  const single = sorted.length === 1 ? sorted[0] : null
  const singleBand =
    single && typeof single.domainRating === "number"
      ? scoreBand(single.domainRating)
      : null

  return (
    <Container width={sorted.length > 1 ? "reading" : "narrow"} className="mt-10">
      <ToolSearchForm
        value={value}
        onChange={setValue}
        onSubmit={onSubmit}
        placeholder="example.com, competitor.com"
        ariaLabel="Domain or domains to check"
        loading={loading}
        buttonLabel="Check DR"
        loadingLabel="Checking…"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Compare up to {maxTargets} domains — separate them with commas.{" "}
        <button
          type="button"
          onClick={() => {
            const demo = "vercel.com, netlify.com, cloudflare.com"
            setValue(demo)
            router.push(`/domain-rating?q=${encodeURIComponent(demo)}`)
          }}
          className="rounded-sm underline underline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Try a comparison
        </button>
      </p>
      <ToolExample
        url={DEFAULT_SITE}
        onPick={() => {
          setValue(DEFAULT_SITE)
          if (DEFAULT_SITE === initial) {
            void run(DEFAULT_SITE)
            return
          }
          router.push(`/domain-rating?q=${encodeURIComponent(DEFAULT_SITE)}`)
        }}
      />

      {error && <ToolError>{error}</ToolError>}

      {loading && (
        <div className="mt-10 flex flex-col items-center rounded-xl border bg-surface-1 px-6 py-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-5 h-[152px] w-[152px] rounded-full" />
          <Skeleton className="mt-5 h-4 w-24" />
        </div>
      )}

      {!loading && single && typeof single.domainRating === "number" && (
        <FadeIn className="mt-10">
          <div className="flex flex-col items-center rounded-xl border bg-surface-1 px-6 py-8 text-center">
            <p className="font-mono text-sm text-muted-foreground">
              {single.domain}
            </p>
            <div className="mt-5">
              <ScoreRing value={single.domainRating} size={152} strokeWidth={10} />
            </div>
            {singleBand && (
              <span className={cn("mt-4 text-sm font-medium", singleBand.text)}>
                {singleBand.label}
              </span>
            )}
          </div>

          <p className="mt-6 text-body text-muted-foreground">
            Domain Rating estimates relative backlink profile strength on a
            100-point logarithmic scale.
          </p>

          <div className="mt-8">
            <Button asChild>
              <Link
                href={`/audit?q=${encodeURIComponent(`https://${single.domain}`)}`}
              >
                Run full site audit
              </Link>
            </Button>
          </div>

          <Attribution />
        </FadeIn>
      )}

      {!loading && sorted.length > 1 && (
        <FadeIn className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-subhead font-semibold">Comparison</h2>
            <span className="text-sm text-muted-foreground">
              {sorted.length} domains, strongest first
            </span>
          </div>

          <ul className="mt-4 divide-y rounded-lg border">
            {sorted.map((result) => {
              const dr = result.domainRating
              const band = typeof dr === "number" ? scoreBand(dr) : null
              return (
                <li key={result.domain} className="px-4 py-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="min-w-0 truncate font-mono text-sm font-medium">
                      {result.domain}
                    </span>
                    <span className="flex items-baseline gap-2">
                      <span
                        className={cn(
                          "font-mono text-xl font-semibold tabular",
                          band?.text ?? "text-muted-foreground"
                        )}
                      >
                        {typeof dr === "number" ? Math.round(dr) : "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        band?.bg ?? "bg-border-strong"
                      )}
                      style={{
                        width: `${typeof dr === "number" ? Math.max(1, dr) : 0}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{band?.label ?? result.error ?? "Unavailable"}</span>
                    <span aria-hidden>·</span>
                    <Link
                      href={`/audit?q=${encodeURIComponent(`https://${result.domain}`)}`}
                      className="inline-flex items-center gap-1 underline underline-offset-2 transition-colors hover:text-foreground"
                    >
                      Audit it <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>

          {truncated && (
            <p className="mt-3 text-xs text-warning">
              Only the first {maxTargets} domains were checked.
            </p>
          )}

          <Attribution />
        </FadeIn>
      )}
    </Container>
  )
}

function Attribution() {
  return (
    <p className="mt-6 text-sm">
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
        className="text-muted-foreground underline underline-offset-2"
      >
        License
      </Link>
    </p>
  )
}
