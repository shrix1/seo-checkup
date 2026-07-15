"use client"

import { getBlogPosts } from "@/lib/blog-metadata"
import { features } from "@/lib/site"
import Link from "next/link"
import { useMemo, useState } from "react"

const posts = getBlogPosts()

const toolLinks = [
  features.audit,
  features.domainRating,
  features.sitemap,
  features.metadata,
  features.robots,
].map((f) => ({
  href: f.landingPath,
  label: f.landingLabel,
}))

export default function BlogExplorer() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("All")

  const categories = useMemo(() => {
    const set = new Set(posts.map((p) => p.category))
    return ["All", ...Array.from(set)]
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return posts.filter((p) => {
      if (category !== "All" && p.category !== category) return false
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
    })
  }, [query, category])

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 md:py-16">
      <h1 className="text-4xl sm:text-5xl font-bold font-mono tracking-tight">
        Blog
      </h1>
      <p className="mt-3 text-muted-foreground max-w-xl">
        Practical guides for sitemaps, meta tags, robots.txt, Domain Rating, and
        free site audits.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts…"
          className="flex h-9 w-full sm:max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Search blog posts"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={
                category === cat
                  ? "text-xs font-medium px-2.5 py-1 rounded-md bg-foreground text-background"
                  : "text-xs font-medium px-2.5 py-1 rounded-md border hover:bg-accent"
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-background"
          >
            <div
              className="aspect-[16/10] bg-muted bg-cover bg-center"
              style={{ backgroundImage: `url(${post.coverImage})` }}
            />
            <div className="p-4">
              <p className="text-xs font-mono text-muted-foreground">
                {post.category} · {post.date}
              </p>
              <h2 className="mt-2 font-semibold group-hover:underline underline-offset-2 line-clamp-2">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                {post.description}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">{post.readTime}</p>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-sm text-muted-foreground">No posts matched.</p>
      )}

      <nav
        aria-label="SEO tools"
        className="mt-16 pt-8 border-t text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">Free tools</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/" className="underline underline-offset-2 hover:text-foreground">
            Home
          </Link>
          {toolLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="underline underline-offset-2 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
