/**
 * Distributed rate limiter backed by Upstash Redis.
 * Works correctly across all Vercel serverless instances.
 *
 * Requires env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 * (set in Vercel dashboard → Settings → Environment Variables)
 *
 * Fail behaviour:
 *   - Per-call: pass { failClosed: true } to reject on Redis unavailability/error.
 *   - Global:   set RATE_LIMIT_FAIL_CLOSED=1 env var to fail closed by default.
 *   - Default:  fail open (allow) so the app stays online if Redis has an outage.
 *
 * The unlock endpoint always passes failClosed: true regardless of the env var.
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

interface RateLimitOptions {
  /** When true, a Redis outage rejects the request (returns allowed:false). Default: false. */
  failClosed?: boolean
}

/**
 * Sliding-window rate limiter using Redis INCR + EXPIRE.
 *
 * @param key     Unique key, e.g. `unlock:${userId}`
 * @param limit   Max requests allowed in the window
 * @param windowSecs  Window duration in seconds
 * @param options Optional behaviour flags (failClosed)
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSecs: number,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const r = getRedis()
  const failClosed = options.failClosed ?? process.env.RATE_LIMIT_FAIL_CLOSED === "1"

  if (!r) {
    // Redis not configured (missing env vars) — fail open regardless of failClosed.
    // failClosed is intended for Redis outages, not for environments where Redis was
    // never set up. Blocking all users when Redis is simply absent is wrong.
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
    return failClosed
      ? { allowed: false, remaining: 0, resetAt: Date.now() + windowSecs * 1000 }
      : { allowed: true, remaining: limit, resetAt: Date.now() + windowSecs * 1000 }
  }
}

/**
 * Daily rate limiter — resets at midnight UTC.
 * Key is automatically scoped to the current UTC day.
 */
export async function rateLimitDaily(
  key: string,
  limit: number,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const today = new Date().toISOString().slice(0, 10) // "2026-05-01"
  const secondsUntilMidnight = 86400 - (Math.floor(Date.now() / 1000) % 86400)
  return rateLimit(`${key}:${today}`, limit, secondsUntilMidnight, options)
}

