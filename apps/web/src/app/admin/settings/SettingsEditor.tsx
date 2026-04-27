"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Setting {
  key: string
  value: unknown
  description?: string | null
  updated_at: string
}

export default function SettingsEditor({ initialSettings }: { initialSettings: Setting[] }) {
  const supabase = createClient()
  const [settings, setSettings] = useState<Setting[]>(initialSettings)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addMode, setAddMode] = useState(false)
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [newDesc, setNewDesc] = useState("")

  function startEdit(s: Setting) {
    setEditing(s.key)
    setDraft(typeof s.value === "object" ? JSON.stringify(s.value, null, 2) : String(s.value ?? ""))
    setError(null)
  }

  async function saveEdit(key: string) {
    setSaving(true)
    setError(null)
    let parsed: unknown = draft
    try {
      parsed = JSON.parse(draft)
    } catch {
      // keep as string
    }
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: parsed }),
    })
    if (!res.ok) {
      setError("Failed to save")
    } else {
      setSettings((prev) =>
        prev.map((s) =>
          s.key === key ? { ...s, value: parsed, updated_at: new Date().toISOString() } : s
        )
      )
      setEditing(null)
    }
    setSaving(false)
  }

  async function saveNew() {
    if (!newKey.trim()) return
    setSaving(true)
    setError(null)
    let parsed: unknown = newValue
    try {
      parsed = JSON.parse(newValue)
    } catch {
      // keep as string
    }
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: newKey.trim(), value: parsed, description: newDesc || undefined }),
    })
    if (!res.ok) {
      setError("Failed to save")
    } else {
      const data = await res.json()
      setSettings((prev) => [...prev, data ?? { key: newKey.trim(), value: parsed, description: newDesc || null, updated_at: new Date().toISOString() }])
      setAddMode(false)
      setNewKey("")
      setNewValue("")
      setNewDesc("")
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-900/30 border border-red-500/40 text-red-300 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      <div className="bg-navy-light rounded-xl divide-y divide-navy-dark overflow-hidden">
        {settings.length === 0 && (
          <div className="px-5 py-8 text-center text-gray-500">No settings found. Add one below.</div>
        )}
        {settings.map((s) => (
          <div key={s.key} className="px-5 py-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-mono text-sm font-semibold">{s.key}</span>
              </div>
              {s.description && <p className="text-gray-500 text-xs mb-2">{s.description}</p>}
              {editing === s.key ? (
                <div className="space-y-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={draft.includes("\n") ? 5 : 2}
                    className="input-base text-sm font-mono w-full"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(s.key)}
                      disabled={saving}
                      className="btn-primary text-xs py-1.5 px-4"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="btn-secondary text-xs py-1.5 px-4"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-300 text-sm font-mono bg-navy rounded px-2 py-1 truncate">
                  {typeof s.value === "object" ? JSON.stringify(s.value) : String(s.value ?? "")}
                </div>
              )}
            </div>
            {editing !== s.key && (
              <button
                onClick={() => startEdit(s)}
                className="text-gray-400 hover:text-white transition-colors mt-1 shrink-0"
                title="Edit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add new setting */}
      {addMode ? (
        <div className="bg-navy-light rounded-xl p-5 space-y-3">
          <h3 className="text-white text-sm font-semibold">New setting</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Key</label>
              <input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. max_export_rows"
                className="input-base text-sm font-mono w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Value (JSON or plain string)</label>
              <input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder='e.g. 500 or "hello" or [1,2,3]'
                className="input-base text-sm font-mono w-full"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description (optional)</label>
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="What does this setting do?"
              className="input-base text-sm w-full"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={saveNew} disabled={saving || !newKey.trim()} className="btn-primary text-sm">
              {saving ? "Saving…" : "Add setting"}
            </button>
            <button onClick={() => setAddMode(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddMode(true)} className="btn-secondary text-sm">
          + Add setting
        </button>
      )}
    </div>
  )
}
