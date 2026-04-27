import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import type { Tables } from "@/database.types"

const PAGE_SIZE = 25

interface SearchParams {
  q?: string
  category?: string
  country?: string
  level?: string
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

  let query = supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .eq("visibility_status", "published")
    .eq("suppression_status", "active")

  if (params.q) {
    query = query.textSearch("search_vector", params.q, { type: "websearch" })
  }
  if (params.category) query = query.eq("category", params.category)
  if (params.country) query = query.eq("country", params.country)
  if (params.level) query = query.eq("level", params.level)

  const { data: contacts, count } = await query
    .order("name")
    .range(offset, offset + PAGE_SIZE - 1)

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0
  const hasResults = contacts && contacts.length > 0
  const hasQuery = !!(params.q || params.category || params.country || params.level)

  function pageUrl(p: number) {
    const qs = new URLSearchParams()
    if (params.q) qs.set("q", params.q)
    if (params.category) qs.set("category", params.category)
    if (params.country) qs.set("country", params.country)
    if (params.level) qs.set("level", params.level)
    qs.set("page", String(p))
    return `/app?${qs.toString()}`
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Search Contacts</h1>
        <p className="text-gray-400 text-sm">
          Search thousands of football industry professionals
        </p>
      </div>

      {/* Search form */}
      <form className="flex gap-3 mb-4">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search by name, role, organisation…"
          className="flex-1 px-4 py-3 bg-navy-light text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors"
        >
          Search
        </button>
      </form>

      {/* Filter row */}
      <form className="flex flex-wrap gap-3 mb-6">
        {params.q && <input type="hidden" name="q" value={params.q} />}
        <select
          name="category"
          defaultValue={params.category ?? ""}
          className="px-3 py-2 bg-navy-light text-gray-300 rounded-lg border border-gray-600 text-sm focus:outline-none focus:border-gold"
        >
          <option value="">All categories</option>
          <option value="Agent">Agent</option>
          <option value="Scout">Scout</option>
          <option value="Coach">Coach</option>
          <option value="Club">Club</option>
          <option value="Media">Media</option>
        </select>
        <select
          name="level"
          defaultValue={params.level ?? ""}
          className="px-3 py-2 bg-navy-light text-gray-300 rounded-lg border border-gray-600 text-sm focus:outline-none focus:border-gold"
        >
          <option value="">All levels</option>
          <option value="International">International</option>
          <option value="Professional">Professional</option>
          <option value="Semi-professional">Semi-professional</option>
          <option value="Amateur">Amateur</option>
        </select>
        {(params.category || params.level) && (
          <a href="/app" className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            Clear filters
          </a>
        )}
        <button type="submit" className="hidden" />
      </form>

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
            {contacts.map((contact) => (
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
          <p className="text-gray-500 text-sm">
            Try a different search term or adjust your filters
          </p>
          <a href="/app" className="mt-4 inline-block text-gold text-sm hover:underline">
            Clear search
          </a>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">Search for contacts</p>
          <p className="text-sm">Type a name, organisation, or role above to get started</p>
        </div>
      )}
    </div>
  )
}

function ContactCard({ contact }: { contact: Tables<"contacts"> }) {
  return (
    <Link
      href={`/app/contacts/${contact.id}`}
      className="flex items-center justify-between bg-navy-light rounded-xl px-5 py-4 hover:bg-[#354460] transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm shrink-0">
          {contact.name[0]?.toUpperCase()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{contact.name}</span>
            {contact.verified_status === "verified" && (
              <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {[contact.role, contact.organisation].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <div className="text-right text-sm text-gray-500 shrink-0">
        <div>{contact.category}</div>
        <div>{[contact.city, contact.country].filter(Boolean).join(", ")}</div>
      </div>
    </Link>
  )
}
