"use client"

import Container from "@/components/container"
import { Input } from "@/components/ui/input"
import { getBlogPosts } from "@/lib/blog-metadata"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useMemo, useState } from "react"

const posts = getBlogPosts()

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
    <>
      <section className="border-b">
        <Container width="page" className="py-14 md:py-20">
          <h1 className="text-title font-semibold sm:text-display">Blog</h1>
          <p className="mt-3 max-w-xl text-subhead text-muted-foreground">
            Practical guides for sitemaps, meta tags, robots.txt, Domain Rating,
            and free site audits.
          </p>
        </Container>
      </section>

      <Container width="page" className="py-10 md:py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            aria-label="Search blog posts"
            className="sm:max-w-xs"
          />
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter by category"
          >
            {categories.map((cat) => {
              const active = category === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
                  )}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-lg border bg-background transition-colors duration-[var(--duration-normal)] ease-[var(--ease-out)] hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div
                className="aspect-[16/10] border-b bg-surface-2 bg-cover bg-center"
                style={{ backgroundImage: `url(${post.coverImage})` }}
                role="presentation"
              />
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 font-medium">
                    {post.category}
                  </span>
                  <span>{post.date}</span>
                </div>
                <h2 className="mt-3 line-clamp-2 font-semibold underline-offset-2 group-hover:underline">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                  {post.description}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {post.readTime}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-10 text-body text-muted-foreground">
            No posts matched “{query}”.
          </p>
        )}
      </Container>
    </>
  )
}
