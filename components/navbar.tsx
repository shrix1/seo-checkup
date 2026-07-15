"use client"

import Link from "next/link"
import React from "react"
import { Flame, Github, Twitter } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { ThemeSwitcher } from "./theme"

const tools = [
  {
    label: "Sitemap",
    href: "/sitemap?q=https://supwriter.com/sitemap.xml",
    match: "/sitemap",
  },
  {
    label: "Metadata",
    href: "/metadata?q=https://supwriter.com",
    match: "/metadata",
  },
  {
    label: "Robots",
    href: "/robots?q=https://supwriter.com/robots.txt",
    match: "/robots",
  },
] as const

const Navbar = () => {
  const pathname = usePathname()

  return (
    <nav
      className="h-[8vh] sticky top-0 text-black dark:text-white w-full px-3 sm:px-4 md:px-12 border dark:border-gray-50/10 rounded-lg flex 
    justify-between items-center gap-2 backdrop-blur-lg bg-white/80 dark:bg-black/80"
    >
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <Link href="/" className="flex items-center gap-2 justify-center group shrink-0">
          <Flame className="group-hover:scale-125 transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]" />
          <h2 className="font-medium text-lg group-hover:underline mt-0.5 font-mono hidden sm:block">
            SeoCheckup
          </h2>
        </Link>
        <div className="flex items-center gap-1 sm:gap-3 text-sm font-medium">
          {tools.map((tool) => (
            <Link
              key={tool.match}
              href={tool.href}
              className={cn(
                "px-1.5 sm:px-2 py-1 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === tool.match && "underline underline-offset-4"
              )}
            >
              {tool.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <Link
          href="https://x.com/shribuilds"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button size="icon" variant="ghost">
            <Twitter size={20} />
          </Button>
        </Link>

        <Link
          href="https://github.com/shrix1/seo-checkup"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button size="icon" variant="ghost">
            <Github size={20} />
          </Button>
        </Link>

        <ThemeSwitcher />
      </div>
    </nav>
  )
}

export default Navbar
