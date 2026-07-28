import React from "react"
import { Bot } from "lucide-react"
import type { Metadata } from "next"
import { constructMetadata } from "@/lib/utils"
import ToolShell from "@/components/tool-shell"
import { safeDecodeURIComponent } from "@/lib/safe-decode"
import InputFieldRobots from "./input-field"
import JsonLd from "@/components/json-ld"
import ToolRelatedLinks from "@/components/tool-related-links"
import { absoluteUrl, features } from "@/lib/site"

const feature = features.robots

export const metadata: Metadata = constructMetadata({
  title: "View & Test robots.txt — Free Tool | SeoCheckup",
  description:
    "Fetch and test any robots.txt against RFC 9309. Check crawler access per path, inspect AI crawlers, and read declared RSL and AIPREF licensing.",
  canonical: feature.toolPath,
  ogImage: "/og/og-robots.svg",
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
    <ToolShell
      icon={Bot}
      title="Robots.txt Viewer"
      description="Inspect User-agent, Allow, Disallow, and Sitemap crawl rules."
    >
      <JsonLd data={appJsonLd} />
      <InputFieldRobots key={query || "default"} query={query} />
      <ToolRelatedLinks feature="robots" />
    </ToolShell>
  )
}
