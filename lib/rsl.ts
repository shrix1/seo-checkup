/**
 * RSL 1.0 — Really Simple Licensing (https://rslstandard.org/rsl).
 *
 * A publisher points at an XML document that declares what may be done with
 * their content and on what terms. It sits one layer above robots.txt: crawl
 * rules decide whether a bot may fetch a page, RSL declares what it may do
 * with the bytes afterwards.
 *
 * Parsed with regular expressions to match how lib/sitemap-expand.ts reads
 * sitemap XML — no parser dependency, and the shapes we care about are flat.
 */

export const RSL_NAMESPACE = "https://rslstandard.org/rsl"
export const RSL_MEDIA_TYPE = "application/rsl+xml"

/** RSL 1.0 §3.4.1.1 — the complete set for <permits>/<prohibits type="usage">. */
const USAGE_TOKENS = new Set([
  "all",
  "ai-all",
  "ai-train",
  "ai-input",
  "ai-index",
  "search",
])

/** RSL 1.0 §3.4.1.2 — the complete set for type="user". */
const USER_TOKENS = new Set([
  "commercial",
  "non-commercial",
  "education",
  "government",
  "personal",
])

/** RSL 1.0 §3.7 — the complete set of <payment type=""> values. */
const PAYMENT_TYPES = new Set([
  "purchase",
  "subscription",
  "training",
  "crawl",
  "use",
  "contribution",
  "attribution",
  "free",
])

/** type="geo" takes ISO 3166-1 alpha-2 codes, so validate shape not membership. */
const GEO_CODE = /^[a-z]{2}$/

export type RslLicense = {
  permits: { type: string; values: string[] }[]
  prohibits: { type: string; values: string[] }[]
  paymentType?: string
  amount?: string
  currency?: string
}

export type RslContent = {
  url: string
  server?: string
  licenses: RslLicense[]
}

export type RslDocument = {
  /** Well-formed enough to read, with the RSL namespace on the root */
  valid: boolean
  contents: RslContent[]
  /** Spec violations, in document order */
  issues: string[]
}

function stripComments(xml: string): string {
  return xml.replace(/<!--[\s\S]*?-->/g, "")
}

/** Reads an attribute off a start tag, single or double quoted. */
function attr(tag: string, name: string): string | undefined {
  const m = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i")
  )
  return m ? (m[2] ?? m[3] ?? "").trim() : undefined
}

/** Matches an element allowing any namespace prefix, returning inner blocks. */
function blocks(xml: string, tag: string): string[] {
  const re = new RegExp(
    `<(?:[A-Za-z_][\\w.-]*:)?${tag}\\b[^>]*(?:/>|>[\\s\\S]*?<\\/(?:[A-Za-z_][\\w.-]*:)?${tag}>)`,
    "gi"
  )
  return xml.match(re) ?? []
}

function innerText(block: string): string {
  const open = block.indexOf(">")
  const close = block.lastIndexOf("<")
  if (open === -1 || close <= open) return ""
  return block.slice(open + 1, close).trim()
}

function tokenList(text: string): string[] {
  return text.split(/[\s,]+/).filter(Boolean)
}

/**
 * Validates an RSL document. Returns what it could read plus every spec
 * violation found, so the caller can report a partial document rather than
 * a bare "invalid".
 */
export function parseRsl(xml: string): RslDocument {
  const issues: string[] = []
  const doc = stripComments(xml)

  const rootMatch = doc.match(/<(?:[A-Za-z_][\w.-]*:)?rsl\b[^>]*>/i)
  if (!rootMatch) {
    return {
      valid: false,
      contents: [],
      issues: ["No <rsl> root element — this is not an RSL document"],
    }
  }

  const ns = attr(rootMatch[0], "xmlns")
  if (!ns) {
    issues.push("Root <rsl> is missing the xmlns declaration")
  } else if (ns.replace(/\/$/, "") !== RSL_NAMESPACE) {
    issues.push(
      `Root <rsl> declares xmlns="${ns}" — the spec requires "${RSL_NAMESPACE}"`
    )
  }

  const contents: RslContent[] = []

  for (const contentBlock of blocks(doc, "content")) {
    const openTag = contentBlock.match(/<[^>]*>/)?.[0] ?? ""
    const url = attr(openTag, "url")
    const server = attr(openTag, "server")

    if (!url) {
      issues.push("<content> is missing the required url attribute")
    }

    const licenses: RslLicense[] = []
    for (const licenseBlock of blocks(contentBlock, "license")) {
      const license: RslLicense = { permits: [], prohibits: [] }

      for (const kind of ["permits", "prohibits"] as const) {
        for (const b of blocks(licenseBlock, kind)) {
          const tag = b.match(/<[^>]*>/)?.[0] ?? ""
          const type = (attr(tag, "type") || "usage").toLowerCase()
          const values = tokenList(innerText(b).toLowerCase())
          const allowed =
            type === "usage"
              ? USAGE_TOKENS
              : type === "user"
                ? USER_TOKENS
                : null
          if (allowed) {
            for (const v of values) {
              if (!allowed.has(v)) {
                issues.push(
                  `<${kind} type="${type}"> uses "${v}", which is not a defined RSL token`
                )
              }
            }
          } else if (type === "geo") {
            for (const v of values) {
              if (!GEO_CODE.test(v)) {
                issues.push(
                  `<${kind} type="geo"> uses "${v}", which is not an ISO 3166-1 alpha-2 code`
                )
              }
            }
          }
          license[kind].push({ type, values })
        }
      }

      const paymentBlock = blocks(licenseBlock, "payment")[0]
      if (paymentBlock) {
        const tag = paymentBlock.match(/<[^>]*>/)?.[0] ?? ""
        const type = (attr(tag, "type") || "").toLowerCase()
        if (type && !PAYMENT_TYPES.has(type)) {
          issues.push(
            `<payment type="${type}"> is not one of the defined payment models`
          )
        }
        license.paymentType = type || undefined
        const amountBlock = blocks(paymentBlock, "amount")[0]
        if (amountBlock) {
          license.amount = innerText(amountBlock)
          license.currency = attr(
            amountBlock.match(/<[^>]*>/)?.[0] ?? "",
            "currency"
          )
        }
      }

      licenses.push(license)
    }

    if (licenses.length === 0) {
      issues.push(
        `<content${url ? ` url="${url}"` : ""}> declares no <license> — every content element needs at least one`
      )
    }

    contents.push({ url: url ?? "", server, licenses })
  }

  if (contents.length === 0) {
    issues.push("Document declares no <content> elements")
  }

  return { valid: issues.length === 0 && contents.length > 0, contents, issues }
}

/**
 * Picks the RSL document URL from the three discovery mechanisms an audit can
 * see, in the spec's order of specificity: an explicit robots.txt License
 * directive, then a Link header, then a <link rel="license"> in the markup.
 */
export function discoverRslUrl(sources: {
  robotsLicenses: string[]
  linkHeader?: string | null
  htmlLicenseHref?: string
  baseUrl: string
}): { url: string; via: string } | null {
  const { robotsLicenses, linkHeader, htmlLicenseHref, baseUrl } = sources

  const absolute = (href: string): string | null => {
    try {
      return new URL(href, baseUrl).toString()
    } catch {
      return null
    }
  }

  if (robotsLicenses.length > 0) {
    const url = absolute(robotsLicenses[0])
    if (url) return { url, via: "robots.txt License directive" }
  }

  if (linkHeader) {
    // Link: <https://example.com/license.xml>; rel="license"
    for (const part of linkHeader.split(/,(?=\s*<)/)) {
      if (!/rel\s*=\s*"?[^";]*license/i.test(part)) continue
      const href = part.match(/<([^>]+)>/)?.[1]
      const url = href ? absolute(href) : null
      if (url) return { url, via: "Link: rel=\"license\" header" }
    }
  }

  if (htmlLicenseHref) {
    const url = absolute(htmlLicenseHref)
    if (url) return { url, via: '<link rel="license">' }
  }

  return null
}
