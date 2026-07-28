import React from "react"
import { AreaChart } from "lucide-react"
import InputField from "./input-field"
import type { Metadata } from "next"
import { constructMetadata } from "@/lib/utils"
import ToolShell from "@/components/tool-shell"
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
    <ToolShell
      icon={AreaChart}
      title="Sitemap Link Checker"
      description="Expand sitemap indexes, list every URL, then copy or filter results."
    >
      <JsonLd data={appJsonLd} />
      <InputField key={query || "default"} query={query} />
      <ToolRelatedLinks feature="sitemap" />
    </ToolShell>
  )
}
