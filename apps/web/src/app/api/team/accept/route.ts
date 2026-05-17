import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/team/accept
 * Body: { token: string }
 * Accepts a team invite for the currently authenticated user.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const body = await req.json() as { token?: string }
  const token = body.token?.trim()
  if (!token) return NextResponse.json({ error: "token_required" }, { status: 400 })

  const adminSupabase = createAdminClient()

  // Find the pending invite
  const { data: member } = await adminSupabase
    .from("team_members")
    .select("id, team_id, invite_email, status, teams(owner_user_id, seat_limit)")
    .eq("invite_token", token)
    .eq("status", "pending")
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 404 })
  }

  // Optionally: verify the user's email matches the invite email
  // (relaxed — allow any authenticated user to accept so teammates can use
  //  a different address than the one invited)

  // Check team still has capacity
  const team = member.teams as { owner_user_id: string; seat_limit: number } | null
  if (!team) return NextResponse.json({ error: "team_not_found" }, { status: 404 })

  const { count } = await adminSupabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", member.team_id)
    .eq("status", "active")

  if ((count ?? 0) >= team.seat_limit) {
    return NextResponse.json({ error: "team_full" }, { status: 422 })
  }

  // Prevent duplicate membership on the same team
  const { data: existingActive } = await adminSupabase
    .from("team_members")
    .select("id")
    .eq("team_id", member.team_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (existingActive) {
    return NextResponse.json({ success: true, already_member: true })
  }

  const { error } = await adminSupabase
    .from("team_members")
    .update({
      user_id:   user.id,
      status:    "active",
      joined_at: new Date().toISOString(),
    })
    .eq("id", member.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
