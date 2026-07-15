import React from "react"
import { Bot } from "lucide-react"
import type { Metadata } from "next"
import { constructMetadata } from "@/lib/utils"
import { FadeIn } from "@/components/motion"
import { safeDecodeURIComponent } from "@/lib/safe-decode"
import InputFieldRobots from "./input-field"
import JsonLd from "@/components/json-ld"
import ToolRelatedLinks from "@/components/tool-related-links"
import { absoluteUrl, features } from "@/lib/site"

const feature = features.robots

export const metadata: Metadata = constructMetadata({
  title: "Free Robots.txt Checker | SeoCheckup",
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

export default async function RobotsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = safeDecodeURIComponent(q)

  return (
    <div className="min-h-screen max-h-full flex items-center flex-col pb-10 px-4 md:px-0">
      <JsonLd data={appJsonLd} />
      <FadeIn>
        <section className="flex justify-center flex-col items-center gap-4 mt-3">
          <div
            className="w-11 h-11 flex justify-center items-center rounded-lg
         bg-gradient-to-br from-secondary via-black/20 to-secondary/20 dark:from-primary/30 dark:via-primary/50 dark:to-primary text-black backdrop-blur-md"
          >
            <Bot />
          </div>
          <h2 className="text-center text-2xl font-semibold">
            Robots.txt Viewer
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Inspect User-agent, Allow, Disallow, and Sitemap crawl rules.
          </p>
        </section>
      </FadeIn>

      <InputFieldRobots key={query || "default"} query={query} />
      <ToolRelatedLinks feature="robots" />
    </div>
  )
}
