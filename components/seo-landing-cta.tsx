"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useState } from "react"

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return trimmed
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`
  }
  return trimmed
}

export type SeoLandingCtaProps = {
  toolPath: string
  defaultDemoUrl: string
  inputPlaceholder?: string
  buttonLabel?: string
}

export default function SeoLandingCta({
  toolPath,
  defaultDemoUrl,
  inputPlaceholder = "https://example.com",
  buttonLabel = "Try for free",
}: SeoLandingCtaProps) {
  const router = useRouter()
  const [url, setUrl] = useState(defaultDemoUrl)

  return (
    <form
      className="flex flex-col sm:flex-row gap-2 w-full"
      onSubmit={(e) => {
        e.preventDefault()
        const q = normalizeUrl(url) || defaultDemoUrl
        router.push(`${toolPath}?q=${encodeURIComponent(q)}`)
      }}
    >
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={inputPlaceholder}
        className="font-mono"
        aria-label="URL to check"
      />
      <Button type="submit" size="lg" className="shrink-0 w-full sm:w-auto">
        {buttonLabel}
      </Button>
    </form>
  )
}
