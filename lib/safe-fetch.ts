import { assertPublicHttpUrl } from "@/lib/safe-url"

const FETCH_TIMEOUT_MS = 15_000
const MAX_BODY_BYTES = 2_000_000
const MAX_REDIRECTS = 5

export type SafeFetchResult = {
  ok: boolean
  status: number
  finalUrl: string
  headers: Headers
  body: Buffer
  error?: string
}

async function readBodyLimited(
  res: Response,
  maxBytes: number
): Promise<Buffer> {
  if (!res.body) return Buffer.alloc(0)

  const reader = res.body.getReader()
  const chunks: Buffer[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue

    const nextTotal = total + value.byteLength
    if (nextTotal > maxBytes) {
      const allowed = maxBytes - total
      if (allowed > 0) chunks.push(Buffer.from(value.subarray(0, allowed)))
      await reader.cancel().catch(() => undefined)
      break
    }

    chunks.push(Buffer.from(value))
    total = nextTotal
  }

  return chunks.length ? Buffer.concat(chunks) : Buffer.alloc(0)
}

export async function safeFetch(
  input: string,
  init?: {
    headers?: HeadersInit
    timeoutMs?: number
    maxBytes?: number
  }
): Promise<SafeFetchResult> {
  const timeoutMs = init?.timeoutMs ?? FETCH_TIMEOUT_MS
  const maxBytes = init?.maxBytes ?? MAX_BODY_BYTES
  let current = input

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const url = await assertPublicHttpUrl(current)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)

      let res: Response
      try {
        res = await fetch(url.href, {
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "User-Agent": "SeoCheckupBot/1.0 (+https://seocheckup.vercel.app)",
            Accept: "*/*",
            ...(init?.headers || {}),
          },
        })
      } finally {
        clearTimeout(timer)
      }

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location")
        if (!location) {
          return {
            ok: false,
            status: res.status,
            finalUrl: url.href,
            headers: res.headers,
            body: Buffer.alloc(0),
            error: "Redirect missing Location",
          }
        }
        current = new URL(location, url).href
        if (hop === MAX_REDIRECTS) {
          return {
            ok: false,
            status: res.status,
            finalUrl: current,
            headers: res.headers,
            body: Buffer.alloc(0),
            error: "Too many redirects",
          }
        }
        continue
      }

      const body = await readBodyLimited(res, maxBytes)
      return {
        ok: res.ok,
        status: res.status,
        finalUrl: url.href,
        headers: res.headers,
        body,
        error: res.ok ? undefined : `HTTP ${res.status}`,
      }
    }

    return {
      ok: false,
      status: 0,
      finalUrl: current,
      headers: new Headers(),
      body: Buffer.alloc(0),
      error: "Too many redirects",
    }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      finalUrl: current,
      headers: new Headers(),
      body: Buffer.alloc(0),
      error: err instanceof Error ? err.message : "Fetch failed",
    }
  }
}
