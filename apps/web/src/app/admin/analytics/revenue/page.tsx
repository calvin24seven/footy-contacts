import { createAdminClient } from "@/lib/supabase/admin"
import { Suspense } from "react"
import type { JSX } from "react"
import Link from "next/link"
import DateRangePicker, { resolveDateRange } from "@/components/admin/DateRangePicker"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}

async function RevenueContent({ from, to }: { from: string; to: string }) {
  const admin = createAdminClient()

  const [
    activeSubs,
    cancelPending,
    pastDue,
    billingEventsResult,
    dailyMetrics,
    planBreakdown,
    recentBillingEvents,
    allCancelledSubs,
  ] = await Promise.all([
    // Active subscriptions with plan info
    admin
      .from("subscriptions")
      .select("id, user_id, plan_id, status, cancel_at_period_end, current_period_end, created_at, plans(name, monthly_price_gbp, code)")
      .eq("status", "active"),
    // Pending cancellations
    admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("cancel_at_period_end", true),
    // Past due
    admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "past_due"),
    // Billing events in period
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from("billing_events")
      .select("event_type, mrr_change, created_at, plan_id, user_id")
      .gte("created_at", from)
      .lte("created_at", to + "T23:59:59Z"),
    // Daily MRR trend
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from("daily_metrics")
      .select("date, mrr, new_mrr, churned_mrr, new_paid_users, churned_users")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: true }),
    // Plan breakdown
    admin
      .from("subscriptions")
      .select("plan_id, plans(name, monthly_price_gbp, code)")
      .eq("status", "active"),
    // Recent billing events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from("billing_events")
      .select("id, event_type, mrr_change, created_at, user_id, plan_id, plans(name)")
      .order("created_at", { ascending: false })
      .limit(20),
    // All-time cancelled subs count
    admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "canceled"),
  ])

  // MRR calculations
  const mrr = (activeSubs.data ?? []).reduce((sum, s) => {
    const p = s.plans as { monthly_price_gbp: number } | null
    return sum + Number(p?.monthly_price_gbp ?? 0)
  }, 0)
  const arr = mrr * 12

  // Period billing stats
  type BillingEvent = { id: string; event_type: string; mrr_change: number; created_at: string; user_id: string; plan_id: string; plans?: { name: string } | null }
  const events = (billingEventsResult.data ?? []) as BillingEvent[]
  const newMrr    = events.filter((e) => e.mrr_change > 0).reduce((s, e) => s + Number(e.mrr_change), 0)
  const churnedMrr = events.filter((e) => e.mrr_change < 0).reduce((s, e) => s + Math.abs(Number(e.mrr_change)), 0)
  const netMrr     = newMrr - churnedMrr
  const newPaidUsers = events.filter((e) => e.event_type === "subscription_created").length
  const churnedUsers = events.filter((e) => e.event_type === "subscription_cancelled").length

  // ARPU
  const activeCount = activeSubs.data?.length ?? 0
  const arpu = activeCount > 0 ? (mrr / activeCount).toFixed(2) : "0.00"

  // Churn rate (monthly) = churned this period / total at start
  const totalAtStart = activeCount + churnedUsers
  const churnRate = totalAtStart > 0
    ? ((churnedUsers / totalAtStart) * 100).toFixed(1)
    : "0.0"

  // LTV = ARPU / monthly_churn_rate
  const churnRateDecimal = totalAtStart > 0 ? churnedUsers / totalAtStart : 0
  const ltv = churnRateDecimal > 0
    ? `£${(Number(arpu) / churnRateDecimal).toFixed(0)}`
    : "∞"

  // Plan mix
  const planCounts: Record<string, { name: string; count: number; mrr: number }> = {}
  for (const s of planBreakdown.data ?? []) {
    const p = s.plans as { name: string; monthly_price_gbp: number; code: string } | null
    if (!p || !s.plan_id) continue
    if (!planCounts[s.plan_id]) planCounts[s.plan_id] = { name: p.name, count: 0, mrr: 0 }
    planCounts[s.plan_id].count += 1
    planCounts[s.plan_id].mrr  += Number(p.monthly_price_gbp)
  }

  type DailyMetric = { date: string; mrr: number; new_mrr: number; churned_mrr: number; new_paid_users: number; churned_users: number }
  const metrics = (dailyMetrics.data ?? []) as DailyMetric[]
  const maxMrr  = Math.max(...metrics.map((d) => Number(d.mrr ?? 0)), mrr, 1)

  const eventTypeColors: Record<string, string> = {
    subscription_created:   "text-green-400",
    subscription_cancelled: "text-red-400",
    subscription_renewed:   "text-blue-400",
    plan_upgraded:          "text-gold",
    plan_downgraded:        "text-yellow-400",
    trial_started:          "text-purple-400",
    trial_converted:        "text-green-400",
    payment_failed:         "text-red-400",
    payment_recovered:      "text-green-400",
  }

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "MRR",              value: `£${mrr.toLocaleString()}`,     sub: "current", color: "text-gold" },
          { label: "ARR",              value: `£${arr.toLocaleString()}`,     sub: "annualised", color: "text-gold" },
          { label: "Active Subs",      value: activeCount.toLocaleString(),   sub: `${cancelPending.count ?? 0} pending cancellation`, color: "text-white" },
          { label: "Past Due",         value: (pastDue.count ?? 0).toString(), sub: "at-risk", color: pastDue.count ? "text-red-400" : "text-gray-400" },
          { label: "New MRR (period)", value: `+£${newMrr.toFixed(0)}`,      sub: `${newPaidUsers} new subs`, color: "text-green-400" },
          { label: "Churned MRR",      value: `-£${churnedMrr.toFixed(0)}`,  sub: `${churnedUsers} cancellations`, color: churnedMrr > 0 ? "text-red-400" : "text-gray-400" },
          { label: "Net MRR",          value: `${netMrr >= 0 ? "+" : ""}£${netMrr.toFixed(0)}`, sub: "new − churned", color: netMrr >= 0 ? "text-green-400" : "text-red-400" },
          { label: "ARPU",             value: `£${arpu}`,                    sub: "per active sub", color: "text-white" },
          { label: "LTV (est.)",        value: ltv,                          sub: "ARPU ÷ churn rate", color: "text-white" },
          { label: "Monthly Churn",    value: `${churnRate}%`,              sub: "based on period", color: Number(churnRate) > 5 ? "text-red-400" : "text-green-400" },
          { label: "All-Time Cancelled", value: (allCancelledSubs.count ?? 0).toLocaleString(), sub: "total churned", color: "text-gray-400" },
          { label: "Cancel Pending",   value: (cancelPending.count ?? 0).toLocaleString(), sub: "will churn next renewal", color: cancelPending.count ? "text-yellow-400" : "text-gray-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-navy-light rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-gray-500 text-xs mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* MRR trend chart */}
      {metrics.length > 1 && (
        <div className="bg-navy-light rounded-xl p-5">
          <h3 className="text-white text-sm font-semibold mb-4">MRR over time</h3>
          <div className="flex items-end gap-px h-28 w-full">
            {metrics.map((d, i) => (
              <div key={i} className="flex-1 group relative" title={`${d.date}: £${d.mrr}`}>
                <div
                  className="bg-gold rounded-sm opacity-80 group-hover:opacity-100"
                  style={{
                    height: `${Math.round((Number(d.mrr ?? 0) / maxMrr) * 100)}%`,
                    minHeight: Number(d.mrr ?? 0) > 0 ? "3px" : "0",
                  }}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-navy border border-navy-light rounded px-2 py-1 text-[10px] text-white whitespace-nowrap z-10">
                  {d.date.slice(5)}: £{d.mrr}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan mix */}
      {Object.keys(planCounts).length > 0 && (
        <div className="bg-navy-light rounded-xl p-5">
          <h3 className="text-white text-sm font-semibold mb-4">Plan mix</h3>
          <div className="space-y-3">
            {Object.values(planCounts)
              .sort((a, b) => b.mrr - a.mrr)
              .map((plan) => (
                <div key={plan.name} className="flex items-center gap-4">
                  <span className="text-gray-300 text-sm w-24 truncate">{plan.name}</span>
                  <div className="flex-1 bg-navy rounded-full h-2">
                    <div
                      className="bg-gold h-2 rounded-full"
                      style={{ width: `${Math.round((plan.count / (activeCount || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-gray-300 text-sm w-8 text-right">{plan.count}</span>
                  <span className="text-gold text-sm w-20 text-right">£{plan.mrr.toFixed(0)}/mo</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Active subscriptions table */}
      <div className="bg-navy-light rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-dark">
          <h3 className="text-white text-sm font-semibold">Active subscriptions</h3>
          <Link href="/admin/billing" className="text-gold text-xs hover:underline">
            Full billing view →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-dark">
                {["User ID", "Plan", "MRR", "Next renewal", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-gray-400 text-xs font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(activeSubs.data ?? []).map((s) => {
                const p = s.plans as { name: string; monthly_price_gbp: number } | null
                return (
                  <tr key={s.id} className="border-b border-navy-dark/50 hover:bg-navy/30">
                    <td className="px-4 py-2 text-gray-400 text-xs font-mono">
                      <Link href={`/admin/users/${s.user_id}`} className="text-blue-400 hover:underline">
                        {s.user_id.slice(0, 8)}…
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-white text-xs">{p?.name ?? "—"}</td>
                    <td className="px-4 py-2 text-gold text-xs">£{p?.monthly_price_gbp ?? 0}/mo</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {s.current_period_end
                        ? new Date(s.current_period_end).toLocaleDateString("en-GB")
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      {s.cancel_at_period_end ? (
                        <span className="text-yellow-400 text-xs">Cancelling</span>
                      ) : (
                        <span className="text-green-400 text-xs">Active</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {!(activeSubs.data?.length) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-xs">
                    No active subscriptions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent billing events */}
      <div className="bg-navy-light rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-dark">
          <h3 className="text-white text-sm font-semibold">Recent billing events</h3>
        </div>
        <div className="divide-y divide-navy-dark/50">
          {(recentBillingEvents.data ?? []).length === 0 ? (
            <p className="px-5 py-6 text-gray-500 text-sm">
              No billing events yet — they'll appear once subscriptions change via Stripe webhooks.
            </p>
          ) : (
            (recentBillingEvents.data as BillingEvent[] ?? []).map((e) => {
              const plan = e.plans as { name: string } | null
              return (
                <div key={e.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono ${eventTypeColors[e.event_type] ?? "text-gray-400"}`}>
                      {e.event_type.replace(/_/g, " ")}
                    </span>
                    {plan && <span className="text-gray-400 text-xs">{plan.name}</span>}
                    <Link href={`/admin/users/${e.user_id}`} className="text-blue-400 text-xs hover:underline font-mono">
                      {e.user_id.slice(0, 8)}…
                    </Link>
                  </div>
                  <div className="flex items-center gap-4">
                    {Number(e.mrr_change) !== 0 && (
                      <span className={`text-xs font-semibold ${Number(e.mrr_change) > 0 ? "text-green-400" : "text-red-400"}`}>
                        {Number(e.mrr_change) > 0 ? "+" : ""}£{Number(e.mrr_change).toFixed(0)}
                      </span>
                    )}
                    <span className="text-gray-500 text-xs">
                      {new Date(e.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default async function AdminRevenueAnalyticsPage({ searchParams }: Props): Promise<JSX.Element> {
  const params  = await searchParams
  const { from, to, preset } = resolveDateRange(params)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/analytics" className="text-gray-400 text-sm hover:text-white">Analytics</Link>
            <span className="text-gray-600">›</span>
            <span className="text-white text-sm">Revenue</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Revenue & Billing</h1>
        </div>
        <Suspense>
          <DateRangePicker preset={preset} from={from} to={to} />
        </Suspense>
      </div>

      <Suspense fallback={<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-navy-light rounded-xl p-4 animate-pulse h-20" />)}</div>}>
        <RevenueContent from={from} to={to} />
      </Suspense>
    </div>
  )
}
