const FETCH_TIMEOUT_MS = 15_000
const MAX_BODY_BYTES = 2_000_000

export type FetchUrlResult = {
  ok: boolean
  status: number
  finalUrl: string
  headers: Headers
  body: string
  error?: string
}

export async function fetchUrl(url: string): Promise<FetchUrlResult> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent": "SeoCheckupBot/1.0 (+https://seocheckup.vercel.app)",
        Accept: "*/*",
      },
    })

    const text = await res.text()
    const body =
      text.length > MAX_BODY_BYTES ? text.slice(0, MAX_BODY_BYTES) : text

    return {
      ok: res.ok,
      status: res.status,
      finalUrl: res.url || url,
      headers: res.headers,
      body,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      finalUrl: url,
      headers: new Headers(),
      body: "",
      error: err instanceof Error ? err.message : "Fetch failed",
    }
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
