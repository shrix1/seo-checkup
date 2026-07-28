import AuditForm from "@/components/audit-form"
import Container from "@/components/container"
import JsonLd from "@/components/json-ld"
import { FadeIn } from "@/components/motion"
import Disclosure from "@/components/ui/disclosure"
import { absoluteUrl } from "@/lib/site"
import { ArrowRight, Check } from "lucide-react"
import Link from "next/link"

export type SeoLandingFaq = {
  question: string
  answer: string
}

export type SeoLandingRelated = {
  href: string
  label: string
}

type SeoToolLandingProps = {
  h1: string
  pitch: string
  toolPath: string
  defaultDemoUrl: string
  inputPlaceholder?: string
  ctaLabel?: string
  benefits: [string, string, string]
  faqs: [SeoLandingFaq, SeoLandingFaq, SeoLandingFaq]
  related: SeoLandingRelated[]
  canonicalPath: string
  appName: string
  blogHref: string
  blogLabel?: string
}

export default function SeoToolLanding({
  h1,
  pitch,
  toolPath,
  defaultDemoUrl,
  inputPlaceholder,
  ctaLabel = "Try for free",
  benefits,
  faqs,
  related,
  canonicalPath,
  appName,
  blogHref,
  blogLabel = "Read the guide",
}: SeoToolLandingProps) {
  const pageUrl = absoluteUrl(canonicalPath)

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }

  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: appName,
    url: pageUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: pitch,
  }

  return (
    <>
      {/* Hero */}
      <section className="border-b">
        <Container width="reading" className="py-16 md:py-20">
          <FadeIn>
            <p className="text-label font-medium uppercase text-muted-foreground">
              Free tool
            </p>
            <h1 className="mt-3 text-title font-semibold sm:text-display">
              {h1}
            </h1>
            <p className="mt-4 max-w-xl text-subhead text-muted-foreground">
              {pitch}
            </p>

            <div className="mt-8 max-w-xl">
              <AuditForm
                toolPath={toolPath}
                defaultValue={defaultDemoUrl}
                placeholder={inputPlaceholder}
                buttonLabel={ctaLabel}
              />
            </div>

            <p className="mt-4 text-sm">
              <Link
                href={blogHref}
                className="inline-flex items-center gap-1.5 text-link underline underline-offset-2"
              >
                {blogLabel}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* What you get */}
      <section className="border-b">
        <Container width="reading" className="py-14 md:py-16">
          <h2 className="text-heading font-semibold">What you get</h2>
          <ul className="mt-5 divide-y rounded-lg border">
            {benefits.map((item) => (
              <li key={item} className="flex items-start gap-3 px-4 py-3.5">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-success"
                  aria-hidden
                />
                <span className="text-body">{item}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-b">
        <Container width="reading" className="py-14 md:py-16">
          <h2 className="text-heading font-semibold">
            Frequently asked questions
          </h2>
          <div className="mt-5 space-y-2">
            {faqs.map((faq, i) => (
              <Disclosure
                key={faq.question}
                defaultOpen={i === 0}
                trigger={
                  <span className="text-body font-medium">{faq.question}</span>
                }
              >
                <p className="py-3.5 text-body text-muted-foreground">
                  {faq.answer}
                </p>
              </Disclosure>
            ))}
          </div>
        </Container>
      </section>

      {/* Related */}
      <section>
        <Container width="reading" className="py-14 md:py-16">
          <h2 className="text-heading font-semibold">Related tools</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {related.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between gap-3 rounded-lg border px-4 py-3.5 text-body transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:border-border-strong hover:bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-medium">{item.label}</span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <JsonLd data={faqJsonLd} />
      <JsonLd data={appJsonLd} />
    </>
  )
}
