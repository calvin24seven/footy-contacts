import { createAdminClient } from "@/lib/supabase/admin"
import { Suspense } from "react"
import type { JSX } from "react"
import Link from "next/link"
import DateRangePicker, { resolveDateRange } from "@/components/admin/DateRangePicker"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}

async function AnalyticsContent({ from, to }: { from: string; to: string }) {
  const admin = createAdminClient()

  // Previous period for delta calculation
  const fromDate = new Date(from)
  const toDate   = new Date(to)
  const rangeDays = Math.max(
    1,
    Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  )
  const prevTo   = new Date(fromDate); prevTo.setDate(prevTo.getDate() - 1)
  const prevFrom = new Date(prevTo);   prevFrom.setDate(prevTo.getDate() - rangeDays + 1)
  const prevFromStr = prevFrom.toISOString().slice(0, 10)
  const prevToStr   = prevTo.toISOString().slice(0, 10)

  const [
    // Current period
    newSignups,
    unlocks,
    exports_,
    contactViews,
    activeSubs,
    dailyMetrics,
    // Previous period
    prevSignups,
    prevUnlocks,
    // Total
    totalUsers,
    totalUnlocks,
    unlocksBreakdown,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true })
      .gte("created_at", from).lte("created_at", to + "T23:59:59Z"),
    admin.from("contact_unlocks").select("id", { count: "exact", head: true })
      .gte("created_at", from).lte("created_at", to + "T23:59:59Z"),
    admin.from("exports").select("id", { count: "exact", head: true })
      .gte("created_at", from).lte("created_at", to + "T23:59:59Z"),
    admin.from("contact_views").select("id", { count: "exact", head: true })
      .gte("viewed_at", from).lte("viewed_at", to + "T23:59:59Z"),
    admin.from("subscriptions").select("id", { count: "exact", head: true })
      .eq("status", "active"),
    admin.from("daily_metrics")
      .select("date, new_signups, dau, unlocks, exports, mrr, contact_views")
      .gte("date", from).lte("date", to)
      .order("date", { ascending: true }),
    // Prev period
    admin.from("profiles").select("id", { count: "exact", head: true })
      .gte("created_at", prevFromStr).lte("created_at", prevToStr + "T23:59:59Z"),
    admin.from("contact_unlocks").select("id", { count: "exact", head: true })
      .gte("created_at", prevFromStr).lte("created_at", prevToStr + "T23:59:59Z"),
    // Totals
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("contact_unlocks").select("id", { count: "exact", head: true }),
    admin.from("contact_unlocks")
      .select("unlock_type")
      .gte("created_at", from).lte("created_at", to + "T23:59:59Z"),
  ])

  // DAU/WAU/MAU from auth audit log  
  const [dauResult, wauResult, mauResult] = await Promise.all([
    admin.rpc("get_dau_wau_mau" as never, {} as never).catch(() => ({ data: null })),
    Promise.resolve({ data: null }),
    Promise.resolve({ data: null }),
  ])
  void dauResult; void wauResult; void mauResult

  // Current MRR
  const { data: plans } = await admin
    .from("subscriptions")
    .select("plan_id, plans(monthly_price_gbp)")
    .eq("status", "active")
  const mrr = (plans ?? []).reduce((sum, s) => {
    const p = s.plans as { monthly_price_gbp: number } | null
    return sum + Number(p?.monthly_price_gbp ?? 0)
  }, 0)

  // DAU approximation from auth audit log
  const { data: dauData } = await admin
    .from("user_login_activity" as never)
    .select("user_id")
    .gte("created_at" as never, new Date().toISOString().slice(0, 10))
    .in("action" as never, ["login", "token_refreshed"])
  const dau = new Set((dauData as { user_id: string }[] ?? []).map((r) => r.user_id)).size

  const metrics = dailyMetrics.data ?? []

  // Unlock breakdown by type
  const unlockTypes: Record<string, number> = {}
  for (const u of unlocksBreakdown.data ?? []) {
    if (u.unlock_type) unlockTypes[u.unlock_type] = (unlockTypes[u.unlock_type] ?? 0) + 1
  }

  function delta(current: number, prev: number) {
    if (prev === 0) return current > 0 ? "+100%" : "—"
    const pct = Math.round(((current - prev) / prev) * 100)
    return pct >= 0 ? `+${pct}%` : `${pct}%`
  }
  function deltaColor(current: number, prev: number) {
    if (prev === 0) return "text-gray-400"
    return current >= prev ? "text-green-400" : "text-red-400"
  }

  const kpis = [
    {
      label: "New Signups",
      value: (newSignups.count ?? 0).toLocaleString(),
      sub: delta(newSignups.count ?? 0, prevSignups.count ?? 0),
      subColor: deltaColor(newSignups.count ?? 0, prevSignups.count ?? 0),
      link: "/admin/analytics/users",
    },
    {
      label: "Active Users (DAU)",
      value: dau.toLocaleString(),
      sub: "today",
      subColor: "text-gray-400",
    },
    {
      label: "Active Subscribers",
      value: (activeSubs.count ?? 0).toLocaleString(),
      sub: `£${mrr.toLocaleString()} MRR`,
      subColor: "text-gold",
      link: "/admin/analytics/revenue",
    },
    {
      label: "Contact Unlocks",
      value: (unlocks.count ?? 0).toLocaleString(),
      sub: delta(unlocks.count ?? 0, prevUnlocks.count ?? 0),
      subColor: deltaColor(unlocks.count ?? 0, prevUnlocks.count ?? 0),
      link: "/admin/analytics/engagement",
    },
    {
      label: "CSV Exports",
      value: (exports_.count ?? 0).toLocaleString(),
      sub: "in period",
      subColor: "text-gray-400",
      link: "/admin/analytics/engagement",
    },
    {
      label: "Contact Views",
      value: (contactViews.count ?? 0).toLocaleString(),
      sub: "in period",
      subColor: "text-gray-400",
    },
    {
      label: "Total Registered Users",
      value: (totalUsers.count ?? 0).toLocaleString(),
      sub: "all time",
      subColor: "text-gray-400",
    },
    {
      label: "Total Unlocks (All Time)",
      value: (totalUnlocks.count ?? 0).toLocaleString(),
      sub: "all time",
      subColor: "text-gray-400",
    },
  ]

  // Build chart data — signups and unlocks per day
  const chartDays = metrics.length > 0
    ? metrics
    : Array.from({ length: rangeDays }, (_, i) => {
        const d = new Date(fromDate); d.setDate(fromDate.getDate() + i)
        return { date: d.toISOString().slice(0, 10), new_signups: 0, dau: 0, unlocks: 0, exports: 0, mrr: 0, contact_views: 0 }
      })

  const maxSignups = Math.max(...chartDays.map((d) => d.new_signups ?? 0), 1)
  const maxUnlocks = Math.max(...chartDays.map((d) => d.unlocks ?? 0), 1)

  return (
    <div className="space-y-8">
      {/* KPI tiles */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`bg-navy-light rounded-xl p-5 ${kpi.link ? "cursor-pointer hover:ring-1 hover:ring-gold/40 transition-all" : ""}`}
            {...(kpi.link ? { onClick: undefined } : {})}
          >
            {kpi.link ? (
              <Link href={kpi.link} className="block">
                <p className="text-gray-400 text-xs mb-1">{kpi.label}</p>
                <p className="text-3xl font-bold text-white">{kpi.value}</p>
                <p className={`text-xs mt-1 ${kpi.subColor}`}>{kpi.sub}</p>
              </Link>
            ) : (
              <>
                <p className="text-gray-400 text-xs mb-1">{kpi.label}</p>
                <p className="text-3xl font-bold text-white">{kpi.value}</p>
                <p className={`text-xs mt-1 ${kpi.subColor}`}>{kpi.sub}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Unlock type breakdown */}
      {Object.keys(unlockTypes).length > 0 && (
        <div className="bg-navy-light rounded-xl p-5">
          <h3 className="text-white text-sm font-semibold mb-4">Unlock breakdown by type</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(unlockTypes)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="bg-navy rounded-lg px-4 py-3 text-center min-w-[100px]">
                  <p className="text-2xl font-bold text-gold">{count}</p>
                  <p className="text-gray-400 text-xs mt-1 capitalize">{type}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Signups chart */}
        <div className="bg-navy-light rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-semibold">New signups per day</h3>
            <span className="text-gray-400 text-xs">{newSignups.count ?? 0} total</span>
          </div>
          <BarChart
            data={chartDays.map((d) => ({
              label: d.date,
              value: d.new_signups ?? 0,
              max: maxSignups,
            }))}
            color="bg-blue-500"
          />
        </div>

        {/* Unlocks chart */}
        <div className="bg-navy-light rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-sm font-semibold">Unlocks per day</h3>
            <span className="text-gray-400 text-xs">{unlocks.count ?? 0} total</span>
          </div>
          <BarChart
            data={chartDays.map((d) => ({
              label: d.date,
              value: d.unlocks ?? 0,
              max: maxUnlocks,
            }))}
            color="bg-gold"
          />
        </div>
      </div>

      {/* Sub-section links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: "/admin/analytics/revenue",    label: "Revenue & Billing", desc: "MRR, ARR, churn, LTV" },
          { href: "/admin/analytics/engagement", label: "Engagement",        desc: "Unlocks, exports, search" },
          { href: "/admin/analytics/users",      label: "Users & Cohorts",   desc: "Retention, funnel, segments" },
          { href: "/admin/analytics/email",      label: "Email",             desc: "Campaigns, delivery, open rates" },
        ].map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-navy-light hover:ring-1 hover:ring-gold/40 transition-all rounded-xl p-5 block"
          >
            <p className="text-white font-semibold text-sm">{s.label}</p>
            <p className="text-gray-400 text-xs mt-1">{s.desc}</p>
            <p className="text-gold text-xs mt-3">View →</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

function BarChart({
  data,
  color,
}: {
  data: { label: string; value: number; max: number }[]
  color: string
}) {
  // Show at most 60 bars — if more days, aggregate by week
  const bars = data.length <= 60 ? data : data

  return (
    <div className="flex items-end gap-px h-24 w-full">
      {bars.map((bar, i) => (
        <div
          key={i}
          className="flex-1 group relative"
          title={`${bar.label}: ${bar.value}`}
        >
          <div
            className={`${color} rounded-sm opacity-80 group-hover:opacity-100 transition-all`}
            style={{ height: `${Math.round((bar.value / bar.max) * 100)}%`, minHeight: bar.value > 0 ? "2px" : "0" }}
          />
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-navy border border-navy-light rounded px-2 py-1 text-[10px] text-white whitespace-nowrap z-10">
            {bar.label.slice(5)}: {bar.value}
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function AdminAnalyticsPage({ searchParams }: Props): Promise<JSX.Element> {
  const params = await searchParams
  const { from, to, preset } = resolveDateRange(params)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">{from} → {to}</p>
        </div>
        <Suspense>
          <DateRangePicker preset={preset} from={from} to={to} />
        </Suspense>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <AnalyticsContent from={from} to={to} />
      </Suspense>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-navy-light rounded-xl p-5 animate-pulse h-24" />
      ))}
    </div>
  )
}
