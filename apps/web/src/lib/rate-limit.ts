/**
 * Lightweight in-memory rate limiter.
 * Works per-serverless-instance; good enough to deter casual scrapers.
 * For production at scale, replace with Upstash Redis.
 */

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number
  /** Window size in milliseconds */
  windowMs: number
}

/**
 * Returns true if the key is within limits, false if rate-limited.
 */
export function rateLimit(key: string, opts: RateLimitOptions): boolean {
  const now = Date.now()
  const win = store.get(key)

  if (!win || now >= win.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs })
    return true
  }

  if (win.count >= opts.limit) return false

  win.count++
  return true
}
