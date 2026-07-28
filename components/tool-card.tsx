import { cn } from "@/lib/utils"
import { ArrowRight, type LucideIcon } from "lucide-react"
import Link from "next/link"

/**
 * Restrained tool tile: hairline border, surface lift on hover, one arrow.
 * Replaces the previous card that stacked a hover colour-inversion, a 12-streak
 * meteor shower, and a gradient "Try Now" pseudo-button on top of each other.
 */
export default function ToolCard({
  icon: Icon,
  title,
  content,
  link,
  className,
}: {
  icon: LucideIcon
  title: string
  content: string
  link: string
  className?: string
}) {
  return (
    <Link
      href={link}
      className={cn(
        "group flex h-full flex-col rounded-lg border bg-background p-5 transition-colors duration-[var(--duration-normal)] ease-[var(--ease-out)] hover:border-border-strong hover:bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <span className="grid h-9 w-9 place-items-center rounded-md border bg-surface-1 text-muted-foreground transition-colors group-hover:text-primary">
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <h3 className="mt-4 text-subhead font-semibold">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{content}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        Open
        <ArrowRight
          className="h-4 w-4 transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out)] group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  )
}
