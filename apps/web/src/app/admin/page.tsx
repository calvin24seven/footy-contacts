import { createAdminClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function AdminDashboard() {
  const supabase = await createAdminClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    publishedResult,
    withEmailResult,
    verifiedResult,
    unverifiedEmailResult,
    usersResult,
    subsResult,
    newSignupsResult,
    newUnlocksResult,
    recentUsersResult,
  ] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("visibility_status", "published"),
    supabase.from("contacts").select("id", { count: "exact", head: true }).not("email", "is", null),
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("verified_status", "verified"),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("verified_status", "unverified")
      .not("email", "is", null),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase.from("contact_unlocks").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    supabase
      .from("profiles")
      .select("id, full_name, first_name, last_name, email, role, user_type, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: "Published Contacts", value: publishedResult.count ?? 0, color: "text-white" },
    { label: "With Email", value: withEmailResult.count ?? 0, color: "text-white" },
    { label: "Verified Emails", value: verifiedResult.count ?? 0, color: "text-green-400" },
    { label: "Unverified Emails", value: unverifiedEmailResult.count ?? 0, color: "text-yellow-400" },
    { label: "Registered Users", value: usersResult.count ?? 0, color: "text-white" },
    { label: "Active Subscriptions", value: subsResult.count ?? 0, color: "text-white" },
    { label: "New Signups (7d)", value: newSignupsResult.count ?? 0, color: "text-blue-400" },
    { label: "Unlocks (7d)", value: newUnlocksResult.count ?? 0, color: "text-purple-400" },
  ]

  const recentUsers = recentUsersResult.data ?? []

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/admin/email-verify" className="btn-secondary text-sm">
            Verify Emails
          </Link>
          <Link href="/admin/contacts/import" className="btn-primary text-sm">
            Import CSV
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-navy-light rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Signups</h2>
          <Link href="/admin/users" className="text-sm text-gold hover:underline">
            View all →
          </Link>
        </div>
        <div className="bg-navy-light rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-dark">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    No users yet
                  </td>
                </tr>
              ) : (
                recentUsers.map((u) => (
                  <tr key={u.id} className="border-b border-navy-dark last:border-0 hover:bg-navy/30">
                    <td className="px-4 py-3 text-white">
                      {(u.full_name ?? [u.first_name, u.last_name].filter(Boolean).join(" ")) || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{u.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-navy-dark px-2 py-1 rounded text-gray-300">
                        {u.user_type ?? u.role ?? "user"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(u.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
