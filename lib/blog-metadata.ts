export type BlogPostMeta = {
  title: string
  description: string
  date: string
  category: string
  readTime: string
  coverImage: string
  relatedTool: { href: string; label: string }
  relatedLanding: { href: string; label: string }
}

export const blogMetadata = {
  "free-website-seo-audit": {
    title: "How to Run a Free Website SEO Audit",
    description:
      "Learn what a free technical SEO audit should check — robots.txt, XML sitemaps, meta tags, security headers, and Ahrefs Domain Rating — plus how to prioritize and fix issues fast.",
    date: "2026-07-15",
    category: "Site Audit",
    readTime: "7 min read",
    coverImage: "/blog/audit.svg",
    relatedTool: { href: "/audit?q=https://shrix1.com", label: "Run free audit" },
    relatedLanding: { href: "/site-audit", label: "Website SEO Audit" },
  },
  "what-is-domain-rating": {
    title: "What Is Domain Rating? (And How to Check It Free)",
    description:
      "Domain Rating (DR) explained in plain language: what the Ahrefs score measures, why it matters for SEO, and how to look up DR for any domain free without a paid subscription.",
    date: "2026-07-15",
    category: "Domain Rating",
    readTime: "6 min read",
    coverImage: "/blog/domain-rating.svg",
    relatedTool: {
      href: "/domain-rating?q=https://shrix1.com",
      label: "Check Domain Rating",
    },
    relatedLanding: {
      href: "/domain-rating-checker",
      label: "Domain Rating Checker",
    },
  },
  "how-to-check-xml-sitemap": {
    title: "How to Check an XML Sitemap (Including Indexes)",
    description:
      "Learn how to validate sitemap.xml and sitemap indexes, expand nested child sitemaps, spot missing URLs, and copy every page URL with a free XML sitemap checker.",
    date: "2026-07-15",
    category: "Sitemap",
    readTime: "6 min read",
    coverImage: "/blog/sitemap.svg",
    relatedTool: {
      href: "/sitemap?q=https://shrix1.com/sitemap.xml",
      label: "Check sitemap",
    },
    relatedLanding: { href: "/sitemap-checker", label: "XML Sitemap Checker" },
  },
  "how-to-check-meta-tags": {
    title: "How to Check Meta Tags and Social Previews",
    description:
      "Learn how to check title tags, meta descriptions, and Open Graph social previews before you publish so Google and social snippets look right — with a free meta tags checker.",
    date: "2026-07-15",
    category: "Metadata",
    readTime: "5 min read",
    coverImage: "/blog/metadata.svg",
    relatedTool: {
      href: "/metadata?q=https://shrix1.com",
      label: "Check meta tags",
    },
    relatedLanding: { href: "/meta-tags-checker", label: "Meta Tags Checker" },
  },
  "how-to-check-robots-txt": {
    title: "How to Check robots.txt (Without Breaking Crawl Access)",
    description:
      "Learn where robots.txt lives, how to read User-agent, Allow, and Disallow rules, and how to confirm Sitemap directives — without accidentally blocking crawl access.",
    date: "2026-07-15",
    category: "Robots",
    readTime: "5 min read",
    coverImage: "/blog/robots.svg",
    relatedTool: {
      href: "/robots?q=https://shrix1.com/robots.txt",
      label: "Check robots.txt",
    },
    relatedLanding: { href: "/robots-txt-checker", label: "Robots.txt Checker" },
  },
} as const satisfies Record<string, BlogPostMeta>

export type BlogSlug = keyof typeof blogMetadata

export const blogSlugs = Object.keys(blogMetadata) as BlogSlug[]

export function getBlogPosts() {
  return blogSlugs
    .map((slug) => ({ slug, ...blogMetadata[slug] }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}
