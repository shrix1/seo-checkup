import React from "react"
import { AreaChart } from "lucide-react"
import InputField from "./input-field"
import type { Metadata } from "next"
import { constructMetadata } from "@/lib/utils"
import { FadeIn } from "@/components/motion"
import { safeDecodeURIComponent } from "@/lib/safe-decode"
import JsonLd from "@/components/json-ld"
import ToolRelatedLinks from "@/components/tool-related-links"
import { absoluteUrl, features } from "@/lib/site"

const feature = features.sitemap

export const metadata: Metadata = constructMetadata({
  title: "Free XML Sitemap Checker | SeoCheckup",
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

export default async function Sitemap({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = safeDecodeURIComponent(q)

  return (
    <div className="min-h-screen max-h-full flex items-center flex-col pb-10">
      <JsonLd data={appJsonLd} />
      <FadeIn>
        <section className="flex justify-center flex-col items-center gap-4 mt-3">
          <div
            className="w-11 h-11 flex justify-center items-center rounded-lg
         bg-gradient-to-br from-secondary via-black/20 to-secondary/20 dark:from-primary/30 dark:via-primary/50 dark:to-primary text-black backdrop-blur-md"
          >
            <AreaChart />
          </div>
          <h2 className="text-center text-2xl font-semibold">
            Sitemap Link Checker
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-md px-4">
            Expand sitemap indexes, list every URL, then copy or filter results.
          </p>
        </section>
      </FadeIn>

      <InputField key={query || "default"} query={query} />
      <ToolRelatedLinks feature="sitemap" />
    </div>
  )
}
