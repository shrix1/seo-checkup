"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { FadeIn } from "@/components/motion"
import { logToolUsage } from "@/lib/log-tool-usage"
import { Check, Copy, Loader } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

const DEFAULT_ROBOTS = "https://shrix1.com/robots.txt"

const DIRECTIVE =
  /^(User-agent|Disallow|Allow|Sitemap|Crawl-delay|Host)\s*:/i

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
    <pre className="text-left text-sm font-mono whitespace-pre-wrap break-words p-4 rounded-lg border bg-muted/40 max-w-3xl w-full overflow-x-auto">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        const isDirective = DIRECTIVE.test(trimmed)
        const isComment = trimmed.startsWith("#")
        return (
          <div
            key={i}
            className={
              isComment
                ? "text-muted-foreground"
                : isDirective
                  ? "text-foreground"
                  : "text-muted-foreground/90"
            }
          >
            {isDirective ? (
              <>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {trimmed.split(":")[0]}:
                </span>
                <span>{trimmed.slice(trimmed.indexOf(":") + 1)}</span>
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)
  const hasFetched = useRef(false)

  const fetchRobots = useCallback(async (url: string) => {
    if (!url) {
      setError(true)
      return
    }
    try {
      setLoading(true)
      setError(false)
      const res = await fetch(`/api/v1?q=${encodeURIComponent(url)}`)
      const json = await res.json()

      if (res.status === 429 || json.error === "Rate limit exceeded") {
        const resetMs = json.reset
        const hours =
          typeof resetMs === "number"
            ? Math.max(1, Math.ceil((resetMs - Date.now()) / 3_600_000))
            : "?"
        alert(`You reached the limit, try again in ${hours} hours or later`)
        setError(true)
        return
      }

      if (!res.ok || typeof json !== "string") {
        setError(true)
        setBody(null)
        return
      }

      setBody(json)
    } catch (err) {
      console.error("Error fetching robots.txt:", err)
      setError(true)
      setBody(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    ;(async () => {
      await fetchRobots(initial)
      await logToolUsage(initial, "ROBOTS")
    })()
  }, [fetchRobots, initial])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await logToolUsage(value, "ROBOTS")
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
    <div className="w-full flex justify-center flex-col items-center px-4 md:px-0">
      <form
        onSubmit={handleSubmit}
        className="w-full md:w-[400px] flex justify-center my-6 items-center h-[60px] sticky top-4 rounded-lg"
      >
        <Input
          onChange={(e) => setValue(e.target.value)}
          value={value}
          type="text"
          autoFocus
          placeholder="yoursite.com/robots.txt"
          className="text-base h-[50px] dark:bg-white font-mono text-white dark:text-black bg-black"
        />
      </form>
      <p className="text-sm text-muted-foreground -mt-6 mb-10">
        example:{" "}
        <Link href="https://shrix1.com/robots.txt" target="_blank">
          <span className="font-medium text-foreground">
            https://shrix1.com/robots.txt
          </span>
        </Link>
      </p>

      {loading ? (
        <div className="w-full max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader className="animate-spin h-4 w-4" />
            Loading robots.txt…
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : error || body === null ? (
        <div className="px-3 flex items-center justify-center mt-4 w-full md:w-[400px] gap-4 py-3 bg-red-100 text-red-600 rounded-lg">
          <p>
            Could not load robots.txt from{" "}
            <span className="underline font-medium">{value}</span>.
          </p>
        </div>
      ) : (
        <FadeIn className="w-full flex flex-col items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
            disabled={!body}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "Copied" : "Copy robots.txt"}
          </Button>
          {body.length === 0 ? (
            <p className="text-sm text-muted-foreground font-mono">
              robots.txt is empty (valid response).
            </p>
          ) : (
            <HighlightedRobots text={body} />
          )}
        </FadeIn>
      )}
    </div>
  )
}

export default InputFieldRobots
