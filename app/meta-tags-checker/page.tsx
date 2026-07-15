import SeoToolLanding from "@/components/seo-tool-landing"
import { blogPath, features } from "@/lib/site"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

const feature = features.metadata

export const metadata: Metadata = constructMetadata({
  title: "Free Meta Tags Checker | SeoCheckup",
  description:
    "Check website meta tags free: preview title and description as search engines may show them, plus Open Graph social cards, so snippets look right before you publish.",
  canonical: feature.landingPath,
})

export default function MetaTagsCheckerPage() {
  return (
    <SeoToolLanding
      h1="Free Meta Tags Checker"
      pitch="Preview title, description, and social cards so search and share snippets look right before you publish."
      toolPath="/metadata"
      defaultDemoUrl="https://shrix1.com"
      inputPlaceholder="https://example.com"
      canonicalPath={feature.landingPath}
      appName={feature.appName}
      blogHref={blogPath(feature.blogSlug)}
      blogLabel={feature.blogLabel}
      benefits={[
        "See title and meta description as search engines may show them",
        "Preview Open Graph and social share cards",
        "Spot missing or weak tags in seconds",
      ]}
      faqs={[
        {
          question: "What is the difference between title and description?",
          answer:
            "The title tag is the clickable headline in search results. The meta description is the supporting snippet underneath. Both should be unique and match the page content.",
        },
        {
          question: "What are Open Graph tags?",
          answer:
            "Open Graph meta tags control how a page looks when shared on social platforms — typically image, title, and description for the share card.",
        },
        {
          question: "Why do meta tag previews matter?",
          answer:
            "Clear titles and descriptions improve click-through from search and social. Checking them before launch avoids broken or empty previews.",
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
