export type CheckStatus = "pass" | "warn" | "fail"

export type AuditCategoryId = "onpage" | "crawl" | "trust"

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
  checks: AuditCheck[]
}

export type AuditReport = {
  inputUrl: string
  origin: string
  finalUrl: string
  domain: string
  auditedAt: string
  score: number
  pass: number
  warn: number
  fail: number
  categories: CategoryScore[]
  fixFirst: AuditCheck[]
  domainRating: number | null
  domainRatingError?: string
}
