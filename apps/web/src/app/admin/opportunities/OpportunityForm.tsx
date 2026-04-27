"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Tables } from "@/database.types"

type OppRow = Tables<"opportunities">

const OPP_TYPES = ["trial", "job", "event", "coaching", "volunteer", "other"]
const APP_METHODS = ["internal", "external", "contact"]
const STATUSES = ["active", "draft", "closed"]

interface Props {
  /** Existing opportunity for edit mode; undefined for create mode */
  opportunity?: OppRow
}

export default function OpportunityForm({ opportunity }: Props) {
  const router = useRouter()
  const isEdit = !!opportunity

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: opportunity?.title ?? "",
    description: opportunity?.description ?? "",
    type: opportunity?.type ?? "trial",
    organisation: opportunity?.organisation ?? "",
    location: opportunity?.location ?? "",
    deadline: opportunity?.deadline?.slice(0, 10) ?? "",
    event_date: opportunity?.event_date?.slice(0, 10) ?? "",
    skill_level: opportunity?.skill_level ?? "",
    age_group: opportunity?.age_group ?? "",
    gender_eligibility: opportunity?.gender_eligibility ?? "",
    requirements: opportunity?.requirements ?? "",
    application_method: opportunity?.application_method ?? "internal",
    external_url: opportunity?.external_url ?? "",
    contact_email: opportunity?.contact_email ?? "",
    contact_phone: opportunity?.contact_phone ?? "",
    is_premium: opportunity?.is_premium ?? false,
    status: opportunity?.status ?? "draft",
  })

  function set(field: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      ...form,
      organisation: form.organisation || null,
      location: form.location || null,
      deadline: form.deadline || null,
      event_date: form.event_date || null,
      skill_level: form.skill_level || null,
      age_group: form.age_group || null,
      gender_eligibility: form.gender_eligibility || null,
      requirements: form.requirements || null,
      external_url: form.external_url || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
    }

    try {
      const url = isEdit
        ? `/api/admin/opportunities/${opportunity.id}`
        : "/api/admin/opportunities"
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? "Save failed. Please try again.")
        return
      }

      router.push("/admin/opportunities")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!opportunity) return
    if (!confirm(`Delete "${opportunity.title}"? This cannot be undone.`)) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/opportunities/${opportunity.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? "Delete failed.")
        return
      }
      router.push("/admin/opportunities")
      router.refresh()
    } catch {
      setError("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Core fields */}
      <div className="bg-navy-light rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold">Details</h2>

        <Field label="Title *">
          <input
            required
            className="input-field"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. U23 Trial Day"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Type *">
            <select
              required
              className="input-field"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              {OPP_TYPES.map((t) => (
                <option key={t} value={t} className="bg-navy capitalize">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status *">
            <select
              required
              className="input-field"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="bg-navy capitalize">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description *">
          <textarea
            required
            rows={5}
            className="input-field resize-none"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Full opportunity description…"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Organisation">
            <input
              className="input-field"
              value={form.organisation}
              onChange={(e) => set("organisation", e.target.value)}
              placeholder="Club or organisation"
            />
          </Field>
          <Field label="Location">
            <input
              className="input-field"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="City, Country"
            />
          </Field>
        </div>
      </div>

      {/* Dates + criteria */}
      <div className="bg-navy-light rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold">Dates &amp; Criteria</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Deadline">
            <input
              type="date"
              className="input-field"
              value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
          </Field>
          <Field label="Event Date">
            <input
              type="date"
              className="input-field"
              value={form.event_date}
              onChange={(e) => set("event_date", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Skill Level">
            <input
              className="input-field"
              value={form.skill_level}
              onChange={(e) => set("skill_level", e.target.value)}
              placeholder="e.g. Amateur"
            />
          </Field>
          <Field label="Age Group">
            <input
              className="input-field"
              value={form.age_group}
              onChange={(e) => set("age_group", e.target.value)}
              placeholder="e.g. U23"
            />
          </Field>
          <Field label="Eligibility">
            <input
              className="input-field"
              value={form.gender_eligibility}
              onChange={(e) => set("gender_eligibility", e.target.value)}
              placeholder="All / Male / Female"
            />
          </Field>
        </div>

        <Field label="Requirements">
          <textarea
            rows={3}
            className="input-field resize-none"
            value={form.requirements}
            onChange={(e) => set("requirements", e.target.value)}
            placeholder="Any specific requirements…"
          />
        </Field>
      </div>

      {/* Application method */}
      <div className="bg-navy-light rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold">Application Method</h2>

        <Field label="Method *">
          <select
            required
            className="input-field"
            value={form.application_method}
            onChange={(e) => set("application_method", e.target.value)}
          >
            {APP_METHODS.map((m) => (
              <option key={m} value={m} className="bg-navy capitalize">
                {m.charAt(0).toUpperCase() + m.slice(1)}
                {m === "internal" ? " (form on site)" : ""}
                {m === "external" ? " (link away)" : ""}
                {m === "contact" ? " (email / phone)" : ""}
              </option>
            ))}
          </select>
        </Field>

        {form.application_method === "external" && (
          <Field label="External URL *">
            <input
              type="url"
              className="input-field"
              value={form.external_url}
              onChange={(e) => set("external_url", e.target.value)}
              placeholder="https://…"
            />
          </Field>
        )}

        {form.application_method === "contact" && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact Email">
              <input
                type="email"
                className="input-field"
                value={form.contact_email}
                onChange={(e) => set("contact_email", e.target.value)}
                placeholder="contact@example.com"
              />
            </Field>
            <Field label="Contact Phone">
              <input
                className="input-field"
                value={form.contact_phone}
                onChange={(e) => set("contact_phone", e.target.value)}
                placeholder="+44 7700 000000"
              />
            </Field>
          </div>
        )}

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded"
            checked={form.is_premium}
            onChange={(e) => set("is_premium", e.target.checked)}
          />
          <span className="text-sm text-gray-300">
            Premium opportunity{" "}
            <span className="text-gray-500">(visible to subscribers only)</span>
          </span>
        </label>
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Opportunity"}
        </button>

        {isEdit && (
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg text-sm text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
