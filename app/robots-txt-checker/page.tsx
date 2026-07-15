import SeoToolLanding from "@/components/seo-tool-landing"
import { blogPath, features } from "@/lib/site"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

const feature = features.robots

export const metadata: Metadata = constructMetadata({
  title: "Free Robots.txt Checker | SeoCheckup",
  description:
    "Check any public robots.txt free. Highlight User-agent, Allow, Disallow, and Sitemap directives so you can confirm crawl rules and avoid blocking important pages by mistake.",
  canonical: feature.landingPath,
})

export default function RobotsTxtCheckerPage() {
  return (
    <SeoToolLanding
      h1="Free Robots.txt Checker"
      pitch="Fetch any public robots.txt and highlight User-agent, Allow, Disallow, and Sitemap lines."
      toolPath="/robots"
      defaultDemoUrl="https://shrix1.com/robots.txt"
      inputPlaceholder="https://example.com/robots.txt"
      canonicalPath={feature.landingPath}
      appName={feature.appName}
      blogHref={blogPath(feature.blogSlug)}
      blogLabel={feature.blogLabel}
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
        { href: "/site-audit", label: "Website SEO Audit" },
        { href: "/sitemap-checker", label: "XML Sitemap Checker" },
        { href: "/meta-tags-checker", label: "Meta Tags Checker" },
      ]}
    />
  )
}
