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
  title = "Seo Checkup By Shri",
  description = "Check your websites Sitemap and MetaData here",
  canonical = "/",
  ogImage = "/og-light.png",
}: {
  title?: string
  description?: string
  canonical: string
  ogImage?: string
}) {
  return {
    metadataBase: new URL("https://maybeusefull.vercel.app"),
    title,
    description,
    keywords: [
      "sitemap",
      "metadata",
      "sitemap checker",
      "metatag checker",
      "sitemap generator",
      "metatag generator",
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
      creator: "@shriprasanna007",
      site: "shri",
      card: "summary_large_image",
    },
  }
}
