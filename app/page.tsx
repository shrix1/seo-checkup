import HomeHero from "@/components/home-hero"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next/types"

export const metadata: Metadata = constructMetadata({
  canonical: "/",
})

export default function Home() {
  return <HomeHero />
}
