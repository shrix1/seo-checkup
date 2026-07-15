import { gunzipSync } from "node:zlib"

const MAX_DEPTH = 3
const MAX_CHILD_SITEMAPS = 100
const MAX_PAGE_URLS = 50_000
const CONCURRENCY = 4
const FETCH_TIMEOUT_MS = 15_000
const MAX_BODY_BYTES = 2_000_000

export type SitemapKind = "urlset" | "sitemapindex" | "unknown"

export type ExpandResult = {
  urls: string[]
  rootKind: SitemapKind
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

export async function expandSitemap(rootUrl: string): Promise<ExpandResult> {
  const rootParsed = new URL(rootUrl)
  if (!isHttpUrl(rootParsed)) {
    throw new Error("Only http and https URLs are allowed")
  }

  const pageUrls = new Set<string>()
  const visited = new Set<string>()
  const failed: { url: string; reason: string }[] = []
  let childSitemapsFetched = 0
  let truncated = false
  let rootKind: SitemapKind = "unknown"

  type QueueItem = { url: string; depth: number }
  const queue: QueueItem[] = [{ url: rootParsed.href, depth: 0 }]

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
        failed.push({
          url: result.item.url,
          reason: result.error || "Parse failed",
        })
        continue
      }

      const { item, parsed } = result
      if (item.depth === 0) {
        rootKind = parsed.kind
      } else {
        childSitemapsFetched += 1
      }

      if (parsed.kind === "urlset") {
        for (const loc of parsed.locs) {
          if (pageUrls.size >= MAX_PAGE_URLS) {
            truncated = true
            break
          }
          try {
            const locUrl = new URL(loc)
            if (isHttpUrl(locUrl)) {
              pageUrls.add(locUrl.href)
            }
          } catch {
            // skip invalid page URL
          }
        }
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
              failed.push({
                url: childUrl.href,
                reason: "Cross-host sitemap skipped",
              })
              continue
            }
            if (!visited.has(childUrl.href)) {
              queue.push({ url: childUrl.href, depth: item.depth + 1 })
              accepted += 1
            }
          } catch {
            failed.push({ url: loc, reason: "Invalid child sitemap URL" })
          }
        }
        continue
      }

      failed.push({
        url: item.url,
        reason: "Unrecognized sitemap XML root",
      })
    }
  }

  return {
    urls: Array.from(pageUrls),
    rootKind,
    childSitemapsFetched,
    childSitemapsFailed: failed,
    truncated,
  }
}
