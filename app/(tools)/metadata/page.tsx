import React from "react"
import { FileImage } from "lucide-react"
import type { Metadata } from "next"
import { constructMetadata } from "@/lib/utils"
import ToolShell from "@/components/tool-shell"
import { safeDecodeURIComponent } from "@/lib/safe-decode"
import InputFieldMetadata from "./input-field"
import JsonLd from "@/components/json-ld"
import ToolRelatedLinks from "@/components/tool-related-links"
import { absoluteUrl, features } from "@/lib/site"

const feature = features.metadata

export const metadata: Metadata = constructMetadata({
  title: "Preview Meta Tags & Social Cards | SeoCheckup",
  description:
    "See how any URL renders in Google, X, Slack, LinkedIn, Discord and Facebook, with title and description measured in real pixel width.",
  canonical: feature.toolPath,
  ogImage: "/og/og-metadata.svg",
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

export default async function MetaData({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = safeDecodeURIComponent(q)

  return (
    <ToolShell
      icon={FileImage}
      title="Meta Tags Checker"
      description="Preview title, description, and Open Graph cards before you publish."
    >
      <JsonLd data={appJsonLd} />
      <InputFieldMetadata key={query || "default"} query={query} />
      <ToolRelatedLinks feature="metadata" />
    </ToolShell>
  )
}
