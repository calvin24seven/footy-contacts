import { createAdminClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import OpportunityForm from "../OpportunityForm"

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createAdminClient()

  const [oppResult, responsesResult] = await Promise.all([
    supabase.from("opportunities").select("*").eq("id", id).single(),
    supabase
      .from("opportunity_responses")
      .select("*")
      .eq("opportunity_id", id)
      .order("submitted_at", { ascending: false }),
  ])

  if (!oppResult.data) notFound()

  const opp = oppResult.data
  const responses = responsesResult.data ?? []

  return (
    <div className="p-6 space-y-8">
      <div>
        <Link
          href="/admin/opportunities"
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Opportunities
        </Link>
        <h1 className="text-2xl font-bold text-white mt-3">{opp.title}</h1>
      </div>

      <OpportunityForm opportunity={opp} />

      {/* Responses */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Applications ({responses.length})
        </h2>

        {responses.length > 0 ? (
          <div className="space-y-3">
            {responses.map((r) => (
              <div key={r.id} className="bg-navy-light rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-white font-medium">{r.name}</p>
                    <p className="text-gray-400 text-sm">
                      {r.level} · {r.location}
                      {r.age ? ` · Age ${r.age}` : ""}
                      {r.position ? ` · ${r.position}` : ""}
                    </p>
                    {r.current_club && (
                      <p className="text-gray-500 text-xs mt-0.5">
                        Club: {r.current_club}
                      </p>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs shrink-0">
                    {new Date(r.submitted_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <p className="text-gray-300 text-sm whitespace-pre-wrap">{r.message}</p>
                {r.highlight_video_url && (
                  <a
                    href={r.highlight_video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-gold text-xs hover:underline"
                  >
                    Highlight Video →
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No applications yet.</p>
        )}
      </div>
    </div>
  )
}
