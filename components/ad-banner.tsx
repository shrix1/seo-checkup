import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

/**
 * Sponsor strip. Inverted ink so it reads as a promo rather than product
 * chrome, but built from tokens so it matches the rest of the system in both
 * themes instead of hardcoding black/white.
 */
const AdBanner = () => {
  return (
    <Link
      href="https://supwriter.com/?utm_source=seo-checkup&utm_medium=banner&utm_campaign=ad-banner"
      target="_blank"
      rel="noopener"
      className="group block w-full bg-foreground text-background"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2.5 gap-y-1 px-4 py-2 text-sm sm:px-6">
        <span className="inline-flex shrink-0 items-center gap-1.5 font-semibold">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Supwriter
        </span>
        <span className="opacity-85">
          Make AI text sound human and undetectable
        </span>
        <span className="hidden shrink-0 rounded-full bg-background/15 px-2 py-0.5 text-xs font-medium sm:inline">
          100K+ users · 50% off
        </span>
        <ArrowRight
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out)] group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
    </Link>
  )
}

export default AdBanner
