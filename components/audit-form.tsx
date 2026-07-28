"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return trimmed
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

/**
 * The one URL field, shared by the home hero and every PSEO landing.
 * Input and button are joined into a single focus surface on sm+ and stack
 * on mobile, so the control never renders as a 36px input beside a 40px button.
 */
export default function AuditForm({
  toolPath = "/audit",
  defaultValue = "",
  placeholder = "https://example.com",
  buttonLabel = "Run free audit",
  ariaLabel = "URL to check",
  className,
}: {
  toolPath?: string
  defaultValue?: string
  placeholder?: string
  buttonLabel?: string
  ariaLabel?: string
  className?: string
}) {
  const router = useRouter()
  const [url, setUrl] = useState(defaultValue)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const q = normalizeUrl(url) || placeholder
        router.push(`${toolPath}?q=${encodeURIComponent(q)}`)
      }}
      className={cn(
        "flex w-full flex-col gap-2",
        "sm:flex-row sm:items-center sm:gap-0 sm:rounded-lg sm:border sm:bg-background sm:p-1 sm:transition-colors sm:focus-within:border-ring sm:focus-within:ring-2 sm:focus-within:ring-ring/25",
        className
      )}
    >
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        inputMode="url"
        autoComplete="url"
        spellCheck={false}
        className="h-12 w-full min-w-0 rounded-lg border border-input bg-background px-4 font-mono text-base transition-colors placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 sm:h-10 sm:rounded-md sm:border-transparent sm:bg-transparent sm:text-sm sm:focus-visible:border-transparent sm:focus-visible:ring-0"
      />
      <Button type="submit" size="xl" className="shrink-0 sm:h-10 sm:px-5">
        {buttonLabel}
      </Button>
    </form>
  )
}
