import Container from "@/components/container"
import JsonLd from "@/components/json-ld"
import { FadeIn } from "@/components/motion"
import { TocRail, type TocItem } from "@/components/toc"
import { Button } from "@/components/ui/button"
import { LEARN_SECTIONS, LEARN_UPDATED } from "@/lib/learn"
import { SITE_URL, absoluteUrl } from "@/lib/site"
import { constructMetadata } from "@/lib/utils"
import type { Metadata } from "next"
import { ArrowRight, Check, Info, Search } from "lucide-react"
import Link from "next/link"

const CANONICAL = "/learn"

export const metadata: Metadata = constructMetadata({
  title: "SEO vs PSEO vs AEO vs GEO | SeoCheckup",
  description:
    "What SEO, programmatic SEO, answer engine optimization and generative engine optimization each mean, and which are actually worth your time.",
  canonical: CANONICAL,
})

const tocItems: TocItem[] = [
  { id: "overview", label: "Overview" },
  ...LEARN_SECTIONS.map((s) => ({ id: s.id, label: s.acronym })),
  { id: "where-to-start", label: "Where to start" },
]

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "SEO vs PSEO vs AEO vs GEO — what each one means",
  description:
    "What SEO, programmatic SEO, answer engine optimization and generative engine optimization each mean, and what to fix first.",
  datePublished: LEARN_UPDATED,
  dateModified: LEARN_UPDATED,
  url: absoluteUrl(CANONICAL),
  mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(CANONICAL) },
  author: { "@type": "Organization", name: "SeoCheckup", url: SITE_URL },
  publisher: { "@type": "Organization", name: "SeoCheckup", url: SITE_URL },
}

// The page answers explicit questions, so it declares them as such — the same
// signal the AEO section tells you to add.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: LEARN_SECTIONS.map((s) => ({
    "@type": "Question",
    name: s.question,
    acceptedAnswer: { "@type": "Answer", text: s.answer },
  })),
}

export default function LearnPage() {
  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={faqJsonLd} />

      <section className="border-b">
        <Container width="reading" className="py-14 md:py-20">
          <FadeIn>
            <p className="text-label font-medium uppercase text-muted-foreground">
              Guide · updated {LEARN_UPDATED}
            </p>
            <h1 className="mt-3 text-title font-semibold sm:text-display">
              SEO, PSEO, AEO and GEO — what each one means
            </h1>
            <p className="mt-4 text-subhead text-muted-foreground">
              Four acronyms, one dependency chain. Each layer only pays off once
              the one beneath it works, so this page explains what each is,
              what SeoCheckup measures for it, and what to fix first.
            </p>

            <dl className="mt-8 divide-y rounded-lg border">
              {LEARN_SECTIONS.map((section) => (
                <div
                  key={section.id}
                  className="grid gap-1 px-4 py-3 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-4"
                >
                  <dt>
                    <a
                      href={`#${section.id}`}
                      className="font-mono text-sm font-medium text-link underline underline-offset-2"
                    >
                      {section.acronym}
                    </a>
                  </dt>
                  <dd className="text-body text-muted-foreground">
                    {section.short}
                  </dd>
                </div>
              ))}
            </dl>
          </FadeIn>
        </Container>
      </section>

      <Container width="reading" className="relative py-14 md:py-16">
        <TocRail items={tocItems} />

        <section id="overview" className="scroll-mt-28">
          <h2 className="text-heading font-semibold">
            How the four fit together
          </h2>
          <div className="mt-3 space-y-4 text-body text-muted-foreground">
            <p>
              SEO is the base: can a machine fetch your page, understand it, and
              decide it is worth surfacing. PSEO is SEO applied at scale, which
              mostly means keeping thousands of generated pages from collapsing
              into duplicates.
            </p>
            <p>
              AEO changes the target. Instead of ranking a link, you are trying
              to be the passage an assistant quotes — which rewards
              extractability, clear structure and formats machines read cheaply.
              GEO is the layer above that: how your brand comes out across
              generative answers, including from sources you do not own.
            </p>
            <p>
              None of them replaced the last one. A page that answer engines
              cannot fetch is invisible to all four.
            </p>
          </div>
        </section>

        <div className="mt-14 space-y-14">
          {LEARN_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <p className="font-mono text-label font-medium uppercase text-muted-foreground">
                {section.acronym}
              </p>
              <h2 className="mt-2 text-heading font-semibold">
                {section.question}
              </h2>

              {/* Self-contained answer directly under the heading — the shape
                  answer engines actually lift into a response. */}
              <p className="mt-3 text-subhead">{section.answer}</p>

              <div className="mt-4 space-y-3 text-body text-muted-foreground">
                {section.body.map((para) => (
                  <p key={para.slice(0, 40)}>{para}</p>
                ))}
              </div>

              {section.caveat && (
                <p className="mt-5 flex items-start gap-2.5 rounded-lg border bg-surface-1 px-4 py-3 text-sm text-muted-foreground">
                  <Info
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <span>{section.caveat}</span>
                </p>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border">
                  <h3 className="border-b bg-surface-1 px-4 py-2 text-label font-medium uppercase text-muted-foreground">
                    What SeoCheckup measures
                  </h3>
                  <ul className="divide-y">
                    {section.checks.map((item) => (
                      <li key={item} className="flex gap-2.5 px-4 py-2.5">
                        <Search
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        <span className="text-sm text-muted-foreground">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border">
                  <h3 className="border-b bg-surface-1 px-4 py-2 text-label font-medium uppercase text-muted-foreground">
                    What to do
                  </h3>
                  <ul className="divide-y">
                    {section.actions.map((item) => (
                      <li key={item} className="flex gap-2.5 px-4 py-2.5">
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
                          aria-hidden
                        />
                        <span className="text-sm text-muted-foreground">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center gap-1.5 text-link underline underline-offset-2"
                  >
                    {link.label}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section id="where-to-start" className="mt-16 scroll-mt-28 border-t pt-10">
          <h2 className="text-heading font-semibold">Where to start</h2>
          <p className="mt-3 text-body text-muted-foreground">
            Run one audit. It scores all four layers on the same page — crawl
            access, on-page, security, AI crawler access and answer-engine
            readiness — and orders every finding worst-first, so the top of the
            list is where to begin.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/audit">Run a free audit</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/blog">Read the guides</Link>
            </Button>
          </div>
        </section>
      </Container>
    </>
  )
}
