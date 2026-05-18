import { createAdminClient } from "@/lib/supabase/admin"
import { sendClaimedEmailJob, type ClaimedEmailJob } from "./sender"
import * as Sentry from "@sentry/nextjs"

const BATCH_SIZE   = 50   // Resend rate-limits at 5 req/sec; sequential sends at ~200ms each = ~10s per drain
const LOCK_MINUTES = 5   // requeue jobs stuck in 'sending' longer than this

export async function drainEmailQueue(): Promise<{
  requeued: number
  claimed:  number
  sent:     number
  failed:   number
}> {
  const supabase = createAdminClient()

  // Recover jobs stuck in 'sending' from a crashed prior invocation
  const { data: requeued } = await supabase.rpc(
    "requeue_stuck_email_jobs",
    { lock_minutes: LOCK_MINUTES }
  )

  // Atomically claim a batch — FOR UPDATE SKIP LOCKED inside the RPC
  const { data: jobs, error: claimErr } = await supabase.rpc(
    "claim_email_jobs",
    { batch_size: BATCH_SIZE }
  )

  if (claimErr) {
    Sentry.captureException(claimErr, { tags: { component: "email-drain" } })
    return { requeued: requeued ?? 0, claimed: 0, sent: 0, failed: 0 }
  }

  // Alert if DLQ has unresolved jobs
  const { count: dlqCount } = await supabase
    .from("email_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed")

  if (dlqCount && dlqCount > 0) {
    Sentry.captureMessage(`Email DLQ has ${dlqCount} unresolved job(s)`, {
      level: "error",
      tags:  { component: "email-dlq" },
      extra: { dlqCount },
    })
  }

  const claimedJobs = (jobs ?? []) as ClaimedEmailJob[]

  // Send sequentially to stay within Resend's 5 req/sec rate limit.
  // At ~200ms per send, 50 jobs = ~10s per drain — well within Vercel's timeout.
  let sent = 0
  let failed = 0
  for (const job of claimedJobs) {
    try {
      await sendClaimedEmailJob(job)
      sent++
    } catch {
      failed++
    }
  }

  return {
    requeued: requeued ?? 0,
    claimed:  claimedJobs.length,
    sent,
    failed,
  }
}
