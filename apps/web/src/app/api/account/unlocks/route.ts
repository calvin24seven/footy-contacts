import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Plan limits mirror the DB — used as fallback if plan row is missing
const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  starter: 50,
  pro: 250,
  agency: 750,
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Active subscription + plan
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("current_period_end, plan:plans(name, code, monthly_unlock_limit)")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const plan = sub?.plan as unknown as { name: string; code: string; monthly_unlock_limit: number } | null
  const planCode = plan?.code ?? "free"
  const planName = plan?.name ?? "Free"

  // Free plan: usage tracked by free_unlock_used flag on profiles
  if (!sub || planCode === "free") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("free_unlock_used")
      .eq("id", user.id)
      .single()

    return NextResponse.json({
      used: profile?.free_unlock_used ? 1 : 0,
      limit: 1,
      periodEnd: null,
      planName: "Free",
      planCode: "free",
    })
  }

  // Subscribed: get current billing period usage
  const now = new Date().toISOString()
  const { data: usage } = await supabase
    .from("subscription_usage_periods")
    .select("unlock_count")
    .eq("user_id", user.id)
    .lte("period_start", now)
    .gte("period_end", now)
    .maybeSingle()

  return NextResponse.json({
    used: usage?.unlock_count ?? 0,
    limit: plan?.monthly_unlock_limit ?? PLAN_LIMITS[planCode] ?? 0,
    periodEnd: sub.current_period_end ?? null,
    planName,
    planCode,
  })
}
