import { NextResponse } from "next/server"
import getRatelimit from "@/lib/rate-limit"
import { getClientIp } from "@/lib/client-ip"

const rateLimit = getRatelimit(20, "24 h")

export async function GET(req: Request) {
  const ip = getClientIp(req)
  const { success, limit, reset, remaining } = await rateLimit.limit(ip)

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

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json(
      { error: "Only http and https URLs are allowed" },
      { status: 400 }
    )
  }

  try {
    const data = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    })

    if (!data.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data", status: data.status },
        { status: data.status }
      )
    }

    const res = await data.text()
    const capped = res.length > 2_000_000 ? res.slice(0, 2_000_000) : res
    return NextResponse.json(capped)
  } catch (error) {
    console.error("Error fetching data:", error)
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 })
  }
}
