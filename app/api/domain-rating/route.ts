import { NextResponse } from "next/server"
import {
  AHREFS_DR_ATTRIBUTION,
  fetchDomainRating,
} from "@/lib/ahrefs-dr"
import { getClientIp } from "@/lib/client-ip"
import { hostnameFromInput } from "@/lib/fetch-url"
import getRatelimit from "@/lib/rate-limit"

const rateLimit = getRatelimit(30, "24 h")

export async function GET(req: Request) {
  const ip = getClientIp(req)
  const { success, limit, reset, remaining } = await rateLimit.limit(`dr:${ip}`)

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

  let decoded: string
  try {
    decoded = decodeURIComponent(q)
  } catch {
    return NextResponse.json({ error: "Invalid q parameter" }, { status: 400 })
  }

  let domain: string
  try {
    domain = hostnameFromInput(decoded)
  } catch {
    return NextResponse.json({ error: "Invalid URL or domain" }, { status: 400 })
  }

  const result = await fetchDomainRating(domain)
  if (result.domainRating === null) {
    return NextResponse.json(
      {
        error: result.error || "Domain rating unavailable",
        domain: result.domain,
        attribution: AHREFS_DR_ATTRIBUTION,
      },
      { status: 502 }
    )
  }

  return NextResponse.json({
    domain: result.domain,
    domainRating: result.domainRating,
    attribution: AHREFS_DR_ATTRIBUTION,
  })
}
