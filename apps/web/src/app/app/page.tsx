import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import SearchFilters from "./SearchFilters"

const PAGE_SIZE = 25

// Only the columns ContactCard needs — avoids fetching 870-byte rows
const CONTACT_COLUMNS = "id, name, role, organisation, category, country, city, verified_status" as const

type ContactListRow = {
  id: string
  name: string
  role: string | null
  organisation: string | null
  category: string | null
  country: string | null
  city: string | null
  verified_status: string | null
}

// Escape ILIKE special characters to prevent SQL injection via pattern matching
function escapeLike(s: string) {
  return s.replace(/[%_\\]/g, "\\$&")
}

interface SearchParams {
  q?: string
  role?: string
  org?: string
  country?: string
  email_status?: string
  category?: string
  page?: string
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const hasQuery = !!(params.q || params.role || params.org || params.country || params.email_status || params.category)
  const page = Math.max(1, parseInt(params.page ?? "1", 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  // Countries for the filter dropdown — always needed, uses partial index (contacts_app_country_idx)
  const countriesPromise = supabase
    .from("contacts")
    .select("country")
    .eq("visibility_status", "published")
    .eq("suppression_status", "active")
    .not("country", "is", null)
    .order("country")

  // Only run the contacts query when the user has actually searched/filtered.
  // The initial page state shows a "search prompt" — no need to hit the DB.
  let contacts: ContactListRow[] | null = null
  let count: number | null = null

  if (hasQuery) {
    let query = supabase
      .from("contacts")
      .select(CONTACT_COLUMNS, { count: "exact" })
      .eq("visibility_status", "published")
      .eq("suppression_status", "active")

    if (params.q?.trim()) {
      const q = escapeLike(params.q.trim())
      query = query.or(`name.ilike.%${q}%,role.ilike.%${q}%,organisation.ilike.%${q}%`)
    }
    if (params.role?.trim()) {
      query = query.ilike("role", `%${escapeLike(params.role.trim())}%`)
    }
    if (params.org?.trim()) {
      query = query.ilike("organisation", `%${escapeLike(params.org.trim())}%`)
    }
    if (params.country?.trim()) {
      query = query.eq("country", params.country.trim())
    }
    if (params.email_status) {
      if (params.email_status === "has_email") {
        query = query.not("email", "is", null) as typeof query
      } else if (params.email_status === "no_email") {
        query = query.is("email", null) as typeof query
      } else {
        query = query.eq("verified_status", params.email_status)
      }
    }
    if (params.category?.trim()) {
      query = query.eq("category", params.category.trim())
    }

    const result = await Promise.all([
      query.order("name").range(offset, offset + PAGE_SIZE - 1),
      countriesPromise,
    ])
    contacts = result[0].data as ContactListRow[] | null
    count = result[0].count
    const { data: countryRows } = result[1]
    var countries = [...new Set((countryRows ?? []).map((r) => r.country).filter(Boolean))] as string[]
  } else {
    const { data: countryRows } = await countriesPromise
    var countries = [...new Set((countryRows ?? []).map((r) => r.country).filter(Boolean))] as string[]
  }

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0
  const hasResults = contacts && contacts.length > 0

  function pageUrl(p: number) {
    const qs = new URLSearchParams()
    if (params.q) qs.set("q", params.q)
    if (params.role) qs.set("role", params.role)
    if (params.org) qs.set("org", params.org)
    if (params.country) qs.set("country", params.country)
    if (params.email_status) qs.set("email_status", params.email_status)
    if (params.category) qs.set("category", params.category)
    qs.set("page", String(p))
    return `/app?${qs.toString()}`
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Find Contacts</h1>
        <p className="text-gray-400 text-sm">
          Search thousands of football industry professionals
        </p>
      </div>

      {/* Search bar */}
      <form className="flex gap-3 mb-4" method="GET" action="/app">
        {/* Preserve active filters when submitting a new text search */}
        {params.role && <input type="hidden" name="role" value={params.role} />}
        {params.org && <input type="hidden" name="org" value={params.org} />}
        {params.country && <input type="hidden" name="country" value={params.country} />}
        {params.email_status && <input type="hidden" name="email_status" value={params.email_status} />}
        {params.category && <input type="hidden" name="category" value={params.category} />}
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search by name, role, or organisation…"
          className="flex-1 px-4 py-3 bg-navy-light text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors whitespace-nowrap"
        >
          Search
        </button>
      </form>

      {/* Filter panel (client component) */}
      <SearchFilters countries={countries} />

      {/* Result count */}
      {hasQuery && count !== null && count !== undefined && (
        <p className="text-sm text-gray-400 mb-4">
          {count.toLocaleString()} contact{count !== 1 ? "s" : ""} found
          {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
        </p>
      )}

      {/* Results */}
      {hasResults ? (
        <>
          <div className="grid gap-3 mb-6">
            {(contacts ?? []).map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={pageUrl(page - 1)}
                  className="px-4 py-2 bg-navy-light text-gray-300 rounded-lg text-sm hover:bg-navy transition-colors"
                >
                  ← Previous
                </Link>
              )}
              <span className="text-sm text-gray-400 px-2">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={pageUrl(page + 1)}
                  className="px-4 py-2 bg-navy-light text-gray-300 rounded-lg text-sm hover:bg-navy transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      ) : hasQuery ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No contacts found</p>
          <p className="text-gray-500 text-sm">Try a different search term or adjust your filters</p>
          <a href="/app" className="mt-4 inline-block text-gold text-sm hover:underline">
            Clear search
          </a>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-4">⚽</div>
          <p className="text-lg mb-2 text-gray-400">Find football professionals</p>
          <p className="text-sm">Search by name, role, or organisation above, or use filters to browse by country or category</p>
        </div>
      )}
    </div>
  )
}

function ContactCard({ contact }: { contact: ContactListRow }) {
  const location = [contact.city, contact.country].filter(Boolean).join(", ")

  return (
    <Link
      href={`/app/contacts/${contact.id}`}
      className="flex items-center justify-between bg-navy-light rounded-xl px-5 py-4 hover:bg-[#354460] transition-colors group"
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm shrink-0">
          {contact.name[0]?.toUpperCase()}
        </div>

        <div className="min-w-0">
          {/* Name + verified */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-medium">{contact.name}</span>
            {contact.verified_status === "verified" && (
              <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded shrink-0">
                ✓ Verified
              </span>
            )}
            {contact.verified_status === "catch_all" && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded shrink-0">
                ~ Catch-all
              </span>
            )}
            {contact.verified_status === "unknown" && (
              <span className="text-xs bg-gray-500/20 text-gray-400 px-1.5 py-0.5 rounded shrink-0">
                ? Unknown
              </span>
            )}
            {contact.verified_status === "risky" && (
              <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded shrink-0">
                ⚠ Risky
              </span>
            )}
          </div>
          {/* Role · Organisation */}
          <p className="text-sm text-gray-400 truncate">
            {[contact.role, contact.organisation].filter(Boolean).join(" · ")}
          </p>
          {/* Location */}
          {location && (
            <p className="text-xs text-gray-500 mt-0.5">{location}</p>
          )}
        </div>
      </div>

      {/* Right side: category + arrow */}
      <div className="flex items-center gap-3 shrink-0 ml-4">
        {contact.category && (
          <span className="hidden sm:block text-xs bg-navy text-gray-400 px-2 py-1 rounded-full border border-gray-600">
            {contact.category}
          </span>
        )}
        <svg
          className="w-4 h-4 text-gray-600 group-hover:text-gold transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

