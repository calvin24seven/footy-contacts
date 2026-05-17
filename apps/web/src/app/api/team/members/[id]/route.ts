import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/** DELETE /api/team/members/[id] — owner removes a team member */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const adminSupabase = createAdminClient()

  // Verify the row belongs to a team the caller owns
  const { data: member } = await adminSupabase
    .from("team_members")
    .select("id, team_id, teams(owner_user_id)")
    .eq("id", id)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const ownerUserId = (member.teams as { owner_user_id: string } | null)?.owner_user_id
  if (ownerUserId !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const { error } = await adminSupabase
    .from("team_members")
    .update({ status: "removed", updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
