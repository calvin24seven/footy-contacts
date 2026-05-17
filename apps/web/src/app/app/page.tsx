import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { unstable_cache } from "next/cache"
import { Suspense } from "react"
import SearchFilters from "./SearchFilters"
import SearchBar from "./SearchBar"
import ContactsList from "./ContactsList"
import WelcomeBanner from "./WelcomeBanner"
import EmptyState from "@/components/search/EmptyState"
import { type ContactListRow } from "./ContactRow"
import { getOrgLogoUrl } from "@/lib/orgLogo"
import { SearchTransitionProvider } from "./SearchTransitionContext"
import PaginationLink from "./PaginationLink"

const PAGE_SIZE = 25

// Returns page numbers + "…" placeholders for the pagination bar.
function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "…")[] = []
  pages.push(1)
  if (current > 4) pages.push("…")
  const start = Math.max(2, current - 2)
  const end = Math.min(total - 1, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 3) pages.push("…")
  pages.push(total)
  return pages
}

const CONTACT_COLUMNS =
  "id, name, role, organisation, category, country, city, verified_status, has_email, has_phone, has_linkedin, role_category, organisations(logo_url, domain)" as const

// Countries list changes rarely — cache for 1 hour across all users.
// This eliminates a 27k-row scan on every page load.
const getPublishedCountries = unstable_cache(
  async () => {
    // Must use cookie-free client — unstable_cache runs outside request context
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("contacts")
      .select("country")
      .eq("visibility_status", "published")
      .eq("suppression_status", "active")
      .not("country", "is", null)
      .order("country")
    return [...new Set((data ?? []).map((r) => r.country).filter(Boolean))] as string[]
  },
  ["published-countries"],
  { revalidate: 3600 }
)

function escapeLike(s: string) {
  return s.replace(/[%_\\]/g, "\\$&")
}

// Applies all user-supplied search filters to a Supabase query builder.
// Using `any` avoids duplicating the complex generic type across count + data queries.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyContactFilters(query: any, params: SearchParams): any {
  if (params.q?.trim()) {
    const q = escapeLike(params.q.trim())
    query = query.or(`name.ilike.%${q}%,role.ilike.%${q}%,organisation.ilike.%${q}%`)
  }
  if (params.role?.trim()) {
    const roles = params.role.split(",").map((s) => s.trim()).filter(Boolean)
    if (roles.length === 1) {
      query = query.ilike("role", `%${escapeLike(roles[0])}%`)
    } else if (roles.length > 1) {
      query = query.or(roles.map((r) => `role.ilike.%${escapeLike(r)}%`).join(","))
    }
  }
  if (params.role_exclude?.trim()) {
    for (const r of params.role_exclude.split(",").map((s) => s.trim()).filter(Boolean)) {
      query = query.not("role", "ilike", `%${escapeLike(r)}%`)
    }
  }
  if (params.org?.trim()) {
    const orgs = params.org.split(",").map((s) => s.trim()).filter(Boolean)
    if (orgs.length === 1) {
      query = query.ilike("organisation", `%${escapeLike(orgs[0])}%`)
    } else if (orgs.length > 1) {
      query = query.or(orgs.map((o) => `organisation.ilike.%${escapeLike(o)}%`).join(","))
    }
  }
  if (params.org_exclude?.trim()) {
    for (const o of params.org_exclude.split(",").map((s) => s.trim()).filter(Boolean)) {
      query = query.not("organisation", "ilike", `%${escapeLike(o)}%`)
    }
  }
  if (params.city?.trim()) {
    query = query.ilike("city", `%${escapeLike(params.city.trim())}%`)
  }
  if (params.country?.trim()) {
    query = query.eq("country", params.country.trim())
  }
  if (params.email_status) {
    if (params.email_status === "has_email") {
      query = query.eq("has_email", true)
    } else if (params.email_status === "no_email") {
      query = query.eq("has_email", false)
    } else {
      query = query.eq("verified_status", params.email_status)
    }
  }
  if (params.category?.trim()) {
    query = query.eq("category", params.category.trim())
  }
  if (params.has_phone === "1") {
    query = query.eq("has_phone", true)
  }
  return query
}

interface SearchParams {
  q?: string
  role?: string         // comma-separated OR values
  role_exclude?: string // comma-separated NOT values
  org?: string          // comma-separated OR values
  org_exclude?: string  // comma-separated NOT values
  city?: string
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

  const supabase = await createClient()

  // Run auth and the (cached) countries list in parallel — saves one RTT on every request.
  const [{ data: { user } }, countries] = await Promise.all([
    supabase.auth.getUser(),
    getPublishedCountries(),
  ])

  // Run the subscription check first so we know whether this is a free user
  // before deciding which page/offset to fetch contacts for.
  const requestedPage = Math.min(500, Math.max(1, parseInt(params.page ?? "1", 10)))

  const { data: activeSub } = user
    ? await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .maybeSingle()
    : { data: null }

  const isFree = !activeSub

  // Free users are capped at page 1; clamp silently if they edit the URL.
  const page = isFree && requestedPage > 1 ? 1 : requestedPage
  const offset = (page - 1) * PAGE_SIZE

  // count:"exact" forces a full sequential scan of ~55k rows which consistently
  // hits the 8-second statement_timeout on the authenticated role.
  // Count: use admin client (service role) so we get an exact count via
  // Index Only Scan without hitting the statement_timeout or the RLS
  // selectivity bug where auth.role()='authenticated' causes the query
  // planner to apply a ~1/3 selectivity factor, returning ~18k instead of 55k.
  const adminSupabase = createAdminClient()
  const countQueryPromise = applyContactFilters(
    adminSupabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("visibility_status", "published")
      .eq("suppression_status", "active"),
    params,
  )

  // Data: admin client — avoids the 8s statement_timeout on the authenticated role
  // which fires at deep offsets (e.g. page 500, offset 12 475 → 16 s query).
  // The WHERE clauses below replicate what RLS enforces for the user role.
  const sort = params.sort ?? "name_asc"
  let dataQuery = applyContactFilters(
    adminSupabase
      .from("contacts")
      .select(CONTACT_COLUMNS)
      .eq("visibility_status", "published")
      .eq("suppression_status", "active"),
    params,
  )
  if (sort === "recently_added") {
    dataQuery = dataQuery.order("created_at", { ascending: false })
  } else if (sort === "recently_verified") {
    dataQuery = dataQuery.order("last_verified_at", { ascending: false, nullsFirst: false })
  } else {
    dataQuery = dataQuery.order("name")
  }

  // Fire count and data in parallel
  const [
    { count },
    { data: contacts, error: contactsError },
  ] = await Promise.all([
    countQueryPromise,
    dataQuery.range(offset, offset + PAGE_SIZE - 1),
  ]) as [{ count: number | null }, { data: ContactListRow[] | null, error: Error | null }]

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0

  // Distinguish an empty result set from a DB error so we don't show
  // "No contacts found" when the query simply failed transiently.
  const hasError = !!contactsError
  const hasResults = !hasError && contacts != null && contacts.length > 0

  // Check which of the visible contacts the current user has already unlocked
  const contactIds = (contacts ?? []).map((c) => c.id)
  const { data: unlocks } = user && contactIds.length > 0
    ? await supabase
        .from("contact_unlocks")
        .select("contact_id")
        .eq("user_id", user.id)
        .in("contact_id", contactIds)
    : { data: [] }
  const unlockedSet = new Set((unlocks ?? []).map((u) => u.contact_id))

  function pageUrl(p: number) {
    const qs = new URLSearchParams()
    if (params.q)            qs.set("q",            params.q)
    if (params.role)         qs.set("role",         params.role)
    if (params.role_exclude) qs.set("role_exclude", params.role_exclude)
    if (params.org)          qs.set("org",          params.org)
    if (params.org_exclude)  qs.set("org_exclude",  params.org_exclude)
    if (params.city)         qs.set("city",         params.city)
    if (params.country)      qs.set("country",      params.country)
    if (params.email_status) qs.set("email_status", params.email_status)
    if (params.category)     qs.set("category",     params.category)
    if (params.has_phone)    qs.set("has_phone",    params.has_phone)
    if (params.sort)         qs.set("sort",         params.sort)
    qs.set("page", String(p))
    return `/app?${qs.toString()}`
  }

  const sortLabel: Record<string, string> = {
    name_asc: "Name A–Z",
    recently_added: "Recently added",
    recently_verified: "Recently verified",
  }

  return (
    <SearchTransitionProvider>
    <div className="max-w-5xl mx-auto">
      {/* ── Welcome banner (free users only, client-side dismissible) ─────── */}
      {isFree && <WelcomeBanner />}

      {/* ── Sticky search zone ─────────────────────────────────────────────── */}
      <div className="sticky top-14 z-20 bg-navy-dark/95 backdrop-blur-sm border-b border-navy-light/40 px-4 sm:px-6 pt-4 pb-3">
        {/* SearchBar uses useSearchParams — needs Suspense for streaming */}
        <Suspense fallback={
          <div className="h-10 bg-navy-light rounded-xl animate-pulse mb-3" />
        }>
          <SearchBar initialQ={params.q} />
        </Suspense>

        {/* SearchFilters uses useSearchParams — needs Suspense for streaming */}
        <Suspense fallback={
          <div className="flex gap-2">
            {[20, 24, 20, 24].map((w, i) => (
              <div key={i} className={`h-7 w-${w} bg-navy-light rounded-lg animate-pulse`} />
            ))}
          </div>
        }>
          <SearchFilters countries={countries} currentSort={sort} />
        </Suspense>
      </div>

      {/* ── Results area ───────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-4 pb-20">
        {/* Result meta bar */}
        {count !== null && count !== undefined && hasResults && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">
              Showing{" "}
              <span className="font-semibold text-white">{(offset + 1).toLocaleString()}–{Math.min(offset + PAGE_SIZE, count).toLocaleString()}</span>
              {" "}of{" "}
              <span className="font-semibold text-white">{count.toLocaleString()}</span>
              {" "}contacts
            </span>
            <span className="hidden sm:inline text-xs text-gray-500">Sorted by {sortLabel[sort] ?? sort}</span>
          </div>
        )}

        {hasError ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-3">Something went wrong loading contacts. Please try again.</p>
            <a href="/app" className="text-gold text-sm hover:underline">Reload</a>
          </div>
        ) : hasResults ? (
          <ContactsList
            contacts={(contacts ?? []).map(c => ({
              ...c,
              has_email:    c.has_email    ?? false,
              has_phone:    c.has_phone    ?? false,
              has_linkedin: c.has_linkedin ?? false,
              org_logo_url: getOrgLogoUrl(c.organisations as { logo_url: string | null; domain: string | null } | null),
              is_unlocked: unlockedSet.has(c.id),
            })) as ContactListRow[]}
            totalCount={count ?? 0}
            isFree={isFree}
            searchFilters={
              Object.fromEntries(
                Object.entries(params).filter(([k, v]) => v && k !== "page" && k !== "sort")
              ) as Record<string, string>
            }
          />
        ) : (
          <EmptyState query={params.q} />
        )}
      </div>

      {/* Sticky bottom bar — free nudge or pagination */}
      {hasResults && (
        <>
          {isFree && count !== null && count > PAGE_SIZE && (
            <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-20 bg-navy-dark/95 backdrop-blur-sm border-t border-white/[0.06]">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
                <p className="text-sm text-gray-300">
                  Showing{" "}
                  <span className="font-semibold text-white">{PAGE_SIZE}</span>{" "}
                  of{" "}
                  <span className="font-semibold text-white">{count.toLocaleString()}</span>{" "}
                  contacts.
                </p>
                <PaginationLink
                  href="/app/billing"
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-gold text-navy-dark rounded-lg font-bold text-xs hover:bg-yellow-400 transition-colors whitespace-nowrap"
                >
                  Upgrade to see all results →
                </PaginationLink>
              </div>
            </div>
          )}
          {totalPages > 1 && !isFree && (
            <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-20 bg-navy-dark/95 backdrop-blur-sm border-t border-white/[0.06]">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between md:justify-center gap-1">

                {/* Previous */}
                {page > 1 ? (
                  <PaginationLink
                    href={pageUrl(page - 1)}
                    className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-navy-light transition-colors"
                  >
                    ← Previous
                  </PaginationLink>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg text-sm text-gray-600 cursor-not-allowed select-none">← Previous</span>
                )}

                {/* Desktop: numbered pages */}
                <div className="hidden md:flex items-center gap-0.5">
                  {getPageNumbers(page, totalPages).map((p, i) =>
                    p === "…" ? (
                      <span key={`el-${i}`} className="w-8 text-center text-gray-600 text-sm select-none">…</span>
                    ) : (
                      <PaginationLink
                        key={p}
                        href={pageUrl(p)}
                        className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${
                          p === page
                            ? "bg-gold text-navy-dark font-bold"
                            : "text-gray-400 hover:bg-navy-light hover:text-white"
                        }`}
                      >
                        {p}
                      </PaginationLink>
                    )
                  )}
                </div>

                {/* Mobile: page label */}
                <span className="md:hidden text-xs text-gray-500 shrink-0">Page {page} of {totalPages}</span>

                {/* Next */}
                {page < totalPages ? (
                  <PaginationLink
                    href={pageUrl(page + 1)}
                    className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-navy-light transition-colors"
                  >
                    Next →
                  </PaginationLink>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg text-sm text-gray-600 cursor-not-allowed select-none">Next →</span>
                )}

              </div>
            </div>
          )}
        </>
      )}
    </div>
    </SearchTransitionProvider>
  )
}
