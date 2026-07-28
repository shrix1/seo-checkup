/**
 * Core Web Vitals via the PageSpeed Insights API.
 *
 * Two kinds of number come back and they are not interchangeable:
 *
 * - **Field** data is real Chrome telemetry from the last 28 days (CrUX). This
 *   is what Google actually uses as a ranking signal, and it only exists for
 *   origins with enough traffic to be sampled.
 * - **Lab** data is one simulated Lighthouse run on Google's hardware. Useful
 *   for diagnosis, but it is not the ranking signal and a single run is noisy.
 *
 * Every check reports which one it used, because telling somebody their LCP is
 * fine based on a lab run when Google is grading them on field data would be
 * worse than saying nothing.
 */

import type { AuditCheck, CategoryScore, CheckStatus } from "@/lib/audit/types"

const ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"

/** PSI regularly takes 15-30s, so give it real headroom. */
const TIMEOUT_MS = 60_000

export type PageSpeedStrategy = "mobile" | "desktop"

export type PageSpeedResult =
  | { ok: true; category: CategoryScore; strategy: PageSpeedStrategy }
  | { ok: false; reason: "unconfigured" | "error"; message: string }

/**
 * Web Vitals thresholds. Good / needs-improvement boundaries are Google's
 * published numbers — do not tune these to make scores look better.
 */
const THRESHOLDS = {
  lcp: { good: 2500, poor: 4000, unit: "ms" },
  inp: { good: 200, poor: 500, unit: "ms" },
  cls: { good: 0.1, poor: 0.25, unit: "" },
  fcp: { good: 1800, poor: 3000, unit: "ms" },
  ttfb: { good: 800, poor: 1800, unit: "ms" },
  tbt: { good: 200, poor: 600, unit: "ms" },
} as const

type MetricKey = keyof typeof THRESHOLDS

function rate(key: MetricKey, value: number): CheckStatus {
  const t = THRESHOLDS[key]
  if (value <= t.good) return "pass"
  if (value <= t.poor) return "warn"
  return "fail"
}

function fmt(key: MetricKey, value: number): string {
  if (key === "cls") return value.toFixed(3)
  return value >= 1000
    ? `${(value / 1000).toFixed(2)} s`
    : `${Math.round(value)} ms`
}

/** CrUX reports CLS percentiles as an integer scaled by 100. */
function normalizeFieldValue(key: MetricKey, percentile: number): number {
  return key === "cls" ? percentile / 100 : percentile
}

const FIELD_METRIC_IDS: Partial<Record<MetricKey, string>> = {
  lcp: "LARGEST_CONTENTFUL_PAINT_MS",
  inp: "INTERACTION_TO_NEXT_PAINT",
  cls: "CUMULATIVE_LAYOUT_SHIFT_SCORE",
  fcp: "FIRST_CONTENTFUL_PAINT_MS",
  ttfb: "EXPERIMENTAL_TIME_TO_FIRST_BYTE",
}

const LAB_AUDIT_IDS: Partial<Record<MetricKey, string>> = {
  lcp: "largest-contentful-paint",
  cls: "cumulative-layout-shift",
  fcp: "first-contentful-paint",
  tbt: "total-blocking-time",
  ttfb: "server-response-time",
}

const LABELS: Record<MetricKey, string> = {
  lcp: "Largest Contentful Paint",
  inp: "Interaction to Next Paint",
  cls: "Cumulative Layout Shift",
  fcp: "First Contentful Paint",
  ttfb: "Time to First Byte",
  tbt: "Total Blocking Time",
}

const WHAT_IT_MEANS: Record<MetricKey, string> = {
  lcp: "How long until the biggest thing on screen finishes rendering.",
  inp: "How sluggish the page feels when someone taps or clicks.",
  cls: "How much the layout jumps around while loading.",
  fcp: "How long until anything at all appears.",
  ttfb: "How long the server takes to send the first byte.",
  tbt: "How long the main thread was blocked and unable to respond.",
}

const FIX_HINTS: Record<MetricKey, string> = {
  lcp: "Preload the hero image or font, serve images in AVIF/WebP at the displayed size, and cut render-blocking CSS.",
  inp: "Break up long JavaScript tasks, defer non-critical work, and avoid heavy work in event handlers.",
  cls: "Set explicit width and height on images and embeds, and reserve space for anything injected after load.",
  fcp: "Reduce render-blocking resources and get the server responding faster.",
  ttfb: "Cache at the edge, and avoid uncached database work on the critical path.",
  tbt: "Ship less JavaScript, code-split, and move heavy work off the main thread.",
}

function scoreCategory(checks: AuditCheck[]): {
  score: number
  pass: number
  warn: number
  fail: number
  info: number
} {
  let pass = 0,
    warn = 0,
    fail = 0,
    info = 0,
    points = 0,
    max = 0
  for (const c of checks) {
    if (c.status === "info") {
      info += 1
      continue
    }
    max += 2
    if (c.status === "pass") {
      pass += 1
      points += 2
    } else if (c.status === "warn") {
      warn += 1
      points += 1
    } else {
      fail += 1
    }
  }
  return {
    score: max === 0 ? 0 : Math.round((points / max) * 100),
    pass,
    warn,
    fail,
    info,
  }
}

export function isPageSpeedConfigured(): boolean {
  return Boolean(process.env.PAGESPEED_API_KEY)
}

export async function fetchPageSpeed(
  url: string,
  strategy: PageSpeedStrategy = "mobile"
): Promise<PageSpeedResult> {
  const key = process.env.PAGESPEED_API_KEY
  if (!key) {
    return {
      ok: false,
      reason: "unconfigured",
      message:
        "PAGESPEED_API_KEY is not set, so Core Web Vitals were skipped. Everything else in the report still ran.",
    }
  }

  const endpoint = new URL(ENDPOINT)
  endpoint.searchParams.set("url", url)
  endpoint.searchParams.set("category", "performance")
  endpoint.searchParams.set("strategy", strategy)
  endpoint.searchParams.set("key", key)

  let payload: PageSpeedJson
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(endpoint, { signal: controller.signal })
    clearTimeout(timer)
    payload = (await res.json()) as PageSpeedJson
    if (!res.ok || payload.error) {
      return {
        ok: false,
        reason: "error",
        message:
          payload.error?.message ?? `PageSpeed Insights returned ${res.status}`,
      }
    }
  } catch (err) {
    return {
      ok: false,
      reason: "error",
      message:
        err instanceof Error && err.name === "AbortError"
          ? "PageSpeed Insights timed out"
          : "Could not reach PageSpeed Insights",
    }
  }

  const checks = buildChecks(payload, strategy)
  const stats = scoreCategory(checks)

  return {
    ok: true,
    strategy,
    category: {
      id: "performance",
      label: "Speed (Core Web Vitals)",
      ...stats,
      checks,
    },
  }
}

function buildChecks(
  payload: PageSpeedJson,
  strategy: PageSpeedStrategy
): AuditCheck[] {
  const checks: AuditCheck[] = []
  const field = payload.loadingExperience?.metrics
  const hasField = Boolean(field && Object.keys(field).length > 0)
  const audits = payload.lighthouseResult?.audits ?? {}

  /**
   * Field data wins wherever CrUX has it — including for FCP and TTFB, not
   * just the three Core Web Vitals. Lab and field can disagree enormously:
   * vercel.com returns a 12ms lab TTFB against 893ms in the field, because the
   * lab run hits a warm edge cache and real users do not. Showing the lab
   * number there would have said "excellent" about a metric Google rates
   * "average".
   */
  const emit = (
    key: MetricKey,
    idPrefix: string,
    isRankingSignal: boolean
  ): void => {
    const fieldId = FIELD_METRIC_IDS[key]
    const fieldMetric = fieldId ? field?.[fieldId] : undefined

    if (fieldMetric && typeof fieldMetric.percentile === "number") {
      const value = normalizeFieldValue(key, fieldMetric.percentile)
      checks.push({
        id: `${idPrefix}-${key}`,
        category: "performance",
        label: LABELS[key],
        status: rate(key, value),
        value: `${fmt(key, value)} · field (75th percentile)`,
        detail: `${WHAT_IT_MEANS[key]} Real Chrome users over the last 28 days${
          isRankingSignal ? " — this is the number Google ranks on." : "."
        }`,
        fixHint: FIX_HINTS[key],
      })
      return
    }

    const labId = LAB_AUDIT_IDS[key]
    const labValue = labId ? audits[labId]?.numericValue : undefined
    if (typeof labValue === "number") {
      checks.push({
        id: `${idPrefix}-${key}`,
        category: "performance",
        label: LABELS[key],
        status: rate(key, labValue),
        value: `${fmt(key, labValue)} · lab simulation`,
        detail: `${WHAT_IT_MEANS[key]} No field data for this URL, so this is one simulated ${strategy} run — diagnostic only${
          isRankingSignal ? ", not what Google ranks on" : ""
        }.`,
        fixHint: FIX_HINTS[key],
      })
      return
    }

    // INP has no lab equivalent. Say so rather than substituting a different
    // metric and labelling it INP.
    checks.push({
      id: `${idPrefix}-${key}`,
      category: "performance",
      label: LABELS[key],
      status: "info",
      value: "(no data)",
      detail:
        key === "inp"
          ? "INP is only measurable from real user interactions, and this origin has too little traffic to appear in the Chrome UX Report."
          : "Neither field nor lab data was available for this metric.",
      fixHint:
        key === "inp"
          ? "Nothing to fix — this needs enough real Chrome traffic to be sampled. Total Blocking Time below is the closest lab proxy."
          : "Nothing to fix — the data was simply unavailable for this URL.",
    })
  }

  // The three Google ranks on.
  for (const key of ["lcp", "inp", "cls"] as const) emit(key, "cwv", true)

  // Supporting metrics. FCP and TTFB exist in CrUX too, so they get the same
  // field-first treatment; TBT is lab-only by definition.
  for (const key of ["fcp", "ttfb"] as const) emit(key, "perf", false)

  const tbt = audits[LAB_AUDIT_IDS.tbt!]?.numericValue
  if (typeof tbt === "number") {
    checks.push({
      id: "perf-tbt",
      category: "performance",
      label: LABELS.tbt,
      status: rate("tbt", tbt),
      value: `${fmt("tbt", tbt)} · lab`,
      detail: `${WHAT_IT_MEANS.tbt} Lab-only by definition — there is no field equivalent, but it is the closest proxy for INP.`,
      fixHint: FIX_HINTS.tbt,
    })
  }

  const perfScore = payload.lighthouseResult?.categories?.performance?.score
  if (typeof perfScore === "number") {
    checks.push({
      id: "perf-score",
      category: "performance",
      label: "Lighthouse performance score",
      // Reported, not graded: it is a weighted blend of the lab metrics
      // already listed above, so scoring it would double-count them.
      status: "info",
      value: `${Math.round(perfScore * 100)}/100 · lab (${strategy})`,
      detail: hasField
        ? "A weighted blend of the lab metrics. Shown for reference — the field numbers above are what Google ranks on."
        : "A weighted blend of the lab metrics from a single simulated run. Treat it as a smoke test, not a target.",
      fixHint:
        "Chasing this number is a trap. Fix the individual metrics above and it follows.",
    })
  }

  return checks
}

/* Only the slice of the PSI response this module reads. */
type PageSpeedJson = {
  error?: { message?: string }
  loadingExperience?: {
    overall_category?: string
    metrics?: Record<string, { percentile?: number; category?: string }>
  }
  lighthouseResult?: {
    categories?: { performance?: { score?: number } }
    audits?: Record<string, { numericValue?: number; displayValue?: string }>
  }
}
