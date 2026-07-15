import { fetchDomainRating } from "@/lib/ahrefs-dr"
import { fetchUrl, hostnameFromInput, normalizeOrigin } from "@/lib/fetch-url"
import { expandSitemap } from "@/lib/sitemap-expand"
import { parseHtml, parseSitemapLines } from "@/lib/audit/parse-html"
import type {
  AuditCheck,
  AuditReport,
  CategoryScore,
  CheckStatus,
} from "@/lib/audit/types"

const CATEGORY_LABELS = {
  onpage: "On-page",
  crawl: "Robots & sitemap",
  trust: "Trust & authority",
} as const

function scoreFromChecks(checks: AuditCheck[]): {
  score: number
  pass: number
  warn: number
  fail: number
} {
  let pass = 0
  let warn = 0
  let fail = 0
  let points = 0
  let max = 0
  for (const c of checks) {
    max += 2
    if (c.status === "pass") {
      pass += 1
      points += 2
    } else if (c.status === "warn") {
      warn += 1
      points += 1
    } else {
      fail += 1
    }
  }
  return {
    score: max === 0 ? 0 : Math.round((points / max) * 100),
    pass,
    warn,
    fail,
  }
}

function statusOrder(status: CheckStatus): number {
  return status === "fail" ? 0 : status === "warn" ? 1 : 2
}

export async function runAudit(input: string): Promise<AuditReport> {
  const originUrl = normalizeOrigin(input)
  const origin = originUrl.origin
  const domain = hostnameFromInput(input)
  const homeUrl = `${origin}/`
  const robotsUrl = `${origin}/robots.txt`
  const metadataDeep = `/metadata?q=${encodeURIComponent(origin)}`
  const robotsDeep = `/robots?q=${encodeURIComponent(robotsUrl)}`
  const drDeep = `/domain-rating?q=${encodeURIComponent(domain)}`

  const [homeRes, robotsRes, drRes] = await Promise.all([
    fetchUrl(homeUrl),
    fetchUrl(robotsUrl),
    fetchDomainRating(domain),
  ])

  const parsed = homeRes.ok ? parseHtml(homeRes.body) : parseHtml("")
  const checks: AuditCheck[] = []

  // --- On-page ---
  const titleLen = parsed.title?.length ?? 0
  checks.push({
    id: "title",
    category: "onpage",
    label: "Title tag",
    status: !parsed.title
      ? "fail"
      : titleLen < 15 || titleLen > 65
        ? "warn"
        : "pass",
    value: parsed.title || "(missing)",
    detail: parsed.title
      ? `${titleLen} characters`
      : "No <title> found on the homepage",
    fixHint: "Add a unique title of roughly 30–60 characters.",
    deepLink: metadataDeep,
  })

  const descLen = parsed.description?.length ?? 0
  checks.push({
    id: "description",
    category: "onpage",
    label: "Meta description",
    status: !parsed.description
      ? "fail"
      : descLen < 50 || descLen > 165
        ? "warn"
        : "pass",
    value: parsed.description || "(missing)",
    detail: parsed.description
      ? `${descLen} characters`
      : "No meta description found",
    fixHint: "Add a meta description around 70–160 characters.",
    deepLink: metadataDeep,
  })

  checks.push({
    id: "h1",
    category: "onpage",
    label: "H1 heading",
    status:
      parsed.h1Count === 1 ? "pass" : parsed.h1Count === 0 ? "fail" : "warn",
    value: String(parsed.h1Count),
    detail:
      parsed.h1Count === 1
        ? "Exactly one H1 found"
        : parsed.h1Count === 0
          ? "No H1 found"
          : `${parsed.h1Count} H1 tags found`,
    fixHint: "Use a single clear H1 that describes the page.",
  })

  checks.push({
    id: "canonical",
    category: "onpage",
    label: "Canonical URL",
    status: parsed.canonical ? "pass" : "warn",
    value: parsed.canonical || "(missing)",
    detail: parsed.canonical
      ? "Canonical link present"
      : "No rel=canonical link",
    fixHint: "Add a self-referencing canonical to avoid duplicate URLs.",
  })

  checks.push({
    id: "lang",
    category: "onpage",
    label: "HTML lang",
    status: parsed.lang ? "pass" : "warn",
    value: parsed.lang || "(missing)",
    detail: parsed.lang
      ? `lang="${parsed.lang}"`
      : "Missing lang attribute on <html>",
    fixHint: 'Set html lang, e.g. lang="en".',
  })

  checks.push({
    id: "charset",
    category: "onpage",
    label: "Character encoding",
    status: parsed.charset ? "pass" : "warn",
    value: parsed.charset || "(missing)",
    detail: parsed.charset
      ? `Charset ${parsed.charset}`
      : "No charset meta declared",
    fixHint: "Declare <meta charset=\"utf-8\"> early in <head>.",
  })

  checks.push({
    id: "viewport",
    category: "onpage",
    label: "Viewport meta",
    status: parsed.viewport
      ? /width\s*=\s*device-width/i.test(parsed.viewport)
        ? "pass"
        : "warn"
      : "fail",
    value: parsed.viewport || "(missing)",
    detail: parsed.viewport
      ? "Viewport meta present"
      : "Missing viewport meta for mobile",
    fixHint: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
  })

  checks.push({
    id: "favicon",
    category: "onpage",
    label: "Favicon",
    status: parsed.favicon ? "pass" : "warn",
    value: parsed.favicon || "(missing)",
    detail: parsed.favicon ? "Favicon link found" : "No favicon link found",
    fixHint: "Add a <link rel=\"icon\"> in the document head.",
  })

  const robotsMeta = (parsed.robotsMeta || "").toLowerCase()
  const noindex = robotsMeta.includes("noindex")
  checks.push({
    id: "indexable",
    category: "onpage",
    label: "Indexability (robots meta)",
    status: noindex ? "fail" : "pass",
    value: parsed.robotsMeta || "index (default)",
    detail: noindex
      ? "Homepage meta robots includes noindex"
      : "Homepage is not blocked by robots meta",
    fixHint: "Remove noindex from public pages you want indexed.",
  })

  checks.push({
    id: "jsonld",
    category: "onpage",
    label: "Structured data (JSON-LD)",
    status: parsed.hasJsonLd ? "pass" : "warn",
    value: parsed.jsonLdTypes.length
      ? parsed.jsonLdTypes.join(", ")
      : parsed.hasJsonLd
        ? "Present"
        : "(none)",
    detail: parsed.hasJsonLd
      ? "JSON-LD structured data detected"
      : "No JSON-LD found",
    fixHint: "Add relevant Schema.org JSON-LD for the page type.",
  })

  checks.push({
    id: "og",
    category: "onpage",
    label: "Open Graph basics",
    status:
      parsed.ogTitle && parsed.ogDescription && parsed.ogImage
        ? "pass"
        : parsed.ogTitle || parsed.ogImage
          ? "warn"
          : "fail",
    value: [
      parsed.ogTitle ? "title" : null,
      parsed.ogDescription ? "description" : null,
      parsed.ogImage ? "image" : null,
    ]
      .filter(Boolean)
      .join(", ") || "(missing)",
    detail: "OG title, description, and image for social previews",
    fixHint: "Set og:title, og:description, and og:image.",
    deepLink: metadataDeep,
  })

  checks.push({
    id: "twitter",
    category: "onpage",
    label: "Twitter Card tags",
    status:
      parsed.twitterCard || parsed.twitterTitle || parsed.twitterImage
        ? "pass"
        : "warn",
    value: parsed.twitterCard || parsed.twitterTitle || "(missing)",
    detail:
      parsed.twitterCard || parsed.twitterTitle
        ? "Twitter Card tags present"
        : "No Twitter Card tags (OG may still work)",
    fixHint: "Optional: add twitter:card and twitter:image.",
    deepLink: metadataDeep,
  })

  if (!homeRes.ok) {
    checks.push({
      id: "homepage",
      category: "onpage",
      label: "Homepage fetch",
      status: "fail",
      value: homeRes.error || `HTTP ${homeRes.status}`,
      detail: "Could not fetch the homepage HTML",
      fixHint: "Confirm the site is publicly reachable over HTTPS.",
    })
  }

  // --- Crawl: robots + sitemap ---
  checks.push({
    id: "robots",
    category: "crawl",
    label: "robots.txt reachable",
    status: robotsRes.ok ? "pass" : "fail",
    value: robotsRes.ok
      ? `${robotsRes.status}`
      : robotsRes.error || `HTTP ${robotsRes.status}`,
    detail: robotsRes.ok
      ? "robots.txt returned successfully"
      : "Could not fetch robots.txt",
    fixHint: "Publish a robots.txt at the site root.",
    deepLink: robotsDeep,
  })

  const sitemapFromRobots = robotsRes.ok
    ? parseSitemapLines(robotsRes.body)
    : []
  checks.push({
    id: "robots-sitemap",
    category: "crawl",
    label: "Sitemap declared in robots.txt",
    status: sitemapFromRobots.length > 0 ? "pass" : "warn",
    value:
      sitemapFromRobots.length > 0
        ? sitemapFromRobots.join(", ")
        : "(none)",
    detail:
      sitemapFromRobots.length > 0
        ? `${sitemapFromRobots.length} Sitemap directive(s)`
        : "No Sitemap: lines in robots.txt",
    fixHint: "Add Sitemap: https://yoursite.com/sitemap.xml to robots.txt.",
    deepLink: robotsDeep,
  })

  const sitemapCandidates = [
    ...sitemapFromRobots,
    `${origin}/sitemap.xml`,
  ]
  const uniqueSitemaps = [...new Set(sitemapCandidates)]

  let sitemapUrlUsed = uniqueSitemaps[0]
  let sitemapUrlCount = 0
  let sitemapTruncated = false
  let sitemapError: string | undefined
  let sitemapExpanded = false

  for (const candidate of uniqueSitemaps) {
    try {
      const expanded = await expandSitemap(candidate)
      if (expanded.urls.length > 0 || expanded.rootKind !== "unknown") {
        sitemapUrlUsed = candidate
        sitemapUrlCount = expanded.urls.length
        sitemapTruncated = expanded.truncated
        sitemapExpanded = true
        if (expanded.urls.length === 0 && expanded.childSitemapsFailed.length) {
          sitemapError = expanded.childSitemapsFailed[0]?.reason
        }
        break
      }
    } catch (err) {
      sitemapError = err instanceof Error ? err.message : "Expand failed"
    }
  }

  const sitemapDeep = `/sitemap?q=${encodeURIComponent(sitemapUrlUsed)}`
  checks.push({
    id: "sitemap",
    category: "crawl",
    label: "XML sitemap expands",
    status: !sitemapExpanded
      ? "fail"
      : sitemapUrlCount === 0
        ? "warn"
        : "pass",
    value: sitemapExpanded
      ? `${sitemapUrlCount} URLs${sitemapTruncated ? " (truncated)" : ""}`
      : sitemapError || "Not found",
    detail: sitemapExpanded
      ? `Expanded ${sitemapUrlUsed}`
      : "Could not expand a sitemap for this origin",
    fixHint: "Publish a valid XML sitemap and reference it in robots.txt.",
    deepLink: sitemapDeep,
  })

  // --- Trust ---
  const finalIsHttps = homeRes.finalUrl.startsWith("https:")
  checks.push({
    id: "https",
    category: "trust",
    label: "HTTPS",
    status: finalIsHttps ? "pass" : "fail",
    value: homeRes.finalUrl || origin,
    detail: finalIsHttps
      ? "Final URL uses HTTPS"
      : "Site did not resolve to HTTPS",
    fixHint: "Serve the site over HTTPS and redirect HTTP to HTTPS.",
  })

  const hsts = homeRes.headers.get("strict-transport-security")
  checks.push({
    id: "hsts",
    category: "trust",
    label: "HSTS header",
    status: hsts ? "pass" : "warn",
    value: hsts || "(missing)",
    detail: hsts
      ? "Strict-Transport-Security present"
      : "No HSTS response header",
    fixHint: "Enable HSTS on your HTTPS responses.",
  })

  const csp = homeRes.headers.get("content-security-policy")
  checks.push({
    id: "csp",
    category: "trust",
    label: "Content-Security-Policy",
    status: csp ? "pass" : "warn",
    value: csp ? "Present" : "(missing)",
    detail: csp ? "CSP header present" : "No CSP header",
    fixHint: "Add a Content-Security-Policy suited to your app.",
  })

  const xfo = homeRes.headers.get("x-frame-options")
  checks.push({
    id: "xfo",
    category: "trust",
    label: "Frame protection",
    status: xfo || csp?.toLowerCase().includes("frame-ancestors") ? "pass" : "warn",
    value: xfo || (csp?.includes("frame-ancestors") ? "CSP frame-ancestors" : "(missing)"),
    detail: "X-Frame-Options or CSP frame-ancestors",
    fixHint: "Set X-Frame-Options or CSP frame-ancestors.",
  })

  const xcto = homeRes.headers.get("x-content-type-options")
  checks.push({
    id: "xcto",
    category: "trust",
    label: "MIME sniffing protection",
    status: xcto?.toLowerCase() === "nosniff" ? "pass" : "warn",
    value: xcto || "(missing)",
    detail:
      xcto?.toLowerCase() === "nosniff"
        ? "X-Content-Type-Options: nosniff"
        : "Missing X-Content-Type-Options: nosniff",
    fixHint: "Send X-Content-Type-Options: nosniff.",
  })

  checks.push({
    id: "domain-rating",
    category: "trust",
    label: "Domain Rating",
    status:
      typeof drRes.domainRating === "number"
        ? drRes.domainRating >= 10
          ? "pass"
          : "warn"
        : "warn",
    value:
      typeof drRes.domainRating === "number"
        ? String(Math.round(drRes.domainRating))
        : drRes.error || "Unavailable",
    detail:
      typeof drRes.domainRating === "number"
        ? `Ahrefs Domain Rating ${Math.round(drRes.domainRating)}/100`
        : "Could not load Domain Rating",
    fixHint: "Build quality backlinks over time to grow Domain Rating.",
    deepLink: drDeep,
  })

  const byCat = {
    onpage: checks.filter((c) => c.category === "onpage"),
    crawl: checks.filter((c) => c.category === "crawl"),
    trust: checks.filter((c) => c.category === "trust"),
  }

  const categories: CategoryScore[] = (
    Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>
  ).map((id) => {
    const stats = scoreFromChecks(byCat[id])
    return {
      id,
      label: CATEGORY_LABELS[id],
      ...stats,
      checks: byCat[id],
    }
  })

  const overall = scoreFromChecks(checks)
  const fixFirst = [...checks]
    .filter((c) => c.status !== "pass")
    .sort((a, b) => statusOrder(a.status) - statusOrder(b.status))

  return {
    inputUrl: input.trim(),
    origin,
    finalUrl: homeRes.finalUrl || homeUrl,
    domain,
    auditedAt: new Date().toISOString(),
    score: overall.score,
    pass: overall.pass,
    warn: overall.warn,
    fail: overall.fail,
    categories,
    fixFirst,
    domainRating: drRes.domainRating,
    domainRatingError: drRes.error,
  }
}
