"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ImportRecord {
  id: string
  filename: string
  status: string
  total_rows: number | null
  successful_rows: number | null
  updated_rows: number | null
  failed_rows: number | null
  suppressed_rows: number | null
  import_mode: string
  created_at: string
  completed_at: string | null
}

const STATUS_COLORS: Record<string, string> = {
  success: "text-green-400",
  updated: "text-blue-400",
  duplicate: "text-gray-400",
  suppressed: "text-yellow-400",
  error: "text-red-400",
  pending: "text-gray-500",
}

export default function ImportDetailClient({
  importRecord,
  statusCounts,
  totalRows,
  linkedCount,
}: {
  importRecord: ImportRecord
  statusCounts: Record<string, number>
  totalRows: number
  linkedCount: number
}) {
  const router = useRouter()
  const [undoing, setUndoing] = useState(false)
  const [undoResult, setUndoResult] = useState("")
  const [undoError, setUndoError] = useState("")

  const canUndo = (statusCounts["success"] ?? 0) > 0

  async function handleUndo() {
    if (!confirm(
      `This will soft-delete all ${statusCounts["success"] ?? 0} new contacts from this import. ` +
      `${linkedCount > 0 ? `${linkedCount} contacts linked to lists/opportunities will be skipped. ` : ""}` +
      `Continue?`
    )) return

    setUndoing(true)
    setUndoError("")
    const res = await fetch(`/api/admin/imports/${importRecord.id}/undo`, { method: "POST" })
    setUndoing(false)
    const d = await res.json() as { deleted?: number; skipped?: number; error?: string }
    if (!res.ok) { setUndoError(d.error ?? "Failed"); return }
    setUndoResult(`Deleted ${d.deleted ?? 0} contacts (${d.skipped ?? 0} skipped — linked to lists/opportunities).`)
    router.refresh()
  }

  const statuses = [
    { key: "success", label: "New contacts" },
    { key: "updated", label: "Updated" },
    { key: "duplicate", label: "Skipped (duplicate)" },
    { key: "suppressed", label: "Suppressed" },
    { key: "error", label: "Errors" },
  ]

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/health" className="text-gray-400 hover:text-white text-sm">← Health</Link>
        <h1 className="text-2xl font-bold text-white truncate">{importRecord.filename}</h1>
      </div>

      {/* Summary */}
      <div className="bg-navy-light rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-400">Status: </span>
            <span className={`${importRecord.status === "completed" ? "text-green-400" : importRecord.status === "failed" ? "text-red-400" : "text-yellow-400"}`}>
              {importRecord.status}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Mode: </span>
            <span className="text-white capitalize">{importRecord.import_mode}</span>
          </div>
          <div>
            <span className="text-gray-400">Imported: </span>
            <span className="text-white">
              {new Date(importRecord.created_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
              })}
            </span>
          </div>
          {importRecord.completed_at && (
            <div>
              <span className="text-gray-400">Completed: </span>
              <span className="text-white">
                {new Date(importRecord.completed_at).toLocaleDateString("en-GB", {
                  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              </span>
            </div>
          )}
        </div>

        <div className="border-t border-navy-dark pt-4 space-y-2">
          {statuses.map(({ key, label }) => {
            const n = statusCounts[key] ?? 0
            if (n === 0) return null
            return (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className={STATUS_COLORS[key] ?? "text-white"}>{n.toLocaleString()}</span>
              </div>
            )
          })}
          <div className="flex justify-between text-sm border-t border-navy-dark pt-2">
            <span className="text-gray-400">Total rows processed</span>
            <span className="text-white">{totalRows.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Undo */}
      {canUndo && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-5 space-y-3">
          <h2 className="text-white font-semibold">Undo import</h2>
          <p className="text-gray-400 text-sm">
            Soft-deletes all <strong className="text-white">{(statusCounts["success"] ?? 0).toLocaleString()}</strong> new contacts
            created by this import, provided they have no linked lists or opportunities.
            {linkedCount > 0 && (
              <span className="text-yellow-400"> {linkedCount} will be skipped (linked).</span>
            )}
          </p>
          <button
            onClick={handleUndo}
            disabled={undoing || !!undoResult}
            className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg"
          >
            {undoing ? "Undoing…" : undoResult ? "Done" : "Undo this import"}
          </button>
          {undoError && <p className="text-red-400 text-sm">{undoError}</p>}
          {undoResult && <p className="text-green-400 text-sm">{undoResult}</p>}
        </div>
      )}
      {!canUndo && (
        <p className="text-gray-500 text-sm">No new contacts from this import — nothing to undo.</p>
      )}
    </div>
  )
}
