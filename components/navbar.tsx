"use client"

import { features } from "@/lib/site"
import { cn } from "@/lib/utils"
import { Flame, Github, Menu, Twitter, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useState } from "react"
import { ThemeSwitcher } from "./theme"
import { Button, buttonVariants } from "./ui/button"

/**
 * Paths come from the `features` registry so nav, footer, and sitemap.ts can
 * never drift apart. Links point at bare tool paths — they previously hardcoded
 * `?q=https://shrix1.com`, so every nav click audited the author's own site.
 */
const navTools = [
  { label: "Site Audit", href: features.audit.toolPath },
  { label: "Domain Rating", href: features.domainRating.toolPath },
  { label: "Sitemap", href: features.sitemap.toolPath },
  { label: "Meta Tags", href: features.metadata.toolPath },
  { label: "Robots", href: features.robots.toolPath },
] as const

const Navbar = () => {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPath, setMenuPath] = useState(pathname)

  // Close the mobile menu when the route changes. Adjusting state during
  // render rather than in an effect avoids a cascading re-render.
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setMenuOpen(false)
  }

  return (
    <header className="w-full border-b bg-background/85 backdrop-blur-lg">
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6"
      >
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Flame className="h-5 w-5 text-primary" aria-hidden />
            <span className="text-[0.9375rem] font-semibold tracking-tight">
              SeoCheckup
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navTools.map((tool) => {
              const active = pathname === tool.href
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-md px-2.5 py-1.5 text-sm transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tool.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-2.5 -bottom-[13px] h-px bg-primary"
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/blog"
            aria-current={pathname.startsWith("/blog") ? "page" : undefined}
            className={cn(
              "hidden rounded-md px-2.5 py-1.5 text-sm transition-colors sm:block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              pathname.startsWith("/blog")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Blog
          </Link>

          {/* Styled as links rather than <Button asChild> — an anchor is the
              correct element here, and it avoids Radix's Slot wrapper. */}
          <Link
            href="https://x.com/shribuilds"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="SeoCheckup on X"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <Twitter className="h-[18px] w-[18px]" aria-hidden />
          </Link>

          <Link
            href="https://github.com/shrix1/seo-checkup"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Source on GitHub"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <Github className="h-[18px] w-[18px]" aria-hidden />
          </Link>

          <ThemeSwitcher />

          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <X className="h-[18px] w-[18px]" aria-hidden />
            ) : (
              <Menu className="h-[18px] w-[18px]" aria-hidden />
            )}
          </Button>
        </div>
      </nav>

      {menuOpen && (
        <div
          id="mobile-nav"
          className="animate-in fade-in-0 slide-in-from-top-1 border-t bg-background lg:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2 sm:px-6">
            {navTools.map((tool) => {
              const active = pathname === tool.href
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-2 py-2.5 text-sm transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-surface-1 hover:text-foreground"
                  )}
                >
                  {tool.label}
                </Link>
              )
            })}
            <Link
              href="/blog"
              className={cn(
                "rounded-md px-2 py-2.5 text-sm transition-colors sm:hidden",
                pathname.startsWith("/blog")
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-surface-1 hover:text-foreground"
              )}
            >
              Blog
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
