import { createAdminClient } from "@/lib/supabase/server"
import type { JSX } from "react"

export default async function AdminReportsPage(): Promise<JSX.Element> {
  const supabase = await createAdminClient()

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    totalContacts,
    publishedContacts,
    draftContacts,
    archivedContacts,
    verifiedContacts,
    withEmailContacts,
    totalUsers,
    newUsers7d,
    newUsers30d,
    activeSubs,
    totalExports,
    exports30d,
    csvImports,
    categoryBreakdown,
    countryBreakdown,
  ] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("visibility_status", "published"),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("visibility_status", "draft"),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("visibility_status", "archived"),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("verified_status", "verified"),
    supabase.from("contacts").select("id", { count: "exact", head: true }).not("email", "is", null),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("exports").select("id", { count: "exact", head: true }),
    supabase.from("exports").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    supabase.from("csv_imports").select("id, filename, status, total_rows, successful_rows, failed_rows, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("contacts").select("category").eq("visibility_status", "published").not("category", "is", null),
    supabase.from("contacts").select("country").eq("visibility_status", "published").not("country", "is", null).limit(5000),
  ])

  // Group categories
  const catCounts: Record<string, number> = {}
  for (const row of (categoryBreakdown.data ?? [])) {
    if (row.category) catCounts[row.category] = (catCounts[row.category] ?? 0) + 1
  }
  const catEntries = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Group countries
  const countryCounts: Record<string, number> = {}
  for (const row of (countryBreakdown.data ?? [])) {
    if (row.country) countryCounts[row.country] = (countryCounts[row.country] ?? 0) + 1
  }
  const countryEntries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)

  const total = totalContacts.count ?? 1

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-white">Reports</h1>

      {/* Contact database */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Contact database</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total contacts", value: totalContacts.count ?? 0, color: "text-white" },
            { label: "Published", value: publishedContacts.count ?? 0, color: "text-green-400" },
            { label: "Draft", value: draftContacts.count ?? 0, color: "text-yellow-400" },
            { label: "Archived", value: archivedContacts.count ?? 0, color: "text-gray-400" },
            { label: "With email", value: withEmailContacts.count ?? 0, color: "text-white" },
            { label: "Verified email", value: verifiedContacts.count ?? 0, color: "text-blue-400" },
            { label: "Email coverage", value: `${Math.round(((withEmailContacts.count ?? 0) / total) * 100)}%`, color: "text-white" },
            { label: "Verified rate", value: `${Math.round(((verifiedContacts.count ?? 0) / Math.max(withEmailContacts.count ?? 1, 1)) * 100)}%`, color: "text-blue-400" },
          ].map((s) => (
            <div key={s.label} className="bg-navy-light rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{typeof s.value === "number" ? s.value.toLocaleString() : s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* By category */}
          <div className="bg-navy-light rounded-xl p-5">
            <h3 className="text-white text-sm font-semibold mb-4">By category</h3>
            <div className="space-y-2">
              {catEntries.map(([cat, n]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-gray-300 text-sm w-28 capitalize">{cat}</span>
                  <div className="flex-1 bg-navy rounded-full h-2">
                    <div
                      className="bg-gold h-2 rounded-full"
                      style={{ width: `${Math.round((n / (publishedContacts.count ?? 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-xs w-12 text-right">{n.toLocaleString()}</span>
                </div>
              ))}
              {catEntries.length === 0 && <p className="text-gray-500 text-sm">No data</p>}
            </div>
          </div>

          {/* By country */}
          <div className="bg-navy-light rounded-xl p-5">
            <h3 className="text-white text-sm font-semibold mb-4">Top countries</h3>
            <div className="space-y-2">
              {countryEntries.map(([country, n]) => (
                <div key={country} className="flex items-center gap-3">
                  <span className="text-gray-300 text-sm w-32 truncate">{country}</span>
                  <div className="flex-1 bg-navy rounded-full h-2">
                    <div
                      className="bg-gold h-2 rounded-full"
                      style={{ width: `${Math.round((n / (countryEntries[0]?.[1] ?? 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-xs w-12 text-right">{n.toLocaleString()}</span>
                </div>
              ))}
              {countryEntries.length === 0 && <p className="text-gray-500 text-sm">No data</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Users & subscriptions */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Users & subscriptions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total users", value: totalUsers.count ?? 0, color: "text-white" },
            { label: "New signups (7d)", value: newUsers7d.count ?? 0, color: "text-blue-400" },
            { label: "New signups (30d)", value: newUsers30d.count ?? 0, color: "text-blue-400" },
            { label: "Active subscriptions", value: activeSubs.count ?? 0, color: "text-green-400" },
          ].map((s) => (
            <div key={s.label} className="bg-navy-light rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Exports */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Exports</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Total exports", value: totalExports.count ?? 0, color: "text-white" },
            { label: "Exports (30d)", value: exports30d.count ?? 0, color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="bg-navy-light rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CSV import history */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Recent CSV imports</h2>
        <div className="bg-navy-light rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-dark">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">File</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Total</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">OK</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Failed</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {!csvImports.data?.length ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No imports yet</td></tr>
              ) : (
                csvImports.data.map((imp) => (
                  <tr key={imp.id} className="border-b border-navy-dark last:border-0">
                    <td className="px-4 py-3 text-gray-300 max-w-[200px] truncate">{imp.filename}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${imp.status === "completed" ? "bg-green-900/40 text-green-300" : imp.status === "failed" ? "bg-red-900/40 text-red-300" : "bg-yellow-900/40 text-yellow-300"}`}>
                        {imp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-right">{imp.total_rows ?? "—"}</td>
                    <td className="px-4 py-3 text-green-400 text-right">{imp.successful_rows ?? "—"}</td>
                    <td className="px-4 py-3 text-red-400 text-right">{imp.failed_rows ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(imp.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
