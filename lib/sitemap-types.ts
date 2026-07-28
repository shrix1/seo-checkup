/**
 * Client-safe sitemap types and constants.
 *
 * Kept separate from `sitemap-expand.ts` because that module pulls in
 * `node:zlib` and `node:dns` through safeFetch — importing any *value* from it
 * in a client component drags the whole Node graph into the browser bundle.
 */

/** Sitemap protocol caps: 50,000 URLs and 50MB uncompressed per file. */
export const SITEMAP_URL_LIMIT = 50_000

export type SitemapKind = "urlset" | "sitemapindex" | "unknown"

export type SitemapEntry = {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: string
}

export type SitemapSource = {
  sitemapUrl: string
  urlCount: number
  urls: string[]
  entries: SitemapEntry[]
  /** URLs declared in this file before the 50,000 protocol cap was applied */
  declaredCount?: number
  error?: string
}

export type SitemapValidation = {
  totalUrls: number
  duplicates: number
  crossHost: number
  nonHttps: number
  /** Sitemap files that declare more than the 50,000-URL protocol limit */
  overUrlLimit: string[]
  lastmodPresent: number
  lastmodInvalid: number
  lastmodFuture: number
  /** Set when every lastmod is identical — usually a CMS writing build time */
  allSameLastmod: string | null
  priorityInvalid: number
  changefreqInvalid: number
}

export type ExpandResult = {
  indexUrl: string
  urls: string[]
  entries: SitemapEntry[]
  rootKind: SitemapKind
  sources: SitemapSource[]
  childSitemapsFetched: number
  childSitemapsFailed: { url: string; reason: string }[]
  truncated: boolean
  validation: SitemapValidation
}
