import { createAdminClient } from "@/lib/supabase/admin"
import { Suspense } from "react"
import type { JSX } from "react"
import Link from "next/link"
import DateRangePicker, { resolveDateRange } from "@/components/admin/DateRangePicker"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}

async function UsersContent({ from, to }: { from: string; to: string }) {
  const admin = createAdminClient()

  const fromTs = from + "T00:00:00Z"
  const toTs   = to   + "T23:59:59Z"

  const [
    newSignups,
    onboardingCompleted,
    userTypes,
    allProfiles,
    unlocksByUser,
    allSubs,
    recentSignups,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true })
      .gte("created_at", fromTs).lte("created_at", toTs),
    admin.from("profiles").select("id", { count: "exact", head: true })
      .eq("onboarding_completed", true)
      .gte("created_at", fromTs).lte("created_at", toTs),
    // User type breakdown
    admin.from("profiles")
      .select("user_type")
      .gte("created_at", fromTs).lte("created_at", toTs),
    // All profiles for cohort (last 12 months)
    admin.from("profiles")
      .select("id, created_at, onboarding_completed")
      .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: true }),
    // Unlocks for retention proxy
    admin.from("contact_unlocks")
      .select("user_id, created_at")
      .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),
    // All subs
    admin.from("subscriptions")
      .select("user_id, status, created_at")
      .order("created_at", { ascending: true }),
    // Recent signups
    admin.from("profiles")
      .select("id, full_name, email, user_type, onboarding_completed, created_at")
      .gte("created_at", fromTs).lte("created_at", toTs)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  // Onboarding completion rate
  const onboardingRate = (newSignups.count ?? 0) > 0
    ? ((onboardingCompleted.count ?? 0) / (newSignups.count ?? 1) * 100).toFixed(0)
    : "0"

  // User type breakdown
  const typeMap: Record<string, number> = {}
  for (const p of userTypes.data ?? []) {
    const t = p.user_type ?? "not set"
    typeMap[t] = (typeMap[t] ?? 0) + 1
  }

  // Conversion: signed up → has unlock → has active subscription
  const totalInPeriod = newSignups.count ?? 0
  const subsInPeriod = (allSubs.data ?? []).filter(
    (s) => s.created_at >= fromTs && s.created_at <= toTs
  ).length

  // Cohort retention analysis (last 6 months)
  // Bucket users by signup month
  const cohortMonths = 6
  const cohorts: {
    month: string
    signups: number
    active: number[]  // % active at month 0,1,2,3,4,5
  }[] = []

  const now = new Date()
  for (let i = cohortMonths - 1; i >= 0; i--) {
    const cohortStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const cohortEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const monthLabel  = cohortStart.toLocaleDateString("en-GB", { month: "short", year: "numeric" })

    const cohortUsers = (allProfiles.data ?? []).filter((p) => {
      const d = new Date(p.created_at)
      return d >= cohortStart && d <= cohortEnd
    })

    const unlockUserMap = new Map<string, Date[]>()
    for (const u of unlocksByUser.data ?? []) {
      if (!unlockUserMap.has(u.user_id)) unlockUserMap.set(u.user_id, [])
      unlockUserMap.get(u.user_id)!.push(new Date(u.created_at))
    }

    // For each subsequent month, count cohort users who had any activity
    const activity: number[] = []
    for (let m = 0; m <= Math.min(i, 5); m++) {
      const windowStart = new Date(cohortStart); windowStart.setMonth(cohortStart.getMonth() + m)
      const windowEnd   = new Date(windowStart); windowEnd.setMonth(windowStart.getMonth() + 1)
      const active = cohortUsers.filter((u) => {
        const userUnlocks = unlockUserMap.get(u.id) ?? []
        return userUnlocks.some((d) => d >= windowStart && d < windowEnd)
      })
      activity.push(cohortUsers.length > 0 ? Math.round((active.length / cohortUsers.length) * 100) : 0)
    }

    cohorts.push({
      month: monthLabel,
      signups: cohortUsers.length,
      active: activity,
    })
  }

  // Signup funnel (all time)
  const totalSignups   = allProfiles.data?.length ?? 0
  const totalOnboarded = (allProfiles.data ?? []).filter((p) => p.onboarding_completed).length
  const totalUnlockers = new Set((unlocksByUser.data ?? []).map((u) => u.user_id)).size
  const totalPaid      = new Set((allSubs.data ?? []).filter((s) => s.status === "active" || s.status === "canceled").map((s) => s.user_id)).size

  const funnelSteps = [
    { label: "Signed up",             value: totalSignups,   pct: 100 },
    { label: "Completed onboarding",  value: totalOnboarded, pct: totalSignups > 0 ? Math.round(totalOnboarded / totalSignups * 100) : 0 },
    { label: "Made ≥1 unlock",        value: totalUnlockers, pct: totalSignups > 0 ? Math.round(totalUnlockers / totalSignups * 100) : 0 },
    { label: "Ever subscribed (paid)", value: totalPaid,     pct: totalSignups > 0 ? Math.round(totalPaid / totalSignups * 100) : 0 },
  ]

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "New Signups",           value: (newSignups.count ?? 0).toLocaleString(),     color: "text-white" },
          { label: "Onboarding Rate",       value: `${onboardingRate}%`,                          color: Number(onboardingRate) > 60 ? "text-green-400" : "text-yellow-400" },
          { label: "New Subscribers",       value: subsInPeriod.toLocaleString(),                 color: "text-gold" },
          { label: "Free→Paid Conversion",  value: totalInPeriod > 0 ? `${Math.round(subsInPeriod / totalInPeriod * 100)}%` : "—", color: "text-white" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-navy-light rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Signup funnel */}
      <div className="bg-navy-light rounded-xl p-5">
        <h3 className="text-white text-sm font-semibold mb-4">Signup funnel (all time)</h3>
        <div className="space-y-3">
          {funnelSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-4">
              <span className="text-gray-500 text-xs w-4">{i + 1}</span>
              <span className="text-gray-300 text-sm flex-1">{step.label}</span>
              <div className="w-48 bg-navy rounded-full h-2">
                <div
                  className="bg-gold h-2 rounded-full transition-all"
                  style={{ width: `${step.pct}%` }}
                />
              </div>
              <span className="text-white text-sm font-semibold w-16 text-right">{step.value.toLocaleString()}</span>
              <span className="text-gray-400 text-xs w-10 text-right">{step.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* User type breakdown */}
      {Object.keys(typeMap).length > 0 && (
        <div className="bg-navy-light rounded-xl p-5">
          <h3 className="text-white text-sm font-semibold mb-4">User types in period</h3>
          <div className="space-y-3">
            {Object.entries(typeMap)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-gray-300 text-sm w-32 capitalize">{type.replace(/_/g, " ")}</span>
                  <div className="flex-1 bg-navy rounded-full h-2">
                    <div
                      className="bg-blue-400 h-2 rounded-full"
                      style={{ width: `${Math.round((count / (newSignups.count || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-gray-300 text-sm w-8 text-right">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Cohort retention table */}
      <div className="bg-navy-light rounded-xl p-5 overflow-x-auto">
        <h3 className="text-white text-sm font-semibold mb-1">Cohort retention</h3>
        <p className="text-gray-500 text-xs mb-4">% of each month's signups who made at least one unlock in subsequent months</p>
        <table className="text-xs border-collapse min-w-full">
          <thead>
            <tr>
              <th className="text-left text-gray-400 font-medium py-2 pr-4 w-28">Cohort</th>
              <th className="text-right text-gray-400 font-medium py-2 px-2 w-16">Signups</th>
              {Array.from({ length: 6 }).map((_, i) => (
                <th key={i} className="text-center text-gray-400 font-medium py-2 px-2 w-16">
                  M+{i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((cohort) => (
              <tr key={cohort.month} className="border-t border-navy-dark/50">
                <td className="py-2 pr-4 text-gray-300">{cohort.month}</td>
                <td className="py-2 px-2 text-right text-gray-400">{cohort.signups}</td>
                {Array.from({ length: 6 }).map((_, m) => {
                  const val = cohort.active[m]
                  if (val === undefined) {
                    return <td key={m} className="py-2 px-2 text-center text-gray-700">—</td>
                  }
                  const bg =
                    val >= 40 ? "bg-green-900/60 text-green-300" :
                    val >= 20 ? "bg-yellow-900/40 text-yellow-300" :
                    val > 0   ? "bg-red-900/40 text-red-300" :
                    "text-gray-600"
                  return (
                    <td key={m} className="py-2 px-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${bg}`}>
                        {val}%
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent signups table */}
      <div className="bg-navy-light rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-dark">
          <h3 className="text-white text-sm font-semibold">New signups in period</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-dark">
              {["User", "Type", "Onboarded", "Joined"].map((h) => (
                <th key={h} className="text-left px-4 py-2 text-gray-400 text-xs font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(recentSignups.data ?? []).length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500 text-xs">No signups in this period</td></tr>
            ) : (
              (recentSignups.data ?? []).map((u) => (
                <tr key={u.id} className="border-b border-navy-dark/50 hover:bg-navy/30">
                  <td className="px-4 py-2">
                    <Link href={`/admin/users/${u.id}`} className="text-blue-400 hover:underline text-xs">
                      {u.full_name ?? u.email ?? u.id.slice(0, 8) + "…"}
                    </Link>
                    {u.email && u.full_name && <p className="text-gray-500 text-xs">{u.email}</p>}
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs capitalize">{u.user_type ?? "—"}</td>
                  <td className="px-4 py-2">
                    {u.onboarding_completed
                      ? <span className="text-green-400 text-xs">Yes</span>
                      : <span className="text-yellow-400 text-xs">No</span>}
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default async function AdminUsersAnalyticsPage({ searchParams }: Props): Promise<JSX.Element> {
  const params  = await searchParams
  const { from, to, preset } = resolveDateRange(params)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/analytics" className="text-gray-400 text-sm hover:text-white">Analytics</Link>
            <span className="text-gray-600">›</span>
            <span className="text-white text-sm">Users</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Users & Cohorts</h1>
        </div>
        <Suspense>
          <DateRangePicker preset={preset} from={from} to={to} />
        </Suspense>
      </div>

      <Suspense fallback={<div className="animate-pulse h-48 bg-navy-light rounded-xl" />}>
        <UsersContent from={from} to={to} />
      </Suspense>
    </div>
  )
}
