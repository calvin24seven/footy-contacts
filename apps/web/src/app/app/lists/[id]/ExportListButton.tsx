"use client"

import { useState } from "react"

export default function ExportListButton({ listId }: { listId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/contacts/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ list_id: listId }),
      })

      if (!res.ok) {
        const data = (await res.json()) as {
          error?: string
          used?: number
          limit?: number
        }
        if (res.status === 402) {
          setError("Upgrade your plan to export contacts as CSV.")
        } else if (res.status === 429) {
          setError(
            `Export limit reached (${data.used ?? 0}/${data.limit ?? 0} contacts this period).`
          )
        } else {
          setError(data.error ?? "Export failed. Please try again.")
        }
        return
      }

      // Trigger file download
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `footy-contacts-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleExport}
        disabled={loading}
        className="px-3 py-1.5 rounded-lg border border-navy-light text-gray-300 text-sm hover:bg-navy-light hover:text-white transition-colors disabled:opacity-50"
      >
        {loading ? "Exporting…" : "Export CSV"}
      </button>
      {error && <p className="text-red-400 text-xs max-w-xs text-right">{error}</p>}
    </div>
  )
}
