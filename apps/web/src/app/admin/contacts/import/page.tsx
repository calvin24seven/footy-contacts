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
  failedRows: number
  errors: Array<{ row: number; message: string }>
}

function parseCSV(text: string): PreviewRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ""))
  const rows: PreviewRow[] = []

  for (let i = 1; i < Math.min(lines.length, 11); i++) {
    // Preview first 10 rows
    const values = lines[i].split(",")
    const get = (key: string) => {
      const idx = headers.indexOf(key)
      return idx >= 0 ? values[idx]?.trim().replace(/^"|"$/g, "") || undefined : undefined
    }
    const name = get("name") ?? get("full_name") ?? get("contact_name")
    rows.push({
      rowNumber: i,
      name: name || "(missing name)",
      role: get("role") ?? get("job_title") ?? get("position"),
      organisation: get("organisation") ?? get("organization") ?? get("club") ?? get("company"),
      category: get("category") ?? get("type"),
      country: get("country"),
      email: get("email") ?? get("email_address"),
      phone: get("phone") ?? get("phone_number") ?? get("mobile"),
      error: !name ? "Missing required field: name" : undefined,
    })
  }
  return rows
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
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
      const lineCount = text.trim().split(/\r?\n/).length - 1 // exclude header
      setTotalRows(lineCount)
      setPreview(parseCSV(text))
    }
    reader.readAsText(f)
  }

  async function handleImport() {
    if (!file) return
    setImporting(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Import failed")
      } else {
        setResult(json)
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setImporting(false)
    }
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
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatBox label="Total rows" value={result.totalRows} />
            <StatBox label="Imported" value={result.successfulRows} green />
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
                ? `Importing ${totalRows.toLocaleString()} rows…`
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
