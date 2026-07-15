import SeoToolLanding from "@/components/seo-tool-landing"
import { blogPath, features } from "@/lib/site"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

const feature = features.audit

export const metadata: Metadata = constructMetadata({
  title: "Free Website SEO Audit Tool | SeoCheckup",
  description:
    "Run a free website SEO audit without an account: robots.txt, expandable XML sitemaps, on-page meta tags, security headers, and Ahrefs Domain Rating in one prioritized report.",
  canonical: feature.landingPath,
})

export default function SiteAuditLandingPage() {
  return (
    <SeoToolLanding
      h1="Free Website SEO Audit"
      pitch="Paste one URL. Get a prioritized checklist across on-page SEO, robots & sitemap, and trust signals — free, with no locked details."
      ctaHref="/audit?q=https://shrix1.com"
      ctaLabel="Run free audit"
      canonicalPath={feature.landingPath}
      appName={feature.appName}
      blogHref={blogPath(feature.blogSlug)}
      blogLabel={feature.blogLabel}
      benefits={[
        "On-page checks: title, description, H1, canonical, OG, JSON-LD",
        "Crawl checks: robots.txt and expandable XML sitemaps",
        "Trust: HTTPS, security headers, and Ahrefs Domain Rating",
      ]}
      faqs={[
        {
          question: "What does the free site audit include?",
          answer:
            "It checks homepage HTML signals, robots.txt, XML sitemaps, response security headers, and Ahrefs Domain Rating. It does not run Lighthouse or a full site crawl.",
        },
        {
          question: "Is every check unlocked?",
          answer:
            "Yes. Every pass, warning, and fail shows real values and a short fix hint — nothing is paywalled.",
        },
        {
          question: "Can I open specialized tools from the report?",
          answer:
            "Yes. Many findings deep-link into the Sitemap, Metadata, Robots, or Domain Rating tools with your URL prefilled.",
        },
      ]}
      related={[
        { href: "/domain-rating-checker", label: "Domain Rating Checker" },
        { href: "/sitemap-checker", label: "XML Sitemap Checker" },
        { href: "/meta-tags-checker", label: "Meta Tags Checker" },
      ]}
    />
  )
}
