import React from "react"
import { Stethoscope } from "lucide-react"
import type { Metadata } from "next"
import { constructMetadata } from "@/lib/utils"
import { FadeIn } from "@/components/motion"
import { safeDecodeURIComponent } from "@/lib/safe-decode"
import AuditClient from "./audit-client"

export const metadata: Metadata = constructMetadata({
  title: "Free Site Audit | SeoCheckup",
  description:
    "Free website SEO audit: robots, sitemap, meta tags, security headers, and Ahrefs Domain Rating in one report.",
  canonical: "/audit",
  ogImage: "/og-dark.png",
})

export const revalidate = 0

export default async function AuditPage({
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
            <Stethoscope />
          </div>
          <h2 className="text-center text-2xl font-semibold">Site Audit</h2>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            One URL. Robots, sitemap, on-page signals, headers, and Domain Rating —
            free, no lockouts.
          </p>
        </section>
      </FadeIn>
      <AuditClient key={query || "default"} query={query} />
    </div>
  )
}
