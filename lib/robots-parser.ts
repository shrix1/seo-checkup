/**
 * robots.txt parser and matcher following RFC 9309.
 *
 * Google retired its own robots.txt tester, so the rules that matter are:
 *  - Rules live in groups introduced by one or more consecutive `User-agent:` lines.
 *  - A crawler uses the group whose user-agent token is the longest case-insensitive
 *    match against its name; otherwise the `*` group.
 *  - Within a group the most specific rule wins, measured in octets of the pattern.
 *  - On an exact tie, Allow beats Disallow.
 *  - An empty `Disallow:` value allows everything.
 *  - `*` matches any sequence; a trailing `$` anchors to end of path.
 *
 * Pure string work only — safe to import from both server and client code.
 */

export type RuleType = "allow" | "disallow"

export type RobotsRule = {
  type: RuleType
  pattern: string
  line: number
}

export type RobotsGroup = {
  agents: string[]
  rules: RobotsRule[]
  crawlDelay?: number
  contentSignals?: ContentSignals
  startLine: number
}

export type RobotsIssueLevel = "error" | "warning"

export type RobotsIssue = {
  level: RobotsIssueLevel
  line: number
  message: string
  raw: string
}

export type RobotsParsed = {
  groups: RobotsGroup[]
  sitemaps: string[]
  issues: RobotsIssue[]
  /** Content Signals from the `*` group, if the site declares them */
  contentSignals?: ContentSignals
  /** true when the file has no groups at all (everything is allowed) */
  empty: boolean
}

const KNOWN_DIRECTIVES = new Set([
  "user-agent",
  "allow",
  "disallow",
  "sitemap",
  "crawl-delay",
  "host",
  "noindex",
  "clean-param",
  "request-rate",
  "visit-time",
  // Cloudflare's Content Signals Policy: declares permitted *uses* of content
  // that a crawler is otherwise allowed to fetch.
  "content-signal",
])

export type ContentSignals = {
  /** Appear in a traditional search index */
  search?: boolean
  /** Be used as grounding/RAG input for an AI answer */
  "ai-input"?: boolean
  /** Be used as model training data */
  "ai-train"?: boolean
  raw: string
}

function parseContentSignal(value: string): ContentSignals {
  const signals: ContentSignals = { raw: value }
  for (const part of value.split(",")) {
    const [rawKey, rawVal] = part.split("=").map((s) => s?.trim().toLowerCase())
    if (!rawKey || rawVal === undefined) continue
    if (rawKey === "search" || rawKey === "ai-input" || rawKey === "ai-train") {
      signals[rawKey] = rawVal === "yes"
    }
  }
  return signals
}

export function parseRobots(text: string): RobotsParsed {
  const groups: RobotsGroup[] = []
  const sitemaps: string[] = []
  const issues: RobotsIssue[] = []

  let current: RobotsGroup | null = null
  // A group accepts more agents only until its first rule appears.
  let acceptingAgents = false

  const lines = text.split(/\r?\n/)

  lines.forEach((rawLine, index) => {
    const lineNo = index + 1
    const withoutComment = rawLine.split("#")[0]
    const line = withoutComment.trim()
    if (!line) return

    const sep = line.indexOf(":")
    if (sep === -1) {
      issues.push({
        level: "error",
        line: lineNo,
        message: "Line is missing a ':' separator, so it is ignored",
        raw: rawLine.trim(),
      })
      return
    }

    const field = line.slice(0, sep).trim().toLowerCase()
    const value = line.slice(sep + 1).trim()

    if (!KNOWN_DIRECTIVES.has(field)) {
      issues.push({
        level: "warning",
        line: lineNo,
        message: `Unknown directive "${line.slice(0, sep).trim()}" — crawlers ignore it`,
        raw: rawLine.trim(),
      })
      return
    }

    if (field === "sitemap") {
      if (!value) {
        issues.push({
          level: "warning",
          line: lineNo,
          message: "Sitemap directive has no URL",
          raw: rawLine.trim(),
        })
        return
      }
      if (!/^https?:\/\//i.test(value)) {
        issues.push({
          level: "warning",
          line: lineNo,
          message: "Sitemap must be an absolute URL",
          raw: rawLine.trim(),
        })
      }
      if (!sitemaps.includes(value)) sitemaps.push(value)
      return
    }

    if (field === "user-agent") {
      if (!value) {
        issues.push({
          level: "error",
          line: lineNo,
          message: "User-agent has no value",
          raw: rawLine.trim(),
        })
        return
      }
      if (current && acceptingAgents) {
        current.agents.push(value)
        return
      }
      current = { agents: [value], rules: [], startLine: lineNo }
      groups.push(current)
      acceptingAgents = true
      return
    }

    if (field === "allow" || field === "disallow") {
      if (!current) {
        issues.push({
          level: "error",
          line: lineNo,
          message: `${field === "allow" ? "Allow" : "Disallow"} appears before any User-agent, so no crawler applies it`,
          raw: rawLine.trim(),
        })
        return
      }
      acceptingAgents = false

      // `Disallow:` with an empty value means "allow everything" — not a rule.
      if (field === "disallow" && value === "") return

      if (field === "allow" && value === "") {
        issues.push({
          level: "warning",
          line: lineNo,
          message: "Allow with an empty value has no effect",
          raw: rawLine.trim(),
        })
        return
      }

      if (!value.startsWith("/") && !value.startsWith("*")) {
        issues.push({
          level: "warning",
          line: lineNo,
          message: "Path should start with '/' or '*'",
          raw: rawLine.trim(),
        })
      }

      current.rules.push({ type: field, pattern: value, line: lineNo })
      return
    }

    if (field === "crawl-delay") {
      const n = Number(value)
      if (!current) {
        issues.push({
          level: "warning",
          line: lineNo,
          message: "Crawl-delay appears before any User-agent",
          raw: rawLine.trim(),
        })
        return
      }
      if (Number.isFinite(n)) {
        acceptingAgents = false
        current.crawlDelay = n
      } else {
        issues.push({
          level: "warning",
          line: lineNo,
          message: "Crawl-delay is not a number",
          raw: rawLine.trim(),
        })
      }
      return
    }

    if (field === "content-signal") {
      if (!current) {
        issues.push({
          level: "warning",
          line: lineNo,
          message: "Content-Signal appears before any User-agent",
          raw: rawLine.trim(),
        })
        return
      }
      acceptingAgents = false
      current.contentSignals = parseContentSignal(value)
      return
    }

    if (field === "noindex") {
      issues.push({
        level: "warning",
        line: lineNo,
        message:
          "robots.txt Noindex is unsupported — use a meta robots tag or X-Robots-Tag header",
        raw: rawLine.trim(),
      })
    }
  })

  return {
    groups,
    sitemaps,
    issues,
    contentSignals: groups.find((g) => g.agents.some((a) => a.trim() === "*"))
      ?.contentSignals,
    empty: groups.length === 0,
  }
}

/** Convert a robots path pattern into an anchored regular expression. */
function patternToRegExp(pattern: string): RegExp {
  const anchored = pattern.endsWith("$")
  const body = anchored ? pattern.slice(0, -1) : pattern

  let source = ""
  for (const char of body) {
    if (char === "*") {
      source += ".*"
    } else {
      source += char.replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    }
  }

  return new RegExp(`^${source}${anchored ? "$" : ""}`)
}

/**
 * Pick the group a crawler obeys: the longest user-agent token that is a
 * case-insensitive prefix-ish match on the crawler name, else the `*` group.
 */
export function groupForAgent(
  parsed: RobotsParsed,
  userAgent: string
): RobotsGroup | null {
  const ua = userAgent.trim().toLowerCase()
  let best: RobotsGroup | null = null
  let bestLength = -1
  let wildcard: RobotsGroup | null = null

  for (const group of parsed.groups) {
    for (const agent of group.agents) {
      const token = agent.trim().toLowerCase()
      if (token === "*") {
        if (!wildcard) wildcard = group
        continue
      }
      if (ua.includes(token) && token.length > bestLength) {
        best = group
        bestLength = token.length
      }
    }
  }

  return best ?? wildcard
}

export type MatchResult = {
  allowed: boolean
  rule: RobotsRule | null
  group: RobotsGroup | null
  /** Which user-agent token in the group was matched, or "*" */
  matchedAgent: string | null
  reason: string
}

/**
 * Decide whether `userAgent` may fetch `pathOrUrl`.
 * Matching runs against the path plus query string, per RFC 9309.
 */
export function matchRobots(
  parsed: RobotsParsed,
  userAgent: string,
  pathOrUrl: string
): MatchResult {
  let path = pathOrUrl.trim()
  if (/^https?:\/\//i.test(path)) {
    try {
      const u = new URL(path)
      path = `${u.pathname}${u.search}`
    } catch {
      // fall through and treat the raw string as a path
    }
  }
  if (!path.startsWith("/")) path = `/${path}`

  const group = groupForAgent(parsed, userAgent)
  if (!group) {
    return {
      allowed: true,
      rule: null,
      group: null,
      matchedAgent: null,
      reason: parsed.empty
        ? "robots.txt declares no rules, so everything is crawlable"
        : "No group matches this user-agent and there is no * group",
    }
  }

  const ua = userAgent.trim().toLowerCase()
  const matchedAgent =
    group.agents.find((a) => {
      const t = a.trim().toLowerCase()
      return t !== "*" && ua.includes(t)
    }) ??
    group.agents.find((a) => a.trim() === "*") ??
    group.agents[0]

  let winner: RobotsRule | null = null
  let winnerLength = -1

  for (const rule of group.rules) {
    if (!patternToRegExp(rule.pattern).test(path)) continue
    const length = rule.pattern.length
    if (length > winnerLength) {
      winner = rule
      winnerLength = length
    } else if (length === winnerLength && rule.type === "allow") {
      // Equivalent specificity — Allow wins.
      winner = rule
    }
  }

  if (!winner) {
    return {
      allowed: true,
      rule: null,
      group,
      matchedAgent,
      reason: "No rule in this group matches the path, so crawling is allowed",
    }
  }

  return {
    allowed: winner.type === "allow",
    rule: winner,
    group,
    matchedAgent,
    reason:
      winner.type === "allow"
        ? `Allowed by the most specific rule: Allow: ${winner.pattern}`
        : `Blocked by the most specific rule: Disallow: ${winner.pattern}`,
  }
}
