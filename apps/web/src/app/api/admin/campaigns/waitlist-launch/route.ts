import { NextRequest, NextResponse } from "next/server"
import type { Json } from "@/database.types"
import { createAdminClient } from "@/lib/supabase/server"
import { createAdminClient as createServiceClient } from "@/lib/supabase/admin"
import { createUnsubscribeToken } from "@/lib/email/unsubscribe"

const APP_URL      = "https://footycontacts.com"
const CAMPAIGN_ID  = "waitlist-launch-2026"
const TEMPLATE_ID  = "waitlist-launch"

export const runtime     = "nodejs"
export const maxDuration = 60

/**
 * POST /api/admin/campaigns/waitlist-launch
 *
 * Queues a single launch-announcement email to every unsuppressed waitlist
 * subscriber. Idempotent — re-running skips addresses that already have a
 * job queued (idempotency_key conflict).
 *
 * ?testEmail=you@example.com  — sends only to the provided address
 *
 * Auth: admin session required (profile.role = 'admin').
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const serverClient = await createAdminClient()
  const {
    data: { user },
  } = await serverClient.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await serverClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabase   = createServiceClient()
  const testEmail  = req.nextUrl.searchParams.get("testEmail")?.toLowerCase().trim()

  // ── Test mode ───────────────────────────────────────────────────────────────
  if (testEmail) {
    const unsubToken = createUnsubscribeToken(testEmail, "marketing")
    const unsubUrl   = `${APP_URL}/unsubscribe?email=${encodeURIComponent(testEmail)}&category=marketing&token=${unsubToken}`

    const job = {
      idempotency_key: `test:${CAMPAIGN_ID}:${testEmail}`,
      to_email:        testEmail,
      to_name:         null,
      reply_to:        "hello@footycontacts.com",
      template_id:     TEMPLATE_ID,
      template_props:  { unsubscribeUrl: unsubUrl } as Json,
      category:        "marketing",
      user_id:         null,
      max_attempts:    3,
      next_retry_at:   new Date().toISOString(),
    }

    const { error } = await supabase
      .from("email_jobs")
      .upsert([job], { onConflict: "idempotency_key", ignoreDuplicates: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok:       true,
      testMode: true,
      testEmail,
      queued:   1,
      message:  "1 test job queued. Trigger GET /api/cron/email-drain with your CRON_SECRET to send immediately.",
    })
  }

  // ── Production mode ─────────────────────────────────────────────────────────
  // Fetch all waitlist emails that are not suppressed for marketing
  const { data: waitlistRows, error: fetchErr } = await supabase
    .from("waitlist")
    .select("id, email")

  if (fetchErr) {
    return NextResponse.json({ error: `Failed to fetch waitlist: ${fetchErr.message}` }, { status: 500 })
  }

  if (!waitlistRows || waitlistRows.length === 0) {
    return NextResponse.json({ ok: true, queued: 0, message: "Waitlist is empty." })
  }

  // Filter out suppressed addresses
  const emails = waitlistRows.map((r) => r.email.toLowerCase().trim())
  const { data: suppressions } = await supabase
    .from("email_suppressions")
    .select("email")
    .in("email", emails)
    .in("category", ["marketing", "all"])

  const suppressedSet = new Set((suppressions ?? []).map((s: { email: string }) => s.email.toLowerCase()))

  const sendable = waitlistRows.filter(
    (r) => !suppressedSet.has(r.email.toLowerCase().trim()),
  )

  if (sendable.length === 0) {
    return NextResponse.json({ ok: true, queued: 0, message: "All waitlist addresses are suppressed." })
  }

  const jobs = sendable.map((row) => {
    const email      = row.email.toLowerCase().trim()
    const unsubToken = createUnsubscribeToken(email, "marketing")
    const unsubUrl   = `${APP_URL}/unsubscribe?email=${encodeURIComponent(email)}&category=marketing&token=${unsubToken}`

    return {
      idempotency_key: `${CAMPAIGN_ID}:${row.id}`,
      to_email:        email,
      to_name:         null,
      reply_to:        "hello@footycontacts.com",
      template_id:     TEMPLATE_ID,
      template_props:  { unsubscribeUrl: unsubUrl } as Json,
      category:        "marketing",
      user_id:         null,
      max_attempts:    3,
      next_retry_at:   new Date().toISOString(),
    }
  })

  const { error: insertErr } = await supabase
    .from("email_jobs")
    .upsert(jobs, { onConflict: "idempotency_key", ignoreDuplicates: true })

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok:          true,
    queued:      jobs.length,
    suppressed:  waitlistRows.length - sendable.length,
    total:       waitlistRows.length,
    message:     `${jobs.length} launch emails queued for waitlist. Trigger GET /api/cron/email-drain with your CRON_SECRET to send immediately.`,
  })
}
