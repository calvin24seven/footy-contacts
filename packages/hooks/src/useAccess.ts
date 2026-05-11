import { useQuery } from "@tanstack/react-query"
import { supabase } from "@footy/supabase"
import type { AccessResult, PlanCode } from "@footy/types"

const PLAN_LIMITS: Record<PlanCode, { unlocks: number; exports: number }> = {
  free: { unlocks: 3, exports: 0 },
  starter: { unlocks: 50, exports: 25 },
  pro: { unlocks: 150, exports: 75 },
  agency: { unlocks: -1, exports: 500 },
}

export function useAccess(userId: string | undefined) {
  return useQuery<AccessResult>({
    queryKey: ["access", userId],
    queryFn: async () => {
      if (!userId) {
        return {
          canUnlock: false,
          canExport: false,
          unlocksUsed: 0,
          unlocksLimit: 0,
          exportsUsed: 0,
          exportsLimit: 0,
          planCode: "free" as PlanCode,
        }
      }

      // Fetch active subscription + plan
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*, plan:plans(code, monthly_unlock_limit, monthly_export_limit)")
        .eq("user_id", userId)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const planCode = (sub?.plan as { code: string } | null)?.code as PlanCode ?? "free"
      const limits = PLAN_LIMITS[planCode] ?? PLAN_LIMITS.free

      // Free users: unlock count comes from profiles.lifetime_unlocks_used (what the
      // RPC actually enforces). Subscribed users: count comes from usage periods.
      let unlocksUsed = 0
      let exportsUsed = 0

      if (!sub) {
        // Free user — read lifetime_unlocks_used from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("lifetime_unlocks_used")
          .eq("id", userId)
          .single()
        unlocksUsed = profile?.lifetime_unlocks_used ?? 0
      } else {
        // Subscribed user — read from current billing period
        const now = new Date().toISOString()
        const { data: usage } = await supabase
          .from("subscription_usage_periods")
          .select("unlock_count, export_count")
          .eq("user_id", userId)
          .lte("period_start", now)
          .gte("period_end", now)
          .maybeSingle()
        unlocksUsed = usage?.unlock_count ?? 0
        exportsUsed = usage?.export_count ?? 0
      }

      return {
        canUnlock: limits.unlocks === -1 || unlocksUsed < limits.unlocks,
        canExport: limits.exports === -1 || exportsUsed < limits.exports,
        unlocksUsed,
        unlocksLimit: limits.unlocks,
        exportsUsed,
        exportsLimit: limits.exports,
        planCode,
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60,
  })
}
