import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Fallback limits if plan row is missing
const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 150,
  agency: -1,
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

  // Free plan: usage tracked by lifetime_unlocks_used counter (3 base) + bonus_unlock_credits
  if (!sub || planCode === "free") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("lifetime_unlocks_used, bonus_unlock_credits")
      .eq("id", user.id)
      .single()

    const lifetimeUsed = profile?.lifetime_unlocks_used ?? 0
    const bonus = profile?.bonus_unlock_credits ?? 0
    const baseLimit = 3
    const baseRemaining = Math.max(0, baseLimit - lifetimeUsed)

    return NextResponse.json({
      used: lifetimeUsed,
      limit: baseLimit,
      bonus,                                        // admin-gifted bonus credits
      totalRemaining: baseRemaining + bonus,        // what the user can actually still unlock
      periodEnd: null,
      planName: "Free",
      planCode: "free",
    })
  }

  // Subscribed: count unlocks in current billing period from contact_unlocks (authoritative)
  const { data: subFull } = await supabase
    .from("subscriptions")
    .select("current_period_start, current_period_end, plan:plans(name, code, monthly_unlock_limit)")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const planFull = subFull?.plan as unknown as { name: string; code: string; monthly_unlock_limit: number } | null
  const planCodeFull = planFull?.code ?? planCode
  const planNameFull = planFull?.name ?? planName
  const planLimit = planFull?.monthly_unlock_limit ?? PLAN_LIMITS[planCodeFull] ?? 0

  const periodStart = subFull?.current_period_start
    ? new Date(subFull.current_period_start).toISOString()
    : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const { count: periodUsed } = await supabase
    .from("contact_unlocks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("unlock_type", "bonus")          // bonus credits don't count against plan quota
    .gte("created_at", periodStart)

  // Fetch bonus credits for subscribed users too (can extend past plan limit)
  const { data: profileData } = await supabase
    .from("profiles")
    .select("bonus_unlock_credits")
    .eq("id", user.id)
    .single()

  const bonus = profileData?.bonus_unlock_credits ?? 0

  return NextResponse.json({
    used: periodUsed ?? 0,
    limit: planLimit,
    bonus,
    totalRemaining: planLimit === -1 ? -1 : Math.max(0, planLimit - (periodUsed ?? 0)) + bonus,
    periodEnd: subFull?.current_period_end ?? null,
    planName: planNameFull,
    planCode: planCodeFull,
  })
}
