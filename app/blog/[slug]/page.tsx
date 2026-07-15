import { Button } from "@/components/ui/button"
import {
  type BlogSlug,
  blogMetadata,
  blogSlugs,
  getBlogPosts,
} from "@/lib/blog-metadata"
import { constructMetadata } from "@/lib/utils"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { ComponentType } from "react"

import FreeWebsiteSeoAudit from "@/content/blog/free-website-seo-audit.mdx"
import HowToCheckMetaTags from "@/content/blog/how-to-check-meta-tags.mdx"
import HowToCheckRobotsTxt from "@/content/blog/how-to-check-robots-txt.mdx"
import HowToCheckXmlSitemap from "@/content/blog/how-to-check-xml-sitemap.mdx"
import WhatIsDomainRating from "@/content/blog/what-is-domain-rating.mdx"

const blogComponents: Record<BlogSlug, ComponentType> = {
  "free-website-seo-audit": FreeWebsiteSeoAudit,
  "what-is-domain-rating": WhatIsDomainRating,
  "how-to-check-xml-sitemap": HowToCheckXmlSitemap,
  "how-to-check-meta-tags": HowToCheckMetaTags,
  "how-to-check-robots-txt": HowToCheckRobotsTxt,
}

export function generateStaticParams() {
  return blogSlugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!(slug in blogMetadata)) {
    return constructMetadata({ canonical: "/blog" })
  }
  const meta = blogMetadata[slug as BlogSlug]
  return constructMetadata({
    title: `${meta.title} | SeoCheckup`,
    description: meta.description,
    canonical: `/blog/${slug}`,
    ogImage: meta.coverImage,
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!(slug in blogMetadata) || !(slug in blogComponents)) {
    notFound()
  }

  const meta = blogMetadata[slug as BlogSlug]
  const Content = blogComponents[slug as BlogSlug]
  const related = getBlogPosts()
    .filter((p) => p.slug !== slug)
    .slice(0, 3)

  return (
    <article className="pb-16">
      <div
        className="w-full h-56 sm:h-72 md:h-80 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${meta.coverImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-16 relative">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_240px] gap-10">
          <div>
            <p className="text-xs font-mono text-muted-foreground">
              {meta.category} · {meta.date} · {meta.readTime}
            </p>
            <div className="mt-4 prose prose-neutral dark:prose-invert max-w-3xl">
              <Content />
            </div>
          </div>

          <aside className="xl:sticky xl:top-28 h-fit space-y-4">
            <div className="border rounded-xl p-4 bg-muted/30">
              <p className="text-sm font-medium">Try the tool</p>
              <p className="text-xs text-muted-foreground mt-1">
                Run this related SeoCheckup feature free.
              </p>
              <Button asChild className="mt-3 w-full">
                <Link href={meta.relatedTool.href}>{meta.relatedTool.label}</Link>
              </Button>
            </div>
            <Link
              href="/blog"
              className="text-sm underline underline-offset-2 text-muted-foreground"
            >
              ← All posts
            </Link>
          </aside>
        </div>

        <section className="mt-16 border-t pt-10">
          <h2 className="text-lg font-semibold">Related posts</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {related.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="border rounded-lg p-4 hover:bg-muted/40 transition-colors"
              >
                <p className="text-xs font-mono text-muted-foreground">
                  {post.category}
                </p>
                <p className="mt-1 font-medium text-sm">{post.title}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </article>
  )
}
