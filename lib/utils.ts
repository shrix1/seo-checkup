import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { SITE_URL } from "@/lib/site"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * People paste bare domains. Default them to https rather than rejecting the
 * input. Lives here (not fetch-url) so client components can use it without
 * pulling node:dns into the browser bundle.
 */
export function ensureHttpScheme(input: string): string {
  const raw = input.trim()
  if (!raw) return raw
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
}

/** Strip the scheme for display, so inputs and examples read as bare domains. */
export function stripScheme(input: string): string {
  return input.trim().replace(/^https?:\/\//i, "")
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
    "Free site audit for any website — check sitemap, meta tags, robots.txt, and Domain Rating in one go.",
  canonical = "/",
  ogImage = "/og-light.png",
}: {
  title?: string
  description?: string
  canonical: string
  ogImage?: string
}) {
  const path = canonical.startsWith("/") ? canonical : `/${canonical}`

  return {
    metadataBase: new URL(SITE_URL),
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
      url: path,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    icons: {
      icon: "/icon.png",
    },
    alternates: {
      canonical: path,
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
      images: [ogImage],
    },
  }
}
