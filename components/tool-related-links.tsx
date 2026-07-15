import type { FeatureKey } from "@/lib/site"
import { blogPath, features } from "@/lib/site"
import Link from "next/link"

type ToolRelatedLinksProps = {
  feature: FeatureKey
}

/** Light “Learn more / Guide” strip for interactive tool pages */
export default function ToolRelatedLinks({ feature }: ToolRelatedLinksProps) {
  const f = features[feature]

  return (
    <nav
      aria-label="Related resources"
      className="mt-12 pt-6 border-t w-full max-w-lg px-4 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 justify-center"
    >
      <Link
        href={f.landingPath}
        className="underline underline-offset-2 hover:text-foreground"
      >
        Learn more
      </Link>
      <Link
        href={blogPath(f.blogSlug)}
        className="underline underline-offset-2 hover:text-foreground"
      >
        Guide
      </Link>
      <Link href="/" className="underline underline-offset-2 hover:text-foreground">
        Home
      </Link>
    </nav>
  )
}
