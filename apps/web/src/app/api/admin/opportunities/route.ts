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

// POST /api/admin/opportunities — create
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { supabase, forbidden } = await requireAdmin()
  if (forbidden) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()

  const { data, error } = await supabase.from("opportunities").insert(body).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
