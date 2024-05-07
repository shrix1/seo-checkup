import Link from "next/link"
import React from "react"

const Footer = () => {
  return (
    <footer
      className="h-[8vh] flex justify-center md:justify-start items-center text-sm md:px-12
     bg-black/10 dark:bg-white/10 text-black dark:text-white backdrop-blur-lg"
    >
      Build by&nbsp;
      <Link
        href="https://github.com/shrix1"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        shrix1
      </Link>
      .&nbsp; The source code is available on&nbsp;
      <Link
        href="https://github.com/shrix1/seo-checkup"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        GitHub
      </Link>
    </footer>
  )
}

export default Footer
