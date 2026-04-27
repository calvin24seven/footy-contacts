import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/database.types"

type PlanRow = Tables<"plans">

export default async function BillingPage() {
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

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Billing</h1>
      <p className="text-gray-400 text-sm mb-8">Manage your subscription and billing</p>

      {/* Current plan */}
      <div className="bg-navy-light rounded-xl p-5 mb-8">
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
              {!isActive && plan.monthly_price_gbp > 0 && (
                <button className="w-full py-2 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark transition-colors">
                  Upgrade — coming soon
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
