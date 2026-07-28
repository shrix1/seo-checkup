import { gunzipSync } from "node:zlib"
import { safeFetch } from "@/lib/safe-fetch"
import { SITEMAP_URL_LIMIT } from "@/lib/sitemap-types"
import type {
  ExpandResult,
  SitemapEntry,
  SitemapKind,
  SitemapSource,
  SitemapValidation,
} from "@/lib/sitemap-types"

// Types live in sitemap-types.ts so client components can import them without
// dragging node:zlib / node:dns into the browser bundle.
export type {
  ExpandResult,
  SitemapEntry,
  SitemapKind,
  SitemapSource,
  SitemapValidation,
}
export { SITEMAP_URL_LIMIT }

const DEFAULT_MAX_DEPTH = 3
const DEFAULT_MAX_CHILD_SITEMAPS = 100
const DEFAULT_MAX_PAGE_URLS = 50_000
const CONCURRENCY = 4
const MAX_BODY_BYTES = 2_000_000

const VALID_CHANGEFREQ = new Set([
  "always",
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "never",
])

export type ExpandOptions = {
  maxDepth?: number
  maxChildSitemaps?: number
  maxPageUrls?: number
}

type ParseResult = {
  kind: SitemapKind
  locs: string[]
  entries: SitemapEntry[]
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "")
}

function sameSite(root: URL, candidate: URL): boolean {
  return normalizeHost(root.hostname) === normalizeHost(candidate.hostname)
}

function isHttpUrl(url: URL): boolean {
  return url.protocol === "http:" || url.protocol === "https:"
}

/** Read a single child tag's text out of a `<url>` or `<sitemap>` block. */
function tagValue(block: string, name: string): string | undefined {
  const re = new RegExp(
    `<(?:[A-Za-z_][\\w.-]*:)?${name}\\b[^>]*>\\s*([\\s\\S]*?)\\s*</(?:[A-Za-z_][\\w.-]*:)?${name}>`,
    "i"
  )
  const m = block.match(re)
  if (!m?.[1]) return undefined
  const value = decodeXmlEntities(m[1].trim())
  return value || undefined
}

export function parseSitemapXml(xml: string): ParseResult {
  const rootMatch = xml.match(/<(?:[A-Za-z_][\w.-]*:)?(sitemapindex|urlset)\b/i)
  const root = rootMatch?.[1]?.toLowerCase()

  if (root === "sitemapindex") {
    const locs: string[] = []
    const blocks = xml.matchAll(
      /<(?:[A-Za-z_][\w.-]*:)?sitemap\b[^>]*>[\s\S]*?<\/(?:[A-Za-z_][\w.-]*:)?sitemap>/gi
    )
    for (const block of blocks) {
      const loc = tagValue(block[0], "loc")
      if (loc) locs.push(loc)
    }
    return { kind: "sitemapindex", locs, entries: [] }
  }

  if (root === "urlset") {
    const locs: string[] = []
    const entries: SitemapEntry[] = []
    const blocks = xml.matchAll(
      /<(?:[A-Za-z_][\w.-]*:)?url\b[^>]*>[\s\S]*?<\/(?:[A-Za-z_][\w.-]*:)?url>/gi
    )
    for (const block of blocks) {
      const loc = tagValue(block[0], "loc")
      if (!loc) continue
      locs.push(loc)
      entries.push({
        loc,
        lastmod: tagValue(block[0], "lastmod"),
        changefreq: tagValue(block[0], "changefreq"),
        priority: tagValue(block[0], "priority"),
      })
    }
    return { kind: "urlset", locs, entries }
  }

  return { kind: "unknown", locs: [], entries: [] }
}

async function fetchSitemapBody(url: string): Promise<string> {
  const res = await safeFetch(url, {
    headers: {
      Accept: "application/xml,text/xml,application/gzip,*/*",
    },
    maxBytes: MAX_BODY_BYTES,
  })

  if (!res.ok) {
    throw new Error(res.error || `HTTP ${res.status}`)
  }

  const capped = res.body
  const encoding = (res.headers.get("content-encoding") || "").toLowerCase()
  const looksGzip =
    url.toLowerCase().endsWith(".gz") ||
    encoding.includes("gzip") ||
    (capped.length >= 2 && capped[0] === 0x1f && capped[1] === 0x8b)

  if (looksGzip) {
    try {
      return gunzipSync(capped, { maxOutputLength: MAX_BODY_BYTES }).toString(
        "utf8"
      )
    } catch {
      // Some servers label incorrectly; fall through to utf8 text.
    }
  }

  return capped.toString("utf8")
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0

  async function run() {
    while (next < items.length) {
      const index = next++
      results[index] = await worker(items[index])
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () =>
    run()
  )
  await Promise.all(runners)
  return results
}

function collectEntries(
  candidates: SitemapEntry[],
  seen: Set<string>,
  remaining: number
): { entries: SitemapEntry[]; truncated: boolean; duplicates: number } {
  const entries: SitemapEntry[] = []
  const local = new Set<string>()
  let truncated = false
  let duplicates = 0

  for (const candidate of candidates) {
    if (seen.size + entries.length >= remaining) {
      truncated = true
      break
    }
    let href: string
    try {
      const locUrl = new URL(candidate.loc)
      if (!isHttpUrl(locUrl)) continue
      href = locUrl.href
    } catch {
      continue
    }
    if (seen.has(href) || local.has(href)) {
      duplicates += 1
      continue
    }
    local.add(href)
    entries.push({ ...candidate, loc: href })
  }

  return { entries, truncated, duplicates }
}

/** W3C Datetime: YYYY-MM-DD optionally followed by a time and offset. */
const LASTMOD_RE =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/

function buildValidation(
  entries: SitemapEntry[],
  rootHost: string,
  duplicates: number,
  overUrlLimit: string[],
  now: number
): SitemapValidation {
  let crossHost = 0
  let nonHttps = 0
  let lastmodPresent = 0
  let lastmodInvalid = 0
  let lastmodFuture = 0
  let priorityInvalid = 0
  let changefreqInvalid = 0

  const lastmodValues = new Set<string>()

  for (const entry of entries) {
    try {
      const u = new URL(entry.loc)
      if (u.protocol !== "https:") nonHttps += 1
      if (normalizeHost(u.hostname) !== rootHost) crossHost += 1
    } catch {
      // already filtered upstream
    }

    if (entry.lastmod) {
      lastmodPresent += 1
      if (!LASTMOD_RE.test(entry.lastmod)) {
        lastmodInvalid += 1
      } else {
        const t = Date.parse(entry.lastmod)
        if (Number.isFinite(t)) {
          if (t > now) lastmodFuture += 1
          // Compare on the date portion so timezone noise doesn't split groups.
          lastmodValues.add(entry.lastmod.slice(0, 10))
        }
      }
    }

    if (entry.priority !== undefined) {
      const p = Number(entry.priority)
      if (!Number.isFinite(p) || p < 0 || p > 1) priorityInvalid += 1
    }

    if (entry.changefreq !== undefined) {
      if (!VALID_CHANGEFREQ.has(entry.changefreq.toLowerCase())) {
        changefreqInvalid += 1
      }
    }
  }

  const allSameLastmod =
    entries.length > 1 &&
    lastmodPresent === entries.length &&
    lastmodValues.size === 1
      ? [...lastmodValues][0]
      : null

  return {
    totalUrls: entries.length,
    duplicates,
    crossHost,
    nonHttps,
    overUrlLimit,
    lastmodPresent,
    lastmodInvalid,
    lastmodFuture,
    allSameLastmod,
    priorityInvalid,
    changefreqInvalid,
  }
}

export async function expandSitemap(
  rootUrl: string,
  options: ExpandOptions = {}
): Promise<ExpandResult> {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH
  const maxChildSitemaps = options.maxChildSitemaps ?? DEFAULT_MAX_CHILD_SITEMAPS
  const maxPageUrls = options.maxPageUrls ?? DEFAULT_MAX_PAGE_URLS

  const rootParsed = new URL(rootUrl)
  if (!isHttpUrl(rootParsed)) {
    throw new Error("Only http and https URLs are allowed")
  }

  const indexUrl = rootParsed.href
  const seen = new Set<string>()
  const allEntries: SitemapEntry[] = []
  const visited = new Set<string>()
  const sources: SitemapSource[] = []
  const failed: { url: string; reason: string }[] = []
  const overUrlLimit: string[] = []
  let duplicates = 0
  let childSitemapsFetched = 0
  let truncated = false
  let rootKind: SitemapKind = "unknown"

  type QueueItem = { url: string; depth: number }
  const queue: QueueItem[] = [{ url: indexUrl, depth: 0 }]

  while (queue.length > 0) {
    if (seen.size >= maxPageUrls) {
      truncated = true
      break
    }

    const batch: QueueItem[] = []
    while (queue.length > 0 && batch.length < CONCURRENCY) {
      const item = queue.shift()!
      if (visited.has(item.url)) continue
      visited.add(item.url)
      batch.push(item)
    }

    if (batch.length === 0) continue

    const batchResults = await mapPool(batch, CONCURRENCY, async (item) => {
      try {
        const xml = await fetchSitemapBody(item.url)
        const parsed = parseSitemapXml(xml)
        return { item, parsed, error: null as string | null }
      } catch (err) {
        const reason = err instanceof Error ? err.message : "Fetch failed"
        return { item, parsed: null, error: reason }
      }
    })

    for (const result of batchResults) {
      if (result.error || !result.parsed) {
        const reason = result.error || "Parse failed"
        failed.push({ url: result.item.url, reason })
        if (result.item.depth > 0 || rootKind === "unknown") {
          sources.push({
            sitemapUrl: result.item.url,
            urlCount: 0,
            urls: [],
            entries: [],
            error: reason,
          })
        }
        continue
      }

      const { item, parsed } = result
      if (item.depth === 0) {
        rootKind = parsed.kind
      } else {
        childSitemapsFetched += 1
      }

      if (parsed.kind === "urlset") {
        if (parsed.entries.length > SITEMAP_URL_LIMIT) {
          overUrlLimit.push(item.url)
        }
        const {
          entries: sourceEntries,
          truncated: hitCap,
          duplicates: dupes,
        } = collectEntries(parsed.entries, seen, maxPageUrls)

        for (const e of sourceEntries) {
          seen.add(e.loc)
          allEntries.push(e)
        }
        duplicates += dupes

        sources.push({
          sitemapUrl: item.url,
          urlCount: sourceEntries.length,
          urls: sourceEntries.map((e) => e.loc),
          entries: sourceEntries,
          declaredCount: parsed.entries.length,
        })
        if (hitCap) truncated = true
        continue
      }

      if (parsed.kind === "sitemapindex") {
        if (item.depth >= maxDepth) {
          truncated = true
          continue
        }

        let accepted = 0
        for (const loc of parsed.locs) {
          if (visited.size + queue.length + accepted >= maxChildSitemaps + 1) {
            truncated = true
            break
          }
          try {
            const childUrl = new URL(loc)
            if (!isHttpUrl(childUrl)) continue
            if (!sameSite(rootParsed, childUrl)) {
              const reason = "Cross-host sitemap skipped"
              failed.push({ url: childUrl.href, reason })
              sources.push({
                sitemapUrl: childUrl.href,
                urlCount: 0,
                urls: [],
                entries: [],
                error: reason,
              })
              continue
            }
            if (!visited.has(childUrl.href)) {
              queue.push({ url: childUrl.href, depth: item.depth + 1 })
              accepted += 1
            }
          } catch {
            const reason = "Invalid child sitemap URL"
            failed.push({ url: loc, reason })
            sources.push({
              sitemapUrl: loc,
              urlCount: 0,
              urls: [],
              entries: [],
              error: reason,
            })
          }
        }
        continue
      }

      const reason = "Unrecognized sitemap XML root"
      failed.push({ url: item.url, reason })
      sources.push({
        sitemapUrl: item.url,
        urlCount: 0,
        urls: [],
        entries: [],
        error: reason,
      })
    }
  }

  // Deduplicate sources by sitemapUrl (keep first successful, or last error)
  const byUrl = new Map<string, SitemapSource>()
  for (const source of sources) {
    const existing = byUrl.get(source.sitemapUrl)
    if (!existing) {
      byUrl.set(source.sitemapUrl, source)
      continue
    }
    if (existing.error && !source.error) {
      byUrl.set(source.sitemapUrl, source)
    }
  }

  return {
    indexUrl,
    urls: allEntries.map((e) => e.loc),
    entries: allEntries,
    rootKind,
    sources: Array.from(byUrl.values()),
    childSitemapsFetched,
    childSitemapsFailed: failed,
    truncated,
    validation: buildValidation(
      allEntries,
      normalizeHost(rootParsed.hostname),
      duplicates,
      overUrlLimit,
      Date.now()
    ),
  }
}
