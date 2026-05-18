import { createAdminClient } from "@/lib/supabase/admin"
import { Suspense } from "react"
import type { JSX } from "react"
import Link from "next/link"
import DateRangePicker, { resolveDateRange } from "@/components/admin/DateRangePicker"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}

async function EngagementContent({ from, to }: { from: string; to: string }) {
  const admin = createAdminClient()

  const fromTs = from + "T00:00:00Z"
  const toTs   = to   + "T23:59:59Z"

  const [
    unlocks,
    unlocksByType,
    exports_,
    contactViews,
    topUnlockers,
    unlockDistribution,
    exportsByUser,
    savedSearches,
    listsCreated,
    searchEvents,
    recentUnlocks,
  ] = await Promise.all([
    admin.from("contact_unlocks").select("id", { count: "exact", head: true })
      .gte("created_at", fromTs).lte("created_at", toTs),
    admin.from("contact_unlocks").select("unlock_type")
      .gte("created_at", fromTs).lte("created_at", toTs),
    admin.from("exports").select("id, contact_count, export_type", { count: "exact" })
      .gte("created_at", fromTs).lte("created_at", toTs),
    admin.from("contact_views").select("id", { count: "exact", head: true })
      .gte("viewed_at", fromTs).lte("viewed_at", toTs),
    // Top unlockers in period
    admin.from("contact_unlocks")
      .select("user_id")
      .gte("created_at", fromTs).lte("created_at", toTs),
    // Unlock count per user for distribution
    admin.from("contact_unlocks")
      .select("user_id")
      .gte("created_at", fromTs).lte("created_at", toTs),
    // Exports per user
    admin.from("exports")
      .select("user_id, contact_count")
      .gte("created_at", fromTs).lte("created_at", toTs),
    // Saved searches created
    admin.from("saved_searches").select("id", { count: "exact", head: true })
      .gte("created_at", fromTs).lte("created_at", toTs),
    // Lists created
    admin.from("lists").select("id", { count: "exact", head: true })
      .eq("is_system", false)
      .gte("created_at", fromTs).lte("created_at", toTs),
    // Search events
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from("user_events")
      .select("user_id, properties, created_at")
      .eq("event_name", "search")
      .gte("created_at", fromTs).lte("created_at", toTs),
    // Recent unlocks with contact info
    admin.from("contact_unlocks")
      .select("id, user_id, contact_id, unlock_type, created_at")
      .gte("created_at", fromTs).lte("created_at", toTs)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  // Unlock type breakdown
  const typeMap: Record<string, number> = {}
  for (const u of unlocksByType.data ?? []) {
    typeMap[u.unlock_type] = (typeMap[u.unlock_type] ?? 0) + 1
  }

  // Top unlockers
  const userUnlockCounts: Record<string, number> = {}
  for (const u of topUnlockers.data ?? []) {
    userUnlockCounts[u.user_id] = (userUnlockCounts[u.user_id] ?? 0) + 1
  }
  const topUserIds = Object.entries(userUnlockCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Fetch profiles for top unlockers
  const { data: topProfiles } = topUserIds.length
    ? await admin
        .from("profiles")
        .select("id, email, full_name, user_type")
        .in("id", topUserIds.map(([id]) => id))
    : { data: [] }
  const profileMap = new Map((topProfiles ?? []).map((p) => [p.id, p]))

  // Unlock distribution buckets
  const buckets = { "0": 0, "1": 0, "2-5": 0, "6-20": 0, "21+": 0 }
  // Count total active users in period who had any activity
  const unlockCountsByUser: Record<string, number> = {}
  for (const u of unlockDistribution.data ?? []) {
    unlockCountsByUser[u.user_id] = (unlockCountsByUser[u.user_id] ?? 0) + 1
  }
  for (const count of Object.values(unlockCountsByUser)) {
    if (count === 1)       buckets["1"]++
    else if (count <= 5)   buckets["2-5"]++
    else if (count <= 20)  buckets["6-20"]++
    else                   buckets["21+"]++
  }

  // Export stats
  const totalExportedContacts = (exports_.data ?? []).reduce((s, e) => s + (e.contact_count ?? 0), 0)

  // Browse-to-unlock rate
  const browseToUnlock = (contactViews.count ?? 0) > 0
    ? ((unlocks.count ?? 0) / (contactViews.count ?? 1) * 100).toFixed(1)
    : "0.0"

  // Search analytics
  const searchTerms: Record<string, number> = {}
  const zeroResults: number[] = []
  for (const e of searchEvents.data ?? []) {
    const props = e.properties as Record<string, unknown>
    const q = typeof props?.query === "string" ? props.query.trim().toLowerCase() : null
    if (q) searchTerms[q] = (searchTerms[q] ?? 0) + 1
    if (typeof props?.result_count === "number" && props.result_count === 0) {
      zeroResults.push(1)
    }
  }
  const topSearchTerms = Object.entries(searchTerms)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Unlocks",        value: (unlocks.count ?? 0).toLocaleString(),       color: "text-white" },
          { label: "CSV Exports",           value: (exports_.count ?? 0).toLocaleString(),      color: "text-white" },
          { label: "Contacts Exported",     value: totalExportedContacts.toLocaleString(),      color: "text-white" },
          { label: "Contact Views",         value: (contactViews.count ?? 0).toLocaleString(),  color: "text-white" },
          { label: "Browse→Unlock Rate",    value: `${browseToUnlock}%`,                        color: "text-blue-400" },
          { label: "Searches",             value: (searchEvents.data?.length ?? 0).toLocaleString(), color: "text-white" },
          { label: "Zero-Result Searches", value: zeroResults.length.toLocaleString(),          color: zeroResults.length > 10 ? "text-yellow-400" : "text-gray-400" },
          { label: "Lists Created",        value: (listsCreated.count ?? 0).toLocaleString(),   color: "text-white" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-navy-light rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Unlock type breakdown */}
        <div className="bg-navy-light rounded-xl p-5">
          <h3 className="text-white text-sm font-semibold mb-4">Unlocks by type</h3>
          {Object.keys(typeMap).length === 0 ? (
            <p className="text-gray-500 text-xs">No unlocks in this period</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(typeMap)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-gray-300 text-sm w-24 capitalize">{type}</span>
                    <div className="flex-1 bg-navy rounded-full h-2">
                      <div
                        className="bg-gold h-2 rounded-full"
                        style={{ width: `${Math.round((count / (unlocks.count || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-gray-300 text-sm w-10 text-right">{count}</span>
                    <span className="text-gray-500 text-xs w-10 text-right">
                      {Math.round((count / (unlocks.count || 1)) * 100)}%
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Unlock distribution */}
        <div className="bg-navy-light rounded-xl p-5">
          <h3 className="text-white text-sm font-semibold mb-4">Unlocks per user (distribution)</h3>
          <div className="space-y-3">
            {Object.entries(buckets).map(([bucket, count]) => (
              <div key={bucket} className="flex items-center gap-3">
                <span className="text-gray-300 text-sm w-16">{bucket} unlocks</span>
                <div className="flex-1 bg-navy rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${Math.round((count / Math.max(Object.values(unlockCountsByUser).length, 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-gray-300 text-sm w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top unlockers */}
      <div className="bg-navy-light rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-dark">
          <h3 className="text-white text-sm font-semibold">Top unlockers in period</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-dark">
              {["User", "Type", "Unlocks"].map((h) => (
                <th key={h} className="text-left px-4 py-2 text-gray-400 text-xs font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topUserIds.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500 text-xs">No unlocks in this period</td></tr>
            ) : (
              topUserIds.map(([userId, count]) => {
                const p = profileMap.get(userId)
                return (
                  <tr key={userId} className="border-b border-navy-dark/50 hover:bg-navy/30">
                    <td className="px-4 py-2">
                      <Link href={`/admin/users/${userId}`} className="text-blue-400 hover:underline text-xs">
                        {p?.full_name ?? p?.email ?? userId.slice(0, 8) + "…"}
                      </Link>
                      {p?.email && p?.full_name && (
                        <p className="text-gray-500 text-xs">{p.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-400 text-xs capitalize">{p?.user_type ?? "—"}</td>
                    <td className="px-4 py-2 text-gold font-semibold text-sm">{count}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Search analytics */}
      {topSearchTerms.length > 0 && (
        <div className="bg-navy-light rounded-xl p-5">
          <h3 className="text-white text-sm font-semibold mb-4">Top search queries</h3>
          <div className="space-y-2">
            {topSearchTerms.map(([term, count]) => (
              <div key={term} className="flex items-center gap-3">
                <span className="text-gray-300 text-sm flex-1 font-mono truncate">"{term}"</span>
                <div className="w-32 bg-navy rounded-full h-1.5">
                  <div
                    className="bg-purple-400 h-1.5 rounded-full"
                    style={{ width: `${Math.round((count / (topSearchTerms[0]?.[1] ?? 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-gray-400 text-xs w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent unlocks */}
      <div className="bg-navy-light rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-dark">
          <h3 className="text-white text-sm font-semibold">Recent unlocks</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-dark">
              {["User", "Contact ID", "Type", "When"].map((h) => (
                <th key={h} className="text-left px-4 py-2 text-gray-400 text-xs font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(recentUnlocks.data ?? []).map((u) => (
              <tr key={u.id} className="border-b border-navy-dark/50 hover:bg-navy/30">
                <td className="px-4 py-2">
                  <Link href={`/admin/users/${u.user_id}`} className="text-blue-400 hover:underline text-xs font-mono">
                    {u.user_id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-4 py-2 text-gray-400 text-xs font-mono">{u.contact_id.slice(0, 8)}…</td>
                <td className="px-4 py-2 text-gold text-xs capitalize">{u.unlock_type}</td>
                <td className="px-4 py-2 text-gray-400 text-xs">
                  {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
              </tr>
            ))}
            {!(recentUnlocks.data?.length) && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500 text-xs">No unlocks in this period</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default async function AdminEngagementPage({ searchParams }: Props): Promise<JSX.Element> {
  const params  = await searchParams
  const { from, to, preset } = resolveDateRange(params)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/analytics" className="text-gray-400 text-sm hover:text-white">Analytics</Link>
            <span className="text-gray-600">›</span>
            <span className="text-white text-sm">Engagement</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Engagement</h1>
        </div>
        <Suspense>
          <DateRangePicker preset={preset} from={from} to={to} />
        </Suspense>
      </div>

      <Suspense fallback={<div className="animate-pulse h-48 bg-navy-light rounded-xl" />}>
        <EngagementContent from={from} to={to} />
      </Suspense>
    </div>
  )
}
