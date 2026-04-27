import { useQuery } from "@tanstack/react-query"
import { supabase } from "@footy/supabase"
import type { Subscription, Plan } from "@footy/types"

export interface SubscriptionWithPlan extends Subscription {
  plan: Plan | null
}

export function useSubscription(userId: string | undefined) {
  return useQuery<SubscriptionWithPlan | null>({
    queryKey: ["subscription", userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, plan:plans(*)")
        .eq("user_id", userId)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as SubscriptionWithPlan | null
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  })
}
