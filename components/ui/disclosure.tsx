"use client"

import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { useId, useState, type ReactNode } from "react"

/**
 * Hand-rolled accordion. Generalizes the `openCats` pattern that lived inline
 * in audit-client.tsx so FAQs, category sections, and the sitemap tree share
 * one behaviour without pulling in another Radix package.
 */
export default function Disclosure({
  trigger,
  children,
  defaultOpen = false,
  className,
  triggerClassName,
  contentClassName,
}: {
  trigger: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          triggerClassName
        )}
      >
        <span className="min-w-0 flex-1">{trigger}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out)]",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div
          id={id}
          className={cn(
            "animate-in fade-in-0 border-t bg-surface-1 px-4",
            contentClassName
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}
