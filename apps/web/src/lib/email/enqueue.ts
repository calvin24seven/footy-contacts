import { createAdminClient } from "@/lib/supabase/admin"
import { TEMPLATES, type TemplateId } from "./templates"
import { assertEmailRateLimit } from "./rate-limit"
import * as Sentry from "@sentry/nextjs"

export interface EnqueueEmailOptions {
  /** Stable business-event key — e.g. "welcome:user_123" */
  idempotencyKey: string
  to: { email: string; name?: string }
  replyTo?: string
  templateId: TemplateId
  templateProps: Record<string, unknown>
  userId?: string
  maxAttempts?: number
  sendAfter?: Date
}

/**
 * Enqueues an email job. Returns job ID, or null if already enqueued (idempotent).
 */
export async function enqueueEmail(opts: EnqueueEmailOptions): Promise<string | null> {
  const template = TEMPLATES[opts.templateId]

  // Validate props against template's Zod schema — throws on invalid input
  const parsedProps = template.schema.parse(opts.templateProps)

  const toEmail = opts.to.email.toLowerCase().trim()

  await assertEmailRateLimit({
    userId:     opts.userId,
    email:      toEmail,
    templateId: opts.templateId,
  })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("email_jobs")
    .upsert(
      {
        idempotency_key: opts.idempotencyKey,
        to_email:        toEmail,
        to_name:         opts.to.name ?? null,
        reply_to:        opts.replyTo ?? null,
        template_id:     opts.templateId,
        template_props:  parsedProps,
        category:        template.category,
        user_id:         opts.userId ?? null,
        max_attempts:    opts.maxAttempts ?? 5,
        next_retry_at:   opts.sendAfter?.toISOString() ?? null,
        status:          "pending",
      },
      {
        onConflict:       "idempotency_key",
        ignoreDuplicates: true,  // second call with same key is a no-op
      }
    )
    .select("id")
    .maybeSingle()

  if (error) {
    Sentry.captureException(error, {
      tags:  { component: "email-enqueue", template: opts.templateId },
      extra: { idempotencyKey: opts.idempotencyKey },
    })
    throw new Error(`Failed to enqueue email: ${error.message}`)
  }

  return data?.id ?? null
}
