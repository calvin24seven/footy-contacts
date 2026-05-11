/**
 * Distributed rate limiter backed by Upstash Redis.
 * Works correctly across all Vercel serverless instances.
 *
 * Requires env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 * (set in Vercel dashboard → Settings → Environment Variables)
 *
 * Falls back to allowing the request if Redis is unavailable, so the
 * app stays online if Redis has an outage.
 */

import { Redis } from "@upstash/redis"

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number // unix ms
}

/**
 * Sliding-window rate limiter using Redis INCR + EXPIRE.
 *
 * @param key     Unique key, e.g. `unlock:${userId}`
 * @param limit   Max requests allowed in the window
 * @param windowSecs  Window duration in seconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSecs: number
): Promise<RateLimitResult> {
  const r = getRedis()
  if (!r) {
    // Redis not configured — fail open (don't break the app)
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSecs * 1000 }
  }

  try {
    const redisKey = `rl:${key}`
    const count = await r.incr(redisKey)
    if (count === 1) {
      await r.expire(redisKey, windowSecs)
    }
    const ttl = await r.ttl(redisKey)
    const resetAt = Date.now() + ttl * 1000
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    }
  } catch {
    // Redis error — fail open
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowSecs * 1000 }
  }
}

/**
 * Daily rate limiter — resets at midnight UTC.
 * Key is automatically scoped to the current UTC day.
 */
export async function rateLimitDaily(
  key: string,
  limit: number
): Promise<RateLimitResult> {
  const today = new Date().toISOString().slice(0, 10) // "2026-05-01"
  const secondsUntilMidnight = 86400 - (Math.floor(Date.now() / 1000) % 86400)
  return rateLimit(`${key}:${today}`, limit, secondsUntilMidnight)
}
