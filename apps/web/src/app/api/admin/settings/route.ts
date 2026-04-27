import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

async function requireAdmin() {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, forbidden: true }
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  return { supabase, user, forbidden: profile?.role !== "admin" }
}

// PATCH /api/admin/settings — upsert a single setting
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const { supabase, forbidden } = await requireAdmin()
  if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { key, value, description } = await req.json() as { key: string; value: unknown; description?: string }
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 })

  const { data, error } = await supabase
    .from("app_settings")
    .upsert(
      description !== undefined
        ? { key, value: value as never, description, updated_at: new Date().toISOString() }
        : { key, value: value as never, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
