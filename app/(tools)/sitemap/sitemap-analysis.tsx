"use client"

import { StatusDot } from "@/components/status"
import type { CheckStatus } from "@/lib/audit/types"
import {
  SITEMAP_URL_LIMIT,
  type SitemapEntry,
  type SitemapValidation,
} from "@/lib/sitemap-types"
import { cn } from "@/lib/utils"
import { AlertTriangle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"

const MAX_TABLE_ROWS = 250

type Finding = {
  status: CheckStatus
  label: string
  detail: string
}

function buildFindings(validation: SitemapValidation): Finding[] {
  const v = validation
  const findings: Finding[] = []

  findings.push({
    status: "pass",
    label: `${v.totalUrls.toLocaleString()} unique URLs`,
    detail:
      v.duplicates > 0
        ? `${v.duplicates.toLocaleString()} duplicate entr${v.duplicates === 1 ? "y was" : "ies were"} collapsed`
        : "No duplicate entries",
  })

  if (v.duplicates > 0) {
    findings.push({
      status: "warn",
      label: `${v.duplicates.toLocaleString()} duplicate URLs`,
      detail:
        "The same URL is declared more than once, which wastes crawl budget.",
    })
  }

  if (v.overUrlLimit.length > 0) {
    findings.push({
      status: "fail",
      label: `${v.overUrlLimit.length} file(s) over the ${SITEMAP_URL_LIMIT.toLocaleString()} URL limit`,
      detail:
        "The sitemap protocol caps a single file at 50,000 URLs. Split it and use a sitemap index.",
    })
  }

  if (v.crossHost > 0) {
    findings.push({
      status: "fail",
      label: `${v.crossHost.toLocaleString()} URLs on another host`,
      detail:
        "A sitemap may only list URLs on the same host that serves it. Cross-host entries are ignored.",
    })
  }

  if (v.nonHttps > 0) {
    findings.push({
      status: "warn",
      label: `${v.nonHttps.toLocaleString()} URLs are http://`,
      detail: "List the HTTPS version of every URL you want indexed.",
    })
  }

  // lastmod
  if (v.totalUrls > 0) {
    const coverage = Math.round((v.lastmodPresent / v.totalUrls) * 100)
    if (v.lastmodPresent === 0) {
      findings.push({
        status: "warn",
        label: "No lastmod dates",
        detail:
          "Crawlers use lastmod to decide what to re-fetch. Without it, every URL looks equally stale.",
      })
    } else if (v.allSameLastmod) {
      findings.push({
        status: "warn",
        label: `Every lastmod is ${v.allSameLastmod}`,
        detail:
          "A single shared date usually means the CMS writes build time, not content-change time. Crawlers learn to ignore it.",
      })
    } else if (coverage < 100) {
      findings.push({
        status: "warn",
        label: `lastmod on ${coverage}% of URLs`,
        detail: `${(v.totalUrls - v.lastmodPresent).toLocaleString()} URLs have no lastmod.`,
      })
    } else {
      findings.push({
        status: "pass",
        label: "lastmod on every URL",
        detail: "Crawlers can tell which pages actually changed.",
      })
    }
  }

  if (v.lastmodInvalid > 0) {
    findings.push({
      status: "fail",
      label: `${v.lastmodInvalid.toLocaleString()} invalid lastmod values`,
      detail:
        "lastmod must be W3C Datetime, e.g. 2026-07-28 or 2026-07-28T14:30:00+00:00.",
    })
  }

  if (v.lastmodFuture > 0) {
    findings.push({
      status: "warn",
      label: `${v.lastmodFuture.toLocaleString()} lastmod dates in the future`,
      detail: "Future dates are treated as untrustworthy and usually ignored.",
    })
  }

  if (v.priorityInvalid > 0) {
    findings.push({
      status: "warn",
      label: `${v.priorityInvalid.toLocaleString()} invalid priority values`,
      detail: "priority must be a number between 0.0 and 1.0.",
    })
  }

  if (v.changefreqInvalid > 0) {
    findings.push({
      status: "warn",
      label: `${v.changefreqInvalid.toLocaleString()} invalid changefreq values`,
      detail:
        "changefreq must be always, hourly, daily, weekly, monthly, yearly or never.",
    })
  }

  return findings
}

/**
 * Shown when auto-discovery came up empty. Rather than a bare error, it says
 * exactly where we looked and asks for the real URL, since the person running
 * the tool usually knows it.
 */
export function SitemapNotFound({
  requested,
  tried,
  robotsHref,
}: {
  requested: string
  tried: { url: string; reason: string }[]
  robotsHref: string
}) {
  return (
    <section className="mt-8 rounded-lg border border-warning/40 bg-warning-subtle/40">
      <div className="flex gap-3 border-b border-warning/30 px-4 py-3.5">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-warning"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="text-sm font-medium">
            No sitemap found for {requested}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            We read robots.txt and tried the usual paths. If you know the real
            URL, paste it in the field above — something like{" "}
            <span className="font-mono">yoursite.com/sitemap.xml</span> or{" "}
            <span className="font-mono">yoursite.com/sitemap_index.xml</span>.
          </p>
        </div>
      </div>

      {tried.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-label font-medium uppercase text-muted-foreground">
            Where we looked
          </p>
          <ul className="mt-2 space-y-1">
            {tried.map((t) => (
              <li
                key={t.url}
                className="flex flex-wrap items-baseline gap-x-2 text-xs"
              >
                <span className="break-all font-mono text-muted-foreground">
                  {t.url.replace(/^https?:\/\//, "")}
                </span>
                <span className="text-muted-foreground/70">— {t.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-warning/30 px-4 py-3 text-sm">
        <Link
          href={robotsHref}
          className="inline-flex items-center gap-1.5 text-link underline underline-offset-2"
        >
          Check whether robots.txt declares one
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  )
}

export function SitemapValidationPanel({
  validation,
}: {
  validation: SitemapValidation
}) {
  const findings = useMemo(() => buildFindings(validation), [validation])
  const problems = findings.filter((f) => f.status !== "pass").length

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-subhead font-semibold">Validation</h2>
        <span className="text-sm text-muted-foreground">
          {problems === 0
            ? "No problems found"
            : `${problems} thing${problems === 1 ? "" : "s"} to look at`}
        </span>
      </div>
      <ul className="mt-4 divide-y rounded-lg border">
        {findings.map((finding) => (
          <li key={finding.label} className="flex gap-3 px-4 py-3">
            <StatusDot status={finding.status} className="mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium">{finding.label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {finding.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

const LASTMOD_RE =
  /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/

export function SitemapTable({
  entries,
  baseUrl,
}: {
  entries: SitemapEntry[]
  baseUrl: string
}) {
  const rows = entries.slice(0, MAX_TABLE_ROWS)
  const hasMeta = entries.some(
    (e) => e.lastmod || e.changefreq || e.priority !== undefined
  )

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[38rem] text-left text-sm">
          <thead className="border-b bg-surface-1">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                URL
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                lastmod
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                changefreq
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                priority
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((entry) => {
              const path = entry.loc.startsWith(baseUrl)
                ? entry.loc.slice(baseUrl.length) || "/"
                : entry.loc
              const badLastmod = entry.lastmod
                ? !LASTMOD_RE.test(entry.lastmod)
                : false
              const priorityNum =
                entry.priority !== undefined ? Number(entry.priority) : null
              const badPriority =
                priorityNum !== null &&
                (!Number.isFinite(priorityNum) ||
                  priorityNum < 0 ||
                  priorityNum > 1)
              return (
                <tr key={entry.loc} className="align-top">
                  <td className="max-w-0 px-3 py-2">
                    <a
                      href={entry.loc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block truncate font-mono text-xs transition-colors hover:text-foreground"
                      title={entry.loc}
                    >
                      {path}
                    </a>
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-3 py-2 font-mono text-xs",
                      badLastmod ? "text-danger" : "text-muted-foreground"
                    )}
                  >
                    {entry.lastmod || "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-muted-foreground">
                    {entry.changefreq || "—"}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-3 py-2 text-right font-mono text-xs tabular",
                      badPriority ? "text-danger" : "text-muted-foreground"
                    )}
                  >
                    {entry.priority ?? "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {entries.length > MAX_TABLE_ROWS
          ? `Showing the first ${MAX_TABLE_ROWS.toLocaleString()} of ${entries.length.toLocaleString()} URLs. Use Copy URLs for the full list.`
          : `${entries.length.toLocaleString()} URL${entries.length === 1 ? "" : "s"}.`}
        {!hasMeta &&
          " This sitemap declares no lastmod, changefreq or priority values."}
      </p>
    </div>
  )
}
