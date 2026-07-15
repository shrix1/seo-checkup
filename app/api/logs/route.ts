import { NextResponse } from "next/server"
import { postDiscordLogs, type LogType } from "@/lib/discord-webhook"
import getRatelimit from "@/lib/rate-limit"
import { getClientIp } from "@/lib/client-ip"

const ALLOWED: LogType[] = [
  "SITEMAP",
  "METADATA",
  "ROBOTS",
  "AUDIT",
  "DOMAIN_RATING",
]
const rateLimit = getRatelimit(40, "24 h")

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const { success, limit, reset, remaining } = await rateLimit.limit(
    `logs:${ip}`
  )

  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", limit, reset, remaining },
      { status: 429 }
    )
  }

  let body: { value?: string; type?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const value = typeof body.value === "string" ? body.value.trim() : ""
  const type = body.type

  if (!value || value.length > 2048) {
    return NextResponse.json({ error: "Invalid value" }, { status: 400 })
  }

  if (!type || !ALLOWED.includes(type as LogType)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  }

  await postDiscordLogs(value, type as LogType)
  return NextResponse.json({ ok: true })
}
