import { createAdminClient } from "@/lib/supabase/server"
import type { JSX } from "react"

const PER_PAGE = 50

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; entity?: string }>
}): Promise<JSX.Element> {
  const supabase = await createAdminClient()
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10))
  const actionFilter = params.action ?? ""
  const entityFilter = params.entity ?? ""
  const offset = (page - 1) * PER_PAGE

  let query = supabase
    .from("admin_audit_logs")
    .select("id, action, entity_type, entity_id, admin_user_id, ip_address, created_at, before_data, after_data", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PER_PAGE - 1)

  if (actionFilter) query = query.ilike("action", `%${actionFilter}%`)
  if (entityFilter) query = query.eq("entity_type", entityFilter)

  const { data: logs, count } = await query

  // Fetch admin profile names for the log entries
  const adminIds = [...new Set((logs ?? []).map((l) => l.admin_user_id))]
  const { data: adminProfiles } = adminIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", adminIds)
    : { data: [] }
  const adminMap = new Map((adminProfiles ?? []).map((p) => [p.id, p]))

  const totalPages = Math.ceil((count ?? 0) / PER_PAGE)

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams()
    if (actionFilter) p.set("action", actionFilter)
    if (entityFilter) p.set("entity", entityFilter)
    p.set("page", String(page))
    Object.entries(overrides).forEach(([k, v]) => { if (v) p.set(k, v); else p.delete(k) })
    const s = p.toString()
    return `/admin/audit-logs${s ? `?${s}` : ""}`
  }

  const actionColors: Record<string, string> = {
    create: "bg-green-900/40 text-green-300",
    update: "bg-blue-900/40 text-blue-300",
    delete: "bg-red-900/40 text-red-300",
    suspend: "bg-orange-900/40 text-orange-300",
    unsuspend: "bg-teal-900/40 text-teal-300",
    import: "bg-purple-900/40 text-purple-300",
  }

  function actionColor(action: string) {
    for (const [key, cls] of Object.entries(actionColors)) {
      if (action.toLowerCase().includes(key)) return cls
    }
    return "bg-gray-800 text-gray-400"
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <span className="text-gray-400 text-sm">{(count ?? 0).toLocaleString()} entries</span>
      </div>

      {/* Filters */}
      <form method="GET" action="/admin/audit-logs" className="flex flex-wrap gap-3">
        <input
          name="action"
          defaultValue={actionFilter}
          placeholder="Filter by action…"
          className="input-base text-sm py-2 w-48"
        />
        <select name="entity" defaultValue={entityFilter} className="input-base text-sm py-2 w-36">
          <option value="">All entities</option>
          {["contact", "user", "subscription", "opportunity", "import"].map((e) => (
            <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary text-sm">Filter</button>
        {(actionFilter || entityFilter) && (
          <a href="/admin/audit-logs" className="btn-secondary text-sm">Clear</a>
        )}
      </form>

      {/* Table */}
      <div className="bg-navy-light rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy-dark">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Time</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Admin</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Action</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Entity</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Entity ID</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {!logs?.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No audit logs found</td>
              </tr>
            ) : (
              logs.map((log) => {
                const admin = adminMap.get(log.admin_user_id)
                return (
                  <tr key={log.id} className="border-b border-navy-dark last:border-0 hover:bg-navy/30">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white text-sm">{admin?.full_name ?? "—"}</div>
                      <div className="text-gray-500 text-xs">{admin?.email ?? log.admin_user_id.slice(0, 8) + "…"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{log.entity_type ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                      {log.entity_id ? log.entity_id.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{log.ip_address ?? "—"}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          {page > 1 && (
            <a href={buildUrl({ page: String(page - 1) })} className="btn-secondary">← Prev</a>
          )}
          <span className="text-gray-400">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <a href={buildUrl({ page: String(page + 1) })} className="btn-secondary">Next →</a>
          )}
        </div>
      )}
    </div>
  )
}
