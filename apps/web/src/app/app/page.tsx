import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import SearchFilters from "./SearchFilters"
import ContactRow, { type ContactListRow } from "./ContactRow"

const PAGE_SIZE = 25

// Only the columns ContactRow needs — avoids fetching 870-byte full rows
const CONTACT_COLUMNS = "id, name, role, organisation, category, country, city, verified_status" as const

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
  const page = Math.max(1, parseInt(params.page ?? "1", 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  // Countries for the filter dropdown — uses partial index (contacts_app_country_idx)
  const countriesPromise = supabase
    .from("contacts")
    .select("country")
    .eq("visibility_status", "published")
    .eq("suppression_status", "active")
    .not("country", "is", null)
    .order("country")

  // Always show contacts — browse-all by default, filtered when params set
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

  const [{ data: contacts, count }, { data: countryRows }] = await Promise.all([
    query.order("name").range(offset, offset + PAGE_SIZE - 1),
    countriesPromise,
  ])

  const countries = [...new Set((countryRows ?? []).map((r) => r.country).filter(Boolean))] as string[]
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
      {count !== null && count !== undefined && (
        <p className="text-sm text-gray-400 mb-4">
          {count.toLocaleString()} contact{count !== 1 ? "s" : ""}
          {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
        </p>
      )}

      {/* Results */}
      {hasResults ? (
        <>
          {/* Column headers */}
          <div className="grid grid-cols-[2fr_2fr_2fr_auto] gap-4 px-4 mb-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Job title</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Email</span>
          </div>

          <div className="flex flex-col gap-1 mb-6">
            {(contacts ?? []).map((contact) => (
              <ContactRow key={contact.id} contact={contact as ContactListRow} />
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
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No contacts found</p>
          <p className="text-gray-500 text-sm">Try a different search term or adjust your filters</p>
          <a href="/app" className="mt-4 inline-block text-gold text-sm hover:underline">Clear filters</a>
        </div>
      )}
    </div>
  )
}

