import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://seocheckup.vercel.app"
  const pages: { path: string; priority: number }[] = [
    { path: "/", priority: 1 },
    { path: "/sitemap-checker", priority: 0.9 },
    { path: "/meta-tags-checker", priority: 0.9 },
    { path: "/robots-txt-checker", priority: 0.9 },
    { path: "/sitemap", priority: 0.8 },
    { path: "/metadata", priority: 0.8 },
    { path: "/robots", priority: 0.8 },
  ]

  return pages.map(({ path, priority }) => ({
    url: new URL(path, baseUrl).toString(),
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority,
  }))
}
