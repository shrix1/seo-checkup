import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function compareUrls(url1: string, url2: string) {
  const path1 = url1.split("/").length
  const path2 = url2.split("/").length

  if (path1 !== path2) {
    return path1 - path2
  }

  return url1.localeCompare(url2)
}

export function removeCommonPrefix(url: string, baseUrl: string): string {
  const commonPrefix = baseUrl
  if (url.startsWith(commonPrefix)) {
    return url.slice(commonPrefix.length)
  }
  return url
}

export function getSitemapBaseUrl(sitemapUrl: string): string {
  const url = new URL(sitemapUrl)
  return `${url.protocol}//${url.hostname}`
}

export function constructMetadata({
  title = "SeoCheckup — Free Site Audit & SEO Tools",
  description =
    "Free website SEO audit, Domain Rating checker, XML sitemap expander, meta tags preview, and robots.txt viewer.",
  canonical = "/",
  ogImage = "/og-light.png",
}: {
  title?: string
  description?: string
  canonical: string
  ogImage?: string
}) {
  return {
    metadataBase: new URL("https://seocheckup.vercel.app"),
    title,
    description,
    keywords: [
      "seo audit",
      "site audit",
      "domain rating",
      "domain rating checker",
      "sitemap checker",
      "xml sitemap",
      "meta tags checker",
      "robots.txt checker",
      "seo checkup",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "OG Image",
        },
      ],
    },
    icons: {
      icon: "/icon.png",
    },
    alternates: {
      canonical,
    },
    authors: [
      {
        name: "Shriprasanna",
        url: "https://github.com/shrix1",
      },
    ],
    creator: "Shriprasanna",
    twitter: {
      title,
      description,
      creator: "@shribuilds",
      site: "shri",
      card: "summary_large_image",
    },
  }
}
