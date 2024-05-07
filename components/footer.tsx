import Link from "next/link"
import React from "react"

const Footer = () => {
  return (
    <footer
      className="py-2 md:py-0 md:h-[6vh] w-full flex justify-center flex-col md:flex-row gap-1 items-center text-sm md:px-12
     bg-black/10 dark:bg-white/10 text-black dark:text-white backdrop-blur-lg"
    >
      <p>
        Build by&nbsp;
        <Link
          href="https://github.com/shrix1"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          shrix1
        </Link>
        .
      </p>
      <p>
        The source code is available on&nbsp;
        <Link
          href="https://github.com/shrix1/seo-checkup"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          GitHub
        </Link>
      </p>
    </footer>
  )
}

export default Footer
