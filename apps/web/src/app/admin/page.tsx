import { createClient } from "@/lib/supabase/server"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [contactsResult, usersResult, subsResult] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact", head: true }).eq("visibility_status", "published"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
  ])

  const stats = [
    { label: "Published Contacts", value: contactsResult.count ?? 0 },
    { label: "Registered Users", value: usersResult.count ?? 0 },
    { label: "Active Subscriptions", value: subsResult.count ?? 0 },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-navy-light rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
            <p className="text-white text-3xl font-bold">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
