import { fetchDomainRating } from "@/lib/ahrefs-dr"
import {
  fetchUrl,
  hostnameFromInput,
  normalizeOrigin,
  normalizePageUrl,
  toggleWww,
} from "@/lib/fetch-url"
import { expandSitemap } from "@/lib/sitemap-expand"
import { parseHtml, parseSitemapLines } from "@/lib/audit/parse-html"
import { sameRegistrableHost } from "@/lib/safe-url"
import { matchRobots, parseRobots } from "@/lib/robots-parser"
import { AI_CRAWLERS, CITATION_CRAWLERS } from "@/lib/ai-crawlers"
import { measureSnippet } from "@/lib/serp-width"
import type {
  AuditCheck,
  AuditReport,
  CategoryScore,
  CheckStatus,
} from "@/lib/audit/types"

const CATEGORY_LABELS = {
  onpage: "On-page",
  crawl: "Robots & sitemap",
  trust: "Trust & security",
  ai: "AI & answer engines",
} as const

/** A path no real site should serve, used to detect soft 404s. */
const NOT_FOUND_PROBE = "/seocheckup-404-probe-do-not-index"

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

/** Compare URLs ignoring trailing-slash and hash noise. */
function sameUrl(a: string, b: string): boolean {
  const norm = (u: string) => {
    try {
      const url = new URL(u)
      url.hash = ""
      const path = url.pathname.replace(/\/+$/, "") || "/"
      return `${url.protocol}//${url.host.toLowerCase()}${path}${url.search}`
    } catch {
      return u
    }
  }
  return norm(a) === norm(b)
}

function stripWww(host: string): string {
  return host.toLowerCase().replace(/^www\./, "")
}

export async function runAudit(input: string): Promise<AuditReport> {
  const pageUrlObj = normalizePageUrl(input)
  const originUrl = normalizeOrigin(input)
  const origin = originUrl.origin
  const domain = hostnameFromInput(input)
  const pageUrl = pageUrlObj.href
  const isHomepage = pageUrlObj.pathname === "/" && !pageUrlObj.search

  const robotsUrl = `${origin}/robots.txt`
  const llmsUrl = `${origin}/llms.txt`
  const httpProbeUrl = `http://${originUrl.hostname}/`
  const altHost = toggleWww(originUrl.hostname)
  const altProbeUrl = `https://${altHost}/`
  const notFoundUrl = `${origin}${NOT_FOUND_PROBE}`

  const metadataDeep = `/metadata?q=${encodeURIComponent(pageUrl)}`
  const robotsDeep = `/robots?q=${encodeURIComponent(robotsUrl)}`
  const drDeep = `/domain-rating?q=${encodeURIComponent(domain)}`

  const [pageRes, robotsRes, drRes, llmsRes, httpProbe, altProbe, notFoundProbe] =
    await Promise.all([
      fetchUrl(pageUrl),
      fetchUrl(robotsUrl),
      fetchDomainRating(domain),
      fetchUrl(llmsUrl, { maxBytes: 4096 }),
      fetchUrl(httpProbeUrl, { maxBytes: 2048 }),
      fetchUrl(altProbeUrl, { maxBytes: 2048 }),
      fetchUrl(notFoundUrl, { maxBytes: 2048 }),
    ])

  const parsed = pageRes.ok ? parseHtml(pageRes.body, pageUrl) : parseHtml("")
  const robotsParsed = parseRobots(robotsRes.ok ? robotsRes.body : "")
  const checks: AuditCheck[] = []

  // ─────────────────────────────── On-page ───────────────────────────────

  const titleMeasure = measureSnippet("title", parsed.title)
  checks.push({
    id: "title",
    category: "onpage",
    label: "Title tag",
    status: titleMeasure.status,
    value: parsed.title || "(missing)",
    detail: parsed.title
      ? `${titleMeasure.chars} chars · ${titleMeasure.summary}`
      : "No <title> found",
    fixHint:
      "Google truncates by pixel width, not characters. Keep the title under 580px rendered.",
    deepLink: metadataDeep,
  })

  const descMeasure = measureSnippet("description", parsed.description)
  checks.push({
    id: "description",
    category: "onpage",
    label: "Meta description",
    status: descMeasure.status,
    value: parsed.description || "(missing)",
    detail: parsed.description
      ? `${descMeasure.chars} chars · ${descMeasure.summary}`
      : "No meta description found",
    fixHint: "Aim for a description that renders under 920px on desktop.",
    deepLink: metadataDeep,
  })

  checks.push({
    id: "h1",
    category: "onpage",
    label: "H1 heading",
    status:
      parsed.h1Count === 1 ? "pass" : parsed.h1Count === 0 ? "fail" : "warn",
    value: parsed.h1Text || String(parsed.h1Count),
    detail:
      parsed.h1Count === 1
        ? "Exactly one H1 found"
        : parsed.h1Count === 0
          ? "No H1 found"
          : `${parsed.h1Count} H1 tags found`,
    fixHint: "Use a single clear H1 that describes the page.",
  })

  // Canonical correctness, not just presence.
  let canonicalStatus: CheckStatus = "warn"
  let canonicalDetail = "No rel=canonical link"
  let canonicalValue = "(missing)"
  if (parsed.canonical) {
    canonicalValue = parsed.canonical
    try {
      const resolved = new URL(parsed.canonical, pageUrl)
      canonicalValue = resolved.href
      if (!/^https?:$/.test(resolved.protocol)) {
        canonicalStatus = "fail"
        canonicalDetail = "Canonical is not an http(s) URL"
      } else if (stripWww(resolved.hostname) !== stripWww(pageUrlObj.hostname)) {
        canonicalStatus = "warn"
        canonicalDetail = `Canonical points to another host (${resolved.hostname})`
      } else if (sameUrl(resolved.href, pageUrl)) {
        canonicalStatus = "pass"
        canonicalDetail = "Self-referencing canonical"
      } else {
        canonicalStatus = "warn"
        canonicalDetail = `Canonical points to a different URL on this host`
      }
      if (!/^https?:\/\//i.test(parsed.canonical)) {
        canonicalDetail += " · declared as a relative URL"
      }
    } catch {
      canonicalStatus = "fail"
      canonicalDetail = "Canonical is not a valid URL"
    }
  }
  checks.push({
    id: "canonical",
    category: "onpage",
    label: "Canonical URL",
    status: canonicalStatus,
    value: canonicalValue,
    detail: canonicalDetail,
    fixHint:
      "Use an absolute, self-referencing canonical on the version you want indexed.",
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
    fixHint: 'Declare <meta charset="utf-8"> early in <head>.',
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
    fixHint:
      'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
  })

  checks.push({
    id: "favicon",
    category: "onpage",
    label: "Favicon",
    status: parsed.favicon ? "pass" : "warn",
    value: parsed.favicon || "(missing)",
    detail: parsed.favicon ? "Favicon link found" : "No favicon link found",
    fixHint: 'Add a <link rel="icon"> in the document head.',
  })

  // Indexability covers both the meta tag and the X-Robots-Tag header.
  const robotsMeta = (parsed.robotsMeta || "").toLowerCase()
  const xRobotsTag = pageRes.headers.get("x-robots-tag") || ""
  const noindexMeta = robotsMeta.includes("noindex")
  const noindexHeader = /noindex/i.test(xRobotsTag)
  checks.push({
    id: "indexable",
    category: "onpage",
    label: "Indexability",
    status: noindexMeta || noindexHeader ? "fail" : "pass",
    value:
      [
        parsed.robotsMeta ? `meta: ${parsed.robotsMeta}` : null,
        xRobotsTag ? `X-Robots-Tag: ${xRobotsTag}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "index (default)",
    detail: noindexHeader
      ? "Blocked by the X-Robots-Tag response header"
      : noindexMeta
        ? "Blocked by the meta robots tag"
        : "Page is not blocked from indexing",
    fixHint: "Remove noindex from pages you want in search results.",
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
    value:
      [
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

  // Image alt coverage
  const altRatio =
    parsed.imgTotal === 0 ? 0 : parsed.imgMissingAlt / parsed.imgTotal
  checks.push({
    id: "img-alt",
    category: "onpage",
    label: "Image alt text",
    status:
      parsed.imgTotal === 0
        ? "pass"
        : parsed.imgMissingAlt === 0
          ? "pass"
          : altRatio <= 0.2
            ? "warn"
            : "fail",
    value:
      parsed.imgTotal === 0
        ? "No images"
        : `${parsed.imgTotal - parsed.imgMissingAlt}/${parsed.imgTotal} have alt`,
    detail:
      parsed.imgTotal === 0
        ? "No <img> tags on the page"
        : parsed.imgMissingAlt === 0
          ? `All ${parsed.imgTotal} images have an alt attribute${
              parsed.imgDecorative
                ? ` (${parsed.imgDecorative} marked decorative)`
                : ""
            }`
          : `${parsed.imgMissingAlt} image(s) missing an alt attribute`,
    fixHint:
      'Add alt to every <img>. Use alt="" for purely decorative images.',
  })

  // hreflang — absence is fine for single-language sites.
  const hreflangSelf = parsed.hreflang.some((h) => {
    try {
      return sameUrl(new URL(h.href, pageUrl).href, pageUrl)
    } catch {
      return false
    }
  })
  checks.push({
    id: "hreflang",
    category: "onpage",
    label: "hreflang",
    status:
      parsed.hreflang.length === 0 ? "pass" : hreflangSelf ? "pass" : "warn",
    value:
      parsed.hreflang.length === 0
        ? "Not used"
        : parsed.hreflang.map((h) => h.hreflang).join(", "),
    detail:
      parsed.hreflang.length === 0
        ? "No hreflang tags — expected for a single-language site"
        : hreflangSelf
          ? `${parsed.hreflang.length} alternates, including a self-reference`
          : `${parsed.hreflang.length} alternates but none point back to this URL`,
    fixHint:
      "Every hreflang set must include a self-referencing entry, and each alternate must link back.",
  })

  checks.push({
    id: "content-depth",
    category: "onpage",
    label: "Content depth",
    status: parsed.wordCount >= 150 ? "pass" : "warn",
    value: `${parsed.wordCount} words · ${parsed.linkInternal} internal / ${parsed.linkExternal} external links`,
    detail:
      parsed.wordCount >= 150
        ? "Enough body text for search engines to classify the page"
        : "Very little body text — may be treated as thin content",
    fixHint:
      "Give the page enough unique copy to answer the query it targets.",
  })

  if (!pageRes.ok) {
    checks.push({
      id: "page-fetch",
      category: "onpage",
      label: "Page fetch",
      status: "fail",
      value: pageRes.error || `HTTP ${pageRes.status}`,
      detail: `Could not fetch ${pageUrl}`,
      fixHint: "Confirm the URL is publicly reachable over HTTPS.",
    })
  }

  // ────────────────────────── Robots & sitemap ──────────────────────────

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

  // Is the audited page itself crawlable by Google?
  const googlebot = matchRobots(robotsParsed, "Googlebot", pageUrl)
  checks.push({
    id: "page-crawlable",
    category: "crawl",
    label: "Page allowed for Googlebot",
    status: googlebot.allowed ? "pass" : "fail",
    value: googlebot.rule
      ? `${googlebot.rule.type === "allow" ? "Allow" : "Disallow"}: ${googlebot.rule.pattern}`
      : "No matching rule",
    detail: googlebot.reason,
    fixHint:
      "Remove or narrow the Disallow rule that covers this path in robots.txt.",
    deepLink: robotsDeep,
  })

  const sitemapFromRobots = robotsRes.ok ? parseSitemapLines(robotsRes.body) : []
  checks.push({
    id: "robots-sitemap",
    category: "crawl",
    label: "Sitemap declared in robots.txt",
    status: sitemapFromRobots.length > 0 ? "pass" : "warn",
    value: sitemapFromRobots.length > 0 ? sitemapFromRobots.join(", ") : "(none)",
    detail:
      sitemapFromRobots.length > 0
        ? `${sitemapFromRobots.length} Sitemap directive(s)`
        : "No Sitemap: lines in robots.txt",
    fixHint: "Add Sitemap: https://yoursite.com/sitemap.xml to robots.txt.",
    deepLink: robotsDeep,
  })

  const originHost = originUrl.hostname
  const sitemapCandidates = [
    ...sitemapFromRobots.filter((u) => {
      try {
        return sameRegistrableHost(new URL(u).hostname, originHost)
      } catch {
        return false
      }
    }),
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
  ]
  const uniqueSitemaps = [...new Set(sitemapCandidates)]

  let sitemapUrlUsed = uniqueSitemaps[0] || `${origin}/sitemap.xml`
  let sitemapUrlCount = 0
  let sitemapTruncated = false
  let sitemapError: string | undefined
  let sitemapExpanded = false
  let sitemapHasPage = false
  let sitemapStaleNote: string | null = null

  for (const candidate of uniqueSitemaps) {
    try {
      const expanded = await expandSitemap(candidate, {
        maxDepth: 2,
        maxChildSitemaps: 20,
        maxPageUrls: 5_000,
      })
      if (expanded.urls.length > 0) {
        sitemapUrlUsed = candidate
        sitemapUrlCount = expanded.urls.length
        sitemapTruncated = expanded.truncated
        sitemapExpanded = true
        sitemapHasPage = expanded.urls.some((u) => sameUrl(u, pageUrl))
        if (expanded.validation.allSameLastmod) {
          sitemapStaleNote = expanded.validation.allSameLastmod
        }
        break
      }
      if (!sitemapExpanded && expanded.rootKind !== "unknown") {
        sitemapUrlUsed = candidate
        sitemapUrlCount = 0
        sitemapTruncated = expanded.truncated
        sitemapExpanded = true
        if (expanded.childSitemapsFailed.length) {
          sitemapError = expanded.childSitemapsFailed[0]?.reason
        }
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
    status: !sitemapExpanded ? "fail" : sitemapUrlCount === 0 ? "warn" : "pass",
    value: sitemapExpanded
      ? `${sitemapUrlCount} URLs${sitemapTruncated ? " (truncated)" : ""}`
      : sitemapError || "Not found",
    detail: sitemapExpanded
      ? `Expanded ${sitemapUrlUsed}${
          sitemapStaleNote
            ? ` · every lastmod is ${sitemapStaleNote}, so crawlers cannot tell what changed`
            : ""
        }`
      : "Could not expand a sitemap for this origin",
    fixHint: "Publish a valid XML sitemap and reference it in robots.txt.",
    deepLink: sitemapDeep,
  })

  // Only meaningful once we actually have a URL list to look in.
  if (sitemapUrlCount > 0 && !sitemapTruncated) {
    checks.push({
      id: "sitemap-includes-page",
      category: "crawl",
      label: "Page listed in sitemap",
      status: sitemapHasPage ? "pass" : "warn",
      value: sitemapHasPage ? "Listed" : "Not found in sitemap",
      detail: sitemapHasPage
        ? "The audited URL appears in the XML sitemap"
        : "The audited URL is not in the sitemap, so discovery relies on internal links",
      fixHint: "Include every indexable URL in your XML sitemap.",
      deepLink: sitemapDeep,
    })
  }

  // HTTP → HTTPS
  const httpEndsHttps = httpProbe.finalUrl.startsWith("https:")
  checks.push({
    id: "http-https",
    category: "crawl",
    label: "HTTP redirects to HTTPS",
    status: !httpProbe.ok && !httpEndsHttps ? "warn" : httpEndsHttps ? "pass" : "fail",
    value: httpProbe.finalUrl || httpProbeUrl,
    detail: httpEndsHttps
      ? `http://${originUrl.hostname}/ redirects to HTTPS`
      : httpProbe.ok
        ? "The HTTP version serves content without redirecting to HTTPS"
        : `Could not reach ${httpProbeUrl}`,
    fixHint: "Send a 301 from every http:// URL to its https:// equivalent.",
  })

  // www vs non-www
  let wwwStatus: CheckStatus = "pass"
  let wwwDetail: string
  if (!altProbe.ok) {
    wwwDetail = `${altHost} does not serve content, so there is no duplicate host`
  } else {
    let finalHost = altHost
    try {
      finalHost = new URL(altProbe.finalUrl).hostname
    } catch {
      // keep altHost
    }
    if (stripWww(finalHost) === stripWww(originUrl.hostname) && finalHost !== altHost) {
      wwwDetail = `${altHost} redirects to ${finalHost}`
    } else if (finalHost === altHost) {
      wwwStatus = "fail"
      wwwDetail = `Both ${originUrl.hostname} and ${altHost} serve content — duplicate URLs`
    } else {
      wwwDetail = `${altHost} redirects to ${finalHost}`
    }
  }
  checks.push({
    id: "www-canonical",
    category: "crawl",
    label: "www / non-www canonicalization",
    status: wwwStatus,
    value: altProbe.ok ? altProbe.finalUrl : `${altHost} unreachable`,
    detail: wwwDetail,
    fixHint:
      "Pick one hostname and 301 the other to it, so search engines see one site.",
  })

  // Redirect chain
  const hops = pageRes.redirects.length
  checks.push({
    id: "redirect-chain",
    category: "crawl",
    label: "Redirect chain",
    status: hops <= 1 ? "pass" : hops === 2 ? "warn" : "fail",
    value:
      hops === 0
        ? "Served directly"
        : pageRes.redirects
            .map((r) => `${r.status} → ${r.to}`)
            .join("  ·  "),
    detail:
      hops === 0
        ? "The URL responded without redirecting"
        : `${hops} redirect${hops === 1 ? "" : "s"} before the final response`,
    fixHint:
      "Collapse chains so every URL reaches its destination in one hop.",
  })

  // Soft 404
  const probeStatus = notFoundProbe.status
  checks.push({
    id: "soft-404",
    category: "crawl",
    label: "Missing pages return 404",
    status:
      probeStatus === 404 || probeStatus === 410
        ? "pass"
        : probeStatus === 200
          ? "fail"
          : "warn",
    value: probeStatus ? `HTTP ${probeStatus}` : notFoundProbe.error || "No response",
    detail:
      probeStatus === 404 || probeStatus === 410
        ? "A nonexistent URL correctly returns a not-found status"
        : probeStatus === 200
          ? "A nonexistent URL returns 200 — a soft 404 that wastes crawl budget"
          : `A nonexistent URL returned ${probeStatus || "no response"}`,
    fixHint: "Return a real 404 or 410 status for URLs that do not exist.",
  })

  // ─────────────────────────── Trust & security ───────────────────────────

  const finalIsHttps = pageRes.finalUrl.startsWith("https:")
  checks.push({
    id: "https",
    category: "trust",
    label: "HTTPS",
    status: finalIsHttps ? "pass" : "fail",
    value: pageRes.finalUrl || pageUrl,
    detail: finalIsHttps ? "Final URL uses HTTPS" : "Page did not resolve to HTTPS",
    fixHint: "Serve the site over HTTPS and redirect HTTP to HTTPS.",
  })

  checks.push({
    id: "mixed-content",
    category: "trust",
    label: "Mixed content",
    status:
      !finalIsHttps || parsed.insecureResources.length === 0 ? "pass" : "fail",
    value:
      parsed.insecureResources.length === 0
        ? "None found"
        : parsed.insecureResources.slice(0, 3).join(", "),
    detail:
      parsed.insecureResources.length === 0
        ? "No subresources are loaded over plain http://"
        : `${parsed.insecureResources.length} subresource(s) load over http:// on an HTTPS page`,
    fixHint: "Serve every script, style, image and iframe over HTTPS.",
  })

  const hsts = pageRes.headers.get("strict-transport-security")
  checks.push({
    id: "hsts",
    category: "trust",
    label: "HSTS header",
    status: hsts ? "pass" : "warn",
    value: hsts || "(missing)",
    detail: hsts ? "Strict-Transport-Security present" : "No HSTS response header",
    fixHint: "Enable HSTS on your HTTPS responses.",
  })

  const csp = pageRes.headers.get("content-security-policy")
  checks.push({
    id: "csp",
    category: "trust",
    label: "Content-Security-Policy",
    status: csp ? "pass" : "warn",
    value: csp ? "Present" : "(missing)",
    detail: csp ? "CSP header present" : "No CSP header",
    fixHint: "Add a Content-Security-Policy suited to your app.",
  })

  const xfo = pageRes.headers.get("x-frame-options")
  checks.push({
    id: "xfo",
    category: "trust",
    label: "Frame protection",
    status: xfo || csp?.toLowerCase().includes("frame-ancestors") ? "pass" : "warn",
    value:
      xfo ||
      (csp?.includes("frame-ancestors") ? "CSP frame-ancestors" : "(missing)"),
    detail: "X-Frame-Options or CSP frame-ancestors",
    fixHint: "Set X-Frame-Options or CSP frame-ancestors.",
  })

  const xcto = pageRes.headers.get("x-content-type-options")
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

  const referrerPolicy = pageRes.headers.get("referrer-policy")
  checks.push({
    id: "referrer-policy",
    category: "trust",
    label: "Referrer-Policy",
    status: referrerPolicy ? "pass" : "warn",
    value: referrerPolicy || "(missing)",
    detail: referrerPolicy
      ? "Referrer-Policy header present"
      : "No Referrer-Policy header",
    fixHint:
      "Send Referrer-Policy: strict-origin-when-cross-origin to limit referrer leakage.",
  })

  const cacheControl = pageRes.headers.get("cache-control")
  checks.push({
    id: "cache-control",
    category: "trust",
    label: "Cache-Control",
    status: cacheControl ? "pass" : "warn",
    value: cacheControl || "(missing)",
    detail: cacheControl
      ? "Cache-Control header present"
      : "No Cache-Control header, so caching is left to heuristics",
    fixHint: "Send an explicit Cache-Control for HTML and static assets.",
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

  // ───────────────────────── AI & answer engines ─────────────────────────

  const blockedCitation = CITATION_CRAWLERS.filter(
    (c) => !matchRobots(robotsParsed, c.name, pageUrl).allowed
  )
  checks.push({
    id: "ai-search-crawlers",
    category: "ai",
    label: "AI search crawlers allowed",
    status: blockedCitation.length === 0 ? "pass" : "fail",
    value:
      blockedCitation.length === 0
        ? CITATION_CRAWLERS.map((c) => c.name).join(", ")
        : `Blocked: ${blockedCitation.map((c) => c.name).join(", ")}`,
    detail:
      blockedCitation.length === 0
        ? "ChatGPT, Claude and Perplexity search crawlers can reach this page"
        : `${blockedCitation.length} answer-engine crawler(s) are blocked, so this page cannot be cited`,
    fixHint:
      "These are search crawlers, not training crawlers — blocking them removes you from AI answers and the traffic they send.",
    deepLink: robotsDeep,
  })

  const assistants = AI_CRAWLERS.filter((c) => c.purpose === "assistant")
  const blockedAssistants = assistants.filter(
    (c) => !matchRobots(robotsParsed, c.name, pageUrl).allowed
  )
  checks.push({
    id: "ai-assistant-fetchers",
    category: "ai",
    label: "AI assistant fetchers allowed",
    status: blockedAssistants.length === 0 ? "pass" : "warn",
    value:
      blockedAssistants.length === 0
        ? "All allowed"
        : `Blocked: ${blockedAssistants.map((c) => c.name).join(", ")}`,
    detail:
      blockedAssistants.length === 0
        ? "Assistants can fetch this page when a user pastes or asks about the link"
        : "Some assistants cannot fetch this page on a user's behalf",
    fixHint:
      "Allow user-triggered fetchers so link previews and direct lookups work.",
    deepLink: robotsDeep,
  })

  const trainingBlocked = AI_CRAWLERS.filter(
    (c) => c.purpose === "training"
  ).filter((c) => !matchRobots(robotsParsed, c.name, pageUrl).allowed)
  checks.push({
    id: "llms-txt",
    category: "ai",
    label: "llms.txt",
    status: llmsRes.ok ? "pass" : "warn",
    value: llmsRes.ok ? `${llmsUrl} (${llmsRes.status})` : "(not found)",
    detail: llmsRes.ok
      ? "llms.txt is published, pointing AI engines at your key content"
      : `No llms.txt at the site root · ${trainingBlocked.length}/${
          AI_CRAWLERS.filter((c) => c.purpose === "training").length
        } training crawlers currently blocked`,
    fixHint:
      "Publish /llms.txt listing your most important pages. robots.txt grants access; llms.txt guides what to read.",
  })

  // ─────────────────────────────── Assemble ───────────────────────────────

  const byCat = {
    onpage: checks.filter((c) => c.category === "onpage"),
    crawl: checks.filter((c) => c.category === "crawl"),
    trust: checks.filter((c) => c.category === "trust"),
    ai: checks.filter((c) => c.category === "ai"),
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
    pageUrl,
    isHomepage,
    finalUrl: pageRes.finalUrl || pageUrl,
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
