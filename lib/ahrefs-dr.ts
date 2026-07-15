export const AHREFS_DR_ATTRIBUTION = {
  text: "Domain Rating by Ahrefs",
  href: "https://ahrefs.com/",
  license: "https://ahrefs.com/legal/domain-rating-license",
} as const

export type DomainRatingResult = {
  domain: string
  domainRating: number | null
  error?: string
}

export async function fetchDomainRating(
  target: string
): Promise<DomainRatingResult> {
  const domain = target
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./i, "")
    .trim()

  if (!domain) {
    return { domain: "", domainRating: null, error: "Invalid domain" }
  }

  try {
    const url = new URL("https://api.ahrefs.com/v3/public/domain-rating-free")
    url.searchParams.set("target", domain)

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(15_000),
      headers: { Accept: "application/json" },
    })

    if (!res.ok) {
      return {
        domain,
        domainRating: null,
        error: `Ahrefs returned ${res.status}`,
      }
    }

    const data = (await res.json()) as {
      domain_rating?: { domain_rating?: number }
      error?: string
    }

    const rating = data.domain_rating?.domain_rating
    if (typeof rating !== "number") {
      return {
        domain,
        domainRating: null,
        error: data.error || "No domain rating returned",
      }
    }

    return { domain, domainRating: rating }
  } catch (err) {
    return {
      domain,
      domainRating: null,
      error: err instanceof Error ? err.message : "Domain rating fetch failed",
    }
  }
}
