import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function OpportunitiesPage() {
  const supabase = await createClient()

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Opportunities</h1>
        <p className="text-gray-400 text-sm">Trials, jobs and events in football</p>
      </div>

      {opportunities && opportunities.length > 0 ? (
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <Link key={opp.id} href={`/app/opportunities/${opp.id}`} className="block bg-navy-light rounded-xl px-5 py-4 hover:bg-navy-light/80 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-white font-medium">{opp.title}</p>
                  <p className="text-gray-400 text-sm mt-0.5">
                    {[opp.organisation, opp.location].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs bg-navy text-gray-300 px-2 py-1 rounded">
                    {opp.type}
                  </span>
                  {opp.is_premium && (
                    <span className="ml-1 text-xs bg-gold/20 text-gold px-2 py-1 rounded">
                      Premium
                    </span>
                  )}
                </div>
              </div>
              {opp.deadline && (
                <p className="text-gray-500 text-xs mt-2">
                  Deadline: {new Date(opp.deadline).toLocaleDateString("en-GB")}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          No active opportunities at the moment.
        </div>
      )}
    </div>
  )
}
