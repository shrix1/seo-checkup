import React from "react"
import { TrendingUp } from "lucide-react"
import type { Metadata } from "next"
import { constructMetadata } from "@/lib/utils"
import { FadeIn } from "@/components/motion"
import { safeDecodeURIComponent } from "@/lib/safe-decode"
import DomainRatingClient from "./domain-rating-client"

export const metadata: Metadata = constructMetadata({
  title: "Free Domain Rating Checker | SeoCheckup",
  description:
    "Check Ahrefs Domain Rating (DR) for any domain free. Instant authority score with required Ahrefs attribution.",
  canonical: "/domain-rating",
  ogImage: "/og-dark.png",
})

export const revalidate = 0

export default async function DomainRatingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = safeDecodeURIComponent(q)

  return (
    <div className="min-h-screen max-h-full flex items-center flex-col pb-16 px-4 md:px-0">
      <FadeIn>
        <section className="flex justify-center flex-col items-center gap-4 mt-3">
          <div
            className="w-11 h-11 flex justify-center items-center rounded-lg
         bg-gradient-to-br from-secondary via-black/20 to-secondary/20 dark:from-primary/30 dark:via-primary/50 dark:to-primary text-black backdrop-blur-md"
          >
            <TrendingUp />
          </div>
          <h2 className="text-center text-2xl font-semibold">
            Domain Rating Checker
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Free Ahrefs Domain Rating lookup. No API key required.
          </p>
        </section>
      </FadeIn>
      <DomainRatingClient key={query || "default"} query={query} />
    </div>
  )
}
