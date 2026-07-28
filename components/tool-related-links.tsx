import Container from "@/components/container"
import type { FeatureKey } from "@/lib/site"
import { blogPath, features } from "@/lib/site"
import Link from "next/link"

type ToolRelatedLinksProps = {
  feature: FeatureKey
}

const linkClass =
  "rounded-sm underline underline-offset-2 transition-colors duration-[var(--duration-fast)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

/** Light “Learn more / Guide” strip for interactive tool pages */
export default function ToolRelatedLinks({ feature }: ToolRelatedLinksProps) {
  const f = features[feature]

  return (
    <Container width="reading" className="mt-14">
      <nav
        aria-label="Related resources"
        className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-t pt-6 text-sm text-muted-foreground"
      >
        <Link href={f.landingPath} className={linkClass}>
          {f.landingLabel}
        </Link>
        <Link href={blogPath(f.blogSlug)} className={linkClass}>
          {f.blogLabel}
        </Link>
        <Link href="/" className={linkClass}>
          Home
        </Link>
      </nav>
    </Container>
  )
}
