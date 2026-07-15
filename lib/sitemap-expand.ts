import { gunzipSync } from "node:zlib"

const MAX_DEPTH = 3
const MAX_CHILD_SITEMAPS = 100
const MAX_PAGE_URLS = 50_000
const CONCURRENCY = 4
const FETCH_TIMEOUT_MS = 15_000
const MAX_BODY_BYTES = 2_000_000

export type SitemapKind = "urlset" | "sitemapindex" | "unknown"

export type SitemapSource = {
  sitemapUrl: string
  urlCount: number
  urls: string[]
  error?: string
}

export type ExpandResult = {
  indexUrl: string
  urls: string[]
  rootKind: SitemapKind
  sources: SitemapSource[]
  childSitemapsFetched: number
  childSitemapsFailed: { url: string; reason: string }[]
  truncated: boolean
}

type ParseResult = {
  kind: SitemapKind
  locs: string[]
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

export function parseSitemapXml(xml: string): ParseResult {
  const rootMatch = xml.match(/<(?:[A-Za-z_][\w.-]*:)?(sitemapindex|urlset)\b/i)
  const root = rootMatch?.[1]?.toLowerCase()

  if (root === "sitemapindex") {
    const locs: string[] = []
    const blocks = xml.matchAll(
      /<(?:[A-Za-z_][\w.-]*:)?sitemap\b[^>]*>[\s\S]*?<\/(?:[A-Za-z_][\w.-]*:)?sitemap>/gi
    )
    for (const block of blocks) {
      const locMatch = block[0].match(
        /<(?:[A-Za-z_][\w.-]*:)?loc\b[^>]*>\s*([^<]+?)\s*<\/(?:[A-Za-z_][\w.-]*:)?loc>/i
      )
      if (locMatch?.[1]) {
        locs.push(decodeXmlEntities(locMatch[1].trim()))
      }
    }
    return { kind: "sitemapindex", locs }
  }

  if (root === "urlset") {
    const locs: string[] = []
    const blocks = xml.matchAll(
      /<(?:[A-Za-z_][\w.-]*:)?url\b[^>]*>[\s\S]*?<\/(?:[A-Za-z_][\w.-]*:)?url>/gi
    )
    for (const block of blocks) {
      const locMatch = block[0].match(
        /<(?:[A-Za-z_][\w.-]*:)?loc\b[^>]*>\s*([^<]+?)\s*<\/(?:[A-Za-z_][\w.-]*:)?loc>/i
      )
      if (locMatch?.[1]) {
        locs.push(decodeXmlEntities(locMatch[1].trim()))
      }
    }
    return { kind: "urlset", locs }
  }

  return { kind: "unknown", locs: [] }
}

async function fetchSitemapBody(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      Accept: "application/xml,text/xml,application/gzip,*/*",
    },
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  const capped = buffer.subarray(0, MAX_BODY_BYTES)
  const encoding = (res.headers.get("content-encoding") || "").toLowerCase()
  const looksGzip =
    url.toLowerCase().endsWith(".gz") ||
    encoding.includes("gzip") ||
    (capped.length >= 2 && capped[0] === 0x1f && capped[1] === 0x8b)

  if (looksGzip) {
    try {
      return gunzipSync(capped).toString("utf8")
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

  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => run()
  )
  await Promise.all(runners)
  return results
}

function collectPageUrls(
  locs: string[],
  pageUrls: Set<string>,
  remaining: number
): { urls: string[]; truncated: boolean } {
  const urls: string[] = []
  let truncated = false

  for (const loc of locs) {
    if (pageUrls.size + urls.length >= remaining) {
      truncated = true
      break
    }
    try {
      const locUrl = new URL(loc)
      if (!isHttpUrl(locUrl)) continue
      if (pageUrls.has(locUrl.href) || urls.includes(locUrl.href)) continue
      urls.push(locUrl.href)
    } catch {
      // skip invalid page URL
    }
  }

  return { urls, truncated }
}

export async function expandSitemap(rootUrl: string): Promise<ExpandResult> {
  const rootParsed = new URL(rootUrl)
  if (!isHttpUrl(rootParsed)) {
    throw new Error("Only http and https URLs are allowed")
  }

  const indexUrl = rootParsed.href
  const pageUrls = new Set<string>()
  const visited = new Set<string>()
  const sources: SitemapSource[] = []
  const failed: { url: string; reason: string }[] = []
  let childSitemapsFetched = 0
  let truncated = false
  let rootKind: SitemapKind = "unknown"

  type QueueItem = { url: string; depth: number }
  const queue: QueueItem[] = [{ url: indexUrl, depth: 0 }]

  while (queue.length > 0) {
    if (pageUrls.size >= MAX_PAGE_URLS) {
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
        // Only record failed leaf/child sources (not the root index itself as a source with error
        // when depth > 0, or when root fails entirely)
        if (result.item.depth > 0 || rootKind === "unknown") {
          sources.push({
            sitemapUrl: result.item.url,
            urlCount: 0,
            urls: [],
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
        const { urls: sourceUrls, truncated: hitCap } = collectPageUrls(
          parsed.locs,
          pageUrls,
          MAX_PAGE_URLS
        )
        for (const u of sourceUrls) pageUrls.add(u)
        sources.push({
          sitemapUrl: item.url,
          urlCount: sourceUrls.length,
          urls: sourceUrls,
        })
        if (hitCap) truncated = true
        continue
      }

      if (parsed.kind === "sitemapindex") {
        if (item.depth >= MAX_DEPTH) {
          truncated = true
          continue
        }

        let accepted = 0
        for (const loc of parsed.locs) {
          if (visited.size + queue.length + accepted >= MAX_CHILD_SITEMAPS + 1) {
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
    urls: Array.from(pageUrls),
    rootKind,
    sources: Array.from(byUrl.values()),
    childSitemapsFetched,
    childSitemapsFailed: failed,
    truncated,
  }
}
