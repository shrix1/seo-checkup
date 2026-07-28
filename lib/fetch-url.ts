import { safeFetch } from "@/lib/safe-fetch"

export type FetchUrlResult = {
  ok: boolean
  status: number
  finalUrl: string
  headers: Headers
  body: string
  redirects: { from: string; status: number; to: string }[]
  error?: string
}

export async function fetchUrl(
  url: string,
  init?: { maxBytes?: number }
): Promise<FetchUrlResult> {
  const res = await safeFetch(url, init)
  return {
    ok: res.ok,
    status: res.status,
    finalUrl: res.finalUrl,
    headers: res.headers,
    body: res.body.toString("utf8"),
    redirects: res.redirects,
    error: res.error,
  }
}

export function normalizeOrigin(input: string): URL {
  let raw = input.trim()
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`
  }
  const url = new URL(raw)
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed")
  }
  return new URL(`${url.protocol}//${url.host}`)
}

/**
 * Keep the path the user actually pasted so deep URLs get audited as pages.
 * Previously every input collapsed to the origin, which silently audited the
 * homepage when someone pasted an article URL.
 */
export function normalizePageUrl(input: string): URL {
  let raw = input.trim()
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`
  }
  const url = new URL(raw)
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed")
  }
  url.hash = ""
  if (!url.pathname) url.pathname = "/"
  return url
}

export function hostnameFromInput(input: string): string {
  const origin = normalizeOrigin(input)
  return origin.hostname.replace(/^www\./i, "")
}

/** Toggle the www prefix so canonicalization can be probed both ways. */
export function toggleWww(hostname: string): string {
  return /^www\./i.test(hostname)
    ? hostname.replace(/^www\./i, "")
    : `www.${hostname}`
}
