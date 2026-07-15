import { blogMetadata, blogSlugs } from "@/lib/blog-metadata"
import { SITE_URL, features } from "@/lib/site"
import { MetadataRoute } from "next"

const STABLE_DATE = new Date("2026-07-15")

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: { path: string; priority: number }[] = [
    { path: "/", priority: 1 },
    { path: features.audit.landingPath, priority: 0.95 },
    { path: features.domainRating.landingPath, priority: 0.9 },
    { path: features.sitemap.landingPath, priority: 0.9 },
    { path: features.metadata.landingPath, priority: 0.9 },
    { path: features.robots.landingPath, priority: 0.9 },
    { path: features.audit.toolPath, priority: 0.85 },
    { path: features.domainRating.toolPath, priority: 0.85 },
    { path: features.sitemap.toolPath, priority: 0.8 },
    { path: features.metadata.toolPath, priority: 0.8 },
    { path: features.robots.toolPath, priority: 0.8 },
    { path: "/blog", priority: 0.75 },
  ]

  return [
    ...staticPages.map(({ path, priority }) => ({
      url: new URL(path, SITE_URL).toString(),
      lastModified: STABLE_DATE,
      changeFrequency: "monthly" as const,
      priority,
    })),
    ...blogSlugs.map((slug) => ({
      url: new URL(`/blog/${slug}`, SITE_URL).toString(),
      lastModified: new Date(blogMetadata[slug].date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ]
}
