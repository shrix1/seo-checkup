import { NextResponse } from "next/server"
import { getClientIp } from "@/lib/client-ip"
import { ensureHttpScheme } from "@/lib/fetch-url"
import { fetchPageSpeed, type PageSpeedStrategy } from "@/lib/pagespeed"
import getRatelimit from "@/lib/rate-limit"
import { assertPublicHttpUrl } from "@/lib/safe-url"

/** PSI itself routinely takes 15-30s, so the route needs room above that. */
export const maxDuration = 90

const rateLimit = getRatelimit(15, "24 h")

export async function GET(req: Request) {
  const ip = getClientIp(req)
  const { success, limit, reset, remaining } = await rateLimit.limit(
    `pagespeed:${ip}`
  )

  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", limit, reset, remaining },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Reset": String(reset),
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    )
  }

  const search = new URL(req.url).searchParams
  const q = search.get("q")
  if (!q) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 })
  }

  const strategy: PageSpeedStrategy =
    search.get("strategy") === "desktop" ? "desktop" : "mobile"

  let url: string
  try {
    url = ensureHttpScheme(decodeURIComponent(q))
  } catch {
    return NextResponse.json({ error: "Invalid q parameter" }, { status: 400 })
  }

  try {
    await assertPublicHttpUrl(url)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid URL" },
      { status: 400 }
    )
  }

  const result = await fetchPageSpeed(url, strategy)

  if (!result.ok) {
    // An unset API key is a deployment gap, not a caller error — 501 keeps it
    // distinguishable from "PSI failed" so the client can stay quiet about it.
    return NextResponse.json(
      { error: result.message, reason: result.reason },
      { status: result.reason === "unconfigured" ? 501 : 502 }
    )
  }

  return NextResponse.json(result)
}
