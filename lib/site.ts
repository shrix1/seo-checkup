export const SITE_URL = "https://seocheckup.vercel.app"

export type FeatureKey =
  | "audit"
  | "domainRating"
  | "sitemap"
  | "metadata"
  | "robots"

export type FeatureRoutes = {
  toolPath: string
  landingPath: string
  blogSlug: string
  toolLabel: string
  landingLabel: string
  blogLabel: string
  appName: string
  description: string
}

/** Canonical tool ↔ PSEO landing ↔ blog guide graph */
export const features: Record<FeatureKey, FeatureRoutes> = {
  audit: {
    toolPath: "/audit",
    landingPath: "/site-audit",
    blogSlug: "free-website-seo-audit",
    toolLabel: "Site Audit",
    landingLabel: "Website SEO Audit",
    blogLabel: "How to run a free SEO audit",
    appName: "Website SEO Audit",
    description:
      "Run a free technical SEO audit on any URL: on-page title and meta, robots.txt, XML sitemaps, security headers, and Ahrefs Domain Rating — unlocked results, no account.",
  },
  domainRating: {
    toolPath: "/domain-rating",
    landingPath: "/domain-rating-checker",
    blogSlug: "what-is-domain-rating",
    toolLabel: "Domain Rating",
    landingLabel: "Domain Rating Checker",
    blogLabel: "What is Domain Rating?",
    appName: "Domain Rating Checker",
    description:
      "Look up Ahrefs Domain Rating (DR) for any domain free. Instant backlink-authority score from Ahrefs’ public endpoint, with required Domain Rating by Ahrefs attribution.",
  },
  sitemap: {
    toolPath: "/sitemap",
    landingPath: "/sitemap-checker",
    blogSlug: "how-to-check-xml-sitemap",
    toolLabel: "Sitemap Checker",
    landingLabel: "XML Sitemap Checker",
    blogLabel: "How to check an XML sitemap",
    appName: "XML Sitemap Checker",
    description:
      "Paste a sitemap.xml or sitemap index URL to expand child sitemaps, list every page URL, filter by source, and copy the full URL list — free XML sitemap checker.",
  },
  metadata: {
    toolPath: "/metadata",
    landingPath: "/meta-tags-checker",
    blogSlug: "how-to-check-meta-tags",
    toolLabel: "Meta Tags Checker",
    landingLabel: "Meta Tags Checker",
    blogLabel: "How to check meta tags",
    appName: "Meta Tags Checker",
    description:
      "Preview a page’s title, meta description, and Open Graph tags before you publish. Free meta tags checker for search snippets and social share cards.",
  },
  robots: {
    toolPath: "/robots",
    landingPath: "/robots-txt-checker",
    blogSlug: "how-to-check-robots-txt",
    toolLabel: "Robots.txt Viewer",
    landingLabel: "Robots.txt Checker",
    blogLabel: "How to check robots.txt",
    appName: "Robots.txt Checker",
    description:
      "Fetch any public robots.txt and highlight User-agent, Allow, Disallow, and Sitemap directives so you can confirm crawl access without guessing.",
  },
}

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${SITE_URL}${normalized === "/" ? "" : normalized}` || SITE_URL
}

export function blogPath(slug: string) {
  return `/blog/${slug}`
}
