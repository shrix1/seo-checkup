/**
 * Regex-based HTML signal extraction.
 *
 * Deliberately dependency-free and pure so both the server audit and the
 * client-side Meta Tags tool can share one parser.
 */

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

function attr(tag: string, name: string): string | undefined {
  const re = new RegExp(
    `${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i"
  )
  const m = tag.match(re)
  return m?.[1] ?? m?.[2] ?? m?.[3]
}

/** True when the attribute is present at all, even with an empty value. */
function hasAttr(tag: string, name: string): boolean {
  return new RegExp(`\\b${name}\\b`, "i").test(tag)
}

export type HreflangEntry = {
  hreflang: string
  href: string
}

export type ParsedHtml = {
  title?: string
  description?: string
  canonical?: string
  lang?: string
  charset?: string
  viewport?: string
  favicon?: string
  robotsMeta?: string
  h1Count: number
  h1Text?: string
  h2Count: number
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
  ogUrl?: string
  ogSiteName?: string
  ogLocale?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  twitterSite?: string
  jsonLdTypes: string[]
  hasJsonLd: boolean
  /** Every name= / property= meta tag on the page, lowercased keys */
  metaTags: Record<string, string>
  hreflang: HreflangEntry[]
  imgTotal: number
  /** Images with no alt attribute at all — the accessibility/SEO problem */
  imgMissingAlt: number
  /** Images with alt="" — valid for decorative images */
  imgDecorative: number
  /** Sample of src values that are missing alt, for display */
  imgMissingAltSamples: string[]
  /** Subresources referenced over plain http:// (mixed content when page is https) */
  insecureResources: string[]
  linkTotal: number
  linkInternal: number
  linkExternal: number
  wordCount: number
}

const EMPTY_PARSED: ParsedHtml = {
  h1Count: 0,
  h2Count: 0,
  jsonLdTypes: [],
  hasJsonLd: false,
  metaTags: {},
  hreflang: [],
  imgTotal: 0,
  imgMissingAlt: 0,
  imgDecorative: 0,
  imgMissingAltSamples: [],
  insecureResources: [],
  linkTotal: 0,
  linkInternal: 0,
  linkExternal: 0,
  wordCount: 0,
}

function collectMetaTags(html: string): Record<string, string> {
  const out: Record<string, string> = {}
  const tags = html.match(/<meta\b[^>]*>/gi) || []
  for (const tag of tags) {
    const key = attr(tag, "name") || attr(tag, "property") || attr(tag, "itemprop")
    if (!key) continue
    const content = attr(tag, "content")
    if (content === undefined) continue
    const normalized = key.trim().toLowerCase()
    // First occurrence wins, matching how crawlers read duplicated tags.
    if (!(normalized in out)) out[normalized] = decodeEntities(content.trim())
  }
  return out
}

function textWordCount(html: string): number {
  const stripped = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
  const text = decodeEntities(stripped).replace(/\s+/g, " ").trim()
  if (!text) return 0
  return text.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length
}

function sameHost(a: string, b: string): boolean {
  return a.replace(/^www\./i, "") === b.replace(/^www\./i, "")
}

export function parseHtml(html: string, pageUrl?: string): ParsedHtml {
  if (!html) return { ...EMPTY_PARSED }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch?.[1]
    ? decodeEntities(titleMatch[1].replace(/\s+/g, " ").trim())
    : undefined

  const htmlLang = html.match(
    /<html\b[^>]*\blang\s*=\s*(?:"([^"]*)"|'([^']*)')/i
  )
  const lang = htmlLang?.[1] || htmlLang?.[2]

  const metaTags = collectMetaTags(html)

  let charset: string | undefined
  const charsetMeta = html.match(
    /<meta\b[^>]*charset\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/i
  )
  if (charsetMeta) {
    charset = (charsetMeta[1] || charsetMeta[2] || charsetMeta[3])?.trim()
  }
  if (!charset) {
    const m = metaTags["content-type"]?.match(/charset=([^\s;]+)/i)
    if (m) charset = m[1]
  }

  const linkTags = html.match(/<link\b[^>]*>/gi) || []
  let canonical: string | undefined
  let favicon: string | undefined
  const hreflang: HreflangEntry[] = []

  for (const tag of linkTags) {
    const rel = (attr(tag, "rel") || "").toLowerCase()
    const href = attr(tag, "href")
    if (!href) continue
    const relParts = rel.split(/\s+/)

    if (relParts.includes("canonical") && !canonical) {
      canonical = decodeEntities(href.trim())
    }
    if (
      !favicon &&
      (rel.includes("icon") ||
        rel === "shortcut icon" ||
        rel === "apple-touch-icon")
    ) {
      favicon = decodeEntities(href.trim())
    }
    if (relParts.includes("alternate")) {
      const hl = attr(tag, "hreflang")
      if (hl) {
        hreflang.push({
          hreflang: hl.trim(),
          href: decodeEntities(href.trim()),
        })
      }
    }
  }

  const h1Count = (html.match(/<h1\b[^>]*>/gi) || []).length
  const h2Count = (html.match(/<h2\b[^>]*>/gi) || []).length
  const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
  const h1Text = h1Match?.[1]
    ? decodeEntities(h1Match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()) ||
      undefined
    : undefined

  // --- Images ---
  const imgTags = html.match(/<img\b[^>]*>/gi) || []
  let imgMissingAlt = 0
  let imgDecorative = 0
  const imgMissingAltSamples: string[] = []
  for (const tag of imgTags) {
    if (!hasAttr(tag, "alt")) {
      imgMissingAlt += 1
      const src = attr(tag, "src") || attr(tag, "data-src")
      if (src && imgMissingAltSamples.length < 5) {
        imgMissingAltSamples.push(decodeEntities(src.trim()))
      }
      continue
    }
    const alt = (attr(tag, "alt") || "").trim()
    if (!alt) imgDecorative += 1
  }

  // --- Mixed content: subresources fetched over http:// ---
  const insecure = new Set<string>()
  const resourceTags =
    html.match(/<(?:img|script|iframe|video|audio|source|embed)\b[^>]*>/gi) || []
  for (const tag of resourceTags) {
    const src = attr(tag, "src")
    if (src && /^http:\/\//i.test(src.trim())) insecure.add(src.trim())
  }
  for (const tag of linkTags) {
    const rel = (attr(tag, "rel") || "").toLowerCase()
    if (!/stylesheet|preload/.test(rel)) continue
    const href = attr(tag, "href")
    if (href && /^http:\/\//i.test(href.trim())) insecure.add(href.trim())
  }

  // --- Links ---
  const anchorTags = html.match(/<a\b[^>]*>/gi) || []
  let linkInternal = 0
  let linkExternal = 0
  let linkTotal = 0
  let host: string | undefined
  if (pageUrl) {
    try {
      host = new URL(pageUrl).hostname.toLowerCase()
    } catch {
      host = undefined
    }
  }
  for (const tag of anchorTags) {
    const href = attr(tag, "href")?.trim()
    if (!href) continue
    if (/^(#|mailto:|tel:|javascript:)/i.test(href)) continue
    linkTotal += 1
    if (/^https?:\/\//i.test(href)) {
      try {
        const h = new URL(href).hostname.toLowerCase()
        if (host && sameHost(h, host)) linkInternal += 1
        else linkExternal += 1
      } catch {
        linkExternal += 1
      }
    } else {
      linkInternal += 1
    }
  }

  // --- JSON-LD ---
  const jsonLdTypes: string[] = []
  const scripts = html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )
  for (const match of scripts) {
    const raw = match[1]?.trim()
    if (!raw) continue
    try {
      const data = JSON.parse(raw) as unknown
      const collect = (node: unknown) => {
        if (!node || typeof node !== "object") return
        if (Array.isArray(node)) {
          node.forEach(collect)
          return
        }
        const obj = node as Record<string, unknown>
        const t = obj["@type"]
        if (typeof t === "string") jsonLdTypes.push(t)
        else if (Array.isArray(t)) {
          for (const item of t) {
            if (typeof item === "string") jsonLdTypes.push(item)
          }
        }
        if (obj["@graph"]) collect(obj["@graph"])
      }
      collect(data)
    } catch {
      // ignore invalid JSON-LD
    }
  }

  return {
    title,
    description: metaTags["description"],
    canonical,
    lang,
    charset,
    viewport: metaTags["viewport"],
    favicon,
    robotsMeta: metaTags["robots"],
    h1Count,
    h1Text,
    h2Count,
    ogTitle: metaTags["og:title"],
    ogDescription: metaTags["og:description"],
    ogImage: metaTags["og:image"],
    ogType: metaTags["og:type"],
    ogUrl: metaTags["og:url"],
    ogSiteName: metaTags["og:site_name"],
    ogLocale: metaTags["og:locale"],
    twitterCard: metaTags["twitter:card"],
    twitterTitle: metaTags["twitter:title"],
    twitterDescription: metaTags["twitter:description"],
    twitterImage: metaTags["twitter:image"],
    twitterSite: metaTags["twitter:site"],
    jsonLdTypes: [...new Set(jsonLdTypes)],
    hasJsonLd: jsonLdTypes.length > 0 || /application\/ld\+json/i.test(html),
    metaTags,
    hreflang,
    imgTotal: imgTags.length,
    imgMissingAlt,
    imgDecorative,
    imgMissingAltSamples,
    insecureResources: [...insecure].slice(0, 10),
    linkTotal,
    linkInternal,
    linkExternal,
    wordCount: textWordCount(html),
  }
}

export function parseSitemapLines(robotsBody: string): string[] {
  const urls: string[] = []
  for (const line of robotsBody.split(/\r?\n/)) {
    const m = line.match(/^\s*Sitemap\s*:\s*(\S+)/i)
    if (m?.[1]) urls.push(m[1].trim())
  }
  return [...new Set(urls)]
}
