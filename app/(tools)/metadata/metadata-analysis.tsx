"use client"

import { StatusDot } from "@/components/status"
import { Badge } from "@/components/ui/badge"
import type { CheckStatus } from "@/lib/audit/types"
import type { ParsedHtml } from "@/lib/audit/parse-html"
import { SNIPPET_LIMITS, measureSnippet } from "@/lib/serp-width"
import { cn } from "@/lib/utils"
import { useEffect, useMemo, useState } from "react"

/* ───────────────────────────── Pixel gauges ───────────────────────────── */

const TONE: Record<CheckStatus, { bar: string; text: string }> = {
  pass: { bar: "bg-success", text: "text-success" },
  warn: { bar: "bg-warning", text: "text-warning" },
  fail: { bar: "bg-danger", text: "text-danger" },
  // A measured snippet always grades, so this is only here to satisfy the map.
  info: { bar: "bg-muted-foreground", text: "text-muted-foreground" },
}

export function SnippetGauge({
  field,
  text,
}: {
  field: "title" | "description"
  text?: string
}) {
  const m = useMemo(() => measureSnippet(field, text), [field, text])
  const limits = SNIPPET_LIMITS[field]
  const mobileMarker = (limits.mobile / limits.desktop) * 100
  const tone = TONE[m.status]

  return (
    <div className="px-4 py-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-sm font-medium capitalize">{field}</span>
        <span className="font-mono text-xs text-muted-foreground tabular">
          {m.px}px / {limits.desktop}px · {m.chars} chars
        </span>
      </div>

      <div
        className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-border"
        role="img"
        aria-label={`${m.px} pixels of a ${limits.desktop} pixel desktop limit`}
      >
        <div
          className={cn("h-full rounded-full transition-all", tone.bar)}
          style={{ width: `${Math.max(2, m.desktopRatio * 100)}%` }}
        />
        <span
          className="absolute inset-y-0 w-px bg-foreground/40"
          style={{ left: `${mobileMarker}%` }}
          title={`Mobile limit — ${limits.mobile}px`}
          aria-hidden
        />
      </div>

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className={cn("text-xs", tone.text)}>{m.summary}</p>
        <span className="text-[0.6875rem] text-muted-foreground">
          marker = {limits.mobile}px mobile
        </span>
      </div>
    </div>
  )
}

/* ────────────────────────── og:image validation ────────────────────────── */

export type ImageDims = { width: number; height: number } | null

/**
 * Reads the natural dimensions of the og:image so we can validate size and
 * aspect ratio. The settled src is stored alongside the result so loading state
 * is derived rather than set synchronously inside the effect.
 */
export function useImageDimensions(src: string): {
  dims: ImageDims
  loading: boolean
} {
  const [settled, setSettled] = useState<{ src: string; dims: ImageDims }>({
    src: "",
    dims: null,
  })

  useEffect(() => {
    if (!src) return
    let cancelled = false
    const img = new window.Image()
    img.onload = () => {
      if (cancelled) return
      setSettled({
        src,
        dims: { width: img.naturalWidth, height: img.naturalHeight },
      })
    }
    img.onerror = () => {
      if (cancelled) return
      setSettled({ src, dims: null })
    }
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src])

  const isSettled = settled.src === src
  return {
    dims: isSettled ? settled.dims : null,
    loading: Boolean(src) && !isSettled,
  }
}

export function OgImageCheck({ src, dims }: { src: string; dims: ImageDims }) {
  const findings = useMemo(() => {
    const out: { status: CheckStatus; label: string; detail: string }[] = []

    if (!src) {
      out.push({
        status: "fail",
        label: "No og:image",
        detail:
          "Social platforms will fall back to whatever image they can find, or none.",
      })
      return out
    }

    if (!/^https:\/\//i.test(src)) {
      out.push({
        status: "warn",
        label: "og:image is not served over HTTPS",
        detail: "Several platforms refuse to render an http:// preview image.",
      })
    }

    if (!dims) {
      out.push({
        status: "warn",
        label: "Image could not be loaded",
        detail:
          "The URL did not return an image in the browser — check it is public and not hotlink-protected.",
      })
      return out
    }

    const { width, height } = dims
    const ratio = width / height

    if (width < 200 || height < 200) {
      out.push({
        status: "fail",
        label: `${width}×${height} is below the 200×200 minimum`,
        detail: "Facebook and LinkedIn will not render an image this small.",
      })
    } else if (width < 1200) {
      out.push({
        status: "warn",
        label: `${width}×${height} is smaller than recommended`,
        detail: "1200×630 is the recommended size for a large summary card.",
      })
    } else {
      out.push({
        status: "pass",
        label: `${width}×${height}`,
        detail: "Large enough for a full-width social card.",
      })
    }

    if (ratio < 1.7 || ratio > 2.1) {
      out.push({
        status: "warn",
        label: `Aspect ratio ${ratio.toFixed(2)}:1`,
        detail:
          "Cards are cropped to roughly 1.91:1. Anything far from that gets trimmed.",
      })
    }

    return out
  }, [src, dims])

  return (
    <ul className="divide-y">
      {findings.map((f) => (
        <li key={f.label} className="flex gap-3 px-4 py-3">
          <StatusDot status={f.status} className="mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{f.label}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{f.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

/* ─────────────────────────── Full tag inventory ─────────────────────────── */

type TagRow = {
  name: string
  value?: string
  required?: boolean
}

function inventoryGroups(parsed: ParsedHtml): { title: string; rows: TagRow[] }[] {
  return [
    {
      title: "Core",
      rows: [
        { name: "title", value: parsed.title, required: true },
        { name: "meta description", value: parsed.description, required: true },
        { name: "link canonical", value: parsed.canonical, required: true },
        { name: "meta robots", value: parsed.robotsMeta },
        { name: "meta viewport", value: parsed.viewport, required: true },
        { name: "charset", value: parsed.charset, required: true },
        { name: "html lang", value: parsed.lang },
        { name: "favicon", value: parsed.favicon },
      ],
    },
    {
      title: "Open Graph",
      rows: [
        { name: "og:title", value: parsed.ogTitle, required: true },
        { name: "og:description", value: parsed.ogDescription, required: true },
        { name: "og:image", value: parsed.ogImage, required: true },
        { name: "og:url", value: parsed.ogUrl },
        { name: "og:type", value: parsed.ogType },
        { name: "og:site_name", value: parsed.ogSiteName },
        { name: "og:locale", value: parsed.ogLocale },
      ],
    },
    {
      title: "Twitter / X",
      rows: [
        { name: "twitter:card", value: parsed.twitterCard },
        { name: "twitter:title", value: parsed.twitterTitle },
        { name: "twitter:description", value: parsed.twitterDescription },
        { name: "twitter:image", value: parsed.twitterImage },
        { name: "twitter:site", value: parsed.twitterSite },
      ],
    },
    {
      title: "Structured data & international",
      rows: [
        {
          name: "JSON-LD",
          value: parsed.jsonLdTypes.length
            ? parsed.jsonLdTypes.join(", ")
            : undefined,
        },
        {
          name: "hreflang",
          value: parsed.hreflang.length
            ? parsed.hreflang.map((h) => h.hreflang).join(", ")
            : undefined,
        },
      ],
    },
  ]
}

export function TagInventory({
  parsed,
  id,
}: {
  parsed: ParsedHtml
  id?: string
}) {
  const groups = useMemo(() => inventoryGroups(parsed), [parsed])
  const all = groups.flatMap((g) => g.rows)
  const found = all.filter((r) => r.value).length

  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-subhead font-semibold">Tags found</h2>
        <Badge variant="outline">
          {found} of {all.length} present
        </Badge>
      </div>

      <div className="mt-4 space-y-4">
        {groups.map((group) => (
          <div key={group.title} className="overflow-hidden rounded-lg border">
            <h3 className="border-b bg-surface-1 px-4 py-2 text-label font-medium uppercase text-muted-foreground">
              {group.title}
            </h3>
            <dl className="divide-y">
              {group.rows.map((row) => (
                <div
                  key={row.name}
                  className="grid gap-1 px-4 py-2.5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4"
                >
                  <dt className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        row.value
                          ? "bg-success"
                          : row.required
                            ? "bg-danger"
                            : "bg-border-strong"
                      )}
                      aria-hidden
                    />
                    {row.name}
                  </dt>
                  <dd
                    className={cn(
                      "break-words text-sm",
                      !row.value && "text-muted-foreground"
                    )}
                  >
                    {row.value || (row.required ? "Missing" : "Not set")}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─────────────────────────────── Issues ─────────────────────────────── */

export function MetadataIssues({
  parsed,
  id,
}: {
  parsed: ParsedHtml
  id?: string
}) {
  const issues = useMemo(() => {
    const out: { status: CheckStatus; label: string; detail: string }[] = []
    const title = measureSnippet("title", parsed.title)
    const desc = measureSnippet("description", parsed.description)

    if (title.status !== "pass") {
      out.push({ status: title.status, label: "Title", detail: title.summary })
    }
    if (desc.status !== "pass") {
      out.push({
        status: desc.status,
        label: "Meta description",
        detail: desc.summary,
      })
    }
    if (!parsed.canonical) {
      out.push({
        status: "warn",
        label: "No canonical",
        detail: "Add a self-referencing rel=canonical to consolidate duplicates.",
      })
    }
    if (!parsed.ogImage) {
      out.push({
        status: "fail",
        label: "No og:image",
        detail: "Links to this page will share without a preview image.",
      })
    }
    if (!parsed.ogTitle || !parsed.ogDescription) {
      out.push({
        status: "warn",
        label: "Incomplete Open Graph",
        detail:
          "og:title and og:description let you control the shared headline and blurb.",
      })
    }
    if (!parsed.twitterCard) {
      out.push({
        status: "warn",
        label: "No twitter:card",
        detail:
          'Set twitter:card to "summary_large_image" for a full-width card on X.',
      })
    }
    if ((parsed.robotsMeta || "").toLowerCase().includes("noindex")) {
      out.push({
        status: "fail",
        label: "Page is noindex",
        detail: "The meta robots tag blocks this page from search results.",
      })
    }
    if (!parsed.lang) {
      out.push({
        status: "warn",
        label: "No html lang",
        detail: "Set lang so search engines and screen readers know the language.",
      })
    }
    return out
  }, [parsed])

  if (issues.length === 0) {
    return (
      <section id={id} className="scroll-mt-28">
        <h2 className="text-subhead font-semibold">Issues</h2>
        <p className="mt-3 rounded-lg border bg-success-subtle px-4 py-3 text-sm text-success">
          Nothing to fix — every tag checked is present and within limits.
        </p>
      </section>
    )
  }

  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-subhead font-semibold">Issues</h2>
        <Badge variant={issues.some((i) => i.status === "fail") ? "danger" : "warning"}>
          {issues.length} to fix
        </Badge>
      </div>
      <ul className="mt-4 divide-y rounded-lg border">
        {issues.map((issue) => (
          <li key={issue.label} className="flex gap-3 px-4 py-3">
            <StatusDot status={issue.status} className="mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium">{issue.label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {issue.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
