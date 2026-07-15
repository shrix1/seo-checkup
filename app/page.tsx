import HomeHero from "@/components/home-hero"
import JsonLd from "@/components/json-ld"
import { SITE_URL } from "@/lib/site"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

export const metadata: Metadata = constructMetadata({
  title: "SeoCheckup — Free Site Audit & SEO Tools",
  description:
    "Free site audit for any website — check sitemap, meta tags, robots.txt, and Domain Rating in one go.",
  canonical: "/",
})

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SeoCheckup",
  url: SITE_URL,
  description:
    "Free site audit for any website — check sitemap, meta tags, robots.txt, and Domain Rating in one go.",
  publisher: {
    "@type": "Organization",
    name: "SeoCheckup",
    url: SITE_URL,
  },
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SeoCheckup",
  url: SITE_URL,
  sameAs: [
    "https://github.com/shrix1/seo-checkup",
    "https://x.com/shribuilds",
  ],
}

export default function Home() {
  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={organizationJsonLd} />
      <HomeHero />
    </>
  )
}
