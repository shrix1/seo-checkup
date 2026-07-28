import { NextResponse } from "next/server"
import { AHREFS_DR_ATTRIBUTION, fetchDomainRating } from "@/lib/ahrefs-dr"
import { getClientIp } from "@/lib/client-ip"
import { postDiscordLogs } from "@/lib/discord-webhook"
import { hostnameFromInput } from "@/lib/fetch-url"
import getRatelimit from "@/lib/rate-limit"
import { assertPublicHttpUrl } from "@/lib/safe-url"

const rateLimit = getRatelimit(30, "24 h")

/** Comparison is capped so one request can't fan out into a crawl. */
const MAX_TARGETS = 5

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

  const rawTargets = decoded
    .split(/[\s,\n]+/)
    .map((t) => t.trim())
    .filter(Boolean)

  if (rawTargets.length === 0) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 })
  }

  const truncated = rawTargets.length > MAX_TARGETS
  const targets = rawTargets.slice(0, MAX_TARGETS)

  const domains: string[] = []
  for (const target of targets) {
    try {
      const domain = hostnameFromInput(target)
      await assertPublicHttpUrl(`https://${domain}/`)
      if (!domains.includes(domain)) domains.push(domain)
    } catch {
      // Skip invalid entries rather than failing the whole comparison.
    }
  }

  if (domains.length === 0) {
    return NextResponse.json({ error: "Invalid URL or domain" }, { status: 400 })
  }

  const results = await Promise.all(domains.map((d) => fetchDomainRating(d)))

  // A single-domain lookup that fails should still surface as an error, the
  // way it did before comparison existed.
  if (results.length === 1 && results[0].domainRating === null) {
    return NextResponse.json(
      {
        error: results[0].error || "Domain rating unavailable",
        domain: results[0].domain,
        attribution: AHREFS_DR_ATTRIBUTION,
      },
      { status: 502 }
    )
  }

  void postDiscordLogs(domains.join(", "), "DOMAIN_RATING")

  return NextResponse.json({
    // Kept for single-domain callers and existing deep links.
    domain: results[0].domain,
    domainRating: results[0].domainRating,
    results: results.map((r) => ({
      domain: r.domain,
      domainRating: r.domainRating,
      error: r.error,
    })),
    truncated,
    maxTargets: MAX_TARGETS,
    attribution: AHREFS_DR_ATTRIBUTION,
  })
}
