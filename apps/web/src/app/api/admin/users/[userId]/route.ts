import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const supabase = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: self } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (self?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { userId } = await params
  if (userId === user.id) {
    return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 })
  }

  const body = await req.json()
  const { action, role, amount } = body as { action: string; role?: string; amount?: number }

  if (action === "suspend") {
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: true, suspended_reason: "Suspended by admin" })
      .eq("id", userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  } else if (action === "unsuspend") {
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: false, suspended_reason: null })
      .eq("id", userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  } else if (action === "set_role") {
    if (!role || !["user", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  } else if (action === "add_credits") {
    const credits = Math.floor(Number(amount ?? 0))
    if (!Number.isFinite(credits) || credits === 0 || Math.abs(credits) > 10000) {
      return NextResponse.json({ error: "Invalid amount (1–10000)" }, { status: 400 })
    }
    const { error } = await supabase.rpc("increment_bonus_credits", {
      p_user_id: userId,
      p_amount: credits,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
