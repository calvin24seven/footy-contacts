import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/database.types"
import { UpgradeButton, ManageSubscriptionButton } from "./BillingClient"

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
      .select("*")
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

  // Fetch current plan separately if we have a subscription
  let currentPlan: PlanRow | null = null
  if (subscription?.plan_id) {
    const { data } = await supabase
      .from("plans")
      .select("*")
      .eq("id", subscription.plan_id)
      .single()
    currentPlan = data
  }

  const hasActiveSub = !!subscription

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Billing</h1>
      <p className="text-gray-400 text-sm mb-8">Manage your subscription and billing</p>

      {/* Success banner */}
      {success === "true" && (
        <div className="bg-green-900/40 border border-green-700 rounded-xl p-4 mb-6">
          <p className="text-green-300 font-semibold">🎉 Subscription activated!</p>
          <p className="text-green-400 text-sm mt-1">
            Welcome to your new plan. Your unlocks are ready to use.
          </p>
        </div>
      )}

      {/* Current plan */}
      <div className="bg-navy-light rounded-xl p-5 mb-4">
        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Current plan</p>
        <p className="text-white text-xl font-bold">
          {currentPlan?.name ?? "Free"}
        </p>
        {subscription ? (
          <p className="text-gray-400 text-sm mt-1">
            Status: <span className="text-green-400 capitalize">{subscription.status}</span>
            {subscription.current_period_end && (
              <>
                {" · Renews "}
                {new Date(subscription.current_period_end).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </>
            )}
          </p>
        ) : (
          <p className="text-gray-400 text-sm mt-1">
            Upgrade to unlock more contacts and exports
          </p>
        )}
      </div>

      {/* Manage subscription */}
      {hasActiveSub && (
        <div className="flex justify-end mb-8">
          <ManageSubscriptionButton />
        </div>
      )}

      {/* Plans */}
      <h2 className="text-white font-semibold mb-4">Plans</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const isActive = currentPlan?.code === plan.code
          return (
            <div
              key={plan.id}
              className={`rounded-xl p-5 border-2 transition-colors ${
                isActive
                  ? "border-gold bg-gold/5"
                  : "border-navy-light bg-navy-light"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-white font-bold text-lg">{plan.name}</p>
                  <p className="text-gold font-semibold">
                    {plan.monthly_price_gbp === 0
                      ? "Free"
                      : `£${plan.monthly_price_gbp}/mo`}
                  </p>
                </div>
                {isActive && (
                  <span className="text-xs bg-gold text-navy px-2 py-0.5 rounded font-semibold">
                    Current
                  </span>
                )}
              </div>
              <ul className="text-sm text-gray-300 space-y-1 mb-4">
                <li>{plan.monthly_unlock_limit} unlocks/month</li>
                <li>{plan.monthly_export_limit} exports/month</li>
              </ul>
              <UpgradeButton
                plan={plan}
                hasActiveSubscription={hasActiveSub}
                isCurrentPlan={isActive}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
