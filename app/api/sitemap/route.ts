import { NextResponse } from "next/server"
import { postDiscordLogs } from "@/lib/discord-webhook"
import { getClientIp } from "@/lib/client-ip"
import getRatelimit from "@/lib/rate-limit"
import { expandSitemap } from "@/lib/sitemap-expand"
import { assertPublicHttpUrl } from "@/lib/safe-url"

const rateLimit = getRatelimit(20, "24 h")

export async function GET(req: Request) {
  const ip = getClientIp(req)
  const { success, limit, reset, remaining } = await rateLimit.limit(
    `sitemap:${ip}`
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

  const q = new URL(req.url).searchParams.get("q")
  if (!q) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 })
  }

  let url: string
  try {
    url = decodeURIComponent(q)
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

  try {
    const result = await expandSitemap(url)
    void postDiscordLogs(url, "SITEMAP")
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error expanding sitemap:", error)
    const message =
      error instanceof Error ? error.message : "Error expanding sitemap"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
