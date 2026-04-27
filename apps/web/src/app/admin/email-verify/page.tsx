import { createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EmailVerifyClient from "./EmailVerifyClient"

export default async function EmailVerifyPage() {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") redirect("/app")

  const [unverifiedResult, verifiedResult, totalEmailResult, tasksResult] = await Promise.all([
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .neq("verified_status", "verified")
      .not("email", "is", null),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("verified_status", "verified"),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .not("email", "is", null),
    supabase
      .from("email_verification_tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  const stats = {
    unverified: unverifiedResult.count ?? 0,
    verified: verifiedResult.count ?? 0,
    total: totalEmailResult.count ?? 0,
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Email Verification</h1>

      {/* Summary stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-navy-light rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Total with Email</p>
          <p className="text-white text-3xl font-bold">{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-navy-light rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Verified</p>
          <p className="text-green-400 text-3xl font-bold">{stats.verified.toLocaleString()}</p>
        </div>
        <div className="bg-navy-light rounded-xl p-5">
          <p className="text-gray-400 text-sm mb-1">Unverified (needs check)</p>
          <p className="text-yellow-400 text-3xl font-bold">{stats.unverified.toLocaleString()}</p>
        </div>
      </div>

      <EmailVerifyClient
        stats={stats}
        initialTasks={tasksResult.data ?? []}
      />
    </div>
  )
}
