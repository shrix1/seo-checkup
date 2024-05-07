import React from "react"
import { FileImage } from "lucide-react"
import type { Metadata } from "next"
import { constructMetadata } from "@/lib/utils"
import InputFieldMetadata from "./input-field"

export const metadata: Metadata = constructMetadata({
  title: "Metdata Checker | SeoCheckup",
  description: "Easily review your metadata by adding your site link.",
  canonical: "/metadata",
  ogImage: "/og-dark.png",
})

const MetaData = ({ searchParams }: { searchParams: { q: string } }) => {
  return (
    <div className="min-h-screen max-h-full flex items-center flex-col pb-10 px-4 md:px-0">
      <section className="flex justify-center flex-col items-center gap-4 mt-3">
        <div
          className="w-11 h-11 flex justify-center items-center rounded-lg
       bg-gradient-to-br from-secondary via-black/20 to-secondary/20 dark:from-primary/30 dark:via-primary/50 dark:to-primary text-black backdrop-blur-md"
        >
          <FileImage />
        </div>
        <h2 className="text-center text-2xl font-semibold">MetaData Checker</h2>
        <InputFieldMetadata query={searchParams.q} />
      </section>
    </div>
  )
}

export default MetaData
