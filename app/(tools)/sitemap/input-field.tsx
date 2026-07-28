"use client"

import Container from "@/components/container"
import { FadeIn } from "@/components/motion"
import ToolSearchForm, {
  ToolError,
  ToolExample,
} from "@/components/tool-search-form"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { ExpandResult, SitemapEntry } from "@/lib/sitemap-types"
import { cn, compareUrls, getSitemapBaseUrl } from "@/lib/utils"
import { Check, Copy, List, Rows3 } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  SitemapToJSX,
  restructureSitemap,
  sortSitemapStructure,
} from "./generate-deep-routes"
import { SitemapTable, SitemapValidationPanel } from "./sitemap-analysis"

const DEFAULT_SITEMAP = "https://shrix1.com/sitemap.xml"

type ViewMode = "tree" | "table"

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

function buildView(entries: SitemapEntry[]) {
  const sorted = [...entries].sort((a, b) => compareUrls(a.loc, b.loc))
  const sortedUrls = sorted.map((e) => e.loc)
  const deep = sortSitemapStructure(restructureSitemap(sortedUrls))
  return { entries: sorted, sortedUrls, deep }
}

const InputField = ({ query }: { query: string }) => {
  const router = useRouter()
  const initial = useMemo(() => initialQuery(query), [query])
  const [value, setValue] = useState(initial)
  const [rawUrls, setRawUrls] = useState<string[]>([])
  const [entries, setEntries] = useState<SitemapEntry[]>([])
  const [view, setView] = useState<ViewMode>("tree")
  const [baseUrl, setBaseUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [resultsReady, setResultsReady] = useState(false)
  const [expandResult, setExpandResult] = useState<ExpandResult | null>(null)
  const [selectedSource, setSelectedSource] = useState<string>("all")
  const [sitemapWithDeepRoutes, setSitemapWithDeepRoutes] = useState<
    ReturnType<typeof restructureSitemap>
  >([])
  const hasFetched = useRef(false)

  const applySourceFilter = useCallback(
    (expanded: ExpandResult, sourceKey: string) => {
      const scoped =
        sourceKey === "all"
          ? expanded.entries
          : (expanded.sources.find((s) => s.sitemapUrl === sourceKey)?.entries ??
            [])
      const next = buildView(scoped)
      setEntries(next.entries)
      setRawUrls(next.sortedUrls)
      setSitemapWithDeepRoutes(next.deep)
      setResultsReady(next.sortedUrls.length > 0 || sourceKey !== "all")
    },
    []
  )

  const fetchExpandedSitemap = useCallback(
    async (
      url: string
    ): Promise<{ result: ExpandResult | null; error?: string }> => {
      try {
        const res = await fetch(`/api/sitemap?q=${encodeURIComponent(url)}`)
        const json = await res.json()

        if (res.status === 429 || json.error === "Rate limit exceeded") {
          const resetMs = json.reset ?? json.data?.reset
          const hours =
            typeof resetMs === "number"
              ? Math.max(1, Math.ceil((resetMs - Date.now()) / 3_600_000))
              : "?"
          return {
            result: null,
            error: `Rate limit exceeded. Try again in ${hours} hours.`,
          }
        }

        if (
          !res.ok ||
          !Array.isArray(json.urls) ||
          !Array.isArray(json.sources)
        ) {
          return {
            result: null,
            error: json.error || `Could not expand a sitemap at ${url}`,
          }
        }

        return { result: json as ExpandResult }
      } catch (err) {
        console.error("Error fetching expanded sitemap:", err)
        return { result: null, error: `Could not expand a sitemap at ${url}` }
      }
    },
    []
  )

  const getUrls = useCallback(
    async (target: string) => {
      if (!target) {
        setError("Enter a sitemap URL")
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      setResultsReady(false)

      const { result: expanded, error: fetchError } =
        await fetchExpandedSitemap(target)

      if (!expanded) {
        setError(fetchError || `Could not expand a sitemap at ${target}`)
        setExpandResult(null)
        setRawUrls([])
        setLoading(false)
        return
      }

      const base = getSitemapBaseUrl(target)
      setBaseUrl(base)
      setExpandResult(expanded)
      setSelectedSource("all")
      applySourceFilter(expanded, "all")
      if (expanded.urls.length === 0) {
        setError(`No URLs found in ${target}`)
      }
      setLoading(false)
    },
    [applySourceFilter, fetchExpandedSitemap]
  )

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    void getUrls(initial)
  }, [getUrls, initial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (value === initial) {
      await getUrls(value)
      return
    }
    router.replace(`/sitemap?q=${encodeURIComponent(value)}`)
  }

  const handleSourceChange = (sourceKey: string) => {
    setSelectedSource(sourceKey)
    if (!expandResult) return
    applySourceFilter(expandResult, sourceKey)
  }

  const handleCopy = async () => {
    if (!rawUrls.length) return
    await navigator.clipboard.writeText(rawUrls.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const showSourceFilter =
    expandResult?.rootKind === "sitemapindex" && expandResult.sources.length > 0

  const selectedSourceUrl =
    selectedSource === "all" ? expandResult?.indexUrl : selectedSource

  const selectedSourceMeta =
    selectedSource === "all"
      ? null
      : expandResult?.sources.find((s) => s.sitemapUrl === selectedSource)

  return (
    <Container width="page" className="mt-10">
      <div className="mx-auto max-w-3xl">
        <ToolSearchForm
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          placeholder="yoursite.com/sitemap.xml"
          ariaLabel="Sitemap URL to expand"
          loading={loading}
          buttonLabel="Expand sitemap"
          loadingLabel="Expanding…"
          autoFocus
        />
        <ToolExample
          url={DEFAULT_SITEMAP}
          onPick={() => {
            setValue(DEFAULT_SITEMAP)
            if (DEFAULT_SITEMAP === initial) {
              void getUrls(DEFAULT_SITEMAP)
              return
            }
            router.replace(`/sitemap?q=${encodeURIComponent(DEFAULT_SITEMAP)}`)
          }}
        />

        {error && <ToolError>{error}</ToolError>}
      </div>

      {loading && (
        <div className="mx-auto mt-10 max-w-3xl space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
          <span className="sr-only">Expanding sitemap</span>
        </div>
      )}

      {!loading && expandResult && rawUrls.length > 0 && (
        <FadeIn className="mt-10">
          {/* Summary bar */}
          <div className="rounded-lg border bg-surface-1">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-label font-medium uppercase text-muted-foreground">
                  {expandResult.rootKind === "sitemapindex"
                    ? "Sitemap index"
                    : "Sitemap"}
                </p>
                <a
                  href={expandResult.indexUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block truncate font-mono text-sm underline underline-offset-2 transition-colors hover:text-foreground"
                >
                  {expandResult.indexUrl}
                </a>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  <span className="font-mono font-medium text-foreground tabular">
                    {rawUrls.length.toLocaleString()}
                  </span>{" "}
                  URL{rawUrls.length === 1 ? "" : "s"}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!rawUrls.length}
                >
                  {copied ? (
                    <>
                      <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      Copy URLs
                    </>
                  )}
                </Button>
              </div>
            </div>

            {showSourceFilter && (
              <div className="flex flex-wrap items-center gap-3 border-t px-4 py-3">
                <label
                  htmlFor="sitemap-source"
                  className="text-sm text-muted-foreground"
                >
                  Filter by child sitemap
                </label>
                <select
                  id="sitemap-source"
                  value={selectedSource}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm transition-colors hover:border-border-strong focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 sm:max-w-sm"
                >
                  <option value="all">
                    All sitemaps ({expandResult.urls.length.toLocaleString()})
                  </option>
                  {expandResult.sources.map((source) => (
                    <option
                      key={source.sitemapUrl}
                      value={source.sitemapUrl}
                      title={source.sitemapUrl}
                    >
                      {sourceLabel(source.sitemapUrl)} (
                      {source.error ? "failed" : source.urlCount.toLocaleString()}
                      )
                    </option>
                  ))}
                </select>
                {selectedSourceUrl && selectedSource !== "all" && (
                  <a
                    href={selectedSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate font-mono text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
                  >
                    {selectedSourceUrl}
                  </a>
                )}
              </div>
            )}

            {(expandResult.truncated ||
              expandResult.childSitemapsFailed.length > 0 ||
              selectedSourceMeta?.error) && (
              <p className="border-t px-4 py-2.5 text-xs text-warning">
                {selectedSourceMeta?.error
                  ? `This child sitemap failed: ${selectedSourceMeta.error}`
                  : [
                      expandResult.childSitemapsFailed.length > 0
                        ? `${expandResult.childSitemapsFailed.length} child sitemap(s) failed`
                        : null,
                      expandResult.truncated ? "truncated at limit" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
              </p>
            )}
          </div>

          <div className="mt-10">
            <SitemapValidationPanel validation={expandResult.validation} />
          </div>

          {resultsReady && (
            <div className="mt-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-subhead font-semibold">URLs</h2>
                <div
                  role="group"
                  aria-label="View mode"
                  className="inline-flex rounded-md border p-0.5"
                >
                  {(
                    [
                      { id: "tree", label: "Tree", Icon: List },
                      { id: "table", label: "Table", Icon: Rows3 },
                    ] as const
                  ).map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setView(id)}
                      aria-pressed={view === id}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        view === id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                {view === "tree" ? (
                  <SitemapToJSX
                    sitemap={sitemapWithDeepRoutes}
                    baseUrl={baseUrl}
                  />
                ) : (
                  <SitemapTable entries={entries} baseUrl={baseUrl} />
                )}
              </div>
            </div>
          )}
        </FadeIn>
      )}

      {!loading &&
        expandResult &&
        rawUrls.length === 0 &&
        selectedSource !== "all" && (
          <p className="mx-auto mt-8 max-w-3xl text-sm text-muted-foreground">
            {selectedSourceMeta?.error
              ? "Could not load this child sitemap."
              : "This child sitemap declared no URLs."}
          </p>
        )}
    </Container>
  )
}

export default InputField
