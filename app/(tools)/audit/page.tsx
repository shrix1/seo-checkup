import React from "react"
import { Stethoscope } from "lucide-react"
import type { Metadata } from "next"
import { constructMetadata } from "@/lib/utils"
import { FadeIn } from "@/components/motion"
import { safeDecodeURIComponent } from "@/lib/safe-decode"
import AuditClient from "./audit-client"
import JsonLd from "@/components/json-ld"
import ToolRelatedLinks from "@/components/tool-related-links"
import { absoluteUrl, features } from "@/lib/site"

const feature = features.audit

export const metadata: Metadata = constructMetadata({
  title: "Free Website SEO Audit | SeoCheckup",
  description: feature.description,
  canonical: feature.toolPath,
  ogImage: "/og-dark.png",
})

export const revalidate = 0

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: feature.appName,
  url: absoluteUrl(feature.toolPath),
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description: feature.description,
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = safeDecodeURIComponent(q)

  return (
    <div className="min-h-screen max-h-full flex items-center flex-col pb-16 px-4 md:px-0">
      <JsonLd data={appJsonLd} />
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
      <ToolRelatedLinks feature="audit" />
    </div>
  )
}
