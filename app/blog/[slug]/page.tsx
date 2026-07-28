import Container from "@/components/container"
import JsonLd from "@/components/json-ld"
import { Button } from "@/components/ui/button"
import {
  type BlogSlug,
  blogMetadata,
  blogSlugs,
  getBlogPosts,
} from "@/lib/blog-metadata"
import { SITE_URL, absoluteUrl } from "@/lib/site"
import { constructMetadata } from "@/lib/utils"
import type { Metadata } from "next"
import { ArrowLeft, ArrowRight } from "lucide-react"
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
  const pageUrl = absoluteUrl(`/blog/${slug}`)
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: meta.title,
    description: meta.description,
    datePublished: meta.date,
    dateModified: meta.date,
    image: absoluteUrl(meta.coverImage),
    url: pageUrl,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
    author: {
      "@type": "Person",
      name: "Shriprasanna",
      url: "https://github.com/shrix1",
    },
    publisher: {
      "@type": "Organization",
      name: "SeoCheckup",
      url: SITE_URL,
    },
  }

  return (
    <article className="pb-8">
      <JsonLd data={articleJsonLd} />

      <Container width="page" className="pt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          All posts
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded bg-surface-2 px-1.5 py-0.5 font-medium">
                {meta.category}
              </span>
              <span>{meta.date}</span>
              <span aria-hidden>·</span>
              <span>{meta.readTime}</span>
            </div>

            <div
              className="mt-5 aspect-[16/7] w-full max-w-3xl rounded-lg border bg-surface-2 bg-cover bg-center"
              style={{ backgroundImage: `url(${meta.coverImage})` }}
              role="presentation"
            />

            {/* The post's own <h1> comes from the MDX source */}
            <div className="prose prose-neutral mt-8 max-w-3xl dark:prose-invert">
              <Content />
            </div>
          </div>

          <aside className="h-fit space-y-4 xl:sticky xl:top-28">
            <div className="rounded-lg border bg-surface-1 p-4">
              <p className="text-sm font-medium">Try the tool</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Run this related SeoCheckup feature free.
              </p>
              <Button asChild className="mt-3 w-full">
                <Link href={meta.relatedTool.href}>
                  {meta.relatedTool.label}
                </Link>
              </Button>
              <Link
                href={meta.relatedLanding.href}
                className="mt-3 block text-center text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
              >
                {meta.relatedLanding.label}
              </Link>
            </div>
          </aside>
        </div>

        <section className="mt-16 border-t pt-10">
          <h2 className="text-heading font-semibold">Related posts</h2>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {related.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-lg border p-4 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:border-border-strong hover:bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-xs text-muted-foreground">
                  {post.category}
                </span>
                <span className="mt-1.5 flex-1 text-sm font-medium">
                  {post.title}
                </span>
                <ArrowRight
                  className="mt-3 h-4 w-4 text-muted-foreground transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </article>
  )
}
