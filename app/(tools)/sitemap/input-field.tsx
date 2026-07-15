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
import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  SitemapToJSX,
  restructureSitemap,
  sortSitemapStructure,
} from "./generate-deep-routes"

const DEFAULT_SITEMAP = "https://shrix1.com/sitemap.xml"

type SitemapSource = {
  sitemapUrl: string
  urlCount: number
  urls: string[]
  error?: string
}

type ExpandResult = {
  indexUrl: string
  urls: string[]
  rootKind: "urlset" | "sitemapindex" | "unknown"
  sources: SitemapSource[]
  childSitemapsFetched: number
  childSitemapsFailed: { url: string; reason: string }[]
  truncated: boolean
}

function initialQuery(query: string) {
  if (!query) return DEFAULT_SITEMAP
  try {
    return decodeURIComponent(query)
  } catch {
    return query
  }
}

function sourceLabel(sitemapUrl: string): string {
  try {
    const pathname = new URL(sitemapUrl).pathname
    const file = pathname.split("/").filter(Boolean).pop()
    return file || pathname || sitemapUrl
  } catch {
    return sitemapUrl
  }
}

function buildView(urls: string[], base: string) {
  const sortedUrls = [...urls].sort(compareUrls)
  const modifiedUrls = sortedUrls.map((url) => removeCommonPrefix(url, base))
  const deep = sortSitemapStructure(restructureSitemap(sortedUrls))
  return { modifiedUrls, sortedUrls, deep }
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
  const [expandResult, setExpandResult] = useState<ExpandResult | null>(null)
  const [selectedSource, setSelectedSource] = useState<string>("all")
  const [sitemapWithDeepRoutes, setSitemapWithDeepRoutes] = useState<
    ReturnType<typeof restructureSitemap>
  >([])
  const hasFetched = useRef(false)

  const applySourceFilter = useCallback(
    (expanded: ExpandResult, sourceKey: string, base: string) => {
      const urls =
        sourceKey === "all"
          ? expanded.urls
          : (expanded.sources.find((s) => s.sitemapUrl === sourceKey)?.urls ??
            [])
      const view = buildView(urls, base)
      setData(view.modifiedUrls)
      setRawUrls(view.sortedUrls)
      setSitemapWithDeepRoutes(view.deep)
      setResultsReady(view.sortedUrls.length > 0 || sourceKey !== "all")
    },
    []
  )

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

        if (!res.ok || !Array.isArray(json.urls) || !Array.isArray(json.sources)) {
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
        return null
      }
      try {
        setLoading(true)
        setResultsReady(false)
        const expanded = await fetchExpandedSitemap(target)
        if (!expanded) {
          setError(true)
          setLoading(false)
          setExpandResult(null)
          return null
        }

        const base = getSitemapBaseUrl(target)
        setBaseUrl(base)
        setExpandResult(expanded)
        setSelectedSource("all")
        applySourceFilter(expanded, "all", base)
        setError(expanded.urls.length === 0)
        setLoading(false)
        return expanded
      } catch {
        setLoading(false)
        setError(true)
        setExpandResult(null)
        return null
      }
    },
    [applySourceFilter, fetchExpandedSitemap]
  )

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    void getUrls(initial)
  }, [getUrls, initial])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await logToolUsage(value, "SITEMAP")
    if (value === initial) {
      await getUrls(value)
      return
    }
    router.replace(`/sitemap?q=${encodeURIComponent(value)}`)
  }

  const handleSourceChange = (sourceKey: string) => {
    setSelectedSource(sourceKey)
    if (!expandResult) return
    applySourceFilter(expandResult, sourceKey, baseUrl)
  }

  const handleCopy = async () => {
    if (!rawUrls.length) return
    await navigator.clipboard.writeText(rawUrls.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const showSourceFilter =
    expandResult?.rootKind === "sitemapindex" &&
    expandResult.sources.length > 0

  const selectedSourceUrl =
    selectedSource === "all"
      ? expandResult?.indexUrl
      : selectedSource

  const selectedSourceMeta =
    selectedSource === "all"
      ? null
      : expandResult?.sources.find((s) => s.sitemapUrl === selectedSource)

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
      ) : error || !expandResult || expandResult.urls.length === 0 ? (
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
              {rawUrls.length.toLocaleString()} URL
              {rawUrls.length === 1 ? "" : "s"} found
              <Badge className="ml-2 font-medium font-mono text-base">
                {rawUrls.length.toLocaleString()}
              </Badge>
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
              disabled={!rawUrls.length}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy URLs"}
            </Button>
          </section>

          {expandResult && (
            <div className="w-full max-w-xl flex flex-col items-center gap-3 mb-6 px-2">
              <p className="text-sm text-muted-foreground text-center break-all">
                <span className="font-medium text-foreground">
                  {expandResult.rootKind === "sitemapindex"
                    ? "Index:"
                    : "Sitemap:"}
                </span>{" "}
                <a
                  href={expandResult.indexUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono underline underline-offset-2 hover:text-foreground"
                >
                  {expandResult.indexUrl}
                </a>
              </p>

              {showSourceFilter && (
                <>
                  <label className="w-full flex flex-col gap-1.5 text-sm">
                    <span className="text-muted-foreground text-center">
                      Filter by child sitemap
                    </span>
                    <select
                      value={selectedSource}
                      onChange={(e) => handleSourceChange(e.target.value)}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="all">
                        All sitemaps ({expandResult.urls.length.toLocaleString()}
                        )
                      </option>
                      {expandResult.sources.map((source) => (
                        <option
                          key={source.sitemapUrl}
                          value={source.sitemapUrl}
                          title={source.sitemapUrl}
                        >
                          {sourceLabel(source.sitemapUrl)} (
                          {source.error
                            ? "failed"
                            : source.urlCount.toLocaleString()}
                          )
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedSourceUrl && (
                    <p className="text-xs text-muted-foreground text-center break-all">
                      <span className="font-medium text-foreground">
                        {selectedSource === "all" ? "Showing:" : "Source:"}
                      </span>{" "}
                      <a
                        href={selectedSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono underline underline-offset-2 hover:text-foreground"
                      >
                        {selectedSourceUrl}
                      </a>
                      {selectedSourceMeta?.error
                        ? ` — ${selectedSourceMeta.error}`
                        : ""}
                    </p>
                  )}
                </>
              )}

              {(expandResult.truncated ||
                expandResult.childSitemapsFailed.length > 0) && (
                <p className="text-xs text-muted-foreground text-center">
                  {expandResult.childSitemapsFailed.length > 0
                    ? `${expandResult.childSitemapsFailed.length} child sitemap(s) failed`
                    : ""}
                  {expandResult.truncated
                    ? `${expandResult.childSitemapsFailed.length > 0 ? " · " : ""}truncated at limit`
                    : ""}
                </p>
              )}
            </div>
          )}

          {resultsReady && rawUrls.length > 0 && (
            <div className="flex flex-wrap gap-3 max-w-5xl">
              <SitemapToJSX
                sitemap={sitemapWithDeepRoutes}
                baseUrl={baseUrl}
              />
            </div>
          )}

          {resultsReady &&
            rawUrls.length === 0 &&
            selectedSource !== "all" &&
            selectedSourceMeta?.error && (
              <p className="text-sm text-red-600 text-center">
                Could not load this child sitemap.
              </p>
            )}
        </FadeIn>
      )}
    </div>
  )
}

export default InputField
