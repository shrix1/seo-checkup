import BlogExplorer from "@/components/blog-explorer"
import JsonLd from "@/components/json-ld"
import { SITE_URL } from "@/lib/site"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

export const metadata: Metadata = constructMetadata({
  title: "SEO Blog — Audits, Sitemaps & Meta Guides | SeoCheckup",
  description:
    "Practical SEO guides from SeoCheckup: how to run a free site audit, check Domain Rating, validate XML sitemaps, preview meta tags, and read robots.txt without breaking crawl access.",
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
