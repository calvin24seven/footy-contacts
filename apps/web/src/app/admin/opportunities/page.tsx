import { createAdminClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function AdminOpportunitiesPage() {
  const supabase = await createAdminClient()

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)

  const total = opportunities?.length ?? 0
  const active = opportunities?.filter((o) => o.status === "active").length ?? 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Opportunities</h1>
          <p className="text-gray-400 text-sm mt-1">
            {total} total · {active} active
          </p>
        </div>
        <Link href="/admin/opportunities/new" className="btn-primary text-sm">
          + New Opportunity
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-navy-light">
              <th className="pb-3 pr-4 font-medium">Title</th>
              <th className="pb-3 pr-4 font-medium">Type</th>
              <th className="pb-3 pr-4 font-medium">Organisation</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 pr-4 font-medium">Deadline</th>
              <th className="pb-3 pr-4 font-medium">Method</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-light">
            {(opportunities ?? []).map((opp) => (
              <tr key={opp.id} className="text-gray-300">
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/opportunities/${opp.id}`}
                    className="text-white hover:text-gold transition-colors font-medium"
                  >
                    {opp.title}
                  </Link>
                  {opp.is_premium && (
                    <span className="ml-2 text-xs text-gold">Premium</span>
                  )}
                </td>
                <td className="py-3 pr-4 capitalize">{opp.type}</td>
                <td className="py-3 pr-4">{opp.organisation ?? "—"}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      opp.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : opp.status === "draft"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {opp.status}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  {opp.deadline
                    ? new Date(opp.deadline).toLocaleDateString("en-GB")
                    : "—"}
                </td>
                <td className="py-3 pr-4 capitalize">{opp.application_method}</td>
                <td className="py-3">
                  <Link
                    href={`/admin/opportunities/${opp.id}`}
                    className="text-gold hover:underline text-xs"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {total === 0 && (
          <p className="text-center text-gray-500 py-12">
            No opportunities yet.{" "}
            <Link href="/admin/opportunities/new" className="text-gold hover:underline">
              Create one →
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
