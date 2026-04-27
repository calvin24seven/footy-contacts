"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Tables } from "@/database.types"

type Contact = Tables<"contacts">

export default function ContactEditForm({ contact }: { contact: Contact }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    name: contact.name ?? "",
    role: contact.role ?? "",
    organisation: contact.organisation ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    city: contact.city ?? "",
    region: contact.region ?? "",
    country: contact.country ?? "",
    level: contact.level ?? "",
    category: contact.category ?? "",
    website: contact.website ?? "",
    linkedin_url: contact.linkedin_url ?? "",
    x_url: contact.x_url ?? "",
    instagram_url: contact.instagram_url ?? "",
    verified_status: contact.verified_status ?? "unverified",
    visibility_status: contact.visibility_status ?? "draft",
    suppression_status: contact.suppression_status ?? "active",
    tags: (contact.tags ?? []).join(", "),
    notes: contact.notes ?? "",
    source: contact.source ?? "",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setSuccess(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const payload = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    }

    const res = await fetch(`/api/admin/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setError(body.error ?? "Failed to save")
    } else {
      setSuccess(true)
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${contact.name}"? This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/admin/contacts/${contact.id}`, { method: "DELETE" })
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setError(body.error ?? "Failed to delete")
      setDeleting(false)
    } else {
      router.push("/admin/contacts")
    }
  }

  const fieldClass = "input-base w-full text-sm"
  const labelClass = "block text-gray-400 text-xs mb-1"

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Status controls */}
      <div className="bg-navy-light rounded-xl p-5">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">Status</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Visibility</label>
            <select name="visibility_status" value={form.visibility_status} onChange={handleChange} className={fieldClass}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Verified status</label>
            <select name="verified_status" value={form.verified_status} onChange={handleChange} className={fieldClass}>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Suppression</label>
            <select name="suppression_status" value={form.suppression_status} onChange={handleChange} className={fieldClass}>
              <option value="active">Active</option>
              <option value="suppressed">Suppressed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Core info */}
      <div className="bg-navy-light rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Core info</h2>
        <div>
          <label className={labelClass}>Name *</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required className={fieldClass} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Role / Title</label>
            <input type="text" name="role" value={form.role} onChange={handleChange} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Organisation</label>
            <input type="text" name="organisation" value={form.organisation} onChange={handleChange} className={fieldClass} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category</label>
            <select name="category" value={form.category} onChange={handleChange} className={fieldClass}>
              <option value="">— Select —</option>
              {["player", "coach", "agent", "scout", "club official", "other"].map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Level</label>
            <select name="level" value={form.level} onChange={handleChange} className={fieldClass}>
              <option value="">— Select —</option>
              {["amateur", "semi-professional", "professional", "international"].map((l) => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contact details */}
      <div className="bg-navy-light rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Contact details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="text" name="phone" value={form.phone} onChange={handleChange} className={fieldClass} />
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>City</label>
            <input type="text" name="city" value={form.city} onChange={handleChange} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Region / State</label>
            <input type="text" name="region" value={form.region} onChange={handleChange} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input type="text" name="country" value={form.country} onChange={handleChange} className={fieldClass} />
          </div>
        </div>
      </div>

      {/* Social / web */}
      <div className="bg-navy-light rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Social & web</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Website</label>
            <input type="url" name="website" value={form.website} onChange={handleChange} className={fieldClass} placeholder="https://…" />
          </div>
          <div>
            <label className={labelClass}>LinkedIn URL</label>
            <input type="url" name="linkedin_url" value={form.linkedin_url} onChange={handleChange} className={fieldClass} placeholder="https://linkedin.com/in/…" />
          </div>
          <div>
            <label className={labelClass}>X / Twitter URL</label>
            <input type="url" name="x_url" value={form.x_url} onChange={handleChange} className={fieldClass} placeholder="https://x.com/…" />
          </div>
          <div>
            <label className={labelClass}>Instagram URL</label>
            <input type="url" name="instagram_url" value={form.instagram_url} onChange={handleChange} className={fieldClass} placeholder="https://instagram.com/…" />
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="bg-navy-light rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Meta</h2>
        <div>
          <label className={labelClass}>Tags (comma-separated)</label>
          <input type="text" name="tags" value={form.tags} onChange={handleChange} className={fieldClass} placeholder="e.g. mls, midfielder, usa" />
        </div>
        <div>
          <label className={labelClass}>Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={4} className={`${fieldClass} resize-none`} />
        </div>
        <div>
          <label className={labelClass}>Source</label>
          <input type="text" name="source" value={form.source} onChange={handleChange} className={fieldClass} placeholder="e.g. csv_import, manual" />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">Saved successfully.</p>}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 text-sm bg-red-900/40 text-red-300 rounded-lg border border-red-800 hover:bg-red-800/60 transition-colors disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete contact"}
        </button>
      </div>
    </form>
  )
}
