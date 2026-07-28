import React from "react"
import { TrendingUp } from "lucide-react"
import type { Metadata } from "next"
import { constructMetadata } from "@/lib/utils"
import ToolShell from "@/components/tool-shell"
import { safeDecodeURIComponent } from "@/lib/safe-decode"
import DomainRatingClient from "./domain-rating-client"
import JsonLd from "@/components/json-ld"
import ToolRelatedLinks from "@/components/tool-related-links"
import { absoluteUrl, features } from "@/lib/site"

const feature = features.domainRating

export const metadata: Metadata = constructMetadata({
  title: "Free Domain Rating Checker | SeoCheckup",
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

export default async function DomainRatingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = safeDecodeURIComponent(q)

  return (
    <ToolShell
      icon={TrendingUp}
      title="Domain Rating Checker"
      description="Free Ahrefs Domain Rating lookup. No API key required."
    >
      <JsonLd data={appJsonLd} />
      <DomainRatingClient key={query || "default"} query={query} />
      <ToolRelatedLinks feature="domainRating" />
    </ToolShell>
  )
}
