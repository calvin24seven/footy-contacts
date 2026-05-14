import { render } from "@react-email/render"
import { getResendClient } from "./client"
import { TEMPLATES } from "./templates"
import { createUnsubscribeToken } from "./unsubscribe"
import { createAdminClient } from "@/lib/supabase/admin"
import * as Sentry from "@sentry/nextjs"

const FROM_TRANSACTIONAL = "Footy Contacts <noreply@footycontacts.com>"
const FROM_MARKETING     = "Footy Contacts <hello@footycontacts.com>"
const UNSUBSCRIBE_BASE   = "https://footycontacts.com/unsubscribe"

/** Shape of a job row returned by the claim_email_jobs() RPC. Exported for drain.ts. */
export type ClaimedEmailJob = {
  id: string
  idempotency_key: string
  to_email: string
  to_name: string | null
  reply_to: string | null
  template_id: string
  template_props: Record<string, unknown>
  category: "transactional" | "marketing"
  attempt_count: number
  max_attempts: number
}

/** Called with a job row already in 'sending' status (claimed by RPC). */
export async function sendClaimedEmailJob(job: ClaimedEmailJob): Promise<void> {
  const supabase = createAdminClient()

  return await Sentry.startSpan(
    {
      name:       "email.send",
      op:         "email",
      attributes: {
        "email.template": job.template_id,
        "email.category": job.category,
      },
    },
    async () => {
      try {
        // ── 1. Suppression check (category-aware) ────────────
        // category='all'       → blocks every email (bounce/complaint/manual/invalid)
        // category='marketing' → blocks marketing sends only (unsubscribe)
        const { data: suppressions } = await supabase
          .from("email_suppressions")
          .select("reason, category")
          .eq("email", job.to_email)
          .in("category", ["all", job.category])

        if (suppressions && suppressions.length > 0) {
          await supabase
            .from("email_jobs")
            .update({
              status:       "cancelled",
              cancelled_at: new Date().toISOString(),
              locked_at:    null,
              last_error:   `Suppressed: ${suppressions[0].reason} (scope: ${suppressions[0].category})`,
            })
            .eq("id", job.id)
          return
        }

        // ── 2. Render template ────────────────────────────────
        const templateId = job.template_id as keyof typeof TEMPLATES
        if (!TEMPLATES[templateId]) throw new Error(`Unknown template: ${job.template_id}`)

        // Re-validate props at send time — guards against DB corruption, schema drift,
        // manual edits, or props written before a breaking template change.
        const { element, subject } = renderTemplate(templateId, job.template_props)
        const html = await render(element)
        const text = await render(element, { plainText: true })

        // ── 3. Build send options ─────────────────────────────
        const from      = job.category === "transactional" ? FROM_TRANSACTIONAL : FROM_MARKETING
        const recipient = job.to_name
          ? `${job.to_name} <${job.to_email}>`
          : job.to_email

        const headers: Record<string, string> = {}
        if (job.category === "marketing") {
          // RFC 8058 one-click unsubscribe — mandatory for bulk/marketing sends
          const unsubCategory = "marketing"
          const unsubToken    = createUnsubscribeToken(job.to_email, unsubCategory)
          const unsubUrl      =
            `${UNSUBSCRIBE_BASE}?email=${encodeURIComponent(job.to_email)}&category=${unsubCategory}&token=${unsubToken}`
          headers["List-Unsubscribe"] =
            `<mailto:unsubscribe@footycontacts.com?subject=unsubscribe>, <${unsubUrl}>`
          headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
        }

        // ── 4. Send via Resend with provider idempotency key ──
        const resend = getResendClient()
        const { data: sent, error: sendErr } = await resend.emails.send(
          {
            from,
            to:      recipient,
            replyTo: job.reply_to ?? undefined,
            subject,
            html,
            text,
            headers,
          },
          {
            idempotencyKey: job.idempotency_key.slice(0, 256),
          }
        )

        if (sendErr) throw sendErr

        // ── 5. Mark as sent ───────────────────────────────────
        const { error: updateErr } = await supabase
          .from("email_jobs")
          .update({
            status:            "sent",
            resend_message_id: sent!.id,
            sent_at:           new Date().toISOString(),
            locked_at:         null,
          })
          .eq("id", job.id)

        if (updateErr) throw updateErr

      } catch (err) {
        await handleSendFailure(job.id, job.attempt_count, job.max_attempts, String(err))
        Sentry.captureException(err, {
          tags:  { component: "email-sender", template: job.template_id },
          // NEVER include template_props — may contain PII
          extra: { jobId: job.id, attemptCount: job.attempt_count },
        })
        throw err
      }
    }
  )
}

/**
 * Typed render helper — infers the correct props type per template so that
 * schema.parse(), component(), and subject() are all consistent.
 * Isolates the one unavoidable Zod `unknown → T` cast in a single place.
 */
function renderTemplate<K extends keyof typeof TEMPLATES>(
  templateId: K,
  rawProps: unknown
): { element: ReturnType<(typeof TEMPLATES)[K]["component"]>; subject: string } {
  const template    = TEMPLATES[templateId]
  const parsedProps = template.schema.parse(rawProps) as Parameters<(typeof TEMPLATES)[K]["component"]>[0]
  return {
    element: template.component(parsedProps as never) as ReturnType<(typeof TEMPLATES)[K]["component"]>,
    subject: template.subject(parsedProps as never),
  }
}

async function handleSendFailure(
  jobId: string,
  attemptCount: number,  // already incremented by the claim RPC
  maxAttempts: number,
  errorMsg: string
): Promise<void> {
  const supabase  = createAdminClient()
  const exhausted = attemptCount >= maxAttempts
  // Exponential backoff: 2^attempt minutes (2→4→8→16→32 min)
  const backoffMs = Math.pow(2, attemptCount) * 60 * 1000

  await supabase
    .from("email_jobs")
    .update({
      status:        exhausted ? "failed"  : "pending",
      last_error:    errorMsg.slice(0, 2000),
      next_retry_at: exhausted ? null : new Date(Date.now() + backoffMs).toISOString(),
      locked_at:     null,
      failed_at:     exhausted ? new Date().toISOString() : null,
    })
    .eq("id", jobId)

  if (exhausted) {
    Sentry.captureMessage("Email job exhausted retries → DLQ", {
      level: "error",
      tags:  { component: "email-dlq" },
      extra: { jobId, errorMsg: errorMsg.slice(0, 500) },
    })
  }
}
