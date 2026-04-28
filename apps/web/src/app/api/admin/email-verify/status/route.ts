import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getSecret } from "@/lib/secrets"

const REOON_API_BASE = "https://emailverifier.reoon.com/api/v1"

export async function GET(req: NextRequest): Promise<NextResponse> {
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

  const taskId = req.nextUrl.searchParams.get("id")
  if (!taskId) return NextResponse.json({ error: "Missing id param" }, { status: 400 })

  // Get our task record
  const { data: task, error: taskErr } = await supabase
    .from("email_verification_tasks")
    .select("*")
    .eq("id", taskId)
    .single()

  if (taskErr || !task) return NextResponse.json({ error: "Task not found" }, { status: 404 })

  // If already completed/applied, just return current state
  if (task.status === "completed" || task.status === "failed") {
    return NextResponse.json(task)
  }

  // Poll Reoon for current status
  const reoonRes = await fetch(
    `${REOON_API_BASE}/get-result-bulk-verification-task/?key=${apiKey}&task_id=${task.reoon_task_id}`,
    { cache: "no-store" }
  )

  if (!reoonRes.ok) {
    return NextResponse.json({ error: "Failed to contact Reoon API" }, { status: 502 })
  }

  const reoonData = (await reoonRes.json()) as {
    task_id: number | string
    status: string
    count_emails_submitted?: number
    count_emails_processing?: number
    count_emails_done?: number
    progress_percentage?: number
    count_duplicates_removed?: number
  }

  // Map Reoon status to our status
  let newStatus = task.status
  if (reoonData.status === "completed" || reoonData.status === "done") newStatus = "completed"
  else if (reoonData.status === "processing" || reoonData.status === "running") newStatus = "running"
  else if (reoonData.status === "waiting") newStatus = "waiting"
  else if (reoonData.status === "failed") newStatus = "failed"

  const countDone = reoonData.count_emails_done ?? 0
  const countSubmitted = reoonData.count_emails_submitted ?? task.count_submitted ?? 1
  const progress = reoonData.progress_percentage ?? Math.round((countDone / countSubmitted) * 100)

  // Update DB record
  const { data: updated } = await supabase
    .from("email_verification_tasks")
    .update({
      status: newStatus,
      count_processing: reoonData.count_emails_processing ?? 0,
      count_duplicates_removed: reoonData.count_duplicates_removed ?? 0,
      progress_percentage: progress,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", taskId)
    .select("*")
    .single()

  return NextResponse.json(updated ?? task)
}
