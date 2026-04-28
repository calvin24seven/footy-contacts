import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getSecret } from "@/lib/secrets"

const REOON_API_BASE = "https://emailverifier.reoon.com/api/v1"

interface ReoonResult {
  email: string
  // Reoon statuses: 'safe' | 'catch_all' | 'unknown' | 'risky' | 'invalid'
  status: "safe" | "catch_all" | "unknown" | "risky" | "invalid" | string
  is_deliverable?: boolean
  is_valid_syntax?: boolean
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let apiKey: string
  try {
    apiKey = getSecret("reoon_api_key")
  } catch {
    return NextResponse.json({ error: "REOON_API_KEY environment variable is not set. Add it to Vercel Environment Variables." }, { status: 503 })
  }

  const { taskId } = (await req.json()) as { taskId: string }
  if (!taskId) return NextResponse.json({ error: "Missing taskId" }, { status: 400 })

  // Get our DB task
  const { data: task, error: taskErr } = await supabase
    .from("email_verification_tasks")
    .select("*")
    .eq("id", taskId)
    .single()

  if (taskErr || !task) return NextResponse.json({ error: "Task not found" }, { status: 404 })
  if (task.status !== "completed") {
    return NextResponse.json({ error: "Task is not yet completed" }, { status: 400 })
  }
  if (task.results_applied) {
    return NextResponse.json({ error: "Results already applied" }, { status: 400 })
  }

  // Fetch full results from Reoon
  const reoonRes = await fetch(
    `${REOON_API_BASE}/get-result-bulk-verification-task/?key=${apiKey}&task_id=${task.reoon_task_id}`,
    { cache: "no-store" }
  )

  if (!reoonRes.ok) {
    return NextResponse.json({ error: "Failed to fetch results from Reoon" }, { status: 502 })
  }

  const reoonData = (await reoonRes.json()) as {
    status: string
    results?: Record<string, ReoonResult>
  }

  // results is an object keyed by email address, not an array
  const resultsObj = reoonData.results ?? {}
  const results = Object.values(resultsObj)
  if (results.length === 0) {
    return NextResponse.json({ error: "No results returned from Reoon" }, { status: 400 })
  }

  // Map Reoon status → our DB verified_status value.
  // 'safe'      → 'verified'   (confirmed deliverable)
  // 'catch_all' → 'catch_all'  (domain accepts all, can't confirm mailbox)
  // 'unknown'   → 'unknown'    (server timeout / greylisted)
  // 'risky'     → 'risky'      (role address, spam-trap risk, etc.)
  // 'invalid'   → clear email, add to suppressions
  type VerifiedStatus = "verified" | "catch_all" | "unknown" | "risky" | "unverified"

  const statusBuckets = new Map<VerifiedStatus, string[]>([
    ["verified", []],
    ["catch_all", []],
    ["unknown", []],
    ["risky", []],
  ])
  const invalidEmails: string[] = []

  for (const r of results) {
    if (!r.email) continue
    const email = r.email.toLowerCase().trim()
    if (r.status === "safe") {
      statusBuckets.get("verified")!.push(email)
    } else if (r.status === "catch_all") {
      statusBuckets.get("catch_all")!.push(email)
    } else if (r.status === "unknown") {
      statusBuckets.get("unknown")!.push(email)
    } else if (r.status === "risky") {
      statusBuckets.get("risky")!.push(email)
    } else {
      // 'invalid' or anything else with bad syntax/deliverability → clear the email
      invalidEmails.push(email)
    }
  }

  const now = new Date().toISOString()
  let verifiedCount = 0
  let unverifiedCount = 0
  let clearedCount = 0

  // Update each status bucket in batches
  const BATCH = 500
  for (const [dbStatus, emails] of statusBuckets.entries()) {
    for (let i = 0; i < emails.length; i += BATCH) {
      const batch = emails.slice(i, i + BATCH)
      const { data } = await supabase
        .from("contacts")
        .update({ verified_status: dbStatus, last_verified_at: now, cron_queued_at: null })
        .in("email", batch)
        .select("id")
      if (dbStatus === "verified") {
        verifiedCount += (data?.length ?? 0)
      } else {
        unverifiedCount += (data?.length ?? 0)
      }
    }
  }

  // Clear truly invalid emails and add them to the suppression blacklist
  for (let i = 0; i < invalidEmails.length; i += BATCH) {
    const batch = invalidEmails.slice(i, i + BATCH)
    const { data } = await supabase
      .from("contacts")
      .update({ email: null, verified_status: "unverified", suppression_status: "suppressed", last_verified_at: now, cron_queued_at: null })
      .in("email", batch)
      .select("id")
    clearedCount += (data?.length ?? 0)

    // Add to suppression blacklist so future imports skip these emails
    await supabase
      .from("email_suppressions")
      .upsert(
        batch.map(email => ({ email, reason: "reoon_invalid", added_by: user.id })),
        { onConflict: "email", ignoreDuplicates: true }
      )
  }

  // Mark task as applied
  await supabase
    .from("email_verification_tasks")
    .update({ results_applied: true })
    .eq("id", taskId)

  return NextResponse.json({
    success: true,
    verifiedCount,
    unverifiedCount,
    clearedCount,
    totalProcessed: verifiedCount + unverifiedCount + clearedCount,
  })
}
