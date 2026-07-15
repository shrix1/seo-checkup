import BlogExplorer from "@/components/blog-explorer"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

export const metadata: Metadata = constructMetadata({
  title: "Blog | SeoCheckup",
  description:
    "Guides on XML sitemaps, meta tags, robots.txt, Domain Rating, and free website SEO audits.",
  canonical: "/blog",
})

export default function BlogPage() {
  return <BlogExplorer />
}
