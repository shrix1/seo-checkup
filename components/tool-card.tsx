"use client"
import { cn } from "@/lib/utils"
import React from "react"
import { Button } from "./ui/button"
import Link from "next/link"

const ToolCard = ({
  title,
  content,
  link,
}: {
  title: string
  content: string
  link: string
}) => {
  return (
    <Link href={link}>
      <div
        className="border relative cursor-pointer flex flex-col group justify-between hover:bg-black/50 hover:text-white dark:hover:bg-white/20 hover:backdrop-blur-xl transition-all duration-300
         overflow-hidden p-6 rounded-xl w-full h-full md:w-[360px] md:h-[200px] bg-background shadow-xl hover:shadow-md"
      >
        <div className="z-10 relative">
          <h3 className="text-2xl font-semibold">{title}</h3>
          <p className="text-sm mt-2 font-mono">{content}</p>
        </div>

        <button className="mt-4 md:mt-0 group relative w-fit m-1 inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-b-2 border-l-2 border-r-2 border-black/70 dark:border-white/70 bg-gradient-to-tr from-black/80 to-black/50 dark:from-white/80 dark:to-white/50 px-4 py-1 text-white dark:text-black shadow-lg transition duration-100 ease-in-out active:translate-y-0.5 active:border-black/50 active:shadow-none">
          <span className="absolute h-0 w-0 rounded-full bg-white opacity-10 transition-all duration-300 ease-out group-hover:h-32 group-hover:w-32"></span>
          <span className="relative font-medium">Try Now</span>
        </button>
      </div>
    </Link>
  )
}

export default ToolCard

export const Meteors = ({
  number,
  className,
  hover,
}: {
  number?: number
  className?: string
  hover?: boolean
}) => {
  const meteors = new Array(number || 20).fill(true)
  return (
    <>
      {meteors.map((el, idx) => (
        <span
          key={"meteor" + idx}
          className={cn(
            "animate-meteor-effect absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent",
            className
          )}
          style={{
            top: 0,
            left: Math.floor(Math.random() * (400 - -400) + -400) + "px",
            animationDelay: Math.random() * (0.8 - 0.2) + 0.2 + "s",
            animationDuration: hover
              ? Math.floor(Math.random() * (10 - 2) + 2) + "s"
              : "2s",
          }}
        ></span>
      ))}
    </>
  )
}
