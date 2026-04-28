"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

interface PreviewRow {
  rowNumber: number
  name: string
  role?: string
  organisation?: string
  category?: string
  country?: string
  email?: string
  phone?: string
  error?: string
}

interface ImportResult {
  importId: string
  totalRows: number
  successfulRows: number
  updatedRows: number
  failedRows: number
  duplicatesSkipped: number
  suppressedRows: number
  errors: Array<{ row: number; message: string }>
}

/** Proper CSV line parser — handles quoted fields containing commas/newlines. */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

/** Normalise a CSV header the same way the server API does. */
function normaliseHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s\-]+/g, "_").replace(/[^a-z_]/g, "")
}

function parseCSV(text: string): PreviewRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0]).map(normaliseHeader)
  const rows: PreviewRow[] = []

  for (let i = 1; i < Math.min(lines.length, 11); i++) {
    const values = parseCSVLine(lines[i])
    const get = (...keys: string[]) => {
      for (const key of keys) {
        const idx = headers.indexOf(key)
        if (idx >= 0 && values[idx]?.trim()) return values[idx].trim() || undefined
      }
      return undefined
    }
    // Name: prefer full_name, fall back to first+last concat
    const fullName = get("full_name", "name", "contact_name")
    const firstName = get("first_name")
    const lastName = get("last_name")
    const name = fullName ?? (firstName || lastName ? [firstName, lastName].filter(Boolean).join(" ") : undefined)

    // Email: skip Apollo placeholder "unavailable"
    const rawEmail = get("email", "email_address")
    const email = rawEmail && rawEmail.toLowerCase() !== "unavailable" ? rawEmail : undefined

    rows.push({
      rowNumber: i,
      name: name || "(missing name)",
      role: get("title", "role", "job_title", "position", "headline"),
      organisation: get("cleaned_company_name", "organisation", "organization", "club", "company_name", "company"),
      category: get("category", "type"),
      country: get("lead_country", "country"),
      email,
      phone: get("phone", "phone_number", "mobile", "company_phone_number"),
      error: !name ? "Missing required field: name" : undefined,
    })
  }
  return rows
}

const CHUNK_SIZE = 5_000

/**
 * Count actual CSV data rows, ignoring newlines that appear inside quoted fields.
 * After trimEnd(), the number of non-quoted \n chars equals the number of data rows.
 */
function countCSVRows(text: string): number {
  let rows = 0
  let inQuotes = false
  const t = text.trimEnd()
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (ch === '"') {
      if (inQuotes && t[i + 1] === '"') i++ // escaped quote
      else inQuotes = !inQuotes
    } else if (!inQuotes && ch === '\n') {
      rows++
    }
    // \r is skipped silently — the following \n will be counted
  }
  return rows // equals data row count (header newline + D-1 data newlines = D for D rows)
}

/** Split CSV into chunks of ≤ chunkSize records, each with the header row prepended. */
function splitCSVIntoChunks(text: string, chunkSize: number): string[] {
  const t = text.trimEnd()
  const firstNewline = t.indexOf('\n')
  if (firstNewline === -1) return []
  const header = t.slice(0, firstNewline).replace(/\r$/, '')
  const rest = t.slice(firstNewline + 1)

  const records: string[] = []
  let start = 0
  let inQ = false
  for (let i = 0; i < rest.length; i++) {
    const ch = rest[i]
    if (ch === '"') {
      if (inQ && rest[i + 1] === '"') i++
      else inQ = !inQ
    } else if (!inQ && ch === '\n') {
      const rec = rest.slice(start, i).replace(/\r$/, '').trim()
      if (rec) records.push(rec)
      start = i + 1
    }
  }
  const last = rest.slice(start).trim()
  if (last) records.push(last)

  const chunks: string[] = []
  for (let i = 0; i < records.length; i += chunkSize) {
    chunks.push(header + '\n' + records.slice(i, i + chunkSize).join('\n'))
  }
  return chunks
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chunkProgress, setChunkProgress] = useState<{ current: number; total: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.endsWith(".csv")) {
      setError("Please upload a CSV file")
      return
    }
    setFile(f)
    setError(null)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setTotalRows(countCSVRows(text))
      setPreview(parseCSV(text))
    }
    reader.readAsText(f)
  }

  async function handleImport() {
    if (!file) return
    setImporting(true)
    setChunkProgress(null)
    setError(null)

    const text = await file.text()
    const chunks = splitCSVIntoChunks(text, CHUNK_SIZE)
    if (chunks.length === 0) {
      setError("No data rows found in file.")
      setImporting(false)
      return
    }

    let importId: string | null = null
    let accSuccessful = 0, accUpdated = 0, accFailed = 0, accDuplicates = 0, accSuppressed = 0
    const allErrors: Array<{ row: number; message: string }> = []

    for (let i = 0; i < chunks.length; i++) {
      setChunkProgress({ current: i + 1, total: chunks.length })
      const isLast = i === chunks.length - 1

      const chunkFile = new File([chunks[i]], file.name, { type: "text/csv" })
      const fd = new FormData()
      fd.append("file", chunkFile)
      fd.append("total_rows", String(totalRows))
      fd.append("is_last_chunk", String(isLast))
      if (importId) fd.append("import_id", importId)
      if (isLast) {
        fd.append("acc_successful", String(accSuccessful))
        fd.append("acc_updated", String(accUpdated))
        fd.append("acc_failed", String(accFailed))
        fd.append("acc_duplicates", String(accDuplicates))
        fd.append("acc_suppressed", String(accSuppressed))
      }

      try {
        const res = await fetch("/api/admin/import", { method: "POST", body: fd })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? `Chunk ${i + 1} of ${chunks.length} failed`)
          setImporting(false)
          return
        }
        if (!importId) importId = json.importId
        accSuccessful += json.chunkSuccessful ?? 0
        accUpdated += json.chunkUpdated ?? 0
        accFailed += json.chunkFailed ?? 0
        accDuplicates += json.chunkDuplicatesSkipped ?? 0
        accSuppressed += json.chunkSuppressed ?? 0
        allErrors.push(...(json.errors ?? []))
      } catch {
        setError(`Network error on chunk ${i + 1} of ${chunks.length}. Please try again.`)
        setImporting(false)
        return
      }
    }

    setResult({
      importId: importId!,
      totalRows,
      successfulRows: accSuccessful,
      updatedRows: accUpdated,
      failedRows: accFailed,
      duplicatesSkipped: accDuplicates,
      suppressedRows: accSuppressed,
      errors: allErrors.slice(0, 50),
    })
    setChunkProgress(null)
    setImporting(false)
  }

  function reset() {
    setFile(null)
    setPreview([])
    setTotalRows(0)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Import Contacts</h1>
        <p className="text-gray-400 text-sm">
          Upload a CSV file to bulk import contacts. Required column:{" "}
          <code className="text-gold text-xs bg-navy px-1.5 py-0.5 rounded">name</code>.
          Optional:{" "}
          {["role", "organisation", "category", "country", "email", "phone", "level", "region", "city", "website", "linkedin_url"].map((f) => (
            <code key={f} className="text-gray-300 text-xs bg-navy px-1.5 py-0.5 rounded mx-0.5">
              {f}
            </code>
          ))}
        </p>
      </div>

      {result ? (
        /* ── Import complete ── */
        <div className="bg-navy-light rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{result.failedRows === 0 ? "✅" : "⚠️"}</span>
            <div>
              <h2 className="text-white font-bold text-lg">Import Complete</h2>
              <p className="text-gray-400 text-sm">Import ID: {result.importId}</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-4 mb-6">
            <StatBox label="Total rows" value={result.totalRows} />
            <StatBox label="Imported" value={result.successfulRows} green />
            <StatBox label="Updated" value={result.updatedRows ?? 0} />
            <StatBox label="Duplicates skipped" value={result.duplicatesSkipped ?? 0} />
            <StatBox label="Failed" value={result.failedRows} red={result.failedRows > 0} />
          </div>
          {result.errors.length > 0 && (
            <div className="mb-4">
              <h3 className="text-white text-sm font-semibold mb-2">Errors</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((e) => (
                  <p key={e.row} className="text-sm text-red-400">
                    Row {e.row}: {e.message}
                  </p>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="px-4 py-2 bg-navy text-gray-300 rounded-lg text-sm hover:bg-navy-dark transition-colors"
            >
              Import another file
            </button>
            <button
              onClick={() => router.push("/admin/contacts")}
              className="px-4 py-2 bg-gold text-navy rounded-lg text-sm font-semibold hover:bg-gold-dark transition-colors"
            >
              View contacts
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── File picker ── */}
          <div
            className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center mb-6 cursor-pointer hover:border-gold/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files[0]
              if (f) {
                const fakeEvent = { target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>
                handleFileChange(fakeEvent)
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-gray-400 text-sm mt-1">
                  {totalRows.toLocaleString()} data rows detected
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); reset() }}
                  className="mt-3 text-xs text-gray-500 hover:text-gray-300"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div>
                <p className="text-4xl mb-3">📂</p>
                <p className="text-white font-medium">Drop CSV file here or click to browse</p>
                <p className="text-gray-400 text-sm mt-1">Maximum 100,000 rows</p>
              </div>
            )}
          </div>

          {/* ── Preview table ── */}
          {preview.length > 0 && (
            <div className="mb-6">
              <h2 className="text-white font-semibold mb-3">
                Preview{" "}
                <span className="text-gray-400 text-sm font-normal">
                  (first {preview.length} of {totalRows.toLocaleString()} rows)
                </span>
              </h2>
              <div className="overflow-x-auto rounded-xl border border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-navy">
                    <tr>
                      {["#", "Name", "Role", "Organisation", "Category", "Country", "Email"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 text-gray-400 font-medium text-xs uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row) => (
                      <tr key={row.rowNumber} className={`border-t border-gray-700/50 ${row.error ? "bg-red-500/5" : ""}`}>
                        <td className="px-3 py-2 text-gray-500">{row.rowNumber}</td>
                        <td className="px-3 py-2 text-white">{row.name}</td>
                        <td className="px-3 py-2 text-gray-300">{row.role ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-300">{row.organisation ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-300">{row.category ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-300">{row.country ?? "—"}</td>
                        <td className="px-3 py-2 text-gray-400 text-xs">{row.email ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm mb-4 bg-red-500/10 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {file && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-6 py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50"
            >
              {importing
                ? chunkProgress && chunkProgress.total > 1
                  ? `Importing… chunk ${chunkProgress.current} of ${chunkProgress.total}`
                  : `Importing ${totalRows.toLocaleString()} rows…`
                : `Import ${totalRows.toLocaleString()} contacts`}
            </button>
          )}
        </>
      )}
    </div>
  )
}

function StatBox({
  label,
  value,
  green,
  red,
}: {
  label: string
  value: number
  green?: boolean
  red?: boolean
}) {
  return (
    <div className="bg-navy rounded-lg p-4">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p
        className={`text-2xl font-bold ${
          green ? "text-green-400" : red ? "text-red-400" : "text-white"
        }`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  )
}
