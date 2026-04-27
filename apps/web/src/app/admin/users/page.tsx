import { createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import UserActionsMenu from "./UserActionsMenu"

const PER_PAGE = 50

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; filter?: string }>
}) {
  const supabase = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: selfProfile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single()
  if (selfProfile?.role !== "admin") redirect("/app")

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10))
  const search = params.q?.trim() ?? ""
  const filter = params.filter ?? "all"
  const offset = (page - 1) * PER_PAGE

  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, first_name, last_name, email, role, user_type, is_suspended, suspended_reason, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PER_PAGE - 1)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (filter === "admin") query = query.eq("role", "admin")
  else if (filter === "suspended") query = query.eq("is_suspended", true)

  const { data: profiles, count } = await query

  // Fetch active subscriptions for these users
  const userIds = (profiles ?? []).map((p) => p.id)
  const { data: subscriptions } = userIds.length
    ? await supabase
        .from("subscriptions")
        .select("user_id, status, plan_id")
        .in("user_id", userIds)
        .eq("status", "active")
    : { data: [] }

  const subMap = new Map((subscriptions ?? []).map((s) => [s.user_id, s]))
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    if (search) p.set("q", search)
    if (filter !== "all") p.set("filter", filter)
    p.set("page", String(page))
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) p.set(k, v)
      else p.delete(k)
    })
    const s = p.toString()
    return `/admin/users${s ? `?${s}` : ""}`
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <span className="text-gray-400 text-sm">{(count ?? 0).toLocaleString()} total</span>
      </div>

      {/* Search + filter bar */}
      <form method="GET" action="/admin/users" className="flex gap-3">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search by name or email…"
          className="input-base flex-1 text-sm"
        />
        <select
          name="filter"
          defaultValue={filter}
          className="input-base text-sm w-40"
        >
          <option value="all">All users</option>
          <option value="admin">Admins only</option>
          <option value="suspended">Suspended</option>
        </select>
        <button type="submit" className="btn-primary text-sm">Search</button>
        {(search || filter !== "all") && (
          <Link href="/admin/users" className="btn-secondary text-sm">
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="bg-navy-light rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-dark">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">User</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Plan</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Joined</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!profiles?.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                profiles.map((u) => {
                  const sub = subMap.get(u.id)
                  const name =
                    (u.full_name ?? [u.first_name, u.last_name].filter(Boolean).join(" ")) ||
                    "—"
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-navy-dark last:border-0 hover:bg-navy/30"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{name}</div>
                        <div className="text-gray-400 text-xs">{u.email ?? "no email"}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">
                        {u.user_type ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {sub ? (
                          <span className="text-xs bg-green-900/40 text-green-400 px-2 py-1 rounded">
                            {sub.plan_id ?? "active"}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">free</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {u.is_suspended && (
                            <span className="text-xs bg-red-900/40 text-red-400 px-2 py-1 rounded inline-block w-fit">
                              Suspended
                            </span>
                          )}
                          {u.role === "admin" && (
                            <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded inline-block w-fit">
                              Admin
                            </span>
                          )}
                          {!u.is_suspended && u.role !== "admin" && (
                            <span className="text-xs text-gray-500">Active</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <UserActionsMenu
                          userId={u.id}
                          currentRole={u.role ?? "user"}
                          isSuspended={u.is_suspended}
                          isSelf={u.id === user.id}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })} className="btn-secondary text-xs">
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })} className="btn-secondary text-xs">
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
