/** Best-effort client IP for rate limiting on Vercel / reverse proxies. */
export function getClientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp

  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    const parts = forwarded.split(",").map((p) => p.trim()).filter(Boolean)
    // Prefer the rightmost hop (added by the trusted edge) over client-spoofable leftmost.
    const edgeIp = parts[parts.length - 1]
    if (edgeIp) return edgeIp
  }

  return "anonymous"
}
