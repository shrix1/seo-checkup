import SeoToolLanding from "@/components/seo-tool-landing"
import { blogPath, features } from "@/lib/site"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

const feature = features.coreWebVitals

export const metadata: Metadata = constructMetadata({
  title: "Free Core Web Vitals Checker | SeoCheckup",
  description:
    "Check LCP, INP and CLS for any URL free. Real Chrome user data where it exists, clearly labelled apart from lab simulation. Mobile and desktop.",
  canonical: feature.landingPath,
  ogImage: "/og/og-core-web-vitals.svg",
})

export default function CoreWebVitalsLandingPage() {
  return (
    <SeoToolLanding
      h1="Free Core Web Vitals Checker"
      pitch="LCP, INP and CLS for any URL. We show real Chrome user data when it exists and say plainly when we are falling back to a lab simulation — because the two disagree, and only one is a ranking signal."
      toolPath={feature.toolPath}
      defaultDemoUrl="shrix1.com"
      inputPlaceholder="https://example.com"
      canonicalPath={feature.landingPath}
      appName={feature.appName}
      blogHref={feature.blogSlug ? blogPath(feature.blogSlug) : undefined}
      blogLabel={feature.blogLabel}
      benefits={[
        "Real Chrome user data (CrUX) at the 75th percentile where available",
        "Every metric labelled field or lab — never silently swapped",
        "Mobile and desktop, with mobile first because Google indexes that way",
      ]}
      faqs={[
        {
          question: "What are Core Web Vitals?",
          answer:
            "Three metrics Google uses as a ranking signal: Largest Contentful Paint (loading, good is under 2.5s), Interaction to Next Paint (responsiveness, good is under 200ms), and Cumulative Layout Shift (visual stability, good is under 0.1).",
        },
        {
          question: "What is the difference between field and lab data?",
          answer:
            "Field data is real Chrome telemetry from people who actually visited your page in the last 28 days, and it is what Google ranks on. Lab data is one simulated run in a data centre. They can differ enormously — we measured a site with a 16ms lab TTFB against 893ms in the field.",
        },
        {
          question: "Why does my site show no field data?",
          answer:
            "The Chrome UX Report only samples origins with enough traffic. Below that threshold no field data exists, so we fall back to a lab run and label it as such rather than presenting a simulation as real user experience.",
        },
        {
          question: "Why is INP sometimes reported as no data?",
          answer:
            "INP can only be measured from real interactions, so it has no lab equivalent. Rather than substituting Total Blocking Time and calling it INP, we report no data and show TBT separately as the closest proxy.",
        },
        {
          question: "Do Core Web Vitals really affect rankings?",
          answer:
            "Yes, but modestly. Google treats them as a tiebreaker rather than a primary factor — relevance still wins. Fix crawlability and content first, then speed.",
        },
      ]}
      related={[
        { href: "/site-audit", label: "Website SEO Audit" },
        { href: "/meta-tags-checker", label: "Meta Tags Checker" },
        { href: "/robots-txt-checker", label: "Robots.txt Checker" },
      ]}
    />
  )
}
