"use client"

import ToolCard from "@/components/tool-card"
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

const DEMO = "https://shrix1.com"

const tools = [
  {
    id: 1,
    title: "Sitemap Link Checker",
    content: "Easily review your sitemap by adding yoursite.com/sitemap.xml.",
    link: "/sitemap-checker",
  },
  {
    id: 2,
    title: "Metadata viewer",
    content: "Easily review your metadata by adding your site link.",
    link: "/meta-tags-checker",
  },
  {
    id: 3,
    title: "Robots.txt Viewer",
    content: "Inspect robots.txt directives, sitemaps, and crawl rules.",
    link: "/robots-txt-checker",
  },
  {
    id: 4,
    title: "Domain Rating",
    content: "Check Ahrefs Domain Rating for any domain — free.",
    link: "/domain-rating-checker",
  },
]

export default function HomeHero() {
  const router = useRouter()
  const [url, setUrl] = useState(DEMO)

  return (
    <section className="relative flex justify-center flex-col items-center min-h-[83vh]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-background
          bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)]
          bg-[size:6rem_4rem]
          [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]"
      />

      <main className="flex justify-center flex-col items-center w-full px-4 py-16 md:py-24">
        <FadeIn className="flex flex-col items-center text-center max-w-2xl w-full">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight font-mono">
            SeoCheckup
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-md">
            Free site audit for sitemaps, metadata, robots.txt, and Domain Rating.
          </p>

          <form
            className="mt-8 flex flex-col sm:flex-row gap-2 w-full max-w-lg"
            onSubmit={(e) => {
              e.preventDefault()
              const q = url.trim() || DEMO
              router.push(`/audit?q=${encodeURIComponent(q)}`)
            }}
          >
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="font-mono"
              aria-label="URL to audit"
            />
            <Button type="submit" size="lg" className="shrink-0">
              Run free audit
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Or{" "}
            <Link href="/site-audit" className="underline underline-offset-2">
              learn about the audit
            </Link>
            {" · "}
            <Link href="/blog" className="underline underline-offset-2">
              Blog
            </Link>
          </p>
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-14 w-full max-w-5xl">
          {tools.map((tool) => (
            <StaggerItem key={tool.id}>
              <ToolCard
                title={tool.title}
                content={tool.content}
                link={tool.link}
              />
            </StaggerItem>
          ))}
        </StaggerChildren>
      </main>
    </section>
  )
}
