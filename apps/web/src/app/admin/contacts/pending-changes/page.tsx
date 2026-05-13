"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

type ChangeType = "role_changed" | "org_changed" | "both_changed" | "casing_only"

interface PendingSignal {
  id: string
  contact_id: string
  role: string | null           // proposed new role
  organisation: string | null   // proposed new org
  new_email: string | null
  new_phone: string | null
  change_type: ChangeType | null
  recorded_at: string
  import_id: string | null
  // joined from contacts
  contact_name: string
  current_role: string | null
  current_organisation: string | null
  current_email: string | null
}

const CHANGE_TYPE_LABELS: Record<string, { label: string; colour: string }> = {
  both_changed: { label: "New club + role",   colour: "bg-purple-900/40 text-purple-300" },
  org_changed:  { label: "Moved clubs",        colour: "bg-blue-900/40 text-blue-300" },
  role_changed: { label: "Promoted / new role",colour: "bg-yellow-900/40 text-yellow-300" },
  casing_only:  { label: "Casing fix",         colour: "bg-gray-700 text-gray-400" },
}

const PAGE_SIZE = 50

export default function PendingChangesPage() {
  const supabase = createClient()

  const [signals, setSignals]         = useState<PendingSignal[]>([])
  const [total, setTotal]             = useState(0)
  const [page, setPage]               = useState(1)
  const [filterType, setFilterType]   = useState<string>("all")
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [loading, setLoading]         = useState(true)
  const [acting, setActing]           = useState(false)
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())

    let query = supabase
      .from("contact_role_history")
      .select(`
        id, contact_id, role, organisation, new_email, new_phone,
        change_type, recorded_at, import_id,
        contacts!contact_role_history_contact_id_fkey (
          name, role, organisation, email
        )
      `, { count: "exact" })
      .eq("source", "csv_import_signal")
      .eq("review_status", "pending")
      .order("recorded_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (filterType !== "all") {
      query = query.eq("change_type", filterType)
    }

    const { data, count, error } = await query
    if (error) { setLoading(false); return }

    setTotal(count ?? 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setSignals((data ?? []).map((row: any) => ({
      id:                   row.id,
      contact_id:           row.contact_id,
      role:                 row.role,
      organisation:         row.organisation,
      new_email:            row.new_email,
      new_phone:            row.new_phone,
      change_type:          row.change_type,
      recorded_at:          row.recorded_at,
      import_id:            row.import_id,
      contact_name:         row.contacts?.name ?? "—",
      current_role:         row.contacts?.role ?? null,
      current_organisation: row.contacts?.organisation ?? null,
      current_email:        row.contacts?.email ?? null,
    })))
    setLoading(false)
  }, [page, filterType, supabase])

  useEffect(() => { load() }, [load])

  // Reset page when filter changes
  useEffect(() => { setPage(1) }, [filterType])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === signals.length) setSelected(new Set())
    else setSelected(new Set(signals.map(s => s.id)))
  }

  const bulkAction = async (action: "approve" | "reject") => {
    if (selected.size === 0) return
    setActing(true)
    const res = await fetch("/api/admin/contacts/pending-changes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids: [...selected] }),
    })
    const body = await res.json() as { applied?: number; processed?: number; failed?: number; error?: string }
    setActing(false)
    if (!res.ok) {
      showToast(body.error ?? "Request failed", false)
    } else {
      const verb = action === "approve" ? "Applied" : "Rejected"
      showToast(`${verb} ${body.applied ?? body.processed} change(s)${body.failed ? ` (${body.failed} failed)` : ""}`, true)
      load()
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const statCounts: Record<string, number> = { all: total }
  // Quick inline counts from current page (full counts need separate query — good enough for UX)
  signals.forEach(s => {
    if (s.change_type) statCounts[s.change_type] = (statCounts[s.change_type] ?? 0) + 1
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Pending Role / Club Changes</h1>
          <p className="text-sm text-gray-400 mt-1">
            Contacts matched by LinkedIn URL in the latest import that have a different role or organisation.
          </p>
        </div>
        <div className="text-sm text-gray-400">
          {total.toLocaleString()} pending
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all",          label: "All" },
          { key: "both_changed", label: "New club + role" },
          { key: "org_changed",  label: "Moved clubs" },
          { key: "role_changed", label: "Promoted / new role" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === tab.key
                ? "bg-gold text-navy font-bold"
                : "bg-navy-light text-gray-300 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-navy-light rounded-xl px-4 py-3">
          <span className="text-sm text-gray-300">{selected.size} selected</span>
          <button
            onClick={() => bulkAction("approve")}
            disabled={acting}
            className="px-4 py-1.5 bg-green-700 hover:bg-green-600 text-white text-sm rounded-lg disabled:opacity-50"
          >
            {acting ? "Applying…" : "Approve & apply"}
          </button>
          <button
            onClick={() => bulkAction("reject")}
            disabled={acting}
            className="px-4 py-1.5 bg-red-900 hover:bg-red-800 text-white text-sm rounded-lg disabled:opacity-50"
          >
            {acting ? "…" : "Reject"}
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-gray-500 hover:text-gray-300">
            Clear selection
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl text-sm font-medium shadow-lg z-50 ${
          toast.ok ? "bg-green-800 text-green-200" : "bg-red-900 text-red-200"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Table */}
      <div className="bg-navy-light rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy text-left">
              <th className="px-4 py-3 w-8">
                <input
                  type="checkbox"
                  checked={selected.size === signals.length && signals.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-gray-400 font-medium">Contact</th>
              <th className="px-4 py-3 text-gray-400 font-medium">Current</th>
              <th className="px-4 py-3 text-gray-400 font-medium w-6 text-center">→</th>
              <th className="px-4 py-3 text-gray-400 font-medium">Proposed</th>
              <th className="px-4 py-3 text-gray-400 font-medium">Type</th>
              <th className="px-4 py-3 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading…</td>
              </tr>
            )}
            {!loading && signals.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No pending changes</td>
              </tr>
            )}
            {!loading && signals.map(signal => {
              const typeInfo = CHANGE_TYPE_LABELS[signal.change_type ?? ""] ?? { label: signal.change_type, colour: "bg-gray-700 text-gray-400" }
              return (
                <tr
                  key={signal.id}
                  className={`border-b border-navy/50 hover:bg-navy/40 ${selected.has(signal.id) ? "bg-navy/60" : ""}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(signal.id)}
                      onChange={() => toggleSelect(signal.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/admin/contacts/${signal.contact_id}`}
                      className="text-white font-medium hover:text-gold"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {signal.contact_name}
                    </a>
                    {signal.current_email && (
                      <div className="text-xs text-gray-500 mt-0.5">{signal.current_email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-200">{signal.current_role ?? <span className="text-gray-600">—</span>}</div>
                    <div className="text-gray-400 text-xs mt-0.5">{signal.current_organisation ?? <span className="text-gray-600">—</span>}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-center">→</td>
                  <td className="px-4 py-3">
                    <div className={`text-gray-100 ${signal.change_type === "role_changed" || signal.change_type === "both_changed" ? "font-medium text-white" : ""}`}>
                      {signal.role ?? <span className="text-gray-600">—</span>}
                    </div>
                    <div className={`text-xs mt-0.5 ${signal.change_type === "org_changed" || signal.change_type === "both_changed" ? "text-blue-300 font-medium" : "text-gray-400"}`}>
                      {signal.organisation ?? <span className="text-gray-600">—</span>}
                    </div>
                    {signal.new_email && signal.new_email !== signal.current_email && (
                      <div className="text-xs text-yellow-400 mt-0.5">{signal.new_email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${typeInfo.colour}`}>
                      {typeInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          setSelected(new Set([signal.id]))
                          await bulkAction("approve")
                        }}
                        disabled={acting}
                        className="px-2 py-1 bg-green-800 hover:bg-green-700 text-green-200 text-xs rounded disabled:opacity-50"
                      >
                        Apply
                      </button>
                      <button
                        onClick={async () => {
                          setSelected(new Set([signal.id]))
                          await bulkAction("reject")
                        }}
                        disabled={acting}
                        className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-300 text-xs rounded disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-navy-light rounded-lg text-gray-300 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-gray-400">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 bg-navy-light rounded-lg text-gray-300 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
