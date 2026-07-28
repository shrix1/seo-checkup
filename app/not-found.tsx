import Container from "@/components/container"
import { Button } from "@/components/ui/button"
import { features, type FeatureKey } from "@/lib/site"
import Link from "next/link"

const order: FeatureKey[] = [
  "audit",
  "domainRating",
  "sitemap",
  "metadata",
  "robots",
]

export default function NotFound() {
  return (
    <Container width="reading" className="py-24">
      <div className="flex flex-col items-center text-center">
        <span className="font-mono text-label font-medium uppercase text-muted-foreground">
          404
        </span>
        <h1 className="mt-3 text-title font-semibold">Page not found</h1>
        <p className="mt-2 max-w-md text-body text-muted-foreground">
          That URL doesn&apos;t exist. Every SeoCheckup tool is free and
          unlocked — pick one below.
        </p>
        <div className="mt-8">
          <Button asChild>
            <Link href="/">Run a free audit</Link>
          </Button>
        </div>
      </div>

      <div className="mt-12 grid gap-2 sm:grid-cols-2">
        {order.map((key) => (
          <Link
            key={key}
            href={features[key].landingPath}
            className="rounded-lg border px-4 py-3 text-sm transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:border-border-strong hover:bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="font-medium">{features[key].landingLabel}</span>
          </Link>
        ))}
      </div>
    </Container>
  )
}
