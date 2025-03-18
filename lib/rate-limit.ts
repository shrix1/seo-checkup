import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default function getRatelimit(count: number, time: "24 h" | "72 h") {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(count, time),
    analytics: true,
  });
}
