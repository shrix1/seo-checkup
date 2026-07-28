import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

const widths = {
  /** Full page sections — home, blog index */
  page: "max-w-6xl",
  /** Reading measure — audit report, landings, articles */
  reading: "max-w-3xl",
  /** Single-input tools — domain rating, robots */
  narrow: "max-w-xl",
} as const

export type ContainerWidth = keyof typeof widths

export default function Container({
  width = "page",
  className,
  children,
}: {
  width?: ContainerWidth
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6", widths[width], className)}>
      {children}
    </div>
  )
}

export { widths }
