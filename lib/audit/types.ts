/**
 * `info` is deliberately not a grade. Some findings are worth reporting but
 * have no defensible right answer — absence is not a defect — so they are
 * excluded from scoring entirely rather than being scored as a soft warning.
 */
export type CheckStatus = "pass" | "warn" | "fail" | "info"

export type AuditCategoryId =
  | "onpage"
  | "crawl"
  | "trust"
  | "ai"
  | "aeo"
  /**
   * Loaded separately from the rest of the report: PageSpeed Insights takes
   * 15-30s, so it streams in after the audit rather than holding it up.
   */
  | "performance"

export type AuditCheck = {
  id: string
  category: AuditCategoryId
  label: string
  status: CheckStatus
  value?: string
  detail: string
  fixHint: string
  deepLink?: string
}

export type CategoryScore = {
  id: AuditCategoryId
  label: string
  score: number
  pass: number
  warn: number
  fail: number
  info: number
  checks: AuditCheck[]
}

export type AuditReport = {
  inputUrl: string
  origin: string
  /** The exact URL that was audited for page-level checks */
  pageUrl: string
  /** True when the audited URL is the site root */
  isHomepage: boolean
  finalUrl: string
  domain: string
  auditedAt: string
  score: number
  pass: number
  warn: number
  fail: number
  info: number
  categories: CategoryScore[]
  fixFirst: AuditCheck[]
  domainRating: number | null
  domainRatingError?: string
}
