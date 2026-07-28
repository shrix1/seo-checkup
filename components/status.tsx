import type { CheckStatus } from "@/lib/audit/types"
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react"

/**
 * Single source of truth for pass / warn / fail presentation.
 * The status triad is the only place saturated colour is allowed —
 * the brand accent never uses these tokens. `info` stays deliberately
 * neutral so an ungraded finding never reads as a result.
 */
const tones = {
  pass: {
    text: "text-success",
    bg: "bg-success-subtle",
    dot: "bg-success",
    ring: "ring-success/25",
    Icon: CheckCircle2,
    label: "Pass",
  },
  warn: {
    text: "text-warning",
    bg: "bg-warning-subtle",
    dot: "bg-warning",
    ring: "ring-warning/25",
    Icon: AlertTriangle,
    label: "Warn",
  },
  fail: {
    text: "text-danger",
    bg: "bg-danger-subtle",
    dot: "bg-danger",
    ring: "ring-danger/25",
    Icon: XCircle,
    label: "Fail",
  },
  info: {
    text: "text-muted-foreground",
    bg: "bg-surface-2",
    dot: "bg-muted-foreground",
    ring: "ring-border-strong",
    Icon: Info,
    label: "Info",
  },
} as const

export function statusTone(status: CheckStatus) {
  return tones[status]
}

export function StatusIcon({
  status,
  className,
}: {
  status: CheckStatus
  className?: string
}) {
  const { Icon, text } = tones[status]
  return <Icon className={cn("h-4 w-4 shrink-0", text, className)} aria-hidden />
}

/** Fixed-width gutter marker so long check lists align into one scannable column */
export function StatusDot({
  status,
  className,
}: {
  status: CheckStatus
  className?: string
}) {
  const { dot, bg } = tones[status]
  return (
    <span
      className={cn(
        "grid h-5 w-5 shrink-0 place-items-center rounded-full",
        bg,
        className
      )}
      aria-hidden
    >
      <span className={cn("h-2 w-2 rounded-full", dot)} />
    </span>
  )
}

export function StatusChip({
  status,
  count,
  className,
}: {
  status: CheckStatus
  count: number
  className?: string
}) {
  const { Icon, text, bg, label } = tones[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
        bg,
        text,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="tabular">{count}</span>
      <span className="opacity-80">{label.toLowerCase()}</span>
    </span>
  )
}

/** Compact count-only variant for dense rows (category headers) */
export function StatusCount({
  status,
  count,
  className,
}: {
  status: CheckStatus
  count: number
  className?: string
}) {
  const { Icon, text } = tones[status]
  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs", text, className)}
      title={`${count} ${tones[status].label.toLowerCase()}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span className="tabular">{count}</span>
    </span>
  )
}
