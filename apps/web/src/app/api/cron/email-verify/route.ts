import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getSecret } from "@/lib/secrets"

const REOON_API_BASE = "https://emailverifier.reoon.com/api/v1"

/**
 * POST /api/cron/email-verify
 *
 * Called weekly (Monday 06:00 UTC) by Vercel Cron.
 * Submits genuinely new unverified contacts to Reoon — only those never touched.
 *
 * Called monthly (1st of month 06:30 UTC) with body { scope: "stale" } to
 * re-verify catch_all + unknown contacts whose last check was >30 days ago.
 *
 * Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET> header.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Verify cron secret
  const auth = req.headers.get("authorization") ?? ""
  let cronSecret: string
  try {
    cronSecret = getSecret("cron_secret")
  } catch {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 })
  }
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let apiKey: string
  try {
    apiKey = getSecret("reoon_api_key")
  } catch {
    return NextResponse.json({ error: "REOON_API_KEY not configured" }, { status: 503 })
  }

  const body = await req.json().catch(() => ({})) as { scope?: string }
  const scope = body.scope === "stale" ? "stale" : "new"

  const supabase = await createAdminClient()
  const PAGE_SIZE = 1000
  const MAX_EMAILS = 50000
  const emails: string[] = []
  let page = 0

  if (scope === "new") {
    // Weekly: unverified contacts that have never been queued for verification
    while (emails.length < MAX_EMAILS) {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error } = await supabase
        .from("contacts")
        .select("email")
        .eq("verified_status", "unverified")
        .not("email", "is", null)
        .is("cron_queued_at", null)
        .order("id")
        .range(from, to)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!data || data.length === 0) break
      for (const c of data) { if (c.email) emails.push(c.email) }
      if (data.length < PAGE_SIZE) break
      page++
    }
  } else {
    // Monthly: catch_all + unknown contacts last verified >30 days ago
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    while (emails.length < MAX_EMAILS) {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error } = await supabase
        .from("contacts")
        .select("email")
        .in("verified_status", ["catch_all", "unknown"])
        .not("email", "is", null)
        .or(`last_verified_at.is.null,last_verified_at.lt.${thirtyDaysAgo}`)
        .order("id")
        .range(from, to)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!data || data.length === 0) break
      for (const c of data) { if (c.email) emails.push(c.email) }
      if (data.length < PAGE_SIZE) break
      page++
    }
  }

  if (emails.length === 0) {
    return NextResponse.json({ message: `No contacts to verify for scope '${scope}'`, submitted: 0 })
  }

  // Mark all selected contacts as queued so the next cron run skips them
  const now = new Date().toISOString()
  for (let i = 0; i < emails.length; i += 1000) {
    const batch = emails.slice(i, i + 1000)
    await supabase
      .from("contacts")
      .update({ cron_queued_at: now })
      .in("email", batch)
  }

  // Submit to Reoon
  const taskName = `Cron ${scope} — ${new Date().toISOString().slice(0, 10)}`
  const reoonRes = await fetch(`${REOON_API_BASE}/create-bulk-verification-task/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: apiKey, name: taskName, emails }),
  })

  if (!reoonRes.ok) {
    const text = await reoonRes.text()
    return NextResponse.json({ error: `Reoon API error: ${text}` }, { status: 502 })
  }

  const reoonData = await reoonRes.json() as {
    status: string
    task_id?: string
    count_submitted?: number
  }

  // Record the task in DB
  if (reoonData.task_id) {
    await supabase.from("email_verification_tasks").insert({
      reoon_task_id: String(reoonData.task_id),
      task_name: taskName,
      status: "waiting",
      count_submitted: reoonData.count_submitted ?? emails.length,
    })
  }

  return NextResponse.json({
    success: true,
    scope,
    submitted: emails.length,
    reoonTaskId: reoonData.task_id,
  })
}
