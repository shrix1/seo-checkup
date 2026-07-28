"use client"

import { cn } from "@/lib/utils"
import { motion, useReducedMotion } from "framer-motion"
import { easeOut } from "@/components/motion"

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
  const safe = typeof value === "number" ? Math.max(0, Math.min(100, value)) : 0
  const band = scoreBand(safe)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - safe / 100)

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
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            className={band.stroke}
            initial={
              reduceMotion
                ? { strokeDashoffset: offset }
                : { strokeDashoffset: circumference }
            }
            animate={{ strokeDashoffset: offset }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 0.8, ease: easeOut }
            }
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
