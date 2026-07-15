function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

function attr(
  tag: string,
  name: string
): string | undefined {
  const re = new RegExp(
    `${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i"
  )
  const m = tag.match(re)
  return m?.[1] ?? m?.[2] ?? m?.[3]
}

function metaByNameOrProperty(html: string, key: string): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/gi) || []
  for (const tag of tags) {
    const name = attr(tag, "name") || attr(tag, "property")
    if (name?.toLowerCase() === key.toLowerCase()) {
      const content = attr(tag, "content")
      if (content !== undefined) return decodeEntities(content.trim())
    }
  }
  return undefined
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
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogType?: string
  ogUrl?: string
  twitterCard?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  jsonLdTypes: string[]
  hasJsonLd: boolean
}

export function parseHtml(html: string): ParsedHtml {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch?.[1]
    ? decodeEntities(titleMatch[1].replace(/\s+/g, " ").trim())
    : undefined

  const htmlLang = html.match(/<html\b[^>]*\blang\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
  const lang = htmlLang?.[1] || htmlLang?.[2]

  let charset: string | undefined
  const charsetMeta = html.match(
    /<meta\b[^>]*charset\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+))/i
  )
  if (charsetMeta) {
    charset = (charsetMeta[1] || charsetMeta[2] || charsetMeta[3])?.trim()
  }
  if (!charset) {
    const httpEquiv = metaByNameOrProperty(html, "content-type")
    const m = httpEquiv?.match(/charset=([^\s;]+)/i)
    if (m) charset = m[1]
  }

  const linkTags = html.match(/<link\b[^>]*>/gi) || []
  let canonical: string | undefined
  let favicon: string | undefined
  for (const tag of linkTags) {
    const rel = (attr(tag, "rel") || "").toLowerCase()
    const href = attr(tag, "href")
    if (!href) continue
    if (rel.split(/\s+/).includes("canonical")) {
      canonical = decodeEntities(href.trim())
    }
    if (
      !favicon &&
      (rel.includes("icon") || rel === "shortcut icon" || rel === "apple-touch-icon")
    ) {
      favicon = decodeEntities(href.trim())
    }
  }

  const h1Count = (html.match(/<h1\b[^>]*>/gi) || []).length

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
    description: metaByNameOrProperty(html, "description"),
    canonical,
    lang,
    charset,
    viewport: metaByNameOrProperty(html, "viewport"),
    favicon,
    robotsMeta: metaByNameOrProperty(html, "robots"),
    h1Count,
    ogTitle: metaByNameOrProperty(html, "og:title"),
    ogDescription: metaByNameOrProperty(html, "og:description"),
    ogImage: metaByNameOrProperty(html, "og:image"),
    ogType: metaByNameOrProperty(html, "og:type"),
    ogUrl: metaByNameOrProperty(html, "og:url"),
    twitterCard: metaByNameOrProperty(html, "twitter:card"),
    twitterTitle: metaByNameOrProperty(html, "twitter:title"),
    twitterDescription: metaByNameOrProperty(html, "twitter:description"),
    twitterImage: metaByNameOrProperty(html, "twitter:image"),
    jsonLdTypes: [...new Set(jsonLdTypes)],
    hasJsonLd: jsonLdTypes.length > 0 || /application\/ld\+json/i.test(html),
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
