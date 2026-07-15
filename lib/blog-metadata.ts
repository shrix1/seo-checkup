export type BlogPostMeta = {
  title: string
  description: string
  date: string
  category: string
  readTime: string
  coverImage: string
  relatedTool: { href: string; label: string }
}

export const blogMetadata = {
  "free-website-seo-audit": {
    title: "How to Run a Free Website SEO Audit",
    description:
      "Learn what a free technical SEO audit should check — robots, sitemaps, meta tags, headers, and Domain Rating — and how to fix issues fast.",
    date: "2026-07-15",
    category: "Site Audit",
    readTime: "7 min read",
    coverImage: "/blog/audit.svg",
    relatedTool: { href: "/audit?q=https://shrix1.com", label: "Run free audit" },
  },
  "what-is-domain-rating": {
    title: "What Is Domain Rating? (And How to Check It Free)",
    description:
      "Domain Rating explained in plain language, plus how to look up Ahrefs DR for any domain without a paid subscription.",
    date: "2026-07-15",
    category: "Domain Rating",
    readTime: "6 min read",
    coverImage: "/blog/domain-rating.svg",
    relatedTool: {
      href: "/domain-rating?q=https://shrix1.com",
      label: "Check Domain Rating",
    },
  },
  "how-to-check-xml-sitemap": {
    title: "How to Check an XML Sitemap (Including Indexes)",
    description:
      "Validate sitemap.xml and sitemap indexes, expand child sitemaps, and copy every page URL with a free checker.",
    date: "2026-07-15",
    category: "Sitemap",
    readTime: "6 min read",
    coverImage: "/blog/sitemap.svg",
    relatedTool: {
      href: "/sitemap?q=https://shrix1.com/sitemap.xml",
      label: "Check sitemap",
    },
  },
  "how-to-check-meta-tags": {
    title: "How to Check Meta Tags and Social Previews",
    description:
      "Preview title, description, and Open Graph tags before you publish so search and social snippets look right.",
    date: "2026-07-15",
    category: "Metadata",
    readTime: "5 min read",
    coverImage: "/blog/metadata.svg",
    relatedTool: {
      href: "/metadata?q=https://shrix1.com",
      label: "Check meta tags",
    },
  },
  "how-to-check-robots-txt": {
    title: "How to Check robots.txt (Without Breaking Crawl Access)",
    description:
      "Find robots.txt, read User-agent and Disallow rules, and confirm Sitemap directives with a free viewer.",
    date: "2026-07-15",
    category: "Robots",
    readTime: "5 min read",
    coverImage: "/blog/robots.svg",
    relatedTool: {
      href: "/robots?q=https://shrix1.com/robots.txt",
      label: "Check robots.txt",
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
