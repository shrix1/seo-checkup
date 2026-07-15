import dns from "node:dns/promises"
import net from "node:net"

const ALLOWED_PORTS = new Set([80, 443, ""])

const blockV4 = new net.BlockList()
blockV4.addSubnet("0.0.0.0", 8, "ipv4")
blockV4.addSubnet("10.0.0.0", 8, "ipv4")
blockV4.addSubnet("127.0.0.0", 8, "ipv4")
blockV4.addSubnet("169.254.0.0", 16, "ipv4")
blockV4.addSubnet("172.16.0.0", 12, "ipv4")
blockV4.addSubnet("192.168.0.0", 16, "ipv4")
blockV4.addSubnet("100.64.0.0", 10, "ipv4")
blockV4.addSubnet("192.0.0.0", 24, "ipv4")
blockV4.addSubnet("192.0.2.0", 24, "ipv4")
blockV4.addSubnet("198.18.0.0", 15, "ipv4")
blockV4.addSubnet("198.51.100.0", 24, "ipv4")
blockV4.addSubnet("203.0.113.0", 24, "ipv4")
blockV4.addSubnet("224.0.0.0", 4, "ipv4")
blockV4.addSubnet("240.0.0.0", 4, "ipv4")

const blockV6 = new net.BlockList()
blockV6.addSubnet("::1", 128, "ipv6")
blockV6.addSubnet("::", 128, "ipv6")
blockV6.addSubnet("fc00::", 7, "ipv6")
blockV6.addSubnet("fe80::", 10, "ipv6")
blockV6.addSubnet("ff00::", 8, "ipv6")

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
  "kubernetes.default",
  "kubernetes.default.svc",
])

function ipv4FromMapped(ip: string): string | null {
  const lower = ip.toLowerCase()
  if (!lower.startsWith("::ffff:")) return null
  const rest = lower.slice("::ffff:".length)
  if (net.isIPv4(rest)) return rest
  // Hex form ::ffff:a9fe:a9fe
  const hex = rest.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i)
  if (!hex) return null
  const hi = parseInt(hex[1], 16)
  const lo = parseInt(hex[2], 16)
  return `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`
}

export function isBlockedIp(ip: string): boolean {
  const trimmed = ip.trim().replace(/^\[|\]$/g, "")
  const mapped = ipv4FromMapped(trimmed)
  if (mapped) return blockV4.check(mapped, "ipv4")
  if (net.isIPv4(trimmed)) return blockV4.check(trimmed, "ipv4")
  if (net.isIPv6(trimmed)) return blockV6.check(trimmed, "ipv6")
  return true
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "")
  if (!host) return true
  if (BLOCKED_HOSTNAMES.has(host)) return true
  if (host.endsWith(".localhost") || host.endsWith(".local")) return true
  if (host.endsWith(".internal") || host.endsWith(".intranet")) return true
  if (host.endsWith(".lan") || host.endsWith(".home")) return true
  return false
}

export async function assertPublicHttpUrl(input: string | URL): Promise<URL> {
  let url: URL
  try {
    url = typeof input === "string" ? new URL(input) : new URL(input.href)
  } catch {
    throw new Error("Invalid URL")
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed")
  }

  if (url.username || url.password) {
    throw new Error("URLs with credentials are not allowed")
  }

  const port = url.port || ""
  if (!ALLOWED_PORTS.has(port)) {
    throw new Error("Only ports 80 and 443 are allowed")
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "")
  if (isBlockedHostname(hostname)) {
    throw new Error("Host is not allowed")
  }

  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      throw new Error("Private or reserved IP addresses are not allowed")
    }
    return url
  }

  let records: { address: string; family: number }[]
  try {
    records = await dns.lookup(hostname, { all: true, verbatim: true })
  } catch {
    throw new Error("DNS lookup failed")
  }

  if (!records.length) {
    throw new Error("DNS lookup returned no addresses")
  }

  for (const record of records) {
    if (isBlockedIp(record.address)) {
      throw new Error("Host resolves to a private or reserved address")
    }
  }

  return url
}

export function sameRegistrableHost(a: string, b: string): boolean {
  const normalize = (host: string) =>
    host.toLowerCase().replace(/^\[|\]$/g, "").replace(/^www\./, "")
  return normalize(a) === normalize(b)
}
