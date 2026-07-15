import { safeFetch } from "@/lib/safe-fetch"

export type FetchUrlResult = {
  ok: boolean
  status: number
  finalUrl: string
  headers: Headers
  body: string
  error?: string
}

export async function fetchUrl(url: string): Promise<FetchUrlResult> {
  const res = await safeFetch(url)
  return {
    ok: res.ok,
    status: res.status,
    finalUrl: res.finalUrl,
    headers: res.headers,
    body: res.body.toString("utf8"),
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

export function hostnameFromInput(input: string): string {
  const origin = normalizeOrigin(input)
  return origin.hostname.replace(/^www\./i, "")
}
