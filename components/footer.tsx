import Container from "@/components/container"
import { blogPath, features, type FeatureKey } from "@/lib/site"
import { Flame } from "lucide-react"
import Link from "next/link"
import React from "react"

const order: FeatureKey[] = [
  "audit",
  "domainRating",
  "sitemap",
  "metadata",
  "robots",
]

const linkClass =
  "rounded-sm text-muted-foreground transition-colors duration-[var(--duration-fast)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

/** Sibling products — ref param mirrors the one used by the sponsor banner */
const moreFromUs = [
  { label: "Supwriter", href: "https://supwriter.com/?ref=seo-checkup" },
  { label: "Blazescribe", href: "https://blazescribe.com/?ref=seo-checkup" },
  { label: "FreeTools", href: "https://freetoolsfr.com/?ref=seo-checkup" },
]

const Footer = () => {
  return (
    <footer className="mt-16 border-t">
      <Container width="page" className="py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" aria-hidden />
              <span className="text-sm font-semibold tracking-tight">
                SeoCheckup
              </span>
            </Link>
            <p className="mt-3 max-w-[24ch] text-sm text-muted-foreground">
              Free technical SEO checks. No account, nothing paywalled.
            </p>
          </div>

          <nav aria-labelledby="footer-tools">
            <h2
              id="footer-tools"
              className="text-label font-medium uppercase text-muted-foreground"
            >
              Tools
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {order.map((key) => (
                <li key={key}>
                  <Link href={features[key].landingPath} className={linkClass}>
                    {features[key].landingLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-guides">
            <h2
              id="footer-guides"
              className="text-label font-medium uppercase text-muted-foreground"
            >
              Guides
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/learn" className={linkClass}>
                  SEO vs PSEO vs AEO vs GEO
                </Link>
              </li>
              {order.map((key) => (
                <li key={key}>
                  <Link
                    href={blogPath(features[key].blogSlug)}
                    className={linkClass}
                  >
                    {features[key].blogLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-about">
            <h2
              id="footer-about"
              className="text-label font-medium uppercase text-muted-foreground"
            >
              About
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/" className={linkClass}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/blog" className={linkClass}>
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/shrix1/seo-checkup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  GitHub
                </Link>
              </li>
              <li>
                <Link
                  href="https://x.com/shribuilds"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  X / Twitter
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <nav
          aria-label="More from us"
          className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 border-y py-4 text-sm"
        >
          <span className="font-mono text-label uppercase text-muted-foreground">
            More from us
          </span>
          <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
          {moreFromUs.map((item, i) => (
            <React.Fragment key={item.href}>
              {i > 0 && (
                <span className="text-muted-foreground/50" aria-hidden>
                  ·
                </span>
              )}
              <Link
                href={item.href}
                target="_blank"
                rel="noopener"
                className={linkClass}
              >
                {item.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>

        <div className="mt-6 text-sm text-muted-foreground">
          <p>
            Built by{" "}
            <Link
              href="https://dub.sh/shri"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2"
            >
              shrix1
            </Link>
            . Source on{" "}
            <Link
              href="https://github.com/shrix1/seo-checkup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2"
            >
              GitHub
            </Link>
            .
          </p>
        </div>
      </Container>
    </footer>
  )
}

export default Footer
