"use client"

import { cn } from "@/lib/utils"
import { useReducedMotion } from "framer-motion"
import { useEffect, useMemo, useState, type ReactNode } from "react"

export type TocTone = "danger" | "warning" | "muted"

export type TocItem = {
  /** id of the element to scroll to */
  id: string
  label: string
  badge?: { text: string; tone: TocTone }
}

const TONE: Record<TocTone, string> = {
  danger: "bg-danger-subtle text-danger",
  warning: "bg-warning-subtle text-warning",
  muted: "bg-surface-2 text-muted-foreground",
}

/**
 * Highlights whichever section is nearest the top of the viewport.
 * The observer band starts below the sticky header and ends before the fold so
 * exactly one section is "current" while scrolling.
 */
function useScrollSpy(ids: string[]): string | null {
  const key = ids.join("|")
  const stableIds = useMemo(() => (key ? key.split("|") : []), [key])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const elements = stableIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) return

    const visible = new Map<string, boolean>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target.id, entry.isIntersecting)
        }
        const firstVisible = stableIds.find((id) => visible.get(id))
        // Keep the last known section when scrolling through a tall block.
        if (firstVisible) setActiveId(firstVisible)
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [stableIds])

  return activeId ?? stableIds[0] ?? null
}

/**
 * Floats the contents rail into the empty margin beside a centred column,
 * so the content itself stays exactly where it was. Needs a `relative`
 * ancestor sized to the scrollable content.
 */
export function TocRail({
  items,
  title,
  footer,
}: {
  items: TocItem[]
  title?: string
  /** Rendered under the contents list — used for page-level actions */
  footer?: ReactNode
}) {
  if (items.length === 0 && !footer) return null
  return (
    <div className="absolute left-full top-0 hidden h-full pl-6 xl:block">
      <div className="sticky top-28 w-52">
        <Toc items={items} title={title} />
        {footer && <div className="mt-6 border-t pt-6">{footer}</div>}
      </div>
    </div>
  )
}

export default function Toc({
  items,
  title = "On this page",
  className,
}: {
  items: TocItem[]
  title?: string
  className?: string
}) {
  const ids = useMemo(() => items.map((i) => i.id), [items])
  const activeId = useScrollSpy(ids)
  const reduceMotion = useReducedMotion()

  if (items.length === 0) return null

  return (
    <nav aria-label={title} className={className}>
      <p className="text-label font-medium uppercase text-muted-foreground">
        {title}
      </p>
      <ul className="mt-3 border-l">
        {items.map((item) => {
          const active = item.id === activeId
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active ? "location" : undefined}
                onClick={(e) => {
                  const target = document.getElementById(item.id)
                  if (!target) return
                  e.preventDefault()
                  target.scrollIntoView({
                    behavior: reduceMotion ? "auto" : "smooth",
                    block: "start",
                  })
                  // Update the hash without letting the browser jump again.
                  window.history.replaceState(null, "", `#${item.id}`)
                }}
                className={cn(
                  "-ml-px flex items-center gap-2 border-l py-1.5 pl-3 text-sm transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary font-medium text-primary"
                    : "border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground"
                )}
              >
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[0.6875rem] font-medium tabular",
                      TONE[item.badge.tone]
                    )}
                  >
                    {item.badge.text}
                  </span>
                )}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
