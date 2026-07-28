"use client"

import Container from "@/components/container"
import { FadeIn } from "@/components/motion"
import { TocRail, type TocItem } from "@/components/toc"
import ToolSearchForm, {
  ToolError,
  ToolExample,
} from "@/components/tool-search-form"
import { Skeleton } from "@/components/ui/skeleton"
import { parseHtml, type ParsedHtml } from "@/lib/audit/parse-html"
import { SNIPPET_LIMITS, truncateToWidth } from "@/lib/serp-width"
import { cn, ensureHttpScheme } from "@/lib/utils"
import { Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  MetadataIssues,
  OgImageCheck,
  SnippetGauge,
  TagInventory,
  useImageDimensions,
} from "./metadata-analysis"

const DEFAULT_SITE = "shrix1.com"

function initialQuery(query: string) {
  if (!query) return DEFAULT_SITE
  try {
    return decodeURIComponent(query)
  } catch {
    return query
  }
}

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

/** Resolve a possibly-relative URL against the page it came from */
function resolveUrl(raw: string | undefined, base: string) {
  if (!raw) return ""
  try {
    return new URL(raw, base).toString()
  } catch {
    return ""
  }
}

const InputFieldMetadata = ({ query }: { query: string }) => {
  const router = useRouter()
  const initial = useMemo(() => initialQuery(query), [query])
  const [value, setValue] = useState(initial)
  const [parsed, setParsed] = useState<ParsedHtml | null>(null)
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const fetchMetadata = useCallback(async (target: string) => {
    if (!target) {
      setError("Enter a URL")
      return
    }
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(
        `/api/v1?q=${encodeURIComponent(target)}&tool=METADATA`
      )
      const jsonData = await res.json()

      if (res.status === 429 || jsonData.error === "Rate limit exceeded") {
        const resetMs = jsonData.reset ?? jsonData.data?.reset
        const hours =
          typeof resetMs === "number"
            ? Math.max(1, Math.ceil((resetMs - Date.now()) / 3_600_000))
            : "?"
        setError(`Rate limit exceeded. Try again in ${hours} hours.`)
        setParsed(null)
        return
      }

      if (!res.ok || typeof jsonData !== "string") {
        setError(`Could not read meta tags from ${target}`)
        setParsed(null)
        return
      }

      // Resolve against an absolute URL so relative og:image paths work even
      // when the user typed a bare domain.
      const absolute = ensureHttpScheme(target)
      // Same parser the audit uses, so the two tools can never disagree.
      setParsed(parseHtml(jsonData, absolute))
      setUrl(absolute)
    } catch (err) {
      console.error("Error fetching metadata:", err)
      setError(`Could not read meta tags from ${target}`)
      setParsed(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    void fetchMetadata(initial)
  }, [fetchMetadata, initial])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (value === initial) {
      await fetchMetadata(value)
      return
    }
    router.replace(`/metadata?q=${encodeURIComponent(value)}`)
  }

  const host = url ? hostnameOf(url) : ""
  const ogImage = parsed ? resolveUrl(parsed.ogImage, url) : ""
  const { dims } = useImageDimensions(ogImage)

  const title = parsed?.title || ""
  const description = parsed?.description || ""

  const tocItems = useMemo<TocItem[]>(() => {
    if (!parsed) return []
    return [
      { id: "meta-snippet", label: "Snippet width" },
      { id: "meta-issues", label: "Issues" },
      { id: "meta-google", label: "Google" },
      { id: "meta-x", label: "X (Twitter)" },
      { id: "meta-slack", label: "Slack" },
      { id: "meta-linkedin", label: "LinkedIn" },
      { id: "meta-discord", label: "Discord" },
      { id: "meta-facebook", label: "Facebook" },
      { id: "meta-image", label: "Preview image" },
      { id: "meta-tags", label: "Tags found" },
    ]
  }, [parsed])

  return (
    <Container width="reading" className="relative mt-10">
      {parsed && !loading && <TocRail items={tocItems} />}

      <ToolSearchForm
        value={value}
        onChange={setValue}
        onSubmit={onSubmit}
        placeholder="yoursite.com"
        ariaLabel="URL to read meta tags from"
        loading={loading}
        buttonLabel="Check meta tags"
        loadingLabel="Reading…"
        autoFocus
      />
      <ToolExample
        url={DEFAULT_SITE}
        onPick={() => {
          setValue(DEFAULT_SITE)
          if (DEFAULT_SITE === initial) {
            void fetchMetadata(DEFAULT_SITE)
            return
          }
          router.replace(`/metadata?q=${encodeURIComponent(DEFAULT_SITE)}`)
        }}
      />

      {error && <ToolError>{error}</ToolError>}

      {loading && (
        <div className="mt-10 space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-44 w-full rounded-lg" />
            </div>
          ))}
          <span className="sr-only">Reading meta tags</span>
        </div>
      )}

      {parsed && !loading && (
        <FadeIn className="mt-10 space-y-10">
          {/* Snippet width — the thing that actually decides truncation */}
          <section id="meta-snippet" className="scroll-mt-28">
            <h2 className="text-subhead font-semibold">Search snippet width</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Google truncates by rendered pixels, not characters. The marker
              shows where mobile cuts off.
            </p>
            <div className="mt-4 divide-y rounded-lg border">
              <SnippetGauge field="title" text={title} />
              <SnippetGauge field="description" text={description} />
            </div>
          </section>

          <MetadataIssues parsed={parsed} id="meta-issues" />

          {/* Google — rendered with real pixel truncation */}
          <Preview id="meta-google" title="Google">
            <div className="p-4">
              <p className="truncate text-xs text-muted-foreground">{host}</p>
              <h3 className="mt-1 text-lg text-[#1a0dab] dark:text-[#8ab4f8]">
                {title
                  ? truncateToWidth(
                      title,
                      SNIPPET_LIMITS.title.fontSize,
                      SNIPPET_LIMITS.title.desktop
                    )
                  : "(no title)"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {description
                  ? truncateToWidth(
                      description,
                      SNIPPET_LIMITS.description.fontSize,
                      SNIPPET_LIMITS.description.desktop
                    )
                  : "(no meta description)"}
              </p>
            </div>
          </Preview>

          <Preview id="meta-x" title="X (Twitter)">
            <div className="p-4">
              <div className="relative overflow-hidden rounded-xl border">
                <PreviewImage src={ogImage} alt={title} />
                <span className="absolute bottom-3 left-3 line-clamp-1 max-w-[calc(100%-1.5rem)] rounded bg-black/75 px-2 py-0.5 text-xs text-white">
                  {title}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">From {host}</p>
            </div>
          </Preview>

          <Preview id="meta-slack" title="Slack">
            <div className="p-4">
              <div className="border-l-[3px] border-l-border-strong pl-3">
                <p className="truncate text-sm text-muted-foreground">{host}</p>
                <h3 className="mt-0.5 line-clamp-1 font-semibold">{title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {description}
                </p>
                <div className="mt-2 max-w-sm overflow-hidden rounded-lg border">
                  <PreviewImage src={ogImage} alt={title} />
                </div>
              </div>
            </div>
          </Preview>

          <Preview id="meta-linkedin" title="LinkedIn">
            <div className="p-4">
              <div className="overflow-hidden rounded-lg border">
                <PreviewImage src={ogImage} alt={title} />
                <div className="bg-surface-2 p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold">{title}</h3>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {host}
                  </p>
                </div>
              </div>
            </div>
          </Preview>

          <Preview id="meta-discord" title="Discord">
            <div className="p-4">
              <div className="rounded-md border-l-4 border-l-border-strong bg-surface-2 p-3">
                <h3 className="line-clamp-1 text-sm font-medium text-[#0068e0] dark:text-[#00a8fc]">
                  {title}
                </h3>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                  {description}
                </p>
                <div className="mt-2 max-w-sm overflow-hidden rounded">
                  <PreviewImage src={ogImage} alt={title} />
                </div>
              </div>
            </div>
          </Preview>

          <Preview id="meta-facebook" title="Facebook">
            <div className="p-4">
              <div className="overflow-hidden rounded-lg border">
                <PreviewImage src={ogImage} alt={title} />
                <div className="bg-surface-2 p-3">
                  <p className="truncate text-label uppercase text-muted-foreground">
                    {host}
                  </p>
                  <h3 className="mt-1 line-clamp-1 text-sm font-semibold">
                    {title}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          </Preview>

          <section id="meta-image" className="scroll-mt-28">
            <h2 className="text-subhead font-semibold">Preview image</h2>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
              {ogImage || "No og:image declared"}
            </p>
            <div className="mt-3 rounded-lg border">
              <OgImageCheck src={ogImage} dims={dims} />
            </div>
          </section>

          <TagInventory parsed={parsed} id="meta-tags" />
        </FadeIn>
      )}
    </Container>
  )
}

export default InputFieldMetadata

function Preview({
  id,
  title,
  children,
}: {
  id?: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="text-label font-medium uppercase text-muted-foreground">
        {title}
      </h2>
      <div className="mt-2 rounded-lg border bg-background">{children}</div>
    </section>
  )
}

/**
 * Responsive 1.91:1 OG image with a themed fallback. Replaces the old fixed
 * 500×300 placeholder, which overflowed the viewport on small screens.
 */
function PreviewImage({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  // Track which src failed rather than resetting a boolean in an effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = failedSrc === src

  if (!src || failed) {
    return (
      <div
        className={cn(
          "grid aspect-[1.91/1] w-full place-items-center bg-surface-2",
          className
        )}
      >
        <div className="flex flex-col items-center gap-1.5">
          <ImageIcon className="h-6 w-6 text-muted-foreground/50" aria-hidden />
          <span className="text-xs text-muted-foreground">No og:image</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative aspect-[1.91/1] w-full overflow-hidden bg-surface-2",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 640px"
        className="object-cover"
        onError={() => setFailedSrc(src)}
        unoptimized
      />
    </div>
  )
}
