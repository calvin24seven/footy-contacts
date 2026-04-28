import { createAdminClient } from "@/lib/supabase/server"
import type { JSX } from "react"

export const revalidate = 300 // cache for 5 minutes

export default async function ContactHealthPage(): Promise<JSX.Element> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any

  const [
    emailStatusBreakdown,
    noEmailCount,
    suppressionCount,
    totalContacts,
    withPhone,
    withLinkedin,
    withOrganisation,
    withCountry,
    withEmail,
    deadWeightCount,
    weeklyGrowth,
    importStats,
  ] = await Promise.all([
    // Email verification status breakdown
    supabase.rpc("health_email_status_breakdown" as never),

    // No email at all
    supabase.from("contacts").select("id", { count: "exact", head: true }).is("email", null),

    // Suppression list size
    supabase.from("email_suppressions").select("id", { count: "exact", head: true }),

    // Totals for % calculations
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase.from("contacts").select("id", { count: "exact", head: true }).not("phone", "is", null),
    supabase.from("contacts").select("id", { count: "exact", head: true }).not("linkedin_url", "is", null),
    supabase.from("contacts").select("id", { count: "exact", head: true }).not("organisation", "is", null),
    supabase.from("contacts").select("id", { count: "exact", head: true }).not("country", "is", null),
    supabase.from("contacts").select("id", { count: "exact", head: true }).not("email", "is", null),

    // Dead weight: no email AND no LinkedIn AND no phone
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .is("email", null)
      .is("linkedin_url", null)
      .is("phone", null),

    // Contacts added in last 7 weeks, one count per week
    supabase.rpc("health_weekly_growth" as never),

    // Import breakdown: last 20 imports
    supabase
      .from("csv_imports")
      .select("id, filename, status, total_rows, successful_rows, updated_rows, failed_rows, suppressed_rows, skipped_rows, created_at")
      .order("created_at", { ascending: false })
      .limit(20) as Promise<{ data: Array<{
        id: string; filename: string; status: string;
        total_rows: number | null; successful_rows: number | null; updated_rows: number | null;
        failed_rows: number | null; suppressed_rows: number | null; skipped_rows: number | null;
        created_at: string;
      }> | null; error: unknown }>,
  ])

  const total = totalContacts.count ?? 1
  const pct = (n: number | null) => Math.round(((n ?? 0) / total) * 100)

  // Email status breakdown — comes from DB rpc as array of {status, count}
  const statusRows = (emailStatusBreakdown.data ?? []) as { status: string; count: number }[]
  const statusMap: Record<string, number> = {}
  for (const r of statusRows) statusMap[r.status] = Number(r.count)

  // Weekly growth — {week_start: string, added: number}[]
  const weekRows = (weeklyGrowth.data ?? []) as { week_start: string; added: number }[]

  const emailStatusConfig = [
    { key: "verified", label: "Verified", color: "text-green-400", bar: "bg-green-500" },
    { key: "catch_all", label: "Catch-all", color: "text-yellow-400", bar: "bg-yellow-500" },
    { key: "unknown", label: "Unknown", color: "text-gray-300", bar: "bg-gray-500" },
    { key: "risky", label: "Risky", color: "text-orange-400", bar: "bg-orange-500" },
    { key: "unverified", label: "Unverified", color: "text-blue-300", bar: "bg-blue-600" },
    { key: "no_email", label: "No email", color: "text-gray-500", bar: "bg-gray-700" },
  ]

  const emailTotals: Record<string, number> = {
    ...statusMap,
    no_email: noEmailCount.count ?? 0,
  }
  const maxEmailCount = Math.max(...Object.values(emailTotals), 1)

  const completenessFields = [
    { label: "Email", count: withEmail.count },
    { label: "Phone", count: withPhone.count },
    { label: "LinkedIn", count: withLinkedin.count },
    { label: "Organisation", count: withOrganisation.count },
    { label: "Country", count: withCountry.count },
  ]

  const maxWeekly = Math.max(...weekRows.map((r) => Number(r.added)), 1)

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Contact Health</h1>
        <span className="text-gray-400 text-sm">{total.toLocaleString()} total contacts</span>
      </div>

      {/* Email status breakdown */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Email status breakdown</h2>
        <div className="bg-navy-light rounded-xl p-5 space-y-3">
          {emailStatusConfig.map(({ key, label, color, bar }) => {
            const n = emailTotals[key] ?? 0
            const barPct = Math.round((n / maxEmailCount) * 100)
            return (
              <div key={key} className="flex items-center gap-3">
                <span className={`text-sm w-24 ${color}`}>{label}</span>
                <div className="flex-1 bg-navy rounded-full h-2">
                  <div className={`${bar} h-2 rounded-full transition-all`} style={{ width: `${barPct}%` }} />
                </div>
                <span className="text-white text-sm font-medium w-16 text-right">{n.toLocaleString()}</span>
                <span className="text-gray-500 text-xs w-10 text-right">{pct(n)}%</span>
              </div>
            )
          })}
          <div className="pt-2 border-t border-navy-dark flex items-center justify-between text-xs text-gray-500">
            <span>Suppressions (blacklisted): {(suppressionCount.count ?? 0).toLocaleString()}</span>
            <span className="text-orange-400">Dead weight (no email, phone, or LinkedIn): {(deadWeightCount.count ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* Data completeness */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Data completeness</h2>
        <div className="bg-navy-light rounded-xl p-5 space-y-3">
          {completenessFields.map(({ label, count }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-gray-300 text-sm w-24">{label}</span>
              <div className="flex-1 bg-navy rounded-full h-2">
                <div
                  className="bg-gold h-2 rounded-full transition-all"
                  style={{ width: `${pct(count)}%` }}
                />
              </div>
              <span className="text-white text-sm font-medium w-16 text-right">{(count ?? 0).toLocaleString()}</span>
              <span className="text-gray-500 text-xs w-10 text-right">{pct(count)}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* Weekly growth */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Contacts added per week</h2>
        <div className="bg-navy-light rounded-xl p-5">
          {weekRows.length === 0 ? (
            <p className="text-gray-500 text-sm">No data</p>
          ) : (
            <div className="flex items-end gap-2 h-28">
              {weekRows.map((r) => {
                const h = Math.max(4, Math.round((Number(r.added) / maxWeekly) * 100))
                return (
                  <div key={r.week_start} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-gray-400 text-xs">{Number(r.added).toLocaleString()}</span>
                    <div
                      className="w-full bg-gold/70 rounded-t"
                      style={{ height: `${h}px` }}
                      title={`${r.week_start}: ${r.added}`}
                    />
                    <span className="text-gray-500 text-xs truncate w-full text-center">
                      {new Date(r.week_start).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Import history */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Import history</h2>
        <div className="bg-navy-light rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-dark">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">File</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Total</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">New</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Updated</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Skipped</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Suppressed</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Failed</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {!importStats.data?.length ? (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-gray-500">No imports yet</td>
                </tr>
              ) : (
                importStats.data.map((imp) => (
                  <tr key={imp.id} className="border-b border-navy-dark last:border-0">
                    <td className="px-4 py-3 text-gray-300 max-w-[180px] truncate" title={imp.filename}>{imp.filename}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        imp.status === "completed" ? "bg-green-900/40 text-green-300"
                          : imp.status === "failed" ? "bg-red-900/40 text-red-300"
                          : "bg-yellow-900/40 text-yellow-300"
                      }`}>
                        {imp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-right">{imp.total_rows ?? "—"}</td>
                    <td className="px-4 py-3 text-green-400 text-right">{imp.successful_rows ?? "—"}</td>
                    <td className="px-4 py-3 text-blue-400 text-right">{imp.updated_rows ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-right">{imp.skipped_rows ?? "—"}</td>
                    <td className="px-4 py-3 text-yellow-400 text-right">{imp.suppressed_rows ?? "—"}</td>
                    <td className="px-4 py-3 text-red-400 text-right">{imp.failed_rows ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(imp.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`/admin/health/imports/${imp.id}`} className="text-gold text-xs hover:underline">
                        Manage
                      </a>
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
