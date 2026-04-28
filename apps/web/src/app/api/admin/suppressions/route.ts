import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

/** POST /api/admin/suppressions — add one or more emails */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { emails, reason = "manual" } = (await req.json()) as { emails?: string[]; reason?: string }
  if (!emails?.length) return NextResponse.json({ error: "emails array required" }, { status: 400 })

  const cleaned = emails.map((e) => e.toLowerCase().trim()).filter((e) => e.includes("@"))
  if (!cleaned.length) return NextResponse.json({ error: "No valid emails" }, { status: 400 })

  const { error } = await supabase.from("email_suppressions").upsert(
    cleaned.map((email) => ({ email, reason, added_by: user.id })),
    { onConflict: "email", ignoreDuplicates: true }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ added: cleaned.length })
}
