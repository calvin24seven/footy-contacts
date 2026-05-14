import { rateLimit } from "@/lib/rate-limit"
import type { TemplateId } from "./templates"

interface EmailRateLimitOptions {
  userId: string | undefined
  email: string
  templateId: TemplateId
}

/**
 * Per-template, per-user limits — prevents one template from starving others.
 * windowSecs: 3600 = 1 hour
 */
const TEMPLATE_LIMITS: Record<string, { requests: number; windowSecs: number }> = {
  welcome:              { requests: 3,  windowSecs: 3600 },
  "export-ready":       { requests: 20, windowSecs: 3600 },
  "unlock-confirmation": { requests: 50, windowSecs: 3600 },
}
const DEFAULT_LIMIT = { requests: 10, windowSecs: 3600 }

export async function assertEmailRateLimit(opts: EmailRateLimitOptions): Promise<void> {
  if (!opts.userId) return

  const limit = TEMPLATE_LIMITS[opts.templateId] ?? DEFAULT_LIMIT
  // Key includes templateId so one template's usage does not block another
  const key = `email:enqueue:${opts.userId}:${opts.templateId}`
  const result = await rateLimit(key, limit.requests, limit.windowSecs)

  if (!result.allowed) {
    throw new Error(
      `Email rate limit exceeded for user ${opts.userId} (template: ${opts.templateId}). ` +
        `Resets at ${new Date(result.resetAt).toISOString()}.`
    )
  }
}
