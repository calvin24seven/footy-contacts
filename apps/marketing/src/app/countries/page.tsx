import Link from "next/link"
import type { Metadata } from "next"
import { createMarketingClient } from "@/lib/supabase"
import {
  buildMetadata,
  buildOgImageUrl,
  buildBreadcrumbSchema,
  buildCanonicalUrl,
  MIN_CONTACTS_TO_INDEX,
  countryFlag,
  toSlug,
} from "@footy/seo"

export const revalidate = 3600

export const metadata: Metadata = buildMetadata({
  title: "Football Contacts by Country | Footy Contacts",
  description:
    "Browse verified football industry contacts by country. Find scouts, agents, club officials, coaches and more from 40+ football nations.",
  canonicalPath: "/countries",
  ogImageUrl: buildOgImageUrl({
    title: "Football Contacts by Country",
    subtitle: "40+ nations · 55,000+ contacts",
  }),
})

type CountryRow = { country: string; contact_count: number }

export default async function CountriesIndexPage() {
  const supabase = createMarketingClient()
  const { data } = await supabase.rpc("get_countries_with_contacts", {
    p_min_count: MIN_CONTACTS_TO_INDEX,
  })

  const countries = ((data ?? []) as CountryRow[]).sort((a, b) =>
    b.contact_count - a.contact_count,
  )

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "https://footycontacts.com" },
    { name: "Countries", url: buildCanonicalUrl("/countries") },
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
          <li className="text-gray-300">Countries</li>
        </ol>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Football Contacts by Country
        </h1>
        <p className="text-gray-400 text-base max-w-2xl">
          Explore{" "}
          <span className="text-white font-semibold">
            {countries.reduce((s, c) => s + c.contact_count, 0).toLocaleString()}
          </span>{" "}
          verified football contacts across{" "}
          <span className="text-white font-semibold">{countries.length} countries</span>. Select a
          country to browse clubs, staff and industry professionals.
        </p>
      </section>

      {/* ── Country Grid ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {countries.map((row) => {
            const flag = countryFlag(row.country)
            const slug = toSlug(row.country)
            return (
              <Link
                key={row.country}
                href={`/countries/${slug}`}
                className="group flex items-center justify-between bg-navy rounded-xl px-4 py-3.5 border border-white/[0.06] hover:border-gold/30 hover:bg-navy-light transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl leading-none" aria-hidden>
                    {flag}
                  </span>
                  <span className="text-sm font-semibold text-white group-hover:text-gold transition-colors">
                    {row.country}
                  </span>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {row.contact_count.toLocaleString()}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06]">
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
          </nav>
        </div>
      </footer>
    </div>
  )
}
