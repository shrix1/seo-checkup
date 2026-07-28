import BlogExplorer from "@/components/blog-explorer"
import JsonLd from "@/components/json-ld"
import { SITE_URL } from "@/lib/site"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

export const metadata: Metadata = constructMetadata({
  title: "SEO Blog — Guides & Audits | SeoCheckup",
  description:
    "Practical technical SEO guides on site audits, XML sitemaps, meta tags, robots.txt and Core Web Vitals — written to be acted on, not skimmed.",
  canonical: "/blog",
})

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "SeoCheckup Blog",
  description:
    "Guides on XML sitemaps, meta tags, robots.txt, Domain Rating, and free website SEO audits.",
  url: `${SITE_URL}/blog`,
  isPartOf: {
    "@type": "WebSite",
    name: "SeoCheckup",
    url: SITE_URL,
  },
}

export default function BlogPage() {
  return (
    <>
      <JsonLd data={blogJsonLd} />
      <BlogExplorer />
    </>
  )
}
