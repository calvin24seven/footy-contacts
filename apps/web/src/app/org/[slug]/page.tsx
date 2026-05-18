import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/admin"
import { getOrgLogoUrl } from "@/lib/orgLogo"

export const revalidate = 3600 // ISR — rebuild org pages every hour

type Params = { slug: string }

// ── SEO metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const admin = createAdminClient()
  const { data: org } = await admin
    .from("organisations")
    .select("name, country, league")
    .eq("slug", slug)
    .maybeSingle()

  if (!org) return { title: "Organisation | Footy Contacts" }

  const title = `${org.name} Staff & Contacts | Footy Contacts`
  const description = `Browse ${org.name} football staff contacts — coaches, club officials, scouts and more. Unlock emails, phone numbers and LinkedIn profiles on Footy Contacts.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url:  `https://footycontacts.com/org/${slug}`,
      type: "website",
    },
    alternates: {
      canonical: `https://footycontacts.com/org/${slug}`,
    },
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PREVIEW_LIMIT = 20

function SignalDots({
  hasEmail,
  hasPhone,
  hasLinkedin,
}: {
  hasEmail: boolean
  hasPhone: boolean
  hasLinkedin: boolean
}) {
  if (!hasEmail && !hasPhone && !hasLinkedin) return null
  return (
    <div className="flex items-center gap-1.5">
      {hasEmail && (
        <span className="w-4 h-4 text-emerald-400/70 flex items-center justify-center" title="Has email">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </span>
      )}
      {hasPhone && (
        <span className="w-4 h-4 text-sky-400/70 flex items-center justify-center" title="Has phone">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </span>
      )}
      {hasLinkedin && (
        <span className="w-4 h-4 text-blue-400/70 flex items-center justify-center" title="Has LinkedIn">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </span>
      )}
    </div>
  )
}

// ── Page component ────────────────────────────────────────────────────────────

export default async function OrgPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const admin = createAdminClient()

  // Fetch org
  const { data: org } = await admin
    .from("organisations")
    .select("id, name, country, league, logo_url, domain")
    .eq("slug", slug)
    .maybeSingle()

  if (!org) notFound()

  const logoUrl = getOrgLogoUrl(org as { logo_url: string | null; domain: string | null })

  const initials = org.name
    .split(/[\s\-&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("")

  // Fetch contacts: count + first 50 for preview
  const [{ count }, { data: contacts }] = await Promise.all([
    admin
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("organisation_id", org.id)
      .eq("visibility_status", "published")
      .eq("suppression_status", "active")
      .eq("is_honeypot", false),
    admin
      .from("contacts")
      .select(
        "id, name, role, role_category, country, city, verified_status, has_email, has_phone, has_linkedin"
      )
      .eq("organisation_id", org.id)
      .eq("visibility_status", "published")
      .eq("suppression_status", "active")
      .eq("is_honeypot", false)
      .order("name")
      .limit(50),
  ])

  const totalContacts = count ?? 0
  const allFetched = contacts ?? []
  const displayContacts = allFetched.slice(0, PREVIEW_LIMIT)
  const blurredContacts = allFetched.slice(PREVIEW_LIMIT)
  const hiddenTotal = Math.max(0, totalContacts - PREVIEW_LIMIT)

  // Stats
  const verifiedCount = allFetched.filter((c) => c.verified_status === "verified").length
  const withEmailCount = allFetched.filter((c) => c.has_email).length
  const categoryMap: Record<string, number> = {}
  allFetched.forEach((c) => {
    const cat = (c.role_category as string | null) ?? "Other"
    categoryMap[cat] = (categoryMap[cat] ?? 0) + 1
  })
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-navy-dark text-white">
      {/* ── Nav ── */}
      <header className="bg-navy/80 backdrop-blur-sm border-b border-white/[0.06] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-gold font-black text-base">FC</span>
            <span className="hidden sm:inline text-gray-300 font-semibold text-sm">Footy Contacts</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-gold text-navy-dark font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors"
            >
              Get access
            </Link>
          </div>
        </div>
      </header>

      {/* ── Org header ── */}
      <div className="border-b border-white/[0.06] bg-navy/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-5">
            {logoUrl ? (
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-gray-700/50 overflow-hidden flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={org.name}
                  className="w-full h-full object-contain p-2"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-navy-light border border-gray-700/50 flex items-center justify-center shrink-0 text-xl font-black text-gold select-none">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{org.name}</h1>
              {(org.country || org.league) && (
                <p className="text-gray-400 mt-1 text-sm flex items-center gap-2 flex-wrap">
                  {org.country && <span>{org.country}</span>}
                  {org.country && org.league && <span className="text-gray-600">·</span>}
                  {org.league && <span>{org.league}</span>}
                </p>
              )}
              <p className="text-gold font-semibold text-sm mt-1.5">
                {totalContacts.toLocaleString()} staff contacts
              </p>
            </div>
          </div>

          {/* Stats chips */}
          {(verifiedCount > 0 || withEmailCount > 0 || topCategories.length > 0) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {verifiedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-900/20 border border-emerald-900/40 text-emerald-400 px-2.5 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {verifiedCount} verified
                </span>
              )}
              {withEmailCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-sky-900/20 border border-sky-900/40 text-sky-400 px-2.5 py-1 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {withEmailCount} with email
                </span>
              )}
              {topCategories.map(([cat, n]) => (
                <span
                  key={cat}
                  className="text-xs bg-navy-light border border-white/[0.06] text-gray-300 px-2.5 py-1 rounded-full"
                >
                  {n} {cat}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Contact list ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24">
        {displayContacts.length === 0 ? (
          <p className="text-gray-500 text-sm py-12 text-center">
            No published contacts found for this organisation.
          </p>
        ) : (
          <>
            {/* Table header — desktop only */}
            <div className="hidden sm:grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_80px] gap-x-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-white/[0.06] mb-1">
              <span>Name</span>
              <span>Role</span>
              <span>Location</span>
              <span className="text-right">Info</span>
            </div>

            {/* Visible rows */}
            {displayContacts.map((c) => {
              const location = [c.city, c.country].filter(Boolean).join(", ")
              return (
                <div
                  key={c.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  {/* Mobile */}
                  <div className="sm:hidden px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-white text-[14px] leading-tight">
                            {c.name}
                          </span>
                          {c.verified_status === "verified" && (
                            <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        {c.role && (
                          <div className="text-[12px] text-gray-400 mt-0.5 truncate">{c.role}</div>
                        )}
                        {location && (
                          <div className="text-[12px] text-gray-500 mt-0.5">{location}</div>
                        )}
                      </div>
                      <div className="shrink-0 mt-0.5">
                        <SignalDots
                          hasEmail={c.has_email ?? false}
                          hasPhone={c.has_phone ?? false}
                          hasLinkedin={c.has_linkedin ?? false}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Desktop */}
                  <div className="hidden sm:grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_80px] gap-x-4 items-center px-4 py-3.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-white text-sm truncate">{c.name}</span>
                      {c.verified_status === "verified" && (
                        <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-400 truncate">{c.role ?? "—"}</span>
                    <span className="text-sm text-gray-500 truncate">{location || "—"}</span>
                    <div className="flex justify-end">
                      <SignalDots
                        hasEmail={c.has_email ?? false}
                        hasPhone={c.has_phone ?? false}
                        hasLinkedin={c.has_linkedin ?? false}
                      />
                    </div>
                  </div>
                </div>
              )
            })}

            {/* ── Upgrade gate ── */}
            {hiddenTotal > 0 && (
              <div className="relative mt-0">
                {/* Blurred preview rows */}
                <div
                  className="overflow-hidden max-h-40 pointer-events-none select-none"
                  aria-hidden="true"
                >
                  {blurredContacts.slice(0, 4).map((c) => {
                    const location = [c.city, c.country].filter(Boolean).join(", ")
                    return (
                      <div
                        key={c.id}
                        className="border-b border-white/[0.04] blur-[4px] opacity-50"
                      >
                        <div className="hidden sm:grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_80px] gap-x-4 items-center px-4 py-3.5">
                          <span className="font-semibold text-white text-sm truncate">{c.name}</span>
                          <span className="text-sm text-gray-400 truncate">{c.role ?? "—"}</span>
                          <span className="text-sm text-gray-500 truncate">{location || "—"}</span>
                          <div className="flex justify-end">
                            <SignalDots
                              hasEmail={c.has_email ?? false}
                              hasPhone={c.has_phone ?? false}
                              hasLinkedin={c.has_linkedin ?? false}
                            />
                          </div>
                        </div>
                        <div className="sm:hidden px-4 py-3.5">
                          <span className="font-semibold text-white text-[14px]">{c.name}</span>
                          {c.role && <div className="text-[12px] text-gray-400 mt-0.5">{c.role}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Gradient overlay + CTA */}
                <div className="relative -mt-28 pt-28 bg-gradient-to-b from-transparent to-navy-dark">
                  <div className="py-8 text-center px-4">
                    <p className="text-white font-bold text-lg mb-1">
                      {hiddenTotal.toLocaleString()} more contacts
                    </p>
                    <p className="text-gray-400 text-sm mb-5 max-w-sm mx-auto">
                      Unlock all {totalContacts.toLocaleString()} {org.name} contacts — including
                      verified emails, phone numbers and LinkedIn profiles
                    </p>
                    <Link
                      href="/signup"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold text-navy-dark font-bold text-sm rounded-lg hover:bg-yellow-300 transition-colors"
                    >
                      Get full access →
                    </Link>
                    <p className="text-gray-600 text-xs mt-2.5">
                      Free plan · 3 unlocks included · Pro from £39/mo
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom CTA when all contacts are visible */}
            {hiddenTotal === 0 && (
              <div className="mt-8 py-8 border-t border-white/[0.06] text-center">
                <p className="text-gray-400 text-sm mb-4 max-w-sm mx-auto">
                  Sign up to unlock emails, phone numbers and LinkedIn profiles for these contacts
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-navy-dark font-bold text-sm rounded-lg hover:bg-yellow-300 transition-colors"
                >
                  Get access — free plan available →
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] bg-navy/30 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
          <span>© 2026 Footy Contacts</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy</Link>
            <Link href="/app" className="hover:text-gray-400 transition-colors">Search all contacts</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
