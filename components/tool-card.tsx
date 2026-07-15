"use client"

import { cn } from "@/lib/utils"
import React, { useState } from "react"
import Link from "next/link"
import { useReducedMotion } from "framer-motion"

const ToolCard = ({
  title,
  content,
  link,
}: {
  title: string
  content: string
  link: string
}) => {
  const [hovered, setHovered] = useState(false)
  const reduceMotion = useReducedMotion()

  return (
    <Link href={link} className="block h-full">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="border relative cursor-pointer flex flex-col group justify-between
         hover:bg-black/50 hover:text-white dark:hover:bg-white/20 hover:backdrop-blur-xl
         transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]
         overflow-hidden p-6 rounded-xl w-full h-full min-h-[180px] bg-background shadow-xl hover:shadow-md"
      >
        {hovered && !reduceMotion && <Meteors number={12} />}
        <div className="z-10 relative">
          <h3 className="text-2xl font-semibold">{title}</h3>
          <p className="text-sm mt-2 font-mono text-muted-foreground group-hover:text-inherit">
            {content}
          </p>
        </div>

        <span className="mt-4 z-10 relative w-fit inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-b-2 border-l-2 border-r-2 border-black/70 dark:border-white/70 bg-gradient-to-tr from-black/80 to-black/50 dark:from-white/80 dark:to-white/50 px-4 py-1 text-white dark:text-black shadow-lg transition duration-[var(--duration-fast)] ease-[var(--ease-out)] active:translate-y-0.5">
          <span className="absolute h-0 w-0 rounded-full bg-white opacity-10 transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)] group-hover:h-32 group-hover:w-32" />
          <span className="relative font-medium">Try Now</span>
        </span>
      </div>
    </Link>
  )
}

export default ToolCard

function meteorStyle(idx: number) {
  const left = ((idx * 73) % 800) - 400
  const delay = 0.2 + ((idx * 37) % 60) / 100
  const duration = 2 + ((idx * 17) % 8)
  return {
    top: 0,
    left: `${left}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  }
}

export const Meteors = ({
  number = 20,
  className,
}: {
  number?: number
  className?: string
}) => {
  const meteors = Array.from({ length: number }, (_, idx) => idx)

  return (
    <>
      {meteors.map((idx) => (
        <span
          key={"meteor" + idx}
          className={cn(
            "animate-meteor-effect absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-muted-foreground/50 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-muted-foreground before:to-transparent",
            className
          )}
          style={meteorStyle(idx)}
        />
      ))}
    </>
  )
}
