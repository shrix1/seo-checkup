"use client"

import { StatusDot } from "@/components/status"
import { Badge } from "@/components/ui/badge"
import Disclosure from "@/components/ui/disclosure"
import {
  ALL_CRAWLERS,
  AI_CRAWLERS,
  PURPOSE_HINTS,
  PURPOSE_LABELS,
  SEARCH_CRAWLERS,
  type Crawler,
  type CrawlerPurpose,
} from "@/lib/ai-crawlers"
import {
  matchRobots,
  type RobotsParsed,
  type RobotsIssue,
} from "@/lib/robots-parser"
import { cn } from "@/lib/utils"
import { AlertTriangle, Ban, Check, Search } from "lucide-react"
import { useMemo, useState } from "react"

/* ────────────────────────────── URL tester ────────────────────────────── */

/**
 * Rebuilds the robots.txt tester Google retired, following RFC 9309:
 * the most specific matching rule wins, and Allow beats Disallow on a tie.
 */
export function RobotsUrlTester({
  parsed,
  origin,
}: {
  parsed: RobotsParsed
  origin: string
}) {
  const [path, setPath] = useState("/")
  const [agent, setAgent] = useState("Googlebot")

  const result = useMemo(
    () => matchRobots(parsed, agent, path || "/"),
    [parsed, agent, path]
  )

  return (
    <section>
      <h2 className="text-subhead font-semibold">Test a URL</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Check whether a specific crawler may fetch a path, and see which rule
        decides it.
      </p>

      <div className="mt-4 rounded-lg border">
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-background px-3 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25">
            <Search
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/blog/my-post"
              aria-label="Path or URL to test"
              spellCheck={false}
              className="h-9 w-full min-w-0 bg-transparent font-mono text-sm outline-none placeholder:font-sans placeholder:text-muted-foreground"
            />
          </div>
          <select
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            aria-label="Crawler to test as"
            className="h-11 rounded-md border border-input bg-background px-3 text-sm transition-colors hover:border-border-strong focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 sm:h-auto sm:w-56"
          >
            <optgroup label="Search engines">
              {SEARCH_CRAWLERS.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="AI crawlers">
              {AI_CRAWLERS.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Other">
              <option value="*">* (any other crawler)</option>
            </optgroup>
          </select>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            <StatusDot
              status={result.allowed ? "pass" : "fail"}
              className="mt-0.5"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {result.allowed ? "Allowed" : "Blocked"} for{" "}
                <span className="font-mono">{agent}</span>
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {result.reason}
              </p>

              <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-[8rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground">Tested URL</dt>
                <dd className="break-all font-mono">
                  {path.startsWith("http")
                    ? path
                    : `${origin}${path.startsWith("/") ? "" : "/"}${path}`}
                </dd>

                <dt className="text-muted-foreground">Group matched</dt>
                <dd className="font-mono">
                  {result.matchedAgent
                    ? `User-agent: ${result.matchedAgent}`
                    : "— none —"}
                </dd>

                <dt className="text-muted-foreground">Winning rule</dt>
                <dd className="font-mono">
                  {result.rule
                    ? `${result.rule.type === "allow" ? "Allow" : "Disallow"}: ${result.rule.pattern}  (line ${result.rule.line})`
                    : "— no rule matched —"}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── AI crawler matrix ─────────────────────────── */

function CrawlerRow({
  crawler,
  allowed,
}: {
  crawler: Crawler
  allowed: boolean
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span
        className={cn(
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
          allowed ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"
        )}
        aria-hidden
      >
        {allowed ? (
          <Check className="h-3 w-3" />
        ) : (
          <Ban className="h-3 w-3" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-sm">{crawler.name}</span>
          <span className="text-xs text-muted-foreground">{crawler.vendor}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {allowed ? crawler.impact : `Blocked — losing: ${crawler.impact}`}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-xs font-medium",
          allowed ? "text-success" : "text-danger"
        )}
      >
        {allowed ? "Allowed" : "Blocked"}
      </span>
    </div>
  )
}

export function AiCrawlerMatrix({
  parsed,
  path = "/",
}: {
  parsed: RobotsParsed
  path?: string
}) {
  const results = useMemo(
    () =>
      ALL_CRAWLERS.map((crawler) => ({
        crawler,
        allowed: matchRobots(parsed, crawler.name, path).allowed,
      })),
    [parsed, path]
  )

  const byPurpose = useMemo(() => {
    const groups: Record<CrawlerPurpose, typeof results> = {
      search: [],
      assistant: [],
      training: [],
    }
    for (const r of results) groups[r.crawler.purpose].push(r)
    return groups
  }, [results])

  const blockedSearch = byPurpose.search.filter((r) => !r.allowed).length

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-subhead font-semibold">Crawler access</h2>
        {blockedSearch > 0 ? (
          <Badge variant="danger">
            {blockedSearch} search crawler{blockedSearch === 1 ? "" : "s"} blocked
          </Badge>
        ) : (
          <Badge variant="success">All search crawlers allowed</Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Evaluated against <span className="font-mono">{path}</span>. Blocking a
        training crawler is a content decision; blocking a search crawler costs
        you citations and traffic.
      </p>

      <div className="mt-4 space-y-3">
        {(["search", "assistant", "training"] as CrawlerPurpose[]).map(
          (purpose) => {
            const rows = byPurpose[purpose]
            if (!rows.length) return null
            const blocked = rows.filter((r) => !r.allowed).length
            return (
              <Disclosure
                key={purpose}
                defaultOpen={purpose === "search"}
                contentClassName="divide-y"
                trigger={
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium">
                      {PURPOSE_LABELS[purpose]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {rows.length} crawler{rows.length === 1 ? "" : "s"}
                    </span>
                    {blocked > 0 && (
                      <span className="text-xs text-danger">
                        {blocked} blocked
                      </span>
                    )}
                  </span>
                }
              >
                <p className="py-3 text-xs text-muted-foreground">
                  {PURPOSE_HINTS[purpose]}
                </p>
                {rows.map(({ crawler, allowed }) => (
                  <CrawlerRow
                    key={crawler.name}
                    crawler={crawler}
                    allowed={allowed}
                  />
                ))}
              </Disclosure>
            )
          }
        )}
      </div>
    </section>
  )
}

/* ──────────────────────────── Groups & issues ──────────────────────────── */

export function RobotsGroups({ parsed }: { parsed: RobotsParsed }) {
  if (parsed.groups.length === 0) return null

  return (
    <section>
      <h2 className="text-subhead font-semibold">Rule groups</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {parsed.groups.length} group
        {parsed.groups.length === 1 ? "" : "s"} parsed from the file.
      </p>
      <div className="mt-4 space-y-2">
        {parsed.groups.map((group, i) => {
          const disallows = group.rules.filter((r) => r.type === "disallow")
          const allows = group.rules.filter((r) => r.type === "allow")
          return (
            <Disclosure
              key={`${group.startLine}-${i}`}
              contentClassName="py-2"
              trigger={
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="truncate font-mono text-sm">
                    {group.agents.join(", ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {disallows.length} disallow · {allows.length} allow
                    {group.crawlDelay !== undefined
                      ? ` · crawl-delay ${group.crawlDelay}`
                      : ""}
                  </span>
                </span>
              }
            >
              {group.rules.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                  No rules — this group allows everything.
                </p>
              ) : (
                <ul className="space-y-1 py-1">
                  {group.rules.map((rule) => (
                    <li
                      key={`${rule.line}-${rule.pattern}`}
                      className="flex items-baseline gap-2 font-mono text-xs"
                    >
                      <span className="w-8 shrink-0 text-right text-muted-foreground/60 tabular">
                        {rule.line}
                      </span>
                      <span
                        className={
                          rule.type === "allow" ? "text-success" : "text-danger"
                        }
                      >
                        {rule.type === "allow" ? "Allow:" : "Disallow:"}
                      </span>
                      <span className="break-all">{rule.pattern}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Disclosure>
          )
        })}
      </div>
    </section>
  )
}

export function RobotsIssues({ issues }: { issues: RobotsIssue[] }) {
  if (issues.length === 0) {
    return (
      <section>
        <h2 className="text-subhead font-semibold">Syntax</h2>
        <p className="mt-3 flex items-center gap-2 rounded-lg border bg-success-subtle px-4 py-3 text-sm text-success">
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          No syntax problems found.
        </p>
      </section>
    )
  }

  const errors = issues.filter((i) => i.level === "error").length

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-subhead font-semibold">Syntax</h2>
        <Badge variant={errors > 0 ? "danger" : "warning"}>
          {issues.length} issue{issues.length === 1 ? "" : "s"}
        </Badge>
      </div>
      <ul className="mt-4 divide-y rounded-lg border">
        {issues.map((issue, i) => (
          <li key={`${issue.line}-${i}`} className="flex gap-3 px-4 py-3">
            <AlertTriangle
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                issue.level === "error" ? "text-danger" : "text-warning"
              )}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-sm">{issue.message}</p>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                line {issue.line}: {issue.raw}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
