import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

async function requireAdmin() {
  const supabase = await createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, forbidden: true }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  return { supabase, user, forbidden: profile?.role !== "admin" }
}

// PATCH /api/admin/opportunities/[id] — update
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const { supabase, forbidden } = await requireAdmin()
  if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()

  const { data, error } = await supabase
    .from("opportunities")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 })

  return NextResponse.json(data)
}

// DELETE /api/admin/opportunities/[id] — delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const { supabase, forbidden } = await requireAdmin()
  if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { error } = await supabase.from("opportunities").delete().eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
