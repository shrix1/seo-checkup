"use client"

import Container from "@/components/container"
import { FadeIn } from "@/components/motion"
import ToolSearchForm, {
  ToolError,
  ToolExample,
} from "@/components/tool-search-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { parseRobots } from "@/lib/robots-parser"
import { Check, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AiCrawlerMatrix,
  RobotsGroups,
  RobotsIssues,
  RobotsUrlTester,
} from "./robots-analysis"

const DEFAULT_ROBOTS = "https://shrix1.com/robots.txt"

const DIRECTIVE = /^(User-agent|Disallow|Allow|Sitemap|Crawl-delay|Host)\s*:/i

function initialQuery(query: string) {
  if (!query) return DEFAULT_ROBOTS
  try {
    return decodeURIComponent(query)
  } catch {
    return query
  }
}

function HighlightedRobots({ text }: { text: string }) {
  const lines = text.split(/\r?\n/)
  return (
    <pre className="w-full overflow-x-auto rounded-lg border bg-surface-2 p-4 text-left font-mono text-sm leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        const isDirective = DIRECTIVE.test(trimmed)
        const isComment = trimmed.startsWith("#")
        return (
          <div
            key={i}
            className={
              isComment
                ? "text-muted-foreground/70"
                : isDirective
                  ? "text-foreground"
                  : "text-muted-foreground"
            }
          >
            {isDirective ? (
              <>
                <span className="font-medium text-primary">
                  {trimmed.split(":")[0]}:
                </span>
                <span className="whitespace-pre-wrap break-all">
                  {trimmed.slice(trimmed.indexOf(":") + 1)}
                </span>
              </>
            ) : (
              line || " "
            )}
          </div>
        )
      })}
    </pre>
  )
}

const InputFieldRobots = ({ query }: { query: string }) => {
  const router = useRouter()
  const initial = useMemo(() => initialQuery(query), [query])
  const [value, setValue] = useState(initial)
  const [body, setBody] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const hasFetched = useRef(false)

  const parsed = useMemo(() => parseRobots(body ?? ""), [body])
  const origin = useMemo(() => {
    try {
      return new URL(initial).origin
    } catch {
      return ""
    }
  }, [initial])

  const fetchRobots = useCallback(async (url: string) => {
    if (!url) {
      setError("Enter a robots.txt URL")
      return
    }
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/v1?q=${encodeURIComponent(url)}&tool=ROBOTS`)
      const json = await res.json()

      if (res.status === 429 || json.error === "Rate limit exceeded") {
        const resetMs = json.reset
        const hours =
          typeof resetMs === "number"
            ? Math.max(1, Math.ceil((resetMs - Date.now()) / 3_600_000))
            : "?"
        setError(`Rate limit exceeded. Try again in ${hours} hours.`)
        setBody(null)
        return
      }

      if (!res.ok || typeof json !== "string") {
        setError(`Could not load robots.txt from ${url}`)
        setBody(null)
        return
      }

      setBody(json)
    } catch (err) {
      console.error("Error fetching robots.txt:", err)
      setError(`Could not load robots.txt from ${url}`)
      setBody(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    void fetchRobots(initial)
  }, [fetchRobots, initial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (value === initial) {
      await fetchRobots(value)
      return
    }
    router.replace(`/robots?q=${encodeURIComponent(value)}`)
  }

  const handleCopy = async () => {
    if (!body) return
    await navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Container width="reading" className="mt-10">
      <ToolSearchForm
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder="yoursite.com/robots.txt"
        ariaLabel="robots.txt URL to inspect"
        loading={loading}
        buttonLabel="Fetch robots.txt"
        loadingLabel="Fetching…"
        autoFocus
      />
      <ToolExample
        url={DEFAULT_ROBOTS}
        onPick={() => {
          setValue(DEFAULT_ROBOTS)
          if (DEFAULT_ROBOTS === initial) {
            void fetchRobots(DEFAULT_ROBOTS)
            return
          }
          router.replace(`/robots?q=${encodeURIComponent(DEFAULT_ROBOTS)}`)
        }}
      />

      {error && <ToolError>{error}</ToolError>}

      {loading ? (
        <div className="mt-10 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
          <span className="sr-only">Loading robots.txt</span>
        </div>
      ) : (
        body !== null && (
          <FadeIn className="mt-10 space-y-10">
            <RobotsUrlTester parsed={parsed} origin={origin} />

            <AiCrawlerMatrix parsed={parsed} />

            {parsed.sitemaps.length > 0 && (
              <section>
                <h2 className="text-subhead font-semibold">
                  Sitemaps declared
                </h2>
                <ul className="mt-3 divide-y rounded-lg border">
                  {parsed.sitemaps.map((sitemap) => (
                    <li
                      key={sitemap}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                    >
                      <span className="min-w-0 break-all font-mono text-sm">
                        {sitemap}
                      </span>
                      <Link
                        href={`/sitemap?q=${encodeURIComponent(sitemap)}`}
                        className="inline-flex shrink-0 items-center gap-1 text-xs text-link underline underline-offset-2"
                      >
                        Expand it <ExternalLink className="h-3 w-3" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <RobotsGroups parsed={parsed} />

            <RobotsIssues issues={parsed.issues} />

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-subhead font-semibold">Raw file</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!body}
                >
                  {copied ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              {body.length === 0 ? (
                <p className="rounded-lg border bg-surface-1 px-4 py-3 text-sm text-muted-foreground">
                  robots.txt is empty, which is a valid response — everything is
                  crawlable.
                </p>
              ) : (
                <HighlightedRobots text={body} />
              )}
            </section>
          </FadeIn>
        )
      )}
    </Container>
  )
}

export default InputFieldRobots
