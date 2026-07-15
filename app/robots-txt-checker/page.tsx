import SeoToolLanding from "@/components/seo-tool-landing"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

export const metadata: Metadata = constructMetadata({
  title: "Free Robots.txt Checker | SeoCheckup",
  description:
    "Check and view robots.txt files. Highlight User-agent, Allow, Disallow, and Sitemap directives free.",
  canonical: "/robots-txt-checker",
})

export default function RobotsTxtCheckerPage() {
  return (
    <SeoToolLanding
      h1="Free Robots.txt Checker"
      pitch="Fetch any public robots.txt and highlight User-agent, Allow, Disallow, and Sitemap lines."
      ctaHref="/robots?q=https://shrix1.com/robots.txt"
      canonicalPath="/robots-txt-checker"
      appName="Robots.txt Checker"
      benefits={[
        "Load robots.txt from any public site URL",
        "Highlight crawl directives so rules are easy to scan",
        "Spot Sitemap lines declared for search engines",
      ]}
      faqs={[
        {
          question: "Where does robots.txt live?",
          answer:
            "It must be at the site root, for example https://example.com/robots.txt. Search engines look there first before crawling.",
        },
        {
          question: "What does the Sitemap directive do?",
          answer:
            "A Sitemap line in robots.txt tells crawlers where to find your XML sitemap or sitemap index, so they can discover URLs faster.",
        },
        {
          question: "Does Disallow stop a page from being indexed?",
          answer:
            "Disallow asks crawlers not to fetch a URL. Indexing can still happen from links elsewhere. Use noindex meta or headers when you need to keep a page out of results.",
        },
      ]}
      related={[
        { href: "/sitemap-checker", label: "XML Sitemap Checker" },
        { href: "/meta-tags-checker", label: "Meta Tags Checker" },
      ]}
    />
  )
}
