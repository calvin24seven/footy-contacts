import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

const REOON_API_BASE = "https://emailverifier.reoon.com/api/v1"

interface ReoonResult {
  email: string
  status: string // 'safe' | 'risky' | 'invalid' | 'unknown' | 'catch_all' | etc.
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

  const { data: apiKey, error: secretErr } = await supabase.rpc("get_admin_secret", { name: "reoon_api_key" })
  if (secretErr || !apiKey) return NextResponse.json({ error: "Reoon API key not configured in Vault" }, { status: 503 })

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
    results?: ReoonResult[]
  }

  const results = reoonData.results ?? []
  if (results.length === 0) {
    return NextResponse.json({ error: "No results returned from Reoon" }, { status: 400 })
  }

  // Partition into verified vs unverified
  const safeEmails: string[] = []
  const unsafeEmails: string[] = []
  const invalidEmails: string[] = [] // invalid syntax + not deliverable → clear email

  for (const r of results) {
    if (!r.email) continue
    const email = r.email.toLowerCase().trim()
    if (r.status === "safe") {
      safeEmails.push(email)
    } else if (r.is_valid_syntax === false && r.is_deliverable === false) {
      invalidEmails.push(email)
    } else {
      unsafeEmails.push(email)
    }
  }

  const now = new Date().toISOString()
  let verifiedCount = 0
  let unverifiedCount = 0
  let clearedCount = 0

  // Update verified contacts in batches
  const BATCH = 500
  for (let i = 0; i < safeEmails.length; i += BATCH) {
    const batch = safeEmails.slice(i, i + BATCH)
    const { data } = await supabase
      .from("contacts")
      .update({ verified_status: "verified", last_verified_at: now })
      .in("email", batch)
      .select("id")
    verifiedCount += (data?.length ?? 0)
  }

  // Update unverified contacts
  for (let i = 0; i < unsafeEmails.length; i += BATCH) {
    const batch = unsafeEmails.slice(i, i + BATCH)
    const { data } = await supabase
      .from("contacts")
      .update({ verified_status: "unverified", last_verified_at: now })
      .in("email", batch)
      .select("id")
    unverifiedCount += (data?.length ?? 0)
  }

  // Clear truly invalid emails
  for (let i = 0; i < invalidEmails.length; i += BATCH) {
    const batch = invalidEmails.slice(i, i + BATCH)
    const { data } = await supabase
      .from("contacts")
      .update({ email: null, verified_status: "unverified", last_verified_at: now })
      .in("email", batch)
      .select("id")
    clearedCount += (data?.length ?? 0)
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
