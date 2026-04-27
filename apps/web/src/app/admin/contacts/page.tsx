import { createAdminClient } from "@/lib/supabase/server"
import Link from "next/link"
import type { JSX } from "react"

const PER_PAGE = 50

export default async function AdminContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; category?: string; status?: string; verified?: string }>
}): Promise<JSX.Element> {
  const supabase = await createAdminClient()
  const params = await searchParams

  const page = Math.max(1, parseInt(params.page ?? "1", 10))
  const search = params.q?.trim() ?? ""
  const category = params.category ?? ""
  const status = params.status ?? ""
  const verified = params.verified ?? ""
  const offset = (page - 1) * PER_PAGE

  let query = supabase
    .from("contacts")
    .select("id, name, role, organisation, email, country, category, level, verified_status, visibility_status, suppression_status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PER_PAGE - 1)

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,organisation.ilike.%${search}%`)
  }
  if (category) query = query.eq("category", category)
  if (status) query = query.eq("visibility_status", status)
  if (verified) query = query.eq("verified_status", verified)

  const { data: contacts, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    if (search) p.set("q", search)
    if (category) p.set("category", category)
    if (status) p.set("status", status)
    if (verified) p.set("verified", verified)
    p.set("page", String(page))
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) p.set(k, v); else p.delete(k)
    })
    const s = p.toString()
    return `/admin/contacts${s ? `?${s}` : ""}`
  }

  const statusColors: Record<string, string> = {
    published: "bg-green-900/40 text-green-300",
    draft: "bg-yellow-900/40 text-yellow-300",
    archived: "bg-gray-800 text-gray-400",
  }
  const verifiedColors: Record<string, string> = {
    verified: "bg-blue-900/40 text-blue-300",
    unverified: "bg-orange-900/40 text-orange-300",
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Contacts</h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">{(count ?? 0).toLocaleString()} total</span>
          <Link href="/admin/contacts/import" className="btn-primary text-sm">Import CSV</Link>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" action="/admin/contacts" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search name, email, org…"
          className="input-base w-64 text-sm py-2"
        />
        <select name="category" defaultValue={category} className="input-base text-sm py-2 w-36">
          <option value="">All categories</option>
          {["player", "coach", "agent", "scout", "club official", "other"].map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <select name="status" defaultValue={status} className="input-base text-sm py-2 w-36">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select name="verified" defaultValue={verified} className="input-base text-sm py-2 w-36">
          <option value="">All verified</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
        <button type="submit" className="btn-secondary text-sm">Filter</button>
        {(search || category || status || verified) && (
          <Link href="/admin/contacts" className="btn-secondary text-sm">Clear</Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-navy-light rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-dark">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Name</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Role</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Organisation</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Country</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Verified</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!contacts?.length ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No contacts found</td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr key={c.id} className="border-b border-navy-dark last:border-0 hover:bg-navy/30">
                  <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-300 max-w-[140px] truncate">{c.role ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-300 max-w-[140px] truncate">{c.organisation ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-300">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-300">{c.country ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${statusColors[c.visibility_status] ?? "text-gray-400"}`}>
                      {c.visibility_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${verifiedColors[c.verified_status] ?? "text-gray-400"}`}>
                      {c.verified_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/contacts/${c.id}`} className="text-gold text-xs hover:underline">Edit</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          {page > 1 && (
            <Link href={buildUrl({ page: String(page - 1) })} className="btn-secondary">← Prev</Link>
          )}
          <span className="text-gray-400">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={buildUrl({ page: String(page + 1) })} className="btn-secondary">Next →</Link>
          )}
        </div>
      )}
    </div>
  )
}
