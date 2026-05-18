import { notFound } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { createMarketingClient } from "@/lib/supabase"
import { getOrgLogoUrl } from "@/lib/orgLogo"
import {
  buildMetadata,
  buildOgImageUrl,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildCanonicalUrl,
  MIN_CONTACTS_TO_INDEX,
  countryFlag,
  toSlug,
} from "@footy/seo"
import { Breadcrumb } from "@/components/seo/Breadcrumb"
import { RelatedPages } from "@/components/seo/RelatedPages"

export const revalidate = 3600

type Params = { slug: string }

// ── Types ─────────────────────────────────────────────────────────────────────

type CountryRow = { country: string; contact_count: number }

type TopOrgRow = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  domain: string | null
  contact_count: number
}

type ContactPreviewRow = {
  id: string
  name: string
  role: string | null
  role_category: string | null
  city: string | null
  verified_status: string | null
  has_email: boolean | null
  has_phone: boolean | null
  has_linkedin: boolean | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolveCountry(slug: string): Promise<string | null> {
  const supabase = createMarketingClient()
  const { data } = await supabase.rpc("get_countries_with_contacts", {
    p_min_count: 1,
  })
  const rows = (data ?? []) as CountryRow[]
  return rows.find((r) => toSlug(r.country) === slug)?.country ?? null
}

const PREVIEW_LIMIT = 20

// ── Static params ─────────────────────────────────────────────────────────────

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return []
  }
  try {
    const supabase = createMarketingClient()
    const { data } = await supabase.rpc("get_countries_with_contacts", {
      p_min_count: MIN_CONTACTS_TO_INDEX,
    })
    return ((data ?? []) as CountryRow[]).map((r) => ({ slug: toSlug(r.country) }))
  } catch {
    return []
  }
}

// ── SEO metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = createMarketingClient()

  const { data } = await supabase.rpc("get_countries_with_contacts", {
    p_min_count: 1,
  })
  const match = ((data ?? []) as CountryRow[]).find((r) => toSlug(r.country) === slug)
  if (!match) return { title: "Football Contacts by Country | Footy Contacts" }

  const { country, contact_count } = match
  const flag = countryFlag(country)

  return buildMetadata({
    title: `Football Contacts in ${country} | Footy Contacts`,
    description: `Browse ${contact_count.toLocaleString()} verified football industry contacts in ${country}. Find scouts, agents, club officials, coaches and more.`,
    canonicalPath: `/countries/${slug}`,
    ogImageUrl: buildOgImageUrl({
      title: `${flag} Football Contacts in ${country}`,
      count: contact_count,
    }),
  })
}

// ── Signal dots (shared component) ───────────────────────────────────────────

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
        <span
          className="w-4 h-4 text-emerald-400/70 flex items-center justify-center"
          title="Has email"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </span>
      )}
      {hasPhone && (
        <span
          className="w-4 h-4 text-sky-400/70 flex items-center justify-center"
          title="Has phone"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </span>
      )}
      {hasLinkedin && (
        <span
          className="w-4 h-4 text-blue-400/70 flex items-center justify-center"
          title="Has LinkedIn"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </span>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function CountryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const supabase = createMarketingClient()

  // Resolve country name from slug
  const countryName = await resolveCountry(slug)
  if (!countryName) notFound()

  const flag = countryFlag(countryName)

  // Fetch in parallel: contact count, preview contacts, top orgs
  const [{ count }, { data: rawContacts }, { data: rawTopOrgs }] = await Promise.all([
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("country", countryName)
      .eq("is_honeypot", false)
      .eq("visibility_status", "published"),
    supabase
      .from("contacts")
      .select("id, name, role, role_category, city, verified_status, has_email, has_phone, has_linkedin")
      .eq("country", countryName)
      .eq("is_honeypot", false)
      .eq("visibility_status", "published")
      .order("data_confidence_score", { ascending: false, nullsFirst: false })
      .limit(PREVIEW_LIMIT),
    supabase.rpc("get_top_orgs_for_country", {
      p_country: countryName,
      p_limit: 12,
    }),
  ])

  const totalContacts = count ?? 0
  const contacts = (rawContacts ?? []) as ContactPreviewRow[]
  const topOrgs = (rawTopOrgs ?? []) as TopOrgRow[]
  const shouldNoIndex = totalContacts < MIN_CONTACTS_TO_INDEX

  // ── JSON-LD ────────────────────────────────────────────────────────────────
  const pageUrl = buildCanonicalUrl(`/countries/${slug}`)
  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", url: "https://footycontacts.com" },
      { name: "Countries", url: buildCanonicalUrl("/countries") },
      { name: `${flag} ${countryName}`, url: pageUrl },
    ]),
    buildCollectionPageSchema({
      name: `Football Contacts in ${countryName}`,
      url: pageUrl,
      description: `${totalContacts.toLocaleString()} verified football industry contacts in ${countryName}.`,
      itemCount: totalContacts,
    }),
  ]

  return (
    <div className="min-h-screen bg-navy-dark text-white">
      {/* JSON-LD */}
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      {shouldNoIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* ── Nav ── */}
      <header className="bg-navy/80 backdrop-blur-sm border-b border-white/[0.06] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-gold font-black text-base">FC</span>
            <span className="hidden sm:inline text-gray-300 font-semibold text-sm">
              Footy Contacts
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="https://app.footycontacts.com/login"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="https://app.footycontacts.com/signup"
              className="text-sm bg-gold text-navy-dark font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors"
            >
              Get access
            </Link>
          </div>
        </div>
      </header>

      {/* ── Breadcrumb ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        <Breadcrumb
          items={[
            { name: "Home", url: "https://footycontacts.com" },
            { name: "Football Contacts", url: buildCanonicalUrl("/football-contacts") },
            { name: `${flag} ${countryName}`, url: buildCanonicalUrl(`/countries/${slug}`) },
          ]}
        />
      </div>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
          {flag} Football Contacts in {countryName}
        </h1>
        <p className="text-gray-400 text-base max-w-2xl">
          Browse{" "}
          <span className="text-white font-semibold">
            {totalContacts.toLocaleString()}
          </span>{" "}
          verified football industry contacts from {countryName} — including scouts,
          agents, club officials, coaches, media and more.
        </p>

        {/* Stats pills */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <span className="flex items-center gap-1.5 text-sm bg-navy px-3 py-1.5 rounded-full border border-white/[0.08]">
            <svg
              className="w-3.5 h-3.5 text-gold"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-gray-300 font-medium">
              {totalContacts.toLocaleString()} contacts
            </span>
          </span>
          {topOrgs.length > 0 && (
            <span className="flex items-center gap-1.5 text-sm bg-navy px-3 py-1.5 rounded-full border border-white/[0.08]">
              <svg
                className="w-3.5 h-3.5 text-gold"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span className="text-gray-300 font-medium">
                {topOrgs.length >= 12 ? "12+" : topOrgs.length} clubs &amp; orgs
              </span>
            </span>
          )}
        </div>
      </section>

      {/* ── Top Organisations ── */}
      {topOrgs.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
          <h2 className="text-lg font-bold text-white mb-4">
            Top Football Clubs &amp; Organisations
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {topOrgs.map((org) => {
              const logoUrl = getOrgLogoUrl({
                logo_url: org.logo_url,
                domain: org.domain,
              })
              const initials = org.name
                .split(/[\s\-&]+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((w: string) => w[0]?.toUpperCase() ?? "")
                .join("")

              return (
                <Link
                  key={org.id}
                  href={`/org/${org.slug}`}
                  className="group flex items-center gap-3 bg-navy rounded-xl p-3 border border-white/[0.06] hover:border-gold/30 hover:bg-navy-light transition-all"
                >
                  {/* Logo / Initials */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-navy-light flex items-center justify-center">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoUrl}
                        alt={`${org.name} logo`}
                        width={40}
                        height={40}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-gold font-bold text-sm">{initials}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-gold transition-colors">
                      {org.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {org.contact_count.toLocaleString()} contacts
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Contact Preview ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
        <h2 className="text-lg font-bold text-white mb-4">
          Football Contacts in {countryName}
          {totalContacts > PREVIEW_LIMIT && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              (showing {Math.min(totalContacts, PREVIEW_LIMIT).toLocaleString()} of{" "}
              {totalContacts.toLocaleString()})
            </span>
          )}
        </h2>

        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <ul>
            {contacts.map((contact, idx) => (
              <li
                key={contact.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx < contacts.length - 1 ? "border-b border-white/[0.04]" : ""
                } ${idx % 2 === 0 ? "bg-navy/40" : "bg-transparent"}`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-navy-light flex-shrink-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-400">
                    {contact.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n: string) => n[0]?.toUpperCase() ?? "")
                      .join("")}
                  </span>
                </div>

                {/* Name + role */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {contact.name}
                    {contact.verified_status === "verified" && (
                      <span className="ml-1.5 text-emerald-400 text-xs">✓</span>
                    )}
                  </p>
                  {contact.role && (
                    <p className="text-xs text-gray-500 truncate">{contact.role}</p>
                  )}
                </div>

                {/* City */}
                {contact.city && (
                  <span className="hidden sm:inline text-xs text-gray-600 flex-shrink-0">
                    {contact.city}
                  </span>
                )}

                {/* Signal dots */}
                <SignalDots
                  hasEmail={!!contact.has_email}
                  hasPhone={!!contact.has_phone}
                  hasLinkedin={!!contact.has_linkedin}
                />

                {/* Locked icon */}
                <svg
                  className="w-4 h-4 text-gray-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA overlay for unlock */}
        {totalContacts > PREVIEW_LIMIT && (
          <div className="mt-4 p-4 rounded-xl bg-navy border border-gold/20 text-center">
            <p className="text-sm text-gray-400 mb-3">
              <span className="text-white font-semibold">
                {(totalContacts - PREVIEW_LIMIT).toLocaleString()} more contacts
              </span>{" "}
              in {countryName} available with full access
            </p>
            <Link
              href="https://app.footycontacts.com/signup"
              className="inline-flex items-center gap-2 bg-gold text-navy-dark font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-yellow-300 transition-colors"
            >
              Unlock all {totalContacts.toLocaleString()} contacts
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        )}
      </section>

      {/* ── Related pages ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <RelatedPages context={{ country: countryName }} />
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Footy Contacts. All rights reserved.
          </p>
          <nav className="flex items-center gap-4 text-xs text-gray-600">
            <Link href="/privacy" className="hover:text-gray-400 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gray-400 transition-colors">
              Terms
            </Link>
            <Link href="/countries" className="hover:text-gray-400 transition-colors">
              All Countries
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
