import type { Json } from "@/database.types"
import { createAdminClient } from "@/lib/supabase/admin"
import { createUnsubscribeToken } from "./unsubscribe"

export const CAMPAIGN_ID = "reactivation-2026"

const APP_URL = "https://footycontacts.com"

/** Relative send days for each email step (1-indexed). */
const SCHEDULE_DAYS: Record<number, number> = {
  1:  0,
  2:  3,
  3:  6,
  4:  10,
  5:  14,
}

/** Offer window: email 5 is sent on day 14, offer valid for 7 more days. */
const OFFER_VALID_DAYS = 21

export interface CampaignUser {
  id:         string
  email:      string
  firstName:  string
  /** Staggered base time — all 5 scheduled emails are relative to this. */
  enrolledAt: Date
}

interface EmailJobInsert {
  idempotency_key: string
  to_email:        string
  to_name:         string | null
  reply_to:        string
  template_id:     string
  template_props:  Json | null
  category:        string
  user_id:         string
  max_attempts:    number
  next_retry_at:   string
}

/**
 * Enrolls a batch of users in the reactivation-2026 campaign.
 *
 * For each user this does two things atomically (best-effort):
 *   1. Inserts a campaign_enrollments row (duplicate = already enrolled, skipped).
 *   2. Bulk-inserts all 5 email_jobs with future next_retry_at times so the
 *      existing email-drain cron delivers them on schedule.
 *
 * Idempotent: safe to call multiple times — existing enrollments and
 * email_jobs are skipped via ignoreDuplicates.
 */
export async function enrollUsersInReactivationCampaign(
  users: CampaignUser[],
): Promise<{ enrolled: number; alreadyEnrolled: number }> {
  if (users.length === 0) return { enrolled: 0, alreadyEnrolled: 0 }

  const supabase = createAdminClient()

  // ── 1. Insert enrollment records ────────────────────────────────────────────
  const enrollmentRows = users.map((u) => ({
    user_id:     u.id,
    campaign:    CAMPAIGN_ID,
    status:      "active",
    enrolled_at: u.enrolledAt.toISOString(),
  }))

  const { data: inserted } = await supabase
    .from("campaign_enrollments")
    .upsert(enrollmentRows, { onConflict: "user_id,campaign", ignoreDuplicates: true })
    .select("user_id")

  const newUserIds     = new Set((inserted ?? []).map((r: { user_id: string }) => r.user_id))
  const newUsers       = users.filter((u) => newUserIds.has(u.id))
  const alreadyEnrolled = users.length - newUsers.length

  if (newUsers.length === 0) return { enrolled: 0, alreadyEnrolled }

  // ── 2. Build all 5 email_job rows per newly enrolled user ───────────────────
  const jobs: EmailJobInsert[] = []

  for (const user of newUsers) {
    const unsubToken = createUnsubscribeToken(user.email, "marketing")
    const unsubUrl   = `${APP_URL}/unsubscribe?email=${encodeURIComponent(user.email)}&category=marketing&token=${unsubToken}`

    const offerEnd     = new Date(user.enrolledAt.getTime() + OFFER_VALID_DAYS * 86_400_000)
    const offerEndDate = offerEnd.toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    })

    const baseProps: Record<string, unknown> = {
      firstName:      user.firstName,
      unsubscribeUrl: unsubUrl,
    }

    for (let step = 1; step <= 5; step++) {
      const sendAt = new Date(
        user.enrolledAt.getTime() + SCHEDULE_DAYS[step] * 86_400_000,
      )

      const props: Record<string, unknown> =
        step === 5 ? { ...baseProps, offerEndDate } : { ...baseProps }

      jobs.push({
        idempotency_key: `${CAMPAIGN_ID}:email-${step}:${user.id}`,
        to_email:        user.email.toLowerCase().trim(),
        to_name:         user.firstName !== "there" ? user.firstName : null,
        reply_to:        "hello@footycontacts.com",
        template_id:     `reactivation-${step}`,
        template_props:  props as Json,
        category:        "marketing",
        user_id:         user.id,
        max_attempts:    3,
        next_retry_at:   sendAt.toISOString(),
      })
    }
  }

  // ── 3. Bulk-insert in chunks of 200 ─────────────────────────────────────────
  const CHUNK_SIZE = 200
  for (let i = 0; i < jobs.length; i += CHUNK_SIZE) {
    await supabase
      .from("email_jobs")
      .upsert(jobs.slice(i, i + CHUNK_SIZE), {
        onConflict:       "idempotency_key",
        ignoreDuplicates: true,
      })
  }

  return { enrolled: newUsers.length, alreadyEnrolled }
}
