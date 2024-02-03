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
