import { MetadataRoute } from "next"
import { blogSlugs } from "@/lib/blog-metadata"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://seocheckup.vercel.app"
  const pages: { path: string; priority: number }[] = [
    { path: "/", priority: 1 },
    { path: "/site-audit", priority: 0.95 },
    { path: "/domain-rating-checker", priority: 0.9 },
    { path: "/sitemap-checker", priority: 0.9 },
    { path: "/meta-tags-checker", priority: 0.9 },
    { path: "/robots-txt-checker", priority: 0.9 },
    { path: "/audit", priority: 0.85 },
    { path: "/domain-rating", priority: 0.85 },
    { path: "/sitemap", priority: 0.8 },
    { path: "/metadata", priority: 0.8 },
    { path: "/robots", priority: 0.8 },
    { path: "/blog", priority: 0.75 },
    ...blogSlugs.map((slug) => ({
      path: `/blog/${slug}`,
      priority: 0.7,
    })),
  ]

  return pages.map(({ path, priority }) => ({
    url: new URL(path, baseUrl).toString(),
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority,
  }))
}
