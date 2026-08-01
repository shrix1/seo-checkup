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
      "What a free technical SEO audit should check — robots.txt, XML sitemaps, meta tags and security headers — and how to prioritise the fixes.",
    date: "2026-07-15",
    category: "Site Audit",
    readTime: "7 min read",
    coverImage: "/blog/audit.svg",
    relatedTool: { href: "/audit?q=https://shrix1.com", label: "Run free audit" },
    relatedLanding: { href: "/site-audit", label: "Website SEO Audit" },
  },
  "what-is-domain-rating": {
    title: "What Is Domain Rating (DR)?",
    description:
      "Domain Rating explained plainly: what the Ahrefs score measures, why it matters, and how to look it up for any domain free.",
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
    title: "How to Check an XML Sitemap",
    description:
      "Validate sitemap.xml and sitemap indexes, expand nested child sitemaps, spot missing URLs and copy every page URL for free.",
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
    title: "How to Check Meta Tags & Previews",
    description:
      "Check title tags, meta descriptions and Open Graph previews before you publish, so search and social snippets both look right.",
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
    title: "How to Check robots.txt Safely",
    description:
      "Read and test robots.txt properly: group matching, longest-match precedence, Allow beating Disallow, and the AI crawler rules that cost citations.",
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
  "core-web-vitals-explained": {
    title: "Core Web Vitals: Field vs Lab Data",
    description:
      "LCP, INP and CLS explained, and why your speed tool's number may not be the one Google ranks on. Field and lab data can disagree by 50x.",
    date: "2026-07-29",
    category: "Performance",
    readTime: "6 min read",
    coverImage: "/blog/core-web-vitals.svg",
    relatedTool: {
      href: "/core-web-vitals?q=shrix1.com",
      label: "Check Core Web Vitals",
    },
    relatedLanding: {
      href: "/core-web-vitals-checker",
      label: "Core Web Vitals Checker",
    },
  },
} as const satisfies Record<string, BlogPostMeta>

export type BlogSlug = keyof typeof blogMetadata

export const blogSlugs = Object.keys(blogMetadata) as BlogSlug[]

export function getBlogPosts() {
  return blogSlugs
    .map((slug) => ({ slug, ...blogMetadata[slug] }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}
