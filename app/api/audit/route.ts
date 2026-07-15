import { NextResponse } from "next/server"
import { runAudit } from "@/lib/audit/run-audit"
import { getClientIp } from "@/lib/client-ip"
import getRatelimit from "@/lib/rate-limit"

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
    const report = await runAudit(decoded)
    return NextResponse.json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audit failed"
    const status = message.includes("http") || message.includes("URL") ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
