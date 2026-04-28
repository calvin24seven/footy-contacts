import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

/** DELETE /api/admin/suppressions/[email] — remove a suppression */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
): Promise<NextResponse> {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { email } = await params
  const decoded = decodeURIComponent(email).toLowerCase().trim()

  const { error } = await supabase.from("email_suppressions").delete().eq("email", decoded)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ removed: decoded })
}
