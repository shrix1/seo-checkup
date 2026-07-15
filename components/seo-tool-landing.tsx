import JsonLd from "@/components/json-ld"
import SeoLandingCta from "@/components/seo-landing-cta"
import { Button } from "@/components/ui/button"
import { absoluteUrl } from "@/lib/site"
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
    <section className="relative flex justify-center flex-col items-center min-h-[83vh]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-background
          bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)]
          bg-[size:6rem_4rem]
          [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]"
      />

      <main className="w-full max-w-2xl px-4 py-16 md:py-24">
        <p className="font-mono text-sm text-muted-foreground">SeoCheckup</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight font-mono">
          {h1}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-muted-foreground">
          {pitch}
        </p>

        <div className="mt-8 space-y-3">
          <SeoLandingCta
            toolPath={toolPath}
            defaultDemoUrl={defaultDemoUrl}
            inputPlaceholder={inputPlaceholder}
            buttonLabel={ctaLabel}
          />
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="outline">
              <Link href={blogHref}>{blogLabel}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-14">
          <h2 className="text-lg font-semibold">What you get</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc pl-5">
            {benefits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-14">
          <h2 className="text-lg font-semibold">FAQ</h2>
          <dl className="mt-4 space-y-5">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="font-medium">{faq.question}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <nav
          aria-label="Related links"
          className="mt-14 pt-8 border-t flex flex-wrap gap-x-4 gap-y-2 text-sm"
        >
          <Link href="/" className="underline underline-offset-2">
            Home
          </Link>
          <Link
            href={blogHref}
            className="underline underline-offset-2 text-muted-foreground hover:text-foreground"
          >
            {blogLabel}
          </Link>
          {related.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="underline underline-offset-2 text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </main>

      <JsonLd data={faqJsonLd} />
      <JsonLd data={appJsonLd} />
    </section>
  )
}
