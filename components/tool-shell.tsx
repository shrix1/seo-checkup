import Container, { type ContainerWidth } from "@/components/container"
import { FadeIn } from "@/components/motion"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

/**
 * Shared chrome for the five interactive tool pages. Replaces the gradient
 * icon blob that was duplicated byte-for-byte across all five tool page shells,
 * and gives each tool a real h1 (they previously topped out at h2).
 */
export default function ToolShell({
  icon: Icon,
  title,
  description,
  width = "reading",
  children,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  width?: ContainerWidth
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("pb-20 pt-10 sm:pt-14", className)}>
      <Container width={width}>
        <FadeIn className="flex flex-col items-center text-center">
          <span className="grid h-10 w-10 place-items-center rounded-lg border bg-surface-1 text-muted-foreground">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <h1 className="mt-4 text-heading font-semibold sm:text-title">
            {title}
          </h1>
          <p className="mt-2 max-w-md text-body text-muted-foreground">
            {description}
          </p>
        </FadeIn>
      </Container>
      {children}
    </div>
  )
}
