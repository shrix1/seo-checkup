import { NextResponse } from "next/server"
import { postDiscordLogs } from "@/lib/discord-webhook"
import { getClientIp } from "@/lib/client-ip"
import getRatelimit from "@/lib/rate-limit"
import { expandSitemap, type ExpandResult } from "@/lib/sitemap-expand"
import {
  sitemapCandidates,
  type CandidateSource,
} from "@/lib/sitemap-discover"
import { ensureHttpScheme } from "@/lib/fetch-url"
import { assertPublicHttpUrl } from "@/lib/safe-url"

const rateLimit = getRatelimit(20, "24 h")

/** Stop probing once we have tried this many candidates. */
const MAX_CANDIDATES = 8

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

  let input: string
  try {
    input = ensureHttpScheme(decodeURIComponent(q))
  } catch {
    return NextResponse.json({ error: "Invalid q parameter" }, { status: 400 })
  }

  try {
    await assertPublicHttpUrl(input)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid URL" },
      { status: 400 }
    )
  }

  try {
    const candidates = (await sitemapCandidates(input)).slice(0, MAX_CANDIDATES)
    const tried: { url: string; source: CandidateSource; reason: string }[] = []

    // Remember the best near-miss: something that parsed as a sitemap but
    // declared no URLs still beats reporting "not found".
    let fallback: {
      result: ExpandResult
      url: string
      source: CandidateSource
    } | null = null

    for (const candidate of candidates) {
      try {
        await assertPublicHttpUrl(candidate.url)
      } catch {
        tried.push({ ...candidate, reason: "Blocked or invalid URL" })
        continue
      }

      try {
        const result = await expandSitemap(candidate.url)
        if (result.urls.length > 0) {
          void postDiscordLogs(candidate.url, "SITEMAP")
          return NextResponse.json({
            ...result,
            resolvedFrom: candidate.source,
            requestedUrl: input,
            tried,
          })
        }
        tried.push({
          ...candidate,
          reason:
            result.rootKind === "unknown"
              ? "Not a sitemap"
              : "Parsed but declared no URLs",
        })
        if (!fallback && result.rootKind !== "unknown") {
          fallback = { result, url: candidate.url, source: candidate.source }
        }
      } catch (err) {
        tried.push({
          ...candidate,
          reason: err instanceof Error ? err.message : "Fetch failed",
        })
      }
    }

    if (fallback) {
      void postDiscordLogs(fallback.url, "SITEMAP")
      return NextResponse.json({
        ...fallback.result,
        resolvedFrom: fallback.source,
        requestedUrl: input,
        tried,
      })
    }

    return NextResponse.json(
      {
        error: `No sitemap found for ${input}`,
        requestedUrl: input,
        tried,
      },
      { status: 404 }
    )
  } catch (error) {
    console.error("Error expanding sitemap:", error)
    const message =
      error instanceof Error ? error.message : "Error expanding sitemap"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
