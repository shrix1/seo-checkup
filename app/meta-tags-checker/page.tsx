import SeoToolLanding from "@/components/seo-tool-landing"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

export const metadata: Metadata = constructMetadata({
  title: "Free Meta Tags Checker | SeoCheckup",
  description:
    "Check website meta tags and preview title, description, and Open Graph social cards for Google, X, and more.",
  canonical: "/meta-tags-checker",
})

export default function MetaTagsCheckerPage() {
  return (
    <SeoToolLanding
      h1="Free Meta Tags Checker"
      pitch="Preview title, description, and social cards so search and share snippets look right before you publish."
      ctaHref="/metadata?q=https://shrix1.com"
      canonicalPath="/meta-tags-checker"
      appName="Meta Tags Checker"
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
        { href: "/sitemap-checker", label: "XML Sitemap Checker" },
        { href: "/robots-txt-checker", label: "Robots.txt Checker" },
      ]}
    />
  )
}
