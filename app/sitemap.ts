import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://seocheckup.vercel.app"
  const pages = ["/", "/sitemap", "/metadata", "/robots"] as const

  return pages.map((page) => ({
    url: new URL(page, baseUrl).toString(),
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: page === "/" ? 1 : 0.8,
  }))
}
