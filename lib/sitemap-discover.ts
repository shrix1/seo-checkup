import { parseSitemapLines } from "@/lib/audit/parse-html"
import { fetchUrl, normalizeOrigin } from "@/lib/fetch-url"
import { sameRegistrableHost } from "@/lib/safe-url"

/**
 * Work out where a site's sitemap actually lives when someone pastes a bare
 * domain. Order matters: what the site declares in robots.txt beats guesswork,
 * and guesswork covers the conventions the common CMSes ship.
 */

export type CandidateSource = "input" | "robots" | "common-path"

export type SitemapCandidate = {
  url: string
  source: CandidateSource
}

const COMMON_PATHS = [
  "/sitemap.xml",
  "/sitemap_index.xml",
  "/sitemap-index.xml",
  "/sitemap.xml.gz",
  // WordPress core since 5.5
  "/wp-sitemap.xml",
  // Yoast and several generators
  "/sitemap_index.xml.gz",
  "/sitemap/sitemap.xml",
  "/sitemaps/sitemap.xml",
]

/** A URL the user probably meant as a sitemap rather than a site root. */
export function looksLikeSitemapUrl(input: string): boolean {
  try {
    const path = new URL(input).pathname.toLowerCase()
    return (
      path.endsWith(".xml") ||
      path.endsWith(".xml.gz") ||
      path.endsWith(".txt") ||
      path.includes("sitemap")
    )
  } catch {
    return false
  }
}

export async function sitemapCandidates(
  input: string
): Promise<SitemapCandidate[]> {
  const candidates: SitemapCandidate[] = []
  const seen = new Set<string>()

  const push = (url: string, source: CandidateSource) => {
    if (seen.has(url)) return
    seen.add(url)
    candidates.push({ url, source })
  }

  // Whatever the user typed is always tried first when it looks like a sitemap.
  if (looksLikeSitemapUrl(input)) push(input, "input")

  let origin: URL
  try {
    origin = normalizeOrigin(input)
  } catch {
    return candidates
  }

  // What the site itself declares wins over any guess.
  const robots = await fetchUrl(`${origin.origin}/robots.txt`, {
    maxBytes: 64_000,
  })
  if (robots.ok) {
    for (const declared of parseSitemapLines(robots.body)) {
      try {
        if (sameRegistrableHost(new URL(declared).hostname, origin.hostname)) {
          push(declared, "robots")
        }
      } catch {
        // skip malformed Sitemap: lines
      }
    }
  }

  for (const path of COMMON_PATHS) {
    push(`${origin.origin}${path}`, "common-path")
  }

  // If the input was a sitemap-looking URL that we have not already queued
  // (e.g. it lives on a different host), still give it a turn at the end.
  if (!seen.has(input) && looksLikeSitemapUrl(input)) push(input, "input")

  return candidates
}
