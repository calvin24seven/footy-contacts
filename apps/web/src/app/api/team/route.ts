import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** GET /api/team — return the caller's team (as owner or member) */
export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  // Try as owner first
  const { data: ownedTeam } = await supabase
    .from("teams")
    .select("*, team_members(id, invite_email, user_id, role, status, invited_at, joined_at)")
    .eq("owner_user_id", user.id)
    .maybeSingle()

  if (ownedTeam) {
    return NextResponse.json({ team: ownedTeam, role: "owner" })
  }

  // Try as active member
  const { data: membership } = await supabase
    .from("team_members")
    .select("*, team:teams(id, name, seat_limit, owner_user_id)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle()

  if (membership) {
    return NextResponse.json({ team: membership.team, role: "member" })
  }

  return NextResponse.json({ team: null, role: null })
}
