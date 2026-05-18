import Link from "next/link"
import type { Metadata } from "next"
import { createMarketingClient } from "@/lib/supabase"
import {
  buildMetadata,
  buildOgImageUrl,
  buildBreadcrumbSchema,
  buildCanonicalUrl,
  countryFlag,
} from "@footy/seo"

export const revalidate = 3600

const CURRENT_SEASON = "2025-26"

export const metadata: Metadata = buildMetadata({
  title: "Football League Contacts | Footy Contacts",
  description:
    "Browse verified football industry contacts by league. Find Premier League, La Liga, Bundesliga, MLS and more club contacts.",
  canonicalPath: "/football-contacts/league",
  ogImageUrl: buildOgImageUrl({
    title: "Football League Contacts",
    subtitle: "Premier League · La Liga · Bundesliga · MLS",
  }),
})

type LeagueWithCount = {
  id: string
  name: string
  country: string
  level: number | null
  slug: string
  club_count: number
  total_contacts: number
}

export default async function LeagueIndexPage() {
  const supabase = createMarketingClient()

  const { data: leagueData } = await supabase.rpc("get_leagues_with_stats", {
    p_season: CURRENT_SEASON,
  })

  const leagues = ((leagueData ?? []) as LeagueWithCount[]).sort(
    (a, b) => b.total_contacts - a.total_contacts
  )

  // Group by country
  const byCountry = new Map<string, LeagueWithCount[]>()
  for (const league of leagues) {
    const list = byCountry.get(league.country) ?? []
    list.push(league)
    byCountry.set(league.country, list)
  }

  // Sort countries by total contacts descending
  const sortedCountries = [...byCountry.entries()].sort(
    (a, b) =>
      b[1].reduce((s, l) => s + l.total_contacts, 0) -
      a[1].reduce((s, l) => s + l.total_contacts, 0)
  )

  const totalContacts = leagues.reduce((s, l) => s + l.total_contacts, 0)

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "https://footycontacts.com" },
    { name: "Football Leagues", url: buildCanonicalUrl("/football-contacts/league") },
  ])

  return (
    <div className="min-h-screen bg-navy-dark text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

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
      <nav aria-label="Breadcrumb" className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        <ol className="flex items-center gap-1.5 text-xs text-gray-500">
          <li>
            <Link href="/" className="hover:text-gray-300 transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-gray-300">Football Leagues</li>
        </ol>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Football Contacts by League
        </h1>
        <p className="text-gray-400 text-base max-w-2xl">
          Explore{" "}
          <span className="text-white font-semibold">
            {totalContacts.toLocaleString()}
          </span>{" "}
          verified football contacts across{" "}
          <span className="text-white font-semibold">{leagues.length} leagues</span> —
          from the Premier League to MLS and beyond.
        </p>
      </section>

      {/* ── Leagues by Country ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12 space-y-10">
        {sortedCountries.map(([country, countryLeagues]) => {
          const flag = countryFlag(country)
          const countryTotal = countryLeagues.reduce((s, l) => s + l.total_contacts, 0)
          const sortedLeagues = [...countryLeagues].sort(
            (a, b) => (a.level ?? 99) - (b.level ?? 99)
          )

          return (
            <div key={country}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-base font-bold text-white">
                  {flag} {country}
                </h2>
                <span className="text-xs text-gray-600">
                  {countryTotal.toLocaleString()} contacts
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sortedLeagues.map((league) => (
                  <Link
                    key={league.id}
                    href={`/football-contacts/league/${league.slug}`}
                    className="group flex items-center justify-between gap-3 bg-navy rounded-xl px-4 py-3 border border-white/[0.06] hover:border-gold/30 hover:bg-navy-light transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-gold transition-colors truncate">
                        {league.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {league.club_count} clubs · {league.total_contacts.toLocaleString()} contacts
                        {league.level && (
                          <span className="ml-1.5 text-gray-600">· Tier {league.level}</span>
                        )}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-600 group-hover:text-gold flex-shrink-0 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </section>

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
