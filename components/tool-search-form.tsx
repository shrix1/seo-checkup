"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader } from "lucide-react"
import type { FormEvent } from "react"

/**
 * The controlled search control shared by all five tools. Previously each tool
 * rolled its own — three of them used an inverted `bg-black dark:bg-white`
 * input that contradicted every other field in the app.
 */
export default function ToolSearchForm({
  value,
  onChange,
  onSubmit,
  placeholder = "https://example.com",
  ariaLabel,
  loading = false,
  buttonLabel = "Check",
  loadingLabel = "Checking…",
  autoFocus = false,
  className,
}: {
  value: string
  onChange: (next: string) => void
  onSubmit: (e: FormEvent) => void
  placeholder?: string
  ariaLabel: string
  loading?: boolean
  buttonLabel?: string
  loadingLabel?: string
  autoFocus?: boolean
  className?: string
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex w-full flex-col gap-2",
        "sm:flex-row sm:items-center sm:gap-0 sm:rounded-lg sm:border sm:bg-background sm:p-1 sm:transition-colors sm:focus-within:border-ring sm:focus-within:ring-2 sm:focus-within:ring-ring/25",
        className
      )}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        inputMode="url"
        autoComplete="url"
        spellCheck={false}
        autoFocus={autoFocus}
        className="h-12 w-full min-w-0 rounded-lg border border-input bg-background px-4 font-mono text-base transition-colors placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 sm:h-10 sm:rounded-md sm:border-transparent sm:bg-transparent sm:text-sm sm:focus-visible:border-transparent sm:focus-visible:ring-0"
      />
      <Button
        type="submit"
        size="xl"
        disabled={loading}
        className="shrink-0 sm:h-10 sm:px-5"
      >
        {loading ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            {loadingLabel}
          </>
        ) : (
          buttonLabel
        )}
      </Button>
    </form>
  )
}

/** Consistent inline error surface — replaces the alert() calls and the
 *  teal "Try Again" box that the older tools used. */
export function ToolError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-6 rounded-lg border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger"
    >
      {children}
    </p>
  )
}

/** "Try <example>" helper line under the search control */
export function ToolExample({
  url,
  onPick,
}: {
  url: string
  onPick: () => void
}) {
  return (
    <p className="mt-2 text-xs text-muted-foreground">
      Try{" "}
      <button
        type="button"
        onClick={onPick}
        className="rounded-sm font-mono underline underline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {url}
      </button>
    </p>
  )
}
