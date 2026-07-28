import { NextResponse } from "next/server"
import { postDiscordLogs, type LogType } from "@/lib/discord-webhook"
import { getClientIp } from "@/lib/client-ip"
import getRatelimit from "@/lib/rate-limit"
import { safeFetch } from "@/lib/safe-fetch"
import { assertPublicHttpUrl } from "@/lib/safe-url"
import { ensureHttpScheme } from "@/lib/fetch-url"
import { looksLikeMarkup } from "@/lib/robots-parser"

const rateLimit = getRatelimit(20, "24 h")

export async function GET(req: Request) {
  const ip = getClientIp(req)
  const { success, limit, reset, remaining } = await rateLimit.limit(`v1:${ip}`)

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

  const tool = search.get("tool")
  const logType: LogType | null =
    tool === "METADATA" || tool === "ROBOTS" ? tool : null

  try {
    const data = await safeFetch(url)

    if (!data.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch data", status: data.status },
        { status: data.status || 502 }
      )
    }

    const text = data.body.toString("utf8")

    // A host that answers /robots.txt with an HTML challenge or error page has
    // no usable robots.txt. Say so, rather than handing markup to the parser.
    if (tool === "ROBOTS" && looksLikeMarkup(text)) {
      return NextResponse.json(
        {
          error:
            "That URL returned an HTML page, not a plain-text robots.txt",
          status: data.status,
        },
        { status: 502 }
      )
    }

    if (logType) {
      void postDiscordLogs(url, logType)
    }

    return NextResponse.json(text)
  } catch (error) {
    console.error("Error fetching data:", error)
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 })
  }
}
