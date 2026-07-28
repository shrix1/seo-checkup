"use client"

import { useState, useEffect } from "react"
import { Coffee, X } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { easeOut } from "@/components/motion"

export default function BuyMeCoffee() {
  const [showMessage, setShowMessage] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const dismissed = localStorage.getItem("bmc-dismissed")
    if (!dismissed) {
      const timer = setTimeout(() => {
        setShowMessage(true)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setShowMessage(false)
    localStorage.setItem("bmc-dismissed", "true")
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2">
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg pl-4 pr-2 py-3"
          >
            <a
              href="https://www.buymeacoffee.com/shrix1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <span className="font-medium">Hi, I&apos;m Shri</span>
              <br />
              If this site helped you, support me here!
            </a>
            <button
              onClick={handleClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1"
              aria-label="Dismiss support message"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <a
        href="https://www.buymeacoffee.com/shrix1"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-primary hover:bg-primary/90 p-3 rounded-full shadow-lg transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:scale-110"
        aria-label="Buy me a coffee"
      >
        <Coffee className="w-6 h-6 text-primary-foreground" />
      </a>
    </div>
  )
}
