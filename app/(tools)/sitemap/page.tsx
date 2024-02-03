import React from "react"
import { AreaChart } from "lucide-react"
import InputField from "./input-field"

const Sitemap = ({ searchParams }: { searchParams: { q: string } }) => {
  return (
    <div className="min-h-screen max-h-full flex items-center flex-col pb-10">
      <section className="flex justify-center flex-col items-center gap-4 mt-3">
        <div
          className="w-11 h-11 flex justify-center items-center rounded-lg
       bg-gradient-to-br from-secondary via-black/20 to-secondary/20 dark:from-primary/30 dark:via-primary/50 dark:to-primary text-black backdrop-blur-md"
        >
          <AreaChart />
        </div>
        <h2 className="text-center text-2xl font-semibold">
          Sitemap Link Checker
        </h2>
      </section>

      <InputField query={decodeURIComponent(searchParams.q)} />
    </div>
  )
}

export default Sitemap
