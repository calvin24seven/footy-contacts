import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

/**
 * POST /api/admin/suppressions/import
 * Multipart form: file (CSV with "email" column), reason
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const form = await req.formData()
  const file = form.get("file")
  const reason = (form.get("reason") as string | null) ?? "manual"

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  const text = await (file as File).text()
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return NextResponse.json({ error: "CSV is empty" }, { status: 400 })

  // Find the email column index
  const headers = lines[0].split(",").map((h) => h.toLowerCase().replace(/[^a-z_]/g, "").trim())
  const emailIdx = headers.indexOf("email")
  if (emailIdx === -1) return NextResponse.json({ error: 'CSV must have an "email" column' }, { status: 400 })

  const emails = lines
    .slice(1)
    .map((l) => {
      const parts = l.split(",")
      return (parts[emailIdx] ?? "").replace(/"/g, "").toLowerCase().trim()
    })
    .filter((e) => e.includes("@") && e.includes("."))

  if (emails.length === 0) return NextResponse.json({ error: "No valid emails found" }, { status: 400 })

  const BATCH = 500
  let imported = 0
  for (let i = 0; i < emails.length; i += BATCH) {
    const batch = emails.slice(i, i + BATCH)
    const { data, error } = await supabase
      .from("email_suppressions")
      .upsert(
        batch.map((email) => ({ email, reason, added_by: user.id })),
        { onConflict: "email", ignoreDuplicates: true }
      )
      .select("id")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    imported += data?.length ?? 0
  }

  const skipped = emails.length - imported
  return NextResponse.json({ imported, skipped })
}
