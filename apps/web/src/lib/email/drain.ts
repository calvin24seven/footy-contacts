import { createAdminClient } from "@/lib/supabase/admin"
import { sendClaimedEmailJob, type ClaimedEmailJob } from "./sender"
import * as Sentry from "@sentry/nextjs"

const BATCH_SIZE   = 350  // ~half the reactivation audience — spreads Email 1 over 2 days
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
  const results = await Promise.allSettled(
    claimedJobs.map((job) => sendClaimedEmailJob(job))
  )

  return {
    requeued: requeued ?? 0,
    claimed:  claimedJobs.length,
    sent:     results.filter((r) => r.status === "fulfilled").length,
    failed:   results.filter((r) => r.status === "rejected").length,
  }
}
