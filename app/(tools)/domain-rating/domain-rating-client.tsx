"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { FadeIn } from "@/components/motion"
import { AHREFS_DR_ATTRIBUTION } from "@/lib/ahrefs-dr"
import { Loader } from "lucide-react"
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

export default function DomainRatingClient({ query }: { query: string }) {
  const router = useRouter()
  const initial = useMemo(() => initialQuery(query), [query])
  const [value, setValue] = useState(initial)
  const [domain, setDomain] = useState<string | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const run = useCallback(async (url: string) => {
    if (!url.trim()) {
      setError("Enter a domain or URL")
      return
    }
    setLoading(true)
    setError(null)
    setRating(null)
    setDomain(null)
    try {
      const res = await fetch(
        `/api/domain-rating?q=${encodeURIComponent(url.trim())}`
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
        if (data.domain) setDomain(data.domain)
        return
      }
      setDomain(data.domain)
      setRating(data.domainRating)
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

  return (
    <div className="w-full max-w-xl mx-auto mt-8">
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="example.com"
          className="font-mono"
          aria-label="Domain to check"
        />
        <Button type="submit" disabled={loading} className="shrink-0">
          {loading ? (
            <>
              <Loader className="h-4 w-4 animate-spin mr-2" />
              Checking…
            </>
          ) : (
            "Check DR"
          )}
        </Button>
      </form>

      {error && (
        <p className="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {loading && (
        <div className="mt-10 space-y-3">
          <Skeleton className="h-20 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      )}

      {typeof rating === "number" && !loading && (
        <FadeIn className="mt-12">
          <p className="font-mono text-sm text-muted-foreground">{domain}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-7xl font-bold font-mono tracking-tight">
              {Math.round(rating)}
            </span>
            <span className="text-muted-foreground">/ 100</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground max-w-md">
            Domain Rating estimates relative backlink profile strength on a
            100-point logarithmic scale.
          </p>
          <p className="mt-3 text-sm">
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
              className="underline underline-offset-2 text-muted-foreground"
            >
              License
            </Link>
          </p>
          <div className="mt-8">
            <Button asChild>
              <Link
                href={`/audit?q=${encodeURIComponent(domain ? `https://${domain}` : value)}`}
              >
                Run full site audit
              </Link>
            </Button>
          </div>
        </FadeIn>
      )}
    </div>
  )
}
