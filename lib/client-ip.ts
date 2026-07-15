/**
 * Best-effort client IP for rate limiting.
 * On Vercel, the leftmost X-Forwarded-For hop is the client IP set by the edge.
 * Do not prefer client-supplied X-Real-IP over X-Forwarded-For.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean)
    if (parts[0]) return parts[0]
  }

  const realIp = req.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp

  return "anonymous"
}
