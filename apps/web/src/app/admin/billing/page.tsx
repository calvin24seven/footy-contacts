import { createAdminClient } from "@/lib/supabase/server"
import type { JSX } from "react"

const PER_PAGE = 30

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>
}): Promise<JSX.Element> {
  const supabase = await createAdminClient()
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10))
  const search = params.q?.trim() ?? ""
  const statusFilter = params.status ?? "active"
  const offset = (page - 1) * PER_PAGE

  const [plansResult, subsResult] = await Promise.all([
    supabase.from("plans").select("*").order("sort_order"),
    supabase
      .from("subscriptions")
      .select("id, user_id, plan_id, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, cancel_at_period_end, created_at", { count: "exact" })
      .eq("status", statusFilter || "active")
      .order("created_at", { ascending: false })
      .range(offset, offset + PER_PAGE - 1),
  ])

  const plans = plansResult.data ?? []
  const subs = subsResult.data ?? []
  const totalSubs = subsResult.count ?? 0

  // Fetch profiles for these subscriptions
  const userIds = subs.map((s) => s.user_id)
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, email, full_name").in("id", userIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
  const planMap = new Map(plans.map((p) => [p.id, p]))
  const totalPages = Math.ceil(totalSubs / PER_PAGE)

  const statusColors: Record<string, string> = {
    active: "bg-green-900/40 text-green-300",
    trialing: "bg-blue-900/40 text-blue-300",
    canceled: "bg-gray-800 text-gray-400",
    past_due: "bg-red-900/40 text-red-300",
  }

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    if (search) p.set("q", search)
    p.set("status", statusFilter)
    p.set("page", String(page))
    Object.entries(overrides).forEach(([k, v]) => { if (v) p.set(k, v); else p.delete(k) })
    const s = p.toString()
    return `/admin/billing${s ? `?${s}` : ""}`
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-white">Billing</h1>

      {/* Plans overview */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Plans</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-navy-light rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold">{plan.name}</span>
                <span className={`text-xs px-2 py-1 rounded ${plan.is_active ? "bg-green-900/40 text-green-300" : "bg-gray-800 text-gray-400"}`}>
                  {plan.is_active ? "active" : "inactive"}
                </span>
              </div>
              <p className="text-2xl font-bold text-gold">£{plan.monthly_price_gbp}<span className="text-sm text-gray-400">/mo</span></p>
              <div className="mt-3 space-y-1 text-xs text-gray-400">
                <p>Unlocks: {plan.monthly_unlock_limit === -1 ? "∞" : plan.monthly_unlock_limit}/mo</p>
                <p>Exports: {plan.monthly_export_limit === -1 ? "∞" : plan.monthly_export_limit}/mo</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Subscriptions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Subscriptions</h2>
          <span className="text-gray-400 text-sm">{totalSubs.toLocaleString()} results</span>
        </div>

        <form method="GET" action="/admin/billing" className="flex gap-3">
          <select name="status" defaultValue={statusFilter} className="input-base text-sm py-2 w-36">
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="canceled">Canceled</option>
            <option value="past_due">Past due</option>
          </select>
          <button type="submit" className="btn-secondary text-sm">Filter</button>
        </form>

        <div className="bg-navy-light rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-dark">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Plan</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Period end</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Cancels?</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Stripe ID</th>
              </tr>
            </thead>
            <tbody>
              {!subs.length ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No subscriptions found</td></tr>
              ) : (
                subs.map((sub) => {
                  const profile = profileMap.get(sub.user_id)
                  const plan = sub.plan_id ? planMap.get(sub.plan_id) : null
                  return (
                    <tr key={sub.id} className="border-b border-navy-dark last:border-0 hover:bg-navy/30">
                      <td className="px-4 py-3">
                        <div className="text-white text-sm">{profile?.full_name ?? "—"}</div>
                        <div className="text-gray-400 text-xs">{profile?.email ?? sub.user_id}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{plan?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded ${statusColors[sub.status] ?? "text-gray-400"}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {sub.current_period_end
                          ? new Date(sub.current_period_end).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {sub.cancel_at_period_end
                          ? <span className="text-orange-400">Yes</span>
                          : <span className="text-gray-500">No</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono truncate max-w-[140px]">
                        {sub.stripe_subscription_id ?? "—"}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-sm">
            {page > 1 && (
              <a href={buildUrl({ page: String(page - 1) })} className="btn-secondary">← Prev</a>
            )}
            <span className="text-gray-400">Page {page} of {totalPages}</span>
            {page < totalPages && (
              <a href={buildUrl({ page: String(page + 1) })} className="btn-secondary">Next →</a>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
