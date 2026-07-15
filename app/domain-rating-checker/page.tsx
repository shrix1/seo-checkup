import SeoToolLanding from "@/components/seo-tool-landing"
import { blogPath, features } from "@/lib/site"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

const feature = features.domainRating

export const metadata: Metadata = constructMetadata({
  title: "Free Domain Rating Checker | SeoCheckup",
  description:
    "Check Domain Rating (DR) for any website free using Ahrefs’ public Domain Rating data. See an instant authority score with required Domain Rating by Ahrefs attribution — no API key.",
  canonical: feature.landingPath,
})

export default function DomainRatingCheckerPage() {
  return (
    <SeoToolLanding
      h1="Free Domain Rating Checker"
      pitch="Look up Ahrefs Domain Rating for any domain in seconds. Free, no API key, with required Ahrefs attribution."
      toolPath="/domain-rating"
      defaultDemoUrl="https://shrix1.com"
      inputPlaceholder="https://example.com"
      canonicalPath={feature.landingPath}
      appName={feature.appName}
      blogHref={blogPath(feature.blogSlug)}
      blogLabel={feature.blogLabel}
      benefits={[
        "Instant DR score from Ahrefs’ free public endpoint",
        "Works with a bare domain or full URL",
        "Jump into a full SeoCheckup site audit next",
      ]}
      faqs={[
        {
          question: "What is Domain Rating?",
          answer:
            "Domain Rating (DR) is Ahrefs’ score for the relative strength of a site’s backlink profile on a 100-point logarithmic scale.",
        },
        {
          question: "Is this official Ahrefs data?",
          answer:
            "Yes. Values come from Ahrefs’ free public Domain Rating API. We display the required “Domain Rating by Ahrefs” attribution.",
        },
        {
          question: "Do I need an Ahrefs subscription?",
          answer:
            "No. This checker uses the free public endpoint and does not require an API key or paid plan.",
        },
      ]}
      related={[
        { href: "/site-audit", label: "Website SEO Audit" },
        { href: "/sitemap-checker", label: "XML Sitemap Checker" },
        { href: "/robots-txt-checker", label: "Robots.txt Checker" },
      ]}
    />
  )
}
