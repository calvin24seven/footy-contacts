"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

interface Suppression {
  id: string
  email: string
  reason: string
  added_at: string
  added_by: string | null
}

const REASON_LABELS: Record<string, string> = {
  manual: "Manual",
  reoon_invalid: "Reoon invalid",
  hard_bounce: "Hard bounce",
  unsubscribed: "Unsubscribed",
  spam_trap: "Spam trap",
}

const REASON_COLORS: Record<string, string> = {
  manual: "bg-gray-800 text-gray-300",
  reoon_invalid: "bg-red-900/40 text-red-300",
  hard_bounce: "bg-orange-900/40 text-orange-300",
  unsubscribed: "bg-blue-900/40 text-blue-300",
  spam_trap: "bg-purple-900/40 text-purple-300",
}

export default function SuppressionClient({
  initialSuppressions,
  totalCount,
}: {
  initialSuppressions: Suppression[]
  totalCount: number
}) {
  const router = useRouter()
  const [suppressions, setSuppressions] = useState(initialSuppressions)
  const [total, setTotal] = useState(totalCount)
  const [search, setSearch] = useState("")
  const [isPending, startTransition] = useTransition()

  // Add single email
  const [addEmail, setAddEmail] = useState("")
  const [addReason, setAddReason] = useState("manual")
  const [addError, setAddError] = useState("")
  const [addPending, setAddPending] = useState(false)

  // Bulk by domain
  const [domainInput, setDomainInput] = useState("")
  const [domainReason, setDomainReason] = useState("hard_bounce")
  const [domainError, setDomainError] = useState("")
  const [domainPending, setDomainPending] = useState(false)

  // CSV import
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvReason, setCsvReason] = useState("hard_bounce")
  const [csvError, setCsvError] = useState("")
  const [csvPending, setCsvPending] = useState(false)
  const [csvResult, setCsvResult] = useState("")

  const filteredSuppressions = search.trim()
    ? suppressions.filter(
        (s) =>
          s.email.toLowerCase().includes(search.toLowerCase())
      )
    : suppressions

  async function handleAddSingle() {
    const email = addEmail.trim().toLowerCase()
    if (!email || !email.includes("@")) { setAddError("Enter a valid email"); return }
    setAddError("")
    setAddPending(true)
    const res = await fetch("/api/admin/suppressions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails: [email], reason: addReason }),
    })
    setAddPending(false)
    if (!res.ok) {
      const d = await res.json()
      setAddError(d.error ?? "Failed")
      return
    }
    setAddEmail("")
    startTransition(() => router.refresh())
    const newItem: Suppression = { id: email, email, reason: addReason, added_at: new Date().toISOString(), added_by: null }
    setSuppressions((prev) => [newItem, ...prev])
    setTotal((t) => t + 1)
  }

  async function handleDomainSuppress() {
    const domain = domainInput.trim().replace(/^@/, "").toLowerCase()
    if (!domain || !domain.includes(".")) { setDomainError("Enter a valid domain e.g. sport.es"); return }
    setDomainError("")
    setDomainPending(true)
    const res = await fetch("/api/admin/suppressions/domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, reason: domainReason }),
    })
    setDomainPending(false)
    const d = await res.json() as { suppressed?: number; error?: string }
    if (!res.ok) { setDomainError(d.error ?? "Failed"); return }
    setDomainInput("")
    setDomainError(`Suppressed ${d.suppressed ?? 0} emails from @${domain}`)
    startTransition(() => router.refresh())
  }

  async function handleCsvImport() {
    if (!csvFile) { setCsvError("Select a CSV file"); return }
    setCsvError("")
    setCsvPending(true)
    const form = new FormData()
    form.append("file", csvFile)
    form.append("reason", csvReason)
    const res = await fetch("/api/admin/suppressions/import", { method: "POST", body: form })
    setCsvPending(false)
    const d = await res.json() as { imported?: number; skipped?: number; error?: string }
    if (!res.ok) { setCsvError(d.error ?? "Failed"); return }
    setCsvFile(null)
    setCsvResult(`Imported ${d.imported ?? 0} suppressions (${d.skipped ?? 0} already existed)`)
    startTransition(() => router.refresh())
  }

  async function handleRemove(id: string, email: string) {
    if (!confirm(`Remove ${email} from suppression list?`)) return
    const res = await fetch(`/api/admin/suppressions/${encodeURIComponent(email)}`, { method: "DELETE" })
    if (!res.ok) return
    setSuppressions((prev) => prev.filter((s) => s.id !== id))
    setTotal((t) => t - 1)
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Suppression List</h1>
        <span className="text-gray-400 text-sm">{total.toLocaleString()} suppressed</span>
      </div>

      {/* Add single */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-white">Add single email</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <input
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            placeholder="email@example.com"
            className="input-base text-sm py-2 w-64"
            onKeyDown={(e) => { if (e.key === "Enter") handleAddSingle() }}
          />
          <select value={addReason} onChange={(e) => setAddReason(e.target.value)} className="input-base text-sm py-2 w-40">
            {Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={handleAddSingle} disabled={addPending} className="btn-primary text-sm">
            {addPending ? "Adding…" : "Add"}
          </button>
        </div>
        {addError && <p className="text-red-400 text-sm">{addError}</p>}
      </section>

      {/* Bulk by domain */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-white">Suppress by domain</h2>
        <p className="text-gray-400 text-sm">
          Clears the email field on all contacts matching that domain and adds them to suppressions.
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <input
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="sport.es"
            className="input-base text-sm py-2 w-48"
          />
          <select value={domainReason} onChange={(e) => setDomainReason(e.target.value)} className="input-base text-sm py-2 w-40">
            {Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={handleDomainSuppress} disabled={domainPending} className="btn-secondary text-sm">
            {domainPending ? "Suppressing…" : "Suppress domain"}
          </button>
        </div>
        {domainError && <p className={`text-sm ${domainError.startsWith("Suppressed") ? "text-green-400" : "text-red-400"}`}>{domainError}</p>}
      </section>

      {/* CSV import */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-white">Import suppressions from CSV</h2>
        <p className="text-gray-400 text-sm">CSV must have an <code className="text-gold">email</code> column. One email per row.</p>
        <div className="flex flex-wrap gap-3 items-end">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-300"
          />
          <select value={csvReason} onChange={(e) => setCsvReason(e.target.value)} className="input-base text-sm py-2 w-40">
            {Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={handleCsvImport} disabled={csvPending || !csvFile} className="btn-secondary text-sm">
            {csvPending ? "Importing…" : "Import CSV"}
          </button>
        </div>
        {csvError && <p className="text-red-400 text-sm">{csvError}</p>}
        {csvResult && <p className="text-green-400 text-sm">{csvResult}</p>}
      </section>

      {/* Search + list */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-white">Suppressed emails</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or domain…"
            className="input-base text-sm py-1.5 w-64"
          />
          {isPending && <span className="text-gray-500 text-xs">Refreshing…</span>}
        </div>
        <div className="bg-navy-light rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-dark">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Reason</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredSuppressions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    {search ? "No results" : "No suppressions yet"}
                  </td>
                </tr>
              ) : (
                filteredSuppressions.map((s) => (
                  <tr key={s.id} className="border-b border-navy-dark last:border-0">
                    <td className="px-4 py-3 text-gray-300 font-mono text-xs">{s.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${REASON_COLORS[s.reason] ?? "bg-gray-800 text-gray-300"}`}>
                        {REASON_LABELS[s.reason] ?? s.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(s.added_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemove(s.id, s.email)}
                        className="text-red-400 text-xs hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
