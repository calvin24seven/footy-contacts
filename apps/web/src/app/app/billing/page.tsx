import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/database.types"
import { BillingContent } from "./BillingClient"

type PlanRow = Tables<"plans">

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [subResult, plansResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*, plan:plans(name, code)")
      .eq("user_id", user!.id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
  ])

  const subscription = subResult.data
  const plans: PlanRow[] = plansResult.data ?? []
  const currentPlanCode = (subscription?.plan as { code?: string } | null)?.code ?? null
  const hasActiveSub = !!subscription
  const cancelAtPeriodEnd = subscription?.cancel_at_period_end ?? false

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Billing</h1>
      <p className="text-gray-400 text-sm mb-8">Manage your subscription and billing</p>

      {success === "true" && (
        <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-4 mb-6">
          <p className="text-emerald-300 font-semibold">🎉 Subscription activated!</p>
          <p className="text-emerald-400/80 text-sm mt-1">
            Welcome to your new plan. Your unlocks are ready to use.
          </p>
        </div>
      )}

      <BillingContent
        plans={plans}
        currentPlanCode={currentPlanCode}
        hasActiveSub={hasActiveSub}
        periodEnd={subscription?.current_period_end ?? null}
        subStatus={subscription?.status ?? null}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
        success={success === "true"}
      />
    </div>
  )
}
