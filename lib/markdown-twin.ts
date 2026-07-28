import { safeFetch } from "@/lib/safe-fetch"

/**
 * Markdown twin detection and AEO Specification v1.0 conformance.
 *
 * The convention: every HTML page also serves a clean Markdown copy, because
 * answer engines parse Markdown far more reliably than HTML and it costs
 * roughly 60–80% fewer tokens to read. Two mechanisms are in use:
 *
 *  1. URL suffix — `/pricing` also answers at `/pricing.md`, and the site root
 *     at `/index.md`.
 *  2. Content negotiation — the same URL returns Markdown when the request
 *     sends `Accept: text/markdown`, and HTML to browsers.
 *
 * The AEO Specification (dualmark.dev, Apache-2.0) formalises this. Its MUST
 * rules cover the twin's response headers, honouring `Accept`, and advertising
 * the twin via a `Link: <url.md>; rel="alternate"` header. SHOULD rules add
 * `406` for unacceptable types, `nosniff`, and an `X-AEO-Version` banner.
 *
 * The important trap when detecting any of this: plenty of sites answer 200
 * with their SPA shell for any unknown path, so a bare status check reports
 * twins that do not exist. Every candidate here is sniffed for real Markdown.
 */

const PROBE_BYTES = 16_000
const BOT_UA = "Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)"

export type TwinMethod = "suffix" | "index-suffix" | "content-negotiation"

export const TWIN_METHOD_LABELS: Record<TwinMethod, string> = {
  suffix: "a .md URL suffix",
  "index-suffix": "an index file at the directory root",
  "content-negotiation": "Accept: text/markdown content negotiation",
}

export type TwinCandidate = {
  url: string
  method: TwinMethod
  status: number
  contentType: string
  ok: boolean
  reason: string
}

/** One line of the AEO conformance report. */
export type SpecCheck = {
  id: string
  label: string
  level: "must" | "should"
  ok: boolean
  detail: string
}

export type ConformanceLevel = "advanced" | "standard" | "basic" | "none"

export const CONFORMANCE_LABELS: Record<ConformanceLevel, string> = {
  advanced: "Advanced",
  standard: "Standard",
  basic: "Basic",
  none: "Not conformant",
}

export type MarkdownTwinResult = {
  found: boolean
  method: TwinMethod | null
  url: string | null
  /** Token count the twin advertises via X-Markdown-Tokens, when present */
  tokens: number | null
  candidates: TwinCandidate[]
  /** AEO spec conformance, only meaningful once a twin is found */
  spec: SpecCheck[]
  score: number
  maxScore: number
  percent: number
  level: ConformanceLevel
  negotiation: {
    acceptHeader: boolean
    botUa: boolean
    notAcceptable: boolean
  }
}

function looksLikeHtml(body: string): boolean {
  const head = body.slice(0, 800).trimStart().toLowerCase()
  return (
    head.startsWith("<!doctype") ||
    head.startsWith("<html") ||
    /^<\?xml[\s\S]{0,200}<html/.test(head)
  )
}

/** Decide whether a response is genuinely Markdown rather than an HTML shell. */
function classify(
  contentType: string,
  body: string
): { ok: boolean; reason: string } {
  const ct = contentType.toLowerCase()
  const trimmed = body.trim()

  if (!trimmed) return { ok: false, reason: "Empty response" }

  if (ct.includes("text/markdown") || ct.includes("text/x-markdown")) {
    return looksLikeHtml(body)
      ? { ok: false, reason: "Declares text/markdown but returns HTML" }
      : { ok: true, reason: "Served as text/markdown" }
  }

  if (ct.includes("text/html")) {
    return { ok: false, reason: "Returned HTML, not Markdown" }
  }

  if (looksLikeHtml(body)) {
    return {
      ok: false,
      reason:
        "Body is HTML — the server likely answers any path with the app shell",
    }
  }

  if (ct.includes("text/plain") || ct.startsWith("text/") || !ct) {
    return {
      ok: true,
      reason: `Served as ${contentType || "plain text"} and parses as Markdown`,
    }
  }

  return { ok: false, reason: `Unexpected content type ${contentType}` }
}

/**
 * Real deployments vary, so probe the shapes actually in the wild:
 * `/pricing` → `/pricing.md`, and the site root → `/index.md`
 * (the llms-txt proposal spells the latter `index.html.md`, which some
 * generators emit instead).
 */
function candidateUrls(pageUrl: string): { url: string; method: TwinMethod }[] {
  const u = new URL(pageUrl)
  u.hash = ""
  const path = u.pathname
  const search = u.search
  const out: { url: string; method: TwinMethod }[] = []

  const push = (p: string, method: TwinMethod) => {
    const url = `${u.origin}${p}${search}`
    if (!out.some((c) => c.url === url)) out.push({ url, method })
  }

  const bare = path.replace(/\/+$/, "")
  if (path.toLowerCase().endsWith(".md")) return out

  if (bare === "") {
    push("/index.md", "index-suffix")
    push("/index.html.md", "index-suffix")
  } else {
    push(`${bare}.md`, "suffix")
    push(`${bare}/index.md`, "index-suffix")
  }

  return out
}

type Probe = {
  status: number
  headers: Headers
  body: string
  contentType: string
  ok: boolean
  reason: string
  error?: string
}

async function probe(
  url: string,
  headers?: Record<string, string>
): Promise<Probe> {
  const res = await safeFetch(url, { maxBytes: PROBE_BYTES, headers })
  const contentType = res.headers.get("content-type") || ""

  if (!res.ok) {
    return {
      status: res.status,
      headers: res.headers,
      body: "",
      contentType,
      ok: false,
      reason: res.error || `HTTP ${res.status}`,
      error: res.error,
    }
  }

  const body = res.body.toString("utf8")
  const verdict = classify(contentType, body)
  return {
    status: res.status,
    headers: res.headers,
    body,
    contentType,
    ...verdict,
  }
}

function headerHas(headers: Headers, name: string, needle: string): boolean {
  return (headers.get(name) || "").toLowerCase().includes(needle.toLowerCase())
}

export async function detectMarkdownTwin(
  pageUrl: string
): Promise<MarkdownTwinResult> {
  const suffixCandidates = candidateUrls(pageUrl)

  const [suffixProbes, acceptProbe, botProbe, unacceptableProbe] =
    await Promise.all([
      Promise.all(suffixCandidates.map((c) => probe(c.url))),
      // MUST: honour Accept: text/markdown
      probe(pageUrl, { Accept: "text/markdown" }),
      // MAY: serve markdown to a known AI agent by User-Agent
      probe(pageUrl, { "User-Agent": BOT_UA, Accept: "text/markdown, */*;q=0.1" }),
      // SHOULD: 406 when neither html nor markdown is acceptable
      probe(pageUrl, { Accept: "application/vnd.seocheckup.probe+json" }),
    ])

  const candidates: TwinCandidate[] = suffixCandidates.map((c, i) => ({
    url: c.url,
    method: c.method,
    status: suffixProbes[i].status,
    contentType: suffixProbes[i].contentType,
    ok: suffixProbes[i].ok,
    reason: suffixProbes[i].reason,
  }))

  const negotiation = {
    acceptHeader: acceptProbe.ok,
    botUa: botProbe.ok,
    // 406 is only meaningful if the server actually refused.
    notAcceptable: unacceptableProbe.status === 406,
  }

  const suffixIndex = suffixProbes.findIndex((p) => p.ok)
  const winnerProbe =
    suffixIndex >= 0 ? suffixProbes[suffixIndex] : acceptProbe.ok ? acceptProbe : null
  const winnerUrl =
    suffixIndex >= 0 ? suffixCandidates[suffixIndex].url : acceptProbe.ok ? pageUrl : null
  const winnerMethod: TwinMethod | null =
    suffixIndex >= 0
      ? suffixCandidates[suffixIndex].method
      : acceptProbe.ok
        ? "content-negotiation"
        : null

  const found = Boolean(winnerProbe && winnerUrl)

  const tokensRaw = winnerProbe?.headers.get("x-markdown-tokens")
  const tokens = tokensRaw && /^\d+$/.test(tokensRaw) ? Number(tokensRaw) : null

  const spec: SpecCheck[] = []
  if (found && winnerProbe) {
    const h = winnerProbe.headers
    spec.push(
      {
        id: "md.contentType",
        label: "Content-Type: text/markdown",
        level: "must",
        ok: headerHas(h, "content-type", "text/markdown"),
        detail: winnerProbe.contentType || "(no content type)",
      },
      {
        id: "md.tokensHeader",
        label: "X-Markdown-Tokens",
        level: "must",
        ok: tokens !== null && tokens > 0,
        detail:
          tokens !== null
            ? `${tokens.toLocaleString()} tokens advertised`
            : "Header missing — agents cannot budget the fetch",
      },
      {
        id: "md.noindex",
        label: "X-Robots-Tag: noindex",
        level: "must",
        ok: headerHas(h, "x-robots-tag", "noindex"),
        detail:
          h.get("x-robots-tag") ||
          "Missing — the twin can be indexed as duplicate content",
      },
      {
        id: "md.vary",
        label: "Vary: Accept on the twin",
        level: "must",
        ok: headerHas(h, "vary", "accept"),
        detail: h.get("vary") || "Missing — caches may serve the wrong format",
      },
      {
        id: "md.body",
        label: "Twin body is non-empty",
        level: "must",
        ok: winnerProbe.body.trim().length > 0,
        detail: `${winnerProbe.body.trim().length.toLocaleString()} bytes read`,
      },
      {
        id: "negotiation.acceptHeader",
        label: "Accept: text/markdown returns Markdown",
        level: "must",
        ok: negotiation.acceptHeader,
        detail: negotiation.acceptHeader
          ? "The HTML URL serves Markdown when asked for it"
          : `Returned ${acceptProbe.contentType || acceptProbe.status} instead`,
      },
      {
        id: "md.nosniff",
        label: "X-Content-Type-Options: nosniff",
        level: "should",
        ok: headerHas(h, "x-content-type-options", "nosniff"),
        detail: h.get("x-content-type-options") || "Missing",
      },
      {
        id: "md.aeoVersion",
        label: "X-AEO-Version advertised",
        level: "should",
        ok: Boolean(h.get("x-aeo-version")),
        detail: h.get("x-aeo-version") || "Missing",
      },
      {
        id: "negotiation.botUa",
        label: "AI agent User-Agent receives Markdown",
        level: "should",
        ok: negotiation.botUa,
        detail: negotiation.botUa
          ? "A GPTBot user-agent is served Markdown"
          : "A GPTBot user-agent still receives HTML",
      },
      {
        id: "negotiation.notAcceptable",
        label: "406 for unacceptable types",
        level: "should",
        ok: negotiation.notAcceptable,
        detail: negotiation.notAcceptable
          ? "Returns 406 Not Acceptable"
          : `Returned ${unacceptableProbe.status} instead of 406`,
      }
    )
  }

  // MUST checks are worth double, matching how the spec weights them.
  let score = 0
  let maxScore = 0
  for (const check of spec) {
    const weight = check.level === "must" ? 2 : 1
    maxScore += weight
    if (check.ok) score += weight
  }
  const percent = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100)

  const level: ConformanceLevel = !found
    ? "none"
    : percent >= 95
      ? "advanced"
      : percent >= 80
        ? "standard"
        : percent >= 60
          ? "basic"
          : "none"

  return {
    found,
    method: winnerMethod,
    url: winnerUrl,
    tokens,
    candidates,
    spec,
    score,
    maxScore,
    percent,
    level,
    negotiation,
  }
}
