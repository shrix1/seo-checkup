import HomeHero from "@/components/home-hero"
import JsonLd from "@/components/json-ld"
import { SITE_URL } from "@/lib/site"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

export const metadata: Metadata = constructMetadata({
  title: "SeoCheckup — Free Site Audit & SEO Tools",
  description:
    "Free website SEO tools: run a technical site audit, check Ahrefs Domain Rating, expand XML sitemaps, preview meta tags and Open Graph cards, and inspect robots.txt — no account required.",
  canonical: "/",
})

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SeoCheckup",
  url: SITE_URL,
  description:
    "Free website SEO audit, Domain Rating checker, XML sitemap expander, meta tags preview, and robots.txt viewer.",
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
