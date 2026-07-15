import React from "react"
import { Bot } from "lucide-react"
import type { Metadata } from "next"
import { constructMetadata } from "@/lib/utils"
import { FadeIn } from "@/components/motion"
import { safeDecodeURIComponent } from "@/lib/safe-decode"
import InputFieldRobots from "./input-field"

export const metadata: Metadata = constructMetadata({
  title: "Robots.txt Viewer | SeoCheckup",
  description: "Inspect robots.txt directives, sitemaps, and crawl rules.",
  canonical: "/robots",
  ogImage: "/og-dark.png",
})

export const revalidate = 0

export default async function RobotsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = safeDecodeURIComponent(q)

  return (
    <div className="min-h-screen max-h-full flex items-center flex-col pb-10 px-4 md:px-0">
      <FadeIn>
        <section className="flex justify-center flex-col items-center gap-4 mt-3">
          <div
            className="w-11 h-11 flex justify-center items-center rounded-lg
         bg-gradient-to-br from-secondary via-black/20 to-secondary/20 dark:from-primary/30 dark:via-primary/50 dark:to-primary text-black backdrop-blur-md"
          >
            <Bot />
          </div>
          <h2 className="text-center text-2xl font-semibold">
            Robots.txt Viewer
          </h2>
        </section>
      </FadeIn>

      <InputFieldRobots key={query || "default"} query={query} />
    </div>
  )
}
