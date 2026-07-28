import React from "react"
import { Gauge } from "lucide-react"
import type { Metadata } from "next"
import { constructMetadata } from "@/lib/utils"
import ToolShell from "@/components/tool-shell"
import { safeDecodeURIComponent } from "@/lib/safe-decode"
import CoreWebVitalsClient from "./core-web-vitals-client"
import JsonLd from "@/components/json-ld"
import ToolRelatedLinks from "@/components/tool-related-links"
import { absoluteUrl, features } from "@/lib/site"

const feature = features.coreWebVitals

export const metadata: Metadata = constructMetadata({
  title: "Core Web Vitals Test — LCP, INP, CLS | SeoCheckup",
  description:
    "Measure LCP, INP and CLS for any URL. Shows real Chrome user data where it exists and labels lab runs, so you know what Google ranks on.",
  canonical: feature.toolPath,
  ogImage: "/og/og-core-web-vitals.svg",
})

export const revalidate = 0

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: feature.appName,
  url: absoluteUrl(feature.toolPath),
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: feature.description,
}

export default async function CoreWebVitalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = safeDecodeURIComponent(q)

  return (
    <ToolShell
      icon={Gauge}
      title="Core Web Vitals Checker"
      description="LCP, INP and CLS for any URL — real Chrome user data where it exists, clearly separated from lab simulation."
    >
      <JsonLd data={appJsonLd} />
      <CoreWebVitalsClient key={query || "default"} query={query} />
      <ToolRelatedLinks feature="coreWebVitals" />
    </ToolShell>
  )
}
