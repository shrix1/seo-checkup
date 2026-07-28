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
  title: "Expand an XML Sitemap — Free Tool | SeoCheckup",
  description:
    "Paste a sitemap URL to expand nested indexes, list every page URL and filter by source. Finds the sitemap for you if you only have a domain.",
  canonical: feature.toolPath,
  ogImage: "/og/og-sitemap.svg",
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
      description="Paste a domain and we'll find the sitemap — from robots.txt or the usual paths — then expand every index and list all URLs."
    >
      <JsonLd data={appJsonLd} />
      <InputField key={query || "default"} query={query} />
      <ToolRelatedLinks feature="sitemap" />
    </ToolShell>
  )
}
