import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import SearchFilters from "./SearchFilters"
import SearchBar from "./SearchBar"
import ContactsList from "./ContactsList"
import WelcomeBanner from "./WelcomeBanner"
import { type ContactListRow } from "./ContactRow"

const PAGE_SIZE = 25

const CONTACT_COLUMNS =
  "id, name, role, organisation, category, country, city, verified_status, has_email, has_phone, has_linkedin, role_category" as const

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
  has_phone?: string
  sort?: string
  page?: string
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = Math.min(500, Math.max(1, parseInt(params.page ?? "1", 10)))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: activeSub } = user
    ? await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle()
    : { data: null }
  const isFree = !activeSub

  const countriesPromise = supabase
    .from("contacts")
    .select("country")
    .eq("visibility_status", "published")
    .eq("suppression_status", "active")
    .not("country", "is", null)
    .order("country")

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
      query = query.eq("has_email", true) as typeof query
    } else if (params.email_status === "no_email") {
      query = query.eq("has_email", false) as typeof query
    } else {
      query = query.eq("verified_status", params.email_status)
    }
  }
  if (params.category?.trim()) {
    query = query.eq("category", params.category.trim())
  }
  if (params.has_phone === "1") {
    query = query.eq("has_phone", true) as typeof query
  }

  // Sort
  const sort = params.sort ?? "name_asc"
  if (sort === "recently_added") {
    query = query.order("created_at", { ascending: false })
  } else if (sort === "recently_verified") {
    query = query.order("last_verified_at", { ascending: false, nullsFirst: false })
  } else {
    query = query.order("name")
  }

  const [{ data: contacts, count }, { data: countryRows }] = await Promise.all([
    query.range(offset, offset + PAGE_SIZE - 1),
    countriesPromise,
  ])

  const countries = [
    ...new Set((countryRows ?? []).map((r) => r.country).filter(Boolean)),
  ] as string[]
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
    if (params.has_phone) qs.set("has_phone", params.has_phone)
    if (params.sort) qs.set("sort", params.sort)
    qs.set("page", String(p))
    return `/app?${qs.toString()}`
  }

  const sortLabel: Record<string, string> = {
    name_asc: "Name A–Z",
    recently_added: "Recently added",
    recently_verified: "Recently verified",
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Welcome banner (free users only, client-side dismissible) ─────── */}
      {isFree && <WelcomeBanner />}

      {/* ── Sticky search zone ─────────────────────────────────────────────── */}
      <div className="sticky top-14 z-20 bg-navy-dark/95 backdrop-blur-sm border-b border-navy-light/40 px-4 sm:px-6 pt-4 pb-3">
        {/* Live search bar */}
        <SearchBar initialQ={params.q} />

        {/* Filters + sort */}
        <SearchFilters countries={countries} currentSort={sort} />
      </div>

      {/* ── Results area ───────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-4">
        {/* Result meta bar */}
        {count !== null && count !== undefined && hasResults && (
          <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
            <span>
              {count.toLocaleString()} found · {offset + 1}–{Math.min(offset + PAGE_SIZE, count)}
            </span>
            <span className="hidden sm:inline">Sorted by {sortLabel[sort] ?? sort}</span>
          </div>
        )}

        {hasResults ? (
          <>
            <div className="mb-5">
              <ContactsList contacts={(contacts ?? []) as ContactListRow[]} />
            </div>

            {/* Free upgrade prompt — shown when results are capped */}
            {isFree && count !== null && count > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-4 px-4 py-3.5 bg-gold/[0.06] border border-gold/20 rounded-xl mb-4 text-sm">
                <p className="text-gray-300">
                  Showing <span className="font-semibold text-white">{PAGE_SIZE}</span> of{" "}
                  <span className="font-semibold text-white">{count.toLocaleString()}</span>{" "}
                  contacts.{" "}
                  <span className="text-gray-400">Upgrade to Pro for full access.</span>
                </p>
                <Link
                  href="/app/billing"
                  className="shrink-0 px-3.5 py-2 bg-gold text-[#080c17] rounded-lg font-bold text-xs hover:bg-yellow-400 transition-colors"
                >
                  Upgrade
                </Link>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pb-4">
                {page > 1 && (
                  <Link
                    href={pageUrl(page - 1)}
                    className="px-4 py-2 bg-navy-light text-gray-300 rounded-lg text-sm hover:bg-navy transition-colors"
                  >
                    ← Previous
                  </Link>
                )}
                <span className="text-sm text-gray-500">
                  {page} / {totalPages}
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
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-navy-light flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-white font-semibold mb-1">No contacts found</p>
            {params.q ? (
              <>
                <p className="text-gray-400 text-sm mb-4">
                  No results for &ldquo;{params.q}&rdquo;
                </p>
                <div className="text-xs text-gray-500 space-y-1 mb-6">
                  <p>Try removing filters, broadening your search, or checking the spelling.</p>
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm mb-6">
                Try adjusting or clearing your filters.
              </p>
            )}
            <a
              href="/app"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-light text-gold rounded-lg text-sm hover:bg-navy transition-colors"
            >
              Clear all filters
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

