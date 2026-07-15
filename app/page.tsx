import ToolCard from "@/components/tool-card"
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/motion"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

export const metadata: Metadata = constructMetadata({
  canonical: "/",
})

export default function Home() {
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
  ]

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
        <FadeIn className="flex flex-col items-center text-center max-w-2xl">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight font-mono">
            SeoCheckup
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-md">
            Free SEO tools to inspect sitemaps, metadata, and robots.txt.
          </p>
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 w-full max-w-5xl">
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
