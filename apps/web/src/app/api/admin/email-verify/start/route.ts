import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

const REOON_API_BASE = "https://emailverifier.reoon.com/api/v1"

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { data: apiKey, error: secretErr } = await supabase.rpc("get_admin_secret", { name: "reoon_api_key" })
  if (secretErr || !apiKey) return NextResponse.json({ error: "Reoon API key not configured in Vault" }, { status: 503 })

  const { scope = "unverified", limit = 50000 } = (await req.json()) as {
    scope?: "unverified" | "all"
    limit?: number
  }

  // Fetch contact emails from DB
  let query = supabase
    .from("contacts")
    .select("id, email")
    .not("email", "is", null)
    .limit(Math.min(limit, 50000))

  if (scope === "unverified") {
    query = query.neq("verified_status", "verified")
  }

  const { data: contacts, error: fetchErr } = await query
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

  const emails = (contacts ?? []).map((c) => c.email as string)
  if (emails.length === 0) {
    return NextResponse.json({ error: "No emails to verify matching that scope" }, { status: 400 })
  }

  // Submit to Reoon bulk verification API
  const taskName = `Footy Contacts — ${scope} — ${new Date().toISOString().slice(0, 10)}`
  const reoonRes = await fetch(`${REOON_API_BASE}/create-bulk-verification-task/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: apiKey, name: taskName, emails }),
  })

  if (!reoonRes.ok) {
    const text = await reoonRes.text()
    return NextResponse.json({ error: `Reoon API error: ${text}` }, { status: 502 })
  }

  const reoonData = (await reoonRes.json()) as {
    task_id: number | string
    status: string
    count_emails: number
  }

  // Store task in DB
  const { data: task, error: insertErr } = await supabase
    .from("email_verification_tasks")
    .insert({
      reoon_task_id: String(reoonData.task_id),
      task_name: taskName,
      status: reoonData.status ?? "waiting",
      count_submitted: reoonData.count_emails ?? emails.length,
      created_by: user.id,
    })
    .select("id")
    .single()

  if (insertErr || !task) {
    return NextResponse.json({ error: "Failed to store task" }, { status: 500 })
  }

  return NextResponse.json({
    taskId: task.id,
    reoonTaskId: reoonData.task_id,
    countSubmitted: reoonData.count_emails ?? emails.length,
    status: reoonData.status ?? "waiting",
  })
}
