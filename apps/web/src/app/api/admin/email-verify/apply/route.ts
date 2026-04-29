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

  // Map Reoon result status → 3-axis contact state.
  // safe      → verified  + imported + published   (confirmed deliverable)
  // catch_all → catch_all + imported + published   (domain accepts all; still sendable)
  // risky     → risky     + imported + hidden      (role address / spam-trap risk)
  // unknown   → unknown   + draft    + hidden      (server timeout / greylisted — stay in draft)
  // invalid   → invalid   + rejected + hidden      (keep email for audit, suppress, never publish)
  const STATUS_UPDATES: Record<string, { verified_status: string; import_status: string; visibility_status: string }> = {
    verified:  { verified_status: "verified",  import_status: "imported", visibility_status: "published" },
    catch_all: { verified_status: "catch_all", import_status: "imported", visibility_status: "published" },
    risky:     { verified_status: "risky",     import_status: "imported", visibility_status: "hidden"    },
    unknown:   { verified_status: "unknown",   import_status: "draft",    visibility_status: "hidden"    },
  }

  const statusBuckets = new Map<string, string[]>([
    ["verified",  []],
    ["catch_all", []],
    ["risky",     []],
    ["unknown",   []],
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
      // 'invalid' or anything else → reject
      invalidEmails.push(email)
    }
  }

  const now = new Date().toISOString()
  let verifiedCount = 0
  let unverifiedCount = 0
  let clearedCount = 0

  // Update each status bucket — full 3-axis state transition per Reoon result
  const BATCH = 500
  for (const [bucketKey, emails] of statusBuckets.entries()) {
    const update = STATUS_UPDATES[bucketKey]
    for (let i = 0; i < emails.length; i += BATCH) {
      const batch = emails.slice(i, i + BATCH)
      const { data } = await supabase
        .from("contacts")
        .update({ ...update, last_verified_at: now, cron_queued_at: null })
        .in("email", batch)
        .select("id")
      if (bucketKey === "verified") {
        verifiedCount += (data?.length ?? 0)
      } else {
        unverifiedCount += (data?.length ?? 0)
      }
    }
  }

  // Invalid emails — rejected state, keep email for audit trail, add to suppression list
  for (let i = 0; i < invalidEmails.length; i += BATCH) {
    const batch = invalidEmails.slice(i, i + BATCH)
    const { data } = await supabase
      .from("contacts")
      .update({
        verified_status: "invalid",
        import_status: "rejected",
        visibility_status: "hidden",
        suppression_status: "suppressed",
        last_verified_at: now,
        cron_queued_at: null,
      })
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
