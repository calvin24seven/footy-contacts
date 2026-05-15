import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit, rateLimitDaily } from "@/lib/rate-limit"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  // Require email verification before any unlock
  if (!user.email_confirmed_at) {
    return NextResponse.json({ error: "email_verification_required" }, { status: 403 })
  }

  // 20 unlocks per user per minute — fail closed: Redis outage = unlock blocked
  const perMin = await rateLimit(`unlock:${user.id}:min`, 20, 60, { failClosed: true })
  if (!perMin.allowed) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 })
  }

  // 200 unlocks per user per day — fail closed
  const perDay = await rateLimitDaily(`unlock:${user.id}`, 200, { failClosed: true })
  if (!perDay.allowed) {
    return NextResponse.json({ error: "daily_limit_reached" }, { status: 429 })
  }

  const { data, error } = await supabase.rpc("unlock_contact", {
    p_contact_id: id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = data as unknown as {
    success?: boolean
    already_unlocked?: boolean
    unlock_type?: string
    used?: number
    limit?: number
    plan?: string
    error?: string
    requires_subscription?: boolean
  }

  if (result.error === "upgrade_required") {
    return NextResponse.json(result, { status: 402 })
  }

  if (result.error === "limit_reached") {
    return NextResponse.json(result, { status: 429 })
  }

  if (result.error) {
    return NextResponse.json(result, { status: 400 })
  }

  return NextResponse.json(result)
}
