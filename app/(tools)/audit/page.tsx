import React from "react"
import { Stethoscope } from "lucide-react"
import type { Metadata } from "next"
import { constructMetadata } from "@/lib/utils"
import ToolShell from "@/components/tool-shell"
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
    <ToolShell
      icon={Stethoscope}
      title="Site Audit"
      description="One URL. Robots, sitemap, on-page signals, headers, and Domain Rating — free, no lockouts."
    >
      <JsonLd data={appJsonLd} />
      <AuditClient key={query || "default"} query={query} />
      <ToolRelatedLinks feature="audit" />
    </ToolShell>
  )
}
