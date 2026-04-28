/**
 * Secret accessor for Next.js server-side code (API routes, server components).
 *
 * All application secrets live in Vercel Environment Variables (or .env.local for local dev).
 * Convention: secret name uses snake_case → env var is the same in SCREAMING_SNAKE_CASE.
 *   getSecret("reoon_api_key")      → process.env.REOON_API_KEY
 *   getSecret("stripe_secret_key")  → process.env.STRIPE_SECRET_KEY
 *
 * DO NOT use this from client components — server-side only.
 *
 * Required env vars (set in Vercel dashboard → Settings → Environment Variables,
 * and in apps/web/.env.local for local dev):
 *   REOON_API_KEY
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 */

// Module-level cache — avoids repeated env lookups in warm serverless instances
const _cache = new Map<string, string>()

export function getSecret(name: string): string {
  if (_cache.has(name)) return _cache.get(name)!

  const envKey = name.toUpperCase()
  const value = process.env[envKey]

  if (!value) {
    throw new Error(
      `Secret '${name}' not found. Add '${envKey}' to Vercel Environment Variables ` +
      `(Settings → Environment Variables) or apps/web/.env.local for local dev.`
    )
  }

  _cache.set(name, value)
  return value
}
