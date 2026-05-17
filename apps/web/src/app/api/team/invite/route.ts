import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { enqueueEmail } from "@/lib/email/enqueue"

/** POST /api/team/invite — owner invites a member by email */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const body = await req.json() as { email?: string }
  const email = body.email?.toLowerCase().trim()

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "valid_email_required" }, { status: 400 })
  }

  // Must have Agency subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, plan:plans(code)")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const planCode = (sub?.plan as { code?: string } | null)?.code
  if (planCode !== "agency") {
    return NextResponse.json({ error: "agency_plan_required" }, { status: 403 })
  }

  const adminSupabase = createAdminClient()

  // Get or create the team
  let { data: team } = await adminSupabase
    .from("teams")
    .select("id, seat_limit, name")
    .eq("owner_user_id", user.id)
    .maybeSingle()

  if (!team) {
    const { data: newTeam, error: createErr } = await adminSupabase
      .from("teams")
      .insert({ owner_user_id: user.id, seat_limit: 3 })
      .select("id, seat_limit, name")
      .single()
    if (createErr || !newTeam) {
      return NextResponse.json({ error: "team_create_failed" }, { status: 500 })
    }
    team = newTeam
  }

  // Count active + pending members (excluding owner)
  const { count: memberCount } = await adminSupabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", team.id)
    .in("status", ["active", "pending"])

  if ((memberCount ?? 0) >= team.seat_limit) {
    return NextResponse.json({
      error: "seat_limit_reached",
      seat_limit: team.seat_limit,
      used: memberCount,
    }, { status: 422 })
  }

  // Don't invite the owner themselves
  if (email === user.email?.toLowerCase()) {
    return NextResponse.json({ error: "cannot_invite_self" }, { status: 422 })
  }

  // Idempotent: if already invited or active, return current status
  const { data: existing } = await adminSupabase
    .from("team_members")
    .select("id, status")
    .eq("team_id", team.id)
    .eq("invite_email", email)
    .not("status", "eq", "removed")
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      error: existing.status === "active" ? "already_member" : "already_invited",
      status: existing.status,
    }, { status: 422 })
  }

  // Create the invite
  const { data: member, error: memberErr } = await adminSupabase
    .from("team_members")
    .insert({
      team_id:      team.id,
      invite_email: email,
      status:       "pending",
    })
    .select("id, invite_token")
    .single()

  if (memberErr || !member) {
    return NextResponse.json({ error: "invite_create_failed" }, { status: 500 })
  }

  // Fetch inviter's name
  const { data: inviterProfile } = await adminSupabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  const inviterName = inviterProfile?.full_name ?? user.email ?? "Your colleague"
  const teamName = team.name ?? `${inviterName}'s team`
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.footycontacts.com"
  const acceptUrl = `${baseUrl}/app/team/accept?token=${member.invite_token}`

  await enqueueEmail({
    idempotencyKey: `team-invite:${member.id}`,
    to:             { email, name: email },
    templateId:     "team-invite",
    templateProps:  { inviterName, teamName, acceptUrl },
  })

  return NextResponse.json({ success: true, member_id: member.id })
}
