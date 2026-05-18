import { NextRequest, NextResponse } from "next/server"
import type { Json } from "@/database.types"
import { createAdminClient } from "@/lib/supabase/server"
import { createAdminClient as createServiceClient } from "@/lib/supabase/admin"
import {
  enrollUsersInReactivationCampaign,
  CAMPAIGN_ID,
  type CampaignUser,
} from "@/lib/email/campaign"
import { createUnsubscribeToken } from "@/lib/email/unsubscribe"

const APP_URL = "https://footycontacts.com"

export const runtime    = "nodejs"
export const maxDuration = 60

/**
 * POST /api/admin/campaigns/reactivation
 *
 * Enrolls all eligible users in the reactivation-2026 email campaign.
 * Eligible = email confirmed, not suppressed, no active subscription, not yet enrolled.
 *
 * Batching strategy (per REACTIVATION_CAMPAIGN.md Part 15):
 *   Batch 1 — first 150 users  → send email 1 immediately
 *   Batch 2 — next  250 users  → send email 1 after 2 hours
 *   Batch 3 — remaining users  → send email 1 after 5 hours
 *
 * All 5 emails per user are pre-scheduled at enrolment time using
 * next_retry_at in email_jobs. The existing email-drain cron picks them up
 * automatically on schedule. Idempotent: re-running skips already-enrolled users.
 *
 * Auth: admin session required (profile.role = 'admin').
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth check ──────────────────────────────────────────────────────────────
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

  // ── Test mode: ?testEmail=you@example.com ────────────────────────────────────
  const testEmail = req.nextUrl.searchParams.get("testEmail")?.toLowerCase().trim()
  if (testEmail) {
    const SCHEDULE_DAYS: Record<number, number> = { 1: 0, 2: 3, 3: 6, 4: 10, 5: 14 }
    const OFFER_VALID_DAYS = 21
    const now = new Date()
    const unsubToken = createUnsubscribeToken(testEmail, "marketing")
    const unsubUrl   = `${APP_URL}/unsubscribe?email=${encodeURIComponent(testEmail)}&category=marketing&token=${unsubToken}`
    const offerEnd     = new Date(now.getTime() + OFFER_VALID_DAYS * 86_400_000)
    const offerEndDate = offerEnd.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

    const supabase = createServiceClient()
    const jobs = Array.from({ length: 5 }, (_, i) => {
      const step   = i + 1
      const sendAt = new Date(now.getTime() + SCHEDULE_DAYS[step] * 86_400_000)
      const props: Record<string, unknown> = {
        firstName:      "Calvin",
        unsubscribeUrl: unsubUrl,
        ...(step === 5 ? { offerEndDate } : {}),
      }
      return {
        idempotency_key: `test:${CAMPAIGN_ID}:email-${step}:${testEmail}`,
        to_email:        testEmail,
        to_name:         "Calvin",
        reply_to:        "hello@footycontacts.com",
        template_id:     `reactivation-${step}`,
        template_props:  props as Json,
        category:        "marketing",
        user_id:         null,
        max_attempts:    3,
        next_retry_at:   sendAt.toISOString(),
      }
    })

    const { error: insertErr } = await supabase
      .from("email_jobs")
      .upsert(jobs, { onConflict: "idempotency_key", ignoreDuplicates: true })

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({
      ok:        true,
      testMode:  true,
      testEmail,
      queued:    5,
      message:   "5 test jobs queued. Trigger GET /api/cron/email-drain with your CRON_SECRET to send immediately.",
      schedule: {
        "email-1": now.toISOString(),
        "email-2": new Date(now.getTime() + 3  * 86_400_000).toISOString(),
        "email-3": new Date(now.getTime() + 6  * 86_400_000).toISOString(),
        "email-4": new Date(now.getTime() + 10 * 86_400_000).toISOString(),
        "email-5": new Date(now.getTime() + 14 * 86_400_000).toISOString(),
      },
    })
  }

  const supabase = createServiceClient()

  const { data: rows, error } = await supabase.rpc("get_reactivation_audience")

  if (error) {
    return NextResponse.json(
      { error: `Failed to fetch audience: ${error.message}` },
      { status: 500 },
    )
  }

  type AudienceRow = {
    id:        string
    email:     string
    full_name: string | null
    first_name: string | null
  }

  const audience = (rows as AudienceRow[]) ?? []

  if (audience.length === 0) {
    return NextResponse.json({
      ok:      true,
      message: "No eligible users found (all already enrolled or converted).",
      enrolled: 0,
      alreadyEnrolled: 0,
    })
  }

  // ── Assign staggered enrolled_at times ───────────────────────────────────────
  const now         = new Date()
  const BATCH_SIZES = [150, 250]  // rest goes to batch 3
  const BATCH_OFFSETS_HOURS = [0, 2, 5]

  const campaignUsers: CampaignUser[] = audience.map((row, i) => {
    let batchIndex = 2  // default: batch 3
    let cumulative = 0
    for (let b = 0; b < BATCH_SIZES.length; b++) {
      cumulative += BATCH_SIZES[b]
      if (i < cumulative) { batchIndex = b; break }
    }

    const enrolledAt = new Date(
      now.getTime() + BATCH_OFFSETS_HOURS[batchIndex] * 3_600_000,
    )

    const firstName =
      row.first_name?.trim()
      || row.full_name?.trim()?.split(" ")[0]?.replace(/[^a-zA-Z'-]/g, "")
      || "there"

    return {
      id:         row.id,
      email:      row.email,
      firstName,
      enrolledAt,
    }
  })

  // ── Enroll ───────────────────────────────────────────────────────────────────
  const result = await enrollUsersInReactivationCampaign(campaignUsers)

  return NextResponse.json({
    ok: true,
    campaign: CAMPAIGN_ID,
    audience:        audience.length,
    enrolled:        result.enrolled,
    alreadyEnrolled: result.alreadyEnrolled,
    batches: [
      {
        batch:    1,
        users:    Math.min(150, audience.length),
        sendAt:   now.toISOString(),
      },
      {
        batch:    2,
        users:    Math.max(0, Math.min(250, audience.length - 150)),
        sendAt:   new Date(now.getTime() + 2 * 3_600_000).toISOString(),
      },
      {
        batch:    3,
        users:    Math.max(0, audience.length - 400),
        sendAt:   new Date(now.getTime() + 5 * 3_600_000).toISOString(),
      },
    ],
    schedule: {
      email1: "Day 0",
      email2: "Day 3",
      email3: "Day 6",
      email4: "Day 10",
      email5: "Day 14",
    },
  })
}

/**
 * GET /api/admin/campaigns/reactivation
 *
 * Returns campaign status without enrolling anyone.
 */
export async function GET(_req: NextRequest): Promise<NextResponse> {
  const serverClient = await createAdminClient()
  const {
    data: { user },
  } = await serverClient.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await serverClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const supabase = createServiceClient()

  const [{ count: totalEnrolled }, { count: converted }, { count: pending }] =
    await Promise.all([
      supabase
        .from("campaign_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("campaign", CAMPAIGN_ID),
      supabase
        .from("campaign_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("campaign", CAMPAIGN_ID)
        .eq("status", "converted"),
      supabase
        .from("email_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .like("template_id", "reactivation-%"),
    ])

  return NextResponse.json({
    campaign:      CAMPAIGN_ID,
    totalEnrolled: totalEnrolled ?? 0,
    converted:     converted    ?? 0,
    pendingEmails: pending      ?? 0,
  })
}
