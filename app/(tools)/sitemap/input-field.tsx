"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { FadeIn } from "@/components/motion"
import { logToolUsage } from "@/lib/log-tool-usage"
import {
  compareUrls,
  getSitemapBaseUrl,
  removeCommonPrefix,
} from "@/lib/utils"
import { Check, Copy, Loader } from "lucide-react"

type ExpandMeta = {
  rootKind: "urlset" | "sitemapindex" | "unknown"
  childSitemapsFetched: number
  childSitemapsFailed: { url: string; reason: string }[]
  truncated: boolean
}

type ExpandResult = ExpandMeta & { urls: string[] }
import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  SitemapToJSX,
  restructureSitemap,
  sortSitemapStructure,
} from "./generate-deep-routes"

const DEFAULT_SITEMAP = "https://supwriter.com/sitemap.xml"

function initialQuery(query: string) {
  if (!query) return DEFAULT_SITEMAP
  try {
    return decodeURIComponent(query)
  } catch {
    return query
  }
}

const InputField = ({ query }: { query: string }) => {
  const router = useRouter()
  const initial = useMemo(() => initialQuery(query), [query])
  const [value, setValue] = useState(initial)
  const [data, setData] = useState<string[]>([])
  const [rawUrls, setRawUrls] = useState<string[]>([])
  const [baseUrl, setBaseUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)
  const [resultsReady, setResultsReady] = useState(false)
  const [expandMeta, setExpandMeta] = useState<ExpandMeta | null>(null)
  const [sitemapWithDeepRoutes, setSitemapWithDeepRoutes] = useState<
    ReturnType<typeof restructureSitemap>
  >([])
  const hasFetched = useRef(false)

  const fetchExpandedSitemap = useCallback(
    async (url: string): Promise<ExpandResult | null> => {
      try {
        const res = await fetch(`/api/sitemap?q=${encodeURIComponent(url)}`)
        const json = await res.json()

        if (res.status === 429 || json.error === "Rate limit exceeded") {
          const resetMs = json.reset ?? json.data?.reset
          const hours =
            typeof resetMs === "number"
              ? Math.max(1, Math.ceil((resetMs - Date.now()) / 3_600_000))
              : "?"
          alert(`You reached the limit, try again in ${hours} hours or later`)
          return null
        }

        if (!res.ok || !Array.isArray(json.urls)) {
          return null
        }

        return json as ExpandResult
      } catch (err) {
        console.error("Error fetching expanded sitemap:", err)
        return null
      }
    },
    []
  )

  const getUrls = useCallback(
    async (target: string) => {
      if (!target) {
        setError(true)
        return {
          baseUrl: "",
          urls: [],
          raw: [],
          sitemapWithDeepRoutes: [] as ReturnType<typeof restructureSitemap>,
          meta: null,
        }
      }
      try {
        setLoading(true)
        setResultsReady(false)
        const expanded = await fetchExpandedSitemap(target)
        if (!expanded) {
          setError(true)
          setLoading(false)
          setExpandMeta(null)
          return {
            baseUrl: "",
            urls: [],
            raw: [],
            sitemapWithDeepRoutes: [],
            meta: null,
          }
        }

        const fetched = expanded.urls
        const deep = sortSitemapStructure(restructureSitemap(fetched))
        const sortedUrls = [...fetched].sort(compareUrls)
        const base = getSitemapBaseUrl(target)
        const modifiedUrls = sortedUrls.map((url) =>
          removeCommonPrefix(url, base)
        )
        const meta = {
          rootKind: expanded.rootKind,
          childSitemapsFetched: expanded.childSitemapsFetched,
          childSitemapsFailed: expanded.childSitemapsFailed,
          truncated: expanded.truncated,
        }
        setError(fetched.length === 0)
        setLoading(false)
        setExpandMeta(meta)
        return {
          baseUrl: base,
          urls: modifiedUrls,
          raw: sortedUrls,
          sitemapWithDeepRoutes: deep,
          meta,
        }
      } catch {
        setLoading(false)
        setError(true)
        setExpandMeta(null)
        return {
          baseUrl: "",
          urls: [],
          raw: [],
          sitemapWithDeepRoutes: [],
          meta: null,
        }
      }
    },
    [fetchExpandedSitemap]
  )

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    ;(async () => {
      const result = await getUrls(initial)
      setSitemapWithDeepRoutes(result.sitemapWithDeepRoutes)
      setBaseUrl(result.baseUrl)
      setData(result.urls)
      setRawUrls(result.raw)
      setResultsReady(result.urls.length > 0)
    })()
  }, [getUrls, initial])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await logToolUsage(value, "SITEMAP")
    if (value === initial) {
      const result = await getUrls(value)
      setSitemapWithDeepRoutes(result.sitemapWithDeepRoutes)
      setBaseUrl(result.baseUrl)
      setData(result.urls)
      setRawUrls(result.raw)
      setResultsReady(result.urls.length > 0)
      return
    }
    router.replace(`/sitemap?q=${encodeURIComponent(value)}`)
  }

  const handleCopy = async () => {
    if (!rawUrls.length) return
    await navigator.clipboard.writeText(rawUrls.join("\n"))
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
          placeholder="yoursite.com/sitemap.xml"
          className="text-base h-[50px] dark:bg-white font-mono text-white dark:text-black bg-black"
        />
      </form>
      <p className="text-sm text-muted-foreground -mt-6 mb-10">
        Ensure your{" "}
        <span className="font-medium text-foreground">sitemap.xml</span> URL is
        correct before using it. Sitemap indexes are expanded automatically.
      </p>

      {loading ? (
        <div className="w-full max-w-md mx-auto flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader className="animate-spin h-4 w-4" />
            Expanding sitemap…
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : data.length === 0 || error ? (
        <div className="px-3 flex items-center justify-center mt-4 w-full md:w-[400px] gap-4 py-3 bg-red-100 text-red-600 rounded-lg">
          <p>
            It seems like the sitemap url:{" "}
            <span className="underline font-medium">{value}</span> does not
            exist or try refreshing.
          </p>
        </div>
      ) : (
        <FadeIn className="w-full max-w-5xl flex flex-col items-center">
          <section className="flex flex-col md:flex-row gap-3 items-center mb-3 flex-wrap justify-center">
            <Badge className="underline font-medium font-mono text-base underline-offset-2">
              {baseUrl}
            </Badge>
            <span className="text-sm">
              {data.length.toLocaleString()} URL
              {data.length === 1 ? "" : "s"} found
              <Badge className="ml-2 font-medium font-mono text-base">
                {data.length.toLocaleString()}
              </Badge>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy all URLs"}
            </Button>
          </section>

          {expandMeta && (
            <p className="text-sm text-muted-foreground mb-6 text-center">
              {expandMeta.rootKind === "sitemapindex"
                ? `Expanded ${expandMeta.childSitemapsFetched} child sitemap${expandMeta.childSitemapsFetched === 1 ? "" : "s"}`
                : "Parsed urlset sitemap"}
              {expandMeta.childSitemapsFailed.length > 0
                ? ` · ${expandMeta.childSitemapsFailed.length} failed`
                : ""}
              {expandMeta.truncated ? " · truncated at limit" : ""}
            </p>
          )}

          {resultsReady && (
            <div className="flex flex-wrap gap-3 max-w-5xl">
              <SitemapToJSX
                sitemap={sitemapWithDeepRoutes}
                baseUrl={baseUrl}
              />
            </div>
          )}
        </FadeIn>
      )}
    </div>
  )
}

export default InputField
