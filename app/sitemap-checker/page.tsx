import SeoToolLanding from "@/components/seo-tool-landing"
import { blogPath, features } from "@/lib/site"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

const feature = features.sitemap

export const metadata: Metadata = constructMetadata({
  title: "Free XML Sitemap Checker | SeoCheckup",
  description:
    "Validate and expand XML sitemaps and sitemap indexes free. Follow child sitemaps automatically, list every page URL, filter by source file, and copy the full URL list in one click.",
  canonical: feature.landingPath,
})

export default function SitemapCheckerPage() {
  return (
    <SeoToolLanding
      h1="Free XML Sitemap Checker"
      pitch="Expand sitemap indexes, list every page URL, then copy or filter by child sitemap."
      toolPath="/sitemap"
      defaultDemoUrl="https://shrix1.com/sitemap.xml"
      inputPlaceholder="https://example.com/sitemap.xml"
      canonicalPath={feature.landingPath}
      appName={feature.appName}
      blogHref={blogPath(feature.blogSlug)}
      blogLabel={feature.blogLabel}
      benefits={[
        "Follows sitemap indexes into child sitemaps automatically",
        "Filter URLs by source child sitemap when you have an index",
        "Copy the full URL list in one click",
      ]}
      faqs={[
        {
          question: "What is a sitemap index?",
          answer:
            "A sitemap index is an XML file that lists other sitemaps instead of page URLs. Large sites use indexes to split URLs across multiple sitemap files.",
        },
        {
          question: "Does this checker follow child sitemaps?",
          answer:
            "Yes. When you paste a sitemap index URL, SeoCheckup expands nested child sitemaps and returns the page URLs they contain.",
        },
        {
          question: "Is the XML Sitemap Checker free?",
          answer:
            "Yes. You can check any public sitemap URL at no cost, with no account required.",
        },
      ]}
      related={[
        { href: "/site-audit", label: "Website SEO Audit" },
        { href: "/meta-tags-checker", label: "Meta Tags Checker" },
        { href: "/robots-txt-checker", label: "Robots.txt Checker" },
      ]}
    />
  )
}
