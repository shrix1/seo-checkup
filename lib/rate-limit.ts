import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

export type RateLimitVerdict = {
  success: boolean
  limit: number
  reset: number
  remaining: number
}

export type RateLimiter = {
  limit: (key: string) => Promise<RateLimitVerdict>
}

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN
const configured = Boolean(url && token)

let warned = false

const redis = configured ? new Redis({ url: url!, token: token! }) : null

/**
 * The shared Upstash client, or null when the env vars are absent. Exported so
 * other modules can cache against the same connection instead of opening their
 * own — callers must handle the null case and degrade without it.
 */
export const redisClient = redis

/**
 * Rate limiter backed by Upstash.
 *
 * When the Upstash env vars are absent — a fresh clone or local dev without an
 * account — every tool route used to throw and return 500. Fall open instead so
 * the app is usable out of the box. Once the vars are set (as they are in
 * production) the real sliding-window limiter is used.
 */
export default function getRatelimit(
  count: number,
  time: "24 h" | "72 h"
): RateLimiter {
  if (!redis) {
    if (!warned) {
      warned = true
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is disabled. Set them before deploying."
      )
    }
    return {
      limit: async () => ({
        success: true,
        limit: count,
        reset: 0,
        remaining: count,
      }),
    }
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(count, time),
    analytics: true,
  })
}
