import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import ResponseForm from "./ResponseForm"

export default async function OpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: opp } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .single()

  if (!opp) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let hasResponded = false
  let profile: {
    full_name: string | null
    football_level: string | null
    position: string | null
    city: string | null
    country: string | null
    current_club: string | null
  } | null = null

  if (user) {
    const [responseResult, profileResult] = await Promise.all([
      supabase
        .from("opportunity_responses")
        .select("id")
        .eq("opportunity_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("full_name, football_level, position, city, country, current_club")
        .eq("id", user.id)
        .single(),
    ])
    hasResponded = !!responseResult.data
    profile = profileResult.data ?? null
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href="/app/opportunities"
        className="text-gray-400 hover:text-white text-sm transition-colors block mb-6"
      >
        ← Opportunities
      </Link>

      {/* Main card */}
      <div className="bg-navy-light rounded-xl p-6 mb-6">
        {/* Badges + title */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-navy text-gray-300 px-2 py-1 rounded capitalize">
            {opp.type}
          </span>
          {opp.is_premium && (
            <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded">Premium</span>
          )}
        </div>
        <h1 className="text-white text-2xl font-bold mb-1">{opp.title}</h1>
        {opp.organisation && (
          <p className="text-gold font-medium mb-4">{opp.organisation}</p>
        )}

        {/* Key info grid */}
        {[
          { label: "Location", value: opp.location },
          {
            label: "Deadline",
            value: opp.deadline
              ? new Date(opp.deadline).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : null,
          },
          {
            label: "Event Date",
            value: opp.event_date
              ? new Date(opp.event_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : null,
          },
          { label: "Level", value: opp.skill_level },
          { label: "Age Group", value: opp.age_group },
          { label: "Eligibility", value: opp.gender_eligibility },
        ]
          .filter((item) => item.value)
          .length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: "Location", value: opp.location },
              {
                label: "Deadline",
                value: opp.deadline
                  ? new Date(opp.deadline).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : null,
              },
              {
                label: "Event Date",
                value: opp.event_date
                  ? new Date(opp.event_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : null,
              },
              { label: "Level", value: opp.skill_level },
              { label: "Age Group", value: opp.age_group },
              { label: "Eligibility", value: opp.gender_eligibility },
            ]
              .filter((item): item is { label: string; value: string } => !!item.value)
              .map((item) => (
                <InfoItem key={item.label} label={item.label} value={item.value} />
              ))}
          </div>
        )}

        {/* Description */}
        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{opp.description}</p>

        {/* Requirements */}
        {opp.requirements && (
          <div className="mt-5 p-4 bg-navy rounded-lg">
            <p className="text-sm font-medium text-white mb-1">Requirements</p>
            <p className="text-gray-400 text-sm whitespace-pre-wrap">{opp.requirements}</p>
          </div>
        )}
      </div>

      {/* Application section */}
      {opp.application_method === "external" && opp.external_url ? (
        <a
          href={opp.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-3 px-5 bg-gold text-navy font-semibold rounded-xl hover:bg-yellow-400 transition-colors"
        >
          Apply Now →
        </a>
      ) : opp.application_method === "internal" ? (
        user ? (
          hasResponded ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center">
              <p className="text-green-400 font-semibold text-lg">Application submitted ✓</p>
              <p className="text-gray-400 text-sm mt-1">
                You&apos;ve already applied for this opportunity.
              </p>
            </div>
          ) : (
            <ResponseForm opportunityId={id} defaultValues={profile} />
          )
        ) : (
          <div className="bg-navy-light rounded-xl p-6 text-center">
            <p className="text-gray-300 mb-3">Sign in to apply for this opportunity</p>
            <Link
              href="/login"
              className="inline-block px-5 py-2 bg-gold text-navy font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Sign in
            </Link>
          </div>
        )
      ) : opp.application_method === "contact" &&
        (opp.contact_email || opp.contact_phone) ? (
        <div className="bg-navy-light rounded-xl p-5">
          <p className="text-sm font-medium text-white mb-3">Contact to Apply</p>
          {opp.contact_email && (
            <p className="text-gray-300 text-sm">
              Email:{" "}
              <a
                href={`mailto:${opp.contact_email}`}
                className="text-gold hover:underline"
              >
                {opp.contact_email}
              </a>
            </p>
          )}
          {opp.contact_phone && (
            <p className="text-gray-300 text-sm mt-1">Phone: {opp.contact_phone}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-navy rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-white text-sm font-medium">{value}</p>
    </div>
  )
}
