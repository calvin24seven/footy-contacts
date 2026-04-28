import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getSecret } from "@/lib/secrets"

const REOON_API_BASE = "https://emailverifier.reoon.com/api/v1"

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

  const { scope = "unverified" } = (await req.json()) as {
    scope?: "unverified" | "all"
  }

  // Paginate through contacts in 1000-row pages (PostgREST max_rows default is 1000).
  // Collect all matching emails up to Reoon's 50,000 per-task limit.
  const MAX_EMAILS = 50000
  const PAGE_SIZE = 1000
  const emails: string[] = []
  let page = 0

  while (emails.length < MAX_EMAILS) {
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let pageQuery = supabase
      .from("contacts")
      .select("email")
      .not("email", "is", null)
      .order("id")
      .range(from, to)

    if (scope === "unverified") {
      pageQuery = pageQuery.neq("verified_status", "verified")
    }

    const { data: pageData, error: pageErr } = await pageQuery
    if (pageErr) return NextResponse.json({ error: pageErr.message }, { status: 500 })
    if (!pageData || pageData.length === 0) break

    for (const c of pageData) {
      if (c.email) emails.push(c.email as string)
    }
    if (pageData.length < PAGE_SIZE) break // last page reached
    page++
  }

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
    count_submitted: number
    count_processing: number
    count_duplicates_removed: number
    count_rejected_emails: number
  }

  // Store task in DB
  const { data: task, error: insertErr } = await supabase
    .from("email_verification_tasks")
    .insert({
      reoon_task_id: String(reoonData.task_id),
      task_name: taskName,
      status: "waiting",
      count_submitted: reoonData.count_submitted ?? emails.length,
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
    countSubmitted: reoonData.count_submitted ?? emails.length,
    status: "waiting",
  })
}
