import { NextResponse } from "next/server"
import { runAudit } from "@/lib/audit/run-audit"
import { getClientIp } from "@/lib/client-ip"
import { postDiscordLogs } from "@/lib/discord-webhook"
import { normalizeOrigin } from "@/lib/fetch-url"
import getRatelimit from "@/lib/rate-limit"
import { assertPublicHttpUrl } from "@/lib/safe-url"

export const maxDuration = 60

const rateLimit = getRatelimit(15, "24 h")

export async function GET(req: Request) {
  const ip = getClientIp(req)
  const { success, limit, reset, remaining } = await rateLimit.limit(
    `audit:${ip}`
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

  let decoded: string
  try {
    decoded = decodeURIComponent(q)
  } catch {
    return NextResponse.json({ error: "Invalid q parameter" }, { status: 400 })
  }

  try {
    const origin = normalizeOrigin(decoded)
    await assertPublicHttpUrl(origin.href)
    const report = await runAudit(decoded)
    void postDiscordLogs(report.origin, "AUDIT")
    return NextResponse.json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audit failed"
    const status =
      /http|URL|Host|DNS|private|reserved|credentials|ports/i.test(message)
        ? 400
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}
