"use client"

import { cn } from "@/lib/utils"
import { useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"

const bands = [
  {
    min: 90,
    stroke: "stroke-success",
    text: "text-success",
    bg: "bg-success",
    label: "Strong",
  },
  {
    min: 70,
    stroke: "stroke-primary",
    text: "text-primary",
    bg: "bg-primary",
    label: "Good",
  },
  {
    min: 50,
    stroke: "stroke-warning",
    text: "text-warning",
    bg: "bg-warning",
    label: "Needs work",
  },
  {
    min: 0,
    stroke: "stroke-danger",
    text: "text-danger",
    bg: "bg-danger",
    label: "Critical",
  },
] as const

export function scoreBand(value: number) {
  return bands.find((b) => value >= b.min) ?? bands[bands.length - 1]
}

/**
 * The sweep is a plain CSS transition on stroke-dashoffset rather than a
 * motion library animation. Several rings render at once in a report, and
 * animating an SVG presentation attribute through framer-motion left them
 * frozen partway — the arc then showed a score that was simply wrong. A CSS
 * transition always lands on its final value even if it is interrupted.
 */
export default function ScoreRing({
  value,
  size = 128,
  strokeWidth = 8,
  suffix = "/ 100",
  className,
}: {
  value: number | null
  size?: number
  strokeWidth?: number
  suffix?: string | null
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const [swept, setSwept] = useState(false)

  useEffect(() => {
    // Paint the empty track first, then transition on the next frame.
    const id = requestAnimationFrame(() => setSwept(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const safe = typeof value === "number" ? Math.max(0, Math.min(100, value)) : 0
  const band = scoreBand(safe)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const target = circumference * (1 - safe / 100)
  const settled = reduceMotion || swept

  const numberSize = Math.round(size * 0.28)

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={
        typeof value === "number"
          ? `Score ${Math.round(safe)} out of 100 — ${band.label}`
          : "Score unavailable"
      }
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border"
        />
        {typeof value === "number" && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={band.stroke}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: settled ? target : circumference,
              transition: reduceMotion
                ? undefined
                : "stroke-dashoffset 800ms var(--ease-out)",
            }}
          />
        )}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            "font-mono font-semibold leading-none tracking-tight tabular",
            band.text
          )}
          style={{ fontSize: numberSize }}
        >
          {typeof value === "number" ? Math.round(safe) : "—"}
        </span>
        {suffix && (
          <span className="mt-1 text-[0.6875rem] text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}
