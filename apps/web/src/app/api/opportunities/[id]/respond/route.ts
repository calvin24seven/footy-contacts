import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  // Verify opportunity exists, is active, and uses internal applications
  const { data: opp } = await supabase
    .from("opportunities")
    .select("id, application_method, status")
    .eq("id", id)
    .single()

  if (!opp) return NextResponse.json({ error: "opportunity not found" }, { status: 404 })
  if (opp.status !== "active") {
    return NextResponse.json({ error: "this opportunity is no longer accepting applications" }, { status: 410 })
  }
  if (opp.application_method !== "internal") {
    return NextResponse.json({ error: "this opportunity does not accept internal applications" }, { status: 400 })
  }

  // Prevent duplicate applications
  const { data: existing } = await supabase
    .from("opportunity_responses")
    .select("id")
    .eq("opportunity_id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "you have already applied for this opportunity" }, { status: 409 })
  }

  const body = (await req.json()) as {
    name?: string
    level?: string
    location?: string
    message?: string
    position?: string
    age?: number | null
    current_club?: string
    highlight_video_url?: string
  }

  const { name, level, location, message } = body

  if (!name?.trim() || !level?.trim() || !location?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "name, level, location and message are required" }, { status: 422 })
  }

  const { error } = await supabase.from("opportunity_responses").insert({
    opportunity_id: id,
    user_id: user.id,
    name: name.trim(),
    level: level.trim(),
    location: location.trim(),
    message: message.trim(),
    position: body.position?.trim() || null,
    age: body.age ?? null,
    current_club: body.current_club?.trim() || null,
    highlight_video_url: body.highlight_video_url?.trim() || null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
