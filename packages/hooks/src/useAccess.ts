import { useQuery } from "@tanstack/react-query"
import { supabase } from "@footy/supabase"
import type { AccessResult, PlanCode } from "@footy/types"

const PLAN_LIMITS: Record<PlanCode, { unlocks: number; exports: number }> = {
  free: { unlocks: 1, exports: 0 },
  starter: { unlocks: 50, exports: 25 },
  pro: { unlocks: 250, exports: 150 },
  agency: { unlocks: 750, exports: 500 },
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

      // Fetch current period usage
      const now = new Date().toISOString()
      const { data: usage } = await supabase
        .from("subscription_usage_periods")
        .select("unlock_count, export_count")
        .eq("user_id", userId)
        .lte("period_start", now)
        .gte("period_end", now)
        .maybeSingle()

      const planCode = (sub?.plan as { code: string } | null)?.code as PlanCode ?? "free"
      const limits = PLAN_LIMITS[planCode] ?? PLAN_LIMITS.free
      const unlocksUsed = usage?.unlock_count ?? 0
      const exportsUsed = usage?.export_count ?? 0

      return {
        canUnlock: unlocksUsed < limits.unlocks,
        canExport: exportsUsed < limits.exports,
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
